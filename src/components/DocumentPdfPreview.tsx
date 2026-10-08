import React, { useState } from 'react';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Code,
  Sparkles,
  Download,
  School,
  FileCheck,
  Layers,
  ArrowDownToLine,
  FileDown,
  LayoutGrid,
} from 'lucide-react';
import { StorageService, SchoolProfile } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';

interface DocumentPdfPreviewProps {
  title: string;
  markdownContent?: string;
  content?: string;
  subject?: string;
  grade?: number | string;
  level?: string;
  semester?: string;
  docType?: string;
  teacherName?: string;
  fileNamePrefix?: string;
}

export const DocumentPdfPreview: React.FC<DocumentPdfPreviewProps> = ({
  title,
  markdownContent,
  content,
  subject = 'Fisika',
  grade = 10,
  level = 'SMA',
  semester = 'Ganjil',
  docType = 'modul_ajar',
  teacherName,
  fileNamePrefix,
}) => {
  const [viewMode, setViewMode] = useState<'pdf' | 'raw'>('pdf');
  const [widthMode, setWidthMode] = useState<'standard' | 'full'>('full');
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const rawMarkdown = ExportService.cleanDocumentMarkdown(markdownContent || content || '');
  const schoolProfile = StorageService.getSchoolProfile();
  const effectiveTeacher = teacherName || schoolProfile.teacherName;
  const fileName = fileNamePrefix || `Perangkat_Ajar_${docType}_${subject}_Kls${grade}`;

  const exportOptions = {
    ...schoolProfile,
    teacherName: effectiveTeacher,
    semester: semester as any,
    subject,
    grade,
    level: level as any,
    docType,
  };

  const showNotification = (msg: string) => {
    setDownloadNotice(msg);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 4000);
  };

  const handleManualSave = () => {
    const docItem = {
      id: `ai-doc-${Date.now()}`,
      type: docType as any,
      title: title || `RPM - ${subject} Kelas ${grade} (${semester})`,
      level: level as any,
      grade: Number(grade) || 10,
      subject,
      semester: (semester === 'Genap' ? 'Genap' : 'Ganjil') as any,
      content: rawMarkdown,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    StorageService.saveAIDocument(docItem);
    setSavedSuccess(true);
    showNotification('Dokumen RPM berhasil disimpan ke Riwayat & Bank Dokumen!');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    showNotification('Teks dokumen berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    showNotification('Membuka dokumen PDF siap cetak / simpan...');
    ExportService.printPdfPreview(title, rawMarkdown, exportOptions);
  };

  const handleExportWord = () => {
    showNotification(`Mengunduh berkas Word: ${fileName}.doc`);
    ExportService.exportToWord(title, rawMarkdown, exportOptions, fileName);
  };

  const handleExportExcel = () => {
    showNotification(`Mengunduh berkas Excel: ${fileName}.xlsx`);
    ExportService.exportCurriculumToExcel(rawMarkdown, title, exportOptions, fileName);
  };

  const handleExportAll = () => {
    showNotification('Mengunduh paket dokumen lengkap (Word & Excel)...');
    ExportService.exportToWord(title, rawMarkdown, exportOptions, `${fileName}_Word`);
    setTimeout(() => {
      ExportService.exportCurriculumToExcel(rawMarkdown, title, exportOptions, `${fileName}_Excel`);
    }, 500);
  };

  const renderedHtml = ExportService.markdownToHtml(rawMarkdown);
  const phase = String(grade) === '10' ? 'E' : Number(grade) > 10 ? 'F' : 'D';

  const contentComponent = (
    <div className="flex flex-col h-full bg-white">
      {/* Direct Download Banner */}
      <div className="bg-slate-50 p-3.5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 className="text-sm font-bold text-slate-900">
                Dokumen Selesai Disusun
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih format dokumen untuk langsung mengunduh ke perangkat Anda:
            </p>
          </div>

          {/* Direct Download & Save Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Simpan ke Bank Dokumen */}
            <button
              type="button"
              onClick={handleManualSave}
              className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-1.5 transition ${
                savedSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="Simpan dokumen ini ke Riwayat & Bank Dokumen perangkat ajar"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Tersimpan ✓' : 'Simpan Dokumen'}</span>
            </button>

            {/* Download Word */}
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition"
              title="Download langsung ke format Microsoft Word (.doc) yang dapat diedit"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Word (.doc)</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition"
              title="Download / Simpan berkas PDF resmi ber-Kop Sekolah"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Download Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition"
              title="Download langsung ke format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>

            {/* Download All Package */}
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition"
              title="Unduh sekaligus format Word dan Excel"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Unduh Semua Format</span>
            </button>
          </div>
        </div>

        {/* Download notification feedback */}
        {downloadNotice && (
          <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}
      </div>

      {/* Secondary Controls & View Mode Selector */}
      <div className="bg-white border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1 ${
                viewMode === 'pdf'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Tata Letak Cetak A4</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1 ${
                viewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Teks Mentah</span>
            </button>
          </div>

          {viewMode === 'pdf' && (
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-700">
              <button
                onClick={() => setZoom((z) => Math.max(70, z - 10))}
                className="p-1 hover:text-slate-900 disabled:opacity-30"
                title="Zoom Out"
                disabled={zoom <= 70}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 font-bold">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(140, z + 10))}
                className="p-1 hover:text-slate-900 disabled:opacity-30"
                title="Zoom In"
                disabled={zoom >= 140}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="text-[10px] text-slate-500 hover:text-slate-900 ml-1 px-1 border-l border-slate-300"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center space-x-2 text-xs">
          {viewMode === 'pdf' && (
            <button
              onClick={() => setWidthMode((w) => (w === 'full' ? 'standard' : 'full'))}
              className={`px-2.5 py-1 rounded border transition flex items-center space-x-1 font-medium ${
                widthMode === 'full'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={widthMode === 'full' ? 'Beralih ke Lebar A4 Standar' : 'Beralih ke Tampilan Lebar Penuh'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{widthMode === 'full' ? 'Lebar Penuh' : 'A4 Standar'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center space-x-1 font-medium"
            title="Salin Seluruh Teks Dokumen"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Lihat Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-slate-100">
        {viewMode === 'pdf' ? (
          /* A4 Sheet Print Preview Container */
          <div className="flex justify-center">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className={`pdf-document-sheet w-full ${widthMode === 'full' ? 'max-w-6xl' : 'max-w-4xl'} bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-10 md:p-12 border border-slate-300 text-left relative my-2 transition-all duration-200`}
            >
              <style>{`
                .pdf-document-sheet {
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  font-size: 9.5pt;
                  line-height: 1.6;
                  color: #0f172a;
                }
                .pdf-document-sheet .kop {
                  text-align: center;
                  border-bottom: 4px double #020617;
                  padding-bottom: 10px;
                  margin-bottom: 16px;
                }
                .pdf-document-sheet .kop h3 {
                  margin: 0;
                  font-size: 10.5pt;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  color: #1e293b;
                }
                .pdf-document-sheet .kop h1 {
                  margin: 4px 0 2px 0;
                  font-size: 16pt;
                  font-weight: 900;
                  text-transform: uppercase;
                  color: #020617;
                  letter-spacing: 0.5px;
                }
                .pdf-document-sheet .kop p {
                  margin: 2px 0;
                  font-size: 8.5pt;
                  color: #475569;
                }
                .pdf-document-sheet .title-box {
                  text-align: center;
                  margin: 16px 0 18px 0;
                }
                .pdf-document-sheet .title {
                  font-size: 13pt;
                  font-weight: 900;
                  color: #020617;
                  margin: 0;
                  text-transform: uppercase;
                  text-decoration: underline;
                  letter-spacing: 0.5px;
                }
                .pdf-document-sheet .fase-badge {
                  display: inline-block;
                  margin-top: 6px;
                  padding: 3px 12px;
                  background-color: #eef2ff;
                  color: #312e81;
                  border: 1px solid #c7d2fe;
                  border-radius: 9999px;
                  font-size: 8pt;
                  font-weight: 700;
                  letter-spacing: 0.3px;
                }
                .pdf-document-sheet .meta-table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  font-size: 8.5pt;
                  margin-bottom: 20px;
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  overflow: hidden;
                }
                .pdf-document-sheet .meta-table td {
                  padding: 7px 12px;
                  border: none;
                  color: #1e293b;
                  vertical-align: middle;
                  border-bottom: 1px solid #f1f5f9;
                }
                .pdf-document-sheet .meta-table tr:last-child td {
                  border-bottom: none;
                }
                .pdf-document-sheet .content {
                  font-size: 9.5pt;
                  line-height: 1.65;
                  color: #0f172a;
                }
                .pdf-document-sheet .content p {
                  margin: 8px 0;
                  text-align: justify;
                }
                .pdf-document-sheet table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 14px 0;
                  font-size: 8.5pt;
                  border: 1px solid #334155;
                }
                .pdf-document-sheet tr {
                  page-break-inside: avoid;
                }
                .pdf-document-sheet th, .pdf-document-sheet td {
                  border: 1px solid #cbd5e1;
                  padding: 6px 8px;
                  vertical-align: top;
                }
                .pdf-document-sheet th {
                  background-color: #1e3a8a;
                  color: #ffffff;
                  font-weight: bold;
                  text-align: center;
                  border: 1px solid #1e3a8a;
                }
                .pdf-document-sheet .katex {
                  font-size: 1.05em;
                }
                .pdf-document-sheet .katex-block {
                  margin: 12px 0;
                  padding: 8px;
                  background: #f8fafc;
                  border-radius: 6px;
                  border: 1px solid #cbd5e1;
                }
                .pdf-document-sheet table.signature-table,
                .pdf-document-sheet table.ttd-table,
                .pdf-document-sheet .signature-table td,
                .pdf-document-sheet .signature-table th,
                .pdf-document-sheet .ttd-table td,
                .pdf-document-sheet .ttd-table th {
                  border: none !important;
                  background-color: transparent !important;
                  box-shadow: none !important;
                }
                .pdf-document-sheet .ttd-box {
                  margin-top: 36px;
                  padding-top: 16px;
                  border-top: 1px solid #e2e8f0;
                  display: flex;
                  justify-content: space-between;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                .pdf-document-sheet .ttd-col {
                  text-align: center;
                  width: 45%;
                  font-size: 9pt;
                  color: #0f172a;
                  line-height: 1.4;
                }
                .pdf-document-sheet .ttd-col p {
                  margin: 2px 0;
                }
                .pdf-document-sheet .ttd-space {
                  height: 60px;
                }
              `}</style>

              {/* Official Kop Surat */}
              <div className="kop">
                <h3>PEMERINTAH DAERAH PROVINSI / KABUPATEN</h3>
                <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                <h1>{schoolProfile.schoolName}</h1>
                <p>NPSN: {schoolProfile.npsn} | Alamat: {schoolProfile.address} | Email: {schoolProfile.email || 'info@sekolah.sch.id'}</p>
              </div>

              {/* Document Title */}
              <div className="title-box">
                <div className="title">{title}</div>
                <div className="fase-badge">Kurikulum Berbasis Deep Learning (Fase {phase})</div>
              </div>

              {/* Rendered HTML Document Content (Menggunakan Identitas & Lembar Pengesahan Resmi yang Dibuat Langsung Oleh Aplikasi) */}
              <div
                className="content"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        ) : (
          /* Raw Markdown View */
          <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
            {rawMarkdown}
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex flex-col p-2 sm:p-4">
        <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-xl">
          {contentComponent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      {contentComponent}
    </div>
  );
};

