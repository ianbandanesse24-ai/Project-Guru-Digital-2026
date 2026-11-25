import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  FileCheck,
  Eye,
  BookOpen,
  FileUp,
  X,
  Trash2,
  Calculator,
  ChevronDown,
  ChevronUp,
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
import { AlokasiWaktuParser, CustomAlokasiWaktuParseResult } from '../lib/alokasiWaktuParser';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

interface AnalisisAlokasiWaktuViewProps {
  onNavigate?: (viewId: string) => void;
  initialTab?: string;
}

export const AnalisisAlokasiWaktuView: React.FC<AnalisisAlokasiWaktuViewProps> = ({
  onNavigate,
}) => {
  // Load Kaldik data & custom format config from storage
  const [kalenderData, setKalenderData] = useState<KalenderPendidikanData>(() =>
    StorageService.getKalenderPendidikan()
  );

  // 2 Pilihan Pembuatan Analisis Alokasi Waktu:
  // 'kaldik' = Pilihan 1 (Hasil analisis & generate dari KALDIK dalam 1 dokumen yang bisa disimpan dalam bentuk tabel)
  // 'upload_mandiri' = Pilihan 2 (Upload sendiri analisis alokasi waktu dalam bentuk dokumen)
  const [selectedChoice, setSelectedChoice] = useState<'kaldik' | 'upload_mandiri'>(() =>
    kalenderData.activeSourceMode === 'upload_mandiri' ? 'upload_mandiri' : 'kaldik'
  );

  // Tampilan di dalam pilihan: 'tabel' (1 dokumen tabel Sem 1 + Sem 2 + Rekap) atau 'dokumen' (Pratinjau Dokumen Cetak)
  const [kaldikViewMode, setKaldikViewMode] = useState<'tabel' | 'dokumen'>('tabel');
  const [uploadViewMode, setUploadViewMode] = useState<'tabel' | 'dokumen_asli' | 'pratinjau'>('tabel');
  const [showFormatSettings, setShowFormatSettings] = useState<boolean>(false);

  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>(() => {
    return (
      kalenderData.customFormatConfig || {
        useCustomFormat: false,
        customFormatNotes: '',
        formatFile: null,
      }
    );
  });

  const [isGeneratingKaldik, setIsGeneratingKaldik] = useState<boolean>(false);
  const [hasGeneratedKaldik, setHasGeneratedKaldik] = useState<boolean>(() => Boolean(kalenderData.kaldikAnalysis));
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // File Upload states for Pilihan 2 (Upload Mandiri)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<CustomAlokasiWaktuParseResult | null>(null);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState<boolean>(false);
  const [lastSyncedModeLabel, setLastSyncedModeLabel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // School Profile & Master CP metadata
  const schoolProfile = StorageService.getSchoolProfile();
  const masterCP = StorageService.getActiveMasterCP();

  // Pilihan Semester (1 = Ganjil, 2 = Genap) — hanya menampilkan semester yang dipilih
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(() =>
    schoolProfile.semester === 'Genap' ? 'Genap' : 'Ganjil'
  );

  const [subject, setSubject] = useState<string>(masterCP?.subject || schoolProfile.subject || 'Fisika');
  const [level, setLevel] = useState<EducationLevel>(
    (masterCP?.level as EducationLevel) || (schoolProfile.level as EducationLevel) || 'SMA'
  );
  const [grade, setGrade] = useState<number>(Number(masterCP?.grade || schoolProfile.grade) || 10);
  const [jpPerWeek, setJpPerWeek] = useState<number>(
    Number(schoolProfile.jpPerWeek || masterCP?.jpPerWeek || kalenderData.semester1?.jpPerWeek) || 3
  );
  const [academicYear, setAcademicYear] = useState<string>(
    kalenderData.tahunAjaran || schoolProfile.academicYear || masterCP?.academicYear || '2025/2026'
  );

  // Materials / Chapters for reference in Distribusi JP table
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>(() => {
    if (
      masterCP?.materialsSem1 &&
      masterCP.materialsSem1.length > 0 &&
      Number(masterCP.grade) === Number(grade)
    ) {
      return masterCP.materialsSem1;
    }
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` }));
  });

  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>(() => {
    if (
      masterCP?.materialsSem2 &&
      masterCP.materialsSem2.length > 0 &&
      Number(masterCP.grade) === Number(grade)
    ) {
      return masterCP.materialsSem2;
    }
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` }));
  });

  // Sync with global storage changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      const freshKaldik = StorageService.getKalenderPendidikan();
      setKalenderData(freshKaldik);
      if (freshKaldik.customFormatConfig) {
        setCustomFormatConfig(freshKaldik.customFormatConfig);
      }
      if (freshKaldik.kaldikAnalysis) {
        setHasGeneratedKaldik(true);
      }
      const freshProfile = StorageService.getSchoolProfile();
      const freshMaster = StorageService.getActiveMasterCP();
      if (freshProfile?.jpPerWeek) setJpPerWeek(Number(freshProfile.jpPerWeek));
      if (freshMaster) {
        if (freshMaster.subject) setSubject(freshMaster.subject);
        if (freshMaster.level) setLevel(freshMaster.level as EducationLevel);
        if (freshMaster.grade) setGrade(Number(freshMaster.grade));
        if (freshMaster.jpPerWeek && !freshProfile?.jpPerWeek) setJpPerWeek(freshMaster.jpPerWeek);
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

  // Derive Semester 1 & 2 plans specifically for Choice 1 (KALDIK) and Choice 2 (Upload Mandiri)
  const kaldikSem1: KalenderSemesterPlan =
    kalenderData.kaldikAnalysis?.semester1 || kalenderData.semester1;
  const kaldikSem2: KalenderSemesterPlan =
    kalenderData.kaldikAnalysis?.semester2 || kalenderData.semester2;

  const uploadedInfo = kalenderData.uploadedAlokasiWaktu;
  const uploadedSem1: KalenderSemesterPlan =
    uploadedInfo?.semester1 || kalenderData.semester1;
  const uploadedSem2: KalenderSemesterPlan =
    uploadedInfo?.semester2 || kalenderData.semester2;

  // Working plans for the currently selected choice
  const workingSem1: KalenderSemesterPlan =
    selectedChoice === 'upload_mandiri' && uploadedInfo ? uploadedSem1 : kaldikSem1;
  const workingSem2: KalenderSemesterPlan =
    selectedChoice === 'upload_mandiri' && uploadedInfo ? uploadedSem2 : kaldikSem2;

  const workingKaldikPreviewData: KalenderPendidikanData = {
    ...kalenderData,
    tahunAjaran: academicYear,
    academicYear,
    activeSourceMode: selectedChoice,
    semester1: workingSem1,
    semester2: workingSem2,
  };

  // Generate 1 unified Markdown document for the active choice & selected semester
  const previewMarkdown = generateExpertCurriculumDocument({
    toolType: 'analisis_alokasi_waktu',
    docType: 'analisis_alokasi_waktu',
    subject,
    level,
    grade,
    academicYear,
    semester: selectedSemester,
    kalenderData: workingKaldikPreviewData,
    kaldikData: workingKaldikPreviewData,
    customFormatConfig,
    useCustomFormat: customFormatConfig.useCustomFormat,
    customFormatNotes: customFormatConfig.customFormatNotes,
    customFormatFile: customFormatConfig.formatFile,
    phase:
      level === 'SMA'
        ? grade === 10
          ? 'Fase E'
          : 'Fase F'
        : level === 'SMP'
        ? 'Fase D'
        : grade <= 2
        ? 'Fase A'
        : grade <= 4
        ? 'Fase B'
        : 'Fase C',
  });

  // ============================================================================
  // PILIHAN 1: ANALISIS & GENERATE DARI KALDIK MENJADI 1 DOKUMEN TABEL
  // ============================================================================
  const handleGenerateFromKaldik = () => {
    setIsGeneratingKaldik(true);
    setSaveToast('Menganalisis Kalender Pendidikan (KALDIK) & menyusun 1 dokumen tabel...');

    setTimeout(() => {
      const analyzed = AlokasiWaktuParser.analyzeFromKaldik(kalenderData, jpPerWeek);
      const updated: KalenderPendidikanData = {
        ...kalenderData,
        tahunAjaran: academicYear,
        academicYear,
        kaldikAnalysis: analyzed,
        semester1: analyzed.semester1,
        semester2: analyzed.semester2,
        activeSourceMode: 'kaldik',
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updated);
      StorageService.saveKalenderPendidikan(updated);
      setHasGeneratedKaldik(true);
      setIsGeneratingKaldik(false);
      const activeSemAnalysis = selectedSemester === 'Ganjil' ? analyzed.semester1 : analyzed.semester2;
      const semLabel = selectedSemester === 'Ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';
      setSaveToast(
        `Analisis dari KALDIK selesai! ${semLabel}: ${activeSemAnalysis.totalEffectiveWeeks} Pekan Efektif (${activeSemAnalysis.totalEffectiveHours} JP).`
      );
      setTimeout(() => setSaveToast(null), 4500);
    }, 350);
  };

  // ============================================================================
  // PILIHAN 2: UPLOAD MANDIRI DOKUMEN ANALISIS ALOKASI WAKTU
  // ============================================================================
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const parseResult = await AlokasiWaktuParser.parseCustomAnalysisFile(
        file,
        kalenderData,
        jpPerWeek
      );
      setUploadResult(parseResult);

      const newJp =
        parseResult.detectedJpPerWeek && parseResult.detectedJpPerWeek > 0
          ? parseResult.detectedJpPerWeek
          : jpPerWeek;

      const updatedKaldik: KalenderPendidikanData = {
        ...kalenderData,
        tahunAjaran: parseResult.detectedAcademicYear || academicYear,
        academicYear: parseResult.detectedAcademicYear || academicYear,
        semester1: parseResult.semester1,
        semester2: parseResult.semester2,
        activeSourceMode: 'upload_mandiri',
        uploadedAlokasiWaktu: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'document',
          uploadedAt: new Date().toISOString(),
          extractedText: parseResult.extractedText,
          tableMarkdown: parseResult.tableMarkdown,
          semester1: parseResult.semester1,
          semester2: parseResult.semester2,
          detectedJpPerWeek: newJp,
          detectedAcademicYear: parseResult.detectedAcademicYear,
          confidenceScore: parseResult.confidenceScore,
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
          customFormatNotes: `Diunggah mandiri oleh guru: ${file.name}. Diekstraksi & dijadikan acuan PROSEM.`,
        },
        syncedToProsemAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updatedKaldik);
      StorageService.saveKalenderPendidikan(updatedKaldik);

      if (newJp !== jpPerWeek) {
        setJpPerWeek(newJp);
      }

      window.dispatchEvent(new CustomEvent('kaldik-updated', { detail: updatedKaldik }));
      window.dispatchEvent(
        new CustomEvent('curriculum-parameters-synced', { detail: updatedKaldik })
      );

      setSelectedChoice('upload_mandiri');
      setLastSyncedModeLabel(`Pilihan 2: Upload Dokumen Mandiri (${file.name})`);
      setSaveToast(
        `Dokumen "${file.name}" berhasil dibaca & siap dijadikan acuan pembuatan PROSEM!`
      );
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

  const handleRemoveUploadedAlokasi = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      uploadedAlokasiWaktu: undefined,
      activeSourceMode: 'kaldik',
      semester1: kaldikSem1,
      semester2: kaldikSem2,
      lastUpdated: new Date().toISOString(),
    };
    setUploadResult(null);
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
    window.dispatchEvent(new CustomEvent('kaldik-updated', { detail: updated }));
    setSaveToast('Dokumen upload mandiri dihapus. Acuan kembali ke Pilihan 1 (Hasil KALDIK).');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // ============================================================================
  // EDIT BARIS TABEL (BERLAKU UNTUK PILIHAN 1 ATAU PILIHAN 2)
  // ============================================================================
  const handleMonthChangeForChoice = (
    choice: 'kaldik' | 'upload_mandiri',
    semesterKey: 'semester1' | 'semester2',
    monthIndex: number,
    field: 'totalWeeks' | 'nonEffectiveWeeks' | 'description',
    val: string
  ) => {
    const basePlan =
      choice === 'upload_mandiri' && kalenderData.uploadedAlokasiWaktu
        ? kalenderData.uploadedAlokasiWaktu[semesterKey]
        : choice === 'kaldik' && kalenderData.kaldikAnalysis
        ? kalenderData.kaldikAnalysis[semesterKey]
        : kalenderData[semesterKey];

    const months = [...basePlan.months];
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
    const reserve = Number(basePlan.reservedHours) || 6;

    const updatedPlan: KalenderSemesterPlan = {
      ...basePlan,
      months,
      totalWeeks,
      totalCalendarWeeks: totalWeeks,
      nonEffectiveWeeks,
      totalNonEffectiveWeeks: nonEffectiveWeeks,
      totalEffectiveWeeks,
      jpPerWeek,
      totalEffectiveHours: totalEffectiveWeeks * jpPerWeek,
      totalJpSemester: totalEffectiveWeeks * jpPerWeek,
      reservedHours: reserve,
      netTeachingHours: Math.max(0, totalEffectiveWeeks * jpPerWeek - reserve),
    };

    const updated: KalenderPendidikanData = {
      ...kalenderData,
      lastUpdated: new Date().toISOString(),
    };

    if (choice === 'upload_mandiri' && kalenderData.uploadedAlokasiWaktu) {
      updated.uploadedAlokasiWaktu = {
        ...kalenderData.uploadedAlokasiWaktu,
        [semesterKey]: updatedPlan,
      };
      if (kalenderData.activeSourceMode === 'upload_mandiri') {
        updated[semesterKey] = updatedPlan;
      }
    } else {
      const existingKaldikAnalysis = kalenderData.kaldikAnalysis || {
        semester1: kalenderData.semester1,
        semester2: kalenderData.semester2,
        generatedAt: new Date().toISOString(),
        sourceLabel: `Kalender Pendidikan TP ${academicYear}`,
      };
      updated.kaldikAnalysis = {
        ...existingKaldikAnalysis,
        [semesterKey]: updatedPlan,
      };
      if (kalenderData.activeSourceMode !== 'upload_mandiri') {
        updated[semesterKey] = updatedPlan;
      }
    }

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  // ============================================================================
  // SIMPAN & SINKRONKAN KE PROSEM (MENDUKUNG PILIHAN 1 MAUPUN PILIHAN 2)
  // ============================================================================
  const handleSyncChoiceToProsem = (modeToSync: 'kaldik' | 'upload_mandiri' = selectedChoice) => {
    if (modeToSync === 'upload_mandiri' && !kalenderData.uploadedAlokasiWaktu) {
      setSaveToast('Silakan unggah dokumen analisis alokasi waktu Anda terlebih dahulu pada Pilihan 2.');
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }

    const syncedSem1 =
      modeToSync === 'upload_mandiri' && kalenderData.uploadedAlokasiWaktu
        ? kalenderData.uploadedAlokasiWaktu.semester1
        : kalenderData.kaldikAnalysis?.semester1 || kalenderData.semester1;

    const syncedSem2 =
      modeToSync === 'upload_mandiri' && kalenderData.uploadedAlokasiWaktu
        ? kalenderData.uploadedAlokasiWaktu.semester2
        : kalenderData.kaldikAnalysis?.semester2 || kalenderData.semester2;

    const nowIso = new Date().toISOString();
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig,
      tahunAjaran: academicYear,
      academicYear,
      activeSourceMode: modeToSync,
      semester1: { ...syncedSem1, jpPerWeek },
      semester2: { ...syncedSem2, jpPerWeek },
      syncedToProsemAt: nowIso,
      lastUpdated: nowIso,
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);

    window.dispatchEvent(new CustomEvent('kaldik-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: updated }));

    const label =
      modeToSync === 'upload_mandiri'
        ? `Pilihan 2: Upload Dokumen Mandiri (${kalenderData.uploadedAlokasiWaktu?.fileName})`
        : `Pilihan 1: Hasil Analisis & Generate dari KALDIK`;

    setLastSyncedModeLabel(label);
    setSavedSuccess(true);
    setShowSyncSuccessModal(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveData = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig,
      tahunAjaran: academicYear,
      academicYear,
      semester1: workingSem1,
      semester2: workingSem2,
      activeSourceMode: selectedChoice,
      lastUpdated: new Date().toISOString(),
    };
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
    setSavedSuccess(true);
    setSaveToast('Tabel Analisis Alokasi Waktu berhasil disimpan permanen di sistem!');
    setTimeout(() => {
      setSavedSuccess(false);
      setSaveToast(null);
    }, 3000);
  };

  // ============================================================================
  // EKSPOR DOKUMEN DALAM BENTUK TABEL SESUAI SEMESTER YANG DIPILIH (EXCEL, WORD, PRINT/PDF)
  // ============================================================================
  const handleExportTableExcel = () => {
    const wb = XLSX.utils.book_new();
    const isSem1 = selectedSemester === 'Ganjil';
    const semLabel = isSem1 ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';
    const semPlan = isSem1 ? workingSem1 : workingSem2;
    const semMaterials = isSem1 ? materialsSem1 : materialsSem2;
    const semReserve = Number(semPlan.reservedHours) || 6;
    const semEffJP = semPlan.totalEffectiveWeeks * jpPerWeek;
    const semNetJP = Math.max(0, semEffJP - semReserve);

    const sourceText =
      selectedChoice === 'upload_mandiri' && uploadedInfo
        ? `Upload Mandiri (${uploadedInfo.fileName})`
        : `Hasil Analisis KALDIK TP ${academicYear}`;

    const combinedRows: any[][] = [
      [`ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE) — ${semLabel.toUpperCase()}`],
      [`Satuan Pendidikan: ${schoolProfile.schoolName || '-'} | Mapel: ${subject} | Kelas ${grade} (${level})`],
      [`Tahun Pelajaran: ${academicYear} | Beban Mengajar: ${jpPerWeek} JP/Minggu | Sumber: ${sourceText}`],
      [],
      [`A. TABEL ANALISIS PEKAN EFEKTIF ${semLabel.toUpperCase()}`],
      ['No', 'Bulan', 'Jumlah Pekan Kalender', 'Pekan Tidak Efektif', 'Pekan Efektif KBM (RBE)', 'Total JP (RBE × JP/Mg)', 'Keterangan Agenda & Kalender'],
      ...semPlan.months.map((m, idx) => [
        idx + 1,
        m.monthName,
        m.totalWeeks,
        m.nonEffectiveWeeks,
        m.effectiveWeeks,
        m.effectiveWeeks * jpPerWeek,
        m.description || '',
      ]),
      [
        'TOTAL',
        semLabel,
        semPlan.totalWeeks,
        semPlan.nonEffectiveWeeks,
        semPlan.totalEffectiveWeeks,
        semEffJP,
        `Cadangan Asesmen: ${semReserve} JP | Jam Efektif KBM: ${semNetJP} JP`,
      ],
      [],
      [`B. REKAPITULASI ALOKASI WAKTU ${semLabel.toUpperCase()}`],
      ['Semester', 'Total Pekan Kalender', 'Pekan Tidak Efektif', 'Pekan Efektif (RBE)', 'Total Jam Pelajaran (JP)', 'Cadangan Asesmen (JP)', 'Jam Efektif Tatap Muka (JP)'],
      [
        semLabel,
        semPlan.totalWeeks,
        semPlan.nonEffectiveWeeks,
        semPlan.totalEffectiveWeeks,
        semEffJP,
        semReserve,
        semNetJP,
      ],
    ];

    const wsCombined = XLSX.utils.aoa_to_sheet(combinedRows);
    wsCombined['!cols'] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
      { wch: 48 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCombined, isSem1 ? 'Alokasi Waktu Sem 1' : 'Alokasi Waktu Sem 2');

    // Sheet 2: Distribusi JP per Bab untuk semester terpilih
    const babRows: any[][] = [
      [`DISTRIBUSI ALOKASI WAKTU PER BAB / LINGKUP MATERI — ${semLabel.toUpperCase()}`],
      [`Mata Pelajaran: ${subject} | Kelas ${grade} (${level}) | ${jpPerWeek} JP/Minggu`],
      [],
      ['Semester', 'No', 'Kode TP', 'Bab / Lingkup Materi Pokok', 'Alokasi JP', 'Jumlah Pertemuan'],
      ...semMaterials.map((m, idx) => [
        semLabel,
        idx + 1,
        m.tpCode || `TP.${grade}.${isSem1 ? 1 : 2}.${idx + 1}`,
        m.essentialMaterial || m.tpName || `Bab ${idx + 1}`,
        Number(m.allocatedHours) || 18,
        Math.max(1, Math.round((Number(m.allocatedHours) || 18) / (jpPerWeek || 1))),
      ]),
    ];
    const wsBab = XLSX.utils.aoa_to_sheet(babRows);
    wsBab['!cols'] = [{ wch: 20 }, { wch: 6 }, { wch: 14 }, { wch: 42 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsBab, 'Distribusi JP per Bab');

    const semTag = isSem1 ? 'Sem1' : 'Sem2';
    const fileName = `Analisis_Alokasi_Waktu_${semTag}_${subject.replace(/\s+/g, '_')}_${academicYear.replace('/', '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setSaveToast(`Tabel Excel "${fileName}" berhasil diunduh!`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleExportWord = () => {
    const profile = StorageService.getSchoolProfile();
    const semTag = selectedSemester === 'Ganjil' ? 'Sem1' : 'Sem2';
    const fileName = `Analisis_Alokasi_Waktu_${semTag}_${subject.replace(/\s+/g, '_')}_${academicYear.replace('/', '-')}`;
    ExportService.exportToWord(
      `ANALISIS ALOKASI WAKTU ${selectedSemester.toUpperCase()} - ${subject.toUpperCase()}`,
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

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(previewMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

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
        ? 'Format khusus dokumen aktif & disinkronkan!'
        : 'Format dikembalikan ke standar resmi.'
    );
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Helper renderer for Editable Table filtered strictly to selectedSemester
  const renderUnifiedEditableTableDocument = (choice: 'kaldik' | 'upload_mandiri') => {
    const isSem1 = selectedSemester === 'Ganjil';
    const semKey: 'semester1' | 'semester2' = isSem1 ? 'semester1' : 'semester2';
    const semLabel = isSem1 ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';
    const activePlan =
      choice === 'upload_mandiri' && uploadedInfo
        ? isSem1
          ? uploadedSem1
          : uploadedSem2
        : isSem1
        ? kaldikSem1
        : kaldikSem2;

    const totalEffJP = activePlan.totalEffectiveWeeks * jpPerWeek;
    const reserve = Number(activePlan.reservedHours) || 6;
    const netJP = Math.max(0, totalEffJP - reserve);
    const activeMaterials = isSem1 ? materialsSem1 : materialsSem2;

    const renderSemesterTable = (
      title: string,
      key: 'semester1' | 'semester2',
      plan: KalenderSemesterPlan,
      effJP: number,
      resHours: number,
      netHours: number
    ) => (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {plan.totalEffectiveWeeks} Pekan Efektif ({effJP} JP)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              KBM Bersih: {netHours} JP (Cadangan {resHours} JP)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-2.5 w-10 text-center">No</th>
                <th className="p-2.5 w-40">Bulan</th>
                <th className="p-2.5 w-28 text-center">Jml Pekan</th>
                <th className="p-2.5 w-28 text-center text-rose-600">Tdk Efektif</th>
                <th className="p-2.5 w-28 text-center text-emerald-700">Efektif (RBE)</th>
                <th className="p-2.5 w-24 text-center text-blue-700">Total JP</th>
                <th className="p-2.5">Keterangan Agenda &amp; Hari Libur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {plan.months.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900">{m.monthName}</td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={m.totalWeeks}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) =>
                        handleMonthChangeForChoice(
                          choice,
                          key,
                          idx,
                          'totalWeeks',
                          String(parseNumberInput(e.target.value, 0, 0, 6))
                        )
                      }
                      className="w-14 text-center bg-white border border-slate-300 rounded-md py-1 px-1 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={m.nonEffectiveWeeks}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) =>
                        handleMonthChangeForChoice(
                          choice,
                          key,
                          idx,
                          'nonEffectiveWeeks',
                          String(parseNumberInput(e.target.value, 0, 0, 6))
                        )
                      }
                      className="w-14 text-center bg-rose-50 border border-rose-300 rounded-md py-1 px-1 text-xs font-bold text-rose-700 focus:border-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-block w-14 py-1 px-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 font-black text-xs text-center">
                      {m.effectiveWeeks}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-700">
                    {m.effectiveWeeks * jpPerWeek} JP
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={m.description || ''}
                      onChange={(e) =>
                        handleMonthChangeForChoice(choice, key, idx, 'description', e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-md py-1 px-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                      placeholder="Keterangan agenda..."
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-200">
                <td colSpan={2} className="p-2.5 text-right uppercase text-blue-800 text-[11px]">
                  Total {key === 'semester1' ? 'Semester 1' : 'Semester 2'}:
                </td>
                <td className="p-2.5 text-center">{plan.totalWeeks} Pkn</td>
                <td className="p-2.5 text-center text-rose-700">{plan.nonEffectiveWeeks} Pkn</td>
                <td className="p-2.5 text-center text-emerald-700 font-black">
                  {plan.totalEffectiveWeeks} Pkn
                </td>
                <td className="p-2.5 text-center text-blue-800 font-black">{effJP} JP</td>
                <td className="p-2.5 text-[11px] text-slate-600">
                  {plan.totalEffectiveWeeks} Pekan Efektif × {jpPerWeek} JP/Mg = {effJP} JP (Bersih KBM: {netHours} JP)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        {/* 1. Tabel Rincian Pekan Efektif untuk Semester Terpilih */}
        {renderSemesterTable(
          `Tabel 1: Rincian Pekan Efektif (RBE) — ${semLabel}`,
          semKey,
          activePlan,
          totalEffJP,
          reserve,
          netJP
        )}

        {/* 2. Tabel Rekapitulasi Alokasi Waktu Semester Terpilih */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="px-4 py-3 bg-indigo-50/70 border-b border-indigo-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                Tabel 2: Rekapitulasi Alokasi Waktu {semLabel} ({academicYear})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-indigo-700">
              {subject} • Kelas {grade} ({level})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Semester</th>
                  <th className="p-2.5 text-center">Pekan Kalender</th>
                  <th className="p-2.5 text-center text-rose-600">Tdk Efektif</th>
                  <th className="p-2.5 text-center text-emerald-700">Efektif (RBE)</th>
                  <th className="p-2.5 text-center text-blue-700">Total Jam (JP)</th>
                  <th className="p-2.5 text-center text-amber-700">Cadangan</th>
                  <th className="p-2.5 text-center text-indigo-800">Tatap Muka KBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="bg-indigo-50/40 font-bold text-slate-900">
                  <td className="p-2.5 font-bold text-indigo-900">{semLabel}</td>
                  <td className="p-2.5 text-center">{activePlan.totalWeeks} Pekan</td>
                  <td className="p-2.5 text-center text-rose-600">{activePlan.nonEffectiveWeeks} Pekan</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">
                    {activePlan.totalEffectiveWeeks} Pekan
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-700">{totalEffJP} JP</td>
                  <td className="p-2.5 text-center text-amber-700">{reserve} JP</td>
                  <td className="p-2.5 text-center font-black text-indigo-900">{netJP} JP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Tabel Distribusi JP per Bab (Acuan PROSEM) untuk Semester Terpilih */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                Tabel 3: Distribusi Alokasi JP per Bab / Materi Pokok — {semLabel} (Acuan PROSEM)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800">
              {activeMaterials.length} Bab {semLabel} • {jpPerWeek} JP/Minggu
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-32">Semester</th>
                  <th className="p-2.5 w-24">Kode TP</th>
                  <th className="p-2.5">Bab / Lingkup Materi Pokok</th>
                  <th className="p-2.5 w-28 text-center">Alokasi JP</th>
                  <th className="p-2.5 w-32 text-center">Jml Pertemuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeMaterials.map((m, idx) => {
                  const jp = Number(m.allocatedHours) || 18;
                  const mtg = Math.max(1, Math.round(jp / (jpPerWeek || 1)));
                  return (
                    <tr key={`active-sem-${idx}`} className="hover:bg-slate-50/60">
                      <td className={`p-2.5 font-bold ${isSem1 ? 'text-blue-700' : 'text-indigo-700'}`}>
                        {isSem1 ? 'Sem 1 (Ganjil)' : 'Sem 2 (Genap)'}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">
                        {m.tpCode || `TP.${grade}.${isSem1 ? 1 : 2}.${idx + 1}`}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {m.essentialMaterial || m.tpName}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{jp} JP</td>
                      <td className="p-2.5 text-center text-slate-700">{mtg} Pertemuan</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Reusable save-as-table & sync toolbar
  const renderTableActionBar = (choice: 'kaldik' | 'upload_mandiri') => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1">
          Simpan dalam Bentuk Tabel &amp; Dokumen:
        </span>
        <button
          type="button"
          onClick={handleSaveData}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
        >
          {savedSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Save className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Tabel ke Sistem'}</span>
        </button>

        <button
          type="button"
          onClick={handleExportTableExcel}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simpan Tabel Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          onClick={handleExportWord}
          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Simpan Dokumen Word (.doc)</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak / PDF</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => handleSyncChoiceToProsem(choice)}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>
          {choice === 'kaldik'
            ? 'Sinkronkan Hasil KALDIK ke PROSEM'
            : 'Sinkronkan Dokumen Mandiri ke PROSEM'}
        </span>
      </button>
    </div>
  );

  const activeModeInStorage = kalenderData.activeSourceMode || 'kaldik';

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: ANALISIS ALOKASI WAKTU (RBE & UPLOAD MANDIRI) */}
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
                  Analisis Alokasi Waktu (RBE &amp; Upload Mandiri)
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  Acuan Pembuatan PROSEM
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {subject} • Kelas {grade} ({level})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Tersedia <strong>2 pilihan pembuatan analisis alokasi waktu</strong>: (1){' '}
                <strong>Generate otomatis dari KALDIK</strong> dalam 1 dokumen yang dapat disimpan sebagai tabel, atau (2){' '}
                <strong>Upload mandiri dokumen analisis</strong> Anda sendiri. Kedua pilihan ini dapat disinkronkan langsung sebagai acuan pembuatan <strong>PROSEM</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSyncChoiceToProsem(selectedChoice)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              title="Jadikan pilihan aktif saat ini sebagai acuan pembuatan PROSEM"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan ke PROSEM</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ai_prosem')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buka PROSEM</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Acuan PROSEM Aktif & Pemilih Semester (1 / 2) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Acuan Aktif PROSEM Saat Ini:
            </span>
            {activeModeInStorage === 'upload_mandiri' && uploadedInfo ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold gap-1 text-[11px]">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilihan 2 — Upload Mandiri ({uploadedInfo.fileName})</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold gap-1 text-[11px]">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilihan 1 — Analisis &amp; Generate dari KALDIK ({academicYear})</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium text-[11px]">
            <span>
              Beban: <strong className="text-slate-900">{jpPerWeek} JP/Minggu</strong>
            </span>
            <span>•</span>
            <span>
              {selectedSemester === 'Ganjil' ? 'Sem 1 (Ganjil): ' : 'Sem 2 (Genap): '}
              <strong className="text-emerald-700">
                {(selectedSemester === 'Ganjil'
                  ? workingSem1.totalEffectiveWeeks
                  : workingSem2.totalEffectiveWeeks)}{' '}
                Pekan (
                {(selectedSemester === 'Ganjil'
                  ? workingSem1.totalEffectiveWeeks
                  : workingSem2.totalEffectiveWeeks) * jpPerWeek}{' '}
                JP)
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PILIHAN SEMESTER: SEMESTER 1 (GANJIL) ATAU SEMESTER 2 (GENAP) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Pilih Semester yang Ditampilkan
            </h2>
            <p className="text-[11px] text-slate-500">
              Analisis Alokasi Waktu (RBE &amp; Upload Mandiri) hanya menampilkan data sesuai semester yang dipilih.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            id="btn-pilih-sem-1"
            onClick={() => setSelectedSemester('Ganjil')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              selectedSemester === 'Ganjil'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Semester 1 (Ganjil)</span>
          </button>
          <button
            type="button"
            id="btn-pilih-sem-2"
            onClick={() => setSelectedSemester('Genap')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              selectedSemester === 'Genap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Semester 2 (Genap)</span>
          </button>
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
      {/* 2. DUA PILIHAN PEMBUATAN ANALISIS ALOKASI WAKTU */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PILIHAN 1: HASIL ANALISIS & GENERATE DARI KALDIK */}
        <button
          type="button"
          onClick={() => setSelectedChoice('kaldik')}
          className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedChoice === 'kaldik'
              ? 'bg-blue-50/70 border-blue-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  selectedChoice === 'kaldik'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Pilihan 1
                  </span>
                  {activeModeInStorage === 'kaldik' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Acuan PROSEM Aktif
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1">
                  Analisis &amp; Generate dari KALDIK (1 Dokumen Tabel)
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Menganalisis data Kalender Pendidikan (KALDIK) menjadi dokumen Analisis Alokasi Waktu{' '}
                  <strong>{selectedSemester === 'Ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'}</strong> yang dapat diedit dan disimpan dalam bentuk tabel (Excel / Word / PDF).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-600">
              {selectedSemester === 'Ganjil' ? 'Sem 1 (Ganjil): ' : 'Sem 2 (Genap): '}
              <strong className="text-blue-700">
                {selectedSemester === 'Ganjil' ? kaldikSem1.totalEffectiveWeeks : kaldikSem2.totalEffectiveWeeks} Pkn
                ({(selectedSemester === 'Ganjil' ? kaldikSem1.totalEffectiveWeeks : kaldikSem2.totalEffectiveWeeks) * jpPerWeek} JP)
              </strong>
            </span>
            <span className={selectedChoice === 'kaldik' ? 'text-blue-700 font-bold' : 'text-slate-500'}>
              {selectedChoice === 'kaldik' ? 'Sedang Dibuka ●' : 'Klik untuk Memilih →'}
            </span>
          </div>
        </button>

        {/* PILIHAN 2: UPLOAD SENDIRI ANALISIS ALOKASI WAKTU DALAM BENTUK DOKUMEN */}
        <button
          type="button"
          onClick={() => setSelectedChoice('upload_mandiri')}
          className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedChoice === 'upload_mandiri'
              ? 'bg-indigo-50/70 border-indigo-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  selectedChoice === 'upload_mandiri'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}
              >
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Pilihan 2
                  </span>
                  {activeModeInStorage === 'upload_mandiri' && uploadedInfo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Acuan PROSEM Aktif
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1">
                  Upload Mandiri Dokumen Analisis Alokasi Waktu
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Unggah sendiri dokumen Analisis Alokasi Waktu buatan Anda (<strong>Excel, Word, PDF, atau Scan</strong>). Hasil ekstraksi dapat dilihat, disimpan sebagai tabel, dan disinkronkan ke <strong>PROSEM</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-600 truncate max-w-[260px]">
              {uploadedInfo ? (
                <>
                  Berkas: <strong className="text-indigo-700">{uploadedInfo.fileName}</strong>
                </>
              ) : (
                'Belum ada dokumen mandiri diunggah'
              )}
            </span>
            <span
              className={
                selectedChoice === 'upload_mandiri' ? 'text-indigo-700 font-bold' : 'text-slate-500'
              }
            >
              {selectedChoice === 'upload_mandiri' ? 'Sedang Dibuka ●' : 'Klik untuk Memilih →'}
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN PILIHAN 1: HASIL ANALISIS & GENERATE DARI KALDIK (1 DOKUMEN TABEL) */}
      {/* ========================================================================= */}
      {selectedChoice === 'kaldik' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in">
          {/* Panel Generate dari KALDIK */}
          <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Pilihan 1 — Analisis &amp; Generate Otomatis dari Kalender Pendidikan (KALDIK)
                </h2>
                {hasGeneratedKaldik && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Tergenerate ({selectedSemester === 'Ganjil' ? 'Semester 1' : 'Semester 2'})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sumber KALDIK:{' '}
                <strong>
                  {kalenderData.fileName ||
                    kalenderData.uploadedFile?.fileName ||
                    `Kalender Pendidikan Standar TP ${academicYear}`}
                </strong>{' '}
                • Beban Mapel: <strong>{jpPerWeek} JP/Minggu</strong> • Tampilan aktif:{' '}
                <strong>{selectedSemester === 'Ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('kalender_pendidikan')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ubah KALDIK</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateFromKaldik}
                disabled={isGeneratingKaldik}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingKaldik ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingKaldik
                    ? 'Menganalisis KALDIK...'
                    : 'Analisis & Generate dari KALDIK'}
                </span>
              </button>
            </div>
          </div>

          {/* Sub-Toggle View: Tabel Lengkap vs Pratinjau Dokumen */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setKaldikViewMode('tabel')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  kaldikViewMode === 'tabel'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>
                  Bentuk Tabel ({selectedSemester === 'Ganjil' ? 'Semester 1' : 'Semester 2'})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setKaldikViewMode('dokumen')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  kaldikViewMode === 'dokumen'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  Pratinjau Dokumen ({selectedSemester === 'Ganjil' ? 'Semester 1' : 'Semester 2'})
                </span>
              </button>
            </div>

            {kaldikViewMode === 'dokumen' && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks Dokumen'}</span>
              </button>
            )}
          </div>

          {/* Save & Sync Toolbar */}
          {renderTableActionBar('kaldik')}

          {/* Content View */}
          {kaldikViewMode === 'tabel' ? (
            renderUnifiedEditableTableDocument('kaldik')
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <DocumentPdfPreview
                content={previewMarkdown}
                title={`Analisis Alokasi Waktu ${subject} - TP ${academicYear}`}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEN PILIHAN 2: UPLOAD MANDIRI ANALISIS ALOKASI WAKTU DOKUMEN */}
      {/* ========================================================================= */}
      {selectedChoice === 'upload_mandiri' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in">
          {/* Main Upload Zone */}
          <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl p-6 transition-colors bg-indigo-50/20">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <FileUp className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Pilihan 2 — Upload Dokumen Sendiri
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1.5">
                  Upload Analisis Alokasi Waktu dalam Bentuk Dokumen
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto leading-relaxed">
                  Unggah dokumen analisis alokasi waktu yang telah Anda buat sendiri (<strong>Excel .xlsx/.xls/.csv</strong>, <strong>Word .docx</strong>, <strong>PDF</strong>, atau <strong>Foto Scan</strong>). Sistem mengekstrak rincian pekan efektif dan langsung menjadikannya acuan pembuatan <strong>PROSEM</strong>.
                </p>
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-white'
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
                  <UploadCloud
                    className={`w-8 h-8 ${isDragOver ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <div className="text-xs font-semibold text-slate-700">
                    <span className="text-indigo-600 underline font-bold">
                      Klik untuk memilih dokumen dari komputer
                    </span>{' '}
                    atau seret dan lepas berkas ke sini
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mendukung Excel (.xlsx, .xls), Word (.docx), PDF, CSV, TXT, dan Foto Scan (Maks 20MB)
                  </p>
                </div>

                {isUploading && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-center space-x-2 text-xs font-bold text-indigo-700">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Membaca dokumen &amp; mengekstraksi tabel alokasi waktu ke PROSEM...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    AlokasiWaktuParser.downloadAlokasiWaktuExcelTemplate(academicYear, subject)
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Contoh Format Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Uploaded Document Summary & Extracted Data */}
          {(uploadedInfo || uploadResult) && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-emerald-950">
                        Dokumen Mandiri Terunggah:{' '}
                        {uploadedInfo?.fileName || uploadResult?.fileName}
                      </h3>
                      {uploadedInfo?.confidenceScore && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          Kecocokan {uploadedInfo.confidenceScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {selectedSemester === 'Ganjil' ? 'Semester 1 (Ganjil): ' : 'Semester 2 (Genap): '}
                      <strong>
                        {selectedSemester === 'Ganjil'
                          ? uploadedSem1.totalEffectiveWeeks
                          : uploadedSem2.totalEffectiveWeeks}{' '}
                        Pekan (
                        {(selectedSemester === 'Ganjil'
                          ? uploadedSem1.totalEffectiveWeeks
                          : uploadedSem2.totalEffectiveWeeks) * jpPerWeek}{' '}
                        JP)
                      </strong>{' '}
                      • Beban: <strong>{jpPerWeek} JP/Minggu</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Ganti Dokumen
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveUploadedAlokasi}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Sub-Toggle View inside Pilihan 2 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUploadViewMode('tabel')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      uploadViewMode === 'tabel'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Tabel Hasil Ekstraksi (Siap Simpan &amp; Sinkron)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadViewMode('dokumen_asli')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      uploadViewMode === 'dokumen_asli'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Isi Teks / Tabel Dokumen Asli</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadViewMode('pratinjau')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      uploadViewMode === 'pratinjau'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Dokumen Resmi</span>
                  </button>
                </div>
              </div>

              {renderTableActionBar('upload_mandiri')}

              {uploadViewMode === 'tabel' && renderUnifiedEditableTableDocument('upload_mandiri')}

              {uploadViewMode === 'dokumen_asli' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Konten yang Diekstrak dari Dokumen Unggahan
                  </h4>
                  {uploadedInfo?.tableMarkdown || uploadResult?.tableMarkdown ? (
                    <DocumentPdfPreview
                      content={uploadedInfo?.tableMarkdown || uploadResult?.tableMarkdown || ''}
                      title={`Ekstraksi Tabel - ${uploadedInfo?.fileName || uploadResult?.fileName}`}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-white p-4 rounded-lg border border-slate-200 max-h-[450px] overflow-y-auto font-mono">
                      {uploadedInfo?.extractedText ||
                        uploadResult?.extractedText ||
                        'Tidak ada pratinjau teks yang diekstrak. Gunakan tab Tabel Hasil Ekstraksi untuk memverifikasi angka pekan efektif.'}
                    </pre>
                  )}
                </div>
              )}

              {uploadViewMode === 'pratinjau' && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <DocumentPdfPreview
                    content={previewMarkdown}
                    title={`Analisis Alokasi Waktu (Upload Mandiri) - ${subject}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPSIONAL: PENGATURAN FORMAT KOP & TATA LETAK KHUSUS */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFormatSettings(!showFormatSettings)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Pengaturan Format &amp; Kop Dokumen Sekolah (Opsional)
              </h3>
              <p className="text-[11px] text-slate-500">
                Sesuaikan tata letak atau kop dokumen jika diperlukan sebelum ekspor Word / PDF.
              </p>
            </div>
          </div>
          {showFormatSettings ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        {showFormatSettings && (
          <div className="p-5 border-t border-slate-200">
            <CustomFormatSelector
              value={customFormatConfig}
              onChange={handleCustomFormatChange}
              docTypeId="analisis_alokasi_waktu"
              docTypeName="Analisis Alokasi Waktu (RBE)"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI SINKRONISASI KE PROSEM */}
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
                    Data pekan efektif dan alokasi JP siap dijadikan acuan matriks Program Semester.
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

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 gap-2">
                <span className="text-slate-500 font-medium">Sumber Acuan Aktif:</span>
                <span className="font-bold text-indigo-700 text-right">
                  {lastSyncedModeLabel ||
                    (kalenderData.activeSourceMode === 'upload_mandiri'
                      ? `Pilihan 2: Upload Mandiri (${uploadedInfo?.fileName})`
                      : 'Pilihan 1: Hasil Analisis & Generate dari KALDIK')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Mata Pelajaran &amp; Kelas:</span>
                <span className="font-bold text-slate-800">
                  {subject} • Kelas {grade} ({level})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  {selectedSemester === 'Ganjil' ? 'Semester 1 (Ganjil):' : 'Semester 2 (Genap):'}
                </span>
                <span className="font-bold text-emerald-700">
                  {(selectedSemester === 'Ganjil'
                    ? kalenderData.semester1.totalEffectiveWeeks
                    : kalenderData.semester2.totalEffectiveWeeks)}{' '}
                  Pekan Efektif (
                  {(selectedSemester === 'Ganjil'
                    ? kalenderData.semester1.totalEffectiveWeeks
                    : kalenderData.semester2.totalEffectiveWeeks) * jpPerWeek}{' '}
                  JP)
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
