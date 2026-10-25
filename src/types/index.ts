export type UserRole = 'Admin' | 'Guru';

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export type AttendanceMode = 'Otomatis' | 'Masuk' | 'Sakit' | 'Izin' | 'Alpa';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  class: string;
  photoUrl?: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  fullAddress: string;
  headmasterName: string;
  headmasterNip: string;
  academicYear: string;
  cardSubtitle: string;
  logoUrl?: string;
}

export interface AttendanceRecord {
  id?: string;
  studentNisn: string;
  studentName: string;
  studentClass: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm or '-'
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number;
}

export interface AttendanceProcessResult {
  success: boolean;
  type: 'masuk' | 'pulang' | 'override' | 'duplicate_ignored' | 'not_found';
  message: string;
  warning?: string;
  record?: AttendanceRecord;
}

export interface BackupPayload {
  school: string;
  npsn?: string;
  backupDate: string;
  version?: string;
  schoolProfile?: SchoolProfile;
  students: Student[];
  attendanceLogs: AttendanceRecord[];
}
