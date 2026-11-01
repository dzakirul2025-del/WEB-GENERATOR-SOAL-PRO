export const MADRASAH_INFO = {
  name: 'MADRASAH IBTIDAIYAH NEGERI 1 PASER',
  shortName: 'MIN 1 PASER',
  npsn: '60728491',
  nsm: '111164020001',
  status: 'Negeri',
  akreditasi: 'A (Unggul)',
  address: 'Jl. Kusuma Bangsa Km. 1,5, Kel. Tanah Grogot, Kec. Tanah Grogot, Kab. Paser, Kalimantan Timur 76211',
  email: 'min1paser@kemenag.go.id',
  phone: '(0543) 21123',
  kepalaMadrasah: {
    name: 'Ismail, S.Ag.',
    nip: '197104121998031002',
    pangkat: 'Pembina / IV a',
    jabatan: 'Kepala Madrasah Ibtidaiyah Negeri 1 Paser',
  },
  pengembang: {
    name: 'Dzakirul Husni, S.Pd.',
    nip: '199308152020121004',
    jabatan: 'Guru & Tim Pengembang Sistem Informasi Asesmen',
  },
  tagline: 'Smart Assessment Generator, Examination, Analytics & Digital Gradebook System',
  kop: {
    baris1: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    baris2: 'KANTOR KEMENTERIAN AGAMA KABUPATEN PASER',
    baris3: 'MADRASAH IBTIDAIYAH NEGERI 1 PASER',
    baris4: 'Jl. Kusuma Bangsa Km. 1,5 Tanah Grogot, Kab. Paser, Kalimantan Timur Kode Pos 76211',
    kontak: 'Email: min1paser@kemenag.go.id | Website: min1paser.sch.id',
  },
};

export const STANDARD_SUBJECTS = [
  // 5 Mata Pelajaran Pilihan Utama
  { id: 'sub-mtk', code: 'MTK-01', name: 'Matematika', category: 'Umum' as const, defaultKktp: 70 },
  { id: 'sub-ipas', code: 'IPAS-02', name: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', category: 'Umum' as const, defaultKktp: 73 },
  { id: 'sub-bindo', code: 'BIN-03', name: 'Bahasa Indonesia', category: 'Umum' as const, defaultKktp: 75 },
  { id: 'sub-ppkn', code: 'PKN-04', name: 'Pendidikan Pancasila', category: 'Umum' as const, defaultKktp: 75 },
  { id: 'sub-sbdp', code: 'SBDP-05', name: 'SBDP (Seni Budaya dan Prakarya)', category: 'Umum' as const, defaultKktp: 75 },
  // Kelompok PAI Kemenag & Muatan Tambahan
  { id: 'sub-akidah', code: 'AA-06', name: 'Akidah Akhlak', category: 'PAI' as const, defaultKktp: 75 },
  { id: 'sub-qurdis', code: 'QH-07', name: "Al-Qur'an Hadis", category: 'PAI' as const, defaultKktp: 75 },
  { id: 'sub-fikih', code: 'FK-08', name: 'Fikih', category: 'PAI' as const, defaultKktp: 75 },
  { id: 'sub-ski', code: 'SKI-09', name: 'Sejarah Kebudayaan Islam (SKI)', category: 'PAI' as const, defaultKktp: 75 },
  { id: 'sub-barab', code: 'BA-10', name: 'Bahasa Arab', category: 'PAI' as const, defaultKktp: 72 },
  { id: 'sub-pjok', code: 'PJK-11', name: 'PJOK', category: 'Umum' as const, defaultKktp: 75 },
  { id: 'sub-bing', code: 'BIG-12', name: 'Bahasa Inggris', category: 'Muatan Lokal' as const, defaultKktp: 70 },
];

export const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  formatif: 'Asesmen Formatif (AF)',
  sumatif_bab: 'Sumatif Akhir Bab / Lingkup Materi',
  sumatif_semester: 'Sumatif Akhir Semester (SAS)',
  sumatif_tahun: 'Sumatif Akhir Tahun (SAT)',
  ujian_madrasah: 'Ujian Madrasah (UM)',
};

export const ASSESSMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  dalam_validasi: { label: 'Dalam Validasi', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  disetujui: { label: 'Disetujui', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  published: { label: 'Diterbitkan (Siap CBT)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  sedang_berlangsung: { label: 'Sedang Berlangsung', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  selesai: { label: 'Selesai (CBT Tutup)', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  dalam_koreksi: { label: 'Dalam Koreksi', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  dinilai: { label: 'Dinilai Lengkap', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  disahkan: { label: 'Disahkan Resmi', color: 'bg-green-100 text-green-900 border-green-500 font-semibold' },
  diarsipkan: { label: 'Diarsipkan', color: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
};

export const COGNITIVE_LEVEL_INFO: Record<string, { label: string; category: string; description: string }> = {
  C1: { label: 'C1 - Mengingat', category: 'LOTS', description: 'Mengingat fakta, istilah, konsep dasar tanpa perubahan' },
  C2: { label: 'C2 - Memahami', category: 'LOTS', description: 'Menjelaskan ide/konsep, menginterpretasikan arti' },
  C3: { label: 'C3 - Mengaplikasikan', category: 'MOTS', description: 'Menerapkan pengetahuan pada situasi atau konteks baru' },
  C4: { label: 'C4 - Menganalisis', category: 'HOTS', description: 'Membedakan, mengorganisasi, menghubungkan bagian-bagian masalah' },
  C5: { label: 'C5 - Mengevaluasi', category: 'HOTS', description: 'Membuat pertimbangan berdasarkan kriteria dan standar' },
  C6: { label: 'C6 - Mencipta', category: 'HOTS', description: 'Menggabungkan elemen untuk menghasilkan struktur/solusi orisinal' },
};

export const MOCK_USERS = [
  {
    id: 'user-admin',
    name: 'Administrator MIN 1 Paser',
    email: 'admin@min1paser.sch.id',
    role: 'super_admin' as const,
    title: 'Super Admin Sistem',
  },
  {
    id: 'user-kepala',
    name: 'Ismail, S.Ag.',
    email: 'ismail.kepala@min1paser.sch.id',
    nip: '197104121998031002',
    role: 'kepala_madrasah' as const,
    title: 'Kepala Madrasah MIN 1 Paser',
  },
  {
    id: 'user-dzakirul',
    name: 'Dzakirul Husni, S.Pd.',
    email: 'dzakirul.guru@min1paser.sch.id',
    nip: '199308152020121004',
    role: 'guru' as const,
    assignedClassId: 'cls-6c',
    subjectIds: ['sub-mtk', 'sub-ipas', 'sub-bindo', 'sub-ppkn', 'sub-sbdp'],
    title: 'Guru Kelas 6-C & Pengembang Sistem Asesmen',
  },
  {
    id: 'user-wali-6c',
    name: 'Dzakirul Husni, S.Pd.',
    email: 'dzakirul.wali6c@min1paser.sch.id',
    nip: '199308152020121004',
    role: 'wali_kelas' as const,
    assignedClassId: 'cls-6c',
    title: 'Wali Kelas 6-C (Fase C)',
  },
  {
    id: 'user-operator',
    name: 'M. Fajar Hidayat, S.Kom',
    email: 'operator@min1paser.sch.id',
    nip: '199503202022031006',
    role: 'operator' as const,
    title: 'Operator Madrasah',
  },
  {
    id: 'user-student-6c',
    name: 'Muhammad Al-Fatih Pratama',
    email: 'alfatih.siswa@min1paser.sch.id',
    nisn: '0129845101',
    role: 'peserta_didik' as const,
    assignedClassId: 'cls-6c',
    title: 'Peserta Didik Kelas 6-C',
  },
];
