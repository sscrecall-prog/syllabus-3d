import { RevisionRecord, DifficultyLevel, Exam, Topic, Subject, Chapter } from '../types/syllabus';

// Standard baseline intervals: 1d, 3d, 7d, 21d, 60d
export const REVISION_INTERVALS = [1, 3, 7, 21];

export const DIFFICULTY_INTERVALS: Record<DifficultyLevel, number[]> = {
  Hard: [1, 2, 5, 14],     // High-frequency recall for tricky topics
  Medium: [1, 3, 7, 21],   // Standard Ebbinghaus forgetting curve
  Easy: [2, 5, 14, 30]     // Wider intervals for mastered concepts
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const now = new Date();
      now.setDate(now.getDate() + days);
      return now.toISOString().split('T')[0];
    }
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
  }
}

/**
 * Calculates adaptive spaced repetition intervals based on topic difficulty, accuracy & weak status.
 */
export function calculateAdaptiveIntervals(
  difficulty: DifficultyLevel = 'Medium',
  accuracy: number = 0,
  isWeak: boolean = false
): number[] {
  if (isWeak || (accuracy > 0 && accuracy < 60)) {
    // Weak / Low accuracy concepts need tight consolidation intervals
    return [1, 2, 4, 10];
  }

  const baseIntervals = DIFFICULTY_INTERVALS[difficulty] || DIFFICULTY_INTERVALS.Medium;

  // If high accuracy (>85%), slightly widen intervals
  if (accuracy >= 85) {
    return baseIntervals.map((days, idx) => (idx === 0 ? days : Math.round(days * 1.3)));
  }

  return baseIntervals;
}

/**
 * Generates 4-stage adaptive revision records for a topic.
 */
export function generateAdaptiveRevisionRecords(params: {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  difficulty?: DifficultyLevel;
  accuracy?: number;
  isWeak?: boolean;
  completionDate?: string;
}): RevisionRecord[] {
  const {
    topicId,
    topicName,
    subjectId,
    subjectName,
    chapterId,
    chapterName,
    difficulty = 'Medium',
    accuracy = 0,
    isWeak = false,
    completionDate = getTodayDateString()
  } = params;

  const intervals = calculateAdaptiveIntervals(difficulty, accuracy, isWeak);

  return intervals.map((days, idx) => ({
    id: `rev_${topicId}_stage_${idx + 1}_${Math.random().toString(36).substr(2, 6)}`,
    topicId,
    topicName,
    subjectId,
    subjectName,
    chapterId,
    chapterName,
    stage: idx + 1,
    intervalDays: days,
    scheduledDate: addDays(completionDate, days),
    completedDate: null,
    history: []
  }));
}

/**
 * Backwards-compatible initial revisions generator.
 */
export function calculateInitialRevisions(
  topicId: string,
  topicName: string,
  subjectId: string,
  subjectName: string,
  chapterId: string,
  chapterName: string,
  completionDate: string = getTodayDateString()
): RevisionRecord[] {
  return generateAdaptiveRevisionRecords({
    topicId,
    topicName,
    subjectId,
    subjectName,
    chapterId,
    chapterName,
    completionDate
  });
}

/**
 * Grades a revision card using an enhanced SuperMemo-2 active recall curve.
 */
export function gradeRevision(
  revision: RevisionRecord,
  grade: 'again' | 'hard' | 'good' | 'easy'
): { nextRevisionDate: string; nextStage: number } {
  let intervalDays = 1;
  let nextStage = revision.stage;
  const today = getTodayDateString();

  switch (grade) {
    case 'again':
      // Forgotten: Reset to Stage 1, repeat tomorrow
      intervalDays = 1;
      nextStage = 1;
      break;
    case 'hard':
      // Hard recall: Minor interval increase
      intervalDays = Math.max(1, Math.round(revision.intervalDays * 1.2));
      nextStage = Math.min(4, revision.stage + 1);
      break;
    case 'good':
      // Good recall: Standard x2.0 interval growth
      intervalDays = Math.max(3, Math.round(revision.intervalDays * 2.0));
      nextStage = Math.min(4, revision.stage + 1);
      break;
    case 'easy':
      // Easy recall: x3.0 interval growth
      intervalDays = Math.max(7, Math.round(revision.intervalDays * 3.0));
      nextStage = Math.min(4, revision.stage + 1);
      break;
  }

  return {
    nextRevisionDate: addDays(today, intervalDays),
    nextStage
  };
}

/**
 * Self-healing synchronizer:
 * Analyzes the entire syllabus hierarchy and ensures that:
 * 1. All completed, revision_due, and weak topics have active revision records.
 * 2. All revision record names (topicName, chapterName, subjectName) are 100% matched to current names.
 * 3. Topics that were reset to 'not_started' or 'in_progress' have their uncompleted pending cards cleaned up.
 */
export function syncAllRevisionsWithSyllabus(
  exams: Exam[],
  currentRevisions: RevisionRecord[]
): RevisionRecord[] {
  if (!exams || exams.length === 0) return currentRevisions;

  // Build a lookup map of all current topics across all exams
  const topicLookup = new Map<
    string,
    {
      topic: Topic;
      subject: Subject;
      chapter: Chapter;
    }
  >();

  exams.forEach(exam => {
    exam.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics.forEach(topic => {
          topicLookup.set(topic.id, { topic, subject, chapter });
        });
      });
    });
  });

  const updatedRevisions: RevisionRecord[] = [];
  const processedTopicIds = new Set<string>();

  // 1. Process existing revisions: update names and discard pruned/deleted topics
  currentRevisions.forEach(rev => {
    const match = topicLookup.get(rev.topicId);
    if (!match) {
      // Topic was deleted from syllabus: discard revision card
      return;
    }

    const { topic, subject, chapter } = match;

    // If topic is not_started or in_progress, drop pending cards
    if ((topic.status === 'not_started' || topic.status === 'in_progress') && !rev.completedDate) {
      return;
    }

    // Keep and update metadata (topicName, subjectName, chapterName)
    updatedRevisions.push({
      ...rev,
      topicName: topic.name,
      subjectName: subject.name,
      chapterName: chapter.name
    });

    processedTopicIds.add(rev.topicId);
  });

  // 2. Check for completed / revision_due / weak topics that lack active revisions
  topicLookup.forEach(({ topic, subject, chapter }, topicId) => {
    const needsRevision =
      topic.status === 'completed' ||
      topic.status === 'revision_due' ||
      topic.status === 'weak' ||
      topic.isWeak;

    if (needsRevision && !processedTopicIds.has(topicId)) {
      const today = getTodayDateString();
      const newCards = generateAdaptiveRevisionRecords({
        topicId: topic.id,
        topicName: topic.name,
        subjectId: subject.id,
        subjectName: subject.name,
        chapterId: chapter.id,
        chapterName: chapter.name,
        difficulty: topic.difficulty,
        accuracy: topic.accuracy,
        isWeak: topic.isWeak || topic.status === 'weak',
        completionDate: topic.lastStudied || today
      });

      // If marked revision_due or weak, ensure stage 1 is due today
      if (topic.status === 'revision_due' || topic.status === 'weak' || topic.isWeak) {
        if (newCards[0]) {
          newCards[0].scheduledDate = today;
        }
      }

      updatedRevisions.push(...newCards);
    }
  });

  return updatedRevisions;
}
