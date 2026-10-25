import type { SchoolProfile, Student } from '../types/index.ts';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'UPTD SDN 2 RAJASINGA',
  npsn: '20216000',
  address: 'Kec. Terisi, Kab. Indramayu',
  fullAddress: 'Desa Rajasinga, Kec. Terisi, Kab. Indramayu, Jawa Barat',
  headmasterName: 'Kepala UPTD SDN 2 Rajasinga',
  headmasterNip: '-',
  academicYear: '2026/2027',
  cardSubtitle: 'KARTU IDENTITAS PRESENSI SISWA',
  logoUrl: '',
};

export interface SchoolProfileValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: SchoolProfile;
}

/**
 * Validate school profile form submission without silently substituting empty required fields.
 */
export function validateSchoolProfileInput(
  input: Partial<SchoolProfile>
): SchoolProfileValidationResult {
  const name = (input.name ?? '').trim();
  const npsn = (input.npsn ?? '').trim();
  const address = (input.address ?? '').trim();
  const fullAddress = (input.fullAddress ?? '').trim();
  const headmasterName = (input.headmasterName ?? '').trim();
  const headmasterNip = (input.headmasterNip ?? '').trim();
  const academicYear = (input.academicYear ?? '').trim();
  const cardSubtitle = (input.cardSubtitle ?? '').trim();
  const logoUrl = (input.logoUrl ?? '').trim();

  if (!name) {
    return { valid: false, error: 'Nama sekolah wajib diisi!' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Nama sekolah minimal terdiri dari 3 karakter.' };
  }
  if (!npsn) {
    return { valid: false, error: 'Nomor Pokok Sekolah Nasional (NPSN) wajib diisi!' };
  }
  if (!address) {
    return { valid: false, error: 'Wilayah singkat (Kecamatan / Kabupaten) wajib diisi!' };
  }

  return {
    valid: true,
    sanitized: {
      name,
      npsn,
      address,
      fullAddress: fullAddress || address,
      headmasterName: headmasterName || '-',
      headmasterNip: headmasterNip || '-',
      academicYear: academicYear || '2026/2027',
      cardSubtitle: cardSubtitle || 'KARTU IDENTITAS PRESENSI SISWA',
      logoUrl,
    },
  };
}

/**
 * Safely normalize persisted school profile from localStorage or JSON backup.
 */
export function normalizeStoredSchoolProfile(raw: unknown): SchoolProfile {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SCHOOL_PROFILE };
  }

  const p = raw as Partial<SchoolProfile>;
  return {
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : DEFAULT_SCHOOL_PROFILE.name,
    npsn: typeof p.npsn === 'string' && p.npsn.trim() ? p.npsn.trim() : DEFAULT_SCHOOL_PROFILE.npsn,
    address:
      typeof p.address === 'string' && p.address.trim()
        ? p.address.trim()
        : DEFAULT_SCHOOL_PROFILE.address,
    fullAddress:
      typeof p.fullAddress === 'string' && p.fullAddress.trim()
        ? p.fullAddress.trim()
        : DEFAULT_SCHOOL_PROFILE.fullAddress,
    headmasterName:
      typeof p.headmasterName === 'string' && p.headmasterName.trim()
        ? p.headmasterName.trim()
        : DEFAULT_SCHOOL_PROFILE.headmasterName,
    headmasterNip:
      typeof p.headmasterNip === 'string' && p.headmasterNip.trim()
        ? p.headmasterNip.trim()
        : DEFAULT_SCHOOL_PROFILE.headmasterNip,
    academicYear:
      typeof p.academicYear === 'string' && p.academicYear.trim()
        ? p.academicYear.trim()
        : DEFAULT_SCHOOL_PROFILE.academicYear,
    cardSubtitle:
      typeof p.cardSubtitle === 'string' && p.cardSubtitle.trim()
        ? p.cardSubtitle.trim()
        : DEFAULT_SCHOOL_PROFILE.cardSubtitle,
    logoUrl: typeof p.logoUrl === 'string' ? p.logoUrl : '',
  };
}

/**
 * Pure helper to update or clear a student's photo URL by student ID.
 */
export function updateStudentPhotoInList(
  students: Student[],
  studentId: string,
  photoUrl: string
): Student[] {
  return students.map((student) =>
    student.id === studentId
      ? {
          ...student,
          photoUrl: photoUrl.trim() || undefined,
        }
      : student
  );
}

/**
 * Count how many students currently have an uploaded photo.
 */
export function countStudentsWithPhotos(students: Student[]): number {
  return students.filter((s) => Boolean(s.photoUrl && s.photoUrl.trim())).length;
}

/**
 * Create a filesystem-safe slug from the school name for exported filenames.
 */
export function createSchoolSlug(schoolName: string): string {
  const cleaned = schoolName
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_');
  return cleaned || 'Sekolah';
}
