/**
 * ============================================================================
 *  BACKEND RSVP & UCAPAN — Undangan Pernikahan Zufar & Mutiah
 * ============================================================================
 *  Pasang script ini dari DALAM Google Sheet Anda:
 *     Extensions (Ekstensi) > Apps Script  →  tempel seluruh isi file ini.
 *
 *  Fungsi:
 *   - doPost : menerima RSVP dari website, menambah SATU BARIS per pengiriman.
 *   - doGet  : mengirim daftar ucapan ke website (?action=wishes).
 *   - setup  : membuat sheet "RSVP" (header, format, dropdown) dan "Ringkasan".
 *
 *  Panduan lengkap ada di README.md.
 * ============================================================================
 */

var CFG = {
  SHEET_NAME: 'RSVP',
  SUMMARY_SHEET: 'Ringkasan',
  MAX_GUESTS: 10,          // batas atas jumlah tamu (website juga membatasi di config.js)
  MAX_NAME: 60,
  MAX_MESSAGE: 500,
  WISHES_MAX: 200,         // batas atas jumlah ucapan yang bisa diminta website
  CACHE_SECONDS: 10        // cache singkat agar tidak membebani Sheet saat banyak tamu membuka
};

var HEADERS = ['Timestamp', 'ID', 'Nama Lengkap', 'Kehadiran', 'Jumlah Tamu', 'Ucapan & Doa', 'Tampilkan'];
// Kolom G "Tampilkan": isi "Tidak" untuk menyembunyikan ucapan dari website tanpa menghapus datanya.


/* ---------------------------------------------------------------------------
 *  SETUP — jalankan SEKALI (pilih fungsi "setup" lalu klik Run / Jalankan)
 * ------------------------------------------------------------------------- */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Script harus dibuat dari dalam Google Sheet (Extensions > Apps Script).');

  var sh = ss.getSheetByName(CFG.SHEET_NAME) || ss.insertSheet(CFG.SHEET_NAME);
  // PENGAMAN: jangan pernah menghapus data tamu yang sudah masuk.
  if (sh.getLastRow() > 1) {
    throw new Error('Sheet "' + CFG.SHEET_NAME + '" sudah berisi data. Setup dibatalkan agar data tidak terhapus.');
  }
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#531521')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 32);

  // Format: kolom teks dipaksa "plain text" agar isi seperti =SUM() tidak dieksekusi sebagai rumus.
  sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sh.getRange('B:D').setNumberFormat('@');
  sh.getRange('F:G').setNumberFormat('@');
  sh.getRange('E:E').setNumberFormat('0');

  // Dropdown
  sh.getRange('D2:D').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Hadir', 'Tidak Hadir'], true).build());
  sh.getRange('G2:G').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Ya', 'Tidak'], true).build());

  // Lebar kolom & wrap
  [170, 120, 200, 110, 100, 420, 90].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange('F:F').setWrap(true);
  sh.getRange('A:G').setVerticalAlignment('top');
  sh.getRange('B:B').setFontColor('#9a9a9a');

  // Sheet ringkasan (rumus otomatis)
  var sm = ss.getSheetByName(CFG.SUMMARY_SHEET) || ss.insertSheet(CFG.SUMMARY_SHEET);
  sm.clear();
  var n = CFG.SHEET_NAME;
  sm.getRange('A1:B6').setValues([
    ['Ringkasan RSVP', ''],
    ['Total konfirmasi masuk',          '=COUNTA(' + n + '!C2:C)'],
    ['Konfirmasi hadir',                '=COUNTIF(' + n + '!D2:D,"Hadir")'],
    ['Konfirmasi tidak hadir',          '=COUNTIF(' + n + '!D2:D,"Tidak Hadir")'],
    ['Total tamu yang akan hadir',      '=SUMIF(' + n + '!D2:D,"Hadir",' + n + '!E2:E)'],
    ['Ucapan yang tampil di website',   '=COUNTIFS(' + n + '!F2:F,"<>",' + n + '!G2:G,"<>Tidak")']
  ]);
  sm.getRange('A1').setFontWeight('bold').setFontSize(14);
  sm.getRange('B2:B6').setFontWeight('bold').setHorizontalAlignment('left');
  sm.setColumnWidth(1, 260); sm.setColumnWidth(2, 120);

  ss.setActiveSheet(sh);
  SpreadsheetApp.flush();
  Logger.log('Setup selesai. Lanjut: Deploy > New deployment > Web app.');
}


/* ---------------------------------------------------------------------------
 *  POST — menerima RSVP
 * ------------------------------------------------------------------------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);                       // cegah baris saling menimpa saat banyak tamu kirim bersamaan

    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.website) return json_({ ok: true });   // honeypot terisi = bot; pura-pura sukses

    var name = clean_(body.name, CFG.MAX_NAME);
    var att = body.attendance === 'Hadir' ? 'Hadir' : (body.attendance === 'Tidak Hadir' ? 'Tidak Hadir' : '');
    if (!name || !att) return json_({ ok: false, error: 'Nama dan kehadiran wajib diisi.' });

    var guests = 0;
    if (att === 'Hadir') {
      guests = parseInt(body.guests, 10);
      if (isNaN(guests) || guests < 1) guests = 1;
      guests = Math.min(guests, CFG.MAX_GUESTS);
    }
    var message = clean_(body.message, CFG.MAX_MESSAGE);
    var id = String(body.id || '').replace(/[^A-Za-z0-9\-]/g, '').slice(0, 64) || Utilities.getUuid();

    var sh = getSheet_();

    // Buang duplikat (website mengirim ulang dengan ID sama bila koneksi sempat putus).
    var last = sh.getLastRow();
    if (last > 1) {
      var found = sh.getRange(2, 2, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
      if (found) return json_({ ok: true, duplicate: true, id: id });
    }

    sh.appendRow([new Date(), id, name, att, guests, message, 'Ya']);   // 1 baris per pengiriman
    CacheService.getScriptCache().removeAll(['wishes:default']);

    return json_({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}


/* ---------------------------------------------------------------------------
 *  GET — daftar ucapan untuk website
 * ------------------------------------------------------------------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'wishes') {
      var limit = Math.min(Math.max(parseInt(p.limit, 10) || 100, 1), CFG.WISHES_MAX);
      var cache = CacheService.getScriptCache();
      var key = 'wishes:' + (limit === 100 ? 'default' : limit);
      var hit = cache.get(key);
      if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

      var sh = getSheet_();
      var last = sh.getLastRow();
      var out = [];
      if (last > 1) {
        var rows = sh.getRange(2, 1, last - 1, 7).getValues();
        for (var i = rows.length - 1; i >= 0 && out.length < limit; i--) {   // terbaru di atas
          var r = rows[i];
          var msg = String(r[5] || '').trim();
          if (!msg || String(r[6]).trim().toLowerCase() === 'tidak') continue;
          out.push({
            id: String(r[1]),
            name: String(r[2]),
            attendance: String(r[3]),
            message: msg,
            time: r[0] instanceof Date ? r[0].toISOString() : ''
          });
        }
      }
      var payload = JSON.stringify({ ok: true, wishes: out });
      cache.put(key, payload, CFG.CACHE_SECONDS);
      return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
    }
    return json_({ ok: true, service: 'wedding-rsvp' });     // tes cepat: buka URL /exec di browser
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Server error' });
  }
}


/* ---------------------------------------------------------------------------
 *  Helper
 * ------------------------------------------------------------------------- */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Script tidak terikat ke Google Sheet.');
  var sh = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sh) { setup(); sh = ss.getSheetByName(CFG.SHEET_NAME); }   // otomatis siapkan jika belum
  return sh;
}

function clean_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')   // buang karakter kontrol
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
