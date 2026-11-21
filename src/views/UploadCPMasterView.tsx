import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  Trash2,
  Search,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Layers,
  GraduationCap,
  X,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { StorageService, DEFAULT_ADMIN } from '../lib/storage';
import { UniversalFileParser } from '../lib/universalFileParser';
import {
  TIERED_SCHOOL_LEVEL_CARDS,
  SchoolLevelGroup,
  getSchoolLevelGroup,
  isSameSchoolLevelGroup,
  getGradeOptionsByLevel,
  resolvePhaseByLevelAndGrade,
  getSchoolLevelDisplay,
  normalizeSchoolLevel,
  analyzeCPTextHeuristic,
  buildLevelRecapFromSubjects,
  buildPhaseDirectoryByLevel,
  extractCPDocumentInsights,
  mergeAnalyzedSubjects,
  detectLevelPhaseGradeFromText,
  KNOWN_SUBJECT_PATTERNS,
} from '../lib/curriculumLevels';
import { getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';
import {
  ActiveMasterCPData,
  AdminUploadedCPItem,
  CPCoverageReport,
  CPDocumentInsights,
  CPMaterialItem,
  CPSubjectEntry,
  SchoolLevel,
} from '../types';

interface UploadCPMasterViewProps {
  onNavigate?: (viewId: string) => void;
}

interface AnalysisDraft {
  id: string;
  docName: string;
  docNumber: string;
  fileName: string;
  folderName?: string;
  fileType?: string;
  fileSize?: number;
  rawText: string;
  executiveSummary: string;
  analyzedSubjects: CPSubjectEntry[];
  coverageReport?: CPCoverageReport;
  documentInsights?: CPDocumentInsights;
  primarySubject: string;
  primaryLevel: SchoolLevel;
  primaryGrade: number | string;
  primaryPhase: string;
  analyzedAt: string;
  syncedAt?: string;
  isSynced: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateID(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
}

function detectMetadataFromFilename(name: string) {
  const cleanName = (name || '').replace(/[_-]+/g, ' ');
  const lvlMeta = detectLevelPhaseGradeFromText(cleanName);
  let detectedSub = '';
  for (const entry of KNOWN_SUBJECT_PATTERNS) {
    if (entry.pattern.test(cleanName)) {
      detectedSub = entry.canonical;
      break;
    }
  }
  const noMatch = name.match(/(?:no|nomor)[\s._-]*([a-z0-9./-]+)/i);
  const detectedNo = noMatch && noMatch[1] ? noMatch[1].replace(/\.[^.]+$/, '') : '';
  return {
    subject: detectedSub,
    level: lvlMeta.level,
    phase: lvlMeta.phase,
    grade: lvlMeta.grade,
    docNumber: detectedNo,
  };
}

function buildInitialDraftFromStorage(): AnalysisDraft | null {
  const active = StorageService.getActiveMasterCP(DEFAULT_ADMIN.id) || StorageService.getActiveMasterCP();
  const uploadedList = StorageService.getAdminUploadedCPs();
  if (!active || (uploadedList.length === 0 && active.uploadedByRole !== 'admin')) {
    return null;
  }

  const subjects: CPSubjectEntry[] =
    Array.isArray(active.analyzedSubjects) && active.analyzedSubjects.length > 0
      ? active.analyzedSubjects
      : active.subject
      ? [
          {
            id: active.id,
            subject: active.subject,
            level: active.level,
            subLevelLabel: active.subLevelLabel || getSchoolLevelDisplay(active.level, active.grade).subLabel,
            grade: active.grade,
            phase: active.phase,
            jpPerWeek: active.jpPerWeek,
            totalHoursPerYear: active.totalHoursPerYear,
            cpText: active.cpText,
            elements: active.elements,
            materialsSem1: active.materialsSem1 || [],
            materialsSem2: active.materialsSem2 || [],
          },
        ]
      : [];

  if (subjects.length === 0) return null;

  return {
    id: active.id,
    docName: stripExtension(active.fileName || '') || active.subject || 'Dokumen CP Resmi',
    docNumber: active.docNumber || '',
    fileName: active.fileName || '',
    folderName: active.folderName,
    fileType: active.fileType,
    fileSize: active.fileSize,
    rawText: active.cpText || '',
    executiveSummary: active.executiveSummary || '',
    analyzedSubjects: subjects,
    coverageReport: active.coverageReport,
    documentInsights: active.documentInsights,
    primarySubject: active.subject || subjects[0].subject,
    primaryLevel: active.level || subjects[0].level,
    primaryGrade: active.grade || subjects[0].grade,
    primaryPhase: active.phase || subjects[0].phase,
    analyzedAt: active.uploadedAt || new Date().toISOString(),
    syncedAt: active.lastSyncedAt || active.uploadedAt,
    isSynced: true,
  };
}

export const UploadCPMasterView: React.FC<UploadCPMasterViewProps> = ({ onNavigate }) => {
  const currentUser = StorageService.getCurrentUser() || DEFAULT_ADMIN;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload & Naming States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [docName, setDocName] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [resultViewMode, setResultViewMode] = useState<'detail' | 'matrix'>('detail');

  // Saved Admin CP List
  const [adminUploadedCPs, setAdminUploadedCPs] = useState<AdminUploadedCPItem[]>(() =>
    StorageService.getAdminUploadedCPs()
  );

  // Deep Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [analysisStepText, setAnalysisStepText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analysisDraft, setAnalysisDraft] = useState<AnalysisDraft | null>(() =>
    buildInitialDraftFromStorage()
  );

  // Structured Inspection Filters (Tingkat Sekolah -> Kelas/Fase -> Mata Pelajaran -> Lingkup Materi)
  const [selectedLevelGroup, setSelectedLevelGroup] = useState<SchoolLevelGroup>(() => {
    const initial = buildInitialDraftFromStorage();
    return initial ? getSchoolLevelGroup(initial.primaryLevel) : 'SD';
  });
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    const initial = buildInitialDraftFromStorage();
    return Number(initial?.primaryGrade) || 4;
  });
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(() => {
    const initial = buildInitialDraftFromStorage();
    return initial?.primarySubject || '';
  });
  const [subjectSearch, setSubjectSearch] = useState<string>('');

  // Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessInfo, setSyncSuccessInfo] = useState<{
    docName: string;
    totalSubjects: number;
    levelCount: number;
    profileSubject: string;
    profileLevel: SchoolLevel;
    profileGrade: number;
    profilePhase: string;
    syncedAt: string;
  } | null>(null);

  useEffect(() => {
    const syncLists = () => {
      setAdminUploadedCPs(StorageService.getAdminUploadedCPs());
    };
    window.addEventListener('admin-cp-updated', syncLists);
    window.addEventListener('storage', syncLists);
    return () => {
      window.removeEventListener('admin-cp-updated', syncLists);
      window.removeEventListener('storage', syncLists);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Derived collections from Analysis Draft
  const analyzedSubjects = useMemo(
    () => analysisDraft?.analyzedSubjects || [],
    [analysisDraft]
  );

  // Deduplicated subjects per school level group (preserving exact subject types & counts from uploaded CP)
  const subjectsByLevelMap = useMemo(() => {
    const map: Record<SchoolLevelGroup, CPSubjectEntry[]> = {
      SD: [],
      SMP: [],
      SMA: [],
      SMK: [],
    };
    const seenByLevel: Record<SchoolLevelGroup, Set<string>> = {
      SD: new Set(),
      SMP: new Set(),
      SMA: new Set(),
      SMK: new Set(),
    };

    analyzedSubjects.forEach((entry) => {
      const grp = getSchoolLevelGroup(entry.level);
      const key = (entry.subject || '').trim().toLowerCase();
      if (!key) return;
      if (!seenByLevel[grp].has(key)) {
        seenByLevel[grp].add(key);
        map[grp].push(entry);
      }
    });

    return map;
  }, [analyzedSubjects]);

  const activeLevelCount = useMemo(
    () =>
      (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).filter(
        (g) => subjectsByLevelMap[g].length > 0
      ).length,
    [subjectsByLevelMap]
  );

  const totalUniqueSubjects = useMemo(
    () =>
      (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).reduce(
        (sum, g) => sum + subjectsByLevelMap[g].length,
        0
      ),
    [subjectsByLevelMap]
  );

  const gradeOptionsForSelectedLevel = useMemo(
    () => getGradeOptionsByLevel(selectedLevelGroup),
    [selectedLevelGroup]
  );

  const selectedPhase = useMemo(
    () => resolvePhaseByLevelAndGrade(selectedLevelGroup, selectedGrade),
    [selectedLevelGroup, selectedGrade]
  );

  const subjectsInSelectedLevel = useMemo(() => {
    const list = subjectsByLevelMap[selectedLevelGroup] || [];
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.subject.toLowerCase().includes(q));
  }, [subjectsByLevelMap, selectedLevelGroup, subjectSearch]);

  // Keep selectedGrade & selectedSubjectName synchronized when level changes or new analysis completes
  useEffect(() => {
    const validGrades = getGradeOptionsByLevel(selectedLevelGroup).map((o) => o.grade);
    if (!validGrades.includes(selectedGrade)) {
      setSelectedGrade(validGrades[0]);
    }
  }, [selectedLevelGroup, selectedGrade]);

  useEffect(() => {
    const list = subjectsByLevelMap[selectedLevelGroup] || [];
    if (list.length === 0) {
      setSelectedSubjectName('');
      return;
    }
    const stillExists = list.some(
      (s) => s.subject.toLowerCase() === selectedSubjectName.toLowerCase()
    );
    if (!stillExists) {
      setSelectedSubjectName(list[0].subject);
    }
  }, [subjectsByLevelMap, selectedLevelGroup, selectedSubjectName]);

  // Resolve exact Lingkup Materi (Sem 1 & Sem 2) differentiated per Class & Phase!
  const activeSubjectInspection = useMemo(() => {
    if (!selectedSubjectName) return null;
    const exactGradeMatch = analyzedSubjects.find(
      (e) =>
        e.subject.toLowerCase() === selectedSubjectName.toLowerCase() &&
        isSameSchoolLevelGroup(e.level, selectedLevelGroup) &&
        Number(e.grade) === Number(selectedGrade)
    );

    const anyGradeMatch =
      exactGradeMatch ||
      analyzedSubjects.find(
        (e) =>
          e.subject.toLowerCase() === selectedSubjectName.toLowerCase() &&
          isSameSchoolLevelGroup(e.level, selectedLevelGroup)
      );

    if (!anyGradeMatch) return null;

    const targetPhase = resolvePhaseByLevelAndGrade(selectedLevelGroup, selectedGrade);
    const hasExactGradeMaterials =
      Number(anyGradeMatch.grade) === Number(selectedGrade) &&
      ((anyGradeMatch.materialsSem1?.length || 0) > 0 ||
        (anyGradeMatch.materialsSem2?.length || 0) > 0);

    let materialsSem1: CPMaterialItem[] = [];
    let materialsSem2: CPMaterialItem[] = [];
    let elements = anyGradeMatch.elements || [];
    let cpSummary = anyGradeMatch.cpText || '';

    if (hasExactGradeMaterials) {
      materialsSem1 = anyGradeMatch.materialsSem1 || [];
      materialsSem2 = anyGradeMatch.materialsSem2 || [];
    } else {
      const gradePreset = getSubjectPresetByGrade(
        anyGradeMatch.subject,
        selectedLevelGroup,
        selectedGrade,
        targetPhase
      );
      materialsSem1 = (gradePreset.materialsSem1 || []).map((m, i) => ({
        ...m,
        id: `grade-${selectedGrade}-sem1-${i + 1}`,
      }));
      materialsSem2 = (gradePreset.materialsSem2 || []).map((m, i) => ({
        ...m,
        id: `grade-${selectedGrade}-sem2-${i + 1}`,
      }));
      if ((!elements || elements.length === 0) && gradePreset.elements?.length) {
        elements = gradePreset.elements;
      }
      if (!cpSummary && gradePreset.cpSummary) {
        cpSummary = gradePreset.cpSummary;
      }
    }

    const totalJp =
      materialsSem1.reduce((sum, m) => sum + (Number(m.allocatedHours) || 0), 0) +
      materialsSem2.reduce((sum, m) => sum + (Number(m.allocatedHours) || 0), 0);

    return {
      subject: anyGradeMatch.subject,
      level: selectedLevelGroup as SchoolLevel,
      grade: selectedGrade,
      phase: targetPhase,
      jpPerWeek: Number(anyGradeMatch.jpPerWeek) || (selectedLevelGroup === 'SD' ? 4 : 3),
      totalHoursPerYear: totalJp || Number(anyGradeMatch.totalHoursPerYear) || 108,
      cpText: cpSummary,
      elements,
      materialsSem1,
      materialsSem2,
    };
  }, [analyzedSubjects, selectedSubjectName, selectedLevelGroup, selectedGrade]);

  const levelRecap = useMemo(
    () => buildLevelRecapFromSubjects(analyzedSubjects, analysisDraft?.rawText || ''),
    [analyzedSubjects, analysisDraft?.rawText]
  );

  const phaseDirectory = useMemo(
    () => buildPhaseDirectoryByLevel(analyzedSubjects, analysisDraft?.rawText || ''),
    [analyzedSubjects, analysisDraft?.rawText]
  );

  // Handle Single File Upload
  const processSingleFile = (file: File, activeFolder?: string) => {
    setSelectedFile(file);
    setFileName(file.name);
    setFileType(file.type || 'application/octet-stream');
    setFileSize(file.size);
    if (!activeFolder) {
      setFolderFiles([]);
      setFolderName('');
    }
    setErrorMsg('');
    setSyncSuccessInfo(null);

    const detected = detectMetadataFromFilename(file.name);
    setDocName(stripExtension(file.name));
    if (detected.docNumber) {
      setDocNumber(detected.docNumber);
    }

    setIsReadingFile(true);
    UniversalFileParser.parseFile(file)
      .then((parsed) => {
        if (parsed.base64) setFileBase64(parsed.base64);
        const extracted = (parsed.extractedText || '').trim();
        const isPlaceholder =
          extracted.startsWith('[Dokumen PDF terlampir:') ||
          extracted.startsWith('[Lampiran Gambar Visual:') ||
          extracted.startsWith('[Gambar Format Dokumen');
        if (extracted && !isPlaceholder) {
          setRawTextContent(extracted);
          const skMatch = extracted.match(
            /(?:Nomor|No\.?)\s*[:.]?\s*([0-9]{1,4}(?:\/[A-Za-z0-9.-]+){1,4}(?:\s*Tahun\s*\d{4})?)/i
          );
          if (skMatch && skMatch[1]) {
            setDocNumber((prev) => prev.trim() || skMatch[1].trim());
          }
        } else {
          setRawTextContent('');
        }
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (ev) => setFileBase64((ev.target?.result as string) || '');
        reader.readAsDataURL(file);
      })
      .finally(() => {
        setIsReadingFile(false);
      });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSingleFile(file);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = Array.from(e.target.files || []).filter(
      (f) => f.name && !f.name.startsWith('.') && f.name !== 'Thumbs.db'
    );
    if (validFiles.length === 0) return;

    const relPath = (validFiles[0] as File & { webkitRelativePath?: string }).webkitRelativePath || '';
    const detectedFolder = relPath.includes('/') ? relPath.split('/')[0] : 'Folder_CP_Master';

    setFolderFiles(validFiles);
    setFolderName(detectedFolder);
    processSingleFile(validFiles[0], detectedFolder);
    setDocName(detectedFolder.replace(/[_]+/g, ' '));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []).filter(
      (f) => f.name && !f.name.startsWith('.') && f.name !== 'Thumbs.db'
    );
    if (dropped.length === 0) return;
    if (dropped.length > 1) {
      setFolderFiles(dropped);
      setFolderName('Folder_CP_Unggahan');
      processSingleFile(dropped[0], 'Folder_CP_Unggahan');
      setDocName('Kumpulan File CP Master');
    } else {
      processSingleFile(dropped[0]);
    }
  };

  const handleClearPickedFile = () => {
    setSelectedFile(null);
    setFolderFiles([]);
    setFolderName('');
    setFileName('');
    setFileType('');
    setFileSize(0);
    setFileBase64('');
    setRawTextContent('');
    setDocName('');
    setDocNumber('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // Run Deep Analysis across SD/MI/Paket A, SMP/MTs/Paket B, SMA/MA/Paket C, SMK/MAK + Classes/Phases + Subjects + Materials
  const handleDeepAnalysis = async () => {
    if (!selectedFile && !fileBase64 && !rawTextContent.trim() && !fileName.trim()) {
      setErrorMsg('Pilih file CP terlebih dahulu (PDF, Word, Excel, TXT, atau Folder CP).');
      return;
    }
    if (!docName.trim()) {
      setErrorMsg('Isi Nama Dokumen CP terlebih dahulu sebelum menjalankan analisis.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setSyncSuccessInfo(null);
    setProgressPercent(8);
    setAnalysisStepText('Membaca berkas CP & mengekstrak seluruh teks dokumen...');

    let pct = 8;
    progressTimerRef.current = setInterval(() => {
      pct = Math.min(90, pct + Math.floor(Math.random() * 5) + 2);
      setProgressPercent(pct);
      if (pct < 30) {
        setAnalysisStepText('Membaca berkas CP & mengekstrak seluruh halaman dokumen...');
      } else if (pct < 55) {
        setAnalysisStepText(
          'Mengidentifikasi 4 tingkat sekolah (SD/MI/Paket A, SMP/MTs/Paket B, SMA/MA/Paket C, SMK/MAK)...'
        );
      } else if (pct < 78) {
        setAnalysisStepText('Memetakan jenjang kelas, fase (A–F), dan seluruh mata pelajaran resmi...');
      } else {
        setAnalysisStepText(
          'Mengekstrak lingkup materi pokok Semester 1 & 2 spesifik tiap kelas dan fase...'
        );
      }
    }, 180);

    try {
      const normalizeMaterials = (
        arr: unknown[],
        sem: 1 | 2,
        targetGrade: number | string,
        resolvedHours: number,
        startOrder: number
      ): CPMaterialItem[] =>
        (arr || []).map((rawItem, idx) => {
          const m = rawItem as Partial<CPMaterialItem>;
          return {
            id: m.id || `cp-sem${sem}-${Date.now()}-${idx + 1}`,
            semester: sem,
            orderNumber: m.orderNumber || startOrder + idx,
            tpCode: m.tpCode || `TP.${targetGrade}.${sem}.${idx + 1}`,
            tpName: m.tpName || '',
            essentialMaterial: m.essentialMaterial || '',
            elementName: m.elementName || (sem === 1 ? 'Pemahaman Konsep' : 'Keterampilan Proses'),
            allocatedHours:
              Number(m.allocatedHours) || Math.round(resolvedHours / 2 / Math.max(1, arr.length || 3)),
            meetingCount: m.meetingCount,
            assessmentStrategy:
              m.assessmentStrategy ||
              (sem === 1 ? 'Tes Formatif & Kinerja 6C' : 'Penilaian Proyek Sumatif'),
            deepLearningMethod:
              m.deepLearningMethod ||
              (sem === 1 ? 'Mindful & Meaningful Learning' : 'Meaningful & Joyful Learning'),
          };
        });

      let currentBase64 = fileBase64;
      let currentRawText = rawTextContent;
      if (selectedFile && !currentBase64 && !currentRawText.trim()) {
        setAnalysisStepText(`Membaca isi berkas "${selectedFile.name}" secara keseluruhan...`);
        try {
          const parsedFresh = await UniversalFileParser.parseFile(selectedFile);
          currentBase64 = parsedFresh.base64 || '';
          const freshText = (parsedFresh.extractedText || '').trim();
          const isPlaceholder =
            freshText.startsWith('[Dokumen PDF terlampir:') ||
            freshText.startsWith('[Lampiran Gambar Visual:') ||
            freshText.startsWith('[Gambar Format Dokumen');
          currentRawText = isPlaceholder ? '' : freshText;
          if (currentBase64) setFileBase64(currentBase64);
          if (currentRawText) setRawTextContent(currentRawText);
        } catch {
          // fallback FileReader base64 if parser fails
          currentBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(selectedFile);
          });
          if (currentBase64) setFileBase64(currentBase64);
        }
      }

      const hintMeta = detectMetadataFromFilename(fileName || docName);

      let apiResData: Record<string, unknown> | null = null;
      let apiRawText = '';
      let apiCoverageReport: CPCoverageReport | undefined;
      let apiDocumentInsights: CPDocumentInsights | undefined;

      try {
        const res = await fetch('/api/ai/analyze-cp-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileName || docName,
            fileBase64: currentBase64,
            fileType,
            fileContent: currentRawText,
            subject: hintMeta.subject || undefined,
            level: hintMeta.level,
            grade: hintMeta.grade,
            phase: hintMeta.phase,
            totalHoursPerYear: hintMeta.level === 'SD' ? 144 : 108,
            jpPerWeek: hintMeta.level === 'SD' ? 4 : 3,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            apiResData = json.data;
            apiRawText = (json.rawText || json.data.extractedCpText || '') as string;
            if (json.coverageReport) {
              apiCoverageReport = json.coverageReport as CPCoverageReport;
            }
            if (json.documentInsights) {
              apiDocumentInsights = json.documentInsights as CPDocumentInsights;
            }
          }
        }
      } catch {
        // Fallback smoothly to client-side heuristic analyzer below
      }

      const effectiveRawText = (currentRawText || apiRawText || '').trim();
      const strictDocMode = effectiveRawText.length >= 120;
      const heuristicRes = analyzeCPTextHeuristic({
        fileName: fileName || docName,
        rawText: effectiveRawText,
        subjectHint: hintMeta.subject || undefined,
        levelHint: hintMeta.level,
        gradeHint: hintMeta.grade,
        phaseHint: hintMeta.phase,
        totalHoursHint: hintMeta.level === 'SD' ? 144 : 108,
        jpPerWeekHint: hintMeta.level === 'SD' ? 4 : 3,
        strictDocumentOnly: strictDocMode,
        getFallbackPreset: strictDocMode
          ? undefined
          : (sub, lvl, grd, phs) => getSubjectPresetByGrade(sub, lvl, grd, phs),
      });

      const apiMeta = (apiResData?.identifiedMetadata || {}) as Record<string, unknown>;
      const resolvedPrimarySub =
        (typeof apiMeta.subject === 'string' &&
        apiMeta.subject !== 'Mata Pelajaran Teridentifikasi'
          ? apiMeta.subject
          : heuristicRes.identifiedMetadata.subject) || 'Pendidikan Pancasila';
      const resolvedPrimaryLvl = normalizeSchoolLevel(
        (apiMeta.level as string) || heuristicRes.identifiedMetadata.level,
        resolvedPrimarySub
      );
      const resolvedPrimaryGrd =
        Number(apiMeta.grade) || heuristicRes.identifiedMetadata.grade || 10;
      const resolvedPrimaryPhs =
        (apiMeta.phase as string) ||
        resolvePhaseByLevelAndGrade(resolvedPrimaryLvl, resolvedPrimaryGrd);

      const rawApiSubjects = Array.isArray(apiResData?.analyzedSubjects)
        ? (apiResData?.analyzedSubjects as Record<string, unknown>[])
        : [];

      const mappedApiSubjects: CPSubjectEntry[] = rawApiSubjects.map((entry, idx) => {
        const subName = String(entry.subject || resolvedPrimarySub).trim();
        const rawPhs = String(entry.phase || '');
        const rawGrd = Number(entry.grade) || 0;
        const subLvl = normalizeSchoolLevel(
          String(entry.level || resolvedPrimaryLvl),
          `${subName} ${rawPhs} ${rawGrd ? `Kelas ${rawGrd}` : ''}`
        );
        const subGrd = rawGrd || (subLvl === 'SD' ? 4 : subLvl === 'SMP' ? 7 : 10);
        const subPhs = rawPhs || resolvePhaseByLevelAndGrade(subLvl, subGrd);
        const subHours = Number(entry.totalHoursPerYear) || (subLvl === 'SD' ? 144 : 108);
        const subJp = Number(entry.jpPerWeek) || (subLvl === 'SD' ? 4 : 3);

        const rawSem1 = Array.isArray(entry.materialsSem1) ? entry.materialsSem1 : [];
        const rawSem2 = Array.isArray(entry.materialsSem2) ? entry.materialsSem2 : [];
        const presetFallback =
          !strictDocMode && (rawSem1.length === 0 || rawSem2.length === 0)
            ? getSubjectPresetByGrade(subName, subLvl, subGrd, subPhs)
            : null;

        const sem1 = normalizeMaterials(
          rawSem1.length > 0 ? rawSem1 : presetFallback?.materialsSem1 || [],
          1,
          subGrd,
          subHours,
          1
        );
        const sem2 = normalizeMaterials(
          rawSem2.length > 0 ? rawSem2 : presetFallback?.materialsSem2 || [],
          2,
          subGrd,
          subHours,
          sem1.length + 1
        );

        return {
          id: String(entry.id || `cp-api-${Date.now()}-${idx + 1}`),
          subject: subName,
          level: subLvl,
          subLevelLabel:
            String(entry.subLevelLabel || '') ||
            getSchoolLevelDisplay(subLvl, subGrd).subLabel,
          grade: subGrd,
          phase: subPhs,
          categoryTag:
            entry.categoryTag === 'Pilihan/Tingkat Lanjut' ||
            entry.categoryTag === 'Kejuruan/Konsentrasi' ||
            entry.categoryTag === 'Umum/Wajib'
              ? (entry.categoryTag as CPSubjectEntry['categoryTag'])
              : undefined,
          locationRef:
            typeof entry.locationRef === 'string' && entry.locationRef.trim()
              ? entry.locationRef.trim()
              : undefined,
          specialNotes:
            typeof entry.specialNotes === 'string' && entry.specialNotes.trim()
              ? entry.specialNotes.trim()
              : undefined,
          jpPerWeek: subJp,
          totalHoursPerYear: subHours,
          cpText: String(
            entry.cpText || `Capaian Pembelajaran ${subName} ${subLvl} (${subPhs})`
          ),
          elements: Array.isArray(entry.elements)
            ? (entry.elements as CPSubjectEntry['elements'])
            : (apiResData?.elements as CPSubjectEntry['elements']) || [],
          materialsSem1: sem1,
          materialsSem2: sem2,
        };
      });

      let mergedSubjects = mergeAnalyzedSubjects(
        mappedApiSubjects,
        heuristicRes.analyzedSubjects
      );

      // Process any additional files in an uploaded Folder CP
      if (folderFiles.length > 1) {
        for (let i = 1; i < folderFiles.length; i++) {
          const extra = folderFiles[i];
          setAnalysisStepText(
            `Menganalisis berkas folder (${i + 1}/${folderFiles.length}): ${extra.name}...`
          );
          try {
            const extraMeta = detectMetadataFromFilename(extra.name);
            let extraText = '';
            let extraBase64 = '';
            try {
              const parsedExtra = await UniversalFileParser.parseFile(extra);
              extraBase64 = parsedExtra.base64 || '';
              const rawExtra = (parsedExtra.extractedText || '').trim();
              const isPlaceholder =
                rawExtra.startsWith('[Dokumen PDF terlampir:') ||
                rawExtra.startsWith('[Lampiran Gambar Visual:') ||
                rawExtra.startsWith('[Gambar Format Dokumen');
              extraText = isPlaceholder ? '' : rawExtra;
            } catch {
              extraText = '';
            }

            let extraApiSubs: CPSubjectEntry[] = [];
            if ((!extraText || extraText.length < 200) && extraBase64) {
              try {
                const extraRes = await fetch('/api/ai/analyze-cp-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fileName: extra.name,
                    fileBase64: extraBase64,
                    fileType: extra.type || 'application/pdf',
                    subject: extraMeta.subject || undefined,
                    level: extraMeta.level,
                    grade: extraMeta.grade,
                    phase: extraMeta.phase,
                    totalHoursPerYear: extraMeta.level === 'SD' ? 144 : 108,
                    jpPerWeek: extraMeta.level === 'SD' ? 4 : 3,
                  }),
                });
                if (extraRes.ok) {
                  const extraJson = await extraRes.json();
                  if (!extraText && extraJson?.rawText) {
                    extraText = extraJson.rawText;
                  }
                  const eList = extraJson?.data?.analyzedSubjects;
                  if (Array.isArray(eList)) {
                    extraApiSubs = eList.map((e: Record<string, unknown>, idx: number) => {
                      const sLvl = normalizeSchoolLevel(
                        String(e.level || extraMeta.level),
                        String(e.subject || '')
                      );
                      const sGrd = Number(e.grade) || extraMeta.grade;
                      const sHours = Number(e.totalHoursPerYear) || (sLvl === 'SD' ? 144 : 108);
                      const s1 = normalizeMaterials(
                        Array.isArray(e.materialsSem1) ? e.materialsSem1 : [],
                        1,
                        sGrd,
                        sHours,
                        1
                      );
                      const s2 = normalizeMaterials(
                        Array.isArray(e.materialsSem2) ? e.materialsSem2 : [],
                        2,
                        sGrd,
                        sHours,
                        s1.length + 1
                      );
                      return {
                        id: String(e.id || `cp-folder-${i}-${idx + 1}`),
                        subject: String(e.subject || extraMeta.subject || stripExtension(extra.name)),
                        level: sLvl,
                        subLevelLabel: getSchoolLevelDisplay(sLvl, sGrd).subLabel,
                        grade: sGrd,
                        phase: String(e.phase || resolvePhaseByLevelAndGrade(sLvl, sGrd)),
                        jpPerWeek: Number(e.jpPerWeek) || (sLvl === 'SD' ? 4 : 3),
                        totalHoursPerYear: sHours,
                        cpText: String(e.cpText || extraJson?.data?.extractedCpText || ''),
                        elements: (e.elements as CPSubjectEntry['elements']) || [],
                        materialsSem1: s1,
                        materialsSem2: s2,
                      };
                    });
                  }
                }
              } catch {
                // fallback handled by heuristic below
              }
            }

            const extraStrictMode = extraText.trim().length >= 120;
            const extraHeuristic = analyzeCPTextHeuristic({
              fileName: extra.name,
              rawText: extraText,
              subjectHint: extraMeta.subject || undefined,
              levelHint: extraMeta.level,
              gradeHint: extraMeta.grade,
              phaseHint: extraMeta.phase,
              totalHoursHint: extraMeta.level === 'SD' ? 144 : 108,
              jpPerWeekHint: extraMeta.level === 'SD' ? 4 : 3,
              strictDocumentOnly: extraStrictMode,
              getFallbackPreset: extraStrictMode
                ? undefined
                : (sub, lvl, grd, phs) => getSubjectPresetByGrade(sub, lvl, grd, phs),
            });

            mergedSubjects = mergeAnalyzedSubjects(
              mergedSubjects,
              mergeAnalyzedSubjects(extraApiSubs, extraHeuristic.analyzedSubjects)
            );
          } catch {
            // continue other files gracefully
          }
        }
      }

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgressPercent(100);
      setAnalysisStepText('Analisis mendalam selesai.');

      const firstPresentGroup =
        (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).find((grp) =>
          mergedSubjects.some((s) => isSameSchoolLevelGroup(s.level, grp))
        ) || getSchoolLevelGroup(resolvedPrimaryLvl);

      const defaultEntryForGroup =
        mergedSubjects.find((s) => isSameSchoolLevelGroup(s.level, firstPresentGroup)) ||
        mergedSubjects[0];

      const computedCoverage: CPCoverageReport = apiCoverageReport || {
        totalCharacters: effectiveRawText.length,
        aiAnalyzedCharacters: 0,
        chunksProcessed: 0,
        totalChunksNeeded: Math.max(1, Math.ceil(effectiveRawText.length / 180000)),
        isFullyAnalyzedByAI: false,
        isFullyScannedStructurally: true,
        readSectionsSummary: buildLevelRecapFromSubjects(mergedSubjects, effectiveRawText)
          .filter((r) => r.uniqueSubjectCount > 0)
          .map((r) => `${r.label}: ${r.uniqueSubjectCount} mapel (${r.phasesCovered.join(', ')})`),
        unreadOrTruncatedNotice: effectiveRawText
          ? 'Analisis dijalankan melalui pemindai struktural penuh (100% teks terbaca tanpa mengarang materi di luar dokumen).'
          : undefined,
      };

      const resolvedDocumentInsights: CPDocumentInsights =
        apiDocumentInsights ||
        extractCPDocumentInsights(effectiveRawText, mergedSubjects, computedCoverage);

      const draft: AnalysisDraft = {
        id: `admin-cp-${Date.now()}`,
        docName: docName.trim() || stripExtension(fileName) || 'Dokumen CP Resmi',
        docNumber: docNumber.trim(),
        fileName: fileName.trim() || `${docName.trim()}.pdf`,
        folderName: folderName || undefined,
        fileType: fileType || 'application/pdf',
        fileSize,
        rawText: effectiveRawText || heuristicRes.extractedCpText,
        executiveSummary:
          String(apiResData?.executiveSummary || '') || heuristicRes.executiveSummary,
        analyzedSubjects: mergedSubjects,
        coverageReport: computedCoverage,
        documentInsights: resolvedDocumentInsights,
        primarySubject: defaultEntryForGroup?.subject || resolvedPrimarySub,
        primaryLevel: (defaultEntryForGroup?.level || resolvedPrimaryLvl) as SchoolLevel,
        primaryGrade: defaultEntryForGroup?.grade || resolvedPrimaryGrd,
        primaryPhase: defaultEntryForGroup?.phase || resolvedPrimaryPhs,
        analyzedAt: new Date().toISOString(),
        isSynced: false,
      };

      setAnalysisDraft(draft);
      setSelectedLevelGroup(firstPresentGroup);
      setSelectedGrade(
        Number(defaultEntryForGroup?.grade) ||
          getGradeOptionsByLevel(firstPresentGroup)[0].grade
      );
      setSelectedSubjectName(defaultEntryForGroup?.subject || resolvedPrimarySub);
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setErrorMsg(
        err instanceof Error
          ? `Analisis gagal dijalankan: ${err.message}`
          : 'Terjadi kendala saat menganalisis dokumen CP.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sync analyzed CP automatically across Profil Guru Mata Pelajaran & Parameter Kurikulum
  const handleSyncToApp = () => {
    if (!analysisDraft || analysisDraft.analyzedSubjects.length === 0) {
      setErrorMsg('Lakukan analisis file CP terlebih dahulu sebelum menyinkronkan ke aplikasi.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');

    try {
      const targetSubject =
        activeSubjectInspection?.subject || analysisDraft.primarySubject;
      const targetLevel =
        (activeSubjectInspection?.level || analysisDraft.primaryLevel) as SchoolLevel;
      const targetGrade =
        Number(activeSubjectInspection?.grade) || Number(analysisDraft.primaryGrade) || 10;
      const targetPhase =
        activeSubjectInspection?.phase ||
        resolvePhaseByLevelAndGrade(targetLevel, targetGrade);
      const targetJpPerWeek = activeSubjectInspection?.jpPerWeek || (targetLevel === 'SD' ? 4 : 3);
      const targetSem1 = activeSubjectInspection?.materialsSem1 || [];
      const targetSem2 = activeSubjectInspection?.materialsSem2 || [];
      const targetHours =
        targetSem1.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0) +
          targetSem2.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0) ||
        activeSubjectInspection?.totalHoursPerYear ||
        108;

      const resolvedDocTitle = docName.trim() || analysisDraft.docName;
      const extMatch = (analysisDraft.fileName || '').match(/(\.[^.]+)$/);
      const recordedFileName =
        resolvedDocTitle +
        (extMatch && !resolvedDocTitle.toLowerCase().endsWith(extMatch[1].toLowerCase())
          ? extMatch[1]
          : '');

      const schoolProfile = StorageService.getSchoolProfile();

      const activeInspectionEntry: CPSubjectEntry = {
        id: `${analysisDraft.id}-${getSchoolLevelGroup(targetLevel)}-${targetGrade}-${targetSubject.toLowerCase().replace(/\s+/g, '-')}`,
        subject: targetSubject,
        level: targetLevel,
        subLevelLabel: getSchoolLevelDisplay(targetLevel, targetGrade).subLabel,
        grade: targetGrade,
        phase: targetPhase,
        jpPerWeek: targetJpPerWeek,
        totalHoursPerYear: targetHours,
        cpText:
          activeSubjectInspection?.cpText ||
          analysisDraft.rawText ||
          `Capaian Pembelajaran ${targetSubject} (${targetLevel} · ${targetPhase})`,
        elements: activeSubjectInspection?.elements || [],
        materialsSem1: targetSem1,
        materialsSem2: targetSem2,
      };

      const syncedAnalyzedSubjects = mergeAnalyzedSubjects(
        [activeInspectionEntry],
        analysisDraft.analyzedSubjects
      );

      const syncedMaster: ActiveMasterCPData = {
        id: analysisDraft.id,
        fileName: recordedFileName || analysisDraft.fileName,
        folderName: analysisDraft.folderName,
        docNumber: docNumber.trim() || analysisDraft.docNumber || undefined,
        uploadedByRole: currentUser.role,
        uploadedByName: currentUser.name,
        fileType: analysisDraft.fileType,
        fileSize: analysisDraft.fileSize,
        uploadedAt: analysisDraft.analyzedAt,
        level: targetLevel,
        subLevelLabel: getSchoolLevelDisplay(targetLevel, targetGrade).subLabel,
        grade: targetGrade,
        phase: targetPhase,
        subject: targetSubject,
        teacherName: schoolProfile.teacherName || currentUser.name,
        teacherNip: schoolProfile.teacherNip,
        schoolName: schoolProfile.schoolName || currentUser.school,
        academicYear: schoolProfile.academicYear || '2026/2027',
        totalHoursPerYear: targetHours,
        jpPerWeek: targetJpPerWeek,
        cpText: activeInspectionEntry.cpText || '',
        elements: activeInspectionEntry.elements || [],
        materialsSem1: targetSem1,
        materialsSem2: targetSem2,
        analyzedSubjects: syncedAnalyzedSubjects,
        coverageReport: analysisDraft.coverageReport,
        documentInsights: analysisDraft.documentInsights,
        executiveSummary: analysisDraft.executiveSummary,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      };

      // 1. Update Master CP, Parameter Kurikulum catalog, server catalog, distributions, refs, kaldik
      StorageService.setActiveMasterCP(syncedMaster);

      // 2. Explicitly synchronize Profil Guru Mata Pelajaran
      const latestProfile = StorageService.getSchoolProfile();
      StorageService.saveSchoolProfile({
        ...latestProfile,
        subject: targetSubject,
        level: targetLevel,
        grade: targetGrade,
        phase: targetPhase,
        jpPerWeek: targetJpPerWeek,
        totalHoursPerYear: targetHours,
        cpText: syncedMaster.cpText,
      });

      StorageService.addNotification({
        title: `CP "${resolvedDocTitle}" Tersinkron ke Aplikasi`,
        message: `${totalUniqueSubjects} mata pelajaran lintas ${activeLevelCount} tingkat sekolah telah disinkronkan ke Menu Profil Guru dan Parameter Kurikulum.`,
        type: 'sync',
        actionUrl: 'parameter_kurikulum',
      });

      const nowIso = new Date().toISOString();
      setAnalysisDraft((prev) =>
        prev
          ? {
              ...prev,
              docName: resolvedDocTitle,
              docNumber: docNumber.trim(),
              fileName: recordedFileName,
              syncedAt: nowIso,
              isSynced: true,
            }
          : null
      );
      setAdminUploadedCPs(StorageService.getAdminUploadedCPs());
      setSyncSuccessInfo({
        docName: resolvedDocTitle,
        totalSubjects: totalUniqueSubjects,
        levelCount: activeLevelCount,
        profileSubject: targetSubject,
        profileLevel: targetLevel,
        profileGrade: targetGrade,
        profilePhase: targetPhase,
        syncedAt: nowIso,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Gagal menyinkronkan ke aplikasi: ${err.message}`
          : 'Terjadi kendala saat menyinkronkan data CP.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteUploadedRecord = (id: string) => {
    const remaining = StorageService.removeAdminUploadedCP(id);
    setAdminUploadedCPs(remaining);
    if (remaining.length === 0) {
      StorageService.clearActiveMasterCP(DEFAULT_ADMIN.id);
      StorageService.clearActiveMasterCP(currentUser.id);
      setAnalysisDraft(null);
      setSyncSuccessInfo(null);
    }
  };

  const handleResetWorkspace = () => {
    adminUploadedCPs.forEach((item) => {
      StorageService.removeAdminUploadedCP(item.id);
    });
    const remainingCatalog = StorageService.getMasterCPCatalog().filter(
      (c) => c.uploadedByRole !== 'admin'
    );
    StorageService.saveMasterCPCatalog(remainingCatalog);
    StorageService.saveAdminSettings({ adminUploadedCPs: [] });
    StorageService.clearActiveMasterCP(DEFAULT_ADMIN.id);
    StorageService.clearActiveMasterCP(currentUser.id);
    StorageService.clearAdminCPCatalogOnServer();

    setAdminUploadedCPs([]);
    setAnalysisDraft(null);
    setSyncSuccessInfo(null);
    handleClearPickedFile();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Workspace */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Upload &amp; Analisis Mendalam Capaian Pembelajaran
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Unggah dokumen resmi Capaian Pembelajaran, jalankan analisis terstruktur berdasarkan
            tingkat sekolah, kelas/fase, mata pelajaran, serta lingkup materi, lalu sinkronkan
            otomatis ke Menu Profil Guru dan Menu Parameter Kurikulum.
          </p>
        </div>
        {(analysisDraft || adminUploadedCPs.length > 0) && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetWorkspace}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Kosongkan Data CP
            </button>
          </div>
        )}
      </div>

      {/* Bagian 1: Upload File CP & Penamaan Dokumen */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              1. Upload File CP &amp; Penamaan Dokumen
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format yang didukung: PDF, Word (DOCX/DOC), Excel (XLSX/XLS/CSV), TXT, JSON, atau Folder CP.
            </p>
          </div>
          {fileName && (
            <button
              type="button"
              onClick={handleClearPickedFile}
              className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              Hapus Pilihan Berkas
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dropzone Upload File / Folder */}
          <div className="lg:col-span-6 space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 transition-colors text-center ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60'
                  : selectedFile
                  ? 'border-slate-300 bg-slate-50/70'
                  : 'border-slate-300 bg-slate-50/40 hover:border-blue-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                onChange={handleFolderInputChange}
                className="hidden"
              />

              <div className="mx-auto w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                {folderFiles.length > 1 ? (
                  <FolderOpen className="w-5 h-5" />
                ) : selectedFile ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-900 break-all">
                    {folderFiles.length > 1
                      ? `${folderName || 'Folder CP'} (${folderFiles.length} berkas)`
                      : fileName}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {formatFileSize(fileSize)}
                    {isReadingFile
                      ? ' · Membaca keseluruhan berkas...'
                      : rawTextContent
                        ? ` · ${rawTextContent.length.toLocaleString('id-ID')} karakter teks terbaca`
                        : ' · Siap diekstrak saat analisis'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800">
                    Tarik dan lepas file CP di sini
                  </p>
                  <p className="text-xs text-slate-500">
                    atau pilih berkas dokumen tunggal maupun satu folder sekaligus
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Pilih File CP
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="h-10 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-slate-600" />
                  Pilih Folder CP
                </button>
              </div>
            </div>
          </div>

          {/* Form Penamaan & Eksekusi Analisis */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label
                htmlFor="cp-doc-name"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Nama Dokumen CP <span className="text-rose-600">*</span>
              </label>
              <input
                id="cp-doc-name"
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Contoh: CP BSKAP No. 046/H/KR/2025 Semua Jenjang"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="cp-doc-number"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Nomor / Kode Dokumen SK (Opsional)
              </label>
              <input
                id="cp-doc-number"
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Contoh: 046/H/KR/2025"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDeepAnalysis}
                disabled={isAnalyzing}
                className="h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menganalisis ({progressPercent}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analisis Secara Mendalam
                  </>
                )}
              </button>
              <span className="text-xs text-slate-500">
                Mengekstrak 4 tingkat sekolah, kelas/fase, mata pelajaran &amp; lingkup materi.
              </span>
            </div>

            {isAnalyzing && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium truncate pr-3">{analysisStepText}</span>
                  <span className="font-semibold tabular-nums shrink-0">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Arsip Berkas CP Tersimpan (ditampilkan bila ada) */}
        {adminUploadedCPs.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Daftar File CP Tersimpan ({adminUploadedCPs.length})
              </h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-3 w-12">No</th>
                    <th className="py-2.5 px-3">Nama File / Dokumen CP</th>
                    <th className="py-2.5 px-3">No. SK</th>
                    <th className="py-2.5 px-3">Cakupan Terdeteksi</th>
                    <th className="py-2.5 px-3">Diunggah</th>
                    <th className="py-2.5 px-3 text-right w-20">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUploadedCPs.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500 tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.fileName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.docNumber || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {[item.level, item.phase, item.subject].filter(Boolean).join(' · ') || 'Semua Jenjang'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs tabular-nums">
                        {formatDateID(item.uploadedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUploadedRecord(item.id)}
                          aria-label={`Hapus ${item.fileName}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Bagian 2: Hasil Analisis Mendalam Berdasarkan Prioritas */}
      {!analysisDraft ? (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Belum Ada Hasil Analisis Dokumen CP
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Unggah file CP pada formulir di atas, isi penamaan dokumen, lalu klik tombol{' '}
            <span className="font-semibold text-slate-800">Analisis Secara Mendalam</span> untuk
            memetakan tingkat sekolah, kelas/fase, mata pelajaran, dan lingkup materi ajar.
          </p>
        </section>
      ) : (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {/* Judul Hasil Analisis + Mode Tampilan */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  2. Hasil Analisis Mendalam: {analysisDraft.docName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {analysisDraft.docNumber ? `No. SK: ${analysisDraft.docNumber} · ` : ''}
                  {analysisDraft.rawText
                    ? `Total ${analysisDraft.rawText.length.toLocaleString('id-ID')} karakter dokumen dianalisis · `
                    : ''}
                  Dianalisis {formatDateID(analysisDraft.analyzedAt)} · Status:{' '}
                  <span
                    className={
                      analysisDraft.isSynced
                        ? 'text-emerald-700 font-semibold'
                        : 'text-amber-700 font-semibold'
                    }
                  >
                    {analysisDraft.isSynced
                      ? 'Tersinkron ke Profil Guru & Parameter Kurikulum'
                      : 'Siap Disinkronkan ke Aplikasi'}
                  </span>
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setResultViewMode('detail')}
                  className={`h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    resultViewMode === 'detail'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Detail per Jenjang &amp; Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setResultViewMode('matrix')}
                  className={`h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    resultViewMode === 'matrix'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ringkasan 4 Jenjang (SD–SMK)
                </button>
              </div>
            </div>

            {/* Banner Kelengkapan Pembacaan Dokumen (Anti-Halusinasi) */}
            {analysisDraft.coverageReport && (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-800">
                      Verifikasi Sumber Tunggal (Anti-Halusinasi):{' '}
                      <span className="font-normal text-slate-600 tabular-nums">
                        {analysisDraft.coverageReport.totalCharacters.toLocaleString('id-ID')} karakter
                        {analysisDraft.coverageReport.totalPdfPages
                          ? ` (${analysisDraft.coverageReport.totalPdfPages} halaman PDF)`
                          : ''}{' '}
                        dipindai penuh secara struktural
                        {analysisDraft.coverageReport.aiAnalyzedCharacters > 0
                          ? ` · ${analysisDraft.coverageReport.aiAnalyzedCharacters.toLocaleString('id-ID')} karakter dianalisis AI (${analysisDraft.coverageReport.chunksProcessed}/${analysisDraft.coverageReport.totalChunksNeeded} bagian)`
                          : ''}
                      </span>
                    </p>
                    {analysisDraft.coverageReport.unreadOrTruncatedNotice && (
                      <p className="text-amber-800 font-medium">
                        Catatan Cakupan: {analysisDraft.coverageReport.unreadOrTruncatedNotice}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {resultViewMode === 'matrix' && (
              <div className="space-y-6">
                {/* BAGIAN 1: RINGKASAN & ANALISIS MENDALAM DOKUMEN */}
                {analysisDraft.documentInsights && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
                        Bagian 1: Ringkasan &amp; Analisis Mendalam Dokumen
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ketentuan diktum, dasar hukum, pencabutan aturan sebelumnya, pembagian Lampiran I–V beserta rentang halaman, paradigma pembelajaran mendalam, dan kesinambungan fase berdasarkan bukti teks PDF.
                      </p>
                    </div>
                    <div className="p-4 space-y-4 text-xs">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-1.5">
                          <p className="font-semibold text-slate-900">Ketentuan Umum &amp; Diktum Penetapan</p>
                          <p className="text-slate-700 leading-relaxed">
                            {analysisDraft.documentInsights.diktumSummary || 'Belum ditemukan diktum penetapan eksplisit pada teks yang terbaca.'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-1.5">
                          <p className="font-semibold text-slate-900">Pencabutan Aturan Sebelumnya &amp; Dasar Hukum</p>
                          {analysisDraft.documentInsights.revokedRegulations &&
                          analysisDraft.documentInsights.revokedRegulations.length > 0 ? (
                            <p className="text-slate-700">
                              <span className="font-semibold">Pencabutan:</span>{' '}
                              {analysisDraft.documentInsights.revokedRegulations.join(' | ')}
                            </p>
                          ) : (
                            <p className="text-slate-600">Klausul pencabutan belum ditemukan pada potongan teks yang terbaca.</p>
                          )}
                          {analysisDraft.documentInsights.legalBasis &&
                            analysisDraft.documentInsights.legalBasis.length > 0 && (
                              <p className="text-slate-700">
                                <span className="font-semibold">Dasar Hukum:</span>{' '}
                                {analysisDraft.documentInsights.legalBasis.join(' | ')}
                              </p>
                            )}
                        </div>
                      </div>

                      {analysisDraft.documentInsights.lampiranMap &&
                        analysisDraft.documentInsights.lampiranMap.length > 0 && (
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                  <th className="py-2 px-3 w-36">Lampiran</th>
                                  <th className="py-2 px-3">Judul / Cakupan Lampiran</th>
                                  <th className="py-2 px-3 w-32 text-right tabular-nums">Rentang Halaman</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {analysisDraft.documentInsights.lampiranMap.map((lm, lIdx) => (
                                  <tr key={`${lm.lampiran}-${lIdx}`}>
                                    <td className="py-2 px-3 font-semibold text-slate-900">{lm.lampiran}</td>
                                    <td className="py-2 px-3 text-slate-700">{lm.title}</td>
                                    <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                                      {lm.pageRange || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <p className="font-semibold text-slate-900">
                            Pembelajaran Mendalam &amp; 8 Dimensi Profil Lulusan
                          </p>
                          <p className="text-slate-700 leading-relaxed">
                            {analysisDraft.documentInsights.deepLearningAndDimensions ||
                              'Belum ditemukan uraian eksplisit pada potongan teks yang terbaca.'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <p className="font-semibold text-slate-900">
                            Kesinambungan Fase (Fondasi &amp; Fase A–F) &amp; Pendekatan Jenjang
                          </p>
                          <p className="text-slate-700 leading-relaxed">
                            {analysisDraft.documentInsights.phaseContinuityNotes ||
                              'Mengikuti kemunculan tajuk fase pada tiap jenjang dalam dokumen.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BAGIAN 2: REKAPITULASI JUMLAH MATA PELAJARAN PER JENJANG & FASE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">
                      Bagian 2: Rekapitulasi Jumlah Mata Pelajaran per Jenjang (SD, SMP, SMA, SMK)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pemisahan tegas antara Mata Pelajaran Umum/Wajib/Pilihan (Lampiran II) dan Kejuruan/Program/Konsentrasi Keahlian SMK/MAK (Lampiran III) beserta rujukan halaman dokumen.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-3">Jenjang &amp; Rujukan</th>
                          <th className="py-2.5 px-3">Fase &amp; Pemetaan Kelas</th>
                          <th className="py-2.5 px-3 text-right tabular-nums">Umum/Wajib (Lamp. II)</th>
                          <th className="py-2.5 px-3 text-right tabular-nums">Pilihan/Kejuruan (Lamp. II/III)</th>
                          <th className="py-2.5 px-3 text-right tabular-nums">Total Rumusan CP</th>
                          <th className="py-2.5 px-3">Catatan Pengecualian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {phaseDirectory.map((lvlDir) => {
                          const phaseMappingLabel =
                            lvlDir.group === 'SD'
                              ? 'Fase A (Kls I–II), B (III–IV), C (V–VI)'
                              : lvlDir.group === 'SMP'
                                ? 'Fase D (Kls VII–IX)'
                                : lvlDir.group === 'SMA'
                                  ? 'Fase E (Kls X), F (Kls XI–XII)'
                                  : 'Fase E (Kls X), F (Kls XI–XII / XIII 4 Thn)';
                          return (
                            <tr key={`summary-${lvlDir.group}`} className="align-top">
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {lvlDir.number}. {lvlDir.title}
                                </span>
                                {lvlDir.lampiranRef && (
                                  <span className="text-[11px] text-slate-500 block mt-0.5">
                                    {lvlDir.lampiranRef}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{phaseMappingLabel}</td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                                {lvlDir.generalSubjectCount}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                                {lvlDir.electiveOrVocationalCount}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                                {lvlDir.totalUniqueSubjectCount}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {lvlDir.specialNotes.length > 0
                                  ? lvlDir.specialNotes.join(' ')
                                  : lvlDir.totalUniqueSubjectCount > 0
                                    ? 'Sesuai teks dokumen CP.'
                                    : 'Belum ditemukan pada teks yang terbaca.'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DAFTAR RINCI MATA PELAJARAN & RUANG LINGKUP MATERI */}
                <div className="space-y-4">
                  <div className="px-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Daftar Rinci Mata Pelajaran &amp; Ruang Lingkup Materi per Jenjang &amp; Fase
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Disusun per Jenjang, Fase, dan Mata Pelajaran lengkap dengan Rujukan Bagian/Halaman, Elemen CP, Ruang Lingkup Materi per Elemen, dan Catatan Khusus.
                    </p>
                  </div>

                  {phaseDirectory.map((lvlDir) => {
                    const recap = levelRecap.find((r) => r.group === lvlDir.group);
                    return (
                      <div
                        key={lvlDir.group}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                      >
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {lvlDir.number}. {lvlDir.title}
                            </h4>
                            {lvlDir.specialNotes.length > 0 && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                Catatan Khusus: {lvlDir.specialNotes.join(' ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-slate-700 tabular-nums">
                              {recap ? recap.uniqueSubjectCount : lvlDir.totalUniqueSubjectCount} Mata Pelajaran
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLevelGroup(lvlDir.group);
                                setResultViewMode('detail');
                              }}
                              className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 whitespace-nowrap"
                            >
                              Tinjau Materi
                            </button>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {lvlDir.phases.map((phGroup) => (
                            <div key={phGroup.phaseTitle} className="p-4 space-y-3">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                {lvlDir.title} — {phGroup.phaseTitle}
                              </h5>
                              {phGroup.subjects.length === 0 ? (
                                <p className="text-xs text-slate-500">
                                  Tidak ada mata pelajaran pada {phGroup.phaseTitle} dalam dokumen yang terbaca.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {phGroup.subjects.map((row, rIdx) => (
                                    <div
                                      key={`${row.subject}-${row.grade}-${rIdx}`}
                                      className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 text-xs"
                                    >
                                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <p className="font-bold text-slate-900 text-sm">
                                          {row.number}. {row.subject}{' '}
                                          <span className="text-xs font-medium text-slate-500">
                                            ({row.categoryTag} · Kelas {row.grade})
                                          </span>
                                        </p>
                                        <span className="text-[11px] font-medium text-slate-500">
                                          Rujukan: {row.locationRef}
                                        </span>
                                      </div>

                                      {row.elements.length > 0 && (
                                        <div>
                                          <span className="font-semibold text-slate-700">Elemen CP: </span>
                                          <span className="text-slate-600">
                                            {row.elements
                                              .map((el) =>
                                                el.focus ? `${el.name} (${el.focus})` : el.name
                                              )
                                              .join('; ')}
                                          </span>
                                        </div>
                                      )}

                                      <div className="space-y-1">
                                        <p className="font-semibold text-slate-700">
                                          Ruang Lingkup Materi:
                                        </p>
                                        {row.scopeByElement.length > 0 ? (
                                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                                            {row.scopeByElement.map((sc, sIdx) => (
                                              <li key={`${sc.elementName}-${sIdx}`}>
                                                <span className="font-semibold text-slate-800">
                                                  {sc.elementName}:
                                                </span>{' '}
                                                {sc.details}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-slate-600">
                                            {row.scopes.length > 0
                                              ? row.scopes.join(' · ')
                                              : 'Mengikuti deskripsi capaian pada teks dokumen CP.'}
                                          </p>
                                        )}
                                      </div>

                                      {row.specialNotes && (
                                        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                                          <span className="font-semibold text-slate-700">Catatan Khusus:</span>{' '}
                                          {row.specialNotes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BAGIAN 3: METODOLOGI PENGHITUNGAN & CATATAN AMBIGUITAS / KETERBATASAN PDF */}
                {analysisDraft.documentInsights?.countingMethodology && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
                        Bagian 3: Metodologi Penghitungan &amp; Catatan Ambiguitas / Keterbatasan Data pada PDF
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transparansi aturan penghitungan rumusan CP serta catatan keterbatasan teks PDF yang terbaca.
                      </p>
                    </div>
                    <div className="p-4 space-y-2.5 text-xs text-slate-700">
                      <p>
                        <span className="font-semibold text-slate-900">1. Pendidikan Agama &amp; Kepercayaan:</span>{' '}
                        {analysisDraft.documentInsights.countingMethodology.religionRule}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">2. Mata Pelajaran Tingkat Lanjut / Pilihan Fase F:</span>{' '}
                        {analysisDraft.documentInsights.countingMethodology.advancedPhaseFRule}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">3. Status IPA / IPS / IPAS:</span>{' '}
                        {analysisDraft.documentInsights.countingMethodology.scienceSocialSplitRule}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">4. Status Informatika di SD:</span>{' '}
                        {analysisDraft.documentInsights.countingMethodology.informatikaSDRule}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">5. Pemisahan Kejuruan SMK (Lampiran III):</span>{' '}
                        {analysisDraft.documentInsights.countingMethodology.smkLampiranIIIRule}
                      </p>
                      {analysisDraft.documentInsights.countingMethodology.ambiguitiesOrLimitations.length > 0 && (
                        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 space-y-1">
                          <p className="font-semibold">Catatan Ambiguitas / Keterbatasan Data PDF:</p>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {analysisDraft.documentInsights.countingMethodology.ambiguitiesOrLimitations.map((note, nIdx) => (
                              <li key={nIdx}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4 KPI Ringkasan Flat */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">Tingkat Sekolah Terdeteksi</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {activeLevelCount} / 4
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">Total Mata Pelajaran Resmi</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {totalUniqueSubjects}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">Kelas &amp; Fase Aktif</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  Kelas {selectedGrade} · {selectedPhase}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">Lingkup Materi Mapel Ini</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {activeSubjectInspection
                    ? activeSubjectInspection.materialsSem1.length +
                      activeSubjectInspection.materialsSem2.length
                    : 0}{' '}
                  Bab
                </p>
              </div>
            </div>

            {/* Prioritas 1: 4 Tingkat Sekolah */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Tingkat Sekolah
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TIERED_SCHOOL_LEVEL_CARDS.map((card) => {
                  const count = subjectsByLevelMap[card.group].length;
                  const isActive = selectedLevelGroup === card.group;
                  return (
                    <button
                      key={card.group}
                      type="button"
                      onClick={() => setSelectedLevelGroup(card.group)}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isActive ? 'text-blue-700' : 'text-slate-900'
                          }`}
                        >
                          {card.aliases}
                        </span>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isActive ? 'text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          {count} Mapel
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{card.title}</p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {card.phaseDetails.join(' · ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioritas 2: Jenjang Kelas / Fase */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Layers className="w-4 h-4 text-slate-400" />
                Jenjang Kelas &amp; Fase ({getSchoolLevelDisplay(selectedLevelGroup).shortLabel})
              </div>
              <div className="flex flex-wrap gap-2">
                {gradeOptionsForSelectedLevel.map((opt) => {
                  const isActive = Number(selectedGrade) === opt.grade;
                  return (
                    <button
                      key={opt.grade}
                      type="button"
                      onClick={() => setSelectedGrade(opt.grade)}
                      className={`h-10 px-4 rounded-lg border text-sm font-medium whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Kelas {opt.grade} · {opt.phase}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioritas 3 & 4: Daftar Mata Pelajaran + Lingkup Materi Spesifik Kelas/Fase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-100">
              {/* Kolom Kiri: Mata Pelajaran pada Tingkat Sekolah */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Mata Pelajaran ({subjectsByLevelMap[selectedLevelGroup].length})
                  </h3>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Cari mata pelajaran..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {subjectsInSelectedLevel.length === 0 ? (
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
                    Tidak ada mata pelajaran yang terdeteksi pada tingkat{' '}
                    {getSchoolLevelDisplay(selectedLevelGroup).shortLabel} di berkas CP ini.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                    {subjectsInSelectedLevel.map((entry, idx) => {
                      const isActive =
                        entry.subject.toLowerCase() === selectedSubjectName.toLowerCase();
                      return (
                        <button
                          key={`${entry.subject}-${idx}`}
                          type="button"
                          onClick={() => setSelectedSubjectName(entry.subject)}
                          className={`w-full text-left px-3.5 py-3 flex items-center justify-between gap-2 transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{entry.subject}</p>
                            <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                              {entry.jpPerWeek || 3} JP/minggu ·{' '}
                              {(entry.materialsSem1?.length || 0) +
                                (entry.materialsSem2?.length || 0)}{' '}
                              Bab
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-blue-600' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Lingkup Materi yang Diajarkan untuk Jenjang Kelas/Fase Terpilih */}
              <div className="lg:col-span-8 space-y-4">
                {!activeSubjectInspection ? (
                  <div className="p-8 rounded-lg border border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                    Pilih mata pelajaran di sebelah kiri untuk melihat lingkup materi spesifik
                    untuk Kelas {selectedGrade} ({selectedPhase}).
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Lingkup Materi: {activeSubjectInspection.subject}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                          {getSchoolLevelDisplay(selectedLevelGroup).shortLabel} · Kelas{' '}
                          {activeSubjectInspection.grade} ({activeSubjectInspection.phase}) ·{' '}
                          {activeSubjectInspection.jpPerWeek} JP/minggu · Total{' '}
                          {activeSubjectInspection.totalHoursPerYear} JP/tahun
                        </p>
                      </div>
                    </div>

                    {/* Semester 1 & Semester 2 Lingkup Materi */}
                    <div className="space-y-4">
                      {([
                        {
                          title: 'Semester 1 (Ganjil)',
                          items: activeSubjectInspection.materialsSem1,
                        },
                        {
                          title: 'Semester 2 (Genap)',
                          items: activeSubjectInspection.materialsSem2,
                        },
                      ] as const).map((semBlock) => (
                        <div
                          key={semBlock.title}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">
                              {semBlock.title}
                            </h4>
                            <span className="text-xs font-medium text-slate-500 tabular-nums">
                              {semBlock.items.length} Bab ·{' '}
                              {semBlock.items.reduce(
                                (sum, m) => sum + (Number(m.allocatedHours) || 0),
                                0
                              )}{' '}
                              JP
                            </span>
                          </div>
                          {semBlock.items.length === 0 ? (
                            <p className="p-4 text-xs text-slate-500">
                              Belum ada lingkup materi pada {semBlock.title}.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 bg-white">
                                    <th className="py-2 px-3 w-12">No</th>
                                    <th className="py-2 px-3">Bab / Lingkup Materi Pokok</th>
                                    <th className="py-2 px-3">Elemen CP</th>
                                    <th className="py-2 px-3">Rumusan Tujuan Pembelajaran</th>
                                    <th className="py-2 px-3 text-right w-16">JP</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {semBlock.items.map((mat, mIdx) => (
                                    <tr key={mat.id || mIdx} className="align-top">
                                      <td className="py-2.5 px-3 text-slate-500 tabular-nums">
                                        {mIdx + 1}
                                      </td>
                                      <td className="py-2.5 px-3 font-medium text-slate-900">
                                        {mat.essentialMaterial}
                                      </td>
                                      <td className="py-2.5 px-3 text-xs text-slate-600">
                                        {mat.elementName || 'Pemahaman Konsep'}
                                      </td>
                                      <td className="py-2.5 px-3 text-xs text-slate-600">
                                        <span className="font-semibold text-slate-800 tabular-nums">
                                          {mat.tpCode}
                                        </span>{' '}
                                        — {mat.tpName}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                                        {mat.allocatedHours}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Elemen CP Mapel */}
                    {activeSubjectInspection.elements &&
                      activeSubjectInspection.elements.length > 0 && (
                        <div className="border border-slate-200 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-sm font-semibold text-slate-800">
                            Elemen Capaian Pembelajaran ({activeSubjectInspection.elements.length})
                          </h4>
                          <div className="divide-y divide-slate-100">
                            {activeSubjectInspection.elements.map((el, elIdx) => (
                              <div key={elIdx} className="py-2 first:pt-0 last:pb-0">
                                <p className="text-sm font-medium text-slate-900">{el.name}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{el.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Bagian 3: Tombol Sinkronisasi Otomatis ke Menu Profil Guru & Parameter Kurikulum */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-900">
                  3. Sinkronkan Otomatis ke Aplikasi
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl">
                  Terapkan hasil analisis file CP{' '}
                  <span className="font-semibold text-slate-900">{docName || analysisDraft.docName}</span>{' '}
                  secara otomatis ke <span className="font-semibold text-slate-900">Menu Profil Guru</span>{' '}
                  ({activeSubjectInspection?.subject || analysisDraft.primarySubject} ·{' '}
                  {getSchoolLevelDisplay(selectedLevelGroup).shortLabel} · Kelas {selectedGrade} /{' '}
                  {selectedPhase}) dan <span className="font-semibold text-slate-900">Menu Parameter Kurikulum</span>{' '}
                  ({totalUniqueSubjects} mata pelajaran di {activeLevelCount} tingkat sekolah).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncToApp}
                disabled={isSyncing}
                className="h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                {isSyncing
                  ? 'Menyinkronkan...'
                  : 'Sinkronkan Otomatis ke Profil Guru & Parameter Kurikulum'}
              </button>
            </div>

            {syncSuccessInfo && (
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-sm">
                    <p className="font-semibold text-emerald-950">
                      Sinkronisasi Berhasil Disimpan
                    </p>
                    <p className="text-xs text-emerald-800 tabular-nums">
                      Dokumen &ldquo;{syncSuccessInfo.docName}&rdquo; · {syncSuccessInfo.totalSubjects} mata
                      pelajaran lintas {syncSuccessInfo.levelCount} tingkat sekolah tersinkron ke Parameter
                      Kurikulum · Profil Guru diperbarui ke {syncSuccessInfo.profileSubject} (
                      {getSchoolLevelDisplay(syncSuccessInfo.profileLevel).shortLabel} · Kelas{' '}
                      {syncSuccessInfo.profileGrade} / {syncSuccessInfo.profilePhase}).
                    </p>
                  </div>
                </div>

                {onNavigate && (
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('profil_guru_mapel')}
                      className="h-10 px-4 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      Buka Menu Profil Guru
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('parameter_kurikulum')}
                      className="h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      Buka Parameter Kurikulum
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default UploadCPMasterView;
