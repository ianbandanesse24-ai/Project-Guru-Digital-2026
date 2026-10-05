import { useState, useEffect, useCallback } from 'react';
import { StorageService, addStorageListener } from './storage';
import { SupabaseService } from './supabase';

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  isPwaInstallable: boolean;
  isPwaInstalled: boolean;
  pendingSyncCount: number;
  lastSyncedAt?: string;
  syncMessage?: string;
}

let deferredPrompt: any = null;
const offlineChangeKey = 'agk_pending_offline_edits';

export class OfflineManager {
  /**
   * Daftarkan Service Worker untuk PWA Offline Caching
   */
  static registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (import.meta.env.DEV) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        }).catch(() => {});
        return;
      }

      window.addEventListener('load', () => {
        const swPath = `${import.meta.env.BASE_URL}sw.js`.replace(/\/+/g, '/');
        navigator.serviceWorker
          .register(swPath)
          .then((registration) => {
            console.log('[PWA] Service Worker aktif:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration note:', error);
          });
      });
    }
  }

  /**
   * Catat adanya perubahan offline
   */
  static recordLocalChange(tableName: string): void {
    try {
      const count = this.getPendingChangeCount() + 1;
      localStorage.setItem(offlineChangeKey, String(count));
      // Jika online, jadwalkan auto sync ke Supabase
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        SupabaseService.triggerAutoSync(tableName);
      }
    } catch {}
  }

  static getPendingChangeCount(): number {
    try {
      return parseInt(localStorage.getItem(offlineChangeKey) || '0', 10);
    } catch {
      return 0;
    }
  }

  static resetPendingChangeCount(): void {
    try {
      localStorage.setItem(offlineChangeKey, '0');
    } catch {}
  }

  /**
   * Konsolidasi penyimpanan data saat online / aktif
   */
  static async syncWhenOnline(showNotification: boolean = false): Promise<{
    success: boolean;
    message: string;
  }> {
    this.resetPendingChangeCount();

    // Jika online dan Supabase terkonfigurasi, dorong ke Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const client = SupabaseService.getClient();
      if (client) {
        try {
          const res = await SupabaseService.pushAllToSupabase(true);
          if (showNotification && res.success) {
            StorageService.addNotification({
              title: 'Sinkronisasi Supabase Sukses',
              message: 'Data perangkat mengajar telah disinkronkan ke Supabase Cloud.',
              type: 'sync',
            });
          }
          return res;
        } catch {}
      }
    }

    if (showNotification) {
      StorageService.addNotification({
        title: 'Penyimpanan Lokal Aktif',
        message: 'Seluruh data kurikulum, administrasi, dan nilai tersimpan aman di perangkat lokal.',
        type: 'sync',
      });
    }
    return {
      success: true,
      message: 'Seluruh data tersimpan aman secara offline-first.',
    };
  }
}

// Inisialisasi listener otomatis
if (typeof window !== 'undefined') {
  // Listener perubahan storage lokal
  addStorageListener((key) => {
    OfflineManager.recordLocalChange(key);
  });

  // Listener PWA beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('agk_pwa_installable'));
  });

  // Listener internet kembali online
  window.addEventListener('online', () => {
    console.log('[Network] Koneksi internet kembali terhubung. Memulai sinkronisasi otomatis...');
    window.dispatchEvent(new CustomEvent('agk_online_status', { detail: { online: true } }));
    OfflineManager.syncWhenOnline(true).catch(() => {});
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Beralih ke Mode Offline. Data tetap aman di penyimpanan lokal.');
    window.dispatchEvent(new CustomEvent('agk_online_status', { detail: { online: false } }));
  });
}

/**
 * Custom React Hook untuk memantau status offline & kontrol PWA
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPwaInstallable, setIsPwaInstallable] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });
  const [pendingCount, setPendingCount] = useState<number>(() =>
    OfflineManager.getPendingChangeCount()
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(
    () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
  const [reconnectedToast, setReconnectedToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnectedToast(true);
      setIsSyncing(true);
      OfflineManager.syncWhenOnline(true)
        .then((res) => {
          if (res.success) {
            setPendingCount(0);
            setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
          }
        })
        .finally(() => {
          setIsSyncing(false);
          setTimeout(() => setReconnectedToast(false), 6000);
        });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingCount(OfflineManager.getPendingChangeCount());
    };

    const handleInstallable = () => {
      setIsPwaInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setIsPwaInstallable(false);
      deferredPrompt = null;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('agk_pwa_installable', handleInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    const unsubscribeStorage = addStorageListener(() => {
      setPendingCount(OfflineManager.getPendingChangeCount());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('agk_pwa_installable', handleInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubscribeStorage();
    };
  }, []);

  const triggerManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await OfflineManager.syncWhenOnline(true);
      OfflineManager.resetPendingChangeCount();
      setPendingCount(0);
      setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const promptInstallPwa = useCallback(async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwaDeferredPrompt : null);
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsPwaInstalled(true);
          setIsPwaInstallable(false);
          if (typeof window !== 'undefined') {
            (window as any).__pwaIsInstalled = true;
            (window as any).__pwaDeferredPrompt = null;
          }
        }
      } catch (e) {
        console.warn('[PWA] Prompt direct trigger error:', e);
      }
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    isPwaInstallable,
    isPwaInstalled,
    pendingCount,
    lastSyncedAt,
    reconnectedToast,
    dismissToast: () => setReconnectedToast(false),
    triggerManualSync,
    promptInstallPwa,
  };
}
