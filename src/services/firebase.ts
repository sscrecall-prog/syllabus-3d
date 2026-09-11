/**
 * ═══════════════════════════════════════════════════════════════
 * FIREBASE CLOUD BACKEND SERVICE (AUTH & FIRESTORE)
 * ═══════════════════════════════════════════════════════════════
 * Handles real Google OAuth Authentication and Google Cloud Firestore
 * database connections for cross-device synchronization and instant
 * data recovery upon Gmail login.
 * ═══════════════════════════════════════════════════════════════
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const FIREBASE_LOCAL_CONFIG_KEY = 'syllabus3d_firebase_config';

/**
 * Reads Firebase configuration from Vite environment variables,
 * or from user-provided config in localStorage.
 */
export function getFirebaseConfig(): FirebaseConfig | null {
  // 1. Check Vite Environment Variables
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 2. Check Local Storage User-Configured Keys (from Settings View)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(FIREBASE_LOCAL_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.apiKey && parsed?.projectId) {
          return parsed;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Save user-entered Firebase credentials in localStorage
 */
export function saveCustomFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FIREBASE_LOCAL_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Clear custom Firebase credentials
 */
export function clearCustomFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FIREBASE_LOCAL_CONFIG_KEY);
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;

export function initFirebase(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  provider: GoogleAuthProvider | null;
  isConfigured: boolean;
} {
  const config = getFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return {
      app: null,
      auth: null,
      db: null,
      provider: null,
      isConfigured: false
    };
  }

  try {
    if (!firebaseApp) {
      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        firebaseApp = initializeApp(config);
      }
      firebaseAuth = getAuth(firebaseApp);
      firestoreDb = getFirestore(firebaseApp);
      googleAuthProvider = new GoogleAuthProvider();
      googleAuthProvider.setCustomParameters({
        prompt: 'select_account'
      });
    }

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestoreDb,
      provider: googleAuthProvider,
      isConfigured: true
    };
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return {
      app: null,
      auth: null,
      db: null,
      provider: null,
      isConfigured: false
    };
  }
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(cfg?.apiKey && cfg?.projectId);
}

export { firebaseApp, firebaseAuth, firestoreDb, googleAuthProvider };
