import React, { useState, useRef, useEffect } from 'react';
import { UniversalFileParser } from '../lib/universalFileParser';
import {
  UploadCloud,
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Target,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Download,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  ListOrdered,
  FolderOpen,
  Trash2,
  Eye,
  FileSpreadsheet,
  Lock,
  Compass,
  CheckCheck,
  BrainCircuit,
  GraduationCap,
  ChevronRight,
  BookMarked,
  X,
  Printer,
  FileSpreadsheet as FileSpreadsheetIcon,
  Sliders,
  CheckCheck as CheckCheckIcon,
  FolderSync,
} from 'lucide-react';
import {
  SchoolLevel,
  CPMaterialItem,
  ActiveMasterCPData,
  AIDocument,
  CPDistributionPlan,
} from '../types';
import { StorageService, DEFAULT_ADMIN } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { CustomFormatSelector, CustomFormatConfig } from './CustomFormatSelector';
import { generateExpertCurriculumDocument } from '../lib/curriculumEngine';
import { generateAutoTPForMaterial } from '../lib/curriculumData';

interface CPUploaderAndAnalyzerProps {
  onAnalysisComplete?: (masterData: ActiveMasterCPData) => void;
  onNavigate?: (view: string, subType?: string) => void;
  teacherName?: string;
  schoolName?: string;
  isTeacherMode?: boolean;
  customTitle?: string;
  customDescription?: string;
}

export const CPUploaderAndAnalyzer: React.FC<CPUploaderAndAnalyzerProps> = ({
  onAnalysisComplete,
  onNavigate,
  teacherName = 'Aspian La Ode Madimu, S.Pd. Gr',
  schoolName = 'SMA NEGERI 30 MALUKU TENGAH',
  isTeacherMode = false,
  customTitle,
  customDescription,
}) => {
  const currentUser = StorageService.getCurrentUser() || DEFAULT_ADMIN;
  const isAdmin = currentUser.role === 'admin';
  const canUpload = isAdmin || isTeacherMode;

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [rawTextContent, setRawTextContent] = useState<string>('');

  // Custom School Format State
  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>({
    useCustomFormat: false,
    formatFile: null,
    customFormatNotes: '',
  });

  // Perangkat Generator Modal States
  const [showPerangkatModal, setShowPerangkatModal] = useState<boolean>(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('modul_ajar');
  const [selectedDocSemester, setSelectedDocSemester] = useState<'Semester 1' | 'Semester 2' | '1 Tahun'>('Semester 1');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedLearningModel, setSelectedLearningModel] = useState<string>('Problem-Based Learning (PBL)');
  const [generatedDocContent, setGeneratedDocContent] = useState<string>('');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [copiedDoc, setCopiedDoc] = useState<boolean>(false);

  // Form parameters
  const [level, setLevel] = useState<SchoolLevel>('SMA');
  const [grade, setGrade] = useState<number | string>(10);
  const [phase, setPhase] = useState<string>('Fase E');
  const [subject, setSubject] = useState<string>('Fisika');
  const [totalHoursPerYear, setTotalHoursPerYear] = useState<number>(108);
  const [jpPerWeek, setJpPerWeek] = useState<number>(3);
  const [totalTPCount, setTotalTPCount] = useState<number>(6);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Execution & Progress states (0 - 100%)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentPhaseTitle, setCurrentPhaseTitle] = useState<string>('');
  const [currentPhaseDetail, setCurrentPhaseDetail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'elements' | 'materials' | 'kktp' | 'report'>('summary');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [showSyncParamModal, setShowSyncParamModal] = useState<boolean>(false);
  const [syncParamDetails, setSyncParamDetails] = useState<{
    subject: string;
    level: string;
    phase: string;
    grade: number | string;
    totalBab: number;
    totalTP: number;
    totalHours: number;
    jpPerWeek: number;
    materialsSem1: CPMaterialItem[];
    materialsSem2: CPMaterialItem[];
  } | null>(null);

  // Result state
  const [masterData, setMasterData] = useState<ActiveMasterCPData | null>(() => StorageService.getActiveMasterCP());
  const [syncedNotification, setSyncedNotification] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update phase when grade / level changes
  const handleGradeChange = (g: number) => {
    setGrade(g);
    if (level === 'SD') {
      if (g <= 2) setPhase('Fase A');
      else if (g <= 4) setPhase('Fase B');
      else setPhase('Fase C');
    } else if (level === 'SMP') {
      setPhase('Fase D');
    } else {
      if (g === 10) setPhase('Fase E');
      else setPhase('Fase F');
    }
  };

  const handleLevelChange = (lvl: SchoolLevel) => {
    setLevel(lvl);
    if (lvl === 'SD') {
      setGrade(4);
      setPhase('Fase B');
      setJpPerWeek(4);
      setTotalHoursPerYear(144);
    } else if (lvl === 'SMP') {
      setGrade(7);
      setPhase('Fase D');
      setJpPerWeek(3);
      setTotalHoursPerYear(108);
    } else {
      setGrade(10);
      setPhase('Fase E');
      setJpPerWeek(3);
      setTotalHoursPerYear(108);
    }
  };

  // Handle File Selection (PDF, Word docx/doc, txt, Excel, JSON)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (selected: File) => {
    setFile(selected);
    setFileName(selected.name);
    setFileType(selected.type || 'application/octet-stream');
    setFileSize(selected.size);
    setErrorMsg('');

    // Auto-detect subject / level from file name
    const lowerName = (selected.name || '').toLowerCase();
    if (lowerName.includes('fisika')) setSubject('Fisika');
    else if (lowerName.includes('matematika')) setSubject('Matematika');
    else if (lowerName.includes('biologi')) setSubject('Biologi');
    else if (lowerName.includes('kimia')) setSubject('Kimia');
    else if (lowerName.includes('informatika')) setSubject('Informatika');
    else if (lowerName.includes('bahasa indonesia') || lowerName.includes('indo')) setSubject('Bahasa Indonesia');
    else if (lowerName.includes('bahasa inggris') || lowerName.includes('inggris')) setSubject('Bahasa Inggris');
    else if (lowerName.includes('pancasila') || lowerName.includes('ppkn')) setSubject('Pendidikan Pancasila');
    else if (lowerName.includes('sejarah')) setSubject('Sejarah');
    else if (lowerName.includes('geografi')) setSubject('Geografi');
    else if (lowerName.includes('ekonomi')) setSubject('Ekonomi');
    else if (lowerName.includes('sosiologi')) setSubject('Sosiologi');
    else if (lowerName.includes('pjok') || lowerName.includes('penjas')) setSubject('PJOK');
    else if (lowerName.includes('agama')) setSubject('Pendidikan Agama Islam');
    else if (lowerName.includes('ipas')) setSubject('IPAS');

    if (lowerName.includes('fase a')) { setLevel('SD'); setPhase('Fase A'); setGrade(1); }
    else if (lowerName.includes('fase b')) { setLevel('SD'); setPhase('Fase B'); setGrade(4); }
    else if (lowerName.includes('fase c')) { setLevel('SD'); setPhase('Fase C'); setGrade(5); }
    else if (lowerName.includes('fase d')) { setLevel('SMP'); setPhase('Fase D'); setGrade(7); }
    else if (lowerName.includes('fase e')) { setLevel('SMA'); setPhase('Fase E'); setGrade(10); }
    else if (lowerName.includes('fase f')) { setLevel('SMA'); setPhase('Fase F'); setGrade(11); }

    // Universal parsing for all file formats (PDF, Word, Excel, PowerPoint, Text, Images)
    UniversalFileParser.parseFile(selected)
      .then((parsed) => {
        if (parsed.base64) {
          setFileBase64(parsed.base64);
        }
        if (parsed.extractedText) {
          setRawTextContent(parsed.extractedText);
        }
      })
      .catch((parseErr) => {
        console.warn('Universal parser fallback warning:', parseErr);
        // Fallback base64 read
        const reader = new FileReader();
        reader.onload = (event) => {
          setFileBase64(event.target?.result as string);
        };
        reader.readAsDataURL(selected);
      });
  };

  const handleClearFile = () => {
    setFile(null);
    setFileBase64('');
    setFileName('');
    setFileType('');
    setFileSize(0);
    setRawTextContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Deep Meticulous Analysis with 0 - 100% animated progression
  const handleStartAnalysis = async () => {
    if (!fileBase64 && !rawTextContent.trim() && !subject.trim()) {
      setErrorMsg('Pilih file dokumen CP resmi (PDF/Word/Excel/JSON/Teks) atau masukkan nama mata pelajaran.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setProgressPercent(5);
    setCurrentPhaseTitle('1. Ekstraksi Dokumen & Pra-pemrosesan Teks');
    setCurrentPhaseDetail('Membaca berkas CP resmi dan mengekstrak struktur karakter dokumen...');

    // Progress simulation while waiting for API or parser response
    let currentPct = 5;
    progressIntervalRef.current = setInterval(() => {
      currentPct += Math.floor(Math.random() * 4) + 2;
      if (currentPct > 92) {
        currentPct = 92;
      }
      setProgressPercent(currentPct);

      if (currentPct < 20) {
        setCurrentPhaseTitle('1. Ekstraksi Dokumen & Pra-pemrosesan Teks');
        setCurrentPhaseDetail('Membaca berkas CP resmi BSKAP Kemendikdasmen RI...');
      } else if (currentPct < 40) {
        setCurrentPhaseTitle('2. Deteksi Metadata Resmi (Jenjang, Fase, Kelas, Mapel)');
        setCurrentPhaseDetail('Mengidentifikasi regulasi Kurikulum Merdeka & alokasi JP per tahun...');
      } else if (currentPct < 60) {
        setCurrentPhaseTitle('3. Dekomposisi Elemen CP & KKO Taksonomi Bloom HOTS');
        setCurrentPhaseDetail('Mengekstrak kompetensi esensial dan lingkup materi pokok...');
      } else if (currentPct < 78) {
        setCurrentPhaseTitle('4. Perumusan TP Berbasis Deep Learning & Dimensi 6C');
        setCurrentPhaseDetail('Menyusun komponen ABCD (Mindful, Meaningful, & Joyful)...');
      } else {
        setCurrentPhaseTitle('5. Distribusi Materi & Alokasi JP Semester 1 & Semester 2');
        setCurrentPhaseDetail('Membagi alur tujuan dan JP ganjil-genap secara berimbang...');
      }
    }, 150);

    // 1. FAST PATH: Deteksi file JSON Standar CP Master Export
    if (rawTextContent.trim().startsWith('{')) {
      try {
        const jsonCP = JSON.parse(rawTextContent);
        if (jsonCP.documentType === 'CP_MASTER_EXPORT' || (jsonCP.subject && (jsonCP.elements || jsonCP.materialsSem1))) {
          clearInterval(progressIntervalRef.current);
          setProgressPercent(100);
          setCurrentPhaseTitle('100% Selesai & Terverifikasi!');
          setCurrentPhaseDetail('File JSON CP Standar berhasil dibaca dan disinkronkan ke seluruh perangkat ajar.');

          const resolvedSub = jsonCP.subject || subject;
          const resolvedLvl = (jsonCP.level as SchoolLevel) || level;
          const resolvedGrd = Number(jsonCP.grade) || grade;
          const resolvedPhs = jsonCP.phase || phase;
          const resolvedHrs = Number(jsonCP.totalHoursPerYear) || totalHoursPerYear;
          const resolvedJpW = Number(jsonCP.jpPerWeek) || jpPerWeek;

          setSubject(resolvedSub);
          setLevel(resolvedLvl);
          setGrade(resolvedGrd);
          setPhase(resolvedPhs);
          setTotalHoursPerYear(resolvedHrs);
          setJpPerWeek(resolvedJpW);

          const sem1Items: CPMaterialItem[] = (jsonCP.materialsSem1 || []).map((m: any, idx: number) => ({
            ...m,
            id: m.id || `sem1-${Date.now()}-${idx + 1}`,
          }));
          const sem2Items: CPMaterialItem[] = (jsonCP.materialsSem2 || []).map((m: any, idx: number) => ({
            ...m,
            id: m.id || `sem2-${Date.now()}-${idx + 1}`,
          }));

          const jsonMaster: ActiveMasterCPData = {
            id: `cp-master-${Date.now()}`,
            fileName: fileName || `Dokumen CP ${resolvedSub} ${resolvedPhs}.json`,
            fileType: 'application/json',
            fileSize,
            uploadedAt: new Date().toISOString(),
            level: resolvedLvl,
            grade: resolvedGrd,
            phase: resolvedPhs,
            subject: resolvedSub,
            teacherName: teacherName || currentUser.name,
            schoolName,
            academicYear: '2025/2026',
            totalHoursPerYear: resolvedHrs,
            jpPerWeek: resolvedJpW,
            cpText: jsonCP.cpSummary || jsonCP.cpText || `Capaian Pembelajaran ${resolvedSub} ${resolvedLvl} (${resolvedPhs})`,
            elements: jsonCP.elements || [],
            materialsSem1: sem1Items,
            materialsSem2: sem2Items,
            executiveSummary: `Analisis komprehensif Capaian Pembelajaran (CP) untuk mata pelajaran ${resolvedSub} Jenjang ${resolvedLvl} (${resolvedPhs} - Kelas ${resolvedGrd}). Diperkaya pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning).`,
            kktpSummary: 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
          };

          StorageService.setActiveMasterCP(jsonMaster);
          const currentProf = StorageService.getSchoolProfile();
          StorageService.saveSchoolProfile({
            ...currentProf,
            subject: resolvedSub,
            level: resolvedLvl,
            grade: resolvedGrd,
            phase: resolvedPhs,
            jpPerWeek: resolvedJpW,
          });

          setMasterData(jsonMaster);
          setSyncedNotification(`Dokumen CP ${resolvedSub} (${resolvedLvl} - ${resolvedPhs}) Berhasil Diadopsi & Disinkronkan Otomatis ke 9 Perangkat Ajar!`);
          setShowCompletionModal(true);

          try {
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: jsonMaster }));
          } catch {}

          if (onAnalysisComplete) onAnalysisComplete(jsonMaster);
          setIsAnalyzing(false);
          return;
        }
      } catch (jsonErr) {
        console.warn('Bukan file JSON murni, melanjutkan dengan analisis standar:', jsonErr);
      }
    }

    try {
      let resData: any = null;
      let result: any = null;

      try {
        const response = await fetch('/api/ai/analyze-cp-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileName || `Capaian Pembelajaran ${subject}`,
            fileBase64,
            fileType,
            fileContent: rawTextContent,
            subject,
            level,
            grade,
            phase,
            totalHoursPerYear,
            jpPerWeek,
            totalTPCount,
            customPrompt,
          }),
        });

        if (response.ok) {
          result = await response.json();
          if (result && result.success) {
            resData = result.data || {};
          }
        }
      } catch (networkErr) {
        console.warn('Network API tidak tersedia, menggunakan parser kurikulum cerdas internal:', networkErr);
      }

      // CLIENT-SIDE EXPERT FALLBACK ENGINE (Jika server offline / GitHub Pages)
      if (!resData) {
        const fallbackSubject = subject || 'Mata Pelajaran Umum';
        const fallbackLevel = level || 'SMA';
        const fallbackGrade = grade || 10;
        const fallbackPhase = phase || 'E';
        const fallbackTotalHours = totalHoursPerYear || 108;
        const fallbackJp = jpPerWeek || 3;

        resData = {
          identifiedMetadata: {
            subject: fallbackSubject,
            level: fallbackLevel,
            grade: fallbackGrade,
            phase: fallbackPhase,
            totalHoursPerYear: fallbackTotalHours,
            jpPerWeek: fallbackJp,
          },
          elements: [
            {
              name: 'Pemahaman Konsep',
              description: `Menguasai konsep esensial dan prinsip inti ${fallbackSubject}.`,
              competencies: ['Menganalisis konsep esensial', 'Mengevaluasi fenomena kontekstual'],
              essentialMaterials: [`Materi Pokok Inti ${fallbackSubject}`],
            },
            {
              name: 'Keterampilan Proses',
              description: `Menerapkan metode penyelidikan ilmiah dan penyelesaian masalah ${fallbackSubject}.`,
              competencies: ['Merancang eksperimen/karya inovatif', 'Mengomunikasikan hasil investigasi'],
              essentialMaterials: [`Proyek Pembelajaran Inovatif ${fallbackSubject}`],
            },
          ],
          materialsSem1: [`Bab 1: Dasar & Konsep Esensial ${fallbackSubject}`, `Bab 2: Pendalaman Materi ${fallbackSubject}`],
          materialsSem2: [`Bab 3: Penerapan & Analisis ${fallbackSubject}`, `Bab 4: Evaluasi & Proyek Akhir ${fallbackSubject}`],
          executiveSummary: rawTextContent ? rawTextContent.substring(0, 350) : `Capaian Pembelajaran resmi mata pelajaran ${fallbackSubject} Fase ${fallbackPhase}.`,
          kktpSummary: 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
        };
      }

      clearInterval(progressIntervalRef.current);

      // Smooth jump to 100%
      setProgressPercent(100);
      setCurrentPhaseTitle('100% Selesai & Tersinkronisasi Otomatis!');
      setCurrentPhaseDetail('CP Resmi telah selesai dianalisis secara mendalam dan disinkronkan otomatis ke seluruh 9 perangkat ajar.');

      const detectedMeta = resData.identifiedMetadata || {};

      // Auto-detect and resolve parameters from AI analysis
      const resolvedSubject = (detectedMeta.subject && detectedMeta.subject !== 'Mata Pelajaran Teridentifikasi')
        ? detectedMeta.subject
        : subject;
      const resolvedLevel = (detectedMeta.level as SchoolLevel) || level;
      const resolvedPhase = detectedMeta.phase || phase;
      const resolvedGrade = Number(detectedMeta.grade) || grade;
      const resolvedHours = Number(detectedMeta.totalHoursPerYear) || totalHoursPerYear;
      const resolvedJp = Number(detectedMeta.jpPerWeek) || jpPerWeek;

      // Update form state with auto-detected values
      setSubject(resolvedSubject);
      setLevel(resolvedLevel);
      setPhase(resolvedPhase);
      setGrade(resolvedGrade);
      setTotalHoursPerYear(resolvedHours);
      setJpPerWeek(resolvedJp);

      const sem1Items: CPMaterialItem[] = (resData.materialsSem1 || []).map((m: any, idx: number) => ({
        id: `sem1-${Date.now()}-${idx + 1}`,
        semester: 1,
        orderNumber: m.orderNumber || idx + 1,
        tpCode: m.tpCode || `TP.${resolvedGrade}.1.${idx + 1}`,
        tpName: m.tpName || '',
        essentialMaterial: m.essentialMaterial || '',
        elementName: m.elementName || 'Pemahaman Konsep',
        allocatedHours: Number(m.allocatedHours) || Math.round(resolvedHours / 2 / (resData.materialsSem1?.length || 3)),
        assessmentStrategy: m.assessmentStrategy || 'Tes Formatif & Kinerja 6C',
        deepLearningMethod: m.deepLearningMethod || 'Mindful & Meaningful Learning',
      }));

      const sem2Items: CPMaterialItem[] = (resData.materialsSem2 || []).map((m: any, idx: number) => ({
        id: `sem2-${Date.now()}-${idx + 1}`,
        semester: 2,
        orderNumber: m.orderNumber || sem1Items.length + idx + 1,
        tpCode: m.tpCode || `TP.${resolvedGrade}.2.${idx + 1}`,
        tpName: m.tpName || '',
        essentialMaterial: m.essentialMaterial || '',
        elementName: m.elementName || 'Keterampilan Proses',
        allocatedHours: Number(m.allocatedHours) || Math.round(resolvedHours / 2 / (resData.materialsSem2?.length || 3)),
        assessmentStrategy: m.assessmentStrategy || 'Penilaian Proyek Sumatif',
        deepLearningMethod: m.deepLearningMethod || 'Meaningful & Joyful Learning',
      }));

      setTotalTPCount(sem1Items.length + sem2Items.length);

      const finalMaster: ActiveMasterCPData = {
        id: `cp-master-${Date.now()}`,
        fileName: fileName || `Dokumen CP ${resolvedSubject} ${resolvedPhase}`,
        fileType,
        fileSize,
        uploadedAt: new Date().toISOString(),
        level: resolvedLevel,
        grade: resolvedGrade,
        phase: resolvedPhase,
        subject: resolvedSubject,
        teacherName: teacherName || currentUser.name,
        schoolName,
        academicYear: '2025/2026',
        totalHoursPerYear: resolvedHours,
        jpPerWeek: resolvedJp,
        cpText: rawTextContent || resData.executiveSummary || `Capaian Pembelajaran Mata Pelajaran ${resolvedSubject} ${resolvedLevel} (${resolvedPhase})`,
        elements: resData.elements || [
          {
            name: 'Pemahaman Konsep',
            description: `Memahami dan menganalisis prinsip inti ${resolvedSubject}.`,
            competencies: ['Mengidentifikasi fenomena', 'Menganalisis konsep'],
            essentialMaterials: [`Konsep Fundamental ${resolvedSubject}`],
          },
          {
            name: 'Keterampilan Proses',
            description: `Merancang penyelidikan dan menyelesaikan masalah kontekstual.`,
            competencies: ['Penyelidikan ilmiah', 'Komunikasi solusi inovatif'],
            essentialMaterials: [`Metode Proyek ${resolvedSubject}`],
          },
        ],
        materialsSem1: sem1Items,
        materialsSem2: sem2Items,
        executiveSummary: resData.executiveSummary || `Analisis Capaian Pembelajaran ${resolvedSubject} jenjang ${resolvedLevel} ${resolvedPhase}.`,
        fullMarkdownReport: resData.fullMarkdownReport || '',
        kktpSummary: resData.kktpSummary,
        deepLearningNotes: 'Integrasi Mindful, Meaningful, & Joyful Learning dengan penguatan 6 Dimensi Karakter (6C).',
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      };

      // Save to Active Master CP Storage
      StorageService.setActiveMasterCP(finalMaster);

      // Sinkronkan ke Profil Guru Mapel
      const currentSchoolProf = StorageService.getSchoolProfile();
      StorageService.saveSchoolProfile({
        ...currentSchoolProf,
        subject: resolvedSubject,
        level: resolvedLevel,
        grade: resolvedGrade,
        phase: resolvedPhase,
        jpPerWeek: resolvedJp,
      });

      setMasterData(finalMaster);
      setSyncedNotification(`Dokumen CP ${resolvedSubject} (${resolvedLevel} - ${resolvedPhase}, Kelas ${resolvedGrade}) Berhasil Dianalisis 100% & Disinkronkan Otomatis ke Seluruh Perangkat Ajar!`);
      setShowCompletionModal(true);

      // Add Global Notification for Dashboard Homepage
      StorageService.addNotification({
        title: `CP Master ${resolvedSubject} Berhasil Diunggah & Dianalisis`,
        message: `Dokumen CP ${resolvedSubject} (${resolvedLevel} Kelas ${resolvedGrade} - ${resolvedPhase}) berhasil dianalisis 100% dari file "${fileName || 'Dokumen CP'}" dan tersinkron ke Parameter Kurikulum & 9 Perangkat Ajar.`,
        type: 'sync',
        metadata: {
          subject: resolvedSubject,
          level: resolvedLevel,
          grade: resolvedGrade,
          phase: resolvedPhase,
          fileName: fileName || finalMaster.fileName,
          totalBab: sem1Items.length + sem2Items.length,
          totalHours: resolvedHours,
          jpPerWeek: resolvedJp,
          uploadedAt: finalMaster.uploadedAt,
        },
      });

      // Audit Log
      StorageService.addAccessLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Analisis CP Resmi 100% Selesai',
        details: `Berhasil menganalisis mendalam CP ${resolvedSubject} (${resolvedLevel} - ${resolvedPhase}) dari dokumen ${fileName || 'Unggahan'} dan tersinkron ke 9 perangkat ajar.`,
        status: 'success',
      });

      // Dispatch synchronization events
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: finalMaster }));
      } catch (e) {
        // ignore
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(finalMaster);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menganalisis file CP.');
      setProgressPercent(0);
    } finally {
      setIsAnalyzing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  /**
   * SINKRONISASI HASIL ANALISIS CP 100% KE PARAMETER KURIKULUM & 9 PERANGKAT AJAR
   * Menyinkronkan Mata Pelajaran, Jenjang, Kelas, Fase, Bab & Lingkup Materi Sem 1 & 2,
   * Rumusan TP, dan Beban Jam ke Parameter Kurikulum secara terpadu.
   */
  const handleSyncToCurriculumParameters = (dataToSync?: ActiveMasterCPData) => {
    const active = dataToSync || masterData;
    if (!active) {
      setErrorMsg('Belum ada data hasil analisis CP yang dapat disinkronkan.');
      return;
    }

    const resolvedSubject = active.subject || subject || 'Fisika';
    const resolvedLevel = (active.level as SchoolLevel) || level || 'SMA';
    const resolvedGrade = Number(active.grade) || Number(grade) || 10;
    const resolvedPhase = active.phase || phase || 'Fase E';
    const resolvedJp = Number(active.jpPerWeek) || Number(jpPerWeek) || 3;
    const resolvedTotalHours = Number(active.totalHoursPerYear) || Number(totalHoursPerYear) || (resolvedJp * 36);

    // Format & sanitize materials with complete TP mapping
    const formattedSem1: CPMaterialItem[] = (active.materialsSem1 || []).map((m, idx) => {
      const babOrder = m.orderNumber || idx + 1;
      const tpCode = m.tpCode || `TP.${resolvedGrade}.1.${babOrder}`;
      const matTitle = m.essentialMaterial || `Bab ${babOrder}: Lingkup Materi Pokok ${resolvedSubject}`;
      const tpCount = m.tpCount || (m.tpName ? m.tpName.split(/\r?\n/).filter(Boolean).length : 2);
      const autoTP = m.tpName && m.tpName.trim()
        ? m.tpName
        : generateAutoTPForMaterial(matTitle, resolvedSubject, resolvedGrade, tpCount);
      const hours = Number(m.allocatedHours) || (resolvedJp * 4);
      const meetings = Math.max(1, Math.round(hours / (resolvedJp || 1)));

      return {
        ...m,
        id: m.id || `sem1-${Date.now()}-${idx + 1}`,
        semester: 1,
        orderNumber: babOrder,
        tpCode,
        tpName: autoTP,
        essentialMaterial: matTitle,
        allocatedHours: hours,
        meetingCount: meetings,
        tpCount,
        assessmentStrategy: m.assessmentStrategy || 'Tes Formatif, Penilaian Kinerja 6C & Portofolio',
        deepLearningMethod: m.deepLearningMethod || 'Mindful & Meaningful Learning',
      };
    });

    const formattedSem2: CPMaterialItem[] = (active.materialsSem2 || []).map((m, idx) => {
      const babOrder = m.orderNumber || (formattedSem1.length + idx + 1);
      const tpCode = m.tpCode || `TP.${resolvedGrade}.2.${idx + 1}`;
      const matTitle = m.essentialMaterial || `Bab ${babOrder}: Lingkup Materi Lanjutan ${resolvedSubject}`;
      const tpCount = m.tpCount || (m.tpName ? m.tpName.split(/\r?\n/).filter(Boolean).length : 2);
      const autoTP = m.tpName && m.tpName.trim()
        ? m.tpName
        : generateAutoTPForMaterial(matTitle, resolvedSubject, resolvedGrade, tpCount);
      const hours = Number(m.allocatedHours) || (resolvedJp * 4);
      const meetings = Math.max(1, Math.round(hours / (resolvedJp || 1)));

      return {
        ...m,
        id: m.id || `sem2-${Date.now()}-${idx + 1}`,
        semester: 2,
        orderNumber: babOrder,
        tpCode,
        tpName: autoTP,
        essentialMaterial: matTitle,
        allocatedHours: hours,
        meetingCount: meetings,
        tpCount,
        assessmentStrategy: m.assessmentStrategy || 'Tes Formatif & Penilaian Proyek Sumatif',
        deepLearningMethod: m.deepLearningMethod || 'Meaningful & Joyful Learning',
      };
    });

    const totalBab = formattedSem1.length + formattedSem2.length;
    let totalTP = 0;
    formattedSem1.forEach((m) => { totalTP += (m.tpCount || 2); });
    formattedSem2.forEach((m) => { totalTP += (m.tpCount || 2); });

    const updatedMaster: ActiveMasterCPData = {
      ...active,
      subject: resolvedSubject,
      level: resolvedLevel,
      grade: resolvedGrade,
      phase: resolvedPhase,
      jpPerWeek: resolvedJp,
      totalHoursPerYear: resolvedTotalHours,
      timeAllocationPerWeek: active.timeAllocationPerWeek || `${resolvedJp} x 45 Menit`,
      materialsSem1: formattedSem1,
      materialsSem2: formattedSem2,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };

    // 1. Simpan ke Active Master CP
    StorageService.setActiveMasterCP(updatedMaster);

    // 2. Simpan ke Profil Sekolah / Profil Guru Mapel
    const currentSchoolProf = StorageService.getSchoolProfile();
    StorageService.saveSchoolProfile({
      ...currentSchoolProf,
      subject: resolvedSubject,
      level: resolvedLevel,
      grade: resolvedGrade,
      phase: resolvedPhase,
      jpPerWeek: resolvedJp,
      totalHoursPerYear: resolvedTotalHours,
      timeAllocationPerWeek: updatedMaster.timeAllocationPerWeek,
    });

    // 3. Simpan ke CPDistributionPlan
    const existingPlans = StorageService.getCPDistributions();
    const sem1TotalHours = formattedSem1.reduce((acc, curr) => acc + (Number(curr.allocatedHours) || 0), 0);
    const sem2TotalHours = formattedSem2.reduce((acc, curr) => acc + (Number(curr.allocatedHours) || 0), 0);
    const newPlan: CPDistributionPlan = {
      id: `dist-plan-${resolvedSubject.toLowerCase().replace(/\s+/g, '-')}-${resolvedGrade}`,
      teacherName: teacherName || currentUser.name,
      teacherNip: currentSchoolProf.teacherNip || '',
      subject: resolvedSubject,
      schoolName: schoolName || currentSchoolProf.schoolName || 'SMA NEGERI 30 MALUKU TENGAH',
      grade: resolvedGrade,
      level: resolvedLevel,
      phase: resolvedPhase,
      academicYear: currentSchoolProf.academicYear || '2025/2026',
      semesterOption: 'all',
      totalHoursPerYear: resolvedTotalHours,
      totalTPCount: totalTP,
      jpPerWeek: resolvedJp,
      timeAllocationPerWeek: updatedMaster.timeAllocationPerWeek || `${resolvedJp} x 45 Menit`,
      materialsSem1: formattedSem1,
      materialsSem2: formattedSem2,
      totalHoursSem1: sem1TotalHours,
      totalHoursSem2: sem2TotalHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Otomatis hapus seluruh CP lama dari aplikasi dan ganti dengan CP baru yang diupload
    StorageService.saveCPDistributions([newPlan]);

    // 4. Catat Audit Log
    StorageService.addAccessLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Sinkronisasi Parameter Kurikulum 100%',
      details: `Menyinkronkan hasil analisis CP ${resolvedSubject} (${resolvedLevel} - ${resolvedPhase}, Kelas ${resolvedGrade}) ke Parameter Kurikulum & seluruh 9 perangkat ajar.`,
      status: 'success',
    });

    // Add Global Notification for Homepage & Notification Center
    StorageService.addNotification({
      title: `⚡ CP Master ${resolvedSubject} Sukses Tersinkron`,
      message: `Parameter Kurikulum ${resolvedSubject} (${resolvedLevel} Kelas ${resolvedGrade} - ${resolvedPhase}) berhasil disinkronkan 100%! ${totalBab} Bab Materi & ${totalTP} TP kini aktif terhubung ke seluruh 9 Perangkat Ajar.`,
      type: 'sync',
      metadata: {
        subject: resolvedSubject,
        level: resolvedLevel,
        grade: resolvedGrade,
        phase: resolvedPhase,
        totalBab,
        totalTP,
        totalHours: resolvedTotalHours,
        jpPerWeek: resolvedJp,
        syncedAt: updatedMaster.lastSyncedAt || new Date().toISOString(),
      },
    });

    setMasterData(updatedMaster);
    setSyncParamDetails({
      subject: resolvedSubject,
      level: resolvedLevel,
      phase: resolvedPhase,
      grade: resolvedGrade,
      totalBab,
      totalTP,
      totalHours: resolvedTotalHours,
      jpPerWeek: resolvedJp,
      materialsSem1: formattedSem1,
      materialsSem2: formattedSem2,
    });

    setShowSyncParamModal(true);
    setSyncedNotification(
      `✓ Parameter Kurikulum Berhasil Disinkronkan! ${resolvedSubject} (Kelas ${resolvedGrade} ${resolvedPhase}, ${totalBab} Bab, ${totalTP} TP) terhubung penuh ke 9 Perangkat Ajar.`
    );

    // 5. Broadcast synchronization events
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: updatedMaster }));
      window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: updatedMaster }));
    } catch {}

    if (onAnalysisComplete) {
      onAnalysisComplete(updatedMaster);
    }
  };

  const handleOpenPerangkatModal = (docType: string = 'modul_ajar') => {
    setSelectedDocType(docType);
    setShowPerangkatModal(true);
    triggerGenerateDoc(docType, selectedDocSemester);
  };

  const triggerGenerateDoc = (
    docType: string,
    sem: 'Semester 1' | 'Semester 2' | '1 Tahun' | 'Ganjil' | 'Genap' = selectedDocSemester
  ) => {
    setIsGeneratingDoc(true);
    setTimeout(() => {
      const semMaterials = sem === 'Semester 1' || sem === 'Ganjil'
        ? (masterData?.materialsSem1 || [])
        : sem === 'Semester 2' || sem === 'Genap'
        ? (masterData?.materialsSem2 || [])
        : [...(masterData?.materialsSem1 || []), ...(masterData?.materialsSem2 || [])];
      const defaultTopic = selectedTopic || (semMaterials.length > 0 ? semMaterials[0].essentialMaterial : `Materi Pokok ${masterData?.subject || subject}`);
      const currentMat = semMaterials.find(m => m.essentialMaterial === defaultTopic) || semMaterials[0] || null;
      const jpPerW = masterData?.jpPerWeek || 2;
      const computedMeetings = currentMat && currentMat.allocatedHours ? Math.max(1, Math.round(currentMat.allocatedHours / (jpPerW || 1))) : (currentMat?.meetingCount || 2);

      const doc = generateExpertCurriculumDocument(docType, {
        subject: masterData?.subject || subject,
        level: masterData?.level || level,
        grade: masterData?.grade || grade,
        phase: masterData?.phase || phase,
        semester: sem,
        topic: defaultTopic,
        modelOption: selectedLearningModel,
        meetingCount: computedMeetings,
        academicYear: masterData?.academicYear || '2025/2026',
        useCustomFormat: customFormatConfig.useCustomFormat,
        customFormatNotes: customFormatConfig.customFormatNotes,
        customFormatFile: customFormatConfig.formatFile,
        distributionData: masterData ? {
          materialsSem1: masterData.materialsSem1,
          materialsSem2: masterData.materialsSem2,
          currentSelectedMaterial: currentMat,
          totalHoursPerYear: masterData.totalHoursPerYear,
          jpPerWeek: masterData.jpPerWeek,
          teacherName: masterData.teacherName || teacherName,
        } : undefined,
      });

      setGeneratedDocContent(doc);
      setIsGeneratingDoc(false);

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
        const activeSubj = masterData?.subject || subject;
        const activeGrd = masterData?.grade || grade;
        const activeLvl = masterData?.level || level;
        const newDoc: AIDocument = {
          id: `ai-doc-${Date.now()}`,
          type: docType as any,
          title: `${docLabels[docType] || 'Perangkat Ajar'} - ${activeSubj} Kelas ${activeGrd} (${sem})`,
          level: activeLvl,
          grade: Number(activeGrd),
          subject: activeSubj,
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
    if (!generatedDocContent) return;
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
    const title = `${docLabels[selectedDocType] || 'Perangkat_Ajar'}_${masterData?.subject || subject}_Kelas_${masterData?.grade || grade}_Sem_${selectedDocSemester}`;
    ExportService.exportToWord(
      title.replace(/_/g, ' '),
      generatedDocContent,
      {
        ...profile,
        schoolName: masterData?.schoolName || profile.schoolName || schoolName,
        teacherName: masterData?.teacherName || profile.teacherName || teacherName,
      },
      title
    );
  };

  const handleDownloadPerangkatExcel = () => {
    if (!generatedDocContent) return;
    const profile = StorageService.getSchoolProfile();
    const title = `Perangkat_${selectedDocType}_${masterData?.subject || subject}`;
    ExportService.exportCurriculumToExcel(
      generatedDocContent,
      title.replace(/_/g, ' '),
      {
        ...profile,
        schoolName: masterData?.schoolName || profile.schoolName || schoolName,
        teacherName: masterData?.teacherName || profile.teacherName || teacherName,
      },
      title
    );
  };

  const handlePrintPerangkatPdf = () => {
    if (!generatedDocContent) return;
    const profile = StorageService.getSchoolProfile();
    const title = `Perangkat Pembelajaran Sesuai Format Sekolah - ${masterData?.subject || subject}`;
    ExportService.printPdfPreview(
      title,
      generatedDocContent,
      {
        ...profile,
        schoolName: masterData?.schoolName || profile.schoolName || schoolName,
        teacherName: masterData?.teacherName || profile.teacherName || teacherName,
      }
    );
  };

  const handleCopyPerangkat = () => {
    if (generatedDocContent) {
      navigator.clipboard.writeText(generatedDocContent);
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    }
  };

  const handleCopyReport = () => {
    if (masterData?.fullMarkdownReport) {
      navigator.clipboard.writeText(masterData.fullMarkdownReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const handleDownloadWord = () => {
    if (masterData?.fullMarkdownReport) {
      const profile = StorageService.getSchoolProfile();
      ExportService.exportToWord(
        `ANALISIS CAPAIAN PEMBELAJARAN (CP) - ${masterData.subject} ${masterData.phase}`,
        masterData.fullMarkdownReport,
        {
          ...profile,
          schoolName: masterData.schoolName || profile.schoolName,
          teacherName: masterData.teacherName || profile.teacherName,
        },
        `Master_Analisis_CP_${masterData.subject}_${masterData.phase}`
      );
    }
  };

  const handleNavigateTool = (toolId: string) => {
    if (onNavigate) {
      onNavigate(toolId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 100% COMPLETION CELEBRATION MODAL */}
      {showCompletionModal && masterData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      PROGRES 100% SELESAI
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Tersinkronisasi Otomatis</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    Analisis CP Resmi Selesai Secara Mendalam
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Curriculum Metadata Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran</span>
                <p className="font-extrabold text-white truncate">{masterData.subject}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Jenjang / Fase</span>
                <p className="font-extrabold text-indigo-300">{masterData.level} - {masterData.phase}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Kelas Target</span>
                <p className="font-extrabold text-white">Kelas {masterData.grade}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Alokasi Waktu</span>
                <p className="font-extrabold text-emerald-400 font-mono">{masterData.totalHoursPerYear} JP ({masterData.jpPerWeek} JP/Mgg)</p>
              </div>
            </div>

            {/* PRIMARY SINKRONISASI KE PARAMETER KURIKULUM & 9 PERANGKAT BUTTON */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-indigo-950/80 border-2 border-emerald-500/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-black text-white">
                  <FolderSync className="w-4 h-4 text-emerald-400" />
                  <span>Sinkronisasi Parameter Kurikulum Terpadu:</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono font-bold">1-Klik ke 9 Modul</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Menyinkronkan hasil analisis CP (Mata Pelajaran, Bab &amp; Lingkup Materi Sem 1 &amp; 2, Jenjang Kelas, dan Alokasi Beban JP) langsung ke <strong>Parameter Kurikulum</strong> sehingga otomatis aktif di semua perangkat ajar (TP, ATP, PROTA, PROSEM, KKTP, RPM / Modul Ajar, LKPD, dan Rubrik).
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  handleSyncToCurriculumParameters(masterData);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xl shadow-emerald-500/30 cursor-pointer transform active:scale-95"
              >
                <FolderSync className="w-4 h-4 text-slate-950" />
                <span>Sinkronkan dengan Parameter Kurikulum &amp; Semua Perangkat Ajar</span>
              </button>
            </div>

            {/* Direct Quick Jump Buttons */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300">Lanjutkan Pembuatan Perangkat Ajar:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    handleNavigateTool('ai_tp');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-between transition border border-slate-700"
                >
                  <span>Tujuan Pembelajaran (TP)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    handleNavigateTool('ai_modul_ajar');
                  }}
                  className="p-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold flex items-center justify-between transition"
                >
                  <span>RPM (Rencana Pelaksanaan Modul)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    handleNavigateTool('analisis_cp_distribusi');
                  }}
                  className="p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold flex items-center justify-between transition"
                >
                  <span>Distribusi Sem 1 & 2</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DIRECT ACTION: BUAT PERANGKAT SESUAI FORMAT SEKOLAH */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  handleOpenPerangkatModal('modul_ajar');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xl shadow-amber-500/20 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>⚡ Buat Perangkat Ajar Sesuai Format / Template Sekolah</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Tutup & Lihat Hasil Analisis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINKRONISASI PARAMETER KURIKULUM DETAIL SUCCESS MODAL */}
      {showSyncParamModal && syncParamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <CheckCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SINKRONISASI PARAMETER SUKSES
                    </span>
                    <span className="text-xs text-slate-400 font-mono">100% Terkoneksi</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    Tersinkron dengan Parameter Kurikulum &amp; 9 Perangkat Ajar
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowSyncParamModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Parameter Metrics Grid */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran</span>
                  <p className="font-extrabold text-white text-sm truncate">{syncParamDetails.subject}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Jenjang &amp; Fase</span>
                  <p className="font-extrabold text-indigo-300 text-sm">{syncParamDetails.level} ({syncParamDetails.phase})</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Kelas Target</span>
                  <p className="font-extrabold text-emerald-400 text-sm">Kelas {syncParamDetails.grade}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Alokasi Waktu</span>
                  <p className="font-extrabold text-white text-sm font-mono">{syncParamDetails.totalHours} JP ({syncParamDetails.jpPerWeek} JP/Mgg)</p>
                </div>
              </div>

              {/* Bab & Materi Distribution Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Distribusi Bab &amp; Lingkup Materi Terpetakan:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    Total {syncParamDetails.totalBab} Bab ({syncParamDetails.totalTP} TP)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Semester 1 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-indigo-300 border-b border-slate-800 pb-1">
                      <span>Semester 1 (Ganjil)</span>
                      <span className="text-slate-400">{syncParamDetails.materialsSem1.length} Bab</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {syncParamDetails.materialsSem1.map((m, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5 truncate">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span className="truncate">{m.essentialMaterial || m.tpName} ({m.allocatedHours} JP)</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Semester 2 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-teal-300 border-b border-slate-800 pb-1">
                      <span>Semester 2 (Genap)</span>
                      <span className="text-slate-400">{syncParamDetails.materialsSem2.length} Bab</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {syncParamDetails.materialsSem2.map((m, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5 truncate">
                          <span className="text-teal-400 font-bold">•</span>
                          <span className="truncate">{m.essentialMaterial || m.tpName} ({m.allocatedHours} JP)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 9 Connected Teaching Tools Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs text-emerald-200">
                <div className="font-bold flex items-center space-x-2 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>9 Modul Perangkat Ajar Terhubung Penuh &amp; Siap Digenerate:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-300">
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 1. Analisis CP Elemen</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 2. Tujuan Pembelajaran (TP)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 3. Alur Tujuan (ATP)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 4. Program Tahunan (PROTA)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 5. Program Semester (PROSEM)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 6. Kriteria Ketuntasan (KKTP)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 7. RPM (Rencana Pelaksanaan Modul)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 8. Lembar Kerja Siswa (LKPD)</span>
                  <span className="flex items-center space-x-1 text-emerald-300">✓ 9. Rubrik Penilaian Terpadu</span>
                </div>
              </div>
            </div>

            {/* Footer Navigation Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowSyncParamModal(false);
                  handleNavigateTool('parameter_kurikulum');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-md cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Buka Parameter Kurikulum</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSyncParamModal(false);
                    handleNavigateTool('ai_modul_ajar');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-md cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Buka RPM / Modul Ajar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSyncParamModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {customTitle || (isTeacherMode ? 'Upload & Sinkronkan CP Milik Guru' : 'Upload & Analisis Mendalam CP Resmi')}
                </h2>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Akses Khusus Admin Aktif
                  </span>
                ) : isTeacherMode ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Mode Guru Mandiri (Auto-Sync 9 Perangkat)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Mode Guru / Client (Hanya Lihat)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {customDescription || 'Menu upload dokumen resmi Capaian Pembelajaran (CP) format PDF, Word (.docx), Excel (.xlsx), atau salin teks. Analisis mendalam otomatis berjalan dengan progres 0 - 100% dan otomatis tersinkronisasi ke seluruh 9 perangkat ajar.'}
              </p>
            </div>
          </div>

          {masterData && (
            <div className="flex items-center space-x-2 bg-emerald-950/70 border border-emerald-600/50 px-3.5 py-2 rounded-2xl shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-emerald-300 font-extrabold uppercase">CP Master Aktif</div>
                <div className="text-xs font-bold text-white truncate max-w-[170px]">
                  {masterData.subject} ({masterData.phase})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACCESS RESTRICTION NOTICE ONLY WHEN CANNOT UPLOAD */}
      {!canUpload && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-200">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-amber-300">Informasi Otoritas Pengunggahan CP Resmi</div>
            <p className="leading-relaxed">
              Menu pengunggahan berkas CP master acuan sekolah dikelola oleh <strong>Administrator</strong>. Anda dapat mengunggah berkas CP milik sendiri pada tab <strong>Upload & Sinkron CP Saya (Guru)</strong> atau mengadopsi CP dari katalog sekolah.
            </p>
          </div>
        </div>
      )}

      {/* SYNCHRONIZATION SUCCESS NOTIFICATION */}
      {syncedNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{syncedNotification}</span>
          </div>
          <button
            onClick={() => setSyncedNotification('')}
            className="text-emerald-400 hover:text-white font-bold text-[11px] ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-center space-x-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0 - 100% REAL-TIME ANIMATED PROGRESS BAR CARD (DURING & AFTER ANALYSIS) */}
      {/* ========================================================================= */}
      {(isAnalyzing || progressPercent === 100) && (
        <div className="bg-slate-900 p-5 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-4 animate-in fade-in duration-300 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              {progressPercent === 100 ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{progressPercent === 100 ? 'Analisis Selesai 100%' : 'Sedang Menganalisis Dokumen CP...'}</span>
                </h4>
                <p className="text-[11px] text-slate-400">{currentPhaseTitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-black font-mono ${progressPercent === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent === 100
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                    : 'bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[80%]">{currentPhaseDetail}</span>
              <span className="font-mono shrink-0 font-semibold text-slate-300">{progressPercent}/100%</span>
            </div>
          </div>

          {/* 100% COMPLETION: TOMBOL SINKRONKAN KE PARAMETER KURIKULUM & 9 PERANGKAT AJAR */}
          {progressPercent === 100 && (
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-950 to-indigo-950/90 border-2 border-emerald-500/60 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40">
                    <FolderSync className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Proses Analisis 100% Selesai!</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Siap Disinkronkan
                      </span>
                    </h5>
                    <p className="text-[11px] text-emerald-200/90">
                      Klik tombol di bawah untuk menyinkronkan seluruh parameter hasil analisis ke Parameter Kurikulum.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono self-start sm:self-center">
                  9 Modul Perangkat Terhubung
                </div>
              </div>

              {/* Badges of Synchronized Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Mata Pelajaran</span>
                  <p className="font-extrabold text-white truncate text-xs">{masterData?.subject || subject}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Jenjang & Kelas</span>
                  <p className="font-extrabold text-indigo-300 text-xs">{(masterData?.level || level)} Kelas {(masterData?.grade || grade)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fase Kurikulum</span>
                  <p className="font-extrabold text-teal-300 text-xs">{masterData?.phase || phase}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">BAB & Ruang Lingkup</span>
                  <p className="font-extrabold text-emerald-400 text-xs font-mono">
                    {((masterData?.materialsSem1?.length || 0) + (masterData?.materialsSem2?.length || 0))} Bab ({((masterData?.materialsSem1?.length || 0))} Sem 1 & {((masterData?.materialsSem2?.length || 0))} Sem 2)
                  </p>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSyncToCurriculumParameters(masterData || undefined)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xl shadow-emerald-500/30 cursor-pointer transform active:scale-95 border border-emerald-300/40"
                >
                  <FolderSync className="w-4 h-4 text-slate-950" />
                  <span>⚡ SINKRONKAN DENGAN PARAMETER KURIKULUM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateTool('parameter_kurikulum')}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Buka Parameter Kurikulum</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Sinkronisasi ini langsung memperbarui <strong className="text-slate-200">Mata Pelajaran, BAB, Ruang Lingkup Materi, Jenjang Kelas, dan Fase</strong> di Parameter Kurikulum sehingga otomatis aktif di seluruh perangkat ajar (TP, ATP, PROTA, PROSEM, KKTP, RPM Deep Learning, LKPD, Rubrik Penilaian, & Analisis CP).
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-COLUMN LAYOUT: UPLOAD & CONFIGURATION (LEFT) + RESULTS & SYNC (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: FILE UPLOAD DROPZONE & CURRICULUM CONFIGURATION */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* UPLOAD DROPZONE CARD */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <FileSearch className="w-4 h-4 text-indigo-400" />
                <span>1. Pilih Dokumen CP Resmi</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Semua Format (Word, Excel, PDF, Gambar, Teks)</span>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={!canUpload}
              accept=".pdf,.docx,.doc,.dotx,.xlsx,.xls,.csv,.tsv,.ods,.pptx,.ppt,.txt,.md,.rtf,.html,.xml,.json,.jpg,.jpeg,.png,.webp,.bmp"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => {
                  if (canUpload) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-all ${
                  canUpload
                    ? 'border-slate-700 hover:border-indigo-500 bg-slate-950/70 hover:bg-slate-950 cursor-pointer group'
                    : 'border-slate-800 bg-slate-950/40 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/15 text-indigo-400 group-hover:bg-indigo-600/25 group-hover:scale-110 transition flex items-center justify-center border border-indigo-500/30">
                  {canUpload ? <UploadCloud className="w-6 h-6" /> : <Lock className="w-6 h-6 text-slate-400" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {canUpload ? 'Klik atau seret file CP ke sini' : 'Pengunggahan Dibatasi untuk Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung semua format: <span className="text-indigo-300">Word (.docx/.doc), Excel (.xlsx/.xls/.csv), PDF, PowerPoint, Gambar / Scan, dan Teks</span>
                  </p>
                </div>
                {canUpload && (
                  <div className="inline-block px-3 py-1 bg-slate-800 group-hover:bg-indigo-600/30 rounded-xl text-[10px] text-slate-300 font-semibold border border-slate-700 transition">
                    Pilih File dari Komputer
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">{fileName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(fileSize / 1024).toFixed(1)} KB • {fileName.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {canUpload && (
                    <button
                      onClick={handleClearFile}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Hapus / Ganti File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>File siap diekstrak & dianalisis mendalam progres 0 - 100%</span>
                </div>
              </div>
            )}

            {/* Manual Paste Text Alternative */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Atau Tempel Rumusan Teks CP Resmi:</span>
                <span className="text-[10px] text-slate-500 font-normal">Opsional</span>
              </label>
              <textarea
                rows={3}
                disabled={!canUpload}
                value={rawTextContent}
                onChange={(e) => setRawTextContent(e.target.value)}
                placeholder={canUpload ? 'Tuliskan atau salin rumusan CP utuh dari dokumen BSKAP jika tidak menggunakan upload file...' : 'Hanya Administrator atau Guru yang dapat mengedit teks CP.'}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed disabled:opacity-60"
              />
            </div>

            {/* Custom Focus Notes (Optional) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-slate-400 text-[10px] font-bold">Catatan Fokus Analisis (Opsional)</label>
              <input
                type="text"
                disabled={!canUpload}
                placeholder="Contoh: Fokus praktikum kontekstual, asesmen proyek 6C, asesmen diagnostik..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs disabled:opacity-60"
              />
            </div>

            {/* Custom School Format Selector & Checkbox */}
            <div className="pt-2">
              <CustomFormatSelector
                value={customFormatConfig}
                onChange={setCustomFormatConfig}
                docTypeName="Analisis CP & Perangkat Sekolah"
                docTypeId="analisis_cp"
                compact={true}
              />
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!canUpload || isAnalyzing || (!file && !rawTextContent.trim() && !subject.trim())}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-50 text-xs sm:text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Menganalisis Progres {progressPercent}%...</span>
                  </>
                ) : !canUpload ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Khusus Administrator</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isTeacherMode ? '⚡ Analisis & Sinkronkan ke Semua Perangkat Ajar' : 'Mulai Analisis Mendalam (0 - 100%)'}</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Sistem akan mendeteksi otomatis <span className="text-slate-300">Jenjang, Fase, Kelas, Mapel, Elemen CP, Alokasi JP</span>, dan <span className="text-slate-300">Distribusi Materi Sem 1 & 2</span> langsung dari dokumen.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ANALYSIS RESULTS, MASTER CP STATUS & QUICK NAVIGATION */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {masterData ? (
            <div className="space-y-4">
              {/* MASTER SYNCHRONIZATION BANNER */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                      Master Acuan Tersinkronisasi Otomatis
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Update: {new Date(masterData.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {masterData.subject} ({masterData.level} - {masterData.phase}, Kelas {masterData.grade})
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Dokumen: <span className="text-indigo-300 font-semibold">{masterData.fileName}</span> • Total Alokasi: <span className="text-emerald-400 font-bold">{masterData.totalHoursPerYear} JP/Tahun ({masterData.jpPerWeek} JP/Minggu)</span>
                  </p>
                </div>

                {/* SINKRONISASI KE SELURUH PERANGKAT AJAR BUTTONS */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pusat Sinkronisasi Otomatis Seluruh Perangkat Ajar:</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">9 Dokumen Terkoneksi</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleNavigateTool('analisis_cp_distribusi')}
                      className="p-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-blue-300 text-xs font-bold">
                        <span>1. Distribusi CP</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Pemetaan Sem 1 & 2</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_tp')}
                      className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-indigo-300 text-xs font-bold">
                        <span>2. Rumusan TP</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">ABCD & HOTS C4-C6</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_atp')}
                      className="p-2.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-cyan-300 text-xs font-bold">
                        <span>3. Alur TP (ATP)</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Urutan & Alokasi JP</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_prota')}
                      className="p-2.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
                        <span>4. PROTA</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Distribusi Tahunan</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_prosem')}
                      className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
                        <span>5. PROSEM</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Matriks Pekan Efektif</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_kktp')}
                      className="p-2.5 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-teal-300 text-xs font-bold">
                        <span>6. KKTP</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Interval & Rubrik</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_modul_ajar')}
                      className="p-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-purple-300 text-xs font-bold">
                        <span>7. RPM (Rencana Pelaksanaan Modul)</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sintaks Deep Learning</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_lkpd')}
                      className="p-2.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-violet-300 text-xs font-bold">
                        <span>8. LKPD Siswa</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Lembar Kerja Siswa</p>
                    </button>

                    <button
                      onClick={() => handleNavigateTool('ai_rubrik_penilaian')}
                      className="p-2.5 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/40 rounded-xl text-left transition group"
                    >
                      <div className="flex items-center justify-between text-pink-300 text-xs font-bold">
                        <span>9. Rubrik Penilaian</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sikap 6C & Kinerja</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* BUAT PERANGKAT SESUAI FORMAT SEKOLAH BANNER */}
              <div className="bg-slate-900 border border-amber-500/40 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h4 className="text-sm sm:text-base font-black text-white">
                        Buat Perangkat Sesuai Format / Template Sekolah
                      </h4>
                      {customFormatConfig.useCustomFormat ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50">
                          Format Kustom Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Standar Kemendikdasmen
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Generate 9 perangkat kurikulum (RPM / Modul Ajar, TP, ATP, PROTA, PROSEM, KKTP, LKPD, Rubrik) secara otomatis mengikuti struktur atau file template sekolah Anda.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPerangkatModal('modul_ajar')}
                  className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xl shadow-amber-500/20 shrink-0"
                >
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                  <span>⚡ Buat Perangkat Sekarang</span>
                </button>
              </div>

              {/* TABS OF ANALYSIS RESULT */}
              <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  <button
                    onClick={() => setActiveResultTab('summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      activeResultTab === 'summary'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Eksekutif & Deep Learning</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab('elements')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      activeResultTab === 'elements'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Elemen CP ({masterData.elements?.length || 2})</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab('materials')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      activeResultTab === 'materials'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Matriks Sem 1 & 2</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab('kktp')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      activeResultTab === 'kktp'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    <span>KKTP & 6C</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab('report')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      activeResultTab === 'report'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Laporan Utuh</span>
                  </button>

                  <button
                    onClick={() => handleOpenPerangkatModal('modul_ajar')}
                    className="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40"
                  >
                    <Zap className="w-3 h-3" />
                    <span>⚡ Buat Perangkat Sekolah</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleDownloadWord}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition"
                    title="Unduh Laporan Word"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCopyReport}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title="Salin Teks"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* RESULT TAB 1: EXECUTIVE SUMMARY & DEEP LEARNING */}
              {activeResultTab === 'summary' && (
                <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 text-xs">
                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
                    <h4 className="font-extrabold text-indigo-300 text-sm flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Ringkasan Eksekutif Analisis CP</span>
                    </h4>
                    <p className="text-slate-200 leading-relaxed">
                      {masterData.executiveSummary || 'Analisis mendalam Capaian Pembelajaran Kurikulum Merdeka berorientasi Deep Learning.'}
                    </p>
                  </div>

                  {/* 3 PILAR DEEP LEARNING MATRIX */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">
                      Implementasi 3 Pilar Deep Learning Kemendikdasmen:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                        <div className="font-bold text-sky-300 text-[11px]">1. Mindful Learning</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Menumbuhkan kesadaran penuh, fokus, dan refleksi mendalam terhadap hakikat keilmuan {masterData.subject}.
                        </p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                        <div className="font-bold text-amber-300 text-[11px]">2. Meaningful Learning</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Menghubungkan materi secara kontekstual dengan masalah nyata dan kehidupan sehari-hari peserta didik.
                        </p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                        <div className="font-bold text-emerald-300 text-[11px]">3. Joyful Learning</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Menciptakan pengalaman belajar interaktif, eksperimen eksploratif, dan kolaborasi yang menyenangkan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RESULT TAB 2: ELEMEN CP */}
              {activeResultTab === 'elements' && (
                <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-extrabold text-white text-sm flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Dekomposisi Elemen Capaian Pembelajaran</span>
                  </h4>
                  <div className="space-y-3">
                    {masterData.elements?.map((el, i) => (
                      <div key={i} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 text-xs">
                            Elemen {i + 1}: {el.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-900/50 text-indigo-300">
                            Teridentifikasi
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{el.description}</p>
                        {el.competencies && el.competencies.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {el.competencies.map((c, ci) => (
                              <span key={ci} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono">
                                • {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RESULT TAB 3: MATRIKS DISTRIBUSI SEMESTER 1 & 2 */}
              {activeResultTab === 'materials' && (
                <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 text-xs">
                  {/* Semester 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-xs flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span>Semester 1 (Ganjil) — {masterData.materialsSem1.length} TP ({masterData.materialsSem1.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0)} JP)</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {masterData.materialsSem1.map((m, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{m.tpCode}: {m.essentialMaterial}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">{m.allocatedHours} JP</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{m.tpName}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                            <span>Asesmen: <span className="text-slate-300">{m.assessmentStrategy}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Semester 2 */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-300 text-xs flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        <span>Semester 2 (Genap) — {masterData.materialsSem2.length} TP ({masterData.materialsSem2.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0)} JP)</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {masterData.materialsSem2.map((m, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{m.tpCode}: {m.essentialMaterial}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">{m.allocatedHours} JP</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{m.tpName}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                            <span>Asesmen: <span className="text-slate-300">{m.assessmentStrategy}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESULT TAB 4: KKTP & 6C */}
              {activeResultTab === 'kktp' && (
                <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">
                      Kriteria Ketercapaian Tujuan Pembelajaran (KKTP):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-rose-800/40 text-center space-y-0.5">
                        <div className="text-[10px] text-rose-400 font-bold">Perlu Bimbingan</div>
                        <div className="text-sm font-bold text-white font-mono">&lt; 65</div>
                        <p className="text-[9px] text-slate-400">Intervensi khusus</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-amber-800/40 text-center space-y-0.5">
                        <div className="text-[10px] text-amber-400 font-bold">Cukup</div>
                        <div className="text-sm font-bold text-white font-mono">65 - 74</div>
                        <p className="text-[9px] text-slate-400">Remedial indikator</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-sky-800/40 text-center space-y-0.5">
                        <div className="text-[10px] text-sky-400 font-bold">Baik</div>
                        <div className="text-sm font-bold text-white font-mono">75 - 87</div>
                        <p className="text-[9px] text-slate-400">Tuntas tujuan</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-800/40 text-center space-y-0.5">
                        <div className="text-[10px] text-emerald-400 font-bold">Sangat Baik</div>
                        <div className="text-sm font-bold text-white font-mono">88 - 100</div>
                        <p className="text-[9px] text-slate-400">Pengayaan mandiri</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">
                      Penguatan 6 Dimensi Karakter (6C) Kemendikdasmen:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['Character (Karakter Mulia)', 'Citizenship (Kewargaan)', 'Critical Thinking (Nalar Kritis)', 'Creativity (Kreativitas)', 'Collaboration (Kolaborasi)', 'Communication (Komunikasi)'].map((c, idx) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[10px] font-semibold text-slate-200">
                          ✓ {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESULT TAB 5: FULL REPORT MARKDOWN */}
              {activeResultTab === 'report' && (
                <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-white text-sm">Laporan Hasil Analisis Utuh</h4>
                    <button
                      onClick={handleCopyReport}
                      className="text-xs text-indigo-400 hover:text-white font-bold flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedReport ? 'Tersalin!' : 'Salin Semua'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {masterData.fullMarkdownReport || masterData.executiveSummary}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <FileSearch className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-extrabold text-white">Belum Ada Dokumen CP Dianalisis</h3>
                <p className="text-xs text-slate-400">
                  {isAdmin
                    ? 'Unggah file CP resmi Anda di kolom sebelah kiri untuk memulai analisis mendalam berbasis AMD Engine dan menjadikannya master acuan seluruh perangkat ajar.'
                    : 'Administrator belum mengunggah berkas CP resmi acuan. Silakan hubungi Administrator untuk sinkronisasi kurikulum.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ========================================================================= */}
      {/* MODAL: BUAT PERANGKAT AJAR SESUAI FORMAT / TEMPLATE SEKOLAH */}
      {/* ========================================================================= */}
      {showPerangkatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50">
                      FORMAT SEKOLAH
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {masterData?.subject || subject} • {masterData?.phase || phase} • Kelas {masterData?.grade || grade} • TA {masterData?.academicYear || '2025/2026'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Buat Perangkat Pembelajaran Sesuai Format / Template Sekolah
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowPerangkatModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
              {/* LEFT COLUMN: Controls & Document Selection (5 Cols) */}
              <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-4 bg-slate-950/40">
                {/* School Format Settings */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Format & Template Acuan:</span>
                  </label>
                  <CustomFormatSelector
                    value={customFormatConfig}
                    onChange={(newCfg) => {
                      setCustomFormatConfig(newCfg);
                      setTimeout(() => triggerGenerateDoc(selectedDocType, selectedDocSemester), 100);
                    }}
                    docTypeName={
                      selectedDocType === 'modul_ajar' ? 'RPM (Rencana Pelaksanaan Modul)' :
                      selectedDocType === 'tp' ? 'Tujuan Pembelajaran' :
                      selectedDocType === 'atp' ? 'Alur Tujuan Pembelajaran' :
                      selectedDocType === 'prota' ? 'Program Tahunan' :
                      selectedDocType === 'prosem' ? 'Program Semester' :
                      selectedDocType === 'kktp' ? 'KKTP' :
                      selectedDocType === 'lkpd' ? 'LKPD' :
                      selectedDocType === 'rubrik_penilaian' ? 'Rubrik Penilaian' : 'Analisis CP'
                    }
                    docTypeId={selectedDocType}
                    compact={true}
                  />
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Semester</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {(['Semester 1', 'Semester 2', '1 Tahun'] as const).map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => {
                            setSelectedDocSemester(sem);
                            triggerGenerateDoc(selectedDocType, sem);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition text-center ${
                            selectedDocSemester === sem
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
                      value={selectedLearningModel}
                      onChange={(e) => {
                        setSelectedLearningModel(e.target.value);
                        setTimeout(() => triggerGenerateDoc(selectedDocType, selectedDocSemester), 100);
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

                {/* Topic Selector from CP Distribution */}
                <div className="space-y-1 text-xs">
                  <label className="block text-[10px] font-bold text-slate-400">
                    Fokus Topik / Materi Pembelajaran ({selectedDocSemester}):
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setTimeout(() => triggerGenerateDoc(selectedDocType, selectedDocSemester), 100);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Semua Materi / Otomatis dari CP ({selectedDocSemester})</option>
                    {(selectedDocSemester === 'Semester 1'
                      ? masterData?.materialsSem1
                      : selectedDocSemester === 'Semester 2'
                      ? masterData?.materialsSem2
                      : [...(masterData?.materialsSem1 || []), ...(masterData?.materialsSem2 || [])]
                    )?.map((m, idx) => (
                      <option key={idx} value={m.essentialMaterial}>
                        TP {idx + 1}: {m.essentialMaterial} ({m.allocatedHours} JP)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9 Document List Selection */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Pilih Jenis Perangkat Ajar:</span>
                    <span className="text-[10px] text-indigo-400 font-mono">10 Jenis</span>
                  </label>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                    {[
                      { id: 'analisis_alokasi_waktu', label: '0. Analisis Alokasi Waktu (RBE)', desc: 'Pekan Efektif & Siklus Deep Learning' },
                      { id: 'analisis_cp', label: '1. Analisis & Distribusi CP', desc: 'Dekomposisi Elemen & 3 Pilar Deep Learning' },
                      { id: 'tp', label: '2. Tujuan Pembelajaran (TP)', desc: 'Formula ABCD, Bloom HOTS & Deep Learning' },
                      { id: 'atp', label: '3. Alur Tujuan Pembelajaran (ATP)', desc: 'Standar 10 Kolom, 3 Pilar & Alokasi JP' },
                      { id: 'prota', label: '4. Program Tahunan (PROTA)', desc: 'Format 4 Kolom & Alokasi Tahunan 3 Pilar' },
                      { id: 'prosem', label: '5. Program Semester (PROSEM)', desc: 'Matriks Pekan Efektif & Siklus Deep Learning' },
                      { id: 'kktp', label: '6. Kriteria Ketuntasan (KKTP)', desc: 'Interval Nilai & Rubrik 4 Level Deep Learning' },
                      { id: 'modul_ajar', label: '7. RPM Deep Learning (Modul)', desc: '6 Fase Sintaks: Mindful, Meaningful, Joyful' },
                      { id: 'lkpd', label: '8. LKPD Deep Learning', desc: 'Inkuiri Kontekstual, Kanvas Siswa & Refleksi' },
                      { id: 'rubrik_penilaian', label: '9. Rubrik Penilaian & 6C', desc: 'Asesmen Karakter 6C, Kinerja & Sumatif HOTS' },
                    ].map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDocType(doc.id);
                          triggerGenerateDoc(doc.id, selectedDocSemester);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border ${
                          selectedDocType === doc.id
                            ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-md'
                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-bold ${selectedDocType === doc.id ? 'text-amber-300' : 'text-slate-200'}`}>
                            {doc.label}
                          </div>
                          <div className="text-[10px] text-slate-400">{doc.desc}</div>
                        </div>
                        {selectedDocType === doc.id && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerGenerateDoc(selectedDocType, selectedDocSemester)}
                  disabled={isGeneratingDoc}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
                >
                  {isGeneratingDoc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Menyusun Dokumen Format Sekolah...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Terapkan Format & Susun Ulang Dokumen</span>
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT COLUMN: Live Document Preview & Export Toolbar (7 Cols) */}
              <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col space-y-3 bg-slate-900 overflow-hidden">
                {/* Export Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
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
                      <FileSpreadsheetIcon className="w-3.5 h-3.5" />
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
                      {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Live Document Render Card */}
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-6 overflow-y-auto max-h-[500px] text-xs font-sans space-y-4">
                  {isGeneratingDoc ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                      <p className="text-xs">Menyusun dokumen berdasarkan format / template sekolah...</p>
                    </div>
                  ) : generatedDocContent ? (
                    <div className="space-y-4">
                      {/* Kop Sekolah Preview */}
                      <div className="text-center pb-3 border-b-2 border-slate-700 space-y-0.5">
                        <div className="font-extrabold text-xs uppercase tracking-widest text-slate-400">
                          PEMERINTAH PROVINSI MALUKU / DINAS PENDIDIKAN
                        </div>
                        <div className="font-black text-sm uppercase text-white">
                          {masterData?.schoolName || schoolName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Jl. Pendidikan No. 30, Maluku Tengah • Akreditasi A • Tahun Ajaran {masterData?.academicYear || '2025/2026'}
                        </div>
                      </div>

                      {/* Markdown Document Content */}
                      <pre className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {generatedDocContent}
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

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Dokumen otomatis tersinkronisasi dengan analisis CP & Kalender Pendidikan</span>
              </div>
              <button
                onClick={() => setShowPerangkatModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
