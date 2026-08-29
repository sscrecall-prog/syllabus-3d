import React, { useState, useMemo, useEffect, useRef } from 'react';
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
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  onOpenTopicDrawer,
  onOpenAddTopic,
  onOpenFocus,
  initialSubjectId,
  onSelectSubjectId
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

  // Handle hardware / browser popstate back button across 3 levels
  useEffect(() => {
    const handlePopState = () => {
      if (selectedChapterId) {
        setSelectedChapterId(null);
      } else if (selectedSubjectId) {
        setSelectedSubjectId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedChapterId, selectedSubjectId]);

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
        badgeText: 'MATHS',
        containerClass: 'bg-gradient-to-br from-[#2b080c] via-[#450a0a] to-[#1f0507] border border-red-500/40 text-[#FACC15] shadow-[0_0_15px_rgba(239,68,68,0.25)]',
        accentColor: '#EF4444'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('general knowledge') || lower.includes('gs')) {
      return {
        badgeText: 'GK',
        containerClass: 'bg-gradient-to-br from-[#0c1a2e] via-[#0f2744] to-[#08111e] border border-blue-500/40 text-[#FACC15] shadow-[0_0_15px_rgba(59,130,246,0.25)]',
        accentColor: '#3B82F6'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        badgeText: 'REASONING',
        containerClass: 'bg-gradient-to-br from-[#1e0e33] via-[#2d124d] to-[#120820] border border-purple-500/40 text-[#FACC15] shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        accentColor: '#A855F7'
      };
    }
    if (lower.includes('english') || lower.includes('comprehension')) {
      return {
        badgeText: 'ENGLISH',
        containerClass: 'bg-gradient-to-br from-[#2a0e0e] via-[#3d1414] to-[#1a0707] border border-rose-500/40 text-[#FACC15] shadow-[0_0_15px_rgba(244,63,94,0.25)]',
        accentColor: '#F43F5E'
      };
    }
    return {
      badgeText: subjectName.slice(0, 9).toUpperCase(),
      containerClass: 'bg-gradient-to-br from-[#18181D] to-[#24283B] border border-[#292E42] text-[#FACC15] shadow-md',
      accentColor: '#7AA2F7'
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
        containerClass: 'bg-gradient-to-br from-[#2b080c] via-[#450a0a] to-[#1f0507] border border-red-500/40 text-[#FACC15] shadow-[0_0_12px_rgba(239,68,68,0.2)]',
        accentColor: '#EF4444'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('general knowledge') || lower.includes('gs')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#0c1a2e] via-[#0f2744] to-[#08111e] border border-blue-500/40 text-[#FACC15] shadow-[0_0_12px_rgba(59,130,246,0.2)]',
        accentColor: '#3B82F6'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#1e0e33] via-[#2d124d] to-[#120820] border border-purple-500/40 text-[#FACC15] shadow-[0_0_12px_rgba(168,85,247,0.2)]',
        accentColor: '#A855F7'
      };
    }
    if (lower.includes('english') || lower.includes('comprehension')) {
      return {
        badgeText,
        containerClass: 'bg-gradient-to-br from-[#2a0e0e] via-[#3d1414] to-[#1a0707] border border-rose-500/40 text-[#FACC15] shadow-[0_0_12px_rgba(244,63,94,0.2)]',
        accentColor: '#F43F5E'
      };
    }
    return {
      badgeText,
      containerClass: 'bg-gradient-to-br from-[#18181D] to-[#24283B] border border-[#292E42] text-[#FACC15] shadow-md',
      accentColor: '#7AA2F7'
    };
  };

  // 3. Topic Badge Helper (Level 3)
  const getTopicBadgeStyle = (status: TopicStatus, topicIndex: number) => {
    const formattedNum = (topicIndex + 1).toString().padStart(2, '0');
    switch (status) {
      case 'completed':
        return {
          badgeText: `T-${formattedNum}`,
          badgeIcon: CheckCircle2,
          containerClass: 'bg-gradient-to-br from-[#052417] via-[#083b27] to-[#03170e] border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
          btnClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm',
          btnLabel: 'Mastered ✓'
        };
      case 'in_progress':
        return {
          badgeText: `T-${formattedNum}`,
          badgeIcon: Zap,
          containerClass: 'bg-gradient-to-br from-[#2b1f06] via-[#473307] to-[#171002] border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse',
          btnClasses: 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm',
          btnLabel: 'Mark Done ➔'
        };
      case 'weak':
        return {
          badgeText: `T-${formattedNum}`,
          badgeIcon: AlertTriangle,
          containerClass: 'bg-gradient-to-br from-[#2e090f] via-[#4d0c18] to-[#1a0307] border border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
          btnClasses: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm',
          btnLabel: 'Fix Weak 🔥'
        };
      case 'revision_due':
        return {
          badgeText: `T-${formattedNum}`,
          badgeIcon: Clock,
          containerClass: 'bg-gradient-to-br from-[#220c38] via-[#38115e] to-[#120521] border border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
          btnClasses: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm',
          btnLabel: 'Revise Now ⏳'
        };
      default: // not_started
        return {
          badgeText: `T-${formattedNum}`,
          badgeIcon: Circle,
          containerClass: 'bg-gradient-to-br from-[#18181D] to-[#24283B] border border-[#292E42] text-slate-400 shadow-sm',
          btnClasses: 'bg-[#EEEEE8] dark:bg-[#16161E] text-[#191A17] dark:text-[#C0CAF5] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] font-bold',
          btnLabel: 'Start Topic ➔'
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // LEVEL 3: CHAPTER TOPICS & STUDY VIEW (Matching Reference Hierarchy)
  // ═══════════════════════════════════════════════════════════════════
  if (activeSubject && activeChapter) {
    const totalInActiveChapter = activeChapter.topics.length;
    const completedInActiveChapter = activeChapter.topics.filter(t => t.status === 'completed').length;
    const inProgressInActiveChapter = activeChapter.topics.filter(t => t.status === 'in_progress').length;
    const weakInActiveChapter = activeChapter.topics.filter(t => t.status === 'weak').length;
    const chapterPercent = totalInActiveChapter > 0 ? Math.round((completedInActiveChapter / totalInActiveChapter) * 100) : 0;
    const chapterBadge = getChapterBadgeStyle(activeSubject.name, currentChapterIndex >= 0 ? currentChapterIndex : 0);

    return (
      <div className="space-y-6 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP CHAPTER HERO BANNER (Exact Reference Card Aesthetic) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            
            {/* Left Visual Badge Thumbnail (e.g. CH 01) */}
            <div className={`w-20 sm:w-28 h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center text-center p-2 shrink-0 shadow-lg relative overflow-hidden font-serif ${chapterBadge.containerClass}`}>
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#FACC15] uppercase">
                {chapterBadge.badgeText}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 tracking-wider uppercase font-mono">
                CHAPTER
              </span>
            </div>

            {/* Banner Meta & Title */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#7AA2F7]">
                <span>{activeSubject.name}</span>
                <span>•</span>
                <span>Chapter {currentChapterIndex + 1} of {activeSubject.chapters.length}</span>
              </div>

              <h1 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif break-words leading-snug">
                {activeChapter.name}
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono font-semibold text-[#85877E] dark:text-[#787C99] pt-0.5 flex-wrap">
                <span>{totalInActiveChapter} Topics</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedInActiveChapter} Mastered</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{inProgressInActiveChapter} In Progress</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Back & Navigation) */}
          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={handleBackToChapters}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] text-[#191A17] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Return to All Chapters"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>All Chapters</span>
            </button>

            {/* Prev Chapter */}
            {prevChapter && (
              <button
                onClick={() => handleSelectChapter(prevChapter.id)}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                title={`Previous: ${prevChapter.name}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Next Chapter */}
            {nextChapter && (
              <button
                onClick={() => handleSelectChapter(nextChapter.id)}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                title={`Next: ${nextChapter.name}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Chapter Mastery Badge */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 border border-[#596B35]/30 dark:border-[#7AA2F7]/40 text-xs font-mono font-black text-[#354126] dark:text-[#7AA2F7]">
              <span>{chapterPercent}%</span>
            </div>
          </div>
        </div>

        {/* 2. TOPICS CONTENT CONTAINER (Matches Reference Content Tab & Search Layout) */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-5">
          
          {/* Content Tab & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#292E42]">
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('content')}
                className="pb-2 text-sm font-extrabold text-[#11120F] dark:text-[#C0CAF5] border-b-2 border-[#596B35] dark:border-[#7AA2F7] cursor-pointer transition-colors relative"
              >
                <span>Topics Content ({totalInActiveChapter})</span>
              </button>
            </div>

            {/* Search Topics in this Chapter */}
            <div className="relative flex-1 max-w-full sm:max-w-xs flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={onOpenAddTopic}
                className="px-3 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  statusFilter === st.id
                    ? `${st.activeColor} border-transparent shadow-sm`
                    : 'bg-white dark:bg-[#1F2335] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <span>{st.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === st.id ? 'bg-white/20' : 'bg-[#EEEEE8] dark:bg-[#16161E] text-[#85877E]'
                }`}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* 3. TOPIC CARDS LIST (Exact Same Hierarchy & Left Thumbnail Card Layout) */}
          <div className="space-y-3">
            {filteredChapterTopics.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[#F7F6F0]/50 dark:bg-[#1F2335]/50 border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-[#191A17] dark:text-[#C0CAF5]">No topics found</h4>
                <p className="text-xs text-[#85877E]">No topics match the search or filter query.</p>
              </div>
            ) : (
              filteredChapterTopics.map((topic, tIdx) => {
                const topicBadge = getTopicBadgeStyle(topic.status, tIdx);
                const BadgeIcon = topicBadge.badgeIcon;

                return (
                  <div
                    key={topic.id}
                    onClick={() => onOpenTopicDrawer(topic, activeSubject.name, activeChapter.name)}
                    className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1F2335] hover:bg-[#F7F6F0]/80 dark:hover:bg-[#24283B] border border-[#D8D8CF]/80 dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 cursor-pointer shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      
                      {/* Left Dark Stylized Topic Thumbnail Badge (e.g. T-01, T-02) */}
                      <div className={`w-14 sm:w-16 h-10 sm:h-12 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 tracking-wider transition-transform group-hover:scale-105 ${topicBadge.containerClass}`}>
                        <div className="flex items-center gap-1">
                          <BadgeIcon className="w-3 h-3" />
                          <span>{topicBadge.badgeText}</span>
                        </div>
                      </div>

                      {/* Topic Title & Subtitle Meta */}
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-[#11120F] dark:text-[#C0CAF5] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                          {topic.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#65675F] dark:text-[#A9B1D6] flex-wrap font-mono">
                          {topic.subtopics && topic.subtopics.length > 0 ? (
                            <span>📄 {topic.subtopics.length} subtopics</span>
                          ) : (
                            <span>📄 Core Concept</span>
                          )}
                          <span>•</span>
                          <span>⏱️ {topic.studyTimeMinutes}m</span>
                          <span>•</span>
                          <span>🎯 {topic.accuracy}% acc</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action: 1-Click Status Toggle */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EEEEE8] dark:border-[#292E42]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
                          updateTopicStatus(topic.id, nextStatus);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${topicBadge.btnClasses}`}
                      >
                        {topicBadge.btnLabel}
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
      <div className="space-y-6 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
        
        {/* 1. TOP SUBJECT HERO BANNER (Exact Reference Card Aesthetic) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            
            {/* Left Visual Badge Thumbnail (e.g. MATHS, GK, REASONING, ENGLISH) */}
            <div className={`w-20 sm:w-28 h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center text-center p-2 shrink-0 shadow-lg relative overflow-hidden font-serif ${subjectBadge.containerClass}`}>
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#FACC15] uppercase">
                {subjectBadge.badgeText}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 tracking-wider uppercase font-mono">
                SUBJECT
              </span>
            </div>

            {/* Banner Meta & Title */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#7AA2F7]">
                <span>{currentExam.name}</span>
                <span>•</span>
                <span>Subject Content</span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif uppercase truncate">
                {activeSubject.name} – CHAPTERS
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono font-semibold text-[#85877E] dark:text-[#787C99] pt-0.5 flex-wrap">
                <span>{activeSubject.chapters.length} Chapters</span>
                <span>•</span>
                <span>{totalSubjectTopics} Files / Topics</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{subjectPercent}% Mastered</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Back & Edit) */}
          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={handleBackToSubjects}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] text-[#191A17] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Return to Batch Subjects Portal"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>All Content</span>
            </button>

            <button
              onClick={() => setEditingSubject(activeSubject)}
              className="p-2 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] border border-[#D8D8CF]/60 dark:border-[#292E42] transition-colors cursor-pointer"
              title="Edit Subject"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. CHAPTERS CONTENT CONTAINER (Matches Reference Content Tab & Search Layout) */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-5">
          
          {/* Content Tab & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#292E42]">
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('content')}
                className="pb-2 text-sm font-extrabold text-[#11120F] dark:text-[#C0CAF5] border-b-2 border-[#596B35] dark:border-[#7AA2F7] cursor-pointer transition-colors relative"
              >
                <span>Chapters ({activeSubject.chapters.length})</span>
              </button>
            </div>

            {/* Search Chapters Input */}
            <div className="relative flex-1 max-w-full sm:max-w-xs flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search in ${activeSubject.name}...`}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Search
              </button>
            </div>
          </div>

          {/* 3. CHAPTER CARDS LIST (Exact Same Hierarchy & Left Thumbnail Card Layout) */}
          <div className="space-y-3">
            {filteredChapters.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[#F7F6F0]/50 dark:bg-[#1F2335]/50 border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-[#191A17] dark:text-[#C0CAF5]">No chapters found</h4>
                <p className="text-xs text-[#85877E]">No chapters match your search query.</p>
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
                    className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1F2335] hover:bg-[#F7F6F0]/80 dark:hover:bg-[#24283B] border border-[#D8D8CF]/80 dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 cursor-pointer shadow-xs group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      
                      {/* Left Dark Stylized Chapter Thumbnail Badge (e.g. CH 01, CH 02) */}
                      <div className={`w-16 sm:w-20 h-10 sm:h-12 rounded-xl flex items-center justify-center font-black font-serif text-xs sm:text-sm shrink-0 tracking-wider transition-transform group-hover:scale-105 ${chapterBadge.containerClass}`}>
                        <span>{chapterBadge.badgeText}</span>
                      </div>

                      {/* Chapter Title & Subtitle */}
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-base font-extrabold text-[#11120F] dark:text-[#C0CAF5] tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors font-serif truncate">
                          {chapter.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#65675F] dark:text-[#A9B1D6] mt-0.5 font-mono">
                          <span>📄 {totalInChapter} files / topics</span>
                          {completedInChapter > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• {completedInChapter} mastered</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Progress Badge */}
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                        chapterPercent === 100
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : chapterPercent > 0
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
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
  // LEVEL 1: COURSE / BATCH PORTAL & SUBJECTS LIST (Exact Reference UI)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
      
      {/* 1. TOP BATCH HERO BANNER (Matches Reference Screenshot Top Card) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          
          {/* Left Visual Badge Banner (FAST REVISION BATCH / SSC CGL) */}
          <div className="w-24 sm:w-36 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0B0F19] via-[#161F36] to-[#0A0D14] border border-[#292E42] flex flex-col items-center justify-center text-center p-2 shrink-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300 uppercase font-sans">
              FAST
            </span>
            <span className="text-xs sm:text-sm font-black tracking-tight text-[#FACC15] drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)] font-serif leading-none mt-0.5">
              REVISION
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-[#7AA2F7] uppercase font-mono mt-0.5">
              BATCH
            </span>
          </div>

          {/* Banner Meta Info */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-[#65675F] dark:text-[#A9B1D6]">
              <Calendar className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>Expiry Date: {currentExam.examDate || '29 Aug, 2027'}</span>
              {daysRemaining > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7]">
                  {daysRemaining}d left
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif truncate">
              {currentExam.name ? `${currentExam.name.toUpperCase()} – BATCH` : 'FAST REVISION BATCH – 2026'}
            </h1>

            <div className="flex items-center gap-3 text-xs font-mono font-semibold text-[#85877E] dark:text-[#787C99] pt-0.5">
              <span>{currentExam.subjects.length} Subjects</span>
              <span>•</span>
              <span>{totalTopicsCount} Total Topics</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{overallPercentage}% Mastered</span>
            </div>
          </div>
        </div>

        {/* Quick Add Custom Topic Action */}
        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Custom Topic</span>
        </button>
      </div>

      {/* 2. PORTAL CONTENT CONTAINER (Matches Reference Content Tab & Search Layout) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-5">
        
        {/* Content Navigation Tab Bar & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#292E42]">
          
          {/* Active "Content" Tab Indicator */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('content')}
              className="pb-2 text-sm font-extrabold text-[#11120F] dark:text-[#C0CAF5] border-b-2 border-[#596B35] dark:border-[#7AA2F7] cursor-pointer transition-colors relative"
            >
              <span>Content</span>
            </button>
          </div>

          {/* Search Content Input */}
          <div className="relative flex-1 max-w-full sm:max-w-xs flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search content..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Search
            </button>
          </div>
        </div>

        {/* 3. DYNAMIC SUBJECT CARDS LIST (Exact Layout from Reference Image) */}
        <div className="space-y-3">
          {filteredSubjects.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#F7F6F0]/50 dark:bg-[#1F2335]/50 border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-[#191A17] dark:text-[#C0CAF5]">No subjects match your search</h4>
              <p className="text-xs text-[#85877E]">Try searching with a different keyword.</p>
            </div>
          ) : (
            filteredSubjects.map(subject => {
              const badgeStyle = getSubjectBadgeStyle(subject.name);
              const subjectTotalTopics = subject.chapters.reduce((a, c) => a + c.topics.length, 0);
              const subjectCompletedTopics = subject.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === 'completed').length, 0);
              const percent = subjectTotalTopics > 0 ? Math.round((subjectCompletedTopics / subjectTotalTopics) * 100) : 0;

              return (
                <div
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject.id)}
                  className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1F2335] hover:bg-[#F7F6F0]/80 dark:hover:bg-[#24283B] border border-[#D8D8CF]/80 dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 cursor-pointer shadow-xs group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    
                    {/* Left Dark Stylized Thumbnail Badge (e.g. GK, MATHS, REASONING, ENGLISH) */}
                    <div className={`w-16 sm:w-20 h-10 sm:h-12 rounded-xl flex items-center justify-center font-black font-serif text-xs sm:text-sm shrink-0 tracking-wider transition-transform group-hover:scale-105 ${badgeStyle.containerClass}`}>
                      <span>{badgeStyle.badgeText}</span>
                    </div>

                    {/* Subject Title & File/Topic Meta */}
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-extrabold text-[#11120F] dark:text-[#C0CAF5] uppercase tracking-wide group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors font-serif truncate">
                        {subject.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[#65675F] dark:text-[#A9B1D6] mt-0.5">
                        <span>📄 {subject.chapters.length} chapters • {subjectTotalTopics} files</span>
                        {subjectCompletedTopics > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">• {subjectCompletedTopics} mastered</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Progress Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                      percent === 100
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : percent > 0
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-[#F7F6F0] dark:bg-[#16161E] text-slate-600 dark:text-slate-400 border border-[#D8D8CF] dark:border-[#292E42]'
                    }`}>
                      {percent}%
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
