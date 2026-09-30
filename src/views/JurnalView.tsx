import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Save,
  AlertTriangle,
  Sparkles,
  Layers,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { JournalItem, ClassRoom, CPDistributionPlan, AttendanceRecord, Student } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_LIST } from '../lib/curriculumData';
import { OfflineAdminNotice } from '../components/OfflineSyncIndicator';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

export const JurnalView: React.FC = () => {
  const [journals, setJournals] = useState<JournalItem[]>(() => StorageService.getJournal());
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [cpPlans, setCpPlans] = useState<CPDistributionPlan[]>(() => StorageService.getCPDistributions());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<JournalItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  // Form states
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [className, setClassName] = useState(() => {
    const prof = StorageService.getSchoolProfile();
    return classes[0]?.name || `${prof.level || 'SMA'} Kelas ${prof.grade || 10} (${prof.phase || 'Fase E'})`;
  });
  const [subject, setSubject] = useState(() => {
    const prof = StorageService.getSchoolProfile();
    const master = StorageService.getActiveMasterCP();
    return prof.subject || master?.subject || (classes[0]?.level === 'SD' ? 'Guru Kelas (Tematik/IPAS)' : 'Fisika');
  });
  const [material, setMaterial] = useState('');
  const [tpCovered, setTpCovered] = useState('');
  const [learningProgress, setLearningProgress] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [solution, setSolution] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');

  // Attendance counts in Journal
  const [hadir, setHadir] = useState<number>(32);
  const [sakit, setSakit] = useState<number>(0);
  const [izin, setIzin] = useState<number>(0);
  const [alpa, setAlpa] = useState<number>(0);
  const [bolos, setBolos] = useState<number>(0);
  const [absentNames, setAbsentNames] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    setClasses(StorageService.getClasses());
    setStudents(StorageService.getStudents());
    setAttendanceList(StorageService.getAttendance());
    setCpPlans(StorageService.getCPDistributions());
  }, [showModal]);

  useEffect(() => {
    const handleSync = () => {
      const prof = StorageService.getSchoolProfile();
      const master = StorageService.getActiveMasterCP();
      if (prof.subject || master?.subject) {
        setSubject(prof.subject || master?.subject || 'Fisika');
      }
      setCpPlans(StorageService.getCPDistributions());
    };
    window.addEventListener('curriculum-parameters-synced', handleSync);
    window.addEventListener('school-profile-updated', handleSync);
    return () => {
      window.removeEventListener('curriculum-parameters-synced', handleSync);
      window.removeEventListener('school-profile-updated', handleSync);
    };
  }, []);

  // Extract all available TPs from master CP plans
  const availableTPs = cpPlans.flatMap((plan) => [
    ...plan.materialsSem1.map((m) => ({
      subject: plan.subject,
      level: plan.level,
      grade: plan.grade,
      tpCode: m.tpCode,
      tpName: m.tpName,
      essentialMaterial: m.essentialMaterial,
      deepLearning: m.deepLearningMethod,
    })),
    ...plan.materialsSem2.map((m) => ({
      subject: plan.subject,
      level: plan.level,
      grade: plan.grade,
      tpCode: m.tpCode,
      tpName: m.tpName,
      essentialMaterial: m.essentialMaterial,
      deepLearning: m.deepLearningMethod,
    })),
  ]);

  const handleSelectQuickTP = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    const found = availableTPs.find((tp) => tp.tpCode === selectedCode);
    if (found) {
      setTpCovered(`${found.tpCode}: ${found.tpName}`);
      if (found.essentialMaterial) {
        setMaterial(found.essentialMaterial);
      }
      if (found.subject && !subject) {
        setSubject(found.subject);
      }
      if (!learningProgress) {
        setLearningProgress(
          `Peserta didik aktif mempelajari materi "${found.essentialMaterial}" melalui pendekatan ${
            found.deepLearning || 'Deep Learning (Mindful, Meaningful, Joyful)'
          }.`
        );
      }
    }
  };

  // Auto-sync attendance data from Absensi records
  const handleAutoSyncAttendance = (targetClass: string, targetDate: string) => {
    const allAttendance = StorageService.getAttendance();
    const allStudents = StorageService.getStudents();
    const classStudents = allStudents.filter(
      (s) => s.className === targetClass || s.classId === classes.find((c) => c.name === targetClass)?.id
    );
    const totalClassSize = classStudents.length > 0 ? classStudents.length : 32;

    const matchedRecord = allAttendance.find(
      (a) => (a.className === targetClass || a.classId === classes.find((c) => c.name === targetClass)?.id) && a.date === targetDate
    );

    if (matchedRecord && matchedRecord.records && matchedRecord.records.length > 0) {
      let sCount = 0;
      let iCount = 0;
      let aCount = 0;
      let bCount = 0;
      let hCount = 0;
      const nonPresentNames: string[] = [];

      matchedRecord.records.forEach((r) => {
        const noteLower = (r.notes || '').toLowerCase();
        const isBolos = noteLower.includes('bolos') || noteLower.includes('kabur') || noteLower.includes('keluar kelas');

        if (isBolos) {
          bCount += 1;
          nonPresentNames.push(`${r.studentName} (Bolos${r.notes ? ': ' + r.notes : ''})`);
        } else if (r.status === 'S') {
          sCount += 1;
          nonPresentNames.push(`${r.studentName} (Sakit${r.notes ? ': ' + r.notes : ''})`);
        } else if (r.status === 'I') {
          iCount += 1;
          nonPresentNames.push(`${r.studentName} (Izin${r.notes ? ': ' + r.notes : ''})`);
        } else if (r.status === 'A') {
          aCount += 1;
          nonPresentNames.push(`${r.studentName} (Alpa${r.notes ? ': ' + r.notes : ''})`);
        } else {
          hCount += 1;
        }
      });

      setHadir(hCount);
      setSakit(sCount);
      setIzin(iCount);
      setAlpa(aCount);
      setBolos(bCount);
      setAbsentNames(nonPresentNames.join(', '));
      setSyncFeedback(`Berhasil disinkronkan dari Absensi Kelas: Hadir ${hCount}, Sakit ${sCount}, Izin ${iCount}, Alpa ${aCount}, Bolos ${bCount}`);
    } else {
      // Set reasonable defaults if no specific attendance record is found yet
      setHadir(totalClassSize);
      setSakit(0);
      setIzin(0);
      setAlpa(0);
      setBolos(0);
      setAbsentNames('');
      setSyncFeedback(`Data absensi tanggal ${targetDate} belum diisi di menu Absensi. Nilai kehadiran diatur default (Total ${totalClassSize} siswa).`);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const today = new Date().toISOString().substring(0, 10);
    const initialClass = classes[0]?.name || 'X SMA 1 (Fase E)';
    const initialSubj = classes[0]?.level === 'SD' ? 'Guru Kelas (Tematik/IPAS)' : 'Bahasa Indonesia';
    const allStudents = StorageService.getStudents();
    const classStudents = allStudents.filter((s) => s.className === initialClass);
    const totalClassSize = classStudents.length > 0 ? classStudents.length : 32;

    setDate(today);
    setClassName(initialClass);
    setSubject(initialSubj);
    setMaterial('');
    setTpCovered('');
    setLearningProgress('');
    setObstacles('');
    setSolution('');
    setTeacherNotes('');
    setSupervisorNotes('');
    setHadir(totalClassSize);
    setSakit(0);
    setIzin(0);
    setAlpa(0);
    setBolos(0);
    setAbsentNames('');
    setSyncFeedback(null);
    setShowModal(true);

    // Try auto-syncing if today's attendance exists
    handleAutoSyncAttendance(initialClass, today);
  };

  const handleOpenEdit = (item: JournalItem) => {
    setEditingItem(item);
    setDate(item.date);
    setClassName(item.className);
    setSubject(item.subject);
    setMaterial(item.material || item.materi || '');
    setTpCovered(item.tpCovered);
    setLearningProgress(item.learningProgress);
    setObstacles(item.obstacles);
    setSolution(item.solution);
    setTeacherNotes(item.teacherNotes);
    setSupervisorNotes(item.supervisorNotes || '');
    setHadir(item.hadir !== undefined ? item.hadir : 32);
    setSakit(item.sakit || 0);
    setIzin(item.izin || 0);
    setAlpa(item.alpa || 0);
    setBolos(item.bolos || 0);
    setAbsentNames(item.absentNames || '');
    setSyncFeedback(null);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: JournalItem[];
    if (editingItem) {
      updated = journals.map((j) =>
        j.id === editingItem.id
          ? {
              ...j,
              date,
              className,
              subject,
              material: material || j.material || '',
              materi: material || j.materi || '',
              tpCovered,
              learningProgress,
              obstacles,
              solution,
              teacherNotes,
              supervisorNotes,
              hadir: Number(hadir),
              sakit: Number(sakit),
              izin: Number(izin),
              alpa: Number(alpa),
              bolos: Number(bolos),
              absentNames: absentNames.trim(),
            }
          : j
      );
    } else {
      const newItem: JournalItem = {
        id: `jr-${Date.now()}`,
        date,
        className,
        subject,
        material: material.trim(),
        materi: material.trim(),
        tpCovered,
        learningProgress,
        obstacles,
        solution,
        teacherNotes,
        signatureVerified: true,
        supervisorNotes: supervisorNotes || 'Telah diperiksa dan diverifikasi.',
        hadir: Number(hadir),
        sakit: Number(sakit),
        izin: Number(izin),
        alpa: Number(alpa),
        bolos: Number(bolos),
        absentNames: absentNames.trim(),
      };
      updated = [newItem, ...journals];
    }

    setJournals(updated);
    StorageService.saveJournal(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus entri jurnal ini?')) {
      const updated = journals.filter((j) => j.id !== id);
      setJournals(updated);
      StorageService.saveJournal(updated);
    }
  };

  // Filtered journals
  const filteredJournals = journals.filter((j) => {
    const matchClass = filterClass === 'ALL' || j.className === filterClass;
    const matchSearch =
      searchTerm === '' ||
      j.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.material || j.materi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.tpCovered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.absentNames || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.date.includes(searchTerm);
    return matchClass && matchSearch;
  });

  // Calculate cumulative stats
  const totalSakit = journals.reduce((acc, curr) => acc + (curr.sakit || 0), 0);
  const totalIzin = journals.reduce((acc, curr) => acc + (curr.izin || 0), 0);
  const totalAlpa = journals.reduce((acc, curr) => acc + (curr.alpa || 0), 0);
  const totalBolos = journals.reduce((acc, curr) => acc + (curr.bolos || 0), 0);
  const totalTidakHadir = totalSakit + totalIzin + totalAlpa + totalBolos;

  // Exports
  const handleExportExcel = () => {
    const exportData = filteredJournals.map((j, idx) => ({
      No: idx + 1,
      Tanggal: j.date,
      Kelas: j.className,
      'Mata Pelajaran': j.subject,
      'Materi yang Diajarkan': j.material || j.materi || '-',
      'Tujuan Pembelajaran (TP)': j.tpCovered,
      'Hadir (H)': j.hadir ?? '-',
      'Sakit (S)': j.sakit || 0,
      'Izin (I)': j.izin || 0,
      'Alpa (A)': j.alpa || 0,
      'Bolos (B)': j.bolos || 0,
      'Total Tidak Hadir': (j.sakit || 0) + (j.izin || 0) + (j.alpa || 0) + (j.bolos || 0),
      'Rincian Siswa Tidak Hadir / Keterangan': j.absentNames || '-',
      'Ketercapaian / Kemajuan Belajar': j.learningProgress,
      'Hambatan / Kendala': j.obstacles || '-',
      'Solusi / Pemecahan Masalah': j.solution || '-',
      'Catatan Guru': j.teacherNotes || '-',
      'Status Verifikasi': j.signatureVerified ? 'Terverifikasi' : 'Belum Diverifikasi',
    }));
    ExportService.exportToExcel(exportData, 'Jurnal_Mengajar_Guru');
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    filteredJournals.forEach((j, idx) => {
      const s = j.sakit || 0;
      const i = j.izin || 0;
      const a = j.alpa || 0;
      const b = j.bolos || 0;
      const h = j.hadir !== undefined ? j.hadir : '-';
      const absentInfo = j.absentNames ? `<br/><small style="color:#64748b; font-style:italic;">Ket: ${j.absentNames}</small>` : '';

      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${j.date}</td>
          <td><strong>${j.className}</strong><br><small>${j.subject}</small></td>
          <td><strong>${j.material || j.materi || '-'}</strong><br><small><strong>TP:</strong> ${j.tpCovered}</small></td>
          <td style="text-align:center; font-size:11px;">
            <strong>H:${h}</strong> | S:${s} | I:${i} | <span style="color:#b91c1c; font-weight:bold;">A:${a}</span> | <span style="color:#7c3aed; font-weight:bold;">B:${b}</span>
            ${absentInfo}
          </td>
          <td>${j.learningProgress}</td>
          <td><strong style="color:#b91c1c;">Kendala:</strong> ${j.obstacles || '-'}<br><strong style="color:#15803d;">Solusi:</strong> ${j.solution || '-'}</td>
          <td>${j.teacherNotes || '-'}</td>
          <td style="text-align:center;"><strong>${j.signatureVerified ? 'VALID' : '-'}</strong></td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th style="width:75px;">Tanggal</th>
            <th style="width:105px;">Kelas & Mapel</th>
            <th>Materi Pokok & TP</th>
            <th style="width:130px;">Absensi (H/S/I/A/B)</th>
            <th>Ketercapaian Belajar</th>
            <th>Kendala & Solusi</th>
            <th>Catatan</th>
            <th style="width:50px;">Paraf</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.exportToWord('JURNAL HARIAN MENGAJAR GURU', bodyHtml, schoolProfile, 'Jurnal_Mengajar_Guru');
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    filteredJournals.forEach((j, idx) => {
      const s = j.sakit || 0;
      const i = j.izin || 0;
      const a = j.alpa || 0;
      const b = j.bolos || 0;
      const h = j.hadir !== undefined ? j.hadir : '-';
      const absentInfo = j.absentNames ? `<br/><small style="color:#64748b;">(${j.absentNames})</small>` : '';

      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${j.date}</td>
          <td><strong>${j.className}</strong><br><small>${j.subject}</small></td>
          <td><strong>${j.material || j.materi || '-'}</strong><br><small>TP: ${j.tpCovered}</small></td>
          <td style="text-align:center; font-size:10px;">
            H:${h} | S:${s} | I:${i} | <strong>A:${a}</strong> | <strong>B:${b}</strong>
            ${absentInfo}
          </td>
          <td>${j.learningProgress}</td>
          <td><strong>K:</strong> ${j.obstacles || '-'}<br><strong>S:</strong> ${j.solution || '-'}</td>
          <td>${j.teacherNotes || '-'}</td>
          <td style="text-align:center;">${j.signatureVerified ? '✓' : '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:28px;">No</th>
            <th style="width:70px;">Tanggal</th>
            <th style="width:100px;">Kelas/Mapel</th>
            <th>Materi & Capaian TP</th>
            <th style="width:125px;">Kehadiran</th>
            <th>Hasil Kemajuan</th>
            <th>Kendala & Solusi</th>
            <th>Catatan</th>
            <th style="width:40px;">Paraf</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.printPdfPreview('JURNAL HARIAN MENGAJAR GURU', bodyHtml, schoolProfile);
  };

  return (
    <div className="space-y-5">
      {/* Offline Storage Notice */}
      <OfflineAdminNotice menuTitle="Jurnal Harian Mengajar Guru" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Jurnal Harian Mengajar Guru</h1>
            <p className="text-xs text-slate-500">
              Dokumentasi materi ajar, capaian TP, rekapitulasi kehadiran (Sakit, Izin, Alpa, Bolos), kendala kelas, dan solusi pedagogik.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            <span>Cetak / PDF</span>
          </button>
          <button
            id="btn-add-journal"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tulis Jurnal Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Jurnal</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{journals.length}</div>
          <p className="text-[11px] text-slate-400">Pertemuan tercatat</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Sakit (S)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-bold text-amber-600">{totalSakit}</div>
          <p className="text-[11px] text-slate-400">Siswa izin sakit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Izin (I)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          </div>
          <div className="text-xl font-bold text-sky-600">{totalIzin}</div>
          <p className="text-[11px] text-slate-400">Izin keperluan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Alpa (A)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-xl font-bold text-rose-600">{totalAlpa}</div>
          <p className="text-[11px] text-slate-400">Tanpa keterangan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Bolos (B)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          </div>
          <div className="text-xl font-bold text-purple-600">{totalBolos}</div>
          <p className="text-[11px] text-slate-400">Keluar kelas/bolos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Absen</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">{totalTidakHadir}</div>
          <p className="text-[11px] text-slate-400">Akumulasi ketidakhadiran</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi, TP, tanggal, kelas, atau nama siswa absen..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Kelas / Rombel</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Journal Cards List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs space-y-2 shadow-sm">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>Belum ada catatan jurnal mengajar yang sesuai filter.</p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tulis Jurnal Sekarang</span>
            </button>
          </div>
        ) : (
          filteredJournals.map((j) => {
            const sakitCount = j.sakit || 0;
            const izinCount = j.izin || 0;
            const alpaCount = j.alpa || 0;
            const bolosCount = j.bolos || 0;
            const hadirCount = j.hadir !== undefined ? j.hadir : '-';

            return (
              <div
                key={j.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-4 shadow-sm"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {j.className}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {j.subject}
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Paraf Terverifikasi</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">📅 {j.date}</span>
                    <div className="flex space-x-1 pl-2">
                      <button
                        onClick={() => handleOpenEdit(j)}
                        title="Edit Jurnal"
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(j.id)}
                        title="Hapus Jurnal"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Materi yang Diajarkan & TP Covered */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Materi Box */}
                  <div className="md:col-span-6 bg-amber-50/60 p-3.5 rounded-lg border border-amber-200/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                      <Layers className="w-3.5 h-3.5 text-amber-700" />
                      <span>Materi yang Diajarkan / Pokok Bahasan:</span>
                    </div>
                    <p className="text-xs text-slate-900 font-semibold">
                      {j.material || j.materi || '(Materi belum ditentukan)'}
                    </p>
                  </div>

                  {/* TP Box */}
                  <div className="md:col-span-6 bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-200/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tujuan Pembelajaran (TP) yang Dicapai:</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">
                      {j.tpCovered}
                    </p>
                  </div>
                </div>

                {/* Kehadiran / Absensi Siswa Bar */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span>Rekapitulasi Kehadiran Siswa Pertemuan Ini:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Hadir: {hadirCount}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold border ${sakitCount > 0 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Sakit: {sakitCount}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold border ${izinCount > 0 ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Izin: {izinCount}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold border ${alpaCount > 0 ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Alpa: {alpaCount}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold border ${bolosCount > 0 ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Bolos: {bolosCount}
                      </span>
                    </div>
                  </div>

                  {j.absentNames && (
                    <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200 flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-slate-800">Rincian Siswa Tidak Hadir / Bolos:</strong> {j.absentNames}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress / Hasil Belajar */}
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Hasil & Kemajuan Belajar Siswa:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {j.learningProgress}
                  </p>
                </div>

                {/* Obstacle vs Solution Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> Kendala / Hambatan di Kelas:
                    </span>
                    <p className="text-slate-700">{j.obstacles || 'Tidak ada kendala berarti.'}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Solusi & Tindak Lanjut Pedagogik:
                    </span>
                    <p className="text-slate-700">{j.solution || 'Pembelajaran berjalan lancar dan interaktif.'}</p>
                  </div>
                </div>

                {/* Teacher Notes & Supervisor Notes */}
                {(j.teacherNotes || j.supervisorNotes) && (
                  <div className="flex flex-col sm:flex-row gap-2 text-[11px] text-slate-600 pt-1">
                    {j.teacherNotes && (
                      <div className="flex-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Catatan Guru:</strong> {j.teacherNotes}
                      </div>
                    )}
                    {j.supervisorNotes && (
                      <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Catatan Verifikasi:</strong> {j.supervisorNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit Journal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingItem ? 'Edit Jurnal Harian Mengajar' : 'Tulis Jurnal Harian Mengajar Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Row 1: Tanggal, Kelas, Mapel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal KBM</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      handleAutoSyncAttendance(className, e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pilih Kelas / Rombel</label>
                  <select
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      handleAutoSyncAttendance(e.target.value, date);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                    {!classes.some((c) => c.name === className) && (
                      <option value={className}>{className} (Kustom)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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

              {/* Quick TP Picker */}
              {availableTPs.length > 0 && (
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-blue-800 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Cepat Tujuan Pembelajaran & Materi (Bank TP Master):</span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={handleSelectQuickTP}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih TP dari Bank Data Pembagian Materi CP --</option>
                    {availableTPs.map((tp, idx) => (
                      <option key={`${tp.tpCode}-${idx}`} value={tp.tpCode}>
                        [{tp.tpCode}] {tp.subject} - {tp.essentialMaterial}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Materi yang Diajarkan & TP Covered */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Materi yang Diajarkan / Pokok Bahasan</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Contoh: Pengukuran Besaran Fisika & Angka Penting..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capaian / Tujuan Pembelajaran (TP) yang Diajarkan</label>
                  <textarea
                    rows={2}
                    required
                    value={tpCovered}
                    onChange={(e) => setTpCovered(e.target.value)}
                    placeholder="Contoh: TP.10.1: Mengidentifikasi macam-macam alat ukur besaran panjang dan mengolah data hasil pengukuran..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Rekapitulasi Kehadiran Siswa (Sakit, Izin, Alpa, Bolos, Hadir) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Rekapitulasi Jumlah Kehadiran Siswa:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoSyncAttendance(className, date)}
                    className="flex items-center space-x-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tarik Data dari Absensi Kelas</span>
                  </button>
                </div>

                {syncFeedback && (
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    ℹ️ {syncFeedback}
                  </p>
                )}

                {/* 5 Attendance Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Hadir */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                    <label className="block text-[10px] font-bold text-emerald-800">🟢 Hadir (H)</label>
                    <input
                      type="number"
                      min={0}
                      value={hadir}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => setHadir(parseNumberInput(e.target.value, 0, 0, 100))}
                      className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-md text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Sakit */}
                  <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 space-y-1">
                    <label className="block text-[10px] font-bold text-amber-800">🟡 Sakit (S)</label>
                    <input
                      type="number"
                      min={0}
                      value={sakit}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => setSakit(parseNumberInput(e.target.value, 0, 0, 100))}
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded-md text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Izin */}
                  <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200 space-y-1">
                    <label className="block text-[10px] font-bold text-sky-800">🔵 Izin (I)</label>
                    <input
                      type="number"
                      min={0}
                      value={izin}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => setIzin(parseNumberInput(e.target.value, 0, 0, 100))}
                      className="w-full px-2 py-1 bg-white border border-sky-300 rounded-md text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {/* Alpa */}
                  <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 space-y-1">
                    <label className="block text-[10px] font-bold text-rose-800">🔴 Alpa (A)</label>
                    <input
                      type="number"
                      min={0}
                      value={alpa}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => setAlpa(parseNumberInput(e.target.value, 0, 0, 100))}
                      className="w-full px-2 py-1 bg-white border border-rose-300 rounded-md text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Bolos */}
                  <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 space-y-1 col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-purple-800">🟣 Bolos (B)</label>
                    <input
                      type="number"
                      min={0}
                      value={bolos}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => setBolos(parseNumberInput(e.target.value, 0, 0, 100))}
                      className="w-full px-2 py-1 bg-white border border-purple-300 rounded-md text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rincian Nama Siswa Tidak Hadir / Keterangan Bolos (Opsional)
                  </label>
                  <input
                    type="text"
                    value={absentNames}
                    onChange={(e) => setAbsentNames(e.target.value)}
                    placeholder="Contoh: Ahmad Faisal (Sakit), Siti Rahma (Izin), Dedi (Alpa), Rian (Bolos di jam ke-2)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hasil & Kemajuan Belajar Siswa</label>
                <textarea
                  rows={2}
                  required
                  value={learningProgress}
                  onChange={(e) => setLearningProgress(e.target.value)}
                  placeholder="Kemajuan pemahaman konsep dan capaian asesmen formatif siswa..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kendala / Masalah yang Ditemui</label>
                  <textarea
                    rows={2}
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    placeholder="Kendala pemahaman, sarana, atau perilaku di kelas..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Solusi / Pemecahan Masalah</label>
                  <textarea
                    rows={2}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Tindakan korektif guru, scaffolding, atau penguatan..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan Guru</label>
                  <input
                    type="text"
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Catatan suasana kelas atau perlengkapan sarana..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Catatan Verifikasi Supervisor / Kepsek</label>
                  <input
                    type="text"
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    placeholder="Telah diperiksa dan diverifikasi..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Jurnal Mengajar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
