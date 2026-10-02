import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  FileSearch,
  Target,
  GitMerge,
  CalendarRange,
  CalendarCheck,
  Calendar,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Square,
  CheckCheck,
  BookmarkCheck,
  HelpCircle,
  Copy,
  Check,
  Download,
  Printer,
  RefreshCw,
  RotateCcw,
  BookOpen,
  Send,
  Save,
  GraduationCap,
  Clock,
  Gift,
  Zap,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Info,
  Sigma,
  Maximize2,
  Minimize2,
  Columns,
  LayoutGrid,
  Trash2,
  History,
  Archive,
  Search,
  FileDown,
  ExternalLink,
  X,
  Sliders,
  UserCheck,
  ChevronRight,
  FolderSync,
  Layers,
} from 'lucide-react';
import { AIDocument, EducationLevel, SemesterType, UserAccount, TokenQuotaStatus, ActiveMasterCPData, CPDistributionPlan, SchoolProfile } from '../types';
import { StorageService, addStorageListener } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { CP_REFERENCES, parseTPList } from '../lib/curriculumData';
import { generateExpertCurriculumDocument, generateFullCurriculumBundle } from '../lib/curriculumEngine';
import { DocumentPdfPreview } from '../components/DocumentPdfPreview';
import { CustomFormatSelector, CustomFormatConfig } from '../components/CustomFormatSelector';
import { TokenQuotaModal } from '../components/TokenQuotaModal';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';
import { AMDLogo } from '../components/AMDLogo';

export interface SyncedTPItem {
  id: string;
  babIdx: number;
  babTitle: string;
  tpCode: string;
  text: string;
  allocatedHours?: number;
}

interface AIAssistantViewProps {
  initialDocType?: string;
  onNavigate?: (viewId: string) => void;
}

const POPULAR_SUBJECTS = [
  'Fisika',
  'Matematika',
  'Biologi',
  'Kimia',
  'Informatika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'Pendidikan Agama Islam',
  'PJOK',
  'Seni Budaya',
  'Prakarya',
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ initialDocType = 'analisis_cp', onNavigate }) => {
  // 1. State Hooks
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => StorageService.getCurrentUser());
  const [quotaStatus, setQuotaStatus] = useState<TokenQuotaStatus>(() => StorageService.getTokenQuotaStatus(StorageService.getCurrentUser()));
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() => StorageService.getActiveMasterCP());
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => StorageService.getSchoolProfile());
  const [allPlans, setAllPlans] = useState<CPDistributionPlan[]>(() => StorageService.getCPDistributions());

  const initialProf = StorageService.getSchoolProfile();
  const initialMaster = StorageService.getActiveMasterCP();
  const isAdmin = currentUser?.role === 'admin';

  const [docType, setDocType] = useState<string>(() => {
    let targetDoc = initialDocType.startsWith('ai_') ? initialDocType.replace('ai_', '') : initialDocType;
    if (targetDoc === 'asesmen') targetDoc = 'rubrik_penilaian';
    return targetDoc;
  });
  const [level, setLevel] = useState<EducationLevel>(() => (initialProf.level || initialMaster?.level || 'SMA') as EducationLevel);
  const [grade, setGrade] = useState<number>(() => Number(initialProf.grade || initialMaster?.grade || 10));
  const [semester, setSemester] = useState<SemesterType>(() => (initialProf.semester || 'Ganjil') as SemesterType);
  const [subject, setSubject] = useState<string>(() => initialProf.subject || initialMaster?.subject || 'Fisika');
  const [hasManuallyModified, setHasManuallyModified] = useState<boolean>(false);

  const [syncedContext, setSyncedContext] = useState(() => StorageService.getSyncedCurriculumContext(
    initialProf.subject || initialMaster?.subject || 'Fisika',
    Number(initialProf.grade || initialMaster?.grade || 10),
    (initialProf.level || initialMaster?.level || 'SMA') as EducationLevel
  ));

  const [topic, setTopic] = useState<string>(() => {
    const initialSem = (initialProf.semester || 'Ganjil') as SemesterType;
    const isGanjil = (initialSem as string) === 'Ganjil' || (initialSem as string) === '1';
    const ctx = StorageService.getSyncedCurriculumContext(
      initialProf.subject || initialMaster?.subject || 'Fisika',
      Number(initialProf.grade || initialMaster?.grade || 10),
      (initialProf.level || initialMaster?.level || 'SMA') as EducationLevel
    );
    const mats = isGanjil
      ? (initialMaster?.materialsSem1 && initialMaster.materialsSem1.length > 0 ? initialMaster.materialsSem1 : ctx.sem1Materials)
      : (initialMaster?.materialsSem2 && initialMaster.materialsSem2.length > 0 ? initialMaster.materialsSem2 : ctx.sem2Materials);
    return mats?.[0]?.essentialMaterial || mats?.[0]?.tpName || 'Kinematika & Dinamika Gerak Lurus';
  });
  const [modulOption, setModulOption] = useState<'lengkap' | 'rpp_1lembar'>('lengkap');
  const [meetingCount, setMeetingCount] = useState<number>(2);
  const [hoursPerMeeting, setHoursPerMeeting] = useState<number>(() => {
    if (initialProf?.jpPerWeek && Number(initialProf.jpPerWeek) > 0) return Number(initialProf.jpPerWeek);
    if (initialMaster?.jpPerWeek && Number(initialMaster.jpPerWeek) > 0) return Number(initialMaster.jpPerWeek);
    const kaldik = StorageService.getKalenderPendidikan();
    if (kaldik?.semester1?.jpPerWeek && Number(kaldik.semester1.jpPerWeek) > 0) {
      return Number(kaldik.semester1.jpPerWeek);
    }
    return 3;
  });
  const [minutesPerJP, setMinutesPerJP] = useState<number>(() => {
    const rawTime = initialProf?.timeAllocationPerWeek || initialMaster?.timeAllocationPerWeek;
    if (rawTime) {
      const parsed = parseInt(rawTime, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const lvl = (initialProf?.level || initialMaster?.level || 'SMA') as EducationLevel;
    return lvl === 'SD' ? 35 : lvl === 'SMP' ? 40 : 45;
  });
  const [useManualTP, setUseManualTP] = useState<boolean>(false);
  const [manualTPText, setManualTPText] = useState<string>('');
  const [selectedTPIds, setSelectedTPIds] = useState<string[]>([]);
  const [kktpScope, setKktpScope] = useState<'semester' | 'year' | 'bab'>('semester');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Custom School Format State (PDF, Word, JPG, custom notes, checkbox)
  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>({
    useCustomFormat: false,
    formatFile: null,
    customFormatNotes: '',
  });

  // Generated content state
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>(() => {
    try {
      let targetDoc = initialDocType.startsWith('ai_') ? initialDocType.replace('ai_', '') : initialDocType;
      if (targetDoc === 'asesmen') targetDoc = 'rubrik_penilaian';
      const prof = StorageService.getSchoolProfile();
      const master = StorageService.getActiveMasterCP();
      const targetSub = prof?.subject || master?.subject || 'Fisika';
      const targetGrade = Number(prof?.grade || master?.grade || 10);
      const targetLvl = (prof?.level || master?.level || 'SMA') as EducationLevel;
      const targetSem = (prof?.semester || 'Ganjil') as SemesterType;

      const existing = StorageService.getAIDocuments().find(
        (d) => (d.type === targetDoc || d.type === `ai_${targetDoc}`) &&
               d.subject.toLowerCase() === targetSub.toLowerCase() &&
               d.grade === targetGrade
      );
      if (existing && existing.content && existing.content.trim().length > 100) {
        return existing.content;
      }
      return generateExpertCurriculumDocument({
        toolType: targetDoc,
        docType: targetDoc,
        subject: targetSub,
        level: targetLvl,
        grade: targetGrade,
        phase: targetLvl === 'SMA' ? (targetGrade === 10 ? 'Fase E' : 'Fase F') : 'Fase D',
        semester: targetSem,
      });
    } catch {
      return '';
    }
  });
  const [viewLayout, setViewLayout] = useState<'split' | 'fullscreen'>('split');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<string>('');
  const [activePaletteTab, setActivePaletteTab] = useState<'yunani' | 'matematika' | 'kimia' | 'rumus' | 'diagram' | 'lencana'>('yunani');
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyCopiedId, setHistoryCopiedId] = useState<string | null>(null);
  const [aiDocs, setAiDocs] = useState<AIDocument[]>(() => StorageService.getAIDocuments());
  const [retentionStats, setRetentionStats] = useState(() => StorageService.getAIDocsRetentionStats());

  // Download handlers for AI History documents
  const handleDownloadHistoryWord = (doc: AIDocument) => {
    const profile = StorageService.getSchoolProfile();
    const cleanDocType = doc.type || 'Dokumen';
    const cleanSubject = (doc.subject || 'Mapel').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Perangkat_Ajar_${cleanDocType}_${cleanSubject}_Kls${doc.grade || ''}_${doc.semester || ''}`;
    const exportOptions = {
      ...profile,
      teacherName: profile.teacherName,
      semester: (doc.semester || 'Ganjil') as any,
      subject: doc.subject || 'Mata Pelajaran',
      grade: Number(doc.grade) || 7,
      level: (doc.level || 'SMP') as any,
      docType: doc.type,
    };
    ExportService.exportToWord(doc.title, doc.content, exportOptions, fileName);
  };

  const handleDownloadHistoryPdf = (doc: AIDocument) => {
    const profile = StorageService.getSchoolProfile();
    const exportOptions = {
      ...profile,
      teacherName: profile.teacherName,
      semester: (doc.semester || 'Ganjil') as any,
      subject: doc.subject || 'Mata Pelajaran',
      grade: Number(doc.grade) || 7,
      level: (doc.level || 'SMP') as any,
      docType: doc.type,
    };
    ExportService.printPdfPreview(doc.title, doc.content, exportOptions);
  };

  const handleDownloadHistoryExcel = (doc: AIDocument) => {
    const profile = StorageService.getSchoolProfile();
    const cleanDocType = doc.type || 'Dokumen';
    const cleanSubject = (doc.subject || 'Mapel').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Perangkat_Ajar_${cleanDocType}_${cleanSubject}_Kls${doc.grade || ''}`;
    const exportOptions = {
      ...profile,
      teacherName: profile.teacherName,
      semester: (doc.semester || 'Ganjil') as any,
      subject: doc.subject || 'Mata Pelajaran',
      grade: Number(doc.grade) || 7,
      level: (doc.level || 'SMP') as any,
      docType: doc.type,
    };
    ExportService.exportCurriculumToExcel(doc.content, doc.title, exportOptions, fileName);
  };

  const handleCopyHistoryContent = (doc: AIDocument) => {
    navigator.clipboard.writeText(doc.content);
    setHistoryCopiedId(doc.id);
    setTimeout(() => setHistoryCopiedId(null), 2000);
  };

  // Helper to extract JP/Minggu from Profil Guru / Master CP / Kalender Pendidikan
  const getProfileJpPerWeek = (
    prof: SchoolProfile = schoolProfile,
    master: ActiveMasterCPData | null = activeMasterCP
  ): number => {
    if (prof?.jpPerWeek && Number(prof.jpPerWeek) > 0) return Number(prof.jpPerWeek);
    if (master?.jpPerWeek && Number(master.jpPerWeek) > 0) return Number(master.jpPerWeek);
    const kaldik = StorageService.getKalenderPendidikan();
    if (kaldik?.semester1?.jpPerWeek && Number(kaldik.semester1.jpPerWeek) > 0) {
      return Number(kaldik.semester1.jpPerWeek);
    }
    return 3;
  };

  const currentProfileJp = getProfileJpPerWeek();

  // Helper to extract Bab / Lingkup Materi Pokok from Profil Guru / Master CP / Synced Context
  const getProfileBabMaterials = (
    sem: SemesterType,
    master: ActiveMasterCPData | null = activeMasterCP,
    ctx = syncedContext
  ) => {
    const isYear = (sem as string) === '1 Tahun' || (sem as string) === 'year';
    if (isYear) {
      const s1 = (master?.materialsSem1 && master.materialsSem1.length > 0) ? master.materialsSem1 : (ctx?.sem1Materials || []);
      const s2 = (master?.materialsSem2 && master.materialsSem2.length > 0) ? master.materialsSem2 : (ctx?.sem2Materials || []);
      return [...s1, ...s2];
    }
    const isGanjil = (sem as string) === 'Ganjil' || (sem as string) === '1' || (sem as string) === 'Semester 1';
    const masterMats = isGanjil ? master?.materialsSem1 : master?.materialsSem2;
    if (masterMats && masterMats.length > 0) return masterMats;
    const ctxMats = isGanjil ? ctx?.sem1Materials : ctx?.sem2Materials;
    if (ctxMats && ctxMats.length > 0) return ctxMats;
    return [];
  };

  const refreshAiHistory = () => {
    const docs = StorageService.getAIDocuments();
    setAiDocs(docs);
    setRetentionStats(StorageService.getAIDocsRetentionStats());
  };

  const handleClearExpiredHistory = () => {
    const res = StorageService.cleanExpiredAIDocuments();
    refreshAiHistory();
    alert(`Pembersihan otomatis: ${res.purgedCount} dokumen > 24 jam berhasil dibersihkan. Tersisa ${res.remainingCount} dokumen aktif.`);
  };

  const handleClearAllHistory = () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh riwayat dokumen kurikulum sekarang?')) {
      return;
    }
    const res = StorageService.clearAllAIDocuments();
    refreshAiHistory();
    alert(`Seluruh riwayat dokumen (${res.clearedCount} dokumen) telah dikosongkan.`);
  };

  // Sync token quota, school profile & master CP listener
  useEffect(() => {
    const updateUserData = () => {
      const user = StorageService.getCurrentUser();
      setCurrentUser((prev) => (prev?.id === user?.id && prev?.email === user?.email ? prev : user));
      const newQuota = StorageService.getTokenQuotaStatus(user);
      setQuotaStatus((prev) => (JSON.stringify(prev) === JSON.stringify(newQuota) ? prev : newQuota));
      
      const master = StorageService.getActiveMasterCP();
      setActiveMasterCP((prev) => (JSON.stringify(prev) === JSON.stringify(master) ? prev : master));
      
      const plans = StorageService.getCPDistributions();
      setAllPlans((prev) => (JSON.stringify(prev) === JSON.stringify(plans) ? prev : plans));
      
      const prof = StorageService.getSchoolProfile();
      setSchoolProfile((prev) => (JSON.stringify(prev) === JSON.stringify(prof) ? prev : prof));

      // Always keep in sync with teacher profile and curriculum parameters
      const targetSub = prof.subject || master?.subject || 'Fisika';
      const targetLvl = (prof.level || master?.level || 'SMA') as EducationLevel;
      const targetGrade = Number(prof.grade || master?.grade || 10);
      const targetSem = (prof.semester || 'Ganjil') as SemesterType;
      const targetJp = Number(prof.jpPerWeek || master?.jpPerWeek || StorageService.getKalenderPendidikan()?.semester1?.jpPerWeek || 3);

      setSubject(targetSub);
      setLevel(targetLvl);
      setGrade(targetGrade);
      setSemester(targetSem);
      setHoursPerMeeting(targetJp);

      if (prof.timeAllocationPerWeek || master?.timeAllocationPerWeek) {
        const parsedMin = parseInt(prof.timeAllocationPerWeek || master?.timeAllocationPerWeek || '', 10);
        if (!isNaN(parsedMin) && parsedMin > 0) {
          setMinutesPerJP(parsedMin);
        }
      }

      // Auto sync topic with Bab / Lingkup Materi Pokok from Profil Guru & Master CP
      const targetCtx = StorageService.getSyncedCurriculumContext(targetSub, targetGrade, targetLvl);
      const mats = getProfileBabMaterials(targetSem, master, targetCtx);
      if (mats.length > 0 && (mats[0]?.essentialMaterial || mats[0]?.tpName)) {
        const newTopic = mats[0].essentialMaterial || mats[0].tpName;
        setTopic(newTopic);
      }

      setSyncedContext(targetCtx);
    };

    updateUserData();

    const handleCPEvent = () => {
      setHasManuallyModified(false);
      updateUserData();
    };

    const unsubscribe = addStorageListener(() => {
      updateUserData();
    });

    window.addEventListener('master-cp-updated', handleCPEvent);
    window.addEventListener('school-profile-updated', handleCPEvent);
    window.addEventListener('curriculum-parameters-synced', handleCPEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('master-cp-updated', handleCPEvent);
      window.removeEventListener('school-profile-updated', handleCPEvent);
      window.removeEventListener('curriculum-parameters-synced', handleCPEvent);
    };
  }, []);

  // Helper Phase
  const getPhaseName = (g: number, lvl: EducationLevel) => {
    if (lvl === 'SD') {
      if (g <= 2) return 'Fase A';
      if (g <= 4) return 'Fase B';
      return 'Fase C';
    }
    if (lvl === 'SMP') return 'Fase D';
    if (g === 10) return 'Fase E';
    return 'Fase F';
  };

  const currentPhase = getPhaseName(grade, level);

  // Check if current configuration matches Teacher Profile
  const isFollowingProfile =
    subject.trim().toLowerCase() === (schoolProfile.subject || initialProf.subject || 'Fisika').trim().toLowerCase() &&
    level === (schoolProfile.level || initialProf.level || 'SMA') &&
    Number(grade) === Number(schoolProfile.grade || initialProf.grade || 10);

  // Available Bab materials for current semester and context
  const availableBabMaterials = useMemo(() => {
    return getProfileBabMaterials(semester, activeMasterCP, syncedContext);
  }, [semester, activeMasterCP, syncedContext]);

  // Extract individual TPs synchronized with Profil Guru (parsed from TP formulations)
  const allSyncedTPs: SyncedTPItem[] = useMemo(() => {
    const list: SyncedTPItem[] = [];
    availableBabMaterials.forEach((mat: any, bIdx: number) => {
      const babTitle = mat.essentialMaterial || mat.tpName || `Bab ${bIdx + 1}`;
      const count = Math.max(1, mat.tpCount || 1);
      const parsed = parseTPList(mat.tpName, count, babTitle, subject);
      parsed.forEach((text, tpIdx) => {
        const cleanText = text.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/i, '').trim();
        const baseCode = mat.tpCode || `TP.${grade}.${bIdx + 1}`;
        const finalCode = parsed.length > 1 
          ? (baseCode.includes('.') ? `${baseCode}.${tpIdx + 1}` : `TP.${grade}.${bIdx + 1}.${tpIdx + 1}`) 
          : baseCode;
        list.push({
          id: `${mat.id || `mat_${bIdx}`}_tp_${tpIdx}`,
          babIdx: bIdx,
          babTitle,
          tpCode: finalCode,
          text: cleanText,
          allocatedHours: mat.allocatedHours,
        });
      });
    });
    return list;
  }, [availableBabMaterials, grade, subject]);

  // Function to sync selected TP list into manualTPText and useManualTP state
  const syncSelectedTPsToForm = (ids: string[], tpList = allSyncedTPs) => {
    const chosen = tpList.filter((t) => ids.includes(t.id));
    if (chosen.length > 0) {
      const formatted = chosen
        .map((t, idx) => `${idx + 1}. [${t.tpCode}] ${t.text}`)
        .join('\n');
      setManualTPText(formatted);
      setUseManualTP(true);
    } else {
      setManualTPText('');
      setUseManualTP(false);
    }
  };


  // Keep selectedTPIds in sync with available TP list or auto-select current Bab's TPs
  useEffect(() => {
    if (allSyncedTPs.length === 0) {
      setSelectedTPIds((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    setSelectedTPIds((prev) => {
      const valid = prev.filter((id) => allSyncedTPs.some((t) => t.id === id));
      if (valid.length > 0) {
        return valid.length === prev.length ? prev : valid;
      }
      // Auto-select TPs corresponding to current topic or first Bab
      const matching = allSyncedTPs.filter(
        (t) =>
          t.babTitle.trim().toLowerCase() === topic.trim().toLowerCase() ||
          topic.trim().toLowerCase().includes(t.babTitle.trim().toLowerCase())
      );
      const toSelect = matching.length > 0 ? matching : allSyncedTPs.slice(0, 2);
      const newIds = toSelect.map((t) => t.id);
      if (newIds.length === prev.length && newIds.every((id, i) => id === prev[i])) {
        return prev;
      }
      return newIds;
    });
  }, [allSyncedTPs, topic]);

  // Synchronize manual TP text whenever selectedTPIds changes cleanly
  useEffect(() => {
    if (selectedTPIds.length > 0) {
      const chosen = allSyncedTPs.filter((t) => selectedTPIds.includes(t.id));
      if (chosen.length > 0) {
        const formatted = chosen
          .map((t, idx) => `${idx + 1}. [${t.tpCode}] ${t.text}`)
          .join('\n');
        setManualTPText((prev) => (prev === formatted ? prev : formatted));
        setUseManualTP((prev) => (prev === true ? prev : true));
      }
    } else {
      setManualTPText((prev) => (prev === '' ? prev : ''));
      setUseManualTP((prev) => (prev === false ? prev : false));
    }
  }, [selectedTPIds, allSyncedTPs]);

  const handleToggleTP = (tpId: string) => {
    setHasManuallyModified(true);
    setSelectedTPIds((prev) =>
      prev.includes(tpId) ? prev.filter((id) => id !== tpId) : [...prev, tpId]
    );
  };

  // Reset to Teacher Profile
  const handleResetToTeacherProfile = () => {
    const prof = StorageService.getSchoolProfile();
    const master = StorageService.getActiveMasterCP();
    const targetSub = prof.subject || master?.subject || 'Fisika';
    const targetLvl = (prof.level || master?.level || 'SMA') as EducationLevel;
    const targetGrade = Number(prof.grade || master?.grade || 10);
    const targetSem = (prof.semester || 'Ganjil') as SemesterType;
    const targetJp = Number(prof.jpPerWeek || master?.jpPerWeek || StorageService.getKalenderPendidikan()?.semester1?.jpPerWeek || 3);

    setSubject(targetSub);
    setLevel(targetLvl);
    setGrade(targetGrade);
    setSemester(targetSem);
    setHoursPerMeeting(targetJp);
    setHasManuallyModified(false);

    if (prof.timeAllocationPerWeek || master?.timeAllocationPerWeek) {
      const parsedMin = parseInt(prof.timeAllocationPerWeek || master?.timeAllocationPerWeek || '', 10);
      if (!isNaN(parsedMin) && parsedMin > 0) setMinutesPerJP(parsedMin);
    }

    const ctx = StorageService.getSyncedCurriculumContext(targetSub, targetGrade, targetLvl);
    setSyncedContext(ctx);

    // Pick Bab / Lingkup Materi Pokok from Profil Guru
    const materials = getProfileBabMaterials(targetSem, master, ctx);
    if (materials.length > 0) {
      setTopic(materials[0].essentialMaterial || materials[0].tpName);
    }

    setResetFeedback('Acuan, Topik & Jam/Pertemuan disesuaikan dengan Profil Guru');
    setTimeout(() => setResetFeedback(''), 2500);
  };

  // Reset RPM Format to official standard Deep Learning Kurikulum Merdeka
  const handleResetRPMFormat = () => {
    // 1. Reset custom format and uploaded files
    setCustomFormatConfig({
      useCustomFormat: false,
      formatFile: null,
      customFormatNotes: '',
    });
    // 2. Reset meeting count & JP options
    setMeetingCount(2);
    setModulOption('lengkap');
    const defaultJp = getProfileJpPerWeek() || 2;
    setHoursPerMeeting(defaultJp);
    const standardMin = level === 'SD' ? 35 : level === 'SMP' ? 40 : 45;
    setMinutesPerJP(standardMin);
    // 3. Reset manual TP & custom prompts
    setUseManualTP(false);
    setManualTPText('');
    setCustomPrompt('');
    setSelectedTPIds([]);
    // 4. Set feedback
    setResetFeedback('Format RPM berhasil di-reset ulang ke standar baku resmi Deep Learning (3 Bagian & 6 Sintaks)!');
    setTimeout(() => setResetFeedback(''), 4500);
  };

  // Handle semester change and auto-adjust topic to Bab of that semester
  const handleSemesterChange = (newSem: SemesterType) => {
    setSemester(newSem);
    setHasManuallyModified(true);
    const targetJp = getProfileJpPerWeek();
    setHoursPerMeeting(targetJp);
    const mats = getProfileBabMaterials(newSem, activeMasterCP, syncedContext);
    if (mats.length > 0) {
      setTopic(mats[0].essentialMaterial || mats[0].tpName);
    }
  };

  // Handle grade change and auto-adjust topic
  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    setHasManuallyModified(true);
    const targetJp = getProfileJpPerWeek();
    setHoursPerMeeting(targetJp);
    const newContext = StorageService.getSyncedCurriculumContext(subject, newGrade, level);
    setSyncedContext(newContext);
    const mats = getProfileBabMaterials(semester, activeMasterCP, newContext);
    if (mats.length > 0) {
      setTopic(mats[0].essentialMaterial || mats[0].tpName);
    }
  };

  // When subject changes, see if a matching distribution plan exists
  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    setHasManuallyModified(true);
    const targetJp = getProfileJpPerWeek();
    setHoursPerMeeting(targetJp);
    const match = allPlans.find((p) => p.subject.toLowerCase() === newSub.toLowerCase());
    if (match) {
      setLevel(match.level as EducationLevel);
      setGrade(Number(match.grade));
      const mats = semester === 'Ganjil' ? match.materialsSem1 : match.materialsSem2;
      if (mats && mats.length > 0) {
        setTopic(mats[0].essentialMaterial || mats[0].tpName);
      }
    } else {
      const newCtx = StorageService.getSyncedCurriculumContext(newSub, grade, level);
      setSyncedContext(newCtx);
      const mats = getProfileBabMaterials(semester, activeMasterCP, newCtx);
      if (mats && mats.length > 0) {
        setTopic(mats[0].essentialMaterial || mats[0].tpName);
      }
    }
  };

  // Apply Master CP to current form
  const handleApplyMasterCP = () => {
    if (!activeMasterCP) return;
    setSubject(activeMasterCP.subject);
    setLevel(activeMasterCP.level as EducationLevel);
    setGrade(Number(activeMasterCP.grade));
    setHasManuallyModified(true);
    const targetJp = Number(activeMasterCP.jpPerWeek || getProfileJpPerWeek());
    setHoursPerMeeting(targetJp);
    const activeMaterials = semester === 'Ganjil' ? activeMasterCP.materialsSem1 : activeMasterCP.materialsSem2;
    if (activeMaterials && activeMaterials.length > 0) {
      setTopic(activeMaterials[0].essentialMaterial || activeMaterials[0].tpName);
    }
  };

  // Compute Grade List according to Level
  const availableGrades = level === 'SD' ? [1, 2, 3, 4, 5, 6] : level === 'SMP' ? [7, 8, 9] : [10, 11, 12];

  // Get matching CP from reference if available
  const currentCP = CP_REFERENCES.find(
    (c) => c.level === level && c.grade === grade && c.subject.toLowerCase() === subject.toLowerCase()
  );

  const docTypesList = [
    { id: 'analisis_alokasi_waktu', label: '0. Analisis Alokasi Waktu (RBE & Deep Learning)', icon: Calendar, desc: 'Perhitungan Pekan Efektif & Struktur Waktu 3 Pilar', badge: 'Deep Learning' },
    { id: 'analisis_cp', label: '1. Analisis & Distribusi CP (Deep Learning)', icon: FileSearch, desc: 'Dekomposisi Elemen CP & Distribusi Semester 1 & 2', badge: '3 Pilar' },
    { id: 'tp', label: '2. Tujuan Pembelajaran (TP Deep Learning)', icon: Target, desc: 'Rumusan Kaidah ABCD, Bloom HOTS & 3 Pilar Pedagogis', badge: 'Kaidah ABCD' },
    { id: 'atp', label: '3. Alur Tujuan Pembelajaran (ATP 10 Kolom)', icon: GitMerge, desc: 'Standar Baku Resmi 10 Kolom Kemendikbudristek & Deep Learning', badge: '10 Kolom Utama' },
    { id: 'prota', label: '4. Program Tahunan (PROTA Deep Learning)', icon: CalendarRange, desc: 'Format Standar Baku 4 Kolom & Alokasi Waktu 3 Pilar Tahunan', badge: '4 Kolom Utama' },
    { id: 'prosem', label: '5. Program Semester (PROSEM Deep Learning)', icon: CalendarCheck, desc: 'Matriks Pekan Efektif Berwarna & Agenda Siklus Deep Learning', badge: 'Berwarna & Siklus' },
    { id: 'kktp', label: '6. Kriteria Ketuntasan (KKTP Deep Learning)', icon: CheckSquare, desc: 'Interval Nilai, Rubrik 4 Level & Asesmen TP Terpadu', badge: 'Format Utama' },
    { id: 'modul_ajar', label: '7. RPM Deep Learning (Rencana Pelaksanaan Modul)', icon: FileText, desc: 'Format Standar Baku Mutlak Tunggal: Bagian A s.d. X (6 Fase KBM)', badge: 'Deep Learning' },
    { id: 'lkpd', label: '8. LKPD Deep Learning (Sinkron RPM)', icon: FileSpreadsheet, desc: 'Sintaks Inkuiri, Kanvas Sketsa Siswa & Refleksi 3-2-1', badge: 'Sinkron RPM' },
    { id: 'rubrik_penilaian', label: '9. Rubrik Penilaian Deep Learning', icon: HelpCircle, desc: 'Rubrik Sikap 6C, Kinerja LKPD & Asesmen Sumatif HOTS Terpadu', badge: '3 Pilar & 6C' },
  ];

  // Instant document builder: generates complete, official formatted document instantaneously
  const buildInstantDocument = (targetType?: string): string => {
    let activeDocType = String(targetType || docType || 'analisis_cp');
    if (activeDocType.startsWith('ai_')) activeDocType = activeDocType.replace('ai_', '');
    if (activeDocType === 'asesmen') activeDocType = 'rubrik_penilaian';

    let resolvedTopic = topic.trim();
    if (activeDocType === 'prota') {
      resolvedTopic = `Program Tahunan (PROTA) - Seluruh Lingkup Materi Semester Ganjil & Genap`;
    } else if (activeDocType === 'analisis_cp' || activeDocType === 'ai_analisis_cp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0
        ? `Analisis CP Semester ${semester}: ${titles.join(', ')}`
        : `Analisis Capaian Pembelajaran (CP) Semester ${semester}`;
    } else if (activeDocType === 'tp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0 
        ? `Seluruh Materi Pokok Semester ${semester}: ${titles.join(', ')}`
        : `Seluruh Materi Pokok Semester ${semester}`;
    } else if (activeDocType === 'atp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0 
        ? `Alur Tujuan Pembelajaran Semester ${semester}: ${titles.join(', ')}`
        : `Alur Tujuan Pembelajaran Semester ${semester}`;
    } else if (activeDocType === 'kktp' || activeDocType === 'ai_kktp') {
      if (kktpScope === 'year') {
        resolvedTopic = `KKTP 1 Tahun Pelajaran Penuh (Semester 1 & 2) - Seluruh Lingkup Materi`;
      } else if (kktpScope === 'semester') {
        const mats = getProfileBabMaterials(semester);
        const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
        resolvedTopic = titles.length > 0 
          ? `Seluruh Materi Pokok Semester ${semester}: ${titles.join(', ')}`
          : `Seluruh Materi Pokok Semester ${semester}`;
      } else {
        const mats = getProfileBabMaterials(semester);
        resolvedTopic = topic || (mats[0]?.essentialMaterial || mats[0]?.tpName || `Bab 1`);
      }
    } else if (!resolvedTopic) {
      resolvedTopic = currentCP?.topic || `${subject} - Materi Pokok Semester ${semester}`;
    }
    const totalJP = meetingCount * hoursPerMeeting;
    const activeDistribution = activeMasterCP || StorageService.getCPDistributions().find(p => p.subject.toLowerCase() === subject.toLowerCase());
    
    const selectedTPObjects = allSyncedTPs.filter((t) => selectedTPIds.includes(t.id));
    const finalManualTP =
      selectedTPObjects.length > 0
        ? selectedTPObjects.map((t, idx) => `${idx + 1}. [${t.tpCode}] ${t.text}`).join('\n')
        : (useManualTP && manualTPText.trim() ? manualTPText.trim() : undefined);

    const prof = StorageService.getSchoolProfile();
    const payload = {
      docType: activeDocType,
      toolType: activeDocType,
      level,
      grade,
      phase: currentPhase,
      semester,
      subject,
      topic: resolvedTopic,
      meetingCount,
      hoursPerMeeting,
      minutesPerJP,
      totalJP,
      cpText: activeMasterCP?.cpText || currentCP?.cpText || 'Memahami dan menganalisis gagasan serta pesan dalam konteks pembelajaran mendalam.',
      distributionData: activeDistribution,
      kalenderData: StorageService.getKalenderPendidikan(),
      modulOption: activeDocType === 'modul_ajar' ? modulOption : undefined,
      manualTP: finalManualTP,
      useManualTP: !!finalManualTP,
      kktpScope: (activeDocType === 'kktp' || activeDocType === 'ai_kktp') ? kktpScope : undefined,
      selectedTPs: selectedTPObjects.map((t) => ({ code: t.tpCode, text: t.text, babTitle: t.babTitle })),
      subTopics: selectedTPObjects.length > 0 ? selectedTPObjects.map((t) => t.text) : undefined,
      customPrompt,
      customInstructions: customPrompt,
      useCustomFormat: customFormatConfig.useCustomFormat,
      customFormatNotes: customFormatConfig.customFormatNotes,
      customFormatFile: customFormatConfig.formatFile,
      schoolProfile: prof,
      teacherName: prof?.teacherName || currentUser?.name || 'Guru Pengampu',
      teacherNip: prof?.teacherNip,
      headmasterName: prof?.headmasterName,
      headmasterNip: prof?.headmasterNip,
      schoolName: prof?.schoolName,
      city: prof?.city,
      academicYear: prof?.academicYear,
    };

    if (activeDocType === 'bundle' || activeDocType === 'bundel_lengkap' || activeDocType === 'perangkat_ajar_lengkap') {
      return generateFullCurriculumBundle(payload);
    }
    return generateExpertCurriculumDocument(payload);
  };

  const handleSwitchDocType = (newType: string) => {
    let cleanType = newType.startsWith('ai_') ? newType.replace('ai_', '') : newType;
    if (cleanType === 'asesmen') cleanType = 'rubrik_penilaian';
    setDocType(cleanType);

    const existing = StorageService.getAIDocuments().find(
      (d) => (d.type === cleanType || d.type === `ai_${cleanType}`) &&
             d.subject.toLowerCase() === subject.toLowerCase() &&
             d.grade === grade
    );
    if (existing && existing.content && existing.content.trim().length > 100) {
      setGeneratedMarkdown(existing.content);
    } else {
      const generated = buildInstantDocument(cleanType);
      if (generated) {
        setGeneratedMarkdown(generated);
      }
    }

    if (onNavigate) {
      onNavigate(`ai_${cleanType}`);
    }
  };

  // Instant Synchronization effect: When initialDocType changes or parameters update, immediately load or generate document
  useEffect(() => {
    let targetDoc = initialDocType.startsWith('ai_') ? initialDocType.replace('ai_', '') : initialDocType;
    if (targetDoc === 'asesmen') targetDoc = 'rubrik_penilaian';
    setDocType(targetDoc);

    const existing = StorageService.getAIDocuments().find(
      (d) => (d.type === targetDoc || d.type === `ai_${targetDoc}`) &&
             d.subject.toLowerCase() === subject.toLowerCase() &&
             d.grade === grade
    );
    if (existing && existing.content && existing.content.trim().length > 100) {
      setGeneratedMarkdown(existing.content);
    } else {
      try {
        const generated = buildInstantDocument(targetDoc);
        if (generated) {
          setGeneratedMarkdown(generated);
        }
      } catch (e) {
        console.warn('Instant document build note:', e);
      }
    }
  }, [initialDocType, subject, grade, level, semester]);

  const handleGenerate = async (customTypeArg?: string | unknown) => {
    const customType = typeof customTypeArg === 'string' ? customTypeArg : undefined;
    const activeDocType = String(customType || docType || 'analisis_cp');
    if (customType) {
      setDocType(customType);
    }

    // 1. Quota & Token Limit Verification (Maksimal 20 klik/hari)
    const user = StorageService.getCurrentUser();
    const currentQuota = StorageService.getTokenQuotaStatus(user);

    if (currentQuota.isExhausted && !currentQuota.isAdmin) {
      setShowTokenModal(true);
      return;
    }

    // 2. Consume 1 AI Token
    const consumeRes = StorageService.consumeAIToken(user, activeDocType);
    if (!consumeRes.success) {
      setShowTokenModal(true);
      return;
    }

    // Refresh quota status immediately
    setQuotaStatus(StorageService.getTokenQuotaStatus(user));

    setLoading(true);
    setGeneratedMarkdown('');

    let resolvedTopic = topic.trim();
    if (activeDocType === 'prota') {
      resolvedTopic = `Program Tahunan (PROTA) - Seluruh Lingkup Materi Semester Ganjil & Genap`;
    } else if (activeDocType === 'analisis_cp' || activeDocType === 'ai_analisis_cp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0
        ? `Analisis CP Semester ${semester}: ${titles.join(', ')}`
        : `Analisis Capaian Pembelajaran (CP) Semester ${semester}`;
    } else if (activeDocType === 'tp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0 
        ? `Seluruh Materi Pokok Semester ${semester}: ${titles.join(', ')}`
        : `Seluruh Materi Pokok Semester ${semester}`;
    } else if (activeDocType === 'atp') {
      const mats = getProfileBabMaterials(semester);
      const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
      resolvedTopic = titles.length > 0 
        ? `Alur Tujuan Pembelajaran Semester ${semester}: ${titles.join(', ')}`
        : `Alur Tujuan Pembelajaran Semester ${semester}`;
    } else if (activeDocType === 'kktp' || activeDocType === 'ai_kktp') {
      if (kktpScope === 'year') {
        resolvedTopic = `KKTP 1 Tahun Pelajaran Penuh (Semester 1 & 2) - Seluruh Lingkup Materi`;
      } else if (kktpScope === 'semester') {
        const mats = getProfileBabMaterials(semester);
        const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
        resolvedTopic = titles.length > 0 
          ? `Seluruh Materi Pokok Semester ${semester}: ${titles.join(', ')}`
          : `Seluruh Materi Pokok Semester ${semester}`;
      } else {
        const mats = getProfileBabMaterials(semester);
        resolvedTopic = topic || (mats[0]?.essentialMaterial || mats[0]?.tpName || `Bab 1`);
      }
    } else if (!resolvedTopic) {
      resolvedTopic = currentCP?.topic || `${subject} - Materi Pokok Semester ${semester}`;
    }
    const totalJP = meetingCount * hoursPerMeeting;
    const activeDistribution = activeMasterCP || StorageService.getCPDistributions().find(p => p.subject.toLowerCase() === subject.toLowerCase());
    
    // Resolve marked TPs from Profil Guru or manual text
    const selectedTPObjects = allSyncedTPs.filter((t) => selectedTPIds.includes(t.id));
    const finalManualTP =
      selectedTPObjects.length > 0
        ? selectedTPObjects.map((t, idx) => `${idx + 1}. [${t.tpCode}] ${t.text}`).join('\n')
        : (useManualTP && manualTPText.trim() ? manualTPText.trim() : undefined);

    const payload = {
      docType: activeDocType,
      toolType: activeDocType,
      level,
      grade,
      phase: currentPhase,
      semester,
      subject,
      topic: resolvedTopic,
      meetingCount,
      hoursPerMeeting,
      minutesPerJP,
      totalJP,
      cpText: activeMasterCP?.cpText || currentCP?.cpText || 'Memahami dan menganalisis gagasan serta pesan dalam konteks pembelajaran mendalam.',
      distributionData: activeDistribution,
      kalenderData: StorageService.getKalenderPendidikan(),
      modulOption: activeDocType === 'modul_ajar' ? modulOption : undefined,
      manualTP: finalManualTP,
      useManualTP: !!finalManualTP,
      kktpScope: (activeDocType === 'kktp' || activeDocType === 'ai_kktp') ? kktpScope : undefined,
      selectedTPs: selectedTPObjects.map((t) => ({ code: t.tpCode, text: t.text, babTitle: t.babTitle })),
      subTopics: selectedTPObjects.length > 0 ? selectedTPObjects.map((t) => t.text) : undefined,
      customPrompt,
      customInstructions: customPrompt,
      useCustomFormat: customFormatConfig.useCustomFormat,
      customFormatNotes: customFormatConfig.customFormatNotes,
      customFormatFile: customFormatConfig.formatFile,
      schoolProfile: StorageService.getSchoolProfile(),
      teacherName: StorageService.getSchoolProfile()?.teacherName || (user as any)?.displayName || (user as any)?.name || (user as any)?.username || 'Guru Pengampu',
      teacherNip: StorageService.getSchoolProfile()?.teacherNip,
      headmasterName: StorageService.getSchoolProfile()?.headmasterName,
      headmasterNip: StorageService.getSchoolProfile()?.headmasterNip,
      schoolName: StorageService.getSchoolProfile()?.schoolName,
      city: StorageService.getSchoolProfile()?.city,
      academicYear: StorageService.getSchoolProfile()?.academicYear,
    };

    let content = '';

    try {
      const response = await fetch('/api/ai/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && data.content.trim().length > 50) {
          content = data.content;
        }
      }
    } catch (err: any) {
      console.warn('Network request failed, attempting direct Gemini client or expert engine:', err);
    }

    // Try client-side direct Gemini call if on static hosting (e.g. GitHub Pages) and key is saved
    if (!content && typeof window !== 'undefined') {
      const clientApiKey = localStorage.getItem('agk_client_gemini_key');
      if (clientApiKey) {
        try {
          const directPrompt = `Anda adalah pakar Kurikulum Merdeka & Deep Learning Indonesia. Buatlah ${activeDocType} resmi dan lengkap untuk mata pelajaran ${subject}, jenjang ${level}, kelas ${grade}, fase ${currentPhase}, semester ${semester}, materi/topik "${resolvedTopic}". ${customPrompt ? `Instruksi khusus: ${customPrompt}` : ''}`;
          const directRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: directPrompt }] }],
              }),
            }
          );
          if (directRes.ok) {
            const directData = await directRes.json();
            const directText = directData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (directText && directText.trim().length > 50) {
              content = directText;
            }
          }
        } catch (directErr) {
          console.warn('Direct Gemini call fallback notice:', directErr);
        }
      }
    }

    // Fallback if network or server did not return content
    if (!content) {
      if (activeDocType === 'bundle' || activeDocType === 'bundel_lengkap' || activeDocType === 'perangkat_ajar_lengkap') {
        content = generateFullCurriculumBundle({
          toolType: activeDocType,
          docType: activeDocType,
          subject,
          level,
          grade,
          phase: currentPhase,
          semester,
          topic: resolvedTopic,
          meetingCount,
          hoursPerMeeting,
          minutesPerJP,
          totalJP,
          modulOption,
          manualTP: finalManualTP,
          useManualTP: !!finalManualTP,
          customPrompt,
          cpText: activeMasterCP?.cpText || currentCP?.cpText,
          distributionData: activeDistribution,
          kalenderData: StorageService.getKalenderPendidikan(),
          schoolProfile: StorageService.getSchoolProfile(),
          useCustomFormat: customFormatConfig.useCustomFormat,
          customFormatNotes: customFormatConfig.customFormatNotes,
          customFormatFile: customFormatConfig.formatFile,
        });
      } else {
        content = generateExpertCurriculumDocument({
          toolType: activeDocType,
          docType: activeDocType,
          subject,
          level,
          grade,
          phase: currentPhase,
          semester,
          topic: resolvedTopic,
          meetingCount,
          hoursPerMeeting,
          minutesPerJP,
          totalJP,
          modulOption,
          manualTP: finalManualTP,
          useManualTP: !!finalManualTP,
          kktpScope: (activeDocType === 'kktp' || activeDocType === 'ai_kktp') ? kktpScope : undefined,
          subTopics: selectedTPObjects.length > 0 ? selectedTPObjects.map((t) => t.text) : undefined,
          customPrompt,
          cpText: activeMasterCP?.cpText || currentCP?.cpText,
          distributionData: activeDistribution,
          kalenderData: StorageService.getKalenderPendidikan(),
          schoolProfile: StorageService.getSchoolProfile(),
          useCustomFormat: customFormatConfig.useCustomFormat,
          customFormatNotes: customFormatConfig.customFormatNotes,
          customFormatFile: customFormatConfig.formatFile,
        });
      }
    }

    setGeneratedMarkdown(content);
    // Switch to full width layout so user can review the complete document comfortably
    setViewLayout('fullscreen');

    // Save to AI Docs History
    const foundDoc = docTypesList.find((d) => d.id === activeDocType);
    const docLabel = foundDoc ? foundDoc.label : (typeof activeDocType === 'string' ? activeDocType.toUpperCase() : 'DOKUMEN');
    const newDoc: AIDocument = {
      id: `ai-doc-${Date.now()}`,
      type: activeDocType as any,
      title: `${docLabel} - ${subject} Kelas ${grade} (${semester})`,
      level,
      grade,
      subject,
      semester,
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    StorageService.saveAIDocument(newDoc);

    // Add audit log
    const docTypeUpper = typeof activeDocType === 'string' ? activeDocType.toUpperCase() : 'DOKUMEN';
    StorageService.addAccessLog({
      userId: user?.id || 'guest',
      userEmail: user?.email || 'guru@belajar.id',
      userName: user?.name || 'Guru Pengampu',
      userRole: user?.role || 'guru',
      action: `Penyusunan Perangkat Ajar (${docTypeUpper})`,
      details: `Menghasilkan dokumen ${newDoc.title} dengan Kurikulum Deep Learning (Sisa kuota: ${consumeRes.status.remaining} klik).`,
      status: 'success',
    });

    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exports
  const handleExportExcel = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    const effectiveTeacher = schoolProfile.teacherName;
    const fileName = `Perangkat_Ajar_${docType}_${subject}_Kls${grade}`;
    const exportOptions = {
      ...schoolProfile,
      teacherName: effectiveTeacher,
      semester: semester as any,
      subject,
      grade,
      level: level as any,
      docType,
    };
    const matchedLabel = docTypesList.find((d) => d.id === docType)?.label || (typeof docType === 'string' ? docType : 'DOKUMEN');
    const docTitle = `${matchedLabel.toUpperCase()} - ${subject}`;
    ExportService.exportCurriculumToExcel(generatedMarkdown, docTitle, exportOptions, fileName);
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    const effectiveTeacher = schoolProfile.teacherName;
    const fileName = `Perangkat_Ajar_${docType}_${subject}_Kls${grade}`;
    const exportOptions = {
      ...schoolProfile,
      teacherName: effectiveTeacher,
      semester: semester as any,
      subject,
      grade,
      level: level as any,
      docType,
    };
    const matchedLabel = docTypesList.find((d) => d.id === docType)?.label || (typeof docType === 'string' ? docType : 'DOKUMEN');
    const docTitle = `${matchedLabel.toUpperCase()} - ${subject}`;
    ExportService.exportToWord(docTitle, generatedMarkdown, exportOptions, fileName);
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    const effectiveTeacher = schoolProfile.teacherName;
    const exportOptions = {
      ...schoolProfile,
      teacherName: effectiveTeacher,
      semester: semester as any,
      subject,
      grade,
      level: level as any,
      docType,
    };
    const matchedLabel = docTypesList.find((d) => d.id === docType)?.label || (typeof docType === 'string' ? docType : 'Dokumen');
    const docTitle = `${matchedLabel} (${subject})`;
    ExportService.printPdfPreview(docTitle, generatedMarkdown, exportOptions);
  };

  const currentDocInfo = docTypesList.find((d) => d.id === docType) || docTypesList[0];
  const ActiveDocIcon = currentDocInfo.icon;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center p-1.5 shrink-0 shadow-sm text-white">
              <ActiveDocIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {currentDocInfo.label}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {currentDocInfo.badge || 'Format Resmi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentDocInfo.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Switch to Master CP if on Analisis CP */}
            {(docType === 'analisis_cp' || docType === 'ai_analisis_cp') && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('upload_cp_master')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center space-x-1.5 transition shadow-2xs"
                title="Buka tampilan upload file CP dan tabel matriks elemen"
              >
                <FolderSync className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload & Kelola CP Master</span>
                <ChevronRight className="w-3 h-3 text-indigo-500" />
              </button>
            )}

            {/* Layout Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout('split')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                  viewLayout === 'split'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan 2 Kolom (Formulir & Dokumen Berdampingan)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>2 Kolom</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('fullscreen')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                  viewLayout === 'fullscreen'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Penuh (Dokumen Lebar Maksimal)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tampilan Penuh</span>
              </button>
            </div>

            {/* Riwayat Dokumen & 24h Auto-Purge Status */}
            <button
              type="button"
              onClick={() => {
                refreshAiHistory();
                setShowHistoryModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm"
              title="Lihat riwayat dokumen sementara (otomatis dikosongkan setiap 24 jam)"
            >
              <History className="w-3.5 h-3.5 text-amber-700" />
              <span>Arsip Dokumen (24 Jam)</span>
              {aiDocs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  {aiDocs.length}
                </span>
              )}
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('kalender_pendidikan')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Atur Kalender</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Instrument Switcher Tabs Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        {/* Tampilan Alternatif Khusus Analisis CP */}
        {(docType === 'analisis_cp' || docType === 'ai_analisis_cp') && onNavigate && (
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 px-1.5">Tampilan Analisis CP:</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 shadow-xs border border-blue-200 flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Format Dokumen Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analisis_cp_distribusi')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/80 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Tabel Matriks &amp; Elemen CP</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('upload_cp_master')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/80 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FolderSync className="w-3.5 h-3.5 text-slate-500" />
              <span>3. Upload &amp; Master CP</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="text-xs font-bold text-slate-800">
            <span>Pilih Dokumen Perangkat:</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {docTypesList.map((d) => {
            const isSelected = docType === d.id;
            const DocIcon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSwitchDocType(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <DocIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <span>{d.label.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronization Banner with Profil Guru & Parameter Kurikulum */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-emerald-50/90 border border-blue-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Sinkronisasi Otomatis Perangkat Ajar Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Tersinkron Acuan Profil & Parameter
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed truncate">
              Acuan Guru: <strong className="text-slate-900">{schoolProfile.teacherName || 'Guru Pengampu'}</strong> {schoolProfile.teacherNip ? `(NIP: ${schoolProfile.teacherNip})` : ''} • <span className="font-semibold text-blue-900">{schoolProfile.schoolName || 'Satuan Pendidikan'}</span> • Mapel: <strong className="text-indigo-900">{subject}</strong> • Kelas: <span className="font-medium text-slate-900">{level} {grade} ({currentPhase})</span> • Beban: <span className="font-medium text-emerald-800">{hoursPerMeeting} JP/Mgg ({minutesPerJP} mnt/JP)</span> • <span className="text-indigo-700 font-semibold">Deep Learning</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('profil_guru_mapel')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition flex items-center space-x-1"
              title="Buka menu Profil Guru Mata Pelajaran"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Profil Guru</span>
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('parameter_kurikulum')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition flex items-center space-x-1"
              title="Buka menu Parameter Kurikulum"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Parameter</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetToTeacherProfile}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center space-x-1.5"
            title="Terapkan ulang acuan Profil Guru & Parameter Kurikulum ke seluruh formulir perangkat ajar"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-100" />
            <span>Sinkronkan Ulang</span>
          </button>
        </div>
      </div>

      {resetFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetFeedback}</span>
        </div>
      )}

      {/* Main Grid: Parameter Formulation Left & AI Document Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Fullscreen Quick Controls Banner */}
        {viewLayout === 'fullscreen' && (
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                {grade}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                  <span>{subject} • Kelas {grade} ({level}) • Semester {semester}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {docTypesList.find((d) => d.id === docType)?.label || docType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Topik: <span className="text-slate-800 font-medium">{topic}</span> • {meetingCount} Pertemuan
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewLayout('split')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center space-x-1.5 transition"
              >
                <Columns className="w-3.5 h-3.5 text-slate-600" />
                <span>Ubah Parameter (2 Kolom)</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Susun Ulang Perangkat</span>
              </button>
            </div>
          </div>
        )}

        {/* Left Column: Parameter Formulation */}
        {viewLayout === 'split' && (
          <div className="lg:col-span-5 space-y-3.5">
          {/* Active Master CP Status Banner */}
          {activeMasterCP ? (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-700">
                    Master CP Terhubung
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeMasterCP.subject} • {activeMasterCP.phase}
                </span>
              </div>
              <div className="text-xs text-slate-800 font-semibold truncate">
                📄 {activeMasterCP.fileName}
              </div>
              <div className="flex items-center space-x-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleApplyMasterCP}
                  className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Terapkan Parameter CP Master</span>
                </button>
                {isAdmin && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('upload_cp')}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="Upload / Analisis File CP Baru (Khusus Admin)"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Baru</span>
                  </button>
                )}
              </div>
            </div>
          ) : isAdmin ? (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <FileSearch className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ingin sinkronisasi dari file CP resmi?</span>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('upload_cp')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0 ml-2"
                >
                  Upload CP (Admin)
                </button>
              )}
            </div>
          ) : null}

          {/* Parameter Formulation Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs shadow-sm">
            {/* Status Acuan Patokan Utama: Profil Guru, Master CP & Parameter Kurikulum */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 space-y-2.5 transition-all shadow-2xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 bg-blue-600 text-white rounded-md">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Patokan Utama Pembuatan Perangkat Ajar
                  </span>
                </div>
                {isFollowingProfile ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Tersinkronisasi Penuh
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" />
                    Kustomisasi Aktif
                  </span>
                )}
              </div>

              {/* 3 Pillars Summary */}
              <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600">
                <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Profil Guru:</span>
                  </span>
                  <span className="font-medium text-slate-900 truncate max-w-[200px]">
                    {schoolProfile.teacherName || 'Guru Pengampu'} ({schoolProfile.schoolName || 'Sekolah'})
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Master CP:</span>
                  </span>
                  <span className="font-medium text-slate-900 truncate max-w-[200px]">
                    {activeMasterCP?.fileName ? `Dokumen ${activeMasterCP.fileName}` : 'Capaian Pembelajaran No. 020 Tahun 2026'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Parameter & Beban:</span>
                  </span>
                  <span className="font-medium text-slate-900 truncate max-w-[200px]">
                    {subject} • Kelas {grade} ({currentPhase}) • {currentProfileJp} JP/Mgg
                  </span>
                </div>
              </div>

              {/* Quick Navigation and Reset */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/50">
                <div className="flex items-center gap-1.5">
                  {!isFollowingProfile && (
                    <button
                      type="button"
                      onClick={handleResetToTeacherProfile}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Kembalikan Parameter ke Profil Guru Utama"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Ikuti Profil Guru</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {onNavigate && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigate('profil_guru_mapel')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold transition shadow-2xs flex items-center gap-1"
                        title="Buka Profil Guru & CP Master"
                      >
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span>Profil Guru</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('parameter_kurikulum')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold transition shadow-2xs flex items-center gap-1"
                        title="Buka Parameter Kurikulum & Beban Belajar"
                      >
                        <Sliders className="w-3 h-3 text-indigo-600" />
                        <span>Parameter</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {resetFeedback && (
                <div className="p-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{resetFeedback}</span>
                </div>
              )}
            </div>



            {/* Document Type Selector */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200">
              <label className="block text-slate-700 font-bold text-xs flex items-center justify-between">
                <span>Pilih Dokumen yang Ingin Dibuat:</span>
                {currentDocInfo.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {currentDocInfo.badge}
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
                >
                  {docTypesList.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-900 font-medium py-1">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] text-slate-500 leading-tight pt-0.5">
                {currentDocInfo.desc}
              </div>
            </div>

            {/* Mata Pelajaran & Quick Preset Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold flex items-center gap-1.5">
                  <span>Mata Pelajaran / Bidang Studi *</span>
                  {isFollowingProfile ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Sesuai Profil Guru
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Kustom Terpisah
                    </span>
                  )}
                </label>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Contoh: Fisika, Matematika, Bahasa Indonesia..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Jenjang, Kelas & Fase */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Jenjang Pendidikan</label>
                <select
                  value={level}
                  onChange={(e) => {
                    const newLvl = e.target.value as EducationLevel;
                    setLevel(newLvl);
                    setHasManuallyModified(true);
                    if (newLvl === 'SD') setGrade(4);
                    else if (newLvl === 'SMP') setGrade(7);
                    else setGrade(10);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Menengah Pertama)</option>
                  <option value="SMA">SMA (Menengah Atas)</option>
                  <option value="SMK">SMK (Kejuruan)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Kelas & Fase</label>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {currentPhase}
                  </span>
                </div>
                <select
                  value={grade}
                  onChange={(e) => handleGradeChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-600"
                >
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      Kelas {g} ({getPhaseName(g, level)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semester Selection */}
            {docType === 'prota' || (docType === 'kktp' && kktpScope === 'year') ? (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarRange className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900">
                      {docType === 'kktp' ? 'Cakupan Dokumen KKTP Tahunan:' : 'Cakupan Program Tahunan (PROTA):'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    1 Tahun Penuh (Semester 1 & 2)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {docType === 'kktp'
                    ? 'KKTP secara otomatis merangkum instrumen penilaian seluruh TP untuk Semester Ganjil & Genap (1 Tahun Penuh) langsung dari Profil Guru.'
                    : 'PROTA secara otomatis merangkum seluruh alokasi waktu dan bab pokok untuk Semester Ganjil & Genap langsung dari Profil Guru.'}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold text-xs">Semester</label>
                  <span className="text-[10px] text-slate-500">
                    {availableBabMaterials.length} Bab Profil Guru
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSemesterChange('Ganjil')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] text-center transition border ${
                      semester === 'Ganjil'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    Semester 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSemesterChange('Genap')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] text-center transition border ${
                      semester === 'Genap'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    Semester 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSemesterChange('1 Tahun')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] text-center transition border ${
                      semester === '1 Tahun'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    1 Tahun
                  </button>
                </div>
              </div>
            )}

            {/* SINKRONISASI OTOMATIS PROFIL GURU UNTUK ANALISIS CP, TP, ATP, PROTA, PROSEM */}
            {docType === 'analisis_cp' ||
            docType === 'ai_analisis_cp' ||
            docType === 'cp' ||
            docType === 'tp' ||
            docType === 'atp' ||
            docType === 'prota' ||
            docType === 'prosem' ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl p-3 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Tersinkron Otomatis dengan Profil Guru &amp; Kaldik
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Otomatis Seluruh Bab
                  </span>
                </div>

                {/* List Bab yang tersinkron */}
                <div className="bg-white/95 p-2.5 rounded-lg border border-blue-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      {docType === 'prota'
                        ? 'Daftar Seluruh Bab Profil Guru (1 Tahun Ajaran Penuh):'
                        : `Daftar Seluruh Bab Profil Guru (Semester ${semester}):`}
                    </span>
                    <span className="text-blue-700 font-semibold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {docType === 'prota'
                        ? `${getProfileBabMaterials('Ganjil').length + getProfileBabMaterials('Genap').length} Bab Terdata`
                        : `${availableBabMaterials.length} Bab Terdata`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {docType === 'prota' ? (
                      <>
                        {getProfileBabMaterials('Ganjil').map((m, idx) => (
                          <span
                            key={`g-${idx}`}
                            className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-medium"
                          >
                            <span className="font-bold mr-1 text-blue-700">Sem 1 •</span>
                            {m.essentialMaterial || m.tpName} {m.allocatedHours ? `(${m.allocatedHours} JP)` : ''}
                          </span>
                        ))}
                        {getProfileBabMaterials('Genap').map((m, idx) => (
                          <span
                            key={`gn-${idx}`}
                            className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium"
                          >
                            <span className="font-bold mr-1 text-indigo-700">Sem 2 •</span>
                            {m.essentialMaterial || m.tpName} {m.allocatedHours ? `(${m.allocatedHours} JP)` : ''}
                          </span>
                        ))}
                      </>
                    ) : (
                      availableBabMaterials.map((m, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-medium"
                        >
                          <span className="font-bold mr-1 text-blue-700">Bab {idx + 1}:</span>
                          {m.essentialMaterial || m.tpName} {m.allocatedHours ? `(${m.allocatedHours} JP)` : ''}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* CAKUPAN PENILAIAN KKTP (PER BAB / LINGKUP MATERI ATAU SELURUH BAB) */}
                {(docType === 'kktp' || docType === 'ai_kktp') && (
                  <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-white border border-indigo-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="w-4 h-4 text-indigo-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          Cakupan Penilaian Kriteria Ketercapaian (KKTP):
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Standar Asesmen BSKAP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setKktpScope('semester');
                          const mats = getProfileBabMaterials(semester);
                          const titles = mats.map((m) => m.essentialMaterial || m.tpName).filter(Boolean);
                          if (titles.length > 0) {
                            setTopic(`Seluruh Materi Pokok Semester ${semester}`);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          kktpScope === 'semester'
                            ? 'bg-white text-indigo-800 shadow-xs border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="KKTP per Semester (Semester 1 / Ganjil atau Semester 2 / Genap) - Standar Baku BSKAP"
                      >
                        <span>📅 Per Semester (Sem {semester === 'Ganjil' ? '1' : '2'})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKktpScope('year');
                          setTopic(`KKTP 1 Tahun Pelajaran Penuh (Semester 1 & 2)`);
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          kktpScope === 'year'
                            ? 'bg-white text-indigo-800 shadow-xs border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="KKTP 1 Tahun Penuh (Mencakup Semester Ganjil & Genap Sekaligus)"
                      >
                        <span>🗓️ 1 Tahun Penuh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKktpScope('bab');
                          if (availableBabMaterials.length > 0) {
                            const firstMat = availableBabMaterials[0];
                            const newTopic = firstMat.essentialMaterial || firstMat.tpName;
                            setTopic(newTopic);
                            const babTPs = allSyncedTPs.filter((t) => t.babTitle === newTopic);
                            if (babTPs.length > 0) {
                              const newIds = babTPs.map((t) => t.id);
                              setSelectedTPIds(newIds);
                              syncSelectedTPsToForm(newIds, allSyncedTPs);
                            }
                          }
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          kktpScope === 'bab'
                            ? 'bg-white text-indigo-800 shadow-xs border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="KKTP spesifik untuk 1 Bab / Lingkup Materi tertentu"
                      >
                        <span>🎯 Per Bab / Materi</span>
                      </button>
                    </div>

                    {kktpScope === 'semester' ? (
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100 text-[11px] text-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900">
                            Mode Penilaian KKTP Setiap Semester (Semester {semester}):
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            Standar Utama Kurikulum Merdeka
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Dokumen KKTP dibuat untuk <strong>setiap semester</strong> (Semester {semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'}), menyusun instrumen penilaian rinci untuk <strong>setiap TP</strong> pada seluruh {availableBabMaterials.length} bab semester ini lengkap dengan rubrik deskriptif 4 level, interval nilai ketuntasan, matriks rekapitulasi semester, dan lembar ceklis asesmen siswa.
                        </p>
                      </div>
                    ) : kktpScope === 'year' ? (
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100 text-[11px] text-slate-700 space-y-1">
                        <div className="font-bold text-indigo-900">
                          Mode Penilaian KKTP 1 Tahun Pelajaran Penuh (Semester 1 & 2):
                        </div>
                        <p className="text-slate-600">
                          Dokumen KKTP merangkum instrumen penilaian seluruh TP untuk <strong>1 Tahun Pelajaran Penuh</strong> (mencakup Semester 1 dan Semester 2 sekaligus) secara komprehensif dari Profil Guru & Master CP.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-indigo-800 bg-indigo-50/70 p-2 rounded-md border border-indigo-100">
                        🎯 <strong>Fokus Penilaian TP:</strong> Pilih Bab/Lingkup Materi di bawah ini untuk menyusun instrumen penilaian setiap TP dalam bab tersebut secara mendalam (Rubrik 4 Level, Matriks Interval, &amp; Lembar Ceklis Asesmen Siswa).
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="block text-slate-800 font-bold text-xs">
                      Topik / Materi Pokok Pembelajaran *
                    </label>
                    {availableBabMaterials.some(
                      (m) =>
                        (m.essentialMaterial && m.essentialMaterial.trim().toLowerCase() === topic.trim().toLowerCase()) ||
                        (m.tpName && m.tpName.trim().toLowerCase() === topic.trim().toLowerCase())
                    ) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Sesuai Bab Profil Guru
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const mats = getProfileBabMaterials(semester);
                      const targetJp = getProfileJpPerWeek();
                      setHoursPerMeeting(targetJp);
                      if (mats.length > 0) {
                        setTopic(mats[0].essentialMaterial || mats[0].tpName);
                      }
                    }}
                    title="Kembalikan / sesuaikan topik ke Bab Profil Guru"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sesuaikan Bab Profil Guru</span>
                  </button>
                </div>

                {/* Dropdown Bab / Lingkup Materi Pokok dari Profil Guru */}
                {availableBabMaterials.length > 0 && (
                  <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-950">
                      <span className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                        <span>Pilih Bab / Lingkup Materi Pokok (Profil Guru - Semester {semester}):</span>
                      </span>
                      <span className="text-[10px] font-medium text-blue-700">
                        {availableBabMaterials.length} Bab
                      </span>
                    </div>
                    <select
                      value={
                        availableBabMaterials.some(
                          (m) => (m.essentialMaterial || m.tpName) === topic
                        )
                          ? topic
                          : '__custom__'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== '__custom__') {
                          const found = availableBabMaterials.find(
                            (m) => (m.essentialMaterial || m.tpName) === val
                          );
                          if (found) {
                            const newTopic = found.essentialMaterial || found.tpName;
                            setTopic(newTopic);
                            const targetJp = getProfileJpPerWeek();
                            setHoursPerMeeting(targetJp);
                            const babHours = Number(found.allocatedHours) || (targetJp * 5);
                            const calculatedMeetings = Math.max(1, Math.round(babHours / targetJp));
                            setMeetingCount(calculatedMeetings);
                            const babTPs = allSyncedTPs.filter((t) => t.babTitle === newTopic);
                            if (babTPs.length > 0) {
                              const newIds = babTPs.map((t) => t.id);
                              setSelectedTPIds(newIds);
                              syncSelectedTPsToForm(newIds, allSyncedTPs);
                            }
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      {availableBabMaterials.map((item, idx) => {
                        const matTitle = item.essentialMaterial || item.tpName;
                        const babHours = Number(item.allocatedHours) || 25;
                        const babMeetings = Math.max(1, Math.round(babHours / currentProfileJp));
                        return (
                          <option key={item.id || idx} value={matTitle}>
                            {item.essentialMaterial ? item.essentialMaterial : `Bab ${idx + 1}: ${item.tpName}`} ({babHours} JP • {babMeetings} Pertemuan)
                          </option>
                        );
                      })}
                      <option value="__custom__">-- Masukkan Topik Kustom Manual / Bab Lain --</option>
                    </select>
                  </div>
                )}

                {/* Input Teks Topik Langsung */}
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setHasManuallyModified(true);
                  }}
                  placeholder="Ketik atau edit nama Bab / Lingkup Materi Pokok..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs focus:outline-none focus:border-blue-600 shadow-inner"
                />

                {/* DAFTAR TUJUAN PEMBELAJARAN (TP) TERSINKRON PROFIL GURU (MULTI-SELECT CHECKBOXES) */}
                {(docType === 'modul_ajar' || docType === 'lkpd' || docType === 'rubrik_penilaian' || docType === 'asesmen' || ((docType === 'kktp' || docType === 'ai_kktp') && kktpScope === 'bab')) && (
                  <div className="space-y-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">
                            {docType === 'kktp' || docType === 'ai_kktp' ? 'Tujuan Pembelajaran (TP) yang Dinilai (KKTP):' : 'Tujuan Pembelajaran (TP) Tersinkron Profil Guru:'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {selectedTPIds.length} TP Ditandai {docType === 'kktp' || docType === 'ai_kktp' ? 'untuk KKTP' : 'untuk RPM'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {docType === 'kktp' || docType === 'ai_kktp'
                            ? 'Tandai satu atau seluruh TP dalam bab/lingkup materi ini untuk dinilai kriteria ketercapaiannya (rubrik 4 level, interval, & lembar ceklis).'
                            : 'Tandai satu atau lebih dari 1 TP yang ingin dimasukkan ke dalam modul ajar / RPM.'}
                        </p>
                      </div>

                      {/* Quick Selection Toolbar */}
                      <div className="flex items-center space-x-1.5 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const matching = allSyncedTPs.filter(
                              (t) =>
                                t.babTitle.trim().toLowerCase() === topic.trim().toLowerCase() ||
                                topic.trim().toLowerCase().includes(t.babTitle.trim().toLowerCase())
                            );
                            const targetList = matching.length > 0 ? matching : allSyncedTPs;
                            const ids = targetList.map((t) => t.id);
                            setSelectedTPIds(ids);
                            syncSelectedTPsToForm(ids, allSyncedTPs);
                            setHasManuallyModified(true);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold transition flex items-center space-x-1 shadow-xs"
                          title="Tandai seluruh TP pada Bab ini"
                        >
                          <CheckCheck className="w-3 h-3 text-blue-600" />
                          <span>Tandai Bab Ini</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const allIds = allSyncedTPs.map((t) => t.id);
                            setSelectedTPIds(allIds);
                            syncSelectedTPsToForm(allIds, allSyncedTPs);
                            setHasManuallyModified(true);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold transition flex items-center space-x-1 shadow-xs"
                          title="Tandai seluruh TP di Semester ini"
                        >
                          <CheckSquare className="w-3 h-3 text-emerald-600" />
                          <span>Tandai Semua ({allSyncedTPs.length})</span>
                        </button>

                        {selectedTPIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTPIds([]);
                              syncSelectedTPsToForm([], allSyncedTPs);
                              setHasManuallyModified(true);
                            }}
                            className="px-2 py-1 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded text-[10px] font-semibold transition"
                            title="Hapus semua tanda TP"
                          >
                            <span>Batal Semua</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List of TPs with Checkboxes */}
                    {allSyncedTPs.length === 0 ? (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                        Belum ada rumusan TP yang terdaftar di Profil Guru. Anda dapat mengisinya di menu Profil Guru Mata Pelajaran atau memasukkan rumusan manual.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {/* Grouped by Bab */}
                        {availableBabMaterials.map((mat: any, bIdx: number) => {
                          const babTitle = mat.essentialMaterial || mat.tpName || `Bab ${bIdx + 1}`;
                          const babTPs = allSyncedTPs.filter((t) => t.babIdx === bIdx);
                          if (babTPs.length === 0) return null;
                          const isCurrentBab =
                            topic.trim().toLowerCase() === babTitle.trim().toLowerCase() ||
                            topic.trim().toLowerCase().includes(babTitle.trim().toLowerCase());
                          const allSelectedInBab = babTPs.every((t) => selectedTPIds.includes(t.id));
                          const selectedInBabCount = babTPs.filter((t) => selectedTPIds.includes(t.id)).length;

                          return (
                            <div
                              key={bIdx}
                              className={`rounded-lg border transition-all ${
                                isCurrentBab
                                  ? 'bg-white border-blue-300 shadow-xs ring-1 ring-blue-100'
                                  : 'bg-white/90 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Bab Sub-header */}
                              <div className="px-2.5 py-1.5 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-1.5 font-bold text-slate-800 truncate">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-800 shrink-0 font-mono">
                                    {mat.tpCode || `Bab ${bIdx + 1}`}
                                  </span>
                                  <span className="truncate">{babTitle}</span>
                                  {mat.allocatedHours && (
                                    <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                      ({mat.allocatedHours} JP)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {selectedInBabCount}/{babTPs.length} dipilih
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHasManuallyModified(true);
                                      if (allSelectedInBab) {
                                        const next = selectedTPIds.filter(
                                          (id) => !babTPs.some((t) => t.id === id)
                                        );
                                        setSelectedTPIds(next);
                                        syncSelectedTPsToForm(next, allSyncedTPs);
                                      } else {
                                        const next = Array.from(
                                          new Set([...selectedTPIds, ...babTPs.map((t) => t.id)])
                                        );
                                        setSelectedTPIds(next);
                                        syncSelectedTPsToForm(next, allSyncedTPs);
                                        setTopic(babTitle);
                                      }
                                    }}
                                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 rounded"
                                  >
                                    {allSelectedInBab ? 'Batal Bab' : 'Pilih Bab'}
                                  </button>
                                </div>
                              </div>

                              {/* TP Items in this Bab */}
                              <div className="p-1.5 space-y-1">
                                {babTPs.map((tp) => {
                                  const isChecked = selectedTPIds.includes(tp.id);
                                  return (
                                    <div
                                      key={tp.id}
                                      onClick={() => handleToggleTP(tp.id)}
                                      className={`p-2 rounded-md border text-left cursor-pointer transition flex items-start space-x-2.5 ${
                                        isChecked
                                          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400/80 text-emerald-950 shadow-xs'
                                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <div className="mt-0.5 shrink-0">
                                        {isChecked ? (
                                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-1.5">
                                          <span
                                            className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                                              isChecked
                                                ? 'bg-emerald-200 text-emerald-900'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                          >
                                            {tp.tpCode}
                                          </span>
                                        </div>
                                        <p className="text-xs leading-snug mt-1 font-normal text-slate-800">
                                          {tp.text}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Realtime Synchronized Summary Box */}
                    {selectedTPIds.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{selectedTPIds.length} TP</strong> ditandai untuk dimasukkan ke dalam RPM &amp; Modul Ajar.
                          </span>
                        </div>
                        {docType === 'modul_ajar' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                              {meetingCount} Pertemuan (Pilihan Manual Guru)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Meeting and JP configuration for RPM */}
            {docType === 'modul_ajar' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Format Rencana Pelaksanaan Modul (RPM)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Sintaks Deep Learning
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetRPMFormat}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-[11px] font-semibold transition flex items-center gap-1.5 shadow-xs"
                    title="Reset semua format acuan, file kustom, alokasi waktu, dan tujuan pembelajaran ke format standar resmi RPM"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-600" />
                    <span>Reset Ulang Format RPM</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Jumlah Pertemuan & Alokasi Jam (JP)</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Total: {meetingCount * hoursPerMeeting} JP ({meetingCount * hoursPerMeeting * minutesPerJP} Menit)
                    </span>
                  </div>

                  {/* Dual Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span className="flex items-center space-x-1">
                          <span>Jml Pertemuan:</span>
                          {(() => {
                            const matched = availableBabMaterials.find((m) => (m.essentialMaterial || m.tpName) === topic);
                            return matched ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Sinkron Bab
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-300">
                                Pilihan Guru
                              </span>
                            );
                          })()}
                        </span>
                        <span className="text-blue-600 font-bold">{meetingCount} Pertemuan</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={meetingCount}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const val = parseNumberInput(e.target.value, 1, 1, 30);
                            setMeetingCount(val);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-[11px] text-slate-500 shrink-0">Kali</span>
                      </div>
                      <div className="flex items-center space-x-1 pt-1">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setMeetingCount(num)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition border ${
                              meetingCount === num
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}P
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span className="flex items-center space-x-1">
                          <span>Jam/Pertemuan:</span>
                          {hoursPerMeeting === currentProfileJp && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Kaldik / Profil
                            </span>
                          )}
                        </span>
                        <span className="text-blue-600 font-bold">{hoursPerMeeting} JP</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={hoursPerMeeting}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const val = parseNumberInput(e.target.value, 1, 1, 20);
                            setHoursPerMeeting(val);
                            const matched = availableBabMaterials.find((m) => (m.essentialMaterial || m.tpName) === topic);
                            if (matched && matched.allocatedHours && val > 0) {
                              setMeetingCount(Math.max(1, Math.round(Number(matched.allocatedHours) / val)));
                            }
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-[11px] text-slate-500 shrink-0">JP</span>
                      </div>
                      <div className="flex items-center space-x-1 pt-1">
                        {Array.from(new Set([2, 3, 4, 5, currentProfileJp]))
                          .sort((a, b) => a - b)
                          .map((jp) => (
                            <button
                              key={jp}
                              type="button"
                              onClick={() => {
                                setHoursPerMeeting(jp);
                                const matched = availableBabMaterials.find((m) => (m.essentialMaterial || m.tpName) === topic);
                                if (matched && matched.allocatedHours && jp > 0) {
                                  setMeetingCount(Math.max(1, Math.round(Number(matched.allocatedHours) / jp)));
                                }
                              }}
                              className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition border ${
                                hoursPerMeeting === jp
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={jp === currentProfileJp ? 'Sesuai JP/Minggu Kalender & Profil Guru' : undefined}
                            >
                              {jp}JP{jp === currentProfileJp ? '★' : ''}
                            </button>
                          ))}
                      </div>
                      {hoursPerMeeting !== currentProfileJp && (
                        <button
                          type="button"
                          onClick={() => {
                            setHoursPerMeeting(currentProfileJp);
                            const matched = availableBabMaterials.find((m) => (m.essentialMaterial || m.tpName) === topic);
                            if (matched && matched.allocatedHours && currentProfileJp > 0) {
                              setMeetingCount(Math.max(1, Math.round(Number(matched.allocatedHours) / currentProfileJp)));
                            }
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold block text-center w-full pt-0.5"
                        >
                          ↻ Samakan Beban Kaldik ({currentProfileJp} JP/Minggu)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sync Banner for Bab Allocation and Meetings */}
                  {(() => {
                    const matched = availableBabMaterials.find((m) => (m.essentialMaterial || m.tpName) === topic);
                    const babJp = matched?.allocatedHours ? Number(matched.allocatedHours) : meetingCount * hoursPerMeeting;
                    return (
                      <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-950">
                        <span className="flex items-center space-x-1.5">
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            Alokasi Bab: <strong>{babJp} JP</strong> ÷ <strong>{hoursPerMeeting} JP/Mg</strong> = <strong>{meetingCount} Kali Pertemuan</strong>
                          </span>
                        </span>
                        <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                          Total: {meetingCount * hoursPerMeeting} JP
                        </span>
                      </div>
                    );
                  })()}

                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <span>Standar Durasi:</span>
                      <select
                        value={minutesPerJP}
                        onChange={(e) => setMinutesPerJP(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 font-semibold focus:outline-none text-xs"
                      >
                        <option value={45}>45 Menit / JP (SMA / SMK)</option>
                        <option value={40}>40 Menit / JP (SMP)</option>
                        <option value={35}>35 Menit / JP (SD)</option>
                      </select>
                    </div>
                    <span className="text-slate-800 font-bold">
                      {hoursPerMeeting * minutesPerJP} Menit / Pertemuan
                    </span>
                  </div>
                </div>

                {/* Manual TP (Tujuan Pembelajaran) Configuration */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Rumusan Tujuan Pembelajaran (TP):</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                        selectedTPIds.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : useManualTP
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {selectedTPIds.length > 0
                        ? `✓ ${selectedTPIds.length} TP Ditandai Profil Guru`
                        : useManualTP
                          ? 'TP Mandiri'
                          : 'Otomatis Sistem'}
                    </span>
                  </div>

                  {/* Toggle Mode */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseManualTP(false);
                        setSelectedTPIds([]);
                      }}
                      className={`p-2 rounded-lg text-left font-semibold transition border text-xs flex items-start space-x-2 ${
                        !useManualTP && selectedTPIds.length === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <div className="leading-tight">Rumusan Otomatis</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">
                          Standar CP & HOTS
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUseManualTP(true);
                        if (!manualTPText.trim()) {
                          setManualTPText(
                            `1. Mengidentifikasi konsep esensial dan pola keteraturan dalam ${topic || subject} secara kritis dan mandiri.\n2. Menganalisis hubungan antar-variabel dan memecahkan persoalan kontekstual melalui penyelidikan terbimbing.\n3. Merancang dan mempresentasikan karya rekayasa solusi inovatif ${topic || subject} secara kolaboratif.`
                          );
                        }
                      }}
                      className={`p-2 rounded-lg text-left font-semibold transition border text-xs flex items-start space-x-2 ${
                        useManualTP || selectedTPIds.length > 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <div className="leading-tight">
                          {selectedTPIds.length > 0 ? 'TP Profil Guru / Manual' : 'Input TP Manual'}
                        </div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">
                          {selectedTPIds.length > 0 ? `${selectedTPIds.length} TP terpilih` : 'Rumusan TP sendiri'}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Manual TP Input Card */}
                  {(useManualTP || selectedTPIds.length > 0) && (
                    <div className="p-3 rounded-lg bg-white border border-slate-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                          <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                          <span>Daftar TP yang Digunakan:</span>
                          {selectedTPIds.length > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Tersinkron Profil Guru
                            </span>
                          )}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!manualTPText.trim()) return;
                              const lines = manualTPText.split('\n');
                              let num = 1;
                              const formatted = lines
                                .map((l) => l.trim())
                                .filter(Boolean)
                                .map((l) => {
                                  const clean = l.replace(/^(\d+[\.\)\-:]|\-|\*|\•)\s*/, '').trim();
                                  const res = `${num}. ${clean}`;
                                  num++;
                                  return res;
                                });
                              setManualTPText(formatted.join('\n'));
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-semibold transition"
                          >
                            Rapikan Penomoran (1, 2, dst)
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={manualTPText}
                        onChange={(e) => setManualTPText(e.target.value)}
                        placeholder={`1. Mengidentifikasi prinsip dasar materi kontekstual.\n2. Menganalisis data penyelidikan dan menyelesaikan studi kasus.`}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>

                {/* Upload Format Sekolah Sendiri sebagai Acuan RPM */}
                <div className="pt-2 border-t border-slate-200">
                  <CustomFormatSelector
                    value={customFormatConfig}
                    onChange={setCustomFormatConfig}
                    docTypeName="RPM (Rencana Pelaksanaan Modul)"
                    docTypeId="modul_ajar"
                  />
                </div>
              </div>
            )}

            {/* LKPD Special Configuration */}
            {docType === 'lkpd' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Tersinkronisasi dengan Modul Ajar (RPM)
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Sintaks Deep Learning
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center space-x-1">
                        <span>Jml Pertemuan LKPD:</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-300">
                          Pilihan Manual Guru
                        </span>
                      </span>
                      <span className="text-blue-600 font-bold">{meetingCount} Pertemuan</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={meetingCount}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => {
                          const val = parseNumberInput(e.target.value, 1, 1, 30);
                          setMeetingCount(val);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0">Kali</span>
                    </div>
                    <div className="flex items-center space-x-1 pt-1">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMeetingCount(num)}
                          className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition border ${
                            meetingCount === num
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {num}P
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center space-x-1">
                        <span>Jam/Pertemuan:</span>
                        {hoursPerMeeting === currentProfileJp && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Profil Guru
                          </span>
                        )}
                      </span>
                      <span className="text-blue-600 font-bold">{hoursPerMeeting} JP</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={hoursPerMeeting}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => {
                          const val = parseNumberInput(e.target.value, 1, 1, 20);
                          setHoursPerMeeting(val);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0">JP</span>
                    </div>
                    {hoursPerMeeting !== currentProfileJp && (
                      <button
                        type="button"
                        onClick={() => setHoursPerMeeting(currentProfileJp)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold block text-center w-full pt-0.5"
                      >
                        ↻ Samakan Profil Guru ({currentProfileJp} JP/Minggu)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Instruction Prompt & Rich Content Toolbar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-semibold text-xs flex items-center space-x-1.5">
                  <span>Instruksi Khusus Tambahan (Opsional)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPalette(!showPalette)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold flex items-center space-x-1 transition"
                  >
                    <Sigma className="w-3 h-3 text-blue-600" />
                    <span>{showPalette ? 'Tutup Palet Simbol' : 'Buka Palet Simbol & Rumus'}</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Contoh: Wajib cantumkan rumus $F=m \cdot a$, bagan alur konsep, dan tabel variabel pengamatan..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
              />

              {/* Expandable Comprehensive Palette Box */}
              {showPalette && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('yunani')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'yunani'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Yunani
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('matematika')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'matematika'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Matematika
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('kimia')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'kimia'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Kimia
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('rumus')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'rumus'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      LaTeX
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('diagram')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'diagram'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Diagram & Tabel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaletteTab('lencana')}
                      className={`px-2 py-1 rounded font-semibold transition ${
                        activePaletteTab === 'lencana'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Lencana Tag
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="pt-1">
                    {activePaletteTab === 'yunani' && (
                      <div className="flex flex-wrap gap-1">
                        {['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Δ', 'Σ', 'Ω', 'Ψ'].map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${sym}`)}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}

                    {activePaletteTab === 'matematika' && (
                      <div className="flex flex-wrap gap-1">
                        {['±', '×', '÷', '·', '≤', '≥', '≠', '≈', '≡', '∞', '∝', '√', '∛', '∫', '∬', '∮', '∑', '∏', '∂', '∇', '°', '‰', '∈', '∉', '⊂', '⊆', '∪', '∩', '∅', '∀', '∃', '∴', '∵'].map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${sym}`)}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}

                    {activePaletteTab === 'kimia' && (
                      <div className="flex flex-wrap gap-1">
                        {['→', '⇌', '⇒', '⇔', '↑', '↓', '⇄', 'H₂O', 'CO₂', 'CH₄', 'O₂', 'NaCl', 'SO₄²⁻', 'NH₃', 'H⁺', 'OH⁻', 'ΔH', 'Ka', 'Kb'].map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${sym}`)}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}

                    {activePaletteTab === 'rumus' && (
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Pecahan $\\frac{a}{b}$', val: '$\\frac{a}{b}$' },
                          { label: 'Pangkat $x^2$', val: '$x^{2}$' },
                          { label: 'Akar $\\sqrt{x}$', val: '$\\sqrt{x}$' },
                          { label: 'Hukum II Newton $$F = m \\cdot a$$', val: '$$F = m \\cdot a$$' },
                          { label: 'Kecepatan $$v = \\frac{s}{t}$$', val: '$$v = \\frac{s}{t}$$' },
                          { label: 'Derajat Asam $$\\text{pH} = -\\log[\\text{H}^+]$$', val: '$$\\text{pH} = -\\log[\\text{H}^+]$$' },
                          { label: 'Rumus ABC $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$', val: '$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$' },
                          { label: 'Integral $$\\int_{a}^{b} f(x) dx$$', val: '$$\\int_{a}^{b} f(x) dx$$' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${item.val}`)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activePaletteTab === 'diagram' && (
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Tabel Skenario KBM 4 Kolom', val: '+ Sajikan langkah KBM tiap pertemuan dalam tabel 4 kolom resmi: | FASE | WAKTU | KEGIATAN GURU | KEGIATAN PESERTA DIDIK |.' },
                          { label: 'Tabel Sintaks 6 Fase Deep Learning', val: '+ Sajikan desain sintaks pembelajaran dalam tabel: | FASE | TUJUAN | AKTIVITAS GURU | AKTIVITAS SISWA |.' },
                          { label: 'Tabel Diferensiasi (Konten, Proses, Produk)', val: '+ Sajikan tabel pemetaan diferensiasi: | Aspek Diferensiasi | Siswa Reguler | Siswa Butuh Bimbingan | Siswa Mahir |.' },
                          { label: 'Tabel Rubrik 4 Kategori KKTP', val: '+ Sajikan rubrik asesmen dalam tabel 4 level pencapaian KKTP: | Indikator Penilaian | Perlu Bimbingan (1) | Cukup (2) | Baik (3) | Sangat Baik (4) |.' },
                          { label: 'Tabel Matriks Analisis CP - TP - ATP - JP', val: '+ Sajikan pemetaan materi dalam tabel matriks: | No | Elemen CP | Capaian Pembelajaran | Tujuan Pembelajaran (TP) | Alur Tujuan (ATP) | Alokasi JP |.' },
                          { label: 'Tabel 3 Variabel Eksperimen', val: '+ Lengkapi tabel penyelidikan 3 variabel: | No | Variabel Bebas | Variabel Terikat | Variabel Kontrol | Pengamatan |.' },
                          { label: 'Tabel Kisi-Kisi Soal Asesmen', val: '+ Buatkan tabel kisi-kisi asesmen: | No | Capaian / TP | Indikator Soal | Level Kognitif (HOTS/LOTS) | Bentuk Soal | No Soal |.' },
                          { label: 'Kotak Kanvas Sketsa Siswa', val: '+ Berikan ruang kotak [KANVAS SKETSA VISUAL SISWA] untuk gambar kreasi murid.' },
                          { label: 'Skema Alur Konsep (ASCII Diagram)', val: '+ Sertakan bagan alur proses skematis menggunakan diagram visual ASCII.' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${item.val}`)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition font-medium"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activePaletteTab === 'lencana' && (
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '[Mindful Learning]', val: '[Mindful Learning]' },
                          { label: '[Meaningful Learning]', val: '[Meaningful Learning]' },
                          { label: '[Joyful Learning]', val: '[Joyful Learning]' },
                          { label: '[Deep Learning]', val: '[Deep Learning]' },
                          { label: '[HOTS]', val: '[HOTS]' },
                          { label: '[Diferensiasi]', val: '[Diferensiasi]' },
                          { label: '[Asesmen Formatif]', val: '[Asesmen Formatif]' },
                          { label: '[Asesmen Sumatif]', val: '[Asesmen Sumatif]' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setCustomPrompt((prev) => `${prev} ${item.val}`)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Custom School Format Selector & Checkbox (for documents other than modul_ajar, since modul_ajar has it inside its dedicated section) */}
            {docType !== 'modul_ajar' && (
              <CustomFormatSelector
                value={customFormatConfig}
                onChange={setCustomFormatConfig}
                docTypeName={docTypesList.find((d) => d.id === docType)?.label || 'Perangkat Ajar'}
                docTypeId={docType}
              />
            )}

            {/* Generate Trigger Button */}
            <button
              id="btn-generate-ai"
              type="button"
              disabled={loading}
              onClick={() => handleGenerate()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyusun Dokumen Kurikulum...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Menyusun Perangkat</span>
                </>
              )}
            </button>
            </div>
          </div>
        )}

        {/* Right Column: Output Viewer & PDF Document View */}
        <div className={`${viewLayout === 'fullscreen' ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col space-y-4`}>
          {/* Quick Notice for Analisis CP */}
          {(docType === 'analisis_cp' || docType === 'ai_analisis_cp') && onNavigate && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <FileSearch className="w-4 h-4 text-indigo-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">
                    Dokumen Analisis &amp; Distribusi CP (Format Cetak Kemendikbudristek)
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Dokumen siap cetak dan ekspor Word/PDF/Excel. Ingin mengunggah atau melihat ekstraksi tabel elemen CP?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('upload_cp_master')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>Buka Upload &amp; Kelola Master CP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[450px]">
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Menyusun Dokumen Perangkat Ajar...</h4>
                <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                  Menerapkan sintaks Kurikulum Deep Learning, pemetaan CP ke TP, materi esensial, dan format administrasi resmi.
                </p>
              </div>
            </div>
          ) : generatedMarkdown ? (
            <div className="min-h-[500px]">
              <DocumentPdfPreview
                title={`${docTypesList.find((d) => d.id === docType)?.label || (typeof docType === 'string' ? docType.toUpperCase() : 'DOKUMEN')} - ${subject}`}
                markdownContent={generatedMarkdown}
                subject={subject}
                grade={grade}
                level={level}
                semester={semester}
                docType={docType}
                teacherName={currentUser?.name}
                fileNamePrefix={`Perangkat_Ajar_${docType}_${subject}_Kls${grade}`}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[450px] text-slate-500">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h4 className="text-sm font-bold text-slate-800">
                  {currentDocInfo.label}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dokumen kurikulum siap disusun secara otomatis sesuai parameter profil guru. Klik tombol di bawah untuk menampilkan dokumen resmi:
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const built = buildInstantDocument(docType);
                      if (built) setGeneratedMarkdown(built);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 mx-auto cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tampilkan Dokumen Resmi Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User-facing Token Quota & Voucher Redemption Modal */}
      <TokenQuotaModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        currentUser={currentUser}
        onTokenUpdated={() => {
          const u = StorageService.getCurrentUser();
          setCurrentUser(u);
          setQuotaStatus(StorageService.getTokenQuotaStatus(u));
        }}
      />

      {/* Modal Riwayat Dokumen AI & Pembersihan Otomatis 24 Jam */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Riwayat & Arsip Unduh Ulang Perangkat Ajar (Penyimpanan Permanen)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {aiDocs.length} Dokumen
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hasil generate perangkat ajar tersimpan permanen dan siap diunduh ulang langsung ke format Word, PDF, atau Excel kapan saja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Retention Notice & Filter Bar */}
            <div className="border-b border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan judul, mapel, kelas, atau kata kunci..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Info Badge */}
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-900 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Penyimpanan Permanen: Data tidak dihapus kecuali oleh Anda sendiri.</span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Semua Dokumen' },
                  { id: 'modul_ajar', label: 'RPM / Modul Ajar' },
                  { id: 'prosem_prota', label: 'PROSEM & PROTA' },
                  { id: 'analisis', label: 'Analisis CP / TP / ATP' },
                  { id: 'asesmen_lkpd', label: 'LKPD & KKTP & Rubrik' },
                ].map((tab) => {
                  const isActive = historyFilterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHistoryFilterType(tab.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body: Documents List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
              {(() => {
                const filtered = aiDocs.filter((doc) => {
                  // Category match
                  if (historyFilterType === 'modul_ajar') {
                    if (doc.type !== 'modul_ajar' && !doc.title.toLowerCase().includes('rpm') && !doc.title.toLowerCase().includes('modul')) return false;
                  } else if (historyFilterType === 'prosem_prota') {
                    if (doc.type !== 'prosem' && doc.type !== 'prota' && !doc.title.toLowerCase().includes('prosem') && !doc.title.toLowerCase().includes('prota')) return false;
                  } else if (historyFilterType === 'analisis') {
                    if (doc.type !== 'analisis_cp' && doc.type !== 'tp' && doc.type !== 'atp' && doc.type !== 'analisis_alokasi_waktu' && !doc.title.toLowerCase().includes('analisis') && !doc.title.toLowerCase().includes('tp') && !doc.title.toLowerCase().includes('atp')) return false;
                  } else if (historyFilterType === 'asesmen_lkpd') {
                    const dt = doc.type as string;
                    if (dt !== 'lkpd' && dt !== 'kktp' && dt !== 'rubrik_penilaian' && dt !== 'asesmen' && !doc.title.toLowerCase().includes('lkpd') && !doc.title.toLowerCase().includes('kktp') && !doc.title.toLowerCase().includes('rubrik')) return false;
                  }

                  // Search query match
                  if (historySearchQuery.trim()) {
                    const q = historySearchQuery.toLowerCase();
                    const titleMatch = doc.title.toLowerCase().includes(q);
                    const subjectMatch = doc.subject ? doc.subject.toLowerCase().includes(q) : false;
                    const contentMatch = doc.content.toLowerCase().includes(q);
                    const gradeMatch = doc.grade ? String(doc.grade).includes(q) : false;
                    return titleMatch || subjectMatch || contentMatch || gradeMatch;
                  }

                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 space-y-3 bg-white rounded-xl border border-dashed border-slate-300">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                        <History className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {aiDocs.length === 0 ? 'Belum Ada Dokumen Tersimpan' : 'Tidak Ada Dokumen yang Sesuai Filter'}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {aiDocs.length === 0
                            ? 'Setiap kali Anda men-generate modul ajar, PROSEM, LKPD, atau CP, salinan otomatis tersimpan permanen di sini dan tidak akan dihapus kecuali oleh Anda sendiri.'
                            : 'Coba ubah kata kunci pencarian atau pilih kategori filter yang lain.'}
                        </p>
                      </div>
                    </div>
                  );
                }

                return filtered.map((doc) => {
                  const isCopied = historyCopiedId === doc.id;
                  const charCount = doc.content ? doc.content.length : 0;
                  const estPages = Math.max(1, Math.ceil(charCount / 2200));

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 bg-white hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Document Metadata */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            {doc.type === 'modul_ajar' ? '⚡ RPM Deep Learning' : doc.type || 'Dokumen'}
                          </span>
                          {doc.subject && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                              {doc.subject}
                            </span>
                          )}
                          {doc.grade && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Kelas {doc.grade}
                            </span>
                          )}
                          {doc.semester && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                              Sem {doc.semester}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {doc.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>Dibuat: {doc.createdAt}</span>
                          <span>•</span>
                          <span>±{estPages} Halaman ({charCount.toLocaleString()} karakter)</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Tersimpan Permanen (Aman)</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Action & Download Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {/* Word Download */}
                        <button
                          type="button"
                          onClick={() => handleDownloadHistoryWord(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                          title="Unduh langsung ke format Microsoft Word (.doc)"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Word</span>
                        </button>

                        {/* PDF Print */}
                        <button
                          type="button"
                          onClick={() => handleDownloadHistoryPdf(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                          title="Cetak atau simpan ke format PDF resmi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        {/* Excel Download (if table/matrix document) */}
                        {doc.content.includes('|') && (
                          <button
                            type="button"
                            onClick={() => handleDownloadHistoryExcel(doc)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                            title="Unduh tabel ke Microsoft Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Excel</span>
                          </button>
                        )}

                        {/* Copy Content */}
                        <button
                          type="button"
                          onClick={() => handleCopyHistoryContent(doc)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border transition ${
                            isCopied
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                          title="Salin seluruh isi dokumen ke clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>

                        {/* Open in Full Editor */}
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedMarkdown(doc.content);
                            if (doc.type) setDocType(doc.type);
                            if (doc.subject) setSubject(doc.subject);
                            if (doc.grade) setGrade(Number(doc.grade));
                            if (doc.semester) setSemester(doc.semester as SemesterType);
                            setViewLayout('fullscreen');
                            setShowHistoryModal(false);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                          title="Buka dokumen di editor penuh"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete single doc */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = aiDocs.filter((d) => d.id !== doc.id);
                            StorageService.saveAIDocuments(updated);
                            refreshAiHistory();
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition"
                          title="Hapus dokumen ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-medium flex items-center space-x-2">
                <span>Total tersimpan: <strong>{aiDocs.length} dokumen permanen</strong></span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Tersimpan aman selamanya</span>
              </div>
              <div className="flex items-center space-x-2">
                {aiDocs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold transition flex items-center space-x-1"
                    title="Hapus manual semua dokumen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Arsip Saya</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
