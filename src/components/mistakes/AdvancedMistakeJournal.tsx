import React, { useState, useMemo } from 'react';
import { MistakeRecord, MistakeType, Topic } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Trash2,
  Edit3,
  Brain,
  Calculator,
  Compass,
  Eye,
  Clock,
  ShieldAlert,
  RotateCw,
  X,
  Check,
  Flame,
  Layers,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface AdvancedMistakeJournalProps {
  topic: Topic;
  subjectName?: string;
  chapterName?: string;
}

export const AdvancedMistakeJournal: React.FC<AdvancedMistakeJournalProps> = ({
  topic,
  subjectName,
  chapterName
}) => {
  const {
    addTopicMistake,
    resolveTopicMistake,
    deleteTopicMistake,
    editTopicMistake
  } = useSyllabus();

  const mistakes = topic.mistakes || [];

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMistakeId, setEditingMistakeId] = useState<string | null>(null);

  // Form Fields
  const [questionDesc, setQuestionDesc] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType>('conceptual');
  const [severity, setSeverity] = useState<'high' | 'medium' | 'low'>('high');
  const [mockSource, setMockSource] = useState('');
  const [wrongLogic, setWrongLogic] = useState('');
  const [examinerTrap, setExaminerTrap] = useState('');
  const [correctApproach, setCorrectApproach] = useState('');
  const [goldenRule, setGoldenRule] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MistakeType | 'all' | 'unresolved' | 'resolved'>('all');

  // Flashcard Review Mode
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const resetForm = () => {
    setQuestionDesc('');
    setMistakeType('conceptual');
    setSeverity('high');
    setMockSource('');
    setWrongLogic('');
    setExaminerTrap('');
    setCorrectApproach('');
    setGoldenRule('');
    setEditingMistakeId(null);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    soundManager.playClick();
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: MistakeRecord) => {
    soundManager.playClick();
    setEditingMistakeId(m.id);
    setQuestionDesc(m.questionDescription);
    setMistakeType(m.mistakeType);
    setSeverity(m.severity || 'medium');
    setMockSource(m.mockSource || '');
    setWrongLogic(m.wrongLogic || '');
    setExaminerTrap(m.examinerTrap || '');
    setCorrectApproach(m.correctApproach);
    setGoldenRule(m.goldenRule || '');
    setIsFormOpen(true);
  };

  const handleApplyTemplate = (type: 'unit' | 'percent_base' | 'negative_wording' | 'formula_sign') => {
    soundManager.playClick();
    resetForm();
    if (type === 'unit') {
      setQuestionDesc('Unit Mismatch Trap: Speed in km/h vs time in seconds, or interest time given in months instead of years.');
      setMistakeType('calculation');
      setSeverity('high');
      setMockSource('Mock Practice');
      setWrongLogic('Multiplied values directly without normalizing all units to the standard MKS or SI unit system.');
      setExaminerTrap('Examiner provided rate per annum but time period in months (e.g. 9 months), anticipating omission of dividing by 12.');
      setCorrectApproach('Step 1: Always check units first.\nStep 2: Convert time = 9/12 = 3/4 years before applying Simple Interest formula (SI = P × R × T / 100).');
      setGoldenRule('UNIT FIRST RULE: Always convert units (km/h → m/s, months → years) BEFORE applying formulas!');
    } else if (type === 'percent_base') {
      setQuestionDesc('Base Value Shift Trap: Percentage increase followed by percentage decrease on a changing base.');
      setMistakeType('conceptual');
      setSeverity('high');
      setMockSource('PYQ Pattern');
      setWrongLogic('Assumed base remains constant and subtracted the percentages directly (e.g., +20% then -20% = 0%).');
      setExaminerTrap('Tricked into thinking reciprocal percentages cancel each other out.');
      setCorrectApproach('Use successive percentage formula: Net % change = x + y + (xy / 100), or use fraction multipliers (100 → 120 → 96 = -4% net loss).');
      setGoldenRule('BASE SHIFT RULE: Successive % changes never cancel out directly — base changes at each step!');
    } else if (type === 'negative_wording') {
      setQuestionDesc('Negative Questioning Trap: Overlooking "NOT true", "EXCEPT", or "INCORRECT" in the question stem.');
      setMistakeType('silly');
      setSeverity('high');
      setMockSource('Test Series');
      setWrongLogic('Read the question too fast under time pressure, picked the first true statement (Option A).');
      setExaminerTrap('Placed an obviously true fact as Option A to trap hasty test-takers who missed "Which of the following is NOT correct?".');
      setCorrectApproach('Circle or highlight negative words in the question stem before looking at options.');
      setGoldenRule('SLOW THE SCAN: Circle "NOT", "INCORRECT", "FALSE" immediately — never jump to Option A!');
    } else if (type === 'formula_sign') {
      setQuestionDesc('Formula Sign / Algebraic Inversion Trap: Confusion between positive and negative signs in algebraic or interest formulas.');
      setMistakeType('formula');
      setSeverity('medium');
      setMockSource('Mock Exam');
      setWrongLogic('Reversed positive and negative signs during rapid algebraic manipulation.');
      setExaminerTrap('Offered the inverted sign result as one of the distractor options.');
      setCorrectApproach('Write the standard formula in one clean line before substituting values.');
      setGoldenRule('SIGN INTEGRITY: Check signs on paper before mental calculation!');
    }
    setIsFormOpen(true);
  };

  const handleSaveMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionDesc.trim() || !correctApproach.trim()) return;

    if (editingMistakeId) {
      if (editTopicMistake) {
        editTopicMistake(topic.id, editingMistakeId, {
          questionDescription: questionDesc,
          mistakeType,
          severity,
          mockSource,
          wrongLogic,
          examinerTrap,
          correctApproach,
          goldenRule
        });
      }
      soundManager.playClick();
    } else {
      addTopicMistake(topic.id, {
        questionDescription: questionDesc,
        mistakeType,
        severity,
        mockSource,
        wrongLogic,
        examinerTrap,
        correctApproach,
        goldenRule
      } as any);
      soundManager.playCompleteChime();
    }

    resetForm();
  };

  const handleToggleResolve = (m: MistakeRecord) => {
    if (!m.resolved) {
      soundManager.playCompleteChime();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      resolveTopicMistake(topic.id, m.id);
    } else {
      soundManager.playClick();
      if (editTopicMistake) {
        editTopicMistake(topic.id, m.id, { resolved: false });
      }
    }
  };

  const handleDeleteMistake = (id: string) => {
    soundManager.playClick();
    if (deleteTopicMistake) {
      deleteTopicMistake(topic.id, id);
    }
  };

  // Filtered Mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      const matchesSearch =
        m.questionDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.examinerTrap && m.examinerTrap.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.goldenRule && m.goldenRule.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.correctApproach.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'unresolved') return !m.resolved;
      if (filterType === 'resolved') return m.resolved;
      if (filterType !== 'all') return m.mistakeType === filterType;
      return true;
    });
  }, [mistakes, searchTerm, filterType]);

  const activeCount = mistakes.filter(m => !m.resolved).length;
  const resolvedCount = mistakes.filter(m => m.resolved).length;
  const resolutionRate = mistakes.length > 0 ? Math.round((resolvedCount / mistakes.length) * 100) : 0;

  const getTypeMeta = (type: MistakeType) => {
    switch (type) {
      case 'conceptual':
        return {
          label: 'Conceptual Trap',
          icon: Brain,
          color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      case 'calculation':
        return {
          label: 'Calculation Slip',
          icon: Calculator,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'formula':
        return {
          label: 'Formula Error',
          icon: Compass,
          color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30'
        };
      case 'silly':
        return {
          label: 'Silly / Reading Trap',
          icon: Eye,
          color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30'
        };
      case 'time_pressure':
        return {
          label: 'Time Crunch Trap',
          icon: Clock,
          color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30'
        };
      default:
        return {
          label: 'Exam Trap',
          icon: AlertTriangle,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
        };
    }
  };

  const filterChips = [
    { id: 'all' as const, label: 'All', count: mistakes.length, icon: Layers },
    { id: 'unresolved' as const, label: 'Active', count: activeCount, icon: AlertCircle },
    { id: 'resolved' as const, label: 'Mastered', count: resolvedCount, icon: CheckCircle2 },
    { id: 'conceptual' as const, label: 'Conceptual', count: mistakes.filter(m => m.mistakeType === 'conceptual').length, icon: Brain },
    { id: 'calculation' as const, label: 'Calculation', count: mistakes.filter(m => m.mistakeType === 'calculation').length, icon: Calculator },
    { id: 'formula' as const, label: 'Formula', count: mistakes.filter(m => m.mistakeType === 'formula').length, icon: Compass },
    { id: 'silly' as const, label: 'Silly Trap', count: mistakes.filter(m => m.mistakeType === 'silly').length, icon: Eye },
    { id: 'time_pressure' as const, label: 'Time Crunch', count: mistakes.filter(m => m.mistakeType === 'time_pressure').length, icon: Clock },
  ];

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header & KPI Metrics Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#2F3146] shadow-subtle-depth space-y-4 relative overflow-hidden">
        {/* Glowing Top Ambient Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {/* 3D Radiant Squircle Emblem */}
            <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500/25 via-red-500/15 to-amber-500/10 border border-rose-500/35 text-rose-500 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#11120F] dark:text-white tracking-tight uppercase">
                  Mistake & Examiner Trap Journal
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <Flame className="w-3 h-3" /> Reflex Vault
                </span>
              </div>
              <p className="text-xs text-[#65675F] dark:text-[#CBD5E1] font-medium leading-tight">
                Turn recurring test traps and conceptual fallacies into permanent reflexes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {mistakes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setCurrentFlashcardIndex(0);
                  setIsRevealed(false);
                  setIsFlashcardOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#1E2032] hover:bg-[#11120F] hover:text-white dark:hover:bg-white dark:hover:text-black text-[#191A17] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#33364D] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flashcard Review</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white hover:bg-rose-600 dark:hover:bg-rose-400 text-white dark:text-black text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Trap</span>
            </button>
          </div>
        </div>

        {/* 3 Executive Bento Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          {/* Total Logged */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] shadow-2xs space-y-1 transition-all hover:border-[#2563EB] dark:hover:border-[#7AA2F7]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold text-[#65675F] dark:text-[#CBD5E1]">
                Total Logged
              </span>
              <Layers className="w-3.5 h-3.5 text-[#85877E] dark:text-[#94A3B8]" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#11120F] dark:text-white tracking-tight">
              {mistakes.length}
            </div>
            <div className="text-[10px] font-mono text-[#85877E] dark:text-[#94A3B8] truncate">
              {mistakes.length === 1 ? '1 recorded trap' : `${mistakes.length} recorded traps`}
            </div>
          </div>

          {/* Active Traps */}
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-950/25 border border-rose-500/20 dark:border-rose-500/35 shadow-2xs space-y-1 transition-all hover:border-rose-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                Active Traps
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 tracking-tight">
              {activeCount}
            </div>
            <div className="text-[10px] font-mono text-rose-600/80 dark:text-rose-400/80 truncate">
              {activeCount === 0 ? 'All traps mastered ✓' : 'Needs reinforcement'}
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/25 border border-emerald-500/20 dark:border-emerald-500/35 shadow-2xs space-y-1 transition-all hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                Resolution Rate
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
              {resolutionRate}%
            </div>
            <div className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 truncate">
              {resolvedCount} of {mistakes.length} mastered
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#85877E] dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search traps, golden rules, examiner tricks, mock source..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#2F3146] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/15 shadow-2xs transition-all"
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

        {/* Filter Chips (Zero Raw Emojis, Pure Lucide Icons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {filterChips.map(chip => {
            const ChipIcon = chip.icon;
            const isSelected = filterType === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  soundManager.playClick();
                  setFilterType(chip.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                    : 'bg-white dark:bg-[#181A28] text-[#45474E] dark:text-[#E2E8F0] border-[#E2E8F0] dark:border-[#2F3146] hover:border-rose-400 dark:hover:border-rose-400'
                }`}
              >
                <ChipIcon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                  isSelected
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                    : 'bg-[#EEEEE8] dark:bg-[#202234] text-[#85877E] dark:text-slate-200 border border-transparent dark:border-[#383A52]'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mistakes List / Empty State */}
      <div className="space-y-3">
        {filteredMistakes.length === 0 ? (
          <div className="py-10 px-4 sm:px-6 rounded-3xl bg-white dark:bg-[#181A28] border border-dashed border-[#E2E8F0] dark:border-[#2F3146] text-center space-y-4 flex flex-col items-center justify-center">
            {/* 3D Radiant Emblem */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-indigo-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                <ShieldAlert className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#11120F] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <h4 className="text-sm sm:text-base font-black text-[#11120F] dark:text-white tracking-tight">
                {searchTerm || filterType !== 'all' ? 'No traps match your filter' : 'No Examiner Traps Logged Yet'}
              </h4>
              <p className="text-xs text-[#65675F] dark:text-[#CBD5E1] leading-relaxed">
                {searchTerm || filterType !== 'all'
                  ? 'Try searching with a different keyword or reset the filter to view all logged traps.'
                  : 'Turn negative marks into guaranteed points. When practicing mocks, log question traps, wrong logic, and golden rules here.'}
              </p>
            </div>

            {searchTerm || filterType !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-xs font-bold text-[#11120F] dark:text-white hover:border-rose-400 cursor-pointer transition-all shadow-2xs"
              >
                Clear Search & Filters
              </button>
            ) : (
              <div className="w-full max-w-md space-y-3.5 pt-1">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 rounded-xl bg-[#11120F] dark:bg-white hover:bg-rose-600 dark:hover:bg-rose-400 text-white dark:text-black font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Log Your First Exam Trap</span>
                </button>

                {/* 1-Click Trap Templates */}
                <div className="pt-3 border-t border-[#EEEEE8] dark:border-[#27293D] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#85877E] dark:text-[#94A3B8] block text-center">
                    ⚡ Quick 1-Click Starter Inspirations:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('unit')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-[11px] font-bold text-[#11120F] dark:text-[#E2E8F0] hover:border-rose-400 hover:text-rose-500 transition-all cursor-pointer shadow-2xs"
                    >
                      📐 Unit Mismatch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('percent_base')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-[11px] font-bold text-[#11120F] dark:text-[#E2E8F0] hover:border-amber-400 hover:text-amber-500 transition-all cursor-pointer shadow-2xs"
                    >
                      📊 Base Shift Trap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('negative_wording')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-[11px] font-bold text-[#11120F] dark:text-[#E2E8F0] hover:border-purple-400 hover:text-purple-500 transition-all cursor-pointer shadow-2xs"
                    >
                      🔍 "NOT Correct" Stem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('formula_sign')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-[11px] font-bold text-[#11120F] dark:text-[#E2E8F0] hover:border-sky-400 hover:text-sky-500 transition-all cursor-pointer shadow-2xs"
                    >
                      ➕ Sign Inversion
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredMistakes.map(m => {
            const typeMeta = getTypeMeta(m.mistakeType);
            const Icon = typeMeta.icon;
            const accentColor = m.severity === 'high' ? '#EF4444' : m.severity === 'medium' ? '#F59E0B' : '#10B981';

            return (
              <div
                key={m.id}
                className={`group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 shadow-subtle-depth space-y-3.5 overflow-hidden ${
                  m.resolved
                    ? 'bg-[#F8FAFC] dark:bg-[#181A28]/80 border-emerald-500/40 opacity-90'
                    : 'bg-white dark:bg-[#181A28] border-[#E2E8F0] dark:border-[#2F3146] hover:border-rose-500/50 shadow-xs hover:shadow-lg'
                }`}
              >
                {/* Subtle Top Glow Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                  }}
                />

                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-[#EEEEE8] dark:border-[#26283D]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 font-mono ${typeMeta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{typeMeta.label}</span>
                    </span>

                    {m.severity && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider border ${
                        m.severity === 'high'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : m.severity === 'medium'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}>
                        {m.severity} Risk
                      </span>
                    )}

                    {m.mockSource && (
                      <span className="text-[10px] font-bold text-[#65675F] dark:text-[#CBD5E1] bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] px-2 py-0.5 rounded-md font-mono">
                        {m.mockSource}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#85877E] dark:text-[#94A3B8] font-mono tabular-nums">
                    {m.dateLogged}
                  </span>
                </div>

                {/* Problem Statement */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#85877E] dark:text-[#94A3B8] uppercase tracking-wider font-mono flex items-center gap-1">
                    <span>Question / Problem Statement</span>
                  </span>
                  <p className="text-xs sm:text-sm font-black text-[#11120F] dark:text-white leading-relaxed">
                    {m.questionDescription}
                  </p>
                </div>

                {/* Wrong Logic & Examiner Trap Layer */}
                {(m.wrongLogic || m.examinerTrap) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {m.wrongLogic && (
                      <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-500/30 space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>My Wrong Logic (Fallacy)</span>
                        </span>
                        <p className="text-xs font-medium text-[#191A17] dark:text-[#E2E8F0] leading-relaxed">
                          {m.wrongLogic}
                        </p>
                      </div>
                    )}

                    {m.examinerTrap && (
                      <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-500/30 space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Examiner's Trap Mechanism</span>
                        </span>
                        <p className="text-xs font-medium text-[#191A17] dark:text-[#E2E8F0] leading-relaxed">
                          {m.examinerTrap}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Correct Approach & Golden Rule */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/25 dark:border-emerald-500/35 space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Correct Approach & Solution</span>
                    </span>
                    <p className="text-xs sm:text-[13px] font-semibold text-[#191A17] dark:text-[#F5F5F7] whitespace-pre-line leading-relaxed">
                      {m.correctApproach}
                    </p>
                  </div>

                  {m.goldenRule && (
                    <div className="pt-2.5 border-t border-emerald-500/20 dark:border-emerald-500/30 flex items-start gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px] uppercase tracking-wider">
                          Golden Rule:
                        </span>{' '}
                        <span className="font-black text-[#11120F] dark:text-white">
                          {m.goldenRule}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(m)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs ${
                      m.resolved
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : 'bg-[#F8FAFC] dark:bg-[#1E2032] text-[#191A17] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#33364D] hover:border-emerald-500 dark:hover:border-emerald-500'
                    }`}
                  >
                    {m.resolved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{m.resolved ? 'Mastered & Resolved ✓' : 'Mark Resolved'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-2 rounded-xl text-[#85877E] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                      title="Edit Trap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMistake(m.id)}
                      className="p-2 rounded-xl text-[#85877E] dark:text-[#CBD5E1] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Delete Trap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 4. ADD / EDIT MISTAKE MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#2F3146] shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEE8] dark:border-[#26283D]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/25 to-amber-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-white uppercase tracking-tight">
                    {editingMistakeId ? 'Edit Examiner Trap' : 'Log New Exam Trap & Fallacy'}
                  </h3>
                  <p className="text-[11px] text-[#65675F] dark:text-[#CBD5E1] font-medium">
                    {topic.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-[#85877E] dark:text-slate-300 hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMistake} className="space-y-4">
              
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#85877E] dark:text-[#CBD5E1] uppercase font-mono tracking-wider">
                  Trap Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'conceptual', label: 'Conceptual', icon: Brain },
                    { id: 'calculation', label: 'Calculation', icon: Calculator },
                    { id: 'formula', label: 'Formula Error', icon: Compass },
                    { id: 'silly', label: 'Silly Trap', icon: Eye },
                    { id: 'time_pressure', label: 'Time Crunch', icon: Clock }
                  ].map(t => {
                    const TIcon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMistakeType(t.id as MistakeType)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          mistakeType === t.id
                            ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                            : 'bg-[#F8FAFC] dark:bg-[#1E2032] text-[#65675F] dark:text-[#CBD5E1] border-[#E2E8F0] dark:border-[#33364D] hover:border-rose-400'
                        }`}
                      >
                        <TIcon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity & Mock Source Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#85877E] dark:text-[#CBD5E1] uppercase font-mono tracking-wider">
                    Trap Severity
                  </label>
                  <div className="flex gap-2">
                    {(['high', 'medium', 'low'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize border cursor-pointer transition-all ${
                          severity === sev
                            ? sev === 'high'
                              ? 'bg-rose-600 text-white border-transparent font-black shadow-xs'
                              : sev === 'medium'
                              ? 'bg-amber-600 text-white border-transparent font-black shadow-xs'
                              : 'bg-emerald-600 text-white border-transparent font-black shadow-xs'
                            : 'bg-[#F8FAFC] dark:bg-[#1E2032] border-[#E2E8F0] dark:border-[#33364D] text-[#65675F] dark:text-[#CBD5E1]'
                        }`}
                      >
                        {sev} Risk
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#85877E] dark:text-[#CBD5E1] uppercase font-mono tracking-wider">
                    Mock / Exam Source
                  </label>
                  <input
                    type="text"
                    value={mockSource}
                    onChange={e => setMockSource(e.target.value)}
                    placeholder="e.g. Testbook Mock #05 Q.24"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#11120F] dark:text-white uppercase font-mono tracking-wider">
                  Question / Problem Statement *
                </label>
                <textarea
                  value={questionDesc}
                  onChange={e => setQuestionDesc(e.target.value)}
                  placeholder="Describe the exact question, equation, or wording where the mistake occurred..."
                  rows={2}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Wrong Logic & Examiner Trap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono tracking-wider flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>My Wrong Logic (Fallacy)</span>
                  </label>
                  <textarea
                    value={wrongLogic}
                    onChange={e => setWrongLogic(e.target.value)}
                    placeholder="What false assumption or shortcut tripped you up?"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/25 dark:border-rose-500/35 text-xs font-medium text-[#11120F] dark:text-white placeholder-rose-400/60 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Examiner's Trap Mechanism</span>
                  </label>
                  <textarea
                    value={examinerTrap}
                    onChange={e => setExaminerTrap(e.target.value)}
                    placeholder="How was the question engineered to trick students?"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/25 dark:border-amber-500/35 text-xs font-medium text-[#11120F] dark:text-white placeholder-amber-400/60 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Correct Approach & Solution */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Correct Approach & Method *</span>
                </label>
                <textarea
                  value={correctApproach}
                  onChange={e => setCorrectApproach(e.target.value)}
                  placeholder="Step-by-step correct derivation or conceptual key..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/25 dark:border-emerald-500/35 text-xs font-medium text-[#11120F] dark:text-white placeholder-emerald-400/60 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Golden Rule / Flashcard Key */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#11120F] dark:text-white flex items-center gap-1 font-mono uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Golden Rule Takeaway (1-liner memory reflex)</span>
                </label>
                <input
                  type="text"
                  value={goldenRule}
                  onChange={e => setGoldenRule(e.target.value)}
                  placeholder="e.g. Always convert km/hr to m/s by 5/18 before applying distance formulas!"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] text-xs font-black text-[#11120F] dark:text-amber-300 placeholder-[#85877E] dark:placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEEEE8] dark:border-[#26283D]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#11120F] dark:bg-white hover:bg-rose-600 dark:hover:bg-rose-400 text-white dark:text-black text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  {editingMistakeId ? 'Update Trap' : 'Save Trap into Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 5. FLASHCARD REVIEW MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isFlashcardOpen && mistakes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#2F3146] shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EEEEE8] dark:border-[#26283D]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <RotateCw className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-[#11120F] dark:text-white font-mono uppercase">
                  Trap Flashcard {currentFlashcardIndex + 1} of {mistakes.length}
                </span>
              </div>
              <button
                onClick={() => setIsFlashcardOpen(false)}
                className="p-1 rounded-lg text-[#85877E] dark:text-slate-300 hover:text-[#11120F] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flashcard Content */}
            <div className="min-h-[240px] p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E2032] border border-[#E2E8F0] dark:border-[#33364D] flex flex-col justify-between space-y-3.5 shadow-2xs">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono uppercase tracking-wider">
                    {mistakes[currentFlashcardIndex].mistakeType} Trap
                  </span>
                  {mistakes[currentFlashcardIndex].mockSource && (
                    <span className="text-[10px] font-mono text-[#85877E] dark:text-[#94A3B8]">
                      {mistakes[currentFlashcardIndex].mockSource}
                    </span>
                  )}
                </div>

                <p className="text-sm font-black text-[#11120F] dark:text-white leading-relaxed">
                  {mistakes[currentFlashcardIndex].questionDescription}
                </p>

                {mistakes[currentFlashcardIndex].examinerTrap && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                    ⚠️ <span className="font-bold">Trap Mechanism:</span> {mistakes[currentFlashcardIndex].examinerTrap}
                  </div>
                )}
              </div>

              {isRevealed ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider block">
                    ✓ Golden Solution & Reflex:
                  </span>
                  <p className="text-xs font-semibold text-[#11120F] dark:text-[#E2E8F0] whitespace-pre-line leading-relaxed">
                    {mistakes[currentFlashcardIndex].correctApproach}
                  </p>
                  {mistakes[currentFlashcardIndex].goldenRule && (
                    <p className="text-xs font-black text-amber-600 dark:text-amber-300 pt-2 border-t border-emerald-500/20">
                      ★ Golden Rule: {mistakes[currentFlashcardIndex].goldenRule}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-3.5 rounded-xl bg-white dark:bg-[#181A28] hover:bg-rose-500/10 text-xs font-black text-rose-600 dark:text-rose-400 border border-dashed border-rose-500/40 transition-all cursor-pointer text-center shadow-2xs active:scale-95"
                >
                  🔍 Click to Reveal Golden Solution & Reflex
                </button>
              )}
            </div>

            {/* Next / Prev Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={currentFlashcardIndex === 0}
                onClick={() => {
                  soundManager.playClick();
                  setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
                  setIsRevealed(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  if (currentFlashcardIndex < mistakes.length - 1) {
                    setCurrentFlashcardIndex(prev => prev + 1);
                    setIsRevealed(false);
                  } else {
                    setIsFlashcardOpen(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#11120F] dark:bg-white hover:bg-rose-600 dark:hover:bg-rose-400 text-white dark:text-black text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                {currentFlashcardIndex < mistakes.length - 1 ? 'Next Trap ➔' : 'Finish Review ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

