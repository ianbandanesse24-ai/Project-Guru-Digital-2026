import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  FileSpreadsheet,
  FileText,
  Printer,
  Save,
  BookOpen,
} from 'lucide-react';
import { ScheduleItem, ClassRoom } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_LIST } from '../lib/curriculumData';
import { OfflineAdminNotice } from '../components/OfflineSyncIndicator';

export const JadwalView: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => StorageService.getSchedule());
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [selectedDay, setSelectedDay] = useState<string>('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form states
  const [day, setDay] = useState<ScheduleItem['day']>('Senin');
  const [period, setPeriod] = useState('1 - 2');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('08:50');
  const [className, setClassName] = useState(classes[0]?.name || 'X SMA 1 (Fase E)');
  const [subject, setSubject] = useState('Bahasa Indonesia');
  const [room, setRoom] = useState('R. 101');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setClasses(StorageService.getClasses());
  }, [showModal]);

  const days: ScheduleItem['day'][] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDay('Senin');
    setPeriod('1 - 2');
    setStartTime('07:30');
    setEndTime('08:50');
    setClassName('X SMA 1 (Fase E)');
    setSubject('Bahasa Indonesia');
    setRoom('R. 101');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setDay(item.day);
    setPeriod(item.period);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setClassName(item.className);
    setSubject(item.subject);
    setRoom(item.room);
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: ScheduleItem[];
    if (editingItem) {
      updated = schedules.map((s) =>
        s.id === editingItem.id
          ? {
              ...s,
              day,
              period,
              startTime,
              endTime,
              className,
              subject,
              room,
              notes,
            }
          : s
      );
    } else {
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}`,
        day,
        period,
        startTime,
        endTime,
        className,
        subject,
        room,
        notes,
      };
      updated = [...schedules, newItem];
    }

    setSchedules(updated);
    StorageService.saveSchedule(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jadwal mengajar ini?')) {
      const updated = schedules.filter((s) => s.id !== id);
      setSchedules(updated);
      StorageService.saveSchedule(updated);
    }
  };

  const filteredSchedules =
    selectedDay === 'Semua' ? schedules : schedules.filter((s) => s.day === selectedDay);

  // Exports
  const handleExportExcel = () => {
    const exportData = schedules.map((s, idx) => ({
      No: idx + 1,
      Hari: s.day,
      'Jam Ke': s.period,
      Waktu: `${s.startTime} - ${s.endTime}`,
      'Kelas / Fase': s.className,
      'Mata Pelajaran': s.subject,
      Ruangan: s.room,
      Keterangan: s.notes || '-',
    }));
    ExportService.exportToExcel(exportData, 'Jadwal_Mengajar_Guru');
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    schedules.forEach((s, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${s.day}</strong></td>
          <td style="text-align:center;">${s.period}</td>
          <td style="text-align:center;">${s.startTime} - ${s.endTime}</td>
          <td><strong>${s.className}</strong></td>
          <td>${s.subject}</td>
          <td>${s.room}</td>
          <td>${s.notes || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th>Hari</th>
            <th>Jam Ke</th>
            <th>Waktu</th>
            <th>Kelas</th>
            <th>Mata Pelajaran</th>
            <th>Ruangan</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.exportToWord('JADWAL MENGAJAR GURU', bodyHtml, schoolProfile, 'Jadwal_Mengajar');
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    schedules.forEach((s, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${s.day}</strong></td>
          <td style="text-align:center;">${s.period}</td>
          <td style="text-align:center;">${s.startTime} - ${s.endTime}</td>
          <td><strong>${s.className}</strong></td>
          <td>${s.subject}</td>
          <td>${s.room}</td>
          <td>${s.notes || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th>Hari</th>
            <th>Jam Ke</th>
            <th>Waktu</th>
            <th>Kelas</th>
            <th>Mata Pelajaran</th>
            <th>Ruangan</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.printPdfPreview('JADWAL MENGAJAR MINGGUAN', bodyHtml, schoolProfile);
  };

  return (
    <div className="space-y-5">
      {/* Offline Storage & Cloud Sync Notice */}
      <OfflineAdminNotice menuTitle="Jadwal Mengajar Guru" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Jadwal Mengajar Guru</h1>
            <p className="text-xs text-slate-500">
              Penataan jam pelajaran mingguan, alokasi kelas, ruangan, dan pembagian beban mengajar tatap muka.
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
            id="btn-add-schedule"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Day Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {['Semua', ...days].map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              selectedDay === d
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs shadow-sm">
            Belum ada jadwal mengajar yang terdaftar pada hari ini.
          </div>
        ) : (
          filteredSchedules.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-3 relative group shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {s.day} • Jam {s.period}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{s.subject}</h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  <span>{s.startTime} - {s.endTime} WITA</span>
                </div>
                <div className="flex items-center text-slate-800 font-medium">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  <span>Kelas: {s.className}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span>Ruangan: {s.room}</span>
                </div>
              </div>

              {s.notes && (
                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                  "{s.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              {editingItem ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hari</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Ke-</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="1 - 2"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Kelas / Rombel</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
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

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="R. 101 / Lab Komputer"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Materi pokok atau catatan..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
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
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
