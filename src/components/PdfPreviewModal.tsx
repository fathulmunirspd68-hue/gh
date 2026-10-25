import React from 'react';
import { X, FileDown, FileText } from 'lucide-react';
import type { SchoolProfile } from '../types/index.ts';
import {
  deriveOfficialLetterhead,
  summarizeReportRows,
  formatReportDatesIndo,
  type ReportRowItem,
} from '../utils/pdfReportBuilder.ts';
import { SchoolLogo } from './SchoolLogo.tsx';

interface PdfPreviewModalProps {
  isOpen: boolean;
  schoolProfile: SchoolProfile;
  reportRows: ReportRowItem[];
  selectedDate: string;
  selectedClass: string;
  isExporting: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  schoolProfile,
  reportRows,
  selectedDate,
  selectedClass,
  isExporting,
  onClose,
  onDownloadPdf,
}) => {
  if (!isOpen) return null;

  const letterhead = deriveOfficialLetterhead(schoolProfile);
  const summary = summarizeReportRows(reportRows);
  const { fullDateWithDay, dateOnly } = formatReportDatesIndo(selectedDate);
  const classLabel = selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass;
  const headmasterName =
    schoolProfile.headmasterName?.trim() || `Kepala ${schoolProfile.name}`;
  const headmasterNip = schoolProfile.headmasterNip?.trim() || '-';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-modal-title"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h3
                id="pdf-preview-modal-title"
                className="text-sm sm:text-base font-extrabold text-slate-900"
              >
                Pratinjau Dokumen PDF Resmi (Kop Sekolah)
              </h3>
              <p className="text-xs text-slate-500">
                Ukuran Kertas A4 Potret · {reportRows.length} Data Siswa ({classLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Menyiapkan PDF...' : 'Unduh Berkas PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau PDF"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="bg-white max-w-[794px] mx-auto p-6 sm:p-10 shadow-md border border-slate-200 text-slate-900">
            {/* Official Kop Surat Header */}
            <div className="flex items-center gap-4 pb-3 border-b-4 border-double border-slate-900">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <SchoolLogo
                  logoUrl={schoolProfile.logoUrl}
                  schoolName={schoolProfile.name}
                  size="xl"
                />
              </div>
              <div className="flex-1 text-center pr-2">
                <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase">
                  {letterhead.topAgencyLine}
                </p>
                <p className="text-xs font-bold text-slate-700 tracking-wide uppercase mt-0.5">
                  {letterhead.departmentLine}
                </p>
                <h4 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase mt-1">
                  {letterhead.schoolNameLine}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{letterhead.addressLine}</p>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5 tabular-nums">
                  {letterhead.metaLine}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mt-6 mb-5">
              <h5 className="text-sm sm:text-base font-extrabold text-slate-950 underline underline-offset-4">
                LAPORAN REKAPITULASI PRESENSI KEHADIRAN SISWA
              </h5>
            </div>

            {/* Document Metadata */}
            <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-700 mb-4">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Hari / Tanggal:</span> {fullDateWithDay}
                </p>
                <p>
                  <span className="font-semibold">Filter Kelas:</span> {classLabel}
                </p>
              </div>
              <div className="space-y-1 sm:text-right tabular-nums">
                <p>
                  <span className="font-semibold">Tahun Pelajaran:</span>{' '}
                  {schoolProfile.academicYear || '2026/2027'}
                </p>
                <p>
                  <span className="font-semibold">Tingkat Kehadiran:</span>{' '}
                  {summary.percentage}% ({summary.hadir}/{summary.total} Siswa)
                </p>
              </div>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-5 border border-slate-300 rounded-lg bg-slate-50 divide-x divide-slate-200 text-center py-2.5 mb-5 tabular-nums">
              <div>
                <span className="block text-[10px] text-slate-500">Total Siswa</span>
                <span className="text-xs font-extrabold text-slate-900">
                  {summary.total} Siswa
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Hadir</span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {summary.hadir} Siswa
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Sakit</span>
                <span className="text-xs font-extrabold text-amber-700">
                  {summary.sakit} Siswa
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Izin</span>
                <span className="text-xs font-extrabold text-blue-700">
                  {summary.izin} Siswa
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Alpa</span>
                <span className="text-xs font-extrabold text-rose-700">
                  {summary.alpa} Siswa
                </span>
              </div>
            </div>

            {/* Official Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="border border-slate-400 px-2 py-2 text-center w-9">No</th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">NISN</th>
                    <th className="border border-slate-400 px-3 py-2 text-left">
                      Nama Lengkap Siswa
                    </th>
                    <th className="border border-slate-400 px-2 py-2 text-center w-10">L/P</th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">Kelas</th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">
                      Jam Masuk
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">
                      Jam Pulang
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {reportRows.map((row, idx) => (
                    <tr
                      key={row.nisn}
                      className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                    >
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-center font-mono">
                        {row.nisn}
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900">
                        {row.name}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {row.gender === 'Perempuan' ? 'P' : 'L'}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-center">
                        {row.class}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-center font-mono">
                        {row.timeIn}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-center font-mono">
                        {row.timeOut}
                      </td>
                      <td
                        className={`border border-slate-300 px-2.5 py-1.5 text-center font-bold ${
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signature Block */}
            <div className="mt-8 flex justify-end">
              <div className="w-64 text-xs text-slate-800 space-y-1">
                <p>
                  {letterhead.signaturePlace}, {dateOnly}
                </p>
                <p>Mengetahui,</p>
                <p>Kepala {schoolProfile.name}</p>
                <div className="h-16" />
                <p className="font-bold text-slate-950 underline underline-offset-2">
                  {headmasterName}
                </p>
                <p className="text-slate-600 tabular-nums">NIP. {headmasterNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
