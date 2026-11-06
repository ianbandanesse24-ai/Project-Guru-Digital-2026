import React, { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Save,
  Copy,
  Check,
  Zap,
  Sliders,
  Download,
  AlertCircle,
  Eye,
  ArrowRight,
  BookOpen,
  Layers,
  Grid,
  Search,
  Plus,
  Trash2,
  Settings2,
  FolderSync,
  RefreshCw,
  Table,
  Filter,
  FileCheck,
} from 'lucide-react';
import {
  ActiveMasterCPData,
  CPMaterialItem,
  SchoolLevel,
  EducationLevel,
} from '../types';
import { StorageService, addStorageListener } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { generateExpertCurriculumDocument } from '../lib/curriculumEngine';
import {
  CustomFormatSelector,
  CustomFormatConfig,
  CustomFormatFile,
} from '../components/CustomFormatSelector';
import { UniversalFileParser } from '../lib/universalFileParser';
import { DocumentPdfPreview } from '../components/DocumentPdfPreview';
import {
  SUBJECT_MATERIAL_PRESETS,
  getSubjectPresetByGrade,
  SubjectPreset,
} from '../lib/subjectMaterialPresets';

interface AnalisisCPViewProps {
  onNavigate?: (viewId: string) => void;
  initialTab?: 'upload_format' | 'analisis_elemen' | 'pratinjau_dokumen';
}

export const AnalisisCPView: React.FC<AnalisisCPViewProps> = ({
  onNavigate,
  initialTab = 'upload_format',
}) => {
  const [activeTab, setActiveTab] = useState<'upload_format' | 'analisis_elemen' | 'pratinjau_dokumen'>(initialTab);
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap' | '1 Tahun'>('Ganjil');

  // Metadata from Storage
  const schoolProfile = StorageService.getSchoolProfile();
  const [activeMasterCP, setActiveMasterCP] = useState<ActiveMasterCPData | null>(() =>
    StorageService.getActiveMasterCP()
  );

  const [subject, setSubject] = useState<string>(
    activeMasterCP?.subject || schoolProfile.subject || 'Fisika'
  );
  const [level, setLevel] = useState<SchoolLevel>(
    (activeMasterCP?.level as SchoolLevel) || (schoolProfile.level as SchoolLevel) || 'SMA'
  );
  const [grade, setGrade] = useState<number>(
    Number(activeMasterCP?.grade || schoolProfile.grade) || 10
  );
  const [phase, setPhase] = useState<string>(
    activeMasterCP?.phase ||
      schoolProfile.phase ||
      (grade === 10 ? 'Fase E' : grade > 10 ? 'Fase F' : grade >= 7 ? 'Fase D' : 'Fase A/B/C')
  );
  const [academicYear, setAcademicYear] = useState<string>(
    activeMasterCP?.academicYear || schoolProfile.academicYear || '2025/2026'
  );
  const [jpPerWeek, setJpPerWeek] = useState<number>(
    activeMasterCP?.jpPerWeek || Number(schoolProfile.jpPerWeek) || 3
  );

  // Custom Format Configuration (Persistent in localStorage & storage)
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

  // CP Text & Elements State
  const [cpText, setCpText] = useState<string>(() => {
    if (activeMasterCP?.cpText) return activeMasterCP.cpText;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return preset.cpSummary || 'Peserta didik mampu memahami dan menganalisis capaian pembelajaran dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful).';
  });

  const [elements, setElements] = useState<
    { name: string; description: string; competencies?: string[]; essentialMaterials?: string[] }[]
  >(() => {
    if (activeMasterCP?.elements && activeMasterCP.elements.length > 0) return activeMasterCP.elements;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (
      preset.elements || [
        {
          name: 'Pemahaman Konseptual',
          description: `Peserta didik memahami prinsip-prinsip dasar dan konsep esensial pada mata pelajaran ${subject}.`,
          competencies: ['Mengidentifikasi konsep', 'Menjelaskan prinsip', 'Menerapkan formula'],
          essentialMaterials: ['Dasar Konseptual', 'Teori Esensial'],
        },
        {
          name: 'Keterampilan Proses',
          description: `Peserta didik melakukan penyelidikan, mengolah data, dan mengomunikasikan kesimpulan ilmiah.`,
          competencies: ['Merancang percobaan', 'Menganalisis data', 'Menyimpulkan solusi'],
          essentialMaterials: ['Penyelidikan Terbimbing', 'Eksperimen HOTS'],
        },
      ]
    );
  });

  // Materials for Semester 1 & 2
  const [materialsSem1, setMaterialsSem1] = useState<CPMaterialItem[]>(() => {
    if (activeMasterCP?.materialsSem1 && activeMasterCP.materialsSem1.length > 0) return activeMasterCP.materialsSem1;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `cp-m1-${idx + 1}` }));
  });

  const [materialsSem2, setMaterialsSem2] = useState<CPMaterialItem[]>(() => {
    if (activeMasterCP?.materialsSem2 && activeMasterCP.materialsSem2.length > 0) return activeMasterCP.materialsSem2;
    const preset = getSubjectPresetByGrade(subject, level, grade);
    return (preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `cp-m2-${idx + 1}` }));
  });

  // UI helpers
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogFilterLevel, setCatalogFilterLevel] = useState<string>('ALL');

  // Direct Format Upload Input
  const formatFileInputRef = useRef<HTMLInputElement>(null);
  const cpDocumentFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      const freshMaster = StorageService.getActiveMasterCP();
      if (freshMaster) {
        setActiveMasterCP(freshMaster);
        if (freshMaster.subject) setSubject(freshMaster.subject);
        if (freshMaster.level) setLevel(freshMaster.level as SchoolLevel);
        if (freshMaster.grade) setGrade(Number(freshMaster.grade));
        if (freshMaster.phase) setPhase(freshMaster.phase);
        if (freshMaster.jpPerWeek) setJpPerWeek(freshMaster.jpPerWeek);
        if (freshMaster.cpText) setCpText(freshMaster.cpText);
        if (freshMaster.elements && freshMaster.elements.length > 0) setElements(freshMaster.elements);
        if (freshMaster.materialsSem1 && freshMaster.materialsSem1.length > 0) setMaterialsSem1(freshMaster.materialsSem1);
        if (freshMaster.materialsSem2 && freshMaster.materialsSem2.length > 0) setMaterialsSem2(freshMaster.materialsSem2);
      }
    };

    const unsub = addStorageListener(handleStorageUpdate);
    window.addEventListener('master-cp-updated', handleStorageUpdate);
    window.addEventListener('curriculum-parameters-synced', handleStorageUpdate);

    return () => {
      unsub();
      window.removeEventListener('master-cp-updated', handleStorageUpdate);
      window.removeEventListener('curriculum-parameters-synced', handleStorageUpdate);
    };
  }, []);

  // Update Custom Format Configuration
  const handleCustomFormatChange = (newConfig: CustomFormatConfig) => {
    setCustomFormatConfig(newConfig);
    try {
      localStorage.setItem('kurikulum_custom_format_analisis_cp', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
    setSaveToast(
      newConfig.useCustomFormat
        ? 'Format khusus dokumen sekolah berhasil diaktifkan untuk Analisis CP!'
        : 'Format Analisis CP dikembalikan ke standar baku resmi.'
    );
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Direct File Format Upload (.docx, .xlsx, .pdf, scan)
  const handleDirectFormatUpload = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const parsed = await UniversalFileParser.parseFile(file);
      const newFile: CustomFormatFile = {
        name: parsed.fileName,
        size: parsed.fileSize,
        type: parsed.category,
        mimeType: parsed.mimeType,
        base64: parsed.base64,
        extractedText: parsed.extractedText,
      };

      const newConfig: CustomFormatConfig = {
        useCustomFormat: true,
        formatFile: newFile,
        customFormatNotes:
          parsed.summaryText ||
          `Format Acuan Sekolah: Mengikuti tata letak, struktur tabel, dan komponen pada file "${parsed.fileName}".`,
      };

      handleCustomFormatChange(newConfig);
      setSaveToast(`Berkas format "${parsed.fileName}" berhasil diunggah & diterapkan!`);
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error('Failed to parse format file:', err);
      alert('Gagal membaca berkas format. Pastikan file berupa Word (.docx), Excel (.xlsx), PDF, atau Gambar Scan.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Direct CP Document Upload
  const handleDirectCPDocUpload = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const parsed = await UniversalFileParser.parseFile(file);
      if (parsed.extractedText) {
        setCpText(parsed.extractedText.slice(0, 3000));
        setSaveToast(`Teks Capaian Pembelajaran dari berkas "${file.name}" berhasil diekstrak!`);
        setTimeout(() => setSaveToast(null), 3500);
      }
    } catch (err) {
      console.error('Failed to parse CP file:', err);
      alert('Gagal mengekstrak teks CP. Pastikan file valid.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Save Analisis CP to persistent storage and sync with master
  const handleSaveAnalisisCP = () => {
    const updatedMaster: ActiveMasterCPData = {
      id: activeMasterCP?.id || `cp-${Date.now()}`,
      fileName: activeMasterCP?.fileName || `Dokumen_Analisis_CP_${subject.replace(/\s+/g, '_')}.pdf`,
      fileType: activeMasterCP?.fileType || 'application/pdf',
      fileSize: activeMasterCP?.fileSize || 1024 * 250,
      uploadedAt: activeMasterCP?.uploadedAt || new Date().toISOString(),
      level,
      grade,
      phase,
      subject,
      teacherName: schoolProfile.teacherName || 'Guru Pengampu',
      teacherNip: schoolProfile.teacherNip || '-',
      schoolName: schoolProfile.schoolName || 'Satuan Pendidikan',
      headmasterName: schoolProfile.headmasterName || 'Kepala Sekolah',
      headmasterNip: schoolProfile.headmasterNip || '-',
      city: schoolProfile.city || 'Kota Satuan Pendidikan',
      academicYear,
      totalHoursPerYear: (materialsSem1.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0) +
        materialsSem2.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0)) || 108,
      jpPerWeek,
      cpText,
      elements,
      materialsSem1,
      materialsSem2,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.setActiveMasterCP(updatedMaster);
    setActiveMasterCP(updatedMaster);
    setSavedSuccess(true);
    setSaveToast('Data Analisis Capaian Pembelajaran (CP) berhasil disimpan & disinkronkan ke seluruh modul!');
    setTimeout(() => {
      setSavedSuccess(false);
      setSaveToast(null);
    }, 3500);
  };

  // Apply Subject Preset from Catalog
  const handleApplyPreset = (preset: SubjectPreset) => {
    setSubject(preset.subject);
    setLevel(preset.level);
    setGrade(preset.grade);
    setPhase(preset.phase);
    setJpPerWeek(preset.jpPerWeek || 3);
    setCpText(preset.cpSummary);
    if (preset.elements) setElements(preset.elements);
    setMaterialsSem1((preset.materialsSem1 || []).map((m, idx) => ({ ...m, id: `cp-m1-${idx + 1}` })));
    setMaterialsSem2((preset.materialsSem2 || []).map((m, idx) => ({ ...m, id: `cp-m2-${idx + 1}` })));

    setSaveToast(`Preset kurikulum resmi "${preset.subject} (${preset.level} Kelas ${preset.grade})" berhasil diterapkan!`);
    setTimeout(() => setSaveToast(null), 3500);
    setActiveTab('analisis_elemen');
  };

  // Add Element
  const handleAddElement = () => {
    setElements([
      ...elements,
      {
        name: `Elemen ${elements.length + 1}`,
        description: `Peserta didik mampu menguasai kompetensi esensial pada elemen ini.`,
        competencies: ['Mengidentifikasi konsep', 'Menerapkan prosedur'],
        essentialMaterials: [`Materi Esensial ${elements.length + 1}`],
      },
    ]);
  };

  // Remove Element
  const handleRemoveElement = (idx: number) => {
    if (elements.length <= 1) {
      alert('Minimal harus ada 1 elemen Capaian Pembelajaran.');
      return;
    }
    setElements(elements.filter((_, i) => i !== idx));
  };

  // Update Element Field
  const handleUpdateElement = (index: number, field: string, value: any) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], [field]: value };
    setElements(updated);
  };

  // Generate Document Preview Markdown
  const previewMarkdown = generateExpertCurriculumDocument({
    toolType: 'analisis_cp',
    docType: 'analisis_cp',
    subject,
    level,
    grade,
    semester: selectedSemester,
    phase,
    academicYear,
    schoolProfile,
    useCustomFormat: customFormatConfig.useCustomFormat,
    customFormatNotes: customFormatConfig.customFormatNotes,
    customFormatFile: customFormatConfig.formatFile,
    distributionData: {
      jpPerWeek,
      totalHoursPerYear:
        materialsSem1.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0) +
        materialsSem2.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0),
    },
  });

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(previewMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const profile = StorageService.getSchoolProfile();
    const fileName = `Analisis_CP_${subject.replace(/\s+/g, '_')}_Kelas_${grade}_${level}`;
    ExportService.exportToWord(
      `ANALISIS CAPAIAN PEMBELAJARAN (CP) - ${subject.toUpperCase()}`,
      previewMarkdown,
      {
        ...profile,
        subject,
        grade,
        level,
        semester: selectedSemester,
        docType: 'analisis_cp',
      },
      fileName
    );
  };

  const handleExportExcel = () => {
    const tableData: any[] = [];
    let no = 1;

    elements.forEach((elem) => {
      tableData.push({
        No: no++,
        'Elemen CP': elem.name,
        'Capaian Pembelajaran Elemen': elem.description,
        'Kompetensi Kunci': (elem.competencies || []).join('; '),
        'Materi Pokok Esensial': (elem.essentialMaterials || []).join('; '),
        '3 Pilar Deep Learning': 'Mindful, Meaningful, Joyful Learning',
      });
    });

    ExportService.exportToExcel(
      tableData,
      `Analisis_CP_${subject.replace(/\s+/g, '_')}_Kelas_${grade}`,
      `Analisis CP ${subject}`,
      {
        docTitle: `ANALISIS CAPAIAN PEMBELAJARAN (CP) - ${subject.toUpperCase()}`,
        academicYear,
        teacherName: schoolProfile.teacherName || 'Guru Pengampu',
      }
    );
  };

  // Filter Catalog Presets
  const filteredPresets = SUBJECT_MATERIAL_PRESETS.filter((p) => {
    const matchSearch =
      catalogSearch === '' ||
      p.subject.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.cpSummary.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchLevel = catalogFilterLevel === 'ALL' || p.level === catalogFilterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={formatFileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDirectFormatUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
        accept=".docx,.doc,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={cpDocumentFileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDirectCPDocUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
        accept=".docx,.doc,.pdf,.txt"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: ANALISIS CAPAIAN PEMBELAJARAN (CP) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shadow-xs shrink-0">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  Analisis Capaian Pembelajaran (CP)
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Bisa Upload Format Sendiri
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {subject} • Kelas {grade} ({level} • {phase})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Kelola dekomposisi elemen Capaian Pembelajaran (CP), pemetaan kompetensi HOTS, dan 3 pilar Deep Learning. Terapkan berkas format dokumen sekolah Anda sendiri (Word .docx, Excel .xlsx, PDF, Scan) atau format baku resmi Kemendikdasmen.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveAnalisisCP}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Data'}</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('parameter_kurikulum')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                title="Buka Parameter Kurikulum & Bab TP"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Parameter Bab TP</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Chip Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Status Format Dokumen CP:
            </span>
            {customFormatConfig.useCustomFormat ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Format Khusus Sekolah Aktif</span>
                {customFormatConfig.formatFile && (
                  <span className="font-normal text-emerald-700">({customFormatConfig.formatFile.name})</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold gap-1 text-[11px]">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Format Standar Resmi BSKAP No. 020/2026 & Deep Learning</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-600 font-medium text-[11px]">
            <span>Elemen: <strong className="text-slate-900">{elements.length} Elemen</strong></span>
            <span>•</span>
            <span>Sem 1: <strong className="text-emerald-700">{materialsSem1.length} Materi Pokok</strong></span>
            <span>•</span>
            <span>Sem 2: <strong className="text-emerald-700">{materialsSem2.length} Materi Pokok</strong></span>
          </div>
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
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THREE CORE NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload_format')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'upload_format'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>1. Upload & Pengaturan Format Sendiri</span>
          {customFormatConfig.useCustomFormat && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analisis_elemen')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'analisis_elemen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Dekomposisi Elemen & Analisis CP</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'analisis_elemen' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {elements.length} Elemen
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pratinjau_dokumen')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'pratinjau_dokumen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Pratinjau Dokumen Sesuai Format</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'pratinjau_dokumen' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            Word / PDF / Excel
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UPLOAD & ATUR FORMAT SENDIRI */}
      {/* ========================================================================= */}
      {activeTab === 'upload_format' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Information & Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-blue-950">
                    Kustomisasi Format Dokumen Analisis Capaian Pembelajaran (CP) Sekolah
                  </h2>
                </div>
                <p className="text-xs text-blue-900/80 leading-relaxed max-w-3xl">
                  Setiap sekolah dan MGMP memiliki format dokumen Analisis CP tersendiri. Anda dapat mengunggah berkas template format sekolah Anda (Word .docx, Excel .xlsx, PDF, atau Foto/Scan) atau memilih preset resmi. Dokumen analisis CP otomatis menyesuaikan tata letak, kolom dekomposisi elemen, dan format lembar pengesahan.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('analisis_elemen')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <span>Buka Analisis Elemen</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Core Custom Format Selector Component */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <CustomFormatSelector
              value={customFormatConfig}
              onChange={handleCustomFormatChange}
              docTypeId="analisis_cp"
              docTypeName="Analisis Capaian Pembelajaran (CP)"
            />
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs text-slate-500">
              Format yang Anda terapkan otomatis disimpan secara lokal dan dijadikan acuan saat mengekspor Word, PDF, atau mencetak dokumen.
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('pratinjau_dokumen')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Pratinjau Dokumen Sesuai Format</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEKOMPOSISI ELEMEN & ANALISIS CP */}
      {/* ========================================================================= */}
      {activeTab === 'analisis_elemen' && (
        <div className="space-y-5 animate-in fade-in">
          {/* CP Source Selection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Upload / Input CP File */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Upload Dokumen CP Sekolah</h3>
                  <p className="text-[11px] text-slate-500">Unggah berkas Word (.docx), PDF, atau TXT</p>
                </div>
              </div>

              <div
                onClick={() => cpDocumentFileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-xl cursor-pointer text-center transition space-y-1.5"
              >
                <FileSearch className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  {isProcessingFile ? 'Sedang mengekstrak teks dokumen...' : 'Klik untuk Unggah Berkas CP Sekolah'}
                </p>
                <p className="text-[10px] text-slate-400">PDF, Word, atau Dokumen Teks Resmi</p>
              </div>
            </div>

            {/* Quick Catalog Preset Picker */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Adopsi dari Katalog Resmi BSKAP</h3>
                    <p className="text-[11px] text-slate-500">Pilih dari 25+ mata pelajaran siap pakai</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari mapel (Fisika, Biologi, MTK, dll)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
                <select
                  value={catalogFilterLevel}
                  onChange={(e) => setCatalogFilterLevel(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="ALL">Semua</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredPresets.slice(0, 5).map((preset, idx) => (
                  <button
                    key={`${preset.subject}-${preset.grade}-${idx}`}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{preset.subject}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        {preset.level} Kelas {preset.grade} ({preset.phase})
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                      Terapkan
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form: CP Resmi Fase */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-blue-600" />
                <span>Capaian Pembelajaran (CP) Resmi Fase {phase} — {subject}</span>
              </label>
              <span className="text-[11px] text-slate-400">Dapat diedit langsung</span>
            </div>
            <textarea
              rows={3}
              value={cpText}
              onChange={(e) => setCpText(e.target.value)}
              placeholder="Ketik atau tempel rumusan Capaian Pembelajaran (CP) resmi..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 text-xs text-slate-800 leading-relaxed outline-none transition"
            />
          </div>

          {/* Interactive Elements Decomposition Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Dekomposisi Elemen Capaian Pembelajaran (CP) & 3 Pilar Deep Learning</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Petakan setiap elemen CP menjadi kompetensi kunci HOTS dan materi esensial.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddElement}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Elemen</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-48">Nama Elemen</th>
                    <th className="p-3">Capaian Pembelajaran Elemen</th>
                    <th className="p-3 w-52">Kompetensi Esensial (HOTS)</th>
                    <th className="p-3 w-52">Materi Esensial</th>
                    <th className="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {elements.map((elem, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={elem.name}
                          onChange={(e) => handleUpdateElement(idx, 'name', e.target.value)}
                          className="w-full p-1.5 font-bold text-slate-900 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="p-3">
                        <textarea
                          rows={2}
                          value={elem.description}
                          onChange={(e) => handleUpdateElement(idx, 'description', e.target.value)}
                          className="w-full p-1.5 text-slate-700 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600 leading-relaxed"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={(elem.competencies || []).join(', ')}
                          onChange={(e) =>
                            handleUpdateElement(
                              idx,
                              'competencies',
                              e.target.value.split(',').map((s) => s.trim())
                            )
                          }
                          placeholder="Pisahkan dengan koma..."
                          className="w-full p-1.5 text-slate-700 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={(elem.essentialMaterials || []).join(', ')}
                          onChange={(e) =>
                            handleUpdateElement(
                              idx,
                              'essentialMaterials',
                              e.target.value.split(',').map((s) => s.trim())
                            )
                          }
                          placeholder="Pisahkan dengan koma..."
                          className="w-full p-1.5 text-slate-700 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveElement(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Elemen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3 Pillars of Deep Learning Highlight Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">
                  Integrasi 3 Pilar Pendekatan Deep Learning dalam Analisis CP:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="font-bold text-emerald-800 block">1. Mindful Learning</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    Kesadaran penuh, orientasi konteks nyata, pemahaman bermakna, dan kebiasaan reflektif siswa.
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-teal-100 shadow-2xs">
                  <span className="font-bold text-teal-800 block">2. Meaningful Learning</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    Keterkaitan materi dengan kehidupan nyata, inkuiri empiris HOTS, dan transfer pengetahuan lintas bidang.
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                  <span className="font-bold text-blue-800 block">3. Joyful Learning</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    Suasana belajar menyenangkan, apresiasi rasa ingin tahu, kolaborasi kreatif, dan perayaan karya belajar.
                  </span>
                </div>
              </div>
            </div>

            {/* Sync and Save Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveAnalisisCP}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan &amp; Sinkronkan ke Parameter Kurikulum</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pratinjau_dokumen')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Dokumen Jadi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRATINJAU DOKUMEN SESUAI FORMAT & EKSPOR */}
      {/* ========================================================================= */}
      {activeTab === 'pratinjau_dokumen' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Header Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Lingkup Semester:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Ganjil')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSemester === 'Ganjil'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semester Ganjil
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('Genap')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSemester === 'Genap'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semester Genap
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('1 Tahun')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSemester === '1 Tahun'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1 Tahun Pelajaran Penuh
                </button>
              </div>
            </div>

            {/* Document Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportWord}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="Ekspor ke Microsoft Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="Ekspor ke Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="Cetak Dokumen & Lembar Pengesahan"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                title="Salin Isi Dokumen"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Document Renderer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <DocumentPdfPreview
              title={`ANALISIS CAPAIAN PEMBELAJARAN (CP) - ${subject.toUpperCase()}`}
              markdownContent={previewMarkdown}
              subject={subject}
              grade={grade}
              level={level}
              semester={selectedSemester}
              docType="analisis_cp"
              teacherName={schoolProfile.teacherName}
              fileNamePrefix={`Analisis_CP_${subject.replace(/\s+/g, '_')}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
