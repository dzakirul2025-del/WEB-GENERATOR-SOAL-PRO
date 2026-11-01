import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Edit3,
  Trash2,
  Printer,
  Sparkles,
  Info,
  Lock,
  Unlock,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  FileText,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { QuestionItem, QuestionType, ValidationStatus, QuestionValidationCriteria } from '../../types';
import { MADRASAH_INFO } from '../../lib/constants';
import { printDocument, generateKopSuratHtml, generateTandaTanganHtml } from '../../lib/export-utils';

interface QuestionValidationViewProps {
  onNavigate: (view: string) => void;
}

export const QuestionValidationView: React.FC<QuestionValidationViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const defaultAsm = assessments.find((a) => a.id === 'asm-sas-ipas-6c') || assessments[0];
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    defaultAsm?.id || 'asm-sas-ipas-6c'
  );

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const subjects = madrasahStore.getSubjects();
  const classes = madrasahStore.getClasses();

  const currentSubject = subjects.find((s) => s.id === selectedAssessment?.subjectId);
  const currentClass = classes.find((c) => c.id === selectedAssessment?.classId);

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Revision Note Modal
  const [revisionQuestionId, setRevisionQuestionId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<string>('');

  // Calculate validation metrics
  const totalQuestions = questions.length;
  const validatedCount = questions.filter(
    (q) => q.validationStatus === 'validated' || (q.isApproved && q.validationStatus !== 'needs_revision')
  ).length;
  const needsRevisionCount = questions.filter((q) => q.validationStatus === 'needs_revision').length;
  const pendingCount = totalQuestions - validatedCount - needsRevisionCount;
  const validationPercentage = totalQuestions > 0 ? Math.round((validatedCount / totalQuestions) * 100) : 0;

  const isFullyValidated = totalQuestions > 0 && validatedCount === totalQuestions;

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const status = q.validationStatus || (q.isApproved ? 'validated' : 'draft');
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    const matchesSearch =
      q.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Automated quality scan per item
  const analyzeItemQuality = (q: QuestionItem) => {
    const issues: { type: 'error' | 'warning'; text: string }[] = [];

    // 1. Aspek Materi
    if (!q.stem || q.stem.trim().length < 10) {
      issues.push({ type: 'error', text: 'Rumusan soal terlalu pendek atau belum terisi.' });
    }
    if (!q.indicator || q.indicator.trim().length === 0) {
      issues.push({ type: 'warning', text: 'Indikator asesmen belum dirumuskan secara spesifik.' });
    }

    // 2. Aspek Konstruksi
    if (q.type === 'pilihan_ganda') {
      if (!q.options || q.options.length < 4) {
        issues.push({ type: 'error', text: 'Pilihan jawaban tidak lengkap (wajib 4 opsi: A, B, C, D).' });
      } else {
        const emptyOpts = q.options.filter((o) => !o.text || o.text.trim().length === 0);
        if (emptyOpts.length > 0) {
          issues.push({ type: 'error', text: `Terdapat ${emptyOpts.length} pilihan jawaban yang masih kosong.` });
        }
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswerKey || '')) {
        issues.push({ type: 'error', text: 'Kunci jawaban tidak cocok dengan opsi yang tersedia.' });
      }
    }

    if (q.type === 'isian') {
      if (!q.correctAnswerKey || q.correctAnswerKey.trim().length === 0) {
        issues.push({ type: 'error', text: 'Soal isian singkat wajib memiliki kunci jawaban terukur.' });
      }
    }

    if (q.type === 'essay') {
      if (!q.essayRubric || !q.essayRubric.criteria) {
        issues.push({ type: 'error', text: 'Soal essay wajib memiliki rubrik analitik dan kriteria penskoran.' });
      }
    }

    // 3. Uji Keunikan & Duplikasi
    const dupCheck = madrasahStore.checkDuplicateStem(q.stem, q.id);
    if (dupCheck.isDuplicate) {
      issues.push({
        type: 'error',
        text: `Terdeteksi potensi duplikasi kemiripan teks (${Math.round(dupCheck.similarityScore * 100)}%) dengan soal lain.`,
      });
    }

    return issues;
  };

  // Action: Single Validate
  const handleApproveQuestion = (q: QuestionItem) => {
    const issues = analyzeItemQuality(q);
    const hasFatal = issues.some((i) => i.type === 'error');

    if (hasFatal) {
      alert(`Butir soal No. ${q.number} belum dapat divalidasi karena masih memiliki ${issues.filter((i) => i.type === 'error').length} kesalahan konstruksi/kunci. Silakan perbaiki butir soal terlebih dahulu.`);
      return;
    }

    const criteria: QuestionValidationCriteria = {
      materi: true,
      konstruksi: true,
      bahasa: true,
      kunci: true,
      duplikasi: true,
    };

    madrasahStore.validateQuestion(q.id, 'validated', criteria, 'Tervalidasi memenuhi standar telaah soal madrasah.');
  };

  // Action: Request Revision
  const handleOpenRevisionModal = (qId: string) => {
    setRevisionQuestionId(qId);
    setRevisionNotes('');
  };

  const handleConfirmRevision = () => {
    if (!revisionQuestionId) return;
    const criteria: QuestionValidationCriteria = {
      materi: false,
      konstruksi: false,
      bahasa: true,
      kunci: false,
      duplikasi: true,
    };

    madrasahStore.validateQuestion(
      revisionQuestionId,
      'needs_revision',
      criteria,
      revisionNotes || 'Perlu perbaikan rumusan pokok soal / kunci / rubrik.'
    );

    setRevisionQuestionId(null);
    setRevisionNotes('');
  };

  // Action: Batch Auto-Validate
  const handleBatchValidate = () => {
    if (!selectedAssessment) return;
    const res = madrasahStore.batchValidateAssessment(selectedAssessment.id);
    alert(`Hasil Pemindaian Mutu:\n• ${res.validated} butir soal memenuhi standar dan berhasil TERVALIDASI.\n• ${res.needsRevision} butir soal ditandai PERLU REVISI karena belum memenuhi kelengkapan.`);
  };

  // Action: Print Berita Acara Validasi
  const handlePrintValidationReport = () => {
    if (!selectedAssessment || questions.length === 0) return;

    const kopHtml = generateKopSuratHtml();
    const signatureHtml = generateTandaTanganHtml(
      MADRASAH_INFO.pengembang.name,
      MADRASAH_INFO.pengembang.nip
    );

    const rowsHtml = questions
      .map((q) => {
        const status = q.validationStatus || (q.isApproved ? 'validated' : 'draft');
        const statusLabel =
          status === 'validated'
            ? '<span style="color: #006837; font-weight: bold;">LAYAK / DITERIMA</span>'
            : status === 'needs_revision'
            ? '<span style="color: #c2410c; font-weight: bold;">REVISI</span>'
            : '<span style="color: #6b7280;">BELUM TELAAH</span>';

        return `
        <tr style="page-break-inside: avoid;">
          <td style="text-align: center; font-weight: bold;">${q.number}</td>
          <td style="text-align: center; text-transform: uppercase;">${q.type === 'pilihan_ganda' ? 'PG' : q.type === 'isian' ? 'Isian' : 'Essay'}</td>
          <td style="text-align: center;">${q.cognitiveLevel}</td>
          <td>${q.indicator}</td>
          <td style="text-align: center;">${q.correctAnswerKey || '(Rubrik)'}</td>
          <td style="text-align: center;">${statusLabel}</td>
          <td style="font-size: 8.5pt;">${q.validationDetails?.notes || '-'}</td>
        </tr>
      `;
      })
      .join('');

    const contentHtml = `
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase; font-size: 13pt;">BERITA ACARA & LEMBAR TELAAH VALIDASI BUTIR SOAL</h3>
        <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">${selectedAssessment.title}</p>
        <p style="margin: 2px 0 0 0; font-size: 10pt;">
          Mata Pelajaran: ${currentSubject?.name || '-'} | Kelas: ${currentClass?.name || '-'} | Status Kelayakan: ${isFullyValidated ? 'LULUS 100% (SIAP CBT & CETAK)' : 'MASIH DALAM VALIDASI'}
        </p>
      </div>

      <div style="font-size: 9.5pt; margin-bottom: 12px; line-height: 1.5; border: 1px solid #000; padding: 8px;">
        Telah dilakukan penelaahan kualitatif butir soal mencakup: <strong>Aspek Materi</strong> (kesesuaian CP/TP), <strong>Aspek Konstruksi</strong> (kejelasan rumusan, homogenitas opsi), <strong>Aspek Bahasa</strong> (EYD & komunikatif), dan <strong>Uji Keunikan</strong> (bebas duplikasi) sesuai standar Asesmen Madrasah Kemenag.
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">No.</th>
            <th style="width: 55px;">Bentuk</th>
            <th style="width: 50px;">Level</th>
            <th>Indikator Asesmen</th>
            <th style="width: 90px;">Kunci</th>
            <th style="width: 100px;">Status Telaah</th>
            <th style="width: 160px;">Catatan Validator</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${signatureHtml}
    `;

    printDocument(`Berita_Acara_Validasi_${selectedAssessment.title}`, contentHtml);
  };

  // Quick edit save
  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    madrasahStore.saveQuestion(editingQuestion);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Fitur Validasi Mutu Soal Resmi
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
              Gerbang Wajib Ujian
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Penelaahan kualitatif berstandar Kemenag (Materi, Konstruksi, Bahasa, Kunci, & Bebas Duplikasi). Soal wajib lolos validasi 100% sebelum dapat diterbitkan atau dikerjakan pada CBT.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleBatchValidate}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center space-x-1.5"
            title="Scan otomatis seluruh butir soal"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pindai Mutu Otomatis</span>
          </button>

          <button
            onClick={handlePrintValidationReport}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara Telaah</span>
          </button>
        </div>
      </div>

      {/* Assessment Selector & Strict CBT Gating Status Banner */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-gray-700">Pilih Asesmen Target:</label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-bold bg-white"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-gray-600">Progres Validasi:</span>
            <div className="w-32 bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFullyValidated ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${validationPercentage}%` }}
              ></div>
            </div>
            <strong className="text-gray-900 font-extrabold">{validationPercentage}%</strong>
            <span className="text-gray-500">({validatedCount}/{totalQuestions} Butir)</span>
          </div>
        </div>

        {/* Security & Gating Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isFullyValidated
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isFullyValidated ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {isFullyValidated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-extrabold text-sm">
                {isFullyValidated
                  ? 'STATUS ASESMEN: TERVALIDASI 100% (SIAP UJIAN CBT & CETAK NASKAH)'
                  : `STATUS ASESMEN: BELUM LAYAK DIGUNAKAN (${pendingCount + needsRevisionCount} BUTIR SOAL BELUM LOLOS VALIDASI)`}
              </div>
              <p className="text-[11px] mt-0.5 text-gray-700">
                {isFullyValidated
                  ? 'Seluruh butir soal telah melalui tahap telaah materi, konstruksi, bahasa, dan bebas duplikasi. Peserta didik dapat memulai pengerjaan CBT.'
                  : 'SOP Mutu Soal MIN 1 Paser: Asesmen tidak dapat diaktifkan atau dikerjakan oleh siswa pada modul CBT sebelum setiap butir soal dinyatakan "Valid & Layak".'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isFullyValidated ? (
              <button
                onClick={() => onNavigate('cbt')}
                className="bg-emerald-800 text-white font-extrabold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm hover:bg-emerald-900"
              >
                <span>Buka Simulasi CBT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="bg-amber-200 text-amber-950 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Gerbang CBT Terkunci</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              filterStatus === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua Soal ({totalQuestions})
          </button>
          <button
            onClick={() => setFilterStatus('validated')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              filterStatus === 'validated' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tervalidasi Layak ({validatedCount})
          </button>
          <button
            onClick={() => setFilterStatus('needs_revision')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              filterStatus === 'needs_revision' ? 'bg-white text-orange-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Perlu Revisi ({needsRevisionCount})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              filterStatus === 'draft' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Belum Ditelaah ({pendingCount})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari teks soal atau materi..."
            className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs bg-white"
          />
        </div>
      </div>

      {/* Question Items Validation Cards */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500">Tidak ada butir soal yang sesuai filter pencarian.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const status = q.validationStatus || (q.isApproved ? 'validated' : 'draft');
            const qualityIssues = analyzeItemQuality(q);
            const isItemValidated = status === 'validated';
            const isItemNeedsRevision = status === 'needs_revision';

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs space-y-3 transition-colors ${
                  isItemValidated
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : isItemNeedsRevision
                    ? 'border-orange-300 bg-orange-50/15'
                    : 'border-amber-200 bg-amber-50/10'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs px-2.5 py-0.5 rounded bg-gray-100 text-gray-900">
                      Soal No. {q.number}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      • {q.cognitiveLevel} • {q.difficulty} • Bobot: {q.weight} Poin
                    </span>
                  </div>

                  {/* Status Stempel */}
                  <div className="flex items-center space-x-2">
                    {isItemValidated ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>TERVALIDASI (LAYAK DIGUNAKAN)</span>
                      </span>
                    ) : isItemNeedsRevision ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
                        <span>PERLU PERBAIKAN / REVISI</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>DRAFT (BELUM DITELAAH)</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setEditingQuestion({ ...q });
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Edit Isi Butir Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stimulus if exists */}
                {q.stimulus && (
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/80 text-blue-950 text-xs italic">
                    <strong>Teks Stimulus:</strong> {q.stimulus}
                  </div>
                )}

                {/* Stem */}
                <div className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{q.stem}</div>

                {/* Options preview for PG */}
                {q.type === 'pilihan_ganda' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${
                          opt.key === q.correctAnswerKey
                            ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="w-5 font-bold">{opt.key}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.key === q.correctAnswerKey && (
                          <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-bold">
                            Kunci
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Isian key preview */}
                {q.type === 'isian' && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950">
                    <strong>Kunci Jawaban Benar:</strong> {q.correctAnswerKey}
                    {q.answerVariations && q.answerVariations.length > 0 && (
                      <span className="text-gray-600 ml-1">
                        (Toleransi: {q.answerVariations.join(', ')})
                      </span>
                    )}
                  </div>
                )}

                {/* Essay rubric preview */}
                {q.type === 'essay' && q.essayRubric && (
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1">
                    <div className="font-bold">Rubrik Penilaian: {q.essayRubric.aspect} (Skor Maks: {q.essayRubric.maxScore})</div>
                    <div className="text-[11px] text-gray-700">Kriteria: {q.essayRubric.criteria}</div>
                  </div>
                )}

                {/* Diagnostic Quality Issues Checklist */}
                {qualityIssues.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
                    <strong className="block font-bold">Catatan Telaah Mutu Soal ({qualityIssues.length} temuan):</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {qualityIssues.map((issue, idx) => (
                        <li key={idx} className={issue.type === 'error' ? 'font-semibold text-red-700' : 'text-amber-800'}>
                          {issue.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes from validator if any */}
                {q.validationDetails?.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start justify-between">
                    <div>
                      <strong className="text-gray-800">Catatan Validator:</strong> {q.validationDetails.notes}
                    </div>
                    {q.validationDetails.validatorName && (
                      <div className="text-[10px] text-gray-400 text-right shrink-0 ml-2">
                        Oleh: {q.validationDetails.validatorName} ({new Date(q.validationDetails.validatedAt).toLocaleDateString('id-ID')})
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Actions Toolbar */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Indikator: <strong>{q.indicator || 'Umum'}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenRevisionModal(q.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-900 bg-orange-50 hover:bg-orange-100 font-bold flex items-center space-x-1 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Minta Revisi</span>
                    </button>

                    <button
                      onClick={() => handleApproveQuestion(q)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors shadow-2xs ${
                        isItemValidated
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isItemValidated ? 'Tervalidasi Layak' : 'Sahkan & Nyatakan Layak'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Revision Request Modal */}
      {revisionQuestionId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-base text-gray-900">Catatan Perbaikan Butir Soal</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tuliskan instruksi perbaikan spesifik bagi guru penyusun (misal: perbaiki pilihan distractor C yang tidak homogen, atau perjelas rumusan pokok soal).
            </p>

            <textarea
              rows={3}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Contoh: Pokok soal terlalu ambigu, harap rumuskan stimulus lebih kontekstual..."
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRevisionQuestionId(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
              >
                Tandai Perlu Revisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                Perbaikan Butir Soal No. {editingQuestion.number}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Stimulus Bacaan</label>
                <textarea
                  rows={2}
                  value={editingQuestion.stimulus || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, stimulus: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Rumusan Kalimat Soal (Stem)</label>
                <textarea
                  rows={3}
                  value={editingQuestion.stem}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, stem: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2 font-medium"
                />
              </div>

              {editingQuestion.type === 'pilihan_ganda' && (
                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700">Pilihan Jawaban (A-D):</label>
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const opt = editingQuestion.options?.find((o) => o.key === key) || { id: `opt-${key}`, key: key as any, text: '' };
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="font-bold w-6 text-center">{key}.</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOptions = (editingQuestion.options || []).map((o) =>
                              o.key === key ? { ...o, text: e.target.value } : o
                            );
                            setEditingQuestion({ ...editingQuestion, options: newOptions });
                          }}
                          className="flex-1 rounded-lg border border-gray-300 p-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswerKey: key })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                            editingQuestion.correctAnswerKey === key
                              ? 'bg-emerald-700 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {editingQuestion.correctAnswerKey === key ? 'Kunci Benar' : 'Pilih Kunci'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {editingQuestion.type === 'isian' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kunci Jawaban Utama</label>
                  <input
                    type="text"
                    value={editingQuestion.correctAnswerKey || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerKey: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Pembahasan & Analisis</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Simpan Hasil Perbaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
