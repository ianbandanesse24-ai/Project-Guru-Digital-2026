import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Printer,
  Sparkles,
  FileSearch,
  Target,
  GitMerge,
  CalendarRange,
  CalendarCheck,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  Database,
  Key,
  MessageSquareHeart,
  ChevronRight,
  UserCheck,
  Search,
  X,
  Bot,
  HeartHandshake,
  BookMarked,
  CalendarDays,
  RefreshCw,
  Palette,
  FileUp,
  Sliders,
  BookOpen,
  UploadCloud,
  Calculator,
  Layers,
} from 'lucide-react';
import { UserAccount, AppTheme } from '../types';
import { useOfflineSync } from '../lib/offlineManager';
import { AMDLogo } from './AMDLogo';

interface SidebarProps {
  activeView: string;
  setActiveView?: (view: string) => void;
  onSelectView?: (view: string) => void;
  onNavigate?: (view: string) => void;
  currentUser: UserAccount;
  pendingRequestsCount?: number;
  onLogout?: () => void;
  theme?: AppTheme;
  onThemeChange?: (t: AppTheme) => void;
  onOpenThemeModal?: () => void;
  onOpenResetModal?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  desc?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onSelectView,
  onNavigate,
  currentUser,
  pendingRequestsCount = 0,
  onOpenThemeModal,
  onOpenResetModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = currentUser.role === 'admin';
  const {
    isOnline,
    isSyncing,
    triggerManualSync,
  } = useOfflineSync();

  const handleSelectView = (viewId: string) => {
    if (typeof onSelectView === 'function') {
      onSelectView(viewId);
    } else if (typeof setActiveView === 'function') {
      setActiveView(viewId);
    } else if (typeof onNavigate === 'function') {
      onNavigate(viewId);
    }
  };

  const menuUtama: MenuItem[] = [
    {
      id: 'kelas_siswa',
      label: 'Kelola Kelas & Siswa',
      icon: UserCheck,
      desc: 'Daftar Siswa & Rombel',
    },
    {
      id: 'absensi',
      label: 'Absensi Siswa',
      icon: Users,
      desc: 'Presensi Harian & Rekap',
    },
    {
      id: 'jadwal',
      label: 'Jadwal Mengajar',
      icon: Calendar,
      desc: 'Jam Tatap Muka Guru',
    },
    {
      id: 'agenda',
      label: 'Agenda Harian Mengajar',
      icon: ClipboardList,
      desc: 'Catatan Agenda & Pertemuan',
    },
    {
      id: 'jurnal',
      label: 'Jurnal Mengajar',
      icon: BookMarked,
      desc: 'Refleksi Guru & Supervisi',
    },
    {
      id: 'guru_wali',
      label: 'Buku Wali Kelas & Rekap',
      icon: BookOpen,
      desc: 'Nilai & Catatan Siswa Binaan',
    },
    {
      id: 'cetak_laporan',
      label: 'Cetak Laporan Lengkap',
      icon: Printer,
      badge: 'PDF/Word',
      desc: 'Ekspor Berkas Siap Cetak',
    },
  ];

  const menuAI: MenuItem[] = [
    {
      id: 'profil_guru_mapel',
      label: 'Profil Guru Mata Pelajaran',
      icon: UserCheck,
      badge: 'Acuan Utama',
      desc: 'Biodata Guru & Mapel',
    },
    {
      id: 'kalender_pendidikan',
      label: 'Upload Kaldik & Analisis Alokasi Waktu',
      icon: CalendarDays,
      badge: 'Kaldik & RBE',
      desc: 'Upload Kaldik & Rincian Pekan Efektif',
    },
    {
      id: 'parameter_kurikulum',
      label: 'Parameter Kurikulum & Bab TP',
      icon: Sliders,
      badge: 'Deep Learning',
      desc: 'Bab, Materi Pokok & Alokasi JP',
    },
    {
      id: 'upload_cp_master',
      label: 'Upload & Analisis CP Master',
      icon: BookOpen,
      desc: 'Upload Dokumen CP Resmi & Analisis',
    },
    {
      id: 'analisis_cp_distribusi',
      label: 'Matriks Distribusi CP & Bab',
      icon: Layers,
      desc: 'Tabel Pemetaan Bab TP & Jam',
    },
    {
      id: 'ai_analisis_cp',
      label: '1. Analisis & Distribusi CP',
      icon: FileSearch,
      desc: 'Pemetaan Elemen CP & Distribusi Sem 1 & 2',
    },
    {
      id: 'ai_tp',
      label: '2. Tujuan Pembelajaran (TP)',
      icon: Target,
      desc: 'Rumusan KKO Kompetensi',
    },
    {
      id: 'ai_atp',
      label: '3. Alur TP (ATP)',
      icon: GitMerge,
      desc: 'Alur Urutan & JP',
    },
    {
      id: 'ai_prota',
      label: '4. Program Tahunan (PROTA)',
      icon: CalendarRange,
      desc: 'Rencana Alokasi 1 Tahun',
    },
    {
      id: 'ai_prosem',
      label: '5. Program Semester (PROSEM)',
      icon: CalendarCheck,
      desc: 'Matriks Pekan Efektif',
    },
    {
      id: 'ai_kktp',
      label: '6. Kriteria Ketuntasan (KKTP)',
      icon: CheckSquare,
      badge: 'Standar Mutu',
      desc: 'Rubrik & Interval Nilai',
    },
    {
      id: 'ai_modul_ajar',
      label: '7. RPM (Rencana Pelaksanaan Modul)',
      icon: FileText,
      badge: 'RPM',
      desc: 'Rencana Pelaksanaan Modul',
    },
    {
      id: 'ai_lkpd',
      label: '8. Lembar Kerja Siswa (LKPD)',
      icon: FileSpreadsheet,
      desc: 'Aktivitas Berdiferensiasi',
    },
    {
      id: 'ai_rubrik_penilaian',
      label: '9. Rubrik Penilaian Terpadu',
      icon: HelpCircle,
      desc: 'Sinkron RPM / Modul Ajar',
    },
  ];

  const menuAdmin: MenuItem[] = [
    {
      id: 'admin_dashboard',
      label: 'Dashboard & Log Audit',
      icon: ShieldCheck,
    },
    {
      id: 'upload_cp_master',
      label: 'Upload CP Master',
      icon: BookOpen,
      badge: 'Admin Only',
      desc: 'Upload & Analisis CP Master Terpusat',
    },
    {
      id: 'admin_api_key',
      label: 'Manajemen API Key AMD',
      icon: Key,
      badge: 'AMD',
      desc: 'Pengaturan Kunci API Layanan AMD',
    },
    {
      id: 'admin_tokens',
      label: 'Manajemen Token & Kuota Sistem',
      icon: Sparkles,
      badge: '20/Hari',
    },
    {
      id: 'admin_access',
      label: 'Otorisasi Akun Client',
      icon: Users,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined,
    },
    {
      id: 'admin_sync',
      label: 'Sinkronisasi Supabase & GitHub',
      icon: Database,
      badge: 'Auto-Sync',
      desc: 'Dual Cloud & Git Backup',
    },
    {
      id: 'saran',
      label: 'Kotak Saran & Masukan',
      icon: MessageSquareHeart,
      desc: 'Kritik, Masukan & Saran Fitur',
    },
  ];

  // Filter items by search query
  const filterByQuery = (items: MenuItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        (item?.label || '').toLowerCase().includes(q) ||
        (item?.desc && String(item.desc).toLowerCase().includes(q))
    );
  };

  const filteredMenuUtama = filterByQuery(menuUtama);
  const filteredMenuAI = filterByQuery(menuAI);
  const filteredMenuAdmin = filterByQuery(menuAdmin);

  return (
    <aside className="w-full flex flex-col flex-1 select-none bg-white text-slate-800 border-r border-slate-200 min-h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center p-1 shrink-0 shadow-xs">
            <AMDLogo size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                E - PROJECT GURU
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                2025/2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">
              Administrasi & Kurikulum
            </p>
          </div>
        </div>

        {/* Quick Filter Search */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Cari menu / modul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs outline-none border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-white">
        {/* Top: Dashboard */}
        <div>
          <button
            id="nav-dashboard"
            onClick={() => handleSelectView('dashboard')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeView === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="truncate">Dashboard & Ikhtisar</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Section: Administrasi Pokok */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
              <span>Administrasi Pokok</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {filteredMenuUtama.length}
            </span>
          </div>

          <nav className="space-y-0.5">
            {filteredMenuUtama.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ml-1 shrink-0 font-semibold ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pembatas antara Menu Administrasi Pokok dan Kurikulum & Perangkat */}
        <div className="pt-2.5 pb-1 px-1" role="separator" aria-label="Pembatas Administrasi Pokok dan Kurikulum & Perangkat">
          <div className="border-t border-slate-200" />
        </div>

        {/* Section: Kurikulum & AI */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Kurikulum & Perangkat</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {filteredMenuAI.length}
            </span>
          </div>

          <nav className="space-y-0.5">
            {filteredMenuAI.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id ||
                (item.id === 'kalender_pendidikan' &&
                  (activeView === 'upload_kalender' ||
                    activeView === 'analisis_alokasi_waktu' ||
                    activeView === 'alokasi_waktu' ||
                    activeView === 'ai_analisis_alokasi_waktu'));
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ml-1 shrink-0 font-semibold ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pembatas antara Kurikulum & Perangkat dan Panel Admin */}
        <div className="pt-2.5 pb-1 px-1" role="separator" aria-label="Pembatas Kurikulum & Perangkat dan Administrator">
          <div className="border-t border-slate-200" />
        </div>

        {/* Section: Admin / Bantuan */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAdmin ? 'Panel Administrator' : 'Bantuan'}</span>
            </span>
          </div>

          <nav className="space-y-0.5">
            {isAdmin &&
              filteredMenuAdmin.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ml-1 shrink-0 font-semibold ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

            {/* Kotak Saran */}
            <button
              id="nav-saran"
              onClick={() => handleSelectView('saran')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeView === 'saran'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <MessageSquareHeart className={`w-4 h-4 shrink-0 ${activeView === 'saran' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="truncate">Kotak Saran & Masukan</span>
              </div>
            </button>

            {/* Reset Data Kurikulum & Perangkat (24 Jam) - Admin Only */}
            {isAdmin && onOpenResetModal && (
              <button
                type="button"
                id="sidebar-btn-reset-modal"
                onClick={onOpenResetModal}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all duration-150"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <RefreshCw className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="truncate">Reset Kurikulum & Perangkat (24 Jam)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  24 Jam
                </span>
              </button>
            )}

            {/* Pilihan Tema & Tata Letak */}
            {onOpenThemeModal && (
              <button
                type="button"
                id="sidebar-btn-theme-modal"
                onClick={onOpenThemeModal}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Palette className="w-4 h-4 shrink-0 text-slate-500" />
                  <span className="truncate">Pilihan Tema & Tata Letak</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Cloud Status */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 font-semibold text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-900 font-bold">{isOnline ? 'Cloud Terhubung' : 'Mode Offline'}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            {isOnline ? 'Data tersimpan aman dan terintegrasi otomatis.' : 'Data tersimpan di penyimpanan lokal.'}
          </p>
        </div>
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-slate-900">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {currentUser.role === 'admin' ? 'Administrator' : 'Guru'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
