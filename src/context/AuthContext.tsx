import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthViewMode } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authView: AuthViewMode;
  setAuthView: (view: AuthViewMode) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSession: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<AuthViewMode>('login');

  useEffect(() => {
    let isMounted = true;
    authService.getSession().then((session) => {
      if (isMounted) {
        setUser(session);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const authUser = await authService.login(email, password);
    setUser(authUser);
  };

  const signup = async (name: string, email: string, password: string) => {
    const authUser = await authService.signup(name, email, password);
    setUser(authUser);
  };

  const loginWithGoogle = async () => {
    const authUser = await authService.loginWithGoogle();
    setUser(authUser);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setAuthView('login');
  };

  const updateUserSession = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      const base = prev || {
        id: 'user_default',
        name: 'Scholar Aspirant',
        email: 'aspirant@syllabus3d.local',
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      const updated = { ...base, ...updates };
      try {
        localStorage.setItem('syllabus3d_auth_session', JSON.stringify(updated));
        const usersDbRaw = localStorage.getItem('syllabus3d_users_db');
        if (usersDbRaw) {
          const users = JSON.parse(usersDbRaw);
          if (Array.isArray(users)) {
            const updatedUsers = users.map((u: any) => u.id === updated.id ? { ...u, ...updates } : u);
            localStorage.setItem('syllabus3d_users_db', JSON.stringify(updatedUsers));
          }
        }
      } catch (e) {}
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authView,
        setAuthView,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        logout,
        updateUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
