import { RevisionRecord } from '../types/syllabus';

export const REVISION_INTERVALS = [1, 3, 7, 21];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateInitialRevisions(
  topicId: string,
  topicName: string,
  subjectId: string,
  subjectName: string,
  chapterId: string,
  chapterName: string,
  completionDate: string = getTodayDateString()
): RevisionRecord[] {
  return REVISION_INTERVALS.map((days, idx) => ({
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
    status: 'pending',
    history: []
  }));
}

export function gradeRevision(
  revision: RevisionRecord,
  grade: 'again' | 'hard' | 'good' | 'easy'
): { nextRevisionDate: string; nextStage: number } {
  let intervalDays = 1;
  let nextStage = revision.stage;
  const today = getTodayDateString();

  switch (grade) {
    case 'again':
      intervalDays = 1;
      nextStage = 1;
      break;
    case 'hard':
      intervalDays = Math.max(1, Math.round(revision.intervalDays * 1.2));
      nextStage = Math.min(4, revision.stage + 1);
      break;
    case 'good':
      intervalDays = Math.max(3, Math.round(revision.intervalDays * 2.0));
      nextStage = Math.min(4, revision.stage + 1);
      break;
    case 'easy':
      intervalDays = Math.max(7, Math.round(revision.intervalDays * 3.0));
      nextStage = Math.min(4, revision.stage + 1);
      break;
  }

  return {
    nextRevisionDate: addDays(today, intervalDays),
    nextStage
  };
}
