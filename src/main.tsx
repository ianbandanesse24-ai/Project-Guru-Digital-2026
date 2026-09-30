import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { StorageService } from './lib/storage';
import { OfflineManager } from './lib/offlineManager';
import { ErrorBoundary } from './components/ErrorBoundary';

// Daftarkan PWA Service Worker untuk caching offline di HP & Laptop
try {
  OfflineManager.registerServiceWorker();
} catch (e) {
  console.warn('PWA registration notice:', e);
}

// Inisialisasi pembersihan data dummy & memastikan data bersih seperti aplikasi baru
try {
  StorageService.autoCleanLegacyMockData();
} catch (e) {
  console.warn('Storage init notice:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary fallbackTitle="Terjadi kendala saat memuat aplikasi">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
