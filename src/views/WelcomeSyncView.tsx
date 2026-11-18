import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  School,
  Clock,
  FileText,
} from 'lucide-react';
import {
  UserAccount,
  ActiveMasterCPData,
  AdminUploadedCPItem,
  SchoolProfile,
} from '../types';
import { StorageService } from '../lib/storage';

interface WelcomeSyncViewProps {
  currentUser: UserAccount;
  onNavigate: (viewId: string) => void;
}

export const WelcomeSyncView: React.FC<WelcomeSyncViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() =>
    StorageService.getSchoolProfile()
  );
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() =>
    StorageService.getActiveMasterCP()
  );
  const [adminUploadedCPs, setAdminUploadedCPs] = useState<AdminUploadedCPItem[]>(() =>
    StorageService.getAdminUploadedCPs()
  );

  // Live sync if Admin CP, Master CP, or school profile updates
  useEffect(() => {
    const syncData = () => {
      setActiveMasterCP(StorageService.getActiveMasterCP());
      setAdminUploadedCPs(StorageService.getAdminUploadedCPs());
      setSchoolProfile(StorageService.getSchoolProfile());
    };

    // Fetch latest Admin settings / uploaded CP list from server
    StorageService.fetchAdminSettingsFromServer().then(() => {
      syncData();
    });

    window.addEventListener('storage', syncData);
    window.addEventListener('master-cp-updated', syncData);
    window.addEventListener('admin-cp-updated', syncData);
    window.addEventListener('curriculum-parameters-synced', syncData);
    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('master-cp-updated', syncData);
      window.removeEventListener('admin-cp-updated', syncData);
      window.removeEventListener('curriculum-parameters-synced', syncData);
    };
  }, []);

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

  // Prioritize CP files uploaded by Admin; fallback to activeMasterCP if available
  const displayCPList: AdminUploadedCPItem[] = useMemo(() => {
    if (adminUploadedCPs.length > 0) {
      return adminUploadedCPs;
    }
    if (activeMasterCP?.fileName?.trim()) {
      return [
        {
          id: activeMasterCP.id || 'active-cp-1',
          no: 1,
          docNumber: activeMasterCP.docNumber,
          fileName: activeMasterCP.fileName.trim(),
          subject: activeMasterCP.subject,
          level: activeMasterCP.level,
          grade: activeMasterCP.grade,
          phase: activeMasterCP.phase,
          uploadedAt: activeMasterCP.uploadedAt || new Date().toISOString(),
          uploadedBy: activeMasterCP.uploadedByName || 'Admin',
        },
      ];
    }
    return [];
  }, [adminUploadedCPs, activeMasterCP]);

  const latestAdminCP =
    displayCPList.length > 0 ? displayCPList[displayCPList.length - 1] : null;

  const formatNoText = (item: AdminUploadedCPItem) => {
    if (item.docNumber && item.docNumber.trim() && item.docNumber.trim() !== String(item.no)) {
      return `No. ${item.no} (${item.docNumber.trim()})`;
    }
    return `No. ${item.no}`;
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      {/* TAMPILAN AWAL: UCAPAN SELAMAT DENGAN NAMA FILE CP & NO YANG DIUPLOAD ADMIN */}
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

          {latestAdminCP ? (
            <div className="space-y-3 pt-1">
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
                Selamat datang di Aplikasi Administrasi Guru &amp; Kurikulum Deep Learning. Perangkat ajar saat ini mengacu pada file CP Master{' '}
                <span className="font-semibold text-slate-900">&ldquo;{latestAdminCP.fileName}&rdquo;</span>{' '}
                <span className="font-semibold text-emerald-700">({formatNoText(latestAdminCP)})</span> yang diupload oleh Admin
                {latestAdminCP.subject ? (
                  <>
                    {' '}untuk mata pelajaran{' '}
                    <span className="font-semibold text-blue-700">{latestAdminCP.subject}</span>
                    {latestAdminCP.grade ? ` Kelas ${latestAdminCP.grade}` : ''}
                    {latestAdminCP.phase ? ` (${latestAdminCP.phase})` : ''}
                  </>
                ) : null}
                . Selamat bertugas dan sukses dalam melaksanakan kegiatan belajar mengajar hari ini!
              </p>

              {/* Daftar Ringkas File CP Master & No yang Diupload Admin */}
              <div className="max-w-lg mx-auto rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 text-left space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 px-1">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>File CP Master &amp; No. Upload Admin</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">
                    {displayCPList.length} Dokumen
                  </span>
                </div>
                <div className="space-y-1">
                  {displayCPList.map((item) => (
                    <div
                      key={item.id || `${item.no}-${item.fileName}`}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-emerald-100 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[11px] shrink-0">
                          No. {item.no}
                        </span>
                        <span className="font-semibold text-slate-800 truncate" title={item.fileName}>
                          {item.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.folderName && (
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {item.folderName}
                          </span>
                        )}
                        {item.docNumber && item.docNumber.trim() !== String(item.no) && (
                          <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            No. {item.docNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed pt-1 font-normal">
              Selamat datang di Aplikasi Administrasi Guru &amp; Kurikulum Deep Learning. Silakan unggah dokumen file CP terlebih dahulu atau langsung buka dashboard untuk mulai menyusun perangkat ajar. Selamat bertugas dan sukses hari ini!
            </p>
          )}
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
