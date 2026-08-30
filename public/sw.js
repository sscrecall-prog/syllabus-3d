// ═══════════════════════════════════════════════════════════════════
// SYLLABUS 3D — ULTRA-RELIABLE OFFLINE-FIRST SERVICE WORKER (PWA)
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME = 'syllabus-3d-v2-stable';
const DYNAMIC_CACHE = 'syllabus-3d-dynamic-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/dashboard-hero.jpg',
  '/mock_tracker_logo.png'
];

// 1. INSTALL EVENT: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT: Clear old legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT: Stale-While-Revalidate & Offline Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests (ignore chrome-extension and unsupported schemes)
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Strategy A: Navigation requests (HTML pages) → Network first with /index.html offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Strategy B: Static JS, CSS, Web Fonts, Images → Cache First / Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch update in background for next time
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // If not in cache, fetch from network and dynamically cache
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for images
          if (request.destination === 'image') {
            return new Response('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
              headers: { 'Content-Type': 'image/png' }
            });
          }
          return new Response('Offline content unavailable', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
