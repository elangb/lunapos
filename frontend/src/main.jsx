import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { flushQueue, subscribe, isOnline } from './utils/offline';
import toast from './utils/toast';

/* PWA: auto-update service worker */
registerSW({ immediate: true });

/* Sinkronisasi antrian transaksi offline saat koneksi kembali */
const syncQueue = () => {
  // lazy import salesApi untuk menghindari circular dep saat module load
  import('./api').then(({ salesApi }) => {
    flushQueue((entry) => salesApi.create(entry.payload), (msg, type) => toast[type]?.(msg));
  });
};
subscribe(() => { if (isOnline()) syncQueue(); });
window.addEventListener('load', syncQueue);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
