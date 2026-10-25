import type {
  Student,
  AttendanceRecord,
  AttendanceMode,
  AttendanceProcessResult,
  AttendanceStats,
  BackupPayload,
} from '../types/index.ts';

export const DEFAULT_STUDENTS: Student[] = [
  { id: '101', nisn: '0015891001', name: 'Ahmad Bagus Pratama', gender: 'Laki-laki', class: 'Kelas 1' },
  { id: '102', nisn: '0015891002', name: 'Anisa Rahmawati', gender: 'Perempuan', class: 'Kelas 1' },
  { id: '103', nisn: '0015891003', name: 'Banyu Segara', gender: 'Laki-laki', class: 'Kelas 2' },
  { id: '104', nisn: '0015891004', name: 'Citra Dewi Maharani', gender: 'Perempuan', class: 'Kelas 3' },
  { id: '105', nisn: '0015891005', name: 'Dimas Anggara', gender: 'Laki-laki', class: 'Kelas 4' },
  { id: '106', nisn: '0015891006', name: 'Eka Fitriani', gender: 'Perempuan', class: 'Kelas 5' },
  { id: '107', nisn: '0015891007', name: 'Fajar Ramadan', gender: 'Laki-laki', class: 'Kelas 6' },
  { id: '108', nisn: '0015891008', name: 'Gita Permatasari', gender: 'Perempuan', class: 'Kelas 6' },
];

/**
 * Process an attendance scan or manual entry
 */
export function processAttendanceRecord(
  students: Student[],
  existingLogs: AttendanceRecord[],
  scanInput: string,
  mode: AttendanceMode = 'Otomatis',
  customTime?: { date: string; time: string }
): { updatedLogs: AttendanceRecord[]; result: AttendanceProcessResult } {
  const cleanInput = scanInput.trim();
  const student = students.find(
    (s) => s.nisn === cleanInput || s.id === cleanInput || s.name.toLowerCase() === cleanInput.toLowerCase()
  );

  if (!student) {
    return {
      updatedLogs: existingLogs,
      result: {
        success: false,
        type: 'not_found',
        message: `Siswa dengan NISN/ID "${cleanInput}" tidak ditemukan!`,
      },
    };
  }

  const today = customTime ? customTime.date : new Date().toISOString().split('T')[0];
  const timeNow = customTime
    ? customTime.time
    : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const existingLogIndex = existingLogs.findIndex(
    (l) => l.studentNisn === student.nisn && l.date === today
  );

  const logsCopy = [...existingLogs];

  if (mode === 'Otomatis') {
    if (existingLogIndex === -1) {
      // First scan of the day -> Check In (Masuk)
      const newRecord: AttendanceRecord = {
        id: `${today}_${student.nisn}`,
        studentNisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        date: today,
        timeIn: timeNow,
        timeOut: '-',
        status: 'Hadir',
      };
      logsCopy.unshift(newRecord);
      return {
        updatedLogs: logsCopy,
        result: {
          success: true,
          type: 'masuk',
          message: `Presensi MASUK Berhasil: ${student.name} (${student.class})`,
          record: newRecord,
        },
      };
    } else {
      const existing = logsCopy[existingLogIndex];
      if (existing.timeOut !== '-') {
        // Anti-Duplicate triggered: Already checked out
        return {
          updatedLogs: existingLogs,
          result: {
            success: false,
            type: 'duplicate_ignored',
            message: `Scan Ganda Diabaikan! ${student.name} sudah selesai absen hari ini.`,
            warning: `[SCAN GANDA DILEWATI] ${student.name} Sudah Absen Pulang hari ini pukul ${existing.timeOut}`,
            record: existing,
          },
        };
      } else {
        // Second scan of the day -> Check Out (Pulang)
        const updatedRecord: AttendanceRecord = {
          ...existing,
          timeOut: timeNow,
        };
        logsCopy[existingLogIndex] = updatedRecord;
        return {
          updatedLogs: logsCopy,
          result: {
            success: true,
            type: 'pulang',
            message: `Presensi PULANG Berhasil: ${student.name} (${student.class})`,
            record: updatedRecord,
          },
        };
      }
    }
  } else {
    // Explicit Mode: Masuk, Sakit, Izin, Alpa
    const targetStatus = mode === 'Masuk' ? 'Hadir' : mode;

    if (existingLogIndex !== -1 && logsCopy[existingLogIndex].status === targetStatus) {
      return {
        updatedLogs: existingLogs,
        result: {
          success: false,
          type: 'duplicate_ignored',
          message: `Siswa sudah tercatat dengan status "${targetStatus}".`,
          warning: `[SCAN GANDA DILEWATI] Status ${student.name} sudah tercatat '${targetStatus}' hari ini!`,
          record: logsCopy[existingLogIndex],
        },
      };
    }

    if (existingLogIndex === -1) {
      const newRecord: AttendanceRecord = {
        id: `${today}_${student.nisn}`,
        studentNisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        date: today,
        timeIn: targetStatus === 'Hadir' ? timeNow : '-',
        timeOut: '-',
        status: targetStatus,
      };
      logsCopy.unshift(newRecord);
      return {
        updatedLogs: logsCopy,
        result: {
          success: true,
          type: 'override',
          message: `Status ${student.name} berhasil dicatat sebagai "${targetStatus}".`,
          record: newRecord,
        },
      };
    } else {
      const updatedRecord: AttendanceRecord = {
        ...logsCopy[existingLogIndex],
        status: targetStatus,
        timeIn:
          targetStatus === 'Hadir' && logsCopy[existingLogIndex].timeIn === '-'
            ? timeNow
            : logsCopy[existingLogIndex].timeIn,
      };
      logsCopy[existingLogIndex] = updatedRecord;
      return {
        updatedLogs: logsCopy,
        result: {
          success: true,
          type: 'override',
          message: `Status ${student.name} diperbarui menjadi "${targetStatus}".`,
          record: updatedRecord,
        },
      };
    }
  }
}

/**
 * Calculate attendance statistics for a given date
 */
export function calculateAttendanceStats(
  students: Student[],
  logs: AttendanceRecord[],
  targetDate: string
): AttendanceStats {
  const targetLogs = logs.filter((l) => l.date === targetDate);
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  students.forEach((student) => {
    const record = targetLogs.find((l) => l.studentNisn === student.nisn);
    if (!record) {
      alpa++;
    } else if (record.status === 'Hadir') {
      hadir++;
    } else if (record.status === 'Sakit') {
      sakit++;
    } else if (record.status === 'Izin') {
      izin++;
    } else if (record.status === 'Alpa') {
      alpa++;
    }
  });

  const total = students.length;
  const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return {
    totalStudents: total,
    hadir,
    sakit,
    izin,
    alpa,
    percentage,
  };
}

/**
 * Filter students by search term and class
 */
export function filterStudents(
  students: Student[],
  searchQuery: string = '',
  selectedClass: string = ''
): Student[] {
  const query = searchQuery.trim().toLowerCase();
  return students.filter((s) => {
    const matchesQuery =
      query === '' ||
      s.name.toLowerCase().includes(query) ||
      s.nisn.includes(query) ||
      s.class.toLowerCase().includes(query);
    const matchesClass =
      !selectedClass || selectedClass === 'ALL' || s.class === selectedClass;
    return matchesQuery && matchesClass;
  });
}

/**
 * Build consolidated report for all students on a date
 */
export function buildAttendanceReport(
  students: Student[],
  logs: AttendanceRecord[],
  date: string,
  selectedClass: string = 'ALL'
): {
  nisn: string;
  name: string;
  class: string;
  gender: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceRecord['status'];
  date: string;
}[] {
  const filteredStudents = filterStudents(students, '', selectedClass);
  const dateLogs = logs.filter((l) => l.date === date);

  return filteredStudents.map((s) => {
    const record = dateLogs.find((l) => l.studentNisn === s.nisn);
    return {
      nisn: s.nisn,
      name: s.name,
      class: s.class,
      gender: s.gender,
      timeIn: record ? record.timeIn : '-',
      timeOut: record ? record.timeOut : '-',
      status: record ? record.status : 'Alpa',
      date,
    };
  });
}

/**
 * Validate imported backup payload
 */
export function validateBackupPayload(data: unknown): data is BackupPayload {
  if (!data || typeof data !== 'object') return false;
  const p = data as Partial<BackupPayload>;
  return Array.isArray(p.students) && Array.isArray(p.attendanceLogs);
}
