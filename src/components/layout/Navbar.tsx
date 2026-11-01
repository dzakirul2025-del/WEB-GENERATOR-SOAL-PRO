import React, { useState } from 'react';
import {
  School,
  User,
  ChevronDown,
  Bell,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MADRASAH_INFO, MOCK_USERS } from '../../lib/constants';
import { madrasahStore } from '../../lib/storage';
import { UserProfile, UserRole } from '../../types';

interface NavbarProps {
  currentUser: UserProfile;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, activeView, onNavigate }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleRoleChange = (selectedUser: typeof MOCK_USERS[0]) => {
    madrasahStore.setCurrentUser(selectedUser as UserProfile);
    setShowRoleMenu(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-red-200">Super Admin</span>;
      case 'kepala_madrasah':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300">Kepala Madrasah</span>;
      case 'guru':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">Guru Mapel</span>;
      case 'wali_kelas':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">Wali Kelas</span>;
      case 'operator':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Operator</span>;
      case 'peserta_didik':
        return <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">Peserta Didik (CBT)</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center text-white shadow-xs">
            <School className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-gray-900 tracking-tight text-lg">
                MADRASAH ASSESSMENT PRO
              </span>
              <span className="bg-emerald-800 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                MIN 1 PASER
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block truncate max-w-md">
              {MADRASAH_INFO.tagline}
            </p>
          </div>
        </div>

        {/* Right: Quick actions & Role Switcher */}
        <div className="flex items-center space-x-3">
          {/* Active Academic Year Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="text-emerald-600 font-normal">T.P.</span>
            <span className="font-bold">
              {madrasahStore.getAcademicYears().find((y) => y.isActive)?.name || '2026/2027'}
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
              Ganjil
            </span>
          </div>

          {/* Quick CBT Switch Button if in other role */}
          {currentUser.role !== 'peserta_didik' ? (
            <button
              onClick={() => onNavigate('cbt')}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
              title="Buka Simulasi Ujian CBT Siswa"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulasi CBT Siswa</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const guru = MOCK_USERS.find((u) => u.role === 'guru');
                if (guru) madrasahStore.setCurrentUser(guru as UserProfile);
                onNavigate('dashboard');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kembali ke Portal Guru</span>
            </button>
          )}

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotification(!showNotification)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
            </button>

            {showNotification && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="font-semibold text-sm text-gray-800">Notifikasi Sistem</h4>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Aktif</span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                    <p className="font-medium text-emerald-900">Pengesahan Nilai Selesai</p>
                    <p className="text-gray-600">Nilai SAS Akidah Akhlak Kelas 4A telah disahkan Kepala Madrasah Ismail, S.Ag.</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-100">
                    <p className="font-medium text-blue-900">AI Assessment Generator Siap</p>
                    <p className="text-gray-600">Model Gemini 3.8 Flash terhubung dan siap memproses pembuatan soal massal.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User & Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </p>
                <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Masuk sebagai:</p>
                  <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-600">{currentUser.title || currentUser.email}</p>
                </div>

                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Ganti Peran Pengguna (Simulasi Hak Akses)
                  </p>
                  <div className="space-y-1">
                    {MOCK_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleRoleChange(user)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          currentUser.id === user.id
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-[10px] text-gray-500">{user.title}</div>
                        </div>
                        {currentUser.id === user.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2 px-4">
                  <div className="flex items-center space-x-1.5 text-[11px] text-gray-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Role-Based Access Control Aktif</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
