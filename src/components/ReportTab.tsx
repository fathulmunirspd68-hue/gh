import React, { useState } from 'react';
import {
  FileDown,
  FileText,
  Eye,
  CheckCircle2,
  HeartPulse,
  MailCheck,
  AlertOctagon,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  SchoolProfile,
} from '../types/index.ts';
import { buildAttendanceReport } from '../utils/attendanceLogic.ts';
import { createSchoolSlug } from '../utils/schoolSettings.ts';
import {
  exportAttendanceReportPdf,
  summarizeReportRows,
  formatReportDatesIndo,
} from '../utils/pdfReportBuilder.ts';
import { StudentAvatar } from './StudentAvatar.tsx';
import { PdfPreviewModal } from './PdfPreviewModal.tsx';

interface ReportTabProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  logs: AttendanceRecord[];
  onQuickUpdateStatus: (nisn: string, status: AttendanceStatus, date: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  schoolProfile,
  students,
  logs,
  onQuickUpdateStatus,
  onShowToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const distinctClasses = Array.from(new Set(students.map((s) => s.class))).sort();
  const reportRows = buildAttendanceReport(students, logs, selectedDate, selectedClass);
  const stats = summarizeReportRows(reportRows);
  const { fullDateWithDay: formattedDateIndo } = formatReportDatesIndo(selectedDate);

  const studentPhotoMap = new Map<string, string | undefined>();
  students.forEach((s) => {
    studentPhotoMap.set(s.nisn, s.photoUrl);
  });

  const handleExportPdf = async () => {
    if (reportRows.length === 0) {
      onShowToast('Tidak ada data laporan untuk diekspor ke PDF!', 'error');
      return;
    }

    setIsExportingPdf(true);
    try {
      const filename = await exportAttendanceReportPdf({
        schoolProfile,
        reportRows,
        selectedDate,
        selectedClass,
      });
      onShowToast(`Berkas PDF resmi "${filename}" berhasil diunduh.`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membuat berkas PDF laporan presensi.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenPreview = () => {
    if (reportRows.length === 0) {
      onShowToast('Tidak ada data laporan untuk ditampilkan pada pratinjau PDF!', 'error');
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleExportExcel = () => {
    if (reportRows.length === 0) {
      onShowToast('Tidak ada data laporan untuk diexport!', 'error');
      return;
    }

    const excelData = reportRows.map((r, idx) => ({
      No: idx + 1,
      Tanggal: r.date,
      NISN: r.nisn,
      'Nama Siswa': r.name,
      Kelas: r.class,
      'Jenis Kelamin': r.gender,
      'Jam Masuk': r.timeIn,
      'Jam Pulang': r.timeOut,
      'Status Kehadiran': r.status,
      Sekolah: schoolProfile.name,
      NPSN: schoolProfile.npsn,
      'Kepala Sekolah': schoolProfile.headmasterName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');

    const slug = createSchoolSlug(schoolProfile.name);
    XLSX.writeFile(workbook, `Rekap_Presensi_${slug}_${selectedDate}.xlsx`);
    onShowToast(`Berhasil mengunduh berkas Rekap Presensi tanggal ${selectedDate}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Control Filter Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-wrap justify-between items-end gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label
              htmlFor="report-date-picker"
              className="block text-xs font-bold text-slate-600 mb-1"
            >
              Tanggal Presensi
            </label>
            <input
              id="report-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="report-class-filter"
              className="block text-xs font-bold text-slate-600 mb-1"
            >
              Pilihan Kelas
            </label>
            <select
              id="report-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
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

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span>Pratinjau Kop PDF</span>
          </button>

          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExportingPdf}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingPdf ? 'Mengekspor PDF...' : 'Export Rekap PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap shrink-0"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Rekap Excel</span>
          </button>
        </div>
      </div>

      {/* Date Stat Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800">Hadir</span>
            <p className="text-xl font-black text-emerald-700 tabular-nums">
              {stats.hadir} Siswa
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800">Sakit</span>
            <p className="text-xl font-black text-amber-700 tabular-nums">
              {stats.sakit} Siswa
            </p>
          </div>
        </div>

        <div className="bg-white border border-blue-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-800">Izin</span>
            <p className="text-xl font-black text-blue-700 tabular-nums">
              {stats.izin} Siswa
            </p>
          </div>
        </div>

        <div className="bg-white border border-rose-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-rose-800">Tanpa Keterangan</span>
            <p className="text-xl font-black text-rose-700 tabular-nums">
              {stats.alpa} Siswa
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Laporan Presensi Siswa — {schoolProfile.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {formattedDateIndo} · Kepala Sekolah: {schoolProfile.headmasterName}
            </p>
          </div>
          <span className="text-xs text-indigo-700 font-bold tabular-nums">
            {reportRows.length} Siswa Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">NISN</th>
                <th className="px-6 py-3.5">Siswa</th>
                <th className="px-6 py-3.5">Kelas</th>
                <th className="px-6 py-3.5">Jam Masuk</th>
                <th className="px-6 py-3.5">Jam Pulang</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada siswa pada filter ini.
                  </td>
                </tr>
              ) : (
                reportRows.map((row) => (
                  <tr key={row.nisn} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono tabular-nums font-bold text-xs text-indigo-700">
                      {row.nisn}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <StudentAvatar
                          name={row.name}
                          photoUrl={studentPhotoMap.get(row.nisn)}
                          variant="feed"
                        />
                        <span className="font-bold text-slate-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold">{row.class}</td>
                    <td className="px-6 py-3.5 font-mono tabular-nums text-xs">{row.timeIn}</td>
                    <td className="px-6 py-3.5 font-mono tabular-nums text-xs">{row.timeOut}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-bold ${
                          row.status === 'Hadir'
                            ? 'text-emerald-700'
                            : row.status === 'Sakit'
                            ? 'text-amber-700'
                            : row.status === 'Izin'
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <select
                        aria-label={`Ubah status kehadiran ${row.name}`}
                        value={row.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as AttendanceStatus;
                          onQuickUpdateStatus(row.nisn, newStatus, selectedDate);
                          onShowToast(`Status ${row.name} diubah menjadi "${newStatus}".`);
                        }}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Alpa">Alpa</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Letterhead PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        schoolProfile={schoolProfile}
        reportRows={reportRows}
        selectedDate={selectedDate}
        selectedClass={selectedClass}
        isExporting={isExportingPdf}
        onClose={() => setIsPreviewOpen(false)}
        onDownloadPdf={() => void handleExportPdf()}
      />
    </div>
  );
};
