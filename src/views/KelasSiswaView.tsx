import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  Printer,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  Filter,
  UserCheck,
  Building,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { ClassRoom, Student, SchoolLevel } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { OfflineAdminNotice } from '../components/OfflineSyncIndicator';
import { StudentExcelImportModal } from '../components/StudentExcelImportModal';
import { StudentExcelUtils } from '../lib/studentExcelUtils';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

export const KelasSiswaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'kelas'>('siswa');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Excel Import Modal state
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState<boolean>(false);

  // Modal states for Student
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    nis: '',
    nisn: '',
    gender: 'L' as 'L' | 'P',
    classId: '',
    parentPhone: '',
    address: '',
  });

  // Batch import student state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchClassId, setBatchClassId] = useState<string>('');
  const [batchText, setBatchText] = useState<string>('');
  const [startNis, setStartNis] = useState<string>('2025001');

  // Modal states for Class
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: '',
    level: 'SMA' as SchoolLevel,
    grade: 10,
    academicYear: '2025/2026',
    homeroomTeacher: '',
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedClasses = StorageService.getClasses();
    const loadedStudents = StorageService.getStudents();
    setClasses(loadedClasses);
    setStudents(loadedStudents);
    if (loadedClasses.length > 0 && !studentFormData.classId) {
      setStudentFormData((prev) => ({ ...prev, classId: loadedClasses[0].id }));
      setBatchClassId(loadedClasses[0].id);
    }
  };

  const showNotif = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // --- Student Operations ---
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    const defaultClassId = selectedClassFilter !== 'all' && selectedClassFilter ? selectedClassFilter : (classes[0]?.id || '');
    setStudentFormData({
      name: '',
      nis: `2025${String(students.length + 1).padStart(3, '0')}`,
      nisn: `0089${String(Date.now()).substring(9)}`,
      gender: 'L',
      classId: defaultClassId,
      parentPhone: '0812',
      address: '',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentFormData({
      name: student.name,
      nis: student.nis,
      nisn: student.nisn,
      gender: student.gender,
      classId: student.classId,
      parentPhone: student.parentPhone || '',
      address: student.address || '',
    });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.name.trim() || !studentFormData.classId) {
      alert('Nama Siswa dan Pilihan Kelas wajib diisi.');
      return;
    }

    const selectedClass = classes.find((c) => c.id === studentFormData.classId);
    const className = selectedClass ? selectedClass.name : 'Kelas Umum';

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...studentFormData,
        className,
      };
      StorageService.updateStudent(updated);
      showNotif(`Data siswa "${updated.name}" berhasil diperbarui.`);
    } else {
      const newStudent = StorageService.addStudent({
        ...studentFormData,
        className,
      });
      showNotif(`Siswa baru "${newStudent.name}" berhasil ditambahkan.`);
    }

    loadData();
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa "${student.name}"?`)) {
      StorageService.deleteStudent(student.id);
      loadData();
      showNotif(`Siswa "${student.name}" telah dihapus.`);
    }
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim() || !batchClassId) {
      alert('Pilih kelas dan tempel daftar nama siswa.');
      return;
    }

    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Tidak ada baris nama yang valid.');
      return;
    }

    const selectedClass = classes.find((c) => c.id === batchClassId);
    const className = selectedClass ? selectedClass.name : 'Kelas Umum';

    const baseNisNumber = parseInt(startNis) || 2025001;

    const newStudentsData = lines.map((line, idx) => {
      // Clean leading numbering if user pasted like "1. Ahmad", "2) Budi"
      const cleanName = line.replace(/^\d+[\.\)\-\s]+/, '').trim();
      const nis = String(baseNisNumber + idx);
      const nisn = `0089${String(100000 + idx)}`;
      return {
        name: cleanName,
        nis,
        nisn,
        gender: (idx % 2 === 0 ? 'L' : 'P') as 'L' | 'P',
        classId: batchClassId,
        className,
        parentPhone: '081234567890',
        address: 'Alamat Siswa',
      };
    });

    StorageService.batchAddStudents(newStudentsData);
    loadData();
    setIsBatchModalOpen(false);
    setBatchText('');
    showNotif(`Berhasil menambahkan ${newStudentsData.length} siswa baru sekaligus!`);
  };

  // --- Class Operations ---
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassFormData({
      name: '',
      level: 'SMA',
      grade: 10,
      academicYear: '2025/2026',
      homeroomTeacher: '',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassFormData({
      name: cls.name,
      level: cls.level,
      grade: cls.grade,
      academicYear: cls.academicYear,
      homeroomTeacher: cls.homeroomTeacher || '',
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name.trim()) {
      alert('Nama Kelas wajib diisi.');
      return;
    }

    if (editingClass) {
      const updated: ClassRoom = {
        ...editingClass,
        ...classFormData,
      };
      StorageService.updateClass(updated);
      showNotif(`Data kelas "${updated.name}" berhasil diperbarui.`);
    } else {
      const newClass = StorageService.addClass(classFormData);
      showNotif(`Kelas baru "${newClass.name}" berhasil dibuat.`);
    }

    loadData();
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (cls: ClassRoom) => {
    const studentCount = students.filter((s) => s.classId === cls.id).length;
    if (studentCount > 0) {
      if (
        !confirm(
          `Kelas "${cls.name}" memiliki ${studentCount} siswa terdaftar. Jika kelas ini dihapus, siswa tidak akan memiliki kelas aktif. Lanjutkan?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Hapus kelas "${cls.name}"?`)) return;
    }

    StorageService.deleteClass(cls.id);
    loadData();
    showNotif(`Kelas "${cls.name}" telah dihapus.`);
  };

  // Filtered Students
  const activeClassObj = classes.find((c) => c.id === selectedClassFilter);
  const filteredStudents = students.filter((s) => {
    const matchesClass =
      selectedClassFilter === 'all' ||
      s.classId === selectedClassFilter ||
      (activeClassObj && s.className === activeClassObj.name);
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const exportStudentsExcel = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      'Nama Siswa': s.name,
      NIS: s.nis,
      NISN: s.nisn,
      'L/P': s.gender,
      Kelas: s.className,
      'No. HP Ortu': s.parentPhone || '-',
      Alamat: s.address || '-',
    }));
    ExportService.exportToExcel(exportData, `Daftar_Siswa_${selectedClassFilter !== 'all' ? selectedClassFilter : 'Semua'}`);
  };

  const handlePrintStudents = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Data Master: Kelas & Siswa</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data rombel kelas, penginputan nama siswa & NISN, serta import Excel terintegrasi.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'siswa'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Siswa ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kelas')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'kelas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Data Kelas ({classes.length})</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DATA SISWA */}
      {/* ========================================================================= */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, NIS, atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none font-medium"
                >
                  <option value="all">Semua Kelas ({students.length})</option>
                  {classes.map((c) => {
                    const count = students.filter((s) => s.classId === c.id || s.className === c.name).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count} siswa)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => StudentExcelUtils.downloadTemplate(selectedClassFilter !== 'all' ? selectedClassFilter : undefined)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
                title="Unduh Template Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Template Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExcelImportModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                title="Import data siswa dari Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Input Manual</span>
              </button>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Tempel teks nama siswa"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Paste Batch</span>
              </button>

              <button
                onClick={exportStudentsExcel}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                title="Ekspor Data Siswa ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor</span>
              </button>

              <button
                onClick={handlePrintStudents}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                title="Cetak"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5 w-12 text-center">No</th>
                    <th className="py-2.5 px-3.5">Nama Lengkap Siswa</th>
                    <th className="py-2.5 px-3.5">NIS / NISN</th>
                    <th className="py-2.5 px-3.5 text-center">L/P</th>
                    <th className="py-2.5 px-3.5">Kelas</th>
                    <th className="py-2.5 px-3.5">No. HP Ortu</th>
                    <th className="py-2.5 px-3.5">Alamat</th>
                    <th className="py-2.5 px-3.5 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              s.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                            }`}
                          >
                            {s.gender}
                          </span>
                          <span>{s.name}</span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600">
                          <div>{s.nis}</div>
                          <div className="text-[10px] text-slate-400">{s.nisn}</div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {s.gender === 'L' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                            {s.className}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">{s.parentPhone || '-'}</td>
                        <td className="py-2.5 px-3.5 text-slate-500 max-w-[180px] truncate" title={s.address}>
                          {s.address || '-'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s)}
                              className="p-1 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Tidak ada siswa ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATA KELAS / ROMBEL */}
      {/* ========================================================================= */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Rombongan Belajar (Rombel) Kelas</h2>
              <p className="text-xs text-slate-500">Kelola ruang kelas, tingkat pendidikan, dan penugasan wali kelas.</p>
            </div>
            <button
              onClick={handleOpenAddClass}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((cls) => {
              const studentCount = students.filter((s) => s.classId === cls.id).length;
              const maleCount = students.filter((s) => s.classId === cls.id && s.gender === 'L').length;
              const femaleCount = students.filter((s) => s.classId === cls.id && s.gender === 'P').length;

              return (
                <div
                  key={cls.id}
                  className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {cls.level} • Tingkat {cls.grade}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{cls.name}</h3>
                      <p className="text-xs text-slate-500">TP: {cls.academicYear}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Wali Kelas:</span>
                      <span className="font-semibold text-slate-900">{cls.homeroomTeacher || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Total Siswa:</span>
                      <span className="font-bold text-blue-600">{studentCount} Siswa</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Komposisi:</span>
                      <span>{maleCount} L / {femaleCount} P</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClassFilter(cls.id);
                      setActiveTab('siswa');
                    }}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka Siswa Kelas Ini</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT / EDIT SISWA MANUAL */}
      {/* ========================================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs">{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Manual'}</h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky"
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    placeholder="2025001"
                    value={studentFormData.nis}
                    onChange={(e) => setStudentFormData({ ...studentFormData, nis: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NISN</label>
                  <input
                    type="text"
                    placeholder="0089123456"
                    value={studentFormData.nisn}
                    onChange={(e) => setStudentFormData({ ...studentFormData, nisn: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin *</label>
                  <select
                    value={studentFormData.gender}
                    onChange={(e) => setStudentFormData({ ...studentFormData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kelas *</label>
                  <select
                    value={studentFormData.classId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, classId: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">No. HP Orang Tua</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={studentFormData.parentPhone}
                  onChange={(e) => setStudentFormData({ ...studentFormData, parentPhone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alamat</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Pendidikan No. 12..."
                  value={studentFormData.address}
                  onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH / IMPORT CEPAT SISWA */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs">Import / Tambah Cepat Siswa</h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchImport} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kelas Sasaran *</label>
                  <select
                    value={batchClassId}
                    onChange={(e) => setBatchClassId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mulai NIS</label>
                  <input
                    type="text"
                    value={startNis}
                    onChange={(e) => setStartNis(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tempel Daftar Nama Siswa (1 baris per nama) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`Achmad Dani\nAisyah Putri\nBagas Aditya`}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
                >
                  Import Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT / EDIT KELAS MANUAL */}
      {/* ========================================================================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs">{editingClass ? 'Edit Rombel Kelas' : 'Tambah Kelas Baru'}</h3>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X SMA 1 (Fase E)"
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenjang *</label>
                  <select
                    value={classFormData.level}
                    onChange={(e) => setClassFormData({ ...classFormData, level: e.target.value as SchoolLevel })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tingkat (1-12) *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={classFormData.grade}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => setClassFormData({ ...classFormData, grade: parseNumberInput(e.target.value, 1, 1, 12) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tahun Ajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="2025/2026"
                  value={classFormData.academicYear}
                  onChange={(e) => setClassFormData({ ...classFormData, academicYear: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: Drs. Bambang Sudarsono, M.Si."
                  value={classFormData.homeroomTeacher}
                  onChange={(e) => setClassFormData({ ...classFormData, homeroomTeacher: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal (Multi-Sheet per Kelas) */}
      <StudentExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={() => {
          loadData();
          showNotif('Data siswa dari Excel berhasil disinkronkan!');
        }}
        defaultClassId={selectedClassFilter !== 'all' ? selectedClassFilter : undefined}
      />
    </div>
  );
};
