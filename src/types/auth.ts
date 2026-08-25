export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
  createdAt: string;
  lastLoginAt: string;
}

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3;
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  criteria: PasswordCriteria;
}

export type AuthViewMode = 'login' | 'signup' | 'forgot_password';
