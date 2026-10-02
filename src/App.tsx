import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Bell,
  LogOut,
  School,
  Sparkles,
  Download,
  Trash2,
  Zap,
  ShieldCheck,
  RotateCcw,
  Palette,
  LayoutDashboard,
  Users,
  FileSearch,
  FileText,
  Calendar,
} from 'lucide-react';
import { UserAccount, UserNotification, SchoolProfile, AppTheme, TokenQuotaStatus } from './types';
import { StorageService, addStorageListener } from './lib/storage';
import { useOfflineSync } from './lib/offlineManager';
import { normalizeThemeConfig, applyThemeToDOM } from './lib/theme';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { AuthModal } from './components/AuthModal';
import { SchoolProfileModal } from './components/SchoolProfileModal';
import { OfflineSyncIndicator } from './components/OfflineSyncIndicator';
import { TokenQuotaModal } from './components/TokenQuotaModal';
import { CurriculumResetModal } from './components/CurriculumResetModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AMDLogo } from './components/AMDLogo';
import { CloudAutoSyncService } from './lib/cloudAutoSync';

// Views
import { DashboardHomeView } from './views/DashboardHomeView';
import { AbsensiView } from './views/AbsensiView';
import { JadwalView } from './views/JadwalView';
import { AgendaView } from './views/AgendaView';
import { JurnalView } from './views/JurnalView';
import { GuruWaliView } from './views/GuruWaliView';
import { CetakLaporanView } from './views/CetakLaporanView';
import { AIAssistantView } from './views/AIAssistantView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminApiKeyManager } from './components/AdminApiKeyManager';
import { SaranView } from './views/SaranView';
import { WelcomeSyncView } from './views/WelcomeSyncView';
import { SupabaseSyncView } from './views/SupabaseSyncView';
import { KelasSiswaView } from './views/KelasSiswaView';
import { AnalisisCPDistributionView } from './views/AnalisisCPDistributionView';
import { ProfilGuruMapelView } from './views/ProfilGuruMapelView';
import { ParameterKurikulumView } from './views/ParameterKurikulumView';
import { KalenderPendidikanView } from './views/KalenderPendidikanView';
import { UploadCPMasterView } from './views/UploadCPMasterView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StorageService.getCurrentUser()
  );
  const [activeView, setActiveView] = useState<string>('welcome_sync');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(!currentUser);
  const [showSchoolModal, setShowSchoolModal] = useState<boolean>(false);
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [tokenQuota, setTokenQuota] = useState<TokenQuotaStatus>(() =>
    StorageService.getTokenQuotaStatus(currentUser)
  );
  const [theme, setTheme] = useState<AppTheme>(() => StorageService.getTheme());
  const { isPwaInstalled, promptInstallPwa } = useOfflineSync();

  // Notification state
  const [notifications, setNotifications] = useState<UserNotification[]>(() =>
    StorageService.getNotifications()
  );
  const [showNotificationPopover, setShowNotificationPopover] = useState<boolean>(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() =>
    StorageService.getSchoolProfile()
  );

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    StorageService.saveTheme(newTheme);
  };

  const normalizedTheme = normalizeThemeConfig(theme);

  // Pastikan tema DOM langsung diaplikasikan saat app dimuat atau berganti
  useEffect(() => {
    applyThemeToDOM(normalizedTheme);
  }, [theme]);

  // Dual Cloud Auto-Sync Runner (Penyimpanan Permanen)
  useEffect(() => {
    // Inisialisasi sinkronisasi otomatis dual cloud (Supabase & GitHub)
    CloudAutoSyncService.init();
  }, []);

  // Sync notifications and token quota periodically & on storage changes
  useEffect(() => {
    const updateQuota = () => {
      const user = StorageService.getCurrentUser();
      setTokenQuota(StorageService.getTokenQuotaStatus(user));
    };

    updateQuota();

    const unsubscribe = addStorageListener(() => {
      updateQuota();
      setNotifications(StorageService.getNotifications());
    });

    const interval = setInterval(() => {
      setNotifications(StorageService.getNotifications());
      updateQuota();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const mainContentRef = useRef<HTMLElement>(null);

  const handleNavigateView = (viewId: string) => {
    setActiveView(viewId);
    setIsMobileSidebarOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeView]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setTokenQuota(StorageService.getTokenQuotaStatus(user));
    setSchoolProfile(StorageService.getSchoolProfile());
    setNotifications(StorageService.getNotifications());
    setShowAuthModal(false);
    handleNavigateView('welcome_sync');
  };

  const handleLogout = () => {
    if (currentUser) {
      StorageService.addAccessLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Logout Sistem',
        details: `Pengguna ${currentUser.name} keluar dari sesi aplikasi.`,
        status: 'info',
      });
    }
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setShowAuthModal(true);
    handleNavigateView('welcome_sync');
  };

  const handleClearNotifications = () => {
    StorageService.saveNotifications([]);
    setNotifications([]);
    setShowNotificationPopover(false);
  };

  // Helper for active view breadcrumb label and badge
  const getViewInfo = (viewId: string) => {
    switch (viewId) {
      case 'dashboard':
        return { label: 'Dashboard & Ikhtisar', category: 'Utama' };
      case 'welcome_sync':
        return { label: 'Pusat Sinkronisasi', category: 'Sistem' };
      case 'kelas_siswa':
      case 'siswa_kelas':
      case 'input_siswa':
      case 'students':
        return { label: 'Kelola Kelas & Siswa', category: 'Administrasi' };
      case 'absensi':
      case 'attendance':
        return { label: 'Absensi Siswa', category: 'Administrasi' };
      case 'jadwal':
      case 'schedule':
        return { label: 'Jadwal Mengajar', category: 'Administrasi' };
      case 'agenda':
        return { label: 'Agenda Mengajar', category: 'Administrasi' };
      case 'jurnal':
      case 'journal':
        return { label: 'Jurnal Mengajar', category: 'Administrasi' };
      case 'guru_wali':
      case 'wali':
      case 'grades':
      case 'gradebook':
        return { label: 'Buku Wali Kelas & Rekap', category: 'Administrasi' };
      case 'cetak_laporan':
      case 'cetak':
      case 'print':
        return { label: 'Cetak Laporan Lengkap', category: 'Administrasi' };
      case 'profil_guru_mapel':
      case 'profil_guru':
        return { label: 'Profil Guru Mata Pelajaran', category: 'Kurikulum & Perangkat' };
      case 'kalender_pendidikan':
      case 'upload_kalender':
      case 'analisis_alokasi_waktu':
      case 'alokasi_waktu':
      case 'ai_analisis_alokasi_waktu':
        return { label: 'Upload Kaldik & Analisis Alokasi Waktu', category: 'Kurikulum & Perangkat' };
      case 'parameter_kurikulum':
      case 'parameter_belajar':
      case 'analisis_cp_distribusi':
      case 'cp_distribusi':
      case 'pembagian_materi':
      case 'deep_learning':
        return { label: 'Parameter Kurikulum & Bab TP', category: 'Kurikulum & Perangkat' };
      case 'ai_analisis_cp':
      case 'analisis_cp':
      case 'cp':
        return { label: '1. Analisis CP Terbaru', category: 'Kurikulum & Perangkat' };
      case 'ai_tp':
      case 'tp':
        return { label: '2. Tujuan Pembelajaran (TP)', category: 'Kurikulum & Perangkat' };
      case 'ai_atp':
      case 'atp':
        return { label: '3. Alur TP (ATP)', category: 'Kurikulum & Perangkat' };
      case 'ai_prota':
      case 'prota':
        return { label: '4. Program Tahunan (PROTA)', category: 'Kurikulum & Perangkat' };
      case 'ai_prosem':
      case 'prosem':
        return { label: '5. Program Semester (PROSEM)', category: 'Kurikulum & Perangkat' };
      case 'ai_kktp':
      case 'kktp':
        return { label: '6. Kriteria Ketuntasan (KKTP)', category: 'Kurikulum & Perangkat' };
      case 'ai_modul_ajar':
      case 'rpm':
      case 'modul_ajar':
        return { label: '7. RPM (Rencana Pelaksanaan Modul)', category: 'Kurikulum & Perangkat' };
      case 'ai_lkpd':
      case 'lkpd':
        return { label: '8. Lembar Kerja Siswa (LKPD)', category: 'Kurikulum & Perangkat' };
      case 'ai_rubrik_penilaian':
      case 'ai_asesmen':
      case 'rubrik':
      case 'rubrik_penilaian':
        return { label: '9. Rubrik Penilaian Terpadu', category: 'Kurikulum & Perangkat' };
      case 'admin_dashboard':
      case 'admin_activity_logs':
        return { label: 'Log Audit & Dashboard', category: 'Admin Panel' };
      case 'admin_upload_cp':
      case 'upload_cp':
      case 'upload_cp_master':
        return { label: 'Upload File CP Master Terbaru', category: 'Capaian Pembelajaran' };
      case 'admin_api_key':
      case 'admin_gemini_key':
      case 'admin_api_config':
        return { label: 'Manajemen API Key AMD', category: 'Admin Panel' };
      case 'admin_tokens':
      case 'admin_token_management':
        return { label: 'Manajemen Kuota Token Sistem', category: 'Admin Panel' };
      case 'admin_access':
      case 'admin_user_approval':
        return { label: 'Otorisasi Akun Guru', category: 'Admin Panel' };
      case 'admin_sync':
      case 'supabase_sync':
      case 'admin_supabase':
        return { label: 'Integrasi Supabase Cloud', category: 'Admin Panel' };
      case 'saran':
      case 'feedback':
        return { label: 'Kotak Saran & Masukan', category: 'Bantuan' };
      default:
        return { label: 'Perangkat Pembelajaran', category: 'Umum' };
    }
  };

  const currentViewInfo = getViewInfo(activeView);

  const isLight = theme === 'light';
  const isEmerald = theme === 'emerald';
  const isSlate = theme === 'slate';

  const renderActiveView = () => {
    if (!currentUser) return null;

    if (activeView === 'welcome_sync') {
      return (
        <WelcomeSyncView
          currentUser={currentUser}
          onNavigate={handleNavigateView}
        />
      );
    }

    if (activeView === 'dashboard') {
      return (
        <DashboardHomeView
          currentUser={currentUser}
          onNavigate={handleNavigateView}
          onOpenSchoolProfile={() => setShowSchoolModal(true)}
          theme={theme}
        />
      );
    }
    if (
      activeView === 'kelas_siswa' ||
      activeView === 'siswa_kelas' ||
      activeView === 'input_siswa' ||
      activeView === 'students'
    ) {
      return <KelasSiswaView />;
    }
    if (activeView === 'admin_upload_cp' || activeView === 'upload_cp' || activeView === 'upload_cp_master') {
      return <UploadCPMasterView onNavigate={handleNavigateView} />;
    }
    if (
      activeView === 'analisis_cp_distribusi' ||
      activeView === 'ai_analisis_cp_distribusi' ||
      activeView === 'cp_distribusi'
    ) {
      return <AnalisisCPDistributionView onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_analisis_cp' || activeView === 'analisis_cp' || activeView === 'cp') {
      return <AIAssistantView key="analisis_cp" initialDocType="ai_analisis_cp" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_tp' || activeView === 'tp') {
      return <AIAssistantView key="tp" initialDocType="ai_tp" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_atp' || activeView === 'atp') {
      return <AIAssistantView key="atp" initialDocType="ai_atp" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_prota' || activeView === 'prota') {
      return <AIAssistantView key="prota" initialDocType="ai_prota" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_prosem' || activeView === 'prosem') {
      return <AIAssistantView key="prosem" initialDocType="ai_prosem" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_kktp' || activeView === 'kktp') {
      return <AIAssistantView key="kktp" initialDocType="ai_kktp" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_modul_ajar' || activeView === 'modul_ajar' || activeView === 'rpm') {
      return <AIAssistantView key="modul_ajar" initialDocType="ai_modul_ajar" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'ai_lkpd' || activeView === 'lkpd') {
      return <AIAssistantView key="lkpd" initialDocType="ai_lkpd" onNavigate={handleNavigateView} />;
    }
    if (
      activeView === 'ai_rubrik_penilaian' ||
      activeView === 'ai_asesmen' ||
      activeView === 'rubrik' ||
      activeView === 'rubrik_penilaian'
    ) {
      return <AIAssistantView key="rubrik_penilaian" initialDocType="ai_rubrik_penilaian" onNavigate={handleNavigateView} />;
    }
    if (
      activeView === 'profil_guru_mapel' ||
      activeView === 'profil_guru'
    ) {
      return <ProfilGuruMapelView onNavigate={handleNavigateView} />;
    }
    if (
      activeView === 'kalender_pendidikan' ||
      activeView === 'upload_kalender' ||
      activeView === 'analisis_alokasi_waktu' ||
      activeView === 'alokasi_waktu' ||
      activeView === 'ai_analisis_alokasi_waktu'
    ) {
      const initialTab =
        activeView === 'analisis_alokasi_waktu' ||
        activeView === 'alokasi_waktu' ||
        activeView === 'ai_analisis_alokasi_waktu'
          ? 'analisis'
          : 'upload';
      return <KalenderPendidikanView initialTab={initialTab} onNavigate={handleNavigateView} />;
    }
    if (
      activeView === 'parameter_kurikulum' ||
      activeView === 'parameter_belajar' ||
      activeView === 'pembagian_materi' ||
      activeView === 'deep_learning'
    ) {
      return <ParameterKurikulumView initialTab="parameter_materi" onNavigate={handleNavigateView} />;
    }
    if (activeView === 'absensi' || activeView === 'attendance') return <AbsensiView />;
    if (activeView === 'jadwal' || activeView === 'schedule') return <JadwalView />;
    if (activeView === 'agenda') return <AgendaView />;
    if (activeView === 'jurnal' || activeView === 'journal') return <JurnalView />;
    if (
      activeView === 'guru_wali' ||
      activeView === 'wali' ||
      activeView === 'grades' ||
      activeView === 'gradebook'
    ) {
      return <GuruWaliView />;
    }
    if (activeView === 'cetak_laporan' || activeView === 'cetak' || activeView === 'print') {
      return <CetakLaporanView />;
    }

    // Gemini API Key Manager (Admin View)
    if (
      activeView === 'admin_api_key' ||
      activeView === 'admin_gemini_key' ||
      activeView === 'admin_api_config'
    ) {
      if (currentUser.role !== 'admin') {
        return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
      }
      return (
        <div className="max-w-7xl mx-auto py-2">
          <AdminApiKeyManager />
        </div>
      );
    }

    // Perangkat Ajar & Modul Views
    if (activeView.startsWith('ai_')) {
      return <AIAssistantView initialDocType={activeView} onNavigate={handleNavigateView} />;
    }

    // Admin Views (Protected - Only for Admin)
    if (activeView === 'admin_tokens' || activeView === 'admin_token_management') {
      if (currentUser.role !== 'admin') {
        return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
      }
      return <AdminDashboardView initialSubTab="tokens" />;
    }
    if (activeView === 'admin_dashboard' || activeView === 'admin_activity_logs') {
      if (currentUser.role !== 'admin') {
        return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
      }
      return <AdminDashboardView initialSubTab="dashboard" />;
    }
    if (activeView === 'admin_access' || activeView === 'admin_user_approval') {
      if (currentUser.role !== 'admin') {
        return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
      }
      return <AdminDashboardView initialSubTab="access" />;
    }
    if (
      activeView === 'admin_sync' ||
      activeView === 'supabase_sync' ||
      activeView === 'admin_supabase'
    ) {
      if (currentUser.role !== 'admin') {
        return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
      }
      return <SupabaseSyncView />;
    }

    if (activeView === 'saran' || activeView === 'feedback') {
      return <SaranView currentUser={currentUser} />;
    }

    return <DashboardHomeView currentUser={currentUser} onNavigate={handleNavigateView} onOpenSchoolProfile={() => setShowSchoolModal(true)} theme={theme} />;
  };

  // If not logged in or in auth screen, render only the Auth Page
  if (!currentUser || showAuthModal) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthModal
          isOpen={true}
          onClose={() => {
            if (currentUser) setShowAuthModal(false);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const isTopNav = normalizedTheme.menuPosition === 'top';
  const isRightNav = normalizedTheme.menuPosition === 'right';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <div className={`flex h-screen overflow-hidden ${isRightNav ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Desktop Collapsible Persistent Sidebar (Hidden if Top Nav is active unless toggled) */}
        {!isTopNav && (
          <div
            className={`hidden lg:flex flex-col shrink-0 ${isRightNav ? 'border-l' : 'border-r'} border-slate-200 bg-white h-screen transition-all duration-200 ease-in-out z-20 ${
              isDesktopSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0 border-l-0'
            }`}
          >
            <Sidebar
              activeView={activeView}
              setActiveView={handleNavigateView}
              onSelectView={handleNavigateView}
              onNavigate={handleNavigateView}
              currentUser={currentUser}
              onLogout={handleLogout}
              theme={theme}
              onThemeChange={handleThemeChange}
              onOpenThemeModal={() => setShowThemeModal(true)}
              onOpenResetModal={() => setShowResetModal(true)}
            />
          </div>
        )}

        {/* Mobile / Tablet Slide-out Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            {/* Slide-out Menu Panel */}
            <div className="relative w-80 max-w-[85vw] flex flex-col z-10 bg-white shadow-2xl border-r border-slate-200">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
                    <Menu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 tracking-tight">
                      AGK GURU
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Menu Navigasi</div>
                  </div>
                </div>
                <button
                  id="btn-close-menu"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Sidebar
                  activeView={activeView}
                  setActiveView={handleNavigateView}
                  onSelectView={handleNavigateView}
                  onNavigate={handleNavigateView}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  theme={theme}
                  onThemeChange={handleThemeChange}
                  onOpenThemeModal={() => setShowThemeModal(true)}
                  onOpenResetModal={() => setShowResetModal(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main App Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
          {/* Top Navigation Header */}
          <header className="h-14 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10">
            {/* Left Header Section */}
            <div className="flex items-center space-x-3">
              {/* Tombol Toggle Menu */}
              <button
                id="btn-open-menu-garis-3"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 1024 && !isTopNav) {
                    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                  } else {
                    setIsMobileSidebarOpen(!isMobileSidebarOpen);
                  }
                }}
                className="p-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs transition-all duration-150 flex items-center space-x-1.5 shadow-2xs"
                title="Buka / Sembunyikan Menu"
              >
                <Menu className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline font-semibold text-slate-700">Menu</span>
              </button>

              {/* Breadcrumb Info */}
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {currentViewInfo.category}
                </span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-900 truncate max-w-xs">
                  {currentViewInfo.label}
                </span>
              </div>
            </div>

            {/* Right Header Section */}
            <div className="flex items-center space-x-2">
              <OfflineSyncIndicator compact={true} />

              {/* Reset Data 24 Jam Khusus Kurikulum & Perangkat - Only visible for Admin */}
              {currentUser.role === 'admin' && (
                <button
                  id="btn-reset-data-24h"
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100 text-rose-700 shadow-2xs transition-colors duration-150"
                  title="Pusat Reset Data Kurikulum & Perangkat Saja (24 Jam)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden xl:inline text-[11px] font-bold text-rose-700">Reset Kurikulum & Perangkat (24 Jam)</span>
                </button>
              )}

              {/* AI Token Header Display */}
              <button
                id="btn-ai-token-quota"
                onClick={() => setShowTokenModal(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors duration-150 cursor-pointer"
                title="Status Token & Kuota Sistem (Klik untuk melihat rincian & voucher)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-semibold text-slate-700">
                  {tokenQuota.isAdmin ? (
                    <span className="text-purple-700 font-bold">Token: Unlimited (Admin)</span>
                  ) : (
                    <span>
                      Token: <strong className="text-emerald-700 font-mono font-bold">{(tokenQuota.dailyTokensRemaining ?? 20000).toLocaleString('id-ID')}</strong> / 20.000
                    </span>
                  )}
                </span>
              </button>

              {/* Kop Sekolah */}
              <button
                onClick={() => setShowSchoolModal(true)}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors duration-150"
                title="Kop Sekolah"
              >
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-semibold text-slate-700">Kop Sekolah</span>
              </button>

              {/* Pilihan Tema Bebas */}
              <button
                id="btn-open-theme-customizer"
                onClick={() => setShowThemeModal(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors duration-150"
                title="Pilihan Tema Bebas (Warna, Font, Menu, Kerapatan)"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline text-[11px] font-semibold text-slate-700">Tema Tampilan</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  id="btn-notifications"
                  onClick={() => setShowNotificationPopover(!showNotificationPopover)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors duration-150 relative"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationPopover && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center">
                        <Bell className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Notifikasi
                      </span>
                      <button
                        onClick={handleClearNotifications}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold"
                      >
                        Bersihkan
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          Tidak ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={n.id ? `${n.id}-${idx}` : `notif-${idx}`} className="p-3 hover:bg-slate-50 transition space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 text-[11px]">{n.title}</span>
                              <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User and Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-slate-900 truncate max-w-[180px]" title={currentUser.name}>
                    {currentUser.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Top Navigation Bar (Active when menuPosition === 'top') */}
          {isTopNav && (
            <TopNavbar
              activeView={activeView}
              onSelectView={(view) => {
                setActiveView(view);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              onOpenThemeModal={() => setShowThemeModal(true)}
              onOpenResetModal={() => setShowResetModal(true)}
              isAdmin={currentUser.role === 'admin'}
              themeConfig={normalizedTheme}
            />
          )}

          {/* Main Content Area */}
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-slate-50 pb-24 lg:pb-8">
            <div className={normalizedTheme.contentWidth === 'wide' ? 'w-full' : 'max-w-7xl mx-auto'}>
              <ErrorBoundary fallbackTitle="Kendala Memuat Halaman" onReset={() => handleNavigateView('dashboard')}>
                {renderActiveView()}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile & Tablet Bottom Navigation Dock (Android & iOS) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          {/* 1. Dashboard */}
          <button
            id="mobile-nav-dashboard"
            onClick={() => handleNavigateView('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 cursor-pointer ${
              activeView === 'dashboard' ? 'text-blue-600 font-bold bg-blue-50/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Beranda</span>
          </button>

          {/* 2. Administrasi */}
          <button
            id="mobile-nav-administrasi"
            onClick={() => handleNavigateView('kelas_siswa')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 cursor-pointer ${
              ['kelas_siswa', 'absensi', 'jadwal', 'agenda', 'jurnal', 'guru_wali', 'cetak_laporan'].includes(activeView)
                ? 'text-blue-600 font-bold bg-blue-50/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Administrasi</span>
          </button>

          {/* 3. Analisis CP (Direct Quick-Access!) */}
          <button
            id="mobile-nav-analisis-cp"
            onClick={() => handleNavigateView('ai_analisis_cp')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 cursor-pointer ${
              ['ai_analisis_cp', 'analisis_cp', 'cp', 'analisis_cp_distribusi', 'upload_cp_master'].includes(activeView)
                ? 'text-blue-600 font-bold bg-blue-50/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSearch className="w-5 h-5 mb-0.5" />
            <span>Analisis CP</span>
          </button>

          {/* 4. Perangkat / RPM */}
          <button
            id="mobile-nav-perangkat"
            onClick={() => handleNavigateView('ai_modul_ajar')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 cursor-pointer ${
              ['ai_modul_ajar', 'modul_ajar', 'rpm', 'ai_tp', 'ai_atp', 'ai_prota', 'ai_prosem', 'ai_kktp', 'ai_lkpd', 'ai_rubrik_penilaian'].includes(activeView)
                ? 'text-blue-600 font-bold bg-blue-50/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Perangkat</span>
          </button>

          {/* 5. Menu Drawer */}
          <button
            id="mobile-nav-menu"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* School Profile Setup Modal */}
      <SchoolProfileModal
        isOpen={showSchoolModal}
        onClose={() => setShowSchoolModal(false)}
        onSaved={() => setSchoolProfile(StorageService.getSchoolProfile())}
      />

      {/* AI Token Quota & Voucher Modal */}
      <TokenQuotaModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        currentUser={currentUser}
        onTokenUpdated={() => {
          const user = StorageService.getCurrentUser();
          setTokenQuota(StorageService.getTokenQuotaStatus(user));
        }}
        onNavigateToAdminTokens={() => {
          setShowTokenModal(false);
          setActiveView('admin_tokens');
        }}
      />

      {/* Modern Theme & UI Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentConfig={normalizedTheme}
        onSaveConfig={(newConfig) => handleThemeChange(newConfig)}
      />

      {/* Curriculum & Teaching Data 12-Hour Reset Modal */}
      <CurriculumResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        isAdmin={currentUser.role === 'admin'}
      />
    </div>
  );
}
