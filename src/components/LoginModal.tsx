import React, { useState } from 'react';
import { ShieldCheck, User, KeyRound, AlertCircle, X } from 'lucide-react';
import type { UserRole, SchoolProfile } from '../types/index.ts';
import { SchoolLogo } from './SchoolLogo.tsx';

interface LoginModalProps {
  isOpen: boolean;
  schoolProfile: SchoolProfile;
  onClose: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  schoolProfile,
  onClose,
  onLoginSuccess,
}) => {
  const [role, setRole] = useState<UserRole>('Admin');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'Admin' && password !== 'admin123') {
      setError('Password Admin tidak valid! (Default: admin123)');
      return;
    }

    if (role === 'Guru' && password !== 'guru123') {
      setError('Password Guru tidak valid! (Default: guru123)');
      return;
    }

    onLoginSuccess(role);
    setPassword('');
  };

  const handleQuickLogin = (selectedRole: UserRole, defaultPass: string) => {
    setRole(selectedRole);
    setPassword(defaultPass);
    onLoginSuccess(selectedRole);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
          aria-label="Tutup dialog login"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 p-2">
            {schoolProfile.logoUrl ? (
              <SchoolLogo
                logoUrl={schoolProfile.logoUrl}
                schoolName={schoolProfile.name}
                size="lg"
              />
            ) : (
              <ShieldCheck className="w-9 h-9" />
            )}
          </div>
          <h2
            id="login-modal-title"
            className="text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Login Presensi Digital
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{schoolProfile.name}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">
              Role Pengguna
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('Admin');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  role === 'Admin'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Admin Sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('Guru');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  role === 'Guru'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Guru / Piket</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Kata Sandi ({role})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Sandi Default:{' '}
              <span className="font-mono text-indigo-600 font-semibold">
                {role === 'Admin' ? 'admin123' : 'guru123'}
              </span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            Masuk ke Aplikasi
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium text-center mb-2">
            Akses Cepat Pengujian:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Admin', 'admin123')}
              className="flex-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Masuk sbg Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Guru', 'guru123')}
              className="flex-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Masuk sbg Guru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
