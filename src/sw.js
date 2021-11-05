// use service worker to cache opencv.js

const cacheName = 'opencv-cache-v4.5.3';

const filesToCache = [
  './worker/opencv-4.5.3.js',
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache);
    }),
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== cacheName) {
          return caches.delete(key);
        }

        return null;
      }));
    }),
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(response => {
      return response || fetch(evt.request);
    }),
  );
});

