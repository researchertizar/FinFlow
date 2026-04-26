/* =============================================================
   FinFlow — Service Worker
   sw.js  |  v3.0
   Author: Researcher Tizar
   License: MIT

   Strategy:
     - App shell (finflow.html): Cache-first
     - CDN assets (Chart.js, FontAwesome, Fonts): Stale-while-revalidate
     - All other GETs: Network-first with cache fallback

   Works only when served over HTTP(S).
   For file:// usage, an inline blob SW is registered by the app.
============================================================= */

var CACHE = 'finflow-v3';

var PRECACHE = [
  './',
  './finflow.html',
  './styles.css',
  './app.js'
];

var CDN_CACHE = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

/* ── Install: precache app shell ── */
self.addEventListener('install', function(event) {
  console.log('[FinFlow SW] Install v3');
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Precache app shell (must succeed)
      return cache.addAll(PRECACHE).then(function() {
        // Cache CDN assets (non-fatal failures)
        return Promise.allSettled(
          CDN_CACHE.map(function(url) {
            return cache.add(url).catch(function(e) {
              console.warn('[FinFlow SW] CDN cache skip:', url, e.message);
            });
          })
        );
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: purge old caches ── */
self.addEventListener('activate', function(event) {
  console.log('[FinFlow SW] Activate v3');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) {
              console.log('[FinFlow SW] Delete old cache:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: cache strategies by URL type ── */
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = req.url;

  if (req.method !== 'GET') return;
  if (!url.startsWith('http')) return;

  var isAppShell = url.includes('finflow.html') || url.includes('styles.css') || url.includes('app.js') || url.endsWith('/');
  var isCDN = url.includes('cdn.jsdelivr.net') || url.includes('cloudflare.com') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');

  if (isAppShell) {
    /* Cache-first for app shell */
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(resp) {
          if (resp && resp.ok) {
            var clone = resp.clone();
            caches.open(CACHE).then(function(c) { c.put(req, clone); });
          }
          return resp;
        });
      })
    );
    return;
  }

  if (isCDN) {
    /* Stale-while-revalidate for CDN */
    event.respondWith(
      caches.open(CACHE).then(function(cache) {
        return cache.match(req).then(function(cached) {
          var fetchPromise = fetch(req).then(function(resp) {
            if (resp && resp.status === 200) cache.put(req, resp.clone());
            return resp;
          }).catch(function() { return cached; });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  /* Network-first for everything else */
  event.respondWith(
    fetch(req).catch(function() {
      return caches.match(req);
    })
  );
});

/* ── Message: force update ── */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
