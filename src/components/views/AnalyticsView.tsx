import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import {
  calculateClassStatistics,
  calculateItemAnalysis,
  calculateTpMastery,
} from '../../lib/analytics-calc';
import { exportToExcel, printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';

interface AnalyticsViewProps {
  onNavigate: (view: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const sessions = madrasahStore
    .getExamSessions()
    .filter((s) => s.assessmentId === selectedAssessmentId);

  const stats = calculateClassStatistics(sessions, selectedAssessment?.kktp || 75);
  const { items: itemAnalysis, kr20 } = calculateItemAnalysis(questions, sessions);
  const tpMastery = calculateTpMastery(questions, sessions, selectedAssessment?.kktp || 75);

  // AI Narrative State
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativeText, setNarrativeText] = useState<string | null>(null);

  const handleGenerateNarrative = async () => {
    if (!selectedAssessment || stats.count === 0) {
      alert('Belum ada data pengerjaan siswa yang dapat dianalisis.');
      return;
    }

    setIsGeneratingNarrative(true);
    try {
      const response = await fetch('/api/ai/generate-analysis-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentTitle: selectedAssessment.title,
          stats: { ...stats, reliabilityKR20: kr20 },
          tpMastery,
          madrasahInfo: MADRASAH_INFO,
        }),
      });

      if (!response.ok) throw new Error('Gagal menghasilkan narasi analisis');
      const data = await response.json();
      setNarrativeText(data.narrative);
    } catch (err: any) {
      alert(err.message || 'Gagal menghasilkan narasi AI');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const handleExportItemAnalysis = () => {
    if (!selectedAssessment || itemAnalysis.length === 0) return;

    const exportData = itemAnalysis.map((item) => ({
      'Nomor Soal': item.questionNumber,
      'Bentuk Soal': item.questionType.toUpperCase(),
      'Tingkat Kesukaran (p)': item.difficultyIndex,
      'Kategori Kesukaran': item.difficultyCategory,
      'Daya Pembeda (D)': item.discriminationIndex,
      'Kategori Daya Pembeda': item.discriminationCategory,
      'Pengecoh A (%)': item.distractorAnalysis?.find((d) => d.optionKey === 'A')?.percentage ?? '-',
      'Pengecoh B (%)': item.distractorAnalysis?.find((d) => d.optionKey === 'B')?.percentage ?? '-',
      'Pengecoh C (%)': item.distractorAnalysis?.find((d) => d.optionKey === 'C')?.percentage ?? '-',
      'Pengecoh D (%)': item.distractorAnalysis?.find((d) => d.optionKey === 'D')?.percentage ?? '-',
    }));

    exportToExcel(
      exportData,
      `Analisis_Butir_${selectedAssessment.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
      'Analisis Butir'
    );
  };

  const handlePrintReport = () => {
    if (!selectedAssessment) return;

    const kopHtml = generateKopSuratHtml();
    const signatureHtml = generateTandaTanganHtml(
      MADRASAH_INFO.pengembang.name,
      MADRASAH_INFO.pengembang.nip
    );

    const rowsHtml = itemAnalysis
      .map(
        (item) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${item.questionNumber}</td>
        <td style="text-align: center; text-transform: uppercase;">${item.questionType === 'pilihan_ganda' ? 'PG' : item.questionType === 'isian' ? 'Isian' : 'Essay'}</td>
        <td style="text-align: center; font-weight: bold;">${item.difficultyIndex}</td>
        <td style="text-align: center;">${item.difficultyCategory}</td>
        <td style="text-align: center; font-weight: bold;">${item.discriminationIndex}</td>
        <td style="text-align: center;">${item.discriminationCategory}</td>
        <td style="text-align: center;">
          ${item.distractorAnalysis ? item.distractorAnalysis.map((d) => `${d.optionKey}:${d.percentage}%`).join(' | ') : '-'}
        </td>
      </tr>
    `
      )
      .join('');

    const fullHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">LAPORAN ANALISIS HASIL & BUTIR SOAL</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">${selectedAssessment.title}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">
          Jumlah Peserta: ${stats.count} Siswa | Rata-Rata: ${stats.mean} | Ketuntasan: ${stats.masteryPercentage}% | Reliabilitas (KR-20): ${kr20}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">No.</th>
            <th style="width: 60px;">Bentuk</th>
            <th style="width: 80px;">Indeks Kesukaran (p)</th>
            <th style="width: 80px;">Kategori</th>
            <th style="width: 80px;">Daya Pembeda (D)</th>
            <th style="width: 90px;">Kategori</th>
            <th>Distribusi Pengecoh</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${
        narrativeText
          ? `<div style="margin-top: 20px; font-size: 10pt; line-height: 1.5; border: 1px solid #000; padding: 12px; background-color: #fafafa;">
              <div style="font-weight: bold; margin-bottom: 6px; text-transform: uppercase;">NARASI EVALUASI & REKOMENDASI PEMBELAJARAN:</div>
              <div style="white-space: pre-wrap;">${narrativeText}</div>
            </div>`
          : ''
      }

      ${signatureHtml}
    `;

    printDocument(`Laporan_Analisis_${selectedAssessment.title}`, fullHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Analisis Hasil Asesmen & Butir Soal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Analisis psikometri butir soal (indeks kesukaran p, daya pembeda D, efektivitas pengecoh, reliabilitas KR-20) dan evaluasi capaian TP.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportItemAnalysis}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan Lengkap</span>
          </button>
        </div>
      </div>

      {/* Selector Bar */}
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

        <div className="flex items-center space-x-2">
          <button
            disabled={isGeneratingNarrative || stats.count === 0}
            onClick={handleGenerateNarrative}
            className="text-xs bg-purple-50 text-purple-900 border border-purple-300 hover:bg-purple-100 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>{isGeneratingNarrative ? 'Menyusun Narasi AI...' : 'Generate Narasi Evaluasi AI'}</span>
          </button>
        </div>
      </div>

      {/* Bagian A: Statistik Kelas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Peserta Masuk</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{stats.count}</span>
          <span className="text-[10px] text-gray-400">Siswa Mengerjakan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Rata-Rata (Mean)</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{stats.mean}</span>
          <span className="text-[10px] text-gray-400">Skala 0-100</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Nilai Tertinggi</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.maxScore}</span>
          <span className="text-[10px] text-gray-400">Terendah: {stats.minScore}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Median & Deviasi</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{stats.median}</span>
          <span className="text-[10px] text-gray-400">SD: ±{stats.stdDev}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Ketuntasan (KKTP)</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.masteryPercentage}%</span>
          <span className="text-[10px] text-gray-400">{stats.passedCount} Tuntas • {stats.failedCount} Remedial</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Reliabilitas (KR-20)</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{kr20}</span>
          <span className="text-[10px] text-purple-800 font-semibold">{kr20 >= 0.7 ? 'Kategori Tinggi' : 'Sedang'}</span>
        </div>
      </div>

      {/* Distribution Histogram & AI Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Distribusi Nilai Hasil Asesmen</h3>

          <div className="space-y-3">
            {stats.scoreBuckets.map((bucket) => {
              const pct = stats.count > 0 ? Math.round((bucket.count / stats.count) * 100) : 0;
              return (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{bucket.range}</span>
                    <span className="font-bold text-gray-900">{bucket.count} Siswa ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Narrative Analysis Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Narasi Evaluasi AI untuk Kepala Madrasah</span>
            </h3>
            {narrativeText && (
              <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                Terverifikasi Data
              </span>
            )}
          </div>

          {narrativeText ? (
            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-gray-800 leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap font-serif">
              {narrativeText}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-500 mb-3">
                Klik tombol di bawah untuk menyusun narasi evaluasi komprehensif berbasis data statistik ilmiah bagi pimpinan madrasah.
              </p>
              <button
                disabled={isGeneratingNarrative || stats.count === 0}
                onClick={handleGenerateNarrative}
                className="inline-flex items-center space-x-1.5 text-xs font-bold bg-purple-700 text-white px-3.5 py-2 rounded-lg hover:bg-purple-800"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Susun Narasi Otomatis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bagian B: Analisis Butir Soal Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/40">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Tabel Analisis Psikometri Butir Soal (Item Analysis)
            </h3>
            <p className="text-xs text-gray-500">
              Indeks Kesukaran p = B/N • Daya Pembeda D = (BA-BB)/(0.5*N) • Efektivitas Pengecoh Opsi
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
            {itemAnalysis.length} Butir Dianalisis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-12">No.</th>
                <th className="py-3 px-3 text-center">Bentuk</th>
                <th className="py-3 px-3 text-center">Indeks Kesukaran (p)</th>
                <th className="py-3 px-3 text-center">Klasifikasi Kesukaran</th>
                <th className="py-3 px-3 text-center">Daya Pembeda (D)</th>
                <th className="py-3 px-3 text-center">Mutu Pembeda</th>
                <th className="py-3 px-3">Efektivitas Pengecoh (Distractor)</th>
                <th className="py-3 px-3 text-center">Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {itemAnalysis.map((item) => (
                <tr key={item.questionId} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-black text-gray-800">{item.questionNumber}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded uppercase">
                      {item.questionType === 'pilihan_ganda' ? 'PG' : item.questionType === 'isian' ? 'Isian' : 'Essay'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono text-gray-900">
                    {item.difficultyIndex}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.difficultyCategory === 'Sedang'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.difficultyCategory === 'Mudah'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.difficultyCategory}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono text-gray-900">
                    {item.discriminationIndex}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.discriminationIndex >= 0.3
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.discriminationIndex >= 0.2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.discriminationCategory}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.distractorAnalysis ? (
                      <div className="flex items-center space-x-2 text-[11px]">
                        {item.distractorAnalysis.map((d) => (
                          <span
                            key={d.optionKey}
                            className={`px-1.5 py-0.5 rounded ${
                              d.isEffective ? 'bg-gray-100 text-gray-800' : 'bg-red-50 text-red-700 font-semibold'
                            }`}
                          >
                            {d.optionKey}: {d.percentage}%
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">Bukan Pilihan Ganda</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.discriminationIndex >= 0.25
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {item.discriminationIndex >= 0.25 ? 'Diterima Baik' : 'Perlu Revisi'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian C: Ketercapaian Tujuan Pembelajaran (TP) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">
          Analisis Ketercapaian Tujuan Pembelajaran (TP Kurikulum Merdeka)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tpMastery.map((tp) => (
            <div
              key={tp.tpCode}
              className={`p-4 rounded-xl border space-y-2 ${
                tp.isMastered ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  {tp.tpCode}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  tp.isMastered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {tp.isMastered ? 'TUNTAS (KKTP)' : 'PERLU PENGUATAN'}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800">{tp.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                <span>Rata-Rata Capaian: <strong>{tp.avgPercentage}%</strong></span>
                <span>Siswa Butuh Remedial: <strong className="text-amber-800">{tp.studentsNeedingRemedial} Siswa</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
