import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword } from '../../src/services/authAdapter';
import { authService } from '../../src/services/authService';

describe('authService and authAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should hash passwords deterministically with a salt', async () => {
    const hash1 = await hashPassword('Password@123');
    const hash2 = await hashPassword('Password@123');
    const hashDifferent = await hashPassword('Password@456');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDifferent);
    expect(hash1.length).toBeGreaterThan(10);
  });

  it('should login pre-seeded demo user successfully', async () => {
    const user = await authService.login('rahul@aspirant.com', 'Password@123');
    expect(user).toBeDefined();
    expect(user.email).toBe('rahul@aspirant.com');
    expect(user.name).toBe('Aspirant Rahul');
  });

  it('should reject login with wrong password', async () => {
    await expect(authService.login('rahul@aspirant.com', 'WrongPass')).rejects.toThrow(
      'Incorrect password'
    );
  });

  it('should allow new user signup and secure login', async () => {
    const newUser = await authService.signup('Priya Sharma', 'priya@example.com', 'SecurePass!99');
    expect(newUser.name).toBe('Priya Sharma');

    await authService.logout();
    const loggedIn = await authService.login('priya@example.com', 'SecurePass!99');
    expect(loggedIn.email).toBe('priya@example.com');
  });
});
