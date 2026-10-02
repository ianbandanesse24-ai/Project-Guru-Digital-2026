import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Sparkles,
  Printer,
  Clock,
  ArrowRight,
  School,
  CheckCircle2,
  FileSearch,
  Target,
  GitMerge,
  CalendarRange,
  CalendarCheck,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  HelpCircle,
  HeartHandshake,
  BookMarked,
  CalendarDays,
  Search,
  UserCheck,
  Download,
  ShieldCheck,
  Sliders,
  FolderSync,
  CheckCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  Layers,
  Compass,
  UploadCloud,
  Calculator,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import { UserAccount, SchoolProfile, AppTheme, ActiveMasterCPData } from '../types';
import { StorageService } from '../lib/storage';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { AMDLogo } from '../components/AMDLogo';

interface DashboardHomeViewProps {
  currentUser: UserAccount;
  onNavigate: (viewId: string) => void;
  onOpenSchoolProfile: () => void;
  theme?: AppTheme;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  currentUser,
  onNavigate,
  onOpenSchoolProfile,
}) => {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => StorageService.getSchoolProfile());
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'admin' | 'kaldik'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() => StorageService.getActiveMasterCP());
  const [isCPNotifExpanded, setIsCPNotifExpanded] = useState<boolean>(true);
  const [dismissCPNotif, setDismissCPNotif] = useState<boolean>(false);

  // Sync real-time updates for Master CP & School Profile
  useEffect(() => {
    const handleCPUpdate = () => {
      setActiveMasterCP(StorageService.getActiveMasterCP());
      setSchoolProfile(StorageService.getSchoolProfile());
    };

    window.addEventListener('storage', handleCPUpdate);
    window.addEventListener('master-cp-updated', handleCPUpdate);
    window.addEventListener('curriculum-parameters-synced', handleCPUpdate);

    return () => {
      window.removeEventListener('storage', handleCPUpdate);
      window.removeEventListener('master-cp-updated', handleCPUpdate);
      window.removeEventListener('curriculum-parameters-synced', handleCPUpdate);
    };
  }, []);

  const students = StorageService.getStudents();
  const schedule = StorageService.getSchedule();
  const aiDocs = StorageService.getAIDocuments();
  const users = StorageService.getUsers();
  const kalender = StorageService.getKalenderPendidikan();
  const adminSettings = StorageService.getAdminSettings();

  const pendingApprovals = users.filter((u) => u.status === 'pending');

  // Master CP summary statistics
  const sem1Materials = activeMasterCP?.materialsSem1 || [];
  const sem2Materials = activeMasterCP?.materialsSem2 || [];
  const totalBab = sem1Materials.length + sem2Materials.length;
  let totalTP = 0;
  sem1Materials.forEach((m) => { totalTP += (m.tpCount || 2); });
  sem2Materials.forEach((m) => { totalTP += (m.tpCount || 2); });
  if (totalTP === 0 && totalBab > 0) totalTP = totalBab * 2;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? 'Selamat Pagi'
      : hour < 15
      ? 'Selamat Siang'
      : hour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  const mainShortcuts = [
    {
      id: 'kelas_siswa',
      title: 'Kelola Kelas & Siswa',
      desc: 'Manajemen data rombongan belajar, NISN, dan biodata siswa terpusat',
      icon: Users,
      category: 'admin',
    },
    {
      id: 'absensi',
      title: 'Absensi Siswa',
      desc: 'Presensi harian, rekapitulasi sakit, izin, dan alpa secara otomatis',
      icon: CheckCircle2,
      category: 'admin',
    },
    {
      id: 'jadwal',
      title: 'Jadwal Mengajar',
      desc: 'Matriks jam tatap muka mingguan dan alokasi jam pelajaran',
      icon: Calendar,
      category: 'admin',
    },
    {
      id: 'agenda',
      title: 'Agenda Harian Mengajar',
      desc: 'Catatan kegiatan pembelajaran, tanggal pertemuan, dan keterlaksanaan',
      icon: ClipboardList,
      category: 'admin',
    },
    {
      id: 'jurnal',
      title: 'Jurnal Mengajar',
      desc: 'Refleksi pedagogis harian, catatan supervisi, dan tindak lanjut',
      icon: BookMarked,
      category: 'admin',
    },
    {
      id: 'guru_wali',
      title: 'Buku Wali Kelas & Rekap',
      desc: 'Rekapitulasi nilai, catatan kepribadian, dan biodata siswa asuh',
      icon: BookOpen,
      category: 'admin',
    },
    {
      id: 'cetak_laporan',
      title: 'Cetak Laporan Lengkap',
      desc: 'Pusat ekspor dokumen format resmi siap cetak ke format PDF atau Word',
      icon: Printer,
      category: 'admin',
      badge: 'PDF / Word',
    },
  ];

  const aiShortcuts = [
    {
      id: 'profil_guru_mapel',
      title: 'Profil Guru Mata Pelajaran',
      desc: 'Biodata guru & kepala sekolah serta rujukan dokumen Capaian Pembelajaran',
      icon: UserCheck,
      category: 'ai',
      badge: 'Acuan Utama',
    },
    {
      id: 'kalender_pendidikan',
      title: 'Upload Kaldik & Analisis Alokasi Waktu',
      desc: 'Upload dokumen Kalender Pendidikan sekolah & ekstraksi analisis RBE alokasi waktu JP',
      icon: CalendarDays,
      category: 'kaldik',
      badge: 'Kaldik & RBE',
    },
    {
      id: 'parameter_kurikulum',
      title: 'Parameter Kurikulum & Bab TP',
      desc: 'Konfigurasi terpadu mapel, JP/minggu, Bab materi & rumusan TP',
      icon: Sliders,
      category: 'kaldik',
      badge: 'Deep Learning',
    },
    {
      id: 'upload_cp_master',
      title: 'Upload & Analisis CP Master',
      desc: 'Upload dokumen Capaian Pembelajaran resmi dan analisis otomatis',
      icon: BookOpen,
      category: 'ai',
      badge: 'Master CP',
    },
    {
      id: 'analisis_cp_distribusi',
      title: 'Matriks Distribusi CP & Bab',
      desc: 'Pemetaan materi pokok, bab, dan pembagian semester ganjil-genap',
      icon: Layers,
      category: 'ai',
      badge: 'Matriks TP',
    },
    {
      id: 'ai_analisis_cp',
      title: '1. Analisis CP Terbaru',
      desc: 'Pemetaan elemen Capaian Pembelajaran dan integrasi kompetensi',
      icon: FileSearch,
      category: 'ai',
    },
    {
      id: 'ai_tp',
      title: '2. Tujuan Pembelajaran (TP)',
      desc: 'Perumusan kompetensi dan indikator ketercapaian Taksonomi Bloom',
      icon: Target,
      category: 'ai',
    },
    {
      id: 'ai_atp',
      title: '3. Alur TP (ATP)',
      desc: 'Penyusunan alur pembelajaran bertahap beserta alokasi jam pelajaran',
      icon: GitMerge,
      category: 'ai',
    },
    {
      id: 'ai_prota',
      title: '4. Program Tahunan (PROTA)',
      desc: 'Distribusi dan pembagian materi pembelajaran untuk satu tahun ajaran',
      icon: CalendarRange,
      category: 'ai',
    },
    {
      id: 'ai_prosem',
      title: '5. Program Semester (PROSEM)',
      desc: 'Matriks alokasi jadwal pekan efektif dan rencana bulanan semester',
      icon: CalendarCheck,
      category: 'ai',
    },
    {
      id: 'ai_kktp',
      title: '6. Kriteria Ketuntasan (KKTP)',
      desc: 'Interval nilai, rubrik asesmen, dan deskripsi kriteria mutu belajar',
      icon: CheckSquare,
      category: 'ai',
      badge: 'Standar Mutu',
    },
    {
      id: 'ai_modul_ajar',
      title: '7. RPM (Rencana Pelaksanaan Modul)',
      desc: 'Penyusunan Rencana Pelaksanaan Modul dengan sintaks Deep Learning',
      icon: FileText,
      category: 'ai',
      badge: 'RPM Terpadu',
    },
    {
      id: 'ai_lkpd',
      title: '8. Lembar Kerja Siswa (LKPD)',
      desc: 'Aktivitas pembelajaran berdiferensiasi dan penyelidikan terstruktur',
      icon: FileSpreadsheet,
      category: 'ai',
    },
    {
      id: 'ai_rubrik_penilaian',
      title: '9. Rubrik Penilaian Terpadu',
      desc: 'Rubrik asesmen autentik formatif dan sumatif yang selaras dengan modul',
      icon: HelpCircle,
      category: 'ai',
    },
  ];

  const allItems = [...aiShortcuts, ...mainShortcuts];

  const filteredItems = allItems.filter((item) => {
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'ai' && (item.category === 'ai' || item.category === 'kaldik')) ||
      (activeTab === 'admin' && item.category === 'admin') ||
      (activeTab === 'kaldik' && item.category === 'kaldik');

    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Admin Broadcast Announcement */}
      {adminSettings?.systemBroadcastMessage && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-center space-x-3 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-blue-950">Pengumuman: </span>
            <span>{adminSettings.systemBroadcastMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PEMBERITAHUAN CP MASTER BERHASIL DIUNGGAH & DISINKRONKAN KE PARAMETER */}
      {/* ========================================================================= */}
      {activeMasterCP && !dismissCPNotif && (
        <div className="rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-950/95 via-slate-900 to-indigo-950/90 text-white p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Banner Header */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <FolderSync className="w-5 h-5 text-emerald-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                    <span>PEMBERITAHUAN CP MASTER TERSINKRONISASI</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-indigo-300 mr-1" />
                    <span className="truncate max-w-[260px]">File: {activeMasterCP.fileName || 'Dokumen CP Master'}</span>
                  </span>
                  {activeMasterCP.lastSyncedAt && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Sinkron: {new Date(activeMasterCP.lastSyncedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug flex flex-wrap items-center gap-1.5">
                  <span>Capaian Pembelajaran (CP) Resmi:</span>
                  <span className="text-emerald-300 underline decoration-emerald-500/50 underline-offset-2">
                    {activeMasterCP.subject}
                  </span>
                  <span className="text-slate-300 font-normal text-xs sm:text-sm">
                    ({activeMasterCP.level} Kelas {activeMasterCP.grade} • {activeMasterCP.phase})
                  </span>
                  <span className="text-indigo-300 font-mono text-[11px] bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {activeMasterCP.fileName || 'Dokumen Resmi'}
                  </span>
                </h3>

                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Dokumen CP master <strong className="text-emerald-300">"{activeMasterCP.fileName || activeMasterCP.subject}"</strong> telah berhasil dianalisis dan tersinkronisasi penuh ke <strong>Parameter Kurikulum</strong>. Seluruh konfigurasi mata pelajaran, Bab &amp; ruang lingkup materi, serta alokasi JP otomatis aktif di seluruh 9 perangkat ajar.
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center space-x-1 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setIsCPNotifExpanded(!isCPNotifExpanded)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center space-x-1 border border-slate-700"
                title={isCPNotifExpanded ? 'Ciutkan Detail' : 'Buka Detail Lengkap'}
              >
                {isCPNotifExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-[10px] font-bold hidden md:inline">{isCPNotifExpanded ? 'Ringkas' : 'Rincian'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissCPNotif(true)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition border border-slate-700 hover:border-rose-700/60"
                title="Sembunyikan Pemberitahuan dari Beranda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded CP Synchronization Details */}
          {isCPNotifExpanded && (
            <div className="space-y-4 pt-2 border-t border-slate-800/80 relative z-10">
              {/* Parameter Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Mata Pelajaran</span>
                  <p className="font-extrabold text-white text-xs truncate">{activeMasterCP.subject}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Jenjang &amp; Kelas</span>
                  <p className="font-extrabold text-indigo-300 text-xs truncate">{activeMasterCP.level} Kelas {activeMasterCP.grade}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fase Kurikulum</span>
                  <p className="font-extrabold text-teal-300 text-xs">{activeMasterCP.phase}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Beban Belajar</span>
                  <p className="font-extrabold text-emerald-400 text-xs font-mono">{activeMasterCP.totalHoursPerYear} JP ({activeMasterCP.jpPerWeek} JP/Mgg)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">BAB / Ruang Lingkup</span>
                  <p className="font-extrabold text-amber-300 text-xs font-mono">
                    {totalBab} Bab ({sem1Materials.length} Sem 1, {sem2Materials.length} Sem 2)
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5 col-span-2 sm:col-span-4 lg:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Target TP &amp; ATP</span>
                  <p className="font-extrabold text-purple-300 text-xs font-mono">{totalTP} Tujuan Pembelajaran</p>
                </div>
              </div>

              {/* Connected Modules Ecosystem Pipeline */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ekosistem 9 Modul Perangkat Ajar yang Otomatis Tersinkron:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">Status: Siap Digunakan / Dicetak</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    onClick={() => onNavigate('ai_analisis_cp')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>1. Analisis CP</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_tp')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>2. TP</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_atp')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>3. ATP</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_prota')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>4. PROTA</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_prosem')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>5. PROSEM</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_kktp')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>6. KKTP</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_modul_ajar')}
                    className="px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/50 text-emerald-200 font-bold transition flex items-center space-x-1 shadow-xs"
                  >
                    <AMDLogo size="xs" />
                    <span>7. RPM Deep Learning</span>
                    <ArrowRight className="w-2.5 h-2.5 text-emerald-300" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_lkpd')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>8. LKPD</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('ai_rubrik_penilaian')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1"
                  >
                    <span>9. Rubrik Penilaian</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Main Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-banner-param-kurikulum"
                  onClick={() => onNavigate('parameter_kurikulum')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-950" />
                  <span>Buka Parameter Kurikulum</span>
                </button>

                <button
                  type="button"
                  id="btn-banner-rpm-modul"
                  onClick={() => onNavigate('ai_modul_ajar')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <AMDLogo size="xs" />
                  <span>Susun RPM / Modul Ajar</span>
                </button>

                <button
                  type="button"
                  id="btn-banner-analisis-cp"
                  onClick={() => onNavigate('ai_analisis_cp')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lihat Analisis CP Lengkap</span>
                </button>

                <button
                  type="button"
                  id="btn-banner-upload-cp"
                  onClick={() => onNavigate('upload_cp_master')}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition border border-slate-800 flex items-center space-x-1.5 cursor-pointer ml-auto"
                >
                  <FolderSync className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kelola CP Master Lain</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modern SaaS Header Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              <span>Administrasi Guru & Kurikulum Deep Learning</span>
              <span>•</span>
              <span>Tahun Ajaran 2025/2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {greeting}, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Kelola data presensi, jadwal tatap muka, jurnal guru, dan susun perangkat kurikulum secara terpadu dalam satu antarmuka modern.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <button
                type="button"
                id="btn-dashboard-school-profile"
                onClick={onOpenSchoolProfile}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors duration-150"
              >
                <School className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>{schoolProfile.schoolName}</span>
              </button>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
                TA {schoolProfile.academicYear} ({schoolProfile.semester})
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/70">
                {currentUser.role === 'admin' ? 'Administrator' : 'Guru Mapel / Wali'}
              </span>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
            <button
              id="btn-quick-rpm"
              onClick={() => onNavigate('ai_modul_ajar')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-xs shadow-xs transition-all duration-150"
            >
              <AMDLogo size="xs" />
              <span>Susun RPM / Modul Ajar</span>
            </button>
            <button
              id="btn-quick-kaldik"
              onClick={() => onNavigate('kalender_pendidikan')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs shadow-xs transition-all duration-150"
            >
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Kalender & Alokasi JP</span>
            </button>
          </div>
        </div>
      </div>

      {/* PWA & Multi-Device Offline Ready Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-slate-900">
                Aplikasi PWA Multi-Perangkat (Offline & Online)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Offline Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dapat dipasang di HP Android, iPhone/iPad, tablet, dan laptop. Data tersimpan aman di perangkat saat offline.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <PWAInstallButton variant="compact" className="w-full sm:w-auto" />
        </div>
      </div>

      {/* Admin Approval Notice Banner */}
      {currentUser.role === 'admin' && pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Ada {pendingApprovals.length} Pengajuan Akun Guru.</span>
              <span className="text-amber-800 ml-1">Menunggu persetujuan dan otorisasi dari administrator.</span>
            </div>
          </div>
          <button
            id="btn-review-approval"
            onClick={() => onNavigate('admin_access')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors duration-150 shrink-0 shadow-xs"
          >
            Tinjau Otorisasi
          </button>
        </div>
      )}

      {/* 4 Statistics Metrics (Clean SaaS Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Siswa terdaftar aktif</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Beban Mengajar</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-blue-600 mt-2">
            {schedule.length * 2} JP
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{schedule.length} sesi pertemuan/minggu</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Perangkat Kurikulum</span>
            <AMDLogo size="xs" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {aiDocs.length} Modul
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tersimpan di sistem</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Pekan Efektif</span>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {kalender.semester1?.totalEffectiveWeeks || 19} RBE
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Semester Ganjil 2025/2026</div>
        </div>
      </div>

      {/* Tab Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Filter Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80">
          <button
            id="tab-filter-all"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Modul ({allItems.length})
          </button>
          <button
            id="tab-filter-ai"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'ai'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kurikulum & Perangkat ({aiShortcuts.length})
          </button>
          <button
            id="tab-filter-admin"
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Administrasi Pokok ({mainShortcuts.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="input-search-modules"
            type="text"
            placeholder="Cari modul atau administrasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* Grid of All Application Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`card-module-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500/40 hover:shadow-xs transition-all duration-200 text-left flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center border border-slate-200/80 group-hover:border-blue-200 transition-colors duration-150">
                  <Icon className="w-4 h-4" />
                </div>
                {'badge' in item && Boolean(item.badge) && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {String(item.badge)}
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-150">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors duration-150">
                <span>Buka Modul</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
