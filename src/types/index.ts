export type UserRole =
  | 'super_admin'
  | 'kepala_madrasah'
  | 'guru'
  | 'wali_kelas'
  | 'operator'
  | 'peserta_didik';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nip?: string;
  nisn?: string;
  role: UserRole;
  avatar?: string;
  assignedClassId?: string; // For Wali Kelas or Student
  subjectIds?: string[]; // For Guru
  title?: string;
}

export type AssessmentType =
  | 'formatif'
  | 'sumatif_bab'
  | 'sumatif_semester'
  | 'sumatif_tahun'
  | 'ujian_madrasah';

export type AssessmentStatus =
  | 'draft'
  | 'dalam_validasi'
  | 'disetujui'
  | 'published'
  | 'sedang_berlangsung'
  | 'selesai'
  | 'dalam_koreksi'
  | 'dinilai'
  | 'disahkan'
  | 'diarsipkan';

export type QuestionType = 'pilihan_ganda' | 'isian' | 'essay';

export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type CognitiveCategory = 'LOTS' | 'MOTS' | 'HOTS';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export type LearningPhase = 'Fase A' | 'Fase B' | 'Fase C';

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024/2025"
  isActive: boolean;
}

export interface Semester {
  id: string;
  academicYearId: string;
  name: 'Ganjil' | 'Genap';
  isActive: boolean;
}

export interface MadrasahClass {
  id: string;
  name: string; // e.g. "Kelas 4A"
  grade: number; // 1 to 6
  phase: LearningPhase;
  academicYearId: string;
  homeroomTeacherId: string; // Wali Kelas
}

export interface Subject {
  id: string;
  code: string; // e.g. "AA-01"
  name: string; // e.g. "Akidah Akhlak"
  category: 'PAI' | 'Umum' | 'Muatan Lokal';
  defaultKktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran (e.g. 75)
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  isActive: boolean;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
}

// Curriculum Merdeka Madrasah
export interface CurriculumOutcome {
  id: string;
  phase: LearningPhase;
  subjectId: string;
  element: string; // Elemen Kurikulum (e.g. "Akidah", "Fikih Ibadah", "Bilangan")
  code: string; // e.g. "CP-AA-B1"
  description: string;
}

export interface LearningObjective {
  id: string;
  outcomeId: string;
  code: string; // e.g. "TP-AA-01"
  description: string;
  phase: LearningPhase;
  grade: number;
  chapter: string; // Bab
  topic: string; // Materi
  indicators: string[]; // Indikator asesmen
}

export interface QuestionOption {
  id: string;
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  imageUrl?: string;
}

export interface RubricLevel {
  score: number;
  label: string; // e.g. "Sangat Baik (Skor 4)", "Baik (Skor 3)", etc.
  description: string;
}

export interface EssayRubric {
  id: string;
  aspect: string; // Aspek yang dinilai
  criteria: string;
  maxScore: number;
  levels: RubricLevel[];
}

export type ValidationStatus = 'draft' | 'needs_revision' | 'validated';

export interface QuestionValidationCriteria {
  materi: boolean;       // Kesesuaian dengan indikator TP & kebenaran substansi konsep
  konstruksi: boolean;   // Pokok soal jelas, opsi homogen & tidak memberi petunjuk kunci
  bahasa: boolean;       // Bahasa Indonesia baku, komunikatif & ramah anak MI
  kunci: boolean;        // Kunci jawaban tunggal/pasti & rubrik essay lengkap
  duplikasi: boolean;    // Lolos uji keunikan & bebas duplikasi/plagiasi
}

export interface QuestionValidationDetails {
  status: ValidationStatus;
  criteria: QuestionValidationCriteria;
  validatorName: string;
  validatedAt: string;
  notes?: string;
}

export interface QuestionItem {
  id: string;
  assessmentId?: string;
  bankId?: string;
  number: number;
  type: QuestionType;
  stem: string; // Teks soal
  stimulus?: string; // Teks / stimulus bacaan / studi kasus
  stimulusImageUrl?: string;
  options?: QuestionOption[]; // Pilihan Ganda
  correctAnswerKey?: string; // 'A' | 'B' | 'C' | 'D' for PG, or primary answer string for Isian
  answerVariations?: string[]; // Toleransi variasi jawaban untuk Isian
  answerToleranceCaseSensitive?: boolean;
  scoringGuide?: string; // Pedoman penskoran
  essayRubric?: EssayRubric; // Rubrik untuk essay
  explanation: string; // Pembahasan
  learningObjectiveId?: string;
  cpCode?: string;
  tpCode?: string;
  topic?: string;
  indicator: string;
  cognitiveLevel: CognitiveLevel;
  difficulty: DifficultyLevel;
  weight: number; // Bobot soal (e.g. PG: 1-2, Isian: 3, Essay: 5)
  isApproved: boolean;
  validationStatus?: ValidationStatus;
  validationDetails?: QuestionValidationDetails;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  academicYearId: string;
  semesterId: string;
  classId: string;
  subjectId: string;
  authorId: string; // Teacher ID
  executionDate: string;
  durationMinutes: number; // CBT duration
  token: string; // CBT access token
  kktp: number; // Passing threshold (default e.g. 75)
  status: AssessmentStatus;
  objectivesCovered: string[]; // List of TP IDs
  questionsCount: {
    pg: number;
    isian: number;
    essay: number;
    total: number;
  };
  totalWeight: number;
  instructions: string;
  isRandomizedQuestions: boolean;
  isRandomizedOptions: boolean;
  isValidated?: boolean;
  validationSummary?: {
    total: number;
    validated: number;
    needsRevision: number;
    pending: number;
  };
  endorsedBy?: string; // Ismail, S.Ag. or Guru
  endorsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationConfig {
  assessmentType: AssessmentType;
  academicYearId: string;
  semesterId: string;
  classId: string;
  phase: LearningPhase;
  subjectId: string;
  chapter: string;
  topic: string;
  objectiveIds: string[];
  indicators: string;
  sourceText?: string;
  sourceDocumentName?: string;
  typesSelected: {
    pg: boolean;
    isian: boolean;
    essay: boolean;
  };
  counts: {
    pg: number;
    isian: number;
    essay: number;
  };
  cognitiveDist: {
    lots: number; // % (C1-C2)
    mots: number; // % (C3)
    hots: number; // % (C4-C6)
  };
  difficultyDist: {
    mudah: number; // %
    sedang: number; // %
    sulit: number; // %
  };
  characteristics: {
    kontekstual: boolean;
    hots: boolean;
    literasi: boolean;
    numerasi: boolean;
    stimulus: boolean;
    dailyLife: boolean;
  };
  batchSize?: number;
}

export interface GenerationBatch {
  id: string;
  batchIndex: number;
  totalBatches: number;
  questionType: QuestionType;
  targetCount: number;
  generatedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface GenerationJob {
  id: string;
  userId: string;
  assessmentId?: string;
  config: GenerationConfig;
  totalRequested: number;
  totalCompleted: number;
  totalFailed: number;
  status: 'queued' | 'processing' | 'partially_completed' | 'completed' | 'failed' | 'paused' | 'cancelled';
  batches: GenerationBatch[];
  generatedQuestions: QuestionItem[];
  tokenEstimate: {
    promptTokens: number;
    responseTokens: number;
  };
  startedAt: string;
  finishedAt?: string;
}

export interface StudentExamSession {
  id: string;
  assessmentId: string;
  studentId: string;
  tokenEntered: string;
  startTime: string;
  finishTime?: string;
  durationSecondsUsed: number;
  status: 'in_progress' | 'submitted' | 'timed_out' | 'cancelled';
  tabSwitchCount: number;
  lastActiveAt: string;
  score?: number; // Final calculated 0-100
  isGraded: boolean;
  answers: Record<string, {
    questionId: string;
    studentAnswer: string;
    isFlagged: boolean; // Ragu-ragu
    scoreAwarded?: number;
    isCorrect?: boolean;
    teacherNotes?: string;
    aiRecommendation?: {
      suggestedScore: number;
      feedback: string;
    };
  }>;
}

export interface GradebookEntry {
  id: string;
  assessmentId: string;
  studentId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  semesterId: string;
  assessmentType: AssessmentType;
  finalScore: number; // 0-100
  isPassed: boolean; // >= KKTP
  status: 'draft' | 'disahkan';
  endorsedBy: string;
  endorsedAt: string;
  revisions: {
    previousScore: number;
    newScore: number;
    reason: string;
    revisedBy: string;
    revisedAt: string;
  }[];
}

export interface RemedialRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  unmasteredTpCodes: string[];
  initialScore: number;
  remedialScore?: number;
  finalRemedialScore?: number;
  actionTaken: string;
  retestDate?: string;
  status: 'pending' | 'completed';
  notes?: string;
}

export interface EnrichmentRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  masteredTpCodes: string[];
  initialScore: number;
  enrichmentActivity: string;
  completedAt?: string;
  documentationUrl?: string;
  status: 'assigned' | 'completed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface ItemAnalysisResult {
  questionId: string;
  questionNumber: number;
  questionType: QuestionType;
  difficultyIndex: number; // p = B / N
  difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah';
  discriminationIndex: number; // D = (BA - BB) / (0.5 * N)
  discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek / Revisi';
  distractorAnalysis?: {
    optionKey: string;
    count: number;
    percentage: number;
    isEffective: boolean;
  }[];
  kr20Reliability?: number;
  cronbachAlpha?: number;
}
