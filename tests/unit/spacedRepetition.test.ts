import { describe, it, expect } from 'vitest';
import {
  REVISION_INTERVALS,
  getTodayDateString,
  addDays,
  calculateInitialRevisions,
  gradeRevision,
} from '../../src/utils/spacedRepetition';
import { RevisionRecord } from '../../src/types/syllabus';

describe('spacedRepetition', () => {
  it('should have standard revision intervals: [1, 3, 7, 21]', () => {
    expect(REVISION_INTERVALS).toEqual([1, 3, 7, 21]);
  });

  it('should compute valid today date string (YYYY-MM-DD)', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should correctly add days to a date string', () => {
    expect(addDays('2026-09-01', 1)).toBe('2026-09-02');
    expect(addDays('2026-09-01', 7)).toBe('2026-09-08');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });

  it('should calculate 4 initial revision stages for a completed topic', () => {
    const topicId = 'top_test_1';
    const revisions = calculateInitialRevisions(
      topicId,
      'Percentage',
      'sub_math',
      'Quantitative Aptitude',
      'chap_1',
      'Arithmetic',
      '2026-09-01'
    );

    expect(revisions).toHaveLength(4);
    expect(revisions[0].stage).toBe(1);
    expect(revisions[0].intervalDays).toBe(1);
    expect(revisions[0].scheduledDate).toBe('2026-09-02');

    expect(revisions[1].stage).toBe(2);
    expect(revisions[1].intervalDays).toBe(3);
    expect(revisions[1].scheduledDate).toBe('2026-09-04');

    expect(revisions[2].stage).toBe(3);
    expect(revisions[2].intervalDays).toBe(7);
    expect(revisions[2].scheduledDate).toBe('2026-09-08');

    expect(revisions[3].stage).toBe(4);
    expect(revisions[3].intervalDays).toBe(21);
    expect(revisions[3].scheduledDate).toBe('2026-09-22');
  });

  it('should calculate next review correctly on grade "again"', () => {
    const sampleRecord: RevisionRecord = {
      id: 'rev_1',
      topicId: 'top_1',
      topicName: 'Algebra',
      subjectId: 'sub_1',
      subjectName: 'Math',
      chapterId: 'chap_1',
      chapterName: 'Advanced',
      stage: 3,
      intervalDays: 7,
      scheduledDate: '2026-09-01',
      completedDate: null,
      status: 'pending',
      history: [],
    };

    const result = gradeRevision(sampleRecord, 'again');
    expect(result.nextStage).toBe(1);
    expect(result.nextRevisionDate).toBe(addDays(getTodayDateString(), 1));
  });

  it('should calculate next review correctly on grade "good"', () => {
    const sampleRecord: RevisionRecord = {
      id: 'rev_1',
      topicId: 'top_1',
      topicName: 'Algebra',
      subjectId: 'sub_1',
      subjectName: 'Math',
      chapterId: 'chap_1',
      chapterName: 'Advanced',
      stage: 2,
      intervalDays: 3,
      scheduledDate: '2026-09-01',
      completedDate: null,
      status: 'pending',
      history: [],
    };

    const result = gradeRevision(sampleRecord, 'good');
    expect(result.nextStage).toBe(3);
    expect(result.nextRevisionDate).toBe(addDays(getTodayDateString(), 6)); // 3 * 2.0 = 6 days
  });
});
