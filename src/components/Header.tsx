import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, LogOut, Settings } from 'lucide-react';
import type { UserRole, SchoolProfile } from '../types/index.ts';
import { SchoolLogo } from './SchoolLogo.tsx';

interface HeaderProps {
  schoolProfile: SchoolProfile;
  currentRole: UserRole | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolProfile,
  currentRole,
  onLogout,
  onOpenLogin,
  onOpenSettings,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
      setTimeStr(now.toLocaleTimeString('id-ID', { hour12: false }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white shadow-md no-print border-b border-indigo-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center py-3.5 gap-4">
        {/* School Branding */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="bg-white p-2 rounded-2xl shadow-sm flex items-center justify-center text-blue-900 shrink-0 w-12 h-12">
            <SchoolLogo
              logoUrl={schoolProfile.logoUrl}
              schoolName={schoolProfile.name}
              size="md"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-lg sm:text-2xl leading-tight tracking-tight text-white truncate">
              {schoolProfile.name}
            </h1>
            <p className="text-xs text-blue-200 mt-0.5 truncate">
              <span>{schoolProfile.address}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">NPSN: {schoolProfile.npsn}</span>
              {schoolProfile.academicYear && (
                <>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>TA {schoolProfile.academicYear}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Clock, Quick Settings & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Realtime clock */}
          <div className="text-right hidden md:block mr-1">
            <p className="text-xs font-medium text-blue-100 flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-300" />
              <span>{dateStr}</span>
            </p>
            <p className="text-xs text-yellow-300 font-mono tabular-nums font-bold tracking-wider">
              {timeStr} WIB
            </p>
          </div>

          {currentRole === 'Admin' && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="Pengaturan Identitas & Logo Sekolah"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Identitas Sekolah</span>
            </button>
          )}

          {/* User Profile / Auth Status */}
          {currentRole ? (
            <div className="bg-blue-900/90 border border-indigo-500/50 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs">
              <div className="leading-tight">
                <span className="font-bold block text-yellow-300 text-xs whitespace-nowrap">
                  {currentRole === 'Admin' ? 'Admin Sekolah' : 'Guru Piket'}
                </span>
                <span className="text-[10px] text-blue-200 font-medium whitespace-nowrap">
                  {currentRole === 'Admin' ? 'Akses Penuh' : 'Akses Terbatas'}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="bg-rose-500/80 hover:bg-rose-600 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Keluar / Ganti Role"
                aria-label="Logout atau ganti role"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Login Sistem</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
