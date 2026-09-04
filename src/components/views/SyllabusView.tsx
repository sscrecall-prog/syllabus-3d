import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Topic, TopicStatus, Chapter, Subject } from '../../types/syllabus';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Plus,
  Calculator,
  BrainCircuit,
  BookOpen,
  Globe,
  Edit2,
  Trash2,
  FileText,
  AlertTriangle,
  Layers,
  X,
  CheckCircle2,
  Zap,
  Circle,
  Clock,
  RotateCw,
  Target,
  Sparkles,
  Calendar,
  FolderOpen
} from 'lucide-react';
import { EditSubjectModal } from '../modals/EditSubjectModal';
import { EditChapterModal } from '../modals/EditChapterModal';
import { soundManager } from '../../utils/soundEffects';

interface SyllabusViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenAddTopic: () => void;
  onOpenFocus?: (topicId?: string) => void;
  initialSubjectId?: string;
  onSelectSubjectId?: (id: string) => void;
  onBackToDashboard?: () => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  onOpenTopicDrawer,
  onOpenAddTopic,
  onOpenFocus,
  initialSubjectId,
  onSelectSubjectId,
  onBackToDashboard,
  onRegisterBackHandler
}) => {
  const { currentExam, deleteTopic, updateTopicStatus } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(initialSubjectId || null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'content'>('content');

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subjectId: string; chapter: Chapter } | null>(null);

  useEffect(() => {
    if (initialSubjectId && currentExam?.subjects.some(s => s.id === initialSubjectId)) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId, currentExam]);

  // Master Step-by-Step Back Handler for Syllabus Hierarchy
  const handleSyllabusBack = useCallback(() => {
    if (selectedChapterId) {
      setSelectedChapterId(null);
      return true; // handled Level 3 -> Level 2
    }
    if (selectedSubjectId) {
      setSelectedSubjectId(null);
      return true; // handled Level 2 -> Level 1
    }
    return false; // at Level 1, allow parent to navigate to previous view / overview
  }, [selectedChapterId, selectedSubjectId]);

  // Register with Parent App for unified popstate and Header back button
  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(handleSyllabusBack);
      return () => onRegisterBackHandler(null);
    }
  }, [onRegisterBackHandler, handleSyllabusBack]);

  if (!currentExam) return null;

  // Active Subject (Level 2 & 3)
  const activeSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return currentExam.subjects.find(s => s.id === selectedSubjectId) || null;
  }, [currentExam, selectedSubjectId]);

  // Active Chapter (Level 3)
  const activeChapter = useMemo(() => {
    if (!activeSubject || !selectedChapterId) return null;
    return activeSubject.chapters.find(c => c.id === selectedChapterId) || null;
  }, [activeSubject, selectedChapterId]);

  // Current Chapter Navigation Index
  const currentChapterIndex = useMemo(() => {
    if (!activeSubject || !selectedChapterId) return -1;
    return activeSubject.chapters.findIndex(c => c.id === selectedChapterId);
  }, [activeSubject, selectedChapterId]);

  const prevChapter = currentChapterIndex > 0 ? activeSubject?.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < (activeSubject?.chapters.length || 0) - 1
    ? activeSubject?.chapters[currentChapterIndex + 1]
    : null;

  // Navigation Handlers
  const handleSelectSubject = (subjectId: string) => {
    soundManager.playClick();
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(null);
    setSearchTerm('');
    if (onSelectSubjectId) onSelectSubjectId(subjectId);
    window.history.pushState({ subjectId }, '');
  };

  const handleBackToSubjects = () => {
    soundManager.playClick();
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
    setSearchTerm('');
  };

  const handleSelectChapter = (chapterId: string) => {
    soundManager.playClick();
    setSelectedChapterId(chapterId);
    setSearchTerm('');
    window.history.pushState({ chapterId }, '');
  };

  const handleBackToChapters = () => {
    soundManager.playClick();
    setSelectedChapterId(null);
    setSearchTerm('');
  };

  // Overall Exam Stats
  const allTopicsInExam = currentExam.subjects.flatMap(s => s.chapters.flatMap(c => c.topics));
  const totalTopicsCount = allTopicsInExam.length;
  const completedTopicsCount = allTopicsInExam.filter(t => t.status === 'completed').length;
  const overallPercentage = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  // Formatted Date (e.g. 28 Sep, 2026) to prevent awkward word splitting on mobile
  const formattedExamDate = (() => {
    if (!currentExam.examDate) return '29 Aug, 2027';
    try {
      const parts = currentExam.examDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(currentExam.examDate);
      return isNaN(d.getTime()) ? currentExam.examDate : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return currentExam.examDate;
    }
  })();

  // Live remaining days
  const daysRemaining = (() => {
    if (!currentExam.examDate) return 0;
    const target = new Date(currentExam.examDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  })();

  // Filtered Subjects for Level 1
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return currentExam.subjects;
    const term = searchTerm.toLowerCase();
    return currentExam.subjects.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.chapters.some(c => c.name.toLowerCase().includes(term) || c.topics.some(t => t.name.toLowerCase().includes(term)))
    );
  }, [currentExam, searchTerm]);

  // Filtered Chapters for Level 2
  const filteredChapters = useMemo(() => {
    if (!activeSubject) return [];
    if (!searchTerm.trim()) return activeSubject.chapters;
    const term = searchTerm.toLowerCase();
    return activeSubject.chapters.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.topics.some(t => t.name.toLowerCase().includes(term) || t.subtopics.some(st => st.toLowerCase().includes(term)))
    );
  }, [activeSubject, searchTerm]);

  // Filtered Topics for Level 3
  const filteredChapterTopics = useMemo(() => {
    if (!activeChapter) return [];
    return activeChapter.topics.filter(t => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subtopics.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeChapter, searchTerm, statusFilter]);

  // Status counts for active view
  const statusCounts = useMemo(() => {
    const list = activeChapter
      ? activeChapter.topics
      : activeSubject
      ? activeSubject.chapters.flatMap(c => c.topics)
      : allTopicsInExam;

    return {
      all: list.length,
      completed: list.filter(t => t.status === 'completed').length,
      in_progress: list.filter(t => t.status === 'in_progress').length,
      weak: list.filter(t => t.status === 'weak').length,
      not_started: list.filter(t => t.status === 'not_started' || !t.status).length,
    };
  }, [activeChapter, activeSubject, allTopicsInExam]);

  // 1. Subject Badge Helper (Level 1)
  const getSubjectBadgeStyle = (subjectName: string) => {
    const lower = subjectName.toLowerCase();
    if (lower.includes('quant') || lower.includes('math')) {
      return {
        badgeText: 'MATH',
        icon: Calculator,
        containerClass: 'bg-gradient-to-br from-[#3b0b11] via-[#5c131c] to-[#25070b] border border-red-500/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
        accentColor: '#EF4444',
        accentBg: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('general knowledge') || lower.includes('gs')) {
      return {
        badgeText: 'GK/GS',
        icon: Globe,
        containerClass: 'bg-gradient-to-br from-[#0c2340] via-[#113563] to-[#08172c] border border-sky-500/40 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.25)]',
        accentColor: '#0EA5E9',
        accentBg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        badgeText: 'REAS',
        icon: BrainCircuit,
        containerClass: 'bg-gradient-to-br from-[#2a134a] via-[#3e1a6e] to-[#1a0c2e] border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        accentColor: '#A855F7',
        accentBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
      };
    }
    if (lower.includes('english') || lower.includes('comprehension')) {
      return {
        badgeText: 'ENG',
        icon: BookOpen,
        containerClass: 'bg-gradient-to-br from-[#0a3225] via-[#104b38] to-[#062017] border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        accentColor: '#10B981',
        accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      };
    }
    return {
      badgeText: subjectName.slice(0, 4).toUpperCase(),
      icon: Layers,
      containerClass: 'bg-gradient-to-br from-[#181926] via-[#24263a] to-[#12131d] border border-[#3b3d56] text-indigo-300 shadow-[0_0_15px_rgba(122,162,247,0.25)]',
      accentColor: '#7AA2F7',
      accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
    };
  };

  // 2. Chapter Badge Helper (Level 2)
  const getChapterBadgeStyle = (subjectName: string, chapterIndex: number) => {
    const formattedNum = (chapterIndex + 1).toString().padStart(2, '0');
    const badgeText = `CH ${formattedNum}`;
    const lower = subjectName.toLowerCase();

    if (lower.includes('quant') || lower.includes('math')) {
      return {
        badgeText,
        icon: Calculator,
        containerClass: 'bg-gradient-to-br from-[#3b0b11] via-[#5c131c] to-[#25070b] border border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
        accentColor: '#EF4444'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('general knowledge') || lower.includes('gs')) {
      return {
        badgeText,
        icon: Globe,
        containerClass: 'bg-gradient-to-br from-[#0c2340] via-[#113563] to-[#08172c] border border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]',
        accentColor: '#0EA5E9'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        badgeText,
        icon: BrainCircuit,
        containerClass: 'bg-gradient-to-br from-[#2a134a] via-[#3e1a6e] to-[#1a0c2e] border border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
        accentColor: '#A855F7'
      };
    }
    if (lower.includes('english') || lower.includes('comprehension')) {
      return {
        badgeText,
        icon: BookOpen,
        containerClass: 'bg-gradient-to-br from-[#0a3225] via-[#104b38] to-[#062017] border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        accentColor: '#10B981'
      };
    }
    return {
      badgeText,
      icon: FolderOpen,
      containerClass: 'bg-gradient-to-br from-[#181926] via-[#24263a] to-[#12131d] border border-[#3b3d56] text-indigo-300 shadow-md',
      accentColor: '#7AA2F7'
    };
  };

  // 3. Topic Card & Badge Styling Helper (Level 3)
  const getTopicCardDesign = (status: TopicStatus, topicIndex: number) => {
    const formattedNum = (topicIndex + 1).toString().padStart(2, '0');
    switch (status) {
      case 'completed':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'Mastered',
          badgeIcon: CheckCircle2,
          boxClass: 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          cardBorderClass: 'bg-white dark:bg-[#181926] hover:bg-[#FAF9F5] dark:hover:bg-[#1F2133] border border-[#D8D8CF] dark:border-[#2E3044] hover:border-emerald-500/60 shadow-xs hover:shadow-lg',
          accentColor: '#10B981',
          titleColor: 'text-[#11120F] dark:text-white',
          statusPillClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-bold',
          btnClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs',
          btnLabel: 'Mastered ✓'
        };
      case 'in_progress':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'In Progress',
          badgeIcon: Zap,
          boxClass: 'bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          cardBorderClass: 'bg-white dark:bg-[#181926] hover:bg-[#FAF9F5] dark:hover:bg-[#1F2133] border border-[#D8D8CF] dark:border-[#2E3044] hover:border-amber-500/60 shadow-xs hover:shadow-lg',
          accentColor: '#F59E0B',
          titleColor: 'text-[#11120F] dark:text-white',
          statusPillClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-bold',
          btnClasses: 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs',
          btnLabel: 'Mark Done ✓'
        };
      case 'weak':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'Weak Focus',
          badgeIcon: AlertTriangle,
          boxClass: 'bg-rose-950/80 border border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          cardBorderClass: 'bg-white dark:bg-[#181926] hover:bg-[#FAF9F5] dark:hover:bg-[#1F2133] border border-[#D8D8CF] dark:border-[#2E3044] hover:border-rose-500/60 shadow-xs hover:shadow-lg',
          accentColor: '#F43F5E',
          titleColor: 'text-[#11120F] dark:text-white',
          statusPillClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/40 font-bold',
          btnClasses: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs',
          btnLabel: 'Fix Weak'
        };
      case 'revision_due':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'Revise Due',
          badgeIcon: Clock,
          boxClass: 'bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
          cardBorderClass: 'bg-white dark:bg-[#181926] hover:bg-[#FAF9F5] dark:hover:bg-[#1F2133] border border-[#D8D8CF] dark:border-[#2E3044] hover:border-purple-500/60 shadow-xs hover:shadow-lg',
          accentColor: '#A855F7',
          titleColor: 'text-[#11120F] dark:text-white',
          statusPillClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/40 font-bold',
          btnClasses: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs',
          btnLabel: 'Revise Now'
        };
      default: // not_started
        return {
          badgeNum: formattedNum,
          badgeLabel: 'Not Started',
          badgeIcon: BookOpen,
          boxClass: 'bg-[#1C1E2F] border border-[#3E4264] text-slate-100 shadow-sm',
          cardBorderClass: 'bg-white dark:bg-[#181926] hover:bg-[#FAF9F5] dark:hover:bg-[#1F2133] border border-[#D8D8CF] dark:border-[#2E3044] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs hover:shadow-lg',
          accentColor: '#596B35',
          titleColor: 'text-[#11120F] dark:text-white',
          statusPillClass: 'bg-[#FAF9F5] dark:bg-[#202234] text-[#45474E] dark:text-[#E2E8F0] border border-[#D8D8CF] dark:border-[#383A52] font-semibold hover:dark:bg-[#282A3E]',
          btnClasses: 'bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-[#596B35] dark:hover:bg-[#7AA2F7] font-bold shadow-xs',
          btnLabel: 'Start Topic →'
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // LEVEL 3: CHAPTER TOPICS & STUDY VIEW (Polished Mobile-First Layout)
  // ═══════════════════════════════════════════════════════════════════
  if (activeSubject && activeChapter) {
    const totalInActiveChapter = activeChapter.topics.length;
    const completedInActiveChapter = activeChapter.topics.filter(t => t.status === 'completed').length;
    const inProgressInActiveChapter = activeChapter.topics.filter(t => t.status === 'in_progress').length;
    const weakInActiveChapter = activeChapter.topics.filter(t => t.status === 'weak').length;
    const chapterPercent = totalInActiveChapter > 0 ? Math.round((completedInActiveChapter / totalInActiveChapter) * 100) : 0;
    const chapterBadge = getChapterBadgeStyle(activeSubject.name, currentChapterIndex >= 0 ? currentChapterIndex : 0);
    const ChapterBadgeIcon = chapterBadge.icon;

    return (
      <div className="space-y-4 sm:space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP CHAPTER HERO BANNER */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0">
              
              {/* Left Visual Badge Thumbnail */}
              <div className={`w-13 sm:w-15 h-13 sm:h-15 rounded-2xl flex flex-col items-center justify-center text-center p-1.5 shrink-0 shadow-md relative overflow-hidden ${chapterBadge.containerClass}`}>
                <ChapterBadgeIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase font-mono leading-none truncate max-w-full">
                  {chapterBadge.badgeText}
                </span>
              </div>

              {/* Banner Meta & Title */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#596B35] dark:text-sky-300">
                  <span>{activeSubject.name}</span>
                  <span>•</span>
                  <span>Chapter {currentChapterIndex + 1} of {activeSubject.chapters.length}</span>
                </div>

                <h1 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase break-words line-clamp-2 leading-snug">
                  {activeChapter.name}
                </h1>
              </div>
            </div>

            {/* Quick Actions (Back, Switcher & Mastery) */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleBackToChapters}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#181A28] hover:bg-[#11120F] hover:text-white dark:hover:bg-white dark:hover:text-black text-[#191A17] dark:text-[#E2E8F0] border border-[#D8D8CF] dark:border-[#383A52] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 group shrink-0"
                title="Return to All Chapters"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Chapters</span>
              </button>

              {prevChapter && (
                <button
                  onClick={() => handleSelectChapter(prevChapter.id)}
                  className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#181A28] text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#383A52] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Previous: ${prevChapter.name}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {nextChapter && (
                <button
                  onClick={() => handleSelectChapter(nextChapter.id)}
                  className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#181A28] text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#383A52] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Next: ${nextChapter.name}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono tabular-nums font-bold border ${
                chapterPercent === 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black'
                  : chapterPercent > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-[#FAF9F5] dark:bg-[#181A28] text-[#65675F] dark:text-[#CBD5E1] border-[#D8D8CF] dark:border-[#383A52]'
              }`}>
                {chapterPercent === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{chapterPercent}%</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bento Pills */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#EEEEE8] dark:border-[#262738] flex-wrap">
            <span className="flex items-center gap-1.5 bg-[#FAF9F5] dark:bg-[#181A28] px-2.5 py-1 rounded-xl border border-[#D8D8CF]/70 dark:border-[#383A52] text-[11px] font-mono font-semibold text-[#11120F] dark:text-[#E2E8F0]">
              <FileText className="w-3.5 h-3.5 text-[#85877E] dark:text-indigo-400" />
              <span>{totalInActiveChapter} Topics Total</span>
            </span>

            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${
              completedInActiveChapter > 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-[#FAF9F5] dark:bg-[#181A28] text-[#85877E] dark:text-[#CBD5E1] border-[#D8D8CF]/70 dark:border-[#383A52]'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedInActiveChapter} Mastered</span>
            </span>

            {inProgressInActiveChapter > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/20 text-[11px] font-mono font-bold">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{inProgressInActiveChapter} In Progress</span>
              </span>
            )}

            {weakInActiveChapter > 0 && (
              <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-xl border border-rose-500/20 text-[11px] font-mono font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{weakInActiveChapter} Weak</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. TOPICS CONTENT CONTAINER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
          
          {/* Header Bar: Tab, Search & Add Topic */}
          <div className="space-y-3.5 pb-3.5 border-b border-[#EEEEE8] dark:border-[#262738]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Topics Content ({totalInActiveChapter})
                </h2>
                <p className="text-xs text-[#65675F] dark:text-[#CBD5E1] font-medium mt-0.5">
                  Click a topic to launch full study details, notes, revision, and questions
                </p>
              </div>

              <button
                onClick={onOpenAddTopic}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11120F] dark:bg-white hover:bg-[#596B35] dark:hover:bg-[#7AA2F7] text-white dark:text-black text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Topic</span>
              </button>
            </div>

            {/* Clean Full-Width Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#85877E] dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topics in this chapter..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#383A52] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] focus:ring-2 focus:ring-[#596B35]/15 dark:focus:ring-[#7AA2F7]/20 shadow-2xs transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85877E] dark:text-slate-300 hover:text-[#11120F] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills (Clean Pure Text with Icons, Zero Emojis) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {[
              { id: 'all', label: 'All', count: statusCounts.all, icon: Layers },
              { id: 'completed', label: 'Mastered', count: statusCounts.completed, icon: CheckCircle2 },
              { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress, icon: Zap },
              { id: 'weak', label: 'Weak Focus', count: statusCounts.weak, icon: AlertTriangle },
              { id: 'not_started', label: 'Not Started', count: statusCounts.not_started, icon: Circle },
            ].map(st => {
              const Icon = st.icon;
              const isSelected = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setStatusFilter(st.id as any);
                    soundManager.playClick();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                      : 'bg-white dark:bg-[#181926] text-[#45474E] dark:text-[#E2E8F0] border-[#D8D8CF] dark:border-[#383A52] hover:border-[#596B35] dark:hover:border-[#7AA2F7] dark:hover:bg-[#202234]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-[#EEEEE8] dark:bg-[#25283B] text-[#85877E] dark:text-slate-200 border border-transparent dark:border-[#3B3E5B]'
                  }`}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. TOPIC CARDS LIST (Executive Modern Study Cards) */}
          <div className="space-y-3">
            {filteredChapterTopics.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-3xl bg-[#FAF9F5] dark:bg-[#151622] border border-dashed border-[#D8D8CF] dark:border-[#262738] space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[#85877E]">
                  <FileText className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-sm font-bold text-[#11120F] dark:text-[#F5F5F7]">No topics found</h4>
                <p className="text-xs text-[#85877E] dark:text-[#787C99]">No topics match the search or filter query.</p>
              </div>
            ) : (
              filteredChapterTopics.map((topic, tIdx) => {
                const design = getTopicCardDesign(topic.status, tIdx);
                const BadgeIcon = design.badgeIcon;

                return (
                  <div
                    key={topic.id}
                    onClick={() => onOpenTopicDrawer(topic, activeSubject.name, activeChapter.name)}
                    className="group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] hover:bg-[#FAF9F5] dark:hover:bg-[#1B1D2C] border border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.995] space-y-3 overflow-hidden"
                  >
                    {/* Subtle Top Glow Accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${design.accentColor}, transparent)`
                      }}
                    />

                    {/* Top Row: Squircle Thumbnail + Topic Title + Right Action */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        {/* 3D Squircle Thumbnail Badge (No raw emojis) */}
                        <div className={`w-11 sm:w-14 h-11 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center p-1 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm relative overflow-hidden ${design.boxClass}`}>
                          <BadgeIcon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                          <span className="text-[9px] sm:text-[11px] font-black tracking-wider uppercase font-mono leading-none">
                            {design.badgeNum}
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-sm sm:text-base font-black ${design.titleColor} group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors leading-snug break-words line-clamp-2`}>
                            {topic.name}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Status Pill & Action Chevron */}
                      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
                            updateTopicStatus(topic.id, nextStatus);
                            if (nextStatus === 'completed') {
                              soundManager.playCompleteChime();
                            } else {
                              soundManager.playClick();
                            }
                          }}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 sm:gap-1.5 transition-transform active:scale-95 cursor-pointer select-none hover:opacity-90 ${design.statusPillClass}`}
                          title="Click to toggle status"
                        >
                          <BadgeIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[2.5]" />
                          <span>{design.badgeLabel}</span>
                        </div>

                        {/* Action Chevron */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#1E2030] border border-[#D8D8CF]/80 dark:border-[#383A52] flex items-center justify-center text-[#65675F] dark:text-[#CBD5E1] group-hover:bg-[#11120F] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all group-hover:translate-x-0.5 shadow-2xs shrink-0">
                          <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Meta Chips Row (Horizontal scroll on mobile, zero clumsy wrapping) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#CBD5E1] overflow-x-auto no-scrollbar pt-0.5">
                      <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                        <Layers className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        <span>{topic.subtopics && topic.subtopics.length > 0 ? `${topic.subtopics.length} Subtopics` : 'Core Concept'}</span>
                      </span>

                      <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{topic.studyTimeMinutes || 0}m Study</span>
                      </span>

                      <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                        <Target className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                        <span>{topic.accuracy || 0}% Accuracy</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Edit Chapter Modal */}
        {editingChapter && (
          <EditChapterModal
            isOpen={Boolean(editingChapter)}
            subjectId={editingChapter.subjectId}
            chapter={editingChapter.chapter}
            onClose={() => setEditingChapter(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // LEVEL 2: SUBJECT CHAPTERS DIRECTORY (Matching Reference Hierarchy)
  // ═══════════════════════════════════════════════════════════════════
  if (activeSubject && !selectedChapterId) {
    const totalSubjectTopics = activeSubject.chapters.reduce((a, c) => a + c.topics.length, 0);
    const completedSubjectTopics = activeSubject.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === 'completed').length, 0);
    const subjectPercent = totalSubjectTopics > 0 ? Math.round((completedSubjectTopics / totalSubjectTopics) * 100) : 0;
    const subjectBadge = getSubjectBadgeStyle(activeSubject.name);
    const SubjectBadgeIcon = subjectBadge.icon;

    return (
      <div className="space-y-4 sm:space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP SUBJECT HERO BANNER */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0">
              
              {/* Left Visual Badge Thumbnail */}
              <div className={`w-13 sm:w-15 h-13 sm:h-15 rounded-2xl flex flex-col items-center justify-center text-center p-1.5 shrink-0 shadow-md relative overflow-hidden ${subjectBadge.containerClass}`}>
                <SubjectBadgeIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase font-mono leading-none truncate max-w-full">
                  {subjectBadge.badgeText}
                </span>
              </div>

              {/* Banner Meta & Title */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                  <span>{currentExam.name}</span>
                  <span>•</span>
                  <span>Subject Content</span>
                </div>

                <h1 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase break-words line-clamp-2 leading-snug">
                  {activeSubject.name} – CHAPTERS
                </h1>
              </div>
            </div>

            {/* Quick Actions (Back, Mastery Pill & Edit) */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleBackToSubjects}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] hover:bg-[#11120F] hover:text-white dark:hover:bg-white dark:hover:text-black text-[#191A17] dark:text-[#CBD5E1] border border-[#D8D8CF] dark:border-[#262738] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 group shrink-0"
                title="Return to Batch Subjects Portal"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>All Subjects</span>
              </button>

              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono tabular-nums font-bold border ${
                subjectPercent === 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black'
                  : subjectPercent > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-[#FAF9F5] dark:bg-[#151622] text-[#65675F] dark:text-[#888A9E] border-[#D8D8CF] dark:border-[#262738]'
              }`}>
                {subjectPercent === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{subjectPercent}%</span>
              </div>

              <button
                onClick={() => setEditingSubject(activeSubject)}
                className="p-2 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#FAF9F5] dark:hover:bg-[#151622] border border-[#D8D8CF]/60 dark:border-[#262738] transition-colors cursor-pointer"
                title="Edit Subject"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Bento Pills */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#EEEEE8] dark:border-[#262738] flex-wrap">
            <span className="flex items-center gap-1.5 bg-[#FAF9F5] dark:bg-[#151622] px-2.5 py-1 rounded-xl border border-[#D8D8CF]/70 dark:border-[#262738] text-[11px] font-mono font-semibold text-[#11120F] dark:text-[#CBD5E1]">
              <Layers className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>{activeSubject.chapters.length} {activeSubject.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-[#FAF9F5] dark:bg-[#151622] px-2.5 py-1 rounded-xl border border-[#D8D8CF]/70 dark:border-[#262738] text-[11px] font-mono font-semibold text-[#11120F] dark:text-[#CBD5E1]">
              <FileText className="w-3.5 h-3.5 text-[#85877E]" />
              <span>{totalSubjectTopics} Total Topics</span>
            </span>

            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${
              completedSubjectTopics > 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-[#FAF9F5] dark:bg-[#151622] text-[#85877E] border-[#D8D8CF]/70 dark:border-[#262738]'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedSubjectTopics} Mastered</span>
            </span>
          </div>
        </div>

        {/* 2. CHAPTERS CONTENT CONTAINER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
          
          {/* Executive Header & Search Toolbar */}
          <div className="space-y-3.5 pb-3.5 border-b border-[#EEEEE8] dark:border-[#262738]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Chapters & Syllabus Modules
                </h2>
                <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium mt-0.5">
                  Select a chapter to study topics, monitor completion, and track revisions
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] text-xs font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
                <span>{filteredChapters.length} of {activeSubject.chapters.length} Chapters</span>
              </div>
            </div>

            {/* Clean Full-Width Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#85877E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search chapters in ${activeSubject.name}...`}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] focus:ring-2 focus:ring-[#596B35]/15 dark:focus:ring-[#7AA2F7]/20 shadow-2xs transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#11120F] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. CHAPTER CARDS LIST (Executive Bento Architecture) */}
          <div className="space-y-3">
            {filteredChapters.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-3xl bg-[#FAF9F5] dark:bg-[#151622] border border-dashed border-[#D8D8CF] dark:border-[#262738] space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[#85877E]">
                  <FolderOpen className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-sm font-bold text-[#11120F] dark:text-[#F5F5F7]">No chapters match your search</h4>
                <p className="text-xs text-[#85877E] dark:text-[#787C99]">Try searching with a different keyword.</p>
              </div>
            ) : (
              filteredChapters.map((chapter, idx) => {
                const totalInChapter = chapter.topics.length;
                const completedInChapter = chapter.topics.filter(t => t.status === 'completed').length;
                const inProgressInChapter = chapter.topics.filter(t => t.status === 'in_progress').length;
                const chapterPercent = totalInChapter > 0 ? Math.round((completedInChapter / totalInChapter) * 100) : 0;
                const isChapterMastered = chapterPercent === 100;
                const hasChapterStarted = chapterPercent > 0 || inProgressInChapter > 0;
                const chapterBadge = getChapterBadgeStyle(activeSubject.name, idx);
                const ChapterIcon = chapterBadge.icon;
                const accentColor = activeSubject.color || chapterBadge.accentColor || '#596B35';

                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleSelectChapter(chapter.id)}
                    className="group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] hover:bg-[#FAF9F5] dark:hover:bg-[#1B1D2C] border border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.995] space-y-3 overflow-hidden"
                  >
                    {/* Subtle Top Glow Accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                      }}
                    />

                    {/* Top Row: Thumbnail + Title + Right Action */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        {/* Modern 3D Squircle Chapter Badge */}
                        <div className={`w-11 sm:w-14 h-11 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center p-1 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm relative overflow-hidden ${chapterBadge.containerClass}`}>
                          <ChapterIcon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                          <span className="text-[8px] sm:text-[10px] font-black tracking-wider uppercase font-mono leading-none truncate max-w-full">
                            {chapterBadge.badgeText}
                          </span>
                        </div>

                        {/* Chapter Title & Meta */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors break-words line-clamp-2 leading-snug">
                            {chapter.name}
                          </h3>
                        </div>
                      </div>

                      {/* Right: Status Pill & Action Chevron */}
                      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* Status Pill */}
                        <div className={`px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-mono tabular-nums font-bold flex items-center gap-1 sm:gap-1.5 ${
                          isChapterMastered
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                            : hasChapterStarted
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-[#FAF9F5] dark:bg-[#1E2030] text-[#45474E] dark:text-[#CBD5E1] border border-[#D8D8CF] dark:border-[#383A52]'
                        }`}>
                          {isChapterMastered ? (
                            <>
                              <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[2.5]" />
                              <span>100% Mastered</span>
                            </>
                          ) : hasChapterStarted ? (
                            <>
                              <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                              <span>{chapterPercent}% Done</span>
                            </>
                          ) : (
                            <span>0% Not Started</span>
                          )}
                        </div>

                        {/* Action Chevron */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#1E2030] border border-[#D8D8CF]/80 dark:border-[#383A52] flex items-center justify-center text-[#65675F] dark:text-[#CBD5E1] group-hover:bg-[#11120F] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all group-hover:translate-x-0.5 shadow-2xs shrink-0">
                          <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Meta Chips Row (Horizontal scroll on mobile, zero clumsy wrapping) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#CBD5E1] overflow-x-auto no-scrollbar pt-0.5">
                      <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                        <FileText className="w-3 h-3 text-[#85877E] dark:text-indigo-400" />
                        <span>{totalInChapter} {totalInChapter === 1 ? 'Topic' : 'Topics'}</span>
                      </span>

                      {completedInChapter > 0 && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{completedInChapter} Mastered</span>
                        </span>
                      )}
                    </div>

                    {/* Sleek Integrated Progress Track */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#85877E] dark:text-[#CBD5E1]">
                        <span className="uppercase tracking-wider">Chapter Progress</span>
                        <span className="tabular-nums">{chapterPercent}% ({completedInChapter}/{totalInChapter})</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#EEEEE8] dark:bg-[#11121A] overflow-hidden p-0.5 border border-[#D8D8CF]/50 dark:border-[#262738]/50">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${chapterPercent}%`,
                            backgroundColor: accentColor,
                            boxShadow: chapterPercent > 0 ? `0 0 10px ${accentColor}80` : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modals */}
        {editingSubject && (
          <EditSubjectModal
            isOpen={Boolean(editingSubject)}
            subject={editingSubject}
            onClose={() => setEditingSubject(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // LEVEL 1: COURSE / BATCH PORTAL & SUBJECTS LIST (Mobile-First Polish)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 sm:space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
      
      {/* 1. TOP BATCH HERO BANNER WITH NIGHT STUDY DESK BACKGROUND */}
      {/* 1. TOP EXAM HERO BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0D0F17] border border-[#262738] shadow-2xl relative overflow-hidden text-white">
        
        {/* Study Desk Background Image with Warm Lamp Glow */}
        <div 
          className="absolute inset-0 bg-cover bg-right pointer-events-none opacity-80 mix-blend-screen scale-102 transition-transform duration-1000"
          style={{ backgroundImage: `url('/syllabus_explorer_banner.png')` }}
        />

        {/* Multi-layered Glass Gradients for 100% Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F17] via-[#0D0F17]/95 md:via-[#0D0F17]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F17]/90 via-transparent to-transparent pointer-events-none" />
        
        {/* Banner Content (Badge + Title + Meta) */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-5 min-w-0">
          
          {/* Left Visual Badge Banner */}
          <div className="w-13 sm:w-20 h-13 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#101422] via-[#1A233D] to-[#0A0D15] border border-white/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-1 sm:p-1.5 shrink-0 shadow-lg relative overflow-hidden">
            <span className="text-[9px] sm:text-xs font-black tracking-wider text-[#FACC15] drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)] uppercase leading-none">
              SYLLABUS
            </span>
            <span className="text-[8px] sm:text-[11px] font-extrabold tracking-widest text-[#7AA2F7] uppercase font-mono leading-none mt-0.5 sm:mt-1">
              EXPLORER
            </span>
          </div>

          {/* Banner Meta Info */}
          <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-[#C2C5D6] flex-wrap">
              <span className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                <Calendar className="w-3 h-3 text-[#FACC15] shrink-0" />
                <span>{formattedExamDate}</span>
              </span>
              {daysRemaining > 0 && (
                <span className="px-2 sm:px-2.5 py-0.5 rounded-lg font-mono tabular-nums font-bold bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/30">
                  ⚡ {daysRemaining}d left
                </span>
              )}
              <span className="px-2 sm:px-2.5 py-0.5 rounded-lg font-mono tabular-nums font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🏆 {overallPercentage}% Mastered
              </span>
            </div>

            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight break-words line-clamp-2 drop-shadow-sm leading-snug">
              {currentExam.name ? currentExam.name.toUpperCase() : 'SSC CGL 2026'}
            </h1>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-semibold text-[#A1A1B2] flex-wrap">
              <span>{currentExam.subjects.length} Subjects</span>
              <span>•</span>
              <span>{totalTopicsCount} Topics</span>
              <span>•</span>
              <span>{completedTopicsCount} Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PORTAL CONTENT CONTAINER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
        
        {/* Executive Header & Search Toolbar */}
        <div className="space-y-3.5 pb-3.5 border-b border-[#EEEEE8] dark:border-[#262738]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                Exam Subjects & Syllabus Modules
              </h2>
              <p className="text-xs text-[#65675F] dark:text-[#CBD5E1] font-medium mt-0.5">
                Click any subject to open chapters, subtopics, and revision tracker
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#383A52] text-xs font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
              <span>{filteredSubjects.length} of {currentExam.subjects.length} Subjects</span>
            </div>
          </div>

          {/* Full-Width Search Input with Ambient Glow */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#85877E] dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subjects, chapters, topics..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#383A52] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] focus:ring-2 focus:ring-[#596B35]/15 dark:focus:ring-[#7AA2F7]/20 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85877E] dark:text-slate-300 hover:text-[#11120F] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. DYNAMIC SUBJECT CARDS LIST (Executive Bento Architecture) */}
        <div className="space-y-3">
          {filteredSubjects.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-[#FAF9F5] dark:bg-[#151622] border border-dashed border-[#D8D8CF] dark:border-[#262738] space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[#85877E]">
                <BookOpen className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h4 className="text-sm font-bold text-[#11120F] dark:text-[#F5F5F7]">No subjects match your search</h4>
              <p className="text-xs text-[#85877E] dark:text-[#787C99]">Try searching with a different keyword or clear your filter.</p>
            </div>
          ) : (
            filteredSubjects.map(subject => {
              const badgeStyle = getSubjectBadgeStyle(subject.name);
              const BadgeIcon = badgeStyle.icon;
              const subjectTotalTopics = subject.chapters.reduce((a, c) => a + c.topics.length, 0);
              const subjectCompletedTopics = subject.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === 'completed').length, 0);
              const subjectInProgressTopics = subject.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === 'in_progress').length, 0);
              const percent = subjectTotalTopics > 0 ? Math.round((subjectCompletedTopics / subjectTotalTopics) * 100) : 0;
              const isMastered = percent === 100;
              const hasStarted = percent > 0 || subjectInProgressTopics > 0;

              const accentColor = subject.color || badgeStyle.accentColor;

              return (
                <div
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject.id)}
                  className="group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] hover:bg-[#FAF9F5] dark:hover:bg-[#1B1D2C] border border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.995] space-y-3 overflow-hidden"
                >
                  {/* Subtle Top Glow Accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                    }}
                  />

                  {/* Top Row: Thumbnail + Title + Right Action */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      {/* Modern 3D/Glass Squircle Thumbnail */}
                      <div className={`w-11 sm:w-14 h-11 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center p-1 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm relative overflow-hidden ${badgeStyle.containerClass}`}>
                        <BadgeIcon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                        <span className="text-[8px] sm:text-[10px] font-black tracking-wider uppercase font-mono leading-none truncate max-w-full">
                          {badgeStyle.badgeText}
                        </span>
                      </div>

                      {/* Subject Name (Never brutally truncated) */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors break-words line-clamp-2 leading-snug">
                          {subject.name}
                        </h3>
                      </div>
                    </div>

                    {/* Right: Progress Status Pill & Action Chevron */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                      {/* Status Pill */}
                      <div className={`px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-mono tabular-nums font-bold flex items-center gap-1 sm:gap-1.5 ${
                        isMastered
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                          : hasStarted
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[#FAF9F5] dark:bg-[#1E2030] text-[#45474E] dark:text-[#CBD5E1] border border-[#D8D8CF] dark:border-[#383A52]'
                      }`}>
                        {isMastered ? (
                          <>
                            <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[2.5]" />
                            <span>100% Mastered</span>
                          </>
                        ) : hasStarted ? (
                          <>
                            <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                            <span>{percent}% Done</span>
                          </>
                        ) : (
                          <span>0% Not Started</span>
                        )}
                      </div>

                      {/* Action Chevron */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#1E2030] border border-[#D8D8CF]/80 dark:border-[#383A52] flex items-center justify-center text-[#65675F] dark:text-[#CBD5E1] group-hover:bg-[#11120F] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all group-hover:translate-x-0.5 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Meta Chips Row (Horizontal scroll on mobile, zero clumsy wrapping) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#CBD5E1] overflow-x-auto no-scrollbar pt-0.5">
                    <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                      <Layers className="w-3 h-3 text-[#596B35] dark:text-indigo-400" />
                      <span>{subject.chapters.length} {subject.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
                    </span>

                    <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E2030] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#383A52] text-[#191A17] dark:text-[#E2E8F0] shrink-0 whitespace-nowrap">
                      <FileText className="w-3 h-3 text-[#85877E] dark:text-indigo-400" />
                      <span>{subjectTotalTopics} Topics</span>
                    </span>

                    {subjectCompletedTopics > 0 && (
                      <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold shrink-0 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{subjectCompletedTopics} Mastered</span>
                      </span>
                    )}
                  </div>

                  {/* Sleek Integrated Progress Track */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#85877E] dark:text-[#CBD5E1]">
                      <span className="uppercase tracking-wider">Mastery Completion</span>
                      <span className="tabular-nums">{percent}% ({subjectCompletedTopics}/{subjectTotalTopics})</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#EEEEE8] dark:bg-[#11121A] overflow-hidden p-0.5 border border-[#D8D8CF]/50 dark:border-[#262738]/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: accentColor,
                          boxShadow: percent > 0 ? `0 0 10px ${accentColor}80` : 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Subject Modal */}
      {editingSubject && (
        <EditSubjectModal
          isOpen={Boolean(editingSubject)}
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
        />
      )}
    </div>
  );
};

