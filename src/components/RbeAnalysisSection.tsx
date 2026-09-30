import React from 'react';
import {
  Table,
  Calculator,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { KalenderSemesterPlan } from '../types';
import { handleNumberInputFocus, parseNumberInput } from '../lib/inputUtils';

interface RbeAnalysisSectionProps {
  activeSemData: KalenderSemesterPlan;
  selectedSemester: 'Ganjil' | 'Genap';
  jpPerWeek: number;
  totalEffJP: number;
  reserveJP: number;
  kbmEffJP: number;
  handleMonthChange: (
    semester: 'semester1' | 'semester2',
    monthIndex: number,
    field: 'totalWeeks' | 'nonEffectiveWeeks' | 'description',
    val: string
  ) => void;
  onExportWord: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onNavigate?: (view: any) => void;
}

export const RbeAnalysisSection: React.FC<RbeAnalysisSectionProps> = ({
  activeSemData,
  selectedSemester,
  jpPerWeek,
  totalEffJP,
  reserveJP,
  kbmEffJP,
  handleMonthChange,
  onExportWord,
  onExportExcel,
  onPrint,
  onNavigate,
}) => {
  return (
    <div className="space-y-5">
      {/* Quick Metrics KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Total Pekan Semester
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{activeSemData.totalWeeks}</span>
            <span className="text-xs text-slate-500">Pekan</span>
          </div>
          <p className="text-[11px] text-slate-400">Juli s.d. Des / Jan s.d. Jun</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            2. Pekan Tidak Efektif
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-700">{activeSemData.nonEffectiveWeeks}</span>
            <span className="text-xs text-rose-600">Pekan</span>
          </div>
          <p className="text-[11px] text-rose-600/80">MPLS, STS, SAS, Rapor & Libur</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            3. Pekan Efektif KBM (RBE)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">{activeSemData.totalEffectiveWeeks}</span>
            <span className="text-xs text-emerald-600 font-bold">Pekan</span>
          </div>
          <p className="text-[11px] text-emerald-600/80">Analisis Kaldik Terverifikasi</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            4. Total Alokasi Jam (JP)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-700">{totalEffJP}</span>
            <span className="text-xs text-blue-600">JP</span>
          </div>
          <p className="text-[11px] text-blue-600/80">{activeSemData.totalEffectiveWeeks} Pekan × {jpPerWeek} JP/Mg</p>
        </div>
      </div>

      {/* Table of Monthly Breakdown Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Tabel Rincian Pekan Efektif (RBE) Semester {selectedSemester}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
              ✓ Sinkron dengan PROSEM
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-40">Bulan</th>
                <th className="p-3 w-28 text-center">Jumlah Pekan</th>
                <th className="p-3 w-32 text-center text-rose-600">Pekan Tdk Efektif</th>
                <th className="p-3 w-32 text-center text-emerald-600">Pekan Efektif (RBE)</th>
                <th className="p-3">Keterangan Agenda & Kalender Kegiatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeSemData.months.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{m.monthName}</span>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={m.totalWeeks}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) =>
                        handleMonthChange(
                          selectedSemester === 'Ganjil' ? 'semester1' : 'semester2',
                          idx,
                          'totalWeeks',
                          String(parseNumberInput(e.target.value, 0, 0, 6))
                        )
                      }
                      className="w-16 text-center bg-white border border-slate-300 rounded-md py-1 px-1.5 text-xs text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={m.nonEffectiveWeeks}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) =>
                        handleMonthChange(
                          selectedSemester === 'Ganjil' ? 'semester1' : 'semester2',
                          idx,
                          'nonEffectiveWeeks',
                          String(parseNumberInput(e.target.value, 0, 0, 6))
                        )
                      }
                      className="w-16 text-center bg-rose-50 border border-rose-300 rounded-md py-1 px-1.5 text-xs text-rose-700 font-bold focus:border-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-block w-16 py-1 px-1.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 font-black text-xs text-center">
                      {m.effectiveWeeks}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) =>
                        handleMonthChange(
                          selectedSemester === 'Ganjil' ? 'semester1' : 'semester2',
                          idx,
                          'description',
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                      placeholder="Keterangan agenda..."
                    />
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-blue-700">
                  Total Semester {selectedSemester}:
                </td>
                <td className="p-3 text-center text-sm">{activeSemData.totalWeeks} Pekan</td>
                <td className="p-3 text-center text-sm text-rose-600">{activeSemData.nonEffectiveWeeks} Pekan</td>
                <td className="p-3 text-center text-sm text-emerald-700 font-black">{activeSemData.totalEffectiveWeeks} Pekan</td>
                <td className="p-3 text-xs text-slate-700 font-semibold">
                  Total Alokasi Jam Mengajar: <strong className="text-blue-700">{totalEffJP} JP</strong> ({activeSemData.totalEffectiveWeeks} Pekan × {jpPerWeek} JP)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Breakdown of Jam Pelajaran (JP) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>Rincian Perhitungan Alokasi Jam Pelajaran (JP) Semester {selectedSemester}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">1. Jumlah Pekan Efektif KBM (RBE):</span>
              <span className="font-bold text-slate-900">{activeSemData.totalEffectiveWeeks} Pekan</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">2. Beban Jam Tatap Muka:</span>
              <span className="font-bold text-slate-900">{jpPerWeek} JP / Minggu</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">3. Total Jam Pelajaran Semester:</span>
              <span className="font-extrabold text-blue-700">{totalEffJP} JP ({activeSemData.totalEffectiveWeeks} × {jpPerWeek})</span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">4. Cadangan Waktu Asesmen & Remedial:</span>
              <span className="font-bold text-amber-700">{reserveJP} JP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">5. Jam Efektif Tatap Muka KBM:</span>
              <span className="font-black text-emerald-700">{kbmEffJP} JP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">6. Status Keselarasan Kaldik:</span>
              <span className="font-bold text-emerald-700">Tersinkronisasi Penuh & Siap PROSEM</span>
            </div>
          </div>
        </div>

        {/* Breakdown of Bab Allocation & Meeting Count Formula */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Simulasi Perhitungan Alokasi Waktu & Jumlah Pertemuan per BAB (Sesuai Beban JP/Minggu)</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Alokasi Semester</span>
              <p className="text-base font-black text-blue-700">{totalEffJP} JP</p>
              <p className="text-[11px] text-slate-500">{activeSemData.totalEffectiveWeeks} Pekan × {jpPerWeek} JP/Minggu</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Alokasi Waktu per BAB (Misal: 2 BAB)</span>
              <p className="text-base font-black text-emerald-700">{Math.round(totalEffJP / 2)} JP / BAB</p>
              <p className="text-[11px] text-slate-500">{totalEffJP} JP ÷ 2 BAB = {Math.round(totalEffJP / 2)} JP</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Jumlah Pertemuan per BAB</span>
              <p className="text-base font-black text-indigo-700">
                {Math.max(1, Math.round(Math.round(totalEffJP / 2) / (jpPerWeek || 1)))} Kali Pertemuan
              </p>
              <p className="text-[11px] text-slate-500">
                {Math.round(totalEffJP / 2)} JP ÷ {jpPerWeek} JP/Mg = {Math.max(1, Math.round(Math.round(totalEffJP / 2) / (jpPerWeek || 1)))} Kali
              </p>
            </div>
          </div>

          <div className="text-[11px] text-blue-900 bg-white/70 p-2.5 rounded-lg border border-blue-200/60 flex items-center justify-between flex-wrap gap-2">
            <span>
              💡 <strong>Rumus Utama:</strong> Jumlah Pertemuan/Bab = <em>Alokasi Total JP/Bab ÷ Beban JP/Minggu</em> • Alokasi Total JP/Bab = <em>Jumlah Pertemuan × JP/Minggu</em>.
            </span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('parameter_kurikulum')}
                className="font-bold text-blue-700 hover:text-blue-900 underline flex items-center space-x-1 text-xs"
              >
                <span>Atur di Parameter Kurikulum →</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onExportWord}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh Word (.doc)</span>
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel (.csv)</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-300 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Dokumen</span>
            </button>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('ai_prosem')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sinkronkan ke PROSEM Berwarna</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
