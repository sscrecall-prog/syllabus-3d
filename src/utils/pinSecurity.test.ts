import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  hashWithSalt,
  verifyHashWithSalt,
  normalizeAnswer,
  hashSecurityAnswer,
  verifySecurityAnswer
} from './pinSecurity';

describe('pinSecurity utilities', () => {
  it('generates cryptographic random hex salt with correct length', () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);

    expect(salt1).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(salt2).toHaveLength(32);
    expect(salt1).not.toEqual(salt2); // must be distinct
  });

  it('hashes PIN with salt deterministically', async () => {
    const salt = generateSalt();
    const pin = '4829';

    const hash1 = await hashWithSalt(pin, salt);
    const hash2 = await hashWithSalt(pin, salt);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('generates different hashes for different salts with same PIN', async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const pin = '1234';

    const hash1 = await hashWithSalt(pin, salt1);
    const hash2 = await hashWithSalt(pin, salt2);

    expect(hash1).not.toBe(hash2);
  });

  it('verifies correct PIN against stored hash', async () => {
    const salt = generateSalt();
    const correctPin = '7890';
    const hash = await hashWithSalt(correctPin, salt);

    const isMatch = await verifyHashWithSalt(correctPin, salt, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyHashWithSalt('1111', salt, hash);
    expect(isWrongMatch).toBe(false);
  });

  it('normalizes security answers with whitespace and case insensitivity', () => {
    expect(normalizeAnswer('  SSC CGL 2026 ')).toBe('ssc cgl 2026');
    expect(normalizeAnswer('INCOME   TAX   INSPECTOR')).toBe('income tax inspector');
  });

  it('verifies security recovery answer regardless of casing or extra spaces', async () => {
    const salt = generateSalt();
    const originalAnswer = 'Income Tax Inspector';
    const storedHash = await hashSecurityAnswer(originalAnswer, salt);

    // Exact match
    expect(await verifySecurityAnswer('Income Tax Inspector', salt, storedHash)).toBe(true);

    // Lowercase match
    expect(await verifySecurityAnswer('income tax inspector', salt, storedHash)).toBe(true);

    // All uppercase with whitespace
    expect(await verifySecurityAnswer('   INCOME TAX INSPECTOR  ', salt, storedHash)).toBe(true);

    // Wrong answer
    expect(await verifySecurityAnswer('Excise Inspector', salt, storedHash)).toBe(false);
  });
});
