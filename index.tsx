
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/common/App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);

// REGISTER SERVICE WORKER FOR PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('F4X SW Registered: ', registration.scope);
    }).catch(error => {
      console.log('F4X SW Registration failed: ', error);
    });
  });
}

root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
