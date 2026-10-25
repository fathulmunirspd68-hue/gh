import React, { useState } from 'react';
import {
  UserPlus,
  FileDown,
  FileUp,
  Search,
  Filter,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  X,
  Check,
  Camera,
  Upload,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Student, SchoolProfile } from '../types/index.ts';
import { filterStudents } from '../utils/attendanceLogic.ts';
import { createSchoolSlug, countStudentsWithPhotos } from '../utils/schoolSettings.ts';
import { processImageFile } from '../utils/imageHelper.ts';
import { StudentAvatar } from './StudentAvatar.tsx';

interface StudentDataTabProps {
  students: Student[];
  schoolProfile: SchoolProfile;
  onSaveStudent: (student: Student) => void;
  onUpdateStudentPhoto: (studentId: string, photoUrl: string) => void;
  onDeleteStudent: (id: string) => void;
  onImportStudents: (imported: Student[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StudentDataTab: React.FC<StudentDataTabProps> = ({
  students,
  schoolProfile,
  onSaveStudent,
  onUpdateStudentPhoto,
  onDeleteStudent,
  onImportStudents,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formNisn, setFormNisn] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('Kelas 1');
  const [formGender, setFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  // Available classes for filtering
  const distinctClasses = Array.from(new Set(students.map((s) => s.class))).sort();
  const filteredStudents = filterStudents(students, searchQuery, selectedClass);
  const photosCount = countStudentsWithPhotos(students);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormNisn('');
    setFormName('');
    setFormClass(distinctClasses[0] || 'Kelas 1');
    setFormGender('Laki-laki');
    setFormPhotoUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormNisn(student.nisn);
    setFormName(student.name);
    setFormClass(student.class);
    setFormGender(student.gender);
    setFormPhotoUrl(student.photoUrl || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleModalPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);
    setIsProcessingPhoto(true);
    try {
      const compressed = await processImageFile(file, {
        maxWidth: 300,
        maxHeight: 400,
        cropPortrait: true,
        quality: 0.84,
      });
      setFormPhotoUrl(compressed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses foto siswa.';
      setFormError(msg);
      onShowToast(msg, 'error');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleQuickRowPhotoUpload = async (
    student: Student,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await processImageFile(file, {
        maxWidth: 300,
        maxHeight: 400,
        cropPortrait: true,
        quality: 0.84,
      });
      onUpdateStudentPhoto(student.id, compressed);
      onShowToast(`Foto siswa "${student.name}" berhasil diperbarui!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto siswa.';
      onShowToast(msg, 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNisn.trim() || !formName.trim() || !formClass.trim()) {
      const msg = 'Mohon lengkapi NISN, Nama Lengkap, dan Kelas siswa!';
      setFormError(msg);
      onShowToast(msg, 'error');
      return;
    }

    const studentDoc: Student = {
      id: editingStudent
        ? editingStudent.id
        : `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nisn: formNisn.trim(),
      name: formName.trim(),
      class: formClass.trim(),
      gender: formGender,
      photoUrl: formPhotoUrl.trim() || undefined,
    };

    onSaveStudent(studentDoc);
    setIsModalOpen(false);
    onShowToast(
      editingStudent
        ? `Data siswa "${studentDoc.name}" berhasil diperbarui!`
        : `Siswa baru "${studentDoc.name}" berhasil ditambahkan!`
    );
  };

  // Export Students to Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      onShowToast('Tidak ada data siswa untuk diexport!', 'error');
      return;
    }

    const sheetData = students.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      'Nama Siswa': s.name,
      Kelas: s.class,
      'Jenis Kelamin': s.gender,
      'Status Foto': s.photoUrl ? 'Ada Foto' : 'Belum Ada',
      Sekolah: schoolProfile.name,
      NPSN: schoolProfile.npsn,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    const slug = createSchoolSlug(schoolProfile.name);
    XLSX.writeFile(
      workbook,
      `Data_Siswa_${slug}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    onShowToast('Berhasil mengunduh berkas Excel Data Siswa.');
  };

  // Import Students from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          workbook.Sheets[sheetName]
        );

        if (!rows || rows.length === 0) {
          onShowToast('File Excel kosong atau format tidak sesuai!', 'error');
          return;
        }

        const newStudentsList: Student[] = [];

        rows.forEach((row, i) => {
          const nisn = String(row['NISN'] || row['nisn'] || row['Nisn'] || '').trim();
          const name = String(row['Nama Siswa'] || row['Nama'] || row['nama'] || '').trim();
          const className = String(row['Kelas'] || row['kelas'] || 'Kelas 1').trim();
          const genderRaw = String(
            row['Jenis Kelamin'] || row['gender'] || row['JK'] || 'Laki-laki'
          );
          const gender: 'Laki-laki' | 'Perempuan' = genderRaw
            .toLowerCase()
            .startsWith('p')
            ? 'Perempuan'
            : 'Laki-laki';

          if (nisn && name) {
            newStudentsList.push({
              id: `import_${Date.now()}_${i}`,
              nisn,
              name,
              class: className,
              gender,
            });
          }
        });

        if (newStudentsList.length === 0) {
          onShowToast('Tidak ada data valid yang dapat diimpor.', 'error');
          return;
        }

        onImportStudents(newStudentsList);
        onShowToast(`Berhasil mengimpor ${newStudentsList.length} data siswa!`);
      } catch (err) {
        console.error(err);
        onShowToast('Gagal memproses file Excel!', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Cari siswa berdasarkan nama, NISN, atau kelas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama / NISN / Kelas..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              aria-label="Filter berdasarkan kelas"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Kelas</option>
              {distinctClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <label
            htmlFor="student-excel-import"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>Import Excel</span>
          </label>
          <input
            id="student-excel-import"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            className="sr-only"
            aria-label="Import data siswa dari Excel"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Daftar Siswa Terdaftar — {schoolProfile.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Menampilkan {filteredStudents.length} dari {students.length} siswa · {photosCount} siswa telah memiliki foto kartu
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Foto & Nama Siswa</th>
                <th className="px-6 py-3.5">NISN</th>
                <th className="px-6 py-3.5">Kelas</th>
                <th className="px-6 py-3.5">Jenis Kelamin</th>
                <th className="px-6 py-3.5 text-right">Unggah Foto & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-600">
                      Tidak ada siswa yang sesuai.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau filter kelas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const photoInputId = `quick-photo-${s.id}`;
                  const isDeleting = pendingDeleteId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            name={s.name}
                            photoUrl={s.photoUrl}
                            variant="table"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-xs text-slate-400">
                              {s.photoUrl ? 'Foto kartu terpasang' : 'Belum ada foto'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono tabular-nums font-bold text-xs text-indigo-700">
                        {s.nisn}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-700">
                        {s.class}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">{s.gender}</td>
                      <td className="px-6 py-3.5 text-right">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteStudent(s.id);
                                setPendingDeleteId(null);
                                onShowToast(`Siswa "${s.name}" berhasil dihapus.`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <label
                              htmlFor={photoInputId}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                              title={`Unggah atau ganti foto ${s.name}`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{s.photoUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                            </label>
                            <input
                              id={photoInputId}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => void handleQuickRowPhotoUpload(s, e)}
                              className="sr-only"
                              aria-label={`Unggah foto ${s.name}`}
                            />

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(s)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-700 transition-colors"
                              title={`Edit data ${s.name}`}
                              aria-label={`Edit ${s.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(s.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                              title={`Hapus ${s.name}`}
                              aria-label={`Hapus ${s.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-modal-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 id="student-modal-title" className="text-lg font-extrabold text-slate-900">
                {editingStudent ? 'Edit Data & Foto Siswa' : 'Tambah Data Siswa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup formulir siswa"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              {/* Student Photo Upload Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <StudentAvatar
                  name={formName}
                  photoUrl={formPhotoUrl}
                  variant="modal"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Foto Kartu Pelajar (3x4)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Unggah pasfoto siswa (JPG, PNG, WEBP). Otomatis dipotong proporsional 3:4 untuk Kartu Pelajar.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="modal-student-photo"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isProcessingPhoto
                          ? 'Memproses...'
                          : formPhotoUrl
                          ? 'Ganti Foto'
                          : 'Pilih Foto Siswa'}
                      </span>
                    </label>
                    <input
                      id="modal-student-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => void handleModalPhotoChange(e)}
                      className="sr-only"
                      aria-label="Pilih berkas foto siswa"
                    />

                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="student-nisn-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  NISN / ID Siswa <span className="text-rose-600">*</span>
                </label>
                <input
                  id="student-nisn-input"
                  type="text"
                  required
                  value={formNisn}
                  onChange={(e) => {
                    setFormError(null);
                    setFormNisn(e.target.value);
                  }}
                  placeholder="Contoh: 0015891001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="student-name-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nama Lengkap Siswa <span className="text-rose-600">*</span>
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormError(null);
                    setFormName(e.target.value);
                  }}
                  placeholder="Contoh: Ahmad Bagus Pratama"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-class-input"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Kelas <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="student-class-input"
                    type="text"
                    required
                    value={formClass}
                    onChange={(e) => {
                      setFormError(null);
                      setFormClass(e.target.value);
                    }}
                    placeholder="Contoh: Kelas 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="student-gender-select"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Jenis Kelamin
                  </label>
                  <select
                    id="student-gender-select"
                    value={formGender}
                    onChange={(e) =>
                      setFormGender(e.target.value as 'Laki-laki' | 'Perempuan')
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
