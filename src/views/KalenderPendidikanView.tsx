import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  CalendarDays,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  Save,
  Check,
  RefreshCw,
  Info,
  CheckCircle2,
  Trash2,
  FileCheck,
  ChevronRight,
  ArrowRight,
  Sliders,
  AlertCircle,
  Eye,
  Zap,
} from 'lucide-react';
import { KalenderPendidikanData, KalenderMonthAnalysis, SemesterType } from '../types';
import { StorageService, DEFAULT_KALENDER_PENDIDIKAN, addStorageListener } from '../lib/storage';
import { UniversalFileParser } from '../lib/universalFileParser';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

export interface KalenderPendidikanViewProps {
  initialTab?: string;
  onNavigate?: (viewId: string) => void;
  onSwitchTab?: (tab: any) => void;
}

export const KalenderPendidikanView: React.FC<KalenderPendidikanViewProps> = ({
  initialTab = 'upload',
  onNavigate,
  onSwitchTab,
}) => {
  const [kalenderData, setKalenderData] = useState<KalenderPendidikanData>(() =>
    StorageService.getKalenderPendidikan()
  );

  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [academicYear, setAcademicYear] = useState<string>(
    kalenderData.tahunAjaran || StorageService.getSchoolProfile().academicYear || '2025/2026'
  );
  const [uploadNotes, setUploadNotes] = useState<string>(
    kalenderData.catatanKhusus || kalenderData.notes || ''
  );

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      const fresh = StorageService.getKalenderPendidikan();
      setKalenderData(fresh);
      if (fresh.tahunAjaran) setAcademicYear(fresh.tahunAjaran);
      if (fresh.catatanKhusus) setUploadNotes(fresh.catatanKhusus);
    };

    const unsub = addStorageListener(handleStorageUpdate);
    window.addEventListener('kaldik-updated', handleStorageUpdate);
    window.addEventListener('curriculum-parameters-synced', handleStorageUpdate);

    return () => {
      unsub();
      window.removeEventListener('kaldik-updated', handleStorageUpdate);
      window.removeEventListener('curriculum-parameters-synced', handleStorageUpdate);
    };
  }, []);

  // Handle Kaldik File Upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    try {
      const parsed = await UniversalFileParser.parseFile(file);

      // Detect academic year if present in file text
      let detectedYear = academicYear;
      const yearMatch = parsed.extractedText.match(/(20\d{2})\s*[\/–-]\s*(20\d{2})/);
      if (yearMatch) {
        detectedYear = `${yearMatch[1]}/${yearMatch[2]}`;
        setAcademicYear(detectedYear);
      }

      const updated: KalenderPendidikanData = {
        ...kalenderData,
        fileName: file.name,
        fileType: file.type || 'document',
        fileSize: file.size,
        tahunAjaran: detectedYear,
        academicYear: detectedYear,
        uploadedAt: new Date().toISOString(),
        uploadedFile: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data: parsed.base64,
          uploadedAt: new Date().toISOString(),
        },
        catatanKhusus: uploadNotes,
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updated);
      StorageService.saveKalenderPendidikan(updated);
      setUploadSuccessMsg(`Berkas Kalender Pendidikan "${file.name}" berhasil diunggah!`);
      setSaveToast('Dokumen Kalender Pendidikan sekolah berhasil disimpan.');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      console.error('Kaldik upload error:', err);
      setSaveToast(`Gagal mengunggah berkas: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined,
      uploadedFile: undefined,
      lastUpdated: new Date().toISOString(),
    };
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
    setSaveToast('Berkas kalender sekolah dihapus. Menggunakan standar resmi Kemendikdasmen.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Month weeks or agenda description change handler
  const handleMonthChange = (
    semester: 'semester1' | 'semester2',
    monthIndex: number,
    field: 'totalWeeks' | 'description',
    val: string
  ) => {
    const updated = { ...kalenderData };
    const months = [...updated[semester].months];
    const target = { ...months[monthIndex] };

    if (field === 'totalWeeks') {
      const num = Math.max(0, parseInt(val, 10) || 0);
      target.totalWeeks = num;
      target.effectiveWeeks = Math.max(0, num - target.nonEffectiveWeeks);
    } else {
      target.description = val;
    }

    months[monthIndex] = target;
    const totalWeeks = months.reduce((acc, m) => acc + m.totalWeeks, 0);

    updated[semester] = {
      ...updated[semester],
      months,
      totalWeeks,
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // 1. Tombol Analisis: Menjalankan ekstraksi & analisis kalender pendidikan
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setSaveToast('Sedang menganalisis struktur kalender pendidikan...');

    setTimeout(() => {
      const updated: KalenderPendidikanData = {
        ...kalenderData,
        tahunAjaran: academicYear,
        academicYear: academicYear,
        catatanKhusus: uploadNotes,
        lastUpdated: new Date().toISOString(),
      };
      setKalenderData(updated);
      StorageService.saveKalenderPendidikan(updated);
      setIsAnalyzing(false);
      setSaveToast(`✅ Analisis Kalender Pendidikan TP ${academicYear} selesai! Data siap disinkronkan ke Alokasi Waktu.`);
      setTimeout(() => setSaveToast(null), 3500);
    }, 500);
  };

  // 2. Tombol Sinkron ke Alokasi Waktu: Menyimpan & menyinkronkan langsung ke menu Analisis Alokasi Waktu
  const handleSyncToAlokasiWaktu = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      tahunAjaran: academicYear,
      academicYear: academicYear,
      catatanKhusus: uploadNotes,
      lastUpdated: new Date().toISOString(),
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);

    window.dispatchEvent(new CustomEvent('kaldik-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: updated }));

    setSaveToast('✅ Kalender Pendidikan berhasil disinkronkan ke Analisis Alokasi Waktu!');
    setTimeout(() => {
      setSaveToast(null);
      if (onNavigate) {
        onNavigate('analisis_alokasi_waktu');
      }
    }, 600);
  };

  const activeSemData = selectedSemester === 'Ganjil' ? kalenderData.semester1 : kalenderData.semester2;
  const activeFileName = kalenderData.fileName || kalenderData.uploadedFile?.fileName;
  const activeFileSize = kalenderData.fileSize || kalenderData.uploadedFile?.fileSize;
  const activeUploadedAt = kalenderData.uploadedAt || kalenderData.uploadedFile?.uploadedAt;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: UPLOAD KALENDER PENDIDIKAN */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shadow-xs shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  Upload Kalender Pendidikan
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  Kaldik Sekolah
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  TP {academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Unggah dokumen Kalender Pendidikan resmi sekolah Anda (PDF, Excel, Word, atau Foto Scan) atau gunakan kalender pendidikan standar resmi Kemendikdasmen untuk memetakan jadwal kegiatan, pekan kalender, dan agenda libur semester.
              </p>
            </div>
          </div>

          {/* HANYA ADA TOMBOL ANALISIS DAN SINKRON KE ALOKASI WAKTU */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-analisis-kaldik"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Jalankan analisis kalender pendidikan"
            >
              <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-bounce text-amber-300' : 'text-amber-300'}`} />
              <span>{isAnalyzing ? 'Menganalisis...' : 'Analisis'}</span>
            </button>
            <button
              type="button"
              id="btn-sinkron-ke-alokasi-waktu"
              onClick={handleSyncToAlokasiWaktu}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              title="Sinkronkan data kalender ke Analisis Alokasi Waktu"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Sinkron ke Alokasi Waktu</span>
            </button>
          </div>
        </div>

        {/* Sumber Kalender Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Sumber Rujukan Kaldik:
            </span>
            {activeFileName ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold gap-1.5 text-[11px]">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumen Sekolah: {activeFileName}</span>
                {activeFileSize && (
                  <span className="text-[10px] text-emerald-700 font-normal">
                    ({(activeFileSize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Kalender Pendidikan Standar Resmi Kemendikdasmen TP {academicYear}</span>
              </span>
            )}
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('analisis_alokasi_waktu')}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center space-x-1 cursor-pointer transition text-xs"
            >
              <span>Buka Menu Analisis Alokasi Waktu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ZONA UPLOAD DOKUMEN KALENDER PENDIDIKAN */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Unggah Berkas Kalender Pendidikan Satuan Pendidikan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unggah berkas kalender pendidikan resmi sekolah Anda dalam format PDF, Excel (.xlsx/.xls), Word (.docx), CSV, atau Gambar Scan (.jpg/.png).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600">Tahun Ajaran:</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-blue-700 focus:outline-none"
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.csv,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3.5 bg-blue-100 rounded-2xl text-blue-600 transition">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-blue-600 underline">Klik untuk memilih berkas</span> atau seret &amp; lepas berkas di sini
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung format PDF, Excel (.xlsx, .xls), Word (.docx), CSV, dan Gambar Scan (JPG, PNG) hingga 20 MB
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center space-x-2 text-xs font-bold text-blue-700">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memproses dan mengekstrak berkas Kalender Pendidikan...</span>
            </div>
          )}
        </div>

        {/* Upload Success Alert */}
        {uploadSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{uploadSuccessMsg}</span>
          </div>
        )}

        {/* Active Uploaded File Card */}
        {activeFileName ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{activeFileName}</p>
                <p className="text-[11px] text-slate-500">
                  {activeFileSize ? `Ukuran: ${(activeFileSize / 1024).toFixed(1)} KB` : ''}
                  {activeUploadedAt ? ` • Diunggah: ${new Date(activeUploadedAt).toLocaleDateString('id-ID')}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Ganti Berkas
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs flex items-center space-x-1 transition cursor-pointer"
                title="Hapus berkas dan gunakan standar resmi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-left">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Belum ada dokumen yang diunggah. Sistem aktif menggunakan acuan <strong>Kalender Pendidikan Standar Resmi Kemendikdasmen TP {academicYear}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition cursor-pointer"
            >
              Upload Dokumen Sekolah
            </button>
          </div>
        )}

        {/* Catatan Khusus Agenda Sekolah */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Catatan Khusus Agenda &amp; Hari Libur Sekolah (Opsional)
          </label>
          <textarea
            rows={3}
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="Contoh: Tanggal 14–16 Juli MPLS, Pekan ke-3 September Sumatif Tengah Semester, Pekan ke-3 Oktober Gelar Karya P5, Libur Semester 1 dimulai 22 Desember..."
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MATRIKS PEKAN KALENDER PENDIDIKAN & AGENDA PER BULAN */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Matriks Pekan Kalender Pendidikan TP {academicYear}
              </h2>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedSemester('Ganjil')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedSemester === 'Ganjil'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 1 (Ganjil)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('Genap')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedSemester === 'Genap'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 2 (Genap)
              </button>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total Pekan Kalender: <strong className="text-slate-900">{activeSemData.totalWeeks} Pekan</strong>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-44">Bulan</th>
                <th className="p-3 w-36 text-center">Jumlah Pekan Kalender</th>
                <th className="p-3">Keterangan Agenda Kegiatan Sekolah &amp; Hari Libur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeSemData.months.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{m.monthName}</span>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={m.totalWeeks}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) =>
                        handleMonthChange(
                          selectedSemester === 'Ganjil' ? 'semester1' : 'semester2',
                          idx,
                          'totalWeeks',
                          String(parseNumberInput(e.target.value, 0, 0, 6))
                        )
                      }
                      className="w-16 text-center bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-xs text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={m.description || ''}
                      onChange={(e) =>
                        handleMonthChange(
                          selectedSemester === 'Ganjil' ? 'semester1' : 'semester2',
                          idx,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Agenda kegiatan / libur bulan ini..."
                      className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-blue-700">
                  Total Pekan Kalender Semester {selectedSemester}:
                </td>
                <td className="p-3 text-center text-sm font-black text-blue-800">
                  {activeSemData.totalWeeks} Pekan
                </td>
                <td className="p-3 text-xs text-slate-500 font-medium">
                  {selectedSemester === 'Ganjil'
                    ? 'Semester Ganjil: Juli s.d. Desember'
                    : 'Semester Genap: Januari s.d. Juni'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAUTAN JEMBATAN KE MENU ANALISIS ALOKASI WAKTU */}
      {/* ========================================================================= */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Langkah Berikutnya: Analisis Alokasi Waktu &amp; RBE
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Setelah dokumen kalender pendidikan siap, buka menu <strong>Analisis Alokasi Waktu</strong> untuk menghitung rincian pekan efektif KBM (RBE), membagi alokasi JP per materi pokok, serta menyinkronkan data langsung ke <strong>PROSEM</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncToAlokasiWaktu}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-white" />
            <span>Sinkron ke Alokasi Waktu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
