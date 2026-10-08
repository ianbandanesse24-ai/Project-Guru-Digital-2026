import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  Save,
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Table,
  UploadCloud,
  FileText,
  CalendarDays,
  Zap,
  X,
  RotateCcw,
  Calculator,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import {
  SchoolLevel,
  EducationLevel,
  CPMaterialItem,
  ActiveMasterCPData,
  CPDistributionPlan,
} from '../types';
import { StorageService, addStorageListener } from '../lib/storage';
import { parseTPList, generateAutoTPForMaterial, getDefaultTPText } from '../lib/curriculumData';
import { getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';
import { KalenderPendidikanView } from './KalenderPendidikanView';
import { CurriculumResetModal } from '../components/CurriculumResetModal';

const POPULAR_SUBJECTS = [
  'Fisika',
  'Matematika',
  'Kimia',
  'Biologi',
  'Informatika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'Pendidikan Jasmani & Kesehatan (PJOK)',
  'Seni Budaya',
  'Prakarya & Kewirausahaan',
  'Pendidikan Agama & Budi Pekerti',
  'IPAS (SD/SMP)',
];

export type ParameterKurikulumTab =
  | 'parameter_materi'
  | 'upload_analisis_rbe'
  | 'format_kustom_preview';

export interface ParameterKurikulumViewProps {
  initialTab?:
    | 'parameter'
    | 'parameter_materi'
    | 'upload_analisis_rbe'
    | 'format_kustom_preview'
    | 'kaldik'
    | 'kaldik_upload'
    | 'custom_format';
  onNavigate?: (view: string) => void;
}

const resolveMainTab = (
  tab?: ParameterKurikulumViewProps['initialTab']
): ParameterKurikulumTab => {
  if (tab === 'custom_format' || tab === 'format_kustom_preview') {
    return 'format_kustom_preview';
  }
  if (
    tab === 'upload_analisis_rbe' ||
    tab === 'kaldik' ||
    tab === 'kaldik_upload'
  ) {
    return 'upload_analisis_rbe';
  }
  return 'parameter_materi';
};

export const ParameterKurikulumView: React.FC<ParameterKurikulumViewProps> = ({
  initialTab = 'parameter_materi',
  onNavigate,
}) => {
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const masterCP = StorageService.getActiveMasterCP();
  const schoolProfile = StorageService.getSchoolProfile();

  // Integrated Top-level tab state - strictly 3 steps
  const [mainSection, setMainSection] = useState<ParameterKurikulumTab>(() =>
    resolveMainTab(initialTab)
  );

  useEffect(() => {
    if (initialTab) {
      setMainSection(resolveMainTab(initialTab));
    }
  }, [initialTab]);

  // Core state
  const [subject, setSubject] = useState<string>(masterCP?.subject || 'Fisika');
  const [level, setLevel] = useState<SchoolLevel>((masterCP?.level as SchoolLevel) || 'SMA');
  const [grade, setGrade] = useState<number>(Number(masterCP?.grade) || 10);
  const [phase, setPhase] = useState<string>(masterCP?.phase || 'Fase E');
  const [jpPerWeek, setJpPerWeek] = useState<number>(masterCP?.jpPerWeek || 3);
  const [timeAllocationPerWeek, setTimeAllocationPerWeek] = useState<string>(
    masterCP?.timeAllocationPerWeek || '2 x 45 Menit'
  );
  const [curriculumApproach] = useState<string>(
    'Deep Learning (Mindful, Meaningful, Joyful)'
  );

  // Materials state (Semester 1 & Semester 2)
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem1 && masterCP.materialsSem1.length > 0) {
      return masterCP.materialsSem1;
    }
    const preset = getSubjectPresetByGrade(
      masterCP?.subject || 'Fisika',
      (masterCP?.level as EducationLevel) || 'SMA',
      Number(masterCP?.grade) || 10
    );
    return (preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` }));
  });

  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>(() => {
    if (masterCP?.materialsSem2 && masterCP.materialsSem2.length > 0) {
      return masterCP.materialsSem2;
    }
    const preset = getSubjectPresetByGrade(
      masterCP?.subject || 'Fisika',
      (masterCP?.level as EducationLevel) || 'SMA',
      Number(masterCP?.grade) || 10
    );
    return (preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` }));
  });

  // UI tabs & states
  const [activeSemTab, setActiveSemTab] = useState<'sem1' | 'sem2' | 'both'>('sem1');
  const [viewCombinedText, setViewCombinedText] = useState<{ [key: string]: boolean }>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Modal for adding chapter with automatic TP generation according to taught material
  const [addChapterModalSem, setAddChapterModalSem] = useState<1 | 2 | null>(null);
  const [modalMaterialInput, setModalMaterialInput] = useState('');
  const [modalTPCount, setModalTPCount] = useState(2);
  const [modalAllocatedHours, setModalAllocatedHours] = useState(12);

  // Available grades based on education level
  const availableGrades = useMemo(() => {
    if (level === 'SD') return [1, 2, 3, 4, 5, 6];
    if (level === 'SMP') return [7, 8, 9];
    if (level === 'SMA') return [10, 11, 12];
    if (level === 'SMK') return [10, 11, 12];
    return [10, 11, 12];
  }, [level]);

  // Sync with storage and synchronization broadcast changes
  useEffect(() => {
    const handleRefresh = (customDetail?: any) => {
      const updated = customDetail?.detail || StorageService.getActiveMasterCP();
      if (updated) {
        if (updated.subject) setSubject(updated.subject);
        if (updated.level) setLevel((updated.level as SchoolLevel));
        if (updated.grade) setGrade(Number(updated.grade));
        if (updated.phase) setPhase(updated.phase);
        if (updated.jpPerWeek) setJpPerWeek(Number(updated.jpPerWeek));
        if (updated.timeAllocationPerWeek) setTimeAllocationPerWeek(updated.timeAllocationPerWeek);
        setMaterialsSem1(updated.materialsSem1 || []);
        setMaterialsSem2(updated.materialsSem2 || []);
      }
    };

    const unsub = addStorageListener(() => handleRefresh());
    const onSync = (e: any) => handleRefresh(e);
    const onMaster = (e: any) => handleRefresh(e);
    const onProf = (e: any) => handleRefresh(e);

    window.addEventListener('curriculum-parameters-synced', onSync);
    window.addEventListener('master-cp-updated', onMaster);
    window.addEventListener('school-profile-updated', onProf);

    return () => {
      unsub();
      window.removeEventListener('curriculum-parameters-synced', onSync);
      window.removeEventListener('master-cp-updated', onMaster);
      window.removeEventListener('school-profile-updated', onProf);
    };
  }, []);

  // Level change handler
  const handleLevelChange = (newLevel: SchoolLevel) => {
    setLevel(newLevel);
    let newGrade = 10;
    let newPhase = 'Fase E';
    if (newLevel === 'SD') {
      newGrade = 1;
      newPhase = 'Fase A';
    } else if (newLevel === 'SMP') {
      newGrade = 7;
      newPhase = 'Fase D';
    } else if (newLevel === 'SMA' || newLevel === 'SMK') {
      newGrade = 10;
      newPhase = 'Fase E';
    }
    setGrade(newGrade);
    setPhase(newPhase);

    // Apply preset
    const preset = getSubjectPresetByGrade(subject, newLevel as EducationLevel, newGrade);
    setMaterialsSem1((preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` })));
    setMaterialsSem2((preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` })));
  };

  // Grade change handler
  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    let newPhase = phase;
    if (level === 'SD') {
      if (newGrade <= 2) newPhase = 'Fase A';
      else if (newGrade <= 4) newPhase = 'Fase B';
      else newPhase = 'Fase C';
    } else if (level === 'SMP') {
      newPhase = 'Fase D';
    } else if (level === 'SMA' || level === 'SMK') {
      if (newGrade === 10) newPhase = 'Fase E';
      else newPhase = 'Fase F';
    }
    setPhase(newPhase);

    const preset = getSubjectPresetByGrade(subject, level as EducationLevel, newGrade);
    setMaterialsSem1((preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` })));
    setMaterialsSem2((preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` })));
  };

  // Subject change handler
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    const preset = getSubjectPresetByGrade(newSubject, level as EducationLevel, grade);
    setMaterialsSem1((preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` })));
    setMaterialsSem2((preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` })));
  };

  // Chapter management handlers with automatic TP generation according to taught material
  const openAddChapterModal = (sem: 1 | 2) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const nextIdx = list.length + 1;
    const preset = getSubjectPresetByGrade(subject, level as EducationLevel, grade);
    const presetList = sem === 1 ? preset.materialsSem1 : preset.materialsSem2;
    const presetItem = presetList[list.length];

    const suggested =
      presetItem?.essentialMaterial ||
      `Bab ${nextIdx}: Kajian Materi Pokok ${subject}`;

    setAddChapterModalSem(sem);
    setModalMaterialInput(suggested);
    setModalTPCount(presetItem?.tpCount || 2);
    setModalAllocatedHours(presetItem?.allocatedHours || jpPerWeek * 4);
  };

  // Helper to persist and broadcast changes immediately to Distribusi Alokasi Waktu, PROSEM, & seluruh perangkat ajar
  const persistAndSyncParameters = (
    nextSem1: CPMaterialItem[],
    nextSem2: CPMaterialItem[],
    nextJpPerWeek: number = jpPerWeek,
    customToastMessage?: string
  ) => {
    const currentMaster = StorageService.getActiveMasterCP();
    const syncMaterialsSem1 = nextSem1.map((m) => ({
      ...m,
      meetingCount: Math.max(1, Math.round((Number(m.allocatedHours) || 0) / (nextJpPerWeek || 1))),
    }));
    const syncMaterialsSem2 = nextSem2.map((m) => ({
      ...m,
      meetingCount: Math.max(1, Math.round((Number(m.allocatedHours) || 0) / (nextJpPerWeek || 1))),
    }));

    const totSem1 = syncMaterialsSem1.reduce((sum, m) => sum + (m.allocatedHours || 0), 0);
    const totSem2 = syncMaterialsSem2.reduce((sum, m) => sum + (m.allocatedHours || 0), 0);

    const updatedMaster: ActiveMasterCPData = {
      id: currentMaster?.id || `master-cp-${Date.now()}`,
      fileName: currentMaster?.fileName || `${subject}_Kelas_${grade}_${level}.pdf`,
      uploadedAt: currentMaster?.uploadedAt || new Date().toISOString(),
      teacherName: currentMaster?.teacherName || schoolProfile.teacherName || 'Guru Pengampu',
      teacherNip: currentMaster?.teacherNip || schoolProfile.teacherNip || '-',
      principalName: currentMaster?.principalName || schoolProfile.principalName || '-',
      principalNip: currentMaster?.principalNip || schoolProfile.principalNip || '-',
      schoolName: currentMaster?.schoolName || schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH',
      academicYear: currentMaster?.academicYear || schoolProfile.academicYear || '2025/2026',
      city: currentMaster?.city || schoolProfile.city || 'Maluku Tengah',
      subject,
      level,
      grade,
      phase,
      jpPerWeek: nextJpPerWeek,
      timeAllocationPerWeek,
      materialsSem1: syncMaterialsSem1,
      materialsSem2: syncMaterialsSem2,
      totalHoursPerYear: totSem1 + totSem2,
      cpText: currentMaster?.cpText || '',
      elements: currentMaster?.elements || [],
    };

    StorageService.setActiveMasterCP(updatedMaster);
    if (customToastMessage) {
      setSaveToast(customToastMessage);
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  // Debounced auto-save: every manual edit (JP, meeting count, material text) automatically persists and syncs to PROSEM and all tools
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      persistAndSyncParameters(materialsSem1, materialsSem2, jpPerWeek);
    }, 350);
    return () => clearTimeout(timer);
  }, [materialsSem1, materialsSem2, jpPerWeek, subject, grade, level, phase]);

  const handleConfirmAddChapterModal = () => {
    if (!addChapterModalSem) return;
    const sem = addChapterModalSem;
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const nextIdx = list.length + 1;
    const targetHours = Number(modalAllocatedHours) > 0 ? Number(modalAllocatedHours) : jpPerWeek * 4;
    const targetTPCount = Math.max(1, Number(modalTPCount) || 2);

    const materialName =
      modalMaterialInput.trim() ||
      `Bab ${nextIdx}: Materi Pokok ${subject}`;

    const autoTPName = generateAutoTPForMaterial(
      materialName,
      subject,
      grade,
      targetTPCount
    );

    const newChapter: CPMaterialItem = {
      id: `mat-${sem}-${Date.now()}`,
      semester: sem,
      orderNumber: nextIdx,
      tpCode: `TP.${grade}.${sem === 1 ? '1' : '2'}.${nextIdx}`,
      tpName: autoTPName,
      essentialMaterial: materialName,
      allocatedHours: targetHours,
      meetingCount: Math.max(1, Math.round(targetHours / (jpPerWeek || 1))),
      tpCount: targetTPCount,
      assessmentStrategy: 'Tes Formatif, Penilaian Kinerja & Portofolio Kognitif',
      deepLearningMethod: 'Mindful & Meaningful Learning',
    };

    const nextSem1 = sem === 1 ? [...materialsSem1, newChapter] : materialsSem1;
    const nextSem2 = sem === 2 ? [...materialsSem2, newChapter] : materialsSem2;

    if (sem === 1) {
      setMaterialsSem1(nextSem1);
    } else {
      setMaterialsSem2(nextSem2);
    }

    setAddChapterModalSem(null);
    persistAndSyncParameters(
      nextSem1,
      nextSem2,
      jpPerWeek,
      `Bab "${materialName}" berhasil ditambahkan & otomatis tersinkron ke Menu Distribusi Alokasi Waktu, PROSEM, PROTA, ATP & Modul Ajar!`
    );
  };

  const handleDirectAddChapter = (sem: 1 | 2) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const nextIdx = list.length + 1;
    const defaultHours = jpPerWeek * 4;

    const preset = getSubjectPresetByGrade(subject, level as EducationLevel, grade);
    const presetList = sem === 1 ? preset.materialsSem1 : preset.materialsSem2;
    const presetItem = presetList[list.length];

    const materialName =
      presetItem?.essentialMaterial ||
      `Bab ${nextIdx}: Materi Pokok & Kajian Terapan ${subject}`;
    const autoTPName =
      presetItem?.tpName ||
      generateAutoTPForMaterial(materialName, subject, grade, 2);

    const newChapter: CPMaterialItem = {
      id: `mat-${sem}-${Date.now()}`,
      semester: sem,
      orderNumber: nextIdx,
      tpCode: presetItem?.tpCode || `TP.${grade}.${sem === 1 ? '1' : '2'}.${nextIdx}`,
      tpName: autoTPName,
      essentialMaterial: materialName,
      allocatedHours: presetItem?.allocatedHours || defaultHours,
      meetingCount: presetItem?.meetingCount || 4,
      tpCount: presetItem?.tpCount || 2,
      assessmentStrategy: presetItem?.assessmentStrategy || 'Tes Formatif, Kinerja & Portofolio Kognitif',
      deepLearningMethod: presetItem?.deepLearningMethod || 'Mindful & Meaningful Learning',
    };

    const nextSem1 = sem === 1 ? [...materialsSem1, newChapter] : materialsSem1;
    const nextSem2 = sem === 2 ? [...materialsSem2, newChapter] : materialsSem2;

    if (sem === 1) {
      setMaterialsSem1(nextSem1);
    } else {
      setMaterialsSem2(nextSem2);
    }

    persistAndSyncParameters(
      nextSem1,
      nextSem2,
      jpPerWeek,
      `Bab ${nextIdx} ("${materialName}") berhasil ditambahkan & otomatis tersinkron ke Distribusi Alokasi Waktu, PROSEM & Perangkat Ajar!`
    );
  };

  // Auto-distribute total semester hours across BABs where every BAB's JP MUST be a multiple of jpPerWeek!
  const handleAutoDistributeSemesterHours = (sem: 1 | 2, customTargetHours?: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    if (list.length === 0) return;
    const numBab = list.length;
    const kaldik = StorageService.getKalenderPendidikan();
    const semData = sem === 1 ? kaldik.semester1 : kaldik.semester2;
    
    // Effective weekly JP (ensure integer >= 1)
    const weekJP = Math.max(1, Math.round(Number(jpPerWeek)) || 3);
    
    // Determine target total semester JP (default e.g. 90 JP or from RBE)
    const currentSemTotal = sem === 1 ? totalJPSem1 : totalJPSem2;
    const rbeTotal = semData?.totalEffectiveWeeks ? semData.totalEffectiveWeeks * weekJP : 90;
    const defaultTotal = currentSemTotal > 0 ? currentSemTotal : rbeTotal;
    
    const rawTargetHours = customTargetHours !== undefined && customTargetHours > 0 ? customTargetHours : defaultTotal;
    
    // Total meetings available in the semester
    const totalMeetings = Math.max(numBab, Math.round(rawTargetHours / weekJP));
    const effectiveTotalJP = totalMeetings * weekJP;

    // Distribute meetings evenly across chapters
    const baseMeetingsPerBab = Math.floor(totalMeetings / numBab);
    const remainderMeetings = totalMeetings % numBab;

    const distributed: CPMaterialItem[] = list.map((item, idx) => {
      // Number of meetings for this chapter
      const meetings = Math.max(1, baseMeetingsPerBab + (idx < remainderMeetings ? 1 : 0));
      // Allocated JP is GUARANTEED to be an exact multiple of jpPerWeek!
      const allocatedHours = meetings * weekJP;
      return {
        ...item,
        allocatedHours,
        meetingCount: meetings,
      };
    });

    if (sem === 1) {
      setMaterialsSem1(distributed);
      persistAndSyncParameters(
        distributed,
        materialsSem2,
        weekJP,
        `✅ Berhasil membagi ${effectiveTotalJP} JP ke ${numBab} BAB (Beban: ${weekJP} JP/Minggu) & disinkronkan ke Menu Distribusi Alokasi Waktu, PROSEM, PROTA & Modul Ajar!`
      );
    } else {
      setMaterialsSem2(distributed);
      persistAndSyncParameters(
        materialsSem1,
        distributed,
        weekJP,
        `✅ Berhasil membagi ${effectiveTotalJP} JP ke ${numBab} BAB (Beban: ${weekJP} JP/Minggu) & disinkronkan ke Menu Distribusi Alokasi Waktu, PROSEM, PROTA & Modul Ajar!`
      );
    }
  };

  const handleAutoGenerateTPForChapter = (sem: 1 | 2, chapterIdx: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const chapter = list[chapterIdx];
    if (!chapter) return;
    const count = chapter.tpCount || 1;
    const generated = generateAutoTPForMaterial(chapter.essentialMaterial, subject, grade, count);
    handleDirectUpdateChapter(sem, chapterIdx, 'tpName', generated);
  };

  const handleDirectDeleteChapter = (sem: 1 | 2, index: number) => {
    const nextSem1 = sem === 1 ? materialsSem1.filter((_, idx) => idx !== index) : materialsSem1;
    const nextSem2 = sem === 2 ? materialsSem2.filter((_, idx) => idx !== index) : materialsSem2;
    if (sem === 1) {
      setMaterialsSem1(nextSem1);
    } else {
      setMaterialsSem2(nextSem2);
    }
    persistAndSyncParameters(
      nextSem1,
      nextSem2,
      jpPerWeek,
      `Bab berhasil dihapus & penyesuaian alokasi JP otomatis tersinkron ke Menu Distribusi Alokasi Waktu, PROSEM & Perangkat Ajar!`
    );
  };

  const handleDirectUpdateChapter = (
    sem: 1 | 2,
    index: number,
    field: keyof CPMaterialItem,
    value: any
  ) => {
    if (sem === 1) {
      const updated = [...materialsSem1];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'allocatedHours') {
          const hours = Number(value) || 0;
          updated[index].meetingCount = Math.max(1, Math.round(hours / (jpPerWeek || 1)));
        } else if (field === 'meetingCount') {
          const meetings = Number(value) || 1;
          updated[index].allocatedHours = meetings * (jpPerWeek || 1);
        }
        setMaterialsSem1(updated);
      }
    } else {
      const updated = [...materialsSem2];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'allocatedHours') {
          const hours = Number(value) || 0;
          updated[index].meetingCount = Math.max(1, Math.round(hours / (jpPerWeek || 1)));
        } else if (field === 'meetingCount') {
          const meetings = Number(value) || 1;
          updated[index].allocatedHours = meetings * (jpPerWeek || 1);
        }
        setMaterialsSem2(updated);
      }
    }
  };

  const handleUpdateIndividualTP = (
    sem: 1 | 2,
    chapterIdx: number,
    tpIdx: number,
    newText: string
  ) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const chapter = list[chapterIdx];
    if (!chapter) return;

    const currentTPs = parseTPList(
      chapter.tpName,
      chapter.tpCount ?? 1,
      chapter.essentialMaterial,
      subject
    );
    currentTPs[tpIdx] = newText;
    const joinedTP = currentTPs.map((t, i) => `${i + 1}. ${t}`).join('\n');
    handleDirectUpdateChapter(sem, chapterIdx, 'tpName', joinedTP);
  };

  const handleAddTPToChapter = (sem: 1 | 2, chapterIdx: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const chapter = list[chapterIdx];
    if (!chapter) return;

    const currentCount = chapter.tpCount ?? 1;
    const newCount = currentCount + 1;
    const currentTPs = parseTPList(
      chapter.tpName,
      currentCount,
      chapter.essentialMaterial,
      subject
    );
    const cleanTopic =
      chapter.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() || subject;
    currentTPs.push(getDefaultTPText(newCount, cleanTopic, subject));
    const joinedTP = currentTPs.map((t, i) => `${i + 1}. ${t}`).join('\n');

    if (sem === 1) {
      const updated = [...materialsSem1];
      updated[chapterIdx] = { ...updated[chapterIdx], tpCount: newCount, tpName: joinedTP };
      setMaterialsSem1(updated);
    } else {
      const updated = [...materialsSem2];
      updated[chapterIdx] = { ...updated[chapterIdx], tpCount: newCount, tpName: joinedTP };
      setMaterialsSem2(updated);
    }
  };

  const handleRemoveTPFromChapter = (sem: 1 | 2, chapterIdx: number, tpIdx: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    const chapter = list[chapterIdx];
    if (!chapter) return;

    const currentCount = chapter.tpCount ?? 1;
    if (currentCount <= 1) return;

    const currentTPs = parseTPList(
      chapter.tpName,
      currentCount,
      chapter.essentialMaterial,
      subject
    );
    currentTPs.splice(tpIdx, 1);
    const joinedTP = currentTPs.map((t, i) => `${i + 1}. ${t}`).join('\n');

    if (sem === 1) {
      const updated = [...materialsSem1];
      updated[chapterIdx] = { ...updated[chapterIdx], tpCount: currentCount - 1, tpName: joinedTP };
      setMaterialsSem1(updated);
    } else {
      const updated = [...materialsSem2];
      updated[chapterIdx] = { ...updated[chapterIdx], tpCount: currentCount - 1, tpName: joinedTP };
      setMaterialsSem2(updated);
    }
  };

  const toggleCombinedView = (id: string) => {
    setViewCombinedText((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculations
  const totalJPSem1 = materialsSem1.reduce((sum, m) => sum + (m.allocatedHours || 0), 0);
  const totalJPSem2 = materialsSem2.reduce((sum, m) => sum + (m.allocatedHours || 0), 0);
  const totalJPYear = totalJPSem1 + totalJPSem2;
  const totalPertemuanSem1 = materialsSem1.reduce(
    (sum, m) => sum + Math.max(1, Math.round((m.allocatedHours || 0) / (jpPerWeek || 1))),
    0
  );
  const totalPertemuanSem2 = materialsSem2.reduce(
    (sum, m) => sum + Math.max(1, Math.round((m.allocatedHours || 0) / (jpPerWeek || 1))),
    0
  );

  // Save all settings to master CP
  const handleSaveParameters = () => {
    persistAndSyncParameters(
      materialsSem1,
      materialsSem2,
      jpPerWeek,
      '✅ Parameter Kurikulum & Beban Belajar berhasil disimpan! Perubahan Alokasi Waktu/BAB, Jumlah Pertemuan, & Bab Baru otomatis tersinkron ke Menu Distribusi Alokasi Waktu, PROSEM, PROTA, ATP, & Modul Ajar (RPM).'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-bold backdrop-blur-xs">
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              <span>Konfigurasi Terpadu Kurikulum & Kalender Pendidikan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Parameter Kurikulum, Beban Belajar & Kaldik
            </h1>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Pusat pengaturan terpadu: Mata pelajaran, jenjang, fase, beban JP/minggu, alokasi waktu per pertemuan, distribusi Bab materi pokok, serta integrasi Kalender Pendidikan & RBE Alokasi Waktu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition active:scale-95"
                title="Pusat Reset Data Kurikulum & Perangkat Pembelajaran Saja (24 Jam)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Kurikulum & Perangkat (24 Jam)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveParameters}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Sinkronkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Auto-Sync Ecosystem Notice */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center space-x-2.5 text-emerald-900">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">
            ⚡ Sinkronisasi Otomatis Aktif:
          </span>
          <span className="text-slate-700">
            Setiap perubahan manual pada <strong>Alokasi Waktu (JP)/BAB</strong>, <strong>Jumlah Pertemuan</strong>, atau <strong>Penambahan BAB Baru</strong> langsung disinkronkan secara otomatis ke <strong>Menu Distribusi Alokasi Waktu</strong>, <strong>PROSEM</strong>, <strong>PROTA</strong>, <strong>ATP</strong>, dan <strong>Modul Ajar (RPM)</strong>.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-300">
            {totalJPYear} Total JP • {totalPertemuanSem1 + totalPertemuanSem2} Pertemuan
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation - Strictly 3 Steps */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-2xs">
        <button
          type="button"
          id="tab-pk-parameter-materi"
          onClick={() => setMainSection('parameter_materi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            mainSection === 'parameter_materi'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Parameter Kurikulum & Bab Materi</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            mainSection === 'parameter_materi' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {materialsSem1.length + materialsSem2.length} Bab
          </span>
        </button>

        <button
          type="button"
          id="tab-pk-upload-analisis-rbe"
          onClick={() => setMainSection('upload_analisis_rbe')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            mainSection === 'upload_analisis_rbe'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>2. Upload Kalender Pendidikan & (otomatis) analisis Alokasi Waktu (RBE)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            mainSection === 'upload_analisis_rbe' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {jpPerWeek} JP/Mgg
          </span>
        </button>

        <button
          type="button"
          id="tab-pk-format-kustom-preview"
          onClick={() => setMainSection('format_kustom_preview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            mainSection === 'format_kustom_preview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Format Kustom & Preview Dokumen</span>
        </button>
      </div>

      {/* Tab Panels */}
      {mainSection === 'upload_analisis_rbe' && (
        <KalenderPendidikanView
          initialTab="upload_analisis_rbe"
          onNavigate={onNavigate}
          onSwitchTab={(t) => setMainSection(t)}
        />
      )}

      {mainSection === 'format_kustom_preview' && (
        <KalenderPendidikanView
          initialTab="format_kustom_preview"
          onNavigate={onNavigate}
          onSwitchTab={(t) => setMainSection(t)}
        />
      )}

      {mainSection === 'parameter_materi' && (
        <>
          {/* Save Toast Notification */}
          {saveToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in shadow-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveToast}</span>
              </div>
              <button
                onClick={() => setSaveToast(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Grid: Form Left, Summary & Quick Info Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / MAIN COLUMN: PARAMETERS & CHAPTER DISTRIBUTIONS */}
        <div className="lg:col-span-8 space-y-6">
          {/* Synchronized Parameters Info Card (Managed in Profil Guru) */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Identitas Mata Pelajaran & Parameter Jenjang
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dikelola dan disinkronkan secara terpusat dari menu <strong>Profil Guru Mata Pelajaran</strong>.
                </p>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('profil_guru_mapel')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition shrink-0 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ubah di Menu Profil Guru</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Parameter Badges Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Mata Pelajaran</span>
                <span className="font-bold text-blue-700 text-sm truncate block mt-0.5" title={subject}>
                  {subject}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Jenjang & Kelas</span>
                <span className="font-bold text-slate-800 text-sm block mt-0.5">
                  {level} • Kelas {grade}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Fase Pembelajaran</span>
                <span className="font-bold text-indigo-700 text-sm block mt-0.5">
                  {phase}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Beban JP & Pertemuan</span>
                <span className="font-bold text-emerald-700 text-sm block mt-0.5">
                  {jpPerWeek} JP/Mg ({timeAllocationPerWeek})
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Rumus Hitung Otomatis: <strong>Alokasi JP per Bab = Total JP ÷ Jumlah Bab</strong> &bull; <strong>Jumlah Pertemuan = Alokasi JP ÷ {jpPerWeek} JP/Minggu</strong>
                </span>
              </div>
              <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0">
                1 Pertemuan = {jpPerWeek} JP
              </span>
            </div>
          </div>

          {/* Card: Distribusi Bab Materi Pokok & Rumusan TP (Semester 1 & 2) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Bab Materi Pokok & Rumusan TP (Semester 1 & 2)</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Kelola bab materi, rumusan TP, alokasi JP, dan hitung jumlah pertemuan secara otomatis.
                </p>
              </div>

              {/* Semester Switcher Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveSemTab('sem1')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeSemTab === 'sem1'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sem 1 ({materialsSem1.length} Bab • {totalJPSem1} JP)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSemTab('sem2')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeSemTab === 'sem2'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sem 2 ({materialsSem2.length} Bab • {totalJPSem2} JP)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSemTab('both')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeSemTab === 'both'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({materialsSem1.length + materialsSem2.length} Bab)
                </button>
              </div>
            </div>

            {/* SEMESTER 1 CHAPTERS */}
            {(activeSemTab === 'sem1' || activeSemTab === 'both') && (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold text-slate-900">Semester 1 (Ganjil)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {materialsSem1.length} Bab • {totalJPSem1} JP • {totalPertemuanSem1} Pertemuan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddChapterModal(1)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Bab Sem 1</span>
                  </button>
                </div>

                {/* Auto-Distribute Formula & Helper Bar Sem 1 */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span>Distribusi JP/Bab Berdasarkan JP/Minggu ({jpPerWeek} JP/Mg):</span>
                      </div>
                      <p className="text-[11px] text-blue-800">
                        Aturan Standar: <strong className="text-blue-950">Alokasi JP per BAB wajib kelipatan {jpPerWeek} JP/Minggu</strong> agar menghasilkan jumlah pertemuan utuh.
                        (Contoh: Total 90 JP ÷ 3 BAB = <strong className="text-emerald-800">30 JP/Bab (10 Pertemuan)</strong>).
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoDistributeSemesterHours(1)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs text-xs flex items-center space-x-1 transition cursor-pointer"
                        title="Bagi rata total JP Semester 1 ke seluruh BAB secara proporsional kelipatan JP/Minggu"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Bagi Rata Otomatis ({totalJPSem1 || 90} JP)</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Target JP Presets */}
                  <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-blue-900 mr-1">Preset Total JP Sem 1:</span>
                    {[90, 72, 60, 54, 48, 36].map((targetVal) => (
                      <button
                        key={targetVal}
                        type="button"
                        onClick={() => handleAutoDistributeSemesterHours(1, targetVal)}
                        className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-md border border-blue-300 shadow-2xs transition cursor-pointer"
                        title={`Bagi rata ${targetVal} JP ke ${materialsSem1.length || 1} Bab (${targetVal / (jpPerWeek || 1)} Pertemuan)`}
                      >
                        {targetVal} JP ({Math.round(targetVal / (jpPerWeek || 1))} Ptm)
                      </button>
                    ))}
                  </div>
                </div>

                {materialsSem1.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    <p>Belum ada bab materi di Semester 1.</p>
                    <button
                      type="button"
                      onClick={() => openAddChapterModal(1)}
                      className="mt-2 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Bab Pertama Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materialsSem1.map((item, idx) => {
                      const calculatedMeetings = Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)));
                      return (
                        <div
                          key={item.id || idx}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs transition space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                Bab {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item.tpCode}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(1, idx, 'tpCode', e.target.value)
                                }
                                placeholder="Kode TP"
                                className="w-28 px-2 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-blue-700 font-bold focus:outline-none focus:border-blue-600 text-center"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Alokasi:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.allocatedHours}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      1,
                                      idx,
                                      'allocatedHours',
                                      parseNumberInput(e.target.value, 0, 0, 100)
                                    );
                                  }}
                                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-emerald-700 font-bold text-center focus:outline-none focus:border-emerald-600"
                                />
                                <span className="text-[10px] text-slate-500 font-bold">JP</span>
                              </div>

                              {/* Pertemuan Count Badge / Input */}
                              <div
                                className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800"
                                title={`Jumlah Pertemuan = ${item.allocatedHours || 0} JP ÷ ${jpPerWeek} JP/Minggu = ${calculatedMeetings} Pertemuan`}
                              >
                                <span className="text-[10px] text-emerald-700 font-bold">Pertemuan:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={40}
                                  value={calculatedMeetings}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      1,
                                      idx,
                                      'meetingCount',
                                      parseNumberInput(e.target.value, 1, 1, 40)
                                    );
                                  }}
                                  className="w-11 px-1 py-0.5 bg-white border border-emerald-300 rounded text-xs font-mono text-emerald-800 font-bold text-center focus:outline-none focus:border-emerald-600"
                                  title="Ubah jumlah pertemuan (otomatis menyesuaikan alokasi JP = Pertemuan × JP/Mg)"
                                />
                                <span className="text-[10px] font-normal text-emerald-600">
                                  Kali ({item.allocatedHours || 0} JP ÷ {jpPerWeek} JP)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDirectDeleteChapter(1, idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Bab Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-8 md:col-span-9">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-600">
                                  Bab / Lingkup Materi Pokok yang Diajarkan:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateTPForChapter(1, idx)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                                  title="Perbarui rumusan TP otomatis agar sesuai dengan judul materi ini"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Auto TP Materi</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.essentialMaterial}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(1, idx, 'essentialMaterial', e.target.value)
                                }
                                placeholder="Misal: Bab 1: Pengukuran & Besaran Fisika"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                              />
                            </div>

                            <div className="sm:col-span-4 md:col-span-3">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-600">
                                  Target TP:
                                </label>
                                <span className="text-[9px] text-blue-600 font-semibold">Tujuan</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={item.tpCount ?? 1}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      1,
                                      idx,
                                      'tpCount',
                                      parseNumberInput(e.target.value, 1, 1, 20)
                                    );
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-blue-700 font-bold text-center focus:outline-none focus:border-blue-600"
                                  title="Jumlah Target TP untuk Bab ini"
                                />
                                <span className="text-[10px] text-slate-500 font-bold shrink-0">TP</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5">
                                <label className="text-[10px] font-bold text-slate-700">
                                  Rumusan Tujuan Pembelajaran (TP):
                                </label>
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-mono font-bold">
                                  {item.tpCount ?? 1} TP Otomatis
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateTPForChapter(1, idx)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center space-x-1 transition"
                                  title="Buat / sinkronkan TP otomatis sesuai materi yang diajarkan"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Auto TP Materi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCombinedView(item.id)}
                                  className="text-[10px] text-slate-500 hover:text-blue-700 underline"
                                >
                                  {viewCombinedText[item.id] ? 'Lihat Per Butir TP' : 'Mode Teks Bebas'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddTPToChapter(1, idx)}
                                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold transition"
                                >
                                  + TP
                                </button>
                              </div>
                            </div>

                            {viewCombinedText[item.id] ? (
                              <textarea
                                rows={Math.max(2, (item.tpCount || 1) + 1)}
                                value={item.tpName}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(1, idx, 'tpName', e.target.value)
                                }
                                placeholder="Ketik rumusan Tujuan Pembelajaran (TP) untuk bab ini..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 leading-relaxed resize-y font-normal"
                              />
                            ) : (
                              <div className="space-y-1.5">
                                {parseTPList(
                                  item.tpName,
                                  item.tpCount ?? 1,
                                  item.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() || item.essentialMaterial,
                                  subject
                                ).map((tpText, tpIdx, arr) => (
                                  <div
                                    key={tpIdx}
                                    className="flex items-start space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200 hover:border-blue-300 transition"
                                  >
                                    <div className="w-7 h-6 rounded-md bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                                      TP {tpIdx + 1}
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={tpText}
                                      onChange={(e) =>
                                        handleUpdateIndividualTP(1, idx, tpIdx, e.target.value)
                                      }
                                      placeholder={`Ketik rumusan Tujuan Pembelajaran ke-${tpIdx + 1}...`}
                                      className="flex-1 px-2 py-0.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none leading-relaxed resize-y"
                                    />
                                    {arr.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTPFromChapter(1, idx, tpIdx)}
                                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0 transition rounded hover:bg-rose-50"
                                        title={`Hapus TP ke-${tpIdx + 1}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEMESTER 2 CHAPTERS */}
            {(activeSemTab === 'sem2' || activeSemTab === 'both') && (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold text-slate-900">Semester 2 (Genap)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {materialsSem2.length} Bab • {totalJPSem2} JP • {totalPertemuanSem2} Pertemuan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddChapterModal(2)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Bab Sem 2</span>
                  </button>
                </div>

                {/* Auto-Distribute Formula & Helper Bar Sem 2 */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span>Distribusi JP/Bab Berdasarkan JP/Minggu ({jpPerWeek} JP/Mg):</span>
                      </div>
                      <p className="text-[11px] text-blue-800">
                        Aturan Standar: <strong className="text-blue-950">Alokasi JP per BAB wajib kelipatan {jpPerWeek} JP/Minggu</strong> agar menghasilkan jumlah pertemuan utuh.
                        (Contoh: Total 90 JP ÷ 3 BAB = <strong className="text-emerald-800">30 JP/Bab (10 Pertemuan)</strong>).
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoDistributeSemesterHours(2)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs text-xs flex items-center space-x-1 transition cursor-pointer"
                        title="Bagi rata total JP Semester 2 ke seluruh BAB secara proporsional kelipatan JP/Minggu"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Bagi Rata Otomatis ({totalJPSem2 || 90} JP)</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Target JP Presets */}
                  <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-blue-900 mr-1">Preset Total JP Sem 2:</span>
                    {[90, 72, 60, 54, 48, 36].map((targetVal) => (
                      <button
                        key={targetVal}
                        type="button"
                        onClick={() => handleAutoDistributeSemesterHours(2, targetVal)}
                        className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-md border border-blue-300 shadow-2xs transition cursor-pointer"
                        title={`Bagi rata ${targetVal} JP ke ${materialsSem2.length || 1} Bab (${targetVal / (jpPerWeek || 1)} Pertemuan)`}
                      >
                        {targetVal} JP ({Math.round(targetVal / (jpPerWeek || 1))} Ptm)
                      </button>
                    ))}
                  </div>
                </div>

                {materialsSem2.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    <p>Belum ada bab materi di Semester 2.</p>
                    <button
                      type="button"
                      onClick={() => openAddChapterModal(2)}
                      className="mt-2 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Bab Pertama Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materialsSem2.map((item, idx) => {
                      const calculatedMeetings = Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)));
                      return (
                        <div
                          key={item.id || idx}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs transition space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                Bab {materialsSem1.length + idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item.tpCode}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(2, idx, 'tpCode', e.target.value)
                                }
                                placeholder="Kode TP"
                                className="w-28 px-2 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-blue-700 font-bold focus:outline-none focus:border-blue-600 text-center"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Alokasi:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.allocatedHours}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      2,
                                      idx,
                                      'allocatedHours',
                                      parseNumberInput(e.target.value, 0, 0, 100)
                                    );
                                  }}
                                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-emerald-700 font-bold text-center focus:outline-none focus:border-emerald-600"
                                />
                                <span className="text-[10px] text-slate-500 font-bold">JP</span>
                              </div>

                              {/* Pertemuan Count Badge / Input */}
                              <div
                                className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800"
                                title={`Jumlah Pertemuan = ${item.allocatedHours || 0} JP ÷ ${jpPerWeek} JP/Minggu = ${calculatedMeetings} Pertemuan`}
                              >
                                <span className="text-[10px] text-emerald-700 font-bold">Pertemuan:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={40}
                                  value={calculatedMeetings}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      2,
                                      idx,
                                      'meetingCount',
                                      parseNumberInput(e.target.value, 1, 1, 40)
                                    );
                                  }}
                                  className="w-11 px-1 py-0.5 bg-white border border-emerald-300 rounded text-xs font-mono text-emerald-800 font-bold text-center focus:outline-none focus:border-emerald-600"
                                  title="Ubah jumlah pertemuan (otomatis menyesuaikan alokasi JP = Pertemuan × JP/Mg)"
                                />
                                <span className="text-[10px] font-normal text-emerald-600">
                                  Kali ({item.allocatedHours || 0} JP ÷ {jpPerWeek} JP)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDirectDeleteChapter(2, idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Bab Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-8 md:col-span-9">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-600">
                                  Bab / Lingkup Materi Pokok yang Diajarkan:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateTPForChapter(2, idx)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                                  title="Perbarui rumusan TP otomatis agar sesuai dengan judul materi ini"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Auto TP Materi</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.essentialMaterial}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(2, idx, 'essentialMaterial', e.target.value)
                                }
                                placeholder="Misal: Bab 5: Dinamika Gerak"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                              />
                            </div>

                            <div className="sm:col-span-4 md:col-span-3">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-600">
                                  Target TP:
                                </label>
                                <span className="text-[9px] text-blue-600 font-semibold">Tujuan</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={item.tpCount ?? 1}
                                  onFocus={handleNumberInputFocus}
                                  onChange={(e) => {
                                    handleDirectUpdateChapter(
                                      2,
                                      idx,
                                      'tpCount',
                                      parseNumberInput(e.target.value, 1, 1, 20)
                                    );
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-blue-700 font-bold text-center focus:outline-none focus:border-blue-600"
                                  title="Jumlah Target TP untuk Bab ini"
                                />
                                <span className="text-[10px] text-slate-500 font-bold shrink-0">TP</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5">
                                <label className="text-[10px] font-bold text-slate-700">
                                  Rumusan Tujuan Pembelajaran (TP):
                                </label>
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-mono font-bold">
                                  {item.tpCount ?? 1} TP Otomatis
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateTPForChapter(2, idx)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center space-x-1 transition"
                                  title="Buat / sinkronkan TP otomatis sesuai materi yang diajarkan"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Auto TP Materi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCombinedView(item.id)}
                                  className="text-[10px] text-slate-500 hover:text-blue-700 underline"
                                >
                                  {viewCombinedText[item.id] ? 'Lihat Per Butir TP' : 'Mode Teks Bebas'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddTPToChapter(2, idx)}
                                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold transition"
                                >
                                  + TP
                                </button>
                              </div>
                            </div>

                            {viewCombinedText[item.id] ? (
                              <textarea
                                rows={Math.max(2, (item.tpCount || 1) + 1)}
                                value={item.tpName}
                                onChange={(e) =>
                                  handleDirectUpdateChapter(2, idx, 'tpName', e.target.value)
                                }
                                placeholder="Ketik rumusan Tujuan Pembelajaran (TP) untuk bab ini..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 leading-relaxed resize-y font-normal"
                              />
                            ) : (
                              <div className="space-y-1.5">
                                {parseTPList(
                                  item.tpName,
                                  item.tpCount ?? 1,
                                  item.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() || item.essentialMaterial,
                                  subject
                                ).map((tpText, tpIdx, arr) => (
                                  <div
                                    key={tpIdx}
                                    className="flex items-start space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200 hover:border-blue-300 transition"
                                  >
                                    <div className="w-7 h-6 rounded-md bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                                      TP {tpIdx + 1}
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={tpText}
                                      onChange={(e) =>
                                        handleUpdateIndividualTP(2, idx, tpIdx, e.target.value)
                                      }
                                      placeholder={`Ketik rumusan Tujuan Pembelajaran ke-${tpIdx + 1}...`}
                                      className="flex-1 px-2 py-0.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none leading-relaxed resize-y"
                                    />
                                    {arr.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTPFromChapter(2, idx, tpIdx)}
                                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0 transition rounded hover:bg-rose-50"
                                        title={`Hapus TP ke-${tpIdx + 1}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECAPITULATION & SYNCHRONIZATION OVERVIEW */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Table className="w-4 h-4 text-emerald-600" />
              <span>Rekap Beban Belajar & Alokasi</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mata Pelajaran:</span>
                  <span className="font-bold text-blue-900">{subject}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Jenjang / Kelas:</span>
                  <span className="font-bold text-slate-900">{level} - Kelas {grade}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Fase Kurikulum:</span>
                  <span className="font-bold text-blue-700">{phase}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Beban Mingguan:</span>
                  <span className="font-bold text-emerald-700">{jpPerWeek} JP / Minggu</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Alokasi Pertemuan:</span>
                  <span className="font-semibold text-slate-900">{timeAllocationPerWeek}</span>
                </div>
              </div>

              {/* Semester 1 & 2 breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Semester 1</div>
                  <div className="text-lg font-black text-blue-700 font-mono">{totalJPSem1} JP</div>
                  <div className="text-[10px] text-emerald-700 font-bold">{totalPertemuanSem1} Pertemuan</div>
                  <div className="text-[10px] text-slate-500">{materialsSem1.length} Bab Materi</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Semester 2</div>
                  <div className="text-lg font-black text-indigo-700 font-mono">{totalJPSem2} JP</div>
                  <div className="text-[10px] text-emerald-700 font-bold">{totalPertemuanSem2} Pertemuan</div>
                  <div className="text-[10px] text-slate-500">{materialsSem2.length} Bab Materi</div>
                </div>
              </div>

              {/* Annual total */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-900">Total Beban 1 Tahun:</div>
                  <div className="text-xs text-emerald-700">{materialsSem1.length + materialsSem2.length} Bab • {totalPertemuanSem1 + totalPertemuanSem2} Pertemuan</div>
                </div>
                <div className="text-xl font-black text-emerald-800 font-mono">{totalJPYear} JP</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveParameters}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Perubahan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSaveParameters();
                setMainSection('upload_analisis_rbe');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition active:scale-95"
            >
              <span>Lanjut ke Langkah 2: Upload Kaldik & (Otomatis) Analisis RBE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* MODAL TAMBAH BAB & AUTO GENERATE TP SESUAI MATERI */}
      {addChapterModalSem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Bab Baru & Susun TP Otomatis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {subject} ({level} Kelas {grade}) • Semester {addChapterModalSem === 1 ? '1 (Ganjil)' : '2 (Genap)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddChapterModalSem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Bab / Lingkup Materi Pokok yang Diajarkan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalMaterialInput}
                  onChange={(e) => setModalMaterialInput(e.target.value)}
                  placeholder={`Misal: Bab ${addChapterModalSem === 1 ? materialsSem1.length + 1 : materialsSem2.length + 1}: Konsep & Kajian ${subject}`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ketik materi yang akan diajarkan. Rumusan Tujuan Pembelajaran (TP) kurikulum merdeka akan otomatis disintesis sesuai materi ini.
                </p>
              </div>

              {/* Suggested presets if available */}
              {(() => {
                const preset = getSubjectPresetByGrade(subject, level as EducationLevel, grade);
                const list = addChapterModalSem === 1 ? preset.materialsSem1 : preset.materialsSem2;
                const currentList = addChapterModalSem === 1 ? materialsSem1 : materialsSem2;
                const existingNames = new Set(currentList.map((m) => m.essentialMaterial.toLowerCase()));
                const availableSuggestions = (list || []).filter((p) => !existingNames.has(p.essentialMaterial.toLowerCase()));

                if (availableSuggestions.length === 0) return null;

                return (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">
                      Pilihan Cepat Materi Standar {subject} Kelas {grade}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSuggestions.slice(0, 4).map((sugg, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setModalMaterialInput(sugg.essentialMaterial);
                            setModalTPCount(sugg.tpCount || 2);
                            setModalAllocatedHours(sugg.allocatedHours || jpPerWeek * 4);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition text-left"
                        >
                          {sugg.essentialMaterial}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Jumlah TP:
                  </label>
                  <select
                    value={modalTPCount}
                    onChange={(e) => setModalTPCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} Tujuan Pembelajaran (TP)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alokasi Jam (JP):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="80"
                      value={modalAllocatedHours}
                      onChange={(e) => setModalAllocatedHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                    />
                    <span className="text-xs font-bold text-slate-500">JP</span>
                  </div>
                </div>
              </div>

              {/* Live Preview of Generated TP */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pratinjau Rumusan TP Otomatis Sesuai Materi:</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {modalTPCount} TP Terbentuk
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {parseTPList(
                    '',
                    modalTPCount,
                    modalMaterialInput.trim() || `Bab: Kajian ${subject}`,
                    subject
                  ).map((tpText, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-start space-x-2 bg-white/90 p-2.5 rounded-lg border border-emerald-100 text-xs shadow-xs"
                    >
                      <span className="font-bold text-emerald-700 font-mono text-[10px] px-1.5 py-0.5 bg-emerald-100 rounded shrink-0">
                        TP {tIdx + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed font-medium">
                        {tpText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddChapterModalSem(null)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddChapterModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tambahkan Bab & Terapkan TP Otomatis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Reset Modal - Admin Only */}
      {isAdmin && (
        <CurriculumResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          isAdmin={isAdmin}
          onResetCompleted={() => {
            const freshMaster = StorageService.getActiveMasterCP();
            setSubject(freshMaster?.subject || 'Fisika');
            setLevel((freshMaster?.level as SchoolLevel) || 'SMA');
            setGrade(Number(freshMaster?.grade) || 10);
            setPhase(freshMaster?.phase || 'Fase E');
            const preset = getSubjectPresetByGrade(
              freshMaster?.subject || 'Fisika',
              (freshMaster?.level as EducationLevel) || 'SMA',
              Number(freshMaster?.grade) || 10
            );
            setMaterialsSem1((preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `mat-1-${idx + 1}` })));
            setMaterialsSem2((preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `mat-2-${idx + 1}` })));
          }}
        />
      )}
    </div>
  );
};
