# Wedding Invitation — Muhammad Zufar & Siti Mutiah

Static, mobile-first digital invitation. No build step, no dependencies.
Hosted on **GitHub Pages**; RSVP and wishes stored in **Google Sheets** via **Google Apps Script**.

```
/
├── index.html              Page structure
├── css/style.css           Design (colors & fonts are variables at the top)
├── js/config.js            ★ THE ONLY FILE YOU EDIT to change names, date, venue, bank, etc.
├── js/app.js               Behaviour (countdown, calendar, maps, music, RSVP, wishes)
├── assets/img/*.webp       Optimized photos, couple illustrations & flower elements (≈1.6 MB)
├── assets/audio/backsound.mp3
├── apps-script/Code.gs     Google Apps Script backend (paste into Google Sheets)
└── .nojekyll
```

---

## 1. Deploy to GitHub Pages (≈3 minutes)

1. Create a new repository on GitHub, e.g. `undangan-zufar-mutiah` (Public — required for free GitHub Pages).
2. Upload **everything in this folder** (keep the structure; `index.html` must be at the repo root).
   - Web: *Add file → Upload files*, drag the contents in, *Commit changes*.
   - Or via git:
     ```bash
     git init && git add . && git commit -m "Wedding invitation"
     git branch -M main
     git remote add origin https://github.com/<USERNAME>/<REPO>.git
     git push -u origin main
     ```
3. Repo → **Settings → Pages → Build and deployment** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → **Save**.
4. After ~1 minute your site is live at `https://<USERNAME>.github.io/<REPO>/`.
5. Open `index.html`, find the two lines `https://USERNAME.github.io/REPO-NAME/...` (`og:image` and `og:url`) and replace them with your real URL. This makes the preview image and title appear when the link is shared on WhatsApp/Instagram.

---

## 2. Connect Google Sheets (RSVP database) (≈5 minutes)

You do this with your own Google account — nobody else needs access to your Sheet.

1. Go to <https://sheets.new> and name the spreadsheet e.g. **Undangan Zufar & Mutiah – RSVP**.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the sample code, paste the entire content of `apps-script/Code.gs`, click **Save** (💾).
4. In the function dropdown pick **`setup`**, click **Run**. Google asks for permission:
   *Review permissions → choose your account → Advanced → Go to (project) (unsafe) → Allow*.
   (The "unsafe" warning appears for every personal script that you wrote yourself.)
   This creates the `RSVP` sheet (headers, dropdowns, formatting) and a `Ringkasan` (summary) sheet.
5. **Deploy → New deployment** → gear icon → type **Web app**:
   - Description: `RSVP v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then copy the **Web app URL** (ends with `/exec`).
6. Open `js/config.js` and paste the URL:
   ```js
   rsvp: { scriptUrl: "https://script.google.com/macros/s/AKfycb.../exec", ... }
   ```
   Commit/upload the change; GitHub Pages updates within a minute.
7. **Test:** open the invitation, submit an RSVP with a message. A new row appears in the `RSVP` sheet and the message appears under *Wedding wishes*.
   You can also open the `/exec` URL in a browser: it should show `{"ok":true,"service":"wedding-rsvp"}`.

### Google Sheet structure — sheet `RSVP`

| A Timestamp | B ID | C Nama Lengkap | D Kehadiran | E Jumlah Tamu | F Ucapan & Doa | G Tampilkan |
|---|---|---|---|---|---|---|
| 16/11/2026 08:12:45 | 3f0c… | Ade Fitriyani | Hadir | 2 | Wishing you both a lifetime of happiness! | Ya |

- One new row per submission. Export any time: **File → Download → CSV / Excel**.
- **Kehadiran**: `Hadir` / `Tidak Hadir`. **Jumlah Tamu** is `0` when not attending.
- **Tampilkan**: set a cell to `Tidak` to hide that message from the website (data stays in the sheet). Takes effect on the site within about 30 seconds.
- Sheet `Ringkasan` shows totals automatically (responses, attending, not attending, total guests).
- ⚠️ Do **not** delete row 1 or rename the `RSVP` sheet. Never run `setup` again once data exists (it refuses to run to protect your data).

---

## 3. Personalised guest links

Add `?to=Guest+Name` to the URL; the name appears on the cover:

```
https://<USERNAME>.github.io/<REPO>/?to=Bapak+Ahmad+%26+Keluarga
```

Tip: in Google Sheets, build links with `="https://…/?to="&ENCODEURL(A2)`.

---

## 4. Maintenance

### Change names, date, venue, bank account, texts
Edit **`js/config.js`** only. Every value has a comment. Commit → live in ~1 minute.
- Changing the date also updates the countdown, the calendar grid, and the Google Calendar event automatically.
- Venue pin: open Google Maps, find the exact place → *Share → Copy link* → paste into `venue.mapsUrl` for a perfectly accurate pin.
- Names inside the page title / `og:` tags in `index.html` are static (needed by WhatsApp previews) — update them by hand if names change.

### Replace the couple illustrations / flowers
- `assets/img/couple-both.webp` → cover (both of you), `couple-groom.webp` / `couple-bride.webp` → individual ovals (use 3:4 portrait images).
- `assets/img/fl-*.webp` are the transparent flower cut-outs. Their position and size are inline `style="..."` on the `<img class="fl">` tags in `index.html` (`width`, `top/bottom`, `left/right`, `--r` = rotation, `--fx:-1` = mirror).

### Replace photos or music
Keep the same file names inside `assets/`, or update the paths in `index.html` / `config.js`.
Photos: WebP, max ~1000 px wide, under ~250 KB each. Music: MP3, under ~1 MB.

### Change the Google Apps Script
After editing `Code.gs` you **must** publish a new version, otherwise the live URL keeps running the old code:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same.

### Change colors / fonts
`css/style.css`, variables at the top (`--wine`, `--moss`, `--pearl`, …).

### Troubleshooting
| Symptom | Fix |
|---|---|
| Form says "mode demo" | `rsvp.scriptUrl` in `config.js` is empty |
| "Gagal mengirim" | Web app access is not **Anyone**, or you edited the script without deploying a **New version** |
| No new rows | Open the `/exec` URL in a browser; if you are asked to log in, redeploy with access **Anyone** |
| Wishes not loading | Same as above; also check the browser console (F12) |
| Music doesn't autoplay | Browsers only allow audio after a tap — it starts when guests press **Buka Undangan**; the round button toggles it |
| Changes not visible | Hard-refresh (Ctrl/Cmd+Shift+R); GitHub Pages can take ~1 min |

### Limits & privacy
- Apps Script free quota is far above what a wedding needs (thousands of submissions/day).
- The page is `noindex` so search engines won't list it. The Web app URL is visible in the page source (this is normal and unavoidable for static sites); the script only accepts RSVP rows and returns *only* name/message/attendance of visible wishes — never guest counts or other private columns.
- Spam protection: hidden honeypot field, input length limits, duplicate-ID rejection, server-side validation, formula-safe plain-text columns.

---

## 5. Quick local preview

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```
