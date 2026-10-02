import React, { useState, useEffect } from 'react';
import {
  BookOpen,
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
  Zap,
  Calculator,
  FolderSync,
} from 'lucide-react';
import {
  SchoolLevel,
  CPMaterialItem,
  CPDistributionPlan,
  CPReference,
  ActiveMasterCPData,
  AIDocument,
} from '../types';
import { StorageService, INITIAL_CP_DISTRIBUTIONS } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_MATERIAL_PRESETS, SubjectPreset, getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import { CustomFormatSelector, CustomFormatConfig } from '../components/CustomFormatSelector';
import { CPUploaderAndAnalyzer } from '../components/CPUploaderAndAnalyzer';
import { generateExpertCurriculumDocument } from '../lib/curriculumEngine';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';
import { AMDLogo } from '../components/AMDLogo';

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

interface AnalisisCPDistributionViewProps {
  initialTab?: 'upload' | 'sem1' | 'sem2' | 'preview' | 'bank' | 'format_sekolah';
  onNavigate?: (tab: string, subType?: string) => void;
}

export const AnalisisCPDistributionView: React.FC<AnalisisCPDistributionViewProps> = ({
  initialTab = 'upload',
  onNavigate,
}) => {
  const [plans, setPlans] = useState<CPDistributionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'sem1' | 'sem2' | 'preview' | 'bank' | 'format_sekolah'>(initialTab);
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() => StorageService.getActiveMasterCP());
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Perangkat Sesuai Format Sekolah Workspace States
  const [selectedPerangkatDocType, setSelectedPerangkatDocType] = useState<string>('modul_ajar');
  const [selectedPerangkatSemester, setSelectedPerangkatSemester] = useState<'Semester 1' | 'Semester 2' | '1 Tahun'>('Semester 1');
  const [selectedPerangkatTopic, setSelectedPerangkatTopic] = useState<string>('');
  const [selectedPerangkatModel, setSelectedPerangkatModel] = useState<string>('Problem-Based Learning (PBL)');
  const [perangkatDocContent, setPerangkatDocContent] = useState<string>('');
  const [isGeneratingPerangkatDoc, setIsGeneratingPerangkatDoc] = useState<boolean>(false);
  const [copiedPerangkatDoc, setCopiedPerangkatDoc] = useState<boolean>(false);

  // Reference CP bank
  const [cpReferences, setCpReferences] = useState<CPReference[]>([]);

  // Current Working Form State
  const [teacherName, setTeacherName] = useState<string>('Aspian La Ode Madimu, S.Pd. Gr');
  const [teacherNip, setTeacherNip] = useState<string>('19900822 201801 1 004');
  const [subject, setSubject] = useState<string>('Fisika');
  const [schoolName, setSchoolName] = useState<string>('SMA NEGERI 30 MALUKU TENGAH');
  const [level, setLevel] = useState<SchoolLevel>('SMA');
  const [grade, setGrade] = useState<number | string>(10);
  const [phase, setPhase] = useState<string>('Fase E');
  const [academicYear, setAcademicYear] = useState<string>('2025/2026');
  const [totalHoursPerYear, setTotalHoursPerYear] = useState<number>(108);
  const [jpPerWeek, setJpPerWeek] = useState<number>(3);
  const [totalTPCount, setTotalTPCount] = useState<number>(6);
  const [cpText, setCpText] = useState<string>(
    'Peserta didik mampu mengamati, menyelidiki dan menjelaskan fenomena sehari-hari yang berkaitan dengan pengukuran besaran fisika, energi terbarukan, pemanasan global, dan pemanfaatan teknologi ramah lingkungan dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful).'
  );
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Custom School Format State (PDF, Word, JPG, custom notes, checkbox)
  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>({
    useCustomFormat: false,
    formatFile: null,
    customFormatNotes: '',
  });

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

  // Inline Quick Add State for Semester 1 and Semester 2 tab toolbars
  const [inlineMaterialSem1, setInlineMaterialSem1] = useState<string>('');
  const [inlineJPSem1, setInlineJPSem1] = useState<number>(18);
  const [inlineMaterialSem2, setInlineMaterialSem2] = useState<string>('');
  const [inlineJPSem2, setInlineJPSem2] = useState<number>(18);

  useEffect(() => {
    loadInitialData();

    const handleSyncEvent = () => {
      loadInitialData();
    };

    window.addEventListener('curriculum-parameters-synced', handleSyncEvent);
    window.addEventListener('master-cp-updated', handleSyncEvent);
    window.addEventListener('school-profile-updated', handleSyncEvent);

    return () => {
      window.removeEventListener('curriculum-parameters-synced', handleSyncEvent);
      window.removeEventListener('master-cp-updated', handleSyncEvent);
      window.removeEventListener('school-profile-updated', handleSyncEvent);
    };
  }, []);

  const loadInitialData = () => {
    const loadedPlans = StorageService.getCPDistributions();
    const loadedCpRefs = StorageService.getCPReferences();
    const schoolProfile = StorageService.getSchoolProfile();
    const activeMaster = StorageService.getActiveMasterCP();

    setPlans(loadedPlans);
    setCpReferences(loadedCpRefs);
    setActiveMasterCP(activeMaster);

    if (activeMaster) {
      setSelectedPlanId(activeMaster.id || 'master-plan');
      setTeacherName(activeMaster.teacherName || schoolProfile?.teacherName || 'Guru Pengampu');
      setTeacherNip((activeMaster as any).teacherNip || schoolProfile?.teacherNip || '');
      setSubject(activeMaster.subject || schoolProfile?.subject || 'Fisika');
      setSchoolName(activeMaster.schoolName || schoolProfile?.schoolName || 'Satuan Pendidikan');
      setLevel(activeMaster.level || (schoolProfile?.level as SchoolLevel) || 'SMA');
      setGrade(activeMaster.grade || schoolProfile?.grade || 10);
      setPhase(activeMaster.phase || schoolProfile?.phase || 'Fase E');
      setAcademicYear(activeMaster.academicYear || schoolProfile?.academicYear || '2026/2027');
      setTotalHoursPerYear(activeMaster.totalHoursPerYear || 108);
      setJpPerWeek(activeMaster.jpPerWeek || Number(schoolProfile?.jpPerWeek) || 3);
      setTotalTPCount((activeMaster.materialsSem1?.length || 0) + (activeMaster.materialsSem2?.length || 0));
      setCpText(activeMaster.cpText || schoolProfile?.cpText || '');
      setMaterialsSem1(activeMaster.materialsSem1 || []);
      setMaterialsSem2(activeMaster.materialsSem2 || []);
    } else if (loadedPlans.length > 0) {
      loadPlanIntoState(loadedPlans[0]);
    } else if (INITIAL_CP_DISTRIBUTIONS.length > 0) {
      loadPlanIntoState(INITIAL_CP_DISTRIBUTIONS[0]);
    } else if (schoolProfile) {
      setSchoolName(schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH');
      if (schoolProfile.teacherName) setTeacherName(schoolProfile.teacherName);
      if (schoolProfile.teacherNip) setTeacherNip(schoolProfile.teacherNip);
      if (schoolProfile.subject) setSubject(schoolProfile.subject);
      if (schoolProfile.level) setLevel(schoolProfile.level as SchoolLevel);
      if (schoolProfile.grade) setGrade(Number(schoolProfile.grade));
      if (schoolProfile.phase) setPhase(schoolProfile.phase);
      if (schoolProfile.academicYear) setAcademicYear(schoolProfile.academicYear);
      if (schoolProfile.jpPerWeek) setJpPerWeek(Number(schoolProfile.jpPerWeek));
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
    setJpPerWeek(plan.jpPerWeek || Math.round(plan.totalHoursPerYear / 36));
    setTotalTPCount(plan.totalTPCount || plan.materialsSem1.length + plan.materialsSem2.length);
    setCpText(plan.cpText || '');
    setMaterialsSem1(plan.materialsSem1 || []);
    setMaterialsSem2(plan.materialsSem2 || []);
  };

  const showNotif = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Automatically update phase and sync materials when level or grade changes
  const handleSyncGradeMaterials = (targetGradeNum?: number, targetLevelStr?: SchoolLevel) => {
    const tgtGrade = targetGradeNum !== undefined ? targetGradeNum : (Number(grade) || 10);
    const tgtLevel = (targetLevelStr || level || 'SMA') as 'SMA' | 'SMP' | 'SD' | 'SMK';
    const preset = getSubjectPresetByGrade(subject || 'Fisika', tgtLevel, tgtGrade);
    
    setPhase(preset.phase);
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
    showNotif(`Bab & Lingkup Materi berhasil disinkronkan otomatis untuk Kelas ${tgtGrade} (${preset.phase}) berdasarkan analisis Capaian Pembelajaran (CP)!`);
  };

  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    let newPhase = 'Fase E';
    if (level === 'SD') {
      if (newGrade <= 2) newPhase = 'Fase A';
      else if (newGrade <= 4) newPhase = 'Fase B';
      else newPhase = 'Fase C';
    } else if (level === 'SMP') {
      newPhase = 'Fase D';
    } else {
      if (newGrade === 10) newPhase = 'Fase E';
      else newPhase = 'Fase F';
    }
    setPhase(newPhase);

    // If materials are empty, or user just selected a new grade, auto sync grade materials
    if (materialsSem1.length === 0 && materialsSem2.length === 0) {
      handleSyncGradeMaterials(newGrade, level);
    }
  };

  // Handle Master CP Analysis Complete from CPUploaderAndAnalyzer
  const handleMasterAnalysisComplete = (masterData: ActiveMasterCPData) => {
    setActiveMasterCP(masterData);
    if (masterData.teacherName) setTeacherName(masterData.teacherName);
    setSubject(masterData.subject);
    setLevel(masterData.level);
    setGrade(masterData.grade);
    setPhase(masterData.phase);
    setTotalHoursPerYear(masterData.totalHoursPerYear);
    setJpPerWeek(masterData.jpPerWeek);
    if (masterData.cpText) setCpText(masterData.cpText);
    setMaterialsSem1(masterData.materialsSem1 || []);
    setMaterialsSem2(masterData.materialsSem2 || []);

    // Create and save CPDistributionPlan
    const sem1Hours = (masterData.materialsSem1 || []).reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
    const sem2Hours = (masterData.materialsSem2 || []).reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);

    const newPlan: CPDistributionPlan = {
      id: masterData.id || `cp-plan-${Date.now()}`,
      teacherName: masterData.teacherName || teacherName,
      teacherNip,
      subject: masterData.subject,
      schoolName: masterData.schoolName || schoolName,
      level: masterData.level,
      grade: masterData.grade,
      phase: masterData.phase,
      semesterOption: 'all',
      academicYear: masterData.academicYear || '2025/2026',
      totalHoursPerYear: masterData.totalHoursPerYear,
      totalHoursSem1: sem1Hours || Math.floor(masterData.totalHoursPerYear / 2),
      totalHoursSem2: sem2Hours || Math.ceil(masterData.totalHoursPerYear / 2),
      jpPerWeek: masterData.jpPerWeek,
      totalTPCount: (masterData.materialsSem1?.length || 3) + (masterData.materialsSem2?.length || 3),
      cpText: masterData.cpText,
      materialsSem1: masterData.materialsSem1 || [],
      materialsSem2: masterData.materialsSem2 || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveCPDistribution(newPlan);
    setPlans(StorageService.getCPDistributions());
    setSelectedPlanId(newPlan.id);
    showNotif(`Dokumen CP "${masterData.subject} ${masterData.phase}" berhasil dianalisis & disinkronkan ke seluruh perangkat ajar!`);
  };

  // Apply active master CP to state
  const handleApplyMasterCPToState = () => {
    if (!activeMasterCP) return;
    setSubject(activeMasterCP.subject);
    setLevel(activeMasterCP.level);
    setGrade(activeMasterCP.grade);
    setPhase(activeMasterCP.phase);
    setTotalHoursPerYear(activeMasterCP.totalHoursPerYear);
    setJpPerWeek(activeMasterCP.jpPerWeek);
    if (activeMasterCP.cpText) setCpText(activeMasterCP.cpText);
    if (activeMasterCP.materialsSem1 && activeMasterCP.materialsSem1.length > 0) {
      setMaterialsSem1(activeMasterCP.materialsSem1);
    }
    if (activeMasterCP.materialsSem2 && activeMasterCP.materialsSem2.length > 0) {
      setMaterialsSem2(activeMasterCP.materialsSem2);
    }
    showNotif(`Data Master CP "${activeMasterCP.subject} ${activeMasterCP.phase}" berhasil dimuat ke editor.`);
  };

  // Select reference CP
  const handleSelectCPRef = (ref: CPReference) => {
    setSubject(ref.subject);
    setLevel(ref.level);
    if (ref.grade) handleGradeChange(ref.grade);
    setPhase(ref.phase);
    if (ref.cpText) setCpText(ref.cpText);
    showNotif(`Capaian Pembelajaran "${ref.subject} ${ref.phase}" berhasil dimuat dari Bank CP.`);
    setActiveTab('sem1');
  };

  // Call AI to analyze CP & distribute materials
  const handleRunAIAnalysis = async () => {
    if (!subject.trim()) {
      alert('Nama Mata Pelajaran wajib diisi.');
      return;
    }

    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/ai/analyze-cp-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName,
          teacherNip,
          subject,
          level,
          grade,
          phase,
          totalHoursPerYear,
          jpPerWeek,
          totalTPCount,
          cpText,
          customPrompt,
          useCustomFormat: customFormatConfig.useCustomFormat,
          customFormatNotes: customFormatConfig.customFormatNotes,
          customFormatFile: customFormatConfig.formatFile,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memproses pembagian materi dengan sistem.');
      }

      const data = result.data;
      if (data) {
        const sem1WithIds: CPMaterialItem[] = (data.materialsSem1 || []).map((m: any, idx: number) => ({
          ...m,
          id: `sem1-${Date.now()}-${idx}`,
          semester: 1,
          orderNumber: m.orderNumber || idx + 1,
        }));

        const sem2WithIds: CPMaterialItem[] = (data.materialsSem2 || []).map((m: any, idx: number) => ({
          ...m,
          id: `sem2-${Date.now()}-${idx}`,
          semester: 2,
          orderNumber: m.orderNumber || sem1WithIds.length + idx + 1,
        }));

        setMaterialsSem1(sem1WithIds);
        setMaterialsSem2(sem2WithIds);

        // Auto Save to storage
        const newPlanId = selectedPlanId || `cp-dist-${Date.now()}`;
        const newPlan: CPDistributionPlan = {
          id: newPlanId,
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
          totalTPCount: sem1WithIds.length + sem2WithIds.length,
          jpPerWeek,
          cpText,
          materialsSem1: sem1WithIds,
          materialsSem2: sem2WithIds,
          totalHoursSem1: sem1WithIds.reduce((sum, item) => sum + (Number(item.allocatedHours) || 0), 0),
          totalHoursSem2: sem2WithIds.reduce((sum, item) => sum + (Number(item.allocatedHours) || 0), 0),
          createdAt: new Date().toISOString().substring(0, 16),
          updatedAt: new Date().toISOString().substring(0, 16),
          authorEmail: 'aspianmadimu22@guru.sma.belajar.id',
        };

        StorageService.saveCPDistribution(newPlan);
        const updatedPlans = StorageService.getCPDistributions();
        setPlans(updatedPlans);
        setSelectedPlanId(newPlan.id);

        showNotif('Analisis CP & Pembagian Materi Semester 1 & 2 Berhasil Disusun Otomatis!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showNotif(`Gagal: ${err.message}`, 'error');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Create clean manual distribution plan
  const handleCreateNewManual = () => {
    const sem1Default: CPMaterialItem[] = [
      {
        id: `sem1-${Date.now()}-1`,
        semester: 1,
        orderNumber: 1,
        tpCode: `TP.${grade}.1`,
        tpName: `Menjelaskan konsep dasar ${subject} dan aplikasinya.`,
        essentialMaterial: `Materi Pokok 1 ${subject}`,
        elementName: 'Pemahaman Konsep',
        allocatedHours: 18,
        assessmentStrategy: 'Tes Formatif & Kinerja',
        deepLearningMethod: 'Mindful Learning',
      },
    ];

    const sem2Default: CPMaterialItem[] = [
      {
        id: `sem2-${Date.now()}-1`,
        semester: 2,
        orderNumber: 2,
        tpCode: `TP.${grade}.2`,
        tpName: `Menerapkan dan mengkreasikan solusi berbasis ${subject}.`,
        essentialMaterial: `Materi Pokok 2 ${subject}`,
        elementName: 'Keterampilan Proses',
        allocatedHours: 18,
        assessmentStrategy: 'Penilaian Proyek Sumatif',
        deepLearningMethod: 'Meaningful & Joyful Learning',
      },
    ];

    const newId = `cp-dist-${Date.now()}`;
    const newPlan: CPDistributionPlan = {
      id: newId,
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
      totalTPCount: 2,
      jpPerWeek,
      cpText,
      materialsSem1: sem1Default,
      materialsSem2: sem2Default,
      totalHoursSem1: 18,
      totalHoursSem2: 18,
      createdAt: new Date().toISOString().substring(0, 16),
      updatedAt: new Date().toISOString().substring(0, 16),
    };

    setMaterialsSem1(sem1Default);
    setMaterialsSem2(sem2Default);
    StorageService.saveCPDistribution(newPlan);
    const updated = StorageService.getCPDistributions();
    setPlans(updated);
    setSelectedPlanId(newId);
    showNotif('Draf Pembagian Materi baru siap diisi secara manual.');
  };

  // Auto-distribute total semester hours equally across BABs and calculate meeting count = (Allocated JP / JP per Week)
  const handleAutoDistributeChaptersByJpPerWeek = (sem: 1 | 2, customTargetHours?: number) => {
    const list = sem === 1 ? materialsSem1 : materialsSem2;
    if (list.length === 0) return;
    const numBab = list.length;
    const targetHours = customTargetHours !== undefined && customTargetHours > 0
      ? customTargetHours
      : (sem === 1 ? (totalJPSem1 > 0 ? totalJPSem1 : 50) : (totalJPSem2 > 0 ? totalJPSem2 : 50));
    
    const baseHours = Math.floor(targetHours / numBab);
    const remainder = targetHours % numBab;

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
    showNotif(
      `Alokasi ${targetHours} JP berhasil dibagi rata ke ${numBab} BAB (masing-masing ~${baseHours} JP). Jumlah Pertemuan: ${baseHours} JP ÷ ${jpPerWeek} JP/Mg = ${calculatedMeetings} kali pertemuan per bab.`
    );
  };

  // Save current changes
  const handleSavePlan = () => {
    setIsSaving(true);
    const planId = selectedPlanId || `cp-dist-${Date.now()}`;
    const totalSem1 = materialsSem1.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
    const totalSem2 = materialsSem2.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);

    const planToSave: CPDistributionPlan = {
      id: planId,
      teacherName,
      teacherNip,
      subject,
      schoolName,
      level,
      grade,
      phase,
      academicYear,
      semesterOption: 'all',
      totalHoursPerYear: totalSem1 + totalSem2,
      totalTPCount: materialsSem1.length + materialsSem2.length,
      jpPerWeek,
      cpText,
      materialsSem1,
      materialsSem2,
      totalHoursSem1: totalSem1,
      totalHoursSem2: totalSem2,
      createdAt: new Date().toISOString().substring(0, 16),
      updatedAt: new Date().toISOString().substring(0, 16),
      authorEmail: 'aspianmadimu22@guru.sma.belajar.id',
    };

    StorageService.saveCPDistribution(planToSave);
    const updated = StorageService.getCPDistributions();
    setPlans(updated);
    setSelectedPlanId(planId);

    // Synchronize to Active Master CP & School Profile
    const updatedMaster: ActiveMasterCPData = {
      id: `master-${planId}`,
      fileName: `CP_${subject}_${phase}_Kls${grade}.docx`,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 45200,
      uploadedAt: new Date().toISOString().substring(0, 16),
      level,
      grade: Number(grade) || 10,
      phase,
      subject,
      teacherName,
      teacherNip,
      schoolName,
      academicYear,
      totalHoursPerYear: totalSem1 + totalSem2,
      jpPerWeek: Number(jpPerWeek) || 3,
      timeAllocationPerWeek: level === 'SD' ? '35 Menit' : level === 'SMP' ? '40 Menit' : '45 Menit',
      cpText,
      materialsSem1,
      materialsSem2,
      elements: activeMasterCP?.elements || [
        {
          name: 'Pemahaman Konsep',
          description: `Peserta didik mampu memahami konsep fundamental ${subject} serta mengaitkannya dengan fenomena faktual sehari-hari dengan pendekatan Deep Learning.`,
          competencies: ['Mengamati', 'Menjelaskan', 'Menganalisis'],
          essentialMaterials: materialsSem1.concat(materialsSem2).map((m) => m.essentialMaterial),
        },
        {
          name: 'Keterampilan Proses',
          description: `Peserta didik mampu merencanakan dan melaksanakan penyelidikan serta mengomunikasikan gagasan secara kolaboratif 6C.`,
          competencies: ['Merancang', 'Mengumpulkan Data', 'Menyimpulkan'],
          essentialMaterials: ['Inkuiri Terbimbing', 'Proyek Saintifik'],
        }
      ],
      executiveSummary: `Analisis CP ${subject} ${level} (${phase} Kelas ${grade}) oleh Guru ${teacherName} berhasil disinkronkan ke seluruh perangkat ajar. Terbagi atas ${materialsSem1.length} TP di Semester 1 (${totalSem1} JP) dan ${materialsSem2.length} TP di Semester 2 (${totalSem2} JP) dengan pendekatan Deep Learning 3 Pilar.`,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };
    StorageService.setActiveMasterCP(updatedMaster);
    setActiveMasterCP(updatedMaster);

    const currentProf = StorageService.getSchoolProfile();
    StorageService.saveSchoolProfile({
      ...currentProf,
      teacherName: teacherName || currentProf.teacherName,
      teacherNip: teacherNip || currentProf.teacherNip,
      schoolName: schoolName || currentProf.schoolName,
      academicYear: academicYear || currentProf.academicYear,
      subject: subject || currentProf.subject,
      level: level || currentProf.level,
      grade: Number(grade) || currentProf.grade,
      phase: phase || currentProf.phase,
      jpPerWeek: Number(jpPerWeek) || currentProf.jpPerWeek,
      totalHoursPerYear: totalSem1 + totalSem2,
      cpText: cpText || currentProf.cpText,
    });

    setIsSaving(false);
    showNotif('Analisis & Distribusi CP berhasil disimpan dan disinkronkan ke Profil Guru & seluruh Perangkat Ajar!');
  };

  // Add Item to Semester (Simple default)
  const handleAddMaterialItem = (semester: 1 | 2) => {
    handleOpenAddModal(semester);
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
        // Moved semester during modal edit
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

  // Move Up in list
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

  // Move Down in list
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

  // Clear semester
  const handleClearSemester = (semester: 1 | 2) => {
    if (window.confirm(`Yakin ingin mengosongkan seluruh daftar materi Semester ${semester}? Anda dapat menambahkan materi baru atau memilih preset kapan saja.`)) {
      if (semester === 1) setMaterialsSem1([]);
      else setMaterialsSem2([]);
      showNotif(`Daftar materi Semester ${semester} telah dikosongkan.`, 'info');
    }
  };

  // Process Batch Paste Text
  const handleProcessBatchPaste = () => {
    if (!batchText.trim()) {
      alert('Silakan tempel daftar materi terlebih dahulu.');
      return;
    }

    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const currentList = batchSemester === 1 ? materialsSem1 : materialsSem2;
    const startIndex = currentList.length;

    const newItems: CPMaterialItem[] = lines.map((line, idx) => {
      const cleaned = line.replace(/^([0-9]+[\.\)]|\-|\*|[a-zA-Z][\.\)])\s*/, '').trim();
      const orderNum = batchSemester === 1 ? startIndex + idx + 1 : materialsSem1.length + startIndex + idx + 1;
      return {
        id: `mat-${batchSemester}-${Date.now()}-${idx}`,
        semester: batchSemester,
        orderNumber: orderNum,
        tpCode: `TP.${grade}.${batchSemester}.${startIndex + idx + 1}`,
        tpName: `Peserta didik mampu memahami, menganalisis, dan menerapkan ${cleaned} dalam pemecahan masalah kontekstual.`,
        essentialMaterial: cleaned,
        elementName: 'Pemahaman Konsep & Keterampilan Proses',
        allocatedHours: Number(batchHoursPerItem) || 18,
        assessmentStrategy: batchAssessment || 'Tes Formatif & Kinerja Proyek',
        deepLearningMethod: 'Mindful & Meaningful Learning: Diskusi kritis dan penyelesaian kasus nyata.',
      };
    });

    if (batchSemester === 1) {
      setMaterialsSem1([...materialsSem1, ...newItems]);
    } else {
      setMaterialsSem2([...materialsSem2, ...newItems]);
    }

    setIsBatchModalOpen(false);
    setBatchText('');
    showNotif(`${newItems.length} materi berhasil diimpor ke Semester ${batchSemester}!`);
  };

  // Quick Add Single Material (inline in tab)
  const handleQuickAddManual = (
    targetSemester: 1 | 2,
    materialName?: string,
    jpValue?: number,
    customTP?: string
  ) => {
    const name = (materialName || '').trim();
    if (!name) {
      alert('Nama / Lingkup Materi Pokok yang diinginkan wajib diisi.');
      return;
    }

    const currentList = targetSemester === 1 ? materialsSem1 : materialsSem2;
    const orderNum = targetSemester === 1 ? currentList.length + 1 : materialsSem1.length + currentList.length + 1;
    const tpCode = `TP.${grade}.${targetSemester}.${currentList.length + 1}`;
    const hours = Number(jpValue) || 18;
    const tpDescription =
      customTP?.trim() ||
      `Peserta didik mampu memahami, menganalisis, dan menerapkan materi ${name} secara kontekstual dan bermakna.`;

    const newItem: CPMaterialItem = {
      id: `mat-${targetSemester}-${Date.now()}`,
      semester: targetSemester,
      orderNumber: orderNum,
      tpCode,
      tpName: tpDescription,
      essentialMaterial: name,
      elementName: 'Pemahaman Konsep & Keterampilan Proses',
      allocatedHours: hours,
      assessmentStrategy: 'Tes Formatif, Observasi & Asesmen Sumatif Lingkup Materi',
      deepLearningMethod:
        'Mindful: Observasi kesadaran konsep, Meaningful: Studi kasus kontekstual nyata, Joyful: Aktivitas belajar aktif & kolaboratif.',
    };

    if (targetSemester === 1) {
      setMaterialsSem1([...materialsSem1, newItem]);
      setInlineMaterialSem1('');
    } else {
      setMaterialsSem2([...materialsSem2, newItem]);
      setInlineMaterialSem2('');
    }

    showNotif(`Materi "${name}" (${hours} JP) berhasil ditambahkan ke Semester ${targetSemester}!`);
  };

  // Apply Subject Preset
  const handleApplySubjectPreset = (preset: SubjectPreset) => {
    setSubject(preset.subject);
    setLevel(preset.level);
    setGrade(preset.grade);
    setPhase(preset.phase);
    setTotalHoursPerYear(preset.totalHoursPerYear);
    setCpText(preset.cpSummary);
    
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
    setIsPresetModalOpen(false);
    showNotif(`Template standar materi ${preset.subject} (${preset.phase}) berhasil dimuat untuk Semester 1 & Semester 2!`);
  };

  // Update item with bidirectional sync between allocatedHours and meetingCount
  const handleUpdateItem = (semester: 1 | 2, id: string, field: keyof CPMaterialItem, value: any) => {
    const updateFn = (m: CPMaterialItem) => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      if (field === 'allocatedHours') {
        const hours = Number(value) || 0;
        updated.meetingCount = Math.max(1, Math.round(hours / (jpPerWeek || 1)));
      } else if (field === 'meetingCount') {
        const meetings = Number(value) || 1;
        updated.allocatedHours = meetings * (jpPerWeek || 1);
      }
      return updated;
    };

    if (semester === 1) {
      setMaterialsSem1(materialsSem1.map(updateFn));
    } else {
      setMaterialsSem2(materialsSem2.map(updateFn));
    }
  };

  // Delete item
  const handleDeleteItem = (semester: 1 | 2, id: string) => {
    if (semester === 1) {
      setMaterialsSem1(materialsSem1.filter((m) => m.id !== id));
    } else {
      setMaterialsSem2(materialsSem2.filter((m) => m.id !== id));
    }
  };

  // Move item between semesters
  const handleMoveSemester = (item: CPMaterialItem, targetSemester: 1 | 2) => {
    if (targetSemester === 1) {
      setMaterialsSem2(materialsSem2.filter((m) => m.id !== item.id));
      setMaterialsSem1([...materialsSem1, { ...item, semester: 1 }]);
      showNotif(`Materi "${item.essentialMaterial}" dipindahkan ke Semester 1.`);
    } else {
      setMaterialsSem1(materialsSem1.filter((m) => m.id !== item.id));
      setMaterialsSem2([...materialsSem2, { ...item, semester: 2 }]);
      showNotif(`Materi "${item.essentialMaterial}" dipindahkan ke Semester 2.`);
    }
  };

  // Export Matrix to Excel
  const handleExportExcel = () => {
    const rows = [
      ...materialsSem1.map((m) => ({
        Semester: 'Semester 1 (Ganjil)',
        No: m.orderNumber,
        'Kode TP': m.tpCode,
        'Tujuan Pembelajaran (TP)': m.tpName,
        'Materi Pokok Esensial': m.essentialMaterial,
        Elemen: m.elementName || '-',
        'Alokasi JP': m.allocatedHours,
        'Asesmen & Evaluasi': m.assessmentStrategy,
        'Pendekatan Deep Learning': m.deepLearningMethod || '-',
      })),
      ...materialsSem2.map((m) => ({
        Semester: 'Semester 2 (Genap)',
        No: m.orderNumber,
        'Kode TP': m.tpCode,
        'Tujuan Pembelajaran (TP)': m.tpName,
        'Materi Pokok Esensial': m.essentialMaterial,
        Elemen: m.elementName || '-',
        'Alokasi JP': m.allocatedHours,
        'Asesmen & Evaluasi': m.assessmentStrategy,
        'Pendekatan Deep Learning': m.deepLearningMethod || '-',
      })),
    ];
    ExportService.exportToExcel(
      rows,
      `Pembagian_Materi_CP_${subject}_Kelas_${grade}`,
      'Distribusi CP',
      {
        schoolName,
        docTitle: `MATRIKS PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN (${subject} KELAS ${grade})`,
        academicYear,
        teacherName,
      }
    );
  };

  const triggerGeneratePerangkatDoc = (
    docType: string = selectedPerangkatDocType,
    sem: 'Semester 1' | 'Semester 2' | '1 Tahun' | 'Ganjil' | 'Genap' = selectedPerangkatSemester
  ) => {
    setIsGeneratingPerangkatDoc(true);
    setTimeout(() => {
      const semMaterials = sem === 'Semester 1' || sem === 'Ganjil'
        ? materialsSem1
        : sem === 'Semester 2' || sem === 'Genap'
        ? materialsSem2
        : [...materialsSem1, ...materialsSem2];
      const defaultTopic = selectedPerangkatTopic || (semMaterials.length > 0 ? semMaterials[0].essentialMaterial : `Materi Pokok ${subject}`);
      const currentMat = semMaterials.find(m => m.essentialMaterial === defaultTopic) || semMaterials[0] || null;
      const computedMeetings = currentMat && currentMat.allocatedHours ? Math.max(1, Math.round(currentMat.allocatedHours / (jpPerWeek || 1))) : (currentMat?.meetingCount || 2);

      const doc = generateExpertCurriculumDocument(docType, {
        subject,
        level,
        grade,
        phase,
        semester: sem,
        topic: defaultTopic,
        modelOption: selectedPerangkatModel,
        meetingCount: computedMeetings,
        academicYear,
        useCustomFormat: customFormatConfig.useCustomFormat,
        customFormatNotes: customFormatConfig.customFormatNotes,
        customFormatFile: customFormatConfig.formatFile,
        distributionData: {
          materialsSem1,
          materialsSem2,
          currentSelectedMaterial: currentMat,
          totalHoursPerYear,
          jpPerWeek,
          teacherName,
        },
      });

      setPerangkatDocContent(doc);
      setIsGeneratingPerangkatDoc(false);

      // Save to AI Docs 24-hour History for re-download
      try {
        const docLabels: Record<string, string> = {
          analisis_cp: 'Analisis CP Elemen',
          tp: 'Tujuan Pembelajaran (TP)',
          atp: 'Alur Tujuan Pembelajaran (ATP)',
          prota: 'Program Tahunan (PROTA)',
          prosem: 'Program Semester (PROSEM)',
          kktp: 'Kriteria Ketuntasan (KKTP)',
          modul_ajar: 'RPM Deep Learning',
          lkpd: 'LKPD Deep Learning',
          rubrik_penilaian: 'Rubrik Penilaian 6C',
        };
        const newDoc: AIDocument = {
          id: `ai-doc-${Date.now()}`,
          type: docType as any,
          title: `${docLabels[docType] || 'Perangkat Ajar'} - ${subject} Kelas ${grade} (${sem})`,
          level,
          grade: Number(grade),
          subject,
          semester: sem === 'Semester 2' || sem === 'Genap' ? 'Genap' : sem === '1 Tahun' ? '1 Tahun' : 'Ganjil',
          content: doc,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        StorageService.saveAIDocument(newDoc);
      } catch (e) {
        console.error('Error saving to AI history:', e);
      }
    }, 200);
  };

  const handleDownloadPerangkatWord = () => {
    if (!perangkatDocContent) return;
    const profile = StorageService.getSchoolProfile();
    const docLabels: Record<string, string> = {
      analisis_cp: 'Analisis_CP_Elemen',
      tp: 'Tujuan_Pembelajaran_TP',
      atp: 'Alur_Tujuan_Pembelajaran_ATP',
      prota: 'Program_Tahunan_PROTA',
      prosem: 'Program_Semester_PROSEM',
      kktp: 'Kriteria_Ketuntasan_KKTP',
      modul_ajar: 'Modul_Ajar_Deep_Learning',
      lkpd: 'LKPD_Kreatif_Berdiferensiasi',
      rubrik_penilaian: 'Rubrik_Penilaian_6C',
    };
    const title = `${docLabels[selectedPerangkatDocType] || 'Perangkat_Ajar'}_${subject}_Kelas_${grade}_Sem_${selectedPerangkatSemester}`;
    ExportService.exportToWord(
      title.replace(/_/g, ' '),
      perangkatDocContent,
      {
        ...profile,
        schoolName: schoolName || profile.schoolName,
        teacherName: teacherName || profile.teacherName,
      },
      title
    );
  };

  const handleDownloadPerangkatExcel = () => {
    if (!perangkatDocContent) return;
    const profile = StorageService.getSchoolProfile();
    const title = `Perangkat_${selectedPerangkatDocType}_${subject}`;
    ExportService.exportCurriculumToExcel(
      perangkatDocContent,
      title.replace(/_/g, ' '),
      {
        ...profile,
        schoolName: schoolName || profile.schoolName,
        teacherName: teacherName || profile.teacherName,
      },
      title
    );
  };

  const handlePrintPerangkatPdf = () => {
    if (!perangkatDocContent) return;
    const profile = StorageService.getSchoolProfile();
    const title = `Perangkat Pembelajaran Sesuai Format Sekolah - ${subject}`;
    ExportService.printPdfPreview(
      title,
      perangkatDocContent,
      {
        ...profile,
        schoolName: schoolName || profile.schoolName,
        teacherName: teacherName || profile.teacherName,
      }
    );
  };

  const handleCopyPerangkat = () => {
    if (perangkatDocContent) {
      navigator.clipboard.writeText(perangkatDocContent);
      setCopiedPerangkatDoc(true);
      setTimeout(() => setCopiedPerangkatDoc(false), 2000);
    }
  };

  const generateMatrixHtml = () => {
    const sem1Rows = materialsSem1
      .map(
        (m, idx) => `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-weight:bold;">${m.tpCode}</td>
        <td>${m.tpName}</td>
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
        <td>${m.tpName}</td>
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
      `MATRIKS PEMBAGIAN MATERI & ANALISIS CP - ${subject} KELAS ${grade}`,
      html,
      {
        ...profile,
        schoolName,
        teacherName,
        teacherNip,
        academicYear,
      },
      `Analisis_CP_${subject}_Kelas_${grade}`
    );
  };

  const handlePrintPdf = () => {
    const profile = StorageService.getSchoolProfile();
    const html = generateMatrixHtml();
    ExportService.printPdfPreview(
      `MATRIKS PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN (${subject} KELAS ${grade})`,
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-indigo-900/40 p-6 rounded-2xl shadow-xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Penginputan Guru, Mapel & Analisis Distribusi Materi CP (Sem 1 & 2)
            </h1>
          </div>
          <p className="text-xs text-slate-300 ml-10">
            Formulir manual & generator otomatis untuk Nama Guru, Mapel, Jumlah TP, Jumlah Jam (JP), serta Pembagian Materi Capaian Pembelajaran secara presisi untuk Semester 1 (Ganjil) dan Semester 2 (Genap).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('ai_analisis_cp')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow cursor-pointer"
                title="Buka format dokumen hasil analisis CP resmi siap cetak"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen Resmi Siap Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('upload_cp_master')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="Buka upload dokumen CP master terpusat"
              >
                <FolderSync className="w-3.5 h-3.5 text-slate-400" />
                <span>Master CP</span>
              </button>
            </>
          )}
          <button
            onClick={handleSavePlan}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan & Sinkronkan'}</span>
          </button>
          <button
            onClick={handleCreateNewManual}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Mapel Baru</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between animate-fadeIn ${
            notification.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Form Input, Right Tabs & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: FORM PENGINPUTAN MANUAL & PARAMETER */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Master CP Status & Quick Sync Card */}
          {activeMasterCP ? (
            <div className="bg-slate-900 p-4 rounded-2xl border border-indigo-500/40 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
                    Master CP Aktif
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">
                  {activeMasterCP.materialsSem1.length + activeMasterCP.materialsSem2.length} TP • {activeMasterCP.totalHoursPerYear} JP
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {activeMasterCP.subject} ({activeMasterCP.phase})
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Dokumen: {activeMasterCP.fileName}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleApplyMasterCPToState}
                  className="flex-1 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Terapkan ke Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                  title="Upload Dokumen Baru"
                >
                  <UploadCloud className="w-3 h-3 text-amber-300" />
                  <span>Upload CP Baru</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-dashed border-indigo-500/30 text-center space-y-2">
              <p className="text-[11px] text-slate-300 font-semibold">
                Punya dokumen resmi CP (PDF/Word)?
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow"
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-300" />
                <span>Upload & Analisis CP (PDF/Word)</span>
              </button>
            </div>
          )}

          {/* Saved Plans Selector */}
          {plans.length > 0 && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pilih Draf Dokumen Tersimpan
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => {
                  const found = plans.find((p) => p.id === e.target.value);
                  if (found) loadPlanIntoState(found);
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.subject} - Kelas {p.grade} ({p.teacherName.split(',')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-bold text-white text-sm flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Penginputan Identitas & Beban Belajar</span>
              </h2>
            </div>

            {/* Nama Guru & NIP */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nama Guru Pengampu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aspian La Ode Madimu, S.Pd., Gr."
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">NIP Guru</label>
                <input
                  type="text"
                  placeholder="19900822 201801 1 004"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Mata Pelajaran (Mapel) *</label>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Ketik Mapel..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-bold text-indigo-300"
                />
              </div>
            </div>

            {/* Jenjang, Tingkat & Fase */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Jenjang</label>
                <select
                  value={level}
                  onChange={(e) => {
                    const newLevel = e.target.value as SchoolLevel;
                    setLevel(newLevel);
                    if (newLevel === 'SD') handleGradeChange(4);
                    else if (newLevel === 'SMP') handleGradeChange(7);
                    else handleGradeChange(10);
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Kelas</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={grade}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    handleGradeChange(parseNumberInput(e.target.value, 0, 0, 12));
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Fase</label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Quick Auto-Sync Button for Grade */}
            <div className="flex items-center justify-between p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
              <div className="text-[11px] text-indigo-300">
                <span className="font-semibold text-white">Sinkronisasi Otomatis CP:</span> Bab materi menyesuaikan <span className="font-bold text-indigo-400">Kelas {grade} ({phase})</span>
              </div>
              <button
                type="button"
                onClick={() => handleSyncGradeMaterials(Number(grade), level)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sinkronkan Bab Kelas {grade}</span>
              </button>
            </div>

            {/* Jumlah Jam (JP) & Jumlah TP */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">JP / Minggu</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={jpPerWeek}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    const jp = parseNumberInput(e.target.value, 1, 1, 30);
                    setJpPerWeek(jp);
                    setTotalHoursPerYear(jp * 36);
                    setMaterialsSem1((prev) =>
                      prev.map((m) => ({
                        ...m,
                        meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (jp || 1))),
                      }))
                    );
                    setMaterialsSem2((prev) =>
                      prev.map((m) => ({
                        ...m,
                        meetingCount: Math.max(1, Math.round((m.allocatedHours || 0) / (jp || 1))),
                      }))
                    );
                  }}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Total JP / Tahun</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={totalHoursPerYear}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    setTotalHoursPerYear(parseNumberInput(e.target.value, 0, 0, 500));
                  }}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold font-mono text-center focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Target TP</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={totalTPCount}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    setTotalTPCount(parseNumberInput(e.target.value, 0, 0, 50));
                  }}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-300 font-bold font-mono text-center focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Capaian Pembelajaran (CP) Teks */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">Teks Capaian Pembelajaran (CP)</label>
                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-0.5"
                >
                  <FolderOpen className="w-3 h-3 inline mr-1" />
                  Pilih Bank CP
                </button>
              </div>
              <textarea
                rows={4}
                value={cpText}
                onChange={(e) => setCpText(e.target.value)}
                placeholder="Tuliskan rumusan CP utuh atau paste deskripsi elemen CP..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
              />
            </div>

            {/* Catatan / Custom Prompt */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Catatan Tambahan untuk Format (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Fokus pada praktikum lab dan kontekstual daerah pesisir..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Custom School Format Selector & Checkbox */}
            <CustomFormatSelector
              value={customFormatConfig}
              onChange={setCustomFormatConfig}
              docTypeName="Distribusi Materi & CP"
              docTypeId="analisis_cp"
              compact={true}
            />

            {/* Generator Button */}
            <button
              type="button"
              onClick={handleRunAIAnalysis}
              disabled={isLoadingAI}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
            >
              {isLoadingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menganalisis & Mendistribusikan CP...</span>
                </>
              ) : (
                <>
                  <AMDLogo size="xs" />
                  <span>Analisis & Bagikan Materi (Otomatis)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: TABS PEMBAGIAN SEMESTER 1, SEMESTER 2, PREVIEW CETAK & BANK */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Tab Bar */}
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-300" />
                <span>Upload & Analisis CP</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[9px] font-extrabold uppercase border border-amber-500/30">
                  Master Acuan
                </span>
              </button>

              <button
                onClick={() => setActiveTab('sem1')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'sem1'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Semester 1 (Ganjil)</span>
                <span className="px-1.5 py-0.2 bg-slate-950/60 rounded-full text-[10px] font-mono">
                  {materialsSem1.length} TP • {totalJPSem1} JP
                </span>
              </button>

              <button
                onClick={() => setActiveTab('sem2')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'sem2'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Semester 2 (Genap)</span>
                <span className="px-1.5 py-0.2 bg-slate-950/60 rounded-full text-[10px] font-mono">
                  {materialsSem2.length} TP • {totalJPSem2} JP
                </span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Format Cetak & Rekap</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'bank'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Bank CP ({cpReferences.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('format_sekolah');
                  triggerGeneratePerangkatDoc(selectedPerangkatDocType, selectedPerangkatSemester);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 shrink-0 ${
                  activeTab === 'format_sekolah'
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white border border-amber-500/30'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buat Perangkat Format Sekolah</span>
                <span className="px-1.5 py-0.2 bg-amber-950/60 text-amber-200 rounded-full text-[9px] font-extrabold uppercase border border-amber-500/40">
                  9 Dokumen
                </span>
              </button>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                title="Ekspor Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                title="Cetak Dokumen"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 0: UPLOAD & ANALISIS CP MULTI-FORMAT (PDF / WORD / TEKS) */}
          {/* ========================================================================= */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <CPUploaderAndAnalyzer
                teacherName={teacherName}
                schoolName={schoolName}
                onAnalysisComplete={handleMasterAnalysisComplete}
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SEMESTER 1 (GANJIL) */}
          {/* ========================================================================= */}
          {activeTab === 'sem1' && (
            <div className="space-y-4">
              {/* Header & Stats Banner */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                        Semester 1 (Ganjil)
                      </span>
                      <h3 className="font-bold text-white text-base">
                        Distribusi Materi Pokok & TP (Semester 1)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Kelola alokasi JP, rumusan TP, materi pokok esensial, asesmen, dan pendekatan Deep Learning.
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenAddModal(1)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Input Materi Baru</span>
                    </button>

                    <button
                      onClick={() => {
                        setBatchSemester(1);
                        setIsBatchModalOpen(true);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                      title="Tempel banyak materi sekaligus dari silabus / CP"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Tempel Cepat (Batch)</span>
                    </button>

                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                      title="Gunakan materi standar kurikulum nasional per mata pelajaran"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Template Mapel</span>
                    </button>

                    {materialsSem1.length > 0 && (
                      <button
                        onClick={() => handleClearSemester(1)}
                        className="p-2 bg-slate-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-slate-700 rounded-xl transition"
                        title="Kosongkan Materi Semester 1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress & Target Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Jumlah Materi/TP:</span>
                    <span className="font-bold text-white text-sm">{materialsSem1.length} Modul/TP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Total Alokasi JP:</span>
                    <span className="font-bold text-emerald-400 text-sm">{totalJPSem1} JP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Target Semester:</span>
                    <span className="font-semibold text-slate-300 text-sm">~{Math.round(totalHoursPerYear / 2)} JP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Keseimbangan Beban:</span>
                    <span
                      className={`font-bold text-xs ${
                        totalJPSem1 === Math.round(totalHoursPerYear / 2)
                          ? 'text-emerald-400'
                          : Math.abs(totalJPSem1 - Math.round(totalHoursPerYear / 2)) <= 6
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {totalJPSem1 === Math.round(totalHoursPerYear / 2)
                        ? 'Tepat Sesuai Alokasi'
                        : `${totalJPSem1 > Math.round(totalHoursPerYear / 2) ? '+' : ''}${
                            totalJPSem1 - Math.round(totalHoursPerYear / 2)
                          } JP`}
                    </span>
                  </div>
                </div>

                {/* Auto-Distribute Formula & Quick Tool Bar Sem 1 */}
                <div className="p-3 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-emerald-950/40 border border-indigo-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
                      <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Formula Alokasi Waktu per Bab (Sesuai JP/Minggu):</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong className="text-indigo-200">Alokasi JP/Bab = Total JP ÷ {materialsSem1.length || 1} Bab</strong> • <strong className="text-emerald-400">Pertemuan = Alokasi JP ÷ {jpPerWeek} JP/Mg</strong> (Misal: 50 JP ÷ 2 BAB = 25 JP/Bab $\rightarrow$ 25 : 5 = 5 Pertemuan)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAutoDistributeChaptersByJpPerWeek(1, 50)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold rounded-lg border border-indigo-500/40 text-[11px] transition"
                      title="Bagi rata 50 JP ke semua bab Semester 1"
                    >
                      Bagi Rata 50 JP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoDistributeChaptersByJpPerWeek(1)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-xs text-[11px] flex items-center space-x-1.5 transition"
                      title="Bagi rata total alokasi JP semester 1 ke semua bab"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Bagi Rata Otomatis ({totalJPSem1 || 50} JP)</span>
                    </button>
                  </div>
                </div>

                {/* Filter / Search Input */}
                {materialsSem1.length > 2 && (
                  <div className="relative pt-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-4" />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Cari materi pokok atau rumusan TP Semester 1..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Form Tambah Materi Cepat Semester 1 */}
                <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-xs shrink-0">
                    <Plus className="w-4 h-4" />
                    <span>Tambah Materi Sem 1:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ketik nama materi pokok yang diinginkan (misal: Besaran, Satuan & Vektor)..."
                    value={inlineMaterialSem1}
                    onChange={(e) => setInlineMaterialSem1(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddManual(1, inlineMaterialSem1, inlineJPSem1);
                      }
                    }}
                    className="flex-1 min-w-[220px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">JP:</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={inlineJPSem1}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        setInlineJPSem1(parseNumberInput(e.target.value, 0, 0, 120));
                      }}
                      className="w-10 bg-transparent text-emerald-400 font-bold font-mono text-center text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddManual(1, inlineMaterialSem1, inlineJPSem1)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan ke Sem 1</span>
                  </button>
                </div>
              </div>

              {materialsSem1.length > 0 ? (
                <div className="space-y-3">
                  {materialsSem1
                    .filter(
                      (item) =>
                        !searchKeyword ||
                        item.essentialMaterial.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        item.tpName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        item.tpCode.toLowerCase().includes(searchKeyword.toLowerCase())
                    )
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-sm space-y-3 text-xs transition group"
                      >
                        {/* Top Line: Item Number, Code, Element, Quick Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={item.tpCode}
                              onChange={(e) => handleUpdateItem(1, item.id, 'tpCode', e.target.value)}
                              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs w-28 focus:outline-none focus:border-indigo-500"
                              placeholder="Kode TP"
                              title="Kode Tujuan Pembelajaran"
                            />
                            <input
                              type="text"
                              value={item.elementName || ''}
                              onChange={(e) => handleUpdateItem(1, item.id, 'elementName', e.target.value)}
                              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs flex-1 focus:outline-none focus:border-indigo-500"
                              placeholder="Elemen CP (misal: Pemahaman Sains)"
                              title="Elemen Capaian Pembelajaran"
                            />
                          </div>

                          {/* Action Toolbar for Item */}
                          <div className="flex items-center space-x-1.5">
                            {/* Reordering Up/Down */}
                            <div className="flex items-center space-x-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                              <button
                                onClick={() => handleMoveUp(1, idx)}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                                title="Geser ke Atas"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(1, idx)}
                                disabled={idx === materialsSem1.length - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                                title="Geser ke Bawah"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* JP Input */}
                            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800" title="Alokasi Jam Pelajaran (JP)">
                              <span className="text-slate-500 text-[10px]">JP:</span>
                              <input
                                type="number"
                                min={0}
                                max={120}
                                value={item.allocatedHours}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => {
                                  handleUpdateItem(1, item.id, 'allocatedHours', parseNumberInput(e.target.value, 0, 0, 120));
                                }}
                                className="w-10 bg-transparent text-emerald-400 font-bold font-mono text-xs text-center focus:outline-none"
                              />
                            </div>

                            {/* Pertemuan Count (Alokasi JP ÷ JP/Minggu) */}
                            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800" title={`Jumlah Pertemuan = ${item.allocatedHours || 0} JP ÷ ${jpPerWeek} JP/Mg = ${Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)))} Kali`}>
                              <span className="text-slate-500 text-[10px]">Prt:</span>
                              <input
                                type="number"
                                min={1}
                                max={40}
                                value={item.meetingCount || Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)))}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => {
                                  handleUpdateItem(1, item.id, 'meetingCount', parseNumberInput(e.target.value, 1, 1, 40));
                                }}
                                className="w-8 bg-transparent text-sky-400 font-bold font-mono text-xs text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-sky-500 font-medium">x</span>
                            </div>

                            {/* Detailed Edit Modal */}
                            <button
                              onClick={() => handleOpenEditModal(1, item)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-900/40 text-indigo-300 rounded-lg transition"
                              title="Edit Rinci Materi (Form Lengkap)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateItem(1, item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Duplikasi / Salin Materi Ini"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Move to Sem 2 */}
                            <button
                              onClick={() => handleMoveSemester(item, 2)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition"
                              title="Pindahkan materi ini ke Semester 2"
                            >
                              <span>Ke Sem 2</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteItem(1, item.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg transition"
                              title="Hapus TP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Materi Pokok & Asesmen (Inline editable) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Lingkup Materi Pokok Esensial
                            </label>
                            <input
                              type="text"
                              value={item.essentialMaterial}
                              onChange={(e) => handleUpdateItem(1, item.id, 'essentialMaterial', e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
                              placeholder="Topik / Pokok Bahasan"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                                Target TP
                              </label>
                              <span className="text-[9px] text-indigo-400 font-semibold">Jml</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={item.tpCount ?? 1}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => handleUpdateItem(1, item.id, 'tpCount', parseNumberInput(e.target.value, 1, 1, 20))}
                                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                              />
                              <span className="text-[10px] text-slate-400 font-bold shrink-0">TP</span>
                            </div>
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Bentuk Asesmen & Evaluasi
                            </label>
                            <input
                              type="text"
                              value={item.assessmentStrategy}
                              onChange={(e) => handleUpdateItem(1, item.id, 'assessmentStrategy', e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Formatif, Sumatif, Portofolio"
                            />
                          </div>
                        </div>

                        {/* TP Rumusan */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Rumusan Tujuan Pembelajaran (TP)
                          </label>
                          <textarea
                            rows={2}
                            value={item.tpName}
                            onChange={(e) => handleUpdateItem(1, item.id, 'tpName', e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed text-xs"
                            placeholder="Deskripsi kemampuan yang diharapkan dicapai peserta didik..."
                          />
                        </div>

                        {/* Deep Learning Method */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Penerapan Deep Learning (Mindful, Meaningful, Joyful)
                          </label>
                          <input
                            type="text"
                            value={item.deepLearningMethod || ''}
                            onChange={(e) => handleUpdateItem(1, item.id, 'deepLearningMethod', e.target.value)}
                            placeholder="Mindful: Observasi kesadaran, Meaningful: Studi kasus nyata, Joyful: Aktivitas interaktif"
                            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 text-[11px]"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-3">
                  <p className="text-sm">Belum ada materi untuk Semester 1.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handleOpenAddModal(1)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Input Materi Semester 1</span>
                    </button>
                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Pilih Template Mapel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SEMESTER 2 (GENAP) */}
          {/* ========================================================================= */}
          {activeTab === 'sem2' && (
            <div className="space-y-4">
              {/* Header & Stats Banner */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                        Semester 2 (Genap)
                      </span>
                      <h3 className="font-bold text-white text-base">
                        Distribusi Materi Pokok & TP (Semester 2)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Kelola alokasi JP, rumusan TP, materi pokok esensial, asesmen, dan pendekatan Deep Learning.
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenAddModal(2)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Input Materi Baru</span>
                    </button>

                    <button
                      onClick={() => {
                        setBatchSemester(2);
                        setIsBatchModalOpen(true);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                      title="Tempel banyak materi sekaligus dari silabus / CP"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Tempel Cepat (Batch)</span>
                    </button>

                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                      title="Gunakan materi standar kurikulum nasional per mata pelajaran"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Template Mapel</span>
                    </button>

                    {materialsSem2.length > 0 && (
                      <button
                        onClick={() => handleClearSemester(2)}
                        className="p-2 bg-slate-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-slate-700 rounded-xl transition"
                        title="Kosongkan Materi Semester 2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress & Target Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Jumlah Materi/TP:</span>
                    <span className="font-bold text-white text-sm">{materialsSem2.length} Modul/TP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Total Alokasi JP:</span>
                    <span className="font-bold text-emerald-400 text-sm">{totalJPSem2} JP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Target Semester:</span>
                    <span className="font-semibold text-slate-300 text-sm">~{Math.round(totalHoursPerYear / 2)} JP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Keseimbangan Beban:</span>
                    <span
                      className={`font-bold text-xs ${
                        totalJPSem2 === Math.round(totalHoursPerYear / 2)
                          ? 'text-emerald-400'
                          : Math.abs(totalJPSem2 - Math.round(totalHoursPerYear / 2)) <= 6
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {totalJPSem2 === Math.round(totalHoursPerYear / 2)
                        ? 'Tepat Sesuai Alokasi'
                        : `${totalJPSem2 > Math.round(totalHoursPerYear / 2) ? '+' : ''}${
                            totalJPSem2 - Math.round(totalHoursPerYear / 2)
                          } JP`}
                    </span>
                  </div>
                </div>

                {/* Filter / Search Input */}
                {materialsSem2.length > 2 && (
                  <div className="relative pt-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-4" />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Cari materi pokok atau rumusan TP Semester 2..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Form Tambah Materi Cepat Semester 2 */}
                <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-xs shrink-0">
                    <Plus className="w-4 h-4" />
                    <span>Tambah Materi Sem 2:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ketik nama materi pokok yang diinginkan (misal: Dinamika Gerak & Hukum Gravitasi)..."
                    value={inlineMaterialSem2}
                    onChange={(e) => setInlineMaterialSem2(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddManual(2, inlineMaterialSem2, inlineJPSem2);
                      }
                    }}
                    className="flex-1 min-w-[220px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">JP:</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={inlineJPSem2}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        setInlineJPSem2(parseNumberInput(e.target.value, 0, 0, 120));
                      }}
                      className="w-10 bg-transparent text-emerald-400 font-bold font-mono text-center text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddManual(2, inlineMaterialSem2, inlineJPSem2)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan ke Sem 2</span>
                  </button>
                </div>
              </div>

              {materialsSem2.length > 0 ? (
                <div className="space-y-3">
                  {materialsSem2
                    .filter(
                      (item) =>
                        !searchKeyword ||
                        item.essentialMaterial.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        item.tpName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        item.tpCode.toLowerCase().includes(searchKeyword.toLowerCase())
                    )
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-sm space-y-3 text-xs transition group"
                      >
                        {/* Top Line: Item Number, Code, Element, Quick Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {materialsSem1.length + idx + 1}
                            </span>
                            <input
                              type="text"
                              value={item.tpCode}
                              onChange={(e) => handleUpdateItem(2, item.id, 'tpCode', e.target.value)}
                              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs w-28 focus:outline-none focus:border-indigo-500"
                              placeholder="Kode TP"
                              title="Kode Tujuan Pembelajaran"
                            />
                            <input
                              type="text"
                              value={item.elementName || ''}
                              onChange={(e) => handleUpdateItem(2, item.id, 'elementName', e.target.value)}
                              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs flex-1 focus:outline-none focus:border-indigo-500"
                              placeholder="Elemen CP"
                              title="Elemen Capaian Pembelajaran"
                            />
                          </div>

                          {/* Action Toolbar for Item */}
                          <div className="flex items-center space-x-1.5">
                            {/* Reordering Up/Down */}
                            <div className="flex items-center space-x-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                              <button
                                onClick={() => handleMoveUp(2, idx)}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                                title="Geser ke Atas"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(2, idx)}
                                disabled={idx === materialsSem2.length - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                                title="Geser ke Bawah"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* JP Input */}
                            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800" title="Alokasi Jam Pelajaran (JP)">
                              <span className="text-slate-500 text-[10px]">JP:</span>
                              <input
                                type="number"
                                min={0}
                                max={120}
                                value={item.allocatedHours}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => {
                                  handleUpdateItem(2, item.id, 'allocatedHours', parseNumberInput(e.target.value, 0, 0, 120));
                                }}
                                className="w-10 bg-transparent text-emerald-400 font-bold font-mono text-xs text-center focus:outline-none"
                              />
                            </div>

                            {/* Pertemuan Count (Alokasi JP ÷ JP/Minggu) */}
                            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800" title={`Jumlah Pertemuan = ${item.allocatedHours || 0} JP ÷ ${jpPerWeek} JP/Mg = ${Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)))} Kali`}>
                              <span className="text-slate-500 text-[10px]">Prt:</span>
                              <input
                                type="number"
                                min={1}
                                max={40}
                                value={item.meetingCount || Math.max(1, Math.round((item.allocatedHours || 0) / (jpPerWeek || 1)))}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => {
                                  handleUpdateItem(2, item.id, 'meetingCount', parseNumberInput(e.target.value, 1, 1, 40));
                                }}
                                className="w-8 bg-transparent text-sky-400 font-bold font-mono text-xs text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-sky-500 font-medium">x</span>
                            </div>

                            {/* Detailed Edit Modal */}
                            <button
                              onClick={() => handleOpenEditModal(2, item)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-900/40 text-indigo-300 rounded-lg transition"
                              title="Edit Rinci Materi (Form Lengkap)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateItem(2, item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Duplikasi / Salin Materi Ini"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Move to Sem 1 */}
                            <button
                              onClick={() => handleMoveSemester(item, 1)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition"
                              title="Pindahkan materi ini ke Semester 1"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>Ke Sem 1</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteItem(2, item.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg transition"
                              title="Hapus TP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Materi Pokok & Asesmen (Inline editable) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Lingkup Materi Pokok Esensial
                            </label>
                            <input
                              type="text"
                              value={item.essentialMaterial}
                              onChange={(e) => handleUpdateItem(2, item.id, 'essentialMaterial', e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
                              placeholder="Topik / Pokok Bahasan"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                                Target TP
                              </label>
                              <span className="text-[9px] text-sky-400 font-semibold">Jml</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={item.tpCount ?? 1}
                                onFocus={handleNumberInputFocus}
                                onChange={(e) => handleUpdateItem(2, item.id, 'tpCount', parseNumberInput(e.target.value, 1, 1, 20))}
                                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono font-bold text-center focus:outline-none focus:border-sky-500"
                              />
                              <span className="text-[10px] text-slate-400 font-bold shrink-0">TP</span>
                            </div>
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Bentuk Asesmen & Evaluasi
                            </label>
                            <input
                              type="text"
                              value={item.assessmentStrategy}
                              onChange={(e) => handleUpdateItem(2, item.id, 'assessmentStrategy', e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Formatif, Sumatif, Portofolio"
                            />
                          </div>
                        </div>

                        {/* TP Rumusan */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Rumusan Tujuan Pembelajaran (TP)
                          </label>
                          <textarea
                            rows={2}
                            value={item.tpName}
                            onChange={(e) => handleUpdateItem(2, item.id, 'tpName', e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed text-xs"
                            placeholder="Deskripsi kemampuan yang diharapkan dicapai peserta didik..."
                          />
                        </div>

                        {/* Deep Learning Method */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Penerapan Deep Learning (Mindful, Meaningful, Joyful)
                          </label>
                          <input
                            type="text"
                            value={item.deepLearningMethod || ''}
                            onChange={(e) => handleUpdateItem(2, item.id, 'deepLearningMethod', e.target.value)}
                            placeholder="Mindful: Observasi kesadaran, Meaningful: Studi kasus nyata, Joyful: Aktivitas interaktif"
                            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 text-[11px]"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-3">
                  <p className="text-sm">Belum ada materi untuk Semester 2.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handleOpenAddModal(2)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Input Materi Semester 2</span>
                    </button>
                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Pilih Template Mapel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MATRIKS PREVIEW & CETAK DOKUMEN RESMI */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Export Toolbar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm print:hidden">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white">Ekspor & Pratinjau Dokumen Administrasi:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 font-bold transition shadow-sm"
                    title="Ekspor ke Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={handleExportWord}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 font-bold transition shadow-sm"
                    title="Ekspor ke Word (.doc) Lengkap Kop & Pengesahan"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Word (.doc)</span>
                  </button>

                  <button
                    onClick={handlePrintPdf}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 font-bold transition shadow-sm"
                    title="Cetak Langsung / Simpan PDF dengan Kop Resmi Sekolah"
                  >
                    <Printer className="w-3.5 h-3.5 text-rose-400" />
                    <span>PDF (Cetak/Simpan)</span>
                  </button>
                </div>
              </div>

              {/* Matriks Kertas A4 Dokumen */}
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 font-serif space-y-6 print:m-0 print:p-0">
              {/* Kop Dokumen Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-lg font-bold tracking-wider uppercase">{schoolName}</h2>
                <h3 className="text-base font-bold uppercase text-slate-800">
                  MATRIKS PEMBAGIAN MATERI & TUJUAN PEMBELAJARAN (ANALISIS CP)
                </h3>
                <p className="text-xs italic text-slate-600 font-sans">
                  Tahun Ajaran: {academicYear} • Kurikulum Merdeka (Pendekatan Deep Learning)
                </p>
              </div>

              {/* Identitas Mata Pelajaran & Guru */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-300 pb-4">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">Mata Pelajaran</span>:{' '}
                    <span className="font-bold text-slate-900">{subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">Jenjang / Kelas</span>:{' '}
                    <span className="font-semibold">
                      {level} / Kelas {grade} ({phase})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">Beban Belajar</span>:{' '}
                    <span className="font-semibold">
                      {jpPerWeek} JP/Minggu (Total {totalJPTahun} JP/Tahun)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">Guru Pengampu</span>:{' '}
                    <span className="font-bold text-slate-900">{teacherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">NIP</span>:{' '}
                    <span className="font-mono">{teacherNip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-36 inline-block font-semibold">Proporsi Jam</span>:{' '}
                    <span className="font-semibold">
                      Sem 1: {totalJPSem1} JP | Sem 2: {totalJPSem2} JP
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Matriks Semester 1 */}
              <div className="space-y-2 font-sans">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border border-slate-300">
                  I. PEMBAGIAN MATERI SEMESTER 1 (GANJIL) - {totalJPSem1} JP
                </h4>
                <table className="w-full text-[11px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold">
                      <th className="border border-slate-400 p-1.5 w-8 text-center">No</th>
                      <th className="border border-slate-400 p-1.5 w-20 text-center">Kode</th>
                      <th className="border border-slate-400 p-1.5">Tujuan Pembelajaran (TP)</th>
                      <th className="border border-slate-400 p-1.5">Materi Pokok Esensial</th>
                      <th className="border border-slate-400 p-1.5 w-12 text-center">JP</th>
                      <th className="border border-slate-400 p-1.5">Asesmen & Deep Learning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsSem1.map((m, idx) => (
                      <tr key={m.id}>
                        <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-1.5 font-mono text-center font-bold">{m.tpCode}</td>
                        <td className="border border-slate-400 p-1.5">{m.tpName}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold text-slate-800">
                          {m.essentialMaterial}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold">{m.allocatedHours}</td>
                        <td className="border border-slate-400 p-1.5 text-[10px]">
                          <div>{m.assessmentStrategy}</div>
                          {m.deepLearningMethod && <div className="italic text-slate-600">{m.deepLearningMethod}</div>}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-400 p-1.5 text-right">
                        Jumlah Jam Semester 1:
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">{totalJPSem1} JP</td>
                      <td className="border border-slate-400 p-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tabel Matriks Semester 2 */}
              <div className="space-y-2 font-sans">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border border-slate-300">
                  II. PEMBAGIAN MATERI SEMESTER 2 (GENAP) - {totalJPSem2} JP
                </h4>
                <table className="w-full text-[11px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold">
                      <th className="border border-slate-400 p-1.5 w-8 text-center">No</th>
                      <th className="border border-slate-400 p-1.5 w-20 text-center">Kode</th>
                      <th className="border border-slate-400 p-1.5">Tujuan Pembelajaran (TP)</th>
                      <th className="border border-slate-400 p-1.5">Materi Pokok Esensial</th>
                      <th className="border border-slate-400 p-1.5 w-12 text-center">JP</th>
                      <th className="border border-slate-400 p-1.5">Asesmen & Deep Learning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsSem2.map((m, idx) => (
                      <tr key={m.id}>
                        <td className="border border-slate-400 p-1.5 text-center">{materialsSem1.length + idx + 1}</td>
                        <td className="border border-slate-400 p-1.5 font-mono text-center font-bold">{m.tpCode}</td>
                        <td className="border border-slate-400 p-1.5">{m.tpName}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold text-slate-800">
                          {m.essentialMaterial}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold">{m.allocatedHours}</td>
                        <td className="border border-slate-400 p-1.5 text-[10px]">
                          <div>{m.assessmentStrategy}</div>
                          {m.deepLearningMethod && <div className="italic text-slate-600">{m.deepLearningMethod}</div>}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-400 p-1.5 text-right">
                        Jumlah Jam Semester 2:
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">{totalJPSem2} JP</td>
                      <td className="border border-slate-400 p-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 pt-8 text-xs font-sans">
                <div className="text-center space-y-16">
                  <p>Mengetahui,<br />Kepala Sekolah</p>
                  <div>
                    <p className="font-bold underline">Drs. M. Taher, M.Pd.</p>
                    <p className="text-[10px] text-slate-600">NIP. 19700315 199602 1 002</p>
                  </div>
                </div>

                <div className="text-center space-y-16">
                  <p>Maluku Tengah, 22 Agustus 2026<br />Guru Mata Pelajaran</p>
                  <div>
                    <p className="font-bold underline">{teacherName}</p>
                    <p className="text-[10px] text-slate-600">NIP. {teacherNip || '.........................'}</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BANK CP NASIONAL & REFERENSI */}
          {/* ========================================================================= */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-white text-sm">Bank Dokumen Capaian Pembelajaran (CP) Resmi</h3>
                <p className="text-xs text-slate-400">
                  Pilih acuan CP resmi untuk otomatis mengisi parameter dan menganalisis pembagian materi semester.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cpReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-4 rounded-2xl shadow transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                          {ref.level} • {ref.phase}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{ref.subject}</h4>
                        <p className="text-[11px] text-slate-400">{ref.title}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      {ref.cpText || ref.rawText || 'Teks CP Terstruktur'}
                    </p>

                    <button
                      onClick={() => handleSelectCPRef(ref)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gunakan CP Ini & Distribusikan</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BUAT PERANGKAT SESUAI FORMAT / TEMPLATE SEKOLAH */}
          {/* ========================================================================= */}
          {activeTab === 'format_sekolah' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-amber-500/40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          PERANGKAT FORMAT SEKOLAH
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {subject} • {phase} • Kelas {grade} • TA {academicYear}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                        Generator 9 Perangkat Ajar Sesuai Template & Format Sekolah
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => triggerGeneratePerangkatDoc(selectedPerangkatDocType, selectedPerangkatSemester)}
                      disabled={isGeneratingPerangkatDoc}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg disabled:opacity-50"
                    >
                      {isGeneratingPerangkatDoc ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Zap className="w-4 h-4 text-slate-950 fill-current" />
                      )}
                      <span>Susun Ulang Perangkat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT COLUMN: Template Config & Document Picker (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Template Setting (Only for non-RPM docs) */}
                  {selectedPerangkatDocType !== 'modul_ajar' && (
                    <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                      <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Format & Template Acuan Sekolah:</span>
                      </label>
                      <CustomFormatSelector
                        value={customFormatConfig}
                        onChange={(newCfg) => {
                          setCustomFormatConfig(newCfg);
                          setTimeout(() => triggerGeneratePerangkatDoc(selectedPerangkatDocType, selectedPerangkatSemester), 100);
                        }}
                        docTypeName={
                          selectedPerangkatDocType === 'tp' ? 'Tujuan Pembelajaran' :
                          selectedPerangkatDocType === 'atp' ? 'Alur Tujuan Pembelajaran' :
                          selectedPerangkatDocType === 'prota' ? 'Program Tahunan' :
                          selectedPerangkatDocType === 'prosem' ? 'Program Semester' :
                          selectedPerangkatDocType === 'kktp' ? 'KKTP' :
                          selectedPerangkatDocType === 'lkpd' ? 'LKPD' :
                          selectedPerangkatDocType === 'rubrik_penilaian' ? 'Rubrik Penilaian' : 'Analisis CP'
                        }
                        docTypeId={selectedPerangkatDocType}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Parameters */}
                  <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Semester</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          {(['Semester 1', 'Semester 2', '1 Tahun'] as const).map((sem) => (
                            <button
                              key={sem}
                              type="button"
                              onClick={() => {
                                setSelectedPerangkatSemester(sem);
                                triggerGeneratePerangkatDoc(selectedPerangkatDocType, sem);
                              }}
                              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition text-center ${
                                selectedPerangkatSemester === sem
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {sem}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Model Belajar</label>
                        <select
                          value={selectedPerangkatModel}
                          onChange={(e) => {
                            setSelectedPerangkatModel(e.target.value);
                            setTimeout(() => triggerGeneratePerangkatDoc(selectedPerangkatDocType, selectedPerangkatSemester), 100);
                          }}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Problem-Based Learning (PBL)">Problem-Based Learning</option>
                          <option value="Project-Based Learning (PjBL)">Project-Based Learning</option>
                          <option value="Inquiry Learning">Inquiry Learning</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Experiential Learning">Experiential Learning</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Fokus Materi / TP Pembelajaran ({selectedPerangkatSemester}):
                      </label>
                      <select
                        value={selectedPerangkatTopic}
                        onChange={(e) => {
                          setSelectedPerangkatTopic(e.target.value);
                          setTimeout(() => triggerGeneratePerangkatDoc(selectedPerangkatDocType, selectedPerangkatSemester), 100);
                        }}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Semua Materi / Otomatis dari CP ({selectedPerangkatSemester})</option>
                        {(selectedPerangkatSemester === 'Semester 1'
                          ? materialsSem1
                          : selectedPerangkatSemester === 'Semester 2'
                          ? materialsSem2
                          : [...materialsSem1, ...materialsSem2]
                        ).map((m, idx) => (
                          <option key={idx} value={m.essentialMaterial}>
                            TP {idx + 1}: {m.essentialMaterial} ({m.allocatedHours} JP)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 9 Document List Selection */}
                  <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Pilih Jenis Perangkat Ajar:</span>
                      <span className="text-[10px] text-indigo-400 font-mono">9 Jenis Dokumen</span>
                    </label>
                    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                      {[
                        { id: 'analisis_alokasi_waktu', label: '0. Analisis Alokasi Waktu (RBE)', desc: 'Pekan Efektif & Siklus Deep Learning' },
                        { id: 'analisis_cp', label: '1. Analisis & Distribusi CP', desc: 'Dekomposisi Elemen & 3 Pilar Deep Learning' },
                        { id: 'tp', label: '2. Tujuan Pembelajaran (TP)', desc: 'Formula ABCD, Bloom HOTS & Deep Learning' },
                        { id: 'atp', label: '3. Alur Tujuan Pembelajaran (ATP)', desc: 'Standar 10 Kolom, 3 Pilar & Alokasi JP' },
                        { id: 'prota', label: '4. Program Tahunan (PROTA)', desc: 'Format 4 Kolom & Alokasi Tahunan 3 Pilar' },
                        { id: 'prosem', label: '5. Program Semester (PROSEM)', desc: 'Matriks Pekan Efektif & Siklus Deep Learning' },
                        { id: 'kktp', label: '6. Kriteria Ketuntasan (KKTP)', desc: 'Interval Nilai & Rubrik 4 Level Deep Learning' },
                        { id: 'modul_ajar', label: '7. Modul Ajar Deep Learning', desc: '6 Fase Sintaks: Mindful, Meaningful, Joyful' },
                        { id: 'lkpd', label: '8. LKPD Deep Learning', desc: 'Inkuiri Kontekstual, Kanvas Siswa & Refleksi' },
                        { id: 'rubrik_penilaian', label: '9. Rubrik Penilaian & 6C', desc: 'Asesmen Karakter 6C, Kinerja & Sumatif HOTS' },
                      ].map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setSelectedPerangkatDocType(doc.id);
                            triggerGeneratePerangkatDoc(doc.id, selectedPerangkatSemester);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border ${
                            selectedPerangkatDocType === doc.id
                              ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-md'
                              : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className={`text-xs font-bold ${selectedPerangkatDocType === doc.id ? 'text-amber-300' : 'text-slate-200'}`}>
                              {doc.label}
                            </div>
                            <div className="text-[10px] text-slate-400">{doc.desc}</div>
                          </div>
                          {selectedPerangkatDocType === doc.id && (
                            <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Live Document Preview & Export Action Bar (7 Cols) */}
                <div className="lg:col-span-7 space-y-3 flex flex-col">
                  {/* Export Action Bar */}
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-white">Preview Dokumen</span>
                      {customFormatConfig.useCustomFormat && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
                          Template Sekolah
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={handleDownloadPerangkatWord}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
                        title="Unduh Microsoft Word (.doc)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Word (.doc)</span>
                      </button>

                      <button
                        onClick={handleDownloadPerangkatExcel}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
                        title="Unduh Spreadsheet Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Excel (.xlsx)</span>
                      </button>

                      <button
                        onClick={handlePrintPerangkatPdf}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                        title="Cetak atau Simpan PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={handleCopyPerangkat}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                        title="Salin Teks"
                      >
                        {copiedPerangkatDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Document Render Card */}
                  <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 sm:p-6 overflow-y-auto max-h-[600px] text-xs font-sans space-y-4">
                    {isGeneratingPerangkatDoc ? (
                      <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                        <p className="text-xs">Menyusun dokumen berdasarkan format / template sekolah...</p>
                      </div>
                    ) : perangkatDocContent ? (
                      <div className="space-y-4">
                        {/* Kop Sekolah Preview */}
                        <div className="text-center pb-3 border-b-2 border-slate-700 space-y-0.5">
                          <div className="font-extrabold text-xs uppercase tracking-widest text-slate-400">
                            PEMERINTAH PROVINSI MALUKU / DINAS PENDIDIKAN
                          </div>
                          <div className="font-black text-sm uppercase text-white">
                            {schoolName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Jl. Pendidikan No. 30, Maluku Tengah • Akreditasi A • Tahun Ajaran {academicYear}
                          </div>
                        </div>

                        {/* Markdown Document Content */}
                        <pre className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                          {perangkatDocContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-500">
                        <FileText className="w-8 h-8 opacity-40" />
                        <p className="text-xs">Pilih jenis perangkat ajar untuk melihat pratinjau dokumen.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM INPUT & UBAH MATERI RINCI (DETAIL MODAL) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  {isNewModalItem ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isNewModalItem ? 'Input Materi & Tujuan Pembelajaran Baru' : 'Ubah Rincian Materi Pembelajaran'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isNewModalItem
                      ? 'Lengkapi rincian materi pokok esensial, kode TP, dan alokasi JP per semester'
                      : `Mengedit materi: ${modalItem.essentialMaterial || modalItem.tpCode}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModalItem} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Semester & Code & Alokasi & Pertemuan row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Semester Target *
                  </label>
                  <select
                    value={modalItem.semester}
                    onChange={(e) => setModalItem({ ...modalItem, semester: Number(e.target.value) as 1 | 2 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Kode TP *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalItem.tpCode}
                    onChange={(e) => setModalItem({ ...modalItem, tpCode: e.target.value })}
                    placeholder="e.g. TP.10.1.1"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Alokasi Waktu (JP) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      max={200}
                      value={modalItem.allocatedHours}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const val = parseNumberInput(e.target.value, 0, 0, 200);
                        setModalItem({
                          ...modalItem,
                          allocatedHours: val,
                          meetingCount: Math.max(1, Math.round(val / (jpPerWeek || 1))),
                        });
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold">JP</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Jumlah Pertemuan *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={modalItem.meetingCount || Math.max(1, Math.round((modalItem.allocatedHours || 0) / (jpPerWeek || 1)))}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const meetings = parseNumberInput(e.target.value, 1, 1, 50);
                        setModalItem({
                          ...modalItem,
                          meetingCount: meetings,
                          allocatedHours: meetings * (jpPerWeek || 1),
                        });
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-mono font-bold focus:outline-none focus:border-indigo-500 pr-14"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">Kali ({jpPerWeek} JP/Mg)</span>
                  </div>
                </div>
              </div>

              {/* Lingkup Materi Pokok & Target TP */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-9">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Lingkup Materi Pokok Esensial *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalItem.essentialMaterial}
                    onChange={(e) => setModalItem({ ...modalItem, essentialMaterial: e.target.value })}
                    placeholder="Contoh: Pengukuran Besaran Fisika dan Ketidakpastian Pengukuran"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Target TP (Jml)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={modalItem.tpCount ?? 1}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        setModalItem({
                          ...modalItem,
                          tpCount: parseNumberInput(e.target.value, 1, 1, 20),
                        });
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-mono font-bold text-center focus:outline-none focus:border-indigo-500 pr-9"
                    />
                    <span className="absolute right-2.5 top-2.5 text-slate-500 text-xs font-bold">TP</span>
                  </div>
                </div>
              </div>

              {/* Elemen CP */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Elemen Capaian Pembelajaran (CP)
                </label>
                <input
                  type="text"
                  value={modalItem.elementName || ''}
                  onChange={(e) => setModalItem({ ...modalItem, elementName: e.target.value })}
                  placeholder="Contoh: Pemahaman Sains / Keterampilan Proses / Pemahaman Konsep"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Rumusan Tujuan Pembelajaran (TP) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Rumusan Tujuan Pembelajaran (TP) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalItem.tpName}
                  onChange={(e) => setModalItem({ ...modalItem, tpName: e.target.value })}
                  placeholder="Tuliskan rumusan kompetensi dan materi yang diharapkan dicapai peserta didik (gunakan kata kerja operasional HOTS/Kurikulum Merdeka)..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Strategi Asesmen */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Bentuk Asesmen & Evaluasi
                </label>
                <input
                  type="text"
                  value={modalItem.assessmentStrategy}
                  onChange={(e) => setModalItem({ ...modalItem, assessmentStrategy: e.target.value })}
                  placeholder="Contoh: Tes Tertulis Formatif, Observasi Praktik & Asesmen Sumatif Akhir Materi"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Deep Learning Method */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase">
                    Penerapan Pendekatan Deep Learning (Mindful, Meaningful, Joyful)
                  </label>
                  <span className="text-[10px] text-indigo-400">Kurikulum Merdeka</span>
                </div>
                <textarea
                  rows={2}
                  value={modalItem.deepLearningMethod || ''}
                  onChange={(e) => setModalItem({ ...modalItem, deepLearningMethod: e.target.value })}
                  placeholder="Mindful: Menumbuhkan kesadaran & perhatian penuh terhadap konsep, Meaningful: Menghubungkan materi dengan fenomena dunia nyata, Joyful: Aktivitas belajar menyenangkan & kolaboratif."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>{isNewModalItem ? 'Tambahkan ke Daftar' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TEMPEL CEPAT (BATCH INPUT DARI DAFTAR SILABUS/TEKS) */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Tempel Cepat Daftar Materi (Batch Import)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan beberapa baris materi sekaligus untuk langsung dibuatkan TP & alokasi JP.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Semester Tujuan
                  </label>
                  <select
                    value={batchSemester}
                    onChange={(e) => setBatchSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Alokasi JP per Materi
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={batchHoursPerItem}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => {
                      setBatchHoursPerItem(parseNumberInput(e.target.value, 0, 0, 120));
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tempel Daftar Topik / Materi Pokok (1 Materi per Baris)
                </label>
                <textarea
                  rows={6}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={`Contoh:\n1. Pengukuran Besaran Fisika dan Ketidakpastian\n2. Energi Terbarukan dan Efisiensi Energi\n3. Dinamika Gerak dan Hukum Newton\n4. Pemanasan Global dan Perubahan Iklim`}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 leading-relaxed text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nomor urut atau tanda strip di awal baris (misal 1., a., -) akan otomatis dibersihkan dan diformat menjadi TP resmi.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessBatchPaste}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Proses & Masukkan ke Semester {batchSemester}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PUSTAKA TEMPLATE MATERI MAPEL (PRESETS) */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pustaka Template Materi Kurikulum Nasional
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih struktur materi standar Kemendikbudristek untuk langsung mendistribusikan Semester 1 & 2.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUBJECT_MATERIAL_PRESETS.map((preset, idx) => (
                  <div
                    key={`${preset.subject}-${preset.grade}-${idx}`}
                    className="bg-slate-950 border border-slate-800 hover:border-amber-500/60 p-4 rounded-2xl transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {preset.level} • {preset.phase} (Kelas {preset.grade})
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {preset.totalHoursPerYear} JP/Tahun
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{preset.subject}</h4>
                      <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                        {preset.cpSummary}
                      </p>

                      {/* Semester 1 & 2 topics preview */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                        <div>
                          <span className="text-indigo-400 font-semibold">Semester 1 ({preset.materialsSem1.length} Materi): </span>
                          <span className="text-slate-300">
                            {preset.materialsSem1.map((m) => m.essentialMaterial).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-cyan-400 font-semibold">Semester 2 ({preset.materialsSem2.length} Materi): </span>
                          <span className="text-slate-300">
                            {preset.materialsSem2.map((m) => m.essentialMaterial).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySubjectPreset(preset)}
                      className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Gunakan Template {preset.subject}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
