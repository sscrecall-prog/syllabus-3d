import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlannerTask, PlannerColumnStatus } from '../types/syllabus';
import { getTodayDateString } from '../utils/spacedRepetition';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

const STORAGE_KEY_PLANNER = 'syllabus3d_planner_tasks_v1';

export const INITIAL_PLANNER_TASKS: PlannerTask[] = [
  {
    id: 'plan_1',
    topicName: 'Percentage & Fractional Conversions',
    subjectName: 'Quantitative Aptitude',
    subjectColor: '#3b82f6',
    status: 'today',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 45,
    isCustom: false,
    priority: 'high',
    category: 'concept'
  },
  {
    id: 'plan_2',
    topicName: 'Syllogism & Venn Diagrams',
    subjectName: 'Reasoning Ability',
    subjectColor: '#8b5cf6',
    status: 'today',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 30,
    isCustom: false,
    priority: 'medium',
    category: 'practice'
  },
  {
    id: 'plan_3',
    topicName: 'Error Spotting & Subject-Verb Rules',
    subjectName: 'English Language',
    subjectColor: '#10b981',
    status: 'in_progress',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 40,
    isCustom: false,
    priority: 'high',
    category: 'revision'
  },
  {
    id: 'plan_4',
    topicName: 'Full Mock Test Analysis & Mistake Log',
    subjectName: 'Custom Target',
    subjectColor: '#ec4899',
    status: 'upcoming',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 60,
    isCustom: true,
    priority: 'high',
    category: 'mock'
  }
];

export interface PlannerContextType {
  plannerTasks: PlannerTask[];
  addPlannerTask: (taskData: Omit<PlannerTask, 'id'>) => void;
  togglePlannerTask: (taskId: string) => void;
  movePlannerTask: (taskId: string, newStatus: PlannerColumnStatus) => void;
  deletePlannerTask: (taskId: string) => void;
  clearCompletedPlannerTasks: () => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PLANNER);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_PLANNER_TASKS;
  });

  const savePlannerTasks = (tasks: PlannerTask[]) => {
    setPlannerTasks(tasks);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PLANNER, JSON.stringify(tasks));
      } catch {}
    }
  };

  const addPlannerTask = (taskData: Omit<PlannerTask, 'id'>) => {
    const newTask: PlannerTask = {
      ...taskData,
      id: 'task_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [newTask, ...plannerTasks];
    savePlannerTasks(updated);
    soundManager.playClick();
  };

  const togglePlannerTask = (taskId: string) => {
    const updated = plannerTasks.map(t => {
      if (t.id !== taskId) return t;
      const isComp = t.status === 'completed';
      const nextStatus: PlannerColumnStatus = isComp ? 'today' : 'completed';
      if (!isComp) {
        soundManager.playCompleteChime();
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      } else {
        soundManager.playClick();
      }
      return {
        ...t,
        status: nextStatus,
        completedAt: !isComp ? getTodayDateString() : undefined
      };
    });
    savePlannerTasks(updated);
  };

  const movePlannerTask = (taskId: string, newStatus: PlannerColumnStatus) => {
    const updated = plannerTasks.map(t => {
      if (t.id !== taskId) return t;
      if (newStatus === 'completed') {
        soundManager.playCompleteChime();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
      } else {
        soundManager.playClick();
      }
      return {
        ...t,
        status: newStatus,
        completedAt: newStatus === 'completed' ? getTodayDateString() : undefined
      };
    });
    savePlannerTasks(updated);
  };

  const deletePlannerTask = (taskId: string) => {
    const updated = plannerTasks.filter(t => t.id !== taskId);
    savePlannerTasks(updated);
    soundManager.playClick();
  };

  const clearCompletedPlannerTasks = () => {
    const updated = plannerTasks.filter(t => t.status !== 'completed');
    savePlannerTasks(updated);
    soundManager.playClick();
  };

  return (
    <PlannerContext.Provider
      value={{
        plannerTasks,
        addPlannerTask,
        togglePlannerTask,
        movePlannerTask,
        deletePlannerTask,
        clearCompletedPlannerTasks
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
