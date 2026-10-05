import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  School,
  FileSearch,
  FileText,
  Calendar,
  Layers,
  Search,
  ChevronRight,
  UserCheck,
  HeartHandshake,
  FileSpreadsheet,
  Printer,
  Check,
  Users,
  Compass,
  Sliders,
  CalendarDays,
  X,
  Sparkles,
  Smartphone,
  Award,
  Clock,
  ArrowUpRight,
  BookMarked,
  ClipboardList,
  Target,
  GitMerge,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  HelpCircle,
  Laptop,
  Apple,
  RefreshCw,
  Copy,
  Zap,
  Activity,
  Flame,
  LayoutGrid,
} from 'lucide-react';
import { UserAccount, CPReference, SchoolLevel } from '../types';
import { StorageService } from '../lib/storage';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface WelcomeSyncViewProps {
  currentUser: UserAccount;
  onNavigate: (viewId: string) => void;
}

type DeviceMode = 'auto' | 'android' | 'ios' | 'windows';

export const WelcomeSyncView: React.FC<WelcomeSyncViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'pipeline' | 'cp_catalog' | 'admin_desk'>('workspace');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');
  const [cpList] = useState<CPReference[]>(() => StorageService.getCPReferences());
  const [schoolProfile] = useState(() => StorageService.getSchoolProfile());
  const [activeMasterCP, setActiveMasterCP] = useState(() => StorageService.getActiveMasterCP());
  const [selectedLevel, setSelectedLevel] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewCP, setPreviewCP] = useState<CPReference | null>(null);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [copiedInspiration, setCopiedInspiration] = useState<boolean>(false);
  const [inspirationIdx, setInspirationIdx] = useState<number>(0);

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
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  }, [currentTime]);

  // Time-of-day greeting
  const hour = currentTime.getHours();
  const greetingTime =
    hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  // Pedagogical reflections (Deep Learning 3 Pilar: Mindful, Meaningful, Joyful)
  const pedagogicalInspirations = [
    {
      pilar: 'Mindful Learning (Berkesadaran)',
      quote: 'Awali KBM hari ini dengan "Hening Sejenak 2 Menit" agar peserta didik menyadari kehadiran fisik, mental, dan emosi mereka sebelum menyerap materi esensial.',
      actionPrompt: 'Pertanyaan pemantik: "Apa satu hal menarik yang kalian amati dari fenomena alam di sekitar sebelum masuk kelas?"',
      color: 'from-blue-600 to-indigo-700',
      badge: 'Fokus & Kesadaran',
    },
    {
      pilar: 'Meaningful Learning (Bermakna)',
      quote: 'Kaitkan setiap Tujuan Pembelajaran (TP) dengan masalah nyata kehidupan siswa di daerah setempat agar ilmu tidak berhenti sekadar hafalan ujian.',
      actionPrompt: 'Pertanyaan pemantik: "Bagaimana konsep yang kita pelajari ini dapat membantu menyelesaikan masalah nyata di lingkungan sekolah kalian?"',
      color: 'from-emerald-600 to-teal-700',
      badge: 'Relevansi Kontekstual',
    },
    {
      pilar: 'Joyful Learning (Menyenangkan)',
      quote: 'Ciptakan ruang aman untuk bereksplorasi. Kesalahan dalam menjawab adalah gerbang awal penyelidikan mendalam (Inquiry-based investigation).',
      actionPrompt: 'Tantangan kelas: Berikan teka-teki mini berkelompok 5 menit sebelum masuk ke demonstrasi lembar kerja (LKPD).',
      color: 'from-amber-600 to-orange-700',
      badge: 'Antusiasme Belajar',
    },
  ];

  const currentInspiration = pedagogicalInspirations[inspirationIdx % pedagogicalInspirations.length];

  const handleCopyInspiration = () => {
    const text = `[${currentInspiration.pilar}]\n${currentInspiration.quote}\n${currentInspiration.actionPrompt}`;
    navigator.clipboard?.writeText(text);
    setCopiedInspiration(true);
    setTimeout(() => setCopiedInspiration(false), 2000);
  };

  // Filter CP Reference list
  const filteredCPs = useMemo(() => {
    return cpList.filter((cp) => {
      const matchLevel = selectedLevel === 'SEMUA' || cp.level === selectedLevel;
      const matchSearch =
        !searchQuery.trim() ||
        cp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cp.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cp.phase.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [cpList, selectedLevel, searchQuery]);

  // Teaching Readiness checklist
  const readinessItems = [
    {
      id: 'profil_guru_mapel',
      title: 'Biodata & Satuan Pendidikan',
      status: schoolProfile.teacherName ? 'Terkonfigurasi' : 'Belum Lengkap',
      description: schoolProfile.teacherName
        ? `${schoolProfile.teacherName} · ${schoolProfile.subject || 'Fisika'} (${schoolProfile.level || 'SMA'} Kelas ${schoolProfile.grade || 10})`
        : 'Lengkapi biodata guru, jenjang, mata pelajaran & NIP pengampu',
      isReady: Boolean(schoolProfile.teacherName && schoolProfile.subject),
      actionLabel: 'Atur Profil',
      viewId: 'profil_guru_mapel',
      accent: 'blue',
    },
    {
      id: 'ai_analisis_cp',
      title: 'Analisis Capaian Pembelajaran (CP)',
      status: activeMasterCP ? 'Tersinkronisasi' : 'Belum Dipetakan',
      description: activeMasterCP
        ? `${activeMasterCP.subject} (${activeMasterCP.phase} · ${(activeMasterCP.materialsSem1?.length || 0) + (activeMasterCP.materialsSem2?.length || 0)} Materi Pokok)`
        : 'Pemetaan elemen CP BSKAP 020/2026 & pemisahan materi Sem 1 & 2',
      isReady: Boolean(activeMasterCP),
      actionLabel: 'Analisis CP',
      viewId: 'ai_analisis_cp',
      accent: 'emerald',
    },
    {
      id: 'kalender_pendidikan',
      title: 'Alokasi Waktu & Kaldik RBE',
      status: 'Pekan Efektif Aktif',
      description: 'Perhitungan 19 pekan efektif semester ganjil & 18 pekan semester genap',
      isReady: true,
      actionLabel: 'Buka Kaldik',
      viewId: 'kalender_pendidikan',
      accent: 'indigo',
    },
    {
      id: 'kelas_siswa',
      title: 'Daftar Siswa & Rombongan Belajar',
      status: 'Database Terhubung',
      description: 'Presensi harian, jurnal kelas, dan rekap kehadiran siswa',
      isReady: true,
      actionLabel: 'Buka Siswa',
      viewId: 'kelas_siswa',
      accent: 'violet',
    },
  ];

  const readyCount = readinessItems.filter((i) => i.isReady).length;

  // 9 Essential Curriculum Modules Pipeline
  const pipelineSteps = [
    {
      id: 'kalender_pendidikan',
      stepNum: 0,
      title: 'Analisis Alokasi Waktu (RBE)',
      role: 'Pondasi Struktur Jam',
      desc: 'Menghitung pekan efektif, jam tatap muka riil, dan cadangan waktu KBM sesuai kalender pendidikan dinas.',
      badge: 'RBE Resmi',
      icon: CalendarDays,
      viewId: 'kalender_pendidikan',
    },
    {
      id: 'ai_analisis_cp',
      stepNum: 1,
      title: 'Analisis & Distribusi CP',
      role: 'Master Acuan Kurikulum',
      desc: 'Mendekomposisi elemen CP resmi BSKAP No. 020/2026 menjadi pemetaan materi esensial Semester 1 dan 2.',
      badge: 'Single Source',
      icon: FileSearch,
      viewId: 'ai_analisis_cp',
    },
    {
      id: 'ai_tp',
      stepNum: 2,
      title: 'Tujuan Pembelajaran (TP)',
      role: 'Target Kompetensi Siswa',
      desc: 'Merumuskan kalimat TP dengan kaidah baku ABCD dan kata kerja operasional (KKO) Taksonomi Bloom revisi.',
      badge: 'Kaidah ABCD',
      icon: Target,
      viewId: 'ai_tp',
    },
    {
      id: 'ai_atp',
      stepNum: 3,
      title: 'Alur Tujuan (ATP 10 Kolom)',
      role: 'Sekuensial Pembelajaran',
      desc: 'Menyusun alur linier logis dari materi konkret ke abstrak, lengkap dengan estimasi alokasi jam tatap muka.',
      badge: 'Standar 10 Kolom',
      icon: GitMerge,
      viewId: 'ai_atp',
    },
    {
      id: 'ai_prota',
      stepNum: 4,
      title: 'Program Tahunan (PROTA)',
      role: 'Distribusi Alokasi 1 Tahun',
      desc: 'Pemetaan total beban belajar per materi pokok untuk satu tahun ajaran penuh (Semester Ganjil & Genap).',
      badge: 'Matriks Tahunan',
      icon: CalendarRange,
      viewId: 'ai_prota',
    },
    {
      id: 'ai_prosem',
      stepNum: 5,
      title: 'Program Semester (PROSEM)',
      role: 'Matriks Pekanan Berwarna',
      desc: 'Jadwal tatap muka mingguan, penempatan Asesmen Formatif/Sumatif, dan jeda tengah semester.',
      badge: 'Matriks Pekan',
      icon: CalendarCheck,
      viewId: 'ai_prosem',
    },
    {
      id: 'ai_kktp',
      stepNum: 6,
      title: 'Kriteria Ketuntasan (KKTP)',
      role: 'Instrumen Standar Ketercapaian',
      desc: 'Menentukan interval skor, rubrik bertingkat 4 level, dan deskripsi ketercapaian tujuan pembelajaran.',
      badge: 'Rubrik 4 Level',
      icon: CheckSquare,
      viewId: 'ai_kktp',
    },
    {
      id: 'ai_modul_ajar',
      stepNum: 7,
      title: 'RPM / Modul Ajar Deep Learning',
      role: 'Rencana Pelaksanaan KBM',
      desc: 'Sintaks KBM 6 Fase (Mindful, Meaningful, & Joyful) Bagian A s.d. X lengkap dengan diferensiasi proses.',
      badge: 'Dokumen Inti',
      icon: FileText,
      viewId: 'ai_modul_ajar',
    },
    {
      id: 'ai_lkpd',
      stepNum: 8,
      title: 'LKPD Siswa Berdiferensiasi',
      role: 'Kanvas Penyelidikan Siswa',
      desc: 'Lembar kerja aktivitas inkuiri, diagram sketsa kolaboratif, dan refleksi 3-2-1 yang sinkron dengan RPM.',
      badge: 'Instrumen Siswa',
      icon: FileSpreadsheet,
      viewId: 'ai_lkpd',
    },
    {
      id: 'ai_rubrik_penilaian',
      stepNum: 9,
      title: 'Rubrik Penilaian Terpadu',
      role: 'Asesmen Otentik 3 Pilar',
      desc: 'Rubrik sikap Profil Pelajar (6C), lembar observasi performa LKPD, dan kisi-kisi soal sumatif HOTS.',
      badge: 'Sikap & Kinerja',
      icon: HelpCircle,
      viewId: 'ai_rubrik_penilaian',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. DYNAMIC HEADER & DEVICE-ADAPTIVE STATUS BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        {/* Subtle decorative lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar: Live Clock, School Meta, & Platform Mode Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                {schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-medium">
                T.A. {schoolProfile.academicYear || '2025/2026'} ({schoolProfile.semester || 'Semester Ganjil'})
              </span>
              <span className="text-slate-400">·</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                BSKAP No. 020/2026
              </span>
            </div>

            {/* Interactive Device Adaptive Preview Switcher */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 text-xs">
                <span className="text-[11px] font-medium text-slate-400 px-2 hidden sm:inline">
                  Tata Letak:
                </span>
                <button
                  type="button"
                  onClick={() => setDeviceMode('android')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'android'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Optimal untuk Android: Target sentuh lebar & akses navigasi cepat"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('ios')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'ios'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Optimal untuk iOS / iPad: Tampilan frosted clean & tipografi SF Pro"
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span className="text-[11px]">iOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('windows')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'windows'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Optimal untuk Windows & Desktop: Kerapatan data tinggi & pintasan kerja"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Windows</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('auto')}
                  className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                    deviceMode === 'auto'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Otomatis menyesuaikan layar perangkat"
                >
                  <span className="text-[11px]">Auto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Main Content */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  {formattedDate} · <strong className="text-white font-bold">{formattedClock}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {greetingTime},{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
                  {currentUser.name}
                </span>
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
                Pusat Kendali Administrasi KBM &amp; Studio Kurikulum Merdeka. Seluruh data Capaian Pembelajaran,
                alokasi jam tatap muka, dan format 9 dokumen resmi tersinkronisasi secara otomatis tanpa redundansi.
              </p>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Mapel Aktif: <strong className="text-white">{schoolProfile.subject || 'Fisika'} ({schoolProfile.level || 'SMA'} Kelas {schoolProfile.grade || 10})</strong></span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Kesiapan KBM: <strong className="text-emerald-400">{readyCount}/4 Pilar Terverifikasi</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Dock */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/40 cursor-pointer"
              >
                <span>Buka Dashboard Utama</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ai_modul_ajar')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Susun RPM / Modul Ajar</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ai_analisis_cp')}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
              >
                <FileSearch className="w-4 h-4 text-blue-400" />
                <span>Analisis &amp; Distribusi CP</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE WORKSPACE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'workspace'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${activeTab === 'workspace' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Pusat Kendali Pengajar</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold">
            Aktif
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'pipeline' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Alur 9 Perangkat Pembelajaran</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-bold">
            10 Modul
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cp_catalog')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'cp_catalog'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileSearch className={`w-4 h-4 ${activeTab === 'cp_catalog' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Katalog CP Resmi BSKAP</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold">
            {cpList.length} Mapel
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin_desk')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'admin_desk'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ClipboardList className={`w-4 h-4 ${activeTab === 'admin_desk' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Presensi &amp; Administrasi Kelas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKSPACE & BENTO GRID HUB */}
      {/* ========================================================================= */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Bento Grid Row 1: Readiness Matrix & Deep Learning Inspiration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Readiness Checklist Card */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Pemeriksaan 4 Pilar Kesiapan Pembelajaran</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data rujukan otomatis yang mendasari seluruh dokumen kurikulum semester ini.
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  {readyCount === 4 ? '✅ 100% Siap Digunakan' : `${readyCount} dari 4 Komponen Siap`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {readinessItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all bg-slate-50/60 hover:bg-white flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {item.status}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          item.isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate(item.viewId)}
                      className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep Learning Pedagogical Spark Card */}
            <div className={`bg-gradient-to-br ${currentInspiration.color} text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide">
                    {currentInspiration.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspirationIdx((prev) => prev + 1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer text-white/90 hover:text-white"
                    title="Ganti Inspirasi Pedagogis"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="text-xs text-white/80 font-medium">3 Pilar Deep Learning:</div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {currentInspiration.pilar}
                  </h3>
                </div>

                <blockquote className="text-xs text-white/95 leading-relaxed italic bg-black/15 p-3.5 rounded-2xl border border-white/10">
                  "{currentInspiration.quote}"
                </blockquote>

                <div className="text-[11px] text-white/90 bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                  <div className="font-bold text-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Rekomendasi Pemantik KBM:</span>
                  </div>
                  <p className="leading-relaxed">{currentInspiration.actionPrompt}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyInspiration}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer backdrop-blur-sm"
                >
                  {copiedInspiration ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pemantik KBM</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ai_modul_ajar')}
                  className="py-2 px-3 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center space-x-1 cursor-pointer"
                  title="Gunakan dalam modul ajar"
                >
                  <span>Terapkan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Launchpad: 6 Core Teacher Operations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Jalur Cepat Kerja Guru (One-Click Operations)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akses langsung ke instrumen inti administrasi KBM tanpa navigasi berlapis.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  id: 'ai_modul_ajar',
                  title: 'Modul Ajar / RPM',
                  desc: 'Format Bagian A - X',
                  icon: FileText,
                  color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400',
                  badge: '6 Fase KBM',
                },
                {
                  id: 'ai_analisis_cp',
                  title: 'Analisis CP',
                  desc: 'Dekomposisi BSKAP',
                  icon: FileSearch,
                  color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400',
                  badge: 'Semester 1 & 2',
                },
                {
                  id: 'ai_tp',
                  title: 'TP & ATP',
                  desc: 'Kaidah ABCD & 10 Kolom',
                  icon: Target,
                  color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-400',
                  badge: 'Bloom HOTS',
                },
                {
                  id: 'absensi',
                  title: 'Presensi Harian',
                  desc: 'Absensi Siswa Real-time',
                  icon: CheckCircle2,
                  color: 'text-teal-600 bg-teal-50 border-teal-200 hover:border-teal-400',
                  badge: 'Hadir/Sakit/Izin',
                },
                {
                  id: 'agenda',
                  title: 'Jurnal & Agenda',
                  desc: 'Refleksi Mengajar',
                  icon: ClipboardList,
                  color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400',
                  badge: 'Catatan KBM',
                },
                {
                  id: 'cetak_laporan',
                  title: 'Cetak & Ekspor',
                  desc: 'Word, Excel, & PDF',
                  icon: Printer,
                  color: 'text-violet-600 bg-violet-50 border-violet-200 hover:border-violet-400',
                  badge: 'Kop Resmi',
                },
              ].map((op) => {
                const Icon = op.icon;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => onNavigate(op.id)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:shadow-sm transition-all text-left flex flex-col justify-between space-y-2.5 bg-slate-50/50 hover:bg-white group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${op.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {op.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {op.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {op.desc}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 group-hover:text-blue-600">
                      <span>Buka</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PWA & Offline Support Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Dapat Dipasang Sebagai Aplikasi Mandiri (Android, iOS, Windows, Mac)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bekerja secara offline tanpa koneksi internet. Seluruh data presensi dan berkas draf tersimpan secara aman di memori lokal perangkat Anda.
                </p>
              </div>
            </div>
            <PWAInstallButton variant="compact" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE 9-STEP PIPELINE STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Peta Alur 9 Perangkat Pembelajaran Mandiri &amp; Terpadu</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik pada setiap tahapan untuk melihat rujukan resmi BSKAP No. 020/2026 dan langsung membuka generatornya.
              </p>
            </div>

            {/* Step Grid Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {pipelineSteps.map((step, idx) => {
                const isSelected = activePipelineStep === idx;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActivePipelineStep(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {step.stepNum}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">
                      {step.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Detail Card */}
            {pipelineSteps[activePipelineStep] && (
              <div className="p-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                      {pipelineSteps[activePipelineStep].stepNum}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {pipelineSteps[activePipelineStep].title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          {pipelineSteps[activePipelineStep].badge}
                        </span>
                      </div>
                      <p className="text-xs text-blue-900 font-semibold mt-0.5">
                        Kedudukan dalam Kurikulum: {pipelineSteps[activePipelineStep].role}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(pipelineSteps[activePipelineStep].viewId)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md shrink-0 cursor-pointer"
                  >
                    <span>Buka Modul Ini Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pipelineSteps[activePipelineStep].desc}
                </p>

                {/* Stepper controls */}
                <div className="flex items-center justify-between pt-2 text-xs border-t border-blue-100/70">
                  <button
                    type="button"
                    disabled={activePipelineStep === 0}
                    onClick={() => setActivePipelineStep((prev) => Math.max(0, prev - 1))}
                    className="text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  >
                    ← Tahap Sebelumnya
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tahap {activePipelineStep + 1} dari {pipelineSteps.length}
                  </span>
                  <button
                    type="button"
                    disabled={activePipelineStep === pipelineSteps.length - 1}
                    onClick={() => setActivePipelineStep((prev) => Math.min(pipelineSteps.length - 1, prev + 1))}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  >
                    Tahap Selanjutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CP REFERENCE CATALOG (BSKAP 020/2026) */}
      {/* ========================================================================= */}
      {activeTab === 'cp_catalog' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-blue-600" />
                  <span>Katalog Capaian Pembelajaran Resmi BSKAP No. 020/2026</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Telusuri dokumen Capaian Pembelajaran baku untuk menyusun perangkat pembelajaran jenjang Anda.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate('upload_cp_master')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kelola Master CP</span>
                </button>
              )}
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                {['SEMUA', 'SD', 'SMP', 'SMA', 'SMK'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedLevel === lvl
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari mata pelajaran atau fase..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white text-slate-900 border border-slate-200 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {filteredCPs.map((cp) => (
                <div
                  key={cp.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3 bg-white hover:shadow-xs group text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {cp.level} · {cp.phase}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Tersinkron
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {cp.title}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      Mata Pelajaran: <strong className="text-slate-700">{cp.subject}</strong> · Regulasi: {cp.curriculumVersion}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewCP(cp)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Elemen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('ai_analisis_cp')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Gunakan CP
                    </button>
                  </div>
                </div>
              ))}

              {filteredCPs.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  Tidak ada dokumen CP yang cocok dengan kata kunci pencarian.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRESENSI & ADMINISTRASI KELAS */}
      {/* ========================================================================= */}
      {activeTab === 'admin_desk' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Modul Administrasi Harian &amp; Pengelolaan Peserta Didik</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan presensi, pembukuan agenda KBM, jadwal tatap muka, dan cetak lembar administrasi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'kelas_siswa',
                  title: 'Kelola Kelas & Siswa',
                  desc: 'Input dan impor daftar nama siswa, NISN, rombel, dan biodata peserta didik.',
                  icon: Users,
                },
                {
                  id: 'absensi',
                  title: 'Absensi Siswa Harian',
                  desc: 'Pencatatan presensi kehadiran (Hadir, Sakit, Izin, Alpa) dan persentase rekapitulasi.',
                  icon: CheckCircle2,
                },
                {
                  id: 'jadwal',
                  title: 'Jadwal Mengajar',
                  desc: 'Matriks jam tatap muka mingguan, alokasi ruang kelas, dan jam pelajaran (JP).',
                  icon: Calendar,
                },
                {
                  id: 'agenda',
                  title: 'Agenda Harian Guru',
                  desc: 'Pencatatan kegiatan pembelajaran harian, pertemuan ke-N, dan tingkat keterlaksanaan.',
                  icon: ClipboardList,
                },
                {
                  id: 'jurnal',
                  title: 'Jurnal Mengajar & Refleksi',
                  desc: 'Evaluasi ketercapaian TP, catatan kejadian di kelas, dan tindak lanjut supervisi.',
                  icon: BookMarked,
                },
                {
                  id: 'guru_wali',
                  title: 'Buku Wali Kelas & Rekap',
                  desc: 'Rekapitulasi nilai, catatan kepribadian, dan pembinaan siswa asuh binaan.',
                  icon: BookOpen,
                },
                {
                  id: 'cetak_laporan',
                  title: 'Pusat Cetak & Ekspor',
                  desc: 'Unduh laporan resmi format Word, Excel, atau cetak PDF langsung dengan Kop Sekolah.',
                  icon: Printer,
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => onNavigate(feat.id)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50 transition-all text-left flex flex-col justify-between space-y-2.5 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {feat.desc}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                      <span>Buka Modul</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL CP PREVIEW */}
      {previewCP && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{previewCP.level} · {previewCP.phase}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-semibold">{previewCP.curriculumVersion}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {previewCP.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCP(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mata Pelajaran:</span>
                  <p className="font-bold text-slate-900">{previewCP.subject}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fase &amp; Kelas:</span>
                  <p className="font-bold text-slate-900">{previewCP.phase}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Regulasi Rujukan:</span>
                  <p className="font-semibold text-slate-800">{previewCP.curriculumVersion}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Status Analisis:</span>
                  <p className="font-semibold text-emerald-700">Tersedia di Sistem</p>
                </div>
              </div>

              {previewCP.elements && previewCP.elements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs">Elemen &amp; Deskripsi Capaian Pembelajaran:</h4>
                  {previewCP.elements.map((elem, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="font-bold text-blue-700 text-xs">
                        Elemen {i + 1}: {elem.name}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{elem.description}</p>
                      {elem.competencies && elem.competencies.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Kompetensi Inti:
                          </span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 mt-1 space-y-0.5 text-[11px]">
                            {elem.competencies.map((c, ci) => (
                              <li key={ci}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPreviewCP(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewCP(null);
                  onNavigate('ai_analisis_cp');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Gunakan CP Ini untuk Susun Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
