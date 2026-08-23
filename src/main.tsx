import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SyllabusProvider } from './context/SyllabusContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SyllabusProvider>
        <App />
      </SyllabusProvider>
    </ThemeProvider>
  </React.StrictMode>
);
