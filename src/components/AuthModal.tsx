import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  School,
  BookOpen,
  KeyRound,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  LogIn,
  Key,
} from 'lucide-react';
import { UserAccount } from '../types';
import { StorageService, DEFAULT_ADMIN, DEFAULT_DEMO_USER } from '../lib/storage';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;
  const [tab, setTab] = useState<'login' | 'register' | 'check_status'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [authCodeInput, setAuthCodeInput] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    // Check if master admin
    const isAdminEmail =
      cleanEmail === DEFAULT_ADMIN.email.toLowerCase() ||
      cleanEmail === 'ian.bandanesse24@gmail.com' ||
      cleanEmail === 'ian.bandanesse24@gmaip.com' ||
      cleanEmail === 'aspianmadimu22@guru.sma.belajar.id';

    if (isAdminEmail) {
      if (password === DEFAULT_ADMIN.password || password === 'Yulian12') {
        const adminAccount: UserAccount = {
          ...DEFAULT_ADMIN,
          name: 'Aspian La Ode Madimu, S.Pd Gr.',
        };
        // Record login log
        StorageService.addAccessLog({
          userId: adminAccount.id,
          userEmail: adminAccount.email,
          userName: adminAccount.name,
          userRole: 'admin',
          action: 'Login Administrator Master',
          details: 'Autentikasi administrator utama berhasil.',
          status: 'success',
        });

        StorageService.addNotification({
          title: 'Admin Masuk ke Sistem',
          message: `Administrator ${adminAccount.name} berhasil login pada ${new Date().toLocaleTimeString('id-ID')}.`,
          type: 'user_login',
        });

        StorageService.setCurrentUser(adminAccount);
        onLoginSuccess(adminAccount);
        return;
      } else {
        setErrorMsg('Kata sandi untuk Administrator salah. Silakan periksa kembali.');
        return;
      }
    }

    // Check if demo account
    const isDemoEmail =
      cleanEmail === 'demo@demo' ||
      cleanEmail === DEFAULT_DEMO_USER.email.toLowerCase();

    if (isDemoEmail) {
      if (password.toLowerCase() === 'demo' || password === DEFAULT_DEMO_USER.password) {
        StorageService.addAccessLog({
          userId: DEFAULT_DEMO_USER.id,
          userEmail: DEFAULT_DEMO_USER.email,
          userName: DEFAULT_DEMO_USER.name,
          userRole: DEFAULT_DEMO_USER.role,
          action: 'Login Akun Demo Berhasil',
          details: 'Pengguna Akun Demo (Demo@Demo) berhasil login langsung ke sistem.',
          status: 'success',
        });

        StorageService.addNotification({
          title: 'Aktivitas Login Akun Demo',
          message: `Pengguna ${DEFAULT_DEMO_USER.name} (${DEFAULT_DEMO_USER.email}) berhasil login.`,
          type: 'user_login',
        });

        StorageService.setCurrentUser(DEFAULT_DEMO_USER);
        onLoginSuccess(DEFAULT_DEMO_USER);
        return;
      } else {
        setErrorMsg('Kata sandi untuk Akun Demo salah (Gunakan: Demo).');
        return;
      }
    }

    // Find in users database
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      setErrorMsg('Akun belum terdaftar. Silakan minta izin akses melalui tab "Buat Akun / Minta Izin".');
      return;
    }

    if (user.password && user.password !== password) {
      setErrorMsg('Kata sandi yang dimasukkan tidak sesuai.');
      return;
    }

    // Check approval status
    if (user.status === 'pending') {
      setPendingUser(user);
      setErrorMsg('Akun Anda masih dalam status Menunggu Persetujuan Otorisasi Admin.');
      return;
    }

    if (user.status === 'rejected') {
      setErrorMsg('Permintaan akses akun Anda ditolak oleh administrator. Hubungi admin untuk informasi lebih lanjut.');
      return;
    }

    // Approved client login
    const updatedUser: UserAccount = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    // Update in storage
    const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
    StorageService.saveUsers(updatedList);

    // Add access log
    StorageService.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'Login Client Guru Berhasil',
      details: `Guru ${user.name} (${user.school || 'Sekolah'}) berhasil masuk langsung tanpa izin ulang.`,
      status: 'success',
    });

    // Real-time notification for admin
    StorageService.addNotification({
      title: 'Aktivitas Login Pengguna',
      message: `Guru ${user.name} (${user.email}) telah login ke aplikasi.`,
      type: 'user_login',
    });

    StorageService.setCurrentUser(updatedUser);
    onLoginSuccess(updatedUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !fullName || !password) {
      setErrorMsg('Mohon lengkapi Nama, Email, dan Kata Sandi.');
      return;
    }

    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setErrorMsg('Email ini sudah terdaftar dalam sistem. Silakan login atau cek status izin Anda.');
      return;
    }

    const reqCode = `REQ-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: fullName.trim(),
      role: 'guru',
      status: 'pending',
      password: password,
      school: school.trim() || 'Sekolah Indonesia',
      subject: subject.trim() || 'Guru Mata Pelajaran',
      phone: phone.trim() || '-',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      authCode: reqCode,
    };

    users.push(newUser);
    StorageService.saveUsers(users);

    // Add audit log
    StorageService.addAccessLog({
      userId: newUser.id,
      userEmail: newUser.email,
      userName: newUser.name,
      userRole: 'guru',
      action: 'Pengajuan Izin Akses Akun Baru',
      details: `Permintaan izin akses dari ${newUser.name} (${newUser.school}) dengan kode ${reqCode}.`,
      status: 'info',
    });

    // Real-time notification to admin
    StorageService.addNotification({
      title: 'Permintaan Izin Akses Baru',
      message: `Guru ${newUser.name} (${newUser.school}) mengajukan izin akses. Kode: ${reqCode}.`,
      type: 'access_request',
    });

    setPendingUser(newUser);
    setSuccessMsg(`Permintaan izin akses berhasil dikirim ke Admin! Kode Tiket: ${reqCode}. Admin akan memverifikasi dan menyetujui akun Anda.`);
  };

  const handleDirectApproveDemo = (user: UserAccount) => {
    const users = StorageService.getUsers();
    const approved: UserAccount = {
      ...user,
      status: 'approved',
      approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      approvedBy: DEFAULT_ADMIN.email,
      authCode: `AGK-${Math.floor(1000 + Math.random() * 9000)}-APPROVED`,
    };
    const updated = users.map((u) => (u.id === user.id ? approved : u));
    StorageService.saveUsers(updated);

    StorageService.addAccessLog({
      userId: approved.id,
      userEmail: approved.email,
      userName: approved.name,
      userRole: 'guru',
      action: 'Persetujuan Akses Otomatis (Demo/Admin)',
      details: `Akses diberikan secara langsung kepada ${approved.name}.`,
      status: 'success',
    });

    StorageService.setCurrentUser(approved);
    onLoginSuccess(approved);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-xl mb-3 shadow-sm">
          EP
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          E - Project Guru Digital
        </h2>
        <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto">
          Sistem Otomasi Administrasi Guru & Kurikulum Pembelajaran Digital
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm rounded-xl border border-slate-200 text-slate-900">
          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ian.bandanesse24@gmail.com atau Demo@Demo"
                    className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wide transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Pending Approval Banner if detected */}
              {pendingUser && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Menunggu Otorisasi Admin</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Akun <strong>{pendingUser.name}</strong> ({pendingUser.email}) telah diajukan.
                  </p>
                  <div className="pt-1 flex items-center justify-between border-t border-amber-200">
                    <span className="text-[10px] text-amber-800">Kode: {pendingUser.authCode}</span>
                    <button
                      type="button"
                      onClick={() => handleDirectApproveDemo(pendingUser)}
                      className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] transition"
                    >
                      Bypass Persetujuan (Demo)
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: BUAT AKUN */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat, S.Pd."
                  className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@guru.belajar.id"
                  className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asal Sekolah
                  </label>
                  <input
                    id="reg-school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="SMA Negeri 1 ..."
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    id="reg-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Bahasa / Fisika / dll"
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wide transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Kirim Permintaan Izin Akses</span>
                <Key className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Admin Master: <span className="text-slate-800 font-semibold">Aspian La Ode Madimu, S.Pd Gr.</span>
        </p>
      </div>
    </div>
  );
};
