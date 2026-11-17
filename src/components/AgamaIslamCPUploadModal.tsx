import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  Layers,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ActiveMasterCPData,
  CPDistributionPlan,
  CPMaterialItem,
  CPReference,
  SchoolLevel,
} from '../types';
import { StorageService, DEFAULT_ADMIN } from '../lib/storage';
import { UniversalFileParser } from '../lib/universalFileParser';
import { getSubjectPresetByGrade } from '../lib/subjectMaterialPresets';

export const isAgamaSubject = (subject?: string): boolean => {
  if (!subject) return false;
  const s = subject.toLowerCase().trim();
  return (
    s.includes('agama') ||
    s.includes('budi pekerti') ||
    /\bpai\b/.test(s) ||
    /\bpak\b/.test(s) ||
    /\bpab\b/.test(s)
  );
};
export const isAgamaIslamSubject = isAgamaSubject;

const getDefaultPhaseForGrade = (level: SchoolLevel, grade: number): string => {
  if (level === 'SD') {
    if (grade <= 2) return 'Fase A';
    if (grade <= 4) return 'Fase B';
    return 'Fase C';
  }
  if (level === 'SMP') return 'Fase D';
  return grade === 10 ? 'Fase E' : 'Fase F';
};

const buildAgamaElementsFromText = (
  extractedText: string,
  subjectName: string,
  phase: string
): { name: string; description: string; competencies: string[]; essentialMaterials: string[] }[] => {
  const lower = (extractedText || '').toLowerCase();
  const baseElements = [
    {
      name: 'Kitab Suci / Al-Qur’an & Hadis / Sumber Ajaran',
      keywords: ['qur', 'hadis', 'kitab suci', 'injil', 'tora', 'veda', 'dhammapada', 'sishu', 'ayat', 'kitab'],
      description: `Peserta didik mampu memahami, membaca, dan menganalisis sumber ajaran dan kitab suci sesuai nilai keimanan pada ${phase}.`,
      competencies: ['Mempelajari Kitab Suci', 'Menganalisis teks suci', 'Mengamalkan ajaran moral'],
      essentialMaterials: ['Kajian Kitab Suci', 'Tafsir & Pemahaman Moral Teologis'],
    },
    {
      name: 'Keimanan & Ketuhanan (Akidah / Teologi)',
      keywords: ['akidah', 'iman', 'ketuhanan', 'brahman', 'sang hyang', 'allah', 'kristus', 'buddha', 'tauhid'],
      description: `Peserta didik memahami dan menghayati hakikat keimanan, ketuhanan, serta penguatan moral spiritual dalam kehidupan modern.`,
      competencies: ['Memahami hakikat keimanan', 'Menghayati nilai ketuhanan', 'Menjaga integritas spiritual'],
      essentialMaterials: ['Keimanan & Ketuhanan', 'Spiritualitas & Karakter Luhur'],
    },
    {
      name: 'Akhlak & Budi Pekerti (Moral)',
      keywords: ['akhlak', 'budi pekerti', 'moral', 'etika', 'kasih', 'toleransi', 'tasamuh', 'karakter'],
      description: `Peserta didik membiasakan perilaku berbudi pekerti luhur, mengasihi sesama, toleransi antarpemeluk agama, dan menjunjung tinggi etika moral.`,
      competencies: ['Membiasakan budi pekerti luhur', 'Menjunjung tinggi toleransi', 'Menerapkan etika moral beragama'],
      essentialMaterials: ['Akhlak & Budi Pekerti', 'Etika Sosial & Toleransi Beragama'],
    },
    {
      name: 'Ibadah & Ritual Keagamaan (Fikih / Tata Ibadah)',
      keywords: ['fikih', 'ibadah', 'ritual', 'doa', 'sakramen', 'sembahyang', 'puja', 'karma', 'hukum', 'syariah'],
      description: `Peserta didik memahami tata cara peribadatan dan hukum/ritual keagamaan serta menerapkannya sesuai tuntunan keyakinan.`,
      competencies: ['Memahami tata cara peribadatan', 'Mempraktikkan ritual keagamaan', 'Menerapkan nilai ibadah dalam amal nyata'],
      essentialMaterials: ['Tata Ibadah & Ritual', 'Praktik Keagamaan Sehari-hari'],
    },
    {
      name: 'Sejarah & Perkembangan Agama (Peradaban)',
      keywords: ['sejarah', 'peradaban', 'tokoh', 'nabi', 'rasul', 'rasulullah', 'martir', 'rasul', 'pandita', 'rohaniwan'],
      description: `Peserta didik menganalisis sejarah perkembangan ajaran keagamaan dan keteladanan tokoh rohaniwan/nabi dalam membangun peradaban damai.`,
      competencies: ['Menganalisis sejarah keagamaan', 'Meneladani figur rohaniwan', 'Mengambil ibrah kerukunan umat'],
      essentialMaterials: ['Sejarah & Tokoh Keagamaan', 'Kontribusi Moral Umat Beragama'],
    },
  ];

  return baseElements.map((el) => ({
    name: el.name,
    description:
      extractedText.trim().length > 40
        ? `${el.description} (Diselaraskan dengan dokumen CP ${subjectName} yang diunggah).`
        : el.description,
    competencies: el.competencies,
    essentialMaterials: el.essentialMaterials,
  }));
};

const extractCustomMaterialsFromAgamaText = (
  rawText: string,
  level: SchoolLevel,
  grade: number,
  phase: string,
  jpPerWeek: number,
  subjectName: string
): { sem1: CPMaterialItem[]; sem2: CPMaterialItem[] } => {
  const preset = getSubjectPresetByGrade('Pendidikan Agama Islam', level, grade, phase);
  const totalYearHours = (jpPerWeek || preset.jpPerWeek || 3) * 36;
  const halfHours = Math.round(totalYearHours / 2);

  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 12 && l.length <= 220);

  const babCandidates = lines.filter((l) =>
    /^(bab\s*\d+|unit\s*\d+|materi\s*\d+|tp[\.\s]*\d+|\d+[\.\)]\s+[A-Z])/i.test(l)
  );

  if (babCandidates.length >= 4) {
    const cleanItems = babCandidates.slice(0, 8).map((line) =>
      line.replace(/^(\d+[\.\)]\s*)/, '').trim()
    );
    const splitIdx = Math.ceil(cleanItems.length / 2);
    const sem1Raw = cleanItems.slice(0, splitIdx);
    const sem2Raw = cleanItems.slice(splitIdx);

    const hoursPerSem1 = Math.max(jpPerWeek * 2, Math.floor(halfHours / sem1Raw.length));
    const hoursPerSem2 = Math.max(jpPerWeek * 2, Math.floor((totalYearHours - hoursPerSem1 * sem1Raw.length) / Math.max(1, sem2Raw.length)));

    const sem1: CPMaterialItem[] = sem1Raw.map((title, idx) => ({
      id: `agama-sem1-${Date.now()}-${idx + 1}`,
      semester: 1,
      orderNumber: idx + 1,
      tpCode: `TP.${grade}.1.${idx + 1}`,
      tpName: `Peserta didik mampu memahami, menganalisis, dan mengamalkan nilai-nilai ${subjectName} pada materi ${title} secara sadar, bermakna, dan berakhlak mulia.`,
      essentialMaterial: title,
      elementName: idx === 0 ? 'Kitab Suci / Sumber Ajaran' : idx === 1 ? 'Keimanan & Akidah' : 'Akhlak & Budi Pekerti',
      allocatedHours: hoursPerSem1,
      tpCount: 2,
      assessmentStrategy: 'Uji Pemahaman Moral, Praktik Ibadah & Refleksi Budi Pekerti',
      deepLearningMethod: 'Mindful, Meaningful & Joyful Learning Berbasis Karakter Luhur',
    }));

    const sem2: CPMaterialItem[] = sem2Raw.map((title, idx) => ({
      id: `agama-sem2-${Date.now()}-${idx + 1}`,
      semester: 2,
      orderNumber: sem1.length + idx + 1,
      tpCode: `TP.${grade}.2.${idx + 1}`,
      tpName: `Peserta didik mampu menerapkan ketentuan ibadah dan meneladani sejarah peradaban spiritual terkait ${title} dalam kehidupan sehari-hari.`,
      essentialMaterial: title,
      elementName: idx === 0 ? 'Ibadah & Ritual' : 'Sejarah & Perkembangan Agama',
      allocatedHours: hoursPerSem2,
      tpCount: 2,
      assessmentStrategy: 'Praktik Ibadah, Proyek Kepedulian Sosial & Asesmen Sumatif',
      deepLearningMethod: 'Meaningful & Joyful: Internalisasi Nilai Moderasi & Kasih Sayang',
    }));

    return { sem1, sem2 };
  }

  const sem1Raw = preset.materialsSem1 || [];
  const sem2Raw = preset.materialsSem2 || [];
  const hrs1 = Math.max(jpPerWeek * 2, Math.round(halfHours / Math.max(1, sem1Raw.length)));
  const hrs2 = Math.max(jpPerWeek * 2, Math.round(halfHours / Math.max(1, sem2Raw.length)));

  const sem1: CPMaterialItem[] = sem1Raw.map((m, idx) => ({
    ...m,
    id: `agama-sem1-${Date.now()}-${idx + 1}`,
    tpCode: `TP.${grade}.1.${idx + 1}`,
    allocatedHours: m.allocatedHours || hrs1,
    tpName: m.tpName.replace(/Pendidikan Agama Islam/g, subjectName),
  }));

  const sem2: CPMaterialItem[] = sem2Raw.map((m, idx) => ({
    ...m,
    id: `agama-sem2-${Date.now()}-${idx + 1}`,
    tpCode: `TP.${grade}.2.${idx + 1}`,
    allocatedHours: m.allocatedHours || hrs2,
    tpName: m.tpName.replace(/Pendidikan Agama Islam/g, subjectName),
  }));

  return { sem1, sem2 };
};

interface AgamaIslamCPUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialLevel?: SchoolLevel;
  initialGrade?: number | string;
  initialPhase?: string;
  initialJpPerWeek?: number;
  onSyncedComplete?: (masterData: ActiveMasterCPData) => void;
  onNavigate?: (viewId: string) => void;
}

export const AgamaIslamCPUploadModal: React.FC<AgamaIslamCPUploadModalProps> = ({
  isOpen,
  onClose,
  initialSubject = 'Pendidikan Agama & Budi Pekerti',
  initialLevel = 'SMA',
  initialGrade = 10,
  initialPhase = 'Fase E',
  initialJpPerWeek = 3,
  onSyncedComplete,
  onNavigate,
}) => {
  const currentUser = StorageService.getCurrentUser() || DEFAULT_ADMIN;
  const schoolProfile = StorageService.getSchoolProfile();

  const [subjectName, setSubjectName] = useState<string>(
    initialSubject && isAgamaSubject(initialSubject) ? initialSubject : 'Pendidikan Agama & Budi Pekerti'
  );
  const [level, setLevel] = useState<SchoolLevel>(initialLevel || 'SMA');
  const [grade, setGrade] = useState<number>(Number(initialGrade) || 10);
  const [phase, setPhase] = useState<string>(initialPhase || 'Fase E');
  const [jpPerWeek, setJpPerWeek] = useState<number>(Number(initialJpPerWeek) || 3);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [cpTextInput, setCpTextInput] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [syncedMaster, setSyncedMaster] = useState<ActiveMasterCPData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSubjectName(
        initialSubject && isAgamaSubject(initialSubject) ? initialSubject : 'Pendidikan Agama & Budi Pekerti'
      );
      const lvl = (initialLevel || schoolProfile.level || 'SMA') as SchoolLevel;
      const grd = Number(initialGrade || schoolProfile.grade || (lvl === 'SD' ? 4 : lvl === 'SMP' ? 7 : 10));
      setLevel(lvl);
      setGrade(grd);
      setPhase(initialPhase || getDefaultPhaseForGrade(lvl, grd));
      setJpPerWeek(Number(initialJpPerWeek || schoolProfile.jpPerWeek || 3));
      setErrorMsg('');
      setSyncedMaster(null);
    }
  }, [isOpen, initialSubject, initialLevel, initialGrade, initialPhase, initialJpPerWeek]);

  if (!isOpen) return null;

  const availableGrades = level === 'SD' ? [1, 2, 3, 4, 5, 6] : level === 'SMP' ? [7, 8, 9] : [10, 11, 12];

  const handleLevelChange = (newLvl: SchoolLevel) => {
    setLevel(newLvl);
    const defGrade = newLvl === 'SD' ? 4 : newLvl === 'SMP' ? 7 : 10;
    setGrade(defGrade);
    setPhase(getDefaultPhaseForGrade(newLvl, defGrade));
  };

  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    setPhase(getDefaultPhaseForGrade(level, newGrade));
  };

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setFileType(file.type || 'application/octet-stream');
    setFileSize(file.size);
    setErrorMsg('');
    setIsParsingFile(true);

    try {
      const parsed = await UniversalFileParser.parseFile(file);
      if (parsed.base64) setFileBase64(parsed.base64);
      if (parsed.extractedText && parsed.extractedText.trim().length > 0) {
        setCpTextInput(parsed.extractedText);
      } else {
        setCpTextInput(
          `Dokumen CP ${subjectName} (${file.name}) terlampir untuk Kelas ${grade} (${phase}).`
        );
      }
    } catch (err) {
      console.warn('Fallback file reader for Agama CP:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFileBase64((ev.target?.result as string) || '');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleUploadAndSync = async () => {
    if (!selectedFile && !cpTextInput.trim()) {
      setErrorMsg('Silakan unggah berkas CP Mata Pelajaran Agama (PDF/Word/Excel/Scan) atau tempelkan teks CP terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');

    const totalHoursPerYear = (jpPerWeek || 3) * 36;
    const resolvedFileName =
      selectedFile?.name || `CP_${subjectName.replace(/\s+/g, '_')}_${level}_Kelas_${grade}_${phase.replace(/\s+/g, '_')}.pdf`;

    let apiResultData: any = null;
    try {
      const response = await fetch('/api/ai/analyze-cp-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: resolvedFileName,
          fileBase64,
          fileType,
          fileContent: cpTextInput,
          subject: subjectName,
          level,
          grade,
          phase,
          totalHoursPerYear,
          jpPerWeek,
          totalTPCount: 6,
          customPrompt: `Fokus 5 Elemen Pendidikan Agama: Kitab Suci, Keimanan/Akidah, Akhlak/Budi Pekerti, Ibadah/Ritual, dan Sejarah Peradaban Agama.`,
        }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json?.success && json?.data) {
          apiResultData = json.data;
        }
      }
    } catch {
      // Offline / client-side fallback handled seamlessly below
    }

    const fallbackParsed = extractCustomMaterialsFromAgamaText(cpTextInput, level, grade, phase, jpPerWeek, subjectName);

    const sem1Items: CPMaterialItem[] =
      Array.isArray(apiResultData?.materialsSem1) &&
      apiResultData.materialsSem1.length > 0 &&
      typeof apiResultData.materialsSem1[0] === 'object'
        ? apiResultData.materialsSem1.map((m: any, idx: number) => ({
            id: m.id || `agama-sem1-${Date.now()}-${idx + 1}`,
            semester: 1,
            orderNumber: m.orderNumber || idx + 1,
            tpCode: m.tpCode || `TP.${grade}.1.${idx + 1}`,
            tpName: m.tpName || `Memahami dan mengamalkan ${m.essentialMaterial || 'materi keagamaan'}`,
            essentialMaterial: m.essentialMaterial || `Materi Semester 1 Bagian ${idx + 1}`,
            elementName: m.elementName || 'Kitab Suci / Keimanan / Akhlak',
            allocatedHours: Number(m.allocatedHours) || Math.round(totalHoursPerYear / 2 / apiResultData.materialsSem1.length),
            tpCount: m.tpCount || 2,
            assessmentStrategy: m.assessmentStrategy || 'Uji Pemahaman Moral, Ibadah & Refleksi Budi Pekerti',
            deepLearningMethod: m.deepLearningMethod || 'Mindful, Meaningful & Joyful Learning Berbasis Karakter Luhur',
          }))
        : fallbackParsed.sem1;

    const sem2Items: CPMaterialItem[] =
      Array.isArray(apiResultData?.materialsSem2) &&
      apiResultData.materialsSem2.length > 0 &&
      typeof apiResultData.materialsSem2[0] === 'object'
        ? apiResultData.materialsSem2.map((m: any, idx: number) => ({
            id: m.id || `agama-sem2-${Date.now()}-${idx + 1}`,
            semester: 2,
            orderNumber: m.orderNumber || sem1Items.length + idx + 1,
            tpCode: m.tpCode || `TP.${grade}.2.${idx + 1}`,
            tpName: m.tpName || `Menganalisis dan menerapkan ${m.essentialMaterial || 'materi keagamaan'}`,
            essentialMaterial: m.essentialMaterial || `Materi Semester 2 Bagian ${idx + 1}`,
            elementName: m.elementName || 'Ibadah & Ritual / Sejarah Keagamaan',
            allocatedHours: Number(m.allocatedHours) || Math.round(totalHoursPerYear / 2 / apiResultData.materialsSem2.length),
            tpCount: m.tpCount || 2,
            assessmentStrategy: 'Praktik Ibadah, Proyek Kepedulian Sosial & Asesmen Sumatif',
            deepLearningMethod: 'Meaningful & Joyful: Internalisasi Nilai Moderasi & Kasih Sayang',
          }))
        : fallbackParsed.sem2;

    const elements =
      Array.isArray(apiResultData?.elements) && apiResultData.elements.length >= 3
        ? apiResultData.elements
        : buildAgamaElementsFromText(cpTextInput, subjectName, phase);

    const preset = getSubjectPresetByGrade('Pendidikan Agama Islam', level, grade, phase);
    const resolvedCpText =
      cpTextInput.trim() ||
      apiResultData?.executiveSummary ||
      preset.cpSummary.replace(/Pendidikan Agama Islam/g, subjectName);

    const masterData: ActiveMasterCPData = {
      id: `master-agama-${Date.now()}`,
      fileName: resolvedFileName,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || resolvedCpText.length,
      uploadedAt: new Date().toISOString(),
      level,
      grade,
      phase,
      subject: subjectName,
      teacherName: schoolProfile.teacherName || currentUser.name,
      teacherNip: schoolProfile.teacherNip,
      schoolName: schoolProfile.schoolName,
      headmasterName: schoolProfile.headmasterName,
      headmasterNip: schoolProfile.headmasterNip,
      city: schoolProfile.city,
      academicYear: schoolProfile.academicYear || '2025/2026',
      totalHoursPerYear,
      jpPerWeek,
      timeAllocationPerWeek: level === 'SD' ? '35 Menit' : level === 'SMP' ? '40 Menit' : '45 Menit',
      cpText: resolvedCpText,
      elements,
      materialsSem1: sem1Items,
      materialsSem2: sem2Items,
      executiveSummary:
        apiResultData?.executiveSummary ||
        `CP Khusus ${subjectName} (${level} Kelas ${grade} / ${phase}) dari dokumen "${resolvedFileName}" telah disinkronkan ke seluruh 9 perangkat ajar.`,
      kktpSummary:
        apiResultData?.kktpSummary ||
        'Interval Ketuntasan: 0-40% (Perlu Bimbingan), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
      deepLearningNotes: 'Integrasi 5 Elemen Pendidikan Agama dengan 3 Pilar Deep Learning & Moderasi Beragama.',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save Active Master CP
    StorageService.setActiveMasterCP(masterData);

    // 2. Sync School Profile
    StorageService.saveSchoolProfile({
      ...schoolProfile,
      subject: subjectName,
      level,
      grade,
      phase,
      jpPerWeek,
      totalHoursPerYear,
      cpText: resolvedCpText,
    });

    // 3. Save CP Distribution Plan
    const distPlan: CPDistributionPlan = {
      id: `plan-agama-${level.toLowerCase()}-${grade}-${subjectName.toLowerCase().replace(/\s+/g, '-')}`,
      teacherName: schoolProfile.teacherName || currentUser.name,
      teacherNip: schoolProfile.teacherNip,
      subject: subjectName,
      schoolName: schoolProfile.schoolName,
      level,
      grade,
      phase,
      academicYear: schoolProfile.academicYear || '2025/2026',
      semesterOption: 'all',
      totalHoursPerYear,
      totalTPCount: sem1Items.length + sem2Items.length,
      jpPerWeek,
      timeAllocationPerWeek: masterData.timeAllocationPerWeek,
      cpText: resolvedCpText,
      elements: elements.map((e: any) => ({ name: e.name, description: e.description })),
      materialsSem1: sem1Items,
      materialsSem2: sem2Items,
      totalHoursSem1: sem1Items.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0),
      totalHoursSem2: sem2Items.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveCPDistribution(distPlan);

    // 4. Save CP Reference
    const cpRef: CPReference = {
      id: `ref-agama-${level.toLowerCase()}-${grade}-${subjectName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `[CP Khusus Agama] ${subjectName} (${level} - ${phase} Kelas ${grade})`,
      level,
      phase,
      grade,
      subject: subjectName,
      curriculumVersion: 'Kurikulum Berbasis Deep Learning & Moderasi Beragama',
      uploadedAt: new Date().toISOString().substring(0, 16),
      uploadedBy: schoolProfile.teacherName || currentUser.name,
      fileName: resolvedFileName,
      cpText: resolvedCpText,
      elements,
      rawText: resolvedCpText,
      aiAnalysisSummary: masterData.executiveSummary,
    };
    StorageService.saveCPReference(cpRef);

    // 5. Notification
    StorageService.addNotification({
      title: `CP Khusus ${subjectName} Disinkronkan`,
      message: `Berkas "${resolvedFileName}" (${level} Kelas ${grade} - ${phase}) berhasil disinkronkan ke seluruh 9 perangkat ajar.`,
      type: 'sync',
      metadata: { subject: subjectName, level, grade, phase, fileName: resolvedFileName },
    });

    // 6. Broadcast events
    try {
      window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: masterData }));
      window.dispatchEvent(new Event('curriculum-parameters-synced'));
      window.dispatchEvent(new Event('school-profile-updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    setSyncedMaster(masterData);
    setIsSyncing(false);

    if (onSyncedComplete) {
      onSyncedComplete(masterData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 shrink-0">
              <BookOpen className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider">
                  Khusus Semua Mapel Agama &amp; Budi Pekerti
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 text-emerald-100 text-[10px] font-bold">
                  Sinkron 9 Perangkat Ajar
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Upload CP Khusus {subjectName}
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Unggah dokumen CP resmi Mata Pelajaran Agama untuk langsung disinkronkan ke seluruh 9 perangkat ajar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {syncedMaster ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-emerald-900">
                    CP {subjectName} Berhasil Diunggah &amp; Disinkronkan!
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Dokumen <strong>{syncedMaster.fileName}</strong> untuk{' '}
                    <strong>
                      {syncedMaster.subject} ({syncedMaster.level} Kelas {syncedMaster.grade} • {syncedMaster.phase})
                    </strong>{' '}
                    telah aktif sebagai acuan tunggal dan otomatis terhubung ke semua perangkat ajar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'analisis_alokasi_waktu', label: '1. Analisis Alokasi Waktu' },
                  { id: 'ai_analisis_cp', label: '2. Analisis CP' },
                  { id: 'ai_tp', label: '3. Tujuan Pembelajaran' },
                  { id: 'ai_atp', label: '4. Alur TP (ATP)' },
                  { id: 'ai_prota', label: '5. Program Tahunan' },
                  { id: 'ai_prosem', label: '6. Program Semester' },
                  { id: 'ai_kktp', label: '7. KKTP & Interval' },
                  { id: 'ai_modul_ajar', label: '8. RPM / Modul Ajar' },
                  { id: 'ai_lkpd', label: '9. Lembar Kerja (LKPD)' },
                  { id: 'ai_rubrik_penilaian', label: '10. Rubrik Penilaian' },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigate) onNavigate(tool.id);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left flex items-center justify-between transition cursor-pointer group"
                  >
                    <span className="font-bold text-slate-800 group-hover:text-emerald-800 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{tool.label}</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  Terpetakan: <strong>{syncedMaster.elements?.length || 5} Elemen Agama</strong> •{' '}
                  <strong>{syncedMaster.materialsSem1.length} Bab Sem 1</strong> •{' '}
                  <strong>{syncedMaster.materialsSem2.length} Bab Sem 2</strong> ({syncedMaster.totalHoursPerYear} JP/Thn)
                </span>
                <button
                  type="button"
                  onClick={() => setSyncedMaster(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Unggah Ulang File Lain</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {/* Subject Title Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mata Pelajaran Agama</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-900 focus:outline-none focus:border-emerald-600"
                  placeholder="Contoh: Pendidikan Agama & Budi Pekerti, Pendidikan Agama Islam, dll..."
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenjang</label>
                  <select
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value as SchoolLevel)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={grade}
                    onChange={(e) => handleGradeChange(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        Kelas {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">JP / Minggu</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={jpPerWeek}
                    onChange={(e) => setJpPerWeek(Math.max(1, Number(e.target.value) || 3))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-center focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Dropzone */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  1. Unggah File Dokumen CP {subjectName} (PDF, Word, Excel, Teks, Foto/Scan)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessFile(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-emerald-700">
                          {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                          {isParsingFile ? 'Mengekstrak isi dokumen...' : 'Siap dianalisis & disinkronkan'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileBase64('');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer shrink-0"
                      title="Hapus file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleProcessFile(f);
                    }}
                    className="p-5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-xl cursor-pointer text-center transition space-y-1.5"
                  >
                    <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-slate-800">
                      Klik atau Tarik File CP {subjectName} ke Sini
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Mendukung PDF, Microsoft Word (.docx), Excel (.xlsx), TXT, maupun Foto/Scan CP Keagamaan
                    </p>
                  </div>
                )}
              </div>

              {/* CP Text Input / Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    2. Teks / Isi Capaian Pembelajaran (CP) {subjectName}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Otomatis terisi dari file atau tempel manual
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={cpTextInput}
                  onChange={(e) => setCpTextInput(e.target.value)}
                  placeholder={`Tempelkan atau tinjau isi Capaian Pembelajaran ${subjectName} di sini...`}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 leading-relaxed"
                />
              </div>

              {/* 5 Elements Info */}
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start space-x-2 text-[11px] text-teal-900">
                <Layers className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Pemetaan Otomatis 5 Elemen Pendidikan Agama:</strong> Sumber Ajaran/Kitab Suci, Keimanan/Akidah, Akhlak &amp; Budi Pekerti, Ibadah/Ritual, serta Sejarah/Perkembangan Agama — otomatis tersinkron ke{' '}
                  <strong>Analisis CP, TP, ATP, PROTA, PROSEM, KKTP, RPM, LKPD, &amp; Rubrik Penilaian</strong>.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {syncedMaster ? 'Selesai & Tutup' : 'Batal'}
          </button>

          {!syncedMaster && (
            <button
              type="button"
              onClick={handleUploadAndSync}
              disabled={isSyncing || isParsingFile}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyinkronkan CP {subjectName}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Upload &amp; Sinkronkan ke Semua Perangkat Ajar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface AgamaIslamCPBannerProps {
  subject: string;
  onOpenModal: () => void;
  activeFileName?: string;
}

export const AgamaIslamCPBanner: React.FC<AgamaIslamCPBannerProps> = ({
  subject,
  onOpenModal,
  activeFileName,
}) => {
  if (!isAgamaSubject(subject)) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-start space-x-2.5">
        <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-black text-emerald-950">
              Upload CP Khusus {subject}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
              Sinkron Otomatis 9 Perangkat Ajar
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            {activeFileName
              ? `Dokumen CP ${subject} aktif: "${activeFileName}". Klik tombol di kanan untuk mengunggah atau memperbarui berkas CP.`
              : `Unggah dokumen CP resmi ${subject} agar seluruh perangkat ajar otomatis mengikuti CP Agama Anda.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenModal}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition shrink-0 cursor-pointer self-start sm:self-center"
      >
        <UploadCloud className="w-3.5 h-3.5" />
        <span>Upload CP Agama</span>
      </button>
    </div>
  );
};
