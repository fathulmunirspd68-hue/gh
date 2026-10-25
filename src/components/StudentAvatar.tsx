import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface StudentAvatarProps {
  name: string;
  photoUrl?: string;
  variant?: 'table' | 'card' | 'feed' | 'modal';
  className?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  name,
  photoUrl,
  variant = 'table',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photoUrl]);

  const initial = (name || '?').trim().charAt(0).toUpperCase();

  if (variant === 'card') {
    if (photoUrl && !hasError) {
      return (
        <div
          className={`w-14 h-[68px] rounded-xl overflow-hidden border border-white/30 bg-slate-800 shrink-0 shadow-sm ${className}`}
        >
          <img
            src={photoUrl}
            alt={`Foto ${name}`}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover block"
          />
        </div>
      );
    }

    return (
      <div
        className={`w-14 h-[68px] bg-slate-800/80 rounded-xl flex flex-col items-center justify-center border border-white/20 text-blue-200 shrink-0 shadow-inner ${className}`}
      >
        <User className="w-6 h-6 text-slate-300" />
        <span className="text-[7px] text-slate-400 uppercase mt-1 font-bold">FOTO</span>
      </div>
    );
  }

  if (variant === 'modal') {
    if (photoUrl && !hasError) {
      return (
        <div
          className={`w-24 h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-sm ${className}`}
        >
          <img
            src={photoUrl}
            alt={`Pratinjau foto ${name || 'siswa'}`}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover block"
          />
        </div>
      );
    }

    return (
      <div
        className={`w-24 h-32 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 ${className}`}
      >
        <User className="w-8 h-8 text-slate-300 mb-1" />
        <span className="text-[10px] font-semibold text-slate-400">Foto 3x4</span>
      </div>
    );
  }

  if (variant === 'feed') {
    if (photoUrl && !hasError) {
      return (
        <img
          src={photoUrl}
          alt={`Foto ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 ${className}`}
        />
      );
    }

    return (
      <div
        className={`w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 ${className}`}
      >
        {initial}
      </div>
    );
  }

  // Default: 'table'
  if (photoUrl && !hasError) {
    return (
      <img
        src={photoUrl}
        alt={`Foto ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-10 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-10 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
};
