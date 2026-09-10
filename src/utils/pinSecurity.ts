/**
 * Security and Cryptographic Utilities for Safety PIN Lock
 * Uses Web Crypto API (SHA-256 with Cryptographic Salt)
 */

export const generateSalt = (byteLength: number = 16): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback if window.crypto is unavailable (e.g. mock test environments)
  let fallback = '';
  for (let i = 0; i < byteLength * 2; i++) {
    fallback += Math.floor(Math.random() * 16).toString(16);
  }
  return fallback;
};

/**
 * Computes SHA-256 hash of a string combined with a salt
 */
export const hashWithSalt = async (secret: string, salt: string): Promise<string> => {
  const combined = `${secret}#syllabus3d_secure#${salt}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Minimal deterministic fallback for non-crypto test runners
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

/**
 * Verifies if an entered secret matches the salted hash
 */
export const verifyHashWithSalt = async (
  secret: string,
  salt: string,
  expectedHash: string
): Promise<boolean> => {
  if (!secret || !salt || !expectedHash) return false;
  const computedHash = await hashWithSalt(secret, salt);
  return computedHash === expectedHash;
};

/**
 * Normalizes security answer (trimmed, lowercased, single-spaced) and hashes it
 */
export const normalizeAnswer = (answer: string): string => {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const hashSecurityAnswer = async (answer: string, salt: string): Promise<string> => {
  const normalized = normalizeAnswer(answer);
  return hashWithSalt(normalized, salt);
};

export const verifySecurityAnswer = async (
  answer: string,
  salt: string,
  expectedHash: string
): Promise<boolean> => {
  if (!answer || !salt || !expectedHash) return false;
  const normalized = normalizeAnswer(answer);
  return verifyHashWithSalt(normalized, salt, expectedHash);
};
