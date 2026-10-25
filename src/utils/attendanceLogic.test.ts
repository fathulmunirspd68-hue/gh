import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STUDENTS,
  processAttendanceRecord,
  calculateAttendanceStats,
  filterStudents,
  buildAttendanceReport,
  validateBackupPayload,
} from './attendanceLogic.ts';
import type { AttendanceRecord, Student } from '../types/index.ts';

const mockStudents: Student[] = [
  { id: '1', nisn: '1001', name: 'Ahmad Bagus Pratama', gender: 'Laki-laki', class: 'Kelas 1' },
  { id: '2', nisn: '1002', name: 'Anisa Rahmawati', gender: 'Perempuan', class: 'Kelas 1' },
  { id: '3', nisn: '1003', name: 'Banyu Segara', gender: 'Laki-laki', class: 'Kelas 2' },
  { id: '4', nisn: '1004', name: 'Citra Dewi Maharani', gender: 'Perempuan', class: 'Kelas 3' },
];

test('processAttendanceRecord: records check-in (Masuk) on clean state', () => {
  const existingLogs: AttendanceRecord[] = [];
  const { updatedLogs, result } = processAttendanceRecord(
    mockStudents,
    existingLogs,
    '1001',
    'Otomatis',
    { date: '2026-10-17', time: '07:05' }
  );

  assert.equal(result.success, true);
  assert.equal(result.type, 'masuk');
  assert.equal(updatedLogs.length, 1);
  assert.equal(updatedLogs[0].studentNisn, '1001');
  assert.equal(updatedLogs[0].timeIn, '07:05');
  assert.equal(updatedLogs[0].timeOut, '-');
  assert.equal(updatedLogs[0].status, 'Hadir');
});

test('processAttendanceRecord: records check-out (Pulang) on second scan', () => {
  const existingLogs: AttendanceRecord[] = [
    {
      id: '2026-10-17_1001',
      studentNisn: '1001',
      studentName: 'Ahmad Bagus Pratama',
      studentClass: 'Kelas 1',
      date: '2026-10-17',
      timeIn: '07:05',
      timeOut: '-',
      status: 'Hadir',
    },
  ];

  const { updatedLogs, result } = processAttendanceRecord(
    mockStudents,
    existingLogs,
    '1001',
    'Otomatis',
    { date: '2026-10-17', time: '13:30' }
  );

  assert.equal(result.success, true);
  assert.equal(result.type, 'pulang');
  assert.equal(updatedLogs.length, 1);
  assert.equal(updatedLogs[0].timeIn, '07:05');
  assert.equal(updatedLogs[0].timeOut, '13:30');
});

test('processAttendanceRecord: anti-duplicate blocks scan after student already checked out', () => {
  const existingLogs: AttendanceRecord[] = [
    {
      id: '2026-10-17_1001',
      studentNisn: '1001',
      studentName: 'Ahmad Bagus Pratama',
      studentClass: 'Kelas 1',
      date: '2026-10-17',
      timeIn: '07:05',
      timeOut: '13:30',
      status: 'Hadir',
    },
  ];

  const { updatedLogs, result } = processAttendanceRecord(
    mockStudents,
    existingLogs,
    '1001',
    'Otomatis',
    { date: '2026-10-17', time: '13:35' }
  );

  assert.equal(result.success, false);
  assert.equal(result.type, 'duplicate_ignored');
  assert.match(result.warning || '', /SCAN GANDA DILEWATI/);
  assert.equal(updatedLogs.length, 1);
});

test('processAttendanceRecord: handles non-existent student NISN gracefully', () => {
  const existingLogs: AttendanceRecord[] = [];
  const { updatedLogs, result } = processAttendanceRecord(
    mockStudents,
    existingLogs,
    '9999999',
    'Otomatis'
  );

  assert.equal(result.success, false);
  assert.equal(result.type, 'not_found');
  assert.equal(updatedLogs.length, 0);
});

test('calculateAttendanceStats: calculates stats and percentages accurately', () => {
  const logs: AttendanceRecord[] = [
    {
      studentNisn: '1001',
      studentName: 'Ahmad',
      studentClass: 'Kelas 1',
      date: '2026-10-17',
      timeIn: '07:00',
      timeOut: '-',
      status: 'Hadir',
    },
    {
      studentNisn: '1002',
      studentName: 'Anisa',
      studentClass: 'Kelas 1',
      date: '2026-10-17',
      timeIn: '-',
      timeOut: '-',
      status: 'Sakit',
    },
    {
      studentNisn: '1003',
      studentName: 'Banyu',
      studentClass: 'Kelas 2',
      date: '2026-10-17',
      timeIn: '-',
      timeOut: '-',
      status: 'Izin',
    },
  ];
  const stats = calculateAttendanceStats(mockStudents, logs, '2026-10-17');

  assert.equal(stats.totalStudents, 4);
  assert.equal(stats.hadir, 1);
  assert.equal(stats.sakit, 1);
  assert.equal(stats.izin, 1);
  assert.equal(stats.alpa, 1);
  assert.equal(stats.percentage, 25);
});

test('filterStudents: filters by text query and class correctly', () => {
  const filteredByName = filterStudents(mockStudents, 'anisa');
  assert.equal(filteredByName.length, 1);
  assert.equal(filteredByName[0].nisn, '1002');

  const filteredByClass = filterStudents(mockStudents, '', 'Kelas 1');
  assert.equal(filteredByClass.length, 2);

  const filteredByCombined = filterStudents(mockStudents, '1003', 'Kelas 2');
  assert.equal(filteredByCombined.length, 1);
});

test('validateBackupPayload: verifies structure', () => {
  assert.equal(
    validateBackupPayload({
      school: 'UPTD SDN 2 RAJASINGA',
      backupDate: '2026-10-17',
      students: mockStudents,
      attendanceLogs: [],
    }),
    true
  );

  assert.equal(validateBackupPayload({ foo: 'bar' }), false);
  assert.equal(validateBackupPayload(null), false);
});
