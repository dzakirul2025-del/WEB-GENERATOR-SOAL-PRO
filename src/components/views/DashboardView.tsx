import React from 'react';
import {
  Users,
  GraduationCap,
  FileSpreadsheet,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Sparkles,
  BarChart,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { UserProfile } from '../../types';
import { MADRASAH_INFO } from '../../lib/constants';

interface DashboardViewProps {
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  const students = madrasahStore.getStudents();
  const classes = madrasahStore.getClasses();
  const assessments = madrasahStore.getAssessments();
  const questions = madrasahStore.getQuestions();
  const gradebook = madrasahStore.getGradebook();
  const remedials = madrasahStore.getRemedials();
  const examSessions = madrasahStore.getExamSessions();

  const activeAssessments = assessments.filter(
    (a) => a.status === 'published' || a.status === 'sedang_berlangsung'
  );
  const completedAssessments = assessments.filter((a) => a.status === 'disahkan' || a.status === 'dinilai');

  // Passing rate in official gradebook
  const totalGrades = gradebook.length;
  const passedGrades = gradebook.filter((g) => g.isPassed).length;
  const passPercentage = totalGrades > 0 ? Math.round((passedGrades / totalGrades) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#006837] to-[#064e3b] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/50 text-emerald-100 text-xs px-3 py-1 rounded-full font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sistem Asesmen Cerdas Terpadu Kurikulum Merdeka</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Madrasah Assessment Pro
          </h1>
          <p className="mt-1.5 text-emerald-100 text-sm leading-relaxed">
            Portal operasional terpadu pengelolaan kurikulum, generator soal berbasis AI Gemini, pelaksanaan CBT, koreksi otomatis, analisis statistik butir, hingga Buku Nilai Digital resmi {MADRASAH_INFO.name}.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('generator')}
              className="inline-flex items-center space-x-2 bg-white text-emerald-900 font-bold px-4 py-2 rounded-lg text-xs shadow-md hover:bg-emerald-50 transition-colors"
            >
              <BrainCircuit className="w-4 h-4 text-emerald-700" />
              <span>Buka AI Question Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('gradebook')}
              className="inline-flex items-center space-x-2 bg-emerald-800/80 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-emerald-800 transition-colors border border-emerald-600/40"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Lihat Buku Nilai Digital</span>
            </button>
            <button
              onClick={() => onNavigate('cbt')}
              className="inline-flex items-center space-x-2 bg-emerald-900/60 text-emerald-200 font-semibold px-4 py-2 rounded-lg text-xs hover:bg-emerald-900 transition-colors border border-emerald-700/40"
            >
              <span>Uji CBT Siswa Kelas 6-C (Token: MTK6CPAS)</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-[-40px] bottom-[-40px] w-72 h-72 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      </div>

      {/* Role Notice & Info Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 text-sm">{currentUser.name}</span>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200">
                {currentUser.title || currentUser.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Kepala Madrasah: <strong className="text-gray-700">{MADRASAH_INFO.kepalaMadrasah.name}</strong> • Pengembang: <strong className="text-gray-700">{MADRASAH_INFO.pengembang.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div>Tahun: <strong className="text-gray-900">2024/2025</strong></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div>Semester: <strong className="text-gray-900">Ganjil</strong></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div>Status RLS: <strong className="text-emerald-700">Enforced (Active)</strong></div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Siswa Terdaftar</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{students.length}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Terbagi dalam {classes.length} Rombongan Belajar</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Asesmen Dibuat</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{assessments.length}</h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{completedAssessments.length} Asesmen Telah Disahkan</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Soal Digital</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{questions.length}</h3>
              <p className="text-[11px] text-gray-500 mt-1">PG, Isian Singkat & Essay</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat Ketuntasan (KKTP)</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{passPercentage}%</h3>
              <p className="text-[11px] text-gray-500 mt-1">{passedGrades} dari {totalGrades} nilai tuntas (≥75)</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Asesmen Terkini & Alur Pengesahan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asesmen Aktif & Terjadwal */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Daftar Asesmen Terkini</h3>
                <p className="text-xs text-gray-500">Asesmen yang telah dirancang dan dijadwalkan</p>
              </div>
              <button
                onClick={() => onNavigate('assessments')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
              >
                <span>Kelola Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {assessments.map((asm) => (
                <div key={asm.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900">{asm.title}</span>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        Token: {asm.token}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                      <span>{asm.executionDate}</span>
                      <span>•</span>
                      <span>{asm.questionsCount?.total || 0} Soal (PG, Isian, Essay)</span>
                      <span>•</span>
                      <span>KKTP: {asm.kktp}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800 border border-green-300">
                      {asm.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => onNavigate('analytics')}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-md transition-colors"
                    >
                      Analisis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remedial Tracker Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-sm">Status Tindak Lanjut Remedial</h3>
              </div>
              <button
                onClick={() => onNavigate('remedial')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1"
              >
                <span>Lihat Modul Remedial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {remedials.map((rem) => {
                const std = students.find((s) => s.id === rem.studentId);
                return (
                  <div key={rem.id} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{std?.name || 'Siswa'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rem.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                        {rem.status === 'completed' ? 'Tuntas Remedial' : 'Menunggu Tes'}
                      </span>
                    </div>
                    <div className="text-gray-600 mt-1">
                      Nilai Awal: <strong className="text-red-600">{rem.initialScore}</strong> → Remedial:{' '}
                      <strong className="text-emerald-700">{rem.finalRemedialScore || '-'}</strong>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 truncate">{rem.actionTaken}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Tool Access & Workflow Guide */}
        <div className="space-y-6">
          {/* Quick Modules Shortcuts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Aksi Cepat Guru & Penguji</h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('generator')}
                className="w-full text-left p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-950">AI Question Generator</div>
                    <div className="text-[11px] text-emerald-700">PG, Isian, Essay Sekaligus</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => onNavigate('cbt')}
                className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-blue-950">Pelaksanaan CBT Siswa</div>
                    <div className="text-[11px] text-blue-700">Simulasi Antarmuka Ujian</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => onNavigate('blueprints')}
                className="w-full text-left p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-purple-950">Kisi-Kisi & Naskah Cetak</div>
                    <div className="text-[11px] text-purple-700">Format Resmi Kop MIN 1 Paser</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </button>

              <button
                onClick={() => onNavigate('gradebook')}
                className="w-full text-left p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-amber-950">Buku Nilai Digital Resmi</div>
                    <div className="text-[11px] text-amber-700">Pengesahan Nilai & Riwayat</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>

          {/* SOP Alur Penilaian Resmi */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">
              Alur Wajib Penilaian Asesmen
            </h4>
            <ol className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">1.</span>
                <span>Guru merancang kisi-kisi dan indikator asesmen.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">2.</span>
                <span>AI Generator menghasilkan soal PG, Isian, & Essay.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">3.</span>
                <span>Validasi guru terhadap stimulus, kunci, & rubrik.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">4.</span>
                <span>Ujian CBT dilaksanakan secara aman.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">5.</span>
                <span>Koreksi objektif otomatis & essay dengan rubrik.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-emerald-700">6.</span>
                <span>Pengesahan resmi Kepala Madrasah ke Buku Nilai.</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
