import { QuestionItem, StudentExamSession, ItemAnalysisResult } from '../types';

export interface ClassStatistics {
  count: number;
  maxScore: number;
  minScore: number;
  mean: number;
  median: number;
  stdDev: number;
  passedCount: number;
  failedCount: number;
  masteryPercentage: number;
  scoreBuckets: { range: string; count: number }[];
  reliabilityKR20?: number;
}

export interface TpMasterySummary {
  tpCode: string;
  description: string;
  topic?: string;
  totalQuestions: number;
  avgPercentage: number;
  isMastered: boolean;
  studentsNeedingRemedial: number;
}

export function calculateClassStatistics(
  sessions: StudentExamSession[],
  kktp: number = 75
): ClassStatistics {
  const gradedSessions = sessions.filter((s) => s.isGraded && s.score !== undefined);
  if (gradedSessions.length === 0) {
    return {
      count: 0,
      maxScore: 0,
      minScore: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      passedCount: 0,
      failedCount: 0,
      masteryPercentage: 0,
      scoreBuckets: [],
    };
  }

  const scores = gradedSessions.map((s) => s.score ?? 0).sort((a, b) => a - b);
  const count = scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const mean = Math.round((sum / count) * 10) / 10;

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? scores[mid] : Math.round(((scores[mid - 1] + scores[mid]) / 2) * 10) / 10;

  // Standard Deviation
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  const passedCount = scores.filter((s) => s >= kktp).length;
  const failedCount = count - passedCount;
  const masteryPercentage = Math.round((passedCount / count) * 100);

  // Distribution buckets (0-49, 50-69, 70-79, 80-89, 90-100)
  const buckets = [
    { range: '0 - 49 (Sangat Kurang)', count: scores.filter((s) => s < 50).length },
    { range: '50 - 69 (Kurang)', count: scores.filter((s) => s >= 50 && s < 70).length },
    { range: '70 - 79 (Cukup / KKTP)', count: scores.filter((s) => s >= 70 && s < 80).length },
    { range: '80 - 89 (Baik)', count: scores.filter((s) => s >= 80 && s < 90).length },
    { range: '90 - 100 (Sangat Baik)', count: scores.filter((s) => s >= 90).length },
  ];

  return {
    count,
    maxScore,
    minScore,
    mean,
    median,
    stdDev,
    passedCount,
    failedCount,
    masteryPercentage,
    scoreBuckets: buckets,
  };
}

export function calculateItemAnalysis(
  questions: QuestionItem[],
  sessions: StudentExamSession[]
): { items: ItemAnalysisResult[]; kr20: number } {
  const gradedSessions = sessions.filter((s) => s.isGraded);
  const N = gradedSessions.length;

  if (N === 0 || questions.length === 0) {
    return { items: [], kr20: 0 };
  }

  // Sort sessions by total score descending to determine Upper and Lower groups
  const sortedSessions = [...gradedSessions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  // 27% upper and lower group or at least half if small N
  const groupSize = Math.max(1, Math.round(N * 0.27));
  const upperGroup = sortedSessions.slice(0, groupSize);
  const lowerGroup = sortedSessions.slice(N - groupSize);

  let sumPq = 0;

  const items: ItemAnalysisResult[] = questions.map((q) => {
    let correctCount = 0;
    let upperCorrect = 0;
    let lowerCorrect = 0;

    const distractorCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    gradedSessions.forEach((session) => {
      const ans = session.answers[q.id];
      if (ans) {
        if (q.type === 'pilihan_ganda') {
          if (ans.studentAnswer) {
            distractorCounts[ans.studentAnswer] = (distractorCounts[ans.studentAnswer] || 0) + 1;
          }
          if (ans.isCorrect) correctCount++;
        } else {
          // For isian or essay, consider correct/full if awarded > 60% of weight
          const earned = ans.scoreAwarded ?? 0;
          if (earned >= (q.weight || 1) * 0.6) {
            correctCount++;
          }
        }
      }
    });

    upperGroup.forEach((session) => {
      const ans = session.answers[q.id];
      if (ans && (ans.isCorrect || (ans.scoreAwarded ?? 0) >= (q.weight || 1) * 0.6)) {
        upperCorrect++;
      }
    });

    lowerGroup.forEach((session) => {
      const ans = session.answers[q.id];
      if (ans && (ans.isCorrect || (ans.scoreAwarded ?? 0) >= (q.weight || 1) * 0.6)) {
        lowerCorrect++;
      }
    });

    // Tingkat Kesukaran p = B / N
    const p = Math.round((correctCount / N) * 100) / 100;
    const qVal = 1 - p;
    sumPq += p * qVal;

    let difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah' = 'Sedang';
    if (p >= 0.7) difficultyCategory = 'Mudah';
    else if (p < 0.3) difficultyCategory = 'Sukar';

    // Daya Pembeda D = (BA - BB) / groupSize
    const D = Math.round(((upperCorrect - lowerCorrect) / groupSize) * 100) / 100;
    let discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek / Revisi' = 'Cukup';
    if (D >= 0.4) discriminationCategory = 'Sangat Baik';
    else if (D >= 0.3) discriminationCategory = 'Baik';
    else if (D >= 0.2) discriminationCategory = 'Cukup';
    else discriminationCategory = 'Jelek / Revisi';

    // Distractor analysis for PG
    const distractorAnalysis =
      q.type === 'pilihan_ganda'
        ? ['A', 'B', 'C', 'D'].map((key) => {
            const count = distractorCounts[key] || 0;
            const percentage = Math.round((count / N) * 100);
            return {
              optionKey: key,
              count,
              percentage,
              isEffective: key === q.correctAnswerKey || percentage >= 5, // Effective if chosen by >= 5%
            };
          })
        : undefined;

    return {
      questionId: q.id,
      questionNumber: q.number,
      questionType: q.type,
      difficultyIndex: p,
      difficultyCategory,
      discriminationIndex: D,
      discriminationCategory,
      distractorAnalysis,
    };
  });

  // Calculate KR-20
  // KR-20 = [k / (k - 1)] * [1 - (sumPq / S^2)]
  const k = questions.length;
  let kr20 = 0;
  if (k > 1) {
    const scores = gradedSessions.map((s) => s.score ?? 0);
    const mean = scores.reduce((a, b) => a + b, 0) / N;
    const sSquared = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / N;
    if (sSquared > 0) {
      // Normalize sumPq scaled by test weight
      const unscaledKr = (k / (k - 1)) * (1 - (sumPq * 100) / sSquared);
      kr20 = Math.max(0, Math.min(0.99, Math.round(unscaledKr * 100) / 100));
    }
  }

  return { items, kr20 };
}

export function calculateTpMastery(
  questions: QuestionItem[],
  sessions: StudentExamSession[],
  kktp: number = 75
): TpMasterySummary[] {
  const map: Record<string, { totalEarned: number; totalPossible: number; questions: Set<string>; desc: string }> = {};

  questions.forEach((q) => {
    const code = q.tpCode || 'TP-Umum';
    if (!map[code]) {
      map[code] = {
        totalEarned: 0,
        totalPossible: 0,
        questions: new Set(),
        desc: q.topic || q.indicator || code,
      };
    }
    map[code].questions.add(q.id);
  });

  const gradedSessions = sessions.filter((s) => s.isGraded);
  if (gradedSessions.length === 0) return [];

  gradedSessions.forEach((s) => {
    questions.forEach((q) => {
      const code = q.tpCode || 'TP-Umum';
      const ans = s.answers[q.id];
      const max = q.weight || 1;
      map[code].totalPossible += max;
      if (ans) {
        map[code].totalEarned += ans.scoreAwarded ?? (ans.isCorrect ? max : 0);
      }
    });
  });

  return Object.entries(map).map(([tpCode, data]) => {
    const percentage = data.totalPossible > 0 ? Math.round((data.totalEarned / data.totalPossible) * 100) : 0;
    const isMastered = percentage >= kktp;

    // Count students scoring below 70% in this TP
    let remedialCount = 0;
    gradedSessions.forEach((s) => {
      let earned = 0;
      let possible = 0;
      data.questions.forEach((qid) => {
        const q = questions.find((item) => item.id === qid);
        const w = q?.weight || 1;
        possible += w;
        const a = s.answers[qid];
        if (a) earned += a.scoreAwarded ?? (a.isCorrect ? w : 0);
      });
      if (possible > 0 && (earned / possible) * 100 < kktp) {
        remedialCount++;
      }
    });

    return {
      tpCode,
      description: data.desc,
      totalQuestions: data.questions.size,
      avgPercentage: percentage,
      isMastered,
      studentsNeedingRemedial: remedialCount,
    };
  });
}
