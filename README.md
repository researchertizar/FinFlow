# FinFlow — Personal Finance OS

> **Built by Researcher Tizar** · Local-first · Offline-ready · No sign-up · No cloud · No tracking

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)
[![Offline First](https://img.shields.io/badge/Offline-First-green)]()
[![No Backend](https://img.shields.io/badge/Backend-None-orange)]()

A fully offline, local-first personal finance app. All data lives in your browser's `localStorage` — it never leaves your device.

---

## Project Structure

```
finflow/
├── finflow.html     ← Main app (HTML structure)
├── styles.css       ← All styles (design system, themes, animations)
├── app.js           ← All logic (data, render, save, PWA)
├── sw.js            ← Service worker (offline caching, HTTP only)
├── manifest.json    ← PWA manifest (install to home screen)
├── index.html       ← Root redirect to finflow.html
├── 404.html         ← SPA redirect for deep links
├── .nojekyll        ← GitHub Pages: disables Jekyll processing
└── README.md        ← This file
```

---

## Quick Start

### Option 1 — Open directly (simplest)

```bash
# Just double-click finflow.html, or:
open finflow.html
```

Works in Chrome, Edge, Firefox, Safari.  
PWA install and service worker require HTTP (see Option 2).

### Option 2 — Local server (full PWA features)

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# Then open:
http://localhost:8080/finflow.html
```

---

## Deploy to GitHub Pages (3 steps)

**Step 1** — Create a new repository on [github.com/new](https://github.com/new)

**Step 2** — Upload all files to the repository root:
```
finflow.html  styles.css  app.js  sw.js  manifest.json
index.html    404.html    .nojekyll
```

**Step 3** — Enable GitHub Pages:  
`Repository Settings → Pages → Source: main branch → Save`

Your app will be live at:
```
https://YOUR-USERNAME.github.io/REPO-NAME/finflow.html
```

> **Tip:** Users can install it as a PWA app directly from the browser once it's live on HTTPS.

---

## Features

| Feature | Details |
|---------|---------|
| **Accounts** | Checking, savings, credit, cash, investment, loan |
| **Transactions** | Income, expense, transfer — with tags and notes |
| **Budgets** | Monthly limits per category with rollover |
| **Goals** | Visual savings targets with progress tracking |
| **Recurring** | Scheduled payments with due-date alerts |
| **Reports** | 5 chart views: overview, spending, income, cash flow, net worth |
| **Insights** | AI-style analysis of spending patterns and savings rate |
| **Categories** | Customizable with icons and colors |
| **Themes** | Dark and light mode |
| **Export** | JSON backup + CSV export |
| **Import** | Restore from JSON backup |
| **PWA** | Installable, offline, home screen shortcut |

---

## URL Deep Links

```
finflow.html#dashboard
finflow.html#transactions
finflow.html#accounts
finflow.html#accounts/ACCOUNT_ID
finflow.html#budget
finflow.html#goals
finflow.html#recurring
finflow.html#reports
finflow.html#reports?tab=spending
finflow.html#reports?tab=income
finflow.html#reports?tab=cashflow
finflow.html#reports?tab=net
finflow.html#insights
finflow.html#settings
finflow.html#dashboard?m=3&y=2025
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` – `9` | Switch views |
| `⌘N` / `Ctrl+N` | New transaction |
| `⌘K` / `Ctrl+K` | Focus search |
| `←` / `→` | Previous / next month |
| `B` | Toggle sidebar |
| `T` | Toggle theme |
| `Esc` | Close modal / go back |

---

## Tech Stack

- **Vanilla HTML + CSS + JavaScript** — zero build tools, zero dependencies
- **Chart.js 4** — data visualisation
- **Font Awesome 6** — icons
- **Inter** — typography
- **localStorage** — data persistence (private, on-device)
- **Service Worker** — offline caching (HTTP/HTTPS only)

---

## Privacy

- No user accounts, no sign-up
- No servers, no API calls, no databases
- No analytics, no telemetry, no cookies
- All data in browser localStorage only
- External CDN requests: Chart.js, Font Awesome, Google Fonts (fonts only)

---

## License

MIT License — free to use, modify, and distribute.

---

## Credits

**FinFlow** was designed and built by **Researcher Tizar**.  
*Designed for simplicity. Built for everyone.*
