import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BrainCircuit,
  ShieldCheck,
  FileCheck2,
  Database,
  Grid,
  CreditCard,
  FileText,
  Printer,
  MonitorPlay,
  CheckSquare,
  BarChart3,
  BookOpenCheck,
  TrendingUp,
  GraduationCap,
  ScrollText,
  Server,
  Users,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  isCollapsed?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: UserRole[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, userRole }) => {
  const navGroups: NavGroup[] = [
    {
      group: 'MENU UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'MODUL ASESMEN & AI',
      items: [
        { id: 'assessments', label: 'Daftar Asesmen', icon: FileSpreadsheet },
        { id: 'generator', label: 'AI Question Generator', icon: BrainCircuit, badge: 'Gemini AI' },
        { id: 'validation', label: 'Validasi Soal', icon: ShieldCheck, badge: 'Wajib' },
        { id: 'editor', label: 'Editor & Butir Soal', icon: FileCheck2 },
        { id: 'question_bank', label: 'Bank Soal Digital', icon: Database },
      ],
    },
    {
      group: 'PERANGKAT ASESMEN',
      items: [
        { id: 'blueprints', label: 'Kisi-Kisi Otomatis', icon: Grid },
        { id: 'question_cards', label: 'Kartu Soal', icon: CreditCard },
        { id: 'rubrics', label: 'Rubrik Penilaian', icon: FileText },
        { id: 'exam_paper', label: 'Naskah Siap Cetak', icon: Printer },
      ],
    },
    {
      group: 'UJIAN & EVALUASI',
      items: [
        { id: 'cbt', label: 'Pelaksanaan CBT', icon: MonitorPlay, badge: 'Siswa' },
        { id: 'grading', label: 'Koreksi & Penskoran', icon: CheckSquare },
        { id: 'analytics', label: 'Analisis Hasil & Butir', icon: BarChart3 },
        { id: 'gradebook', label: 'Buku Nilai Digital', icon: BookOpenCheck, badge: 'Resmi' },
        { id: 'remedial', label: 'Remedial & Pengayaan', icon: TrendingUp },
      ],
    },
    {
      group: 'DATA & SISTEM',
      items: [
        { id: 'master_data', label: 'Master Data Madrasah', icon: Users },
        { id: 'curriculum', label: 'Kurikulum Merdeka', icon: GraduationCap },
        { id: 'audit_logs', label: 'Audit Trail & Log', icon: ScrollText },
        { id: 'deployment', label: 'Database & Migrasi', icon: Server },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#064e3b] text-emerald-50 shrink-0 min-h-screen flex flex-col justify-between select-none shadow-lg">
      <div className="py-4">
        {/* Navigation Groups */}
        <div className="space-y-6 px-3">
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-2">
                {group.group}
              </div>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-600/90 text-white font-semibold shadow-xs ring-1 ring-white/20'
                          : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-900/80 text-emerald-200'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-3 m-3 bg-emerald-900/80 rounded-lg border border-emerald-800/80 text-[11px] text-emerald-200/80">
        <div className="font-semibold text-white">MIN 1 PASER</div>
        <div className="text-[10px] text-emerald-300">Kelas 6-C • T.P. 2024/2025 (Ganjil)</div>
        <div className="mt-1 pt-1 border-t border-emerald-800/80 text-[9px] text-emerald-400">
          Wali: Dzakirul Husni, S.Pd.
        </div>
      </div>
    </aside>
  );
};
