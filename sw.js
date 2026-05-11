/* FinFlow SW v4.0 — fixes clone error, clean strategies */
var CACHE = 'finflow-v4.0';
var SHELL = ['./', './index.html', './styles.css', './app.js',
             './manifest.json', './icon.svg', './favicon.svg'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(SHELL);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = req.url;

  var isShell = SHELL.some(function(s){ return url.endsWith(s.replace('./','')); }) || url.endsWith('/');
  var isCDN   = url.includes('jsdelivr.net') || url.includes('cloudflare.com') ||
                url.includes('fonts.google') || url.includes('fonts.gstatic');

  if (isShell) {
    /* Cache-first: clone BEFORE returning to avoid "body already used" */
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (res && res.ok) {
            var clone = res.clone();            /* clone first */
            caches.open(CACHE).then(function(c){ c.put(req, clone); });
          }
          return res;                           /* return original */
        }).catch(function() {
          return caches.match('./index.html');  /* offline fallback */
        });
      })
    );
  } else if (isCDN) {
    /* Stale-while-revalidate */
    e.respondWith(
      caches.open(CACHE).then(function(cache) {
        return cache.match(req).then(function(cached) {
          var net = fetch(req).then(function(res) {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(function(){ return cached; });
          return cached || net;
        });
      })
    );
  } else {
    /* Network-first */
    e.respondWith(
      fetch(req).catch(function(){ return caches.match(req); })
    );
  }
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
