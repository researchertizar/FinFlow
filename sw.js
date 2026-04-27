/* =================================================================
   FinFlow — Service Worker
   sw.js  |  v3.1  |  by Researcher Tizar
   License: MIT

   Cache strategies:
   - App shell (index.html, styles.css, app.js): Cache-first
   - CDN assets (Chart.js, FontAwesome, Fonts): Stale-while-revalidate
   - Other GETs: Network-first with cache fallback

   Note: Only active when served over HTTP/HTTPS.
   For file:// usage, index.html registers an inline blob SW automatically.
================================================================= */

var CACHE = "finflow-v3.4";

var APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./favicon.svg",
];

var CDN_ASSETS = [
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
];

/* ── Install ── */
self.addEventListener("install", function (event) {
  console.log("[FinFlow SW] Installing v3.4");
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(APP_SHELL).then(function () {
          return Promise.allSettled(
            CDN_ASSETS.map(function (url) {
              return cache.add(url).catch(function (e) {
                console.warn("[FinFlow SW] CDN skip:", url, e.message);
              });
            }),
          );
        });
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

/* ── Activate ── */
self.addEventListener("activate", function (event) {
  console.log("[FinFlow SW] Activating v3.4");
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

/* ── Fetch ── */
self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = req.url;
  if (req.method !== "GET" || !url.startsWith("http")) return;

  var isShell =
    url.includes("index.html") ||
    url.includes("finflow.html") ||
    url.includes("styles.css") ||
    url.includes("app.js") ||
    url.endsWith("/");
  var isCDN =
    url.includes("cdn.jsdelivr.net") ||
    url.includes("cloudflare.com") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com");

  if (isShell) {
    /* Cache-first for app shell */
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.ok)
            caches.open(CACHE).then(function (c) {
              c.put(req, res.clone());
            });
          return res;
        });
      }),
    );
  } else if (isCDN) {
    /* Stale-while-revalidate for CDN */
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match(req).then(function (cached) {
          var fresh = fetch(req)
            .then(function (res) {
              if (res && res.status === 200) cache.put(req, res.clone());
              return res;
            })
            .catch(function () {
              return cached;
            });
          return cached || fresh;
        });
      }),
    );
  } else {
    /* Network-first for everything else */
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match(req);
      }),
    );
  }
});

/* ── Force update ── */
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
