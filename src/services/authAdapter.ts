/**
 * Authentication Adapter & Security Interface
 * Decouples frontend authentication from specific storage/backend providers.
 */

import { AuthUser } from '../types/auth';

export interface AuthCredentials {
  email: string;
  password?: string;
  name?: string;
}

export interface AuthAdapter {
  getSession(): Promise<AuthUser | null>;
  login(email: string, password?: string): Promise<AuthUser>;
  signup(name: string, email: string, password?: string): Promise<AuthUser>;
  loginWithOAuth(provider: 'google' | 'gitlab' | 'github'): Promise<AuthUser>;
  resetPassword(email: string): Promise<void>;
  logout(): Promise<void>;
}

/**
 * WebCrypto-based SHA-256 hashing utility with salt.
 * Ensures passwords are not stored or compared as plaintext.
 */
export async function hashPassword(password: string, salt: string = 'syllabus3d_salt_v1'): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback pseudo-hash for non-crypto environments
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
