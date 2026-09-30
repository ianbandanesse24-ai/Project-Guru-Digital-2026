import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Save,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { AgendaItem, ClassRoom, CPDistributionPlan } from '../types';
import { StorageService } from '../lib/storage';
import { ExportService } from '../lib/exportUtils';
import { SUBJECT_LIST } from '../lib/curriculumData';
import { OfflineAdminNotice } from '../components/OfflineSyncIndicator';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

export const AgendaView: React.FC = () => {
  const [agendas, setAgendas] = useState<AgendaItem[]>(() => StorageService.getAgenda());
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [cpPlans, setCpPlans] = useState<CPDistributionPlan[]>(() => StorageService.getCPDistributions());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState('07:30 - 08:50');
  const [className, setClassName] = useState(() => {
    const prof = StorageService.getSchoolProfile();
    return classes[0]?.name || `${prof.level || 'SMA'} Kelas ${prof.grade || 10} (${prof.phase || 'Fase E'})`;
  });
  const [subject, setSubject] = useState(() => {
    const prof = StorageService.getSchoolProfile();
    const master = StorageService.getActiveMasterCP();
    return prof.subject || master?.subject || 'Fisika';
  });
  const [meetingNumber, setMeetingNumber] = useState(1);
  const [topic, setTopic] = useState('');
  const [activities, setActivities] = useState('');
  const [studentAttendanceSummary, setStudentAttendanceSummary] = useState('Hadir 12, Sakit 0, Izin 0, Alpa 0 (100%)');
  const [reflection, setReflection] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [status, setStatus] = useState<AgendaItem['status']>('Selesai');

  useEffect(() => {
    setClasses(StorageService.getClasses());
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
      tpCode: m.tpCode,
      tpName: m.tpName,
      essentialMaterial: m.essentialMaterial,
      deepLearning: m.deepLearningMethod,
    })),
    ...plan.materialsSem2.map((m) => ({
      subject: plan.subject,
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
      setTopic(`${found.tpCode}: ${found.essentialMaterial}`);
      if (found.subject && !subject) {
        setSubject(found.subject);
      }
      if (!activities) {
        setActivities(`Pembelajaran berbasis ${found.deepLearning || 'Deep Learning'}. Pendahuluan: apersepsi & pertanyaan pemantik. Inti: eksplorasi materi ${found.essentialMaterial} dan diskusi kolaboratif. Penutup: simpulan & refleksi.`);
      }
      if (!reflection) {
        setReflection(`Peserta didik mampu memahami esensi materi ${found.essentialMaterial} dengan antusias.`);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().substring(0, 10));
    setTime('07:30 - 08:50');
    setClassName('X SMA 1 (Fase E)');
    setSubject('Bahasa Indonesia');
    setMeetingNumber(agendas.length + 1);
    setTopic('');
    setActivities('');
    setStudentAttendanceSummary('Hadir 12, Sakit 0, Izin 0, Alpa 0 (100%)');
    setReflection('');
    setFollowUp('');
    setStatus('Selesai');
    setShowModal(true);
  };

  const handleOpenEdit = (item: AgendaItem) => {
    setEditingItem(item);
    setDate(item.date);
    setTime(item.time);
    setClassName(item.className);
    setSubject(item.subject);
    setMeetingNumber(item.meetingNumber);
    setTopic(item.topic);
    setActivities(item.activities);
    setStudentAttendanceSummary(item.studentAttendanceSummary);
    setReflection(item.reflection);
    setFollowUp(item.followUp);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: AgendaItem[];
    if (editingItem) {
      updated = agendas.map((a) =>
        a.id === editingItem.id
          ? {
              ...a,
              date,
              time,
              className,
              subject,
              meetingNumber,
              topic,
              activities,
              studentAttendanceSummary,
              reflection,
              followUp,
              status,
            }
          : a
      );
    } else {
      const newItem: AgendaItem = {
        id: `ag-${Date.now()}`,
        date,
        time,
        className,
        subject,
        meetingNumber,
        topic,
        activities,
        studentAttendanceSummary,
        reflection,
        followUp,
        status,
      };
      updated = [newItem, ...agendas];
    }

    setAgendas(updated);
    StorageService.saveAgenda(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus catatan agenda ini?')) {
      const updated = agendas.filter((a) => a.id !== id);
      setAgendas(updated);
      StorageService.saveAgenda(updated);
    }
  };

  // Exports
  const handleExportExcel = () => {
    const exportData = agendas.map((a, idx) => ({
      No: idx + 1,
      Tanggal: a.date,
      Waktu: a.time,
      Kelas: a.className,
      'Mata Pelajaran': a.subject,
      'Pertemuan Ke': a.meetingNumber,
      'Materi Pokok / Topik': a.topic,
      'Kegiatan Pembelajaran': a.activities,
      'Rekap Kehadiran': a.studentAttendanceSummary,
      'Refleksi Guru': a.reflection,
      'Tindak Lanjut': a.followUp,
      Status: a.status,
    }));
    ExportService.exportToExcel(exportData, 'Buku_Agenda_Mengajar_Guru');
  };

  const handleExportWord = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    agendas.forEach((a, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${a.date}<br><small>${a.time}</small></td>
          <td><strong>${a.className}</strong><br><small>${a.subject} (Ke-${a.meetingNumber})</small></td>
          <td><strong>${a.topic}</strong><br>${a.activities}</td>
          <td><small>${a.studentAttendanceSummary}</small></td>
          <td><em>${a.reflection}</em><br><strong>TL:</strong> ${a.followUp}</td>
          <td style="text-align:center;"><strong>${a.status}</strong></td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th style="width:90px;">Tanggal/Jam</th>
            <th style="width:120px;">Kelas & Mapel</th>
            <th>Materi & Kegiatan Pembelajaran</th>
            <th style="width:110px;">Presensi</th>
            <th>Refleksi & Tindak Lanjut</th>
            <th style="width:70px;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.exportToWord('BUKU AGENDA HARIAN MENGAJAR GURU', bodyHtml, schoolProfile, 'Agenda_Mengajar_Guru');
  };

  const handlePrintPdf = () => {
    const schoolProfile = StorageService.getSchoolProfile();
    let rows = '';
    agendas.forEach((a, idx) => {
      rows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${a.date}<br><small>${a.time}</small></td>
          <td><strong>${a.className}</strong><br><small>${a.subject} (P-${a.meetingNumber})</small></td>
          <td><strong>${a.topic}</strong><br>${a.activities}</td>
          <td><small>${a.studentAttendanceSummary}</small></td>
          <td><em>${a.reflection}</em></td>
          <td style="text-align:center;">${a.status}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th style="width:85px;">Tanggal</th>
            <th style="width:110px;">Kelas/Mapel</th>
            <th>Materi & Aktivitas</th>
            <th style="width:100px;">Presensi</th>
            <th>Refleksi Guru</th>
            <th style="width:60px;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    ExportService.printPdfPreview('AGENDA MENGAJAR GURU', bodyHtml, schoolProfile);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Agenda Mengajar Guru</h1>
            <p className="text-xs text-slate-500">
              Dokumentasi aktivitas pembelajaran harian, materi pokok, refleksi kelas, dan catatan tindak lanjut.
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
            id="btn-add-agenda"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Agenda</span>
          </button>
        </div>
      </div>

      {/* Agenda Items List */}
      <div className="space-y-3">
        {agendas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            Belum ada catatan agenda mengajar. Klik "+ Catat Agenda" untuk menambahkan.
          </div>
        ) : (
          agendas.map((a) => (
            <div
              key={a.id}
              className="bg-white p-4 rounded-xl border border-slate-200 transition space-y-3 shadow-sm hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Pertemuan ke-{a.meetingNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    {a.className} • {a.subject}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      a.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{a.date} ({a.time})</span>
                  <div className="flex space-x-1 pl-2 border-l border-slate-200">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900">{a.topic}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.activities}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1 text-blue-600" /> Refleksi Guru:
                  </span>
                  <p className="text-slate-700 text-xs italic">{a.reflection || 'Tidak ada catatan refleksi.'}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Tindak Lanjut:
                  </span>
                  <p className="text-slate-700 text-xs">{a.followUp || 'Tidak ada catatan tindak lanjut.'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Agenda */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-3.5 shadow-xl max-h-[90vh] overflow-y-auto text-slate-800">
            <h3 className="text-xs font-bold text-slate-900">
              {editingItem ? 'Edit Agenda Mengajar' : 'Catat Agenda Mengajar Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Mengajar</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="07:30 - 08:50"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pilih Kelas / Rombel</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
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
                  <label className="block text-slate-700 font-semibold mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min="0"
                    value={meetingNumber}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) => {
                      setMeetingNumber(parseNumberInput(e.target.value, 0, 0, 100));
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
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

              {availableTPs.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1 text-blue-700 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Cepat Topik / TP dari Master CP:</span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={handleSelectQuickTP}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih Topik dari Bank Materi CP --</option>
                    {availableTPs.map((tp, idx) => (
                      <option key={`${tp.tpCode}-${idx}`} value={tp.tpCode}>
                        [{tp.tpCode}] {tp.subject} - {tp.essentialMaterial}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Topik / Materi Pokok</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Analisis Teks Laporan Hasil Observasi"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kegiatan Pembelajaran yang Dilaksanakan</label>
                <textarea
                  rows={3}
                  required
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="Uraikan aktivitas pendahuluan, inti, dan penutup..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Refleksi Pembelajaran</label>
                  <textarea
                    rows={2}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Catatan respon siswa & kendala..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tindak Lanjut</label>
                  <textarea
                    rows={2}
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Tugas mandiri / pengayaan..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Agenda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
