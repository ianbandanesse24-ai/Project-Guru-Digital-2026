import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useOfflineSync } from '../lib/offlineManager';

interface OfflineSyncIndicatorProps {
  compact?: boolean;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({ compact = false }) => {
  const {
    isOnline,
    isSyncing,
    isPwaInstallable,
    isPwaInstalled,
    pendingCount,
    lastSyncedAt,
    reconnectedToast,
    dismissToast,
    triggerManualSync,
    promptInstallPwa,
  } = useOfflineSync();

  return (
    <>
      {/* Toast Alert saat internet terhubung kembali */}
      {reconnectedToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-lg bg-white border border-emerald-300 shadow-lg text-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>Internet Terhubung Kembali</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Data yang tersimpan saat offline sedang atau telah disinkronkan otomatis.
                </p>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {compact ? (
        <div className="flex items-center space-x-1.5 text-xs">
          {isOnline ? (
            <button
              type="button"
              onClick={triggerManualSync}
              disabled={isSyncing}
              title={`Online • Tersinkron ${lastSyncedAt ? `(${lastSyncedAt})` : ''} - Klik untuk sinkronisasi`}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition text-[11px] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span className="hidden sm:inline">Online</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 ml-1" />}
            </button>
          ) : (
            <div
              title="Mode Offline: Data tersimpan di memori perangkat dan akan otomatis sinkron saat ada internet."
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Offline (Lokal)</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1 bg-amber-200 text-amber-900 text-[10px] rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Full Card / Banner */
        <div
          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
            isOnline
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                <span>{isOnline ? 'Koneksi Online & Siap Sinkron' : 'Mode Offline Aktif'}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isOnline
                  ? lastSyncedAt
                    ? `Data lokal telah disinkronkan ke Cloud (Terakhir: ${lastSyncedAt}).`
                    : 'Perangkat terhubung. Perubahan otomatis disinkronkan ke Cloud.'
                  : 'Aplikasi tetap dapat digunakan tanpa internet. Data tersimpan di memori perangkat Anda.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isOnline ? (
              <button
                type="button"
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center space-x-1.5 border border-slate-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Sekarang'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                <span>Tersimpan di Perangkat</span>
              </div>
            )}

            {!isPwaInstalled && (
              <button
                type="button"
                onClick={promptInstallPwa}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang PWA</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Banner petunjuk Mode Offline khusus untuk Menu A (Administrasi Pokok)
 */
export const OfflineAdminNotice: React.FC<{ menuTitle: string }> = ({ menuTitle }) => {
  const { isOnline } = useOfflineSync();

  return (
    <div className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
      <div className="flex items-center space-x-2">
        <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          <strong className="text-slate-800">{menuTitle}</strong> mendukung{' '}
          <span className="text-emerald-700 font-semibold">Penyimpanan Offline</span> &{' '}
          <span className="text-blue-700 font-semibold">Sinkronisasi Otomatis</span>.
        </span>
      </div>
      <div className="hidden sm:flex items-center space-x-1.5 font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className={isOnline ? 'text-emerald-700 text-[10px]' : 'text-amber-700 text-[10px]'}>
          {isOnline ? 'Online (Tersinkron)' : 'Offline (Tersimpan Lokal)'}
        </span>
      </div>
    </div>
  );
};
