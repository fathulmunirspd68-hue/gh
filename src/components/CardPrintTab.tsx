import React, { useState, useEffect } from 'react';
import { Printer, Filter, School, Info, Camera } from 'lucide-react';
import QRCode from 'qrcode';
import type { Student, SchoolProfile, UserRole } from '../types/index.ts';
import { SchoolLogo } from './SchoolLogo.tsx';
import { StudentAvatar } from './StudentAvatar.tsx';
import { processImageFile } from '../utils/imageHelper.ts';
import { countStudentsWithPhotos } from '../utils/schoolSettings.ts';

interface CardPrintTabProps {
  students: Student[];
  schoolProfile: SchoolProfile;
  currentRole: UserRole | null;
  onUpdateStudentPhoto?: (studentId: string, photoUrl: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const CardPrintTab: React.FC<CardPrintTabProps> = ({
  students,
  schoolProfile,
  currentRole,
  onUpdateStudentPhoto,
  onShowToast,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});

  const distinctClasses = Array.from(new Set(students.map((s) => s.class))).sort();
  const filteredStudents = students.filter(
    (s) => selectedClass === 'ALL' || s.class === selectedClass
  );

  // Generate QR codes for students
  useEffect(() => {
    let isMounted = true;
    const generateAllQrs = async () => {
      const qrMap: Record<string, string> = {};
      for (const student of filteredStudents) {
        try {
          const url = await QRCode.toDataURL(student.nisn, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 140,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          qrMap[student.id] = url;
        } catch (e) {
          console.warn('QR generation error:', e);
        }
      }
      if (isMounted) {
        setQrCodeDataUrls(qrMap);
      }
    };

    void generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [students, selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  const handleCardPhotoUpload = async (
    student: Student,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateStudentPhoto) return;

    try {
      const compressed = await processImageFile(file, {
        maxWidth: 300,
        maxHeight: 400,
        cropPortrait: true,
        quality: 0.84,
      });
      onUpdateStudentPhoto(student.id, compressed);
      onShowToast?.(`Foto kartu "${student.name}" berhasil diperbarui!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses foto siswa.';
      onShowToast?.(msg, 'error');
    } finally {
      e.target.value = '';
    }
  };

  const photosReady = countStudentsWithPhotos(filteredStudents);

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden when printing) */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-wrap justify-between items-center gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <label htmlFor="card-class-filter" className="text-xs font-bold text-slate-600">
              Filter Kelas:
            </label>
            <select
              id="card-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {distinctClasses.map((c) => (
                <option key={c} value={c}>
                  {c} ({students.filter((s) => s.class === c).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium tabular-nums">
            <span>{filteredStudents.length} Kartu Siap Cetak</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{photosReady} Memiliki Foto</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printing Advice Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs no-print">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <p className="font-bold">Tips Mencetak Kartu Pelajar ({schoolProfile.name}):</p>
          <p className="text-amber-800 mt-0.5">
            Gunakan kertas foto atau kertas karton tebal (230–260 gsm). Pilih ukuran kertas A4, margin Minimum, dan aktifkan opsi Background Graphics.
            {currentRole === 'Admin' && ' Anda juga dapat klik tombol foto pada kartu untuk mengganti foto siswa secara langsung.'}
          </p>
        </div>
      </div>

      {/* Printable Cards Grid Area */}
      <div id="printable-area">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            <School className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">Tidak ada kartu siswa untuk dicetak.</p>
            <p className="text-xs text-slate-400 mt-1">
              Pilih kelas lain atau tambahkan data siswa pada menu Data Siswa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
            {filteredStudents.map((student) => {
              const qrUrl = qrCodeDataUrls[student.id];
              const cardPhotoInputId = `card-photo-${student.id}`;

              return (
                <div
                  key={student.id}
                  className="id-card-print w-full max-w-[340px] h-[215px] bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden border border-blue-400/30 shadow-md group"
                >
                  {/* Top School Header */}
                  <div className="flex items-center justify-between border-b border-blue-300/30 pb-2 z-10 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-950 shadow-xs shrink-0 p-0.5">
                        <SchoolLogo
                          logoUrl={schoolProfile.logoUrl}
                          schoolName={schoolProfile.name}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-[10px] tracking-wider text-yellow-300 uppercase leading-none truncate">
                          {schoolProfile.name}
                        </h3>
                        <p className="text-[8px] text-blue-200 leading-none mt-1 font-semibold tracking-wide truncate">
                          {schoolProfile.cardSubtitle || 'KARTU IDENTITAS PRESENSI SISWA'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-yellow-300 whitespace-nowrap shrink-0">
                      {student.class}
                    </span>
                  </div>

                  {/* Card Middle: Photo + Student Details + QR Code */}
                  <div className="flex items-center gap-3 my-1.5 z-10">
                    <div className="relative shrink-0">
                      <StudentAvatar
                        name={student.name}
                        photoUrl={student.photoUrl}
                        variant="card"
                      />
                      {currentRole === 'Admin' && onUpdateStudentPhoto && (
                        <>
                          <label
                            htmlFor={cardPhotoInputId}
                            className="no-print absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                            title={`Unggah foto kartu ${student.name}`}
                          >
                            <Camera className="w-3 h-3" />
                          </label>
                          <input
                            id={cardPhotoInputId}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => void handleCardPhotoUpload(student, e)}
                            className="sr-only no-print"
                            aria-label={`Unggah foto kartu ${student.name}`}
                          />
                        </>
                      )}
                    </div>

                    {/* Student Details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-[8px] text-blue-300 font-semibold">Nama Lengkap</p>
                      <h4 className="font-bold text-xs text-white leading-tight truncate">
                        {student.name}
                      </h4>

                      <div className="mt-1.5 flex flex-col">
                        <span className="text-[8px] text-blue-300 font-semibold">NISN Siswa</span>
                        <span className="font-mono tabular-nums text-xs font-bold text-yellow-300 tracking-wider">
                          {student.nisn}
                        </span>
                      </div>

                      <p className="mt-1 text-[8px] text-blue-200">{student.gender}</p>
                    </div>

                    {/* QR Code Canvas */}
                    <div className="bg-white p-1 rounded-xl shadow-sm shrink-0 flex items-center justify-center border border-white/80">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR ${student.nisn}`}
                          referrerPolicy="no-referrer"
                          className="w-[58px] h-[58px] block rounded-xs"
                        />
                      ) : (
                        <div className="w-[58px] h-[58px] flex items-center justify-center text-slate-400 text-[8px]">
                          Memuat...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Footer */}
                  <div className="border-t border-blue-400/20 pt-1.5 flex justify-between items-center text-[8px] text-blue-300 font-medium z-10 gap-2">
                    <span className="truncate">
                      {schoolProfile.address} · NPSN {schoolProfile.npsn}
                    </span>
                    <span className="font-mono tabular-nums text-[7px] text-blue-200 whitespace-nowrap shrink-0">
                      TA {schoolProfile.academicYear || '2026/2027'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
