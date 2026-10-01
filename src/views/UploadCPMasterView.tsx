import React, { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  BookOpen,
  Layers,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  ExternalLink,
  Search,
  Filter,
  Download,
  Share2,
  ChevronRight,
  BrainCircuit,
  GraduationCap,
  Bookmark,
  RefreshCw,
  Grid,
  Check,
  FolderSync,
  Compass,
  UploadCloud,
  FileUp,
  FileText,
  Trash2,
  Eye,
  Upload,
  Settings2,
  FileCheck,
} from 'lucide-react';
import { StorageService, DEFAULT_ADMIN } from '../lib/storage';
import { ActiveMasterCPData, CPMaterialItem, SchoolLevel } from '../types';
import { ExportService } from '../lib/exportUtils';
import { CustomFormatSelector, CustomFormatConfig, CustomFormatFile } from '../components/CustomFormatSelector';
import { UniversalFileParser } from '../lib/universalFileParser';
import { CPUploaderAndAnalyzer } from '../components/CPUploaderAndAnalyzer';
import {
  SUBJECT_MATERIAL_PRESETS,
  SubjectPreset,
  getSubjectPresetByGrade,
  syncAllPresetSubjectsToMasterCP,
} from '../lib/subjectMaterialPresets';

interface UploadCPMasterViewProps {
  onNavigate?: (viewId: string) => void;
}

export const UploadCPMasterView: React.FC<UploadCPMasterViewProps> = ({ onNavigate }) => {
  const currentUser = StorageService.getCurrentUser() || DEFAULT_ADMIN;
  const schoolProfile = StorageService.getSchoolProfile();

  const [activeTab, setActiveTab] = useState<'upload_master' | 'catalog' | 'all' | 'elements' | 'sem1' | 'sem2' | 'format_sekolah'>('upload_master');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [syncedNotice, setSyncedNotice] = useState<string | null>(null);
  const [catalogLevelFilter, setCatalogLevelFilter] = useState<'ALL' | 'SD' | 'SMP' | 'SMA' | 'SMK'>('ALL');
  const [catalogPhaseFilter, setCatalogPhaseFilter] = useState<string>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showSyncAllModal, setShowSyncAllModal] = useState<boolean>(false);
  const [syncAllResults, setSyncAllResults] = useState<{ totalSynced: number; subjects: string[] } | null>(null);

  // Adopt & Sync Success Modal for Teachers
  const [adoptedSuccessModal, setAdoptedSuccessModal] = useState<{
    isOpen: boolean;
    subject: string;
    level: string;
    phase: string;
    grade: number | string;
    totalTP: number;
    hours: number;
  } | null>(null);

  // Custom School Format State (Loaded from localStorage or default)
  const formatUploadInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFormatFile, setIsProcessingFormatFile] = useState(false);
  const [customFormatConfig, setCustomFormatConfig] = useState<CustomFormatConfig>(() => {
    try {
      const saved = localStorage.getItem('kurikulum_custom_format_analisis_cp');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      useCustomFormat: false,
      formatFile: null,
      customFormatNotes: '',
    };
  });

  const handleCustomFormatChange = (newConfig: CustomFormatConfig) => {
    setCustomFormatConfig(newConfig);
    try {
      localStorage.setItem('kurikulum_custom_format_analisis_cp', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDirectFormatUpload = async (file: File) => {
    setIsProcessingFormatFile(true);
    try {
      const parsed = await UniversalFileParser.parseFile(file);
      const newFile: CustomFormatFile = {
        name: parsed.fileName,
        size: parsed.fileSize,
        type: parsed.category,
        mimeType: parsed.mimeType,
        base64: parsed.base64,
        extractedText: parsed.extractedText,
        tableMarkdown: parsed.tableMarkdown,
        sheetNames: parsed.sheetNames,
        summaryText: parsed.summaryText,
        previewUrl: parsed.previewUrl,
      };

      const newConfig: CustomFormatConfig = {
        useCustomFormat: true,
        formatFile: newFile,
        customFormatNotes:
          parsed.summaryText ||
          `Format Acuan Dokumen: Mengikuti struktur tabel, tata letak, dan komponen pada file "${parsed.fileName}".`,
      };

      handleCustomFormatChange(newConfig);
      setSyncedNotice(`Template format "${parsed.fileName}" berhasil diunggah & diaktifkan untuk Analisis CP!`);
      setTimeout(() => setSyncedNotice(null), 4000);
    } catch (err) {
      console.error('Failed to parse format file:', err);
      alert('Gagal membaca file template. Pastikan format file sesuai (Word, Excel, PDF, atau Foto).');
    } finally {
      setIsProcessingFormatFile(false);
    }
  };

  const handleSelectFormatPreset = (presetId: string) => {
    const presets: Record<string, { label: string; notes: string }> = {
      analisis_cp_tabel: {
        label: 'Format Tabel Analisis CP & Elemen Sekolah',
        notes: `1. IDENTITAS PERANGKAT (Satuan Pendidikan, Mapel, Fase/Kelas, Semester, Tahun Pelajaran)
2. CAPAIAN PEMBELAJARAN (CP) RESMI
3. DEKOMPOSISI ELEMEN & ANALISIS KOMPETENSI ESENSIAL (Tabel: No, Elemen CP, Kalimat CP, Kompetensi HOTS, Materi Esensial)
4. INTEGRASI 3 PILAR DEEP LEARNING (Mindful, Meaningful, Joyful Learning)
5. PEMETAAN DIMENSI PROFIL PELAJAR PANCASILA
6. STRATEGI PEMBELAJARAN BERDIFERENSIASI (Konten, Proses, Produk)`,
      },
      analisis_cp_deep_learning_matriks: {
        label: 'Format Matriks 6 Kolom Analisis CP (Deep Learning & Profil Pancasila)',
        notes: `1. KOP RESMI SATUAN PENDIDIKAN & IDENTITAS GURU
2. CAPAIAN PEMBELAJARAN (CP) RESMI FASE & KELAS
3. TABEL MATRIKS ANALISIS CP LENGKAP:
   | No | Elemen CP | Kalimat Capaian Pembelajaran | Materi Pokok Esensial | Rumusan Tujuan Pembelajaran (TP) | Dimensi Profil Pancasila & 3 Pilar Deep Learning | Alokasi JP |
4. DISTRIBUSI ALOKASI WAKTU SEMESTER 1 (GANJIL) & SEMESTER 2 (GENAP)
5. PENGESAHAN DOKUMEN: Kepala Satuan Pendidikan dan Guru Pengampu (Lengkap dengan NIP)`,
      },
      analisis_cp_mgmp: {
        label: 'Format Analisis CP Standar MGMP / MKKS',
        notes: `A. RASIONAL & CAPAIAN PEMBELAJARAN FASE
B. PEMETAAN ELEMEN CAPAIAN & KOMPETENSI KUNCI
C. ANALISIS MATERI POKOK ESENSIAL & ALOKASI WAKTU
D. INDIKATOR CAPAIAN PEMBELAJARAN
E. RENCANA PENILAIAN & ASESMEN AUTENTIK`,
      },
    };

    if (presetId === 'standar') {
      handleCustomFormatChange({
        useCustomFormat: false,
        formatFile: null,
        customFormatNotes: '',
      });
      setSyncedNotice('Format dikembalikan ke Standar Baku BSKAP Kemendikdasmen.');
      setTimeout(() => setSyncedNotice(null), 3000);
      return;
    }

    const selected = presets[presetId];
    if (selected) {
      handleCustomFormatChange({
        useCustomFormat: true,
        formatFile: customFormatConfig.formatFile,
        customFormatNotes: selected.notes,
      });
      setSyncedNotice(`Preset "${selected.label}" berhasil diterapkan!`);
      setTimeout(() => setSyncedNotice(null), 3000);
    }
  };

  // Load Master CP Data from storage or create fallback
  const [masterCP, setMasterCP] = useState<ActiveMasterCPData>(() => {
    const existing = StorageService.getActiveMasterCP();
    if (existing) return existing;

    // Fallback to first CP Distribution plan if available
    const plans = StorageService.getCPDistributions();
    if (plans && plans.length > 0) {
      const p = plans[0];
      return {
        id: p.id,
        fileName: `Dokumen_CP_${p.subject}_BSKAP_Kemendikdasmen.pdf`,
        fileType: 'application/pdf',
        fileSize: 1024 * 350,
        uploadedAt: p.createdAt || new Date().toISOString(),
        level: p.level || 'SMA',
        grade: p.grade || 10,
        phase: p.phase || 'Fase E',
        subject: p.subject || 'Bahasa Indonesia',
        teacherName: p.teacherName || schoolProfile.teacherName,
        schoolName: p.schoolName || schoolProfile.schoolName,
        academicYear: p.academicYear || '2025/2026',
        totalHoursPerYear: p.totalHoursPerYear || 108,
        jpPerWeek: p.jpPerWeek || 3,
        cpText: p.cpText || `Capaian Pembelajaran Mata Pelajaran ${p.subject} Jenjang ${p.level} (${p.phase}).`,
        elements: p.elements?.map((e) => ({
          name: e.name,
          description: e.description,
          competencies: ['Menganalisis konsep esensial', 'Mengevaluasi gagasan kritis'],
          essentialMaterials: [`Materi Pokok ${e.name}`],
        })) || [
          {
            name: 'Menyimak',
            description: 'Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, pikiran, perasaan, pandangan, arahan atau pesan yang akurat dari menyimak berbagai tipe teks.',
            competencies: ['Mengevaluasi informasi gagasan akurat', 'Mengkreasi pesan teks kritis'],
            essentialMaterials: ['Teks Laporan Hasil Observasi', 'Teks Anekdot Kritis'],
          },
          {
            name: 'Membaca dan Memirsa',
            description: 'Peserta didik mampu mengevaluasi informasi berupa gagasan, pikiran, pandangan, arahan atau pesan dari berbagai jenis teks untuk menemukan makna yang tersurat dan tersirat.',
            competencies: ['Menganalisis makna tersurat & tersirat', 'Menilai akurasi data teks eksposisi'],
            essentialMaterials: ['Teks Eksposisi Analitis', 'Teks Hikayat & Cerpen'],
          },
          {
            name: 'Berbicara dan Mempresentasikan',
            description: 'Peserta didik mampu mengolah dan menyajikan gagasan, pikiran, pandangan, arahan atau pesan untuk tujuan pengajuan usul, perumusan masalah, dan solusi secara lisan.',
            competencies: ['Mempresentasikan ide persuasif', 'Berdebat santun berbasis data'],
            essentialMaterials: ['Debat Ilmiah Bahasa', 'Negosiasi Kontekstual'],
          },
          {
            name: 'Menulis',
            description: 'Peserta didik mampu menulis gagasan, pikiran, pandangan, arahan atau pesan tertulis untuk berbagai tujuan secara logis, kritis, dan kreatif.',
            competencies: ['Menulis karya ilmiah ringkas', 'Membuat teks negosiasi & biografi'],
            essentialMaterials: ['Teks Biografi Tokoh Bangsa', 'Karya Tulis Ilmiah Populer'],
          },
        ],
        materialsSem1: p.materialsSem1 || [],
        materialsSem2: p.materialsSem2 || [],
        executiveSummary: `Analisis komprehensif Capaian Pembelajaran (CP) resmi untuk mata pelajaran ${p.subject} Jenjang ${p.level} (${p.phase} - Kelas ${p.grade}). Diperkaya dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning) dan integrasi 6 Karakter Utama (Character, Citizenship, Critical Thinking, Creativity, Collaboration, Communication).`,
        kktpSummary: 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial Bagian Tertentu), 66-85% (Baik/Tuntas Capaian), 86-100% (Sangat Baik/Pengayaan Mandiri).',
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      };
    }

    // Default standard Master CP
    return {
      id: 'default-master-cp',
      fileName: 'Dokumen_CP_Resmi_BSKAP_Kemendikdasmen_2025.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 420,
      uploadedAt: new Date().toISOString(),
      level: 'SMA',
      grade: 10,
      phase: 'Fase E',
      subject: 'Bahasa Indonesia',
      teacherName: schoolProfile.teacherName || 'Aspian La Ode Madimu, S.Pd. Gr',
      schoolName: schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH',
      academicYear: '2025/2026',
      totalHoursPerYear: 108,
      jpPerWeek: 3,
      cpText: 'Pada akhir Fase E, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan, konteks sosial, akademis, dan dunia kerja. Peserta didik mampu memahami, mengolah, menginterpretasi, dan mengevaluasi informasi dari berbagai tipe teks secara kritis dan kreatif.',
      elements: [
        {
          name: 'Menyimak',
          description: 'Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, pikiran, pandangan dari berbagai tipe teks lisan dan audiovisual.',
          competencies: ['Mengevaluasi keakuratan fakta & opini', 'Mengkreasi tanggapan kritis terhadap simakan'],
          essentialMaterials: ['Teks Laporan Hasil Observasi (LHO)', 'Teks Anekdot Kritis'],
        },
        {
          name: 'Membaca dan Memirsa',
          description: 'Peserta didik mampu mengevaluasi informasi tersurat dan tersirat untuk mengidentifikasi bias dan memvalidasi argumen pada teks ilmiah atau sastra.',
          competencies: ['Menganalisis struktur dan kaidah kebahasaan', 'Memvalidasi bukti argumen teks eksposisi'],
          essentialMaterials: ['Teks Eksposisi Lingkungan Hidup', 'Karakterisasi Nilai Hikayat & Cerpen'],
        },
        {
          name: 'Berbicara dan Mempresentasikan',
          description: 'Peserta didik mampu menyajikan gagasan dan pemikiran untuk perumusan solusi secara lisan dengan santun, terstruktur, dan meyakinkan.',
          competencies: ['Menyampaikan gagasan berbasis bukti empiris', 'Melakukan negosiasi dan debat santun'],
          essentialMaterials: ['Keterampilan Negosiasi Bisnis/Sosial', 'Debat Isu Aktual Nasional'],
        },
        {
          name: 'Menulis',
          description: 'Peserta didik mampu menulis berbagai teks fiksi dan nonfiksi secara logis, kritis, dan kreatif dengan memperhatikan kaidah bahasa baku.',
          competencies: ['Menyusun artikel opini logis & sistematis', 'Menulis biografi inspiratif tokoh lokal/nasional'],
          essentialMaterials: ['Artikel Ilmiah Populer', 'Teks Biografi Tokoh Pahlawan'],
        },
      ],
      materialsSem1: [
        {
          id: 'sem1-1',
          semester: 1,
          orderNumber: 1,
          tpCode: 'TP.10.1.1',
          tpName: 'Menganalisis dan mengevaluasi informasi akurat dalam Teks Laporan Hasil Observasi (LHO) lingkungan sekitar secara kritis dan objektif.',
          essentialMaterial: 'Teks Laporan Hasil Observasi (LHO)',
          elementName: 'Menyimak & Membaca',
          allocatedHours: 18,
          assessmentStrategy: 'Tes Formatif & Kinerja Observasi Lapangan',
          deepLearningMethod: 'Mindful (Observasi Lingkungan), Meaningful (Laporan Nyata)',
        },
        {
          id: 'sem1-2',
          semester: 1,
          orderNumber: 2,
          tpCode: 'TP.10.1.2',
          tpName: 'Mengkreasi gagasan kritik sosial secara santun dan bernalar dalam bentuk Teks Anekdot bertema fenomena sosial masa kini.',
          essentialMaterial: 'Teks Anekdot & Kritik Sosial',
          elementName: 'Berbicara & Menulis',
          allocatedHours: 18,
          assessmentStrategy: 'Unjuk Kerja Presentasi Komikal & Portofolio Teks',
          deepLearningMethod: 'Joyful (Komedi Edukatif), Meaningful (Solusi Masalah Sosial)',
        },
        {
          id: 'sem1-3',
          semester: 1,
          orderNumber: 3,
          tpCode: 'TP.10.1.3',
          tpName: 'Menyusun argumen logis dan memvalidasi fakta empiris dalam Teks Eksposisi bertema konservasi lingkungan hidup.',
          essentialMaterial: 'Teks Eksposisi Analitis',
          elementName: 'Membaca & Menulis',
          allocatedHours: 18,
          assessmentStrategy: 'Tes Tertulis Argumen & Rubrik 6C Critical Thinking',
          deepLearningMethod: 'Meaningful (Isu Konservasi Alam), Mindful (Refleksi Kritis)',
        },
      ],
      materialsSem2: [
        {
          id: 'sem2-1',
          semester: 2,
          orderNumber: 4,
          tpCode: 'TP.10.2.1',
          tpName: 'Mengevaluasi nilai-nilai karakter luhur dalam Hikayat dan mentransformasikan ke dalam cerpen kontekstual kehidupan modern.',
          essentialMaterial: 'Hikayat & Cerita Pendek (Cerpen)',
          elementName: 'Membaca & Menulis',
          allocatedHours: 18,
          assessmentStrategy: 'Penilaian Proyek Menulis Cerpen & Resensi Sastra',
          deepLearningMethod: 'Mindful (Refleksi Moral), Joyful (Kreativitas Menulis Sastra)',
        },
        {
          id: 'sem2-2',
          semester: 2,
          orderNumber: 5,
          tpCode: 'TP.10.2.2',
          tpName: 'Menerapkan strategi negosiasi kolaboratif untuk mencapai kesepakatan win-win solution dalam simulasi problem sosial nyata.',
          essentialMaterial: 'Teks Negosiasi & Komunikasi Efektif',
          elementName: 'Berbicara & Mempresentasikan',
          allocatedHours: 18,
          assessmentStrategy: 'Simulasi Praktik Negosiasi & Asesmen Rekan Sejawat',
          deepLearningMethod: 'Meaningful (Dunia Nyata), Joyful (Roleplay Interaktif)',
        },
        {
          id: 'sem2-3',
          semester: 2,
          orderNumber: 6,
          tpCode: 'TP.10.2.3',
          tpName: 'Menulis teks biografi tokoh inspiratif Maluku Tengah dengan kaidah penulisan ilmiah populer yang runut dan estetik.',
          essentialMaterial: 'Teks Biografi Tokoh Inspiratif',
          elementName: 'Menulis & Membaca',
          allocatedHours: 18,
          assessmentStrategy: 'Portofolio Biografi & Pameran Karya Literasi Siswa',
          deepLearningMethod: 'Meaningful (Keteladanan Karakter Tokoh), Mindful (Inspirasi Hidup)',
        },
      ],
      executiveSummary: 'Analisis mendalam Capaian Pembelajaran (CP) Bahasa Indonesia Fase E (Kelas 10) berlandaskan Kurikulum Merdeka. Struktur materi dirancang seimbang antara Semester 1 dan 2 dengan total alokasi 108 JP setahun (3 JP/Minggu) serta terintegrasi utuh dengan 3 Pilar Deep Learning dan Penguatan Karakter 6C.',
      kktpSummary: 'Pedoman Interval Ketuntasan KKTP: 0 - 40% (Perlu Bimbingan Individual), 41 - 65% (Remedial pada Indikator yang Belum Dikuasai), 66 - 85% (Tuntas Mencapai Tujuan Pembelajaran), 86 - 100% (Pengayaan & Pendalaman Materi Mandiri).',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };
  });

  // Listen for active master CP changes
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = StorageService.getActiveMasterCP();
      if (updated) {
        setMasterCP(updated);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('master-cp-updated' as any, handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('master-cp-updated' as any, handleStorageChange);
    };
  }, []);

  const totalSem1Hours = (masterCP.materialsSem1 || []).reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
  const totalSem2Hours = (masterCP.materialsSem2 || []).reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
  const totalTPCount = (masterCP.materialsSem1 || []).length + (masterCP.materialsSem2 || []).length;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTable = (sectionName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleExportWord = () => {
    let content = `# HASIL ANALISIS CAPAIAN PEMBELAJARAN (CP) MASTER ACUAN
Mata Pelajaran: ${masterCP.subject}
Jenjang / Fase / Kelas: ${masterCP.level} / ${masterCP.phase} / Kelas ${masterCP.grade}
Sekolah: ${masterCP.schoolName || schoolProfile.schoolName}
Guru Pengampu: ${masterCP.teacherName || schoolProfile.teacherName}
Tahun Ajaran: ${masterCP.academicYear || '2025/2026'}
Total Alokasi Waktu: ${masterCP.totalHoursPerYear} JP/Tahun (${masterCP.jpPerWeek} JP/Minggu)
${
  customFormatConfig.useCustomFormat
    ? `\n---
## [ACUAN FORMAT RESMI SEKOLAH]
Status Format: Format Kustom Sekolah Aktif
${customFormatConfig.formatFile ? `File Template Acuan: ${customFormatConfig.formatFile.name} (${customFormatConfig.formatFile.type.toUpperCase()})` : ''}
${customFormatConfig.customFormatNotes ? `Struktur & Catatan Khusus Format:\n${customFormatConfig.customFormatNotes}` : ''}
`
    : ''
}
---
## I. ELEMEN & KOMPETENSI CAPAIAN PEMBELAJARAN
`;
    (masterCP.elements || []).forEach((el, i) => {
      content += `\n${i + 1}. Elemen: ${el.name}\nDeskripsi: ${el.description}\nKompetensi Esensial: ${(el.competencies || []).join(', ')}\nMateri Esensial: ${(el.essentialMaterials || []).join(', ')}\n`;
    });

    content += `\n---
## II. TABEL DISTRIBUSI MATERI & TP SEMESTER 1 (GANJIL) - ${totalSem1Hours} JP\n`;
    (masterCP.materialsSem1 || []).forEach((m, i) => {
      content += `${i + 1}. [${m.tpCode}] ${m.tpName} | Materi: ${m.essentialMaterial} | Elemen: ${m.elementName || '-'} | Alokasi: ${m.allocatedHours} JP | Asesmen: ${m.assessmentStrategy}\n`;
    });

    content += `\n---
## III. TABEL DISTRIBUSI MATERI & TP SEMESTER 2 (GENAP) - ${totalSem2Hours} JP\n`;
    (masterCP.materialsSem2 || []).forEach((m, i) => {
      content += `${i + 1}. [${m.tpCode}] ${m.tpName} | Materi: ${m.essentialMaterial} | Elemen: ${m.elementName || '-'} | Alokasi: ${m.allocatedHours} JP | Asesmen: ${m.assessmentStrategy}\n`;
    });

    content += `\n---
## IV. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
${masterCP.kktpSummary || 'Interval Standar Kurikulum Merdeka 0-100%'}\n`;

    ExportService.exportToWord(
      `Hasil Analisis CP ${masterCP.subject} ${masterCP.phase}`,
      content,
      schoolProfile,
      `Hasil_Analisis_CP_${masterCP.subject}_${masterCP.phase}`
    );
  };

  const handleSyncToAll = () => {
    StorageService.setActiveMasterCP(masterCP);
    setSyncedNotice(`Master CP ${masterCP.subject} Berhasil Disinkronkan ke Seluruh Perangkat Ajar!`);
    setTimeout(() => setSyncedNotice(null), 3500);
  };

  const handleSyncAllSubjects = () => {
    const result = syncAllPresetSubjectsToMasterCP();
    const updatedMaster = StorageService.getActiveMasterCP();
    if (updatedMaster) {
      setMasterCP(updatedMaster);
    }
    setSyncAllResults(result);
    setShowSyncAllModal(true);
    setSyncedNotice(`Berhasil sinkronisasi ${result.totalSynced} mata pelajaran ke Master CP!`);
    setTimeout(() => setSyncedNotice(null), 4000);
  };

  const handleSelectPresetSubject = (preset: SubjectPreset) => {
    const sem1 = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `m-sem1-${preset.subject.toLowerCase()}-${preset.grade}-${idx + 1}`,
    }));
    const sem2 = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `m-sem2-${preset.subject.toLowerCase()}-${preset.grade}-${idx + 1}`,
    }));

    const newMaster: ActiveMasterCPData = {
      id: `master-${preset.subject.toLowerCase()}-${preset.grade}`,
      fileName: `Dokumen_CP_${preset.subject}_${preset.level}_BSKAP.pdf`,
      fileType: 'application/pdf',
      fileSize: 1024 * 400,
      uploadedAt: new Date().toISOString(),
      level: preset.level,
      grade: preset.grade,
      phase: preset.phase,
      subject: preset.subject,
      teacherName: schoolProfile.teacherName || 'Aspian La Ode Madimu, S.Pd. Gr',
      teacherNip: schoolProfile.teacherNip,
      schoolName: schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH',
      academicYear: schoolProfile.academicYear || '2025/2026',
      totalHoursPerYear: preset.totalHoursPerYear,
      jpPerWeek: preset.jpPerWeek || (preset.level === 'SD' ? 4 : 3),
      cpText: preset.cpSummary,
      elements: preset.elements || [
        {
          name: 'Pemahaman Konsep',
          description: `Penguasaan konsep dan materi esensial ${preset.subject}`,
          competencies: ['Menganalisis prinsip inti', 'Mengevaluasi konsep esensial'],
          essentialMaterials: [`Materi Pokok ${preset.subject}`],
        },
        {
          name: 'Keterampilan Proses',
          description: `Penerapan metode ilmiah dan penyelesaian masalah ${preset.subject}`,
          competencies: ['Merancang eksperimen/karya', 'Mengomunikasikan hasil'],
          essentialMaterials: [`Proyek Inovasi ${preset.subject}`],
        },
      ],
      materialsSem1: sem1,
      materialsSem2: sem2,
      executiveSummary: `Analisis resmi komprehensif Capaian Pembelajaran (CP) untuk mata pelajaran ${preset.subject} Jenjang ${preset.level} (${preset.phase} - Kelas ${preset.grade}). Diperkaya dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning).`,
      kktpSummary: 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial Bagian Tertentu), 66-85% (Baik/Tuntas Capaian), 86-100% (Sangat Baik/Pengayaan Mandiri).',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };

    StorageService.setActiveMasterCP(newMaster);
    setMasterCP(newMaster);
    setSyncedNotice(`Mata Pelajaran Aktif dialihkan ke ${preset.subject} (${preset.level} Kelas ${preset.grade}) & otomatis tersinkron ke semua perangkat ajar!`);
    setTimeout(() => setSyncedNotice(null), 3500);
  };

  // Download CP Data in JSON Format (Standard E-Project Guru Digital)
  const handleDownloadJSON = (preset: SubjectPreset | ActiveMasterCPData) => {
    const exportData = {
      appName: 'E - Project Guru Digital',
      documentType: 'CP_MASTER_EXPORT',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolName: schoolProfile.schoolName || 'Satuan Pendidikan',
      subject: preset.subject,
      level: preset.level,
      grade: preset.grade,
      phase: preset.phase,
      totalHoursPerYear: preset.totalHoursPerYear,
      jpPerWeek: (preset as any).jpPerWeek || 3,
      cpSummary: (preset as any).cpSummary || (preset as any).cpText || '',
      elements: preset.elements || [],
      materialsSem1: preset.materialsSem1 || [],
      materialsSem2: preset.materialsSem2 || [],
      kktpSummary: (preset as any).kktpSummary || 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CP_${preset.subject}_${preset.level}_${preset.phase}_Kelas_${preset.grade}.json`.replace(/\s+/g, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSyncedNotice(`File JSON CP "${preset.subject} (${preset.level} ${preset.phase})" berhasil diunduh untuk arsip atau diupload oleh guru!`);
    setTimeout(() => setSyncedNotice(null), 3500);
  };

  // Download CP Document in Microsoft Word (.docx/.doc) Format
  const handleDownloadWord = (preset: SubjectPreset | ActiveMasterCPData) => {
    const sem1 = preset.materialsSem1 || [];
    const sem2 = preset.materialsSem2 || [];
    const totalTP = sem1.length + sem2.length;
    const elements = preset.elements || [];

    let mdContent = `# ANALISIS RESMI CAPAIAN PEMBELAJARAN (CP) MASTER ACUAN
**Mata Pelajaran:** ${preset.subject}  
**Jenjang / Fase / Kelas:** ${preset.level} / ${preset.phase} / Kelas ${preset.grade}  
**Satuan Pendidikan:** ${schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH'}  
**Alokasi Beban Belajar:** ${preset.totalHoursPerYear} JP/Tahun (${(preset as any).jpPerWeek || 3} JP/Minggu)  
**Total Target TP:** ${totalTP} Tujuan Pembelajaran  

---

### A. RASIONAL & CAPAIAN PEMBELAJARAN UMUM
${(preset as any).cpSummary || (preset as any).cpText || ''}

---

### B. DEKOMPOSISI ELEMEN CAPAIAN PEMBELAJARAN
| No | Elemen CP | Deskripsi Capaian Pembelajaran | Kompetensi Esensial (HOTS) | Materi Pokok Esensial |
|---|---|---|---|---|
${elements.map((el, i) => `| ${i + 1} | **${el.name}** | ${el.description} | ${(el.competencies || []).join('; ') || 'Menganalisis prinsip inti'} | ${(el.essentialMaterials || []).join(', ') || `Materi Pokok ${el.name}`} |`).join('\n')}

---

### C. PEMETAAN MATERI & TUJUAN PEMBELAJARAN (SEMESTER 1 - GANJIL)
| No | Kode TP | Rumusan Tujuan Pembelajaran | Materi Pokok | Elemen CP | Alokasi JP | Pendekatan Deep Learning |
|---|---|---|---|---|---|---|
${sem1.map((m, i) => `| ${i + 1} | ${m.tpCode || `TP.${preset.grade}.1.${i+1}`} | ${m.tpName} | ${m.essentialMaterial} | ${m.elementName || '-'} | ${m.allocatedHours} JP | ${m.deepLearningMethod || 'Mindful & Meaningful'} |`).join('\n')}

---

### D. PEMETAAN MATERI & TUJUAN PEMBELAJARAN (SEMESTER 2 - GENAP)
| No | Kode TP | Rumusan Tujuan Pembelajaran | Materi Pokok | Elemen CP | Alokasi JP | Pendekatan Deep Learning |
|---|---|---|---|---|---|---|
${sem2.map((m, i) => `| ${i + 1} | ${m.tpCode || `TP.${preset.grade}.2.${i+1}`} | ${m.tpName} | ${m.essentialMaterial} | ${m.elementName || '-'} | ${m.allocatedHours} JP | ${m.deepLearningMethod || 'Meaningful & Joyful'} |`).join('\n')}
`;

    ExportService.exportToWord(
      `Analisis_CP_${preset.subject}_${preset.level}_${preset.phase}`,
      mdContent,
      {
        schoolName: schoolProfile.schoolName,
        teacherName: schoolProfile.teacherName,
        teacherNip: schoolProfile.teacherNip,
        principalName: schoolProfile.principalName,
        principalNip: schoolProfile.principalNip,
        academicYear: schoolProfile.academicYear,
        subject: preset.subject,
        grade: preset.grade,
      }
    );
  };

  // 1-Click Adopt CP for Teacher with Auto-Sync to all 9 teaching tools
  const handleAdoptCPForTeacher = (preset: SubjectPreset) => {
    const sem1Items: CPMaterialItem[] = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `sem1-${preset.subject.toLowerCase()}-${preset.grade}-${idx + 1}`,
    }));
    const sem2Items: CPMaterialItem[] = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `sem2-${preset.subject.toLowerCase()}-${preset.grade}-${idx + 1}`,
    }));

    const newMaster: ActiveMasterCPData = {
      id: `master-${preset.subject.toLowerCase()}-${preset.grade}-${Date.now()}`,
      fileName: `Dokumen_CP_${preset.subject}_${preset.level}_${preset.phase}.pdf`,
      fileType: 'application/pdf',
      fileSize: 1024 * 380,
      uploadedAt: new Date().toISOString(),
      level: preset.level,
      grade: preset.grade,
      phase: preset.phase,
      subject: preset.subject,
      teacherName: schoolProfile.teacherName || currentUser.name,
      teacherNip: schoolProfile.teacherNip,
      schoolName: schoolProfile.schoolName,
      academicYear: schoolProfile.academicYear || '2025/2026',
      totalHoursPerYear: preset.totalHoursPerYear,
      jpPerWeek: preset.jpPerWeek || (preset.level === 'SD' ? 4 : 3),
      cpText: preset.cpSummary,
      elements: preset.elements || [
        {
          name: 'Pemahaman Konsep',
          description: `Penguasaan konsep dan materi esensial ${preset.subject}`,
          competencies: ['Menganalisis konsep esensial', 'Mengevaluasi penalaran kritis'],
          essentialMaterials: [`Materi Pokok ${preset.subject}`],
        },
        {
          name: 'Keterampilan Proses',
          description: `Penerapan metode penyelidikan dan karya inovatif ${preset.subject}`,
          competencies: ['Merancang eksperimen/proyek inovasi', 'Mengomunikasikan gagasan'],
          essentialMaterials: [`Proyek Inovasi ${preset.subject}`],
        },
      ],
      materialsSem1: sem1Items,
      materialsSem2: sem2Items,
      executiveSummary: `Analisis resmi Capaian Pembelajaran (CP) untuk mata pelajaran ${preset.subject} Jenjang ${preset.level} (${preset.phase} - Kelas ${preset.grade}). Diperkaya dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning).`,
      kktpSummary: 'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial Bagian Tertentu), 66-85% (Baik/Tuntas Capaian), 86-100% (Sangat Baik/Pengayaan Mandiri).',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };

    StorageService.setActiveMasterCP(newMaster);
    setMasterCP(newMaster);

    // Update teacher profile so every part of the app aligns to this adopted CP
    StorageService.saveSchoolProfile({
      ...schoolProfile,
      subject: preset.subject,
      level: preset.level,
      grade: preset.grade,
      phase: preset.phase,
      jpPerWeek: preset.jpPerWeek || (preset.level === 'SD' ? 4 : 3),
    });

    // Trigger storage dispatch events
    try {
      window.dispatchEvent(new Event('master-cp-updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    setAdoptedSuccessModal({
      isOpen: true,
      subject: preset.subject,
      level: preset.level,
      phase: preset.phase,
      grade: preset.grade,
      totalTP: preset.materialsSem1.length + preset.materialsSem2.length,
      hours: preset.totalHoursPerYear,
    });
  };

  // Filtered materials
  const filterList = (items: CPMaterialItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (m) =>
        m.tpCode.toLowerCase().includes(q) ||
        m.tpName.toLowerCase().includes(q) ||
        m.essentialMaterial.toLowerCase().includes(q) ||
        (m.elementName && m.elementName.toLowerCase().includes(q))
    );
  };

  const filteredSem1 = filterList(masterCP.materialsSem1 || []);
  const filteredSem2 = filterList(masterCP.materialsSem2 || []);

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-slate-900 border border-amber-500/40 rounded-3xl text-center space-y-4 shadow-2xl text-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Akses Dibatasi Khusus Administrator</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Unggah dan analisis Capaian Pembelajaran (CP) Master hanya dapat dilakukan oleh akun Administrator Sekolah untuk standardisasi kurikulum terpusat.
        </p>
        <p className="text-xs text-slate-400">
          Sebagai guru, perangkat pembelajaran dan analisis CP otomatis tersinkronisasi sesuai profil mata pelajaran Anda.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('ai_analisis_cp')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
          >
            Buka Analisis CP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Notice */}
      {syncedNotice && (
        <div className="p-3.5 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{syncedNotice}</span>
          </div>
          <button
            onClick={() => setSyncedNotice(null)}
            className="text-slate-400 hover:text-white text-[11px] uppercase font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* MASTER CP HEADER CARD */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Master CP Resmi Terverifikasi
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {masterCP.level} - {masterCP.phase} (Kelas {masterCP.grade})
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {masterCP.academicYear || '2025/2026'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Deep Learning Ready
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Hasil Analisis CP:</span>
                <span className="text-sky-300">
                  {masterCP.subject}
                </span>
              </h1>
            </div>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Tabel hasil analisis otomatis mendalam dari dokumen Capaian Pembelajaran (CP) resmi. Menjadi acuan tunggal (<em>Single Source of Truth</em>) yang tersinkronisasi ke seluruh 9 modul perangkat ajar.
            </p>

            {/* QUICK SUBJECT SELECTOR BAR */}
            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Pilih Mapel Cepat:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SUBJECT_MATERIAL_PRESETS.slice(0, 8).map((preset) => {
                  const isActive =
                    masterCP.subject.toLowerCase() === preset.subject.toLowerCase() &&
                    Number(masterCP.grade) === Number(preset.grade) &&
                    masterCP.level === preset.level;
                  return (
                    <button
                      key={`${preset.subject}-${preset.grade}`}
                      onClick={() => handleSelectPresetSubject(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 text-indigo-200" />}
                      <span>{preset.subject}</span>
                      <span className="text-[9px] opacity-70">({preset.level} K{preset.grade})</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
                >
                  <Grid className="w-3 h-3" />
                  <span>Lihat Semua ({SUBJECT_MATERIAL_PRESETS.length} Mapel)...</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dokumen Acuan: <strong className="text-slate-200">{masterCP.fileName}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Waktu: <strong className="text-emerald-400 font-mono">{masterCP.totalHoursPerYear} JP/Tahun</strong> ({masterCP.jpPerWeek} JP/Minggu)</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>Target TP: <strong className="text-indigo-300 font-mono">{totalTPCount} Tujuan Pembelajaran</strong></span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 self-start lg:self-center shrink-0">
            <button
              onClick={handleSyncAllSubjects}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30 transition transform active:scale-95"
              title="Sinkronkan seluruh mata pelajaran master CP (Fisika, MTK, B.Indo, IPA, dll) sekaligus"
            >
              <FolderSync className="w-4 h-4 text-emerald-200 animate-spin-slow" />
              <span>⚡ SINKRONKAN SEMUA MAPEL</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('format_sekolah')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-sm ${
                  customFormatConfig.useCustomFormat
                    ? 'bg-emerald-600 border-emerald-400/50 text-white shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                    : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 hover:text-white border-indigo-500/40'
                }`}
                title="Upload format atau template Analisis CP resmi sekolah Anda (Word, Excel, PDF, Foto)"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload Format/Template</span>
                {customFormatConfig.useCustomFormat && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-black">
                    Kustom
                  </span>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                title="Cetak Tabel Hasil Analisis CP"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Cetak</span>
              </button>

              <button
                onClick={handleExportWord}
                className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                title="Ekspor Laporan ke Format Word"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Word</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & TAB SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800 text-xs flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('upload_master')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'upload_master'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload & Analisis CP Master (Admin)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-500/30 text-indigo-200">
              Admin Only
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-sky-300" />
            <span>Katalog Master CP ({SUBJECT_MATERIAL_PRESETS.length} Mapel)</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hasil Analisis CP Aktif</span>
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'elements' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Elemen & Kompetensi ({masterCP.elements?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('sem1')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sem1' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sem 1 ({totalSem1Hours} JP)</span>
          </button>
          <button
            onClick={() => setActiveTab('sem2')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sem2' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sem 2 ({totalSem2Hours} JP)</span>
          </button>
          <button
            onClick={() => setActiveTab('format_sekolah')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'format_sekolah'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Format & Template</span>
            {customFormatConfig.useCustomFormat ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-400/20 text-emerald-300 font-extrabold border border-emerald-400/40">
                Aktif
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-400 font-medium">
                Word/Excel/PDF
              </span>
            )}
          </button>
        </div>

        {/* Search in Tables */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi, kode TP, elemen..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: UPLOAD CP MASTER (ADMIN ONLY) - ANALISIS & AUTO-SYNC TOTAL */}
      {/* ========================================================================= */}
      {activeTab === 'upload_master' && (
        <div className="space-y-6">
          {currentUser.role !== 'admin' ? (
            <div className="p-8 bg-slate-900 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                <h3 className="text-lg font-bold text-white">
                  Fitur Khusus Administrator Sekolah
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload dan analisis berkas dokumen CP Master baru (BSKAP / SK Sekolah) hanya dapat dilakukan oleh <strong>Administrator Sekolah</strong> demi standardisasi kurikulum terpusat.
                </p>
                <p className="text-xs text-slate-400">
                  Sebagai Guru Mata Pelajaran, Anda dapat langsung memilih, mengadopsi, dan menyinkronkan Capaian Pembelajaran resmi yang telah disiapkan melalui <strong>Katalog Master CP</strong>.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  <span>Buka Katalog Master CP ({SUBJECT_MATERIAL_PRESETS.length} Mapel)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/40 mb-1">
                        <ShieldCheck className="w-3 h-3 text-indigo-400" />
                        <span>PANEL RESMI ADMINISTRATOR SEKOLAH</span>
                      </div>
                      <h2 className="text-lg font-black text-white">
                        Upload & Analisis CP Master (Auto-Sync ke Seluruh Perangkat Ajar)
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                  >
                    <Grid className="w-3.5 h-3.5 text-sky-400" />
                    <span>Buka Katalog Master ({SUBJECT_MATERIAL_PRESETS.length} Mapel)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Administrator dapat mengunggah dokumen regulasi Capaian Pembelajaran (CP) Kemdikbudristek (Capaian Pembelajaran No. 020 Tahun 2026 atau SK Sekolah). Sistem akan mengekstrak elemen, memilah kompetensi Bloom HOTS, merumuskan TP, membagi materi Semester 1 & 2, serta <strong>secara otomatis menyinkronkan seluruh 9 perangkat kurikulum</strong> (Analisis CP, TP, ATP, PROTA, PROSEM, KKTP, RPM Deep Learning, LKPD, dan Rubrik Penilaian).
                </p>
              </div>

              <CPUploaderAndAnalyzer
                teacherName={schoolProfile.teacherName || currentUser.name}
                schoolName={schoolProfile.schoolName}
                onAnalysisComplete={(masterData) => {
                  setMasterCP(masterData);
                  setActiveTab('all');
                }}
                onNavigate={onNavigate}
                customTitle="Form Upload & Ekstraksi Dokumen CP Master Resmi BSKAP"
                customDescription="Unggah berkas CP (PDF, Word, Excel, Teks, Scan) untuk dianalisis dan disinkronkan otomatis ke seluruh kurikulum & perangkat ajar"
              />
            </>
          )}
        </div>
      )}

      {/* UPLOAD FORMAT / TEMPLATE ANALISIS CP CARD (VISIBLE ON PRIMARY VIEWS) */}
      {(activeTab === 'all' || activeTab === 'elements' || activeTab === 'sem1' || activeTab === 'sem2') && (
        <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <input
            type="file"
            ref={formatUploadInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleDirectFormatUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
            accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.txt"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-white">
                    Format & Template Dokumen Analisis CP
                  </h3>
                  {customFormatConfig.useCustomFormat ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✓ Format Kustom Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Standar BSKAP Kemendikdasmen
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unggah file resmi sekolah (Word .docx, Excel .xlsx, PDF, Foto Scan) atau pilih preset untuk menyelaraskan struktur Analisis CP.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('format_sekolah')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Pengaturan Lengkap</span>
              </button>
            </div>
          </div>

          {/* If Custom Format File is Active */}
          {customFormatConfig.useCustomFormat && customFormatConfig.formatFile ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs truncate">
                      {customFormatConfig.formatFile.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase shrink-0">
                      {customFormatConfig.formatFile.type}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({(customFormatConfig.formatFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    File ini dijadikan acuan resmi struktur tabel, tata letak, dan ekspor Word Analisis CP untuk {masterCP.subject}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => formatUploadInputRef.current?.click()}
                  disabled={isProcessingFormatFile}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Ganti File</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFormatPreset('standar')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/40 hover:text-rose-200 border border-slate-700 hover:border-rose-500/30 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  title="Kembalikan ke format standar BSKAP"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Standar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone & Quick Presets */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Dropzone */}
              <div
                onClick={() => formatUploadInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleDirectFormatUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="md:col-span-7 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer group flex items-center space-x-3 text-left"
              >
                <div className="p-3 rounded-xl bg-slate-900 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 border border-slate-800 group-hover:border-emerald-500/40 transition shrink-0">
                  {isProcessingFormatFile ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  ) : (
                    <FileUp className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    {isProcessingFormatFile
                      ? 'Sedang membaca file template...'
                      : 'Klik atau Tarik File Format/Template ke Sini'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Mendukung Word (.docx), Excel (.xlsx), PDF, Teks, & Foto Scan Format Sekolah
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="md:col-span-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Atau Pilih Preset Format Resmi:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectFormatPreset('analisis_cp_deep_learning_matriks')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <span>✨ Matriks 6 Kolom (Deep Learning)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormatPreset('analisis_cp_tabel')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <span>📋 Tabel Analisis CP Sekolah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormatPreset('analisis_cp_mgmp')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <span>🏛️ Standar MGMP / MKKS</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KATALOG MASTER CP SEMUA MAPEL TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-sky-400" />
                  <span>Katalog Master CP Semua Mata Pelajaran</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih mata pelajaran untuk melihat struktur CP, bab materi esensial, alokasi JP semester, dan sinkronkan ke seluruh 9 modul perangkat ajar.
                </p>
              </div>

              <button
                onClick={handleSyncAllSubjects}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition shrink-0"
              >
                <FolderSync className="w-4 h-4 text-emerald-200" />
                <span>⚡ Sinkronkan Seluruh {SUBJECT_MATERIAL_PRESETS.length} Mapel</span>
              </button>
            </div>

            {/* Level & Phase Filter & Catalog Search */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Level Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Jenjang:</span>
                  {(['ALL', 'SMA', 'SMK', 'SMP', 'SD'] as const).map((lvl) => {
                    const count = lvl === 'ALL'
                      ? SUBJECT_MATERIAL_PRESETS.length
                      : SUBJECT_MATERIAL_PRESETS.filter(p => p.level === lvl || (lvl === 'SMK' && p.level === 'SMA')).length;
                    return (
                      <button
                        key={lvl}
                        onClick={() => setCatalogLevelFilter(lvl as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          catalogLevelFilter === lvl
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{lvl === 'ALL' ? 'Semua Jenjang' : lvl}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 opacity-80">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari mapel, fase, materi CP..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Phase Filters */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Fase CP:</span>
                {(['ALL', 'Fase A', 'Fase B', 'Fase C', 'Fase D', 'Fase E', 'Fase F'] as const).map((ph) => {
                  const count = ph === 'ALL'
                    ? SUBJECT_MATERIAL_PRESETS.length
                    : SUBJECT_MATERIAL_PRESETS.filter(p => p.phase.includes(ph)).length;
                  if (count === 0 && ph !== 'ALL') return null;
                  return (
                    <button
                      key={ph}
                      onClick={() => setCatalogPhaseFilter(ph)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                        catalogPhaseFilter === ph
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <span>{ph === 'ALL' ? 'Semua Fase' : ph}</span>
                      <span className="px-1 py-0.2 rounded-full text-[9px] bg-black/40 text-slate-300">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECT_MATERIAL_PRESETS.filter((preset) => {
              if (catalogLevelFilter !== 'ALL') {
                if (catalogLevelFilter === 'SMK') {
                  if (preset.level !== 'SMA' && preset.level !== 'SMK') return false;
                } else if (preset.level !== catalogLevelFilter) {
                  return false;
                }
              }
              if (catalogPhaseFilter !== 'ALL' && !preset.phase.includes(catalogPhaseFilter)) return false;
              if (!catalogSearch.trim()) return true;
              const q = catalogSearch.toLowerCase();
              return (
                preset.subject.toLowerCase().includes(q) ||
                preset.phase.toLowerCase().includes(q) ||
                preset.level.toLowerCase().includes(q) ||
                preset.cpSummary.toLowerCase().includes(q) ||
                (preset.elements && preset.elements.some(el => el.name.toLowerCase().includes(q) || (el.essentialMaterials && el.essentialMaterials.some(m => m.toLowerCase().includes(q)))))
              );
            }).map((preset) => {
              const isActive =
                masterCP.subject.toLowerCase() === preset.subject.toLowerCase() &&
                Number(masterCP.grade) === Number(preset.grade) &&
                masterCP.level === preset.level;

              const totalTP = preset.materialsSem1.length + preset.materialsSem2.length;
              const elementCount = preset.elements?.length || 2;

              return (
                <div
                  key={`${preset.subject}-${preset.level}-${preset.grade}`}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between relative overflow-hidden group ${
                    isActive
                      ? 'bg-slate-900 border-indigo-500 shadow-2xl ring-1 ring-indigo-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {preset.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {preset.phase} (Kelas {preset.grade})
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {elementCount} Elemen CP
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1.5 group-hover:text-indigo-300 transition">
                          {preset.subject}
                        </h3>
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Master Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          Kemendikdasmen
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {preset.cpSummary}
                    </p>

                    {/* Elemen CP chips */}
                    {preset.elements && preset.elements.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {preset.elements.map((el, elIdx) => (
                          <span key={elIdx} className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-medium text-slate-300">
                            • {el.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Alokasi Waktu:</span>
                        <strong className="text-emerald-400 font-mono">{preset.totalHoursPerYear} JP/Tahun</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Target Bab/TP:</span>
                        <strong className="text-indigo-300 font-mono">{totalTP} TP ({preset.materialsSem1.length}S1 + {preset.materialsSem2.length}S2)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2">
                    {/* Primary Button: 🌟 Adopsi & Sinkronkan ke CP Saya */}
                    <button
                      onClick={() => handleAdoptCPForTeacher(preset)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-md ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 active:scale-98'
                      }`}
                      title="Adopsi CP ini ke profil guru Anda dan otomatis sinkronkan ke 9 perangkat ajar"
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>CP Aktif Guru Saya</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>Terapkan ke CP Saya & Sinkronkan</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Action Buttons: Download JSON, Word, & Detail Analisis */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleDownloadJSON(preset)}
                        className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-[10px] font-bold border border-amber-500/20 hover:border-amber-500/40 transition flex items-center justify-center gap-1"
                        title="Download file JSON standar untuk diupload di akun guru"
                      >
                        <Download className="w-3 h-3 text-amber-400" />
                        <span>JSON</span>
                      </button>

                      <button
                        onClick={() => handleDownloadWord(preset)}
                        className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 text-[10px] font-bold border border-indigo-500/20 hover:border-indigo-500/40 transition flex items-center justify-center gap-1"
                        title="Download format Microsoft Word (.docx)"
                      >
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>Word</span>
                      </button>

                      <button
                        onClick={() => {
                          handleSelectPresetSubject(preset);
                          setActiveTab('all');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 transition flex items-center justify-center gap-1"
                        title="Lihat Rincian Analisis CP Mapel Ini"
                      >
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXECUTIVE SUMMARY & RASIONAL MAPEL */}
      {(activeTab === 'all' || activeTab === 'elements') && (
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Rasional Capaian Pembelajaran & Filosofi Deep Learning</span>
            </h3>
            <button
              onClick={() => handleCopyTable('summary', masterCP.executiveSummary || masterCP.cpText)}
              className="text-[11px] font-bold text-slate-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {copiedSection === 'summary' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Deskripsi</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {masterCP.executiveSummary || masterCP.cpText}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-500/20">
              <div className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">1. Mindful Learning</div>
              <p className="text-[11px] text-slate-400 mt-1">Refleksi mendalam, kesadaran diri, pemahaman konsep fundamental tanpa ketergesaan hafalan.</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-sky-500/20">
              <div className="text-[11px] font-black text-sky-300 uppercase tracking-wider">2. Meaningful Learning</div>
              <p className="text-[11px] text-slate-400 mt-1">Keterhubungan materi esensial dengan konteks nyata, fenomena alam, dan kebutuhan masyarakat.</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-teal-500/20">
              <div className="text-[11px] font-black text-teal-300 uppercase tracking-wider">3. Joyful Learning</div>
              <p className="text-[11px] text-slate-400 mt-1">Aktivitas pembelajaran interaktif, eksperimen menyenangkan, kolaborasi 6C yang memberdayakan.</p>
            </div>
          </div>
        </div>
      )}

      {/* TABEL 1: ELEMEN & KOMPETENSI CP */}
      {(activeTab === 'all' || activeTab === 'elements') && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Tabel 1: Dekomposisi Elemen CP & Kompetensi Esensial</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rincian capaian resmi setiap elemen beserta kompetensi esensial ranah HOTS (C4–C6)
              </p>
            </div>
            <span className="text-[11px] font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 self-start">
              {masterCP.elements?.length || 0} Elemen Resmi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="py-3 px-3.5 w-12 text-center font-bold">No</th>
                  <th className="py-3 px-3.5 w-44 font-bold">Elemen CP</th>
                  <th className="py-3 px-3.5 font-bold">Capaian Pembelajaran Elemen</th>
                  <th className="py-3 px-3.5 w-64 font-bold">Kompetensi Esensial (KKO HOTS)</th>
                  <th className="py-3 px-3.5 w-56 font-bold">Materi Pokok Esensial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {(masterCP.elements || []).map((el, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-3.5 align-top">
                      <div className="font-bold text-indigo-300 text-xs">{el.name}</div>
                    </td>
                    <td className="py-3.5 px-3.5 leading-relaxed text-slate-300 align-top">
                      {el.description}
                    </td>
                    <td className="py-3.5 px-3.5 align-top">
                      <div className="space-y-1">
                        {(el.competencies && el.competencies.length > 0 ? el.competencies : ['Menganalisis prinsip inti', 'Mengevaluasi gagasan kritis']).map((comp, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-1.5 text-[11px] text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{comp}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top">
                      <div className="space-y-1">
                        {(el.essentialMaterials && el.essentialMaterials.length > 0 ? el.essentialMaterials : [`Materi Esensial ${el.name}`]).map((mat, mIdx) => (
                          <span key={mIdx} className="inline-block px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded-md text-[11px] mr-1 mb-1">
                            {mat}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABEL 2: DISTRIBUSI SEMESTER 1 */}
      {(activeTab === 'all' || activeTab === 'sem1') && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Tabel 2: Hasil Analisis & Distribusi Materi Semester 1 (Ganjil)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alokasi Tujuan Pembelajaran (TP), Materi Esensial, Jam Pelajaran (JP), dan Strategi Asesmen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                {filteredSem1.length} TP Terpetakan
              </span>
              <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono">
                Total: {totalSem1Hours} JP
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center font-bold">No</th>
                  <th className="py-3 px-3 w-24 font-bold">Kode TP</th>
                  <th className="py-3 px-3 font-bold">Rumusan Tujuan Pembelajaran (ABCD & HOTS)</th>
                  <th className="py-3 px-3 w-48 font-bold">Materi Pokok & Target TP</th>
                  <th className="py-3 px-3 w-32 font-bold">Elemen CP</th>
                  <th className="py-3 px-3 w-16 text-center font-bold">JP</th>
                  <th className="py-3 px-3 w-48 font-bold">Strategi Asesmen Formatif / 6C</th>
                  <th className="py-3 px-3 w-44 font-bold">Strategi Deep Learning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredSem1.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                      Tidak ada data materi yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSem1.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-300 align-top">{m.tpCode}</td>
                      <td className="py-3 px-3 leading-relaxed text-white font-medium align-top">{m.tpName}</td>
                      <td className="py-3 px-3 text-slate-300 font-semibold align-top">
                        <div>{m.essentialMaterial}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <span>Target:</span>
                          <strong className="text-white">{m.tpCount || 1} TP</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 align-top">{m.elementName || 'Konsep'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400 align-top">{m.allocatedHours}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-300 align-top">{m.assessmentStrategy}</td>
                      <td className="py-3 px-3 text-[11px] text-indigo-300/90 align-top">{m.deepLearningMethod || 'Mindful & Meaningful'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABEL 3: DISTRIBUSI SEMESTER 2 */}
      {(activeTab === 'all' || activeTab === 'sem2') && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Tabel 3: Hasil Analisis & Distribusi Materi Semester 2 (Genap)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alokasi Tujuan Pembelajaran (TP), Materi Esensial, Jam Pelajaran (JP), dan Strategi Asesmen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-sky-300 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30">
                {filteredSem2.length} TP Terpetakan
              </span>
              <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono">
                Total: {totalSem2Hours} JP
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center font-bold">No</th>
                  <th className="py-3 px-3 w-24 font-bold">Kode TP</th>
                  <th className="py-3 px-3 font-bold">Rumusan Tujuan Pembelajaran (ABCD & HOTS)</th>
                  <th className="py-3 px-3 w-48 font-bold">Materi Pokok & Target TP</th>
                  <th className="py-3 px-3 w-32 font-bold">Elemen CP</th>
                  <th className="py-3 px-3 w-16 text-center font-bold">JP</th>
                  <th className="py-3 px-3 w-48 font-bold">Strategi Asesmen Formatif / Sumatif</th>
                  <th className="py-3 px-3 w-44 font-bold">Strategi Deep Learning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredSem2.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                      Tidak ada data materi yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSem2.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-300 align-top">{m.tpCode}</td>
                      <td className="py-3 px-3 leading-relaxed text-white font-medium align-top">{m.tpName}</td>
                      <td className="py-3 px-3 text-slate-300 font-semibold align-top">
                        <div>{m.essentialMaterial}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <span>Target:</span>
                          <strong className="text-white">{m.tpCount || 1} TP</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 align-top">{m.elementName || 'Keterampilan'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400 align-top">{m.allocatedHours}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-300 align-top">{m.assessmentStrategy}</td>
                      <td className="py-3 px-3 text-[11px] text-sky-300/90 align-top">{m.deepLearningMethod || 'Meaningful & Joyful'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: UPLOAD & PENGATURAN FORMAT SEKOLAH (KUSTOM) */}
      {/* ========================================================================= */}
      {activeTab === 'format_sekolah' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>Upload & Pengaturan Format / Template Analisis CP</span>
                    {customFormatConfig.useCustomFormat ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40">
                        Format Kustom Aktif
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 font-bold border border-slate-700">
                        Format Standar BSKAP
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unggah file Word (.docx), Excel (.xlsx), PDF, atau scan foto format resmi sekolah/MGMP untuk menyelaraskan struktur dokumen Analisis CP.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSyncToAll();
                    setSyncedNotice('Format Sekolah Berhasil Disimpan & Diterapkan ke Seluruh Modul!');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Terapkan</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Ekspor Word</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              💡 <strong>Panduan:</strong> Jika sekolah, yayasan, atau MGMP/MKKS Anda memiliki format baku dokumen Analisis CP (misal: tabel dengan kolom tambahan Profil Pancasila, format Deep Learning, atau tata letak khusus), Anda dapat mengunggah file <strong>Word (.docx), PDF, Excel, atau Foto/Scan</strong> di bawah. Anda juga dapat memilih preset format sekolah atau mengetik instruksi struktur secara manual.
            </p>
          </div>

          {/* Core Custom Format Selector Component */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Komponen Upload Format & Template Acuan</span>
            </h3>

            <CustomFormatSelector
              value={customFormatConfig}
              onChange={handleCustomFormatChange}
              docTypeName="Analisis Capaian Pembelajaran (CP)"
              docTypeId="analisis_cp"
            />
          </div>

          {/* Status & Preview Box */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-indigo-400" />
                <span>Pratinjau Struktur Dokumen Mengikuti Format Sekolah</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Mata Pelajaran: <strong className="text-white">{masterCP.subject}</strong> ({masterCP.phase})
              </span>
            </div>

            {/* Document Mockup Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3 font-sans">
              <div className="text-center border-b border-slate-800 pb-3 space-y-1">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  {masterCP.schoolName || schoolProfile.schoolName || 'SMA NEGERI CONTOH'}
                </div>
                <div className="text-sm font-extrabold text-white">
                  ANALISIS CAPAIAN PEMBELAJARAN (CP) & MATRIKS TUJUAN PEMBELAJARAN
                </div>
                <div className="text-[11px] text-indigo-300">
                  Mata Pelajaran: {masterCP.subject} | {masterCP.level} {masterCP.phase} (Kelas {masterCP.grade}) | Tahun Pelajaran {masterCP.academicYear || '2025/2026'}
                </div>
                {customFormatConfig.useCustomFormat && customFormatConfig.formatFile && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Disesuaikan dengan Template: {customFormatConfig.formatFile.name}</span>
                  </div>
                )}
              </div>

              {customFormatConfig.useCustomFormat && customFormatConfig.customFormatNotes && (
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                    Struktur & Format Acuan yang Diterapkan:
                  </span>
                  <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {customFormatConfig.customFormatNotes}
                  </pre>
                </div>
              )}

              {/* Sample Table Mockup */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border border-slate-800">
                  <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-800 text-center w-10">No</th>
                      <th className="p-2 border-r border-slate-800">Elemen CP</th>
                      <th className="p-2 border-r border-slate-800">Kalimat Capaian Pembelajaran</th>
                      <th className="p-2 border-r border-slate-800">Kompetensi Esensial</th>
                      <th className="p-2 border-r border-slate-800">Materi Pokok</th>
                      <th className="p-2 text-center w-16">Alokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {(masterCP.elements || []).slice(0, 2).map((el, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-2 border-r border-slate-800 text-center font-mono">{i + 1}</td>
                        <td className="p-2 border-r border-slate-800 font-bold text-indigo-300">{el.name}</td>
                        <td className="p-2 border-r border-slate-800 text-slate-300 text-[10px]">{el.description}</td>
                        <td className="p-2 border-r border-slate-800 text-[10px]">
                          {(el.competencies || []).join(', ')}
                        </td>
                        <td className="p-2 border-r border-slate-800 text-[10px] text-emerald-300 font-medium">
                          {(el.essentialMaterials || []).join(', ')}
                        </td>
                        <td className="p-2 text-center font-mono text-amber-400 font-bold">
                          {masterCP.jpPerWeek ? `${masterCP.jpPerWeek * 6} JP` : '18 JP'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYNC ALL SUBJECTS SUCCESS MODAL */}
      {showSyncAllModal && syncAllResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl">
                  <FolderSync className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Sinkronisasi Seluruh Mata Pelajaran Berhasil!
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sebanyak <strong className="text-emerald-400">{syncAllResults.totalSynced} Mata Pelajaran</strong> kurikulum nasional telah disinkronkan ke Master CP & Database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncAllModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Daftar Mata Pelajaran Tersinkronisasi:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {syncAllResults.subjects.map((sub, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-200 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{sub}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Seluruh 9 perangkat ajar (TP, ATP, Prota, Prosem, KKTP, RPM / Modul Ajar, LKPD, Rubrik) kini otomatis mengenali materi esensial dari semua mata pelajaran ini.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowSyncAllModal(false);
                  setActiveTab('catalog');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Buka Katalog Mapel
              </button>
              <button
                onClick={() => setShowSyncAllModal(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES ADOPSI & SINKRONISASI CP KE 9 PERANGKAT AJAR */}
      {adoptedSuccessModal && adoptedSuccessModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl shadow-inner">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 mb-1">
                    <span>SINKRONISASI TOTAL 100% SUKSES</span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    CP {adoptedSuccessModal.subject} Berhasil Diterapkan & Disinkronkan!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Jenjang <strong>{adoptedSuccessModal.level}</strong> • <strong>{adoptedSuccessModal.phase}</strong> (Kelas {adoptedSuccessModal.grade}) • <strong>{adoptedSuccessModal.hours} JP/Tahun</strong> ({adoptedSuccessModal.totalTP} Target TP)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdoptedSuccessModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>9 Modul Perangkat Ajar Telah Otomatis Terhubung:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { num: '1', title: 'Analisis CP Terbaru', id: 'ai_analisis_cp' },
                  { num: '2', title: 'Tujuan Pembelajaran (TP)', id: 'ai_tp' },
                  { num: '3', title: 'Alur Tujuan (ATP)', id: 'ai_atp' },
                  { num: '4', title: 'Program Tahunan (PROTA)', id: 'ai_prota' },
                  { num: '5', title: 'Program Semester (PROSEM)', id: 'ai_prosem' },
                  { num: '6', title: 'Kriteria Ketuntasan (KKTP)', id: 'ai_kktp' },
                  { num: '7', title: 'RPM / Modul Ajar Deep Learning', id: 'ai_modul_ajar' },
                  { num: '8', title: 'Lembar Kerja Siswa (LKPD)', id: 'ai_lkpd' },
                  { num: '9', title: 'Rubrik Penilaian Terpadu', id: 'ai_rubrik_penilaian' },
                  { num: '📦', title: 'Bundel 1 Perangkat Lengkap', id: 'ai_bundle' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between hover:border-emerald-500/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center">
                        {item.num}
                      </span>
                      <span className="text-slate-200 font-medium text-[11px]">{item.title}</span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Profil guru mata pelajaran Anda telah otomatis diselaraskan dengan {adoptedSuccessModal.subject} ({adoptedSuccessModal.phase}). Anda dapat langsung membuat modul ajar atau bundel lengkap!
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setAdoptedSuccessModal(null);
                  if (onNavigate) onNavigate('ai_modul_ajar');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka RPM / Modul Ajar</span>
              </button>
              <button
                onClick={() => {
                  setAdoptedSuccessModal(null);
                  if (onNavigate) onNavigate('ai_bundle');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Buka Bundel Lengkap</span>
              </button>
              <button
                onClick={() => setAdoptedSuccessModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
