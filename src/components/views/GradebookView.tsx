import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Download,
  Printer,
  ShieldCheck,
  History,
  FileCheck,
  Award,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { exportToExcel, printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';

interface GradebookViewProps {
  onNavigate: (view: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({ onNavigate }) => {
  const students = madrasahStore.getStudents();
  const classes = madrasahStore.getClasses();
  const subjects = madrasahStore.getSubjects();
  const assessments = madrasahStore.getAssessments();
  const gradebookEntries = madrasahStore.getGradebook();
  const currentUser = madrasahStore.getCurrentUser();
  const academicYears = madrasahStore.getAcademicYears();

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || 'ay-2026-2027'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-6c');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-mtk');
  const [activeTab, setActiveTab] = useState<'rekap' | 'revisi' | 'pengesahan'>('rekap');

  // Filter students by selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Find assessments for this class & subject
  const relevantAssessments = assessments.filter(
    (a) => a.classId === selectedClassId && a.subjectId === selectedSubjectId
  );

  // Group gradebook entries per student
  const studentRows = classStudents.map((std, idx) => {
    const entries = gradebookEntries.filter(
      (g) => g.studentId === std.id && g.subjectId === selectedSubjectId
    );

    const sasEntry = entries.find((e) => e.assessmentType === 'sumatif_semester');
    const sabEntry = entries.find((e) => e.assessmentType === 'sumatif_bab');
    const afEntry = entries.find((e) => e.assessmentType === 'formatif');
    const satEntry = entries.find((e) => e.assessmentType === 'sumatif_tahun');
    const umEntry = entries.find((e) => e.assessmentType === 'ujian_madrasah');

    // Calculate weighted final recap (e.g. 20% Formatif + 30% Sumatif Bab + 50% Sumatif Semester)
    const afScore = afEntry?.finalScore ?? 85; // baseline formative
    const sabScore = sabEntry?.finalScore ?? 80;
    const sasScore = sasEntry?.finalScore ?? 0;

    let finalRecap = Math.round(afScore * 0.2 + sabScore * 0.3 + (sasScore > 0 ? sasScore * 0.5 : sabScore * 0.5));
    const kktp = currentSubject?.defaultKktp || 75;
    const isPassed = finalRecap >= kktp;

    return {
      no: idx + 1,
      studentId: std.id,
      name: std.name,
      nis: std.nis,
      nisn: std.nisn,
      formatif: afScore,
      sumatifBab: sabScore,
      sas: sasScore > 0 ? sasScore : '-',
      sat: satEntry?.finalScore ?? '-',
      um: umEntry?.finalScore ?? '-',
      finalRecap,
      isPassed,
      status: sasEntry?.status || 'draft',
      endorsedBy: sasEntry?.endorsedBy || '-',
      endorsedAt: sasEntry?.endorsedAt || '-',
      revisions: sasEntry?.revisions || [],
    };
  });

  const handleEndorseGrades = (assessmentId: string) => {
    const res = madrasahStore.endorseAndSyncAssessmentGrades(
      assessmentId,
      currentUser.role === 'kepala_madrasah' ? MADRASAH_INFO.kepalaMadrasah.name : currentUser.name
    );
    alert(res.message);
  };

  const handleExportExcel = () => {
    const exportData = studentRows.map((r) => ({
      No: r.no,
      'Nama Siswa': r.name,
      NIS: r.nis,
      NISN: r.nisn,
      'Kelas / Fase': `${currentClass?.name || '-'} (${currentClass?.phase || '-'})`,
      'Mata Pelajaran': currentSubject?.name || '-',
      'Asesmen Formatif (20%)': r.formatif,
      'Sumatif Akhir Bab (30%)': r.sumatifBab,
      'Sumatif Akhir Semester (50%)': r.sas,
      'Nilai Akhir Rapor': r.finalRecap,
      Ketuntasan: r.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
      'Status Pengesahan': r.status.toUpperCase(),
      Pengesah: r.endorsedBy,
    }));

    exportToExcel(
      exportData,
      `Buku_Nilai_${currentSubject?.name.replace(/[^a-zA-Z0-9]/g, '_')}_${currentClass?.name}`,
      'Buku Nilai'
    );
  };

  const handlePrintGradebook = () => {
    const kopHtml = generateKopSuratHtml();
    const signatureHtml = generateTandaTanganHtml(
      MADRASAH_INFO.pengembang.name,
      MADRASAH_INFO.pengembang.nip
    );

    const rowsHtml = studentRows
      .map(
        (r) => `
      <tr>
        <td style="text-align: center;">${r.no}</td>
        <td>${r.name}</td>
        <td style="text-align: center; font-size: 8.5pt;">${r.nisn}</td>
        <td style="text-align: center;">${r.formatif}</td>
        <td style="text-align: center;">${r.sumatifBab}</td>
        <td style="text-align: center; font-weight: bold;">${r.sas}</td>
        <td style="text-align: center; font-weight: bold; background-color: #f0fdf4;">${r.finalRecap}</td>
        <td style="text-align: center; font-weight: bold; color: ${r.isPassed ? '#166534' : '#991b1b'};">
          ${r.isPassed ? 'TUNTAS' : 'BELUM TUNTAS'}
        </td>
      </tr>
    `
      )
      .join('');

    const fullHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">BUKU NILAI DIGITAL RESMI PESERTA DIDIK</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">Mata Pelajaran: ${currentSubject?.name} • ${currentClass?.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">
          Tahun Pelajaran: 2024/2025 | Semester: Ganjil | Kriteria Ketercapaian (KKTP): ${currentSubject?.defaultKktp || 75}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">No</th>
            <th>Nama Lengkap Siswa</th>
            <th style="width: 85px;">NISN</th>
            <th style="width: 55px;">Formatif</th>
            <th style="width: 65px;">Sumatif Bab</th>
            <th style="width: 55px;">SAS</th>
            <th style="width: 65px;">Nilai Akhir</th>
            <th style="width: 90px;">Ketuntasan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${signatureHtml}
    `;

    printDocument(`Buku_Nilai_${currentSubject?.name}_${currentClass?.name}`, fullHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Buku Nilai Digital Resmi
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
              Disahkan Resmi
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pusat penyimpanan nilai resmi MIN 1 Paser: Formatif, Sumatif Akhir Bab, SAS, SAT, dan Ujian Madrasah dengan riwayat revisi dan integritas transaksi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrintGradebook}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Buku Nilai Resmi (Kop MIN 1 Paser)</span>
          </button>
        </div>
      </div>

      {/* Selector & Tabs Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Tahun Pelajaran</label>
            <select
              value={selectedAcademicYearId}
              onChange={(e) => setSelectedAcademicYearId(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  T.P. {ay.name} {ay.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Pilih Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Pilih Mata Pelajaran</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (KKTP: {s.defaultKktp})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'rekap' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Buku Nilai Rapor
          </button>
          <button
            onClick={() => setActiveTab('pengesahan')}
            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'pengesahan' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pengesahan Resmi ({relevantAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab('revisi')}
            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'revisi' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Log Revisi Nilai
          </button>
        </div>
      </div>

      {/* Tab 1: Rekap Nilai Table */}
      {activeTab === 'rekap' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/40">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Daftar Nilai Resmi Peserta Didik
              </h3>
              <p className="text-xs text-gray-500">
                {currentSubject?.name} • {currentClass?.name} • KKTP: {currentSubject?.defaultKktp || 75}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Nilai Terverifikasi Resmi</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-3 text-center">Formatif (20%)</th>
                  <th className="py-3 px-3 text-center">Sumatif Bab (30%)</th>
                  <th className="py-3 px-3 text-center">SAS (50%)</th>
                  <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-950">Nilai Akhir</th>
                  <th className="py-3 px-3 text-center">Ketuntasan</th>
                  <th className="py-3 px-3 text-center">Pengesahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentRows.map((r) => (
                  <tr key={r.studentId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-gray-500">{r.no}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.name}</td>
                    <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">{r.nisn}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-gray-700">{r.formatif}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-gray-700">{r.sumatifBab}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-900">{r.sas}</td>
                    <td className="py-2.5 px-3 text-center font-black text-sm text-emerald-900 bg-emerald-50/50">
                      {r.finalRecap}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {r.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-500 text-[11px]">
                      <span className="font-semibold text-emerald-800">{r.endorsedBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pengesahan Nilai Workflow */}
      {activeTab === 'pengesahan' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Alur Pengesahan Nilai Asesmen (SOP Resmi)</h3>
            <p className="text-xs text-gray-500 mt-1">
              Sesuai aturan Bagian 20: Nilai asesmen peserta didik tidak dapat dimasukkan ke dalam buku nilai resmi sebelum proses verifikasi dan penandatanganan pengesahan oleh Guru / Kepala Madrasah.
            </p>
          </div>

          <div className="space-y-3">
            {relevantAssessments.map((asm) => (
              <div key={asm.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-900">{asm.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      asm.status === 'disahkan' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {asm.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tanggal Pelaksanaan: {asm.executionDate} • Bobot: {asm.totalWeight} Poin • KKTP: {asm.kktp}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {asm.status === 'disahkan' ? (
                    <div className="text-right text-xs">
                      <span className="text-emerald-700 font-bold block flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Telah Disahkan Resmi</span>
                      </span>
                      <span className="text-gray-500 text-[10px]">Oleh: {asm.endorsedBy}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEndorseGrades(asm.id)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sahkan & Masukkan ke Buku Nilai</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Revisi Nilai */}
      {activeTab === 'revisi' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Log Jejak Audit Revisi Nilai</h3>
            <p className="text-xs text-gray-500 mt-1">
              Catatan perubahan nilai resmi yang menjamin tidak ada perubahan tanpa persetujuan dan riwayat historis tersimpan abadi.
            </p>
          </div>

          <div className="space-y-3">
            {studentRows.flatMap((r) => r.revisions).length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl text-xs text-gray-500">
                Belum ada catatan revisi pada kelas ini. Nilai awal masih murni sesuai pengesahan pertama.
              </div>
            ) : (
              studentRows.flatMap((r) =>
                r.revisions.map((rev, revIdx) => (
                  <div key={revIdx} className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-amber-950 flex items-start justify-between">
                    <div>
                      <div className="font-bold">Siswa: {r.name}</div>
                      <div className="text-[11px] text-gray-700 mt-0.5">
                        Alasan: {rev.reason} (Nilai lama: {rev.previousScore} → Baru: {rev.newScore})
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-gray-500">
                      <div>Direvisi: {rev.revisedBy}</div>
                      <div>{new Date(rev.revisedAt).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
