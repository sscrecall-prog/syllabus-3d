import React, { createContext, useContext, useState, useEffect } from 'react';
import { Top3Target, DailyReflection } from '../types/syllabus';
import {
  loadStoredTop3Targets,
  saveStoredTop3Targets,
  loadStoredReflections,
  saveStoredReflection,
  deleteStoredReflection
} from '../utils/dailyProductivityStorage';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export interface ProductivityContextType {
  top3Targets: Top3Target[];
  updateTop3Target: (targetId: string, text: string, meta?: { topicId?: string; subjectName?: string; subjectColor?: string }) => void;
  toggleTop3Target: (targetId: string) => void;
  clearTop3Target: (targetId: string) => void;

  reflectionsHistory: DailyReflection[];
  saveDailyReflection: (reflection: Omit<DailyReflection, 'id' | 'timestamp'>) => void;
  deleteDailyReflection: (id: string) => void;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

export const ProductivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [top3Targets, setTop3Targets] = useState<Top3Target[]>(() => loadStoredTop3Targets());
  const [reflectionsHistory, setReflectionsHistory] = useState<DailyReflection[]>(() => loadStoredReflections());

  useEffect(() => {
    saveStoredTop3Targets(top3Targets);
  }, [top3Targets]);

  const updateTop3Target = (
    targetId: string,
    text: string,
    meta?: { topicId?: string; subjectName?: string; subjectColor?: string }
  ) => {
    setTop3Targets(prev => prev.map(t => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        text,
        topicId: meta?.topicId !== undefined ? meta.topicId : t.topicId,
        subjectName: meta?.subjectName !== undefined ? meta.subjectName : t.subjectName,
        subjectColor: meta?.subjectColor !== undefined ? meta.subjectColor : t.subjectColor
      };
    }));
  };

  const toggleTop3Target = (targetId: string) => {
    setTop3Targets(prev => prev.map(t => {
      if (t.id !== targetId) return t;
      const willBeCompleted = !t.completed;
      if (willBeCompleted) {
        soundManager.playCompleteChime();
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      } else {
        soundManager.playClick();
      }
      return {
        ...t,
        completed: willBeCompleted,
        completedAt: willBeCompleted ? new Date().toISOString() : undefined
      };
    }));
  };

  const clearTop3Target = (targetId: string) => {
    setTop3Targets(prev => prev.map(t => {
      if (t.id !== targetId) return t;
      return {
        id: targetId,
        text: '',
        completed: false,
        topicId: undefined,
        subjectName: undefined,
        subjectColor: undefined,
        completedAt: undefined
      };
    }));
    soundManager.playClick();
  };

  const saveDailyReflectionHandler = (reflection: Omit<DailyReflection, 'id' | 'timestamp'>) => {
    const newRecord: DailyReflection = {
      ...reflection,
      id: 'refl_' + Date.now(),
      timestamp: new Date().toISOString()
    };
    const updated = saveStoredReflection(newRecord);
    setReflectionsHistory(updated);
    soundManager.playLevelUp();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
  };

  const deleteDailyReflectionHandler = (id: string) => {
    const updated = deleteStoredReflection(id);
    setReflectionsHistory(updated);
    soundManager.playClick();
  };

  return (
    <ProductivityContext.Provider
      value={{
        top3Targets,
        updateTop3Target,
        toggleTop3Target,
        clearTop3Target,
        reflectionsHistory,
        saveDailyReflection: saveDailyReflectionHandler,
        deleteDailyReflection: deleteDailyReflectionHandler
      }}
    >
      {children}
    </ProductivityContext.Provider>
  );
};

export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
};
