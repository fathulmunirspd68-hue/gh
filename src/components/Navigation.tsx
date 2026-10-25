import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  Users,
  IdCard,
  FileSpreadsheet,
  CloudUpload,
  Settings,
  Lock,
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';

export type TabId =
  | 'dashboard'
  | 'scan'
  | 'data'
  | 'card'
  | 'report'
  | 'backup'
  | 'settings';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  currentRole: UserRole | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentRole,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabId,
      label: 'Dashboard Realtime',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'scan' as TabId,
      label: 'Scan QR Presensi',
      icon: QrCode,
      adminOnly: false,
    },
    {
      id: 'data' as TabId,
      label: 'Data Siswa',
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'card' as TabId,
      label: 'Cetak Kartu Siswa',
      icon: IdCard,
      adminOnly: false,
    },
    {
      id: 'report' as TabId,
      label: 'Rekap Laporan',
      icon: FileSpreadsheet,
      adminOnly: false,
    },
    {
      id: 'backup' as TabId,
      label: 'Backup & Cloud',
      icon: CloudUpload,
      adminOnly: true,
    },
    {
      id: 'settings' as TabId,
      label: 'Pengaturan Sekolah',
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="bg-white shadow-xs border-b border-slate-200 no-print sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 sm:gap-1.5 overflow-x-auto py-2.5 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLocked = tab.adminOnly && currentRole !== 'Admin';

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isLocked
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isLocked ? 'Khusus Admin Sekolah' : tab.label}
              >
                <Icon
                  className={`w-4 h-4 mr-2 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
                {isLocked && (
                  <Lock className="w-3 h-3 ml-1.5 text-slate-400 shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
