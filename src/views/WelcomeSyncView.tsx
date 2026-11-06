import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  School,
  Clock,
  Heart,
  BookOpen,
} from 'lucide-react';
import { UserAccount } from '../types';
import { StorageService } from '../lib/storage';

interface WelcomeSyncViewProps {
  currentUser: UserAccount;
  onNavigate: (viewId: string) => void;
}

export const WelcomeSyncView: React.FC<WelcomeSyncViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [schoolProfile] = useState(() => StorageService.getSchoolProfile());

  // Live ticking Indonesian clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentTime]);

  const formattedClock = useMemo(() => {
    return (
      currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    );
  }, [currentTime]);

  // Greeting based on hour of day
  const hour = currentTime.getHours();
  const greetingTime =
    hour < 11
      ? 'Selamat Pagi'
      : hour < 15
      ? 'Selamat Siang'
      : hour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      {/* TAMPILAN AWAL: HANYA ADA UCAPAN SELAMAT */}
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-b from-blue-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Icon & Live Time Chip */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="font-mono font-bold text-slate-900">{formattedClock}</span>
          </div>
        </div>

        {/* Ucapan Selamat Utama */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {greetingTime},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600">
              {currentUser.name}
            </span>
          </h1>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <School className="w-4 h-4 text-blue-600" />
            <span>{schoolProfile.schoolName || 'Satuan Pendidikan'}</span>
            <span>•</span>
            <span>Tahun Ajaran {schoolProfile.academicYear || '2025/2026'}</span>
          </div>

          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed pt-1 font-normal">
            Selamat datang di Aplikasi Administrasi Guru &amp; Kurikulum Deep Learning. Selamat bertugas dan sukses dalam melaksanakan kegiatan belajar mengajar hari ini!
          </p>
        </div>

        {/* Tombol Lanjut ke Aplikasi */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            id="btn-masuk-dashboard"
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Buka Dashboard Utama</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
