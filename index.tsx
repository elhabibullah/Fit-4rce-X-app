
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/common/App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);

// STRICTLY BLOCK ALL AUTOMATIC BROWSER PWA INSTALL PROMPTS AND POPUPS
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }, true);
}

// UNREGISTER OLD SERVICE WORKERS TO PREVENT FETCH CONFLICTS
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
