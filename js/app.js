/* ==========================================================================
   Logika undangan. Semua data diambil dari js/config.js — jangan edit data di sini.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.WEDDING;
  if (!C) { console.error('config.js tidak termuat.'); return; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- 1. Isi teks dari config ---------- */
  function fromPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  $$('[data-cfg]').forEach(function (el) {
    var v = fromPath(C, el.getAttribute('data-cfg'));
    if (v != null) el.textContent = v;
  });

  var E = C.event;
  var zone = E.zoneLabel || '';
  var akadLabel = E.akad.start + ' ' + zone;
  var resepsiLabel = E.resepsi.start + ' – ' + E.resepsi.end + ' ' + zone;
  ['akadTime', 'tlAkad'].forEach(function (id) { $('#' + id).textContent = akadLabel; });
  ['resepsiTime', 'tlResepsi'].forEach(function (id) { $('#' + id).textContent = resepsiLabel; });

  /* ---------- 2. Nama tamu dari link (?to=Nama+Tamu) ---------- */
  (function () {
    var q = new URLSearchParams(location.search);
    var to = (q.get('to') || q.get('kepada') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (to) $('#guestName').textContent = to;
  })();

  /* ---------- 3. Google Calendar & Google Maps ---------- */
  var dp = E.dateISO.split('-').map(Number);          // [y, m, d]
  function compact(t) { return E.dateISO.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'; }

  var calUrl = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: E.calendarTitle,
    dates: compact(E.akad.start) + '/' + compact(E.resepsi.end),
    ctz: E.timezone,
    details: E.calendarDescription,
    location: C.venue.address
  }).toString();
  $('#saveDate').href = calUrl;
  $('#calGridLink').href = calUrl;

  var mapsQuery = C.venue.mapsQuery || C.venue.address;
  var mapsUrl = C.venue.mapsUrl ||
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapsQuery);
  $('#venueAddress').href = mapsUrl;
  $('#mapBtn').href = mapsUrl;
  $('#mapFrame').src = 'https://maps.google.com/maps?q=' + encodeURIComponent(mapsQuery) + '&z=15&output=embed';

  /* ---------- 4. Kalender bulan acara ---------- */
  (function () {
    var y = dp[0], m = dp[1] - 1, day = dp[2];
    $('#calMonth').textContent = MONTHS[m] + ' ' + y;
    var first = new Date(y, m, 1).getDay();
    var total = new Date(y, m + 1, 0).getDate();
    var html = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      .map(function (d) { return '<span class="cal__h">' + d + '</span>'; }).join('');
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= total; d++) {
      html += '<span class="cal__d' + (d === day ? ' cal__d--on' : '') + '">' + d + '</span>';
    }
    $('#calGrid').innerHTML = html;
  })();

  /* ---------- 5. Countdown ---------- */
  (function () {
    var target = new Date(E.dateISO + 'T' + E.akad.start + ':00' + E.utcOffset).getTime();
    var d = $('#cdD'), h = $('#cdH'), m = $('#cdM'), s = $('#cdS');
    function tick() {
      var diff = Math.max(0, target - Date.now());
      var sec = Math.floor(diff / 1000);
      d.textContent = pad(Math.floor(sec / 86400));
      h.textContent = pad(Math.floor(sec % 86400 / 3600));
      m.textContent = pad(Math.floor(sec % 3600 / 60));
      s.textContent = pad(sec % 60);
      if (diff === 0) { $('#cd').hidden = true; $('#cdDone').hidden = false; clearInterval(timer); }
    }
    var timer = setInterval(tick, 1000);
    tick();
  })();

  /* ---------- 6. Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* ---------- 7. Musik ---------- */
  var audio = null, wantMusic = false;
  var musicBtn = $('#musicBtn');
  function setMusicUI(on) {
    musicBtn.classList.toggle('is-playing', on);
    musicBtn.setAttribute('aria-pressed', String(on));
  }
  function playMusic() {
    if (!audio) {
      audio = new Audio(C.music.src);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = C.music.volume == null ? 0.6 : C.music.volume;
    }
    var p = audio.play();
    wantMusic = true;
    if (p && p.then) {
      p.then(function () { setMusicUI(true); }).catch(function () { wantMusic = false; setMusicUI(false); });
    } else setMusicUI(true);
  }
  function pauseMusic() { if (audio) audio.pause(); wantMusic = false; setMusicUI(false); }
  musicBtn.addEventListener('click', function () {
    (audio && !audio.paused) ? pauseMusic() : playMusic();
  });
  // Hentikan sementara saat tab/aplikasi di-background, lanjutkan saat kembali.
  var resumeAfterHide = false;
  document.addEventListener('visibilitychange', function () {
    if (!audio) return;
    if (document.hidden) { resumeAfterHide = !audio.paused; audio.pause(); }
    else if (resumeAfterHide) { audio.play().catch(function () {}); resumeAfterHide = false; }
  });

  /* ---------- 8. Buka sampul ---------- */
  var cover = $('#cover');
  $('#openBtn').addEventListener('click', function () {
    document.body.classList.remove('locked');
    cover.classList.add('is-open');
    window.scrollTo(0, 0);
    musicBtn.hidden = false;
    playMusic();                                   // dipicu klik, jadi diizinkan browser
    setTimeout(function () { cover.hidden = true; }, 1100);
  });

  /* ---------- 9. Animasi muncul saat scroll ---------- */
  (function () {
    var els = $$('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- 10. Galeri / lightbox ---------- */
  (function () {
    var lb = $('#lightbox'), img = $('img', lb), last = null;
    function close() { lb.hidden = true; img.removeAttribute('src'); if (last) last.focus(); }
    $$('.gallery button').forEach(function (b) {
      b.addEventListener('click', function () {
        last = b;
        img.src = b.getAttribute('data-full');
        img.alt = $('img', b).alt;
        lb.hidden = false;
        $('.lightbox__close', lb).focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  })();

  /* ---------- 11. Salin nomor rekening ---------- */
  $('#copyBtn').addEventListener('click', function () {
    var num = C.gift.number;
    function done() { toast('Nomor rekening disalin'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = num; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, 99);
      try { document.execCommand('copy') ? done() : toast('Salin manual: ' + num); } catch (e) { toast('Salin manual: ' + num); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(num).then(done, fallback);
    else fallback();
  });

  /* ==========================================================================
     12. RSVP + UCAPAN (Google Sheets lewat Apps Script)
     ========================================================================== */
  var R = C.rsvp;
  var API = (R.scriptUrl || '').trim();
  var demoMode = !API;
  if (demoMode) console.warn('[Undangan] rsvp.scriptUrl belum diisi di js/config.js — mode demo (data tidak tersimpan).');

  var form = $('#rsvpForm');
  var fName = $('#fName'), fMsg = $('#fMsg');
  var gVal = $('#gVal'), guestsField = $('#guestsField');
  var guests = 1;
  var statusEl = $('#formStatus');

  fMsg.maxLength = R.maxMessage;
  $('#msgCount').textContent = '0/' + R.maxMessage;
  fMsg.addEventListener('input', function () { $('#msgCount').textContent = fMsg.value.length + '/' + R.maxMessage; });

  function setGuests(n) {
    guests = Math.min(Math.max(n, 1), R.maxGuests);
    gVal.textContent = guests;
  }
  $('#gMinus').addEventListener('click', function () { setGuests(guests - 1); });
  $('#gPlus').addEventListener('click', function () { setGuests(guests + 1); });

  function attendance() {
    var r = form.querySelector('input[name="attendance"]:checked');
    return r ? r.value : '';
  }
  $$('input[name="attendance"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      guestsField.hidden = attendance() !== 'Hadir';
      $('#errAtt').hidden = true;
    });
  });
  fName.addEventListener('input', function () { $('#errName').hidden = true; });

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (kind ? ' is-' + kind : '');
  }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* ----- Daftar ucapan ----- */
  var listEl = $('#wishesList'), countEl = $('#wishesCount'), noteEl = $('#wishesNote');
  var pending = {};            // ucapan yang baru dikirim, ditampilkan langsung sebelum server menyusul
  var shown = {};              // id yang sudah dirender (agar animasi hanya untuk yang baru)
  var firstRender = true;
  var serverList = [];         // daftar terakhir dari server

  function ago(iso) {
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    var s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 86400 * 7) return Math.floor(s / 86400) + ' hari lalu';
    var d = new Date(t);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function wishNode(w, isNew) {
    var li = document.createElement('li');
    li.className = 'wish' + (isNew ? ' wish--new' : '');
    var av = document.createElement('span');
    av.className = 'wish__av'; av.setAttribute('aria-hidden', 'true');
    av.textContent = (w.name || '?').trim().charAt(0).toUpperCase();
    var top = document.createElement('div'); top.className = 'wish__top';
    var nm = document.createElement('span'); nm.className = 'wish__name'; nm.textContent = w.name;
    var tag = document.createElement('span');
    tag.className = 'wish__tag' + (w.attendance === 'Tidak Hadir' ? ' wish__tag--no' : '');
    tag.textContent = w.attendance === 'Tidak Hadir' ? 'Tidak hadir' : 'Hadir';
    top.appendChild(nm); top.appendChild(tag);
    var msg = document.createElement('p'); msg.className = 'wish__msg'; msg.textContent = w.message;
    var tm = document.createElement('span'); tm.className = 'wish__time'; tm.textContent = ago(w.time);
    li.appendChild(av); li.appendChild(top); li.appendChild(msg); li.appendChild(tm);
    return li;
  }

  function renderWishes(list) {
    // gabungkan: ucapan dari server + yang masih pending (belum muncul di server)
    var ids = {};
    list.forEach(function (w) { ids[w.id] = true; });
    var now = Date.now();
    Object.keys(pending).forEach(function (id) {
      if (ids[id] || now - pending[id].at > 120000) delete pending[id];
    });
    var merged = Object.keys(pending).map(function (id) { return pending[id].w; }).concat(list);

    listEl.setAttribute('aria-busy', 'false');
    var atTop = listEl.scrollTop < 40;
    listEl.innerHTML = '';
    if (!merged.length) {
      var li = document.createElement('li');
      li.className = 'wish wish--empty';
      li.textContent = 'Belum ada ucapan. Jadilah yang pertama menuliskan doa untuk kami.';
      listEl.appendChild(li);
      countEl.textContent = 'Belum ada ucapan.';
      return;
    }
    merged.forEach(function (w) {
      var isNew = !firstRender && !shown[w.id];
      shown[w.id] = true;
      listEl.appendChild(wishNode(w, isNew));
    });
    firstRender = false;
    if (atTop) listEl.scrollTop = 0;
    countEl.textContent = merged.length + ' ucapan dari keluarga dan sahabat.';
  }

  function loadWishes() {
    if (demoMode) { renderWishes(serverList); return Promise.resolve(); }
    var url = API + (API.indexOf('?') > -1 ? '&' : '?') + 'action=wishes&limit=' + R.wishesLimit;
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error(j && j.error || 'bad response');
        noteEl.hidden = true;
        serverList = j.wishes || [];
        renderWishes(serverList);
      })
      .catch(function (err) {
        console.error('[Undangan] gagal memuat ucapan:', err);
        listEl.setAttribute('aria-busy', 'false');
        if (firstRender) {
          listEl.innerHTML = '';
          countEl.textContent = 'Ucapan belum bisa dimuat.';
          noteEl.textContent = 'Periksa koneksi internet Anda, lalu muat ulang halaman.';
          noteEl.hidden = false;
        }
      });
  }

  loadWishes();
  setInterval(function () { if (!document.hidden && !demoMode) loadWishes(); }, Math.max(8, R.pollSeconds || 20) * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) loadWishes(); });

  /* ----- Kirim RSVP ----- */
  var sending = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;

    var name = fName.value.replace(/\s+/g, ' ').trim();
    var att = attendance();
    var bad = false;
    $('#errName').hidden = !!name;  if (!name) bad = true;
    $('#errAtt').hidden = !!att;    if (!att) bad = true;
    if (bad) {
      setStatus('Mohon lengkapi data yang diperlukan.', 'bad');
      (name ? form.querySelector('input[name="attendance"]') : fName).focus();
      return;
    }

    var payload = {
      id: uid(),
      name: name,
      attendance: att,
      guests: att === 'Hadir' ? guests : 0,
      message: fMsg.value.trim(),
      website: form.elements.website.value      // honeypot: harus kosong
    };

    sending = true;
    var btn = $('#submitBtn');
    btn.disabled = true; btn.textContent = 'Mengirim…';
    setStatus('', '');

    function succeed() {
      if (payload.message) {
        pending[payload.id] = {
          at: Date.now(),
          w: { id: payload.id, name: payload.name, attendance: payload.attendance, message: payload.message, time: new Date().toISOString() }
        };
        renderWishes(serverList);
        // ambil daftar terbaru dari server (menggabungkan dengan yang pending)
        if (!demoMode) loadWishes();
      }
      setStatus(att === 'Hadir'
        ? 'Terima kasih, ' + name + '. Konfirmasi kehadiran Anda sudah kami terima.'
        : 'Terima kasih, ' + name + '. Konfirmasi Anda sudah kami terima.', 'ok');
      form.reset();
      setGuests(1);
      guestsField.hidden = false;
      $('#msgCount').textContent = '0/' + R.maxMessage;
      if (payload.message) $('#wishes').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (demoMode) toast('Mode demo: data belum tersimpan ke Google Sheets');
    }
    function fail(msg) { setStatus(msg || 'Gagal mengirim. Periksa koneksi Anda lalu coba lagi.', 'bad'); }
    function finish() { sending = false; btn.disabled = false; btn.textContent = 'Kirim konfirmasi'; }

    if (demoMode) { succeed(); finish(); return; }

    var opts = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) };
    fetch(API, opts)
      .then(function (r) { return r.json(); })
      .then(function (j) { j && j.ok ? succeed() : fail(j && j.error); })
      .catch(function () {
        // Respons tidak terbaca (jaringan / CORS). Kirim ulang dengan ID yang sama:
        // server membuang duplikat, jadi aman.
        return fetch(API, { method: 'POST', mode: 'no-cors', headers: opts.headers, body: opts.body })
          .then(succeed, function () { fail(); });
      })
      .then(finish, finish);
  });
})();
