import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ArrowRight,
  Save,
  HelpCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { StudentExamSession, QuestionItem } from '../../types';

interface GradingViewProps {
  onNavigate: (view: string) => void;
}

export const GradingView: React.FC<GradingViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const students = madrasahStore.getStudents();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const examSessions = madrasahStore
    .getExamSessions()
    .filter((s) => s.assessmentId === selectedAssessmentId);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    examSessions[0]?.id || ''
  );

  const activeSession = examSessions.find((s) => s.id === selectedSessionId) || examSessions[0];
  const activeStudent = students.find((s) => s.id === activeSession?.studentId);

  // AI Assist State
  const [isAiEvaluating, setIsAiEvaluating] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<
    Record<string, { suggestedScore: number; feedback: string }>
  >({});

  const handleScoreChange = (qId: string, earnedScore: number, teacherNotes?: string) => {
    if (!activeSession) return;
    const currentAns = activeSession.answers[qId] || {
      questionId: qId,
      studentAnswer: '',
      isFlagged: false,
    };

    const updatedAnswers = {
      ...activeSession.answers,
      [qId]: {
        ...currentAns,
        scoreAwarded: earnedScore,
        teacherNotes: teacherNotes !== undefined ? teacherNotes : currentAns.teacherNotes,
      },
    };

    // Recalculate total score scaled to 100
    let totalScoreAwarded = 0;
    let totalWeight = 0;
    questions.forEach((q) => {
      const maxW = q.weight || 1;
      totalWeight += maxW;
      const ans = updatedAnswers[q.id];
      totalScoreAwarded += ans?.scoreAwarded ?? 0;
    });

    const scaledScore = totalWeight > 0 ? Math.round((totalScoreAwarded / totalWeight) * 100) : 0;

    const updatedSession: StudentExamSession = {
      ...activeSession,
      score: scaledScore,
      isGraded: true,
      answers: updatedAnswers,
    };

    madrasahStore.saveExamSession(updatedSession);
  };

  const handleAiEvaluateEssay = async (q: QuestionItem) => {
    if (!activeSession) return;
    const ans = activeSession.answers[q.id];
    if (!ans || !ans.studentAnswer) {
      alert('Siswa belum mengisikan jawaban pada soal essay ini.');
      return;
    }

    setIsAiEvaluating((prev) => ({ ...prev, [q.id]: true }));

    try {
      const response = await fetch('/api/ai/evaluate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: q.stem,
          rubric: q.essayRubric,
          maxScore: q.weight || 5,
          studentAnswer: ans.studentAnswer,
        }),
      });

      if (!response.ok) throw new Error('Gagal mendapatkan evaluasi AI');
      const data = await response.json();
      if (data.evaluation) {
        setAiSuggestions((prev) => ({
          ...prev,
          [q.id]: data.evaluation,
        }));
        // Auto apply AI recommendation if teacher wishes
        handleScoreChange(q.id, data.evaluation.suggestedScore, data.evaluation.feedback);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengevaluasi essay');
    } finally {
      setIsAiEvaluating((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Modul Koreksi & Penskoran
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Koreksi otomatis pilihan ganda, toleransi kata kunci isian, dan penilaian rubrik essay berbantuan Gemini AI.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('gradebook')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <span>Buku Nilai Digital Resmi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-gray-700">Pilih Asesmen:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => {
              setSelectedAssessmentId(e.target.value);
              const sessions = madrasahStore
                .getExamSessions()
                .filter((s) => s.assessmentId === e.target.value);
              setSelectedSessionId(sessions[0]?.id || '');
            }}
            className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-600">
          Total Lembar Masuk: <strong className="text-gray-900">{examSessions.length} Peserta</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 1 col: Student Session List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
            Daftar Peserta Didik
          </h4>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {examSessions.map((session) => {
              const std = students.find((s) => s.id === session.studentId);
              const isSelected = session.id === (activeSession?.id || selectedSessionId);
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="truncate">
                    <div>{std?.name || 'Siswa'}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-gray-500'}`}>
                      NISN: {std?.nisn}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-black ${
                        isSelected
                          ? 'text-white'
                          : (session.score ?? 0) >= (selectedAssessment?.kktp || 75)
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {session.score !== undefined ? `${session.score}` : '-'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 cols: Detailed Grading Sheet for Active Student */}
        {activeSession && activeStudent ? (
          <div className="lg:col-span-3 space-y-5">
            {/* Student Header Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">{activeStudent.name}</h3>
                <p className="text-xs text-gray-500">
                  NIS: {activeStudent.nis} • NISN: {activeStudent.nisn} • Durasi Ujian: {Math.round(activeSession.durationSecondsUsed / 60)} Menit
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-500 block uppercase">Nilai Akhir Siswa:</span>
                  <span className={`text-2xl font-black ${
                    (activeSession.score ?? 0) >= (selectedAssessment?.kktp || 75)
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}>
                    {activeSession.score ?? 0}
                  </span>
                </div>
                <div className="pl-3 border-l border-gray-200">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    (activeSession.score ?? 0) >= (selectedAssessment?.kktp || 75)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(activeSession.score ?? 0) >= (selectedAssessment?.kktp || 75) ? 'TUNTAS (KKTP)' : 'BELUM TUNTAS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions Grading Cards */}
            <div className="space-y-4">
              {questions.map((q) => {
                const ans = activeSession.answers[q.id];
                const studentAns = ans?.studentAnswer || '(Tidak menjawab)';
                const isCorrect = q.type === 'pilihan_ganda' ? studentAns === q.correctAnswerKey : undefined;

                return (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-900">
                          Soal No. {q.number}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 uppercase">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-gray-500">• Bobot Maks: {q.weight} Poin</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {q.type === 'essay' && (
                          <button
                            disabled={isAiEvaluating[q.id]}
                            onClick={() => handleAiEvaluateEssay(q)}
                            className="text-xs bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 font-bold px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                            <span>{isAiEvaluating[q.id] ? 'Menganalisis...' : 'Rekomendasi Skor AI'}</span>
                          </button>
                        )}
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-semibold text-gray-600">Skor:</span>
                          <input
                            type="number"
                            min={0}
                            max={q.weight}
                            value={ans?.scoreAwarded ?? 0}
                            onChange={(e) => handleScoreChange(q.id, Number(e.target.value))}
                            className="w-14 text-xs font-bold text-center border border-gray-300 rounded p-1 bg-white"
                          />
                          <span className="text-xs text-gray-500">/ {q.weight}</span>
                        </div>
                      </div>
                    </div>

                    {q.stimulus && (
                      <div className="p-2.5 bg-blue-50/50 rounded border border-blue-100 text-xs text-blue-900 italic">
                        {q.stimulus}
                      </div>
                    )}

                    <p className="font-bold text-gray-900 text-xs">{q.stem}</p>

                    {/* Answer Comparison */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-gray-500 font-medium">Jawaban Siswa: </span>
                          <span className="font-bold text-gray-900">{studentAns}</span>
                        </div>
                        {q.type === 'pilihan_ganda' && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? 'Benar (Cocok Kunci)' : 'Salah'}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-600">
                        <span className="text-gray-500 font-medium">Kunci Resmi: </span>
                        <strong className="text-emerald-800">{q.correctAnswerKey}</strong>
                        {q.answerVariations && q.answerVariations.length > 0 && (
                          <span className="text-gray-500 ml-1">
                            (Variasi: {q.answerVariations.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Essay Suggestion Box if triggered */}
                    {aiSuggestions[q.id] && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5 text-purple-900">
                          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                          <span>Rekomendasi Skor Gemini AI: {aiSuggestions[q.id].suggestedScore} / {q.weight}</span>
                        </div>
                        <p className="text-[11px] text-gray-700">{aiSuggestions[q.id].feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white p-12 text-center rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500">Pilih salah satu peserta untuk memulai koreksi.</p>
          </div>
        )}
      </div>
    </div>
  );
};
