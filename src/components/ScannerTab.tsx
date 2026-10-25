import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  StopCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  UserCheck,
  QrCode,
  Volume2,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type {
  Student,
  AttendanceRecord,
  AttendanceMode,
  AttendanceProcessResult,
  SchoolProfile,
} from '../types/index.ts';
import { StudentAvatar } from './StudentAvatar.tsx';

interface ScannerTabProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  todayLogs: AttendanceRecord[];
  onProcessAttendance: (input: string, mode: AttendanceMode) => AttendanceProcessResult;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  schoolProfile,
  students,
  todayLogs,
  onProcessAttendance,
}) => {
  const [selectedMode, setSelectedMode] = useState<AttendanceMode>('Otomatis');
  const [manualInput, setManualInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    message: string;
    student?: Student;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-qrcode-reader';

  const studentMap = new Map<string, Student>();
  students.forEach((s) => {
    studentMap.set(s.nisn, s);
  });

  useEffect(() => {
    return () => {
      if (scannerRef.current && isCameraActive) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
          });
      }
    };
  }, [isCameraActive]);

  const handleStartCamera = async () => {
    setCameraError(null);
    setDuplicateWarning(null);
    setSuccessBanner(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        handleAttendanceSubmit(decodedText);
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        qrCodeSuccessCallback,
        undefined
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const msg =
        err instanceof Error ? err.message : 'Kamera tidak dapat diakses atau diblokir.';
      setCameraError(msg + ' Silakan gunakan input manual NISN di bawah.');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Stop error:', e);
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  const handleAttendanceSubmit = (inputStr: string) => {
    const trimmed = inputStr.trim();
    if (!trimmed) return;

    setDuplicateWarning(null);
    setSuccessBanner(null);

    const result = onProcessAttendance(trimmed, selectedMode);

    if (result.type === 'duplicate_ignored') {
      setDuplicateWarning(result.warning || result.message);
    } else if (result.success) {
      const matchedStudent = result.record
        ? studentMap.get(result.record.studentNisn)
        : undefined;
      setSuccessBanner({
        message: result.message,
        student: matchedStudent,
      });
      setTimeout(() => setSuccessBanner(null), 4500);
    } else {
      setDuplicateWarning(result.message);
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleAttendanceSubmit(manualInput);
      setManualInput('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner & Input */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 mb-4 gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span>Pemindai QR Code Presensi</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Scan kartu pelajar siswa {schoolProfile.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="mode-select" className="text-xs text-slate-600 font-bold">
                  Mode:
                </label>
                <select
                  id="mode-select"
                  value={selectedMode}
                  onChange={(e) => {
                    setSelectedMode(e.target.value as AttendanceMode);
                    setDuplicateWarning(null);
                  }}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Otomatis">Otomatis (Masuk / Pulang)</option>
                  <option value="Masuk">Hadir (Masuk Saja)</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpa">Alpa (Tanpa Keterangan)</option>
                </select>
              </div>
            </div>

            {duplicateWarning && (
              <div
                role="alert"
                className="mb-4 p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-extrabold text-sm text-rose-900 mb-0.5">
                    Peringatan Presensi
                  </p>
                  <p className="font-medium text-rose-800 leading-relaxed">{duplicateWarning}</p>
                </div>
              </div>
            )}

            {successBanner && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 animate-in fade-in">
                {successBanner.student && (
                  <StudentAvatar
                    name={successBanner.student.name}
                    photoUrl={successBanner.student.photoUrl}
                    variant="feed"
                  />
                )}
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">{successBanner.message}</span>
              </div>
            )}

            <div className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center border border-slate-800">
              <div id={readerElementId} className="w-full h-full"></div>

              {!isCameraActive && (
                <div className="text-center p-8 text-slate-300 flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Kamera Scanner Siap</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Arahkan kamera ke QR Code pada Kartu Pelajar Siswa {schoolProfile.name}.
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-xs text-amber-200 max-w-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="mt-3 bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              {!isCameraActive ? (
                <button
                  id="btn-start-camera"
                  type="button"
                  onClick={handleStartCamera}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Nyalakan Kamera Scanner</span>
                </button>
              ) : (
                <button
                  id="btn-stop-camera"
                  type="button"
                  onClick={handleStopCamera}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Matikan Kamera</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="manual-nisn" className="block text-xs font-bold text-slate-700">
                Input Manual (NISN atau ID Siswa)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Tekan Enter atau klik Submit
              </span>
            </div>
            <form onSubmit={handleManualFormSubmit} className="flex gap-2">
              <input
                id="manual-nisn"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ketik NISN Siswa (contoh: 0015891001)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono tabular-nums"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">
                  Simulasi Scan Cepat (Klik Siswa):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {students.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAttendanceSubmit(s.nisn)}
                    className="bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap"
                    title={`Simulasikan scan untuk ${s.name}`}
                  >
                    <span>{s.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      ({s.nisn})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Scan History Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Log Scan Hari Ini</span>
              </h2>
              <span className="text-xs font-bold text-indigo-700 font-mono tabular-nums">
                {todayLogs.length} Siswa
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {todayLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <QrCode className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-600">Belum ada riwayat scan</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Arahkan QR Code siswa ke kamera atau masukkan NISN pada formulir manual.
                  </p>
                </div>
              ) : (
                todayLogs.map((log) => {
                  const hasCheckedOut = log.timeOut !== '-';
                  const student = studentMap.get(log.studentNisn);
                  return (
                    <div
                      key={log.id || `${log.studentNisn}_${log.timeIn}`}
                      className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StudentAvatar
                          name={log.studentName}
                          photoUrl={student?.photoUrl}
                          variant="feed"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">
                            {log.studentName}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5 truncate">
                            {log.studentClass} · {log.studentNisn}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-extrabold ${
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
                        <div className="text-[11px] font-mono tabular-nums text-slate-600 mt-1 font-semibold flex items-center justify-end gap-1">
                          <span>Masuk {log.timeIn}</span>
                          {hasCheckedOut && (
                            <span className="text-indigo-600">· Pulang {log.timeOut}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Notifikasi suara aktif</span>
            </span>
            <span className="font-medium text-slate-500">Proteksi Scan Ganda</span>
          </div>
        </div>
      </div>
    </div>
  );
};
