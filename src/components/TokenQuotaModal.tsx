import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Zap,
  Gift,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Award,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, TokenQuotaStatus } from '../types';
import { StorageService } from '../lib/storage';
import { AMDLogo } from './AMDLogo';

interface TokenQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onTokenUpdated?: () => void;
  onNavigateToAdminTokens?: () => void;
}

export const TokenQuotaModal: React.FC<TokenQuotaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTokenUpdated,
  onNavigateToAdminTokens,
}) => {
  const [quotaStatus, setQuotaStatus] = useState<TokenQuotaStatus>(() =>
    StorageService.getTokenQuotaStatus(currentUser)
  );
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshStatus = () => {
    const status = StorageService.getTokenQuotaStatus(currentUser);
    setQuotaStatus(status);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
      setVoucherMsg(null);
      setVoucherCode('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleRedeemVoucher = (codeToRedeem?: string | unknown) => {
    const targetCode = typeof codeToRedeem === 'string' ? codeToRedeem : voucherCode;
    const code = (targetCode || '').trim().toUpperCase();
    if (!code) {
      setVoucherMsg({ text: 'Harap masukkan kode voucher.', type: 'error' });
      return;
    }

    const res = StorageService.redeemTokenVoucher(code, currentUser);
    if (res.success) {
      setVoucherMsg({ text: res.message, type: 'success' });
      setVoucherCode('');
      refreshStatus();
      if (onTokenUpdated) {
        setTimeout(() => {
          onTokenUpdated();
        }, 0);
      }
    } else {
      setVoucherMsg({ text: res.message, type: 'error' });
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const percentUsed = quotaStatus.totalAllowed > 0
    ? Math.min(100, Math.round((quotaStatus.monthlyUsed / quotaStatus.totalAllowed) * 100))
    : 0;

  const sampleVouchers = StorageService.getTokenVouchers().filter(v => !v.isRedeemed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col text-slate-900 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-900/40 flex items-center justify-center p-1 text-white shrink-0 shadow-xs">
              <AMDLogo size="xs" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Status Kuota AMD AI & Lisensi
                {quotaStatus.isAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    Super Admin
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>20.000 Token/Hari (Reset Otomatis 00:00 WIB)</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">Context Caching Aktif</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Security & Features Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-xs text-emerald-900">Context Caching Aktif</div>
                <div className="text-[10px] text-emerald-700">Menghemat ~75% token per dokumen kurikulum</div>
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold text-xs text-blue-900">Row Level Security (RLS)</div>
                <div className="text-[10px] text-blue-700">Data akun privat & terisolasi per pengguna</div>
              </div>
            </div>
          </div>

          {/* Daily 20,000 Tokens Card */}
          <div className="p-4 rounded-lg bg-slate-900 text-white border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Pemakaian Token Harian
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-[9px] font-bold rounded-full">
                    Reset Otomatis 00:00
                  </span>
                </div>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {quotaStatus.dailyTokensUsed.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {quotaStatus.dailyTokensLimit.toLocaleString('id-ID')} Token/Hari
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Sisa Token Hari Ini
                </span>
                <div className="mt-1">
                  {quotaStatus.isAdmin ? (
                    <span className="text-lg font-bold text-purple-300">Unlimited</span>
                  ) : (
                    <span
                      className={`text-xl font-black font-mono ${
                        quotaStatus.dailyTokensRemaining > 5000
                          ? 'text-emerald-400'
                          : quotaStatus.dailyTokensRemaining > 0
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {quotaStatus.dailyTokensRemaining.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    quotaStatus.isAdmin
                      ? 'bg-purple-500 w-full'
                      : quotaStatus.dailyPercentUsed >= 100
                      ? 'bg-rose-500'
                      : quotaStatus.dailyPercentUsed >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: quotaStatus.isAdmin ? '100%' : `${quotaStatus.dailyPercentUsed}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{quotaStatus.dailyPercentUsed}% batas 20.000 token terpakai hari ini</span>
                <span className="text-slate-300 font-mono">
                  Reset dalam: <strong className="text-emerald-300">{quotaStatus.dailyResetCountdownText}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              <span>Siklus: <strong>Harian (20.000 Token/Hari)</strong></span>
              <span>Tanggal: {quotaStatus.dailyResetDate}</span>
            </div>
          </div>

          {/* Subscription Expiry Alert / Warning */}
          {quotaStatus.isExpired && !quotaStatus.isAdmin && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-rose-900">Masa Aktif Akun Telah Habis</div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Akses akun Anda telah jatuh tempo pada <strong>{quotaStatus.subscriptionExpiryDate}</strong>. Silakan hubungi Administrator Sekolah untuk perpanjangan masa aktif.
                </p>
              </div>
            </div>
          )}

          {quotaStatus.isExpiringSoon && !quotaStatus.isExpired && !quotaStatus.isAdmin && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-amber-900">
                  Peringatan Jatuh Tempo: {quotaStatus.daysUntilExpiry} Hari Lagi
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Masa aktif akses 1 tahun Anda akan berakhir pada <strong>{quotaStatus.subscriptionExpiryDate}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* 1-Year Subscription Status Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs">Masa Aktif Akun Guru</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  quotaStatus.isAdmin
                    ? 'bg-purple-100 text-purple-700'
                    : quotaStatus.isExpired
                    ? 'bg-rose-100 text-rose-700'
                    : quotaStatus.isExpiringSoon
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {quotaStatus.isAdmin ? 'Akses Admin' : quotaStatus.subscriptionStatusText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
              <div className="p-2 bg-white rounded-md border border-slate-200">
                <div className="text-[10px] text-slate-500">Tanggal Disetujui</div>
                <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  {quotaStatus.subscriptionStartDate || '-'}
                </div>
              </div>
              <div className="p-2 bg-white rounded-md border border-slate-200">
                <div className="text-[10px] text-slate-500">Tanggal Jatuh Tempo</div>
                <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  {quotaStatus.isAdmin ? 'Tidak Terbatas' : (quotaStatus.subscriptionExpiryDate || '-')}
                </div>
              </div>
              <div className="p-2 bg-white rounded-md border border-slate-200">
                <div className="text-[10px] text-slate-500">Sisa Masa Aktif</div>
                <div className="font-bold text-xs mt-0.5 text-blue-600">
                  {quotaStatus.isAdmin ? 'Selamanya' : `${quotaStatus.daysUntilExpiry} Hari`}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Generation & Token Quota Meter */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Pemakaian Bulan Ini
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {quotaStatus.monthlyUsed}
                  </span>
                  <span className="text-xs text-slate-500">
                    / {quotaStatus.totalAllowed} Generate
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Sisa Kuota
                </span>
                <div className="mt-0.5">
                  {quotaStatus.isAdmin ? (
                    <span className="text-lg font-bold text-purple-700">Unlimited</span>
                  ) : (
                    <span
                      className={`text-xl font-black font-mono ${
                        quotaStatus.monthlyRemaining > 5
                          ? 'text-emerald-700'
                          : quotaStatus.monthlyRemaining > 0
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {quotaStatus.monthlyRemaining}x
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    quotaStatus.isAdmin
                      ? 'bg-purple-600 w-full'
                      : percentUsed >= 100
                      ? 'bg-rose-500'
                      : percentUsed >= 75
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: quotaStatus.isAdmin ? '100%' : `${percentUsed}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{percentUsed}% kuota bulanan terpakai</span>
                {quotaStatus.extra > 0 && (
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3" /> Termasuk +{quotaStatus.extra} Token Bonus
                  </span>
                )}
              </div>
            </div>

            {/* Reset Time Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500 gap-1">
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span>Reset Otomatis: <strong>Tgl {quotaStatus.billingCycleDay} per Bulan</strong></span>
              </div>
              <span>Reset Berikutnya: {quotaStatus.monthlyResetDate}</span>
            </div>
          </div>

          {/* Voucher Redeem Section */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800">
              <Gift className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs">Klaim Voucher Tambahan Kuota</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Contoh: GURUKREATIF20"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-xs uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={() => handleRedeemVoucher()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md transition flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Klaim</span>
              </button>
            </div>

            {voucherMsg && (
              <div
                className={`p-2.5 rounded-md text-xs flex items-center space-x-2 ${
                  voucherMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {voucherMsg.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>{voucherMsg.text}</span>
              </div>
            )}

            {/* Available Vouchers */}
            {sampleVouchers.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Voucher Tersedia:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleVouchers.slice(0, 4).map((v) => (
                    <div
                      key={v.id}
                      className="p-2 bg-white border border-slate-200 rounded-md flex items-center justify-between hover:border-blue-300 transition"
                    >
                      <div>
                        <div className="font-mono font-bold text-blue-700 text-xs flex items-center gap-1">
                          <span>{v.code}</span>
                          <span className="text-[9px] px-1 bg-emerald-100 text-emerald-700 rounded">
                            +{v.extraClicks}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                          {v.description}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopy(v.code)}
                          title="Salin Kode"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                        >
                          {copiedCode === v.code ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRedeemVoucher(v.code)}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[10px] font-semibold rounded transition"
                        >
                          Pakai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Tools Link */}
          {currentUser.role === 'admin' && onNavigateToAdminTokens && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <div>
                  <div className="font-bold text-purple-900 text-xs">Manajemen Token & Lisensi Admin</div>
                  <div className="text-[10px] text-purple-600">Atur kuota guru, perpanjangan 1 tahun, & voucher</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAdminTokens();
                }}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-xs flex items-center space-x-1 transition"
              >
                <span>Buka Panel</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[10px]">
            Sistem Kuota 35x Generate &bull; 1 Tahun
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-300 transition text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
