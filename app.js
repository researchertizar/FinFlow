/* =================================================================
   FinFlow — Personal Finance OS
   app.js  |  v3.1  |  by Researcher Tizar
   License: MIT  |  https://github.com

   Sections:
     1. WRAPPER LAYER  — mobile helpers, sidebar, PWA, service worker,
                         keyboard shortcuts, modal swipe, nav sync
     2. CORE ENGINE    — data model (A,C,T,BG,GL,RC), formatters,
                         CRUD, render functions, charts, reports,
                         insights, import/export, init
     3. POST-ENGINE    — nav patches, ripple effects, tutorial system,
                         view info system, haptics, animations

   No build tools needed. No dependencies except:
     - Chart.js 4 (CDN, loaded in finflow.html)
     - Font Awesome 6 (CDN, loaded in finflow.html)
     - Inter font (Google Fonts, loaded in finflow.html)

   All data stored in localStorage. Nothing leaves the device.
================================================================= */

"use strict";

/* =================================================================
   SECTION 1 — WRAPPER LAYER
================================================================= */

// ═══════════════════════════════════════════════════════
//  WRAPPER LAYER — runs BEFORE the core engine loads
//  Defines globals the engine expects to exist
// ═══════════════════════════════════════════════════════

// PAGE_META — engine uses this to set pg-title / pg-sub
var PAGE_META = {
  dashboard:    { title: "Home",         sub: "Your financial overview" },
  transactions: { title: "Transactions", sub: "All recorded activity" },
  accounts:     { title: "Accounts",     sub: "Your financial accounts" },
  savings:      { title: "Savings",      sub: "Your savings tracker" },
  budget:       { title: "Budgets",      sub: "Spending limits by category" },
  goals: { title: "Goals", sub: "Track your savings targets" },
  recurring: { title: "Recurring", sub: "Scheduled transactions" },
  categories: { title: "Categories", sub: "Organize transactions" },
  reports: { title: "Reports", sub: "Charts & analytics" },
  insights: { title: "Insights", sub: "Smart analysis of your finances" },
  tools: {
    title: "Converters & Tools",
    icon: "fa-calculator",
    body: "<strong>Converters & Tools</strong> — live rates + offline fallback.<br><br>" +
      "<strong>Currency</strong>: Live exchange rates cached 6h. 30+ currencies.<br>" +
      "<strong>Units</strong>: Length, weight, temp, area, volume, speed, data, time, energy, pressure.<br>" +
      "<strong>Finance</strong>: EMI, SIP returns, compound interest.<br>" +
      "<strong>Numbers</strong>: Decimal/binary/hex, percentage, GST calculator."
  },

  settings: { title: "Settings", sub: "Preferences & data management" },
};

// Sidebar toggle (engine calls these)
function toggleSidebar() {
  try {
    var sb = document.getElementById("sidebar");
    if (!sb) return;
    if (window.innerWidth <= 768) {
      sb.classList.toggle("mobile-open");
      var ov = document.getElementById("sb-overlay");
      if (ov) ov.classList.toggle("show", sb.classList.contains("mobile-open"));
    } else {
      sb.classList.toggle("collapsed");
    }
  } catch (e) {}
}
function closeMobileSidebar() {
  try {
    var sb = document.getElementById("sidebar");
    if (sb) sb.classList.remove("mobile-open");
    var ov = document.getElementById("sb-overlay");
    if (ov) ov.classList.remove("show");
  } catch (e) {}
}

// Mobile more menu (engine calls these)
function toggleMobileMore() {
  try {
    var m = document.getElementById("mobile-more-menu");
    if (m) m.classList.toggle("show");
  } catch (e) {}
}
function closeMobileMore() {
  try {
    var m = document.getElementById("mobile-more-menu");
    if (m) m.classList.remove("show");
  } catch (e) {}
}
// Close more menu when clicking outside
document.addEventListener("click", function (e) {
  try {
    if (
      !e.target.closest("#mobile-more-menu") &&
      !e.target.closest("#bn-more-btn")
    ) {
      var m = document.getElementById("mobile-more-menu");
      if (m) m.classList.remove("show");
    }
  } catch (e) {}
});

// updateMobileMonthLabels — engine calls this; updates mobile-mlbl and mobile-mlbl-tx
// We redefine here so it also syncs month nav visibility
function updateMobileMonthLabels() {
  try {
    var d = new Date(
      typeof currentYear !== "undefined"
        ? currentYear
        : new Date().getFullYear(),
      typeof currentMonth !== "undefined"
        ? currentMonth
        : new Date().getMonth(),
      1,
    );
    var lbl = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    ["mobile-mlbl", "mobile-mlbl-tx", "mobile-mlbl-sav"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = lbl;
    });
    // Show/hide mobile month navs based on viewport
    var isMobile = window.innerWidth <= 768;
    document.querySelectorAll(".mobile-month-nav").forEach(function (el) {
      el.style.display = isMobile ? "flex" : "none";
    });
  } catch (e) {}
}
window.addEventListener(
  "resize",
  function () {
    try {
      updateMobileMonthLabels();
    } catch (e) {}
  },
  { passive: true },
);

// PWA install
var deferredInstall = null;
function installPWA() {
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall.userChoice
      .then(function (r) {
        if (r.outcome === "accepted") {
          toast("App installed! Find it on your home screen 🎉", "ok", 5000);
          deferredInstall = null;
          var b = document.getElementById("install-banner");
          if (b) b.classList.remove("show");
          var btn = document.getElementById("install-btn");
          if (btn) btn.style.display = "none";
        } else {
          toast("You can install anytime via Settings", "inf");
        }
      })
      .catch(function () {});
  } else {
    toast(
      'Open in Chrome or Safari, then tap "Add to Home Screen"',
      "inf",
      5000,
    );
  }
}
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredInstall = e;
  var b = document.getElementById("install-banner");
  if (b) b.classList.add("show");
  var btn = document.getElementById("install-btn");
  if (btn) btn.style.display = "flex";
});
window.addEventListener("appinstalled", function () {
  toast("Installed successfully!", "ok", 4000);
  deferredInstall = null;
  var b = document.getElementById("install-banner");
  if (b) b.classList.remove("show");
});

// Offline detection
(function () {
  var b = document.getElementById("offline-banner");
  function upd() {
    if (b) b.classList.toggle("show", !navigator.onLine);
  }
  window.addEventListener("online", function () {
    upd();
    toast("Back online", "ok", 2000);
  });
  window.addEventListener("offline", function () {
    upd();
    toast("Offline — your data is still available", "wrn", 4000);
  });
  upd();
})();

// SW registration handled by engine (Section 2)

// Swipe down to dismiss modals
(function () {
  var startY = 0,
    dragging = false,
    target = null;
  document.addEventListener(
    "touchstart",
    function (e) {
      try {
        var box = e.target.closest(".mo-box");
        if (!box) return;
        var mo = box.parentElement;
        if (!mo || !mo.classList.contains("vis")) return;
        var pt = e.touches[0].clientY;
        var rect = box.getBoundingClientRect();
        if (pt - rect.top > 64 && box.scrollTop > 0) return;
        startY = pt;
        dragging = true;
        target = { mo: mo, box: box };
      } catch (e) {}
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    function (e) {
      if (!dragging || !target) return;
      try {
        var dy = e.touches[0].clientY - startY;
        if (dy > 0 && target.box.scrollTop <= 0) {
          target.box.style.transform =
            "translateY(" + Math.min(dy * 0.45, 110) + "px)";
          target.box.style.transition = "none";
          target.box.style.opacity = Math.max(0.5, 1 - dy / 280).toString();
        }
      } catch (e) {}
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!dragging || !target) return;
      try {
        var dy = e.changedTouches[0].clientY - startY;
        target.box.style.transition = "";
        target.box.style.opacity = "";
        var t = target;
        dragging = false;
        target = null;
        if (dy > 80) {
          t.box.style.transform = "translateY(110%)";
          setTimeout(function () {
            t.mo.classList.remove("vis");
            t.box.style.transform = "";
          }, 230);
        } else {
          t.box.style.transform = "";
        }
      } catch (e) {}
    },
    { passive: true },
  );
})();

// Keyboard shortcuts
// Keyboard handler: see consolidated module at end of this file

// Modal backdrop close
document.querySelectorAll(".mo").forEach(function (mo) {
  mo.addEventListener("click", function (e) {
    if (e.target === mo) mo.classList.remove("vis");
  });
});

// Prevent body scroll when modal open
(function () {
  var obs = new MutationObserver(function () {
    document.body.style.overflow = document.querySelector(".mo.vis")
      ? "hidden"
      : "";
  });
  obs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
})();

// Nav active state updater (called after nav changes)
function _syncNavState(view) {
  try {
    // Sidebar .ni items
    document.querySelectorAll(".ni[data-view]").forEach(function (n) {
      n.classList.toggle("on", n.getAttribute("data-view") === view);
    });
    // Bottom nav .bn-item items
    document.querySelectorAll(".bn-item[data-bnview]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-bnview") === view);
    });
    // Back/menu button logic
    var back = document.getElementById("tb-back-btn");
    var menu = document.getElementById("tb-menu-btn");
    document.body.setAttribute("data-view", view);
    if (back && menu) {
      var showBack =
        (typeof currentSubView !== "undefined" && currentSubView !== null) ||
        view !== "dashboard";
      back.style.display = showBack ? "flex" : "none";
      menu.style.display = showBack ? "none" : "flex";
    }
    // Mobile month nav visibility
    updateMobileMonthLabels();
  } catch (e) {}
}

// ────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════
//  CORE ENGINE — original data/render/save logic
//  (Injected verbatim; only the outer IIFE init is patched)
// ═══════════════════════════════════════════════════════

/* =================================================================
   SECTION 2 — CORE ENGINE
================================================================= */

// ══════════════════════════════════════════════
//  FINFLOW — CORE ENGINE
// ══════════════════════════════════════════════

// ── Data stores ──
var A = [],
  C = [],
  T = [],
  BG = [],
  GL = [],
  RC = [],
  SV = []; // Savings entries
var PR = { theme: "dark", currency: "₹", dateFormat: "MM/DD/YYYY", name: "", role: "", avatarColor: "#5b52f0", mode: "standard" };
var charts = {};
var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();
var editTxId = null,
  editAccId = null,
  editCatId = null,
  editGoalId = null,
  editRcId = null, editSavId = null;
var currentTxType = "expense";
var accColor = "#7c6dfa",
  catColor = "#7c6dfa",
  goalColor = "#7c6dfa";
var catIcon = "fa-tag";
var clrOk = false;
// var deferredInstall — declared in wrapper layer (Section 1), do not redeclare
var currentReportTab = "overview";

// Icon list for categories
var ICONS = [
  "fa-tag",
  "fa-basket-shopping",
  "fa-utensils",
  "fa-car",
  "fa-house",
  "fa-bolt",
  "fa-heart-pulse",
  "fa-gamepad",
  "fa-bag-shopping",
  "fa-plane",
  "fa-graduation-cap",
  "fa-film",
  "fa-music",
  "fa-wifi",
  "fa-gas-pump",
  "fa-train",
  "fa-bus",
  "fa-bicycle",
  "fa-dumbbell",
  "fa-book",
  "fa-coffee",
  "fa-pizza-slice",
  "fa-shirt",
  "fa-briefcase",
  "fa-sack-dollar",
  "fa-chart-line",
  "fa-piggy-bank",
  "fa-wallet",
  "fa-credit-card",
  "fa-receipt",
  "fa-building",
  "fa-home",
  "fa-dog",
  "fa-cat",
  "fa-baby",
  "fa-gift",
  "fa-tools",
  "fa-laptop",
  "fa-mobile-screen",
  "fa-camera",
  "fa-tv",
  "fa-stethoscope",
  "fa-pills",
  "fa-leaf",
  "fa-sun",
  "fa-snowflake",
];
var COLORS = [
  "#7c6dfa",
  "#2de2c2",
  "#ff5f87",
  "#f9bc41",
  "#4fc3f7",
  "#a3e635",
  "#fb923c",
  "#c084fc",
  "#f87171",
  "#34d8a3",
  "#60a5fa",
  "#e879f9",
  "#facc15",
  "#4ade80",
  "#f97316",
  "#818cf8",
  "#22d3ee",
  "#fbbf24",
];

// ── Utilities ──
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function pad2(n) {
  return n < 10 ? "0" + n : n;
}
function r2(n) {
  return Math.round(n * 100) / 100;
}
function today() {
  var d = new Date();
  return (
    d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate())
  );
}
function updateMobileMonthLabels() {
  var d = new Date(currentYear, currentMonth, 1);
  var lbl = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  ["mobile-mlbl", "mobile-mlbl-tx"].forEach(function (id) {
    var e = document.getElementById(id);
    if (e) e.textContent = lbl;
  });
}
function fm(n, raw) {
  try {
    if (typeof n !== "number" || isNaN(n)) n = 0;
    var sym = PR.currency || "₹";
    var abs = Math.abs(n);
    var s;
    if (abs >= 1000000) s = (abs / 1000000).toFixed(1) + "M";
    else if (abs >= 10000) s = (abs / 1000).toFixed(1) + "k";
    else
      s = abs.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return (n < 0 ? "-" : "") + sym + s;
  } catch (e) {
    return (PR.currency || "$") + "0.00";
  }
}
function fmFull(n) {
  try {
    if (typeof n !== "number" || isNaN(n)) n = 0;
    var sym = PR.currency || "$";
    var abs = Math.abs(n);
    return (
      (n < 0 ? "-" : "") +
      sym +
      abs.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  } catch (e) {
    return (PR.currency || "$") + "0.00";
  }
}
function fmDate(d) {
  if (!d) return "";
  var parts = d.split("-");
  if (parts.length !== 3) return d;
  var fmt = PR.dateFormat || "MM/DD/YYYY";
  if (fmt === "DD/MM/YYYY") return parts[2] + "/" + parts[1] + "/" + parts[0];
  if (fmt === "YYYY-MM-DD") return d;
  return parts[1] + "/" + parts[2] + "/" + parts[0];
}
function aObj(id) {
  return A.find(function (a) {
    return a.id === id;
  });
}
function cObj(id) {
  return C.find(function (c) {
    return c.id === id;
  });
}
function tObj(id) {
  return T.find(function (t) {
    return t.id === id;
  });
}
function gObj(id) {
  return GL.find(function (g) {
    return g.id === id;
  });
}
function rcObj(id) {
  return RC.find(function (r) {
    return r.id === id;
  });
}

function isMo(tx, y, m) {
  if (!tx.date) return false;
  var d = new Date(tx.date + "T00:00:00");
  return d.getFullYear() === y && d.getMonth() === m;
}

// ── LocalStorage ──
var LS = (function () {
  try {
    localStorage.setItem("__test", "1");
    localStorage.removeItem("__test");
    return localStorage;
  } catch (e) {
    return {
      _m: {},
      getItem: function (k) {
        return this._m[k] || null;
      },
      setItem: function (k, v) {
        this._m[k] = v;
      },
      removeItem: function (k) {
        delete this._m[k];
      },
    };
  }
})();

function save() {
  try {
    LS.setItem("ff_a", JSON.stringify(A));
    LS.setItem("ff_c", JSON.stringify(C));
    LS.setItem("ff_t", JSON.stringify(T));
    LS.setItem("ff_bg", JSON.stringify(BG));
    LS.setItem("ff_gl", JSON.stringify(GL));
    LS.setItem("ff_rc", JSON.stringify(RC));
    LS.setItem("ff_sv", JSON.stringify(SV));
    LS.setItem("ff_pr", JSON.stringify(PR));
  } catch (e) {
    console.error("Save error:", e);
  }
}
function load() {
  try {
    A = JSON.parse(LS.getItem("ff_a") || "[]");
    C = JSON.parse(LS.getItem("ff_c") || "[]");
    T = JSON.parse(LS.getItem("ff_t") || "[]");
    BG = JSON.parse(LS.getItem("ff_bg") || "[]");
    GL = JSON.parse(LS.getItem("ff_gl") || "[]");
    RC = JSON.parse(LS.getItem("ff_rc") || "[]");
    SV = JSON.parse(LS.getItem("ff_sv") || "[]");
    var pr = JSON.parse(LS.getItem("ff_pr") || "{}");
    PR = Object.assign(PR, pr);
  } catch (e) {
    console.error("Load error:", e);
  }
}

// ── Storage info ──
function updStorageInfo() {
  try {
    var keys = ["ff_a", "ff_c", "ff_t", "ff_bg", "ff_gl", "ff_rc", "ff_pr"];
    var total = 0;
    keys.forEach(function (k) {
      var v = LS.getItem(k);
      if (v) total += k.length + v.length;
    });
    var kb   = ((total * 2) / 1024).toFixed(1);
    var pct  = Math.min(100, Math.round((parseFloat(kb) / 5120) * 100));
    var el   = document.getElementById("storage-sz");
    if (el) el.textContent = kb + " KB used";
    var d = document.getElementById("storage-detail");
    if (d) d.textContent = kb + " KB · " + T.length + " transactions · " + A.length + " accounts";
    var usedKb = document.getElementById("storage-used-kb");
    if (usedKb) usedKb.textContent = kb + " KB";
    var bar = document.getElementById("storage-bar-fill");
    if (bar) {
      bar.style.width = pct + "%";
      bar.style.background = pct > 85 ? "var(--red)" : pct > 60 ? "var(--amber)" : "var(--accent)";
    }
  } catch (e) {}
}

// ── Theme ──
function initTheme() {
  if (PR.theme === "light") {
    document.body.classList.add("light");
  }
  var tg = document.getElementById("theme-toggle");
  if (tg) tg.checked = PR.theme === "light";
}
function toggleTheme() {
  document.body.classList.toggle("light");
  PR.theme = document.body.classList.contains("light") ? "light" : "dark";
  save();
  var tg = document.getElementById("theme-toggle");
  if (tg) tg.checked = PR.theme === "light";
  destroyAllCharts();
  setTimeout(function () {
    if (currentView) navRender(currentView);
  }, 100);
}
function destroyAllCharts() {
  Object.keys(charts).forEach(function (k) {
    try {
      charts[k].destroy();
    } catch (e) {}
  });
  charts = {};
}

// ── Save Preferences ──
function savePref() {
  var cur = document.getElementById("s-currency");
  var dfmt = document.getElementById("s-dateformat");
  var nm = document.getElementById("s-name");
  if (cur) PR.currency = cur.value;
  if (dfmt) PR.dateFormat = dfmt.value;
  if (nm) PR.name = nm.value;
  save();
  updCurrencySymbols();
}
function updCurrencySymbols() {
  var sym = PR.currency || "$";
  [
    "tx-currency-sym",
    "acc-currency-sym",
    "bud-currency-sym",
    "goal-currency-sym",
    "goal-currency-sym2",
    "rc-currency-sym",
    "sav-currency-sym",
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = sym;
  });
}

// ── Month navigation ──
function updateMonthLabel() {
  var d = new Date(currentYear, currentMonth, 1);
  var lbl =
    d.toLocaleDateString("en-US", { month: "long" }) + " " + currentYear;
  document.getElementById("mlbl").textContent = lbl;
  updateMobileMonthLabels();
}
function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateMonthLabel();
  // Update URL with month/year (replace, not push — month changes aren't back-button worthy)
  var extra = { m: currentMonth, y: currentYear };
  if (currentView) {
    var hash = buildHash(currentView, currentSubView, extra);
    history.replaceState(
      { view: currentView, sub: currentSubView, extra: extra },
      "",
      hash,
    );
    navRender(currentView, currentSubView, extra);
  }
}

// ── Navigation ──
var currentView = "dashboard";
var currentSubView = null; // e.g. account detail id
var _navLock = false; // prevent popstate loop

var PAGE_META = {
  dashboard: { title: "Home", sub: "Your financial overview" },
  transactions: { title: "Transactions", sub: "All recorded activity" },
  accounts: { title: "Accounts", sub: "Your financial accounts" },
  budget: { title: "Budgets", sub: "Spending limits by category" },
  goals: { title: "Goals", sub: "Track your savings targets" },
  recurring: { title: "Recurring", sub: "Scheduled transactions" },
  categories: { title: "Categories", sub: "Organize transactions" },
  reports: { title: "Reports", sub: "Charts & analytics" },
  insights: { title: "Insights", sub: "Smart analysis of your finances" },
  settings: { title: "Settings", sub: "Preferences & data management" },
};

// ── URL helpers ──
function buildHash(view, sub, extra) {
  var h = "#" + view;
  if (sub) h += "/" + sub;
  if (extra) {
    var parts = [];
    Object.keys(extra).forEach(function (k) {
      parts.push(k + "=" + encodeURIComponent(extra[k]));
    });
    if (parts.length) h += "?" + parts.join("&");
  }
  return h;
}
function parseHash(hash) {
  hash = (hash || "").replace("#", "");
  var qIdx = hash.indexOf("?");
  var query = {};
  if (qIdx !== -1) {
    hash
      .slice(qIdx + 1)
      .split("&")
      .forEach(function (p) {
        var kv = p.split("=");
        if (kv[0]) query[kv[0]] = decodeURIComponent(kv[1] || "");
      });
    hash = hash.slice(0, qIdx);
  }
  var parts = hash.split("/");
  return { view: parts[0] || "dashboard", sub: parts[1] || null, query: query };
}

// ── Core nav (pushes to history) ──
// Main peer views — navigating between them replaces history (no pile-up)
var _PEER_VIEWS = {
  dashboard:1, transactions:1, accounts:1, budget:1, goals:1,
  recurring:1, categories:1, reports:1, insights:1, settings:1, tools:1
};

function nav(view, sub, extra, replace) {
  sub   = sub   || null;
  extra = extra || {};
  var cur = parseHash(location.hash);

  // Same view + same sub → just re-render, no history entry
  if (cur.view === view && cur.sub === sub && !Object.keys(extra).length) {
    _applyNav(view, sub, extra);
    return;
  }

  var hash  = buildHash(view, sub, extra);
  var state = { view: view, sub: sub, extra: extra };

  // Replace (not push) when:
  //   a) explicit replace flag
  //   b) peer→peer navigation (sidebar/bottom-nav tabs) — prevents history pile-up
  //   c) month/year change — not a meaningful navigation step
  var isPeerNav   = _PEER_VIEWS[cur.view] && !cur.sub && _PEER_VIEWS[view] && !sub;
  var isMonthNav  = extra.m !== undefined || extra.y !== undefined;
  var useReplace  = replace || isPeerNav || isMonthNav;

  if (useReplace) {
    history.replaceState(state, '', hash);
  } else {
    // Push for sub-views (e.g. accounts/ID) — back returns to parent
    history.pushState(state, '', hash);
  }
  _applyNav(view, sub, extra);
}

// ── Apply nav without touching history ──
function _applyNav(view, sub, extra) {
  // Close any open modals
  document.querySelectorAll(".mo.vis").forEach(function (m) {
    m.classList.remove("vis");
  });
  closeMobileMore();
  closeMobileSidebar();

  currentView = view;
  currentSubView = sub;

  // Restore month/year from URL if present
  if (extra && extra.m !== undefined && extra.y !== undefined) {
    var pm = parseInt(extra.m, 10);
    var py = parseInt(extra.y, 10);
    if (!isNaN(pm) && !isNaN(py) && pm >= 0 && pm <= 11) {
      currentMonth = pm;
      currentYear = py;
      updateMonthLabel();
    }
  }

  // Update view panes
  document.querySelectorAll(".view").forEach(function (v) {
    v.classList.remove("active");
  });
  var vEl = document.getElementById("view-" + view);
  if (vEl) vEl.classList.add("active");

  // Update sidebar nav
  document.querySelectorAll(".ni").forEach(function (n) {
    n.classList.remove("on");
  });
  var ni = document.querySelector('.ni[data-view="' + view + '"]');
  if (ni) ni.classList.add("on");

  // Update bottom nav
  document.querySelectorAll(".bn-item[data-bnview]").forEach(function (b) {
    b.classList.remove("on");
  });
  var bnItem = document.querySelector('.bn-item[data-bnview="' + view + '"]');
  if (bnItem) bnItem.classList.add("on");

  // Update page title
  var meta = PAGE_META[view] || { title: view, sub: "" };
  document.getElementById("pg-title").textContent = meta.title;
  document.getElementById("pg-sub").textContent = meta.sub;
  document.title = meta.title + " — FinFlow";

  // Show/hide back button in topbar
  _updateBackBtn(view, sub);

  // Update mobile month labels
  updateMobileMonthLabels();

  // Render content
  navRender(view, sub, extra);

  // Scroll to top
  var content = document.getElementById("content");
  if (content) content.scrollTop = 0;
}

// ── Back button in topbar ──
function _updateBackBtn(view, sub) {
  document.body.setAttribute("data-view", view);
  var btn    = document.getElementById("tb-back-btn");
  var menuBtn = document.getElementById("tb-menu-btn");
  if (!btn) return;
  // Show back ONLY for sub-views (e.g. account detail drill-down)
  // Peer views (sidebar items) never show back — they use sidebar/bottom-nav
  var showBack = sub != null;
  btn.style.display    = showBack ? "flex" : "none";
  if (menuBtn) menuBtn.style.display = showBack ? "none" : "flex";
}

function goBack() {
  // Sub-view (e.g. account detail) → back to parent view
  if (currentSubView) {
    nav(currentView, null, null, true);
    return;
  }
  // Non-dashboard main view → replace with dashboard (no new history entry)
  if (currentView && currentView !== 'dashboard') {
    nav('dashboard', null, null, true);
    return;
  }
  // Already at dashboard root — do nothing (don't let browser exit the app)
}

// ── popstate: browser back/forward ──
window.addEventListener("popstate", function (e) {
  if (_navLock) return;
  var state = e.state;
  if (state && state.view) {
    _applyNav(state.view, state.sub || null, state.extra || {});
  } else {
    // parse from hash
    var parsed = parseHash(location.hash);
    _applyNav(parsed.view, parsed.sub, parsed.query);
  }
});

// ── hashchange fallback (for browsers without history.pushState support) ──
window.addEventListener("hashchange", function () {
  // Only if not already handled by popstate
  var parsed = parseHash(location.hash);
  if (parsed.view !== currentView || parsed.sub !== currentSubView) {
    _applyNav(parsed.view, parsed.sub, parsed.query);
  }
});

function navRender(view, sub, extra) {
  extra = extra || {};
  if (view === "dashboard") {
    if (typeof window.renderDash === "function") window.renderDash();
    else renderDash();
  }
  if (view === "transactions") renderTx();
  if (view === "accounts") {
    renderAccounts();
    if (sub) {
      setTimeout(function () {
        showAccDetail(sub);
      }, 80);
    }
  }
  if (view === "savings") renderSavings();
  if (view === "budget") renderBudget();
  if (view === "goals") renderGoals();
  if (view === "recurring") renderRecurring();
  if (view === "categories") renderCategories();
  if (view === "reports") {
    renderReports();
    if (extra.tab) switchReportTab(extra.tab);
  }
  if (view === "insights") renderInsights();
  if (view === "settings") renderSettings();
  if (view === "tools") renderTools();
}

// ── Mobile More Menu ──
// (defined in wrapper layer)

// (defined in wrapper layer)

document.addEventListener("click", function (e) {
  var mm = document.getElementById("mobile-more-menu");
  if (!mm) return;
  if (
    !e.target.closest("#mobile-more-menu") &&
    !e.target.closest('[onclick="toggleMobileMore()"]')
  ) {
    mm.classList.remove("show");
  }
});

// ── Sidebar ──
// (defined in wrapper layer)

// (defined in wrapper layer)

// ── Toast ──
function toast(msg, type, dur) {
  var icons = {
    ok: "fa-circle-check",
    err: "fa-circle-xmark",
    wrn: "fa-triangle-exclamation",
    inf: "fa-circle-info",
  };
  var ic = icons[type || "inf"] || "fa-circle-info";
  var el = document.createElement("div");
  el.className = "toast " + (type || "inf");
  el.innerHTML = '<i class="fa-solid ' + ic + '"></i><span>' + msg + "</span>";
  el.style.cursor = "pointer";
  el.title = "Tap to dismiss";
  var toastsEl = document.getElementById("toasts");
  toastsEl.appendChild(el);
  // Limit to 3 toasts at once
  var all = toastsEl.querySelectorAll(".toast");
  if (all.length > 3) {
    try {
      toastsEl.removeChild(all[0]);
    } catch (e) {}
  }
  function dismiss() {
    el.style.opacity = "0";
    el.style.transform = "translateX(20px) scale(.96)";
    el.style.transition = ".22s cubic-bezier(.4,0,.2,1)";
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 240);
  }
  el.addEventListener("click", dismiss);
  setTimeout(dismiss, dur || 3200);
}

// ── Error helpers ──
function showErr(id, msg) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add("vis");
  }
}
function clrErrs() {
  document.querySelectorAll(".err-msg").forEach(function (e) {
    e.classList.remove("vis");
    e.textContent = "";
  });
  document
    .querySelectorAll(".mo-box input.err, .mo-box select.err")
    .forEach(function (e) {
      e.classList.remove("err");
    });
}

// ── Account balance calc ──
function accBalance(accId) {
  var acc = aObj(accId);
  if (!acc) return 0;
  var bal = acc.startingBalance || 0;
  T.forEach(function (t) {
    if (t.accountId === accId) {
      var ct = cObj(t.categoryId);
      var type = t.txType || (ct ? ct.type : "expense");
      if (type === "income") bal += t.amount;
      else if (type === "expense") bal -= t.amount;
      else if (type === "transfer") bal -= t.amount;
    }
    if (t.toAccountId === accId && t.txType === "transfer") {
      bal += t.amount;
    }
  });
  return r2(bal);
}
function totalNetWorth() {
  var total = 0;
  A.forEach(function (a) {
    var bal = accBalance(a.id);
    // For credit/loan, balance is already negative (debt), just add it directly
    total += bal;
  });
  return r2(total);
}

// ── Month aggregates ──
function moIncome(y, m) {
  var s = 0;
  T.forEach(function (t) {
    if (isMo(t, y, m)) {
      var ct = cObj(t.categoryId);
      var type = t.txType || (ct ? ct.type : "expense");
      if (type === "income") s += t.amount;
    }
  });
  return r2(s);
}
function moExpense(y, m) {
  var s = 0;
  T.forEach(function (t) {
    if (isMo(t, y, m)) {
      var ct = cObj(t.categoryId);
      var type = t.txType || (ct ? ct.type : "expense");
      if (type === "expense") s += t.amount;
    }
  });
  return r2(s);
}
function moSavings(y, m) {
  return r2(moIncome(y, m) - moExpense(y, m));
}

// ── Chart factory ──
function isDark() {
  return !document.body.classList.contains("light");
}
function chColor() {
  return isDark() ? "rgba(237,240,255,.06)" : "rgba(15,18,30,.06)";
}
function chGrid() {
  return isDark() ? "rgba(237,240,255,.06)" : "rgba(15,18,30,.07)";
}
function chText() {
  return isDark() ? "#7a84a8" : "#4a5078";
}
// Chart.js readiness queue — handles deferred loading
var _chartQueue = [];
var _chartReady = false;
function _onChartReady() {
  _chartReady = true;
  var q = _chartQueue.slice();
  _chartQueue = [];
  q.forEach(function (fn) {
    try {
      fn();
    } catch (e) {}
  });
}
function _whenChart(fn) {
  if (typeof Chart !== "undefined") {
    fn();
  } else {
    _chartQueue.push(fn);
  }
}
// Poll for Chart.js (covers defer + async load)
(function _waitChart() {
  if (typeof Chart !== "undefined") {
    _onChartReady();
    return;
  }
  setTimeout(_waitChart, 50);
})();

function mkChart(id, cfg) {
  if (typeof Chart === "undefined") {
    // Queue this chart render for when Chart.js loads
    _chartQueue.push(function () {
      mkChart(id, cfg);
    });
    return;
  }
  if (charts[id]) {
    try {
      charts[id].destroy();
    } catch (e) {}
  }
  var el = document.getElementById(id);
  if (!el) return;
  var ctx = el.getContext("2d");
  cfg.options = cfg.options || {};
  cfg.options.responsive = true;
  cfg.options.maintainAspectRatio = false;
  cfg.options.plugins = cfg.options.plugins || {};
  cfg.options.plugins.legend = cfg.options.plugins.legend || { display: false };
  cfg.options.plugins.tooltip = Object.assign(
    {
      backgroundColor: isDark() ? "#181c27" : "#fff",
      titleColor: isDark() ? "#edf0ff" : "#0d0f1e",
      bodyColor: isDark() ? "#7a84a8" : "#4a5078",
      padding: 12,
      cornerRadius: 10,
      borderColor: isDark() ? "#1a1e2e" : "#e2e4f0",
      borderWidth: 1,
    },
    cfg.options.plugins.tooltip || {},
  );
  charts[id] = new Chart(ctx, cfg);
  return charts[id];
}

// ── Color helpers ──
function hexToRgba(hex, a) {
  try {
    if (!hex || typeof hex !== "string") return "rgba(79,70,229," + a + ")";
    if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return "rgba(79,70,229," + a + ")";
    var r = parseInt(h.substr(0, 2), 16),
      g = parseInt(h.substr(2, 2), 16),
      b = parseInt(h.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return "rgba(79,70,229," + a + ")";
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  } catch (e) {
    return "rgba(79,70,229," + a + ")";
  }
}
function catChipHtml(cat) {
  if (!cat) return '<span style="color:var(--fg3);font-size:11px">—</span>';
  var bg = hexToRgba(cat.color, 0.12);
  return (
    '<span class="cat-chip" style="background:' +
    bg +
    ";color:" +
    cat.color +
    '"><i class="fa-solid ' +
    (cat.icon || "fa-tag") +
    '" style="font-size:9px"></i>' +
    cat.name +
    "</span>"
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════
function renderDash() {
  var y = currentYear,
    m = currentMonth;
  var inc = moIncome(y, m),
    exp = moExpense(y, m),
    sav = moSavings(y, m);
  var nw = totalNetWorth();

  // Net worth hero
  var nwEl = document.getElementById("nw-val");
  if (nwEl) {
    var newText = fmFull(nw);
    if (nwEl.textContent !== newText) {
      nwEl.classList.remove("refreshed");
      void nwEl.offsetWidth;
      nwEl.classList.add("refreshed");
    }
    nwEl.textContent = newText;
    nwEl.className = "dash-hero-val " + (nw >= 0 ? "pos" : "neg");
  }

  // Previous month delta
  var pm = m - 1,
    py = y;
  if (pm < 0) {
    pm = 11;
    py--;
  }
  var prevInc = moIncome(py, pm),
    prevExp = moExpense(py, pm),
    prevSav = moSavings(py, pm);
  var delta = sav - prevSav;
  var ndEl = document.getElementById("nw-delta");
  if (ndEl) {
    ndEl.innerHTML =
      '<span class="month-delta ' +
      (delta >= 0 ? "up" : "dn") +
      '"><i class="fa-solid fa-' +
      (delta >= 0 ? "arrow-trend-up" : "arrow-trend-down") +
      '"></i> ' +
      fmFull(Math.abs(delta)) +
      " vs last month</span>";
  }

  // Stats
  var sg = document.getElementById("stats-grid");
  if (sg) {
    sg.innerHTML =
      statCard(
        "Monthly Income",
        "fa-arrow-trend-up",
        "teal",
        fm(inc),
        inc > prevInc ? "+" + fm(inc - prevInc) : "−" + fm(prevInc - inc),
        inc >= prevInc ? "up" : "dn",
      ) +
      statCard(
        "Monthly Expenses",
        "fa-arrow-trend-down",
        "rose",
        fm(exp),
        exp > prevExp ? "↑" + fm(exp - prevExp) : "↓" + fm(prevExp - exp),
        exp <= prevExp ? "up" : "dn",
      ) +
      statCard(
        "Total Savings",
        "fa-piggy-bank",
        "purple",
        fm(totalSavings()),
        SV.length + " entr" + (SV.length === 1 ? "y" : "ies"),
        "neu",
      ) +
      statCard(
        "Net Balance",
        "fa-wallet",
        "accent",
        fmFull(nw),
        "All accounts",
        "neu",
      );
  }

  // Charts
  // Defer chart render so main content paints first
  requestAnimationFrame(function () {
    renderDashDonut(y, m);
    renderDashFlow();
  });
  renderRecentTx();
  renderDashBudgets(y, m);
  renderDashGoals();
  renderRecentSavings();
  updStorageInfo();
  updNotifDot();
}
function statCard(lbl, ic, accent, val, sub, subClass) {
  var colors = {
    teal:   "var(--green)",
    rose:   "var(--red)",
    p:      "var(--accent)",
    amber:  "var(--amber)",
    purple: "#a855f7",
    accent: "var(--accent-h)",
  };
  var bgs = {
    teal:   "var(--green2)",
    rose:   "var(--red2)",
    p:      "var(--ac2)",
    amber:  "var(--amber2)",
    purple: "rgba(168,85,247,0.15)",
    accent: "var(--ac2)",
  };
  var c = colors[accent] || "var(--accent)",
    bg = bgs[accent] || "var(--ac2)";
  var navMap = { 'Monthly Income':'transactions', 'Monthly Expenses':'transactions',
    'Total Savings':'savings', 'Net Balance':'accounts' };
  var navDest = navMap[lbl] || '';
  return (
    '<div class="sc"' + (navDest ? ' onclick="nav(\'' + navDest + '\')" style="cursor:pointer" role="button" aria-label="Go to ' + navDest + '"' : '') + '>' +
    '<div class="sc-top">' +
    '<div class="sc-ic" style="background:' +
    bg +
    ";color:" +
    c +
    '"><i class="fa-solid ' +
    ic +
    '"></i></div>' +
    '<div class="sc-badge ' +
    subClass +
    '">' +
    sub +
    "</div>" +
    "</div>" +
    '<div class="sc-val">' +
    val +
    "</div>" +
    '<div class="sc-lbl">' +
    lbl +
    "</div>" +
    "</div>"
  );
}
function renderDashDonut(y, m) {
  var cats = {};
  T.forEach(function (t) {
    if (!isMo(t, y, m)) return;
    var ct = cObj(t.categoryId);
    if (!ct || ct.type !== "expense") return;
    cats[ct.id] = (cats[ct.id] || 0) + t.amount;
  });
  var sorted = Object.keys(cats)
    .map(function (id) {
      return { cat: cObj(id), val: cats[id] };
    })
    .filter(function (x) {
      return x.cat;
    })
    .sort(function (a, b) {
      return b.val - a.val;
    })
    .slice(0, 6);
  if (!sorted.length) {
    var el = document.getElementById("c-donut");
    if (el) {
      var p = el.parentNode;
      p.innerHTML =
        '<div class="emp" style="padding:40px"><div class="emp-ic"><i class="fa-solid fa-chart-pie"></i></div><p>No expense data</p></div>';
    }
    return;
  }
  mkChart("c-donut", {
    type: "doughnut",
    data: {
      labels: sorted.map(function (x) {
        return x.cat.name;
      }),
      datasets: [
        {
          data: sorted.map(function (x) {
            return x.val;
          }),
          backgroundColor: sorted.map(function (x) {
            return x.cat.color;
          }),
          borderWidth: 2,
          borderColor: isDark() ? "#13161f" : "#fff",
          hoverOffset: 6,
        },
      ],
    },
    options: {
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return " " + ctx.label + ": " + fm(ctx.raw);
            },
          },
        },
      },
    },
  });
  var leg = document.getElementById("donut-legend");
  if (leg)
    leg.innerHTML = sorted
      .map(function (x) {
        return (
          '<span class="cat-chip" style="background:' +
          hexToRgba(x.cat.color, 0.12) +
          ";color:" +
          x.cat.color +
          '"><i class="fa-solid ' +
          (x.cat.icon || "fa-tag") +
          '" style="font-size:9px"></i>' +
          x.cat.name +
          "</span>"
        );
      })
      .join("");
}
function renderDashFlow() {
  var labels = [],
    incData = [],
    expData = [];
  for (var i = -5; i <= 0; i++) {
    var d = new Date(currentYear, currentMonth + i, 1);
    var y2 = d.getFullYear(),
      m2 = d.getMonth();
    labels.push(d.toLocaleDateString("en-US", { month: "short" }));
    incData.push(moIncome(y2, m2));
    expData.push(moExpense(y2, m2));
  }
  mkChart("c-flow", {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: incData,
          backgroundColor: hexToRgba("#2de2c2", 0.7),
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Expense",
          data: expData,
          backgroundColor: hexToRgba("#ff5f87", 0.7),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
          labels: {
            color: chText(),
            usePointStyle: true,
            boxWidth: 8,
            padding: 14,
            font: { size: 11 },
          },
        },
      },
      scales: {
        x: {
          grid: { color: chGrid() },
          ticks: { color: chText(), font: { size: 11 } },
        },
        y: {
          grid: { color: chGrid() },
          ticks: {
            color: chText(),
            callback: function (v) {
              return fm(v);
            },
          },
        },
      },
    },
  });
}
function renderRecentTx() {
  var sorted = T.slice()
    .sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 8);
  var el = document.getElementById("recent-tx-list");
  if (!el) return;
  if (!sorted.length) {
    el.innerHTML = '<div class="emp" style="padding:30px"><div class="emp-ic"><i class="fa-solid fa-receipt"></i></div><p>No transactions yet</p><button class="btn-p sm" onclick="openTxM()" style="margin-top:10px"><i class="fa-solid fa-plus"></i> Add one</button></div>';
    return;
  }
  // "See all" label
  var hdr = document.querySelector('.recent-tx-header');
  if (hdr && !hdr.getAttribute('data-clickable')) {
    hdr.setAttribute('data-clickable', '1');
    hdr.style.cursor = 'pointer';
    hdr.onclick = function() { nav('transactions'); };
  }
  el.innerHTML = sorted
    .map(function (t) {
      var ct = cObj(t.categoryId);
      var ac = aObj(t.accountId);
      var type = t.txType || (ct ? ct.type : "expense");
      var amtClass =
        type === "income"
          ? "tx-inc"
          : type === "transfer"
            ? "tx-trf"
            : "tx-exp";
      var amtPrefix = type === "income" ? "+" : type === "transfer" ? "↔" : "−";
      var bg = ct ? hexToRgba(ct.color, 0.12) : "var(--ac2)";
      var clr = ct ? ct.color : "var(--accent)";
      return (
        '<div class="tx-item" onclick="openTxM(\'' + t.id + '\')" style="cursor:pointer">' +
        '<div class="tx-cat-ic" style="background:' +
        bg +
        ";color:" +
        clr +
        '"><i class="fa-solid ' +
        (ct ? ct.icon || "fa-tag" : "fa-tag") +
        '"></i></div>' +
        '<div class="tx-info">' +
        '<div class="tx-desc">' +
        t.description +
        "</div>" +
        '<div class="tx-meta">' +
        fmDate(t.date) +
        (ac ? " · " + ac.name : "") +
        (ct ? " · " + ct.name : "") +
        "</div>" +
        "</div>" +
        '<div class="tx-amount ' +
        amtClass +
        '">' +
        amtPrefix +
        fm(t.amount) +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}
function renderDashBudgets(y, m) {
  var el = document.getElementById("dash-budgets");
  if (!el) return;
  if (!BG.length) {
    el.innerHTML =
      '<div style="font-size:12px;color:var(--fg3);padding:8px 0">No budgets set. <button class="btn-ghost sm" onclick="nav(\'budget\')">Set budgets →</button></div>';
    return;
  }
  var html = "";
  BG.forEach(function (bg) {
    var cat = cObj(bg.categoryId);
    if (!cat) return;
    var spent = 0;
    T.forEach(function (t) {
      if (isMo(t, y, m) && t.categoryId === bg.categoryId) spent += t.amount;
    });
    var pct = Math.min(r2((spent / bg.limit) * 100), 100);
    var over = spent > bg.limit;
    var barColor = over ? "var(--red)" : pct > 85 ? "var(--amber)" : cat.color;
    var barClass = over ? "over" : pct > 85 ? "warning" : "";
    html +=
      '<div style="margin-bottom:10px;cursor:pointer" onclick="nav(' + "'budget'" + ')">' +
      '<div class="fb" style="margin-bottom:5px">' +
      '<div class="fr" style="gap:6px"><i class="fa-solid ' +
      (cat.icon || "fa-tag") +
      '" style="color:' +
      cat.color +
      ';font-size:11px"></i><span style="font-size:12px;font-weight:600">' +
      cat.name +
      "</span></div>" +
      '<span style="font-family:var(--font);font-size:11px;color:' +
      (over ? "var(--red)" : "var(--fg3)") +
      '">' +
      fm(spent) +
      " / " +
      fm(bg.limit) +
      "</span>" +
      "</div>" +
      '<div class="prog" style="height:6px"><div class="prog-fill ' +
      barClass +
      '" style="width:' +
      pct +
      "%;background:" +
      barColor +
      '"></div></div>' +
      "</div>";
  });
  el.innerHTML = html;
}
function renderDashGoals() {
  var el = document.getElementById("dash-goals");
  if (!el) return;
  if (!GL.length) {
    el.innerHTML =
      '<div style="font-size:12px;color:var(--fg3);padding:8px 0">No goals yet. <button class="btn-ghost sm" onclick="nav(\'goals\')">Create a goal →</button></div>';
    return;
  }
  var html = "";
  GL.slice(0, 3).forEach(function (g) {
    var pct =
      g.target > 0 ? Math.min(r2((g.current / g.target) * 100), 100) : 0;
    html +=
      '<div style="margin-bottom:12px">' +
      '<div class="fb" style="margin-bottom:5px">' +
      '<div class="fr" style="gap:6px"><i class="fa-solid ' +
      (g.icon || "fa-star") +
      '" style="color:' +
      g.color +
      ';font-size:11px"></i><span style="font-size:12px;font-weight:600">' +
      g.name +
      "</span></div>" +
      '<span style="font-family:var(--font);font-size:11px;color:var(--fg3)">' +
      pct.toFixed(0) +
      "%</span>" +
      "</div>" +
      '<div class="prog" style="height:5px"><div class="prog-fill" style="width:' +
      pct +
      "%;background:" +
      g.color +
      '"></div></div>' +
      '<div style="font-size:11px;color:var(--fg3);margin-top:3px">' +
      fm(g.current) +
      " of " +
      fm(g.target) +
      "</div>" +
      "</div>";
  });
  el.innerHTML = html;
}

// ══════════════════════════════════════════════
//  TRANSACTIONS
// ══════════════════════════════════════════════
function renderTx() {
  var typeF = document.getElementById("f-type").value;
  var catF = document.getElementById("f-cat").value;
  var accF = document.getElementById("f-acc").value;
  var searchF = (document.getElementById("f-search").value || "")
    .toLowerCase()
    .trim();
  var sortF = document.getElementById("f-sort").value;

  // Populate filters
  var catSel = document.getElementById("f-cat");
  var catCurr = catSel.value;
  catSel.innerHTML =
    '<option value="">All Categories</option>' +
    C.map(function (c) {
      return (
        '<option value="' +
        c.id +
        '"' +
        (c.id === catCurr ? " selected" : "") +
        ">" +
        c.name +
        "</option>"
      );
    }).join("");

  var accSel = document.getElementById("f-acc");
  var accCurr = accSel.value;
  accSel.innerHTML =
    '<option value="">All Accounts</option>' +
    A.map(function (a) {
      return (
        '<option value="' +
        a.id +
        '"' +
        (a.id === accCurr ? " selected" : "") +
        ">" +
        a.name +
        "</option>"
      );
    }).join("");

  var filtered = T.filter(function (t) {
    var ct = cObj(t.categoryId);
    var type = t.txType || (ct ? ct.type : "expense");
    if (typeF && type !== typeF) return false;
    if (catF && t.categoryId !== catF) return false;
    if (accF && t.accountId !== accF) return false;
    if (searchF) {
      var hay = (
        t.description +
        " " +
        (t.tags || "") +
        " " +
        (t.note || "")
      ).toLowerCase();
      if (hay.indexOf(searchF) === -1) return false;
    }
    return true;
  });

  filtered.sort(function (a, b) {
    if (sortF === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortF === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortF === "amount-desc") return b.amount - a.amount;
    if (sortF === "amount-asc") return a.amount - b.amount;
    return 0;
  });

  var tbody = document.getElementById("tx-tbody");
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--fg3)"><i class="fa-solid fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>No transactions found</td></tr>';
  } else {
    tbody.innerHTML = filtered
      .map(function (t) {
        var ct = cObj(t.categoryId);
        var ac = aObj(t.accountId);
        var type = t.txType || (ct ? ct.type : "expense");
        var amtClass =
          type === "income"
            ? "tx-inc"
            : type === "transfer"
              ? "tx-trf"
              : "tx-exp";
        var amtPfx = type === "income" ? "+" : type === "transfer" ? "↔" : "−";
        var tags = (t.tags || "")
          .split(",")
          .filter(Boolean)
          .map(function (tg) {
            return '<span class="tag">' + tg.trim() + "</span>";
          })
          .join("");
        return (
          "<tr>" +
          '<td class="td-mono" style="font-size:12px">' +
          fmDate(t.date) +
          "</td>" +
          '<td><div style="font-weight:600;font-size:13px">' +
          t.description +
          "</div>" +
          (t.note
            ? '<div style="font-size:11px;color:var(--fg3)">' +
              t.note +
              "</div>"
            : "") +
          " </td>" +
          "<td>" +
          catChipHtml(ct) +
          "</td>" +
          '<td style="font-size:12px;color:var(--fg2)">' +
          (ac ? ac.name : "—") +
          "</td>" +
          "<td>" +
          tags +
          "</td>" +
          '<td style="text-align:right"><span class="' +
          amtClass +
          '">' +
          amtPfx +
          fm(t.amount) +
          "</span></td>" +
          '<td><div class="fr" style="gap:4px;justify-content:flex-end">' +
          '<button class="btn xs" onclick="openTxM(null,\'' +
          t.id +
          '\')"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn xs danger" onclick="deleteTx(\'' +
          t.id +
          '\')"><i class="fa-solid fa-trash"></i></button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  // Summary
  var totInc = 0,
    totExp = 0;
  filtered.forEach(function (t) {
    var ct = cObj(t.categoryId);
    var type = t.txType || (ct ? ct.type : "expense");
    if (type === "income") totInc += t.amount;
    else if (type === "expense") totExp += t.amount;
  });
  var sm = document.getElementById("tx-summary");
  if (sm)
    sm.innerHTML =
      '<span><strong style="color:var(--green)">+' +
      fm(totInc) +
      '</strong> income</span><span><strong style="color:var(--red)">−' +
      fm(totExp) +
      '</strong> expenses</span><span><strong style="color:' +
      (totInc - totExp >= 0 ? "var(--green)" : "var(--red)") +
      '">' +
      fm(totInc - totExp) +
      '</strong> net</span><span style="margin-left:auto"><strong>' +
      filtered.length +
      "</strong> transactions shown</span>";
}

// ══ TX MODAL ══
function openTxM(type, editId) {
  if (!editId && A.length === 0) {
    toast("Add an account first before recording transactions", "wrn");
    openAccM();
    return;
  }
  if (!editId && C.length === 0) {
    toast("Add a category first before recording transactions", "wrn");
    openCatM();
    return;
  }
  clrErrs();
  editTxId = editId || null;
  if (!editId) {
    currentTxType = type || "expense";
    document.getElementById("tx-id").value = "";
    document.getElementById("tx-amount").value = "";
    document.getElementById("tx-desc").value = "";
    document.getElementById("tx-date").value = today();
    document.getElementById("tx-tags").value = "";
    document.getElementById("tx-note").value = "";
    document.getElementById("mo-tx-title").textContent = "Add Transaction";
    document.getElementById("tx-save-lbl").textContent = "Add Transaction";
  } else {
    var t = tObj(editId);
    if (!t) return;
    var ct = cObj(t.categoryId);
    currentTxType = t.txType || (ct ? ct.type : "expense");
    document.getElementById("tx-id").value = t.id;
    document.getElementById("tx-amount").value = t.amount;
    document.getElementById("tx-desc").value = t.description;
    document.getElementById("tx-date").value = t.date;
    document.getElementById("tx-tags").value = t.tags || "";
    document.getElementById("tx-note").value = t.note || "";
    document.getElementById("mo-tx-title").textContent = "Edit Transaction";
    document.getElementById("tx-save-lbl").textContent = "Save Changes";
  }
  setTxType(currentTxType);
  populateTxCats();
  populateTxAccs();
  updCurrencySymbols();
  document.getElementById("mo-tx").classList.add("vis");
  setTimeout(function () {
    var el = document.getElementById("tx-amount");
    if (el) {
      el.focus();
      el.select();
    }
  }, 160);
}
function setTxType(type) {
  currentTxType = type;
  ["expense", "income", "transfer"].forEach(function (t) {
    var btn = document.getElementById("tt-" + t);
    if (btn) btn.classList.toggle("on", t === type);
  });
  var toRow = document.getElementById("tx-to-acc-row");
  if (toRow) toRow.style.display = type === "transfer" ? "block" : "none";
  populateTxCats();
}
function populateTxCats() {
  var sel = document.getElementById("tx-cat");
  if (!sel) return;
  var filtered = C.filter(function (c) {
    return c.type === currentTxType || currentTxType === "transfer";
  });
  sel.innerHTML =
    '<option value="">Select category…</option>' +
    filtered
      .map(function (c) {
        return '<option value="' + c.id + '">' + c.name + "</option>";
      })
      .join("");
  if (editTxId) {
    var t = tObj(editTxId);
    if (t) sel.value = t.categoryId;
  }
}
function populateTxAccs() {
  var sel = document.getElementById("tx-acc");
  if (!sel) return;
  sel.innerHTML =
    '<option value="">Select account…</option>' +
    A.map(function (a) {
      return '<option value="' + a.id + '">' + a.name + "</option>";
    }).join("");
  var sel2 = document.getElementById("tx-to-acc");
  if (sel2)
    sel2.innerHTML =
      '<option value="">Select account…</option>' +
      A.map(function (a) {
        return '<option value="' + a.id + '">' + a.name + "</option>";
      }).join("");
  if (editTxId) {
    var t = tObj(editTxId);
    if (t) {
      sel.value = t.accountId;
      if (sel2 && t.toAccountId) sel2.value = t.toAccountId;
    }
  }
}
function closeTxM() {
  document.getElementById("mo-tx").classList.remove("vis");
  editTxId = null;
}
function saveTx() {
  clrErrs();
  var ok = true;
  var amount = parseFloat(document.getElementById("tx-amount").value);
  var desc = document.getElementById("tx-desc").value.trim();
  var date = document.getElementById("tx-date").value;
  var catId = document.getElementById("tx-cat").value;
  var accId = document.getElementById("tx-acc").value;
  if (!amount || amount <= 0) {
    showErr("e-amount", "Enter a valid amount");
    ok = false;
  }
  if (!desc) {
    showErr("e-desc", "Description is required");
    ok = false;
  }
  if (!catId && currentTxType !== "transfer") {
    showErr("e-cat", "Select a category");
    ok = false;
  }
  if (!accId) {
    showErr("e-acc", "Select an account");
    ok = false;
  }
  if (!date) {
    showErr("e-amount", "Date is required");
    ok = false;
  }
  if (currentTxType === "transfer") {
    var toAccId = document.getElementById("tx-to-acc").value;
    if (!toAccId) {
      showErr("e-acc", "Select a destination account");
      ok = false;
    }
    if (toAccId && toAccId === accId) {
      showErr("e-acc", "From and To accounts must be different");
      ok = false;
    }
  }
  if (!ok) return;
  var obj = {
    id: editTxId || uid(),
    amount: r2(amount),
    description: desc,
    date: date,
    categoryId: catId,
    accountId: accId,
    txType: currentTxType,
    tags: document.getElementById("tx-tags").value.trim(),
    note: document.getElementById("tx-note").value.trim(),
    createdAt: editTxId
      ? (tObj(editTxId) || {}).createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };
  if (currentTxType === "transfer") {
    obj.toAccountId = document.getElementById("tx-to-acc").value;
  }
  if (editTxId)
    T = T.filter(function (t) {
      return t.id !== editTxId;
    });
  T.push(obj);
  save();
  closeTxM();
  toast(editTxId ? "Transaction updated" : "Transaction added", "ok");
  if (currentView === "dashboard") renderDash();
  else navRender(currentView);
}
function deleteTx(id) {
  if (!confirm("Delete this transaction?")) return;
  T = T.filter(function (t) {
    return t.id !== id;
  });
  save();
  toast("Transaction deleted", "inf");
  navRender(currentView);
}

// ══════════════════════════════════════════════
//  ACCOUNTS
// ══════════════════════════════════════════════
var ACC_TYPES = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  investment: "Investment",
  cash: "Cash",
  loan: "Loan",
  other: "Other",
};
function renderAccounts() {
  var el = document.getElementById("acc-grid");
  var detailEl = document.getElementById("acc-detail");
  if (!el) return;

  // Always reset both panels first
  el.style.display = "";
  if (detailEl) detailEl.style.display = "none";
  _updateBackBtn("accounts", currentSubView);

  if (!A.length) {
    el.innerHTML =
      '<div class="emp" style="grid-column:1/-1;padding:60px"><div class="emp-ic"><i class="fa-solid fa-vault"></i></div><h3>No accounts yet</h3><p>Add your first account to get started</p><button class="btn-p" onclick="openAccM()"><i class="fa-solid fa-plus"></i> Add Account</button></div>';
    return;
  }
  el.innerHTML = A.map(function (a) {
    var bal = accBalance(a.id);
    var txCount = T.filter(function (t) {
      return t.accountId === a.id;
    }).length;
    return (
      '<div class="acc-card" onclick="showAccDetail(\'' +
      a.id +
      "')\">" +
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:' +
      a.color +
      ';border-radius:var(--r2) var(--r2) 0 0"></div>' +
      '<div class="acc-top">' +
      '<div class="acc-ic" style="background:' +
      hexToRgba(a.color, 0.15) +
      ";color:" +
      a.color +
      '"><i class="fa-solid fa-' +
      accTypeIcon(a.type) +
      '"></i></div>' +
      '<div class="acc-menu">' +
      '<button class="btn xs" onclick="event.stopPropagation();openAccM(\'' +
      a.id +
      '\')"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="btn xs danger" onclick="event.stopPropagation();deleteAcc(\'' +
      a.id +
      '\')"><i class="fa-solid fa-trash"></i></button>' +
      "</div>" +
      "</div>" +
      '<div class="acc-bal" style="color:' +
      (a.type === "credit" && bal < 0 ? "var(--red)" : "var(--fg)") +
      '">' +
      fmFull(bal) +
      "</div>" +
      '<div class="acc-name">' +
      a.name +
      "</div>" +
      '<div class="acc-type">' +
      ACC_TYPES[a.type] +
      " " +
      (a.bank ? "· " + a.bank : "") +
      "</div>" +
      '<div style="margin-top:10px;font-size:11px;color:var(--fg3)"><i class="fa-solid fa-receipt" style="font-size:10px"></i> ' +
      txCount +
      " transaction" +
      (txCount !== 1 ? "s" : "") +
      "</div>" +
      "</div>"
    );
  }).join("");
}
function accTypeIcon(type) {
  var m = {
    checking: "building-columns",
    savings: "piggy-bank",
    credit: "credit-card",
    investment: "chart-line",
    cash: "money-bills",
    loan: "hand-holding-dollar",
    other: "wallet",
  };
  return m[type] || "wallet";
}
function showAccDetail(accId) {
  var acc = aObj(accId);
  if (!acc) return;
  // Push URL sub-view: #accounts/accId
  if (currentView === "accounts" && currentSubView !== accId) {
    nav("accounts", accId);
    return; // navRender will call showAccDetail(accId) again
  }
  document.getElementById("acc-detail-title").textContent =
    acc.name + " — Transactions";
  // Update page title for mobile
  document.getElementById("pg-title").textContent = acc.name;
  document.getElementById("pg-sub").textContent =
    (ACC_TYPES[acc.type] || "Account") + " · " + fmFull(accBalance(accId));
  _updateBackBtn("accounts", accId);
  var accTxs = T.filter(function (t) {
    return t.accountId === accId || t.toAccountId === accId;
  }).sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  var runBal = acc.startingBalance || 0;
  var rows = accTxs
    .slice()
    .reverse()
    .map(function (t) {
      var ct = cObj(t.categoryId);
      var type = t.txType || (ct ? ct.type : "expense");
      var isTo = t.toAccountId === accId && type === "transfer";
      if (isTo) runBal += t.amount;
      else if (type === "income") runBal += t.amount;
      else runBal -= t.amount;
      return { t: t, ct: ct, type: type, isTo: isTo, runBal: r2(runBal) };
    })
    .reverse();
  var tbody = document.getElementById("acc-detail-tbody");
  if (tbody)
    tbody.innerHTML = rows.length
      ? rows
          .map(function (x) {
            var amtClass =
              x.isTo || x.type === "income"
                ? "tx-inc"
                : x.type === "transfer"
                  ? "tx-trf"
                  : "tx-exp";
            var pfx = x.isTo || x.type === "income" ? "+" : "−";
            return (
              "<tr>" +
              '<td class="td-mono" style="font-size:12px">' +
              fmDate(x.t.date) +
              "</td>" +
              '<td><div style="font-weight:600">' +
              x.t.description +
              "</div></td>" +
              "<td>" +
              catChipHtml(x.ct) +
              "</td>" +
              '<td style="text-align:right"><span class="' +
              amtClass +
              '">' +
              pfx +
              fm(x.t.amount) +
              "</span></td>" +
              '<td style="text-align:right;font-family:var(--font);font-size:12px;color:' +
              (x.runBal >= 0 ? "var(--green)" : "var(--red)") +
              '">' +
              fmFull(x.runBal) +
              "</td>" +
              "</tr>"
            );
          })
          .join("")
      : '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--fg3)">No transactions for this account yet.</td></tr>';
  document.getElementById("acc-detail").style.display = "block";
  document.getElementById("acc-grid").style.display = "none";
  document.getElementById("acc-detail").scrollIntoView({ behavior: "smooth" });
}
function openAccM(editId) {
  clrErrs();
  editAccId = editId || null;
  document.getElementById("mo-acc-title").textContent = editId
    ? "Edit Account"
    : "Add Account";
  document.getElementById("acc-save-lbl").textContent = editId
    ? "Save Changes"
    : "Add Account";
  if (editId) {
    var a = aObj(editId);
    if (!a) return;
    accColor = a.color;
    document.getElementById("acc-id").value = a.id;
    document.getElementById("acc-name").value = a.name;
    document.getElementById("acc-type").value = a.type;
    document.getElementById("acc-balance").value = a.startingBalance || 0;
    document.getElementById("acc-bank").value = a.bank || "";
    document.getElementById("acc-note").value = a.note || "";
  } else {
    accColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    document.getElementById("acc-id").value = "";
    document.getElementById("acc-name").value = "";
    document.getElementById("acc-type").value = "checking";
    document.getElementById("acc-balance").value = "";
    document.getElementById("acc-bank").value = "";
    document.getElementById("acc-note").value = "";
  }
  renderColorPicker("acc-cpk", accColor, function (c) {
    accColor = c;
  });
  updCurrencySymbols();
  document.getElementById("mo-acc").classList.add("vis");
}
function closeAccM() {
  document.getElementById("mo-acc").classList.remove("vis");
  editAccId = null;
}
function saveAcc() {
  clrErrs();
  var name = document.getElementById("acc-name").value.trim();
  if (!name) {
    showErr("e-acc-name", "Account name required");
    return;
  }
  var obj = {
    id: editAccId || uid(),
    name: name,
    type: document.getElementById("acc-type").value,
    startingBalance:
      parseFloat(document.getElementById("acc-balance").value) || 0,
    bank: document.getElementById("acc-bank").value.trim(),
    note: document.getElementById("acc-note").value.trim(),
    color: accColor,
    createdAt: editAccId
      ? (aObj(editAccId) || {}).createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };
  if (editAccId)
    A = A.filter(function (a) {
      return a.id !== editAccId;
    });
  A.push(obj);
  save();
  closeAccM();
  toast(editAccId ? "Account updated" : "Account added", "ok");
  renderAccounts();
  if (currentView === "dashboard") renderDash();
}
function deleteAcc(id) {
  var tc = T.filter(function (t) {
    return t.accountId === id;
  }).length;
  if (tc > 0) {
    toast(
      "Cannot delete: " +
        tc +
        " transaction" +
        (tc !== 1 ? "s" : "") +
        " use this account. Delete or reassign them first.",
      "err",
    );
    return;
  }
  if (!confirm("Delete this account? This cannot be undone.")) return;
  A = A.filter(function (a) {
    return a.id !== id;
  });
  // Clean up recurring items referencing this account
  RC = RC.filter(function (r) {
    return r.accountId !== id;
  });
  save();
  toast("Account deleted", "inf");
  renderAccounts();
  if (currentView === "dashboard") renderDash();
}

// ══ Color Picker ══
function renderColorPicker(containerId, selected, onChange) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = COLORS.map(function (c) {
    var isSel = c === selected;
    return (
      '<button type="button" style="width:28px;height:28px;border-radius:50%;background:' +
      c +
      ";border:3px solid " +
      (isSel ? "var(--bg2)" : "transparent") +
      ";box-shadow:0 0 0 2px " +
      (isSel ? c : "transparent") +
      ";cursor:pointer;transition:all .15s\" onclick=\"(function(btn){var p=btn.closest('.cpk');p.querySelectorAll('button').forEach(function(b){b.style.border='3px solid transparent';b.style.boxShadow='none'});btn.style.border='3px solid var(--bg2)';btn.style.boxShadow='0 0 0 2px " +
      c +
      "'})(this);" +
      (onChange ? "_colorCb_" + containerId + "('" + c + "')" : "") +
      '"></button>'
    );
  }).join("");
  window["_colorCb_" + containerId] = onChange;
}

// ══════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════
function renderCategories() {
  var el = document.getElementById("cat-grid");
  if (!el) return;
  var inc = C.filter(function (c) {
    return c.type === "income";
  });
  var exp = C.filter(function (c) {
    return c.type === "expense";
  });
  function catList(cats, type) {
    if (!cats.length)
      return '<div style="font-size:12px;color:var(--fg3);padding:8px">None yet.</div>';
    return cats
      .map(function (c) {
        var txCount = T.filter(function (t) {
          return t.categoryId === c.id;
        }).length;
        return (
          '<div class="rc-item">' +
          '<div style="width:34px;height:34px;border-radius:10px;background:' +
          hexToRgba(c.color, 0.15) +
          ";color:" +
          c.color +
          ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid ' +
          (c.icon || "fa-tag") +
          '" style="font-size:13px"></i></div>' +
          '<div style="flex:1"><div style="font-weight:600;font-size:13px">' +
          c.name +
          '</div><div style="font-size:11px;color:var(--fg3);font-family:var(--font)">' +
          txCount +
          " transaction" +
          (txCount !== 1 ? "s" : "") +
          "</div></div>" +
          '<div class="fr" style="gap:4px">' +
          '<button class="btn xs" onclick="openCatM(\'' +
          c.id +
          '\')"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn xs danger" onclick="deleteCat(\'' +
          c.id +
          '\')"><i class="fa-solid fa-trash"></i></button>' +
          "</div></div>"
        );
      })
      .join("");
  }
  el.innerHTML =
    '<div class="cd"><div class="cd-hd"><div class="cd-title" style="color:var(--red)"><i class="fa-solid fa-arrow-down"></i> Expense (' +
    exp.length +
    ")</div></div>" +
    catList(exp, "expense") +
    "</div>" +
    '<div class="cd"><div class="cd-hd"><div class="cd-title" style="color:var(--green)"><i class="fa-solid fa-arrow-up"></i> Income (' +
    inc.length +
    ")</div></div>" +
    catList(inc, "income") +
    "</div>";
}
function openCatM(editId) {
  clrErrs();
  editCatId = editId || null;
  document.getElementById("mo-cat-title").textContent = editId
    ? "Edit Category"
    : "Add Category";
  document.getElementById("cat-save-lbl").textContent = editId
    ? "Save Changes"
    : "Add Category";
  if (editId) {
    var c = cObj(editId);
    if (!c) return;
    catColor = c.color;
    catIcon = c.icon || "fa-tag";
    document.getElementById("cat-id").value = c.id;
    document.getElementById("cat-name").value = c.name;
    document.getElementById("cat-type").value = c.type;
  } else {
    catColor = COLORS[0];
    catIcon = "fa-tag";
    document.getElementById("cat-id").value = "";
    document.getElementById("cat-name").value = "";
    document.getElementById("cat-type").value = "expense";
  }
  renderColorPicker("cat-cpk", catColor, function (c) {
    catColor = c;
  });
  renderIconGrid();
  document.getElementById("mo-cat").classList.add("vis");
}
function renderIconGrid() {
  var el = document.getElementById("cat-icon-grid");
  if (!el) return;
  el.innerHTML = ICONS.map(function (ic) {
    return (
      '<button type="button" class="icon-btn' +
      (ic === catIcon ? " sel" : "") +
      '" onclick="selectIcon(\'' +
      ic +
      '\')"><i class="fa-solid ' +
      ic +
      '"></i></button>'
    );
  }).join("");
}
function selectIcon(ic) {
  catIcon = ic;
  document.getElementById("cat-icon").value = ic;
  document.querySelectorAll(".icon-btn").forEach(function (b) {
    b.classList.remove("sel");
  });
  var sel = document.querySelector(".icon-btn[onclick*=\"'" + ic + "'\"]");
  if (sel) sel.classList.add("sel");
}
function closeCatM() {
  document.getElementById("mo-cat").classList.remove("vis");
  editCatId = null;
}
function saveCat() {
  clrErrs();
  var name = document.getElementById("cat-name").value.trim();
  if (!name) {
    showErr("e-cat-name", "Category name required");
    return;
  }
  var obj = {
    id: editCatId || uid(),
    name: name,
    type: document.getElementById("cat-type").value,
    color: catColor,
    icon: catIcon,
  };
  if (editCatId)
    C = C.filter(function (c) {
      return c.id !== editCatId;
    });
  C.push(obj);
  save();
  closeCatM();
  toast(editCatId ? "Category updated" : "Category added", "ok");
  renderCategories();
}
function deleteCat(id) {
  var tc = T.filter(function (t) {
    return t.categoryId === id;
  }).length;
  if (tc > 0) {
    toast(
      "Cannot delete: " +
        tc +
        " transaction" +
        (tc !== 1 ? "s" : "") +
        " use this category. Delete or reassign them first.",
      "err",
    );
    return;
  }
  if (!confirm("Delete this category?")) return;
  C = C.filter(function (c) {
    return c.id !== id;
  });
  // Clean up budget and recurring items tied to this category
  BG = BG.filter(function (b) {
    return b.categoryId !== id;
  });
  RC = RC.filter(function (r) {
    return r.categoryId !== id;
  });
  save();
  toast("Category deleted", "inf");
  renderCategories();
}

// ══════════════════════════════════════════════
//  BUDGET
// ══════════════════════════════════════════════
function renderBudget() {
  var el = document.getElementById("bud-grid");
  if (!el) return;
  if (!BG.length) {
    el.innerHTML =
      '<div class="emp" style="grid-column:1/-1;padding:60px"><div class="emp-ic"><i class="fa-solid fa-scale-balanced"></i></div><h3>No budgets set</h3><p>Set monthly limits to control your spending.</p><button class="btn-p" onclick="openBudM()"><i class="fa-solid fa-plus"></i> Set Budget</button></div>';
    return;
  }
  el.innerHTML = BG.map(function (bg) {
    var cat = cObj(bg.categoryId);
    if (!cat) return "";
    var y = currentYear,
      m = currentMonth;
    var spent = 0;
    T.forEach(function (t) {
      if (isMo(t, y, m) && t.categoryId === bg.categoryId) spent += t.amount;
    });
    var pct = Math.min(r2((spent / bg.limit) * 100), 100);
    var over = spent > bg.limit;
    var remain = r2(bg.limit - spent);
    var barColor = over ? "var(--red)" : pct > 85 ? "var(--amber)" : cat.color;
    var barClass = over ? "over" : pct > 85 ? "warning" : "";
    return (
      '<div class="bud-card">' +
      '<div class="fb" style="margin-bottom:12px">' +
      '<div class="fr" style="gap:9px">' +
      '<div style="width:34px;height:34px;border-radius:10px;background:' +
      hexToRgba(cat.color, 0.15) +
      ";color:" +
      cat.color +
      ';display:flex;align-items:center;justify-content:center"><i class="fa-solid ' +
      (cat.icon || "fa-tag") +
      '" style="font-size:13px"></i></div>' +
      '<div><div style="font-weight:700;font-size:14px">' +
      cat.name +
      '</div><div style="font-size:10px;color:var(--fg3);font-family:var(--font)">' +
      pct.toFixed(0) +
      "% USED" +
      (bg.rollover ? " · ROLLOVER" : "") +
      "</div></div>" +
      "</div>" +
      '<div class="fr" style="gap:5px">' +
      '<button class="btn xs" onclick="openBudM(\'' +
      bg.categoryId +
      '\')"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="btn xs danger" onclick="deleteBud(\'' +
      bg.categoryId +
      '\')"><i class="fa-solid fa-trash"></i></button>' +
      "</div>" +
      "</div>" +
      '<div class="prog" style="height:8px;margin-bottom:10px"><div class="prog-fill ' +
      barClass +
      '" style="width:' +
      pct +
      "%;background:" +
      barColor +
      '"></div></div>' +
      '<div class="fb"><span style="font-family:var(--font);font-size:13px;font-weight:700;color:' +
      (over ? "var(--red)" : "var(--fg)") +
      '">' +
      fm(spent) +
      " spent</span>" +
      '<span style="font-size:12px;color:' +
      (over ? "var(--red)" : "var(--fg3)") +
      '">' +
      (over ? "Over by " + fm(Math.abs(remain)) : fm(remain) + " left") +
      " / " +
      fm(bg.limit) +
      "</span></div>" +
      "</div>"
    );
  }).join("");
}
function openBudM(catId) {
  clrErrs();
  var sel = document.getElementById("bud-cat");
  sel.innerHTML =
    '<option value="">Select expense category…</option>' +
    C.filter(function (c) {
      return c.type === "expense";
    })
      .map(function (c) {
        return '<option value="' + c.id + '">' + c.name + "</option>";
      })
      .join("");
  if (catId) {
    sel.value = catId;
    sel.disabled = true;
    document.getElementById("bud-edit-cat").value = catId;
    var bg = BG.find(function (b) {
      return b.categoryId === catId;
    });
    if (bg) {
      document.getElementById("bud-limit").value = bg.limit;
      document.getElementById("bud-rollover").checked = bg.rollover || false;
    } else {
      document.getElementById("bud-limit").value = "";
      document.getElementById("bud-rollover").checked = false;
    }
    document.getElementById("mo-bud-title").textContent = "Edit Budget";
  } else {
    sel.disabled = false;
    document.getElementById("bud-edit-cat").value = "";
    document.getElementById("bud-limit").value = "";
    document.getElementById("bud-rollover").checked = false;
    document.getElementById("mo-bud-title").textContent = "Set Budget";
  }
  updCurrencySymbols();
  document.getElementById("mo-bud").classList.add("vis");
}
function closeBudM() {
  document.getElementById("mo-bud").classList.remove("vis");
  document.getElementById("bud-cat").disabled = false;
}
function saveBud() {
  clrErrs();
  var catId = document.getElementById("bud-cat").value;
  var limit = parseFloat(document.getElementById("bud-limit").value);
  if (!catId) {
    showErr("e-bud-cat", "Select a category");
    return;
  }
  if (!limit || limit <= 0) {
    showErr("e-bud-limit", "Enter a valid limit");
    return;
  }
  BG = BG.filter(function (b) {
    return b.categoryId !== catId;
  });
  BG.push({
    categoryId: catId,
    limit: r2(limit),
    rollover: document.getElementById("bud-rollover").checked,
  });
  save();
  closeBudM();
  toast("Budget saved", "ok");
  renderBudget();
}
function deleteBud(catId) {
  if (!confirm("Remove this budget?")) return;
  BG = BG.filter(function (b) {
    return b.categoryId !== catId;
  });
  save();
  toast("Budget removed", "inf");
  renderBudget();
}

// ══════════════════════════════════════════════
//  GOALS
// ══════════════════════════════════════════════
function renderGoals() {
  var el = document.getElementById("goal-grid");
  if (!el) return;
  if (!GL.length) {
    el.innerHTML =
      '<div class="emp" style="grid-column:1/-1;padding:60px"><div class="emp-ic"><i class="fa-solid fa-bullseye"></i></div><h3>No goals yet</h3><p>Set savings targets to track your progress.</p><button class="btn-p" onclick="openGoalM()"><i class="fa-solid fa-plus"></i> New Goal</button></div>';
    return;
  }
  el.innerHTML = GL.map(function (g) {
    var pct =
      g.target > 0 ? Math.min(r2((g.current / g.target) * 100), 100) : 0;
    var remain = r2(g.target - g.current);
    var daysLeft = "";
    if (g.targetDate) {
      var diff = Math.ceil(
        (new Date(g.targetDate + "T00:00:00") - new Date()) /
          (1000 * 60 * 60 * 24),
      );
      daysLeft = diff > 0 ? diff + " days left" : "Target reached!";
    }
    return (
      '<div class="goal-card">' +
      '<div class="fb" style="margin-bottom:14px">' +
      '<div class="fr" style="gap:10px">' +
      '<div style="width:40px;height:40px;border-radius:12px;background:' +
      hexToRgba(g.color, 0.15) +
      ";color:" +
      g.color +
      ';display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fa-solid ' +
      (g.icon || "fa-star") +
      '"></i></div>' +
      '<div><div style="font-family:var(--font);font-size:15px;font-weight:700">' +
      g.name +
      "</div>" +
      (daysLeft
        ? '<div style="font-size:11px;color:var(--fg3);font-family:var(--font)">' +
          daysLeft +
          "</div>"
        : "") +
      "</div>" +
      "</div>" +
      '<div class="fr" style="gap:4px">' +
      '<button class="btn xs" onclick="openGoalM(\'' +
      g.id +
      '\')"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="btn xs danger" onclick="deleteGoal(\'' +
      g.id +
      '\')"><i class="fa-solid fa-trash"></i></button>' +
      "</div>" +
      "</div>" +
      '<div class="prog" style="height:8px;margin-bottom:10px"><div class="prog-fill" style="width:' +
      pct +
      "%;background:" +
      g.color +
      '"></div></div>' +
      '<div class="fb">' +
      '<div><div style="font-family:var(--font);font-size:18px;font-weight:700">' +
      fm(g.current) +
      '</div><div style="font-size:11px;color:var(--fg3)">of ' +
      fm(g.target) +
      " target</div></div>" +
      '<div style="text-align:right"><div style="font-family:var(--font);font-size:14px;font-weight:700;color:' +
      g.color +
      '">' +
      pct.toFixed(0) +
      '%</div><div style="font-size:11px;color:var(--fg3)">' +
      (remain > 0 ? fm(remain) + " to go" : "🎉 Done!") +
      "</div></div>" +
      "</div>" +
      "</div>"
    );
  }).join("");
}
function openGoalM(editId) {
  clrErrs();
  editGoalId = editId || null;
  document.getElementById("mo-goal-title").textContent = editId
    ? "Edit Goal"
    : "New Goal";
  document.getElementById("goal-save-lbl").textContent = editId
    ? "Save Changes"
    : "Create Goal";
  goalColor = COLORS[2];
  if (editId) {
    var g = gObj(editId);
    if (!g) return;
    goalColor = g.color;
    document.getElementById("goal-id").value = g.id;
    document.getElementById("goal-name").value = g.name;
    document.getElementById("goal-target").value = g.target;
    document.getElementById("goal-current").value = g.current;
    document.getElementById("goal-date").value = g.targetDate || "";
    document.getElementById("goal-icon").value = g.icon || "fa-star";
  } else {
    document.getElementById("goal-id").value = "";
    document.getElementById("goal-name").value = "";
    document.getElementById("goal-target").value = "";
    document.getElementById("goal-current").value = "";
    document.getElementById("goal-date").value = "";
    document.getElementById("goal-icon").value = "fa-star";
  }
  renderColorPicker("goal-cpk", goalColor, function (c) {
    goalColor = c;
  });
  updCurrencySymbols();
  document.getElementById("mo-goal").classList.add("vis");
}
function closeGoalM() {
  document.getElementById("mo-goal").classList.remove("vis");
  editGoalId = null;
}
function saveGoal() {
  clrErrs();
  var name = document.getElementById("goal-name").value.trim();
  if (!name) {
    showErr("e-goal-name", "Goal name required");
    return;
  }
  var obj = {
    id: editGoalId || uid(),
    name: name,
    target: parseFloat(document.getElementById("goal-target").value) || 0,
    current: parseFloat(document.getElementById("goal-current").value) || 0,
    targetDate: document.getElementById("goal-date").value,
    icon: document.getElementById("goal-icon").value,
    color: goalColor,
  };
  if (editGoalId)
    GL = GL.filter(function (g) {
      return g.id !== editGoalId;
    });
  GL.push(obj);
  save();
  closeGoalM();
  toast(editGoalId ? "Goal updated" : "Goal created", "ok");
  renderGoals();
}
function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;
  GL = GL.filter(function (g) {
    return g.id !== id;
  });
  save();
  toast("Goal deleted", "inf");
  renderGoals();
}

// ══════════════════════════════════════════════
//  RECURRING
// ══════════════════════════════════════════════
function renderRecurring() {
  var el = document.getElementById("rc-list");
  if (!el) return;
  if (!RC.length) {
    el.innerHTML =
      '<div class="emp" style="padding:40px"><div class="emp-ic"><i class="fa-solid fa-rotate"></i></div><h3>No recurring</h3><p>Track subscriptions and regular payments.</p></div>';
  } else {
    el.innerHTML = RC.map(function (r) {
      var cat = cObj(r.categoryId);
      var acc = aObj(r.accountId);
      var freqColors = {
        daily: "var(--red)",
        weekly: "var(--amber)",
        biweekly: "var(--amber)",
        monthly: "var(--accent)",
        quarterly: "var(--green)",
        yearly: "var(--green)",
      };
      var fc = freqColors[r.frequency] || "var(--accent)";
      return (
        '<div class="rc-item">' +
        '<div style="width:34px;height:34px;border-radius:10px;background:' +
        (cat ? hexToRgba(cat.color, 0.15) : "var(--ac2)") +
        ";color:" +
        (cat ? cat.color : "var(--accent)") +
        ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid ' +
        (cat ? cat.icon || "fa-tag" : "fa-rotate") +
        '"></i></div>' +
        '<div style="flex:1">' +
        '<div style="font-weight:600;font-size:13px">' +
        r.name +
        "</div>" +
        '<div style="font-size:11px;color:var(--fg3)"><span style="color:' +
        fc +
        ';font-weight:600;text-transform:capitalize">' +
        r.frequency +
        "</span>" +
        (acc ? " · " + acc.name : "") +
        " · Next: " +
        fmDate(r.nextDate) +
        "</div>" +
        "</div>" +
        '<div style="font-family:var(--font);font-size:13px;font-weight:700;color:' +
        (r.type === "income" ? "var(--green)" : "var(--red)") +
        '">' +
        (r.type === "income" ? "+" : "−") +
        fm(r.amount) +
        "</div>" +
        '<div class="fr" style="gap:4px;margin-left:8px">' +
        '<button class="btn xs" onclick="openRcM(\'' +
        r.id +
        '\')"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn xs danger" onclick="deleteRc(\'' +
        r.id +
        '\')"><i class="fa-solid fa-trash"></i></button>' +
        "</div></div></div>"
      );
    }).join("");
  }
  // Summary
  var totExp = RC.filter(function (r) {
    return r.type === "expense";
  }).reduce(function (s, r) {
    return (
      s +
      (r.frequency === "monthly"     ? r.amount
        : r.frequency === "yearly"      ? r.amount / 12
        : r.frequency === "halfyearly"  ? r.amount / 6
        : r.frequency === "quarterly"   ? r.amount / 3
        : r.frequency === "weekly"      ? r.amount * 4.33
        : r.frequency === "biweekly"    ? r.amount * 2.17
        : r.frequency === "daily"       ? r.amount * 30
        : r.amount)
    );
  }, 0);
  var totInc = RC.filter(function (r) {
    return r.type === "income";
  }).reduce(function (s, r) {
    return s + r.amount;
  }, 0);
  var sm = document.getElementById("rc-summary");
  if (sm)
    sm.innerHTML =
      '<div class="fb" style="margin-bottom:10px"><span style="font-size:13px;font-weight:600">Monthly Recurring</span></div>' +
      '<div class="fr" style="gap:14px;margin-bottom:8px"><div><div style="font-family:var(--font);font-size:18px;font-weight:700;color:var(--red)">' +
      fm(totExp) +
      '</div><div style="font-size:11px;color:var(--fg3)">Total expenses/mo</div></div></div>' +
      '<div style="font-size:12px;color:var(--fg3)">' +
      RC.length +
      " scheduled transaction" +
      (RC.length !== 1 ? "s" : "") +
      "</div>";
}
function updateRcCats() {
  var type = document.getElementById("rc-type").value;
  var sel = document.getElementById("rc-cat");
  sel.innerHTML =
    '<option value="">Select…</option>' +
    C.filter(function (c) {
      return c.type === type;
    })
      .map(function (c) {
        return '<option value="' + c.id + '">' + c.name + "</option>";
      })
      .join("");
}
function openRcM(editId) {
  clrErrs();
  editRcId = editId || null;
  document.getElementById("mo-rc-title").textContent = editId
    ? "Edit Recurring"
    : "Add Recurring";
  document.getElementById("rc-save-lbl").textContent = editId
    ? "Save Changes"
    : "Add Recurring";
  var accSel = document.getElementById("rc-acc");
  accSel.innerHTML =
    '<option value="">Select…</option>' +
    A.map(function (a) {
      return '<option value="' + a.id + '">' + a.name + "</option>";
    }).join("");
  if (editId) {
    var r = rcObj(editId);
    if (!r) return;
    document.getElementById("rc-id").value = r.id;
    document.getElementById("rc-name").value = r.name;
    document.getElementById("rc-amount").value = r.amount;
    document.getElementById("rc-type").value = r.type;
    document.getElementById("rc-freq").value = r.frequency;
    document.getElementById("rc-next").value = r.nextDate || today();
    updateRcCats();
    document.getElementById("rc-cat").value = r.categoryId || "";
    accSel.value = r.accountId || "";
  } else {
    document.getElementById("rc-id").value = "";
    document.getElementById("rc-name").value = "";
    document.getElementById("rc-amount").value = "";
    document.getElementById("rc-type").value = "expense";
    document.getElementById("rc-freq").value = "monthly";
    document.getElementById("rc-next").value = today();
    updateRcCats();
  }
  updCurrencySymbols();
  document.getElementById("mo-rc").classList.add("vis");
}
function closeRcM() {
  document.getElementById("mo-rc").classList.remove("vis");
  editRcId = null;
}
function saveRc() {
  clrErrs();
  var name = document.getElementById("rc-name").value.trim();
  if (!name) { showErr("e-rc-name", "Name required"); return; }
  var freq    = document.getElementById("rc-freq").value || "monthly";
  var nextRaw = document.getElementById("rc-next").value;
  var todayStr = new Date().toISOString().split("T")[0];
  // Default to today if empty
  if (!nextRaw) nextRaw = todayStr;
  // If next date is in the past, advance to next occurrence
  if (nextRaw < todayStr && typeof window.calcNextDate === "function") {
    nextRaw = window.calcNextDate(todayStr, freq);
  }
  var amount = parseFloat(document.getElementById("rc-amount").value) || 0;
  if (!amount) { showErr("e-rc-amount", "Amount required"); return; }
  var obj = {
    id:         editRcId || uid(),
    name:       name,
    amount:     r2(amount),
    type:       document.getElementById("rc-type").value,
    categoryId: document.getElementById("rc-cat").value,
    accountId:  document.getElementById("rc-acc").value,
    frequency:  freq,
    nextDate:   nextRaw,
  };
  if (editRcId) RC = RC.filter(function(r){ return r.id !== editRcId; });
  RC.push(obj);
  save();
  closeRcM();
  toast(editRcId ? "Recurring updated" : "Recurring added", "ok");
  renderRecurring();
}
function deleteRc(id) {
  if (!confirm("Delete this recurring transaction?")) return;
  RC = RC.filter(function (r) {
    return r.id !== id;
  });
  save();
  toast("Recurring deleted", "inf");
  renderRecurring();
}

// ══════════════════════════════════════════════
//  REPORTS
// ══════════════════════════════════════════════
var curReportTab = "overview";
function switchReportTab(tab) {
  curReportTab = tab;
  var rptView = document.getElementById("view-reports");
  if (rptView) {
    rptView.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.remove("on");
    });
    var tabs = ["overview", "spending", "income", "cashflow", "net"];
    var idx = tabs.indexOf(tab);
    var tabBtns = rptView.querySelectorAll(".tab-btn");
    if (tabBtns[idx]) tabBtns[idx].classList.add("on");
  }
  document.querySelectorAll(".tab-pane").forEach(function (p) {
    p.classList.remove("on");
  });
  var pane = document.getElementById("rpt-" + tab);
  if (pane) pane.classList.add("on");
  // Update URL to reflect current tab (replace, not push)
  if (currentView === "reports") {
    var hash = buildHash("reports", null, { tab: tab });
    history.replaceState(
      { view: "reports", sub: null, extra: { tab: tab } },
      "",
      hash,
    );
  }
  renderReportTab(tab);
}
function renderReports() {
  renderReportTab(curReportTab);
}
function renderReportTab(tab) {
  var y = currentYear,
    m = currentMonth;
  if (tab === "overview") {
    // Bar: 6 month
    var labs = [],
      incArr = [],
      expArr = [];
    for (var i = -5; i <= 0; i++) {
      var d2 = new Date(y, m + i, 1);
      labs.push(d2.toLocaleDateString("en-US", { month: "short" }));
      incArr.push(moIncome(d2.getFullYear(), d2.getMonth()));
      expArr.push(moExpense(d2.getFullYear(), d2.getMonth()));
    }
    mkChart("rpt-c1", {
      type: "bar",
      data: {
        labels: labs,
        datasets: [
          {
            label: "Income",
            data: incArr,
            backgroundColor: hexToRgba("#2de2c2", 0.75),
            borderRadius: 6,
          },
          {
            label: "Expense",
            data: expArr,
            backgroundColor: hexToRgba("#ff5f87", 0.75),
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              color: chText(),
              usePointStyle: true,
              boxWidth: 8,
              padding: 14,
            },
          },
        },
        scales: {
          x: { ticks: { color: chText() }, grid: { color: chGrid() } },
          y: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
        },
      },
    });
    // Donut
    var catTots = {};
    T.forEach(function (t) {
      if (!isMo(t, y, m)) return;
      var ct = cObj(t.categoryId);
      if (!ct || ct.type !== "expense") return;
      catTots[ct.id] = (catTots[ct.id] || 0) + t.amount;
    });
    var sorted = Object.keys(catTots)
      .map(function (k) {
        return { cat: cObj(k), v: catTots[k] };
      })
      .filter(function (x) {
        return x.cat;
      })
      .sort(function (a, b) {
        return b.v - a.v;
      })
      .slice(0, 8);
    if (sorted.length) {
      mkChart("rpt-c2", {
        type: "doughnut",
        data: {
          labels: sorted.map(function (x) {
            return x.cat.name;
          }),
          datasets: [
            {
              data: sorted.map(function (x) {
                return x.v;
              }),
              backgroundColor: sorted.map(function (x) {
                return x.cat.color;
              }),
              borderWidth: 2,
              borderColor: isDark() ? "#13161f" : "#fff",
              hoverOffset: 6,
            },
          ],
        },
        options: {
          cutout: "68%",
          plugins: {
            legend: {
              display: true,
              position: "right",
              labels: {
                color: chText(),
                usePointStyle: true,
                boxWidth: 8,
                padding: 10,
                font: { size: 11 },
              },
            },
          },
        },
      });
    }
    // Category table
    var allCats = C.map(function (c) {
      var txs = T.filter(function (t) {
        return isMo(t, y, m) && t.categoryId === c.id;
      });
      var total = txs.reduce(function (s, t) {
        return s + t.amount;
      }, 0);
      return { c: c, txs: txs, total: total };
    })
      .filter(function (x) {
        return x.total > 0;
      })
      .sort(function (a, b) {
        return b.total - a.total;
      });
    var grandTotal = allCats.reduce(function (s, x) {
      return s + x.total;
    }, 0);
    var tbody = document.getElementById("rpt-tbody");
    if (tbody)
      tbody.innerHTML = allCats
        .map(function (x) {
          var pct = grandTotal > 0 ? r2((x.total / grandTotal) * 100) : 0;
          return (
            "<tr>" +
            "<td>" +
            catChipHtml(x.c) +
            "</td>" +
            '<td style="font-size:12px;color:var(--fg3);text-transform:capitalize">' +
            x.c.type +
            "</td>" +
            '<td class="td-mono" style="font-size:12px">' +
            x.txs.length +
            "</td>" +
            '<td style="text-align:right;font-family:var(--font);font-weight:700;color:' +
            (x.c.type === "income" ? "var(--green)" : "var(--red)") +
            '">' +
            fm(x.total) +
            "</td>" +
            '<td style="text-align:right;font-size:12px;color:var(--fg3)">' +
            pct.toFixed(1) +
            "%</td>" +
            "</tr>"
          );
        })
        .join("");
  }
  if (tab === "spending") {
    // Top categories horizontal bar
    var catArr = C.filter(function (c) {
      return c.type === "expense";
    })
      .map(function (c) {
        var total = T.filter(function (t) {
          return isMo(t, y, m) && t.categoryId === c.id;
        }).reduce(function (s, t) {
          return s + t.amount;
        }, 0);
        return { c: c, total: total };
      })
      .filter(function (x) {
        return x.total > 0;
      })
      .sort(function (a, b) {
        return b.total - a.total;
      })
      .slice(0, 8);
    mkChart("rpt-c3", {
      type: "bar",
      data: {
        labels: catArr.map(function (x) {
          return x.c.name;
        }),
        datasets: [
          {
            data: catArr.map(function (x) {
              return x.total;
            }),
            backgroundColor: catArr.map(function (x) {
              return hexToRgba(x.c.color, 0.8);
            }),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
          y: {
            ticks: { color: chText(), font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
    // Daily spending
    var days = {};
    var dInMonth = new Date(y, m + 1, 0).getDate();
    for (var di = 1; di <= dInMonth; di++) days[di] = 0;
    T.forEach(function (t) {
      if (!isMo(t, y, m)) return;
      var ct = cObj(t.categoryId);
      if (!ct || ct.type !== "expense") return;
      var day = parseInt(t.date.split("-")[2]);
      if (days[day] !== undefined) days[day] += t.amount;
    });
    var dayKeys = Object.keys(days)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
    mkChart("rpt-c4", {
      type: "line",
      data: {
        labels: dayKeys.map(function (d) {
          return "" + d;
        }),
        datasets: [
          {
            data: dayKeys.map(function (d) {
              return days[d];
            }),
            borderColor: "var(--red)",
            backgroundColor: hexToRgba("#ff5f87", 0.08),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "var(--red)",
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: chText() }, grid: { color: chGrid() } },
          y: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
        },
      },
    });
  }
  if (tab === "income") {
    var incCats = C.filter(function (c) {
      return c.type === "income";
    })
      .map(function (c) {
        var total = T.filter(function (t) {
          return isMo(t, y, m) && t.categoryId === c.id;
        }).reduce(function (s, t) {
          return s + t.amount;
        }, 0);
        return { c: c, total: total };
      })
      .filter(function (x) {
        return x.total > 0;
      });
    if (incCats.length) {
      mkChart("rpt-c5", {
        type: "doughnut",
        data: {
          labels: incCats.map(function (x) {
            return x.c.name;
          }),
          datasets: [
            {
              data: incCats.map(function (x) {
                return x.total;
              }),
              backgroundColor: incCats.map(function (x) {
                return x.c.color;
              }),
              borderWidth: 2,
              borderColor: isDark() ? "#13161f" : "#fff",
              hoverOffset: 6,
            },
          ],
        },
        options: {
          cutout: "65%",
          plugins: {
            legend: {
              display: true,
              position: "right",
              labels: {
                color: chText(),
                usePointStyle: true,
                boxWidth: 8,
                padding: 10,
              },
            },
          },
        },
      });
    }
    var incTrend = [],
      incLabs2 = [];
    for (var ii = -11; ii <= 0; ii++) {
      var dd = new Date(y, m + ii, 1);
      incLabs2.push(dd.toLocaleDateString("en-US", { month: "short" }));
      incTrend.push(moIncome(dd.getFullYear(), dd.getMonth()));
    }
    mkChart("rpt-c6", {
      type: "line",
      data: {
        labels: incLabs2,
        datasets: [
          {
            data: incTrend,
            borderColor: "var(--green)",
            backgroundColor: hexToRgba("#2de2c2", 0.08),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "var(--green)",
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: chText() }, grid: { color: chGrid() } },
          y: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
        },
      },
    });
  }
  if (tab === "cashflow") {
    var cfLabs = [],
      cfInc = [],
      cfExp = [],
      cfNet = [];
    for (var ci = -11; ci <= 0; ci++) {
      var cd = new Date(y, m + ci, 1);
      cfLabs.push(cd.toLocaleDateString("en-US", { month: "short" }));
      var cInc = moIncome(cd.getFullYear(), cd.getMonth());
      var cExp = moExpense(cd.getFullYear(), cd.getMonth());
      cfInc.push(cInc);
      cfExp.push(cExp);
      cfNet.push(r2(cInc - cExp));
    }
    mkChart("rpt-c7", {
      type: "bar",
      data: {
        labels: cfLabs,
        datasets: [
          {
            label: "Income",
            data: cfInc,
            backgroundColor: hexToRgba("#2de2c2", 0.65),
            borderRadius: 4,
          },
          {
            label: "Expense",
            data: cfExp,
            backgroundColor: hexToRgba("#ff5f87", 0.65),
            borderRadius: 4,
          },
          {
            label: "Net",
            data: cfNet,
            type: "line",
            borderColor: "var(--accent)",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "var(--accent)",
            tension: 0.35,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              color: chText(),
              usePointStyle: true,
              boxWidth: 8,
              padding: 14,
            },
          },
        },
        scales: {
          x: { ticks: { color: chText() }, grid: { color: chGrid() } },
          y: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
        },
      },
    });
  }
  if (tab === "net") {
    var nwLabs = [],
      nwVals = [];
    for (var ni = -11; ni <= 0; ni++) {
      var nd = new Date(y, m + ni, 1);
      nwLabs.push(nd.toLocaleDateString("en-US", { month: "short" }));
      // Approximate: current NW minus future savings
      var futureMonths = -ni;
      var adjustment = 0;
      for (var fi = 0; fi < futureMonths; fi++) {
        var fmd = new Date(y, m - fi, 1);
        adjustment -= moSavings(fmd.getFullYear(), fmd.getMonth());
      }
      nwVals.push(r2(totalNetWorth() + adjustment));
    }
    mkChart("rpt-c8", {
      type: "line",
      data: {
        labels: nwLabs,
        datasets: [
          {
            data: nwVals,
            borderColor: "var(--accent)",
            backgroundColor: hexToRgba("#7c6dfa", 0.1),
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "var(--accent)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: chText() }, grid: { color: chGrid() } },
          y: {
            ticks: {
              color: chText(),
              callback: function (v) {
                return fm(v);
              },
            },
            grid: { color: chGrid() },
          },
        },
      },
    });
  }
}

// ══════════════════════════════════════════════
//  INSIGHTS
// ══════════════════════════════════════════════
function renderInsights() {
  var y = currentYear,
    m = currentMonth;
  var py = y,
    pm = m - 1;
  if (pm < 0) {
    pm = 11;
    py--;
  }
  var inc = moIncome(y, m),
    exp = moExpense(y, m),
    sav = moSavings(y, m);
  var prevInc = moIncome(py, pm),
    prevExp = moExpense(py, pm);
  var nw = totalNetWorth();
  var savRate = inc > 0 ? Math.max(0, r2((sav / inc) * 100)) : 0; // Savings rate: what % of income you kept

  // Top spending category
  var catSpend = {};
  T.forEach(function (t) {
    if (!isMo(t, y, m)) return;
    var ct = cObj(t.categoryId);
    if (ct && ct.type === "expense")
      catSpend[ct.id] = (catSpend[ct.id] || 0) + t.amount;
  });
  var topCat = null,
    topAmt = 0;
  Object.keys(catSpend).forEach(function (id) {
    if (catSpend[id] > topAmt) {
      topAmt = catSpend[id];
      topCat = cObj(id);
    }
  });

  // Budget overages
  var overBudgets = BG.filter(function (bg) {
    var spent = 0;
    T.forEach(function (t) {
      if (isMo(t, y, m) && t.categoryId === bg.categoryId) spent += t.amount;
    });
    return spent > bg.limit;
  });

  // Avg daily spend
  var d = new Date();
  var dayOfMonth =
    d.getMonth() === m && d.getFullYear() === y
      ? d.getDate()
      : new Date(y, m + 1, 0).getDate();
  var avgDaily = dayOfMonth > 0 ? r2(exp / dayOfMonth) : 0;

  var insights = [
    {
      ic: "fa-chart-line",
      color: "var(--accent)",
      bg: "var(--ac2)",
      title: "Savings Rate",
      body:
        "You saved " +
        savRate.toFixed(1) +
        "% of your income this month. " +
        (savRate >= 20
          ? "Excellent! Above the recommended 20%."
          : savRate >= 10
            ? "Good progress! Try to reach 20%."
            : "Consider reducing expenses to boost savings."),
    },
    {
      ic: "fa-fire",
      color: "var(--red)",
      bg: "var(--red2)",
      title: "Top Expense",
      body: topCat
        ? 'Your highest spend category is <strong style="color:var(--fg)">' +
          topCat.name +
          '</strong> at <strong style="color:var(--red)">' +
          fm(topAmt) +
          "</strong> this month."
        : "No expense data for this month yet.",
    },
    {
      ic: "fa-calendar-day",
      color: "var(--amber)",
      bg: "var(--amber2)",
      title: "Daily Average",
      body:
        'You spend an average of <strong style="color:var(--fg)">' +
        fm(avgDaily) +
        '</strong> per day this month. Projected monthly: <strong style="color:var(--fg)">' +
        fm(avgDaily * 30) +
        "</strong>.",
    },
    {
      ic: "fa-trophy",
      color: "var(--green)",
      bg: "var(--green2)",
      title: "vs Last Month",
      body:
        "Income " +
        (inc >= prevInc ? "increased" : "decreased") +
        " by <strong>" +
        fm(Math.abs(inc - prevInc)) +
        "</strong>. Expenses " +
        (exp <= prevExp ? "decreased (great!)" : "increased") +
        " by <strong>" +
        fm(Math.abs(exp - prevExp)) +
        "</strong>.",
    },
  ];

  var el = document.getElementById("insights-grid");
  if (!el) return;
  el.innerHTML = insights
    .map(function (ins) {
      return (
        '<div class="insight-card">' +
        '<div class="insight-ic" style="background:' +
        ins.bg +
        ";color:" +
        ins.color +
        '"><i class="fa-solid ' +
        ins.ic +
        '"></i></div>' +
        "<div><h4>" +
        ins.title +
        "</h4><p>" +
        ins.body +
        "</p></div>" +
        "</div>"
      );
    })
    .join("");

  // Recommendations
  var recs = [];
  if (savRate < 10)
    recs.push({
      ic: "fa-piggy-bank",
      clr: "var(--green)",
      text:
        "<strong>Boost your savings</strong> — Your " +
        savRate.toFixed(0) +
        "% rate is below optimal. Try automating a fixed amount each month into savings.",
    });
  if (overBudgets.length)
    recs.push({
      ic: "fa-triangle-exclamation",
      clr: "var(--red)",
      text:
        "<strong>Budget overrun</strong> — You've exceeded " +
        overBudgets.length +
        " budget" +
        (overBudgets.length > 1 ? "s" : "") +
        ". Review your spending in " +
        overBudgets
          .map(function (b) {
            var c = cObj(b.categoryId);
            return c ? c.name : "";
          })
          .join(", ") +
        ".",
    });
  if (RC.length > 0) {
    var rcTotal = RC.reduce(function (s, r) {
      return s + (r.type === "expense" ? r.amount : 0);
    }, 0);
    recs.push({
      ic: "fa-rotate",
      clr: "var(--accent)",
      text:
        "<strong>Recurring costs</strong> — You have <strong>" +
        fm(rcTotal) +
        "</strong>/month in scheduled recurring expenses across " +
        RC.filter(function (r) {
          return r.type === "expense";
        }).length +
        " subscriptions.",
    });
  }
  if (GL.length) {
    var nearGoals = GL.filter(function (g) {
      return g.target > 0 && g.current / g.target >= 0.8;
    });
    if (nearGoals.length)
      recs.push({
        ic: "fa-star",
        clr: "var(--amber)",
        text:
          "<strong>Almost there!</strong> — You're 80%+ of the way to your goal: <strong>" +
          nearGoals
            .map(function (g) {
              return g.name;
            })
            .join(", ") +
          "</strong>.",
      });
  }
  if (!recs.length)
    recs.push({
      ic: "fa-check-circle",
      clr: "var(--green)",
      text: "<strong>Looking good!</strong> — Your finances are on track. Keep maintaining your budget discipline.",
    });

  var recEl = document.getElementById("insights-recs");
  if (!recEl) return;
  var recAccentMap = {
    "fa-piggy-bank": "#2de2c2",
    "fa-triangle-exclamation": "#ff5f87",
    "fa-rotate": "#7c6dfa",
    "fa-star": "#f9bc41",
    "fa-check-circle": "#2de2c2",
  };
  recEl.innerHTML = recs
    .map(function (r) {
      var hexClr = recAccentMap[r.ic] || "#7c6dfa";
      return (
        '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr)">' +
        '<div style="width:32px;height:32px;border-radius:9px;background:' +
        hexToRgba(hexClr, 0.15) +
        ";color:" +
        r.clr +
        ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid ' +
        r.ic +
        '"></i></div>' +
        '<p style="font-size:13px;color:var(--fg2);line-height:1.6;padding-top:2px">' +
        r.text +
        "</p>" +
        "</div>"
      );
    })
    .join("");
}

// ══════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════
function getNotifs() {
  var notifs = [];
  var y = currentYear,
    m = currentMonth;
  BG.forEach(function (bg) {
    var spent = 0;
    T.forEach(function (t) {
      if (isMo(t, y, m) && t.categoryId === bg.categoryId) spent += t.amount;
    });
    if (spent > bg.limit) {
      var c = cObj(bg.categoryId);
      notifs.push({
        type: "err",
        icon: "fa-triangle-exclamation",
        title: "Budget Exceeded",
        body:
          (c ? c.name : "Category") + " over budget by " + fm(spent - bg.limit),
      });
    } else if (spent / bg.limit > 0.85) {
      var c2 = cObj(bg.categoryId);
      notifs.push({
        type: "wrn",
        icon: "fa-exclamation-circle",
        title: "Budget Alert",
        body:
          (c2 ? c2.name : "Category") +
          " at " +
          Math.round((spent / bg.limit) * 100) +
          "% of limit",
      });
    }
  });
  RC.forEach(function (r) {
    if (!r.nextDate) return;
    var next = new Date(r.nextDate + "T00:00:00");
    var now = new Date();
    var diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 3)
      notifs.push({
        type: "inf",
        icon: "fa-rotate",
        title: "Recurring Due Soon",
        body: r.name + " due in " + diff + " day" + (diff !== 1 ? "s" : ""),
      });
  });
  return notifs;
}
function updNotifDot() {
  var notifs = getNotifs();
  var dot = document.getElementById("notif-dot");
  if (dot) dot.style.display = notifs.length ? "block" : "none";
}
function openNotifPanel() {
  var notifs = getNotifs();
  var el = document.getElementById("notif-list");
  if (!el) return;
  if (!notifs.length) {
    el.innerHTML =
      '<div class="emp" style="padding:40px"><div class="emp-ic"><i class="fa-solid fa-bell-slash"></i></div><p>No notifications</p></div>';
  } else {
    var typeColors = {
      ok: "var(--green)",
      err: "var(--red)",
      wrn: "var(--amber)",
      inf: "var(--accent)",
    };
    el.innerHTML = notifs
      .map(function (n) {
        return (
          '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--bdr)">' +
          '<div style="width:34px;height:34px;border-radius:10px;background:' +
          hexToRgba(typeColors[n.type] || "#7c6dfa", 0.15) +
          ";color:" +
          (typeColors[n.type] || "var(--accent)") +
          ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid ' +
          n.icon +
          '"></i></div>' +
          '<div><div style="font-weight:600;font-size:13px">' +
          n.title +
          '</div><div style="font-size:12px;color:var(--fg3);margin-top:2px">' +
          n.body +
          "</div></div>" +
          "</div>"
        );
      })
      .join("");
  }
  document.getElementById("mo-notif").classList.add("vis");
}
function closeNotifPanel() {
  document.getElementById("mo-notif").classList.remove("vis");
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
function renderSettings() {
  var cur = document.getElementById("s-currency");
  if (cur) cur.value = PR.currency || "$";
  var dfmt = document.getElementById("s-dateformat");
  if (dfmt) dfmt.value = PR.dateFormat || "MM/DD/YYYY";
  var nm = document.getElementById("s-name");
  if (nm) nm.value = PR.name || "";
  var tg = document.getElementById("theme-toggle");
  var anEl = document.getElementById("s-analytics");
  if (anEl) anEl.checked = (PR.analyticsEnabled !== false);
  if (tg) {
    tg.checked = PR.theme === "light";
    // Sync body class in case of mismatch
    if (PR.theme === "light") document.body.classList.add("light");
    else document.body.classList.remove("light");
  }
  updStorageInfo();
}

// ══ EXPORT / IMPORT ══
function exportData() {
  if (!A.length && !C.length && !T.length) {
    toast("No data to export", "err");
    return;
  }
  var d = JSON.stringify(
    {
      accounts: A,
      categories: C,
      transactions: T,
      budgets: BG,
      goals: GL,
      recurring: RC,
      prefs: PR,
      exportedAt: new Date().toISOString(),
      version: "2.0",
    },
    null,
    2,
  );
  var blob = new Blob([d], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "finflow-backup-" + today() + ".json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Backup exported!", "ok");
}
function exportCSV() {
  if (!T.length) {
    toast("No transactions to export", "err");
    return;
  }
  var rows = [
    [
      "Date",
      "Description",
      "Type",
      "Category",
      "Account",
      "Amount",
      "Tags",
      "Note",
    ],
  ];
  T.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  }).forEach(function (t) {
    var ct = cObj(t.categoryId),
      ac = aObj(t.accountId);
    var type = t.txType || (ct ? ct.type : "expense");
    rows.push([
      t.date,
      '"' + (t.description || "").replace(/"/g, '""') + '"',
      type,
      ct ? ct.name : "",
      ac ? ac.name : "",
      (type === "income" ? "" : "-") + t.amount,
      t.tags || "",
      '"' + (t.note || "").replace(/"/g, '""') + '"',
    ]);
  });
  var csv = rows
    .map(function (r) {
      return r.join(",");
    })
    .join("\n");
  var blob = new Blob([csv], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "finflow-transactions-" + today() + ".csv";
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV exported!", "ok");
}
function importData(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (!Array.isArray(d.accounts) || !Array.isArray(d.transactions))
        throw new Error("Invalid format");
      A = d.accounts;
      C = d.categories || [];
      T = d.transactions;
      BG = d.budgets || [];
      GL = d.goals || [];
      RC = d.recurring || [];
      if (d.prefs) PR = Object.assign(PR, d.prefs);
      save();
      toast(
        "Imported: " + A.length + " accounts, " + T.length + " transactions",
        "ok",
        5000,
      );
      nav("dashboard");
    } catch (err) {
      toast("Import failed: " + err.message, "err", 5000);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}
function clearAll() {
  if (!clrOk) {
    clrOk = true;
    toast("Click Erase again to permanently delete everything", "wrn", 4000);
    setTimeout(function () {
      clrOk = false;
    }, 4000);
    return;
  }
  clrOk = false;
  ["ff_a", "ff_c", "ff_t", "ff_bg", "ff_gl", "ff_rc"].forEach(function (k) {
    try {
      LS.removeItem(k);
    } catch (e) {}
  });
  A = [];
  C = [];
  T = [];
  BG = [];
  GL = [];
  RC = [];
  save();
  toast("All data erased", "inf");
  nav("dashboard");
}
function seedSampleData() {
  C = [
    { id:"c1",  name:"Groceries",     type:"expense", icon:"fa-basket-shopping", color:"#10b981" },
    { id:"c2",  name:"Dining Out",    type:"expense", icon:"fa-utensils",        color:"#f97316" },
    { id:"c3",  name:"Transport",     type:"expense", icon:"fa-car",             color:"#06b6d4" },
    { id:"c4",  name:"Utilities",     type:"expense", icon:"fa-bolt",            color:"#eab308" },
    { id:"c5",  name:"Entertainment", type:"expense", icon:"fa-gamepad",         color:"#a855f7" },
    { id:"c6",  name:"Health",        type:"expense", icon:"fa-heart-pulse",     color:"#ef4444" },
    { id:"c7",  name:"Shopping",      type:"expense", icon:"fa-bag-shopping",    color:"#ec4899" },
    { id:"c8",  name:"Rent",          type:"expense", icon:"fa-house",           color:"#64748b" },
    { id:"c9",  name:"Salary",        type:"income",  icon:"fa-sack-dollar",     color:"#22c55e" },
    { id:"c10", name:"Freelance",     type:"income",  icon:"fa-laptop",          color:"#3b82f6" },
    { id:"c11", name:"Transfer",      type:"expense", icon:"fa-right-left",      color:"#94a3b8" },
  ];
  A = [
    { id:"a1", name:"Main Bank",   type:"checking", balance:42000, bank:"HDFC", color:"#5b52f0" },
    { id:"a2", name:"Savings",     type:"savings",  balance:85000, bank:"SBI",  color:"#10b981" },
    { id:"a3", name:"Cash Wallet", type:"cash",     balance:2500,  bank:"",     color:"#f97316" },
  ];
  var now=new Date(), y=now.getFullYear(), mo=now.getMonth();
  var pm=mo===0?11:mo-1, py=mo===0?y-1:y;
  function sd(yr,mn,dy){ return yr+"-"+String(mn+1).padStart(2,"0")+"-"+String(dy).padStart(2,"0"); }
  T = [
    {id:uid(),type:"income", amount:55000,desc:"Monthly Salary",    categoryId:"c9", accountId:"a1",date:sd(y,mo,1)},
    {id:uid(),type:"income", amount:8000, desc:"Freelance Design",  categoryId:"c10",accountId:"a1",date:sd(y,mo,5)},
    {id:uid(),type:"expense",amount:18000,desc:"Rent",              categoryId:"c8", accountId:"a1",date:sd(y,mo,2)},
    {id:uid(),type:"expense",amount:4200, desc:"Groceries",         categoryId:"c1", accountId:"a1",date:sd(y,mo,4)},
    {id:uid(),type:"expense",amount:1800, desc:"Restaurant",        categoryId:"c2", accountId:"a1",date:sd(y,mo,6)},
    {id:uid(),type:"expense",amount:2100, desc:"Electricity + Net", categoryId:"c4", accountId:"a1",date:sd(y,mo,7)},
    {id:uid(),type:"expense",amount:850,  desc:"Auto + Metro",      categoryId:"c3", accountId:"a3",date:sd(y,mo,9)},
    {id:uid(),type:"expense",amount:3500, desc:"Shopping",          categoryId:"c7", accountId:"a1",date:sd(y,mo,14)},
    {id:uid(),type:"expense",amount:600,  desc:"Streaming",         categoryId:"c5", accountId:"a1",date:sd(y,mo,15)},
    {id:uid(),type:"expense",amount:1200, desc:"Groceries",         categoryId:"c1", accountId:"a1",date:sd(y,mo,12)},
    {id:uid(),type:"income", amount:55000,desc:"Monthly Salary",    categoryId:"c9", accountId:"a1",date:sd(py,pm,1)},
    {id:uid(),type:"expense",amount:18000,desc:"Rent",              categoryId:"c8", accountId:"a1",date:sd(py,pm,2)},
    {id:uid(),type:"expense",amount:3900, desc:"Groceries",         categoryId:"c1", accountId:"a1",date:sd(py,pm,5)},
    {id:uid(),type:"expense",amount:2200, desc:"Dining Out",        categoryId:"c2", accountId:"a1",date:sd(py,pm,8)},
    {id:uid(),type:"expense",amount:2100, desc:"Utilities",         categoryId:"c4", accountId:"a1",date:sd(py,pm,7)},
    {id:uid(),type:"expense",amount:4800, desc:"Doctor Visit",      categoryId:"c6", accountId:"a1",date:sd(py,pm,18)},
    {id:uid(),type:"expense",amount:1100, desc:"Transport",         categoryId:"c3", accountId:"a3",date:sd(py,pm,20)},
  ];
  BG = [
    {categoryId:"c1",amount:7000},{categoryId:"c2",amount:3000},
    {categoryId:"c3",amount:2000},{categoryId:"c4",amount:2500},
    {categoryId:"c5",amount:1000},{categoryId:"c8",amount:20000},
  ];
  GL = [
    {id:uid(),name:"Emergency Fund",target:150000,saved:85000,icon:"fa-shield-heart",color:"#10b981"},
    {id:uid(),name:"Vacation - Goa",target:30000, saved:8000, icon:"fa-plane",       color:"#5b52f0"},
    {id:uid(),name:"New Laptop",    target:80000, saved:22000,icon:"fa-laptop",      color:"#f97316"},
  ];
  SV = [
    {id:uid(), amount:8000,  description:"Emergency Fund deposit", date:sd(py,pm,15), categoryId:"c9",  note:"Monthly savings"},
    {id:uid(), amount:5000,  description:"Vacation fund",          date:sd(py,pm,28), categoryId:"c10", note:""},
    {id:uid(), amount:12000, description:"Emergency Fund deposit", date:sd(y,mo,1),   categoryId:"c9",  note:""},
    {id:uid(), amount:5000,  description:"Laptop fund",            date:sd(y,mo,10),  categoryId:"c10", note:""},
  ];
  save();
}
function resetSeedData() {
  if (!confirm("Load sample data? Replaces all current data with realistic demo content."))
    return;
  A = []; T = []; BG = []; GL = []; RC = []; C = []; SV = [];
  save();
  seedSampleData();
  if (typeof updCurrencySymbols === "function") updCurrencySymbols();
  toast("Sample data loaded! Explore your dashboard.", "ok", 4000);
  nav("dashboard", null, null, true);
}

// ══════════════════════════════════════════════
//  GLOBAL SEARCH
// ══════════════════════════════════════════════
var searchDebounce = null;
document
  .getElementById("global-search")
  .addEventListener("input", function (e) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      doSearch(e.target.value);
    }, 200);
  });
document.getElementById("global-search").addEventListener("focus", function () {
  if (this.value)
    document.getElementById("search-results").style.display = "block";
});
document.addEventListener("click", function (e) {
  if (!e.target.closest(".gsearch-wrap"))
    document.getElementById("search-results").style.display = "none";
});
function doSearch(q) {
  var res = document.getElementById("search-results");
  if (!q || q.length < 2) {
    res.style.display = "none";
    return;
  }
  q = q.toLowerCase();
  var results = [];
  T.filter(function (t) {
    return (
      (t.description + " " + (t.tags || "") + " " + (t.note || ""))
        .toLowerCase()
        .indexOf(q) !== -1
    );
  })
    .slice(0, 5)
    .forEach(function (t) {
      var ct = cObj(t.categoryId);
      var type = t.txType || (ct ? ct.type : "expense");
      results.push({
        icon: "fa-receipt",
        title: t.description,
        sub:
          fmDate(t.date) +
          " · " +
          (ct ? ct.name : "—") +
          " · " +
          (type === "income" ? "+" : type === "transfer" ? "↔" : "−") +
          fm(t.amount),
        action: function () {
          nav("transactions");
        },
      });
    });
  A.filter(function (a) {
    return a.name.toLowerCase().indexOf(q) !== -1;
  })
    .slice(0, 3)
    .forEach(function (a) {
      results.push({
        icon: "fa-vault",
        title: a.name,
        sub: ACC_TYPES[a.type] + " · " + fm(accBalance(a.id)),
        action: (function (id) {
          return function () {
            nav("accounts", id);
          };
        })(a.id),
      });
    });
  if (!results.length) {
    res.innerHTML =
      '<div class="sr-item"><div class="sr-main" style="color:var(--fg3)">No results</div></div>';
    res.style.display = "block";
    return;
  }
  res.innerHTML = results
    .map(function (r, i) {
      return (
        '<div class="sr-item" onclick="srClick(' +
        i +
        ')">' +
        '<div class="sr-main"><i class="fa-solid ' +
        r.icon +
        '" style="color:var(--p);margin-right:7px"></i>' +
        r.title +
        "</div>" +
        '<div class="sr-sub">' +
        r.sub +
        "</div>" +
        "</div>"
      );
    })
    .join("");
  res.style.display = "block";
  res._results = results;
}
function srClick(i) {
  var res = document.getElementById("search-results");
  if (res._results && res._results[i]) {
    res._results[i].action();
    res.style.display = "none";
    document.getElementById("global-search").value = "";
  }
}

// ══════════════════════════════════════════════
//  DEFAULT DATA
//  Seeds default categories only on first run.
//  No demo accounts, transactions, or personal data.
//  Users start with a clean slate.
// ══════════════════════════════════════════════
function seedData() {
  // Only seed categories if user has none yet — never overwrites existing data
  if (C.length) return;
  C = [
    {
      id: uid(),
      name: "Groceries",
      type: "expense",
      icon: "fa-basket-shopping",
      color: "#10b981",
    },
    {
      id: uid(),
      name: "Dining Out",
      type: "expense",
      icon: "fa-utensils",
      color: "#f97316",
    },
    {
      id: uid(),
      name: "Transport",
      type: "expense",
      icon: "fa-car",
      color: "#06b6d4",
    },
    {
      id: uid(),
      name: "Utilities",
      type: "expense",
      icon: "fa-bolt",
      color: "#eab308",
    },
    {
      id: uid(),
      name: "Entertainment",
      type: "expense",
      icon: "fa-gamepad",
      color: "#a855f7",
    },
    {
      id: uid(),
      name: "Health",
      type: "expense",
      icon: "fa-heart-pulse",
      color: "#ef4444",
    },
    {
      id: uid(),
      name: "Shopping",
      type: "expense",
      icon: "fa-bag-shopping",
      color: "#ec4899",
    },
    {
      id: uid(),
      name: "Rent / Housing",
      type: "expense",
      icon: "fa-house",
      color: "#8b5cf6",
    },
    {
      id: uid(),
      name: "Education",
      type: "expense",
      icon: "fa-graduation-cap",
      color: "#3b82f6",
    },
    {
      id: uid(),
      name: "Travel",
      type: "expense",
      icon: "fa-plane",
      color: "#14b8a6",
    },
    {
      id: uid(),
      name: "Subscriptions",
      type: "expense",
      icon: "fa-rotate",
      color: "#6366f1",
    },
    {
      id: uid(),
      name: "Other",
      type: "expense",
      icon: "fa-circle-dot",
      color: "#78716c",
    },
    {
      id: uid(),
      name: "Salary",
      type: "income",
      icon: "fa-sack-dollar",
      color: "#22c55e",
    },
    {
      id: uid(),
      name: "Freelance",
      type: "income",
      icon: "fa-laptop",
      color: "#4f46e5",
    },
    {
      id: uid(),
      name: "Business",
      type: "income",
      icon: "fa-briefcase",
      color: "#0ea5e9",
    },
    {
      id: uid(),
      name: "Investment",
      type: "income",
      icon: "fa-chart-line",
      color: "#f59e0b",
    },
    {
      id: uid(),
      name: "Other Income",
      type: "income",
      icon: "fa-circle-plus",
      color: "#84cc16",
    },
  ];
  save();
}
// ══════════════════════════════════════════════
//  RIPPLE EFFECT
// ══════════════════════════════════════════════
(function () {
  function addRipple(e) {
    var el = e.currentTarget;
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 2;
    var x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    var y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.cssText =
      "width:" +
      size +
      "px;height:" +
      size +
      "px;left:" +
      x +
      "px;top:" +
      y +
      "px;";
    el.appendChild(ripple);
    setTimeout(function () {
      ripple.remove();
    }, 600);
  }
  // Apply to interactive elements after DOM ready
  function applyRipples() {
    document.querySelectorAll(".btn-p,.qb.primary").forEach(function (el) {
      if (!el._ripple) {
        el._ripple = true;
        el.addEventListener("pointerdown", addRipple);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", applyRipples);
  // Re-apply after nav renders (for dynamically created buttons)
  var _origNavRender = window.navRender;
  window._applyRippleAfterNav = applyRipples;
})();

// ══════════════════════════════════════════════
//  PWA
// ══════════════════════════════════════════════
// (defined in wrapper layer)

// (PWA events handled in wrapper layer)

// ══ OFFLINE ══
(function () {
  function updOnline() {
    var b = document.getElementById("offline-banner");
    if (!b) return;
    var isOffline = !navigator.onLine;
    b.classList.toggle("show", isOffline);
    if (isOffline) {
      toast("You're offline — all your data is still available", "wrn", 4000);
    } else {
      toast("Back online", "ok", 2000);
    }
  }
  window.addEventListener("online", updOnline);
  window.addEventListener("offline", updOnline);
  // Don't call updOnline on init (no toast on load)
  var b = document.getElementById("offline-banner");
  if (b) b.classList.toggle("show", !navigator.onLine);
})();

// ══ SERVICE WORKER ══
(function () {
  if (!("serviceWorker" in navigator)) return;
  // Use external sw.js when served over HTTP (production)
  if (location.protocol !== "file:") {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then(function (r) {
        console.log("[FinFlow] SW registered, scope:", r.scope);
      })
      .catch(function (e) {
        console.warn("[FinFlow] SW failed:", e.message);
      });
    return;
  }
  // Fallback: inline blob SW for file:// opening
  var pageUrl = location.href.replace(/#.*$/, "");
  var swCode = [
    "var CACHE_NAME = 'finflow-v3.5';",
    "var URLS_TO_CACHE = ['" + pageUrl + "'];",
    "self.addEventListener('install', function(e) {",
    "  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {",
    "    return cache.addAll(URLS_TO_CACHE).catch(function(){});",
    "  })); self.skipWaiting();",
    "});",
    "self.addEventListener('activate', function(e) {",
    "  e.waitUntil(caches.keys().then(function(ks) {",
    "    return Promise.all(ks.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));",
    "  })); self.clients.claim();",
    "});",
    "self.addEventListener('fetch', function(e) {",
    "  if (e.request.method !== 'GET') return;",
    "  e.respondWith(caches.match(e.request).then(function(cached) {",
    "    var net = fetch(e.request).then(function(r) {",
    "      if (r && r.ok) { var cl=r.clone(); caches.open(CACHE_NAME).then(function(c){c.put(e.request,cl);}); }",
    "      return r;",
    "    }).catch(function(){ return cached; });",
    "    return cached || net;",
    "  }));",
    "});",
  ].join("\n");
  try {
    var blob = new Blob([swCode], { type: "application/javascript" });
    navigator.serviceWorker
      .register(URL.createObjectURL(blob), { scope: "./" })
      .then(function (reg) {
        console.log("[FinFlow] Blob SW registered");
      })
      .catch(function (err) {
        console.warn("[FinFlow] SW failed (expected on file://):", err.message);
      });
  } catch (e) {}
})();

// ══ SWIPE TO CLOSE MODALS (mobile) ══
(function () {
  var startY = 0,
    startScrollTop = 0,
    isDragging = false,
    activeModal = null;
  document.addEventListener(
    "touchstart",
    function (e) {
      var mo = e.target.closest(".mo-box");
      if (!mo) return;
      var moWrap = mo.parentElement;
      if (!moWrap || !moWrap.classList.contains("vis")) return;
      // Only allow drag from the handle area (top 50px) or when scrolled to top
      if (
        e.touches[0].clientY - mo.getBoundingClientRect().top > 60 &&
        mo.scrollTop > 0
      )
        return;
      startY = e.touches[0].clientY;
      startScrollTop = mo.scrollTop;
      isDragging = true;
      activeModal = moWrap;
      mo._dragEl = mo;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    function (e) {
      if (!isDragging || !activeModal) return;
      var mo = activeModal.querySelector(".mo-box");
      if (!mo) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 0 && mo.scrollTop <= 0) {
        mo.style.transform = "translateY(" + Math.min(dy * 0.5, 120) + "px)";
        mo.style.transition = "none";
        mo.style.opacity = Math.max(0.5, 1 - dy / 400);
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!isDragging || !activeModal) return;
      var mo = activeModal.querySelector(".mo-box");
      isDragging = false;
      if (!mo) {
        activeModal = null;
        return;
      }
      var dy = e.changedTouches[0].clientY - startY;
      mo.style.transition = "";
      mo.style.opacity = "";
      if (dy > 90) {
        mo.style.transform = "translateY(100%)";
        setTimeout(function () {
          activeModal.classList.remove("vis");
          mo.style.transform = "";
          editTxId = editAccId = editCatId = editGoalId = editRcId = null;
        }, 250);
      } else {
        mo.style.transform = "";
      }
      activeModal = null;
    },
    { passive: true },
  );
})();

// ══ KEYBOARD SHORTCUTS ══
// Keyboard handler: see consolidated module at end of this file

// ══ MODAL BACKDROP CLOSE ══
document.querySelectorAll(".mo").forEach(function (mo) {
  mo.addEventListener("click", function (e) {
    if (e.target === mo) {
      mo.classList.remove("vis");
      editTxId = editAccId = editCatId = editGoalId = editRcId = null;
    }
  });
});

// ══ PREVENT BODY SCROLL WHEN MODAL OPEN ══
var _moObserver = new MutationObserver(function () {
  var open = document.querySelector(".mo.vis");
  document.body.style.overflow = open ? "hidden" : "";
});
_moObserver.observe(document.body, {
  subtree: true,
  attributes: true,
  attributeFilter: ["class"],
});

// ══ INIT ══
(function () {
  try {
    load();
    initTheme();
    updateMonthLabel();
    seedData();
    updCurrencySymbols();

    // Read URL hash to restore view on load/refresh
    var parsed = parseHash(location.hash);
    var startView = PAGE_META[parsed.view] ? parsed.view : "dashboard";
    var startSub = parsed.sub || null;
    var startExtra = parsed.query || {};

    history.replaceState(
      { view: startView, sub: startSub, extra: startExtra },
      "",
      buildHash(
        startView,
        startSub,
        Object.keys(startExtra).length ? startExtra : null,
      ),
    );

    _applyNav(startView, startSub, startExtra);
    updNotifDot();
    updStorageInfo();

    // Welcome / greeting
    setTimeout(function () {
      var name = PR.name ? ", " + PR.name : "";
      var hr = new Date().getHours();
      var greet =
        hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
      var hasData = A.length > 0 || T.length > 0;
      if (hasData) {
        var dn = new Date().toLocaleDateString("en-US", { weekday: "long" });
        toast(
          greet + name + " — Happy " + dn + ". Data is private & on device.",
          "inf",
          4200,
        );
      } else {
        toast(
          "Welcome to FinFlow! Start by adding an account in Accounts.",
          "inf",
          5500,
        );
      }
    }, 600);

    // Performance: preload chart.js if not loaded
    if (typeof Chart === "undefined") {
      var sc = document.createElement("script");
      sc.src =
        "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
      document.head.appendChild(sc);
    }
  } catch (e) {
    console.error("Init error:", e);
    document.getElementById("content").innerHTML =
      '<div class="emp" style="padding:80px">' +
      '<div class="emp-ic"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
      "<h3>Startup Error</h3>" +
      '<p>Try clearing localStorage and refreshing.<br><small style="font-family:var(--font);color:var(--red)">' +
      e.message +
      "</small></p>" +
      '<button class="btn-p" style="margin-top:16px" onclick="localStorage.clear();location.reload()">Reset & Reload</button>' +
      "</div>";
  }
})();

/* =================================================================
   /* =================================================================
   SECTION 3 — POST-ENGINE PATCHES + FEATURES
   Command Palette · Keyboard Panel · Ripple · Haptics · Swipe
   Shortcuts · Animations · Tutorial · Nav sync · UX upgrades
================================================================= */

/* ═══════════════════════════════════════════════════════════
   FINFLOW v3.2 — NEW FEATURES BLOCK
   Command Palette · Keyboard Panel · Enhanced Shortcuts
   Performance · Accessibility · UX upgrades
═══════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────────────
//  TUTORIAL SYSTEM
// ──────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────
//  VIEW INFO SYSTEM
// ──────────────────────────────────────────────────────────
var VIEW_INFO = {
  dashboard: {
    icon: "fa-house",
    title: "Home Dashboard",
    color: "var(--accent-h)",
    features: [
      {
        ic: "fa-wallet",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Your Total Balance",
        desc: "Sum of all your account balances — your real net worth",
      },
      {
        ic: "fa-arrow-down",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Spent / Received",
        desc: "This month's spending vs income at a glance",
      },
      {
        ic: "fa-chart-pie",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Spending Breakdown",
        desc: "Donut chart showing which categories cost the most",
      },
      {
        ic: "fa-clock-rotate-left",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Recent Activity",
        desc: "Your last 8 transactions, newest first",
      },
    ],
    tip: "Use ← → arrow keys to browse previous months. The hero card shows your real-time net worth.",
  },
  transactions: {
    icon: "fa-list-ul",
    title: "Transactions",
    color: "var(--green)",
    features: [
      {
        ic: "fa-arrow-down",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Spent (Expense)",
        desc: "Money you paid out — groceries, bills, shopping",
      },
      {
        ic: "fa-arrow-up",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Got Paid (Income)",
        desc: "Money received — salary, freelance, gifts",
      },
      {
        ic: "fa-right-left",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Transfer",
        desc: "Moving money between your own accounts — not income or expense",
      },
      {
        ic: "fa-filter",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Filters",
        desc: "Filter by type, category, account, or search by keyword",
      },
      {
        ic: "fa-file-csv",
        bg: "var(--sky2)",
        cl: "var(--sky)",
        label: "Export CSV",
        desc: "Download all transactions as a spreadsheet",
      },
    ],
    tip: "Tap any row to edit. Use ⌘+N to quickly add a new transaction from anywhere.",
  },
  accounts: {
    icon: "fa-vault",
    title: "Accounts",
    color: "var(--sky)",
    features: [
      {
        ic: "fa-building-columns",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Checking",
        desc: "Your everyday bank account for daily spending",
      },
      {
        ic: "fa-piggy-bank",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Savings",
        desc: "Money set aside — emergency fund, goals, etc.",
      },
      {
        ic: "fa-credit-card",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Credit Card",
        desc: "Enter starting balance as negative (what you owe)",
      },
      {
        ic: "fa-chart-line",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Investment",
        desc: "Stocks, mutual funds, pension accounts",
      },
    ],
    tip: "Tap any account card to see its full transaction history with running balance.",
  },
  budget: {
    icon: "fa-scale-balanced",
    title: "Budgets",
    color: "var(--amber)",
    features: [
      {
        ic: "fa-circle-check",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Green bar (Safe)",
        desc: "Spending is within limit — you're on track",
      },
      {
        ic: "fa-triangle-exclamation",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Yellow stripes (Warning)",
        desc: "Over 85% of limit used — start being careful",
      },
      {
        ic: "fa-circle-xmark",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Red bar (Over budget)",
        desc: "You've exceeded the limit for this category",
      },
      {
        ic: "fa-rotate",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Rollover",
        desc: "Unspent budget carries over to next month's limit",
      },
    ],
    tip: "Set limits per category. Budgets reset on the 1st of each month unless rollover is enabled.",
  },
  goals: {
    icon: "fa-bullseye",
    title: "Savings Goals",
    color: "var(--purple)",
    features: [
      {
        ic: "fa-plane",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Vacation / Travel",
        desc: "Save toward trips and experiences",
      },
      {
        ic: "fa-shield-heart",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Emergency Fund",
        desc: "Recommended: 3–6 months of expenses",
      },
      {
        ic: "fa-house",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Big Purchases",
        desc: "House down payment, car, electronics",
      },
      {
        ic: "fa-calendar",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Target Date",
        desc: "Set a deadline to stay motivated",
      },
    ],
    tip: 'Update the "Already Saved" amount manually as you save. Goals are visual milestones, not linked to accounts automatically.',
  },
  recurring: {
    icon: "fa-rotate",
    title: "Recurring Payments",
    color: "var(--sky)",
    features: [
      {
        ic: "fa-calendar-check",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Subscriptions",
        desc: "Netflix, Spotify, gym — monthly recurring expenses",
      },
      {
        ic: "fa-house",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Bills & Rent",
        desc: "Electricity, water, internet, rent payments",
      },
      {
        ic: "fa-sack-dollar",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Income",
        desc: "Regular salary, rent received, pension income",
      },
      {
        ic: "fa-bell",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Due Alerts",
        desc: "Alerts appear when a payment is due within 3 days",
      },
    ],
    tip: "Recurring items are reminders only — they don't auto-add transactions. Record each payment manually in Transactions.",
  },
  categories: {
    icon: "fa-tags",
    title: "Categories",
    color: "var(--green)",
    features: [
      {
        ic: "fa-arrow-down",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Money Out (Expense)",
        desc: "Groceries, dining, transport, shopping, bills",
      },
      {
        ic: "fa-arrow-up",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Money In (Income)",
        desc: "Salary, freelance work, investments, gifts",
      },
      {
        ic: "fa-palette",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Color & Icon",
        desc: "Personalize each category for quick visual recognition",
      },
      {
        ic: "fa-chart-pie",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Used in Reports",
        desc: "Categories power all charts and spending analysis",
      },
    ],
    tip: 'Create specific categories like "Coffee", "Fuel", "Salary" for accurate spending reports.',
  },
  reports: {
    icon: "fa-chart-line",
    title: "Reports",
    color: "var(--sky)",
    features: [
      {
        ic: "fa-chart-bar",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Overview",
        desc: "6-month income vs spending bars + category breakdown table",
      },
      {
        ic: "fa-chart-pie",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Spending",
        desc: "Top spending categories + daily spending pattern",
      },
      {
        ic: "fa-arrow-trend-up",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Income",
        desc: "Income sources and month-over-month trend",
      },
      {
        ic: "fa-water",
        bg: "var(--sky2)",
        cl: "var(--sky)",
        label: "Cash Flow",
        desc: "12-month money in vs out timeline",
      },
      {
        ic: "fa-chart-area",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Net Worth",
        desc: "How your total balance has changed over time",
      },
    ],
    tip: "Use ← → to browse different months. All charts update based on the selected month/year.",
  },
  insights: {
    icon: "fa-lightbulb",
    title: "Smart Insights",
    color: "var(--amber)",
    features: [
      {
        ic: "fa-chart-line",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Savings Rate",
        desc: "% of income you saved. Target: 20%+ is excellent",
      },
      {
        ic: "fa-fire",
        bg: "var(--red2)",
        cl: "var(--red)",
        label: "Top Expense",
        desc: "The category where you're spending the most this month",
      },
      {
        ic: "fa-calendar-day",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Daily Average",
        desc: "Average daily spend + projected monthly total",
      },
      {
        ic: "fa-trophy",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "Month Comparison",
        desc: "How this month compares to last month in income & expenses",
      },
      {
        ic: "fa-lightbulb",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Personalised Tips",
        desc: "Smart recommendations based on your spending patterns",
      },
    ],
    tip: "Insights are generated from your real data — the more transactions you record, the more accurate they become.",
  },
  settings: {
    icon: "fa-gear",
    title: "Settings",
    color: "var(--fg2)",
    features: [
      {
        ic: "fa-palette",
        bg: "var(--ac2)",
        cl: "var(--accent-h)",
        label: "Appearance",
        desc: "Dark/light mode, currency symbol, date format",
      },
      {
        ic: "fa-database",
        bg: "var(--amber2)",
        cl: "var(--amber)",
        label: "Backup & Restore",
        desc: "Export JSON backup or restore from a previous backup file",
      },
      {
        ic: "fa-file-csv",
        bg: "var(--green2)",
        cl: "var(--green)",
        label: "CSV Export",
        desc: "Download all transactions as a spreadsheet for Excel/Sheets",
      },
      {
        ic: "fa-brands fa-github",
        bg: "var(--sky2)",
        cl: "var(--sky)",
        label: "Deploy to Web",
        desc: "Host your private FinFlow on GitHub Pages for free",
      },
      {
        ic: "fa-shield-check",
        bg: "var(--purple2)",
        cl: "var(--purple)",
        label: "Privacy",
        desc: "100% local — no account, no cloud, no data ever leaves your device",
      },
    ],
    tip: "Export a backup before clearing data or switching devices. Use the Deploy Guide to host your own instance.",
  },
  savings: {
    icon: "fa-piggy-bank",
    title: "Savings",
    color: "var(--green)",
    features: [
      { ic: "fa-plus",        bg: "var(--green2)", cl: "var(--green)", label: "Track Savings",   desc: "Record every amount you set aside" },
      { ic: "fa-calendar",    bg: "var(--ac2)",    cl: "var(--accent-h)", label: "Monthly View", desc: "Browse savings by month" },
      { ic: "fa-tags",        bg: "var(--amber2)", cl: "var(--amber)", label: "Categories",     desc: "Categorize your savings entries" },
      { ic: "fa-chart-line",  bg: "var(--green2)", cl: "var(--green)", label: "Dashboard Total", desc: "See total savings in the stat card" },
    ],
    tip: "Add a savings entry each time you deposit to an emergency fund, vacation pot, or any savings goal.",
  },
};

function showViewInfo(viewKey) {
  var key =
    viewKey || (typeof currentView !== "undefined" ? currentView : "dashboard");
  var info = VIEW_INFO[key];
  if (!info) return;

  var iconEl = document.getElementById("info-icon");
  var titleTextEl = document.getElementById("info-title-text");
  var bodyEl = document.getElementById("info-body");

  if (!iconEl || !titleTextEl || !bodyEl) return;

  iconEl.className = "fa-solid " + info.icon;
  iconEl.style.color = info.color;
  titleTextEl.textContent = info.title;

  var html = "";

  // Feature rows
  info.features.forEach(function (f) {
    var iconClass = f.ic.startsWith("fa-brands")
      ? f.ic.replace("fa-brands ", "")
      : "fa-solid " + f.ic;
    var prefix = f.ic.startsWith("fa-brands") ? "fa-brands" : "fa-solid";
    html +=
      '<div class="info-feature-row">' +
      '<div class="info-feature-ic" style="background:' +
      f.bg +
      ";color:" +
      f.cl +
      '">' +
      '<i class="' +
      prefix +
      " " +
      (f.ic.startsWith("fa-brands") ? f.ic.split(" ")[1] : f.ic) +
      '"></i>' +
      "</div>" +
      "<div><strong>" +
      f.label +
      '</strong><br><span style="color:var(--fg3)">' +
      f.desc +
      "</span></div>" +
      "</div>";
  });

  // Tip
  html +=
    '<div class="info-tip"><i class="fa-solid fa-lightbulb"></i><span>' +
    info.tip +
    "</span></div>";

  bodyEl.innerHTML = html;
  document.getElementById("mo-info").classList.add("vis");

  // Haptic
  if (navigator.vibrate) navigator.vibrate(8);
}

// ──────────────────────────────────────────────────────────
//  COMMAND PALETTE  (Ctrl/⌘+K or /)
// ──────────────────────────────────────────────────────────
(function () {
  var cmdOpen = false;
  var cmdSelected = 0;
  var cmdItems = [];

  var COMMANDS = [
    // Navigation
    {
      ic: "fa-house",
      label: "Go to Home",
      sub: "Dashboard overview",
      action: function () {
        nav("dashboard");
      },
    },
    {
      ic: "fa-list-ul",
      label: "Go to Transactions",
      sub: "View & filter all transactions",
      action: function () {
        nav("transactions");
      },
    },
    {
      ic: "fa-vault",
      label: "Go to Accounts",
      sub: "Your bank accounts & balances",
      action: function () {
        nav("accounts");
      },
    },
    {
      ic: "fa-scale-balanced",
      label: "Go to Budgets",
      sub: "Monthly spending limits",
      action: function () {
        nav("budget");
      },
    },
    {
      ic: "fa-bullseye",
      label: "Go to Goals",
      sub: "Savings targets & progress",
      action: function () {
        nav("goals");
      },
    },
    {
      ic: "fa-rotate",
      label: "Go to Recurring",
      sub: "Subscriptions & scheduled bills",
      action: function () {
        nav("recurring");
      },
    },
    {
      ic: "fa-tags",
      label: "Go to Categories",
      sub: "Organize your transactions",
      action: function () {
        nav("categories");
      },
    },
    {
      ic: "fa-chart-line",
      label: "Go to Reports",
      sub: "Charts & financial analysis",
      action: function () {
        nav("reports");
      },
    },
    {
      ic: "fa-lightbulb",
      label: "Go to Insights",
      sub: "Smart tips from your data",
      action: function () {
        nav("insights");
      },
    },
    {
      ic: "fa-gear",
      label: "Go to Settings",
      sub: "Preferences, backup, themes",
      action: function () {
        nav("settings");
      },
    },
    // Actions
    {
      ic: "fa-plus",
      label: "Add Transaction",
      sub: "Record income, expense or transfer",
      action: function () {
        openTxM();
      },
    },
    {
      ic: "fa-building-columns",
      label: "Add Account",
      sub: "Add a bank, savings or cash account",
      action: function () {
        openAccM();
      },
    },
    {
      ic: "fa-scale-balanced",
      label: "Set Budget",
      sub: "Create a monthly spending limit",
      action: function () {
        openBudM();
      },
    },
    {
      ic: "fa-star",
      label: "New Savings Goal",
      sub: "Set a target to save toward",
      action: function () {
        openGoalM();
      },
    },
    {
      ic: "fa-rotate",
      label: "Add Recurring",
      sub: "Track subscription or regular bill",
      action: function () {
        openRcM();
      },
    },
    {
      ic: "fa-tags",
      label: "Add Category",
      sub: "Create a new transaction category",
      action: function () {
        openCatM();
      },
    },
    // Theme & UI
    {
      ic: "fa-circle-half-stroke",
      label: "Toggle Theme",
      sub: "Switch dark / light mode",
      action: function () {
        toggleTheme();
      },
    },
    {
      ic: "fa-sidebar",
      label: "Toggle Sidebar",
      sub: "Show or hide the sidebar",
      action: function () {
        toggleSidebar();
      },
    },
    {
      ic: "fa-keyboard",
      label: "Keyboard Shortcuts",
      sub: "View all keyboard shortcuts",
      action: function () {
        openKbdPanel();
      },
    },
    {
      ic: "fa-graduation-cap",
      label: "Open Tutorial",
      sub: "7-step walkthrough for new users",
      action: function () {
        showTutorial();
      },
    },
    // Data
    {
      ic: "fa-download",
      label: "Export JSON Backup",
      sub: "Download all data as JSON",
      action: function () {
        exportData();
      },
    },
    {
      ic: "fa-file-csv",
      label: "Export CSV",
      sub: "Download transactions as spreadsheet",
      action: function () {
        exportCSV();
      },
    },
    {
      ic: "fa-print",
      label: "Print Report",
      sub: "Print the current view",
      action: function () {
        window.print();
      },
    },
    // Months
    {
      ic: "fa-chevron-left",
      label: "Previous Month",
      sub: "Go back one month",
      action: function () {
        changeMonth(-1);
      },
    },
    {
      ic: "fa-chevron-right",
      label: "Next Month",
      sub: "Go forward one month",
      action: function () {
        changeMonth(1);
      },
    },
  ];

  function openCmd() {
    var pal = document.getElementById("cmd-palette");
    if (!pal) return;
    cmdOpen = true;
    cmdSelected = 0;
    pal.classList.add("vis");
    document.body.style.overflow = "hidden";
    var inp = document.getElementById("cmd-input");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    renderCmd("");
    if (navigator.vibrate) navigator.vibrate(8);
  }
  function closeCmd() {
    var pal = document.getElementById("cmd-palette");
    if (pal) pal.classList.remove("vis");
    cmdOpen = false;
    document.body.style.overflow = "";
  }
  function renderCmd(q) {
    var res = document.getElementById("cmd-results");
    if (!res) return;
    q = (q || "").toLowerCase().trim();
    cmdItems = q
      ? COMMANDS.filter(function (c) {
          return (c.label + " " + c.sub).toLowerCase().indexOf(q) !== -1;
        })
      : COMMANDS;
    if (!cmdItems.length) {
      res.innerHTML =
        '<div class="cmd-empty"><i class="fa-solid fa-magnifying-glass" style="font-size:20px;margin-bottom:8px;display:block;opacity:.4"></i>No commands found for "' +
        q +
        '"</div>';
      return;
    }
    res.innerHTML = cmdItems
      .map(function (cmd, i) {
        return (
          '<div class="cmd-item' +
          (i === cmdSelected ? " selected" : "") +
          '" data-idx="' +
          i +
          '" onclick="cmdExec(' +
          i +
          ')">' +
          '<i class="fa-solid ' +
          cmd.ic +
          '" aria-hidden="true"></i>' +
          '<div><div class="cmd-item-label">' +
          cmd.label +
          '</div><div class="cmd-item-sub">' +
          cmd.sub +
          "</div></div>" +
          "</div>"
        );
      })
      .join("");
  }
  window.cmdExec = function (i) {
    var cmd = cmdItems[i];
    if (!cmd) return;
    closeCmd();
    setTimeout(function () {
      cmd.action();
    }, 80);
  };
  function cmdNav(dir) {
    cmdSelected = Math.max(0, Math.min(cmdItems.length - 1, cmdSelected + dir));
    var items = document.querySelectorAll(".cmd-item");
    items.forEach(function (el, i) {
      el.classList.toggle("selected", i === cmdSelected);
    });
    var sel = items[cmdSelected];
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  // Input handler
  document.addEventListener("DOMContentLoaded", function () {
    var inp = document.getElementById("cmd-input");
    if (inp) {
      inp.addEventListener("input", function () {
        cmdSelected = 0;
        renderCmd(inp.value);
      });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          cmdNav(1);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          cmdNav(-1);
        }
        if (e.key === "Enter") {
          e.preventDefault();
          cmdExec(cmdSelected);
        }
        if (e.key === "Escape") {
          closeCmd();
        }
      });
    }
    var pal = document.getElementById("cmd-palette");
    if (pal) {
      pal.addEventListener("click", function (e) {
        if (e.target === pal) closeCmd();
      });
    }
  });

  window.openCmd = openCmd;
  window.closeCmd = closeCmd;
})();

// ──────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS PANEL  (?  key)
// ──────────────────────────────────────────────────────────
function openKbdPanel() {
  var panel = document.getElementById("kbd-panel");
  if (!panel) return;
  panel.classList.add("vis");
  document.body.style.overflow = "hidden";
  if (navigator.vibrate) navigator.vibrate(8);
}
function closeKbdPanel() {
  var panel = document.getElementById("kbd-panel");
  if (panel) panel.classList.remove("vis");
  document.body.style.overflow = "";
}
(function () {
  var panel = document.getElementById("kbd-panel");
  if (panel)
    panel.addEventListener("click", function (e) {
      if (e.target === panel) closeKbdPanel();
    });
})();

// ──────────────────────────────────────────────────────────
//  ENHANCED KEYBOARD HANDLER
//  Replaces the basic wrapper handler with full shortcut suite
// ──────────────────────────────────────────────────────────
// Navigation keyboard handler is in consolidated module at end of file


// ──────────────────────────────────────────────────────────
//  IMPROVED TOAST  (with progress bar)
// ──────────────────────────────────────────────────────────
(function () {
  var _origToast = typeof toast === "function" ? toast : null;
  window.toast = function (msg, type, dur) {
    var d = dur || 3200;
    var icons = {
      ok: "fa-circle-check",
      err: "fa-circle-xmark",
      wrn: "fa-triangle-exclamation",
      inf: "fa-circle-info",
    };
    var ic = icons[type || "inf"] || "fa-circle-info";
    var el = document.createElement("div");
    el.className = "toast " + (type || "inf");
    el.setAttribute("role", type === "err" ? "alert" : "status");
    el.setAttribute("aria-live", type === "err" ? "assertive" : "polite");
    el.style.cssText = "position:relative;overflow:hidden;cursor:pointer;";
    el.innerHTML =
      '<i class="fa-solid ' +
      ic +
      '" aria-hidden="true"></i>' +
      '<span style="flex:1;line-height:1.4">' +
      msg +
      "</span>" +
      '<div class="toast-prog" style="position:absolute;bottom:0;left:0;height:2px;background:rgba(255,255,255,.28);width:0;border-radius:0 0 var(--r2) var(--r2)"></div>';

    var toastsEl = document.getElementById("toasts");
    if (!toastsEl) return;
    toastsEl.appendChild(el);

    // Progress bar
    requestAnimationFrame(function () {
      var bar = el.querySelector(".toast-prog");
      if (bar) {
        bar.style.transition = "width " + d + "ms linear";
        requestAnimationFrame(function () {
          bar.style.width = "100%";
        });
      }
    });

    // Limit 3 toasts
    var all = toastsEl.querySelectorAll(".toast");
    if (all.length > 3) {
      try {
        toastsEl.removeChild(all[0]);
      } catch (e) {}
    }

    function dismiss() {
      el.style.opacity = "0";
      el.style.transform = "translateX(16px) scale(.96)";
      el.style.transition = ".2s ease";
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }
    el.addEventListener("click", dismiss);
    setTimeout(dismiss, d);
  };
})();

// ──────────────────────────────────────────────────────────
//  RIPPLE EFFECT  (comprehensive — applied to all buttons)
// ──────────────────────────────────────────────────────────
(function () {
  var TARGETS =
    ".btn-p,.btn,.qb,.qb.primary,.bn-add-circle,.ni,.bn-item,.tb-btn,.info-btn,.mm-item,.acc-card,.goal-card,.tut-next,.cmd-item";
  document.addEventListener(
    "pointerdown",
    function (e) {
      var el = e.target.closest(TARGETS);
      if (!el) return;
      try {
        var rect = el.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2.4;
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;
        var rpl = document.createElement("span");
        rpl.className = "ripple";
        rpl.style.cssText =
          "position:absolute;border-radius:50%;pointer-events:none;" +
          "background:rgba(255,255,255,.18);transform:scale(0);animation:ripple-expand .55s linear forwards;" +
          "width:" +
          size +
          "px;height:" +
          size +
          "px;left:" +
          x +
          "px;top:" +
          y +
          "px;";
        var cs = window.getComputedStyle(el);
        if (cs.position === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        el.appendChild(rpl);
        setTimeout(function () {
          if (rpl.parentNode) rpl.parentNode.removeChild(rpl);
        }, 580);
      } catch (err) {}
    },
    { passive: true },
  );
})();

// ──────────────────────────────────────────────────────────
//  HAPTICS  (calibrated feedback)
// ──────────────────────────────────────────────────────────
(function () {
  if (!navigator.vibrate) return;
  function haptic(type) {
    var p = {
      light: 6,
      medium: 12,
      success: [8, 40, 8],
      error: [15, 80, 15],
      warning: 10,
    };
    navigator.vibrate(p[type] || 6);
  }
  window.haptic = haptic;

  function addHaptic(sel, type) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener(
        "pointerdown",
        function () {
          haptic(type || "light");
        },
        { passive: true },
      );
    });
  }
  addHaptic(".btn-p,.bn-add-circle", "medium");
  addHaptic(".btn,.qb,.ni,.bn-item,.tb-btn,.info-btn,.tut-next", "light");
  addHaptic(".bn-item[data-bnview]", "medium");
})();

// ──────────────────────────────────────────────────────────
//  SWIPE TO DISMISS MODALS  (touch)
// ──────────────────────────────────────────────────────────
(function () {
  var sy = 0,
    drag = false,
    target = null;
  document.addEventListener(
    "touchstart",
    function (e) {
      var box = e.target.closest(".mo-box");
      if (!box) return;
      var mo = box.parentElement;
      if (!mo || !mo.classList.contains("vis")) return;
      var pt = e.touches[0].clientY;
      if (pt - box.getBoundingClientRect().top > 60 && box.scrollTop > 0)
        return;
      sy = pt;
      drag = true;
      target = { mo: mo, box: box };
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    function (e) {
      if (!drag || !target) return;
      var dy = e.touches[0].clientY - sy;
      if (dy > 0 && target.box.scrollTop <= 0) {
        target.box.style.transform =
          "translateY(" + Math.min(dy * 0.48, 120) + "px)";
        target.box.style.transition = "none";
        target.box.style.opacity = Math.max(0.5, 1 - dy / 300) + "";
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!drag || !target) return;
      var dy = e.changedTouches[0].clientY - sy;
      target.box.style.transition = "";
      target.box.style.opacity = "";
      var t = target;
      drag = false;
      target = null;
      if (dy > 85) {
        t.box.style.transform = "translateY(110%)";
        setTimeout(function () {
          t.mo.classList.remove("vis");
          t.box.style.transform = "";
        }, 240);
      } else {
        t.box.style.transform = "";
      }
    },
    { passive: true },
  );
})();

// ──────────────────────────────────────────────────────────
//  DASHBOARD DATE LABEL + STORAGE SIZE
// ──────────────────────────────────────────────────────────
function updateDashDateLabel() {
  var el = document.getElementById("dash-date-label");
  if (!el) return;
  var d = new Date();
  el.textContent = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
(function () {
  updateDashDateLabel();
  // Patch renderDash to also update the date label
  var _rd = typeof renderDash === "function" ? renderDash : null;
  if (_rd)
    renderDash = function () {
      _rd();
      updateDashDateLabel();
    };
})();

// ──────────────────────────────────────────────────────────
//  TUTORIAL AUTO-SHOW  (first visit)
// ──────────────────────────────────────────────────────────
(function () {
  try {
    if (!LS.getItem("ff_tut_done")) {
      setTimeout(function () {
        if (typeof showTutorial === "function") showTutorial();
      }, 1400);
    }
  } catch (e) {}
})();

// ──────────────────────────────────────────────────────────
//  _applyNav PATCH  (sync sidebar + title + nav state)
// ──────────────────────────────────────────────────────────
(function () {
  var _orig = typeof _applyNav === "function" ? _applyNav : null;
  if (!_orig) return;
  window._applyNav = function (view, sub, extra) {
    try {
      _orig(view, sub, extra);
    } catch (e) {
      console.warn("[FF] nav err:", e.message);
    }
    // Sync sidebar items (belt-and-suspenders)
    document.querySelectorAll(".ni[data-view]").forEach(function (n) {
      n.classList.toggle("on", n.getAttribute("data-view") === view);
    });
    document.querySelectorAll(".bn-item[data-bnview]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-bnview") === view);
    });
    updateMobileMonthLabels();
  };
})();

// ──────────────────────────────────────────────────────────
//  updateMobileMonthLabels PATCH
// ──────────────────────────────────────────────────────────
(function () {
  var _orig =
    typeof updateMobileMonthLabels === "function"
      ? updateMobileMonthLabels
      : null;
  if (_orig) {
    window.updateMobileMonthLabels = function () {
      try {
        _orig();
      } catch (e) {}
      var mob = window.innerWidth <= 768;
      document.querySelectorAll(".mobile-month-nav").forEach(function (el) {
        el.style.display = mob ? "flex" : "none";
      });
    };
  }
  window.addEventListener(
    "resize",
    function () {
      updateMobileMonthLabels();
    },
    { passive: true },
  );
})();

// ──────────────────────────────────────────────────────────
//  iOS INSTALL HINT
// ──────────────────────────────────────────────────────────
(function () {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && !navigator.standalone) {
    var hint = document.getElementById("install-ios-hint");
    if (hint) hint.style.display = "inline-flex";
  }
})();

// ──────────────────────────────────────────────────────────
//  INITIAL SYNC
// ──────────────────────────────────────────────────────────
(function () {
  try {
    var view = typeof currentView !== "undefined" ? currentView : "dashboard";
    document.querySelectorAll(".ni[data-view]").forEach(function (n) {
      n.classList.toggle("on", n.getAttribute("data-view") === view);
    });
    updateMobileMonthLabels();
    updateDashDateLabel();
    if (deferredInstall) {
      var btn = document.getElementById("install-btn");
      if (btn) btn.style.display = "flex";
    }
  } catch (e) {}
})();

// ── CSS: ripple keyframe (injected once) ──
(function () {
  var s = document.createElement("style");
  s.textContent =
    "@keyframes ripple-expand { to { transform:scale(4); opacity:0; } }";
  document.head.appendChild(s);
})();

// ──────────────────────────────────────────────────────────
//  TUTORIAL SYSTEM
// ──────────────────────────────────────────────────────────
var TUT_TOTAL = 7;
var tutStep = 1;

function showTutorial() {
  tutStep = 1;
  _tutRender();
  document.getElementById("tutorial-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeTutorial() {
  document.getElementById("tutorial-overlay").classList.add("hidden");
  document.body.style.overflow = "";
  try {
    LS.setItem("ff_tut_done", "1");
  } catch (e) {}
  // Pulse FAB to invite first action
  var fab = document.querySelector(".bn-add-circle");
  if (fab) {
    fab.classList.add("pulse");
    setTimeout(function () {
      fab.classList.remove("pulse");
    }, 6000);
  }
}
function tutNext() {
  if (tutStep >= TUT_TOTAL) {
    closeTutorial();
    return;
  }
  tutStep++;
  _tutRender();
}
function tutPrev() {
  if (tutStep <= 1) return;
  tutStep--;
  _tutRender();
}
function _tutRender() {
  // Hide all steps
  for (var i = 1; i <= TUT_TOTAL; i++) {
    var s = document.getElementById("tut-step-" + i);
    if (s) s.classList.toggle("active", i === tutStep);
  }
  // Progress bar
  var prog = document.getElementById("tut-progress");
  if (prog) prog.style.width = Math.round((tutStep / TUT_TOTAL) * 100) + "%";
  // Dots
  var dotsEl = document.getElementById("tut-dots");
  if (dotsEl) {
    dotsEl.innerHTML = "";
    for (var j = 1; j <= TUT_TOTAL; j++) {
      var d = document.createElement("div");
      d.className = "tut-dot" + (j === tutStep ? " on" : "");
      d.onclick = (function (step) {
        return function () {
          tutStep = step;
          _tutRender();
        };
      })(j);
      d.style.cursor = "pointer";
      dotsEl.appendChild(d);
    }
  }
  // Next button label
  var nextBtn = document.getElementById("tut-next-btn");
  if (nextBtn) {
    if (tutStep >= TUT_TOTAL) {
      nextBtn.innerHTML = 'Get Started <i class="fa-solid fa-rocket"></i>';
    } else {
      nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

// Amount chip helper
function setAmtChip(val) {
  var inp = document.getElementById("tx-amount");
  if (inp) {
    var cur = parseFloat(inp.value) || 0;
    inp.value = (cur + val).toFixed(2).replace(/\.00$/, "");
    inp.focus();
  }
}


// Analytics events handled via window._track no-op



/* =================================================================
   FINFLOW — PROFILE, MODE & UX ENHANCEMENT MODULE
   
   Features:
   - Profile: name + role + avatar color used everywhere in the app
   - Mode system: Simple / Standard / Pro — adapts UI complexity
   - Welcome card: onboarding for first-time users
   - Profile greeting in dashboard header
   - GA4 tracking for profile and mode events
   - Jargon simplification via mode
   - renderDash enhancement: show welcome card when empty
================================================================= */


/* =================================================================
   FINFLOW v3.3 — SAVINGS MODULE + SECURITY HELPERS
================================================================= */

// ── XSS safety: escape user-supplied HTML ──
function esc(str) {
  if (!str && str !== 0) return "";
  var map = { 38:"&amp;", 60:"&lt;", 62:"&gt;", 34:"&quot;", 39:"&#39;" };
  var out = ""; var src = String(str);
  for (var i = 0; i < src.length; i++) {
    var code = src.charCodeAt(i);
    out += map[code] || src[i];
  }
  return out;
}

// ── svObj: find savings entry by id ──
function svObj(id) { return SV.find(function(s){ return s.id === id; }); }

// ── totalSavings: sum of all SV entries ──
function totalSavings() {
  var s = 0;
  SV.forEach(function(v){ s += v.amount; });
  return Math.round(s * 100) / 100;
}

// ── statCard color for "purple" accent ──
(function() {
  var _origStatCard = typeof statCard === 'function' ? statCard : null;
  if (_origStatCard) {
    // Patch statCard to handle 'purple' and 'accent' color names
    window._statCardPatched = true;
  }
})();

// ── renderRecentSavings: recent savings list on dashboard ──
function renderRecentSavings() {
  var el = document.getElementById('dash-savings');
  if (!el) return;
  if (!SV.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--fg3);padding:8px 0">No savings yet. <button class="btn sm" onclick="nav(\'savings\')" style="margin-left:4px">Start tracking →</button></div>';
    return;
  }
  var recent = SV.slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); }).slice(0,4);
  el.innerHTML = recent.map(function(s) {
    var cat = cObj(s.categoryId);
    return '<div class="mini-row">' +
      '<span style="font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.description) + '</span>' +
      '<span style="color:var(--green);font-weight:700;flex-shrink:0;margin:0 8px">+' + fm(s.amount) + '</span>' +
      '<span style="font-size:11px;color:var(--fg3);flex-shrink:0">' + fmDate(s.date) + (cat ? ' · ' + esc(cat.name) : '') + '</span>' +
      '</div>';
  }).join('');
}

// ── renderSavings: full savings view ──
function renderSavings() {
  var y = currentYear, m = currentMonth;
  // Update mobile month label
  var ml = document.getElementById('mobile-mlbl-sav');
  if (ml) {
    var d = new Date(y, m, 1);
    ml.textContent = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
  }
  var filtered = SV.filter(function(s){ return isMo(s, y, m); });
  var tbody = document.getElementById('sav-tbody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--fg3)"><i class="fa-solid fa-piggy-bank" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No savings this month.<br><button class="btn-p sm" onclick="openSavM()" style="margin-top:12px"><i class="fa-solid fa-plus"></i> Add Savings</button></td></tr>';
  } else {
    tbody.innerHTML = filtered
      .slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); })
      .map(function(s) {
        var cat = cObj(s.categoryId);
        return '<tr>' +
          '<td class="td-mono">' + esc(fmDate(s.date)) + '</td>' +
          '<td><div style="font-weight:600">' + esc(s.description) + '</div>' +
          (s.note ? '<div style="font-size:11px;color:var(--fg3)">' + esc(s.note) + '</div>' : '') + '</td>' +
          '<td>' + (cat ? '<span class="cat-chip" style="background:' + esc(cat.color) + '22;color:' + esc(cat.color) + '"><i class="fa-solid ' + esc(cat.icon) + '" style="font-size:10px"></i> ' + esc(cat.name) + '</span>' : '<span style="color:var(--fg3)">—</span>') + '</td>' +
          '<td style="text-align:right;color:var(--green);font-weight:700">+' + fm(s.amount) + '</td>' +
          '<td><div style="display:flex;gap:4px;justify-content:flex-end">' +
          '<button class="btn xs" onclick="openSavM(\'' + s.id + '\')"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn xs danger" onclick="deleteSav(\'' + s.id + '\')"><i class="fa-solid fa-trash"></i></button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
  }

  var tot = filtered.reduce(function(s,v){ return s + v.amount; }, 0);
  var sm = document.getElementById('sav-summary');
  if (sm) sm.innerHTML =
    '<span><strong style="color:var(--green)">+' + fm(tot) + '</strong> saved this month</span>' +
    '<span style="margin-left:auto"><strong>' + filtered.length + '</strong> ' + (filtered.length === 1 ? 'entry' : 'entries') + '</span>';
}

// ── Savings Modal ──
function openSavM(editId) {
  clrErrs();
  editSavId = editId || null;
  document.getElementById('mo-sav-title').textContent = editId ? 'Edit Savings' : 'Add Savings';
  document.getElementById('sav-save-lbl').textContent = editId ? 'Save Changes' : 'Add Savings';

  // Populate category dropdown
  var catSel = document.getElementById('sav-cat');
  catSel.innerHTML = '<option value="">Select category…</option>' +
    C.map(function(c){ return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');

  if (editId) {
    var s = svObj(editId); if (!s) return;
    document.getElementById('sav-amount').value = s.amount;
    document.getElementById('sav-desc').value   = s.description;
    document.getElementById('sav-date').value   = s.date;
    document.getElementById('sav-note').value   = s.note || '';
    catSel.value = s.categoryId || '';
  } else {
    document.getElementById('sav-amount').value = '';
    document.getElementById('sav-desc').value   = '';
    document.getElementById('sav-date').value   = today();
    document.getElementById('sav-note').value   = '';
    catSel.value = '';
  }
  if (typeof updCurrencySymbols === 'function') updCurrencySymbols();
  document.getElementById('mo-sav').classList.add('vis');
  setTimeout(function() { document.getElementById('sav-amount').focus(); }, 100);
}
function closeSavM() {
  document.getElementById('mo-sav').classList.remove('vis');
  editSavId = null;
}
function saveSav() {
  clrErrs();
  var amount = parseFloat(document.getElementById('sav-amount').value);
  var desc   = document.getElementById('sav-desc').value.trim();
  var date   = document.getElementById('sav-date').value;
  if (!amount || amount <= 0) { showErr('e-sav-amount', 'Enter a valid amount'); return; }
  if (!desc)                  { showErr('e-sav-desc',   'Description required');  return; }

  var prev = editSavId ? svObj(editSavId) : null;
  var obj = {
    id:          editSavId || uid(),
    amount:      Math.round(amount * 100) / 100,
    description: desc,
    date:        date || today(),
    categoryId:  document.getElementById('sav-cat').value || '',
    note:        document.getElementById('sav-note').value.trim(),
    createdAt:   prev ? (prev.createdAt || new Date().toISOString()) : new Date().toISOString(),
  };

  if (editSavId) SV = SV.filter(function(s){ return s.id !== editSavId; });
  SV.push(obj);
  save();
  closeSavM();
  toast(editSavId ? 'Savings updated' : 'Savings added', 'ok');
  if (typeof currentView !== 'undefined' && currentView === 'dashboard') {
    if (typeof window.renderDash === 'function') window.renderDash();
  } else if (typeof navRender === 'function') {
    navRender(currentView);
  }
  if (typeof window._track === 'function') window._track('savings_add', { amount: obj.amount });
}
function deleteSav(id) {
  if (!confirm('Delete this savings entry?')) return;
  SV = SV.filter(function(s){ return s.id !== id; });
  save();
  toast('Savings deleted', 'inf');
  if (typeof navRender === 'function') navRender(currentView);
}


/* =================================================================
   FINFLOW — APP MODULE v3.3
   Two modes: minimal | advanced
   Single sync function. Zero cascade bugs.
================================================================= */
(function () {
  'use strict';

  var LS = window.localStorage;

  /* ── Constants ─────────────────────────────────────────── */
  var AVATAR_COLORS = [
    '#5b52f0','#7c3aed','#be185d','#b45309','#0e7ba8',
    '#0f766e','#15803d','#c2410c','#4f46e5','#d97706'
  ];

  var MODE_LABELS = {
    minimal:  { name:'Minimal',  desc:'Core features, clean and simple.' },
    advanced: { name:'Advanced', desc:'Full toolkit and all features.' }
  };

  /* ── Storage helpers ─────────────────────────────────────── */
  function getPR() {
    try { return JSON.parse(LS.getItem('ff_pr') || '{}'); } catch(e) { return {}; }
  }
  function setPR(updates) {
    var pr = getPR();
    Object.assign(pr, updates);
    LS.setItem('ff_pr', JSON.stringify(pr));
    if (typeof PR !== 'undefined') Object.assign(PR, updates);
  }

  /* ── initials from name ─────────────────────────────────── */
  function initials(name) {
    if (!name || !name.trim()) return '?';
    var p = name.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length-1][0] : name.slice(0,2)).toUpperCase();
  }

  /* ── applyMode: add/remove body class, update nav labels ── */
  function applyMode(mode) {
    document.body.classList.remove('mode-minimal', 'mode-advanced', 'mode-simple', 'mode-standard', 'mode-pro');
    document.body.classList.add('mode-' + (mode || 'advanced'));

    // Nav label overrides for minimal mode
    var minimalLabels = {
      budget: 'Budget', transactions: 'Activity',
      recurring: 'Bills', categories: 'Labels', insights: 'Insights'
    };
    Object.keys(minimalLabels).forEach(function(view) {
      var el = document.querySelector('[data-view="' + view + '"] .ni-lbl');
      if (!el) return;
      el.textContent = mode === 'minimal' ? minimalLabels[view] :
        ({ budget:'Budgets', transactions:'Transactions', recurring:'Recurring',
           categories:'Categories', insights:'Insights' })[view] || minimalLabels[view];
    });

    // Bottom nav labels
    var bnMin = { transactions:'Activity', accounts:'Accounts' };
    var bnAdv = { transactions:'Transactions', accounts:'Accounts' };
    var bnMap = mode === 'minimal' ? bnMin : bnAdv;
    Object.keys(bnMap).forEach(function(view) {
      var el = document.querySelector('.bn-item[data-bnview="' + view + '"] span');
      if (el) el.textContent = bnMap[view];
    });

    // Transaction type button labels
    try {
      var labels = mode === 'minimal'
        ? { expense:'Spent', income:'Received', transfer:'Move Money' }
        : { expense:'Expense', income:'Income', transfer:'Transfer' };
      [['tt-expense','expense'],['tt-income','income'],['tt-transfer','transfer']].forEach(function(pair) {
        var el = document.getElementById(pair[0]);
        if (!el) return;
        var sp = el.querySelector('span');
        if (sp) sp.textContent = labels[pair[1]];
      });
    } catch(e) {}
  }
  window.applyMode = applyMode;

  /* ── THE SINGLE SYNC FUNCTION ───────────────────────────── */
  function sync() {
    var pr   = getPR();
    var mode = pr.mode || 'advanced';
    var col  = pr.avatarColor || AVATAR_COLORS[0];

    // Apply mode to DOM
    applyMode(mode);

    // Settings: avatar
    var av = document.getElementById('profile-avatar');
    if (av) { av.style.background = col; av.textContent = initials(pr.name || ''); }

    // Settings: name / role inputs (skip if focused)
    var nm = document.getElementById('s-name');
    if (nm && nm !== document.activeElement) nm.value = pr.name || '';
    var rl = document.getElementById('s-role');
    if (rl && rl !== document.activeElement) rl.value = pr.role || '';

    // Settings: currency
    var cs = document.getElementById('s-currency');
    if (cs && pr.currency) cs.value = pr.currency;

    // Settings: date format
    var df = document.getElementById('s-dateformat');
    if (df && pr.dateFormat) df.value = pr.dateFormat;

    // Mode toggle in settings — 2 buttons: minimal / advanced
    document.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.classList.toggle('on', btn.getAttribute('data-mode') === mode);
    });

    // Mode description
    var md = document.getElementById('mode-desc');
    if (md) md.textContent = (MODE_LABELS[mode] || MODE_LABELS.advanced).desc;

    // Onboard buttons
    document.querySelectorAll('.onboard-mode-btn').forEach(function(btn) {
      btn.classList.toggle('on', btn.getAttribute('data-mode') === mode);
    });

    // Dashboard greeting
    var dashAv = document.querySelector('#dash-profile-hdr .dash-av');
    if (dashAv) { dashAv.style.background = col; dashAv.textContent = initials(pr.name || ''); }
    var gn = document.getElementById('dash-greet-name');
    if (gn) {
      var h = new Date().getHours();
      var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      gn.textContent = pr.name ? g + ', ' + pr.name + '!' : g + '!';
    }
    var gr = document.getElementById('dash-greet-role');
    if (gr) gr.textContent = pr.role || 'Personal Finance';
  }
  window.syncProfileUI = sync; // alias for compatibility

  /* ── setMode: the one true entry point for mode changes ── */
  window.setMode = function(mode) {
    // Clamp to valid values
    if (mode !== 'minimal' && mode !== 'advanced') mode = 'advanced';
    // Map old values from previous sessions
    if (mode === 'simple') mode = 'minimal';
    if (mode === 'standard' || mode === 'pro') mode = 'advanced';
    setPR({ mode: mode });
    sync();
    if (typeof toast === 'function') {
      toast(mode === 'minimal' ? 'Minimal mode — clean and simple.' : 'Advanced mode — full toolkit.', 'ok', 2000);
    }
    try {
      if (typeof nav === 'function' && typeof currentView === 'string' && currentView) {
        setTimeout(function() { nav(currentView); }, 80);
      }
    } catch(e) {}
  };

  /* ── cycleAvatarColor ────────────────────────────────────── */
  window.cycleAvatarColor = function() {
    var pr  = getPR();
    var idx = AVATAR_COLORS.indexOf(pr.avatarColor);
    setPR({ avatarColor: AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length] });
    sync();
    var av = document.getElementById('profile-avatar');
    if (av) {
      av.style.transition = 'transform .2s cubic-bezier(.34,1.56,.64,1)';
      av.style.transform  = 'scale(1.3) rotate(20deg)';
      setTimeout(function() { av.style.transform = ''; }, 200);
    }
  };

  /* ── Profile header on dashboard ─────────────────────────── */
  function renderProfileHeader() {
    ['dash-profile-header','dash-profile-hdr'].forEach(function(id) {
      var old = document.getElementById(id); if (old) old.remove();
    });
    var pr   = getPR();
    var grid = document.getElementById('stats-grid');
    if (!grid || !pr.name) return;

    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    var hdr = document.createElement('div');
    hdr.id = 'dash-profile-hdr'; hdr.className = 'profile-header-dash';
    hdr.innerHTML =
      '<div class="dash-av" style="background:' + (pr.avatarColor || AVATAR_COLORS[0]) + '"' +
      ' onclick="nav(\'settings\')" title="Profile">' + initials(pr.name) + '</div>' +
      '<div class="dash-greet">' +
      '<div class="dash-greet-name" id="dash-greet-name">' + g + ', ' + pr.name + '!</div>' +
      '<div class="dash-greet-role" id="dash-greet-role">' + (pr.role || 'Personal Finance') + '</div>' +
      '</div>';
    var hw = grid.parentNode.querySelector('.hero-wrap');
    var ins = hw || grid;
    ins.parentNode.insertBefore(hdr, ins);
  }

  /* ── Welcome card ────────────────────────────────────────── */
  function renderWelcomeCard() {
    if (typeof currentView !== 'undefined' && currentView !== 'dashboard') return;
    if (!document.getElementById('stats-grid')) return;

    var hasData = (typeof A !== 'undefined' && A.length > 0) ||
                  (typeof T !== 'undefined' && T.length > 0);
    var hw = document.querySelector('.hero-wrap');
    var ex = document.getElementById('welcome-card-dash');

    if (hasData) {
      if (ex) ex.remove();
      if (hw) hw.style.display = '';
      return;
    }

    if (ex) {
      var t = ex.querySelector('.wc-title');
      if (t) { var pr2 = getPR(); t.textContent = '\uD83D\uDC4B Hi, ' + (pr2.name || 'there') + '!'; }
      if (hw) hw.style.display = 'none';
      return;
    }

    if (!hw || !hw.parentNode) return;
    var pr  = getPR();
    var card = document.createElement('div');
    card.id = 'welcome-card-dash'; card.className = 'welcome-card-dash';
    card.innerHTML =
      '<div class="wc-title">\uD83D\uDC4B Hi, ' + (pr.name || 'there') + '!</div>' +
      '<div class="wc-sub">Start in 3 steps</div>' +
      '<div class="wc-steps">' +
        '<button class="welcome-step-btn" onclick="openAccM()">' +
          '<span class="ws-num">1</span>' +
          '<span class="ws-text"><strong>Add an Account</strong><span>Bank, savings or cash</span></span>' +
          '<i class="fa-solid fa-chevron-right"></i></button>' +
        '<button class="welcome-step-btn" onclick="openTxM()">' +
          '<span class="ws-num">2</span>' +
          '<span class="ws-text"><strong>Record a Transaction</strong><span>Spent, earned or moved</span></span>' +
          '<i class="fa-solid fa-chevron-right"></i></button>' +
        '<button class="welcome-step-btn" onclick="openBudM()">' +
          '<span class="ws-num">3</span>' +
          '<span class="ws-text"><strong>Set a Budget</strong><span>Monthly limit per category</span></span>' +
          '<i class="fa-solid fa-chevron-right"></i></button>' +
      '</div>' +
      '<div class="wc-actions">' +
        '<button onclick="openAccM()" class="btn-p wc-btn"><i class="fa-solid fa-plus"></i> Add Account</button>' +
        '<button onclick="showTutorial()" class="wc-btn-ghost"><i class="fa-solid fa-graduation-cap"></i> Tutorial</button>' +
      '</div>';
    hw.style.display = 'none';
    hw.parentNode.insertBefore(card, hw);
  }

  /* ── renderDash override ─────────────────────────────────── */
  var _origDash = typeof renderDash === 'function' ? renderDash : function(){};
  window.renderDash = function() {
    _origDash();
    renderProfileHeader();
    renderWelcomeCard();
  };

  /* ── renderSettings override ─────────────────────────────── */
  var _origRS = typeof renderSettings === 'function' ? renderSettings : function(){};
  window.renderSettings = function() {
    _origRS();
    sync();
    if (typeof updStorageInfo === 'function') updStorageInfo();
  };

  /* ── savePref override ───────────────────────────────────── */
  var _origSP = typeof savePref === 'function' ? savePref : function(){};
  window.savePref = function() {
    _origSP();
    var nm = document.getElementById('s-name');
    var rl = document.getElementById('s-role');
    var upd = {};
    if (nm) upd.name = nm.value.trim();
    if (rl) upd.role = rl.value.trim();
    if (Object.keys(upd).length) setPR(upd);
    sync();
  };

  /* ── Onboarding ──────────────────────────────────────────── */
  var _onboardMode = 'advanced';
  window.selectOnboardMode = function(btn) {
    _onboardMode = btn.getAttribute('data-mode') || 'advanced';
    document.querySelectorAll('.onboard-mode-btn').forEach(function(b) {
      b.classList.toggle('on', b === btn);
    });
  };

  window.finishOnboard = function() {
    var nm = document.getElementById('onboard-name');
    var cu = document.getElementById('onboard-currency');
    var upd = {
      name: nm ? nm.value.trim() : '',
      mode: _onboardMode,
      currency: cu ? cu.value.split(' ')[0].trim() : '\u20b9',
      avatarColor: AVATAR_COLORS[0]
    };
    setPR(upd);
    if (typeof PR !== 'undefined') Object.assign(PR, upd);
    var mo = document.getElementById('mo-onboard');
    if (mo) {
      mo.style.opacity = '0'; mo.style.transition = 'opacity .2s';
      setTimeout(function() { mo.classList.remove('vis'); mo.style.opacity = mo.style.transition = ''; }, 220);
    }
    sync();
    try {
      if (typeof currentView !== 'undefined' && currentView === 'dashboard' && typeof renderDash === 'function') {
        setTimeout(function() { if (typeof window.renderDash === 'function') window.renderDash(); else renderDash(); }, 100);
      }
    } catch(e) {}
    if (typeof toast === 'function') {
      setTimeout(function() {
        var pr = getPR();
        toast('Welcome' + (pr.name ? ', ' + pr.name : '') + '! All data stays private \uD83D\uDD12', 'ok', 4000);
      }, 500);
    }
  };

  function maybeShowOnboard() {
    var pr = getPR();
    if (!LS.getItem('ff_onboard_done') && !pr.name) {
      LS.setItem('ff_onboard_done', '1');
      var mo = document.getElementById('mo-onboard');
      if (mo) {
        mo.classList.add('vis');
        setTimeout(function() { var i = document.getElementById('onboard-name'); if (i) i.focus(); }, 300);
      }
    }
  }

  /* ── Notifications ───────────────────────────────────────── */
  function checkAllAlerts() {
    var alerts = [];
    var now = new Date(), yr = now.getFullYear(), mo = now.getMonth();
    var fmFn = typeof fm === 'function' ? fm : function(x) { return x; };

    if (typeof BG !== 'undefined' && Array.isArray(BG) && typeof T !== 'undefined' && Array.isArray(T)) {
      BG.forEach(function(b) {
        var lim = b.amount || 0; if (!lim) return;
        var spent = T.filter(function(t) {
          var d = new Date(t.date);
          return t.type === 'expense' && t.categoryId === b.categoryId && d.getFullYear() === yr && d.getMonth() === mo;
        }).reduce(function(s,t){ return s + t.amount; }, 0);
        var pct = (spent / lim) * 100;
        var cat = typeof cObj === 'function' ? cObj(b.categoryId) : null;
        var cn  = cat ? cat.name : 'Budget';
        if (pct >= 100) alerts.push({ type:'danger', icon:'fa-circle-xmark', msg:cn + ' over budget by ' + fmFn(spent - lim) });
        else if (pct >= 80) alerts.push({ type:'warning', icon:'fa-triangle-exclamation', msg:cn + ' at ' + Math.round(pct) + '% — ' + fmFn(lim - spent) + ' left' });
      });
    }
    if (typeof RC !== 'undefined') {
      RC.forEach(function(r) {
        if (!r.nextDate) return;
        var diff = Math.ceil((new Date(r.nextDate + 'T00:00:00') - now) / 86400000);
        if (diff < 0)      alerts.push({ type:'danger',  icon:'fa-rotate', msg:r.name + ' overdue by ' + Math.abs(diff) + 'd' });
        else if (diff <= 3) alerts.push({ type:'warning', icon:'fa-rotate', msg:r.name + ' due ' + (diff === 0 ? 'today' : 'in ' + diff + 'd') });
      });
    }
    if (typeof GL !== 'undefined') {
      GL.forEach(function(g) {
        if (!g.target || g.target <= 0) return;
        var pct = Math.round((g.saved / g.target) * 100);
        if (pct >= 100) alerts.push({ type:'success', icon:'fa-trophy', msg:'\uD83C\uDFC6 Goal reached: ' + g.name });
        else if (pct >= 75) alerts.push({ type:'info', icon:'fa-bullseye', msg:g.name + ' at ' + pct + '%' });
      });
    }
    var badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = alerts.length; badge.style.display = alerts.length ? 'flex' : 'none'; }
    return alerts;
  }
  window.checkAllAlerts = checkAllAlerts;

  var _origNotif = typeof openNotifPanel === 'function' ? openNotifPanel : function() {
    var mo = document.getElementById('mo-notif'); if (mo) mo.classList.add('vis');
  };
  window.openNotifPanel = function() {
    var alerts = checkAllAlerts();
    var el = document.getElementById('notif-list');
    if (el) {
      if (!alerts.length) {
        el.innerHTML = '<div class="notif-empty"><i class="fa-solid fa-check-circle"></i><p>All clear — no alerts.</p></div>';
      } else {
        var tm = { danger:{fg:'var(--red)',bg:'var(--red2)'}, warning:{fg:'var(--amber)',bg:'var(--amber2)'},
                   success:{fg:'var(--green)',bg:'var(--green2)'}, info:{fg:'var(--accent-h)',bg:'var(--ac2)'} };
        el.innerHTML = alerts.map(function(a) {
          var c = tm[a.type] || tm.info;
          return '<div class="notif-item" style="background:'+c.bg+'"><i class="fa-solid '+a.icon+'" style="color:'+c.fg+';flex-shrink:0"></i><span>'+a.msg+'</span></div>';
        }).join('');
      }
    }
    _origNotif();
  };

  /* ── Storage info ────────────────────────────────────────── */
  var _origSI = typeof updStorageInfo === 'function' ? updStorageInfo : function(){};
  window.updStorageInfo = function() {
    _origSI();
    try {
      var total = 0;
      for (var i = 0; i < LS.length; i++) { var k = LS.key(i); total += k.length + (LS.getItem(k)||'').length; }
      var kb = ((total * 2) / 1024).toFixed(1);
      var pct = Math.min(100, Math.round((parseFloat(kb) / 5120) * 100));
      var ukb = document.getElementById('storage-used-kb'); if (ukb) ukb.textContent = kb + ' KB';
      var bar = document.getElementById('storage-bar-fill');
      if (bar) { bar.style.width = pct + '%'; bar.style.background = pct>85?'var(--red)':pct>60?'var(--amber)':'var(--accent)'; }
    } catch(e) {}
  };

  /* ── Recurring helpers ───────────────────────────────────── */
  window.calcNextDate = function(dateStr, freq) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    var d = new Date(dateStr + 'T00:00:00');
    var map = { daily:1, weekly:7, biweekly:14 };
    if (map[freq]) d.setDate(d.getDate() + map[freq]);
    else if (freq === 'monthly')    d.setMonth(d.getMonth() + 1);
    else if (freq === 'quarterly')  d.setMonth(d.getMonth() + 3);
    else if (freq === 'halfyearly') d.setMonth(d.getMonth() + 6);
    else if (freq === 'yearly')     d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  /* ── Analytics no-op ─────────────────────────────────────── */
  window.saveAnalyticsPref = function() {
    var el = document.getElementById('s-analytics');
    setPR({ analyticsEnabled: el ? el.checked : true });
    if (typeof save === 'function') save();
  };

  /* ── Keyboard shortcuts ──────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    var isIn = /^(input|textarea|select)$/.test(tag);
    if (e.key === 'Escape') {
      var cp = document.getElementById('cmd-palette'); if (cp && cp.classList.contains('vis')) { cp.classList.remove('vis'); return; }
      var kp = document.getElementById('kbd-panel');   if (kp && kp.classList.contains('vis')) { kp.classList.remove('vis'); return; }
      var opens = document.querySelectorAll('.mo.vis'); if (opens.length) { opens[opens.length-1].classList.remove('vis'); return; }
      if (typeof closeMobileMore === 'function') closeMobileMore();
      return;
    }
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      var nm = {'1':'dashboard','2':'transactions','3':'accounts','4':'budget','5':'goals','6':'reports','7':'insights','8':'recurring','9':'categories','0':'settings'};
      if (nm[e.key]) { e.preventDefault(); if (typeof nav==='function') nav(nm[e.key]); return; }
      if (e.key==='ArrowLeft')  { e.preventDefault(); if (typeof changeMonth==='function') changeMonth(-1); return; }
      if (e.key==='ArrowRight') { e.preventDefault(); if (typeof changeMonth==='function') changeMonth(1);  return; }
      if (e.key==='n'||e.key==='N') { e.preventDefault(); if (typeof openTxM==='function') openTxM();    return; }
      if (e.key==='a'||e.key==='A') { e.preventDefault(); if (typeof openAccM==='function') openAccM();  return; }
      if (e.key==='k'||e.key==='K') { e.preventDefault(); if (typeof openCmd==='function') openCmd();   return; }
      if (e.key==='b'||e.key==='B') { e.preventDefault(); if (typeof toggleSidebar==='function') toggleSidebar(); return; }
      if (e.key==='t'||e.key==='T') { e.preventDefault(); if (typeof toggleTheme==='function') toggleTheme(); return; }
    }
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !isIn && !document.querySelector('.mo.vis')) {
      var nm2 = {'1':'dashboard','2':'transactions','3':'accounts','4':'budget','5':'goals','6':'reports','7':'insights','8':'recurring','9':'categories','0':'settings'};
      if (nm2[e.key] && typeof nav==='function') { nav(nm2[e.key]); return; }
    }
  }, false);

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    var pr = getPR();
    // Migrate old mode values
    var mode = pr.mode || 'advanced';
    if (mode === 'simple' || mode === 'standard' || mode === 'pro') {
      mode = mode === 'simple' ? 'minimal' : 'advanced';
      setPR({ mode: mode });
    }
    // Sync PR global
    if (typeof PR !== 'undefined') {
      PR.role        = pr.role        || '';
      PR.avatarColor = pr.avatarColor || AVATAR_COLORS[0];
      PR.mode        = mode;
      PR.currency    = pr.currency    || '\u20b9';
    }
    sync();
    setTimeout(maybeShowOnboard, 800);
    setTimeout(function() { if (typeof updStorageInfo === 'function') updStorageInfo(); }, 400);
    setTimeout(checkAllAlerts, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 150); });
  } else {
    setTimeout(init, 150);
  }

})();



/* =================================================================
   FINFLOW — TOOLS & CONVERTERS MODULE
   Currency · Units · Finance (EMI/SIP/Interest) · Numbers/GST/PCT
================================================================= */

// ── Currency rates (USD base, approx offline rates) ──────────────
var FX = {
  USD:1, INR:83.5, EUR:0.92, GBP:0.79, JPY:149.5, AED:3.67,
  SAR:3.75, SGD:1.34, AUD:1.53, CAD:1.36, CHF:0.89, CNY:7.24,
  KRW:1325, MYR:4.72, THB:35.1, IDR:15800, PKR:278, BDT:110,
  NGN:1580, ZAR:18.6, TRY:32.1, BRL:5.0, MXN:17.1,
  NZD:1.63, HKD:7.82, RUB:91.5, QAR:3.64, KWD:0.307
};

// ── Unit conversion data ──────────────────────────────────────────
var UNITS = {
  length: {
    label: 'Length',
    units: [
      { key:'m',   label:'Metre',       factor:1 },
      { key:'km',  label:'Kilometre',   factor:1000 },
      { key:'cm',  label:'Centimetre',  factor:0.01 },
      { key:'mm',  label:'Millimetre',  factor:0.001 },
      { key:'mi',  label:'Mile',        factor:1609.34 },
      { key:'yd',  label:'Yard',        factor:0.9144 },
      { key:'ft',  label:'Foot',        factor:0.3048 },
      { key:'in',  label:'Inch',        factor:0.0254 },
      { key:'nm',  label:'Nautical mi', factor:1852 }
    ]
  },
  weight: {
    label: 'Weight / Mass',
    units: [
      { key:'kg',  label:'Kilogram',  factor:1 },
      { key:'g',   label:'Gram',      factor:0.001 },
      { key:'mg',  label:'Milligram', factor:0.000001 },
      { key:'lb',  label:'Pound',     factor:0.453592 },
      { key:'oz',  label:'Ounce',     factor:0.0283495 },
      { key:'t',   label:'Metric ton',factor:1000 },
      { key:'st',  label:'Stone',     factor:6.35029 }
    ]
  },
  temperature: {
    label: 'Temperature',
    units: [
      { key:'C', label:'Celsius' },
      { key:'F', label:'Fahrenheit' },
      { key:'K', label:'Kelvin' }
    ]
  },
  area: {
    label: 'Area',
    units: [
      { key:'m2',   label:'Sq metre',   factor:1 },
      { key:'km2',  label:'Sq kilometre', factor:1e6 },
      { key:'cm2',  label:'Sq centimetre', factor:0.0001 },
      { key:'ha',   label:'Hectare',    factor:10000 },
      { key:'ac',   label:'Acre',       factor:4046.86 },
      { key:'ft2',  label:'Sq foot',    factor:0.092903 },
      { key:'in2',  label:'Sq inch',    factor:0.00064516 },
      { key:'mi2',  label:'Sq mile',    factor:2589988 }
    ]
  },
  volume: {
    label: 'Volume',
    units: [
      { key:'l',   label:'Litre',       factor:1 },
      { key:'ml',  label:'Millilitre',  factor:0.001 },
      { key:'m3',  label:'Cubic metre', factor:1000 },
      { key:'cm3', label:'Cubic cm',    factor:0.001 },
      { key:'gal', label:'Gallon (US)', factor:3.78541 },
      { key:'qt',  label:'Quart (US)',  factor:0.946353 },
      { key:'pt',  label:'Pint (US)',   factor:0.473176 },
      { key:'fl',  label:'Fl oz (US)',  factor:0.0295735 },
      { key:'cup', label:'Cup (US)',    factor:0.236588 },
      { key:'tbsp',label:'Tablespoon',  factor:0.0147868 },
      { key:'tsp', label:'Teaspoon',    factor:0.00492892 }
    ]
  },
  speed: {
    label: 'Speed',
    units: [
      { key:'ms',  label:'m/s',         factor:1 },
      { key:'kmh', label:'km/h',        factor:0.277778 },
      { key:'mph', label:'mph',         factor:0.44704 },
      { key:'kn',  label:'Knots',       factor:0.514444 },
      { key:'fts', label:'ft/s',        factor:0.3048 },
      { key:'mach',label:'Mach',        factor:340.29 }
    ]
  },
  data: {
    label: 'Data Storage',
    units: [
      { key:'b',   label:'Bit',         factor:1 },
      { key:'B',   label:'Byte',        factor:8 },
      { key:'KB',  label:'Kilobyte',    factor:8192 },
      { key:'MB',  label:'Megabyte',    factor:8388608 },
      { key:'GB',  label:'Gigabyte',    factor:8589934592 },
      { key:'TB',  label:'Terabyte',    factor:8796093022208 },
      { key:'PB',  label:'Petabyte',    factor:9007199254740992 },
      { key:'Kib', label:'Kibibyte',    factor:8192 },
      { key:'Mib', label:'Mibibyte',    factor:8388608 }
    ]
  },
  time: {
    label: 'Time',
    units: [
      { key:'s',   label:'Second',      factor:1 },
      { key:'ms',  label:'Millisecond', factor:0.001 },
      { key:'us',  label:'Microsecond', factor:0.000001 },
      { key:'min', label:'Minute',      factor:60 },
      { key:'hr',  label:'Hour',        factor:3600 },
      { key:'day', label:'Day',         factor:86400 },
      { key:'wk',  label:'Week',        factor:604800 },
      { key:'mo',  label:'Month (avg)', factor:2629800 },
      { key:'yr',  label:'Year',        factor:31557600 }
    ]
  },
  energy: {
    label: 'Energy',
    units: [
      { key:'J',    label:'Joule',      factor:1 },
      { key:'kJ',   label:'Kilojoule',  factor:1000 },
      { key:'cal',  label:'Calorie',    factor:4.184 },
      { key:'kcal', label:'Kilocalorie',factor:4184 },
      { key:'Wh',   label:'Watt-hour',  factor:3600 },
      { key:'kWh',  label:'kWh',        factor:3600000 },
      { key:'BTU',  label:'BTU',        factor:1055.06 },
      { key:'eV',   label:'Electronvolt',factor:1.602e-19 }
    ]
  },
  pressure: {
    label: 'Pressure',
    units: [
      { key:'Pa',   label:'Pascal',     factor:1 },
      { key:'kPa',  label:'Kilopascal', factor:1000 },
      { key:'MPa',  label:'Megapascal', factor:1000000 },
      { key:'bar',  label:'Bar',        factor:100000 },
      { key:'mbar', label:'Millibar',   factor:100 },
      { key:'atm',  label:'Atmosphere', factor:101325 },
      { key:'psi',  label:'PSI',        factor:6894.76 },
      { key:'mmHg', label:'mmHg/Torr',  factor:133.322 },
      { key:'inHg', label:'inHg',       factor:3386.39 }
    ]
  }
};

var _currentToolTab  = 'currency';
var _currentUnitCat  = 'length';

// ── renderTools ─────────────────────────────────────────────────
function renderTools() {
  switchToolsTab(_currentToolTab);
  if (_currentToolTab === 'unit') switchUnitCat(_currentUnitCat);
  if (_currentToolTab === 'currency') convertCurrency();
  if (_currentToolTab === 'finance')  { calcEMI(); calcSIP(); calcInterest(); }
  if (_currentToolTab === 'number')   { convertNumber(); calcGST(); }
}

// ── Tab switching ────────────────────────────────────────────────
function switchToolsTab(tab) {
  _currentToolTab = tab;
  ['currency','unit','finance','number'].forEach(function(t) {
    var panel = document.getElementById('tool-' + t);
    var btn   = document.getElementById('tt-' + t);
    if (panel) panel.style.display = (t === tab) ? '' : 'none';
    if (btn)   btn.classList.toggle('on', t === tab);
  });
  if (tab === 'currency') convertCurrency();
  if (tab === 'unit')     switchUnitCat(_currentUnitCat);
  if (tab === 'finance')  { calcEMI(); calcSIP(); calcInterest(); }
  if (tab === 'number')   { convertNumber(); calcGST(); }
}

// ── Currency Converter ───────────────────────────────────────────
// Live FX rates with 6-hour cache
var FX_CACHE_KEY = "ff_fx_v1";
var FX_TTL = 6 * 3600000;

function fetchFXRates() {
  try {
    var c = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null");
    if (c && c.ts && (Date.now() - c.ts < FX_TTL)) return Promise.resolve({ rates: c.rates, live: false, ts: c.ts });
  } catch(e) {}
  return fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d || !d.usd) throw new Error("bad data");
      var rates = { USD: 1 };
      Object.keys(d.usd).forEach(function(k) { rates[k.toUpperCase()] = d.usd[k]; });
      localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: rates }));
      return { rates: rates, live: true, ts: Date.now() };
    })
    .catch(function() { return { rates: FX, live: false, ts: 0 }; });
}

function convertCurrency() {
  var amt  = parseFloat(document.getElementById('cur-amount').value) || 0;
  var from = (document.getElementById('cur-from') || {}).value || 'INR';
  var to   = (document.getElementById('cur-to')   || {}).value || 'USD';
  var rv   = document.getElementById('cur-result-val');
  var rl   = document.getElementById('cur-result-label');
  if (!rv) return;
  if (!amt) { rv.textContent = "—"; if (rl) rl.textContent = "Enter an amount above"; return; }
  fetchFXRates().then(function(res) {
    var rates = res.rates;
    var rFrom = rates[from] || FX[from] || 1;
    var rTo   = rates[to]   || FX[to]   || 1;
    var result = (amt / rFrom) * rTo;
    var dp = result >= 1000 ? 2 : result >= 1 ? 4 : 6;
    var str = result.toFixed(dp).replace(/\.?0+$/, "");
    rv.textContent = str;
    if (rl) rl.textContent = amt.toLocaleString() + " " + from + " = " + str + " " + to;
    var sl = document.getElementById("cur-status");
    if (sl) {
      if (!res.live && res.ts === 0) { sl.textContent = "Offline — approximate rates"; sl.style.color = "var(--amber)"; }
      else {
        var minsAgo = Math.round((Date.now() - res.ts) / 60000);
        sl.textContent = minsAgo < 2 ? "Live rates" : "Updated " + minsAgo + "m ago";
        sl.style.color = minsAgo < 120 ? "var(--green)" : "var(--fg3)";
      }
    }
  });
}

function swapCurrency() {
  var f = document.getElementById('cur-from');
  var t = document.getElementById('cur-to');
  if (!f || !t) return;
  var tmp = f.value; f.value = t.value; t.value = tmp;
  convertCurrency();
}

// ── Unit Converter ───────────────────────────────────────────────
function switchUnitCat(cat) {
  _currentUnitCat = cat;
  // Update buttons
  document.querySelectorAll('.unit-cat-btn').forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('onclick') === 'switchUnitCat(\'' + cat + '\')');
  });
  var data = UNITS[cat];
  if (!data) return;
  var fromSel = document.getElementById('unit-from');
  var toSel   = document.getElementById('unit-to');
  if (!fromSel || !toSel) return;
  function buildOpts(sel, defaultIdx) {
    sel.innerHTML = data.units.map(function(u, i) {
      return '<option value="' + u.key + '"' + (i === defaultIdx ? ' selected' : '') + '>' + u.label + '</option>';
    }).join('');
  }
  buildOpts(fromSel, 0);
  buildOpts(toSel,   1);
  convertUnit();
}

function convertUnit() {
  var amt  = parseFloat(document.getElementById('unit-amount').value);
  var from = (document.getElementById('unit-from') || {}).value;
  var to   = (document.getElementById('unit-to')   || {}).value;
  var rv   = document.getElementById('unit-result-val');
  var rl   = document.getElementById('unit-result-label');
  if (!rv) return;
  if (isNaN(amt)) { rv.textContent = '—'; rl.textContent = 'Enter a value above'; return; }
  var data = UNITS[_currentUnitCat];
  if (!data) return;
  var fromU = data.units.find(function(u) { return u.key === from; });
  var toU   = data.units.find(function(u) { return u.key === to;   });
  if (!fromU || !toU) return;
  var result;
  if (_currentUnitCat === 'temperature') {
    // Special case: temperature is not a simple factor
    var celsius;
    if (from === 'C') celsius = amt;
    else if (from === 'F') celsius = (amt - 32) * 5/9;
    else celsius = amt - 273.15; // K
    if (to === 'C') result = celsius;
    else if (to === 'F') result = celsius * 9/5 + 32;
    else result = celsius + 273.15; // K
  } else {
    // Convert to base unit then to target
    result = (amt * fromU.factor) / toU.factor;
  }
  var dp = Math.abs(result) >= 1000 ? 2 : Math.abs(result) >= 1 ? 4 : 8;
  rv.textContent = result.toFixed(dp).replace(/\.?0+$/, '');
  rl.textContent = amt + ' ' + (fromU.label) + ' = ' + result.toFixed(dp).replace(/\.?0+$/,'') + ' ' + (toU.label);
}

function swapUnit() {
  var f = document.getElementById('unit-from');
  var t = document.getElementById('unit-to');
  if (!f || !t) return;
  var tmp = f.value; f.value = t.value; t.value = tmp;
  convertUnit();
}

// ── EMI Calculator ───────────────────────────────────────────────
function calcEMI() {
  var P = parseFloat(document.getElementById('emi-principal').value) || 0;
  var r = parseFloat(document.getElementById('emi-rate').value) || 0;
  var n = parseInt(document.getElementById('emi-months').value) || 60;
  var res = document.getElementById('emi-result');
  if (!res) return;
  if (!P || !r) { res.style.display = 'none'; return; }
  var monthly_r = r / 100 / 12;
  var emi = P * monthly_r * Math.pow(1 + monthly_r, n) / (Math.pow(1 + monthly_r, n) - 1);
  var total    = emi * n;
  var interest = total - P;
  function fmtINR(v) {
    return '₹' + Math.round(v).toLocaleString('en-IN');
  }
  res.style.display = 'grid';
  document.getElementById('emi-monthly').textContent  = fmtINR(emi);
  document.getElementById('emi-total').textContent    = fmtINR(total);
  document.getElementById('emi-interest').textContent = fmtINR(interest);
  document.getElementById('emi-principal-disp').textContent = fmtINR(P);
}

// ── SIP Calculator ───────────────────────────────────────────────
function calcSIP() {
  var P = parseFloat(document.getElementById('sip-amount').value) || 0;
  var r = parseFloat(document.getElementById('sip-rate').value)   || 0;
  var t = parseInt(document.getElementById('sip-years').value)    || 10;
  var res = document.getElementById('sip-result');
  if (!res) return;
  if (!P || !r) { res.style.display = 'none'; return; }
  var n        = t * 12;
  var monthly_r= r / 100 / 12;
  var maturity = P * ((Math.pow(1 + monthly_r, n) - 1) / monthly_r) * (1 + monthly_r);
  var invested = P * n;
  var returns  = maturity - invested;
  function fmtINR(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }
  res.style.display = 'grid';
  document.getElementById('sip-invested').textContent = fmtINR(invested);
  document.getElementById('sip-returns').textContent  = fmtINR(returns);
  document.getElementById('sip-total').textContent    = fmtINR(maturity);
  document.getElementById('sip-gain').textContent     = (returns/invested*100).toFixed(1) + '%';
}

// ── Simple & Compound Interest ───────────────────────────────────
function calcInterest() {
  var P = parseFloat(document.getElementById('si-p').value) || 0;
  var r = parseFloat(document.getElementById('si-r').value) || 0;
  var t = parseFloat(document.getElementById('si-t').value) || 0;
  var n = parseInt((document.getElementById('si-n') || {}).value) || 12;
  var res = document.getElementById('si-result');
  if (!res) return;
  if (!P || !r || !t) { res.style.display = 'none'; return; }
  var SI  = P * r * t / 100;
  var CI  = P * (Math.pow(1 + r/(100*n), n*t) - 1);
  function fmtINR(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }
  res.style.display = 'grid';
  document.getElementById('si-simple').textContent        = fmtINR(SI);
  document.getElementById('si-compound').textContent      = fmtINR(CI);
  document.getElementById('si-simple-total').textContent  = fmtINR(P + SI);
  document.getElementById('si-compound-total').textContent= fmtINR(P + CI);
}

// ── Number System Converter ──────────────────────────────────────
function convertNumber() {
  var raw  = (document.getElementById('num-input') || {}).value || '';
  var base = parseInt((document.getElementById('num-base-from') || {}).value) || 10;
  var val  = parseInt(raw.trim(), base);
  function set(id, v) { var el = document.getElementById(id); if(el) el.textContent = v; }
  if (isNaN(val)) {
    ['num-dec','num-bin','num-oct','num-hex'].forEach(function(id){ set(id,'—'); });
    return;
  }
  set('num-dec', val.toString(10));
  set('num-bin', val.toString(2));
  set('num-oct', val.toString(8));
  set('num-hex', val.toString(16).toUpperCase());
}

// ── Percentage Calculator ────────────────────────────────────────
function calcPct() {
  var a = parseFloat(document.getElementById('pct-a').value);
  var b = parseFloat(document.getElementById('pct-b').value);
  var el = document.getElementById('pct-result-1');
  if (!el) return;
  if (isNaN(a) || isNaN(b)) { el.textContent = '—'; return; }
  el.textContent = (a/100 * b).toFixed(4).replace(/\.?0+$/,'');
}

function calcPctChange() {
  var c  = parseFloat(document.getElementById('pct-c').value);
  var d  = parseFloat(document.getElementById('pct-d').value);
  var el = document.getElementById('pct-result-2');
  if (!el) return;
  if (isNaN(c) || isNaN(d) || c === 0) { el.textContent = '—'; return; }
  var change = ((d - c) / Math.abs(c)) * 100;
  el.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  el.style.color = change >= 0 ? 'var(--green)' : 'var(--red)';
}

// ── GST Calculator ───────────────────────────────────────────────
function calcGST() {
  var amt  = parseFloat(document.getElementById('gst-amount').value) || 0;
  var rate = parseFloat((document.getElementById('gst-rate') || {}).value) || 18;
  var type = (document.getElementById('gst-type') || {}).value || 'add';
  var res  = document.getElementById('gst-result');
  if (!res) return;
  if (!amt) { res.style.display = 'none'; return; }
  var base, tax;
  if (type === 'add') {
    base = amt;
    tax  = amt * rate / 100;
  } else {
    // Remove GST from inclusive price
    base = amt / (1 + rate/100);
    tax  = amt - base;
  }
  var total = base + tax;
  function fmtINR(v) { return '₹' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
  res.style.display = 'grid';
  document.getElementById('gst-base').textContent  = fmtINR(base);
  document.getElementById('gst-tax').textContent   = fmtINR(tax);
  document.getElementById('gst-cgst').textContent  = fmtINR(tax/2);
  document.getElementById('gst-sgst').textContent  = fmtINR(tax/2);
  document.getElementById('gst-total').textContent = fmtINR(total);
}

// ── VIEW_INFO for tools ──────────────────────────────────────────
if (typeof VIEW_INFO !== 'undefined') {
  VIEW_INFO['tools'] = {
    title: 'Converters & Calculators',
    icon: 'fa-calculator',
    body: 'A set of useful everyday tools — completely offline, no internet needed.<br><br>' +
      '<strong>💱 Currency:</strong> Convert between 28 world currencies using approximate offline rates.<br>' +
      '<strong>📏 Units:</strong> Convert length, weight, temperature, area, volume, speed, data, time, energy and pressure.<br>' +
      '<strong>💰 Finance:</strong> Calculate EMI for loans, SIP returns for investments, and simple/compound interest.<br>' +
      '<strong>🔢 Numbers:</strong> Convert between number bases, calculate percentages, and work out GST amounts.'
  };
}
