import { PasswordStrength } from '../types/auth';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
}

export function validateFullName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full name is required' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  return { isValid: true };
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const criteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(criteria).filter(Boolean).length;

  if (metCount <= 2 || !criteria.minLength) {
    return {
      score: 1,
      label: 'Weak',
      color: '#f43f5e', // rose
      criteria,
    };
  } else if (metCount >= 3 && metCount <= 4) {
    return {
      score: 2,
      label: 'Medium',
      color: '#f59e0b', // amber
      criteria,
    };
  } else {
    return {
      score: 3,
      label: 'Strong',
      color: '#10b981', // emerald
      criteria,
    };
  }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  return { isValid: true };
}

export function validatePasswordsMatch(password: string, confirm: string): { isValid: boolean; error?: string } {
  if (!confirm) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  if (password !== confirm) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
}
