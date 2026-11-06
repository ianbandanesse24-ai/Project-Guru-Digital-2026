import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ChevronRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Save,
  Copy,
  Check,
  Zap,
  Sliders,
  Download,
  AlertCircle,
  FileCheck,
  Eye,
  ArrowRight,
  Clock,
  BookOpen,
  Layers,
  FileUp,
  X,
} from 'lucide-react';
import {
  KalenderPendidikanData,
  KalenderSemesterPlan,
  EducationLevel,
  CPMaterialItem,
} from '../types';
import { StorageService, addStorageListener } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { generateExpertCurriculumDocument } from '../lib/curriculumEngine';
import { getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import { DocumentPdfPreview } from '../components/DocumentPdfPreview';
import { CustomFormatSelector, CustomFormatConfig } from '../components/CustomFormatSelector';
import { RbeAnalysisSection } from '../components/RbeAnalysisSection';
import { AlokasiWaktuParser, CustomAlokasiWaktuParseResult } from '../lib/alokasiWaktuParser';

interface AnalisisAlokasiWaktuViewProps {
  onNavigate?: (viewId: string) => void;
  initialTab?: 'upload_format' | 'tabel_rbe' | 'pratinjau_dokumen';
}

export const AnalisisAlokasiWaktuView: React.FC<AnalisisAlokasiWaktuViewProps> = ({
  onNavigate,
  initialTab = 'upload_format',
}) => {
  const [activeTab, setActiveTab] = useState<'upload_format' | 'tabel_rbe' | 'pratinjau_dokumen'>(initialTab);
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Load Kaldik data & custom format config from storage
  const [kalenderData, setKalenderData] = useState<KalenderPendidikanData>(() =>
    StorageService.getKalenderPendidikan()
  );

  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>(() => {
    return (
      kalenderData.customFormatConfig || {
        useCustomFormat: false,
        customFormatNotes: '',
        formatFile: null,
      }
    );
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // File Upload states for self-made analysis
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<CustomAlokasiWaktuParseResult | null>(null);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // School Profile & Master CP metadata
  const schoolProfile = StorageService.getSchoolProfile();
  const masterCP = StorageService.getActiveMasterCP();

  const [subject, setSubject] = useState<string>(masterCP?.subject || schoolProfile.subject || 'Fisika');
  const [level, setLevel] = useState<EducationLevel>((masterCP?.level as EducationLevel) || (schoolProfile.level as EducationLevel) || 'SMA');
  const [grade, setGrade] = useState<number>(Number(masterCP?.grade || schoolProfile.grade) || 10);
  const [jpPerWeek, setJpPerWeek] = useState<number>(masterCP?.jpPerWeek || Number(schoolProfile.jpPerWeek) || 3);
  const [academicYear, setAcademicYear] = useState<string>(
    kalenderData.tahunAjaran || schoolProfile.academicYear || masterCP?.academicYear || '2025/2026'
  );

  // Materials / Chapters for reference
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem1 && masterCP.materialsSem1.length > 0) return masterCP.materialsSem1;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` }));
  });

  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem2 && masterCP.materialsSem2.length > 0) return masterCP.materialsSem2;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` }));
  });

  // Keep state synced with storage events
  useEffect(() => {
    const handleStorageUpdate = () => {
      const freshKaldik = StorageService.getKalenderPendidikan();
      setKalenderData(freshKaldik);
      if (freshKaldik.customFormatConfig) {
        setCustomFormatConfig(freshKaldik.customFormatConfig);
      }
      const freshMaster = StorageService.getActiveMasterCP();
      if (freshMaster) {
        if (freshMaster.subject) setSubject(freshMaster.subject);
        if (freshMaster.level) setLevel(freshMaster.level as EducationLevel);
        if (freshMaster.grade) setGrade(Number(freshMaster.grade));
        if (freshMaster.jpPerWeek) setJpPerWeek(freshMaster.jpPerWeek);
        if (freshMaster.materialsSem1) setMaterialsSem1(freshMaster.materialsSem1);
        if (freshMaster.materialsSem2) setMaterialsSem2(freshMaster.materialsSem2);
      }
    };

    const unsub = addStorageListener(handleStorageUpdate);
    window.addEventListener('kaldik-updated', handleStorageUpdate);
    window.addEventListener('curriculum-parameters-synced', handleStorageUpdate);
    window.addEventListener('master-cp-updated', handleStorageUpdate);

    return () => {
      unsub();
      window.removeEventListener('kaldik-updated', handleStorageUpdate);
      window.removeEventListener('curriculum-parameters-synced', handleStorageUpdate);
      window.removeEventListener('master-cp-updated', handleStorageUpdate);
    };
  }, []);

  // Update Custom Format Configuration
  const handleCustomFormatChange = (newConfig: CustomFormatConfig) => {
    setCustomFormatConfig(newConfig);
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig: newConfig,
      lastUpdated: new Date().toISOString(),
    };
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
    setSaveToast(
      newConfig.useCustomFormat
        ? 'Format khusus alokasi waktu aktif & disinkronkan ke seluruh dokumen!'
        : 'Format alokasi waktu dikembalikan ke standar resmi.'
    );
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Upload Self-made Analysis File Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const parseResult = await AlokasiWaktuParser.parseCustomAnalysisFile(file, kalenderData, jpPerWeek);
      setUploadResult(parseResult);

      const updatedKaldik: KalenderPendidikanData = {
        ...kalenderData,
        tahunAjaran: parseResult.detectedAcademicYear || academicYear,
        semester1: parseResult.semester1,
        semester2: parseResult.semester2,
        fileName: file.name,
        fileType: file.type || 'document',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedFile: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
        },
        customFormatConfig: {
          ...customFormatConfig,
          useCustomFormat: true,
          formatFile: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          },
          customFormatNotes: `Diunggah mandiri oleh guru: ${file.name}. RBE diekstraksi dan disinkronkan ke PROSEM.`,
        },
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updatedKaldik);
      StorageService.saveKalenderPendidikan(updatedKaldik);

      if (parseResult.detectedJpPerWeek && parseResult.detectedJpPerWeek !== jpPerWeek) {
        setJpPerWeek(parseResult.detectedJpPerWeek);
      }

      setSaveToast(`Analisis alokasi waktu mandiri "${file.name}" berhasil diekstraksi & tersinkron!`);
      setShowSyncSuccessModal(true);
    } catch (err: any) {
      console.error('File parse error:', err);
      setSaveToast(`Gagal membaca berkas: ${err?.message || 'Format tidak didukung'}`);
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

  // Direct Sync to PROSEM Trigger
  const handleSyncToProsem = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig,
      tahunAjaran: academicYear,
      lastUpdated: new Date().toISOString(),
    };
    StorageService.saveKalenderPendidikan(updated);

    // Dispatch custom events for PROSEM
    window.dispatchEvent(new CustomEvent('kaldik-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: updated }));

    setSavedSuccess(true);
    setShowSyncSuccessModal(true);
  };

  // Month data change handler
  const handleMonthChange = (
    semester: 'semester1' | 'semester2',
    monthIndex: number,
    field: 'totalWeeks' | 'nonEffectiveWeeks' | 'description',
    val: string
  ) => {
    const updated = { ...kalenderData };
    const months = [...updated[semester].months];
    const target = { ...months[monthIndex] };

    if (field === 'totalWeeks') {
      const num = Math.max(0, parseInt(val, 10) || 0);
      target.totalWeeks = num;
      target.effectiveWeeks = Math.max(0, num - target.nonEffectiveWeeks);
    } else if (field === 'nonEffectiveWeeks') {
      const num = Math.max(0, parseInt(val, 10) || 0);
      target.nonEffectiveWeeks = num;
      target.effectiveWeeks = Math.max(0, target.totalWeeks - num);
    } else {
      target.description = val;
    }

    months[monthIndex] = target;
    const totalWeeks = months.reduce((acc, m) => acc + m.totalWeeks, 0);
    const nonEffectiveWeeks = months.reduce((acc, m) => acc + m.nonEffectiveWeeks, 0);
    const totalEffectiveWeeks = months.reduce((acc, m) => acc + m.effectiveWeeks, 0);

    updated[semester] = {
      ...updated[semester],
      months,
      totalWeeks,
      nonEffectiveWeeks,
      totalEffectiveWeeks,
      totalEffectiveHours: totalEffectiveWeeks * jpPerWeek,
      netTeachingHours: Math.max(0, totalEffectiveWeeks * jpPerWeek - 6),
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  // Save full data
  const handleSaveData = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig,
      tahunAjaran: academicYear,
      lastUpdated: new Date().toISOString(),
    };
    StorageService.saveKalenderPendidikan(updated);
    setSavedSuccess(true);
    setSaveToast('Data Analisis Alokasi Waktu & Format Kustom berhasil disimpan permanen!');
    setTimeout(() => {
      setSavedSuccess(false);
      setSaveToast(null);
    }, 3000);
  };

  // Active semester calculation metrics
  const activeSemData: KalenderSemesterPlan =
    selectedSemester === 'Ganjil' ? kalenderData.semester1 : kalenderData.semester2;
  const totalEffJP = activeSemData.totalEffectiveWeeks * jpPerWeek;
  const reserveJP = 6;
  const kbmEffJP = Math.max(0, totalEffJP - reserveJP);

  // Generate formatted markdown preview
  const previewMarkdown = generateExpertCurriculumDocument({
    toolType: 'analisis_alokasi_waktu',
    docType: 'analisis_alokasi_waktu',
    subject,
    level,
    grade,
    semester: selectedSemester,
    kalenderData,
    kaldikData: kalenderData,
    customFormatConfig,
    useCustomFormat: customFormatConfig.useCustomFormat,
    customFormatNotes: customFormatConfig.customFormatNotes,
    customFormatFile: customFormatConfig.formatFile,
    phase: level === 'SMA' ? (grade === 10 ? 'Fase E' : 'Fase F') : level === 'SMP' ? 'Fase D' : 'Fase A',
  });

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(previewMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const profile = StorageService.getSchoolProfile();
    const fileName = `Analisis_Alokasi_Waktu_${subject.replace(/\s+/g, '_')}_Sem_${selectedSemester}`;
    ExportService.exportToWord(
      `ANALISIS ALOKASI WAKTU - ${subject.toUpperCase()}`,
      previewMarkdown,
      {
        ...profile,
        subject,
        grade,
        level,
        semester: selectedSemester,
        docType: 'analisis_alokasi_waktu',
      },
      fileName
    );
  };

  const handleExportExcel = () => {
    const sem = selectedSemester === 'Ganjil' ? kalenderData.semester1 : kalenderData.semester2;
    const tableData = sem.months.map((m, idx) => ({
      No: idx + 1,
      Bulan: m.monthName,
      'Total Pekan': m.totalWeeks,
      'Pekan Tdk Efektif': m.nonEffectiveWeeks,
      'Pekan Efektif KBM': m.effectiveWeeks,
      'Keterangan Agenda': m.description,
    }));

    tableData.push({
      No: 'TOTAL' as any,
      Bulan: `Semester ${selectedSemester}`,
      'Total Pekan': sem.totalWeeks,
      'Pekan Tdk Efektif': sem.nonEffectiveWeeks,
      'Pekan Efektif KBM': sem.totalEffectiveWeeks,
      'Keterangan Agenda': `Total Jam Efektif: ${sem.totalEffectiveWeeks * jpPerWeek} JP (KBM: ${kbmEffJP} JP, Cadangan: ${reserveJP} JP)`,
    });

    ExportService.exportToExcel(
      tableData,
      `Analisis_Alokasi_Waktu_${subject.replace(/\s+/g, '_')}_Sem_${selectedSemester}`,
      `Alokasi Waktu Sem ${selectedSemester}`,
      {
        docTitle: `ANALISIS ALOKASI WAKTU SEMESTER ${selectedSemester.toUpperCase()} - ${subject.toUpperCase()}`,
        academicYear,
        teacherName: schoolProfile.teacherName || 'Guru Pengampu',
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: ANALISIS ALOKASI WAKTU & SINKRON PROSEM */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shadow-xs shrink-0">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  Analisis Alokasi Waktu (RBE & Upload Mandiri)
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin-slow" />
                  Sinkron ke PROSEM
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Upload Format Sendiri
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {subject} • Kelas {grade} ({level})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Unggah berkas analisis alokasi waktu yang telah Anda buat sendiri (Excel, Word, PDF, atau Foto Scan) untuk diekstraksi secara cerdas. Hasil pekan efektif (RBE) dan alokasi JP tatap muka langsung disinkronkan ke <strong>PROSEM (Program Semester)</strong>, PROTA, dan Modul Ajar.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncToProsem}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              title="Sinkronkan alokasi waktu langsung ke PROSEM"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan ke PROSEM</span>
            </button>
            <button
              type="button"
              onClick={handleSaveData}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Data'}</span>
            </button>
          </div>
        </div>

        {/* Status Chip Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Status Sinkronisasi PROSEM:
            </span>
            {kalenderData.fileName || kalenderData.uploadedFile ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersinkron Berkas Mandiri:</span>
                <span className="font-normal text-emerald-700">
                  {kalenderData.fileName || kalenderData.uploadedFile?.fileName}
                </span>
              </span>
            ) : customFormatConfig.useCustomFormat ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Format Khusus Sekolah Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold gap-1 text-[11px]">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Format Standar Kemendikbudristek & Kaldik</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-600 font-medium text-[11px]">
            <span>Beban: <strong className="text-slate-900">{jpPerWeek} JP/Minggu</strong></span>
            <span>•</span>
            <span>Sem 1: <strong className="text-emerald-700">{kalenderData.semester1.totalEffectiveWeeks} Pekan ({kalenderData.semester1.totalEffectiveWeeks * jpPerWeek} JP)</strong></span>
            <span>•</span>
            <span>Sem 2: <strong className="text-emerald-700">{kalenderData.semester2.totalEffectiveWeeks} Pekan ({kalenderData.semester2.totalEffectiveWeeks * jpPerWeek} JP)</strong></span>
          </div>
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
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THREE CORE NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload_format')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'upload_format'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>1. Upload Alokasi Mandiri & Sinkron PROSEM</span>
          {(kalenderData.fileName || customFormatConfig.useCustomFormat) && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tabel_rbe')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'tabel_rbe'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>2. Matriks Rincian Pekan Efektif (RBE)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'tabel_rbe' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {activeSemData.totalEffectiveWeeks} Pekan Efektif
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pratinjau_dokumen')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'pratinjau_dokumen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Pratinjau & Ekspor Dokumen</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'pratinjau_dokumen' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            Word / PDF
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UPLOAD ALOKASI WAKTU MANDIRI & SINKRON KE PROSEM */}
      {/* ========================================================================= */}
      {activeTab === 'upload_format' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Main Upload Zone for Teacher's Own Analysis File */}
          <div className="bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-6 transition-colors shadow-xs">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <FileUp className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Upload Analisis Alokasi Waktu Yang Telah Dibuat Sendiri
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto leading-relaxed">
                  Unggah berkas analisis alokasi waktu sekolah Anda dalam format <strong>Excel (.xlsx, .xls, .csv)</strong>, <strong>Word (.docx)</strong>, <strong>PDF</strong>, atau <strong>Foto Scan</strong>. Sistem otomatis membaca rincian pekan efektif per bulan dan menyelaraskannya dengan PROSEM.
                </p>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center space-y-2">
                  <UploadCloud className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-xs font-semibold text-slate-700">
                    <span className="text-blue-600 underline font-bold">Pilih berkas dari komputer</span> atau seret dan lepas berkas ke sini
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mendukung Excel (.xlsx, .xls), Word (.docx), PDF, CSV, dan Gambar Scan (Maks 20MB)
                  </p>
                </div>

                {isUploading && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center space-x-2 text-xs font-bold text-blue-700">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Menganalisis matriks pekan efektif & menyelaraskan ke PROSEM...</span>
                  </div>
                )}
              </div>

              {/* Template Download & Help Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => AlokasiWaktuParser.downloadAlokasiWaktuExcelTemplate(academicYear, subject)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  title="Unduh contoh template Excel yang siap diisi"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Contoh Format Excel (.xlsx)</span>
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('kalender_pendidikan')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka Kalender Pendidikan Sekolah</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Uploaded File Summary & Synced Status Card */}
          {(kalenderData.fileName || kalenderData.uploadedFile || uploadResult) && (
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-emerald-950">
                        Berkas Analisis Alokasi Waktu Mandiri Aktif
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                        Tersinkron PROSEM
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                      {kalenderData.fileName || kalenderData.uploadedFile?.fileName || 'Analisis_Alokasi_Waktu_Guru.xlsx'}
                      {kalenderData.fileSize ? ` • ${(kalenderData.fileSize / 1024).toFixed(1)} KB` : ''}
                      {kalenderData.uploadedAt ? ` • Diunggah: ${new Date(kalenderData.uploadedAt).toLocaleDateString('id-ID')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tabel_rbe')}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <span>Lihat Matriks RBE</span>
                    <ChevronRight className="w-4 h-4 text-emerald-700" />
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('ai_prosem')}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Buka Hasil di PROSEM →</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Extraction Metrics Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-200/80">
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pekan Efektif Sem 1</span>
                  <div className="text-base font-black text-emerald-800">
                    {kalenderData.semester1.totalEffectiveWeeks} Pekan
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {kalenderData.semester1.totalEffectiveWeeks * jpPerWeek} JP Tatap Muka
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pekan Efektif Sem 2</span>
                  <div className="text-base font-black text-emerald-800">
                    {kalenderData.semester2.totalEffectiveWeeks} Pekan
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {kalenderData.semester2.totalEffectiveWeeks * jpPerWeek} JP Tatap Muka
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Beban Mengajar</span>
                  <div className="text-base font-black text-blue-700">
                    {jpPerWeek} JP / Minggu
                  </div>
                  <span className="text-[11px] text-slate-500">Tersinkron profil mapel</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total 1 Tahun</span>
                  <div className="text-base font-black text-indigo-700">
                    {(kalenderData.semester1.totalEffectiveWeeks + kalenderData.semester2.totalEffectiveWeeks) * jpPerWeek} JP
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {kalenderData.semester1.totalEffectiveWeeks + kalenderData.semester2.totalEffectiveWeeks} Pekan Efektif KBM
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Custom Document Formatting Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kustomisasi Tata Letak &amp; Format Kop Alokasi Waktu Sekolah
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih preset format resmi atau aktifkan format dokumen khas sekolah Anda.
                </p>
              </div>
            </div>

            <CustomFormatSelector
              value={customFormatConfig}
              onChange={handleCustomFormatChange}
              docTypeId="analisis_alokasi_waktu"
              docTypeName="Analisis Alokasi Waktu (RBE)"
            />
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs text-slate-500">
              Perubahan pada analisis alokasi waktu otomatis menjadi acuan matriks pekan di PROSEM (Program Semester).
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncToProsem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Simpan &amp; Sinkronkan ke PROSEM</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tabel_rbe')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <span>Lihat Tabel RBE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TABEL ANALISIS ALOKASI WAKTU & RBE */}
      {/* ========================================================================= */}
      {activeTab === 'tabel_rbe' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Semester Selector Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Pilih Semester:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Ganjil')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSemester === 'Genap'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semester 2 (Genap)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncToProsem}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Sinkronkan ke PROSEM</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-emerald-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Word</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak / PDF</span>
              </button>
            </div>
          </div>

          {/* Core Interactive RBE Component */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <RbeAnalysisSection
              activeSemData={activeSemData}
              selectedSemester={selectedSemester}
              jpPerWeek={jpPerWeek}
              totalEffJP={totalEffJP}
              reserveJP={reserveJP}
              kbmEffJP={kbmEffJP}
              handleMonthChange={handleMonthChange}
              onExportWord={handleExportWord}
              onExportExcel={handleExportExcel}
              onPrint={handlePrint}
              onNavigate={onNavigate}
            />
          </div>

          {/* Navigation to Document Preview */}
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('upload_format')}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>← Kembali ke Upload Format Mandiri</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncToProsem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sinkronkan ke PROSEM</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pratinjau_dokumen')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <span>Lanjut ke Pratinjau Dokumen</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRATINJAU DOKUMEN & CETAK */}
      {/* ========================================================================= */}
      {activeTab === 'pratinjau_dokumen' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Action Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800">
                  Pratinjau Dokumen Analisis Alokasi Waktu — Semester {selectedSemester}
                </span>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Ganjil')}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                    selectedSemester === 'Ganjil' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Sem 1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Genap')}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                    selectedSemester === 'Genap' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Sem 2
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center space-x-1.5 border border-blue-200 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center space-x-1.5 border border-emerald-200 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen</span>
              </button>
            </div>
          </div>

          {/* Document Renderer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <DocumentPdfPreview
              content={previewMarkdown}
              title={`Analisis Alokasi Waktu ${subject} - Semester ${selectedSemester}`}
            />
          </div>

          {/* Quick Flow to Downstream Documents */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tabel_rbe')}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>← Kembali ke Tabel RBE</span>
            </button>

            {onNavigate && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onNavigate('parameter_kurikulum')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ke Parameter Kurikulum</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ai_prosem')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka PROSEM (Program Semester)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL KONFIRMASI SINKRONISASI KE PROSEM */}
      {/* ========================================================================= */}
      {showSyncSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Alokasi Waktu Berhasil Disinkronkan ke PROSEM!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data pekan efektif dan alokasi JP siap diterapkan pada matriks Program Semester.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncSuccessModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Synced Summary Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Mata Pelajaran &amp; Kelas:</span>
                <span className="font-bold text-slate-800">{subject} • Kelas {grade} ({level})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Beban Mengajar:</span>
                <span className="font-bold text-blue-700">{jpPerWeek} JP / Minggu</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Semester 1 (Ganjil):</span>
                <span className="font-bold text-emerald-700">
                  {kalenderData.semester1.totalEffectiveWeeks} Pekan Efektif ({kalenderData.semester1.totalEffectiveWeeks * jpPerWeek} JP)
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Semester 2 (Genap):</span>
                <span className="font-bold text-emerald-700">
                  {kalenderData.semester2.totalEffectiveWeeks} Pekan Efektif ({kalenderData.semester2.totalEffectiveWeeks * jpPerWeek} JP)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sumber Berkas:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[220px]">
                  {kalenderData.fileName || kalenderData.uploadedFile?.fileName || 'Analisis Mandiri / Kaldik'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncSuccessModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tetap di Halaman Ini
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSyncSuccessModal(false);
                    onNavigate('ai_prosem');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Buka Hasil di PROSEM Sekarang →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
