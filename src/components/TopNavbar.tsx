import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  BookOpen,
  Sparkles,
  Calendar,
  ClipboardList,
  Printer,
  Compass,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  Palette,
  UserCheck,
  BookMarked,
  CalendarDays,
  Sliders,
  Table,
  FileSearch,
  Target,
  GitMerge,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  UploadCloud,
  Key,
  Database,
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
  iconColor: string;
  items: {
    id: string;
    label: string;
    icon?: React.ElementType;
    iconColor?: string;
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
      iconColor: 'text-sky-600',
      items: [
        { id: 'kelas_siswa', label: 'Kelola Kelas & Siswa', icon: UserCheck, iconColor: 'text-sky-600' },
        { id: 'absensi', label: 'Absensi & Presensi', icon: Users, iconColor: 'text-emerald-600' },
        { id: 'jadwal', label: 'Jadwal Mengajar', icon: Calendar, iconColor: 'text-violet-600' },
        { id: 'agenda', label: 'Agenda Harian', icon: ClipboardList, iconColor: 'text-amber-600' },
        { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookMarked, iconColor: 'text-rose-600' },
        { id: 'guru_wali', label: 'Buku Wali Kelas & Rekap', icon: BookOpen, iconColor: 'text-indigo-600' },
        { id: 'cetak_laporan', label: 'Pusat Cetak Dokumen', icon: Printer, iconColor: 'text-teal-600' },
      ],
    },
    {
      id: 'kurikulum_ai',
      label: 'Kurikulum & Perangkat Ajar',
      icon: Sparkles,
      iconColor: 'text-teal-600',
      items: [
        { id: 'profil_guru_mapel', label: 'Profil Guru Mata Pelajaran', icon: UserCheck, iconColor: 'text-blue-600', badge: 'Acuan' },
        { id: 'kalender_pendidikan', label: 'Upload Kalender Pendidikan', icon: CalendarDays, iconColor: 'text-orange-600', badge: 'Kaldik' },
        { id: 'parameter_kurikulum', label: 'Parameter Kurikulum & Beban Belajar', icon: Sliders, iconColor: 'text-purple-600', badge: 'Bab TP' },
        { id: 'analisis_alokasi_waktu', label: '1. Analisis Alokasi Waktu', icon: Table, iconColor: 'text-cyan-600', badge: 'PROSEM' },
        { id: 'ai_analisis_cp', label: '2. Analisis Capaian Pembelajaran (CP)', icon: FileSearch, iconColor: 'text-indigo-600', badge: 'Format' },
        { id: 'ai_tp', label: '3. Tujuan Pembelajaran (TP)', icon: Target, iconColor: 'text-teal-600' },
        { id: 'ai_atp', label: '4. Alur Tujuan Pembelajaran (ATP)', icon: GitMerge, iconColor: 'text-emerald-600' },
        { id: 'ai_prota', label: '5. Program Tahunan (PROTA)', icon: CalendarRange, iconColor: 'text-sky-600' },
        { id: 'ai_prosem', label: '6. Program Semester (PROSEM)', icon: CalendarCheck, iconColor: 'text-green-600' },
        { id: 'ai_kktp', label: '7. Kriteria Ketuntasan (KKTP)', icon: CheckSquare, iconColor: 'text-amber-600' },
        { id: 'ai_modul_ajar', label: '8. RPM / Modul Ajar', icon: FileText, iconColor: 'text-rose-600', badge: 'RPM' },
        { id: 'ai_lkpd', label: '9. LKPD Siswa', icon: FileSpreadsheet, iconColor: 'text-fuchsia-600', badge: 'LKPD' },
        { id: 'ai_rubrik_penilaian', label: '10. Rubrik Penilaian Terpadu', icon: HelpCircle, iconColor: 'text-pink-600' },
      ],
    },
    {
      id: 'asisten_ai',
      label: 'Asisten & Setup',
      icon: Compass,
      iconColor: 'text-amber-600',
      items: [
        { id: 'welcome_sync', label: 'Ucapan Selamat Datang', icon: Sparkles, iconColor: 'text-amber-600', badge: 'Halo' },
        { id: 'saran', label: 'Kotak Saran & Masukan', icon: MessageSquare, iconColor: 'text-pink-600' },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      id: 'panel_admin',
      label: 'Panel Admin',
      icon: ShieldCheck,
      iconColor: 'text-violet-600',
      items: [
        { id: 'admin_dashboard', label: 'Dashboard & Log Audit', icon: ShieldCheck, iconColor: 'text-violet-600' },
        { id: 'admin_upload_cp', label: 'Upload CP Master', icon: UploadCloud, iconColor: 'text-sky-600', badge: 'CP' },
        { id: 'admin_api_key', label: 'Manajemen API Key AMD', icon: Key, iconColor: 'text-amber-600', badge: 'AMD' },
        { id: 'admin_tokens', label: 'Manajemen Token & Kuota Sistem', icon: Sparkles, iconColor: 'text-emerald-600' },
        { id: 'admin_access', label: 'Otorisasi Akun Guru', icon: Users, iconColor: 'text-blue-600' },
        { id: 'admin_sync', label: 'Sinkronisasi Supabase & GitHub', icon: Database, iconColor: 'text-indigo-600', badge: 'Auto' },
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
          <span className="text-[11px] font-bold text-emerald-400">AMD Digital</span>
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
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
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
                <group.icon className={`w-3.5 h-3.5 ${group.iconColor}`} />
                <span>{group.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Flyout Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xl z-30 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    {group.label}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {group.items.map((item) => {
                      const isItemActive = activeView === item.id;
                      const ItemIcon = item.icon;
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
                          <div className="flex items-center space-x-2 min-w-0">
                            {ItemIcon && <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor || 'text-slate-500'}`} />}
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200 ml-2 shrink-0">
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
          <MessageSquare className="w-3.5 h-3.5 text-pink-600" />
          <span>Saran & Masukan</span>
        </button>

        {/* Pilihan Tema Bebas */}
        {onOpenThemeModal && (
          <button
            onClick={() => {
              onOpenThemeModal();
              setOpenDropdown(null);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            title="Pilihan Tema Bebas (Warna, Font, Tata Letak)"
          >
            <Palette className="w-3.5 h-3.5 text-violet-600" />
            <span>Pilihan Tema</span>
          </button>
        )}

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
