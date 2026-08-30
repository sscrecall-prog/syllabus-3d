import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SyllabusProvider } from './context/SyllabusContext';
import { TimerProvider } from './context/TimerContext';
import './index.css';

// Register PWA Service Worker for Offline Reliability
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (import.meta.env.DEV) { console.log('[PWA] ServiceWorker active with scope:', registration.scope); }
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration warning:', err);
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
