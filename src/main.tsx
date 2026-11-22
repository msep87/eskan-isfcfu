import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
      registerSW({immediate: true});
    } else {
      // Prevent stale service workers from interfering with Vite dev dynamic module fetches
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      const key = 'cfuis_vite_preload_reload_ts';
      const last = Number(window.sessionStorage.getItem(key) || '0');
      const now = Date.now();
      if (!last || now - last > 15_000) {
        window.sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
