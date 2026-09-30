import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Sparkles,
  BookOpen,
  FileText,
  ShieldCheck,
  X,
  Sliders,
  Calendar,
  Layers,
  DatabaseZap,
  Info,
} from 'lucide-react';
import { StorageService, addStorageListener } from '../lib/storage';
import { CurriculumResetStats } from '../types';

interface CurriculumResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCompleted?: (clearedCategories: string[]) => void;
  isAdmin?: boolean;
}

export const CurriculumResetModal: React.FC<CurriculumResetModalProps> = ({
  isOpen,
  onClose,
  onResetCompleted,
  isAdmin = false,
}) => {
  const [stats, setStats] = useState<CurriculumResetStats>(() =>
    StorageService.getCurriculumResetStats()
  );
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'all' | 'curriculum' | 'teaching';
    title: string;
    description: string;
  } | null>(null);

  // Auto-refresh countdown every 30 seconds or when storage changes
  useEffect(() => {
    if (!isOpen) return;

    const refreshStats = () => {
      setStats(StorageService.getCurriculumResetStats());
    };

    refreshStats();
    const unsubscribe = addStorageListener(refreshStats);
    const interval = setInterval(refreshStats, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen || !isAdmin) return null;

  const handleExecuteReset = (type: 'all' | 'curriculum' | 'teaching') => {
    setIsResetting(true);
    setToastMessage(null);

    setTimeout(() => {
      try {
        let result;
        if (type === 'all') {
          result = StorageService.resetCurriculumAndTeachingData({
            resetCurriculum: true,
            resetTeachingDocs: true,
            isManual: true,
          });
        } else if (type === 'curriculum') {
          result = StorageService.resetCurriculumAndTeachingData({
            resetCurriculum: true,
            resetTeachingDocs: false,
            isManual: true,
          });
        } else {
          result = StorageService.resetCurriculumAndTeachingData({
            resetCurriculum: false,
            resetTeachingDocs: true,
            isManual: true,
          });
        }

        setStats(StorageService.getCurriculumResetStats());
        setConfirmTarget(null);
        setToastMessage(result.message);
        if (onResetCompleted) {
          onResetCompleted(result.clearedCategories);
        }
      } catch (err) {
        setToastMessage('Terjadi kesalahan saat memproses reset data.');
      } finally {
        setIsResetting(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Reset Data Kurikulum & Perangkat (24 Jam)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Khusus Kurikulum & Perangkat Saja</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pembersihan dan reset 24 jam hanya berlaku pada kurikulum dan perangkat ajar AI. Data administrasi guru, absensi, dan nilai tetap aman.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Toast Message */}
          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-emerald-900">Operasi Berhasil!</div>
                <div className="text-emerald-700 mt-0.5">{toastMessage}</div>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-500 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. Status Penyimpanan Data Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DatabaseZap className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  Cakupan Reset 24 Jam: Khusus Kurikulum & Perangkat Saja
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Siklus 24 Jam</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Objek Reset 24 Jam</div>
                <div className="text-xs font-bold font-mono text-rose-600 mt-0.5">
                  Kurikulum & Perangkat
                </div>
                <div className="text-[9px] text-slate-400">RPM, Modul, LKPD, CP</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Administrasi Guru</div>
                <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5 truncate">
                  Permanen Terlindungi
                </div>
                <div className="text-[9px] text-slate-400">Jurnal, Agenda, Nilai, Absensi</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-semibold">Akun & Profil Sekolah</div>
                <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5">
                  Permanen Aman
                </div>
                <div className="text-[9px] text-slate-400">Tidak ikut terhapus</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Penghapusan dan reset data 24 jam <strong>hanya berlaku pada kurikulum dan perangkat pembelajaran</strong> (dokumen AI: RPM Deep Learning, Modul Ajar, ATP, PROTA, PROSEM, LKPD, KKTP, Asesmen, dan draf CP). Data administrasi mengajar, absensi, nilai, profil sekolah, dan akun pengguna <strong>tidak akan pernah terhapus</strong>.
            </p>
          </div>

          {/* 2. Pilihan Tindakan Reset Manual */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Pilihan Eksekusi Reset Kurikulum & Perangkat
              </h4>
            </div>

            {/* Option 1: Reset Seluruh Kurikulum & Perangkat Pembelajaran Saja */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-rose-900 text-xs sm:text-sm">
                    1. Reset Kurikulum & Perangkat Pembelajaran (Penyegaran 24 Jam)
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-200 text-rose-800">
                    Khusus Kurikulum & Perangkat
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Mengosongkan dokumen AI perangkat ajar (RPM, Modul Ajar, LKPD, KKTP, ATP) dan mereset Analisis CP ke kondisi awal. Administrasi guru, jurnal, absensi, dan nilai tetap aman.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmTarget({
                    type: 'all',
                    title: 'Reset Kurikulum & Perangkat Pembelajaran',
                    description:
                      'Tindakan ini akan mengosongkan seluruh data dokumen AI perangkat pembelajaran dan analisis CP. Data administrasi guru (jurnal, agenda, jadwal, absensi, nilai), biodata siswa, profil sekolah, dan akun pengguna dijamin TETAP AMAN.',
                  })
                }
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 flex items-center justify-center space-x-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Kurikulum & Perangkat</span>
              </button>
            </div>

            {/* Granular Sub-resets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 2: Dokumen Perangkat & AI Saja */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dokumen AI & RPM Saja</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Hapus seluruh arsip Modul Ajar, RPM Deep Learning, ATP, PROTA, PROSEM, LKPD, KKTP & Asesmen AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmTarget({
                      type: 'teaching',
                      title: 'Reset Dokumen Perangkat Ajar & AI Saja',
                      description:
                        'Apakah Anda yakin ingin mengosongkan seluruh riwayat modul ajar, RPM, dan dokumen perangkat yang digenerate AI? Data lainnya tidak akan disentuh.',
                    })
                  }
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center space-x-1 transition"
                >
                  <RefreshCw className="w-3 h-3 text-slate-600" />
                  <span>Reset Dokumen Perangkat AI</span>
                </button>
              </div>

              {/* Option 3: Analisis CP & Kaldik Saja */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Analisis CP & Kaldik Saja</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Kembalikan Analisis CP Master, Distribusi TP/JP, dan Kalender Pendidikan ke acuan default.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmTarget({
                      type: 'curriculum',
                      title: 'Reset Analisis CP & Kalender Pendidikan Saja',
                      description:
                        'Apakah Anda yakin ingin mereset data Master Capaian Pembelajaran, alokasi waktu JP, dan kalender pendidikan ke standar awal? Data lainnya tidak akan disentuh.',
                    })
                  }
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center space-x-1 transition"
                >
                  <RefreshCw className="w-3 h-3 text-slate-600" />
                  <span>Reset Analisis CP & Kaldik</span>
                </button>
              </div>
            </div>
          </div>

          {/* Safety Guarantee Info */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-emerald-950 leading-relaxed">
              <span className="font-bold">Jaminan Perlindungan Permanen Administrasi Guru:</span> Data Jurnal Mengajar, Agenda Guru, Jadwal Pelajaran, Absensi Harian Siswa, Rekapitulasi Nilai Siswa, Biodata Siswa, Profil Satuan Pendidikan, dan Akun Pengguna <strong>TERLINDUNGI PERMANEN dan TIDAK PERNAH DIHAPUS</strong> oleh siklus reset data 24 jam.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset data 24 jam hanya berlaku pada kurikulum dan perangkat saja</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Sub-Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{confirmTarget.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmTarget.description}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              Apakah Anda yakin ingin melanjutkan eksekusi reset data ini sekarang?
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteReset(confirmTarget.type)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Eksekusi Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
