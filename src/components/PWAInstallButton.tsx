import React, { useState } from 'react';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'outline' | 'compact' | 'sidebar';
  className?: string;
  showIconOnlyOnMobile?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  className = '',
  showIconOnlyOnMobile = false,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInstalled || justInstalled) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
      return;
    }

    setIsInstalling(true);
    try {
      // 1. Picu instalasi aplikasi langsung via dialog native browser
      const res = await install();

      if (res.success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
        return;
      }

      if (res.outcome === 'dismissed') {
        // Pengguna membatalkan dialog konfirmasi browser
        return;
      }

      // 2. Jika browser tidak mendukung direct prompt otomatis (misal iOS Safari atau iframe),
      // tampilkan dialog bantuan instalasi
      setShowModal(true);
    } catch {
      setShowModal(true);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled || justInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="mx-1 mb-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px] truncate text-emerald-900">Aplikasi Terpasang (PWA)</span>
        </div>
      );
    }
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          disabled={isInstalling}
          className={`w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all duration-150 flex items-center justify-between group cursor-pointer ${className}`}
        >
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              {isInstalling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {isInstalling ? 'Menyiapkan...' : 'Pasang Aplikasi'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Instal ke HP & Laptop</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-100 transition-colors">
            {isInstalling ? '...' : 'Pasang'}
          </span>
        </button>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          disabled={isInstalling}
          title="Pasang Aplikasi E - Project Guru Digital (PWA Offline & Online)"
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium shadow-xs transition-all duration-150 cursor-pointer ${className}`}
        >
          {isInstalling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <Download className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className={showIconOnlyOnMobile ? 'hidden sm:inline' : 'inline'}>
            {isInstalling ? 'Menyiapkan...' : 'Pasang Aplikasi'}
          </span>
        </button>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'outline') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          disabled={isInstalling}
          className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-all duration-150 cursor-pointer ${className}`}
        >
          {isInstalling ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Download className="w-4 h-4 text-blue-600" />
          )}
          <span>{isInstalling ? 'Menyiapkan...' : 'Pasang di HP / Laptop'}</span>
        </button>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium shadow-xs transition-all duration-150 cursor-pointer ${className}`}
      >
        {isInstalling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isInstalling ? 'Menyiapkan...' : 'Pasang Aplikasi (PWA Offline)'}</span>
      </button>
      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

