import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Award,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Printer,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Save,
  Search,
  Download,
  Upload,
} from 'lucide-react';
import { Student, ClassRoom } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { StudentExcelImportModal } from '../components/StudentExcelImportModal';
import { StudentExcelUtils } from '../lib/studentExcelUtils';

interface StudentIncident {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  category: 'Prestasi' | 'Pelanggaran' | 'Bimbingan Konseling' | 'Kesehatan' | 'Keluarga';
  description: string;
  followUp: string;
  handledBy: string;
}

export const GuruWaliView: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'c1');
  const [activeTab, setActiveTab] = useState<'siswa' | 'catatan_bk' | 'rekap'>('siswa');
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId || s.className === selectedClass?.name);

  // Incidents / Guidance notes
  const [incidents, setIncidents] = useState<StudentIncident[]>([]);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incStudentName, setIncStudentName] = useState(classStudents[0]?.name || '');
  const [incDate, setIncDate] = useState(new Date().toISOString().substring(0, 10));
  const [incCat, setIncCat] = useState<StudentIncident['category']>('Prestasi');
  const [incDesc, setIncDesc] = useState('');
  const [incFollowUp, setIncFollowUp] = useState('');

  useEffect(() => {
    if (classStudents.length > 0) {
      setIncStudentName(classStudents[0].name);
    }
  }, [selectedClassId, students.length]);

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: StudentIncident = {
      id: `inc-${Date.now()}`,
      studentId: 'std-custom',
      studentName: incStudentName,
      date: incDate,
      category: incCat,
      description: incDesc,
      followUp: incFollowUp,
      handledBy: 'Wali Kelas',
    };
    setIncidents([newInc, ...incidents]);
    setShowIncidentModal(false);
    setIncDesc('');
    setIncFollowUp('');
  };

  const handleDeleteIncident = (id: string) => {
    setIncidents(incidents.filter((i) => i.id !== id));
  };

  // Exports
  const handleExportExcel = () => {
    const data = classStudents.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      'Nama Siswa': s.name,
      'L/P': s.gender,
      'Nama Orang Tua / Wali': s.parentName || '-',
      'No. Kontak / WA': s.parentPhone || '-',
      Alamat: s.address || '-',
    }));
    ExportService.exportToExcel(data, `Data_Binaan_WaliKelas_${selectedClass?.name}`);
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    classStudents.forEach((s, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${s.nis}</td>
          <td><strong>${s.name}</strong></td>
          <td style="text-align:center;">${s.gender}</td>
          <td>${s.parentName || '-'}</td>
          <td>${s.parentPhone || '-'}</td>
          <td>${s.address || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <div style="margin-bottom:15px;">
        <strong>Kelas Binaan:</strong> ${selectedClass?.name} | <strong>Jumlah Siswa:</strong> ${classStudents.length} Orang
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th>NIS</th>
            <th>Nama Lengkap Siswa</th>
            <th>L/P</th>
            <th>Nama Orang Tua/Wali</th>
            <th>Kontak / WA</th>
            <th>Alamat</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.exportToWord(`BUKU INDUK WALI KELAS - ${selectedClass?.name}`, bodyHtml, schoolProfile, `Wali_Kelas_${selectedClass?.name}`);
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    classStudents.forEach((s, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${s.nis}</td>
          <td><strong>${s.name}</strong></td>
          <td style="text-align:center;">${s.gender}</td>
          <td>${s.parentName || '-'}</td>
          <td>${s.parentPhone || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <div style="margin-bottom:10px;">
        <strong>Daftar Anggota Kelas Binaan:</strong> ${selectedClass?.name} (${classStudents.length} Siswa)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th>NIS</th>
            <th>Nama Siswa</th>
            <th>L/P</th>
            <th>Orang Tua/Wali</th>
            <th>No. Telepon / WA</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.printPdfPreview(`LAPORAN WALI KELAS - ${selectedClass?.name}`, bodyHtml, schoolProfile);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Buku Catatan Guru Wali (Wali Kelas)</h1>
            <p className="text-xs text-slate-500">
              Pengelolaan siswa binaan, pemantauan karakter profil pelajar Pancasila, catatan konseling, dan prestasi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => StudentExcelUtils.downloadTemplate(selectedClassId)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            title="Unduh Template Excel Siswa (NO, NISN/NIS, Nama Siswa, Kelas)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Template Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            title="Import data siswa dari template Excel (.xlsx)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Siswa Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Word</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Class Selector & Tab Nav */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 font-semibold">Kelas Binaan:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-bold"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'siswa' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Siswa ({classStudents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('catatan_bk')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'catatan_bk' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Catatan BK & Prestasi ({incidents.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeTab === 'siswa' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Daftar Anggota Kelas Binaan</span>
            <span className="text-slate-500 font-medium">Total: {classStudents.length} Siswa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4 w-16 text-center">L/P</th>
                  <th className="py-3 px-4">Orang Tua / Wali</th>
                  <th className="py-3 px-4">Kontak / No. WA</th>
                  <th className="py-3 px-4">Alamat Rumah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl inline-block text-blue-600">
                          <Users className="w-7 h-7 mx-auto" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Data Siswa pada {selectedClass?.name || 'Kelas Ini'}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Anda dapat mengimpor data siswa binaan secara instan menggunakan file Excel template (NO, NISN/NIS, Nama Siswa, Kelas).
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => StudentExcelUtils.downloadTemplate(selectedClassId)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>Unduh Template (.xlsx)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsExcelImportModalOpen(true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Import File Excel</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.nis}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.gender}</td>
                      <td className="py-3 px-4 text-slate-700">{s.parentName || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{s.parentPhone || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{s.address || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATATAN BK & PRESTASI */}
      {activeTab === 'catatan_bk' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Catatan Khusus Siswa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                        inc.category === 'Prestasi'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inc.category === 'Bimbingan Konseling'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inc.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{inc.studentName}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteIncident(inc.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-700 space-y-2">
                  <p className="font-medium text-slate-800">{inc.description}</p>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong className="text-blue-700">Tindak Lanjut:</strong> {inc.followUp}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>📅 Tanggal: {inc.date}</span>
                    <span>Penangan: {inc.handledBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Incident */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Prestasi / Bimbingan Siswa</h3>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Siswa</label>
                <select
                  value={incStudentName}
                  onChange={(e) => setIncStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori</label>
                  <select
                    value={incCat}
                    onChange={(e) => setIncCat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Prestasi">Prestasi Siswa</option>
                    <option value="Bimbingan Konseling">Bimbingan Konseling</option>
                    <option value="Pelanggaran">Pelanggaran Tata Tertib</option>
                    <option value="Kesehatan">Kesehatan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi Kejadian / Uraian</label>
                <textarea
                  rows={3}
                  required
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Jelaskan secara detail peristiwa atau prestasi yang diraih..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tindak Lanjut / Solusi</label>
                <textarea
                  rows={2}
                  required
                  value={incFollowUp}
                  onChange={(e) => setIncFollowUp(e.target.value)}
                  placeholder="Langkah pendampingan, penghargaan, atau mediasi..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Excel Import Modal */}
      <StudentExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={() => {
          setStudents(StorageService.getStudents());
          setClasses(StorageService.getClasses());
        }}
        defaultClassId={selectedClassId}
        defaultClassName={selectedClass?.name}
      />
    </div>
  );
};
