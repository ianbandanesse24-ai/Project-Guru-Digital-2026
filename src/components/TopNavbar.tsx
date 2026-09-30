import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  BookOpen,
  Sparkles,
  Settings,
  Calendar,
  ClipboardList,
  GraduationCap,
  FileSpreadsheet,
  Printer,
  Compass,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { AppThemeConfig } from '../types';
import { AMDLogo } from './AMDLogo';

interface TopNavbarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenThemeModal?: () => void;
  onOpenResetModal?: () => void;
  isAdmin?: boolean;
  themeConfig?: AppThemeConfig;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    icon?: React.ElementType;
    badge?: string;
  }[];
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeView,
  onSelectView,
  onOpenThemeModal,
  onOpenResetModal,
  isAdmin = false,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups: NavGroup[] = [
    {
      id: 'admin_pokok',
      label: 'Administrasi Pokok',
      icon: Users,
      items: [
        { id: 'kelas_siswa', label: 'Kelola Kelas & Siswa' },
        { id: 'absensi', label: 'Absensi & Presensi' },
        { id: 'jadwal', label: 'Jadwal Mengajar' },
        { id: 'agenda', label: 'Agenda Harian' },
        { id: 'jurnal', label: 'Jurnal Mengajar' },
        { id: 'guru_wali', label: 'Buku Wali Kelas & Rekap' },
        { id: 'cetak_laporan', label: 'Pusat Cetak Dokumen' },
      ],
    },
    {
      id: 'kurikulum_ai',
      label: 'Kurikulum & Perangkat AI',
      icon: Sparkles,
      items: [
        { id: 'profil_guru_mapel', label: 'Profil Guru Mata Pelajaran', badge: 'Acuan' },
        { id: 'parameter_kurikulum', label: 'Parameter Kurikulum, Beban Belajar & Kaldik', badge: 'RBE' },
        { id: 'ai_analisis_cp', label: '1. Analisis & Distribusi CP' },
        { id: 'ai_tp', label: '2. Tujuan Pembelajaran (TP)' },
        { id: 'ai_atp', label: '3. Alur Tujuan Pembelajaran (ATP)' },
        { id: 'ai_prota', label: '4. Program Tahunan (PROTA)' },
        { id: 'ai_prosem', label: '5. Program Semester (PROSEM)' },
        { id: 'ai_kktp', label: '6. Kriteria Ketuntasan (KKTP)' },
        { id: 'ai_modul_ajar', label: '7. RPM / Modul Ajar AI', badge: 'AI' },
        { id: 'ai_lkpd', label: '8. LKPD Generator AI', badge: 'AI' },
        { id: 'ai_rubrik_penilaian', label: '9. Rubrik Penilaian Terpadu' },
      ],
    },
    {
      id: 'asisten_ai',
      label: 'Asisten & Setup',
      icon: Compass,
      items: [
        { id: 'welcome_sync', label: 'Pusat Sinkronisasi & Setup', badge: 'Sync' },
        { id: 'saran', label: 'Kotak Saran & Masukan' },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      id: 'panel_admin',
      label: 'Panel Admin',
      icon: ShieldCheck,
      items: [
        { id: 'admin_dashboard', label: 'Dashboard & Log Audit' },
        { id: 'admin_api_key', label: 'Manajemen API Key AMD AI', badge: 'AMD' },
        { id: 'admin_tokens', label: 'Manajemen Token & Kuota AI' },
        { id: 'admin_access', label: 'Otorisasi Akun Guru' },
        { id: 'admin_sync', label: 'Sinkronisasi Supabase & GitHub', badge: 'Auto' },
        { id: 'upload_cp_master', label: 'Upload CP Master' },
      ],
    });
  }

  const isViewInGroup = (group: NavGroup) => {
    return group.items.some((item) => item.id === activeView);
  };

  return (
    <div
      ref={navRef}
      className="hidden lg:flex items-center px-4 sm:px-6 bg-white border-b border-slate-200 z-10 shrink-0 text-xs overflow-x-auto custom-scrollbar"
    >
      <div className="flex items-center space-x-1.5 py-1.5 min-w-max">
        {/* AMD Brand Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-1 mr-1 rounded-lg bg-slate-900 border border-slate-800 shadow-xs">
          <AMDLogo size="xs" />
          <span className="text-[11px] font-bold text-emerald-400">AMD AI</span>
        </div>

        {/* Direct Dashboard Link */}
        <button
          onClick={() => {
            onSelectView('dashboard');
            setOpenDropdown(null);
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeView === 'dashboard'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* Navigation Dropdown Groups */}
        {groups.map((group, idx) => {
          const isActive = isViewInGroup(group);
          const isOpen = openDropdown === group.id;

          return (
            <React.Fragment key={group.id}>
              {idx === 1 && (
                <div className="h-4 w-px bg-slate-200 my-auto mx-1 shrink-0" role="separator" aria-orientation="vertical" />
              )}
              <div className="relative">
              <button
                onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <group.icon className="w-3.5 h-3.5" />
                <span>{group.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Flyout Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xl z-30 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    {group.label}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {group.items.map((item) => {
                      const isItemActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectView(item.id);
                            setOpenDropdown(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors ${
                            isItemActive
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

        {/* Feedback Link */}
        <button
          onClick={() => {
            onSelectView('saran');
            setOpenDropdown(null);
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeView === 'saran' || activeView === 'feedback'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Saran & Masukan</span>
        </button>

        {/* Reset Kurikulum & Perangkat (24 Jam) Shortcut - Admin Only */}
        {isAdmin && onOpenResetModal && (
          <button
            onClick={() => {
              onOpenResetModal();
              setOpenDropdown(null);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-rose-700 hover:bg-rose-50 border border-rose-200/60 bg-rose-50/40 transition-colors shadow-2xs"
            title="Reset Data Khusus Kurikulum & Perangkat (24 Jam)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Kurikulum & Perangkat (24 Jam)</span>
          </button>
        )}
      </div>
    </div>
  );
};
