import React, { useState } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  Cloud,
  RotateCcw,
  ShieldCheck,
  FolderSync,
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  BackupPayload,
  SchoolProfile,
} from '../types/index.ts';
import { validateBackupPayload, DEFAULT_STUDENTS } from '../utils/attendanceLogic.ts';
import { createSchoolSlug, countStudentsWithPhotos } from '../utils/schoolSettings.ts';

interface BackupCloudTabProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  attendanceLogs: AttendanceRecord[];
  onRestoreBackup: (payload: BackupPayload) => void;
  onResetToDefaults: () => void;
  onClearAttendance: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BackupCloudTab: React.FC<BackupCloudTabProps> = ({
  schoolProfile,
  students,
  attendanceLogs,
  onRestoreBackup,
  onResetToDefaults,
  onClearAttendance,
  onShowToast,
}) => {
  const [confirmResetStudents, setConfirmResetStudents] = useState(false);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  const buildPayload = (): BackupPayload => ({
    school: schoolProfile.name,
    npsn: schoolProfile.npsn,
    backupDate: new Date().toISOString(),
    version: '2.1.0',
    schoolProfile,
    students,
    attendanceLogs,
  });

  const handleExportJSON = () => {
    const backup = buildPayload();
    const slug = createSchoolSlug(schoolProfile.name);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `Backup_Absensi_${slug}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    onShowToast('Berkas cadangan JSON (termasuk identitas, logo & foto siswa) berhasil diunduh!');
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        if (!validateBackupPayload(parsed)) {
          onShowToast('Format berkas cadangan JSON tidak valid!', 'error');
          return;
        }

        onRestoreBackup(parsed);
        onShowToast(
          `Database berhasil dipulihkan (${parsed.students.length} siswa, ${parsed.attendanceLogs.length} catatan presensi)!`
        );
      } catch (err) {
        console.error(err);
        onShowToast('Gagal memproses berkas JSON!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGoogleDriveSync = () => {
    const backup = buildPayload();
    const slug = createSchoolSlug(schoolProfile.name);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GDrive_Backup_${slug}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    onShowToast('Berkas cadangan lengkap siap diunggah ke Google Drive sekolah!');
  };

  const photosCount = countStudentsWithPhotos(students);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local JSON Backup */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Backup & Restore Lokal</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Unduh seluruh database aplikasi (Identitas & Logo Sekolah, Data & Foto Siswa, serta Riwayat Presensi) dalam format JSON.
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 tabular-nums">
              <p className="flex justify-between">
                <span>Identitas Sekolah:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {schoolProfile.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Total Siswa (Dengan Foto):</span>
                <span className="font-bold text-slate-800">
                  {students.length} Siswa ({photosCount} Foto)
                </span>
              </p>
              <p className="flex justify-between">
                <span>Total Log Presensi:</span>
                <span className="font-bold text-slate-800">{attendanceLogs.length} Catatan</span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas Backup (.json)</span>
            </button>

            <label
              htmlFor="backup-restore-json"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <Upload className="w-4 h-4" />
              <span>Pulihkan Data dari File (.json)</span>
            </label>
            <input
              id="backup-restore-json"
              type="file"
              accept=".json"
              onChange={handleRestoreJSON}
              className="sr-only"
              aria-label="Pulihkan data dari berkas cadangan JSON"
            />
          </div>
        </div>

        {/* Cloud Export */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Arsip Google Drive Sekolah</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Siapkan salinan arsip cadangan lengkap {schoolProfile.name} untuk disimpan ke folder Google Drive sekolah.
            </p>

            <div className="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Mencakup konfigurasi identitas sekolah, logo resmi, foto kartu pelajar, dan log presensi.
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleGoogleDriveSync}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <FolderSync className="w-4 h-4" />
              <span>Ekspor Arsip Google Drive</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              Menghasilkan berkas JSON terstruktur untuk penyimpanan cloud sekolah.
            </p>
          </div>
        </div>
      </div>

      {/* Database Maintenance Tools */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-2">
          <RotateCcw className="w-5 h-5 text-indigo-600" />
          <span>Pemeliharaan Database & Pengujian</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Gunakan opsi di bawah ini untuk mengembalikan data siswa bawaan atau membersihkan riwayat scan presensi.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {!confirmResetStudents ? (
            <button
              type="button"
              onClick={() => setConfirmResetStudents(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
            >
              Muat Ulang Data Siswa Default ({DEFAULT_STUDENTS.length} Siswa)
            </button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  setConfirmResetStudents(false);
                  onShowToast('Data siswa berhasil dikembalikan ke default bawaan!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
              >
                Ya, Muat Ulang Siswa Default
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetStudents(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
              >
                Batal
              </button>
            </div>
          )}

          {!confirmClearLogs ? (
            <button
              type="button"
              onClick={() => setConfirmClearLogs(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
            >
              Bersihkan Riwayat Presensi
            </button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearAttendance();
                  setConfirmClearLogs(false);
                  onShowToast('Seluruh riwayat presensi telah dibersihkan.');
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
              >
                Ya, Hapus Semua Riwayat
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearLogs(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
