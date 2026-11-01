import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { madrasahStore } from '../../lib/storage';
import { exportToExcel } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';
import { Student } from '../../types';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru' | 'kelas' | 'mapel' | 'profil'>('siswa');

  const students = madrasahStore.getStudents();
  const classes = madrasahStore.getClasses();
  const subjects = madrasahStore.getSubjects();

  // Student Add State
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    classId: classes[0]?.id || 'cls-6c',
  });

  // Import State
  const [importSummary, setImportSummary] = useState<{
    total: number;
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nisn) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }
    madrasahStore.addStudent({
      ...newStudent,
      isActive: true,
    });
    setShowAddStudent(false);
    setNewStudent({ nis: '', nisn: '', name: '', gender: 'L', classId: 'cls-4a' });
    alert('Siswa berhasil ditambahkan!');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NIS: '2024001',
        NISN: '0129998871',
        'Nama Siswa': 'Muhammad Al-Fatih',
        'Jenis Kelamin (L/P)': 'L',
        'ID Kelas': 'cls-4a',
      },
      {
        NIS: '2024002',
        NISN: '0129998872',
        'Nama Siswa': 'Fathimah Az-Zahra',
        'Jenis Kelamin (L/P)': 'P',
        'ID Kelas': 'cls-4a',
      },
    ];
    exportToExcel(templateData, 'Template_Impor_Siswa_MIN1Paser', 'Format Siswa');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const formatted = data.map((row) => ({
          nis: String(row['NIS'] || row['nis'] || ''),
          nisn: String(row['NISN'] || row['nisn'] || ''),
          name: String(row['Nama Siswa'] || row['name'] || ''),
          gender: (String(row['Jenis Kelamin (L/P)'] || row['gender'] || 'L').toUpperCase().startsWith('P')
            ? 'P'
            : 'L') as 'L' | 'P',
          classId: String(row['ID Kelas'] || row['classId'] || 'cls-4a'),
          isActive: true,
        }));

        const result = madrasahStore.bulkAddStudents(formatted);
        setImportSummary({
          total: formatted.length,
          success: result.added,
          duplicates: result.duplicates,
          errors: 0,
        });
      } catch (err) {
        console.error('Import error:', err);
        alert('Gagal membaca file Excel. Pastikan format kolom sesuai template.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Master Data Madrasah
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pengelolaan terpadu profil madrasah, pendidik, peserta didik, rombongan belajar, dan mata pelajaran MIN 1 Paser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Kembalikan seluruh data ke konfigurasi baku resmi Kelas 6-C MIN 1 Paser?')) {
                madrasahStore.resetToFactoryDefaults();
                alert('Data berhasil di-reset ke master data resmi Kelas 6-C!');
                window.location.reload();
              }
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-850 hover:bg-amber-100 flex items-center space-x-1.5"
            title="Reset ke data awal Kelas 6-C"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Reset Data Resmi Kelas 6-C</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download Template Excel</span>
          </button>

          <label className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 cursor-pointer shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Data Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import Feedback Banner if triggered */}
      {importSummary && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start justify-between text-xs">
          <div className="space-y-1">
            <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Laporan Hasil Impor Excel:</span>
            </div>
            <div className="text-gray-700">
              Total Baris: <strong>{importSummary.total}</strong> • Berhasil Masuk: <strong className="text-emerald-700">{importSummary.success}</strong> • Duplikat NISN Diabaikan: <strong className="text-amber-700">{importSummary.duplicates}</strong>
            </div>
          </div>
          <button
            onClick={() => setImportSummary(null)}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('siswa')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
            activeTab === 'siswa' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Peserta Didik ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('kelas')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
            activeTab === 'kelas' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Kelas & Fase ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('mapel')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
            activeTab === 'mapel' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mata Pelajaran ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('profil')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
            activeTab === 'profil' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Profil Madrasah & Kop
        </button>
      </div>

      {/* Tab: Siswa */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Daftar Siswa Aktif</h3>
            <button
              onClick={() => setShowAddStudent(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3">NIS</th>
                    <th className="py-3 px-3">NISN</th>
                    <th className="py-3 px-3 text-center">L/P</th>
                    <th className="py-3 px-3">Rombel</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{s.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono">{s.nis}</td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono">{s.nisn}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{s.gender}</td>
                        <td className="py-2.5 px-3 text-gray-800">{cls?.name || 'Kelas 4A'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Kelas */}
      {activeTab === 'kelas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-gray-900 text-base">{c.name}</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  {c.phase}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Tingkat Kelas: <strong>Kelas {c.grade}</strong></div>
                <div>Tahun Pelajaran: <strong>2024/2025</strong></div>
                <div>Jumlah Siswa: <strong>{students.filter((s) => s.classId === c.id).length || 12} Siswa</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Mapel */}
      {activeTab === 'mapel' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-center">Standar KKTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{sub.code}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{sub.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sub.category === 'PAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sub.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700">{sub.defaultKktp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Profil Madrasah */}
      {activeTab === 'profil' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-5 max-w-3xl">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Identitas Resmi Madrasah</h3>
            <p className="text-xs text-gray-500">Informasi ini tercantum pada naskah soal, kisi-kisi, kartu soal, dan buku nilai resmi.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Nama Madrasah:</span>
              <strong className="text-gray-900 text-sm">{MADRASAH_INFO.name}</strong>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">NPSN / NSM:</span>
              <strong className="text-gray-900">{MADRASAH_INFO.npsn} / {MADRASAH_INFO.nsm}</strong>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Kepala Madrasah:</span>
              <strong className="text-gray-900">{MADRASAH_INFO.kepalaMadrasah.name}</strong>
              <div className="text-[11px] text-gray-500">NIP: {MADRASAH_INFO.kepalaMadrasah.nip}</div>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Pengembang Sistem:</span>
              <strong className="text-gray-900">{MADRASAH_INFO.pengembang.name}</strong>
              <div className="text-[11px] text-gray-500">NIP: {MADRASAH_INFO.pengembang.nip}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 font-semibold block">Alamat Resmi:</span>
              <strong className="text-gray-900">{MADRASAH_INFO.address}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Tambah Data Peserta Didik Baru</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Contoh: Muhammad Rizky"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NIS</label>
                  <input
                    type="text"
                    required
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="2024001"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NISN</label>
                  <input
                    type="text"
                    required
                    value={newStudent.nisn}
                    onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as 'L' | 'P' })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kelas / Rombel</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddStudent(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Simpan Siswa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
