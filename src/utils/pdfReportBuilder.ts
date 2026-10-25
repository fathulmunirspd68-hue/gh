import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AttendanceStatus, SchoolProfile } from '../types/index.ts';
import { createSchoolSlug } from './schoolSettings.ts';

export interface ReportRowItem {
  nisn: string;
  name: string;
  class: string;
  gender: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceStatus;
  date: string;
}

export interface OfficialLetterheadInfo {
  topAgencyLine: string;
  departmentLine: string;
  schoolNameLine: string;
  addressLine: string;
  metaLine: string;
  signaturePlace: string;
}

export interface ReportSummaryCounts {
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number;
}

/**
 * Derive standard Indonesian official school letterhead (Kop Surat Resmi) lines
 * from the configured SchoolProfile.
 */
export function deriveOfficialLetterhead(
  schoolProfile: SchoolProfile
): OfficialLetterheadInfo {
  const combinedRegion = `${schoolProfile.address}, ${schoolProfile.fullAddress || ''}`;

  const kabMatch = combinedRegion.match(/Kab(?:upaten|\.)?\s+([A-Za-z\s]+?)(?:,|$)/i);
  const kotaMatch = combinedRegion.match(/Kota\s+([A-Za-z\s]+?)(?:,|$)/i);
  const kecMatch = combinedRegion.match(/Kec(?:amatan|\.)?\s+([A-Za-z\s]+?)(?:,|$)/i);

  let topAgencyLine = 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH';
  let signaturePlace = schoolProfile.address.split(',')[0]?.trim() || 'Indramayu';

  if (kabMatch && kabMatch[1]) {
    const kabName = kabMatch[1].trim();
    topAgencyLine = `PEMERINTAH KABUPATEN ${kabName.toUpperCase()}`;
    signaturePlace = kabName;
  } else if (kotaMatch && kotaMatch[1]) {
    const kotaName = kotaMatch[1].trim();
    topAgencyLine = `PEMERINTAH KOTA ${kotaName.toUpperCase()}`;
    signaturePlace = kotaName;
  } else if (kecMatch && kecMatch[1]) {
    signaturePlace = kecMatch[1].trim();
  }

  const departmentLine = 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const schoolNameLine = schoolProfile.name.trim().toUpperCase();
  const addressLine = (schoolProfile.fullAddress || schoolProfile.address).trim();
  const metaLine = `NPSN: ${schoolProfile.npsn}   |   Wilayah: ${schoolProfile.address}   |   Tahun Pelajaran: ${schoolProfile.academicYear || '2026/2027'}`;

  return {
    topAgencyLine,
    departmentLine,
    schoolNameLine,
    addressLine,
    metaLine,
    signaturePlace,
  };
}

/**
 * Compute attendance summary counts directly from the filtered report rows.
 */
export function summarizeReportRows(rows: ReportRowItem[]): ReportSummaryCounts {
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  for (const r of rows) {
    if (r.status === 'Hadir') hadir++;
    else if (r.status === 'Sakit') sakit++;
    else if (r.status === 'Izin') izin++;
    else alpa++;
  }

  const total = rows.length;
  const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return {
    total,
    hadir,
    sakit,
    izin,
    alpa,
    percentage,
  };
}

/**
 * Format YYYY-MM-DD into Indonesian full date and short date strings.
 */
export function formatReportDatesIndo(isoDate: string): {
  fullDateWithDay: string;
  dateOnly: string;
} {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { fullDateWithDay: isoDate, dateOnly: isoDate };
  }

  return {
    fullDateWithDay: parsed.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    dateOnly: parsed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

/**
 * Build deterministic PDF filename from school name, class filter, and date.
 */
export function buildPdfFilename(
  schoolName: string,
  selectedDate: string,
  selectedClass: string = 'ALL'
): string {
  const schoolSlug = createSchoolSlug(schoolName);
  const classPart =
    selectedClass && selectedClass !== 'ALL'
      ? `_${createSchoolSlug(selectedClass)}`
      : '';
  return `Rekap_Presensi_${schoolSlug}${classPart}_${selectedDate}.pdf`;
}

/**
 * Rasterize any school logo (PNG, JPEG, WEBP, or SVG) or draw a crisp default emblem
 * onto an offscreen canvas in browser environments so jsPDF can embed it cleanly as PNG.
 */
async function resolveLogoPngDataUrl(logoUrl?: string): Promise<string | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const drawFallbackEmblem = (): string | null => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Outer shield/circle emblem
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(120, 120, 108, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(120, 120, 96, 0, Math.PI * 2);
    ctx.stroke();

    // Graduation / school roof motif
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(120, 52);
    ctx.lineTo(184, 86);
    ctx.lineTo(120, 116);
    ctx.lineTo(56, 86);
    ctx.closePath();
    ctx.fill();

    // School building body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(76, 118, 88, 56);

    // Pillars / door
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(92, 132, 14, 42);
    ctx.fillRect(113, 132, 14, 42);
    ctx.fillRect(134, 132, 14, 42);

    return canvas.toDataURL('image/png');
  };

  if (!logoUrl || !logoUrl.trim()) {
    return drawFallbackEmblem();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(drawFallbackEmblem());
          return;
        }

        const ratio = Math.min(size / img.width, size / img.height);
        const drawW = Math.max(1, Math.round(img.width * ratio));
        const drawH = Math.max(1, Math.round(img.height * ratio));
        const offsetX = Math.round((size - drawW) / 2);
        const offsetY = Math.round((size - drawH) / 2);

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(drawFallbackEmblem());
      }
    };
    img.onerror = () => {
      resolve(drawFallbackEmblem());
    };
    img.src = logoUrl;
  });
}

export interface CreateAttendancePdfParams {
  schoolProfile: SchoolProfile;
  reportRows: ReportRowItem[];
  selectedDate: string;
  selectedClass: string;
  logoPngDataUrl?: string | null;
}

/**
 * Construct the jsPDF instance with official Indonesian Kop Sekolah, summary box,
 * attendance table, signature block, and page footers.
 */
export function createAttendancePdfDocument({
  schoolProfile,
  reportRows,
  selectedDate,
  selectedClass,
  logoPngDataUrl,
}: CreateAttendancePdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const letterhead = deriveOfficialLetterhead(schoolProfile);
  const summary = summarizeReportRows(reportRows);
  const { fullDateWithDay, dateOnly } = formatReportDatesIndo(selectedDate);
  const classLabel = selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm

  // 1. KOP SURAT RESMI SEKOLAH
  if (logoPngDataUrl) {
    try {
      doc.addImage(logoPngDataUrl, 'PNG', marginX + 1, 11.5, 21, 21);
    } catch {
      // Ignore logo embed error and keep text letterhead intact
    }
  }

  const textCenterX = pageWidth / 2 + 8; // Optically balanced to the right of left logo
  const maxHeaderTextWidth = 148;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(letterhead.topAgencyLine, textCenterX, 15, {
    align: 'center',
    maxWidth: maxHeaderTextWidth,
  });

  doc.setFontSize(9.5);
  doc.text(letterhead.departmentLine, textCenterX, 19.8, {
    align: 'center',
    maxWidth: maxHeaderTextWidth,
  });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(letterhead.schoolNameLine, textCenterX, 26, {
    align: 'center',
    maxWidth: maxHeaderTextWidth,
  });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.text(letterhead.addressLine, textCenterX, 30.8, {
    align: 'center',
    maxWidth: maxHeaderTextWidth,
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(letterhead.metaLine, textCenterX, 35, {
    align: 'center',
    maxWidth: maxHeaderTextWidth,
  });

  // Double Horizontal Kop Surat Border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.9);
  doc.line(marginX, 38, pageWidth - marginX, 38);
  doc.setLineWidth(0.25);
  doc.line(marginX, 39.1, pageWidth - marginX, 39.1);

  // 2. JUDUL LAPORAN
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('LAPORAN REKAPITULASI PRESENSI KEHADIRAN SISWA', pageWidth / 2, 46.5, {
    align: 'center',
  });
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 56, 47.6, pageWidth / 2 + 56, 47.6);

  // Metadata Sub-block
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`Hari / Tanggal : ${fullDateWithDay}`, marginX, 54);
  doc.text(`Filter Kelas     : ${classLabel}`, marginX, 59);

  doc.text(
    `Tahun Pelajaran     : ${schoolProfile.academicYear || '2026/2027'}`,
    pageWidth - marginX,
    54,
    { align: 'right' }
  );
  doc.text(
    `Tingkat Kehadiran : ${summary.percentage}% (${summary.hadir}/${summary.total} Siswa)`,
    pageWidth - marginX,
    59,
    { align: 'right' }
  );

  // 3. RINGKASAN STATISTIK KOTAK
  const boxY = 63;
  const boxH = 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, boxY, contentWidth, boxH, 1.5, 1.5, 'FD');

  const statItems = [
    { label: 'Total Siswa', val: `${summary.total}`, color: [15, 23, 42] as [number, number, number] },
    { label: 'Hadir', val: `${summary.hadir}`, color: [21, 128, 61] as [number, number, number] },
    { label: 'Sakit', val: `${summary.sakit}`, color: [180, 83, 9] as [number, number, number] },
    { label: 'Izin', val: `${summary.izin}`, color: [29, 78, 216] as [number, number, number] },
    { label: 'Tanpa Ket. (Alpa)', val: `${summary.alpa}`, color: [190, 18, 60] as [number, number, number] },
  ];

  const colW = contentWidth / statItems.length;
  statItems.forEach((item, idx) => {
    const centerX = marginX + colW * idx + colW / 2;
    if (idx > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX + colW * idx, boxY + 2, marginX + colW * idx, boxY + boxH - 2);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, centerX, boxY + 4.6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(`${item.val} Siswa`, centerX, boxY + 9.6, { align: 'center' });
  });

  // 4. TABEL DATA PRESENSI
  const tableBody = reportRows.map((row, idx) => [
    String(idx + 1),
    row.nisn,
    row.name,
    row.gender === 'Perempuan' ? 'P' : 'L',
    row.class,
    row.timeIn,
    row.timeOut,
    row.status,
  ]);

  autoTable(doc, {
    startY: 79,
    margin: { left: marginX, right: marginX, bottom: 22 },
    head: [
      [
        'No',
        'NISN',
        'Nama Lengkap Siswa',
        'L/P',
        'Kelas',
        'Jam Masuk',
        'Jam Pulang',
        'Keterangan',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.4,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'left', cellWidth: 'auto', fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 11 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 21 },
      6: { halign: 'center', cellWidth: 21 },
      7: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 7) {
        const val = String(hookData.cell.raw || '');
        if (val === 'Hadir') {
          hookData.cell.styles.textColor = [21, 128, 61];
        } else if (val === 'Sakit') {
          hookData.cell.styles.textColor = [180, 83, 9];
        } else if (val === 'Izin') {
          hookData.cell.styles.textColor = [29, 78, 216];
        } else {
          hookData.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
  });

  // 5. BLOK TANDA TANGAN KEPALA SEKOLAH
  const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  let sigY = (lastAutoTable?.finalY ?? 120) + 10;

  if (sigY + 42 > pageHeight - 18) {
    doc.addPage();
    sigY = 24;
  }

  const sigLeftX = pageWidth - marginX - 68;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${letterhead.signaturePlace}, ${dateOnly}`, sigLeftX, sigY);
  doc.text('Mengetahui,', sigLeftX, sigY + 5);
  doc.text(`Kepala ${schoolProfile.name}`, sigLeftX, sigY + 10, { maxWidth: 68 });

  const headmasterName = schoolProfile.headmasterName?.trim() || `Kepala ${schoolProfile.name}`;
  const headmasterNip = schoolProfile.headmasterNip?.trim() || '-';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(headmasterName, sigLeftX, sigY + 31);

  const nameWidth = Math.min(doc.getTextWidth(headmasterName), 68);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, sigY + 31.8, sigLeftX + nameWidth, sigY + 31.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`NIP. ${headmasterNip}`, sigLeftX, sigY + 36.2);

  // 6. FOOTER NOMOR HALAMAN DI SETIAP HALAMAN
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dokumen Presensi Digital Resmi — ${schoolProfile.name} (NPSN: ${schoolProfile.npsn})`,
      marginX,
      pageHeight - 8.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8.5, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Generate and trigger browser download of the official attendance PDF report.
 */
export async function exportAttendanceReportPdf(
  params: Omit<CreateAttendancePdfParams, 'logoPngDataUrl'>
): Promise<string> {
  const logoPngDataUrl = await resolveLogoPngDataUrl(params.schoolProfile.logoUrl);
  const doc = createAttendancePdfDocument({
    ...params,
    logoPngDataUrl,
  });

  const filename = buildPdfFilename(
    params.schoolProfile.name,
    params.selectedDate,
    params.selectedClass
  );
  doc.save(filename);
  return filename;
}
