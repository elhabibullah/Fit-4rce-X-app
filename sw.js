
const CACHE_NAME = 'fit-4rce-x-cache-v612';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3043/3043233.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap',
  // PRE-CACHE ALL 3D MODELS IN THE LIBRARY
  'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_coach.glb',
  'https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Spinning_coach_compressed.glb?v=12350',
  'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/pushups.glb',
  'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/squats.glb'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache v612 - Storing 3D Library for Offline Use');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return from cache if found, otherwise fetch from network
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
    );
});
