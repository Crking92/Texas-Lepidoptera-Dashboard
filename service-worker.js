const CACHE_VERSION = 'txlep-pwa-nature-v14-20261008';
const CORE_ASSETS = [
  './index.html',
  './scripts/nature-garden.css',
  './scripts/nature-integration.js',
  './scripts/bee-host-index.js',
  './bees/index.html',
  './bees/garden-polish.css',
  './bees/data/bee_relationships.json',
  './bees/data/bee_plant_names_families.csv',
  './bees/CREDITS_AND_DATA_USE.txt',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  // A single temporary failure must not trap iOS users on the old worker.
  // Keep offline assets best-effort and start serving fresh JS as soon as
  // the new worker activates.
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(async cache => {
        await Promise.allSettled(CORE_ASSETS.map(asset => cache.add(asset)));
        await self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('txlep-pwa-') && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Prefer fresh HTML, JS and CSS so installed iPhone dashboards cannot remain
// trapped on a previous county lookup just because the older asset was cached.
// Offline fallback still uses the last good copy.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const liveCode = request.mode === 'navigate' ||
    /\\.(?:js|css|html)$/i.test(url.pathname) ||
    url.pathname === self.registration.scope.replace(self.location.origin, '');

  if (liveCode) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        const fresh = await fetch(request, {cache: 'no-cache'});
        if (fresh && fresh.ok) {
          await cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        }
        throw new Error('HTTP '+(fresh && fresh.status));
      } catch (_) {
        // An embedded bee iframe uses ?embedded=1. Cache matching needs
        // to ignore that query when the network is unavailable.
        const isBeePage = url.pathname.endsWith('/bees/index.html') || url.pathname.endsWith('/bees/');
        const saved = await cache.match(request, {ignoreSearch: true}) ||
          (isBeePage && await cache.match('./bees/index.html')) ||
          (request.mode === 'navigate' && await cache.match('./index.html'));
        if (saved) return saved;
        return Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const stored = await cache.match(request);
    if (stored) return stored;
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
