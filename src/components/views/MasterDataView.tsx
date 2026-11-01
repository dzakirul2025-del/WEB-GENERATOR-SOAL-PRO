import React, { useState, useEffect } from 'react';
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
  Search,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { madrasahStore } from '../../lib/storage';
import { exportToExcel } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';
import { Student } from '../../types';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru' | 'kelas' | 'mapel' | 'profil'>('siswa');

  const [students, setStudents] = useState<Student[]>(() => madrasahStore.getStudents());
  const classes = madrasahStore.getClasses();
  const subjects = madrasahStore.getSubjects();

  // Reactive subscription to store updates
  useEffect(() => {
    const unsubscribe = madrasahStore.subscribe(() => {
      setStudents([...madrasahStore.getStudents()]);
    });
    return unsubscribe;
  }, []);

  // Filter & Search State
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');

  // Student Add State
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    classId: 'cls-6c',
  });

  // Student Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Delete State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Import State
  const [importSummary, setImportSummary] = useState<{
    total: number;
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.nisn.trim()) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }
    madrasahStore.addStudent({
      ...newStudent,
      isActive: true,
    });
    setShowAddStudent(false);
    setNewStudent({ nis: '', nisn: '', name: '', gender: 'L', classId: 'cls-6c' });
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.name.trim() || !editingStudent.nisn.trim()) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }
    madrasahStore.updateStudent(editingStudent);
    setEditingStudent(null);
  };

  const handleDeleteStudentConfirm = () => {
    if (!deletingStudent) return;
    madrasahStore.deleteStudent(deletingStudent.id);
    setDeletingStudent(null);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Daftar Siswa Madrasah</h3>
              <p className="text-xs text-gray-500">Kelola data identitas, rombongan belajar, serta tindakan edit dan hapus data siswa.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddStudent(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama, NIS, atau NISN siswa..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-gray-50 font-medium text-gray-700"
              >
                <option value="ALL">Semua Kelas ({students.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({students.filter((s) => s.classId === c.id).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Menampilkan <strong>{students.filter((s) => {
                const matchesSearch =
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.nisn.toLowerCase().includes(studentSearch.toLowerCase());
                const matchesClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
                return matchesSearch && matchesClass;
              }).length}</strong> dari <strong>{students.length}</strong> siswa
            </div>
          </div>

          {/* Student Table */}
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
                    <th className="py-3 px-3 text-center w-36">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students
                    .filter((s) => {
                      const matchesSearch =
                        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.nisn.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchesClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
                      return matchesSearch && matchesClass;
                    })
                    .map((s, idx) => {
                      const cls = classes.find((c) => c.id === s.classId);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">{s.name}</td>
                          <td className="py-2.5 px-3 text-gray-600 font-mono">{s.nis}</td>
                          <td className="py-2.5 px-3 text-gray-600 font-mono">{s.nisn}</td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                              s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {s.gender === 'L' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-800 font-medium">
                            {cls?.name || 'Kelas 6-C'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {s.isActive ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setEditingStudent({ ...s })}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors shadow-2xs"
                                title={`Edit data siswa ${s.name}`}
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingStudent(s)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors shadow-2xs"
                                title={`Hapus siswa ${s.name}`}
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {students.filter((s) => {
                    const matchesSearch =
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.nisn.toLowerCase().includes(studentSearch.toLowerCase());
                    const matchesClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
                    return matchesSearch && matchesClass;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">Tidak ada data siswa yang cocok.</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Coba ubah kata kunci pencarian atau filter rombel kelas.</p>
                      </td>
                    </tr>
                  )}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddStudentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Tambah Siswa Baru</h3>
                  <p className="text-[11px] text-gray-500">Daftarkan siswa baru ke rombel kelas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudent(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  placeholder="Contoh: Muhammad Rizky Pratama"
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
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono"
                    placeholder="2024013"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    value={newStudent.nisn}
                    onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono"
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
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white font-medium"
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
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-2xs"
              >
                Simpan Siswa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleEditStudentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Edit Data Peserta Didik</h3>
                  <p className="text-[11px] text-gray-500">Perbarui identitas dan status siswa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NIS</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nis}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nisn}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nisn: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editingStudent.gender}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as 'L' | 'P' })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kelas / Rombel</label>
                  <select
                    value={editingStudent.classId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Status Keaktifan</label>
                <select
                  value={editingStudent.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, isActive: e.target.value === 'active' })}
                  className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                >
                  <option value="active">Aktif Mengikuti Pembelajaran</option>
                  <option value="inactive">Non-Aktif / Pindah Madrasah</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center space-x-1.5 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Hapus Data Siswa?</h3>
              <p className="text-xs text-gray-600">
                Apakah Anda yakin ingin menghapus data siswa ini dari pangkalan data?
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="font-bold text-gray-900">{deletingStudent.name}</div>
              <div className="text-gray-500 font-mono text-[11px]">
                NISN: {deletingStudent.nisn} • NIS: {deletingStudent.nis}
              </div>
              <div className="text-gray-600 text-[11px]">
                Rombel: {classes.find((c) => c.id === deletingStudent.classId)?.name || 'Kelas 6-C'}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudentConfirm}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
