# FinFlow — Personal Finance OS

> **Built by [Researcher Tizar](https://github.com/researchertizar)** · Local-first · Offline-ready · No sign-up · No cloud · No tracking

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://researchertizar.github.io/FinFlow/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple)](https://web.dev/progressive-web-apps/)
[![Offline First](https://img.shields.io/badge/Offline-First-green)]()
[![No Backend](https://img.shields.io/badge/Backend-None-orange)]()

A fully offline, local-first personal finance app. All data lives in your browser's `localStorage` — it never leaves your device. No sign-up, no server, no tracking, no ads.

---

## Files

```
FinFlow/
├── index.html       ← Main app (open this in your browser)
├── styles.css       ← Design system, dark/light themes, animations
├── app.js           ← All logic: data, render, PWA, tutorial, shortcuts
├── sw.js            ← Service worker (offline caching)
├── manifest.json    ← PWA manifest (install prompt + shortcuts)
├── icon.svg         ← App icon (full size)
├── favicon.svg      ← Browser tab icon (32×32)
├── 404.html         ← GitHub Pages SPA redirect
├── .nojekyll        ← Disables Jekyll on GitHub Pages
└── README.md        ← This file
```
---

## Features

| Feature | Details |
|---------|---------|
| **Accounts** | Checking, savings, credit, cash, investment, loan |
| **Transactions** | Income, expense, transfer — filters, tags, notes, search |
| **Budgets** | Monthly limits per category with rollover option |
| **Goals** | Visual savings targets with progress bar |
| **Recurring** | Subscriptions and scheduled payments with due alerts |
| **Reports** | 5 chart views: overview, spending, income, cash flow, net worth |
| **Insights** | Savings rate, top expense, daily average, month comparison |
| **Categories** | 17 defaults, fully customisable with icons and colours |
| **Themes** | Dark (off-black) and light (warm paper) — toggleable |
| **Tutorial** | 7-step interactive guide, auto-shows on first visit |
| **Info buttons** | `?` on every section explains what it does |
| **Command Palette** | Search and run any action from anywhere |
| **Keyboard Shortcuts** | Full keyboard navigation — see table below |
| **Export** | JSON backup + CSV spreadsheet download |
| **Import** | Restore from any JSON backup |
| **PWA** | Installable on Android, iOS, and desktop — works offline |

---

## Keyboard Shortcuts

### Navigation

| Key | View |
|-----|------|
| `1` | Home / Dashboard |
| `2` | Transactions |
| `3` | Accounts |
| `4` | Budgets |
| `5` | Goals |
| `6` | Reports |
| `7` | Insights |
| `8` | Recurring |
| `9` | Categories |
| `0` | Settings |

### Actions

| Key | Action |
|-----|--------|
| `N` | New transaction |
| `A` | New account |
| `⌘N` / `Ctrl+N` | New transaction (from anywhere) |
| `⌘K` / `Ctrl+K` | Open command palette |
| `/` | Open command palette |
| `⌘E` / `Ctrl+E` | Export JSON backup |
| `⌘,` / `Ctrl+,` | Open settings |
| `⌘B` / `Ctrl+B` | Toggle sidebar |

### UI & Navigation

| Key | Action |
|-----|--------|
| `←` or `J` | Previous month |
| `→` or `L` | Next month |
| `B` | Toggle sidebar |
| `T` | Toggle dark / light theme |
| `?` | Keyboard shortcuts panel |
| `Esc` | Close modal / go back |
| `Backspace` | Go back |

### Reports View Only

| Key | Tab |
|-----|-----|
| `O` | Overview |
| `S` | Spending |
| `I` | Income |
| `C` | Cash Flow |
| `W` | Net Worth |

---

## URL Deep Links

Every view is bookmarkable:

```
/                        → Dashboard (home)
/#dashboard              → Dashboard
/#transactions           → Transactions
/#accounts               → Accounts
/#budget                 → Budgets
/#goals                  → Goals
/#recurring              → Recurring
/#categories             → Categories
/#reports                → Reports (overview tab)
/#reports?tab=spending   → Reports — Spending
/#reports?tab=income     → Reports — Income
/#reports?tab=cashflow   → Reports — Cash Flow
/#reports?tab=net        → Reports — Net Worth
/#insights               → Insights
/#settings               → Settings
/#dashboard?m=3&y=2025   → Dashboard, March 2025
```

---

## First Run

When opened for the first time:
1. 17 default categories are seeded (Groceries, Salary, Transport, etc.)
2. The 7-step tutorial opens automatically
3. No demo data — start with a clean slate

To explore with sample numbers: **Settings → Load Demo Data**

---

## PWA Install

**Android (Chrome):** Tap the menu → *Add to Home Screen*, or tap the install banner at the top.

**iOS (Safari):** Tap the Share button → *Add to Home Screen*.

**Desktop (Chrome / Edge):** Click the install icon in the address bar, or **Settings → Install as App**.

After installing, FinFlow works fully offline. All data stays on the device.

---

## Privacy

- No user accounts, no sign-up, no email
- No servers, no databases, no API calls
- No analytics, no telemetry, no cookies
- All data in `localStorage` — never leaves the device
- External CDN only: Chart.js, Font Awesome, Inter font — no user data sent

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Structure | Vanilla HTML5 |
| Styles | Vanilla CSS3 (custom design system, no framework) |
| Logic | Vanilla JavaScript ES5+ (no build tools, zero dependencies) |
| Charts | [Chart.js 4](https://www.chartjs.org/) via CDN |
| Icons | [Font Awesome 6](https://fontawesome.com/) via CDN |
| Typography | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Storage | `localStorage` (private, on-device) |
| Offline | Service Worker — cache-first + stale-while-revalidate |

---

## License

MIT — free to use, modify, and distribute.

---

## Credits

**FinFlow** was designed and built by **Researcher Tizar**.

*Designed for simplicity. Built for everyone.*
