import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStoredTop3Targets,
  saveStoredTop3Targets,
  loadStoredReflections,
  saveStoredReflection,
  deleteStoredReflection,
  getTodayDateKey,
} from '../../src/utils/dailyProductivityStorage';
import { Top3Target, DailyReflection } from '../../src/types/syllabus';

describe('dailyProductivityStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return 3 default empty targets if nothing is stored', () => {
    const targets = loadStoredTop3Targets();
    expect(targets).toHaveLength(3);
    expect(targets[0].text).toBe('');
    expect(targets[0].completed).toBe(false);
  });

  it('should save and load Top 3 targets correctly for today', () => {
    const customTargets: Top3Target[] = [
      { id: 'target-1', text: 'Solve 50 Algebra Questions', completed: true },
      { id: 'target-2', text: 'Revise Synonyms & Antonyms', completed: false },
      { id: 'target-3', text: 'Attempt Full Mock 04', completed: false },
    ];

    saveStoredTop3Targets(customTargets);
    const loaded = loadStoredTop3Targets();

    expect(loaded).toEqual(customTargets);
    expect(loaded[0].completed).toBe(true);
    expect(loaded[0].text).toBe('Solve 50 Algebra Questions');
  });

  it('should save and retrieve daily evening reflections without duplicates for same date', () => {
    const reflection1: DailyReflection = {
      id: 'refl_1',
      date: '2026-09-01',
      timestamp: '2026-09-01T20:00:00.000Z',
      winText: 'Finished entire percentage chapter',
      improvementText: 'Need to wake up earlier',
      energyRating: 5,
      distractionRating: 2,
    };

    const updatedList = saveStoredReflection(reflection1);
    expect(updatedList).toHaveLength(1);
    expect(updatedList[0].winText).toBe('Finished entire percentage chapter');

    // Update the reflection for the same date
    const reflection1Updated: DailyReflection = {
      ...reflection1,
      winText: 'Finished percentage and ratio chapters',
    };

    const finalList = saveStoredReflection(reflection1Updated);
    expect(finalList).toHaveLength(1);
    expect(finalList[0].winText).toBe('Finished percentage and ratio chapters');
  });

  it('should delete a stored reflection by ID', () => {
    const reflection1: DailyReflection = {
      id: 'refl_1',
      date: '2026-09-01',
      timestamp: '2026-09-01T20:00:00.000Z',
      winText: 'Win 1',
      improvementText: 'Improve 1',
      energyRating: 4,
      distractionRating: 2,
    };
    saveStoredReflection(reflection1);

    const afterDelete = deleteStoredReflection('refl_1');
    expect(afterDelete).toHaveLength(0);
    expect(loadStoredReflections()).toHaveLength(0);
  });
});
