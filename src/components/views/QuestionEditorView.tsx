import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  Save,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { QuestionItem, QuestionType, CognitiveLevel, DifficultyLevel } from '../../types';

interface QuestionEditorViewProps {
  onNavigate: (view: string) => void;
}

export const QuestionEditorView: React.FC<QuestionEditorViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.indicator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || q.type === typeFilter;
    return matchSearch && matchType;
  });

  // Automated Validation Checks (Bagian 10)
  const runValidation = (q: QuestionItem) => {
    const issues: string[] = [];

    if (!q.stem || q.stem.trim().length === 0) {
      issues.push('Pertanyaan tidak boleh kosong');
    }

    if (q.type === 'pilihan_ganda') {
      if (!q.options || q.options.length < 4) {
        issues.push('Opsi pilihan ganda harus lengkap (A, B, C, D)');
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswerKey || '')) {
        issues.push('Kunci pilihan ganda harus salah satu dari A, B, C, D');
      }
    }

    if (q.type === 'isian') {
      if (!q.correctAnswerKey || q.correctAnswerKey.trim().length === 0) {
        issues.push('Soal isian harus memiliki kunci jawaban utama');
      }
    }

    if (q.type === 'essay') {
      if (!q.essayRubric || !q.essayRubric.criteria) {
        issues.push('Soal essay wajib memiliki rubrik penilaian dan kriteria penskoran');
      }
    }

    if (!q.weight || q.weight <= 0) {
      issues.push('Bobot soal harus bernilai lebih dari 0');
    }

    // Check duplicate
    const dupCheck = madrasahStore.checkDuplicateStem(q.stem, q.id);
    if (dupCheck.isDuplicate) {
      issues.push(`Terdeteksi potensi duplikasi kemiripan teks (${Math.round(dupCheck.similarityScore * 100)}%)`);
    }

    return issues;
  };

  const handleOpenEdit = (q: QuestionItem) => {
    setEditingQuestion({ ...q });
    setIsModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    madrasahStore.saveQuestion(editingQuestion);
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus butir soal ini dari asesmen?')) {
      madrasahStore.deleteQuestion(id);
    }
  };

  const handleToggleApprove = (q: QuestionItem) => {
    madrasahStore.saveQuestion({
      ...q,
      isApproved: !q.isApproved,
    });
  };

  const handleApproveAll = () => {
    questions.forEach((q) => {
      if (!q.isApproved) {
        madrasahStore.saveQuestion({ ...q, isApproved: true });
      }
    });
    if (selectedAssessment) {
      madrasahStore.updateAssessmentStatus(selectedAssessment.id, 'disetujui');
    }
    alert('Seluruh butir soal telah disetujui (Approved)! Status asesmen beralih ke Disetujui.');
  };

  const handleAddNewManual = () => {
    const nextNumber = questions.length + 1;
    const newQ: QuestionItem = {
      id: `q-manual-${Date.now()}`,
      assessmentId: selectedAssessmentId,
      number: nextNumber,
      type: 'pilihan_ganda',
      stem: '',
      options: [
        { id: 'opt-a', key: 'A', text: '' },
        { id: 'opt-b', key: 'B', text: '' },
        { id: 'opt-c', key: 'C', text: '' },
        { id: 'opt-d', key: 'D', text: '' },
      ],
      correctAnswerKey: 'A',
      explanation: '',
      indicator: '',
      cognitiveLevel: 'C2',
      difficulty: 'sedang',
      weight: 2,
      isApproved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingQuestion(newQ);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Editor Butir Soal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Penyesuaian teks soal, perbaikan kunci jawaban, dan sinkronisasi dengan modul Validasi Soal resmi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('validation')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pusat Validasi Soal</span>
          </button>
          <button
            onClick={handleAddNewManual}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Soal Manual</span>
          </button>
          <button
            onClick={handleApproveAll}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Setujui Seluruh Soal</span>
          </button>
        </div>
      </div>

      {/* Selector & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Pilih Asesmen</label>
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

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Filter Bentuk Soal</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              <option value="all">Semua Bentuk ({questions.length})</option>
              <option value="pilihan_ganda">Pilihan Ganda ({questions.filter((q) => q.type === 'pilihan_ganda').length})</option>
              <option value="isian">Isian Singkat ({questions.filter((q) => q.type === 'isian').length})</option>
              <option value="essay">Essay / Uraian ({questions.filter((q) => q.type === 'essay').length})</option>
            </select>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Cari Soal</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci soal..."
              className="w-full text-xs rounded-lg border border-gray-300 pl-8 pr-3 py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 text-sm">Belum Ada Butir Soal Pada Asesmen Ini</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Gunakan AI Assessment Generator untuk membuat soal otomatis atau tambahkan soal manual.
            </p>
            <button
              onClick={() => onNavigate('generator')}
              className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold bg-emerald-700 text-white px-4 py-2 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buka Generator Soal</span>
            </button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const validationIssues = runValidation(q);
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs space-y-3 transition-colors ${
                  validationIssues.length > 0
                    ? 'border-amber-300 bg-amber-50/10'
                    : q.isApproved
                    ? 'border-emerald-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Soal No. {q.number}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      • {q.cognitiveLevel} • {q.difficulty} • Bobot: {q.weight} poin
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleApprove(q)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition-colors ${
                        q.isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${q.isApproved ? 'text-emerald-700' : 'text-gray-400'}`} />
                      <span>{q.isApproved ? 'Disetujui' : 'Draft (Perlu Validasi)'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Edit Butir Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Validation warnings if any */}
                {validationIssues.length > 0 && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Catatan Validasi Mutu Soal ({validationIssues.length} peringatan):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                      {validationIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stimulus */}
                {q.stimulus && (
                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/80 text-blue-950 text-xs italic">
                    <strong className="not-italic">Teks Stimulus:</strong> {q.stimulus}
                  </div>
                )}

                {/* Stem */}
                <div className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{q.stem}</div>

                {/* Options for PG */}
                {q.type === 'pilihan_ganda' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${
                          opt.key === q.correctAnswerKey
                            ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950 ring-1 ring-emerald-300'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="w-5 font-extrabold">{opt.key}.</span>
                        <span>{opt.text}</span>
                        {opt.key === q.correctAnswerKey && (
                          <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Kunci
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Isian key */}
                {q.type === 'isian' && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950">
                    <strong className="text-emerald-900">Kunci Jawaban Benar:</strong> {q.correctAnswerKey}
                    {q.answerVariations && q.answerVariations.length > 0 && (
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        Variasi toleransi yang diterima: {q.answerVariations.join(' • ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Essay Rubric */}
                {q.type === 'essay' && q.essayRubric && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1.5">
                    <div className="font-bold flex items-center justify-between">
                      <span>Rubrik Penilaian: {q.essayRubric.aspect}</span>
                      <span className="text-[11px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold">
                        Skor Maks: {q.essayRubric.maxScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-700">Kriteria: {q.essayRubric.criteria}</div>
                    <div className="space-y-1 mt-2">
                      {q.essayRubric.levels.map((lvl) => (
                        <div key={lvl.score} className="p-1.5 bg-white/70 rounded border border-purple-100 flex items-start space-x-2 text-[11px]">
                          <span className="font-bold text-purple-900 w-14 shrink-0">Skor {lvl.score}:</span>
                          <span className="text-gray-700">{lvl.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <strong className="text-gray-800">Pembahasan & Analisis Jawaban:</strong> {q.explanation}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Question Modal */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                Edit Butir Soal No. {editingQuestion.number}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bentuk Soal</label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="isian">Isian Singkat</option>
                    <option value="essay">Essay / Uraian</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Level Kognitif</label>
                  <select
                    value={editingQuestion.cognitiveLevel}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, cognitiveLevel: e.target.value as CognitiveLevel })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    <option value="C1">C1 - Mengingat</option>
                    <option value="C2">C2 - Memahami</option>
                    <option value="C3">C3 - Mengaplikasikan</option>
                    <option value="C4">C4 - Menganalisis</option>
                    <option value="C5">C5 - Mengevaluasi</option>
                    <option value="C6">C6 - Mencipta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bobot Soal</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuestion.weight}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, weight: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Stimulus Bacaan (Opsional)</label>
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
                  className="w-full rounded-lg border border-gray-300 p-2"
                />
              </div>

              {/* Options editor for PG */}
              {editingQuestion.type === 'pilihan_ganda' && (
                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700">Opsi Pilihan Ganda & Kunci Benar:</label>
                  {['A', 'B', 'C', 'D'].map((key, idx) => {
                    const opt = editingQuestion.options?.find((o) => o.key === key) || { id: `opt-${key}`, key: key as any, text: '' };
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="font-bold w-6">{key}.</span>
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
                          placeholder={`Teks pilihan ${key}...`}
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
                          {editingQuestion.correctAnswerKey === key ? 'Kunci' : 'Pilih Kunci'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Isian key editor */}
              {editingQuestion.type === 'isian' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kunci Jawaban Benar</label>
                  <input
                    type="text"
                    value={editingQuestion.correctAnswerKey || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerKey: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs"
                    placeholder="Contoh: Laa ilaaha illallaah"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Pembahasan & Penjelasan</label>
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
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
