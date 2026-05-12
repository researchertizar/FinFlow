/* ================================================================
   FinFlow — Service Worker v5.0
   
   Strategy:
   - index.html  → Network-first (always get latest HTML on deploy)
   - app.js/css  → Stale-while-revalidate (fast load + background refresh)
   - CDN assets  → Cache-first (stable, rarely change)
   - API calls   → Network-only (live data)
   
   Data safety: localStorage is SEPARATE from SW cache.
   Clearing/updating the SW cache NEVER touches user data.
================================================================ */

var APP_VERSION = '3.3.1';
var CACHE       = 'finflow-shell-' + APP_VERSION;

var SHELL_HTML  = ['/', './index.html'];
var SHELL_ASSETS = ['./app.js', './styles.css', './manifest.json',
                    './icon.svg', './favicon.svg', './sw.js'];
var CDN_ORIGINS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com',
                   'fonts.googleapis.com', 'fonts.gstatic.com'];

/* ── Install: pre-cache assets (not HTML — that's network-first) ── */
self.addEventListener('install', function (e) {
  console.log('[FinFlow SW] Installing v' + APP_VERSION);
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* Cache assets. Don't cache index.html here — fetch fresh on every load. */
      return cache.addAll(SHELL_ASSETS).catch(function (err) {
        console.warn('[FinFlow SW] Asset cache partial fail:', err);
      });
    }).then(function () {
      /* Skip waiting: activate immediately so new version takes effect */
      return self.skipWaiting();
    })
  );
});

/* ── Activate: delete ALL old caches (safe — no user data in cache) ── */
self.addEventListener('activate', function (e) {
  console.log('[FinFlow SW] Activating v' + APP_VERSION);
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE; })
          .map(function (k) {
            console.log('[FinFlow SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      );
    }).then(function () {
      /* Claim all open tabs immediately */
      return self.clients.claim();
    }).then(function () {
      /* Tell all open clients the SW updated — they show a banner */
      self.clients.matchAll({ type: 'window' }).then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
        });
      });
    })
  );
});

/* ── Fetch: different strategies per resource type ── */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url     = new URL(req.url);
  var pathname = url.pathname;
  var origin   = url.hostname;

  /* CDN assets: cache-first (stable libraries, rarely change) */
  if (CDN_ORIGINS.some(function (o) { return origin.includes(o); })) {
    e.respondWith(cdnCacheFirst(req));
    return;
  }

  /* index.html (any path that looks like a page): network-first
     This is the key fix: always try to get fresh HTML.
     Falls back to cache only if offline. */
  var isHTML = pathname === '/' ||
               pathname.endsWith('/index.html') ||
               pathname.endsWith('.html') ||
               (!pathname.includes('.') && !pathname.startsWith('/api'));
  if (isHTML) {
    e.respondWith(networkFirstHTML(req));
    return;
  }

  /* app.js / styles.css: stale-while-revalidate
     Serves cache immediately for speed, refreshes in background */
  var isAsset = SHELL_ASSETS.some(function (a) {
    return pathname.endsWith(a.replace('./', ''));
  });
  if (isAsset) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  /* Everything else: network with cache fallback */
  e.respondWith(networkWithFallback(req));
});

/* ── Strategy: Network-first (for HTML) ── */
function networkFirstHTML(req) {
  return fetch(req, { cache: 'no-store' })
    .then(function (res) {
      if (res && res.ok) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, clone); });
      }
      return res;
    })
    .catch(function () {
      /* Offline: serve cached HTML */
      return caches.match(req).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    });
}

/* ── Strategy: Stale-while-revalidate (for JS/CSS assets) ── */
function staleWhileRevalidate(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (cached) {
      var fresh = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return cached; });
      return cached || fresh;
    });
  });
}

/* ── Strategy: Cache-first (for CDN assets) ── */
function cdnCacheFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      });
    });
  });
}

/* ── Strategy: Network with cache fallback ── */
function networkWithFallback(req) {
  return fetch(req).catch(function () { return caches.match(req); });
}

/* ── Message handler ── */
self.addEventListener('message', function (e) {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'GET_VERSION') {
    e.source.postMessage({ type: 'VERSION', version: APP_VERSION });
  }
});
