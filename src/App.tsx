import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, TabId } from './components/Navigation.tsx';
import { DashboardTab } from './components/DashboardTab.tsx';
import { ScannerTab } from './components/ScannerTab.tsx';
import { StudentDataTab } from './components/StudentDataTab.tsx';
import { CardPrintTab } from './components/CardPrintTab.tsx';
import { ReportTab } from './components/ReportTab.tsx';
import { BackupCloudTab } from './components/BackupCloudTab.tsx';
import { SchoolSettingsTab } from './components/SchoolSettingsTab.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { Toast, ToastInfo } from './components/Toast.tsx';

import type {
  Student,
  AttendanceRecord,
  UserRole,
  AttendanceMode,
  AttendanceProcessResult,
  AttendanceStatus,
  BackupPayload,
  SchoolProfile,
} from './types/index.ts';

import {
  DEFAULT_STUDENTS,
  processAttendanceRecord,
  calculateAttendanceStats,
} from './utils/attendanceLogic.ts';
import {
  DEFAULT_SCHOOL_PROFILE,
  normalizeStoredSchoolProfile,
  updateStudentPhotoInList,
} from './utils/schoolSettings.ts';
import { playFeedbackSound } from './utils/audioFeedback.ts';

export default function App() {
  // School Profile State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const stored = localStorage.getItem('sdn2_school_profile');
      if (stored) {
        return normalizeStoredSchoolProfile(JSON.parse(stored));
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_SCHOOL_PROFILE;
  });

  // Students State
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem('sdn2_students');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_STUDENTS;
  });

  // Attendance Logs State
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sdn2_attendance');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }

    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: `${today}_0015891001`,
        studentNisn: '0015891001',
        studentName: 'Ahmad Bagus Pratama',
        studentClass: 'Kelas 1',
        date: today,
        timeIn: '06:45',
        timeOut: '-',
        status: 'Hadir',
      },
      {
        id: `${today}_0015891002`,
        studentNisn: '0015891002',
        studentName: 'Anisa Rahmawati',
        studentClass: 'Kelas 1',
        date: today,
        timeIn: '06:50',
        timeOut: '-',
        status: 'Hadir',
      },
      {
        id: `${today}_0015891004`,
        studentNisn: '0015891004',
        studentName: 'Citra Dewi Maharani',
        studentClass: 'Kelas 3',
        date: today,
        timeIn: '-',
        timeOut: '-',
        status: 'Izin',
      },
      {
        id: `${today}_0015891006`,
        studentNisn: '0015891006',
        studentName: 'Eka Fitriani',
        studentClass: 'Kelas 5',
        date: today,
        timeIn: '-',
        timeOut: '-',
        status: 'Sakit',
      },
    ];
  });

  // Role Authentication State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('sdn2_user_role');
    return (saved as UserRole) || 'Admin';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      id: `${Date.now()}_${Math.random()}`,
      message,
      type,
    });
  };

  // Sync School Profile to localStorage & document title
  useEffect(() => {
    try {
      localStorage.setItem('sdn2_school_profile', JSON.stringify(schoolProfile));
    } catch {
      showToast(
        'Penyimpanan lokal hampir penuh! Gunakan ukuran berkas gambar yang lebih kecil.',
        'error'
      );
    }
    document.title = `Sistem Absensi Realtime QR Code - ${schoolProfile.name}`;
  }, [schoolProfile]);

  // Sync Students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sdn2_students', JSON.stringify(students));
    } catch {
      showToast(
        'Penyimpanan lokal penuh! Tidak dapat menyimpan foto tambahan.',
        'error'
      );
    }
  }, [students]);

  // Sync Attendance to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sdn2_attendance', JSON.stringify(attendanceLogs));
    } catch {
      // Ignore quota error on logs
    }
  }, [attendanceLogs]);

  // Login & Logout
  const handleLoginSuccess = (role: UserRole) => {
    setCurrentRole(role);
    sessionStorage.setItem('sdn2_user_role', role);
    setIsLoginModalOpen(false);
    showToast(
      `Berhasil login sebagai ${role === 'Admin' ? 'Admin Sekolah' : 'Guru Piket'}.`
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sdn2_user_role');
    setIsLoginModalOpen(true);
  };

  // Tab switching with access control
  const handleTabChange = (tab: TabId) => {
    if (
      (tab === 'data' || tab === 'backup' || tab === 'settings') &&
      currentRole !== 'Admin'
    ) {
      showToast('Akses dibatasi! Fitur ini khusus Admin Sekolah.', 'error');
      playFeedbackSound('warning');
      return;
    }
    setActiveTab(tab);
  };

  // School Profile handlers
  const handleSaveSchoolProfile = (updated: SchoolProfile) => {
    setSchoolProfile(updated);
    playFeedbackSound('success');
  };

  const handleResetSchoolProfile = () => {
    setSchoolProfile({ ...DEFAULT_SCHOOL_PROFILE });
  };

  // Process Attendance
  const handleProcessAttendance = (
    input: string,
    mode: AttendanceMode
  ): AttendanceProcessResult => {
    const { updatedLogs, result } = processAttendanceRecord(
      students,
      attendanceLogs,
      input,
      mode
    );

    if (result.type === 'duplicate_ignored') {
      playFeedbackSound('warning');
      showToast(result.warning || result.message, 'error');
    } else if (result.success) {
      setAttendanceLogs(updatedLogs);
      playFeedbackSound('success');
      showToast(result.message, 'success');
    } else {
      playFeedbackSound('error');
      showToast(result.message, 'error');
    }

    return result;
  };

  // Quick update status in report tab
  const handleQuickUpdateStatus = (
    nisn: string,
    status: AttendanceStatus,
    targetDate: string
  ) => {
    const student = students.find((s) => s.nisn === nisn);
    if (!student) return;

    const timeNow = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setAttendanceLogs((prev) => {
      const idx = prev.findIndex(
        (l) => l.studentNisn === nisn && l.date === targetDate
      );
      if (idx === -1) {
        return [
          {
            id: `${targetDate}_${nisn}`,
            studentNisn: nisn,
            studentName: student.name,
            studentClass: student.class,
            date: targetDate,
            timeIn: status === 'Hadir' ? timeNow : '-',
            timeOut: '-',
            status,
          },
          ...prev,
        ];
      } else {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status,
          timeIn:
            status === 'Hadir' && copy[idx].timeIn === '-'
              ? timeNow
              : copy[idx].timeIn,
        };
        return copy;
      }
    });

    playFeedbackSound('success');
  };

  // Student CRUD & Photo operations
  const handleSaveStudent = (student: Student) => {
    setStudents((prev) => {
      const idx = prev.findIndex(
        (s) => s.id === student.id || s.nisn === student.nisn
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = student;
        return copy;
      }
      return [...prev, student];
    });
  };

  const handleUpdateStudentPhoto = (studentId: string, photoUrl: string) => {
    setStudents((prev) => updateStudentPhotoInList(prev, studentId, photoUrl));
    playFeedbackSound('success');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleImportStudents = (newStudents: Student[]) => {
    setStudents((prev) => {
      const map = new Map<string, Student>();
      prev.forEach((s) => map.set(s.nisn, s));
      newStudents.forEach((s) => {
        const existing = map.get(s.nisn);
        map.set(s.nisn, {
          ...s,
          photoUrl: s.photoUrl || existing?.photoUrl,
        });
      });
      return Array.from(map.values());
    });
  };

  // Backup & Reset operations
  const handleRestoreBackup = (payload: BackupPayload) => {
    setStudents(payload.students);
    setAttendanceLogs(payload.attendanceLogs);
    if (payload.schoolProfile) {
      setSchoolProfile(normalizeStoredSchoolProfile(payload.schoolProfile));
    } else if (payload.school) {
      setSchoolProfile((prev) => ({
        ...prev,
        name: payload.school,
        npsn: payload.npsn || prev.npsn,
      }));
    }
  };

  const handleResetToDefaults = () => {
    setStudents(DEFAULT_STUDENTS);
  };

  const handleClearAttendance = () => {
    setAttendanceLogs([]);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayStats = calculateAttendanceStats(students, attendanceLogs, today);
  const todayLogs = attendanceLogs.filter((l) => l.date === today);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Header */}
      <Header
        schoolProfile={schoolProfile}
        currentRole={currentRole}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenSettings={() => handleTabChange('settings')}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            schoolProfile={schoolProfile}
            students={students}
            stats={todayStats}
            todayLogs={todayLogs}
            onNavigateToScan={() => setActiveTab('scan')}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'scan' && (
          <ScannerTab
            schoolProfile={schoolProfile}
            students={students}
            todayLogs={todayLogs}
            onProcessAttendance={handleProcessAttendance}
          />
        )}

        {activeTab === 'data' && (
          <StudentDataTab
            students={students}
            schoolProfile={schoolProfile}
            onSaveStudent={handleSaveStudent}
            onUpdateStudentPhoto={handleUpdateStudentPhoto}
            onDeleteStudent={handleDeleteStudent}
            onImportStudents={handleImportStudents}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'card' && (
          <CardPrintTab
            students={students}
            schoolProfile={schoolProfile}
            currentRole={currentRole}
            onUpdateStudentPhoto={handleUpdateStudentPhoto}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab
            schoolProfile={schoolProfile}
            students={students}
            logs={attendanceLogs}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'backup' && (
          <BackupCloudTab
            schoolProfile={schoolProfile}
            students={students}
            attendanceLogs={attendanceLogs}
            onRestoreBackup={handleRestoreBackup}
            onResetToDefaults={handleResetToDefaults}
            onClearAttendance={handleClearAttendance}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <SchoolSettingsTab
            schoolProfile={schoolProfile}
            students={students}
            onSaveSchoolProfile={handleSaveSchoolProfile}
            onResetSchoolProfile={handleResetSchoolProfile}
            onNavigateToStudentData={() => setActiveTab('data')}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <p>
          &copy; {new Date().getFullYear()} {schoolProfile.name} · {schoolProfile.address} · NPSN {schoolProfile.npsn}
        </p>
      </footer>

      {/* Login Dialog Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        schoolProfile={schoolProfile}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
