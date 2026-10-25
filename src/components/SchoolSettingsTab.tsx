import React, { useState, useEffect } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Check,
  RotateCcw,
  AlertCircle,
  Eye,
  Users,
  ArrowRight,
  ImagePlus,
} from 'lucide-react';
import type { SchoolProfile, Student } from '../types/index.ts';
import {
  DEFAULT_SCHOOL_PROFILE,
  validateSchoolProfileInput,
  countStudentsWithPhotos,
} from '../utils/schoolSettings.ts';
import { processImageFile } from '../utils/imageHelper.ts';
import { SchoolLogo } from './SchoolLogo.tsx';
import { StudentAvatar } from './StudentAvatar.tsx';

interface SchoolSettingsTabProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  onSaveSchoolProfile: (profile: SchoolProfile) => void;
  onResetSchoolProfile: () => void;
  onNavigateToStudentData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SchoolSettingsTab: React.FC<SchoolSettingsTabProps> = ({
  schoolProfile,
  students,
  onSaveSchoolProfile,
  onResetSchoolProfile,
  onNavigateToStudentData,
  onShowToast,
}) => {
  const [formState, setFormState] = useState<SchoolProfile>(schoolProfile);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    setFormState(schoolProfile);
  }, [schoolProfile]);

  const handleFieldChange = (field: keyof SchoolProfile, value: string) => {
    setValidationError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoFile = async (file: File) => {
    setValidationError(null);
    setIsProcessingLogo(true);
    try {
      const dataUrl = await processImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        preserveAlpha: true,
        quality: 0.9,
      });
      setFormState((prev) => ({
        ...prev,
        logoUrl: dataUrl,
      }));
      onShowToast('Logo sekolah siap disimpan. Klik "Simpan Pengaturan" untuk menerapkan.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses logo sekolah.';
      setValidationError(msg);
      onShowToast(msg, 'error');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleLogoFile(file);
    }
    e.target.value = '';
  };

  const handleDropLogo = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleLogoFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormState((prev) => ({
      ...prev,
      logoUrl: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSchoolProfileInput(formState);
    if (!check.valid || !check.sanitized) {
      const errMsg = check.error || 'Mohon periksa kembali data identitas sekolah.';
      setValidationError(errMsg);
      onShowToast(errMsg, 'error');
      return;
    }

    setValidationError(null);
    onSaveSchoolProfile(check.sanitized);
    onShowToast(`Identitas & logo "${check.sanitized.name}" berhasil disimpan!`);
  };

  const handleConfirmReset = () => {
    setFormState({ ...DEFAULT_SCHOOL_PROFILE });
    setValidationError(null);
    setConfirmReset(false);
    onResetSchoolProfile();
    onShowToast('Identitas & logo sekolah dikembalikan ke pengaturan awal.');
  };

  const sampleStudent =
    students.find((s) => Boolean(s.photoUrl)) ||
    students[0] || {
      id: 'sample',
      nisn: '0015891001',
      name: 'Ahmad Bagus Pratama',
      class: 'Kelas 1',
      gender: 'Laki-laki' as const,
    };

  const photosCount = countStudentsWithPhotos(students);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Identity & Logo Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>Pengaturan Identitas & Logo Sekolah</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perubahan diterapkan otomatis ke Header, Kartu Pelajar, Laporan Excel, dan Backup.
              </p>
            </div>
          </div>

          {validationError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* School Logo Upload Area */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">Logo Resmi Sekolah</span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={handleDropLogo}
              className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row items-center gap-5 ${
                isDraggingLogo
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 shadow-xs">
                <SchoolLogo
                  logoUrl={formState.logoUrl}
                  schoolName={formState.name || 'Sekolah'}
                  size="xl"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {formState.logoUrl ? 'Logo Kustom Aktif' : 'Menggunakan Ikon Default Sekolah'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Unggah berkas PNG transparan, JPG, WEBP, atau SVG (maks. 10 MB). Gambar akan dioptimalkan otomatis.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label
                    htmlFor="school-logo-upload"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingLogo ? 'Memproses...' : 'Unggah Logo Sekolah'}</span>
                  </label>
                  <input
                    id="school-logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoInputChange}
                    className="sr-only"
                    aria-label="Unggah berkas logo sekolah"
                  />

                  {formState.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="school-name"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Nama Sekolah / Satuan Pendidikan <span className="text-rose-600">*</span>
              </label>
              <input
                id="school-name"
                type="text"
                required
                value={formState.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Contoh: UPTD SDN 2 RAJASINGA"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="school-npsn"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                NPSN Sekolah <span className="text-rose-600">*</span>
              </label>
              <input
                id="school-npsn"
                type="text"
                required
                value={formState.npsn}
                onChange={(e) => handleFieldChange('npsn', e.target.value)}
                placeholder="Contoh: 20216000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="school-academic-year"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Tahun Pelajaran Aktif
              </label>
              <input
                id="school-academic-year"
                type="text"
                value={formState.academicYear}
                onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                placeholder="Contoh: 2026/2027"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="school-address"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Wilayah Singkat (Kecamatan & Kabupaten/Kota) <span className="text-rose-600">*</span>
              </label>
              <input
                id="school-address"
                type="text"
                required
                value={formState.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Contoh: Kec. Terisi, Kab. Indramayu"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="school-full-address"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Alamat Lengkap Sekolah
              </label>
              <input
                id="school-full-address"
                type="text"
                value={formState.fullAddress}
                onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                placeholder="Contoh: Desa Rajasinga, Kec. Terisi, Kab. Indramayu, Jawa Barat"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="school-headmaster"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Nama Kepala Sekolah
              </label>
              <input
                id="school-headmaster"
                type="text"
                value={formState.headmasterName}
                onChange={(e) => handleFieldChange('headmasterName', e.target.value)}
                placeholder="Contoh: Drs. H. Sutrisno, M.Pd."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="school-headmaster-nip"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                NIP Kepala Sekolah
              </label>
              <input
                id="school-headmaster-nip"
                type="text"
                value={formState.headmasterNip}
                onChange={(e) => handleFieldChange('headmasterNip', e.target.value)}
                placeholder="Contoh: 19690415 199203 1 005"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="school-card-subtitle"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Subjudul Kartu Pelajar
              </label>
              <input
                id="school-card-subtitle"
                type="text"
                value={formState.cardSubtitle}
                onChange={(e) => handleFieldChange('cardSubtitle', e.target.value)}
                placeholder="Contoh: KARTU IDENTITAS PRESENSI SISWA"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Ya, Kembalikan Awal
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Batal
                </button>
              </div>
            )}

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Previews & Student Photo Shortcut */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Pratinjau Tampilan Langsung</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi tampilan identitas dan logo sebelum disimpan.
              </p>
            </div>

            {/* Header Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                1. Kop Header Aplikasi
              </span>
              <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white rounded-xl p-3.5 flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl flex items-center justify-center shrink-0">
                  <SchoolLogo
                    logoUrl={formState.logoUrl}
                    schoolName={formState.name || 'Sekolah'}
                    size="md"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-white truncate">
                    {formState.name || 'Nama Sekolah'}
                  </p>
                  <p className="text-[11px] text-blue-200 truncate mt-0.5">
                    {formState.address || 'Wilayah Sekolah'} · NPSN: {formState.npsn || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* ID Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                2. Kartu Identitas Presensi Siswa
              </span>
              <div className="w-full max-w-[340px] mx-auto h-[215px] bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden border border-blue-400/30 shadow-md">
                <div className="flex items-center justify-between border-b border-blue-300/30 pb-2 z-10 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-950 shrink-0 p-0.5">
                      <SchoolLogo
                        logoUrl={formState.logoUrl}
                        schoolName={formState.name || 'Sekolah'}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-[10px] tracking-wider text-yellow-300 uppercase leading-none truncate">
                        {formState.name || 'NAMA SEKOLAH'}
                      </h4>
                      <p className="text-[8px] text-blue-200 leading-none mt-1 font-semibold tracking-wide truncate">
                        {formState.cardSubtitle || 'KARTU IDENTITAS PRESENSI SISWA'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-yellow-300 whitespace-nowrap shrink-0">
                    {sampleStudent.class}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-1.5 z-10">
                  <StudentAvatar
                    name={sampleStudent.name}
                    photoUrl={sampleStudent.photoUrl}
                    variant="card"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] text-blue-300 font-semibold">Nama Lengkap</p>
                    <p className="font-bold text-xs text-white truncate">{sampleStudent.name}</p>
                    <p className="text-[8px] text-blue-300 font-semibold mt-1.5">NISN Siswa</p>
                    <p className="font-mono tabular-nums text-xs font-bold text-yellow-300">
                      {sampleStudent.nisn}
                    </p>
                    <p className="text-[8px] text-blue-200 mt-0.5">{sampleStudent.gender}</p>
                  </div>
                </div>

                <div className="border-t border-blue-400/20 pt-1.5 flex justify-between items-center text-[8px] text-blue-300 font-medium z-10 gap-2">
                  <span className="truncate">
                    {formState.address || 'Wilayah'} · NPSN {formState.npsn || '-'}
                  </span>
                  <span className="font-mono tabular-nums text-[7px] text-blue-200 whitespace-nowrap shrink-0">
                    TA {formState.academicYear || '2026/2027'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Photo Management Shortcut */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ImagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Manajemen Foto Kartu Pelajar Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Unggah foto masing-masing siswa pada menu Data Siswa agar foto tampil otomatis di Kartu Pelajar dan riwayat scan.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Kelengkapan Foto Siswa</span>
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {photosCount} / {students.length} Siswa
              </span>
            </div>

            <button
              type="button"
              onClick={onNavigateToStudentData}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Kelola & Unggah Foto Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
