/* ==========================================================================
   KONFIGURASI UNDANGAN  —  EDIT FILE INI SAJA UNTUK MENGGANTI DATA
   --------------------------------------------------------------------------
   Semua teks, tanggal, alamat, rekening, dan tautan Google ada di sini.
   Jangan hapus tanda kutip, koma, atau kurung kurawal.
   ========================================================================== */
window.WEDDING = {

  /* ---------- MEMPELAI ---------- */
  groom: {
    name: "Muhammad Zufar",
    nick: "Zufar",                       // nama panggilan (dipakai di sampul)
    child: "Putra",                      // "Putra" / "Putra Pertama" / dst.
    father: "Ronny Indranata",
    mother: "Tati Kurniawati"
  },
  bride: {
    name: "Siti Mutiah",
    nick: "Mutiah",
    child: "Putri",
    father: "Edih Samaniah Putra",
    mother: "Siti Jamilah"
  },

  /* ---------- ACARA ---------- */
  event: {
    dateISO: "2026-12-25",               // format YYYY-MM-DD
    dateLabel: "Jum'at, 25 Desember 2026",
    utcOffset: "+07:00",                 // WIB = +07:00 | WITA = +08:00 | WIT = +09:00
    timezone: "Asia/Jakarta",            // dipakai Google Calendar
    zoneLabel: "WIB",

    akad:    { start: "08:00", end: "10:00" },   // jam selesai dipakai untuk Google Calendar
    resepsi: { start: "13:00", end: "19:00" },

    // Judul & deskripsi yang muncul otomatis di Google Calendar tamu
    calendarTitle: "Pernikahan Muhammad Zufar & Siti Mutiah",
    calendarDescription:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i " +
      "untuk hadir di pernikahan Muhammad Zufar & Siti Mutiah.\n\n" +
      "Akad: 08:00 WIB\nResepsi: 13:00 - 19:00 WIB"
  },

  /* ---------- LOKASI ---------- */
  venue: {
    name: "Villa Mulya Mandiri",
    address:
      "Villa Mulya Mandiri, Jln. Gadog Kp. Cidadap RT/RW 01/03, " +
      "Kel. Pasir Angin, Kec. Megamendung, Kab. Bogor",

    // Kata kunci pencarian Google Maps (dipakai jika mapsUrl kosong).
    mapsQuery: "Villa Mulya Mandiri, Gadog, Megamendung, Bogor",

    // OPSIONAL tapi disarankan: buka Google Maps > cari lokasi > Bagikan > Salin link,
    // lalu tempel di sini agar pin 100% tepat. Kosongkan untuk memakai mapsQuery.
    mapsUrl: ""
  },

  /* ---------- HADIAH ---------- */
  gift: {
    title: "Wanna give us some gifts?",
    intro:
      "Doa restu Anda adalah hadiah terindah bagi kami. Namun jika berkenan " +
      "memberi tanda kasih, dapat disalurkan melalui:",
    // Tambah / hapus / urutkan rekening di sini. Satu {...} = satu kartu.
    accounts: [
      { bank: "BSI",  number: "7173261599",     holder: "Muhammad Zufar" },
      { bank: "DANA", number: "0838-7878-0146", holder: "Siti Mutiah" }
    ]
  },

  /* ---------- RSVP & UCAPAN (Google Sheets) ---------- */
  rsvp: {
    // Tempel URL "Web app" dari Google Apps Script di sini (lihat README.md, langkah 2).
    // Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
    scriptUrl: "",

    maxGuests: 5,          // jumlah tamu maksimal per pengisian
    maxMessage: 500,       // panjang ucapan maksimal (karakter)
    pollSeconds: 20,       // seberapa sering ucapan baru dicek (detik)
    wishesLimit: 100       // jumlah ucapan terbaru yang ditampilkan
  },

  /* ---------- MUSIK ---------- */
  music: {
    src: "assets/audio/backsound.mp3",
    title: "Stuck - Lany (feat. Ziva Magnolya)",   // keterangan lagu yang tampil saat musik diputar
    volume: 0.6
  }
};
