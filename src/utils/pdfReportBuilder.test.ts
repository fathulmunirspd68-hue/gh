import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveOfficialLetterhead,
  summarizeReportRows,
  buildPdfFilename,
  createAttendancePdfDocument,
  type ReportRowItem,
} from './pdfReportBuilder.ts';
import { DEFAULT_SCHOOL_PROFILE } from './schoolSettings.ts';

test('deriveOfficialLetterhead: extracts Kabupaten, Kota, and signature place accurately', () => {
  const kabInfo = deriveOfficialLetterhead(DEFAULT_SCHOOL_PROFILE);
  assert.equal(kabInfo.topAgencyLine, 'PEMERINTAH KABUPATEN INDRAMAYU');
  assert.equal(kabInfo.departmentLine, 'DINAS PENDIDIKAN DAN KEBUDAYAAN');
  assert.equal(kabInfo.schoolNameLine, 'UPTD SDN 2 RAJASINGA');
  assert.equal(kabInfo.signaturePlace, 'Indramayu');

  const kotaInfo = deriveOfficialLetterhead({
    ...DEFAULT_SCHOOL_PROFILE,
    name: 'SDN 1 Kejaksan',
    address: 'Kec. Kejaksan, Kota Cirebon',
    fullAddress: 'Jl. Kartini No. 12, Kota Cirebon',
  });
  assert.equal(kotaInfo.topAgencyLine, 'PEMERINTAH KOTA CIREBON');
  assert.equal(kotaInfo.signaturePlace, 'Cirebon');
});

test('summarizeReportRows: calculates exact attendance counts and percentage', () => {
  const sampleRows: ReportRowItem[] = [
    {
      nisn: '1001',
      name: 'Ahmad',
      class: 'Kelas 1',
      gender: 'Laki-laki',
      timeIn: '06:45',
      timeOut: '13:00',
      status: 'Hadir',
      date: '2026-10-25',
    },
    {
      nisn: '1002',
      name: 'Anisa',
      class: 'Kelas 1',
      gender: 'Perempuan',
      timeIn: '06:50',
      timeOut: '-',
      status: 'Hadir',
      date: '2026-10-25',
    },
    {
      nisn: '1003',
      name: 'Banyu',
      class: 'Kelas 1',
      gender: 'Laki-laki',
      timeIn: '-',
      timeOut: '-',
      status: 'Sakit',
      date: '2026-10-25',
    },
    {
      nisn: '1004',
      name: 'Citra',
      class: 'Kelas 1',
      gender: 'Perempuan',
      timeIn: '-',
      timeOut: '-',
      status: 'Alpa',
      date: '2026-10-25',
    },
  ];

  const summary = summarizeReportRows(sampleRows);
  assert.equal(summary.total, 4);
  assert.equal(summary.hadir, 2);
  assert.equal(summary.sakit, 1);
  assert.equal(summary.izin, 0);
  assert.equal(summary.alpa, 1);
  assert.equal(summary.percentage, 50);
});

test('buildPdfFilename: formats clean PDF filenames for all classes and specific classes', () => {
  assert.equal(
    buildPdfFilename('UPTD SDN 2 RAJASINGA', '2026-10-25', 'ALL'),
    'Rekap_Presensi_UPTD_SDN_2_RAJASINGA_2026-10-25.pdf'
  );
  assert.equal(
    buildPdfFilename('UPTD SDN 2 RAJASINGA', '2026-10-25', 'Kelas 1'),
    'Rekap_Presensi_UPTD_SDN_2_RAJASINGA_Kelas_1_2026-10-25.pdf'
  );
});

test('createAttendancePdfDocument: generates valid multi-row PDF binary with %PDF- header', () => {
  const rows: ReportRowItem[] = [
    {
      nisn: '0015891001',
      name: 'Ahmad Bagus Pratama',
      class: 'Kelas 1',
      gender: 'Laki-laki',
      timeIn: '06:45',
      timeOut: '-',
      status: 'Hadir',
      date: '2026-10-25',
    },
  ];

  const doc = createAttendancePdfDocument({
    schoolProfile: DEFAULT_SCHOOL_PROFILE,
    reportRows: rows,
    selectedDate: '2026-10-25',
    selectedClass: 'ALL',
    logoPngDataUrl: null,
  });

  assert.equal(doc.getNumberOfPages(), 1);
  const rawPdf = doc.output();
  assert.ok(rawPdf.startsWith('%PDF-'));
  assert.ok(rawPdf.length > 1000);
});
