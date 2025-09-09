const CACHE_NAME = 'rb-taxi-cache-v13_hardfix_20250821103429_btn20250828211916\_v9_20250828212343";
const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
