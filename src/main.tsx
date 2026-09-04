import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SyllabusProvider } from './context/SyllabusContext';
import { TimerProvider } from './context/TimerContext';
import './index.css';

// Request Persistent Storage & Background Keep-Alive for Android / PWA
if (typeof window !== 'undefined') {
  if ('storage' in navigator && navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

// Auto-clean any legacy stale service worker caches on startup
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key.startsWith('syllabus-3d') && !key.includes('v2.3')) {
        caches.delete(key);
      }
    });
  }).catch(() => {});
}

// Register PWA Service Worker with Instant Auto-Update Engine
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Force check for updates on load
        registration.update().catch(() => {});

        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update installed! Tell it to take over immediately
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Check for updates whenever user returns to tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
        window.addEventListener('focus', () => {
          registration.update().catch(() => {});
        });
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration warning:', err);
      });

    // When the new Service Worker activates and claims clients, reload page seamlessly
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SyllabusProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </SyllabusProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
