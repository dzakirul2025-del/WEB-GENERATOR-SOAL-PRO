import React, { useState } from 'react';
import { CreditCard, Printer, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';
import { QuestionItem } from '../../types';

interface QuestionCardsViewProps {
  onNavigate: (view: string) => void;
}

export const QuestionCardsView: React.FC<QuestionCardsViewProps> = ({ onNavigate }) => {
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

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const activeQuestion = questions[activeCardIndex] as QuestionItem | undefined;

  const handlePrintAllCards = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const cardsHtml = questions
      .map((q) => {
        return `
        <div style="page-break-after: always; margin-bottom: 25px; border: 2px solid #000; padding: 15px; font-family: 'Times New Roman', serif;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">${MADRASAH_INFO.name}</div>
            <div style="font-size: 12pt; font-weight: 800; text-transform: uppercase;">KARTU SOAL NOMOR ${q.number}</div>
            <div style="font-size: 10pt;">${selectedAssessment.title} • T.P. 2024/2025</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px;">
            <tr>
              <td style="width: 25%; font-weight: bold; border: 1px solid #000; padding: 4px;">Mata Pelajaran</td>
              <td style="width: 25%; border: 1px solid #000; padding: 4px;">${currentSubject?.name || '-'}</td>
              <td style="width: 25%; font-weight: bold; border: 1px solid #000; padding: 4px;">Penyusun</td>
              <td style="width: 25%; border: 1px solid #000; padding: 4px;">${MADRASAH_INFO.pengembang.name}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Kelas / Fase</td>
              <td style="border: 1px solid #000; padding: 4px;">${currentClass?.name || '-'} (${currentClass?.phase || '-'})</td>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Bentuk Soal</td>
              <td style="border: 1px solid #000; padding: 4px; text-transform: uppercase; font-weight: bold;">${q.type.replace('_', ' ')}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Level Kognitif</td>
              <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${q.cognitiveLevel}</td>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Tingkat Kesulitan</td>
              <td style="border: 1px solid #000; padding: 4px; text-transform: capitalize;">${q.difficulty}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Capaian (CP)</td>
              <td colspan="3" style="border: 1px solid #000; padding: 4px;">${q.cpCode || 'CP-AA-B.1'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Tujuan (TP)</td>
              <td colspan="3" style="border: 1px solid #000; padding: 4px;">${q.tpCode || 'TP-AA-4.1'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Materi Pokok</td>
              <td colspan="3" style="border: 1px solid #000; padding: 4px;">${q.topic || 'Materi Pokok'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; border: 1px solid #000; padding: 4px;">Indikator Soal</td>
              <td colspan="3" style="border: 1px solid #000; padding: 4px;">${q.indicator}</td>
            </tr>
          </table>

          <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px; font-size: 10.5pt;">
            <div style="font-weight: bold; margin-bottom: 5px;">RUMUSAN BUTIR SOAL:</div>
            ${q.stimulus ? `<div style="font-style: italic; margin-bottom: 6px;">[Stimulus] ${q.stimulus}</div>` : ''}
            <div>${q.stem}</div>
            ${
              q.type === 'pilihan_ganda' && q.options
                ? `<div style="margin-top: 8px;">
                    ${q.options.map((o) => `<div>${o.key}. ${o.text}</div>`).join('')}
                  </div>`
                : ''
            }
          </div>

          <div style="border: 1px solid #000; padding: 8px; font-size: 9.5pt; background-color: #f9f9f9;">
            <div style="font-weight: bold;">KUNCI JAWABAN & PENSKORAN:</div>
            <div><strong>Kunci Jawaban:</strong> ${q.correctAnswerKey || '-'}</div>
            ${q.explanation ? `<div><strong>Pembahasan:</strong> ${q.explanation}</div>` : ''}
            <div><strong>Bobot Soal:</strong> ${q.weight} Poin</div>
          </div>
        </div>
      `;
      })
      .join('');

    printDocument(`Kartu_Soal_Massal_${selectedAssessment.title}`, cardsHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Generator Kartu Soal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Format resmi kartu soal Madrasah Ibtidaiyah Negeri 1 Paser dilengkapi telaah kognitif, indikator, dan rubrik penskoran.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintAllCards}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Seluruh Kartu ({questions.length} Butir)</span>
          </button>
        </div>
      </div>

      {/* Selector & Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-gray-700">Pilih Asesmen:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => {
              setSelectedAssessmentId(e.target.value);
              setActiveCardIndex(0);
            }}
            className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        {questions.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              disabled={activeCardIndex <= 0}
              onClick={() => setActiveCardIndex((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs font-bold text-gray-800">
              Kartu {activeCardIndex + 1} dari {questions.length}
            </span>
            <button
              disabled={activeCardIndex >= questions.length - 1}
              onClick={() => setActiveCardIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Single Card Display */}
      {activeQuestion ? (
        <div className="bg-white rounded-2xl border-2 border-gray-800 p-6 shadow-md max-w-4xl mx-auto space-y-4">
          <div className="text-center border-b-2 border-gray-800 pb-3">
            <h4 className="text-xs font-bold text-gray-600 tracking-wider uppercase">
              {MADRASAH_INFO.name}
            </h4>
            <h2 className="text-base font-black text-gray-900 uppercase">
              KARTU SOAL NOMOR {activeQuestion.number}
            </h2>
            <p className="text-xs text-gray-500">
              {selectedAssessment?.title} • Tahun Pelajaran 2024/2025
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-gray-300 rounded-lg p-3 bg-gray-50/50">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Mata Pelajaran:</span>
              <strong className="text-gray-900">{currentSubject?.name}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Kelas / Fase:</span>
              <strong className="text-gray-900">{currentClass?.name} ({currentClass?.phase})</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Bentuk Soal:</span>
              <span className="font-extrabold text-emerald-800 uppercase">{activeQuestion.type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Penyusun:</span>
              <strong className="text-gray-900">{MADRASAH_INFO.pengembang.name}</strong>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Level Kognitif:</span>
              <strong className="text-gray-900">{activeQuestion.cognitiveLevel}</strong>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Tingkat Kesulitan:</span>
              <strong className="capitalize text-gray-900">{activeQuestion.difficulty}</strong>
            </div>
            <div className="pt-2 border-t border-gray-200 col-span-2">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Bobot Soal:</span>
              <strong className="text-emerald-700">{activeQuestion.weight} Poin</strong>
            </div>
          </div>

          <div className="p-3 border border-gray-200 rounded-lg text-xs space-y-1">
            <div><strong>Capaian (CP):</strong> {activeQuestion.cpCode || 'CP-AA-B.1'}</div>
            <div><strong>Tujuan (TP):</strong> {activeQuestion.tpCode || 'TP-AA-4.1'}</div>
            <div><strong>Materi:</strong> {activeQuestion.topic || 'Materi Pokok'}</div>
            <div><strong>Indikator:</strong> {activeQuestion.indicator}</div>
          </div>

          <div className="p-4 border-2 border-gray-300 rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Rumusan Butir Soal:
            </span>
            {activeQuestion.stimulus && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-xs italic text-blue-950">
                [Stimulus] {activeQuestion.stimulus}
              </div>
            )}
            <p className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{activeQuestion.stem}</p>

            {activeQuestion.type === 'pilihan_ganda' && activeQuestion.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {activeQuestion.options.map((opt) => (
                  <div
                    key={opt.key}
                    className={`p-2 rounded border text-xs flex items-center space-x-2 ${
                      opt.key === activeQuestion.correctAnswerKey
                        ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="w-5 font-bold">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
            <div>
              <strong>Kunci Jawaban Benar:</strong>{' '}
              <span className="font-extrabold text-emerald-900 text-sm">{activeQuestion.correctAnswerKey}</span>
            </div>
            {activeQuestion.explanation && (
              <div>
                <strong>Pembahasan:</strong> {activeQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500">Tidak ada soal pada asesmen ini.</p>
        </div>
      )}
    </div>
  );
};
