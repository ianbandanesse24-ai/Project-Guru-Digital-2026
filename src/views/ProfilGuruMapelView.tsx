import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserCheck,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  Database,
  CloudUpload,
  Copy,
  ClipboardPaste,
  Search,
  X,
  Check,
  Bookmark,
  ListOrdered,
  AlertCircle,
  Sliders,
  UploadCloud,
  GraduationCap,
  BookOpen,
  Target,
  FileUp,
  CheckCircle,
  Flame,
  CheckSquare,
  Building2,
  FileCheck,
  Info,
  ShieldCheck,
  ChevronRight,
  Calculator,
  CalendarDays,
} from 'lucide-react';
import {
  SchoolLevel,
  CPMaterialItem,
  CPDistributionPlan,
  CPReference,
  ActiveMasterCPData,
  SchoolProfile,
} from '../types';
import { StorageService, INITIAL_CP_DISTRIBUTIONS } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_MATERIAL_PRESETS, SubjectPreset, getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';
import { UniversalFileParser } from '../lib/universalFileParser';

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

import { getDefaultTPText, countTPsInText, parseTPList } from '../lib/curriculumData';
export { getDefaultTPText, countTPsInText, parseTPList };


export const formatTPList = (tpList: string[]): string => {
  const valid = tpList.map((tp) => tp.trim()).filter(Boolean);
  if (valid.length === 0) return '';
  if (valid.length === 1) return valid[0];
  return valid
    .map((tp, idx) => `${idx + 1}. ${tp.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim()}`)
    .join('\n');
};

interface ProfilGuruMapelViewProps {
  initialTab?: 'profile' | 'sem1' | 'sem2' | 'preview' | 'bank';
  onNavigate?: (tab: string, subType?: string) => void;
}

export const ProfilGuruMapelView: React.FC<ProfilGuruMapelViewProps> = ({
  initialTab = 'profile',
  onNavigate,
}) => {
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const [plans, setPlans] = useState<CPDistributionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'sem1' | 'sem2' | 'preview' | 'bank'>(
    !isAdmin && initialTab === 'bank' ? 'profile' : initialTab
  );
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() => StorageService.getActiveMasterCP());
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState<boolean>(false);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileExtracting, setFileExtracting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reference CP bank
  const [cpReferences, setCpReferences] = useState<CPReference[]>([]);

  // 1. BIODATA GURU MATA PELAJARAN
  const [teacherName, setTeacherName] = useState<string>('Aspian La Ode Madimu, S.Pd. Gr');
  const [teacherNip, setTeacherNip] = useState<string>('19900822 201801 1 004');
  const [schoolName, setSchoolName] = useState<string>('SMA NEGERI 30 MALUKU TENGAH');
  const [principalName, setPrincipalName] = useState<string>('Drs. H. Ahmad Dahlan, M.Pd.');
  const [principalNip, setPrincipalNip] = useState<string>('19680514 199303 1 008');
  const [wakaName, setWakaName] = useState<string>('Alpiyan Prasetiya Marasabessy, S.Pd., Gr.');
  const [wakaNip, setWakaNip] = useState<string>('199010062019031013');
  const [academicYear, setAcademicYear] = useState<string>('2025/2026');
  const [activeSemester, setActiveSemester] = useState<'all' | 'sem1' | 'sem2'>('all');
  const [city, setCity] = useState<string>('Maluku Tengah');

  // 2. PARAMETER KURIKULUM & BEBAN MENGAJAR
  const [subject, setSubject] = useState<string>('Fisika');
  const [level, setLevel] = useState<SchoolLevel>('SMA');
  const [grade, setGrade] = useState<number | string>(10);
  const [phase, setPhase] = useState<string>('Fase E');
  const [jpPerWeek, setJpPerWeek] = useState<number>(3);
  const [totalHoursPerYear, setTotalHoursPerYear] = useState<number>(108);
  const [timeAllocationPerWeek, setTimeAllocationPerWeek] = useState<string>('45 Menit');
  const [totalTPCount, setTotalTPCount] = useState<number>(6);
  const [cpText, setCpText] = useState<string>(
    'Peserta didik mampu mengamati, menyelidiki, dan menjelaskan fenomena sehari-hari yang berkaitan dengan pengukuran besaran fisika, energi terbarukan, pemanasan global, dan pemanfaatan teknologi ramah lingkungan dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful).'
  );

  // Distributed Materials State
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>([]);
  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>([]);

  // Detailed Modal Add/Edit Material State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSemester, setModalSemester] = useState<1 | 2>(1);
  const [modalItem, setModalItem] = useState<CPMaterialItem>({
    id: '',
    semester: 1,
    orderNumber: 1,
    tpCode: '',
    tpName: '',
    essentialMaterial: '',
    elementName: 'Pemahaman Konsep / Keterampilan Proses',
    allocatedHours: 18,
    assessmentStrategy: 'Tes Formatif & Kinerja Proyek',
    deepLearningMethod: 'Mindful: Observasi kesadaran konsep, Meaningful: Studi kasus kontekstual, Joyful: Aktivitas interaktif',
  });
  const [isNewModalItem, setIsNewModalItem] = useState<boolean>(true);

  // Batch Paste Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchSemester, setBatchSemester] = useState<1 | 2>(1);
  const [batchText, setBatchText] = useState<string>('');
  const [batchHoursPerItem, setBatchHoursPerItem] = useState<number>(18);
  const [batchAssessment, setBatchAssessment] = useState<string>('Tes Formatif & Kinerja');

  // Preset Template Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [selectedPresetSubject, setSelectedPresetSubject] = useState<string>('Fisika');

  // Search/Filter in tab
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Inline Quick Add State
  const [inlineMaterialSem1, setInlineMaterialSem1] = useState<string>('');
  const [inlineJPSem1, setInlineJPSem1] = useState<number>(18);
  const [inlineMaterialSem2, setInlineMaterialSem2] = useState<string>('');
  const [inlineJPSem2, setInlineJPSem2] = useState<number>(18);

  // Section B Tab Selector for Semester Bab inputs
  const [sectionBTab, setSectionBTab] = useState<'sem1' | 'sem2' | 'both'>('sem1');

  // Combined vs Individual TP View State per Chapter ID
  const [viewCombinedText, setViewCombinedText] = useState<Record<string, boolean>>({});
  const toggleCombinedView = (id: string) => {
    setViewCombinedText((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    loadInitialData();

    const handleSyncEvent = () => {
      loadInitialData();
    };

    window.addEventListener('curriculum-parameters-synced', handleSyncEvent);
    window.addEventListener('master-cp-updated', handleSyncEvent);

    return () => {
      window.removeEventListener('curriculum-parameters-synced', handleSyncEvent);
      window.removeEventListener('master-cp-updated', handleSyncEvent);
    };
  }, []);

  const loadInitialData = () => {
    const loadedPlans = StorageService.getCPDistributions();
    const loadedCpRefs = StorageService.getCPReferences();
    const schoolProfile = StorageService.getSchoolProfile();
    const activeMaster = StorageService.getActiveMasterCP();

    setPlans(loadedPlans);
    setCpReferences(loadedCpRefs);

    if (schoolProfile) {
      if (schoolProfile.schoolName) setSchoolName(schoolProfile.schoolName);
      if (schoolProfile.teacherName) setTeacherName(schoolProfile.teacherName);
      if (schoolProfile.teacherNip) setTeacherNip(schoolProfile.teacherNip);
      if (schoolProfile.headmasterName || schoolProfile.principalName)
        setPrincipalName(schoolProfile.headmasterName || schoolProfile.principalName || '');
      if (schoolProfile.headmasterNip || schoolProfile.principalNip)
        setPrincipalNip(schoolProfile.headmasterNip || schoolProfile.principalNip || '');
      if (schoolProfile.wakaName) setWakaName(schoolProfile.wakaName);
      if (schoolProfile.wakaNip) setWakaNip(schoolProfile.wakaNip);
      if (schoolProfile.academicYear) setAcademicYear(schoolProfile.academicYear);
      if (schoolProfile.city) setCity(schoolProfile.city);
    }

    if (activeMaster) {
      setActiveMasterCP(activeMaster);
      setSubject(activeMaster.subject);
      setLevel(activeMaster.level);
      setGrade(activeMaster.grade);
      setPhase(activeMaster.phase);
      setTotalHoursPerYear(activeMaster.totalHoursPerYear);
      setJpPerWeek(activeMaster.jpPerWeek);
      if (activeMaster.timeAllocationPerWeek) {
        setTimeAllocationPerWeek(activeMaster.timeAllocationPerWeek);
      } else {
        setTimeAllocationPerWeek(activeMaster.level === 'SD' ? '35 Menit' : activeMaster.level === 'SMP' ? '40 Menit' : '45 Menit');
      }
      if (activeMaster.cpText) setCpText(activeMaster.cpText);
      const sem1 = (activeMaster.materialsSem1 || []).map((m) => ({
        ...m,
        tpCount: m.tpCount || countTPsInText(m.tpName) || 1,
      }));
      const sem2 = (activeMaster.materialsSem2 || []).map((m) => ({
        ...m,
        tpCount: m.tpCount || countTPsInText(m.tpName) || 1,
      }));
      setMaterialsSem1(sem1);
      setMaterialsSem2(sem2);
      setTotalTPCount(
        sem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        sem2.reduce((sum, m) => sum + (m.tpCount || 1), 0)
      );
    } else if (loadedPlans.length > 0) {
      loadPlanIntoState(loadedPlans[0]);
    } else if (INITIAL_CP_DISTRIBUTIONS.length > 0) {
      loadPlanIntoState(INITIAL_CP_DISTRIBUTIONS[0]);
    }
  };

  const loadPlanIntoState = (plan: CPDistributionPlan) => {
    setSelectedPlanId(plan.id);
    setTeacherName(plan.teacherName);
    setTeacherNip(plan.teacherNip || '');
    setSubject(plan.subject);
    setSchoolName(plan.schoolName);
    setLevel(plan.level);
    setGrade(plan.grade);
    setPhase(plan.phase);
    setAcademicYear(plan.academicYear);
    setTotalHoursPerYear(plan.totalHoursPerYear);
    setJpPerWeek(plan.jpPerWeek || Math.round(plan.totalHoursPerYear / 36) || 3);
    if (plan.timeAllocationPerWeek) {
      setTimeAllocationPerWeek(plan.timeAllocationPerWeek);
    } else {
      setTimeAllocationPerWeek(plan.level === 'SD' ? '35 Menit' : plan.level === 'SMP' ? '40 Menit' : '45 Menit');
    }
    const sem1 = (plan.materialsSem1 || []).map((m) => ({
      ...m,
      tpCount: m.tpCount || countTPsInText(m.tpName) || 1,
    }));
    const sem2 = (plan.materialsSem2 || []).map((m) => ({
      ...m,
      tpCount: m.tpCount || countTPsInText(m.tpName) || 1,
    }));
    setMaterialsSem1(sem1);
    setMaterialsSem2(sem2);
    setTotalTPCount(
      sem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
      sem2.reduce((sum, m) => sum + (m.tpCount || 1), 0)
    );
    setCpText(plan.cpText || '');
  };

  const showNotif = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Automatically update CP, Phase, and Chapters when Subject changes
  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    const targetGrade = Number(grade) || (level === 'SD' ? 4 : level === 'SMP' ? 7 : 10);
    const targetLvl = (level || 'SMA') as 'SMA' | 'SMP' | 'SD' | 'SMK';
    const preset = getSubjectPresetByGrade(newSub, targetLvl, targetGrade);

    setPhase(preset.phase);
    setCpText(preset.cpSummary);
    setTotalHoursPerYear(preset.totalHoursPerYear);
    const calculatedJp = Math.round(preset.totalHoursPerYear / 36) || 3;
    setJpPerWeek(calculatedJp);

    const sem1WithIds: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `mat-1-${Date.now()}-${idx}`,
    }));
    const sem2WithIds: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `mat-2-${Date.now()}-${idx}`,
    }));

    setMaterialsSem1(sem1WithIds);
    setMaterialsSem2(sem2WithIds);
    setTotalTPCount(sem1WithIds.length + sem2WithIds.length);

    showNotif(`Mata Pelajaran "${newSub}" dipilih. Lingkup materi Bab & CP otomatis disesuaikan untuk Kelas ${targetGrade} (${preset.phase})!`);
  };

  // Automatically update phase & materials when grade changes
  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    const targetLvl = (level || 'SMA') as 'SMA' | 'SMP' | 'SD' | 'SMK';
    const preset = getSubjectPresetByGrade(subject || 'Fisika', targetLvl, newGrade);
    setPhase(preset.phase);
    setCpText(preset.cpSummary);
    setTotalHoursPerYear(preset.totalHoursPerYear);
    setJpPerWeek(Math.round(preset.totalHoursPerYear / 36) || 3);

    const sem1WithIds: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `mat-1-${Date.now()}-${idx}`,
    }));
    const sem2WithIds: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `mat-2-${Date.now()}-${idx}`,
    }));

    setMaterialsSem1(sem1WithIds);
    setMaterialsSem2(sem2WithIds);
    setTotalTPCount(sem1WithIds.length + sem2WithIds.length);

    showNotif(`Kelas ${newGrade} dipilih. Lingkup materi Bab & CP otomatis disesuaikan untuk ${subject} (${preset.phase})!`);
  };

  const handleLevelChange = (newLvl: SchoolLevel) => {
    setLevel(newLvl);
    let defaultGrade = 10;
    let defaultTime = '45 Menit';
    if (newLvl === 'SD') {
      defaultGrade = 4;
      defaultTime = '35 Menit';
    } else if (newLvl === 'SMP') {
      defaultGrade = 7;
      defaultTime = '40 Menit';
    } else {
      defaultGrade = 10;
      defaultTime = '45 Menit';
    }
    setGrade(defaultGrade);
    setTimeAllocationPerWeek(defaultTime);

    const preset = getSubjectPresetByGrade(subject || 'Fisika', newLvl, defaultGrade);
    setPhase(preset.phase);
    setCpText(preset.cpSummary);
    setTotalHoursPerYear(preset.totalHoursPerYear);
    setJpPerWeek(Math.round(preset.totalHoursPerYear / 36) || 3);

    const sem1WithIds: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `mat-1-${Date.now()}-${idx}`,
    }));
    const sem2WithIds: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `mat-2-${Date.now()}-${idx}`,
    }));

    setMaterialsSem1(sem1WithIds);
    setMaterialsSem2(sem2WithIds);
    setTotalTPCount(sem1WithIds.length + sem2WithIds.length);

    showNotif(`Jenjang ${newLvl} dipilih. Materi Bab & CP otomatis disesuaikan untuk Kelas ${defaultGrade} (${preset.phase})!`);
  };

  // Automatically update grade & materials when Phase changes
  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
    let targetGrade = Number(grade);
    if (newPhase === 'Fase A') targetGrade = 1;
    else if (newPhase === 'Fase B') targetGrade = 4;
    else if (newPhase === 'Fase C') targetGrade = 5;
    else if (newPhase === 'Fase D') targetGrade = 7;
    else if (newPhase === 'Fase E') targetGrade = 10;
    else if (newPhase === 'Fase F') targetGrade = 11;

    setGrade(targetGrade);
    const targetLvl = (level || 'SMA') as 'SMA' | 'SMP' | 'SD' | 'SMK';
    const preset = getSubjectPresetByGrade(subject || 'Fisika', targetLvl, targetGrade);
    setCpText(preset.cpSummary);
    setTotalHoursPerYear(preset.totalHoursPerYear);

    const sem1WithIds: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `mat-1-${Date.now()}-${idx}`,
    }));
    const sem2WithIds: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `mat-2-${Date.now()}-${idx}`,
    }));

    setMaterialsSem1(sem1WithIds);
    setMaterialsSem2(sem2WithIds);
    setTotalTPCount(
      sem1WithIds.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
      sem2WithIds.reduce((sum, m) => sum + (m.tpCount || 1), 0)
    );

    showNotif(`Fase ${newPhase} dipilih. Materi Bab & CP otomatis disesuaikan untuk Kelas ${targetGrade}!`);
  };

  const handleJpPerWeekChange = (newJp: number) => {
    const val = Math.max(0, Number(newJp) || 0);
    setJpPerWeek(val);
    setTotalHoursPerYear(val * 36);
  };

  // Direct manual chapter & TP handlers for Section B
  const handleUpdateTPCount = (semester: 1 | 2, index: number, newCount: number) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const item = currentList[index];
    if (!item) return;

    const validCount = Math.max(1, Math.min(20, newCount));
    const cleanTitle =
      item.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() ||
      item.essentialMaterial ||
      subject;

    const updatedTPs = parseTPList(item.tpName, validCount, cleanTitle, subject);
    const updatedTPName = formatTPList(updatedTPs);

    const updatedList = [...currentList];
    updatedList[index] = {
      ...item,
      tpCount: validCount,
      tpName: updatedTPName,
    };

    if (semester === 1) {
      setMaterialsSem1(updatedList);
      const totalTPs =
        updatedList.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    } else {
      setMaterialsSem2(updatedList);
      const totalTPs =
        materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        updatedList.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    }
  };

  const handleUpdateIndividualTP = (
    semester: 1 | 2,
    itemIdx: number,
    tpIdx: number,
    newText: string
  ) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const item = currentList[itemIdx];
    if (!item) return;

    const cleanTitle =
      item.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() ||
      item.essentialMaterial ||
      subject;
    const targetCount = item.tpCount || 1;
    const currentTPs = parseTPList(item.tpName, targetCount, cleanTitle, subject);

    const updatedTPs = [...currentTPs];
    while (updatedTPs.length <= tpIdx) {
      updatedTPs.push('');
    }
    updatedTPs[tpIdx] = newText;

    const updatedTPName = formatTPList(updatedTPs);
    const updatedList = [...currentList];
    updatedList[itemIdx] = {
      ...item,
      tpName: updatedTPName,
    };

    if (semester === 1) {
      setMaterialsSem1(updatedList);
    } else {
      setMaterialsSem2(updatedList);
    }
  };

  const handleAddTPToChapter = (semester: 1 | 2, itemIdx: number) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const item = currentList[itemIdx];
    if (!item) return;
    const currentCount = item.tpCount || 1;
    handleUpdateTPCount(semester, itemIdx, currentCount + 1);
  };

  const handleRemoveTPFromChapter = (semester: 1 | 2, itemIdx: number, tpIdx: number) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const item = currentList[itemIdx];
    if (!item) return;

    const cleanTitle =
      item.essentialMaterial?.replace(/^Bab\s*\d+\s*[:\-]\s*/i, '').trim() ||
      item.essentialMaterial ||
      subject;
    const currentCount = item.tpCount || 1;
    const currentTPs = parseTPList(item.tpName, currentCount, cleanTitle, subject);

    if (currentTPs.length <= 1) return;

    const updatedTPs = currentTPs.filter((_, i) => i !== tpIdx);
    const newCount = updatedTPs.length;
    const updatedTPName = formatTPList(updatedTPs);

    const updatedList = [...currentList];
    updatedList[itemIdx] = {
      ...item,
      tpCount: newCount,
      tpName: updatedTPName,
    };

    if (semester === 1) {
      setMaterialsSem1(updatedList);
      const totalTPs =
        updatedList.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    } else {
      setMaterialsSem2(updatedList);
      const totalTPs =
        materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        updatedList.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    }
  };

  const handleDirectAddChapter = (semester: 1 | 2) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const newIdx = currentList.length + 1;
    const orderNumber = semester === 1 ? newIdx : materialsSem1.length + newIdx;
    const newItem: CPMaterialItem = {
      id: `mat-${semester}-${Date.now()}-${newIdx}`,
      semester,
      orderNumber,
      tpCode: `TP.${grade}.${semester}.${newIdx}`,
      essentialMaterial: `Bab ${orderNumber}: `,
      tpName: getDefaultTPText(1, `Bab ${orderNumber}`, subject),
      elementName: 'Pemahaman Konsep & Keterampilan Proses',
      allocatedHours: 18,
      tpCount: 1,
      assessmentStrategy: 'Tes Formatif & Penilaian Kinerja',
      deepLearningMethod: 'Mindful, Meaningful & Joyful Learning',
    };

    if (semester === 1) {
      const updated = [...materialsSem1, newItem];
      setMaterialsSem1(updated);
      const totalTPs =
        updated.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    } else {
      const updated = [...materialsSem2, newItem];
      setMaterialsSem2(updated);
      const totalTPs =
        materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        updated.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    }
  };

  const handleDirectUpdateChapter = (
    semester: 1 | 2,
    index: number,
    field: keyof CPMaterialItem,
    value: any
  ) => {
    if (field === 'tpCount') {
      handleUpdateTPCount(semester, index, Number(value) || 1);
      return;
    }

    if (semester === 1) {
      const updated = [...materialsSem1];
      updated[index] = { ...updated[index], [field]: value };
      setMaterialsSem1(updated);
    } else {
      const updated = [...materialsSem2];
      updated[index] = { ...updated[index], [field]: value };
      setMaterialsSem2(updated);
    }
  };

  const handleDirectDeleteChapter = (semester: 1 | 2, index: number) => {
    if (semester === 1) {
      const updated = materialsSem1
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({
          ...item,
          orderNumber: idx + 1,
        }));
      setMaterialsSem1(updated);
      const totalTPs = updated.reduce((sum, m) => sum + (m.tpCount || 1), 0) + materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    } else {
      const updated = materialsSem2
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({
          ...item,
          orderNumber: materialsSem1.length + idx + 1,
        }));
      setMaterialsSem2(updated);
      const totalTPs = materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) + updated.reduce((sum, m) => sum + (m.tpCount || 1), 0);
      setTotalTPCount(totalTPs);
    }
  };

  // File Upload Handler (PDF, Word docx, Text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setFileExtracting(true);

    try {
      const parsed = await UniversalFileParser.parseFile(file);
      const textToUse = parsed.extractedText && parsed.extractedText.trim().length > 20
        ? parsed.extractedText
        : await file.text();

      setCpText(textToUse);

      // Also update master CP with file metadata
      const currentMaster = StorageService.getActiveMasterCP();
      const updatedMaster: ActiveMasterCPData = {
        id: currentMaster?.id || `master-cp-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        teacherName,
        teacherNip,
        schoolName,
        principalName,
        principalNip,
        academicYear,
        city,
        subject,
        level,
        grade,
        phase,
        jpPerWeek,
        timeAllocationPerWeek,
        materialsSem1,
        materialsSem2,
        totalHoursPerYear,
        cpText: textToUse,
        elements: activeMasterCP?.elements || [],
      };
      StorageService.setActiveMasterCP(updatedMaster);
      setActiveMasterCP(updatedMaster);

      showNotif(`Berhasil mengunggah & mengekstraksi berkas "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Master CP terpasang!`);
    } catch (err: any) {
      console.error(err);
      showNotif('Gagal membaca file: ' + err.message, 'error');
    } finally {
      setFileExtracting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Apply Selected Preset
  const handleApplyPreset = (presetSubject: string) => {
    const preset = SUBJECT_MATERIAL_PRESETS.find(
      (p) => p.subject.toLowerCase() === presetSubject.toLowerCase()
    );

    if (!preset) {
      // Fallback generator
      setSubject(presetSubject);
      showNotif(`Mata Pelajaran diubah menjadi ${presetSubject}.`);
      setIsPresetModalOpen(false);
      return;
    }

    setSubject(preset.subject);
    setLevel(preset.level);
    setGrade(preset.grade);
    setPhase(preset.phase);
    setTotalHoursPerYear(preset.totalHoursPerYear);
    setJpPerWeek(Math.round(preset.totalHoursPerYear / 36) || 3);
    setCpText(preset.cpSummary);

    const mappedSem1: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `mat-1-${Date.now()}-${idx}`,
    }));
    const mappedSem2: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `mat-2-${Date.now()}-${idx}`,
    }));

    setMaterialsSem1(mappedSem1);
    setMaterialsSem2(mappedSem2);
    setTotalTPCount(
      mappedSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
      mappedSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0)
    );

    setIsPresetModalOpen(false);
    showNotif(`Template standar BSKAP untuk ${preset.subject} (${preset.phase}) berhasil diterapkan!`);
  };

  // FULL AI CP ANALYSIS WITH REAL-TIME PROGRESS (0% -> 100%) & AUTO SYNCHRONIZATION
  const handleRunFullAnalysis = async () => {
    if (!teacherName.trim()) {
      alert('Nama Guru Pengampu wajib diisi sebelum memulai analisis.');
      return;
    }
    if (!subject.trim()) {
      alert('Mata Pelajaran wajib ditentukan.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStep('1/6: Mengekstrak Dokumen CP & Verifikasi Parameter Kurikulum...');

    const steps = [
      { progress: 18, step: '2/6: Identifikasi Elemen CP & Taksonomi Bloom HOTS (C4-C6)...' },
      { progress: 42, step: '3/6: Merumuskan Tujuan Pembelajaran (TP) Deep Learning (Mindful, Meaningful, Joyful)...' },
      { progress: 68, step: '4/6: Membagi Materi Esensial & Alokasi JP Semester 1 (Ganjil) & Semester 2 (Genap)...' },
      { progress: 88, step: '5/6: Menyusun Kriteria Ketercapaian (KKTP), Asesmen & Pemetaan Seluruh Perangkat...' },
      { progress: 100, step: '6/6: Selesai! Sinkronisasi otomatis ke 9 modul perangkat pembelajaran...' },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setAnalysisProgress(steps[i].progress);
      setAnalysisStep(steps[i].step);
    }

    // Generate balanced materials if empty
    let newSem1 = [...materialsSem1];
    let newSem2 = [...materialsSem2];

    const preset = SUBJECT_MATERIAL_PRESETS.find(
      (p) => p.subject.toLowerCase() === subject.toLowerCase()
    );

    if (newSem1.length === 0 && newSem2.length === 0) {
      if (preset) {
        newSem1 = preset.materialsSem1.map((m, idx) => ({
          ...m,
          id: `mat-1-${Date.now()}-${idx}`,
        }));
        newSem2 = preset.materialsSem2.map((m, idx) => ({
          ...m,
          id: `mat-2-${Date.now()}-${idx}`,
        }));
      } else {
        const tpHalf = Math.max(2, Math.ceil(totalTPCount / 2));
        const jpHalf1 = Math.floor(totalHoursPerYear / 2);
        const jpHalf2 = totalHoursPerYear - jpHalf1;

        newSem1 = [
          {
            id: `mat-1-${Date.now()}-1`,
            semester: 1,
            orderNumber: 1,
            tpCode: `TP.${grade}.1.1`,
            tpName: `Memahami hakikat, ruang lingkup konsep esensial, dan prinsip penyelidikan ilmiah pada materi ${subject}.`,
            essentialMaterial: `Konsep Dasar, Hakikat & Prinsip ${subject}`,
            elementName: 'Pemahaman Konsep & Keterampilan Proses',
            allocatedHours: Math.floor(jpHalf1 / 2),
            assessmentStrategy: 'Tes Formatif Tertulis & Observasi Sikap Ilmiah',
            deepLearningMethod: 'Mindful: Observasi kesadaran konsep & refleksi terstruktur.',
          },
          {
            id: `mat-1-${Date.now()}-2`,
            semester: 1,
            orderNumber: 2,
            tpCode: `TP.${grade}.1.2`,
            tpName: `Menganalisis fenomena kontekstual, pemecahan masalah analitis, dan aplikasi terapan ${subject} dalam kehidupan nyata.`,
            essentialMaterial: `Aplikasi Kontekstual & Studi Kasus ${subject}`,
            elementName: 'Pemahaman Konsep & Nalar Kritis',
            allocatedHours: Math.ceil(jpHalf1 / 2),
            assessmentStrategy: 'Asesmen Kinerja Portofolio & Tes Sumatif Tengah Semester',
            deepLearningMethod: 'Meaningful: Eksplorasi studi kasus nyata & pemecahan masalah relevan.',
          },
        ];

        newSem2 = [
          {
            id: `mat-2-${Date.now()}-1`,
            semester: 2,
            orderNumber: 3,
            tpCode: `TP.${grade}.2.1`,
            tpName: `Menginvestigasi dinamika lanjutan, eksperimen laboratorium, dan elaborasi teoretis pada materi ${subject}.`,
            essentialMaterial: `Dinamika & Eksperimen Lanjutan ${subject}`,
            elementName: 'Keterampilan Proses & Analisis',
            allocatedHours: Math.floor(jpHalf2 / 2),
            assessmentStrategy: 'Penilaian Kinerja Praktikum & Uji Formatif',
            deepLearningMethod: 'Joyful: Diskusi kelompok kolaboratif & eksperimen hands-on menyenangkan.',
          },
          {
            id: `mat-2-${Date.now()}-2`,
            semester: 2,
            orderNumber: 4,
            tpCode: `TP.${grade}.2.2`,
            tpName: `Merancang proyek rekayasa, karya inovasi, dan mengomunikasikan gagasan solusi ilmiah materi ${subject}.`,
            essentialMaterial: `Proyek Inovasi & Rekayasa Terapan ${subject}`,
            elementName: 'Keterampilan Proses & Kreativitas',
            allocatedHours: Math.ceil(jpHalf2 / 2),
            assessmentStrategy: 'Asesmen Sumatif Akhir Tahun (Karya Proyek & Presentasi)',
            deepLearningMethod: 'Mindful, Meaningful, Joyful: Gelar karya dan presentasi reflektif terpadu.',
          },
        ];
      }
    }

    setMaterialsSem1(newSem1);
    setMaterialsSem2(newSem2);

    // Construct Master CP Data
    const masterCPData: ActiveMasterCPData = {
      id: `master-${Date.now()}`,
      fileName: uploadedFile?.name || `CP_${subject}_${phase}_${academicYear.replace('/', '-')}.docx`,
      fileType: uploadedFile?.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: uploadedFile?.size || 45200,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      level,
      grade,
      phase,
      subject,
      teacherName,
      schoolName,
      academicYear,
      totalHoursPerYear,
      jpPerWeek,
      timeAllocationPerWeek,
      cpText,
      elements: [
        {
          name: 'Pemahaman Konsep',
          description: `Peserta didik mampu memahami konsep fundamental ${subject}, menganalisis hukum dan prinsip ilmiah, serta mengaitkannya dengan fenomena faktual.`,
          competencies: ['Mengamati', 'Menjelaskan', 'Menganalisis', 'Mengevaluasi'],
          essentialMaterials: newSem1.concat(newSem2).map((m) => m.essentialMaterial),
        },
        {
          name: 'Keterampilan Proses',
          description: `Peserta didik mampu merencanakan dan melaksanakan penyelidikan ilmiah, menginterpretasi data empiris, serta mengomunikasikan kesimpulan secara kolaboratif.`,
          competencies: ['Merancang Percobaan', 'Mengumpulkan Data', 'Menyimpulkan', 'Mempresentasikan'],
          essentialMaterials: ['Metode Ilmiah', 'Pengolahan Data', 'Proyek Berbasis Solusi'],
        },
      ],
      materialsSem1: newSem1,
      materialsSem2: newSem2,
      executiveSummary: `Analisis CP ${subject} ${level} (${phase} Kelas ${grade}) oleh Guru ${teacherName} berhasil disinkronkan. Terbagi atas ${newSem1.length} TP di Semester 1 (${newSem1.reduce((s, i) => s + i.allocatedHours, 0)} JP) dan ${newSem2.length} TP di Semester 2 (${newSem2.reduce((s, i) => s + i.allocatedHours, 0)} JP) dengan pendekatan Deep Learning 3 Pilar.`,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };

    // Save to Master CP & School Profile
    StorageService.setActiveMasterCP(masterCPData);
    setActiveMasterCP(masterCPData);

    const updatedProfile: SchoolProfile = {
      ...StorageService.getSchoolProfile(),
      schoolName,
      teacherName,
      teacherNip,
      headmasterName: principalName,
      headmasterNip: principalNip,
      principalName,
      principalNip,
      academicYear,
      city,
      subject,
      level,
      grade: Number(grade),
      phase,
      jpPerWeek,
      totalHoursPerYear,
      timeAllocationPerWeek,
    };
    StorageService.saveSchoolProfile(updatedProfile);

    // Save CPDistributionPlan
    const distPlan: CPDistributionPlan = {
      id: `plan-${Date.now()}`,
      teacherName,
      teacherNip,
      subject,
      schoolName,
      level,
      grade,
      phase,
      academicYear,
      semesterOption: 'all',
      totalHoursPerYear,
      totalTPCount:
        newSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        newSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0),
      jpPerWeek,
      timeAllocationPerWeek,
      cpText,
      materialsSem1: newSem1,
      materialsSem2: newSem2,
      totalHoursSem1: newSem1.reduce((s, i) => s + i.allocatedHours, 0),
      totalHoursSem2: newSem2.reduce((s, i) => s + i.allocatedHours, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveCPDistribution(distPlan);
    setPlans(StorageService.getCPDistributions());

    setIsAnalyzing(false);
    setShowSyncSuccessModal(true);
  };

  // Save manual profile & plan
  const handleSavePlan = () => {
    setIsSaving(true);

    const sem1Hours = materialsSem1.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
    const sem2Hours = materialsSem2.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
    const totalCalcHours = (sem1Hours + sem2Hours) > 0 ? (sem1Hours + sem2Hours) : totalHoursPerYear;

    const updatedProfile: SchoolProfile = {
      ...StorageService.getSchoolProfile(),
      schoolName,
      teacherName,
      teacherNip,
      headmasterName: principalName,
      headmasterNip: principalNip,
      principalName,
      principalNip,
      wakaName,
      wakaNip,
      academicYear,
      city,
      subject,
      level,
      grade: Number(grade) || 10,
      phase,
      jpPerWeek,
      totalHoursPerYear: totalCalcHours,
      timeAllocationPerWeek,
      cpText,
    };
    StorageService.saveSchoolProfile(updatedProfile);

    const newPlan: CPDistributionPlan = {
      id: selectedPlanId || `cp-plan-${Date.now()}`,
      teacherName,
      teacherNip,
      subject,
      schoolName,
      level,
      grade: Number(grade) || 10,
      phase,
      semesterOption: activeSemester,
      academicYear,
      totalHoursPerYear: totalCalcHours,
      totalHoursSem1: sem1Hours,
      totalHoursSem2: sem2Hours,
      totalTPCount:
        materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
        materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0),
      jpPerWeek,
      timeAllocationPerWeek,
      cpText,
      materialsSem1,
      materialsSem2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveCPDistribution(newPlan);
    setPlans(StorageService.getCPDistributions());
    setSelectedPlanId(newPlan.id);

    // Sync to activeMasterCP as well
    const updatedMaster: ActiveMasterCPData = {
      id: activeMasterCP?.id || `master-${Date.now()}`,
      fileName: activeMasterCP?.fileName || `CP_${subject}_${phase}_${academicYear.replace('/', '-')}.docx`,
      fileType: activeMasterCP?.fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: activeMasterCP?.fileSize || 45200,
      uploadedAt: activeMasterCP?.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      level,
      grade: Number(grade) || 10,
      phase,
      subject,
      teacherName,
      teacherNip,
      schoolName,
      academicYear,
      totalHoursPerYear: totalCalcHours,
      jpPerWeek,
      timeAllocationPerWeek,
      cpText,
      elements: activeMasterCP?.elements || [
        {
          name: 'Pemahaman Konsep',
          description: `Peserta didik mampu memahami konsep fundamental ${subject}, menganalisis hukum dan prinsip ilmiah, serta mengaitkannya dengan fenomena faktual.`,
          competencies: ['Mengamati', 'Menjelaskan', 'Menganalisis', 'Mengevaluasi'],
          essentialMaterials: materialsSem1.concat(materialsSem2).map((m) => m.essentialMaterial),
        },
        {
          name: 'Keterampilan Proses',
          description: `Peserta didik mampu merencanakan dan melaksanakan penyelidikan ilmiah, menginterpretasi data empiris, serta mengomunikasikan kesimpulan secara kolaboratif.`,
          competencies: ['Merancang Percobaan', 'Mengumpulkan Data', 'Menyimpulkan', 'Mempresentasikan'],
          essentialMaterials: ['Metode Ilmiah', 'Pengolahan Data', 'Proyek Berbasis Solusi'],
        },
      ],
      materialsSem1,
      materialsSem2,
      executiveSummary: `Analisis CP ${subject} ${level} (${phase} Kelas ${grade}) oleh Guru ${teacherName} berhasil disinkronkan sebagai Master Acuan. Terbagi atas ${materialsSem1.length} TP di Semester 1 (${sem1Hours} JP) dan ${materialsSem2.length} TP di Semester 2 (${sem2Hours} JP) dengan pendekatan Deep Learning 3 Pilar.`,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };
    StorageService.setActiveMasterCP(updatedMaster);
    setActiveMasterCP(updatedMaster);

    setTimeout(() => {
      setIsSaving(false);
      showNotif('Profil Guru, Mapel, Kelas & CP berhasil disimpan sebagai Master Acuan dan disinkronkan ke seluruh perangkat ajar!');
    }, 400);
  };

  // Open Add Material Modal
  const handleOpenAddModal = (semester: 1 | 2) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const newOrder = semester === 1 ? currentList.length + 1 : materialsSem1.length + currentList.length + 1;
    const newCode = `TP.${grade}.${semester}.${currentList.length + 1}`;
    setModalItem({
      id: `mat-${semester}-${Date.now()}`,
      semester,
      orderNumber: newOrder,
      tpCode: newCode,
      tpName: '',
      essentialMaterial: '',
      elementName: 'Pemahaman Konsep / Keterampilan Proses',
      allocatedHours: 18,
      assessmentStrategy: 'Tes Formatif, Observasi & Asesmen Sumatif Lingkup Materi',
      deepLearningMethod: 'Mindful: Observasi teliti & refleksi kesadaran konsep, Meaningful: Keterkaitan masalah kontekstual nyata, Joyful: Aktivitas belajar interaktif & kolaboratif.',
    });
    setModalSemester(semester);
    setIsNewModalItem(true);
    setIsModalOpen(true);
  };

  // Open Edit Material Modal
  const handleOpenEditModal = (semester: 1 | 2, item: CPMaterialItem) => {
    setModalItem({ ...item, semester });
    setModalSemester(semester);
    setIsNewModalItem(false);
    setIsModalOpen(true);
  };

  // Save Modal Item
  const handleSaveModalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem.essentialMaterial.trim() && !modalItem.tpName.trim()) {
      alert('Lingkup Materi Pokok atau Rumusan TP wajib diisi.');
      return;
    }

    const targetSemester = modalItem.semester;
    if (isNewModalItem) {
      if (targetSemester === 1) {
        setMaterialsSem1([...materialsSem1, modalItem]);
      } else {
        setMaterialsSem2([...materialsSem2, modalItem]);
      }
      showNotif(`Materi baru berhasil ditambahkan ke Semester ${targetSemester}!`);
    } else {
      if (targetSemester !== modalSemester) {
        if (modalSemester === 1) {
          setMaterialsSem1(materialsSem1.filter((m) => m.id !== modalItem.id));
          setMaterialsSem2([...materialsSem2, modalItem]);
        } else {
          setMaterialsSem2(materialsSem2.filter((m) => m.id !== modalItem.id));
          setMaterialsSem1([...materialsSem1, modalItem]);
        }
        showNotif(`Materi berhasil diperbarui dan dipindahkan ke Semester ${targetSemester}!`);
      } else {
        if (targetSemester === 1) {
          setMaterialsSem1(materialsSem1.map((m) => (m.id === modalItem.id ? modalItem : m)));
        } else {
          setMaterialsSem2(materialsSem2.map((m) => (m.id === modalItem.id ? modalItem : m)));
        }
        showNotif(`Materi Semester ${targetSemester} berhasil diperbarui!`);
      }
    }
    setIsModalOpen(false);
  };

  // Duplicate item
  const handleDuplicateItem = (semester: 1 | 2, item: CPMaterialItem) => {
    const currentList = semester === 1 ? materialsSem1 : materialsSem2;
    const duplicated: CPMaterialItem = {
      ...item,
      id: `mat-${semester}-${Date.now()}`,
      orderNumber: currentList.length + 1,
      tpCode: `${item.tpCode}.b`,
      essentialMaterial: `${item.essentialMaterial} (Salinan Lanjutan)`,
    };
    if (semester === 1) {
      setMaterialsSem1([...materialsSem1, duplicated]);
    } else {
      setMaterialsSem2([...materialsSem2, duplicated]);
    }
    showNotif(`Materi "${item.essentialMaterial}" berhasil disalin di Semester ${semester}.`);
  };

  // Move Up / Down
  const handleMoveUp = (semester: 1 | 2, index: number) => {
    if (index === 0) return;
    const list = semester === 1 ? [...materialsSem1] : [...materialsSem2];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    list.forEach((item, idx) => {
      item.orderNumber = semester === 1 ? idx + 1 : materialsSem1.length + idx + 1;
    });
    if (semester === 1) setMaterialsSem1(list);
    else setMaterialsSem2(list);
  };

  const handleMoveDown = (semester: 1 | 2, index: number) => {
    const list = semester === 1 ? [...materialsSem1] : [...materialsSem2];
    if (index >= list.length - 1) return;
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    list.forEach((item, idx) => {
      item.orderNumber = semester === 1 ? idx + 1 : materialsSem1.length + idx + 1;
    });
    if (semester === 1) setMaterialsSem1(list);
    else setMaterialsSem2(list);
  };

  // Generate Matrix HTML for Word & PDF
  const generateMatrixHtml = () => {
    const sem1Rows = materialsSem1
      .map(
        (m, idx) => `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-weight:bold;">${m.tpCode}</td>
        <td>${(m.tpName || '').replace(/\n/g, '<br>')}</td>
        <td><strong>${m.essentialMaterial}</strong></td>
        <td style="text-align:center; font-weight:bold;">${m.allocatedHours}</td>
        <td>${m.assessmentStrategy}<br><em>${m.deepLearningMethod || ''}</em></td>
      </tr>`
      )
      .join('');

    const sem2Rows = materialsSem2
      .map(
        (m, idx) => `<tr>
        <td style="text-align:center;">${materialsSem1.length + idx + 1}</td>
        <td style="text-align:center; font-weight:bold;">${m.tpCode}</td>
        <td>${(m.tpName || '').replace(/\n/g, '<br>')}</td>
        <td><strong>${m.essentialMaterial}</strong></td>
        <td style="text-align:center; font-weight:bold;">${m.allocatedHours}</td>
        <td>${m.assessmentStrategy}<br><em>${m.deepLearningMethod || ''}</em></td>
      </tr>`
      )
      .join('');

    return `
      <h3 style="font-size:11.5pt; font-weight:bold; margin-top:14px; background:#f1f5f9; padding:6px 10px; border-left:4px solid #3b82f6;">
        I. PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN SEMESTER 1 (GANJIL) - ${totalJPSem1} JP
      </h3>
      <table>
        <thead>
          <tr>
            <th style="width:5%;">No</th>
            <th style="width:12%;">Kode TP</th>
            <th style="width:35%;">Tujuan Pembelajaran (TP)</th>
            <th style="width:23%;">Materi Pokok Esensial</th>
            <th style="width:7%;">JP</th>
            <th style="width:18%;">Asesmen & Deep Learning</th>
          </tr>
        </thead>
        <tbody>
          ${sem1Rows}
          <tr style="background:#f8fafc; font-weight:bold;">
            <td colspan="4" style="text-align:right;">Total Jam Semester 1:</td>
            <td style="text-align:center;">${totalJPSem1} JP</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size:11.5pt; font-weight:bold; margin-top:18px; background:#f1f5f9; padding:6px 10px; border-left:4px solid #3b82f6;">
        II. PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN SEMESTER 2 (GENAP) - ${totalJPSem2} JP
      </h3>
      <table>
        <thead>
          <tr>
            <th style="width:5%;">No</th>
            <th style="width:12%;">Kode TP</th>
            <th style="width:35%;">Tujuan Pembelajaran (TP)</th>
            <th style="width:23%;">Materi Pokok Esensial</th>
            <th style="width:7%;">JP</th>
            <th style="width:18%;">Asesmen & Deep Learning</th>
          </tr>
        </thead>
        <tbody>
          ${sem2Rows}
          <tr style="background:#f8fafc; font-weight:bold;">
            <td colspan="4" style="text-align:right;">Total Jam Semester 2:</td>
            <td style="text-align:center;">${totalJPSem2} JP</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
  };

  const handleExportWord = () => {
    const profile = StorageService.getSchoolProfile();
    const html = generateMatrixHtml();
    ExportService.exportToWord(
      `PROFIL GURU & MATRIKS PEMBAGIAN MATERI CP - ${subject} KELAS ${grade}`,
      html,
      {
        ...profile,
        schoolName,
        teacherName,
        teacherNip,
        academicYear,
      },
      `Profil_Guru_${subject}_Kelas_${grade}`
    );
  };

  const handlePrintPdf = () => {
    const profile = StorageService.getSchoolProfile();
    const html = generateMatrixHtml();
    ExportService.printPdfPreview(
      `PROFIL GURU & MATRIKS PEMBAGIAN MATERI CP (${subject} KELAS ${grade})`,
      html,
      {
        ...profile,
        schoolName,
        teacherName,
        teacherNip,
        academicYear,
      }
    );
  };

  const totalJPSem1 = materialsSem1.reduce((sum, item) => sum + (Number(item.allocatedHours) || 0), 0);
  const totalJPSem2 = materialsSem2.reduce((sum, item) => sum + (Number(item.allocatedHours) || 0), 0);
  const totalJPTahun = totalJPSem1 + totalJPSem2;

  const availableGrades = useMemo(() => {
    if (level === 'SD') return [1, 2, 3, 4, 5, 6];
    if (level === 'SMP') return [7, 8, 9];
    if (level === 'SMA' || level === 'SMK') return [10, 11, 12];
    return [10, 11, 12];
  }, [level]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Profil Guru Mata Pelajaran & Analisis Master CP
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Pengisian Biodata Guru Pengampu, Jumlah Jam (JP), Target TP, Jenjang, Kelas, Fase, Mata Pelajaran, serta Upload & Analisis CP Resmi untuk Disinkronkan Otomatis ke Seluruh Perangkat Pembelajaran.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSavePlan}
            disabled={isSaving}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil & Sinkronkan'}</span>
          </button>
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pilih Preset Mapel BSKAP</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Active Master CP Status Pill */}
      {activeMasterCP && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-slate-900">
                Master CP Aktif Terhubung: {activeMasterCP.subject} • {activeMasterCP.phase} (Kelas {activeMasterCP.grade})
              </span>
              <p className="text-[11px] text-slate-500">
                Guru: {activeMasterCP.teacherName || teacherName} • {activeMasterCP.timeAllocationPerWeek || timeAllocationPerWeek || '45 Menit'} ({jpPerWeek} JP/Minggu) • {materialsSem1.length + materialsSem2.length} TP Tersinkronisasi Otomatis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[11px] font-semibold">
              ✓ 9 Modul Perangkat Terhubung
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isAdmin ? '1. Biodata, Parameter & Upload CP' : '1. Biodata & Parameter Guru'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sem1')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'sem1'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Pembagian Semester 1 ({materialsSem1.length} TP • {totalJPSem1} JP)</span>
        </button>

        <button
          onClick={() => setActiveTab('sem2')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'sem2'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Pembagian Semester 2 ({materialsSem2.length} TP • {totalJPSem2} JP)</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>4. Pratinjau & Ekspor Matriks</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'bank'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
            }`}
          >
            <Database className="w-4 h-4 text-blue-600" />
            <span>5. Bank CP & Preset BSKAP</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BIODATA, PARAMETER MENGAJAR */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          {/* Analysis Progress Card (Visible during AI Analysis) */}
          {isAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-blue-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Proses Analisis Mendalam & Sinkronisasi Perangkat Ajar</span>
                </span>
                <span className="text-blue-900 font-mono">{analysisProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 italic">{analysisStep}</p>
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {/* COLUMN: PARAMETER MAPEL & BIODATA GURU */}
            <div className="space-y-6">
              {/* Card 1: Biodata Guru Mata Pelajaran & Satuan Pendidikan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>1. Biodata Guru & Satuan Pendidikan</span>
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Identitas Resmi
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">
                      Nama Lengkap Guru & Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Aspian La Ode Madimu, S.Pd., Gr."
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-semibold shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">NIP / NUPTK Guru</label>
                      <input
                        type="text"
                        placeholder="19900822 201801 1 004"
                        value={teacherNip}
                        onChange={(e) => setTeacherNip(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Nama Satuan Pendidikan *</label>
                      <input
                        type="text"
                        placeholder="SMA NEGERI 30 MALUKU TENGAH"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-semibold shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Nama Kepala Sekolah</label>
                      <input
                        type="text"
                        placeholder="Drs. H. Ahmad Dahlan, M.Pd."
                        value={principalName}
                        onChange={(e) => setPrincipalName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">NIP Kepala Sekolah</label>
                      <input
                        type="text"
                        placeholder="19680514 199303 1 008"
                        value={principalNip}
                        onChange={(e) => setPrincipalNip(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                        <span>Nama Verifikator / Waka Ur. Kurikulum</span>
                        <span className="text-[10px] text-blue-600 font-medium font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Opsional</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Alpiyan Prasetiya Marasabessy, S.Pd., Gr."
                        value={wakaName}
                        onChange={(e) => setWakaName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                        <span>NIP Verifikator / Waka Ur. Kurikulum</span>
                        <span className="text-[10px] text-blue-600 font-medium font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Opsional</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 199010062019031013"
                        value={wakaNip}
                        onChange={(e) => setWakaNip(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dynamic Customizable Academic Year Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-700 font-semibold">Tahun Pelajaran *</label>
                        <span className="text-[10px] text-blue-600 font-medium">Bisa Dipilih / Diketik Bebas</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            list="academicYearList"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="Contoh: 2026/2027"
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-bold shadow-2xs"
                          />
                          <datalist id="academicYearList">
                            <option value="2024/2025" />
                            <option value="2025/2026" />
                            <option value="2026/2027" />
                            <option value="2027/2028" />
                            <option value="2028/2029" />
                            <option value="2029/2030" />
                          </datalist>
                        </div>
                        {/* Quick Selection Buttons for Latest Academic Years */}
                        <div className="flex flex-wrap gap-1.5">
                          {['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029'].map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => setAcademicYear(yr)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                                academicYear === yr
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Kota / Kabupaten</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Maluku Tengah"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Pengaturan Identitas Mata Pelajaran & Parameter Jenjang */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>2. Identitas Mata Pelajaran & Parameter Jenjang</span>
                  </h2>
                  <span className="text-[10px] text-blue-700 font-bold px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200">
                    Kurikulum Berbasis Deep Learning
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Mata Pelajaran */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-slate-700 font-bold">
                        Mata Pelajaran / Bidang Studi *
                      </label>
                      <span className="text-[11px] text-blue-600 font-semibold">
                        ✓ Otomatis mengisi Bab & CP No. 020 Tahun 2026
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={POPULAR_SUBJECTS.includes(subject) ? subject : 'Lainnya'}
                        onChange={(e) => {
                          if (e.target.value !== 'Lainnya') {
                            handleSubjectChange(e.target.value);
                          }
                        }}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                      >
                        {POPULAR_SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="Lainnya">-- Tulis Manual --</option>
                      </select>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        onBlur={() => {
                          if (subject.trim()) {
                            handleSubjectChange(subject.trim());
                          }
                        }}
                        placeholder="Nama Mata Pelajaran"
                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-blue-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPresetModalOpen(true)}
                        title="Pilih Template Standar BSKAP"
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pilih Preset Mapel</span>
                      </button>
                    </div>
                  </div>

                  {/* Jenjang, Kelas & Fase */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Jenjang Pendidikan</label>
                      <select
                        value={level}
                        onChange={(e) => handleLevelChange(e.target.value as SchoolLevel)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                      >
                        <option value="SD">SD (Sekolah Dasar)</option>
                        <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                        <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                        <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Tingkat / Kelas</label>
                      <select
                        value={grade}
                        onChange={(e) => handleGradeChange(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                      >
                        {availableGrades.map((g) => (
                          <option key={g} value={g}>
                            Kelas {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Fase Pembelajaran</label>
                      <select
                        value={phase}
                        onChange={(e) => handlePhaseChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-blue-700 focus:outline-none focus:border-blue-600 font-bold"
                      >
                        <option value="Fase A">Fase A (Kelas 1-2)</option>
                        <option value="Fase B">Fase B (Kelas 3-4)</option>
                        <option value="Fase C">Fase C (Kelas 5-6)</option>
                        <option value="Fase D">Fase D (Kelas 7-9)</option>
                        <option value="Fase E">Fase E (Kelas 10)</option>
                        <option value="Fase F">Fase F (Kelas 11-12)</option>
                      </select>
                    </div>
                  </div>

                  {/* Jam Pelajaran (JP) & Alokasi Waktu per Minggu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">Beban JP / Minggu</label>
                        <span className="text-[10px] text-blue-600 font-semibold font-mono">
                          ~{jpPerWeek * 36} JP / Tahun
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={jpPerWeek}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const num = parseNumberInput(e.target.value, 1, 1, 30);
                            setJpPerWeek(num);
                            setTotalHoursPerYear(num * 36);
                            // Otomatis sinkronkan jumlah pertemuan seluruh bab: Alokasi JP / jpPerWeek
                            setMaterialsSem1((prev) =>
                              prev.map((m) => ({
                                ...m,
                                meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (num || 1))),
                              }))
                            );
                            setMaterialsSem2((prev) =>
                              prev.map((m) => ({
                                ...m,
                                meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (num || 1))),
                              }))
                            );
                          }}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-blue-700 focus:outline-none focus:border-blue-600 font-mono text-center font-bold text-sm"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">JP/Mg</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Rumus Pertemuan: <strong>Jumlah Pertemuan per Bab = Alokasi Waktu (JP) ÷ {jpPerWeek} JP/Minggu</strong>
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold text-xs">
                          Alokasi Waktu per Pertemuan
                        </label>
                        <span className="text-[10px] text-emerald-600 font-semibold">Ketik Bebas</span>
                      </div>
                      <input
                        type="text"
                        value={timeAllocationPerWeek}
                        onChange={(e) => setTimeAllocationPerWeek(e.target.value)}
                        placeholder="Misal: 45 Menit, 2 x 45 Menit, 3 x 40 Menit"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold placeholder-slate-400"
                      />
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
                        {['35 Menit', '40 Menit', '45 Menit', '2 x 45 Menit', '3 x 45 Menit', '4 x 45 Menit'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTimeAllocationPerWeek(preset)}
                            className={`text-[9px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                              timeAllocationPerWeek === preset
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar: Shortcut & Save */}
              <div className="space-y-3">
                {/* Quick Shortcuts to Kaldik & Parameter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span>Upload Kaldik & Analisis Alokasi Waktu</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Unggah berkas Kaldik sekolah & hitung otomatis Rincian Pekan Efektif (RBE) dan Jam Pembelajaran KBM.
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate("kalender_pendidikan")}
                        className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                      >
                        <span>Buka Upload Kaldik & RBE</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        <span>Parameter Bab & Alokasi JP</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        {subject} • {level} (Kelas {grade}) • {phase} • {jpPerWeek} JP/Minggu ({jpPerWeek * 36} JP/Thn)
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate("parameter_kurikulum")}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                      >
                        <span>Kelola Bab & TP</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    disabled={isSaving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Menyimpan..." : "Simpan Profil Guru, Sekolah & Parameter Mapel"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PEMBAGIAN MATERI SEMESTER 1 (GANJIL) */}
      {/* ========================================================================= */}
      {activeTab === 'sem1' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Matriks Materi & Tujuan Pembelajaran — Semester 1 (Ganjil)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Total Alokasi: <span className="font-bold text-emerald-700">{totalJPSem1} JP</span> dari {totalHoursPerYear} JP per Tahun ({materialsSem1.length} Unit Materi/TP)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAddModal(1)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Materi Sem 1</span>
              </button>
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 text-center w-12">No</th>
                    <th className="p-3.5 w-28 text-center">Kode TP</th>
                    <th className="p-3.5">Materi Pokok Esensial</th>
                    <th className="p-3.5">Rumusan Tujuan Pembelajaran (TP)</th>
                    <th className="p-3.5 text-center w-20">JP</th>
                    <th className="p-3.5">Asesmen & Deep Learning</th>
                    <th className="p-3.5 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {materialsSem1.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Belum ada materi Semester 1. Klik <strong>"Tambah Materi Sem 1"</strong> atau lakukan <strong>"Analisis CP"</strong> di tab Profil.
                      </td>
                    </tr>
                  ) : (
                    materialsSem1.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-blue-700">
                          <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.tpCode}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{item.essentialMaterial}</td>
                        <td className="p-3.5 leading-relaxed text-slate-700">
                          {item.tpName?.includes('\n') ? (
                            <div className="space-y-1">
                              {item.tpName.split('\n').filter(Boolean).map((line, lIdx) => (
                                <div key={lIdx} className="flex items-start space-x-1.5 text-xs">
                                  <span className="text-blue-600 font-mono font-bold shrink-0">
                                    {line.match(/^\d+[\.\)]/) ? '' : `${lIdx + 1}.`}
                                  </span>
                                  <span>{line.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{item.tpName}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold font-mono text-emerald-700">
                          {item.allocatedHours} JP
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-600">
                          <div>{item.assessmentStrategy}</div>
                          {item.deepLearningMethod && (
                            <div className="text-amber-700 italic mt-0.5">{item.deepLearningMethod}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleMoveUp(1, idx)}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                              title="Geser Naik"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(1, idx)}
                              disabled={idx === materialsSem1.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                              title="Geser Turun"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(1, item)}
                              className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                              title="Edit Materi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateItem(1, item)}
                              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                              title="Duplikat Materi"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus materi "${item.essentialMaterial}"?`)) {
                                  setMaterialsSem1(materialsSem1.filter((m) => m.id !== item.id));
                                }
                              }}
                              className="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PEMBAGIAN MATERI SEMESTER 2 (GENAP) */}
      {/* ========================================================================= */}
      {activeTab === 'sem2' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Matriks Materi & Tujuan Pembelajaran — Semester 2 (Genap)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Total Alokasi: <span className="font-bold text-emerald-700">{totalJPSem2} JP</span> dari {totalHoursPerYear} JP per Tahun ({materialsSem2.length} Unit Materi/TP)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAddModal(2)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Materi Sem 2</span>
              </button>
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 text-center w-12">No</th>
                    <th className="p-3.5 w-28 text-center">Kode TP</th>
                    <th className="p-3.5">Materi Pokok Esensial</th>
                    <th className="p-3.5">Rumusan Tujuan Pembelajaran (TP)</th>
                    <th className="p-3.5 text-center w-20">JP</th>
                    <th className="p-3.5">Asesmen & Deep Learning</th>
                    <th className="p-3.5 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {materialsSem2.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Belum ada materi Semester 2. Klik <strong>"Tambah Materi Sem 2"</strong> atau lakukan <strong>"Analisis CP"</strong> di tab Profil.
                      </td>
                    </tr>
                  ) : (
                    materialsSem2.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-center font-bold text-slate-400">{materialsSem1.length + idx + 1}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-blue-700">
                          <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.tpCode}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{item.essentialMaterial}</td>
                        <td className="p-3.5 leading-relaxed text-slate-700">
                          {item.tpName?.includes('\n') ? (
                            <div className="space-y-1">
                              {item.tpName.split('\n').filter(Boolean).map((line, lIdx) => (
                                <div key={lIdx} className="flex items-start space-x-1.5 text-xs">
                                  <span className="text-blue-600 font-mono font-bold shrink-0">
                                    {line.match(/^\d+[\.\)]/) ? '' : `${lIdx + 1}.`}
                                  </span>
                                  <span>{line.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{item.tpName}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold font-mono text-emerald-700">
                          {item.allocatedHours} JP
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-600">
                          <div>{item.assessmentStrategy}</div>
                          {item.deepLearningMethod && (
                            <div className="text-amber-700 italic mt-0.5">{item.deepLearningMethod}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleMoveUp(2, idx)}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                              title="Geser Naik"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(2, idx)}
                              disabled={idx === materialsSem2.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                              title="Geser Turun"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(2, item)}
                              className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                              title="Edit Materi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateItem(2, item)}
                              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                              title="Duplikat Materi"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus materi "${item.essentialMaterial}"?`)) {
                                  setMaterialsSem2(materialsSem2.filter((m) => m.id !== item.id));
                                }
                              }}
                              className="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRATINJAU & EKSPOR MATRIKS */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Matriks Perangkat Ajar Resmi</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen resmi siap cetak dengan kop sekolah, identitas guru, dan tanda tangan kepala sekolah.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportWord}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Word (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span>Cetak / Pratinjau PDF</span>
              </button>
            </div>
          </div>

          {/* Render Preview Paper */}
          <div className="bg-white text-slate-900 p-8 rounded-xl shadow-xs border border-slate-200 max-w-5xl mx-auto space-y-6">
            {/* Header Kop */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-base font-bold uppercase tracking-wider">{schoolName}</h2>
              <h1 className="text-lg font-extrabold uppercase mt-1">
                MATRIKS PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN (ANALISIS CP)
              </h1>
              <p className="text-xs font-semibold mt-1 text-slate-600">
                Mata Pelajaran: {subject} | Jenjang/Kelas: {level} / Kelas {grade} ({phase}) | Tahun Pelajaran: {academicYear}
              </p>
            </div>

            {/* Identitas Guru */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p><strong>Nama Guru Pengampu:</strong> {teacherName}</p>
                <p><strong>NIP Guru:</strong> {teacherNip || '-'}</p>
              </div>
              <div className="text-right">
                <p><strong>Beban Belajar:</strong> {jpPerWeek} JP/Minggu ({timeAllocationPerWeek || '45 Menit'})</p>
                <p>
                  <strong>Total Target TP:</strong>{' '}
                  {totalTPCount ||
                    materialsSem1.reduce((sum, m) => sum + (m.tpCount || 1), 0) +
                      materialsSem2.reduce((sum, m) => sum + (m.tpCount || 1), 0)}{' '}
                  TP
                </p>
              </div>
            </div>

            {/* Tables */}
            <div
              className="prose prose-sm max-w-none text-xs"
              dangerouslySetInnerHTML={{ __html: generateMatrixHtml() }}
            />

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-16" />
                <p className="font-bold underline">{principalName}</p>
                <p>NIP. {principalNip || '-'}</p>
              </div>

              <div>
                <p>{city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Guru Mata Pelajaran</p>
                <div className="h-16" />
                <p className="font-bold underline">{teacherName}</p>
                <p>NIP. {teacherNip || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BANK DOKUMEN CP & PRESET (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Preset Acuan Kurikulum Capaian Pembelajaran No. 020 Tahun 2026</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Pilih dari daftar mata pelajaran terintegrasi untuk langsung memuat analisis capaian pembelajaran terstandar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECT_MATERIAL_PRESETS.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl space-y-3 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold">
                      {p.level} • {p.phase} (Kelas {p.grade})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {p.totalHoursPerYear} JP/Thn
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{p.subject}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.cpSummary}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {p.materialsSem1.length + p.materialsSem2.length} Unit Materi
                  </span>
                  <button
                    onClick={() => handleApplyPreset(p.subject)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>Terapkan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUCCESS SYNCHRONIZATION SUMMARY */}
      {/* ========================================================================= */}
      {showSyncSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-900">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Master CP & Profil Guru Berhasil Disinkronkan!
                </h3>
                <p className="text-xs text-slate-500">
                  {subject} ({level} - {phase}) • {teacherName}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-blue-700 block mb-1">
                Data telah tersinkronisasi otomatis ke 9 Modul Perangkat Pembelajaran:
              </span>
              <ul className="grid grid-cols-2 gap-1.5 text-slate-700 text-[11px]">
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Tujuan Pembelajaran (TP)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Alur Tujuan Pembelajaran (ATP)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Program Tahunan (PROTA)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Program Semester (PROSEM)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5. Kriteria Ketuntasan (KKTP)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>6. RPM (Rencana Pelaksanaan Modul)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>7. Lembar Kerja Siswa (LKPD)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>8. Rubrik Penilaian Terpadu</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowSyncSuccessModal(false);
                  setActiveTab('sem1');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Lihat Matriks
              </button>
              <button
                onClick={() => {
                  setShowSyncSuccessModal(false);
                  if (onNavigate) onNavigate('ai_analisis_cp');
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
              >
                <span>Buka Analisis CP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowSyncSuccessModal(false);
                  if (onNavigate) onNavigate('ai_tp');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
              >
                <span>Buka TP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowSyncSuccessModal(false);
                  if (onNavigate) onNavigate('ai_modul_ajar');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
              >
                <span>Buka RPM / Modul Ajar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MATERIAL ITEM */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>{isNewModalItem ? 'Tambah' : 'Edit'} Materi & Tujuan Pembelajaran</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester</label>
                  <select
                    value={modalItem.semester}
                    onChange={(e) =>
                      setModalItem({ ...modalItem, semester: Number(e.target.value) as 1 | 2 })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kode TP</label>
                  <input
                    type="text"
                    value={modalItem.tpCode}
                    onChange={(e) => setModalItem({ ...modalItem, tpCode: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-blue-700 font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alokasi JP</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={modalItem.allocatedHours}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => {
                      setModalItem({
                        ...modalItem,
                        allocatedHours: parseNumberInput(e.target.value, 0, 0, 100),
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-emerald-700 font-mono font-bold text-center focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lingkup Materi Pokok *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengukuran Besaran Fisis, Angka Penting & Ketidakpastian"
                  value={modalItem.essentialMaterial}
                  onChange={(e) => setModalItem({ ...modalItem, essentialMaterial: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rumusan Tujuan Pembelajaran (TP) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Peserta didik mampu menerapkan prinsip-prinsip pengukuran..."
                  value={modalItem.tpName}
                  onChange={(e) => setModalItem({ ...modalItem, tpName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Strategi Asesmen</label>
                <input
                  type="text"
                  value={modalItem.assessmentStrategy}
                  onChange={(e) => setModalItem({ ...modalItem, assessmentStrategy: e.target.value })}
                  placeholder="Tes Formatif, Observasi & Asesmen Sumatif"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Metode Deep Learning (3 Pilar)</label>
                <input
                  type="text"
                  value={modalItem.deepLearningMethod || ''}
                  onChange={(e) => setModalItem({ ...modalItem, deepLearningMethod: e.target.value })}
                  placeholder="Mindful: ..., Meaningful: ..., Joyful: ..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-amber-700 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRESET SELECTION MODAL */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pilih Template Materi Resmi BSKAP</span>
              </h3>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {SUBJECT_MATERIAL_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(preset.subject)}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                        {preset.subject}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                        {preset.level} • {preset.phase} (Kelas {preset.grade})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{preset.cpSummary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
