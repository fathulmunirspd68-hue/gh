import React from 'react';
import {
  Users,
  CheckCircle2,
  HeartPulse,
  MailCheck,
  AlertOctagon,
  TrendingUp,
  Clock,
  ArrowRight,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  AttendanceRecord,
  AttendanceStats,
  SchoolProfile,
  Student,
} from '../types/index.ts';
import { StudentAvatar } from './StudentAvatar.tsx';

interface DashboardTabProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  stats: AttendanceStats;
  todayLogs: AttendanceRecord[];
  onNavigateToScan: () => void;
  onNavigateToReport: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  schoolProfile,
  students,
  stats,
  todayLogs,
  onNavigateToScan,
  onNavigateToReport,
}) => {
  const currentDateIndo = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const maxVal = Math.max(stats.totalStudents, 1);

  const studentPhotoMap = new Map<string, string | undefined>();
  students.forEach((s) => {
    studentPhotoMap.set(s.nisn, s.photoUrl);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-xs font-semibold mb-1">
            {schoolProfile.name} · NPSN {schoolProfile.npsn}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
            Dashboard Presensi Realtime
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            Pantau kehadiran seluruh siswa {schoolProfile.name} secara langsung dan akurat dengan sistem QR Code terintegrasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateToScan}
            className="bg-white text-indigo-900 hover:bg-yellow-400 hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center shadow-xs whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4 mr-2" />
            <span>Mulai Scan QR</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToReport}
            className="bg-indigo-700/80 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center border border-indigo-500/50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            <span>Lihat Rekap</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Siswa</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800 tabular-nums">
              {stats.totalStudents}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Terdaftar Aktif</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Hadir</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-emerald-700 tabular-nums">{stats.hadir}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Telah Hadir</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Sakit</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-amber-700 tabular-nums">{stats.sakit}</h3>
            <span className="text-[11px] text-amber-600 font-medium">Surat Dokter/Ortu</span>
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Izin</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-blue-700 tabular-nums">{stats.izin}</h3>
            <span className="text-[11px] text-blue-600 font-medium">Konfirmasi Guru</span>
          </div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Tanpa Ket.</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-rose-700 tabular-nums">{stats.alpa}</h3>
            <span className="text-[11px] text-rose-600 font-medium">Belum Presensi</span>
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-100">% Presensi</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/60 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black tabular-nums">{stats.percentage}%</h3>
            <span className="text-[11px] text-indigo-200 font-medium">Tingkat Hadir</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6 gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Ringkasan Distribusi Presensi Hari Ini
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentDateIndo}</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 font-mono tabular-nums whitespace-nowrap">
              {stats.hadir} / {stats.totalStudents} Siswa
            </span>
          </div>

          <div className="h-64 flex items-end justify-around gap-6 px-4 pt-6 pb-2 border-b border-slate-100">
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-xs font-extrabold text-emerald-700 mb-1.5 tabular-nums">
                {stats.hadir}
              </span>
              <div
                className="w-full max-w-[56px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl"
                style={{ height: `${Math.max((stats.hadir / maxVal) * 100, 4)}%` }}
              ></div>
              <span className="text-xs text-slate-700 font-bold mt-2.5">Hadir</span>
            </div>

            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-xs font-extrabold text-amber-700 mb-1.5 tabular-nums">
                {stats.sakit}
              </span>
              <div
                className="w-full max-w-[56px] bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-xl"
                style={{ height: `${Math.max((stats.sakit / maxVal) * 100, 4)}%` }}
              ></div>
              <span className="text-xs text-slate-700 font-bold mt-2.5">Sakit</span>
            </div>

            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-xs font-extrabold text-blue-700 mb-1.5 tabular-nums">
                {stats.izin}
              </span>
              <div
                className="w-full max-w-[56px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl"
                style={{ height: `${Math.max((stats.izin / maxVal) * 100, 4)}%` }}
              ></div>
              <span className="text-xs text-slate-700 font-bold mt-2.5">Izin</span>
            </div>

            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-xs font-extrabold text-rose-700 mb-1.5 tabular-nums">
                {stats.alpa}
              </span>
              <div
                className="w-full max-w-[56px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl"
                style={{ height: `${Math.max((stats.alpa / maxVal) * 100, 4)}%` }}
              ></div>
              <span className="text-xs text-slate-700 font-bold mt-2.5">Alpa</span>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center text-xs text-slate-500">
            <span>{schoolProfile.address}</span>
            <span className="font-semibold text-indigo-600 tabular-nums">
              Jam Operasional 06:30 – 14:00
            </span>
          </div>
        </div>

        {/* Recent Live Activity Feed */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Aktivitas Scan Hari Ini</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {todayLogs.length} Catatan
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
              {todayLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-medium">Belum ada aktivitas presensi hari ini.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Aktivitas scan siswa akan langsung muncul di sini.
                  </p>
                </div>
              ) : (
                todayLogs.slice(0, 6).map((log, index) => {
                  const isCheckout = log.timeOut !== '-';
                  const photoUrl = studentPhotoMap.get(log.studentNisn);
                  return (
                    <div
                      key={log.id || `${log.studentNisn}_${index}`}
                      className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StudentAvatar
                          name={log.studentName}
                          photoUrl={photoUrl}
                          variant="feed"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">
                            {log.studentName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                            {log.studentClass} · {log.studentNisn}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            log.status === 'Hadir'
                              ? 'text-emerald-700'
                              : log.status === 'Sakit'
                              ? 'text-amber-700'
                              : log.status === 'Izin'
                              ? 'text-blue-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {log.status}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5 font-medium">
                          {log.timeIn} {isCheckout && `– ${log.timeOut}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-right">
            <button
              type="button"
              onClick={onNavigateToScan}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Buka Pemindai QR Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
