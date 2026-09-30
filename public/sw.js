// Service Worker for ADMINISTRASI GURU KREATIF (PWA Offline & Cloud Sync)
const CACHE_NAME = 'agk-offline-cache-v4';

const RELATIVE_ASSETS = [
  'index.html',
  'manifest.json',
  'favicon.png',
  'apple-touch-icon.png',
  'icon.svg',
  'icon-192.svg',
  'icon-512.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const scope = self.registration.scope;
      // Precache root scope and index.html safely
      try {
        await cache.add(scope);
      } catch (e) {
        // ignore
      }
      for (const asset of RELATIVE_ASSETS) {
        try {
          const fullUrl = new URL(asset, scope).toString();
          await cache.add(fullUrl);
        } catch (e) {
          // Skip if missing
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (e.g. POST to APIs)
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle HTML navigation requests: Network First, Fallback to Cached index.html
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const scope = self.registration.scope;
          const cached = (await caches.match(event.request)) ||
                         (await caches.match(scope)) ||
                         (await caches.match(new URL('index.html', scope).toString()));
          if (cached) return cached;
          return new Response('Offline: Halaman belum tersimpan di cache.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, SVGs, Fonts, Images): Stale While Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
