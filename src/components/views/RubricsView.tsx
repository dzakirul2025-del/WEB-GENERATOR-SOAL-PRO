import React, { useState } from 'react';
import { FileText, Printer, Plus, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';

interface RubricsViewProps {
  onNavigate: (view: string) => void;
}

export const RubricsView: React.FC<RubricsViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore
    .getQuestionsByAssessmentId(selectedAssessmentId)
    .filter((q) => q.type === 'essay' && q.essayRubric);

  const handlePrintRubrics = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const kopHtml = generateKopSuratHtml();
    const signatureHtml = generateTandaTanganHtml(
      MADRASAH_INFO.pengembang.name,
      MADRASAH_INFO.pengembang.nip
    );

    const rubricsHtml = questions
      .map((q) => {
        const rubric = q.essayRubric!;
        return `
        <div style="margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #000; padding: 12px; font-family: 'Times New Roman', serif;">
          <div style="font-weight: bold; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
            RUBRIK PENILAIAN SOAL ESSAY NOMOR ${q.number} (SKOR MAKSIMAL: ${rubric.maxScore})
          </div>
          <div style="font-size: 10pt; margin-bottom: 6px;"><strong>Rumusan Soal:</strong> ${q.stem}</div>
          <div style="font-size: 10pt; margin-bottom: 6px;"><strong>Aspek Penilaian:</strong> ${rubric.aspect}</div>
          <div style="font-size: 10pt; margin-bottom: 8px;"><strong>Kriteria Pencapaian:</strong> ${rubric.criteria}</div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #000; padding: 5px; width: 60px;">Skor</th>
                <th style="border: 1px solid #000; padding: 5px; width: 120px;">Predikat</th>
                <th style="border: 1px solid #000; padding: 5px;">Deskriptor Kualitatif</th>
              </tr>
            </thead>
            <tbody>
              ${rubric.levels
                .map(
                  (lvl) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${lvl.score}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${lvl.label}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${lvl.description}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
      })
      .join('');

    const fullHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">PEDOMAN RUBRIK PENILAIAN ESSAY RESMI</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">${selectedAssessment.title}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">Pedoman Penskoran Bertingkat Kurikulum Merdeka Madrasah</p>
      </div>
      ${rubricsHtml}
      ${signatureHtml}
    `;

    printDocument(`Rubrik_Penilaian_${selectedAssessment.title}`, fullHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Generator Rubrik Penilaian Essay
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Rubrik penskoran analitik dan holistik bertingkat (skor 1-5) dengan kriteria deskriptif terhubung ke modul koreksi dan buku nilai.
          </p>
        </div>

        <button
          onClick={handlePrintRubrics}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Rubrik Resmi (Kop MIN 1 Paser)</span>
        </button>
      </div>

      {/* Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center space-x-3">
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

      {/* Rubric Cards */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-xs text-gray-500">Tidak ada butir soal essay dengan rubrik pada asesmen ini.</p>
          </div>
        ) : (
          questions.map((q) => {
            const rubric = q.essayRubric!;
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-purple-100 text-purple-900">
                      Soal Essay No. {q.number}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-2">{q.stem}</h3>
                  </div>
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    Skor Maks: {rubric.maxScore} Poin
                  </span>
                </div>

                <div className="text-xs text-gray-700 space-y-1">
                  <div><strong>Aspek Penilaian:</strong> {rubric.aspect}</div>
                  <div><strong>Kriteria Jawaban:</strong> {rubric.criteria}</div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Tingkat Pencapaian & Deskriptor Kualitatif:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {rubric.levels.map((lvl) => (
                      <div
                        key={lvl.score}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-start space-x-3 text-xs"
                      >
                        <span className="w-16 font-extrabold text-purple-900 shrink-0">
                          Skor {lvl.score}
                        </span>
                        <div className="flex-1">
                          <span className="font-bold text-gray-900 block">{lvl.label}</span>
                          <span className="text-gray-600 text-[11px]">{lvl.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
