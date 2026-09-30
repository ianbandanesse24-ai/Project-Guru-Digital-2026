import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
  Cpu,
  Activity,
} from 'lucide-react';
import { StorageService, DEFAULT_ADMIN } from '../lib/storage';
import { AMDLogo } from './AMDLogo';

interface GeminiKeyStatus {
  configured: boolean;
  source: 'env' | 'custom' | 'none';
  maskedKey: string;
  hasCustomKey: boolean;
  preferredModel: string;
}

export const AdminApiKeyManager: React.FC = () => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<GeminiKeyStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    reply?: string;
    latencyMs?: number;
    modelUsed?: string;
    timestamp?: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchKeyStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/gemini-key-status');
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      } else {
        const localKey = typeof window !== 'undefined' ? localStorage.getItem('agk_client_gemini_key') : null;
        if (localKey) {
          setKeyStatus({
            configured: true,
            source: 'custom',
            maskedKey: localKey.substring(0, 6) + '...' + localKey.substring(localKey.length - 4),
            hasCustomKey: true,
            preferredModel: 'gemini-2.5-flash',
          });
        } else {
          setKeyStatus({
            configured: false,
            source: 'none',
            maskedKey: '',
            hasCustomKey: false,
            preferredModel: 'gemini-2.5-flash',
          });
        }
      }
    } catch {
      const localKey = typeof window !== 'undefined' ? localStorage.getItem('agk_client_gemini_key') : null;
      if (localKey) {
        setKeyStatus({
          configured: true,
          source: 'custom',
          maskedKey: localKey.substring(0, 6) + '...' + localKey.substring(localKey.length - 4),
          hasCustomKey: true,
          preferredModel: 'gemini-2.5-flash',
        });
      } else {
        setKeyStatus({
          configured: false,
          source: 'none',
          maskedKey: '',
          hasCustomKey: false,
          preferredModel: 'gemini-2.5-flash',
        });
      }
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const handleSaveAndSync = async () => {
    if (!apiKeyInput.trim()) {
      setFeedback({ text: 'Masukkan API Key Google AI Studio Anda.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/set-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFeedback({
            text: 'API Key Google AI Studio Berhasil Diverifikasi dan Tersinkronisasi!',
            type: 'success',
          });
          setTestResult({
            success: true,
            message: data.message,
            reply: data.testResponse,
            latencyMs: data.latencyMs,
            modelUsed: data.modelUsed,
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
          setApiKeyInput('');
          fetchKeyStatus();

          // Audit log
          StorageService.addAccessLog({
            userId: DEFAULT_ADMIN.id,
            userEmail: DEFAULT_ADMIN.email,
            userName: DEFAULT_ADMIN.name,
            userRole: 'admin',
            action: 'Pembaruan API Key Google AI Studio',
            details: `Sinkronisasi API Key Google AI Studio sukses (${data.latencyMs}ms, Model: ${data.modelUsed}).`,
            status: 'success',
          });
          return;
        }
      }
      throw new Error('Server API tidak merespons, mencoba verifikasi langsung...');
    } catch {
      // Fallback: Verifikasi langsung ke Google Gemini API (untuk deployment statis di GitHub Pages)
      try {
        const startTime = Date.now();
        const clientRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyInput.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Halo AMD AI' }] }],
            }),
          }
        );

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          const replyText = clientData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Koneksi aktif';
          localStorage.setItem('agk_client_gemini_key', apiKeyInput.trim());

          setFeedback({
            text: 'API Key Google AI Studio Berhasil Diverifikasi dan Tersimpan di Browser (Mode GitHub Pages)!',
            type: 'success',
          });
          setTestResult({
            success: true,
            message: 'Koneksi langsung ke Google AI Studio terverifikasi aktif!',
            reply: replyText,
            latencyMs: Date.now() - startTime,
            modelUsed: 'gemini-2.5-flash',
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
          setApiKeyInput('');
          fetchKeyStatus();

          StorageService.addAccessLog({
            userId: DEFAULT_ADMIN.id,
            userEmail: DEFAULT_ADMIN.email,
            userName: DEFAULT_ADMIN.name,
            userRole: 'admin',
            action: 'Update API Key Gemini (Klien)',
            details: 'Administrator menyimpan API Key Google AI Studio secara lokal di browser.',
            status: 'success',
          });
        } else {
          const errBody = await clientRes.json().catch(() => ({}));
          const errDetail = errBody?.error?.message || 'API Key ditolak oleh Google AI Studio.';
          setFeedback({
            text: `Verifikasi gagal: ${errDetail}`,
            type: 'error',
          });
        }
      } catch (clientErr: any) {
        setFeedback({
          text: `Terjadi kendala verifikasi: ${clientErr.message || 'Periksa koneksi internet.'}`,
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunPingTest = async () => {
    setIsTestingPing(true);
    setTestResult(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/test-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillType: 'ping' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTestResult({
            success: true,
            message: data.message,
            reply: data.reply,
            latencyMs: data.latencyMs,
            modelUsed: data.modelUsed,
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
          return;
        }
      }
      throw new Error('Server proxy tidak merespons');
    } catch {
      // Fallback pengujian langsung di klien (GitHub Pages)
      const localKey = localStorage.getItem('agk_client_gemini_key');
      if (!localKey) {
        setTestResult({
          success: false,
          message: 'Belum ada API Key yang tersimpan. Silakan masukkan dan simpan API Key di atas.',
        });
        setIsTestingPing(false);
        return;
      }

      try {
        const startTime = Date.now();
        const clientRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Tes koneksi sistem AMD AI' }] }],
            }),
          }
        );

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          const replyText = clientData?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
          setTestResult({
            success: true,
            message: 'Koneksi ke Google AI Studio berhasil (Mode Langsung Klien)!',
            reply: replyText,
            latencyMs: Date.now() - startTime,
            modelUsed: 'gemini-2.5-flash',
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
        } else {
          const errData = await clientRes.json().catch(() => ({}));
          setTestResult({
            success: false,
            message: errData?.error?.message || 'Gagal terhubung ke Google AI Studio.',
          });
        }
      } catch (clientErr: any) {
        setTestResult({
          success: false,
          message: `Gagal menguji koneksi: ${clientErr.message}`,
        });
      }
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset konfigurasi API Key ke setelan lingkungan default?')) {
      return;
    }

    try {
      localStorage.removeItem('agk_client_gemini_key');
      await fetch('/api/admin/reset-gemini-key', { method: 'POST' }).catch(() => {});
      setFeedback({ text: 'API Key berhasil direset ke konfigurasi awal.', type: 'success' });
      setTestResult(null);
      fetchKeyStatus();
    } catch {
      localStorage.removeItem('agk_client_gemini_key');
      setFeedback({ text: 'API Key browser berhasil dibersihkan.', type: 'success' });
      fetchKeyStatus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card: Manajemen API Key AMD AI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-emerald-900/50 flex items-center justify-center p-1.5 shrink-0 shadow-md">
              <AMDLogo size="sm" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Manajemen API Key AMD AI Core
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                  AMD AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                Konfigurasi kunci API resmi AMD AI Engine (Google AI Studio) untuk pemrosesan pembuatan perangkat ajar kurikulum secara otomatis.
              </p>
            </div>
          </div>

          {/* Quick Status Badge */}
          <div className="flex items-center space-x-2 shrink-0">
            {isLoadingStatus ? (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memeriksa Status...</span>
              </div>
            ) : keyStatus?.configured ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI Studio Tersinkronisasi ({keyStatus.preferredModel || 'Gemini'})</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kunci Belum Dikonfigurasi</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-800 font-medium text-xs ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Kelola Kunci & Sinkronisasi API */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: API Key Input & Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Input & Sinkronisasi API Key</span>
                </h3>
                {keyStatus?.maskedKey && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    Aktif: {keyStatus.maskedKey}
                  </span>
                )}
              </div>

              {/* Input Form */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Google AI Studio Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Tempelkan API Key Anda di sini (misal: AIzaSy...)"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kunci ini akan digunakan server untuk memproses seluruh pembuatan perangkat kurikulum (CP, TP, ATP, PROTA, PROSEM, KKTP, RPM, LKPD, Rubrik).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  disabled={isSaving || !apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Simpan & Singkronkan Kunci</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRunPingTest}
                  disabled={isTestingPing || !keyStatus?.configured}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
                  title="Uji respon dan latensi koneksi API Gemini saat ini"
                >
                  {isTestingPing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Menguji Ping...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Uji Koneksi (Ping)</span>
                    </>
                  )}
                </button>

                {keyStatus?.hasCustomKey && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1 transition ml-auto"
                    title="Kembalikan ke kunci sistem bawaan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>

              {/* Live Ping Result */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </span>
                    {testResult.latencyMs && (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Latensi: {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  {testResult.reply && (
                    <div className="text-[11px] font-mono bg-white/80 p-2 rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                      {testResult.reply}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model & Architecture Info */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Spesifikasi & Model AI yang Tersedia</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">Model Utama</span>
                  <span className="font-bold text-slate-800 font-mono">{keyStatus?.preferredModel || 'gemini-3.8-flash'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">Model Ringan (Fallback)</span>
                  <span className="font-bold text-slate-800 font-mono">gemini-2.5-flash-lite</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-semibold">Status Kunci Aktif</span>
                  <span className="font-bold text-emerald-700">
                    {keyStatus?.source === 'custom'
                      ? 'Kustom Admin'
                      : keyStatus?.source === 'env'
                      ? 'Google Cloud / Env'
                      : 'Belum Terpasang'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Guide & Quick Tutorial */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Panduan Mendapatkan API Key</span>
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Gratis
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Google AI Studio menyediakan akses API resmi Gemini tanpa dipungut biaya untuk keperluan edukasi. Ikuti 3 langkah berikut:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="font-bold text-slate-800">Buka Google AI Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    Masuk dengan akun Google Anda ke portal pengembang Google AI Studio.
                  </p>
                  <div className="pl-6 pt-1">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-[11px] underline"
                    >
                      <span>Buka aistudio.google.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="font-bold text-slate-800">Klik "Create API Key"</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    Pilih proyek Google Cloud Anda atau buat baru dalam satu klik, lalu salin kuncinya.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="font-bold text-slate-800">Tempel & Singkronkan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    Tempelkan kunci pada formulir di sebelah kiri dan klik <strong>Simpan & Singkronkan</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
