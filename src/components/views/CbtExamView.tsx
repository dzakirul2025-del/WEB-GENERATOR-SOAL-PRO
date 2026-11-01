import React, { useState, useEffect } from 'react';
import {
  MonitorPlay,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Send,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { QuestionItem, StudentExamSession, Assessment } from '../../types';
import { MADRASAH_INFO } from '../../lib/constants';

interface CbtExamViewProps {
  onNavigate: (view: string) => void;
}

export const CbtExamView: React.FC<CbtExamViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const students = madrasahStore.getStudents();
  const currentUser = madrasahStore.getCurrentUser();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-6c-01'
  );
  const [enteredToken, setEnteredToken] = useState<string>(
    assessments[0]?.token || 'MTK6CPAS'
  );

  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const questions = madrasahStore.getQuestionsByAssessmentId(selectedAssessmentId);
  const activeStudent = students.find((s) => s.id === selectedStudentId);

  // CBT Running State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, { studentAnswer: string; isFlagged: boolean }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60 * 60); // 60 mins
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // Tab switch listener (Proportional monitoring as required by Bagian 16)
  useEffect(() => {
    if (!isExamStarted || isExamSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExamStarted, isExamSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || isExamSubmitted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // Auto submit on expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, isExamSubmitted]);

  const handleStartExam = () => {
    if (!selectedAssessment) return;

    // Strict Question Validation Gate (Bagian Penjaminan Mutu Soal MIN 1 Paser)
    const canStart = madrasahStore.canStartCbt(selectedAssessmentId);
    if (!canStart.allowed) {
      alert(`⚠️ AKSES CBT DIKUNCI:\n\n${canStart.reason}\n\nSeluruh butir soal wajib melalui tahap telaah dan verifikasi pada menu "Validasi Soal" sebelum dapat dikerjakan oleh siswa.`);
      return;
    }

    if (enteredToken.trim().toUpperCase() !== selectedAssessment.token.toUpperCase()) {
      alert(`Token ujian tidak valid. Token resmi asesmen ini adalah: ${selectedAssessment.token}`);
      return;
    }

    // Initialize or restore session
    const existingSession = madrasahStore.getExamSession(selectedAssessmentId, selectedStudentId);
    if (existingSession && existingSession.status === 'submitted') {
      alert('Siswa ini telah menyelesaikan asesmen ini sebelumnya.');
      setIsExamSubmitted(true);
      return;
    }

    const initialAnswers: Record<string, { studentAnswer: string; isFlagged: boolean }> = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = { studentAnswer: '', isFlagged: false };
    });
    setAnswers(initialAnswers);
    setRemainingSeconds((selectedAssessment.durationMinutes || 60) * 60);
    setIsExamStarted(true);
    setIsExamSubmitted(false);
  };

  const handleSelectAnswer = (qId: string, val: string) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qId]: {
          ...prev[qId],
          studentAnswer: val,
        },
      };
      // Server autosave (Bagian 16)
      saveSessionToServer(updated, false);
      return updated;
    });
  };

  const handleToggleFlag = (qId: string) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qId]: {
          ...prev[qId],
          isFlagged: !prev[qId]?.isFlagged,
        },
      };
      saveSessionToServer(updated, false);
      return updated;
    });
  };

  const saveSessionToServer = (
    currentAnswers: Record<string, { studentAnswer: string; isFlagged: boolean }>,
    isFinal: boolean
  ) => {
    const sessionObj: StudentExamSession = {
      id: `ses-${selectedAssessmentId}-${selectedStudentId}`,
      assessmentId: selectedAssessmentId,
      studentId: selectedStudentId,
      tokenEntered: enteredToken,
      startTime: new Date().toISOString(),
      finishTime: isFinal ? new Date().toISOString() : undefined,
      durationSecondsUsed: (selectedAssessment?.durationMinutes || 60) * 60 - remainingSeconds,
      status: isFinal ? 'submitted' : 'in_progress',
      tabSwitchCount,
      lastActiveAt: new Date().toISOString(),
      isGraded: false,
      answers: {},
    };

    // Calculate preliminary score for objective questions (PG)
    let autoScore = 0;
    let totalWeight = 0;

    questions.forEach((q) => {
      const ans = currentAnswers[q.id];
      const isCorrect = q.type === 'pilihan_ganda' && ans?.studentAnswer === q.correctAnswerKey;
      const scoreAwarded = isCorrect ? q.weight : 0;
      totalWeight += q.weight || 1;
      autoScore += scoreAwarded;

      sessionObj.answers[q.id] = {
        questionId: q.id,
        studentAnswer: ans?.studentAnswer || '',
        isFlagged: ans?.isFlagged || false,
        isCorrect: q.type === 'pilihan_ganda' ? isCorrect : undefined,
        scoreAwarded: q.type === 'pilihan_ganda' ? scoreAwarded : undefined,
      };
    });

    if (isFinal) {
      // Scale score 0-100
      sessionObj.score = totalWeight > 0 ? Math.round((autoScore / totalWeight) * 100) : 0;
      sessionObj.isGraded = questions.every((q) => q.type === 'pilihan_ganda');
    }

    madrasahStore.saveExamSession(sessionObj);
  };

  const handleSubmitExam = (isTimeout: boolean = false) => {
    setShowConfirmSubmit(false);
    setIsExamSubmitted(true);
    saveSessionToServer(answers, true);
    if (isTimeout) {
      alert('Waktu ujian telah berakhir! Jawaban Anda telah otomatis dikumpulkan ke server.');
    }
  };

  const currentQ = questions[currentIndex];

  // Helper format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* If Not Started: Gate & Token Verification Screen */}
      {!isExamStarted && !isExamSubmitted && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-md text-center space-y-6 mt-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-sm">
            <MonitorPlay className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Pelaksanaan Asesmen CBT Siswa
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {MADRASAH_INFO.name} • Portal Ujian Berbasis Komputer
            </p>
          </div>

          <div className="space-y-3 text-left text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pilih Asesmen CBT</label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 font-medium bg-white"
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Identitas Peserta Didik (Simulasi)</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 font-medium bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (NISN: {s.nisn})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Masukkan Token Ujian (Default: <strong className="text-emerald-700">{selectedAssessment?.token}</strong>)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={enteredToken}
                  onChange={(e) => setEnteredToken(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 font-mono font-bold uppercase tracking-wider text-sm"
                  placeholder="Contoh: PASER4A"
                />
              </div>
            </div>
          </div>

          {/* Validation Quality Gate Indicator */}
          {(() => {
            const canStart = madrasahStore.canStartCbt(selectedAssessmentId);
            return canStart.allowed ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 text-left flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Soal Telah Tervalidasi</span>
                    <p className="text-[11px] text-emerald-700">Seluruh butir soal telah lolos telaah materi, konstruksi, dan bahasa.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('validation')}
                  className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  Lihat Berita Acara
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 text-left space-y-2">
                <div className="flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Validasi Soal Diperlukan</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">{canStart.reason}</p>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-amber-200">
                  <span className="text-[10px] text-amber-700 font-semibold">Wajib ditelaah sebelum ujian dimulai</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('validation')}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center space-x-1"
                  >
                    <span>Buka Validasi Soal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 text-left space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Ketentuan Pelaksanaan Ujian:</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Durasi pengerjaan adalah <strong>{selectedAssessment?.durationMinutes || 60} menit</strong>. Jawaban disimpan secara real-time ke server. Pastikan tidak menutup peramban sebelum menekan tombol Selesai Ujian.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            className="w-full bg-[#006837] hover:bg-[#00522c] text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md transition-colors"
          >
            <span>Mulai Ujian Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* If Exam is Active */}
      {isExamStarted && !isExamSubmitted && currentQ && (
        <div className="space-y-4">
          {/* Top exam status bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase">{selectedAssessment?.title}</div>
              <div className="font-bold text-gray-900 text-sm">
                Peserta: {activeStudent?.name} ({activeStudent?.nisn})
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Tab switch warning if > 0 */}
              {tabSwitchCount > 0 && (
                <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Peringatan keluar tab: {tabSwitchCount}x</span>
                </div>
              )}

              {/* Countdown Timer */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                remainingSeconds < 300 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(remainingSeconds)}</span>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Selesai & Kumpulkan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left 3 cols: Question stem & choices */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="font-black text-sm px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900">
                  Soal No. {currentQ.number} dari {questions.length}
                </span>

                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
                    answers[currentQ.id]?.isFlagged
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${answers[currentQ.id]?.isFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{answers[currentQ.id]?.isFlagged ? 'Ragu-Ragu (Ditandai)' : 'Tandai Ragu-Ragu'}</span>
                </button>
              </div>

              {/* Stimulus */}
              {currentQ.stimulus && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs italic text-blue-950 leading-relaxed">
                  <strong>Stimulus Soal:</strong> {currentQ.stimulus}
                </div>
              )}

              {/* Stem */}
              <div className="font-bold text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                {currentQ.stem}
              </div>

              {/* Answer Choices for PG */}
              {currentQ.type === 'pilihan_ganda' && currentQ.options && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id]?.studentAnswer === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectAnswer(currentQ.id, opt.key)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-center space-x-3 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Answer Input for Isian */}
              {currentQ.type === 'isian' && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Tulis Jawaban Singkat Anda:</label>
                  <input
                    type="text"
                    value={answers[currentQ.id]?.studentAnswer || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="Ketik jawaban di sini..."
                  />
                  <p className="text-[11px] text-gray-500">Perhatikan ejaan huruf dan kata dengan teliti.</p>
                </div>
              )}

              {/* Answer Input for Essay */}
              {currentQ.type === 'essay' && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Uraikan Jawaban Lengkap Anda:</label>
                  <textarea
                    rows={6}
                    value={answers[currentQ.id]?.studentAnswer || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                    placeholder="Tuliskan uraian dan penjelasan Anda secara runtut..."
                  />
                  <p className="text-[11px] text-gray-500">Jawaban akan dinilai berdasarkan rubrik penilaian essay.</p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Soal Sebelumnya</span>
                </button>

                <div className="text-xs text-gray-500">
                  {answers[currentQ.id]?.studentAnswer ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Jawaban Tersimpan</span>
                    </span>
                  ) : (
                    <span>Belum dijawab</span>
                  )}
                </div>

                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-40 flex items-center space-x-1.5"
                >
                  <span>Soal Berikutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right 1 col: Question Number Palette Grid */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Navigasi Nomor Soal
              </h4>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const hasAnswer = Boolean(ans?.studentAnswer && ans.studentAnswer.trim().length > 0);
                  const isFlagged = ans?.isFlagged;
                  const isCurrent = idx === currentIndex;

                  let btnColor = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                  if (hasAnswer) btnColor = 'bg-emerald-600 text-white font-bold';
                  if (isFlagged) btnColor = 'bg-amber-500 text-white font-bold';
                  if (isCurrent) btnColor += ' ring-2 ring-emerald-950 font-black';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg text-xs flex items-center justify-center transition-all ${btnColor}`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>Sudah dijawab</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>Ragu-ragu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded bg-gray-200"></span>
                  <span>Belum dijawab</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Konfirmasi Pengumpulan Ujian</h3>
            <p className="text-xs text-gray-600">
              Apakah Anda yakin ingin menyelesaikan dan mengumpulkan hasil ujian ini? Jawaban Anda akan langsung dikirim ke sistem penilaian.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Kembali ke Soal
              </button>
              <button
                onClick={() => handleSubmitExam(false)}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs"
              >
                Ya, Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Completion Card */}
      {isExamSubmitted && (
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-md text-center space-y-5 mt-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Ujian Telah Berhasil Disubmit!</h2>
            <p className="text-xs text-gray-500 mt-1">
              Jawaban peserta didik <strong>{activeStudent?.name}</strong> telah tersimpan aman di server CBT MIN 1 Paser.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Asesmen:</span>
              <strong className="text-gray-900">{selectedAssessment?.title}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status Pemeriksaan:</span>
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                Dalam Proses Koreksi Guru
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsExamStarted(false);
                setIsExamSubmitted(false);
              }}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Uji Siswa Lainnya
            </button>
            <button
              onClick={() => onNavigate('grading')}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Buka Modul Koreksi Guru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
