import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Layers,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { StudentExcelUtils, ParseExcelResult, ParsedStudentItem } from '../lib/studentExcelUtils';
import { StorageService } from '../lib/storage';

interface StudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultClassId?: string;
  defaultClassName?: string;
}

export const StudentExcelImportModal: React.FC<StudentExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultClassId,
  defaultClassName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace_by_class' | 'replace_all'>('merge');
  const [activeSheetFilter, setActiveSheetFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = (mode: 'all' | 'single' = 'all') => {
    if (mode === 'single' && defaultClassId) {
      StudentExcelUtils.downloadTemplate(defaultClassId);
    } else {
      StudentExcelUtils.downloadTemplate();
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsProcessing(true);
    setParseResult(null);
    setSuccessMessage(null);

    const result = await StudentExcelUtils.parseExcelFile(file);
    setParseResult(result);
    setIsProcessing(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (!parseResult || !parseResult.success || parseResult.students.length === 0) return;

    setIsProcessing(true);
    try {
      const summary = StudentExcelUtils.commitImport(parseResult.students, importMode);

      setSuccessMessage(
        `Sukses! Berhasil mengimpor ${summary.createdStudents} siswa ke dalam sistem${
          summary.newClassesCreated > 0 ? ` dan membuat ${summary.newClassesCreated} rombel kelas baru` : ''
        }.`
      );

      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      alert('Gagal mengimpor siswa: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParseResult(null);
    setSuccessMessage(null);
    onClose();
  };

  const filteredStudents =
    parseResult?.students.filter((s) => {
      if (activeSheetFilter === 'all') return true;
      return s.sheetName === activeSheetFilter || s.className === activeSheetFilter;
    }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Import Data Siswa (Excel)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Multi-Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Format kolom: NO, NISN/NIS, Nama Siswa, dan Kelas.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Guidelines & Download Template Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-800 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Format Template Excel:</span>
              </div>
              <p className="text-slate-600 text-xs">
                Kolom standar: <strong>NO</strong>, <strong>NISN/NIS</strong> (opsional), <strong>Nama Siswa</strong>, dan <strong>Kelas</strong>. Multi-sheet per kelas didukung.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('all')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template (.xlsx)</span>
              </button>

              {defaultClassId && (
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('single')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                >
                  <span>Kelas Ini</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          {!parseResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Tarik file Excel ke sini atau klik untuk memilih file
                </p>
                <p className="text-[11px] text-slate-500">
                  Mendukung .xlsx, .xls, .csv (Single / Multi-Sheet)
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isProcessing && !successMessage && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Membaca file Excel...</p>
            </div>
          )}

          {/* Error Message if Parsing Failed */}
          {parseResult && !parseResult.success && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-rose-800 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Gagal Mengimpor File Excel:</span>
              </div>
              <ul className="list-disc list-inside text-rose-700 space-y-0.5 ml-2">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setSelectedFile(null);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Pilih File Lain
                </button>
              </div>
            </div>
          )}

          {/* Parse Result & Preview */}
          {parseResult && parseResult.success && (
            <div className="space-y-3">
              {/* Summary Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500">Total Siswa</div>
                  <div className="text-base font-bold text-slate-900">
                    {parseResult.totalStudents} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500">Jumlah Sheet</div>
                  <div className="text-base font-bold text-slate-900">
                    {parseResult.sheetCount} <span className="text-xs font-normal text-slate-500">Sheet</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500">Kelas Terdeteksi</div>
                  <div className="text-base font-bold text-slate-900">
                    {parseResult.classesDetected.length} <span className="text-xs font-normal text-slate-500">Kelas</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500">Kelas Baru</div>
                  <div className="text-base font-bold text-blue-600">
                    {parseResult.classesDetected.filter((c) => c.isNew).length}{' '}
                    <span className="text-xs font-normal text-slate-500">Akan dibuat</span>
                  </div>
                </div>
              </div>

              {/* Detected Classes Chips */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-[11px] font-semibold text-slate-600 px-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setActiveSheetFilter('all')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition ${
                    activeSheetFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Semua ({parseResult.totalStudents})
                </button>
                {parseResult.classesDetected.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveSheetFilter(c.name)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                      activeSheetFilter === c.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] px-1 bg-slate-100 rounded text-slate-600">
                      {c.studentCount}
                    </span>
                    {c.isNew && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">Baru</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden max-h-56 overflow-y-auto shadow-sm">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">No</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">NISN / NIS</th>
                      <th className="py-2 px-3 text-center">L/P</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Sheet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center font-mono text-slate-500">{s.no || idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{s.name}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600 text-[11px]">
                          {s.nisn || '-'} / {s.nis || '-'}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="text-slate-600 font-semibold">{s.gender}</span>
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium">
                            {s.className}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 text-[11px] font-mono">{s.sheetName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Options */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-800">Metode Penyimpanan Data Siswa:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label
                    className={`p-2 rounded-lg border cursor-pointer transition text-xs flex items-start space-x-2 ${
                      importMode === 'merge'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-semibold">Tambahkan (Merge)</div>
                      <div className="text-[10px] text-slate-500">
                        Menambahkan siswa baru tanpa menghapus data yang ada.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-2 rounded-lg border cursor-pointer transition text-xs flex items-start space-x-2 ${
                      importMode === 'replace_by_class'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace_by_class'}
                      onChange={() => setImportMode('replace_by_class')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div className="font-semibold">Gantikan per Rombel</div>
                      <div className="text-[10px] text-slate-500">
                        Memperbarui siswa hanya untuk kelas dalam file ini.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-2 rounded-lg border cursor-pointer transition text-xs flex items-start space-x-2 ${
                      importMode === 'replace_all'
                        ? 'bg-rose-50 border-rose-500 text-rose-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace_all'}
                      onChange={() => setImportMode('replace_all')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <div className="font-semibold">Gantikan Semua</div>
                      <div className="text-[10px] text-slate-500">
                        Mengosongkan semua data siswa dan mengganti dengan file ini.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {parseResult && (
              <button
                type="button"
                onClick={() => {
                  setParseResult(null);
                  setSelectedFile(null);
                }}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 transition"
              >
                Pilih Ulang File
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300"
            >
              Tutup
            </button>

            {parseResult && parseResult.success && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCommitImport}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan {parseResult.totalStudents} Siswa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
