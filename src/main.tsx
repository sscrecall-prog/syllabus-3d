import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SyllabusProvider } from './context/SyllabusContext';
import { TimerProvider } from './context/TimerContext';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('PWA ServiceWorker registered with scope: ', registration.scope);
      },
      (err) => {
        console.log('PWA ServiceWorker registration failed: ', err);
      }
    );
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
