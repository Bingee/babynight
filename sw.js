const CACHE_NAME = 'baby-white-noise-v38';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './images/android-app-icon-192.png',
  './images/android-app-icon-512.png',
  './images/rain.png',
  './images/ocean.png',
  './images/wind.png',
  './images/heartbeat.png',
  './images/whitenoise.png',
  './images/forest.png',
  './images/night.png',
  './images/clock.png',
  './images/water.png',
  './images/shush.png',
  './images/baby-avatar-anime.png',
  './images/music/moonstone.png',
  './images/music/kalimba-relaxation-music.png',
  './images/music/morning.png',
  './images/music/evening.png',
  './images/music/fresh-air.png',
  './images/music/dreamer.png',
  './images/music/immersed.png',
  './images/music/river-flute.png'
];

const isCacheableResponse = (response) =>
  response && response.ok && (response.type === 'basic' || response.type === 'default');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', cloned));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
