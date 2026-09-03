import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatDateReadable,
  formatTimeAgo,
  formatMinutes,
  isDatePastOrToday,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  it('should format minutes into human readable string', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(125)).toBe('2h 5m');
  });

  it('should format readable dates properly', () => {
    expect(formatDateReadable(null)).toBe('Not yet');
    expect(formatDateReadable(undefined)).toBe('Not yet');
    const formatted = formatDateReadable('2026-09-01T12:00:00.000Z');
    expect(formatted).toContain('2026');
  });

  it('should return relative time ago correctly', () => {
    expect(formatTimeAgo(null)).toBe('Never');
    const today = new Date().toISOString();
    expect(formatTimeAgo(today)).toBe('Today');
  });

  it('should detect if date is past or today', () => {
    expect(isDatePastOrToday('2020-01-01')).toBe(true);
    expect(isDatePastOrToday('2099-01-01')).toBe(false);
  });
});
