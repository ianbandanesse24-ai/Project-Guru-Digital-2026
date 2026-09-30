import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserX,
  FileSpreadsheet,
  FileText,
  Printer,
  Plus,
  Save,
  Check,
  Search,
  UserPlus,
  Download,
  Upload,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, ClassRoom, Student } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_LIST } from '../lib/curriculumData';
import { OfflineAdminNotice } from '../components/OfflineSyncIndicator';
import { StudentExcelImportModal } from '../components/StudentExcelImportModal';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';
import { StudentExcelUtils } from '../lib/studentExcelUtils';

export const AbsensiView: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'c1');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
  const [subject, setSubject] = useState<string>('Bahasa Indonesia');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualClassName, setManualClassName] = useState('');
  const [showManualClassModal, setShowManualClassModal] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Quick add student modal state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentNisn, setNewStudentNisn] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(
    (s) => s.classId === selectedClassId || (selectedClass && (!s.classId || s.classId === selectedClass.id) && s.className === selectedClass.name)
  );

  // Active attendance state
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize statuses and notes whenever selectedClassId, selectedDate, or meetingNumber changes
  useEffect(() => {
    const existing = attendanceList.find(
      (a) =>
        (a.classId === selectedClassId || (selectedClass && a.className === selectedClass.name)) &&
        a.date === selectedDate &&
        a.meetingNumber === Number(meetingNumber)
    );

    const initialStatuses: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};

    classStudents.forEach((s) => {
      if (existing) {
        const rec = existing.records.find((r) => r.studentId === s.id || r.studentName === s.name);
        initialStatuses[s.id] = rec ? rec.status : 'H';
        initialNotes[s.id] = rec?.notes || '';
      } else {
        initialStatuses[s.id] = 'H';
        initialNotes[s.id] = '';
      }
    });

    setStatuses(initialStatuses);
    setNotes(initialNotes);
  }, [selectedClassId, selectedClass?.name, selectedDate, meetingNumber, students.length, classStudents.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSetAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => (updated[s.id] = 'H'));
    setStatuses(updated);
  };

  const handleQuickAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const generatedNis = newStudentNis.trim() || String(2025000 + students.length + 1);
    const generatedNisn = newStudentNisn.trim() || `0089${String(100000 + students.length + 1)}`;

    const createdStudent = StorageService.addStudent({
      name: newStudentName.trim(),
      nis: generatedNis,
      nisn: generatedNisn,
      gender: newStudentGender,
      classId: selectedClassId,
      className: selectedClass?.name || 'Kelas',
      parentPhone: '081234567890',
      address: 'Alamat Siswa',
    });

    const updatedStudents = StorageService.getStudents();
    setStudents(updatedStudents);

    // Set initial status for new student
    setStatuses((prev) => ({ ...prev, [createdStudent.id]: 'H' }));

    setNewStudentName('');
    setNewStudentNis('');
    setNewStudentNisn('');
    setShowAddStudentModal(false);
  };

  // Calculate live summary
  const summary = {
    hadir: Object.values(statuses).filter((v) => v === 'H').length,
    sakit: Object.values(statuses).filter((v) => v === 'S').length,
    izin: Object.values(statuses).filter((v) => v === 'I').length,
    alpa: Object.values(statuses).filter((v) => v === 'A').length,
    total: classStudents.length,
  };
  const presentPct = summary.total > 0 ? Math.round((summary.hadir / summary.total) * 1000) / 10 : 100;

  const handleSaveAttendance = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: selectedDate,
      classId: selectedClassId,
      className: selectedClass?.name || 'Kelas',
      subject: subject,
      meetingNumber: Number(meetingNumber),
      semester: schoolProfile.semester,
      academicYear: schoolProfile.academicYear,
      records: classStudents.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        status: statuses[s.id] || 'H',
        notes: notes[s.id] || '',
      })),
      summary: {
        ...summary,
        presentPercentage: presentPct,
      },
    };

    const updated = [newRecord, ...attendanceList.filter((a) => !(a.date === selectedDate && a.className === selectedClass?.name && a.meetingNumber === Number(meetingNumber)))];
    setAttendanceList(updated);
    StorageService.saveAttendance(updated);

    StorageService.addAccessLog({
      userId: 'active-user',
      userEmail: 'guru@belajar.id',
      userName: 'Guru Pengampu',
      userRole: 'guru',
      action: 'Simpan Absensi Siswa',
      details: `Menyimpan presensi ${selectedClass?.name} (${selectedDate}, Pertemuan ke-${meetingNumber}) - Kehadiran: ${presentPct}%.`,
      status: 'success',
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddManualClass = () => {
    if (!manualClassName.trim()) return;
    const newClass: ClassRoom = {
      id: `c-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: manualClassName.trim(),
      level: 'SMA',
      grade: 10,
      academicYear: StorageService.getSchoolProfile().academicYear,
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    StorageService.saveClasses(updated);
    setSelectedClassId(newClass.id);
    setManualClassName('');
    setShowManualClassModal(false);
  };

  // Export handlers
  const handleExportExcel = () => {
    const exportData = classStudents.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      'Nama Siswa': s.name,
      'L/P': s.gender,
      'Status Kehadiran': statuses[s.id] === 'H' ? 'Hadir' : statuses[s.id] === 'S' ? 'Sakit' : statuses[s.id] === 'I' ? 'Izin' : 'Alpa',
      Keterangan: notes[s.id] || '-',
    }));
    ExportService.exportToExcel(exportData, `Rekap_Absensi_${selectedClass?.name}_${selectedDate}`);
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rowsHtml = '';
    classStudents.forEach((s, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${s.nis}</td>
          <td><strong>${s.name}</strong></td>
          <td style="text-align:center;">${s.gender}</td>
          <td style="text-align:center; font-weight:bold;">${statuses[s.id] || 'H'}</td>
          <td>${notes[s.id] || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <div style="margin-bottom:15px;">
        <table style="border:none; width:100%; margin:0;">
          <tr><td style="border:none; width:150px;"><strong>Mata Pelajaran</strong></td><td style="border:none;">: ${subject}</td></tr>
          <tr><td style="border:none;"><strong>Kelas / Fase</strong></td><td style="border:none;">: ${selectedClass?.name}</td></tr>
          <tr><td style="border:none;"><strong>Hari / Tanggal</strong></td><td style="border:none;">: ${selectedDate}</td></tr>
          <tr><td style="border:none;"><strong>Pertemuan Ke-</strong></td><td style="border:none;">: ${meetingNumber}</td></tr>
          <tr><td style="border:none;"><strong>Persentase Kehadiran</strong></td><td style="border:none;">: <strong>${presentPct}%</strong> (H:${summary.hadir}, S:${summary.sakit}, I:${summary.izin}, A:${summary.alpa})</td></tr>
        </table>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="width:100px;">NIS</th>
            <th>Nama Lengkap Peserta Didik</th>
            <th style="width:50px;">L/P</th>
            <th style="width:80px;">Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    ExportService.exportToWord(
      `DAFTAR HADIR SISWA - ${selectedClass?.name}`,
      bodyHtml,
      schoolProfile,
      `Daftar_Hadir_${selectedClass?.name}_${selectedDate}`
    );
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rowsHtml = '';
    classStudents.forEach((s, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${s.nis}</td>
          <td><strong>${s.name}</strong></td>
          <td style="text-align:center;">${s.gender}</td>
          <td style="text-align:center; font-weight:bold;">${statuses[s.id] || 'H'}</td>
          <td>${notes[s.id] || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <div style="margin-bottom:12px; font-size:9.5pt;">
        <div><strong>Mata Pelajaran:</strong> ${subject} | <strong>Kelas:</strong> ${selectedClass?.name}</div>
        <div><strong>Tanggal Presensi:</strong> ${selectedDate} | <strong>Pertemuan Ke:</strong> ${meetingNumber}</div>
        <div><strong>Rekapitulasi:</strong> Hadir: ${summary.hadir}, Sakit: ${summary.sakit}, Izin: ${summary.izin}, Alpa: ${summary.alpa} (Tingkat Kehadiran: ${presentPct}%)</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th style="width:90px;">NIS</th>
            <th>Nama Peserta Didik</th>
            <th style="width:40px;">L/P</th>
            <th style="width:70px;">Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    ExportService.printPdfPreview(`PRESENSI KELAS ${selectedClass?.name}`, bodyHtml, schoolProfile);
  };

  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Presensi & Absensi Siswa</h1>
              <p className="text-xs text-slate-500">
                Pencatatan kehadiran harian siswa dan ekspor rekapitulasi (Excel, Word, Cetak).
              </p>
            </div>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => StudentExcelUtils.downloadTemplate(selectedClassId)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            title="Unduh Template Excel Siswa"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Template</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            title="Import data siswa dari template Excel (.xlsx)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            title="Ekspor ke Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            title="Ekspor ke Word"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Word</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            title="Cetak Presensi"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Pilih Kelas</label>
            <div className="flex space-x-1.5">
              <select
                id="select-class-absensi"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowManualClassModal(true)}
                title="Tambah Kelas Manual"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tanggal Pertemuan</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Pertemuan Ke-</label>
            <input
              type="number"
              min="1"
              max="40"
              value={meetingNumber}
              onFocus={handleNumberInputFocus}
              onChange={(e) => setMeetingNumber(parseNumberInput(e.target.value, 1, 1, 40))}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {SUBJECT_LIST.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
              {!SUBJECT_LIST.includes(subject) && <option value={subject}>{subject} (Kustom)</option>}
            </select>
          </div>
        </div>

        {/* Live Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-200">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Hadir (H)
            </span>
            <span className="text-sm font-bold text-emerald-900">{summary.hadir}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-blue-600" /> Sakit (S)
            </span>
            <span className="text-sm font-bold text-blue-900">{summary.sakit}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Izin (I)
            </span>
            <span className="text-sm font-bold text-amber-900">{summary.izin}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 flex items-center">
              <UserX className="w-3.5 h-3.5 mr-1 text-rose-600" /> Alpa (A)
            </span>
            <span className="text-sm font-bold text-rose-900">{summary.alpa}</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Kehadiran</span>
            <span className="text-sm font-bold text-blue-600">{presentPct}%</span>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau NIS siswa..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center space-x-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Siswa</span>
            </button>
            <button
              onClick={handleSetAllPresent}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
            >
              Set Semua Hadir
            </button>
            <button
              id="btn-save-attendance"
              onClick={handleSaveAttendance}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm transition"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Presensi</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center">No</th>
                <th className="py-2.5 px-3.5 w-28">NIS</th>
                <th className="py-2.5 px-3.5">Nama Siswa</th>
                <th className="py-2.5 px-3.5 w-14 text-center">L/P</th>
                <th className="py-2.5 px-3.5 w-60 text-center">Status Presensi</th>
                <th className="py-2.5 px-3.5">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-xs text-slate-500 font-semibold">
                        Belum ada data siswa pada {selectedClass?.name || 'kelas ini'}.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => StudentExcelUtils.downloadTemplate(selectedClassId)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsExcelImportModalOpen(true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import Excel</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const currentStatus = statuses[s.id] || 'H';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-500">{s.nis}</td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3.5 text-center text-slate-500">{s.gender}</td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center justify-center space-x-1">
                          {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(s.id, st)}
                              className={`w-7 h-7 rounded text-xs font-bold transition ${
                                currentStatus === st
                                  ? st === 'H'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'S'
                                    ? 'bg-blue-600 text-white'
                                    : st === 'I'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <input
                          type="text"
                          value={notes[s.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                          placeholder="Keterangan..."
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Tambah Siswa ke {selectedClass?.name}</span>
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Siswa *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIS</label>
                  <input
                    type="text"
                    value={newStudentNis}
                    onChange={(e) => setNewStudentNis(e.target.value)}
                    placeholder={`Contoh: ${2025000 + students.length + 1}`}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NISN</label>
                  <input
                    type="text"
                    value={newStudentNisn}
                    onChange={(e) => setNewStudentNisn(e.target.value)}
                    placeholder="Contoh: 0089123456"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin</label>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="quick-gender"
                      checked={newStudentGender === 'L'}
                      onChange={() => setNewStudentGender('L')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Laki-Laki (L)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="quick-gender"
                      checked={newStudentGender === 'P'}
                      onChange={() => setNewStudentGender('P')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Perempuan (P)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Class Creation Modal */}
      {showManualClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-4 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold text-slate-900">Tambah Kelas Manual</h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Nama Kelas (Contoh: X MIPA 3)</label>
              <input
                type="text"
                autoFocus
                value={manualClassName}
                onChange={(e) => setManualClassName(e.target.value)}
                placeholder="X MIPA 3..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowManualClassModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleAddManualClass}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
              >
                Tambah
              </button>
            </div>
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
