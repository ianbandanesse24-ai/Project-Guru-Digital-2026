import { SupabaseService } from './supabase';
import { addStorageListener } from './storage';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  stats?: Record<string, number>;
}

export class CloudAutoSyncService {
  private static isInitialized = false;

  /**
   * Menginisialisasi pendengar perubahan data untuk sinkronisasi otomatis ke Supabase Cloud
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Bersihkan konfigurasi GitHub lama jika masih tersimpan di local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('agk_github_config');
      } catch {}
    }

    // Pasang pendengar ke seluruh mutasi penyimpanan lokal (StorageService)
    addStorageListener((key) => {
      // Abaikan kunci konfigurasi sinkronisasi itu sendiri agar tidak terjadi loop
      if (key === 'agk_supabase_config' || key === 'agk_github_config') {
        return;
      }

      // Picu auto-sync ke Supabase
      SupabaseService.triggerAutoSync(key);
    });

    // Dengarkan saat koneksi kembali online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Jaringan online terdeteksi. Memulai sinkronisasi otomatis Supabase Cloud...');
        SupabaseService.triggerAutoSync();
      });
    }
  }

  /**
   * Menjalankan sinkronisasi manual ke Supabase Cloud
   */
  static async syncNow(isAutoSync: boolean = false): Promise<CloudSyncResult> {
    return SupabaseService.pushAllToSupabase(isAutoSync);
  }

  /**
   * Mengambil status integrasi Supabase
   */
  static getStatus() {
    const sbConfig = SupabaseService.getConfig();
    return {
      configured: Boolean(sbConfig.url && sbConfig.apiKey),
      autoSync: sbConfig.autoSync,
      status: sbConfig.syncStatus || 'idle',
      lastSyncedAt: sbConfig.lastSyncedAt,
      errorMessage: sbConfig.errorMessage,
      url: sbConfig.url,
    };
  }
}
