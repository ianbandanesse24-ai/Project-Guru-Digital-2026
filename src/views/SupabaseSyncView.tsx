import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Lock,
  Server,
  Layers,
  Calendar,
  Users,
  FileText,
  Activity,
  Award,
  Download,
  Shield,
  ArrowUpRight,
  HardDriveDownload,
  BookOpen,
  ClipboardList,
  Sparkles,
  Unlink,
  Link,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { SupabaseService } from '../lib/supabase';
import { StorageService } from '../lib/storage';
import { SupabaseConfig } from '../types';

export const SupabaseSyncView: React.FC = () => {
  // Supabase State
  const [sbConfig, setSbConfig] = useState<SupabaseConfig>(() => SupabaseService.getConfig());
  const [urlInput, setUrlInput] = useState<string>(sbConfig.url || '');
  const [keyInput, setKeyInput] = useState<string>(sbConfig.apiKey || '');
  const [sbAutoSync, setSbAutoSync] = useState<boolean>(sbConfig.autoSync ?? true);

  // Status and Loading States
  const [isTestingSb, setIsTestingSb] = useState<boolean>(false);
  const [isSyncingSb, setIsSyncingSb] = useState<boolean>(false);
  const [isPullingSb, setIsPullingSb] = useState<boolean>(false);

  const [sbTestResult, setSbTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Counts
  const studentCount = StorageService.getStudents().length;
  const classCount = StorageService.getClasses().length;
  const attendanceCount = StorageService.getAttendance().length;
  const scheduleCount = StorageService.getSchedule().length;
  const agendaCount = StorageService.getAgenda().length;
  const journalCount = StorageService.getJournal().length;
  const dailyGradeCount = StorageService.getDailyGrades().length;
  const unifiedGradeCount = StorageService.getGrades().length;
  const aiDocCount = StorageService.getAIDocuments().length;
  const cpDistCount = StorageService.getCPDistributions().length;
  const userCount = StorageService.getUsers().length;

  const isConnected = Boolean(sbConfig.url && sbConfig.apiKey && sbConfig.syncStatus !== 'disconnected');

  // Supabase Handlers
  const handleSaveSbConfig = () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setSbTestResult({
        success: false,
        message: 'Harap isi URL Proyek Supabase dan Public Anon Key sebelum menyimpan.',
      });
      return;
    }

    const updated = SupabaseService.saveConfig({
      url: urlInput.trim(),
      apiKey: keyInput.trim(),
      autoSync: sbAutoSync,
      syncStatus: 'idle',
    });
    setSbConfig(updated);
    setSbTestResult({
      success: true,
      message: 'Kredensial Supabase baru berhasil disimpan dan dihubungkan!',
    });
    setTimeout(() => setSbTestResult(null), 4000);
  };

  const handleDisconnect = () => {
    if (confirm('Apakah Anda yakin ingin memutuskan koneksi Supabase saat ini? Kredensial akan dikosongkan sehingga Anda dapat menghubungkan proyek Supabase baru.')) {
      const updated = SupabaseService.disconnect();
      setSbConfig(updated);
      setUrlInput('');
      setKeyInput('');
      setSbTestResult({
        success: true,
        message: 'Koneksi Supabase berhasil diputuskan. Silakan siapkan proyek baru dan jalankan skrip SQL di bawah.',
      });
      setSyncResult(null);
      setTimeout(() => setSbTestResult(null), 5000);
    }
  };

  const handleTestSb = async () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setSbTestResult({
        success: false,
        message: 'Masukkan URL Proyek dan Anon Key terlebih dahulu untuk melakukan pengujian.',
      });
      return;
    }

    setIsTestingSb(true);
    setSbTestResult(null);
    try {
      const res = await SupabaseService.testConnection(urlInput.trim(), keyInput.trim());
      setSbTestResult(res);
      if (res.success) {
        // Otomatis simpan jika koneksi valid
        const updated = SupabaseService.saveConfig({
          url: urlInput.trim(),
          apiKey: keyInput.trim(),
          autoSync: sbAutoSync,
          syncStatus: 'idle',
        });
        setSbConfig(updated);
      }
    } catch (e: any) {
      setSbTestResult({
        success: false,
        message: e?.message || 'Gagal menghubungi server Supabase.',
      });
    } finally {
      setIsTestingSb(false);
    }
  };

  const handlePushSb = async () => {
    if (!isConnected && (!urlInput.trim() || !keyInput.trim())) {
      setSyncResult({
        success: false,
        message: 'Belum terhubung ke Supabase. Harap isi URL dan API Key proyek baru Anda.',
      });
      return;
    }

    setIsSyncingSb(true);
    setSyncResult(null);
    try {
      // Pastikan config tersimpan
      if (urlInput.trim() && keyInput.trim()) {
        SupabaseService.saveConfig({
          url: urlInput.trim(),
          apiKey: keyInput.trim(),
          autoSync: sbAutoSync,
        });
      }
      const res = await SupabaseService.pushAllToSupabase(false);
      setSyncResult(res);
      setSbConfig(SupabaseService.getConfig());
    } catch (e: any) {
      setSyncResult({
        success: false,
        message: e?.message || 'Gagal sinkronisasi ke Supabase',
      });
    } finally {
      setIsSyncingSb(false);
    }
  };

  const handlePullSb = async () => {
    if (!confirm('Apakah Anda yakin ingin menarik data dari Supabase Cloud? Data lokal yang ada akan diperbarui dengan data dari cloud.')) {
      return;
    }
    setIsPullingSb(true);
    setSyncResult(null);
    try {
      const res = await SupabaseService.pullAllFromSupabase();
      setSyncResult(res);
      setSbConfig(SupabaseService.getConfig());
    } catch (e: any) {
      setSyncResult({
        success: false,
        message: e?.message || 'Gagal mengambil data dari Supabase',
      });
    } finally {
      setIsPullingSb(false);
    }
  };

  const handleDownloadBackup = () => {
    const data = SupabaseService.buildAllTablesPayload();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_administrasi_guru_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sqlSchema = SupabaseService.getSupabaseSQLSchema();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-emerald-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <Cloud className="w-3.5 h-3.5" />
              <span>Database Cloud PostgreSQL</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Integrasi Supabase Cloud Project</span>
              {isConnected ? (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Siap Dihubungkan
                </span>
              )}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Sinkronkan seluruh data administrasi guru—presensi, jadwal, agenda, jurnal mengajar, penilaian rapor, alokasi CP/TP, hingga modul ajar AI secara langsung ke database <strong>Supabase (PostgreSQL)</strong>.
            </p>

            {/* Quick Status Chip */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {isConnected ? (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                  <Database className="w-3.5 h-3.5" />
                  <span>Status: <strong>Terhubung</strong></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Status: <strong>Koneksi Terputus / Siap Hubungkan Project Baru</strong></span>
                </div>
              )}
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Sync: {sbAutoSync ? 'Aktif Otomatis' : 'Manual'}</span>
              </div>
              {sbConfig.lastSyncedAt && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terakhir: {sbConfig.lastSyncedAt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handlePushSb}
              disabled={isSyncingSb || isPullingSb}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingSb ? 'animate-spin' : ''}`} />
              <span>{isSyncingSb ? 'Menyinkronkan...' : 'Push Data ke Supabase'}</span>
            </button>
            <button
              onClick={handlePullSb}
              disabled={isSyncingSb || isPullingSb || !isConnected}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
              title="Tarik data terbaru dari Supabase Cloud ke perangkat ini"
            >
              <HardDriveDownload className={`w-4 h-4 ${isPullingSb ? 'animate-spin' : ''}`} />
              <span>{isPullingSb ? 'Mengunduh...' : 'Tarik Data dari Cloud'}</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="Unduh cadangan data lokal dalam format JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Cadangan JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
            syncResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {syncResult.success ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <span className="font-bold">Hasil Sinkronisasi: </span>
            {syncResult.message}
            {syncResult.stats && (
              <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                {Object.entries(syncResult.stats).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
                    {k}: {v} data
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step-by-Step Guide for New Project */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Panduan Menghubungkan Project Supabase Baru (4 Langkah Cepat)</h2>
          </div>
          <a
            href="https://supabase.com/dashboard/projects"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Buka Dashboard Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/40">1</span>
              <span className="font-semibold text-slate-200">Buat Proyek Baru</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Buka <a href="https://supabase.com/dashboard/new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a>, buat project baru (nama bebas, region Singapore/Jakarta).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/40">2</span>
              <span className="font-semibold text-slate-200">Jalankan Skrip SQL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Klik <strong>Salin Skrip SQL Baru</strong> di bawah, buka menu <strong>SQL Editor</strong> di Supabase, tempel dan klik <strong>Run</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/40">3</span>
              <span className="font-semibold text-slate-200">Salin Kredensial API</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Di Supabase, buka <em>Project Settings &gt; API</em>. Salin <strong>Project URL</strong> dan <strong>anon public key</strong> ke form di bawah.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/40">4</span>
              <span className="font-semibold text-slate-200">Uji &amp; Push Data</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Klik <strong>Uji Koneksi</strong>, lalu klik <strong>Push Data ke Supabase</strong> untuk mengunggah seluruh data lokal Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Configuration Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Konfigurasi Kredensial Project Supabase Baru</h2>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-all cursor-pointer"
              title="Putuskan koneksi dan kosongkan kredensial Supabase saat ini"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Putuskan Koneksi</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Project URL (REST Endpoint):
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="https://xxxxxxxxxxxxxxxx.supabase.co"
            />
            <p className="text-[10px] text-slate-500 mt-1">Ditemukan di: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Project API Key (Public Anon Key):
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
            <p className="text-[10px] text-slate-500 mt-1">Ditemukan di: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon public)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sbAutoSync}
              onChange={(e) => setSbAutoSync(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-950 border-slate-700"
            />
            <span className="text-xs text-slate-300">
              Aktifkan Auto-Sync Otomatis di Latar Belakang (setiap kali data disimpan)
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Putuskan Koneksi</span>
              </button>
            )}
            <button
              onClick={handleTestSb}
              disabled={isTestingSb}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              <Activity className={`w-3.5 h-3.5 ${isTestingSb ? 'animate-spin' : ''}`} />
              <span>{isTestingSb ? 'Menguji...' : 'Uji Koneksi Supabase'}</span>
            </button>
            <button
              onClick={handleSaveSbConfig}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Simpan &amp; Hubungkan</span>
            </button>
          </div>
        </div>

        {sbTestResult && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              sbTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {sbTestResult.message}
          </div>
        )}
      </div>

      {/* SQL Schema Viewer Component (New Project Ready) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Skrip SQL Baru untuk Project Supabase Baru</h2>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://supabase.com/dashboard/project/_/sql/new"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 mr-2"
            >
              <span>Buka SQL Editor di Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleCopySql}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Skrip Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Seluruh Skrip SQL Baru</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start space-x-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
          <div>
            <strong>Skrip ini telah disiapkan untuk project Supabase baru:</strong> Otomatis membuat 13 tabel database, konfigurasi Row Level Security (RLS) untuk public anon, hak akses API (GRANT), dan index performa tinggi.
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto select-all">
            {sqlSchema}
          </pre>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ringkasan Data Lokal yang Siap Diunggah</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Peserta Didik</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{studentCount}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Siswa</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Rombel / Kelas</span>
              <Layers className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{classCount}</div>
            <div className="text-[10px] text-teal-400 mt-0.5">Kelas</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Presensi &amp; Jadwal</span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{attendanceCount + scheduleCount}</div>
            <div className="text-[10px] text-blue-400 mt-0.5">Entri</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Agenda &amp; Jurnal</span>
              <ClipboardList className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{agendaCount + journalCount}</div>
            <div className="text-[10px] text-violet-400 mt-0.5">Catatan</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Nilai Rapor</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{dailyGradeCount + unifiedGradeCount}</div>
            <div className="text-[10px] text-amber-400 mt-0.5">Nilai</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Modul Ajar AI</span>
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{aiDocCount}</div>
            <div className="text-[10px] text-pink-400 mt-0.5">Dokumen AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};
