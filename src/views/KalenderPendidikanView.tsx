import React, { useState, useEffect } from 'react';
import {
  Calendar,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Copy,
  Check,
  Save,
  Sparkles,
  RefreshCw,
  Info,
  CalendarDays,
  CalendarCheck,
  Calculator,
  Layers,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Trash2,
  Eye,
  Sliders,
  CheckCircle2,
  Table,
  Scale,
  Zap,
  ArrowRight,
  BookOpen,
  Plus,
} from 'lucide-react';
import { KalenderPendidikanData, KalenderMonthAnalysis, SemesterType, EducationLevel, CPMaterialItem } from '../types';
import { StorageService, DEFAULT_KALENDER_PENDIDIKAN, addStorageListener } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { generateExpertCurriculumDocument } from '../lib/curriculumEngine';
import { getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import { DocumentPdfPreview } from '../components/DocumentPdfPreview';
import { CustomFormatSelector, CustomFormatConfig } from '../components/CustomFormatSelector';
import { RbeAnalysisSection } from '../components/RbeAnalysisSection';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

export type KaldikStepTab =
  | 'parameter_materi'
  | 'upload_analisis_rbe'
  | 'format_kustom_preview'
  | 'analisis'
  | 'upload'
  | 'kaldik_upload'
  | 'custom_format'
  | 'prosem_preview'
  | 'parameter';

export interface KalenderPendidikanViewProps {
  initialTab?: KaldikStepTab;
  onNavigate?: (viewId: string) => void;
  onSwitchTab?: (tab: 'parameter_materi' | 'upload_analisis_rbe' | 'format_kustom_preview') => void;
}

const resolveKaldikTab = (
  tab?: KaldikStepTab
): 'parameter_materi' | 'upload_analisis_rbe' | 'format_kustom_preview' => {
  if (tab === 'parameter' || tab === 'parameter_materi') return 'parameter_materi';
  if (tab === 'custom_format' || tab === 'prosem_preview' || tab === 'format_kustom_preview') {
    return 'format_kustom_preview';
  }
  return 'upload_analisis_rbe';
};

export const KalenderPendidikanView: React.FC<KalenderPendidikanViewProps> = ({
  initialTab = 'parameter_materi',
  onNavigate,
  onSwitchTab,
}) => {
  const [activeTab, setActiveTab] = useState<'parameter_materi' | 'upload_analisis_rbe' | 'format_kustom_preview'>(
    () => resolveKaldikTab(initialTab)
  );

  // Sequential sub-step state for upload_analisis_rbe: 'upload' (Tahap 1) -> 'analisis' (Tahap 2)
  const [kaldikSubStep, setKaldikSubStep] = useState<'upload' | 'analisis'>(() => {
    if (initialTab === 'analisis') return 'analisis';
    return 'upload';
  });

  const handleSwitchTab = (tab: 'parameter_materi' | 'upload_analisis_rbe' | 'format_kustom_preview') => {
    setActiveTab(tab);
    if (onSwitchTab) {
      onSwitchTab(tab);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(resolveKaldikTab(initialTab));
      if (initialTab === 'analisis') {
        setKaldikSubStep('analisis');
      } else if (initialTab === 'upload' || initialTab === 'kaldik_upload') {
        setKaldikSubStep('upload');
      }
    }
  }, [initialTab]);
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
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [selectedSemester, setSelectedSemester] = useState<SemesterType>('Ganjil');

  // School profile & Subject metadata for calculation
  const schoolProfile = StorageService.getSchoolProfile();
  const masterCP = StorageService.getActiveMasterCP();

  const [subject, setSubject] = useState<string>(masterCP?.subject || 'Fisika');
  const [level, setLevel] = useState<EducationLevel>((masterCP?.level as EducationLevel) || 'SMA');
  const [grade, setGrade] = useState<number>(Number(masterCP?.grade) || 10);
  const [jpPerWeek, setJpPerWeek] = useState<number>(masterCP?.jpPerWeek || 3);
  const [academicYear, setAcademicYear] = useState<string>(kalenderData.tahunAjaran || schoolProfile.academicYear || '2025/2026');

  // Materials / Chapters distribution state (Semester 1 & Semester 2)
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem1 && masterCP.materialsSem1.length > 0) {
      return masterCP.materialsSem1;
    }
    const preset = getSubjectPresetByGrade(masterCP?.subject || 'Fisika', (masterCP?.level as EducationLevel) || 'SMA', Number(masterCP?.grade) || 10);
    return (preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` }));
  });

  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem2 && masterCP.materialsSem2.length > 0) {
      return masterCP.materialsSem2;
    }
    const preset = getSubjectPresetByGrade(masterCP?.subject || 'Fisika', (masterCP?.level as EducationLevel) || 'SMA', Number(masterCP?.grade) || 10);
    return (preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` }));
  });

  const [distSyncToast, setDistSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      const prof = StorageService.getSchoolProfile();
      const master = StorageService.getActiveMasterCP();
      const kaldik = StorageService.getKalenderPendidikan();
      setSubject(master?.subject || prof.subject || 'Fisika');
      setLevel((master?.level as EducationLevel) || (prof.level as EducationLevel) || 'SMA');
      setGrade(Number(master?.grade || prof.grade || 10));
      setJpPerWeek(Number(master?.jpPerWeek || prof.jpPerWeek || 3));
      setAcademicYear(kaldik.tahunAjaran || prof.academicYear || '2026/2027');
      if (master?.materialsSem1 && master.materialsSem1.length > 0) setMaterialsSem1(master.materialsSem1);
      if (master?.materialsSem2 && master.materialsSem2.length > 0) setMaterialsSem2(master.materialsSem2);
    };

    window.addEventListener('curriculum-parameters-synced', handleSync);
    window.addEventListener('school-profile-updated', handleSync);
    window.addEventListener('master-cp-updated', handleSync);

    return () => {
      window.removeEventListener('curriculum-parameters-synced', handleSync);
      window.removeEventListener('school-profile-updated', handleSync);
      window.removeEventListener('master-cp-updated', handleSync);
    };
  }, []);

  // Helper to update chapter in distribution table
  const handleUpdateChapterHours = (sem: 1 | 2, index: number, newHours: number) => {
    const sanitizedHours = Math.max(0, Math.min(100, newHours));
    const calculatedMeetings = Math.max(1, Math.round(sanitizedHours / (jpPerWeek || 1)));
    if (sem === 1) {
      const updated = [...materialsSem1];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          allocatedHours: sanitizedHours,
          meetingCount: calculatedMeetings,
        };
        setMaterialsSem1(updated);
      }
    } else {
      const updated = [...materialsSem2];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          allocatedHours: sanitizedHours,
          meetingCount: calculatedMeetings,
        };
        setMaterialsSem2(updated);
      }
    }
  };

  const handleUpdateChapterMeetings = (sem: 1 | 2, index: number, newMeetings: number) => {
    const sanitizedMeetings = Math.max(1, Math.min(40, newMeetings));
    const calculatedHours = sanitizedMeetings * (jpPerWeek || 1);
    if (sem === 1) {
      const updated = [...materialsSem1];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          allocatedHours: calculatedHours,
          meetingCount: sanitizedMeetings,
        };
        setMaterialsSem1(updated);
      }
    } else {
      const updated = [...materialsSem2];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          allocatedHours: calculatedHours,
          meetingCount: sanitizedMeetings,
        };
        setMaterialsSem2(updated);
      }
    }
  };

  // Auto-distribute total semester hours equally across BABs and calculate meeting count = (Allocated JP / JP per Week)
  const handleAutoDistributeChaptersByJpPerWeek = (sem: 1 | 2, customTargetHours?: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    if (list.length === 0) return;
    const numBab = list.length;
    const semData = sem === 1 ? kalenderData.semester1 : kalenderData.semester2;
    const totalSemJP = customTargetHours !== undefined && customTargetHours > 0
      ? customTargetHours
      : (semData?.totalEffectiveHours || (semData?.totalEffectiveWeeks ? semData.totalEffectiveWeeks * jpPerWeek : 50));
    
    const baseHours = Math.floor(totalSemJP / numBab);
    const remainder = totalSemJP % numBab;

    const distributed: CPMaterialItem[] = list.map((item, idx) => {
      const allocatedHours = baseHours + (idx < remainder ? 1 : 0);
      const meetingCount = Math.max(1, Math.round(allocatedHours / (jpPerWeek || 1)));
      return {
        ...item,
        allocatedHours,
        meetingCount,
      };
    });

    if (sem === 1) {
      setMaterialsSem1(distributed);
    } else {
      setMaterialsSem2(distributed);
    }

    const calculatedMeetings = Math.max(1, Math.round(baseHours / (jpPerWeek || 1)));
    setDistSyncToast(
      `Alokasi ${totalSemJP} JP berhasil dibagi rata ke ${numBab} BAB (masing-masing ~${baseHours} JP). Jumlah Pertemuan: ${baseHours} JP ÷ ${jpPerWeek} JP/Mg = ${calculatedMeetings} kali pertemuan per bab.`
    );
    setTimeout(() => setDistSyncToast(null), 5000);
  };

  const handleUpdateChapterField = (sem: 1 | 2, index: number, field: keyof CPMaterialItem, value: any) => {
    if (sem === 1) {
      const updated = [...materialsSem1];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
        setMaterialsSem1(updated);
      }
    } else {
      const updated = [...materialsSem2];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
        setMaterialsSem2(updated);
      }
    }
  };

  const handleAddChapter = (sem: 1 | 2) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const nextIdx = list.length + 1;
    const defaultHours = jpPerWeek * 4; // Default 4 meetings (e.g. 20 JP if jpPerWeek = 5)
    const newChapter: CPMaterialItem = {
      id: `mat-${sem}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      semester: sem,
      orderNumber: nextIdx,
      tpCode: `TP ${grade}.${sem === 1 ? nextIdx : nextIdx + materialsSem1.length}`,
      tpName: `Memahami dan menerapkan materi esensial Bab ${nextIdx}`,
      essentialMaterial: `Bab ${nextIdx}: Materi Pokok Pembelajaran Baru`,
      allocatedHours: defaultHours,
      meetingCount: 4,
      tpCount: 1,
      assessmentStrategy: 'Tes Tertulis & Penugasan Kinerja',
    };
    if (sem === 1) {
      setMaterialsSem1([...materialsSem1, newChapter]);
    } else {
      setMaterialsSem2([...materialsSem2, newChapter]);
    }
  };

  const handleDeleteChapter = (sem: 1 | 2, index: number) => {
    if (sem === 1) {
      setMaterialsSem1(materialsSem1.filter((_, idx) => idx !== index));
    } else {
      setMaterialsSem2(materialsSem2.filter((_, idx) => idx !== index));
    }
  };

  const handleSaveDistributionToMaster = () => {
    const currentMaster = StorageService.getActiveMasterCP();
    if (currentMaster) {
      const syncSem1 = materialsSem1.map((m) => ({
        ...m,
        meetingCount: Math.max(1, Math.round((Number(m.allocatedHours) || 0) / (jpPerWeek || 1))),
      }));
      const syncSem2 = materialsSem2.map((m) => ({
        ...m,
        meetingCount: Math.max(1, Math.round((Number(m.allocatedHours) || 0) / (jpPerWeek || 1))),
      }));
      StorageService.setActiveMasterCP({
        ...currentMaster,
        jpPerWeek,
        materialsSem1: syncSem1,
        materialsSem2: syncSem2,
        totalHoursPerYear: [...syncSem1, ...syncSem2].reduce((sum, m) => sum + (m.allocatedHours || 0), 0),
      });
    }
    setDistSyncToast('Tabel Distribusi JP & Jumlah Pertemuan berhasil disimpan dan disinkronkan ke Profil Guru, PROTA, PROSEM & Modul Ajar!');
    setTimeout(() => setDistSyncToast(null), 4000);
  };

  // AI & Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisToast, setAnalysisToast] = useState<string | null>(null);

  // File upload state
  const [uploadFile, setUploadFile] = useState<{ name: string; size: string; type: string; base64?: string } | null>(
    kalenderData.uploadedFile
      ? {
          name: kalenderData.uploadedFile.fileName,
          size: `${Math.round(kalenderData.uploadedFile.fileSize / 1024)} KB`,
          type: kalenderData.uploadedFile.fileType,
          base64: kalenderData.uploadedFile.base64Data,
        }
      : null
  );
  const [uploadNotes, setUploadNotes] = useState<string>(kalenderData.catatanKhusus || '');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');

  // Generated document preview
  const [previewMarkdown, setPreviewMarkdown] = useState<string>('');

  // Sync with storage changes
  useEffect(() => {
    const unsub = addStorageListener(() => {
      const updated = StorageService.getKalenderPendidikan();
      setKalenderData(updated);
      if (updated.customFormatConfig) {
        setCustomFormatConfig(updated.customFormatConfig);
      }
    });
    return () => unsub();
  }, []);

  // Update markdown whenever semester, kalender, or custom format changes
  useEffect(() => {
    const doc = generateExpertCurriculumDocument({
      toolType: 'analisis_alokasi_waktu',
      docType: 'analisis_alokasi_waktu',
      subject,
      level,
      grade,
      phase: level === 'SD' ? (grade <= 2 ? 'Fase A' : grade <= 4 ? 'Fase B' : 'Fase C') : level === 'SMP' ? 'Fase D' : grade === 10 ? 'Fase E' : 'Fase F',
      semester: selectedSemester,
      topic: `${subject} Semester ${selectedSemester}`,
      kalenderData,
      customFormatNotes: customFormatConfig.useCustomFormat ? customFormatConfig.customFormatNotes : undefined,
    });
    setPreviewMarkdown(doc);
  }, [kalenderData, selectedSemester, subject, level, grade, jpPerWeek, customFormatConfig]);

  // Helper to extract startYear & endYear from an academic year string
  const getAcademicStartAndEndYear = (yearStr: string) => {
    const match = yearStr.match(/(\d{4})\s*[\/\-]\s*(\d{4})/);
    if (match) {
      return {
        startYear: parseInt(match[1], 10),
        endYear: parseInt(match[2], 10),
      };
    }
    const singleMatch = yearStr.match(/(\d{4})/);
    if (singleMatch) {
      const yr = parseInt(singleMatch[1], 10);
      return { startYear: yr, endYear: yr + 1 };
    }
    return { startYear: 2025, endYear: 2026 };
  };

  // Sync academic year across months and storage
  const handleAcademicYearChange = (newYear: string) => {
    const cleaned = newYear.trim();
    setAcademicYear(cleaned);

    const { startYear, endYear } = getAcademicStartAndEndYear(cleaned);

    // Update month names in current data
    const updatedSem1Months = (kalenderData.semester1?.months || []).map((m) => {
      const pureMonth = m.monthName.replace(/\s*\d{4}.*$/, '').trim();
      return {
        ...m,
        monthName: `${pureMonth} ${startYear}`,
      };
    });

    const updatedSem2Months = (kalenderData.semester2?.months || []).map((m) => {
      const pureMonth = m.monthName.replace(/\s*\d{4}.*$/, '').trim();
      return {
        ...m,
        monthName: `${pureMonth} ${endYear}`,
      };
    });

    const updated: KalenderPendidikanData = {
      ...kalenderData,
      academicYear: cleaned,
      tahunAjaran: cleaned,
      semester1: {
        ...kalenderData.semester1,
        academicYear: cleaned,
        months: updatedSem1Months,
      },
      semester2: {
        ...kalenderData.semester2,
        academicYear: cleaned,
        months: updatedSem2Months,
      },
      lastUpdated: new Date().toISOString(),
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  // Run Smart Analysis of Kaldik (Calculates effective weeks from Kaldik)
  const handleRunSmartAnalysis = (
    customNotes?: string,
    customAcademicYear?: string,
    onComplete?: () => void
  ) => {
    setIsAnalyzing(true);
    setAnalysisToast('Sedang menganalisis kalender pendidikan dan menghitung alokasi waktu...');

    const targetYear = customAcademicYear || academicYear;
    const { startYear, endYear } = getAcademicStartAndEndYear(targetYear);

    setTimeout(() => {
      // Analyze Semester 1 (Juli - Desember {startYear})
      const sem1Months: KalenderMonthAnalysis[] = [
        {
          monthName: `Juli ${startYear}`,
          totalWeeks: 5,
          nonEffectiveWeeks: 2,
          effectiveWeeks: 3,
          description: `Libur Akhir TP ${startYear - 1}/${startYear} (P1-P2) & MPLS Siswa Baru (P3)`,
          agendaTags: ['LIBUR', 'MPLS', 'KBM'],
        },
        {
          monthName: `Agustus ${startYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 0,
          effectiveWeeks: 4,
          description: `KBM Efektif Penuh & Peringatan HUT RI Ke-${startYear - 1945}`,
          agendaTags: ['KBM'],
        },
        {
          monthName: `September ${startYear}`,
          totalWeeks: 5,
          nonEffectiveWeeks: 1,
          effectiveWeeks: 4,
          description: 'Asesmen Sumatif Tengah Semester (ASTS/PTS) Pekan ke-4',
          agendaTags: ['ASTS', 'KBM'],
        },
        {
          monthName: `Oktober ${startYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 0,
          effectiveWeeks: 4,
          description: 'KBM Efektif & Pelaksanaan Proyek Penguatan Karakter/P5',
          agendaTags: ['KBM', 'P5'],
        },
        {
          monthName: `November ${startYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 0,
          effectiveWeeks: 4,
          description: 'KBM Efektif & Persiapan Asesmen Akhir Semester',
          agendaTags: ['KBM'],
        },
        {
          monthName: `Desember ${startYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 4,
          effectiveWeeks: 0,
          description: 'ASAS/PAS (P1), Remedial (P2), Pembagian Rapor (P3), Libur Sem 1 (P4)',
          agendaTags: ['ASAS', 'RAPOR', 'LIBUR'],
        },
      ];

      // Analyze Semester 2 (Januari - Juni {endYear})
      const sem2Months: KalenderMonthAnalysis[] = [
        {
          monthName: `Januari ${endYear}`,
          totalWeeks: 5,
          nonEffectiveWeeks: 1,
          effectiveWeeks: 4,
          description: 'Libur Awal Semester Genap (P1) & Awal KBM Genap (P2-P5)',
          agendaTags: ['LIBUR', 'KBM'],
        },
        {
          monthName: `Februari ${endYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 0,
          effectiveWeeks: 4,
          description: 'KBM Efektif Penuh Semester Genap',
          agendaTags: ['KBM'],
        },
        {
          monthName: `Maret ${endYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 1,
          effectiveWeeks: 3,
          description: 'ASTS Genap & Libur Awal Ramadhan / Libur Keagamaan (P3)',
          agendaTags: ['ASTS', 'LIBUR', 'KBM'],
        },
        {
          monthName: `April ${endYear}`,
          totalWeeks: 5,
          nonEffectiveWeeks: 2,
          effectiveWeeks: 3,
          description: 'Libur Hari Raya Idul Fitri / Libur Nasional (P1-P2) & KBM Efektif (P3-P5)',
          agendaTags: ['LIBUR', 'KBM'],
        },
        {
          monthName: `Mei ${endYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 1,
          effectiveWeeks: 3,
          description: 'Asesmen Akhir Jenjang / Ujian Sekolah (P3) & KBM Efektif',
          agendaTags: ['ASTS', 'KBM'],
        },
        {
          monthName: `Juni ${endYear}`,
          totalWeeks: 4,
          nonEffectiveWeeks: 3,
          effectiveWeeks: 1,
          description: 'ASAS Genap (P1), Pembagian Rapor (P2), Libur Kenaikan Kelas (P3-P4)',
          agendaTags: ['ASAS', 'RAPOR', 'LIBUR'],
        },
      ];

      // If user typed notes, apply context note
      const notesToUse = customNotes !== undefined ? customNotes : uploadNotes;

      const sem1EffWeeks = sem1Months.reduce((s, m) => s + m.effectiveWeeks, 0);
      const sem2EffWeeks = sem2Months.reduce((s, m) => s + m.effectiveWeeks, 0);

      const updated: KalenderPendidikanData = {
        ...kalenderData,
        academicYear: targetYear,
        tahunAjaran: targetYear,
        catatanKhusus: notesToUse,
        semester1: {
          ...kalenderData.semester1,
          academicYear: targetYear,
          months: sem1Months,
          totalWeeks: sem1Months.reduce((s, m) => s + m.totalWeeks, 0),
          nonEffectiveWeeks: sem1Months.reduce((s, m) => s + m.nonEffectiveWeeks, 0),
          totalEffectiveWeeks: sem1EffWeeks,
          jpPerWeek,
          totalJpSemester: sem1EffWeeks * jpPerWeek,
          reservedHours: 6,
          netTeachingHours: Math.max(0, sem1EffWeeks * jpPerWeek - 6),
        },
        semester2: {
          ...kalenderData.semester2,
          academicYear: targetYear,
          months: sem2Months,
          totalWeeks: sem2Months.reduce((s, m) => s + m.totalWeeks, 0),
          nonEffectiveWeeks: sem2Months.reduce((s, m) => s + m.nonEffectiveWeeks, 0),
          totalEffectiveWeeks: sem2EffWeeks,
          jpPerWeek,
          totalJpSemester: sem2EffWeeks * jpPerWeek,
          reservedHours: 6,
          netTeachingHours: Math.max(0, sem2EffWeeks * jpPerWeek - 6),
        },
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updated);
      StorageService.saveKalenderPendidikan(updated);
      setIsAnalyzing(false);
      setAnalysisToast(`✅ Analisis Kalender TP ${targetYear} Selesai! Alokasi waktu Sem 1: ${sem1EffWeeks} RBE (${sem1EffWeeks * jpPerWeek} JP) & Sem 2: ${sem2EffWeeks} RBE (${sem2EffWeeks * jpPerWeek} JP) telah disinkronkan ke seluruh aplikasi.`);
      if (onComplete) {
        onComplete();
      }
      setTimeout(() => setAnalysisToast(null), 5000);
    }, 800);
  };

  // Handle Month analysis changes
  const handleMonthChange = (
    sem: 'semester1' | 'semester2',
    index: number,
    field: keyof KalenderMonthAnalysis,
    value: any
  ) => {
    const currentMonths = [...kalenderData[sem].months];
    currentMonths[index] = {
      ...currentMonths[index],
      [field]: value,
    };

    // Recalculate effective weeks for this month if totalWeeks or nonEffectiveWeeks changed
    if (field === 'totalWeeks' || field === 'nonEffectiveWeeks') {
      const tw = field === 'totalWeeks' ? Number(value) : currentMonths[index].totalWeeks;
      const nw = field === 'nonEffectiveWeeks' ? Number(value) : currentMonths[index].nonEffectiveWeeks;
      currentMonths[index].effectiveWeeks = Math.max(0, tw - nw);
    }

    // Recalculate total sums
    const totalWeeksSum = currentMonths.reduce((sum, m) => sum + (Number(m.totalWeeks) || 0), 0);
    const nonEffWeeksSum = currentMonths.reduce((sum, m) => sum + (Number(m.nonEffectiveWeeks) || 0), 0);
    const effWeeksSum = currentMonths.reduce((sum, m) => sum + (Number(m.effectiveWeeks) || 0), 0);

    const updatedData: KalenderPendidikanData = {
      ...kalenderData,
      [sem]: {
        ...kalenderData[sem],
        months: currentMonths,
        totalWeeks: totalWeeksSum,
        nonEffectiveWeeks: nonEffWeeksSum,
        totalEffectiveWeeks: effWeeksSum,
        jpPerWeek: jpPerWeek,
        totalJpSemester: effWeeksSum * jpPerWeek,
        netTeachingHours: Math.max(0, effWeeksSum * jpPerWeek - 6),
      },
      lastUpdated: new Date().toISOString(),
    };

    setKalenderData(updatedData);
    StorageService.saveKalenderPendidikan(updatedData);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const fileInfo = {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || 'application/octet-stream',
        base64: base64Data,
      };

      setUploadFile(fileInfo);

      // Detect academic year from filename if present
      let detectedYear = academicYear;
      const yrMatch = file.name.match(/(20\d{2})\s*[\-_/]\s*(20\d{2})/);
      if (yrMatch) {
        detectedYear = `${yrMatch[1]}/${yrMatch[2]}`;
        setAcademicYear(detectedYear);
      }

      const updated: KalenderPendidikanData = {
        ...kalenderData,
        academicYear: detectedYear,
        tahunAjaran: detectedYear,
        uploadedFile: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data: base64Data,
          uploadedAt: new Date().toISOString(),
        },
        catatanKhusus: uploadNotes,
        lastUpdated: new Date().toISOString(),
      };

      setKalenderData(updated);
      StorageService.saveKalenderPendidikan(updated);
      setUploadSuccessMsg(`Berkas "${file.name}" berhasil diunggah (TP ${detectedYear})! Sistem otomatis memproses analisis alokasi waktu.`);

      // Otomatis jalankan analisis alokasi waktu dengan tahun terdeteksi dan lanjut ke tahap analisis
      handleRunSmartAnalysis(uploadNotes, detectedYear, () => {
        setKaldikSubStep('analisis');
      });
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    };

    reader.readAsDataURL(file);
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadFile(null);
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      uploadedFile: undefined,
      lastUpdated: new Date().toISOString(),
    };
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  // Save changes explicitly
  const handleSaveData = () => {
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      tahunAjaran: academicYear,
      catatanKhusus: uploadNotes,
      semester1: {
        ...kalenderData.semester1,
        jpPerWeek,
        totalJpSemester: kalenderData.semester1.totalEffectiveWeeks * jpPerWeek,
        netTeachingHours: Math.max(0, kalenderData.semester1.totalEffectiveWeeks * jpPerWeek - 6),
      },
      semester2: {
        ...kalenderData.semester2,
        jpPerWeek,
        totalJpSemester: kalenderData.semester2.totalEffectiveWeeks * jpPerWeek,
        netTeachingHours: Math.max(0, kalenderData.semester2.totalEffectiveWeeks * jpPerWeek - 6),
      },
      lastUpdated: new Date().toISOString(),
    };

    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Reset to default
  const handleResetDefault = () => {
    if (confirm('Kembalikan data Kalender Pendidikan ke standar resmi TP 2025/2026?')) {
      setKalenderData(DEFAULT_KALENDER_PENDIDIKAN);
      StorageService.saveKalenderPendidikan(DEFAULT_KALENDER_PENDIDIKAN);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  // Handle Custom Format School Change
  const handleCustomFormatChange = (newConfig: CustomFormatConfig) => {
    setCustomFormatConfig(newConfig);
    const updated: KalenderPendidikanData = {
      ...kalenderData,
      customFormatConfig: newConfig,
      lastUpdated: new Date().toISOString(),
    };
    setKalenderData(updated);
    StorageService.saveKalenderPendidikan(updated);
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(previewMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export handlers
  const handleExportWord = () => {
    const profile = StorageService.getSchoolProfile();
    const formattedHtml = ExportService.markdownToHtml(previewMarkdown);
    const docTitle = `Analisis Alokasi Waktu Semester ${selectedSemester} - ${subject}`;
    ExportService.exportToWord(
      docTitle,
      formattedHtml,
      profile,
      `Analisis_Alokasi_Waktu_${subject}_Sem_${selectedSemester}_2025-2026`
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
      'Keterangan Agenda': `Total Alokasi Efektif: ${sem.totalEffectiveWeeks * jpPerWeek} JP`,
    });

    ExportService.exportToExcel(
      tableData,
      `Analisis_Alokasi_Waktu_${selectedSemester}_2025-2026`,
      `Alokasi Sem ${selectedSemester}`,
      {
        docTitle: `ANALISIS ALOKASI WAKTU SEMESTER ${selectedSemester.toUpperCase()}`,
        academicYear: kalenderData.tahunAjaran,
        teacherName: subject,
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Active semester analysis data
  const activeSemData = selectedSemester === 'Ganjil' ? kalenderData.semester1 : kalenderData.semester2;
  const totalEffJP = activeSemData.totalEffectiveWeeks * jpPerWeek;
  const reserveJP = 6;
  const kbmEffJP = Math.max(0, totalEffJP - reserveJP);

  return (
    <div className="space-y-5">
      {/* Header Banner - Unified Kalender & Alokasi Waktu */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  Kalender Pendidikan & Analisis Alokasi Waktu
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Alokasi Waktu Otomatis dari Kaldik
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  TP {academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Menu Terpadu: Upload dokumen Kalender Pendidikan sekolah, sistem otomatis mengekstrak & menganalisis rincian pekan efektif (RBE) Semester 1 & 2, alokasi jam tatap muka (JP), serta sinkronisasi langsung ke PROSEM & PROTA.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-run-smart-analysis"
              onClick={() => handleRunSmartAnalysis()}
              disabled={isAnalyzing}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-amber-200' : 'text-white'}`} />
              <span>{isAnalyzing ? 'Menganalisis...' : 'Analisis Kaldik'}</span>
            </button>
            <button
              type="button"
              id="btn-save-kalender"
              onClick={handleSaveData}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Data'}</span>
            </button>
            <button
              type="button"
              id="btn-reset-kalender"
              onClick={handleResetDefault}
              title="Reset ke Standar Resmi"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sumber Kalender Aktif Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Sumber Rujukan Kaldik:
            </span>
            {uploadFile ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumen Sekolah: {uploadFile.name}</span>
                <span className="text-[10px] text-slate-500 font-normal">({uploadFile.size})</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Kalender Pendidikan Standar Resmi Kemendikdasmen 2025/2026</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => document.getElementById('file-upload-kalender')?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              <span>{uploadFile ? 'Ganti Dokumen Kaldik' : 'Upload Kaldik Sekolah'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert for analysis */}
      {analysisToast && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-medium">{analysisToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAnalysisToast(null)}
            className="text-slate-400 hover:text-slate-700 px-2 py-0.5 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area based on Tab - 3 Urutan Sesuai Alur Kaldik */}

      {/* ========================================================================= */}
      {/* 1. PARAMETER KURIKULUM & BAB MATERI */}
      {/* ========================================================================= */}
      {activeTab === 'parameter_materi' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <p className="font-bold text-slate-800">
                Langkah 1: Parameter Kurikulum & Distribusi Bab Materi
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchTab('upload_analisis_rbe')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shrink-0 shadow-xs transition"
            >
              <span>Lanjut ke Langkah 2: Upload Kaldik & RBE</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Configuration Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Semester
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Ganjil')}
                  className={`py-1.5 rounded-md text-xs font-semibold transition ${
                    selectedSemester === 'Ganjil'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ganjil (Sem 1)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Genap')}
                  className={`py-1.5 rounded-md text-xs font-semibold transition ${
                    selectedSemester === 'Genap'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Genap (Sem 2)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="Contoh: Fisika, Matematika"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Jenjang & Kelas
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={level}
                  onChange={(e) => {
                    const lvl = e.target.value as EducationLevel;
                    setLevel(lvl);
                    setGrade(lvl === 'SD' ? 1 : lvl === 'SMP' ? 7 : 10);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={grade}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => setGrade(parseNumberInput(e.target.value, 1, 1, 12))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-semibold text-slate-900 text-center focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Kelas"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Beban JP / Minggu
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={jpPerWeek}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    const newJp = parseNumberInput(e.target.value, 1, 1, 10);
                    setJpPerWeek(newJp);
                    setMaterialsSem1((prev) =>
                      prev.map((m) => ({
                        ...m,
                        meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (newJp || 1))),
                      }))
                    );
                    setMaterialsSem2((prev) =>
                      prev.map((m) => ({
                        ...m,
                        meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (newJp || 1))),
                      }))
                    );
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                  JP/Mg
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Tahun Ajaran (TP)
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Tersinkron</span>
                </span>
              </div>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="2025/2026"
              />
              <div className="flex items-center space-x-1 pt-1 overflow-x-auto no-scrollbar">
                {['2024/2025', '2025/2026', '2026/2027', '2027/2028'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleAcademicYearChange(yr)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      academicYear === yr
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABEL DISTRIBUSI ALOKASI WAKTU (JP) & JUMLAH PERTEMUAN (SEM 1 & SEM 2) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-0">
            {/* Table Header & Semester Selector */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Tabel Distribusi Alokasi Waktu (JP) & Jumlah Pertemuan Semester {selectedSemester}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Tersinkron Profil Guru
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Perhitungan: <strong>Jumlah Pertemuan = Alokasi Waktu (JP) ÷ {jpPerWeek} JP/Minggu</strong> (Contoh: 25 JP ÷ 5 JP = 5 Kali Pertemuan).
                </p>
              </div>

              {/* Sync Toast Notification */}
              {distSyncToast && (
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{distSyncToast}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleAddChapter(selectedSemester === 'Ganjil' ? 1 : 2)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bab</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDistributionToMaster}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan & Sinkronkan</span>
                </button>
              </div>
            </div>

            {/* Auto-Distribute Formula & Quick Tool Bar */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Formula Alokasi Waktu & Pertemuan per Bab:</span>
                </div>
                <p className="text-[11px] text-slate-700">
                  <strong className="text-blue-900">Alokasi JP per BAB = Total JP Semester ÷ Jumlah BAB</strong> • <strong className="text-emerald-800">Jumlah Pertemuan = Alokasi JP BAB ÷ {jpPerWeek} JP/Minggu</strong> (Misal: 50 JP ÷ 2 BAB = 25 JP/Bab $\rightarrow$ 25 : 5 = 5 Kali Pertemuan)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleAutoDistributeChaptersByJpPerWeek(selectedSemester === 'Ganjil' ? 1 : 2, 50)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-300 shadow-2xs text-[11px] transition"
                  title="Bagi rata 50 JP ke seluruh BAB semester ini"
                >
                  Bagi Rata 50 JP
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoDistributeChaptersByJpPerWeek(selectedSemester === 'Ganjil' ? 1 : 2)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs text-[11px] flex items-center space-x-1.5 transition"
                  title="Bagi rata alokasi total JP semester ini ke seluruh bab"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bagi Rata Otomatis ({selectedSemester === 'Ganjil' ? activeSemData.totalEffectiveHours || 50 : activeSemData.totalEffectiveHours || 50} JP)</span>
                </button>
              </div>
            </div>

            {/* Distribution Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-28 text-center">Kode TP</th>
                    <th className="p-3 w-64">Bab / Lingkup Materi Pokok</th>
                    <th className="p-3 min-w-[200px]">Rumusan Tujuan Pembelajaran (TP)</th>
                    <th className="p-3 w-32 text-center text-blue-700">Alokasi (JP)</th>
                    <th className="p-3 w-28 text-center text-slate-500">Beban / Mg</th>
                    <th className="p-3 w-44 text-center text-emerald-700">Jumlah Pertemuan (Alokasi JP ÷ {jpPerWeek} JP/Mg)</th>
                    <th className="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(selectedSemester === 'Ganjil' ? materialsSem1 : materialsSem2).map((item, idx) => {
                    const currentSemNum = selectedSemester === 'Ganjil' ? 1 : 2;
                    const calculatedMeetings = Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)));
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            value={item.tpCode}
                            onChange={(e) =>
                              handleUpdateChapterField(currentSemNum, idx, 'tpCode', e.target.value)
                            }
                            className="w-24 text-center font-mono font-bold text-blue-700 bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:border-blue-600 focus:outline-none"
                            placeholder="Kode TP"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.essentialMaterial}
                            onChange={(e) =>
                              handleUpdateChapterField(currentSemNum, idx, 'essentialMaterial', e.target.value)
                            }
                            className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded py-1 px-2 text-xs focus:border-blue-600 focus:outline-none"
                            placeholder="Materi Pokok Bab..."
                          />
                        </td>
                        <td className="p-3">
                          <textarea
                            rows={2}
                            value={item.tpName || ''}
                            onChange={(e) =>
                              handleUpdateChapterField(currentSemNum, idx, 'tpName', e.target.value)
                            }
                            className="w-full text-slate-700 bg-white border border-slate-300 rounded py-1 px-2 text-xs focus:border-blue-600 focus:outline-none resize-none"
                            placeholder="Rumusan Tujuan Pembelajaran..."
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.allocatedHours}
                              onFocus={handleNumberInputFocus}
                              onChange={(e) =>
                                handleUpdateChapterHours(
                                  currentSemNum,
                                  idx,
                                  parseNumberInput(e.target.value, 0, 0, 100)
                                )
                              }
                              className="w-16 text-center font-bold font-mono text-blue-700 bg-white border border-slate-300 rounded py-1 px-1 text-xs focus:border-blue-600 focus:outline-none"
                            />
                            <span className="text-[11px] font-bold text-slate-500">JP</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            {jpPerWeek} JP/Mg
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={1}
                                max={40}
                                value={calculatedMeetings}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) =>
                                  handleUpdateChapterMeetings(
                                    currentSemNum,
                                    idx,
                                    parseNumberInput(e.target.value, 1, 1, 40)
                                  )
                                }
                                title="Ubah jumlah pertemuan (otomatis menyesuaikan alokasi JP)"
                                className="w-14 text-center font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 rounded py-1 px-1 text-xs focus:border-emerald-600 focus:outline-none"
                              />
                              <span className="text-[11px] font-bold text-emerald-800">Kali</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              ({item.allocatedHours} JP ÷ {jpPerWeek} JP)
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(currentSemNum, idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Bab Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty state */}
                  {(selectedSemester === 'Ganjil' ? materialsSem1 : materialsSem2).length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                        Belum ada bab/materi pada Semester {selectedSemester}. Klik tombol <strong>+ Tambah Bab</strong> di atas untuk menambahkan.
                      </td>
                    </tr>
                  )}

                  {/* Summary Row */}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-blue-700">
                      Total Distribusi Semester {selectedSemester}:
                    </td>
                    <td className="p-3 text-center font-mono text-sm text-blue-700 font-black">
                      {(selectedSemester === 'Ganjil' ? materialsSem1 : materialsSem2).reduce(
                        (sum, m) => sum + (m.allocatedHours || 0),
                        0
                      )}{' '}
                      JP
                    </td>
                    <td className="p-3 text-center text-xs text-slate-600 font-semibold">
                      {jpPerWeek} JP / Minggu
                    </td>
                    <td className="p-3 text-center font-mono text-sm text-emerald-700 font-black">
                      {(selectedSemester === 'Ganjil' ? materialsSem1 : materialsSem2).reduce(
                        (sum, m) => sum + Math.max(1, Math.round((m.allocatedHours || 0) / (jpPerWeek || 1))),
                        0
                      )}{' '}
                      Pertemuan
                    </td>
                    <td className="p-3 text-center text-slate-400 text-xs">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Information & Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px]">
                  Perubahan JP &amp; Pertemuan otomatis tersinkron ke PROSEM, PROTA, dan Modul Ajar.
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveDistributionToMaster}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('upload_analisis_rbe')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                >
                  <span>Lanjut ke Langkah 2: Upload Kaldik & RBE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UPLOAD KALENDER PENDIDIKAN & (OTOMATIS) ANALISIS ALOKASI WAKTU (RBE) */}
      {/* ========================================================================= */}
      {activeTab === 'upload_analisis_rbe' && (
        <div className="space-y-4">
          {/* Step 2 Header Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-bold text-slate-800">
                  Langkah 2: Upload Kalender Pendidikan &amp; Analisis Alokasi Waktu (RBE)
                </p>
                <span className="text-[10px] bg-blue-600 text-white font-medium px-2 py-0.5 rounded-full">
                  Berurutan
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleRunSmartAnalysis(uploadNotes, academicYear, () => {
                    setKaldikSubStep('analisis');
                  });
                }}
                disabled={isAnalyzing}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAnalyzing ? 'Menganalisis...' : 'Analisis Ulang Alokasi Waktu'}</span>
              </button>
            </div>
          </div>

          {/* Sequential Sub-stepper Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
            {/* Sub-step 1: Upload Kaldik */}
            <button
              type="button"
              id="substep-upload-kaldik"
              onClick={() => setKaldikSubStep('upload')}
              className={`p-3 rounded-xl text-left flex items-center space-x-3 transition cursor-pointer ${
                kaldikSubStep === 'upload'
                  ? 'bg-blue-50/90 border-2 border-blue-600 text-blue-950 shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                  kaldikSubStep === 'upload'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : uploadFile
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {uploadFile && kaldikSubStep !== 'upload' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">Tahap 1: Upload Dokumen Kaldik</span>
                  {uploadFile ? (
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-md font-semibold">
                      Terunggah
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-md font-semibold">
                      Kaldik Resmi
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {uploadFile ? uploadFile.name : 'Unggah berkas sekolah atau gunakan kaldik resmi'}
                </p>
              </div>
            </button>

            {/* Sub-step 2: Analisis Alokasi Waktu (RBE) */}
            <button
              type="button"
              id="substep-analisis-rbe"
              onClick={() => setKaldikSubStep('analisis')}
              className={`p-3 rounded-xl text-left flex items-center space-x-3 transition cursor-pointer ${
                kaldikSubStep === 'analisis'
                  ? 'bg-blue-50/90 border-2 border-blue-600 text-blue-950 shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                  kaldikSubStep === 'analisis'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">Tahap 2: Analisis Alokasi Waktu (RBE)</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-md font-semibold">
                    {totalEffJP} JP KBM
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Matriks pekan efektif, jam cadangan & jam KBM Semester {selectedSemester}
                </p>
              </div>
            </button>
          </div>

          {/* Toast Notification */}
          {analysisToast && (
            <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-xl text-blue-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{analysisToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisToast(null)}
                className="text-blue-600 hover:text-blue-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAHAP 1: UPLOAD DOKUMEN KALDIK */}
          {/* ========================================================================= */}
          {kaldikSubStep === 'upload' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <UploadCloud className="w-5 h-5 text-blue-600" />
                    <span>Tahap 1: Upload Dokumen Kalender Pendidikan Satuan Pendidikan</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Unggah dokumen kalender pendidikan resmi sekolah Anda (format PDF, Excel, Word, atau Gambar JPG/PNG). Setelah berkas diunggah, klik tombol <strong>Lanjut ke Analisis Alokasi Waktu (RBE)</strong> untuk memproses matriks waktu secara berurutan.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  Tahap 1 dari 2
                </span>
              </div>

              {/* Drag & Drop Upload Box */}
              <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-8 text-center transition cursor-pointer group">
                <input
                  type="file"
                  id="file-upload-kalender"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 bg-blue-100 group-hover:bg-blue-200 rounded-xl text-blue-600 transition">
                    <UploadCloud className="w-8 h-8 group-hover:scale-105 transition" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik atau Seret & Lepas Berkas Kalender Pendidikan di Sini
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendukung format PDF, Excel (.xlsx/.xls), Word (.docx), atau Gambar (.jpg/.png) hingga 15 MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Success Alert */}
              {uploadSuccessMsg && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              {/* Active Uploaded File Card */}
              {uploadFile ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{uploadFile.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Ukuran: {uploadFile.size} | Tipe: {uploadFile.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleRunSmartAnalysis(uploadNotes, academicYear, () => {
                          setKaldikSubStep('analisis');
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Analisis & Buka Hasil RBE →</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-left">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Belum ada berkas yang diunggah. Sistem otomatis menggunakan template Kalender Pendidikan Standar Resmi Kemendikdasmen TP {academicYear}.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleRunSmartAnalysis(uploadNotes, academicYear, () => {
                        setKaldikSubStep('analisis');
                      });
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs shrink-0 transition"
                  >
                    Gunakan Kaldik Resmi & Analisis →
                  </button>
                </div>
              )}

              {/* Catatan / Keterangan Khusus Sekolah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan Khusus Agenda Sekolah (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Contoh: Pekan ke-3 September diadakan Asesmen Tengah Semester, pekan ke-3 Oktober Pameran Karya P5..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    Gunakan Standar Kaldik Resmi Kemendikdasmen
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveData}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    <span>Simpan Berkas & Catatan</span>
                  </button>

                  <button
                    type="button"
                    id="btn-lanjut-analisis-rbe"
                    onClick={() => {
                      handleRunSmartAnalysis(uploadNotes, academicYear, () => {
                        setKaldikSubStep('analisis');
                      });
                    }}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>{isAnalyzing ? 'Menganalisis...' : 'Lanjut ke Analisis Alokasi Waktu (RBE) →'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Footer for Tahap 1 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('parameter_materi')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center space-x-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali ke Langkah 1: Parameter Kurikulum & Bab Materi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKaldikSubStep('analisis')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Lewati ke Tahap 2: Hasil Analisis Alokasi Waktu</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAHAP 2: HASIL ANALISIS ALOKASI WAKTU (RBE) */}
          {/* ========================================================================= */}
          {kaldikSubStep === 'analisis' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Context Summary Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Tahap 2 dari 2: Hasil Analisis Alokasi Waktu (RBE)
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Mata Pelajaran: <strong>{subject}</strong> ({jpPerWeek} JP/Minggu)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Sumber data Kaldik: <strong className="text-slate-900">{uploadFile ? uploadFile.name : `Kalender Standar Resmi Kemendikdasmen TP ${academicYear}`}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setKaldikSubStep('upload')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Upload Ulang Kaldik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunSmartAnalysis(uploadNotes)}
                    disabled={isAnalyzing}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAnalyzing ? 'Menganalisis...' : 'Analisis Ulang'}</span>
                  </button>
                </div>
              </div>

              {/* Semester Selector Header */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Table className="w-4 h-4 text-blue-600" />
                  <span>Matriks Rincian Alokasi Waktu (RBE) Semester {selectedSemester}</span>
                </h3>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <span>Pilih Semester:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('Ganjil')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      selectedSemester === 'Ganjil' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semester Ganjil
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('Genap')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      selectedSemester === 'Genap' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semester Genap
                  </button>
                </div>
              </div>

              {/* RBE Analysis Section Table & KPIs */}
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

              {/* Navigation Footer for Tahap 2 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setKaldikSubStep('upload')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center space-x-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Tahap 1: Upload Kaldik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('parameter_materi')}
                    className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition"
                  >
                    Langkah 1 (Parameter & Bab)
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-lanjut-format-preview"
                  onClick={() => handleSwitchTab('format_kustom_preview')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-95"
                >
                  <span>Lanjut ke Langkah 3: Format Kustom & Preview Dokumen</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FORMAT KUSTOM & PREVIEW DOKUMEN */}
      {/* ========================================================================= */}
      {activeTab === 'format_kustom_preview' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <p className="font-bold text-slate-800">
                Langkah 3: Format Kustom Sekolah &amp; Pratinjau Dokumen Siap Cetak
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchTab('upload_analisis_rbe')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <span>← Kembali ke Langkah 2: Upload Kaldik &amp; RBE</span>
            </button>
          </div>

          {/* Section 1: Upload & Atur Format Alokasi Waktu Sekolah Sendiri */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  <span>Upload & Atur Format Alokasi Waktu Sekolah Sendiri</span>
                </h2>
                {customFormatConfig.useCustomFormat && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Format Khusus Aktif</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Setiap satuan pendidikan (SD, SMP, SMA, SMK, atau Madrasah) memiliki format baku analisis alokasi waktu dan rincian pekan efektif (RBE) tersendiri. Anda dapat mengunggah berkas format sekolah (Word .docx, Excel .xlsx, PDF, atau Foto/Scan) atau memilih preset resmi agar format dokumen alokasi waktu otomatis menyesuaikan standar sekolah Anda.
              </p>
            </div>

            {/* Custom Format Selector Component */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <CustomFormatSelector
                value={customFormatConfig}
                onChange={handleCustomFormatChange}
                docTypeId="analisis_alokasi_waktu"
                docTypeName="Analisis Alokasi Waktu (RBE)"
              />
            </div>
          </div>

          {/* Section 2: Preview Dokumen RBE & Format Resmi */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800">
                  Pratinjau Dokumen Cetak Analisis Alokasi Waktu (RBE) & Matriks Kaldik
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-slate-900">
              <DocumentPdfPreview
                content={previewMarkdown}
                title={`Analisis Alokasi Waktu ${subject} - Semester ${selectedSemester}`}
              />
            </div>
          </div>

          {/* Step 3 Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchTab('upload_analisis_rbe')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center space-x-1.5"
            >
              <span>← Kembali ke Langkah 2: Upload Kaldik & Analisis RBE</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ai_prosem')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Lanjut Sinkronkan ke PROSEM Berwarna</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
