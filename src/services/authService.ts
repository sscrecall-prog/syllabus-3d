import { AuthUser } from '../types/auth';

const SESSION_STORAGE_KEY = 'syllabus3d_auth_session';
const USERS_DB_KEY = 'syllabus3d_users_db';

// Pre-seeded Demo Aspirant User for immediate testing
const INITIAL_DEMO_USERS: Array<AuthUser & { passwordHash: string }> = [
  {
    id: 'user_rahul_01',
    name: 'Aspirant Rahul',
    email: 'rahul@aspirant.com',
    passwordHash: 'Password@123',
    provider: 'email',
    createdAt: '2026-01-15T09:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  }
];

function getUsersDB(): Array<AuthUser & { passwordHash: string }> {
  if (typeof window === 'undefined') return INITIAL_DEMO_USERS;
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(INITIAL_DEMO_USERS));
  } catch {}
  return INITIAL_DEMO_USERS;
}

function saveUsersDB(users: Array<AuthUser & { passwordHash: string }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch {}
}

export const authService = {
  async getSession(): Promise<AuthUser | null> {
    // Artificial small delay to simulate clean session verification without flash
    await new Promise(r => setTimeout(r, 200));
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  },

  async login(email: string, password: string): Promise<AuthUser> {
    await new Promise(r => setTimeout(r, 650));
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsersDB();

    const matchedUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!matchedUser || matchedUser.passwordHash !== password) {
      throw new Error('Incorrect email or password. Please try again.');
    }

    const authUser: AuthUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      avatarUrl: matchedUser.avatarUrl,
      provider: matchedUser.provider,
      createdAt: matchedUser.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  },

  async signup(name: string, email: string, password: string): Promise<AuthUser> {
    await new Promise(r => setTimeout(r, 750));
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsersDB();

    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account already exists with this email address.');
    }

    const newUserRecord = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      provider: 'email' as const,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    users.push(newUserRecord);
    saveUsersDB(users);

    const authUser: AuthUser = {
      id: newUserRecord.id,
      name: newUserRecord.name,
      email: newUserRecord.email,
      provider: newUserRecord.provider,
      createdAt: newUserRecord.createdAt,
      lastLoginAt: newUserRecord.lastLoginAt
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  },

  async loginWithGoogle(): Promise<AuthUser> {
    await new Promise(r => setTimeout(r, 700));
    
    // Check if user has an existing Google-linked account or create one
    const users = getUsersDB();
    const googleEmail = 'aspirant.google@gmail.com';
    let matchedUser = users.find(u => u.email === googleEmail);

    if (!matchedUser) {
      matchedUser = {
        id: 'usr_g_' + Math.random().toString(36).substr(2, 9),
        name: 'Google Aspirant',
        email: googleEmail,
        passwordHash: 'OAuthGoogle',
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      users.push(matchedUser);
      saveUsersDB(users);
    }

    const authUser: AuthUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      provider: 'google',
      createdAt: matchedUser.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  },

  async resetPassword(email: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 600));
    // Always return true safely to protect email enumeration
    return true;
  },

  async logout(): Promise<void> {
    await new Promise(r => setTimeout(r, 150));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
};
