import React, { useState } from 'react';
import { Printer, Columns2, Square, Download, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { printDocument, generateKopSuratHtml } from '../../lib/export-utils';
import { MADRASAH_INFO } from '../../lib/constants';

interface ExamPaperViewProps {
  onNavigate: (view: string) => void;
}

export const ExamPaperView: React.FC<ExamPaperViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const [columnLayout, setColumnLayout] = useState<'1' | '2'>('1');
  const [fontSize, setFontSize] = useState<'10pt' | '11pt' | '12pt'>('11pt');

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const subjects = madrasahStore.getSubjects();
  const classes = madrasahStore.getClasses();

  const currentSubject = subjects.find((s) => s.id === selectedAssessment?.subjectId);
  const currentClass = classes.find((c) => c.id === selectedAssessment?.classId);

  const pgQuestions = questions.filter((q) => q.type === 'pilihan_ganda');
  const isianQuestions = questions.filter((q) => q.type === 'isian');
  const essayQuestions = questions.filter((q) => q.type === 'essay');

  const handlePrintStudentPaper = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const kopHtml = generateKopSuratHtml();

    const studentHeaderHtml = `
      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 15px; font-size: 10pt; font-family: 'Times New Roman', serif;">
        <table style="width: 100%; border: none; margin: 0;">
          <tr>
            <td style="border: none; width: 60%; padding: 2px;">
              <div><strong>NAMA LENGKAP :</strong> ________________________________________</div>
              <div style="margin-top: 4px;"><strong>NIS / NISN   :</strong> ________________ / ___________________</div>
            </td>
            <td style="border: none; width: 40%; padding: 2px;">
              <div><strong>KELAS / HARI :</strong> ${currentClass?.name || '-'} / __________________</div>
              <div style="margin-top: 4px;"><strong>WAKTU / RUANG:</strong> ${selectedAssessment.durationMinutes} Menit / _____________</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 12px; font-weight: bold; font-size: 12pt; text-transform: uppercase;">
        NASKAH SOAL ${selectedAssessment.title}
        <div style="font-size: 10pt; font-weight: normal; margin-top: 2px;">Mata Pelajaran: ${currentSubject?.name || '-'}</div>
      </div>

      <div style="font-size: 9pt; border-left: 3px solid #000; padding-left: 8px; margin-bottom: 15px; font-style: italic;">
        <strong>Petunjuk Pengerjaan:</strong>
        <br/>1. Berdoalah sebelum mulai mengerjakan soal.
        <br/>2. Tulis identitas Anda dengan jelas pada kolom yang tersedia.
        <br/>3. Untuk Pilihan Ganda: Beri tanda silang (X) pada huruf A, B, C, atau D yang Anda anggap paling benar.
        <br/>4. Untuk Isian Singkat & Essay: Tuliskan jawaban Anda secara singkat, jelas, dan rapi.
      </div>
    `;

    let bodyHtml = '';

    if (pgQuestions.length > 0) {
      bodyHtml += `<div style="font-weight: bold; font-size: 11pt; margin: 15px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 3px;">I. PILIHAN GANDA</div>`;
      pgQuestions.forEach((q) => {
        bodyHtml += `
          <div style="margin-bottom: 12px; page-break-inside: avoid;">
            <div style="display: flex; align-items: flex-start;">
              <span style="font-weight: bold; width: 22px; shrink: 0;">${q.number}.</span>
              <div style="flex: 1;">
                ${q.stimulus ? `<div style="font-style: italic; margin-bottom: 4px;">[Stimulus] ${q.stimulus}</div>` : ''}
                <div>${q.stem}</div>
                ${
                  q.options
                    ? `<div style="margin-top: 4px; margin-left: 10px;">
                        ${q.options
                          .map(
                            (o) =>
                              `<div style="margin-bottom: 2px;"><span style="font-weight: bold;">${o.key}.</span> ${o.text}</div>`
                          )
                          .join('')}
                      </div>`
                    : ''
                }
              </div>
            </div>
          </div>
        `;
      });
    }

    if (isianQuestions.length > 0) {
      bodyHtml += `<div style="font-weight: bold; font-size: 11pt; margin: 20px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 3px;">II. ISIAN SINGKAT</div>`;
      isianQuestions.forEach((q) => {
        bodyHtml += `
          <div style="margin-bottom: 12px; page-break-inside: avoid;">
            <div style="display: flex; align-items: flex-start;">
              <span style="font-weight: bold; width: 22px; shrink: 0;">${q.number}.</span>
              <div style="flex: 1;">
                ${q.stimulus ? `<div style="font-style: italic; margin-bottom: 4px;">[Stimulus] ${q.stimulus}</div>` : ''}
                <div>${q.stem}</div>
                <div style="margin-top: 4px; color: #555;">Jawaban: ............................................................................................................................</div>
              </div>
            </div>
          </div>
        `;
      });
    }

    if (essayQuestions.length > 0) {
      bodyHtml += `<div style="font-weight: bold; font-size: 11pt; margin: 20px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 3px;">III. ESSAY / URAIAN</div>`;
      essayQuestions.forEach((q) => {
        bodyHtml += `
          <div style="margin-bottom: 15px; page-break-inside: avoid;">
            <div style="display: flex; align-items: flex-start;">
              <span style="font-weight: bold; width: 22px; shrink: 0;">${q.number}.</span>
              <div style="flex: 1;">
                ${q.stimulus ? `<div style="font-style: italic; margin-bottom: 4px;">[Stimulus] ${q.stimulus}</div>` : ''}
                <div>${q.stem}</div>
                <div style="margin-top: 6px; height: 75px; border-bottom: 1px dashed #aaa;"></div>
              </div>
            </div>
          </div>
        `;
      });
    }

    const fullHtml = `
      ${kopHtml}
      ${studentHeaderHtml}
      <div style="font-size: ${fontSize}; ${columnLayout === '2' ? 'column-count: 2; column-gap: 20px;' : ''}">
        ${bodyHtml}
      </div>
    `;

    printDocument(`Naskah_Soal_${selectedAssessment.title}`, fullHtml);
  };

  const handlePrintKeyAndExplanation = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const kopHtml = generateKopSuratHtml();

    const rowsHtml = questions
      .map(
        (q) => `
      <tr style="page-break-inside: avoid;">
        <td style="text-align: center; font-weight: bold;">${q.number}</td>
        <td style="text-align: center; font-weight: bold; text-transform: uppercase;">${q.type.replace('_', ' ')}</td>
        <td style="font-weight: bold; color: #006837;">${q.correctAnswerKey || '-'}</td>
        <td style="font-size: 9pt;">${q.explanation || '-'}</td>
        <td style="text-align: center;">${q.weight}</td>
      </tr>
    `
      )
      .join('');

    const fullHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">LEMBAR KUNCI JAWABAN & PEMBAHASAN</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">${selectedAssessment.title}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">DOKUMEN RAHASIA MADRASAH - HANYA UNTUK GURU & TIM PENGUJI</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">No</th>
            <th style="width: 70px;">Bentuk</th>
            <th style="width: 120px;">Kunci Jawaban</th>
            <th>Pembahasan & Kriteria Telaah</th>
            <th style="width: 45px;">Bobot</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    printDocument(`Kunci_Jawaban_${selectedAssessment.title}`, fullHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Naskah Soal Siap Cetak
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Format naskah ujian standar kertas A4 dilengkapi Kop Resmi MIN 1 Paser, kotak identitas peserta didik, dan lembar kunci terpisah.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintKeyAndExplanation}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cetak Kunci & Pembahasan (Terpisah)</span>
          </button>
          <button
            onClick={handlePrintStudentPaper}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Naskah Soal Siswa</span>
          </button>
        </div>
      </div>

      {/* Settings Bar */}
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

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 font-medium">Tata Letak Kolom:</span>
            <button
              onClick={() => setColumnLayout('1')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                columnLayout === '1' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1 Kolom
            </button>
            <button
              onClick={() => setColumnLayout('2')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                columnLayout === '2' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2 Kolom (Hemat Kertas)
            </button>
          </div>
        </div>
      </div>

      {/* Paper Preview Sheet (Mock A4) */}
      <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-md max-w-4xl mx-auto font-serif text-gray-900 space-y-6">
        {/* Kop Surat Header */}
        <div className="text-center border-b-4 border-double border-black pb-3">
          <div className="font-bold text-sm tracking-wide uppercase">{MADRASAH_INFO.kop.baris1}</div>
          <div className="font-bold text-xs tracking-wide uppercase">{MADRASAH_INFO.kop.baris2}</div>
          <div className="font-black text-base tracking-wider text-emerald-900 uppercase">
            {MADRASAH_INFO.kop.baris3}
          </div>
          <div className="text-[11px] italic text-gray-600 mt-0.5">{MADRASAH_INFO.kop.baris4}</div>
        </div>

        {/* Student identification Box */}
        <div className="border border-black p-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div>Nama Siswa : _________________________________</div>
              <div>NIS / NISN : _________________ / ______________</div>
            </div>
            <div className="space-y-1">
              <div>Kelas / Fase : {currentClass?.name || '-'} ({currentClass?.phase || '-'})</div>
              <div>Waktu / Ruang: {selectedAssessment?.durationMinutes || 60} Menit / _______</div>
            </div>
          </div>
        </div>

        {/* Paper title */}
        <div className="text-center">
          <h3 className="font-black text-sm uppercase">{selectedAssessment?.title}</h3>
          <p className="text-xs">Mata Pelajaran: {currentSubject?.name || '-'}</p>
        </div>

        {/* Questions Body */}
        <div className={`space-y-6 text-xs ${columnLayout === '2' ? 'columns-2 gap-6' : ''}`}>
          {/* PG Section */}
          {pgQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="font-bold border-b border-black pb-1 uppercase tracking-wider text-xs">
                I. Pilihan Ganda
              </div>
              {pgQuestions.map((q) => (
                <div key={q.id} className="space-y-1 break-inside-avoid">
                  <div className="flex items-start space-x-1.5 font-medium">
                    <span className="font-bold w-4 shrink-0">{q.number}.</span>
                    <div className="flex-1">
                      {q.stimulus && <div className="italic text-[11px] mb-1">[Stimulus] {q.stimulus}</div>}
                      <p>{q.stem}</p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1 mt-1.5 pl-2">
                          {q.options.map((opt) => (
                            <div key={opt.key}>
                              <span className="font-bold">{opt.key}.</span> {opt.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Isian Section */}
          {isianQuestions.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="font-bold border-b border-black pb-1 uppercase tracking-wider text-xs">
                II. Isian Singkat
              </div>
              {isianQuestions.map((q) => (
                <div key={q.id} className="space-y-1 break-inside-avoid">
                  <div className="flex items-start space-x-1.5 font-medium">
                    <span className="font-bold w-4 shrink-0">{q.number}.</span>
                    <div className="flex-1">
                      {q.stimulus && <div className="italic text-[11px] mb-1">[Stimulus] {q.stimulus}</div>}
                      <p>{q.stem}</p>
                      <div className="text-gray-400 mt-1">Jawaban: .....................................................................</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Essay Section */}
          {essayQuestions.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="font-bold border-b border-black pb-1 uppercase tracking-wider text-xs">
                III. Essay / Uraian
              </div>
              {essayQuestions.map((q) => (
                <div key={q.id} className="space-y-1 break-inside-avoid">
                  <div className="flex items-start space-x-1.5 font-medium">
                    <span className="font-bold w-4 shrink-0">{q.number}.</span>
                    <div className="flex-1">
                      {q.stimulus && <div className="italic text-[11px] mb-1">[Stimulus] {q.stimulus}</div>}
                      <p>{q.stem}</p>
                      <div className="mt-2 h-16 border-b border-dotted border-gray-400"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
