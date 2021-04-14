const CACHE_NAME = "static-cache-v3";
const DATA_CACHE_NAME = "data-cache-v2";


const FILES_TO_CACHE = [
  '/',
  '/index.html',
  './styles.css',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './dist/index.js',
  './dist/db.js',
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0'
];

// Install
self.addEventListener(`install`, evt => {
  evt.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(cache => cache.addAll(FILES_TO_CACHE))
    .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener(`activate`, evt => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  evt.waitUntil(
    caches
    .keys()
    .then(cacheNames =>
      // return array of cache names that are old to delete
      cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
    )
    .then(cachesToDelete =>
      Promise.all(
        cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
      )
    )
    .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener(`fetch`, evt => {
  if ( evt.request.method !== `GET` || !evt.request.url.startsWith(self.location.origin) ) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  if (evt.request.url.includes(`/api/transaction`)) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache =>
        fetch(evt.request)
          .then(res => {
            cache.put(evt.request, res.clone());
            return res;
          })
          .catch(() => caches.match(evt.request))
      )
    );
    return;
  }

  evt.respondWith(
    caches.match(evt.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return caches
      .open(DATA_CACHE_NAME)
      .then(cache =>
        fetch(evt.request).then(response =>
          cache.put(evt.request, response.clone()).then(() => response)
        )
      );
    })
  );
});