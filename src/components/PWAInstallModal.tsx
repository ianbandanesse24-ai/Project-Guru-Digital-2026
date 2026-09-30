import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Tablet,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Wifi,
  WifiOff,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';
import { usePWAInstall, DeviceType } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, deviceType, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<DeviceType>(deviceType || 'android');
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsPrompting(true);
    try {
      const res = await install();
      if (res.success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
          setInstallSuccess(false);
        }, 2000);
      }
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Identity & Solid Patent Color */}
        <div className="relative bg-blue-600 p-5 sm:p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <img
              src="/pwa-192x192.png"
              alt="Logo E - Project Guru Digital"
              className="w-14 h-14 rounded-2xl shadow-lg border-2 border-white/30 bg-white/10 p-1"
            />
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>PWA Siap Pasang • Offline & Online</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Pasang E - Project Guru Digital
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Akses cepat seperti aplikasi native di HP, Tablet & Laptop tanpa boros memori.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-1 font-bold text-slate-800">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>100% Bisa Offline</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">Absen & Nilai tanpa internet</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200 px-2">
            <div className="flex items-center space-x-1 font-bold text-slate-800">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Instan & Ringan</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">Ukuran &lt; 5MB di penyimpanan</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-1 font-bold text-slate-800">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto Sync Cloud</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">Tersinkron saat online</span>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Direct Install Banner */}
          {!isInstalled && !installSuccess && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Pasang Aplikasi Secara Langsung (1-Klik)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Klik tombol untuk langsung memunculkan dialog instalasi dan menambahkan aplikasi ke perangkat Anda.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  disabled={isPrompting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition transform active:scale-95 flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{isPrompting ? 'Menyiapkan...' : 'Pasang Sekarang'}</span>
                </button>
                {isInIframe && (
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-blue-300 text-blue-700 text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 text-center"
                  >
                    <span>Buka Tab Penuh</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Aplikasi Sudah Terpasang!</h4>
                <p className="text-xs text-emerald-700">
                  Anda saat ini sedang membuka E - Project Guru Digital dalam mode PWA Standalone.
                </p>
              </div>
            </div>
          )}

          {installSuccess && (
            <div className="p-4 rounded-xl bg-emerald-600 text-white flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Pemasangan Berhasil!</h4>
                <p className="text-xs text-emerald-100">
                  Ikon aplikasi telah ditambahkan ke Layar Utama/Desktop perangkat Anda.
                </p>
              </div>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Panduan Pemasangan Sesuai Perangkat:
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'android'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'ios'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone/iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('tablet')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'tablet'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet</span>
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'desktop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop/PC</span>
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
            {activeTab === 'android' && (
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Cara Pasang di HP Android (Google Chrome, Samsung Internet, Edge):</span>
                </div>
                <ol className="space-y-2.5 list-decimal list-inside text-slate-600 pl-1">
                  <li className="leading-relaxed">
                    Buka aplikasi ini di <strong>Google Chrome</strong> atau browser bawaan HP Anda.
                  </li>
                  <li className="leading-relaxed">
                    Ketuk tombol menu <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser.
                  </li>
                  <li className="leading-relaxed">
                    Pilih menu <strong className="text-slate-900">"Pasang Aplikasi"</strong> atau <strong className="text-slate-900">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Konfirmasi dengan mengetuk <strong>"Pasang" (Install)</strong>. Ikon AGK akan langsung muncul di beranda HP Anda layaknya aplikasi Play Store.
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Cara Pasang di iPhone / iPad (Safari iOS):</span>
                </div>
                <ol className="space-y-2.5 list-decimal list-inside text-slate-600 pl-1">
                  <li className="leading-relaxed">
                    Buka tautan web ini menggunakan peramban <strong>Safari</strong> di iPhone/iPad Anda.
                  </li>
                  <li className="leading-relaxed">
                    Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> di bilah bawah Safari).
                  </li>
                  <li className="leading-relaxed">
                    Gulir ke bawah dan pilih opsi <strong className="text-slate-900">"Tambah ke Layar Utama" (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-slate-800" />)</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Aplikasi kini siap dibuka layar penuh tanpa bilah URL browser!
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'tablet' && (
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                  <Tablet className="w-4 h-4 text-teal-600" />
                  <span>Optimal untuk Tablet & iPad (Tampilan Layar Lebar & Split View):</span>
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside pl-1">
                  <li className="leading-relaxed">
                    <strong>iPad:</strong> Gunakan Safari &gt; Tombol Share &gt; "Add to Home Screen".
                  </li>
                  <li className="leading-relaxed">
                    <strong>Android Tablet:</strong> Buka Chrome &gt; Menu (⋮) &gt; "Pasang Aplikasi".
                  </li>
                  <li className="leading-relaxed">
                    Tampilan dashboard, absensi siswa, dan input nilai otomatis menyesuaikan tata letak grid layar lebar tablet.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Cara Pasang di Laptop & Komputer (Windows, Mac, Chromebook):</span>
                </div>
                <ol className="space-y-2.5 list-decimal list-inside text-slate-600 pl-1">
                  <li className="leading-relaxed">
                    Buka menggunakan <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, atau <strong>Brave</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Klik ikon <strong>Pasang (Install App)</strong> <Download className="w-3.5 h-3.5 inline text-blue-600" /> di sisi kanan bilah alamat URL (Omnibox).
                  </li>
                  <li className="leading-relaxed">
                    Atau klik menu titik tiga di kanan atas browser &gt; <strong>"Simpan dan Bagikan"</strong> &gt; <strong>"Pasang E - Project Guru Digital"</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Aplikasi akan berjalan dalam jendela mandiri (standalone window) dengan performa maksimal dan shortcut di Desktop/Taskbar.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PWA Resmi • Data Lokal Tersimpan Aman di Perangkat</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
