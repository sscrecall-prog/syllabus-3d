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
        containerClass: 'bg-gradient-to-br from-[#2b080c] via-[#450a0a] to-[#1f0507] border border-red-500/40 text-[#FACC15] shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        accentColor: '#EF4444'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('general knowledge') || lower.includes('gs')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#0c1a2e] via-[#0f2744] to-[#08111e] border border-blue-500/40 text-[#FACC15] shadow-[0_0_10px_rgba(59,130,246,0.2)]',
        accentColor: '#3B82F6'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#1e0e33] via-[#2d124d] to-[#120820] border border-purple-500/40 text-[#FACC15] shadow-[0_0_10px_rgba(168,85,247,0.2)]',
        accentColor: '#A855F7'
      };
    }
    if (lower.includes('english') || lower.includes('comprehension')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#2a0e0e] via-[#3d1414] to-[#1a0707] border border-rose-500/40 text-[#FACC15] shadow-[0_0_10px_rgba(244,63,94,0.2)]',
        accentColor: '#F43F5E'
      };
    }
    return {
      badgeText,
      containerClass: 'bg-gradient-to-br from-[#18181D] to-[#24283B] border border-[#292E42] text-[#FACC15] shadow-md',
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
          badgeLabel: 'DONE',
          badgeIcon: CheckCircle2,
          boxClass: 'bg-gradient-to-br from-[#052417] via-[#083b27] to-[#03170e] border border-emerald-500/45 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
          cardBorderClass: 'bg-white dark:bg-[#1F2335] hover:bg-emerald-50/40 dark:hover:bg-[#24283B] border-emerald-500/40 hover:border-emerald-500 shadow-xs border-l-4 border-l-emerald-500',
          titleColor: 'text-emerald-950 dark:text-emerald-200',
          btnClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm',
          btnLabel: 'Mastered ✓'
        };
      case 'in_progress':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'DOING',
          badgeIcon: Zap,
          boxClass: 'bg-gradient-to-br from-[#2b1f06] via-[#473307] to-[#171002] border border-amber-500/45 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse',
          cardBorderClass: 'bg-white dark:bg-[#1F2335] hover:bg-amber-50/40 dark:hover:bg-[#24283B] border-amber-500/40 hover:border-amber-500 shadow-xs border-l-4 border-l-amber-500',
          titleColor: 'text-amber-950 dark:text-amber-200',
          btnClasses: 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm',
          btnLabel: 'Mark Done ➔'
        };
      case 'weak':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'WEAK',
          badgeIcon: AlertTriangle,
          boxClass: 'bg-gradient-to-br from-[#2e090f] via-[#4d0c18] to-[#1a0307] border border-rose-500/45 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
          cardBorderClass: 'bg-white dark:bg-[#1F2335] hover:bg-rose-50/40 dark:hover:bg-[#24283B] border-rose-500/40 hover:border-rose-500 shadow-xs border-l-4 border-l-rose-500',
          titleColor: 'text-rose-950 dark:text-rose-200',
          btnClasses: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm',
          btnLabel: 'Fix Weak 🔥'
        };
      case 'revision_due':
        return {
          badgeNum: formattedNum,
          badgeLabel: 'REVISE',
          badgeIcon: Clock,
          boxClass: 'bg-gradient-to-br from-[#220c38] via-[#38115e] to-[#120521] border border-purple-500/45 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
          cardBorderClass: 'bg-white dark:bg-[#1F2335] hover:bg-purple-50/40 dark:hover:bg-[#24283B] border-purple-500/40 hover:border-purple-500 shadow-xs border-l-4 border-l-purple-500',
          titleColor: 'text-purple-950 dark:text-purple-200',
          btnClasses: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm',
          btnLabel: 'Revise Now ⏳'
        };
      default: // not_started
        return {
          badgeNum: formattedNum,
          badgeLabel: 'TODO',
          badgeIcon: Circle,
          boxClass: 'bg-gradient-to-br from-[#18181D] to-[#24283B] border border-[#292E42] text-slate-300 shadow-sm',
          cardBorderClass: 'bg-white dark:bg-[#1F2335] hover:bg-[#F7F6F0]/80 dark:hover:bg-[#24283B] border-[#D8D8CF]/80 dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs border-l-4 border-l-slate-300 dark:border-l-slate-600',
          titleColor: 'text-[#11120F] dark:text-[#C0CAF5]',
          btnClasses: 'bg-[#EEEEE8] dark:bg-[#16161E] text-[#191A17] dark:text-[#C0CAF5] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] border border-slate-300 dark:border-[#292E42] font-bold shadow-2xs',
          btnLabel: 'Start Topic ➔'
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

    return (
      <div className="space-y-4 sm:space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP CHAPTER HERO BANNER (Clean & Responsive) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-3.5">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              
              {/* Left Visual Badge Thumbnail */}
              <div className={`w-14 sm:w-16 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center text-center px-1 shrink-0 shadow-md relative overflow-hidden font-serif ${chapterBadge.containerClass}`}>
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-[#FACC15] uppercase leading-none">
                  {chapterBadge.badgeText}
                </span>
                <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase font-mono mt-0.5">
                  CHAPTER
                </span>
              </div>

              {/* Banner Meta & Title */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                  <span>{activeSubject.name}</span>
                  <span>•</span>
                  <span>Chapter {currentChapterIndex + 1} of {activeSubject.chapters.length}</span>
                </div>

                <h1 className="text-sm sm:text-lg font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif break-words leading-tight mt-0.5">
                  {activeChapter.name}
                </h1>
              </div>
            </div>

            {/* Quick Actions (Back, Switcher & Mastery) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleBackToChapters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] text-[#191A17] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
                title="Return to All Chapters"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Chapters</span>
              </button>

              {prevChapter && (
                <button
                  onClick={() => handleSelectChapter(prevChapter.id)}
                  className="p-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Previous: ${prevChapter.name}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {nextChapter && (
                <button
                  onClick={() => handleSelectChapter(nextChapter.id)}
                  className="p-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Next: ${nextChapter.name}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 border border-[#596B35]/30 dark:border-[#7AA2F7]/40 text-xs font-mono tabular-nums font-black text-[#354126] dark:text-[#7AA2F7]">
                <span>{chapterPercent}%</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono font-medium text-[#85877E] dark:text-[#787C99] pt-2 border-t border-[#EEEEE8] dark:border-[#292E42] flex-wrap">
            <span>{totalInActiveChapter} Topics Total</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedInActiveChapter} Mastered</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{inProgressInActiveChapter} In Progress</span>
            {weakInActiveChapter > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">{weakInActiveChapter} Weak</span>
              </>
            )}
          </div>
        </div>

        {/* 2. TOPICS CONTENT CONTAINER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-4">
          
          {/* Header Bar: Tab, Search & Add Topic */}
          <div className="space-y-3 pb-3 border-b border-[#EEEEE8] dark:border-[#292E42]">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className="pb-1 text-sm font-extrabold text-[#11120F] dark:text-[#C0CAF5] border-b-2 border-[#596B35] dark:border-[#7AA2F7] cursor-pointer transition-colors"
              >
                <span>Topics Content ({totalInActiveChapter})</span>
              </button>

              <button
                onClick={onOpenAddTopic}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Topic</span>
              </button>
            </div>

            {/* Clean Mobile Full-Width Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topics in this chapter..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[13px] font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills (Horizontal Scrollable on Mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {[
              { id: 'all', label: 'All', count: statusCounts.all, activeColor: 'bg-[#11120F] dark:bg-white text-white dark:text-black' },
              { id: 'completed', label: '✓ Mastered', count: statusCounts.completed, activeColor: 'bg-emerald-600 text-white shadow-sm' },
              { id: 'in_progress', label: '⚡ In Progress', count: statusCounts.in_progress, activeColor: 'bg-amber-500 text-white shadow-sm' },
              { id: 'weak', label: '⚠️ Weak', count: statusCounts.weak, activeColor: 'bg-rose-600 text-white shadow-sm' },
              { id: 'not_started', label: '⭕ Not Started', count: statusCounts.not_started, activeColor: 'bg-slate-700 text-white' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border shrink-0 ${
                  statusFilter === st.id
                    ? `${st.activeColor} border-transparent shadow-sm`
                    : 'bg-white dark:bg-[#1F2335] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <span>{st.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  statusFilter === st.id ? 'bg-white/20' : 'bg-[#EEEEE8] dark:bg-[#16161E] text-[#85877E]'
                }`}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* 3. TOPIC CARDS LIST (Polished Modern Course Style with Rich Preparation Visuals) */}
          <div className="space-y-2.5">
            {filteredChapterTopics.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl bg-[#F7F6F0]/50 dark:bg-[#1F2335]/50 border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-[#191A17] dark:text-[#C0CAF5]">No topics found</h4>
                <p className="text-[11px] text-[#85877E]">No topics match the search or filter query.</p>
              </div>
            ) : (
              filteredChapterTopics.map((topic, tIdx) => {
                const design = getTopicCardDesign(topic.status, tIdx);
                const BadgeIcon = design.badgeIcon;

                return (
                  <div
                    key={topic.id}
                    onClick={() => onOpenTopicDrawer(topic, activeSubject.name, activeChapter.name)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 active:scale-[0.99] ${design.cardBorderClass}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      
                      {/* Left Fixed Study Emblem Box (Preserves Exact Shape & Size) */}
                      <div className={`w-14 sm:w-16 h-11 sm:h-12 rounded-xl flex items-center justify-center gap-1.5 px-2 shrink-0 transition-transform group-hover:scale-105 ${design.boxClass}`}>
                        <span className="text-base sm:text-lg select-none leading-none filter drop-shadow-xs">
                          📖
                        </span>
                        <span className="text-sm sm:text-[15px] font-black font-mono leading-none tracking-tight">
                          {design.badgeNum}
                        </span>
                      </div>

                      {/* Topic Title & Subtitle Meta */}
                      <div className="min-w-0 space-y-1">
                        <h4 className={`text-sm sm:text-[15px] font-bold ${design.titleColor} group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors leading-snug line-clamp-2`}>
                          {topic.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-[11px] font-medium text-[#65675F] dark:text-[#A9B1D6] flex-wrap font-mono">
                          {topic.subtopics && topic.subtopics.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                              📄 {topic.subtopics.length} subtopics
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                              📄 Core Concept
                            </span>
                          )}
                          <span>•</span>
                          <span>⏱️ {topic.studyTimeMinutes}m study</span>
                          <span>•</span>
                          <span>🎯 {topic.accuracy}% acc</span>
                        </div>
                      </div>
                    </div>

                    {/* Right 1-Click Status Toggle Action */}
                    <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
                          updateTopicStatus(topic.id, nextStatus);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 ${design.btnClasses}`}
                      >
                        {design.btnLabel}
                      </button>
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

    return (
      <div className="space-y-4 sm:space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP SUBJECT HERO BANNER (Mobile-Friendly Clean Layout) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-3.5">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {/* Left Visual Badge Thumbnail */}
              <div className={`w-14 sm:w-16 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center text-center px-1 shrink-0 shadow-md relative overflow-hidden font-serif ${subjectBadge.containerClass}`}>
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-[#FACC15] uppercase leading-none truncate max-w-full">
                  {subjectBadge.badgeText}
                </span>
                <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase font-mono mt-0.5">
                  SUBJECT
                </span>
              </div>

              {/* Banner Meta & Title */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                  <span>{currentExam.name}</span>
                  <span>•</span>
                  <span>Subject Content</span>
                </div>

                <h1 className="text-sm sm:text-lg font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif uppercase truncate mt-0.5">
                  {activeSubject.name} – CHAPTERS
                </h1>
              </div>
            </div>

            {/* Quick Actions (Back & Edit) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleBackToSubjects}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] text-[#191A17] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
                title="Return to Batch Subjects Portal"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Subjects</span>
              </button>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 border border-[#596B35]/30 dark:border-[#7AA2F7]/40 text-xs font-mono tabular-nums font-black text-[#354126] dark:text-[#7AA2F7]">
                <span>{subjectPercent}%</span>
              </div>

              <button
                onClick={() => setEditingSubject(activeSubject)}
                className="p-1.5 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] border border-[#D8D8CF]/60 dark:border-[#292E42] transition-colors cursor-pointer"
                title="Edit Subject"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono font-medium text-[#85877E] dark:text-[#787C99] pt-2 border-t border-[#EEEEE8] dark:border-[#292E42] flex-wrap">
            <span>{activeSubject.chapters.length} Chapters</span>
            <span>•</span>
            <span>{totalSubjectTopics} Files / Topics</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedSubjectTopics} Mastered</span>
          </div>
        </div>

        {/* 2. CHAPTERS CONTENT CONTAINER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-4">
          
          {/* Header Bar: Tab & Search */}
          <div className="space-y-3 pb-3 border-b border-[#EEEEE8] dark:border-[#292E42]">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className="pb-1 text-sm font-extrabold text-[#11120F] dark:text-[#C0CAF5] border-b-2 border-[#596B35] dark:border-[#7AA2F7] cursor-pointer transition-colors"
              >
                <span>Chapters ({activeSubject.chapters.length})</span>
              </button>

              <span className="text-xs font-mono text-[#85877E] dark:text-[#A9B1D6]">
                {totalSubjectTopics} Total Topics
              </span>
            </div>

            {/* Clean Mobile Full-Width Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search chapters in ${activeSubject.name}...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[13px] font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. CHAPTER CARDS LIST (Clean Direct-Touch Mobile Cards) */}
          <div className="space-y-2.5">
            {filteredChapters.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl bg-[#F7F6F0]/50 dark:bg-[#1F2335]/50 border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-[#191A17] dark:text-[#C0CAF5]">No chapters found</h4>
                <p className="text-[11px] text-[#85877E]">No chapters match your search query.</p>
              </div>
            ) : (
              filteredChapters.map((chapter, idx) => {
                const totalInChapter = chapter.topics.length;
                const completedInChapter = chapter.topics.filter(t => t.status === 'completed').length;
                const chapterPercent = totalInChapter > 0 ? Math.round((completedInChapter / totalInChapter) * 100) : 0;
                const chapterBadge = getChapterBadgeStyle(activeSubject.name, idx);

                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleSelectChapter(chapter.id)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1F2335] hover:bg-[#F7F6F0]/80 dark:hover:bg-[#24283B] border border-[#D8D8CF]/80 dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 cursor-pointer shadow-xs group flex items-center justify-between gap-3 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Left Dark Stylized Chapter Thumbnail Badge */}
                      <div className={`w-14 sm:w-16 h-10 sm:h-11 rounded-xl flex items-center justify-center font-black font-serif text-[11px] sm:text-xs shrink-0 tracking-wider transition-transform group-hover:scale-105 ${chapterBadge.containerClass}`}>
                        <span>{chapterBadge.badgeText}</span>
                      </div>

                      {/* Chapter Title & Subtitle */}
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-sm sm:text-[15px] font-extrabold text-[#11120F] dark:text-[#C0CAF5] tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors font-serif truncate">
                          {chapter.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-[11px] sm:text-[11px] font-medium text-[#65675F] dark:text-[#A9B1D6] font-mono">
                          <span>📄 {totalInChapter} files / topics</span>
                          {completedInChapter > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• {completedInChapter} mastered</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Badge */}
                    <div className="shrink-0">
                      <div className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-mono tabular-nums font-bold ${
                        chapterPercent === 100
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : chapterPercent > 0
                          ? 'bg-[#16161E] dark:bg-[#16161E] text-amber-400 border border-[#292E42]'
                          : 'bg-[#F7F6F0] dark:bg-[#16161E] text-slate-600 dark:text-slate-400 border border-[#D8D8CF] dark:border-[#292E42]'
                      }`}>
                        {chapterPercent}%
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
        <div className="relative z-10 flex items-center gap-4 sm:gap-5 min-w-0">
          
          {/* Left Visual Badge Banner */}
          <div className="w-20 sm:w-24 h-15 sm:h-16 rounded-2xl bg-gradient-to-br from-[#101422] via-[#1A233D] to-[#0A0D15] border border-white/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-1.5 shrink-0 shadow-lg relative overflow-hidden">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-[#FACC15] drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)] uppercase leading-none">
              SYLLABUS
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-[#7AA2F7] uppercase font-mono leading-none mt-1">
              EXPLORER
            </span>
          </div>

          {/* Banner Meta Info */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#C2C5D6] flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                <Calendar className="w-3 h-3 text-[#FACC15]" />
                <span>Exam Date: {formattedExamDate}</span>
              </span>
              {daysRemaining > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono tabular-nums font-bold bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/30">
                  ⚡ {daysRemaining}d left
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono tabular-nums font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🏆 {overallPercentage}% Mastered
              </span>
            </div>

            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight truncate drop-shadow-sm">
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
              <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium mt-0.5">
                Click any subject to open chapters, subtopics, and revision tracker
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] text-xs font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
              <span>{filteredSubjects.length} of {currentExam.subjects.length} Subjects</span>
            </div>
          </div>

          {/* Full-Width Search Input with Ambient Glow */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#85877E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subjects, chapters, topics or subtopics..."
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
                  className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] hover:bg-[#FAF9F5] dark:hover:bg-[#1B1D2C] border border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.995] space-y-3.5 overflow-hidden"
                >
                  {/* Subtle Top Glow Accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                    }}
                  />

                  {/* Main Info Row */}
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    
                    {/* Left: Icon Badge & Titles */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      
                      {/* Modern 3D/Glass Squircle Thumbnail */}
                      <div className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center text-center p-1 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm relative overflow-hidden ${badgeStyle.containerClass}`}>
                        <BadgeIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] mb-0.5" />
                        <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase font-mono leading-none truncate max-w-full">
                          {badgeStyle.badgeText}
                        </span>
                      </div>

                      {/* Subject Name & Meta Badges */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                            {subject.name}
                          </h3>
                        </div>

                        {/* Interactive Meta Chips */}
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#A1A1B2] flex-wrap">
                          <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E1F2E] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#262738]">
                            <Layers className="w-3 h-3 text-[#596B35] dark:text-[#7AA2F7]" />
                            <span>{subject.chapters.length} {subject.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
                          </span>

                          <span className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1E1F2E] px-2 py-0.5 rounded-lg border border-[#D8D8CF]/70 dark:border-[#262738]">
                            <FileText className="w-3 h-3 text-[#85877E]" />
                            <span>{subjectTotalTopics} Topics</span>
                          </span>

                          {subjectCompletedTopics > 0 && (
                            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{subjectCompletedTopics} Mastered</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Progress Status Pill & Action Chevron */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto ml-auto sm:ml-0">
                      
                      {/* Status Pill */}
                      <div className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono tabular-nums font-bold flex items-center gap-1.5 ${
                        isMastered
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                          : hasStarted
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[#FAF9F5] dark:bg-[#1E1F2E] text-[#65675F] dark:text-[#888A9E] border border-[#D8D8CF] dark:border-[#262738]'
                      }`}>
                        {isMastered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>100% Mastered</span>
                          </>
                        ) : hasStarted ? (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>{percent}% Done</span>
                          </>
                        ) : (
                          <span>0% Not Started</span>
                        )}
                      </div>

                      {/* Action Chevron */}
                      <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#1E1F2E] border border-[#D8D8CF]/80 dark:border-[#262738] flex items-center justify-center text-[#65675F] dark:text-[#A1A1B2] group-hover:bg-[#11120F] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all group-hover:translate-x-0.5 shadow-2xs">
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Sleek Integrated Progress Track */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#85877E] dark:text-[#787C99]">
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

