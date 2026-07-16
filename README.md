# ⚡ NxTGen Trading Journal Pro

A premium ICT trading journal web app with glassmorphism design, full dark/light mode, and persistent localStorage data.

---

## 📁 Project Structure

```
NxTGen_Trading_Journal/
├── index.html      ← Main HTML structure & all page layouts
├── styles.css      ← Complete design system (2,150 lines)
│                     Design tokens, dark/light themes, components
├── app.js          ← All application logic (1,658 lines)
│                     Data, state, navigation, rendering, calendar
└── README.md       ← This file
```

---

## 🚀 How to Run

### Option 1 — Open directly in browser
Just double-click `index.html`. Works out of the box — no build step needed.

### Option 2 — Local dev server (recommended)
Avoids any browser file:// restrictions for future assets:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code — install "Live Server" extension, right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

### Option 3 — Deploy as a website
Upload all three files to any static host:
- **Netlify** — drag the folder to netlify.com/drop
- **Vercel** — `vercel deploy`
- **GitHub Pages** — push to a repo, enable Pages in settings
- **Cloudflare Pages** — connect repo or drag & drop

---

## 💾 Data Persistence

All trade data is saved automatically to `localStorage` under the key `nxtgen_v3`.  
Your data survives page refreshes and browser restarts — as long as you use the same browser.

To export/backup your data, open DevTools → Application → Local Storage → copy the `nxtgen_v3` value.

---

## 🎨 Design System

The CSS uses a CSS custom property (variable) token system:

| Token group     | Example                      |
|-----------------|------------------------------|
| Background      | `--bg`, `--bg2`, `--glass-1` |
| Colours         | `--green`, `--red`, `--blue` |
| Typography      | `--font-head`, `--font-mono` |
| Shadows / Glows | `--shadow-md`, `--glow-green`|
| Radii           | `--r-sm`, `--r-xl`, `--r-full`|
| Transitions     | `--t-fast`, `--t-spring`     |

Switch theme by toggling `data-theme=""` (dark) / `data-theme="light"` on `<html>`.

---

## 🗂 Pages

| Page            | ID                  | Description                        |
|-----------------|---------------------|------------------------------------|
| Dashboard       | `page-dashboard`    | KPIs, pair/killzone/strategy stats |
| Trade Log       | `page-tradelog`     | Filterable trade table             |
| Trade Detail    | `#detail-panel`     | Slide-in panel with charts/notes   |
| Watchlist       | `page-watchlist`    | Weekly top-down analysis           |
| Trade Entry     | `page-entry`        | Full entry form + checklist        |
| Accounts        | `page-accounts`     | Funded & paper account tracker     |
| Calendar        | `page-calendar`     | Monthly P&L calendar view          |
| Playbook        | `page-playbook`     | Trading models & rules             |
| Goals           | `page-goals`        | Quarterly goals & affirmations     |
| Monthly Review  | `page-monthly`      | Monthly reflection journal         |
| Quarter View    | `page-quarter`      | Dynamic quarterly breakdown        |
| Trash           | `page-trash`        | Soft-deleted trades, auto-expiry   |

---

## 🔑 Key localStorage Keys

| Key                | Contents                          |
|--------------------|-----------------------------------|
| `nxtgen_v3`        | `{ trades, state, deleted }`      |
| `nxtgen_theme`     | `"dark"` or `"light"`             |
| `nxtgen_trash_cfg` | `{ autoDays: 30 }`                |
