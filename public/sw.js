// ═══════════════════════════════════════════════════════════════════
// SYLLABUS 3D — AUTO-UPDATING OFFLINE-READY SERVICE WORKER (PWA)
// ═══════════════════════════════════════════════════════════════════

const VERSION = 'v2.3-' + Date.now();
const CACHE_NAME = `syllabus-3d-${VERSION}`;
const DYNAMIC_CACHE = `syllabus-3d-dynamic-${VERSION}`;

// Pre-cache only essential static media and assets (NEVER precache index.html or root)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/dashboard-hero.jpg',
  '/planner_banner.png',
  '/study_hub_banner.png',
  '/syllabus_explorer_banner.png',
  '/weak_traps_banner.png',
  '/welcome_poster.png',
  '/mock_tracker_logo.png'
];

// 1. INSTALL EVENT: Pre-cache static assets and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial warning:', err);
      });
    })
  );
});

// 2. ACTIVATE EVENT: Clear ALL previous cache versions immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting stale cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. MESSAGE EVENT: Support instant skip-waiting from main thread
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

// 4. FETCH EVENT: Always fetch fresh HTML (No stale app on deploy)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Strategy A: Navigation requests (HTML pages) → Network ALWAYS First with cache: 'no-cache'
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(new Request(request.url, {
        method: 'GET',
        headers: request.headers,
        cache: 'no-cache', // Bypass browser disk cache for HTML
        mode: 'cors',
        credentials: request.credentials,
        redirect: 'follow'
      }))
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Strategy B: Hashed Vite static assets (/assets/*) → Cache First (content hash guarantees freshness)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy C: Other requests (images, fonts, APIs) → Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
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
