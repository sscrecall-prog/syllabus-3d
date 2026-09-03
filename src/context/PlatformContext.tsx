import React, { createContext, useContext, useState } from 'react';
import { ExternalPlatform } from '../types/syllabus';
import { soundManager } from '../utils/soundEffects';

const STORAGE_KEY_PLATFORMS = 'syllabus3d_platforms_v1';

export const INITIAL_PLATFORMS: ExternalPlatform[] = [
  {
    id: 'plat_pw',
    name: 'Physics Wallah (PW)',
    url: 'https://www.pw.live/study/batches',
    category: 'course',
    description: 'Live & recorded batches, DPPs, and comprehensive lecture notes',
    color: '#5A4FCF',
    icon: '⚡',
    loginHint: 'PW Mobile / Email',
    notes: 'Access Lakshya, Shaurya, or Parakram batch video lectures & DPP PDFs',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_careerwill',
    name: 'Careerwill',
    url: 'https://careerwill.com/',
    category: 'course',
    description: 'SSC, Banking & State exams video batches by top educators',
    color: '#E11D48',
    icon: '🎓',
    loginHint: 'Careerwill Registered Phone',
    notes: 'Maths Special, Reasoning, English & GS live classes',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_testbook',
    name: 'Testbook Pass & Mock Series',
    url: 'https://testbook.com/test-series',
    category: 'test_series',
    description: 'All India Live Mocks, Previous Year Papers & Percentile Analysis',
    color: '#0284C7',
    icon: '📝',
    loginHint: 'Testbook Account Email',
    notes: 'Attempt full-length Tier 1 & Tier 2 mocks, log errors directly in Mistake Journal',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_oliveboard',
    name: 'Oliveboard Mocks & Tests',
    url: 'https://www.oliveboard.in/',
    category: 'test_series',
    description: 'High-difficulty mock tests, sectional tests & topic quizzes',
    color: '#16A34A',
    icon: '🎯',
    loginHint: 'Oliveboard User Email',
    notes: 'Hard-level mock tests to test speed and accuracy under pressure',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_unacademy',
    name: 'Unacademy Plus',
    url: 'https://unacademy.com/',
    category: 'course',
    description: 'Live interactive classes, doubt solving, and structured syllabus courses',
    color: '#08BD80',
    icon: '🏛️',
    loginHint: 'Unacademy Plus Account',
    notes: 'Topic-wise live sessions and recorded educator courses',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_khan_academy',
    name: 'Khan Academy (Foundations)',
    url: 'https://www.khanacademy.org/',
    category: 'course',
    description: 'Master math, algebra, geometry & science concepts with mastery quizzes',
    color: '#14BF96',
    icon: '📖',
    loginHint: 'Khan Academy Account',
    notes: 'Free interactive practice for fundamental arithmetic & geometry',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_rbe',
    name: 'RBE (Revolution by Education)',
    url: 'https://rbeeducation.com/',
    category: 'test_series',
    description: 'Exam survey analysis, rank predictor, and sectional mock tests',
    color: '#F59E0B',
    icon: '📊',
    loginHint: 'RBE Portal Login',
    notes: 'Check cut-off trends, normalization shifts, and free exam mocks',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

export interface PlatformContextType {
  platforms: ExternalPlatform[];
  addPlatform: (platform: Omit<ExternalPlatform, 'id' | 'createdAt'>) => void;
  editPlatform: (platformId: string, updates: Partial<ExternalPlatform>) => void;
  deletePlatform: (platformId: string) => void;
  togglePinPlatform: (platformId: string) => void;
  recordPlatformAccess: (platformId: string) => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platforms, setPlatforms] = useState<ExternalPlatform[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PLATFORMS);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_PLATFORMS;
  });

  const savePlatforms = (updated: ExternalPlatform[]) => {
    setPlatforms(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PLATFORMS, JSON.stringify(updated));
      } catch {}
    }
  };

  const addPlatform = (platform: Omit<ExternalPlatform, 'id' | 'createdAt'>) => {
    const newPlatform: ExternalPlatform = {
      ...platform,
      id: 'plat_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    savePlatforms([newPlatform, ...platforms]);
    soundManager.playCompleteChime();
  };

  const editPlatform = (platformId: string, updates: Partial<ExternalPlatform>) => {
    const updated = platforms.map(p => p.id === platformId ? { ...p, ...updates } : p);
    savePlatforms(updated);
  };

  const deletePlatform = (platformId: string) => {
    const updated = platforms.filter(p => p.id !== platformId);
    savePlatforms(updated);
    soundManager.playClick();
  };

  const togglePinPlatform = (platformId: string) => {
    const updated = platforms.map(p => p.id === platformId ? { ...p, pinned: !p.pinned } : p);
    savePlatforms(updated);
    soundManager.playClick();
  };

  const recordPlatformAccess = (platformId: string) => {
    const updated = platforms.map(p =>
      p.id === platformId ? { ...p, lastAccessedAt: new Date().toISOString() } : p
    );
    savePlatforms(updated);
  };

  return (
    <PlatformContext.Provider
      value={{
        platforms,
        addPlatform,
        editPlatform,
        deletePlatform,
        togglePinPlatform,
        recordPlatformAccess
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatforms = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatforms must be used within a PlatformProvider');
  }
  return context;
};
