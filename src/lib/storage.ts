import {
  AcademicYear,
  Semester,
  MadrasahClass,
  Subject,
  Student,
  CurriculumOutcome,
  LearningObjective,
  Assessment,
  QuestionItem,
  StudentExamSession,
  GradebookEntry,
  RemedialRecord,
  AuditLog,
  UserProfile,
  ValidationStatus,
  QuestionValidationCriteria,
} from '../types';
import {
  INITIAL_ACADEMIC_YEARS,
  INITIAL_SEMESTERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_CURRICULUM_OUTCOMES,
  INITIAL_OBJECTIVES,
  INITIAL_ASSESSMENTS,
  INITIAL_QUESTIONS,
  INITIAL_EXAM_SESSIONS,
  INITIAL_GRADEBOOK_ENTRIES,
  INITIAL_REMEDIALS,
} from './seed-data';
import { STANDARD_SUBJECTS, MOCK_USERS } from './constants';

const STORAGE_PREFIX = 'map_v6_';
const STORAGE_KEYS = {
  ACADEMIC_YEARS: `${STORAGE_PREFIX}academic_years`,
  SEMESTERS: `${STORAGE_PREFIX}semesters`,
  CLASSES: `${STORAGE_PREFIX}classes`,
  SUBJECTS: `${STORAGE_PREFIX}subjects`,
  STUDENTS: `${STORAGE_PREFIX}students`,
  OUTCOMES: `${STORAGE_PREFIX}outcomes`,
  OBJECTIVES: `${STORAGE_PREFIX}objectives`,
  ASSESSMENTS: `${STORAGE_PREFIX}assessments`,
  QUESTIONS: `${STORAGE_PREFIX}questions`,
  EXAM_SESSIONS: `${STORAGE_PREFIX}exam_sessions`,
  GRADEBOOK: `${STORAGE_PREFIX}gradebook`,
  REMEDIALS: `${STORAGE_PREFIX}remedials`,
  AUDIT_LOGS: `${STORAGE_PREFIX}audit_logs`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
};

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse storage key ${key}:`, e);
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to set storage key ${key}:`, e);
  }
}

class MadrasahStore {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Current User Management ---
  getCurrentUser(): UserProfile {
    return getLocal<UserProfile>(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[2] as UserProfile); // Default Dzakirul Husni (Guru)
  }

  setCurrentUser(user: UserProfile) {
    setLocal(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit('AUTH_SWITCH_ROLE', 'User', user.id, `Beralih peran menjadi ${user.role} (${user.name})`);
    this.notify();
  }

  // --- Master Data ---
  getAcademicYears(): AcademicYear[] {
    const list = getLocal<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
    const hasCurrentYears = list.some((y) => y.name === '2026/2027');
    if (!hasCurrentYears) {
      setLocal(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
      return INITIAL_ACADEMIC_YEARS;
    }
    return list;
  }

  setActiveAcademicYear(yearId: string) {
    const years = this.getAcademicYears().map((y) => ({
      ...y,
      isActive: y.id === yearId,
    }));
    setLocal(STORAGE_KEYS.ACADEMIC_YEARS, years);
    const target = years.find((y) => y.id === yearId);
    this.logAudit('SET_ACTIVE_ACADEMIC_YEAR', 'AcademicYear', yearId, `Mengaktifkan tahun pelajaran: ${target?.name || yearId}`);
    this.notify();
  }

  getSemesters(): Semester[] {
    return getLocal<Semester[]>(STORAGE_KEYS.SEMESTERS, INITIAL_SEMESTERS);
  }

  getClasses(): MadrasahClass[] {
    return getLocal<MadrasahClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  }

  getSubjects(): Subject[] {
    return getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, STANDARD_SUBJECTS);
  }

  getStudents(): Student[] {
    return getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  addStudent(student: Omit<Student, 'id'>): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    students.push(newStudent);
    setLocal(STORAGE_KEYS.STUDENTS, students);
    this.logAudit('INSERT_STUDENT', 'Student', newStudent.id, `Menambahkan siswa: ${newStudent.name}`);
    this.notify();
    return newStudent;
  }

  bulkAddStudents(newStudents: Omit<Student, 'id'>[]): { added: number; duplicates: number } {
    const existing = this.getStudents();
    const existingNisns = new Set(existing.map((s) => s.nisn));
    let added = 0;
    let duplicates = 0;

    for (const s of newStudents) {
      if (existingNisns.has(s.nisn)) {
        duplicates++;
      } else {
        existing.push({
          ...s,
          id: `std-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        });
        existingNisns.add(s.nisn);
        added++;
      }
    }

    setLocal(STORAGE_KEYS.STUDENTS, existing);
    this.logAudit('BULK_IMPORT_STUDENTS', 'Student', 'bulk', `Impor ${added} siswa baru (Duplikat: ${duplicates})`);
    this.notify();
    return { added, duplicates };
  }

  updateStudent(updatedStudent: Student): Student {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === updatedStudent.id);
    if (idx >= 0) {
      students[idx] = { ...updatedStudent };
      setLocal(STORAGE_KEYS.STUDENTS, students);
      this.logAudit('UPDATE_STUDENT', 'Student', updatedStudent.id, `Memperbarui data siswa: ${updatedStudent.name}`);
      this.notify();
    }
    return updatedStudent;
  }

  deleteStudent(id: string): boolean {
    const students = this.getStudents();
    const target = students.find((s) => s.id === id);
    const filtered = students.filter((s) => s.id !== id);
    if (filtered.length !== students.length) {
      setLocal(STORAGE_KEYS.STUDENTS, filtered);
      this.logAudit('DELETE_STUDENT', 'Student', id, `Menghapus siswa: ${target?.name || id}`);
      this.notify();
      return true;
    }
    return false;
  }

  // --- Curriculum ---
  getOutcomes(): CurriculumOutcome[] {
    return getLocal<CurriculumOutcome[]>(STORAGE_KEYS.OUTCOMES, INITIAL_CURRICULUM_OUTCOMES);
  }

  getObjectives(): LearningObjective[] {
    return getLocal<LearningObjective[]>(STORAGE_KEYS.OBJECTIVES, INITIAL_OBJECTIVES);
  }

  addObjective(obj: Omit<LearningObjective, 'id'>): LearningObjective {
    const list = this.getObjectives();
    const newObj: LearningObjective = {
      ...obj,
      id: `tp-${Date.now()}`,
    };
    list.push(newObj);
    setLocal(STORAGE_KEYS.OBJECTIVES, list);
    this.logAudit('INSERT_TP', 'LearningObjective', newObj.id, `Menambahkan TP: ${newObj.code} - ${newObj.description}`);
    this.notify();
    return newObj;
  }

  // --- Assessments ---
  getAssessments(): Assessment[] {
    return getLocal<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
  }

  getAssessmentById(id: string): Assessment | undefined {
    return this.getAssessments().find((a) => a.id === id);
  }

  saveAssessment(assessment: Assessment) {
    const list = this.getAssessments();
    const idx = list.findIndex((a) => a.id === assessment.id);
    if (idx >= 0) {
      list[idx] = { ...assessment, updatedAt: new Date().toISOString() };
      this.logAudit('UPDATE_ASSESSMENT', 'Assessment', assessment.id, `Memperbarui asesmen: ${assessment.title}`);
    } else {
      list.unshift(assessment);
      this.logAudit('CREATE_ASSESSMENT', 'Assessment', assessment.id, `Membuat asesmen baru: ${assessment.title}`);
    }
    setLocal(STORAGE_KEYS.ASSESSMENTS, list);
    this.notify();
  }

  updateAssessmentStatus(id: string, newStatus: Assessment['status']) {
    const list = this.getAssessments();
    const target = list.find((a) => a.id === id);
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      setLocal(STORAGE_KEYS.ASSESSMENTS, list);
      this.logAudit('STATUS_CHANGE_ASSESSMENT', 'Assessment', id, `Mengubah status menjadi: ${newStatus}`);
      this.notify();
    }
  }

  deleteAssessment(id: string) {
    let list = this.getAssessments();
    const target = list.find((a) => a.id === id);
    list = list.filter((a) => a.id !== id);
    setLocal(STORAGE_KEYS.ASSESSMENTS, list);
    this.logAudit('DELETE_ASSESSMENT', 'Assessment', id, `Menghapus asesmen: ${target?.title}`);
    this.notify();
  }

  // --- Questions ---
  getQuestions(): QuestionItem[] {
    return getLocal<QuestionItem[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  }

  getQuestionsByAssessmentId(assessmentId: string): QuestionItem[] {
    return this.getQuestions()
      .filter((q) => q.assessmentId === assessmentId)
      .sort((a, b) => a.number - b.number);
  }

  saveQuestion(question: QuestionItem) {
    const list = this.getQuestions();
    const idx = list.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      list[idx] = { ...question, updatedAt: new Date().toISOString() };
    } else {
      list.push(question);
    }
    setLocal(STORAGE_KEYS.QUESTIONS, list);
    this.syncAssessmentQuestionCounts(question.assessmentId);
    this.notify();
  }

  saveBatchQuestions(newQuestions: QuestionItem[], assessmentId?: string) {
    const list = this.getQuestions();
    const existingIds = new Set(list.map((q) => q.id));

    newQuestions.forEach((q) => {
      if (existingIds.has(q.id)) {
        const i = list.findIndex((item) => item.id === q.id);
        list[i] = q;
      } else {
        list.push(q);
      }
    });

    setLocal(STORAGE_KEYS.QUESTIONS, list);
    if (assessmentId) {
      this.syncAssessmentQuestionCounts(assessmentId);
    }
    this.logAudit('BATCH_SAVE_QUESTIONS', 'QuestionItem', assessmentId || 'batch', `Menyimpan ${newQuestions.length} butir soal`);
    this.notify();
  }

  deleteQuestion(id: string) {
    const list = this.getQuestions();
    const target = list.find((q) => q.id === id);
    const updated = list.filter((q) => q.id !== id);
    setLocal(STORAGE_KEYS.QUESTIONS, updated);
    if (target?.assessmentId) {
      this.syncAssessmentQuestionCounts(target.assessmentId);
    }
    this.notify();
  }

  private syncAssessmentQuestionCounts(assessmentId?: string) {
    if (!assessmentId) return;
    const assessments = this.getAssessments();
    const asm = assessments.find((a) => a.id === assessmentId);
    if (!asm) return;

    const questions = this.getQuestionsByAssessmentId(assessmentId);
    const pg = questions.filter((q) => q.type === 'pilihan_ganda').length;
    const isian = questions.filter((q) => q.type === 'isian').length;
    const essay = questions.filter((q) => q.type === 'essay').length;
    const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 1), 0);

    const validatedCount = questions.filter(
      (q) => q.validationStatus === 'validated' || (q.isApproved && q.validationStatus !== 'needs_revision')
    ).length;
    const needsRevisionCount = questions.filter((q) => q.validationStatus === 'needs_revision').length;
    const pendingCount = questions.length - validatedCount - needsRevisionCount;

    asm.questionsCount = {
      pg,
      isian,
      essay,
      total: questions.length,
    };
    asm.totalWeight = totalWeight;
    asm.isValidated = questions.length > 0 && validatedCount === questions.length;
    asm.validationSummary = {
      total: questions.length,
      validated: validatedCount,
      needsRevision: needsRevisionCount,
      pending: pendingCount,
    };

    // If assessment is not fully validated, cannot remain in published or disahkan
    if (!asm.isValidated && (asm.status === 'published' || asm.status === 'disetujui')) {
      asm.status = 'dalam_validasi';
    }

    setLocal(STORAGE_KEYS.ASSESSMENTS, assessments);
  }

  // --- Strict Question Validation Engine ---
  validateQuestion(
    questionId: string,
    status: ValidationStatus,
    criteria: QuestionValidationCriteria,
    notes?: string
  ) {
    const list = this.getQuestions();
    const target = list.find((q) => q.id === questionId);
    if (!target) return;

    const user = this.getCurrentUser();
    target.validationStatus = status;
    target.isApproved = status === 'validated';
    target.validationDetails = {
      status,
      criteria,
      validatorName: user.name,
      validatedAt: new Date().toISOString(),
      notes,
    };
    target.updatedAt = new Date().toISOString();

    setLocal(STORAGE_KEYS.QUESTIONS, list);
    if (target.assessmentId) {
      this.syncAssessmentQuestionCounts(target.assessmentId);
    }
    this.logAudit(
      'VALIDATE_QUESTION',
      'QuestionItem',
      questionId,
      `Validasi butir soal No. ${target.number}: Status ${status.toUpperCase()} oleh ${user.name}`
    );
    this.notify();
  }

  batchValidateAssessment(assessmentId: string): { validated: number; needsRevision: number } {
    const list = this.getQuestions();
    const assessmentQuestions = list.filter((q) => q.assessmentId === assessmentId);
    const user = this.getCurrentUser();
    let validated = 0;
    let needsRevision = 0;

    assessmentQuestions.forEach((q) => {
      // Automatic rubric and structural checks
      const hasStem = Boolean(q.stem && q.stem.trim().length > 5);
      const isPgValid = q.type !== 'pilihan_ganda' || (Boolean(q.options && q.options.length >= 4) && ['A', 'B', 'C', 'D'].includes(q.correctAnswerKey || ''));
      const isIsianValid = q.type !== 'isian' || Boolean(q.correctAnswerKey && q.correctAnswerKey.trim().length > 0);
      const isEssayValid = q.type !== 'essay' || Boolean(q.essayRubric && q.essayRubric.criteria);
      const dup = this.checkDuplicateStem(q.stem, q.id);

      const criteria: QuestionValidationCriteria = {
        materi: hasStem,
        konstruksi: isPgValid && isIsianValid && isEssayValid,
        bahasa: true,
        kunci: isPgValid && isIsianValid && isEssayValid,
        duplikasi: !dup.isDuplicate,
      };

      const isClean = criteria.materi && criteria.konstruksi && criteria.kunci && criteria.duplikasi;

      if (isClean) {
        q.validationStatus = 'validated';
        q.isApproved = true;
        q.validationDetails = {
          status: 'validated',
          criteria,
          validatorName: user.name,
          validatedAt: new Date().toISOString(),
          notes: 'Divalidasi otomatis sesuai standar telaah butir soal madrasah.',
        };
        validated++;
      } else {
        q.validationStatus = 'needs_revision';
        q.isApproved = false;
        q.validationDetails = {
          status: 'needs_revision',
          criteria,
          validatorName: user.name,
          validatedAt: new Date().toISOString(),
          notes: dup.isDuplicate
            ? 'Terdeteksi potensi duplikasi soal.'
            : 'Struktur opsi/kunci/rubrik belum lengkap.',
        };
        needsRevision++;
      }
      q.updatedAt = new Date().toISOString();
    });

    setLocal(STORAGE_KEYS.QUESTIONS, list);
    this.syncAssessmentQuestionCounts(assessmentId);
    this.notify();
    return { validated, needsRevision };
  }

  isAssessmentValidated(assessmentId: string): {
    isValid: boolean;
    unvalidatedCount: number;
    needsRevisionCount: number;
    total: number;
  } {
    const questions = this.getQuestionsByAssessmentId(assessmentId);
    const total = questions.length;
    if (total === 0) return { isValid: false, unvalidatedCount: 0, needsRevisionCount: 0, total: 0 };

    const validatedCount = questions.filter(
      (q) => q.validationStatus === 'validated' || (q.isApproved && q.validationStatus !== 'needs_revision')
    ).length;
    const needsRevisionCount = questions.filter((q) => q.validationStatus === 'needs_revision').length;
    const unvalidatedCount = total - validatedCount;

    return {
      isValid: unvalidatedCount === 0 && total > 0,
      unvalidatedCount,
      needsRevisionCount,
      total,
    };
  }

  canStartCbt(assessmentId: string): { allowed: boolean; reason?: string; unvalidatedCount: number } {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment) {
      return { allowed: false, reason: 'Asesmen tidak ditemukan di sistem.', unvalidatedCount: 0 };
    }

    const val = this.isAssessmentValidated(assessmentId);
    if (val.total === 0) {
      return { allowed: false, reason: 'Asesmen ini belum memiliki butir soal.', unvalidatedCount: 0 };
    }

    if (!val.isValid) {
      return {
        allowed: false,
        reason: `Asesmen ini belum dapat digunakan karena terdapat ${val.unvalidatedCount} butir soal yang belum lolos tahap Validasi Soal resmi (${val.needsRevisionCount} butir butuh revisi).`,
        unvalidatedCount: val.unvalidatedCount,
      };
    }

    return { allowed: true, unvalidatedCount: 0 };
  }

  // --- Duplicate Detection ---
  checkDuplicateStem(stem: string, excludeId?: string): { isDuplicate: boolean; similarStem?: string; similarityScore: number } {
    const questions = this.getQuestions();
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const target = clean(stem);

    for (const q of questions) {
      if (excludeId && q.id === excludeId) continue;
      const compare = clean(q.stem);
      if (target === compare) {
        return { isDuplicate: true, similarStem: q.stem, similarityScore: 1.0 };
      }
      // Simple word token Jaccard similarity for near duplicates
      const targetTokens = new Set(target.split(/\s+/).filter((t) => t.length > 2));
      const compareTokens = new Set(compare.split(/\s+/).filter((t) => t.length > 2));
      if (targetTokens.size > 0 && compareTokens.size > 0) {
        const intersection = new Set([...targetTokens].filter((x) => compareTokens.has(x)));
        const union = new Set([...targetTokens, ...compareTokens]);
        const score = intersection.size / union.size;
        if (score >= 0.75) {
          return { isDuplicate: true, similarStem: q.stem, similarityScore: Math.round(score * 100) / 100 };
        }
      }
    }
    return { isDuplicate: false, similarityScore: 0 };
  }

  // --- Exam Sessions (CBT) ---
  getExamSessions(): StudentExamSession[] {
    return getLocal<StudentExamSession[]>(STORAGE_KEYS.EXAM_SESSIONS, INITIAL_EXAM_SESSIONS);
  }

  getExamSession(assessmentId: string, studentId: string): StudentExamSession | undefined {
    return this.getExamSessions().find((s) => s.assessmentId === assessmentId && s.studentId === studentId);
  }

  saveExamSession(session: StudentExamSession) {
    const list = this.getExamSessions();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    setLocal(STORAGE_KEYS.EXAM_SESSIONS, list);
    this.notify();
  }

  // --- Official Gradebook (Buku Nilai Digital) ---
  getGradebook(): GradebookEntry[] {
    return getLocal<GradebookEntry[]>(STORAGE_KEYS.GRADEBOOK, INITIAL_GRADEBOOK_ENTRIES);
  }

  // Endorsement Transaction: Synchronizes grades to digital gradebook after validation & signature
  endorseAndSyncAssessmentGrades(assessmentId: string, endorsedBy: string): { syncedCount: number; message: string } {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment) return { syncedCount: 0, message: 'Asesmen tidak ditemukan' };

    const sessions = this.getExamSessions().filter((s) => s.assessmentId === assessmentId && s.status === 'submitted');
    if (sessions.length === 0) {
      return { syncedCount: 0, message: 'Belum ada pengerjaan siswa yang siap disahkan' };
    }

    const gradebook = this.getGradebook();
    const timestamp = new Date().toISOString();
    let synced = 0;

    sessions.forEach((session) => {
      const finalScore = session.score ?? 0;
      const isPassed = finalScore >= (assessment.kktp || 75);

      const existingIndex = gradebook.findIndex(
        (g) => g.assessmentId === assessmentId && g.studentId === session.studentId
      );

      if (existingIndex >= 0) {
        // Record revision history if changed
        const prev = gradebook[existingIndex];
        if (prev.finalScore !== finalScore) {
          prev.revisions.push({
            previousScore: prev.finalScore,
            newScore: finalScore,
            reason: 'Pengesahan ulang hasil koreksi asesmen',
            revisedBy: endorsedBy,
            revisedAt: timestamp,
          });
        }
        prev.finalScore = finalScore;
        prev.isPassed = isPassed;
        prev.status = 'disahkan';
        prev.endorsedBy = endorsedBy;
        prev.endorsedAt = timestamp;
      } else {
        gradebook.push({
          id: `gb-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          assessmentId,
          studentId: session.studentId,
          subjectId: assessment.subjectId,
          classId: assessment.classId,
          academicYearId: assessment.academicYearId,
          semesterId: assessment.semesterId,
          assessmentType: assessment.type,
          finalScore,
          isPassed,
          status: 'disahkan',
          endorsedBy,
          endorsedAt: timestamp,
          revisions: [],
        });
      }
      synced++;

      // Auto create or update Remedial record if failed
      if (!isPassed) {
        this.ensureRemedialRecord(assessment, session.studentId, finalScore);
      }
    });

    setLocal(STORAGE_KEYS.GRADEBOOK, gradebook);

    // Update assessment status
    this.updateAssessmentStatus(assessmentId, 'disahkan');
    assessment.endorsedBy = endorsedBy;
    assessment.endorsedAt = timestamp;
    this.saveAssessment(assessment);

    this.logAudit(
      'ENDORSE_GRADES',
      'Gradebook',
      assessmentId,
      `Pengesahan nilai resmi oleh ${endorsedBy}: ${synced} nilai siswa masuk ke Buku Nilai Digital`
    );

    this.notify();
    return { syncedCount: synced, message: `Berhasil mengesahkan ${synced} nilai ke Buku Nilai Digital!` };
  }

  // --- Remedial & Pengayaan ---
  getRemedials(): RemedialRecord[] {
    return getLocal<RemedialRecord[]>(STORAGE_KEYS.REMEDIALS, INITIAL_REMEDIALS);
  }

  private ensureRemedialRecord(assessment: Assessment, studentId: string, score: number) {
    const list = this.getRemedials();
    const existing = list.find((r) => r.assessmentId === assessment.id && r.studentId === studentId);
    if (!existing) {
      list.push({
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        assessmentId: assessment.id,
        studentId,
        unmasteredTpCodes: assessment.objectivesCovered || [],
        initialScore: score,
        actionTaken: 'Pendampingan materi dan latihan soal indikator belum tuntas',
        status: 'pending',
      });
      setLocal(STORAGE_KEYS.REMEDIALS, list);
    }
  }

  saveRemedialScore(remedialId: string, remedialScore: number, notes?: string) {
    const list = this.getRemedials();
    const rem = list.find((r) => r.id === remedialId);
    if (rem) {
      rem.remedialScore = remedialScore;
      rem.finalRemedialScore = Math.min(remedialScore, 75); // Nilai remedial maksimal setara KKTP
      rem.status = 'completed';
      if (notes) rem.notes = notes;
      setLocal(STORAGE_KEYS.REMEDIALS, list);
      this.logAudit('REMEDIAL_SCORE_UPDATED', 'RemedialRecord', remedialId, `Nilai remedial disimpan: ${rem.finalRemedialScore}`);
      this.notify();
    }
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        userId: 'user-dzakirul',
        userName: 'Dzakirul Husni, S.Pd.',
        userRole: 'guru',
        action: 'SYSTEM_BOOT',
        entityType: 'System',
        entityId: 'min1paser',
        details: 'Inisialisasi sistem Madrasah Assessment Pro MIN 1 Paser',
      },
    ]);
  }

  logAudit(action: string, entityType: string, entityId: string, details: string) {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const entry: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entityType,
      entityId,
      details,
    };
    logs.unshift(entry);
    setLocal(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Keep last 500
  }

  // Reset to authentic factory defaults
  resetToFactoryDefaults() {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.notify();
  }
}

export const madrasahStore = new MadrasahStore();
