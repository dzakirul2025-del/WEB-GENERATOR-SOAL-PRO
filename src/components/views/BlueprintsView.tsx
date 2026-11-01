import React, { useState } from 'react';
import {
  Grid,
  Printer,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { exportToExcel, printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';

interface BlueprintsViewProps {
  onNavigate: (view: string) => void;
}

export const BlueprintsView: React.FC<BlueprintsViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const subjects = madrasahStore.getSubjects();
  const classes = madrasahStore.getClasses();

  const currentSubject = subjects.find((s) => s.id === selectedAssessment?.subjectId);
  const currentClass = classes.find((c) => c.id === selectedAssessment?.classId);

  const handleExportExcel = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const data = questions.map((q, idx) => ({
      No: idx + 1,
      'Jenis Asesmen': selectedAssessment.title,
      'Mata Pelajaran': currentSubject?.name || 'Matematika',
      Kelas: currentClass?.name || 'Kelas 6-C',
      Fase: currentClass?.phase || 'Fase C',
      Materi: q.topic || 'Materi Pokok',
      CP: q.cpCode || 'CP-MTK-C.1',
      TP: q.tpCode || 'TP-MTK-6.1',
      'Indikator Soal': q.indicator,
      'Level Kognitif': q.cognitiveLevel,
      'Tingkat Kesulitan': q.difficulty,
      'Bentuk Soal': q.type === 'pilihan_ganda' ? 'Pilihan Ganda' : q.type === 'isian' ? 'Isian Singkat' : 'Essay / Uraian',
      'Nomor Soal': q.number,
      'Bobot Soal': q.weight,
    }));

    exportToExcel(data, `Kisi-Kisi_${selectedAssessment.title.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Kisi-Kisi');
  };

  const handlePrint = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const kopHtml = generateKopSuratHtml();
    const signatureHtml = generateTandaTanganHtml(
      MADRASAH_INFO.pengembang.name,
      MADRASAH_INFO.pengembang.nip
    );

    const rowsHtml = questions
      .map(
        (q, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${q.topic || 'Materi Pokok'}</td>
        <td style="font-size: 8.5pt;">${q.cpCode || 'CP-AA-B.1'}</td>
        <td style="font-size: 8.5pt;">${q.tpCode || 'TP-AA-4.1'}</td>
        <td>${q.indicator}</td>
        <td style="text-align: center; font-weight: bold;">${q.cognitiveLevel}</td>
        <td style="text-align: center; text-transform: capitalize;">${q.difficulty}</td>
        <td style="text-align: center;">${q.type === 'pilihan_ganda' ? 'PG' : q.type === 'isian' ? 'Isian' : 'Uraian'}</td>
        <td style="text-align: center; font-weight: bold;">${q.number}</td>
        <td style="text-align: center;">${q.weight}</td>
      </tr>
    `
      )
      .join('');

    const contentHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">KISI-KISI PENULISAN SOAL ASESMEN</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">${selectedAssessment.title}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">
          Mata Pelajaran: ${currentSubject?.name || '-'} | Kelas/Fase: ${currentClass?.name || '-'} (${currentClass?.phase || '-'}) | Tahun Pelajaran: ${madrasahStore.getAcademicYears().find(y => y.id === selectedAssessment.academicYearId)?.name || '2026/2027'}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Materi Pokok</th>
            <th style="width: 65px;">Capaian (CP)</th>
            <th style="width: 65px;">Tujuan (TP)</th>
            <th>Indikator Asesmen</th>
            <th style="width: 45px;">Level</th>
            <th style="width: 55px;">Kesulitan</th>
            <th style="width: 45px;">Bentuk</th>
            <th style="width: 35px;">No.</th>
            <th style="width: 40px;">Bobot</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${signatureHtml}
    `;

    printDocument(`Kisi-Kisi_${selectedAssessment.title}`, contentHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Generator Kisi-Kisi Otomatis
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Matriks keterkaitan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), indikator, taksonomi kognitif, dan sebaran butir soal.
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
            onClick={handlePrint}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kisi-Kisi Resmi (Kop MIN 1 Paser)</span>
          </button>
        </div>
      </div>

      {/* Assessment Selector */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-gray-700">Pilih Asesmen:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-600 flex items-center space-x-4">
          <span>Total Butir: <strong className="text-gray-900">{questions.length}</strong></span>
          <span>•</span>
          <span>PG: <strong className="text-gray-900">{questions.filter((q) => q.type === 'pilihan_ganda').length}</strong></span>
          <span>•</span>
          <span>Isian: <strong className="text-gray-900">{questions.filter((q) => q.type === 'isian').length}</strong></span>
          <span>•</span>
          <span>Essay: <strong className="text-gray-900">{questions.filter((q) => q.type === 'essay').length}</strong></span>
        </div>
      </div>

      {/* Kisi-Kisi Table Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/40">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Matriks Kisi-Kisi Penulisan Soal
            </h3>
            <p className="text-xs text-gray-500">
              {selectedAssessment?.title} • {currentSubject?.name} • {currentClass?.name}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            Terhubung Database Soal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">Materi Pokok</th>
                <th className="py-3 px-3">CP / TP</th>
                <th className="py-3 px-3 min-w-[200px]">Indikator Soal</th>
                <th className="py-3 px-3 text-center">Level</th>
                <th className="py-3 px-3 text-center">Kesulitan</th>
                <th className="py-3 px-3 text-center">Bentuk</th>
                <th className="py-3 px-3 text-center">No.</th>
                <th className="py-3 px-3 text-center">Bobot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Belum ada butir soal pada asesmen ini.
                  </td>
                </tr>
              ) : (
                questions.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{q.topic || 'Materi Pokok'}</td>
                    <td className="py-2.5 px-3 text-gray-600">
                      <div className="font-mono text-[11px] font-bold text-emerald-800">{q.cpCode || 'CP-AA-B.1'}</div>
                      <div className="font-mono text-[10px] text-gray-500">{q.tpCode || 'TP-AA-4.1'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 leading-relaxed">{q.indicator}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                        {q.cognitiveLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center capitalize text-gray-700">{q.difficulty}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        q.type === 'pilihan_ganda' ? 'bg-blue-100 text-blue-800' : q.type === 'isian' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {q.type === 'pilihan_ganda' ? 'PG' : q.type === 'isian' ? 'Isian' : 'Essay'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-gray-900">{q.number}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{q.weight}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
