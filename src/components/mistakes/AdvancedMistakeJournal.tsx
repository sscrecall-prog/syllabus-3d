import React, { useState, useMemo } from 'react';
import { MistakeRecord, MistakeType, Topic } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Search,
  BookOpen,
  Zap,
  Trash2,
  Edit3,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  Brain,
  Calculator,
  Compass,
  Eye,
  Clock,
  ShieldAlert,
  ArrowRight,
  RotateCw,
  X,
  Check
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
        return { label: 'Conceptual Trap', icon: Brain, color: 'text-[#B94A48] bg-[#B94A48]/10 border-[#B94A48]/30' };
      case 'calculation':
        return { label: 'Calculation Slip', icon: Calculator, color: 'text-[#C49A3A] bg-[#C49A3A]/10 border-[#C49A3A]/30' };
      case 'formula':
        return { label: 'Formula Error', icon: Compass, color: 'text-[#596B35] bg-[#596B35]/10 border-[#596B35]/30' };
      case 'silly':
        return { label: 'Silly / Reading Trap', icon: Eye, color: 'text-[#3A3F33] dark:text-[#A1A1AA] bg-[#EEEEE8] dark:bg-[#23232A] border-[#D8D8CF] dark:border-[#272730]' };
      case 'time_pressure':
        return { label: 'Time Pressure Trap', icon: Clock, color: 'text-[#8C773E] bg-[#8C773E]/10 border-[#8C773E]/30' };
      default:
        return { label: 'Exam Trap', icon: AlertTriangle, color: 'text-[#596B35] bg-[#596B35]/10 border-[#596B35]/30' };
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header & KPI Metrics */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#B94A48]/15 text-[#B94A48] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#11120F] dark:text-[#F5F5F7] font-serif">
                Mistake & Examiner Trap Journal
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                Turn recurring test traps into permanent conceptual reflexes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {mistakes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setCurrentFlashcardIndex(0);
                  setIsRevealed(false);
                  setIsFlashcardOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 hover:bg-[#596B35] hover:text-white text-[#354126] dark:text-[#F5F5F7] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flashcard Mode</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Trap</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-center">
            <span className="text-[10px] font-bold text-[#85877E] uppercase block font-mono">Total Logged</span>
            <span className="text-base sm:text-lg font-extrabold text-[#11120F] dark:text-[#F5F5F7] font-mono mt-0.5 block">
              {mistakes.length}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-center">
            <span className="text-[10px] font-bold text-[#B94A48] uppercase block font-mono">Active Traps</span>
            <span className="text-base sm:text-lg font-extrabold text-[#B94A48] font-mono mt-0.5 block">
              {activeCount}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-center">
            <span className="text-[10px] font-bold text-[#4F7A45] uppercase block font-mono">Resolution Rate</span>
            <span className="text-base sm:text-lg font-extrabold text-[#4F7A45] font-mono mt-0.5 block">
              {resolutionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#85877E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search traps, golden rules, examiner tricks..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `All (${mistakes.length})` },
            { id: 'unresolved', label: `🔴 Active (${activeCount})` },
            { id: 'resolved', label: `🟢 Mastered (${resolvedCount})` },
            { id: 'conceptual', label: 'Conceptual' },
            { id: 'calculation', label: 'Calculation' },
            { id: 'formula', label: 'Formula' },
            { id: 'silly', label: 'Silly Trap' },
            { id: 'time_pressure', label: 'Time Crunch' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => {
                soundManager.playClick();
                setFilterType(chip.id as any);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                filterType === chip.id
                  ? 'bg-[#11120F] text-white border-transparent'
                  : 'bg-white dark:bg-[#18181D] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mistakes List */}
      <div className="space-y-3">
        {filteredMistakes.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#18181D] border border-dashed border-[#D8D8CF] dark:border-[#272730] text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#EEEEE8] dark:bg-[#23232A] text-[#596B35] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] font-serif">
              {searchTerm || filterType !== 'all' ? 'No traps match your filter' : 'No mistakes logged yet'}
            </h4>
            <p className="text-[11px] text-[#85877E] max-w-xs mx-auto">
              When solving mocks, log question traps, wrong logic, and golden rules here.
            </p>
          </div>
        ) : (
          filteredMistakes.map(m => {
            const typeMeta = getTypeMeta(m.mistakeType);
            const Icon = typeMeta.icon;

            return (
              <div
                key={m.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-subtle-depth space-y-3.5 ${
                  m.resolved
                    ? 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#4F7A45]/40 opacity-85'
                    : 'bg-white dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#EEEEE8] dark:border-[#1D201A]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 font-mono ${typeMeta.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{typeMeta.label}</span>
                    </span>

                    {m.severity && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase ${
                        m.severity === 'high'
                          ? 'bg-[#B94A48]/15 text-[#B94A48]'
                          : m.severity === 'medium'
                          ? 'bg-[#C49A3A]/15 text-[#C49A3A]'
                          : 'bg-[#4F7A45]/15 text-[#4F7A45]'
                      }`}>
                        {m.severity} Risk
                      </span>
                    )}

                    {m.mockSource && (
                      <span className="text-[10px] font-bold text-[#85877E] bg-[#EEEEE8] dark:bg-[#23232A] px-2 py-0.5 rounded font-mono">
                        {m.mockSource}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-[#85877E] font-mono">
                    {m.dateLogged}
                  </span>
                </div>

                {/* Problem Statement */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#85877E] uppercase tracking-wider font-mono block">
                    Question / Problem Trap
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] leading-relaxed">
                    {m.questionDescription}
                  </p>
                </div>

                {/* Wrong Logic & Examiner Trap Layer */}
                {(m.wrongLogic || m.examinerTrap) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {m.wrongLogic && (
                      <div className="p-3 rounded-xl bg-[#B94A48]/5 border border-[#B94A48]/20 space-y-1">
                        <span className="text-[10px] font-bold text-[#B94A48] flex items-center gap-1 font-mono uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>My Wrong Logic / Fallacy</span>
                        </span>
                        <p className="text-xs text-[#191A17] dark:text-[#F5F5F7]">
                          {m.wrongLogic}
                        </p>
                      </div>
                    )}

                    {m.examinerTrap && (
                      <div className="p-3 rounded-xl bg-[#C49A3A]/5 border border-[#C49A3A]/20 space-y-1">
                        <span className="text-[10px] font-bold text-[#C49A3A] flex items-center gap-1 font-mono uppercase">
                          <AlertTriangle className="w-3 h-3" />
                          <span>The Examiner's Trap Mechanism</span>
                        </span>
                        <p className="text-xs text-[#191A17] dark:text-[#F5F5F7]">
                          {m.examinerTrap}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Correct Approach & Golden Rule */}
                <div className="p-3.5 rounded-xl bg-[#DCE8B7]/30 dark:bg-[#8B5CF6]/20/30 border border-[#596B35]/30 space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#596B35] dark:text-[#8B5CF6] flex items-center gap-1 font-mono uppercase">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Correct Approach & Solution</span>
                    </span>
                    <p className="text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] whitespace-pre-line leading-relaxed">
                      {m.correctApproach}
                    </p>
                  </div>

                  {m.goldenRule && (
                    <div className="pt-2 border-t border-[#596B35]/20 flex items-start gap-2 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#596B35] dark:text-[#8B5CF6] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#596B35] dark:text-[#8B5CF6] font-mono text-[10px] uppercase">Golden Rule: </span>
                        <span className="font-bold text-[#11120F] dark:text-white font-serif">{m.goldenRule}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      m.resolved
                        ? 'bg-[#4F7A45] text-white shadow-sm'
                        : 'bg-[#EEEEE8] dark:bg-[#23232A] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20'
                    }`}
                  >
                    {m.resolved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{m.resolved ? 'Mastered & Resolved' : 'Mark Resolved'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 rounded-lg text-[#85877E] hover:text-[#596B35] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] cursor-pointer"
                      title="Edit Trap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMistake(m.id)}
                      className="p-1.5 rounded-lg text-[#85877E] hover:text-[#B94A48] hover:bg-rose-500/10 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF] dark:border-[#272730]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#596B35] text-white flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#11120F] dark:text-[#F5F5F7] font-serif">
                    {editingMistakeId ? 'Edit Examiner Trap' : 'Log New Exam Trap & Fallacy'}
                  </h3>
                  <p className="text-[10px] text-[#65675F] dark:text-[#85877E]">
                    {topic.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-[#85877E] hover:text-[#11120F] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMistake} className="space-y-3.5">
              
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#85877E] uppercase font-mono">
                  Trap Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'conceptual', label: 'Conceptual' },
                    { id: 'calculation', label: 'Calculation' },
                    { id: 'formula', label: 'Formula Error' },
                    { id: 'silly', label: 'Silly Trap' },
                    { id: 'time_pressure', label: 'Time Crunch' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMistakeType(t.id as MistakeType)}
                      className={`p-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-colors ${
                        mistakeType === t.id
                          ? 'bg-[#11120F] text-white border-transparent'
                          : 'bg-white dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity & Mock Source Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#85877E] uppercase font-mono">
                    Trap Severity
                  </label>
                  <div className="flex gap-2">
                    {(['high', 'medium', 'low'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize border cursor-pointer ${
                          severity === sev
                            ? 'bg-[#596B35] text-white border-transparent'
                            : 'bg-white dark:bg-[#23232A] border-[#D8D8CF] dark:border-[#272730] text-[#65675F]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#85877E] uppercase font-mono">
                    Mock / Exam Source
                  </label>
                  <input
                    type="text"
                    value={mockSource}
                    onChange={e => setMockSource(e.target.value)}
                    placeholder="e.g. Mock #05 Q.24"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
                  />
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#191A17] dark:text-[#F5F5F7]">
                  Question / Problem Statement *
                </label>
                <textarea
                  value={questionDesc}
                  onChange={e => setQuestionDesc(e.target.value)}
                  placeholder="Describe the exact question or problem where error occurred..."
                  rows={2}
                  required
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
                />
              </div>

              {/* Wrong Logic & Examiner Trap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#B94A48]">
                    My Wrong Logic (Fallacy)
                  </label>
                  <textarea
                    value={wrongLogic}
                    onChange={e => setWrongLogic(e.target.value)}
                    placeholder="What false assumption did you make?"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#23232A] border border-[#B94A48]/30 text-xs font-medium text-[#191A17] dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#C49A3A]">
                    Examiner's Trap Mechanism
                  </label>
                  <textarea
                    value={examinerTrap}
                    onChange={e => setExaminerTrap(e.target.value)}
                    placeholder="How was the question engineered to trick?"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#23232A] border border-[#C49A3A]/30 text-xs font-medium text-[#191A17] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Correct Approach & Solution */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#596B35] dark:text-[#8B5CF6]">
                  Correct Approach & Method *
                </label>
                <textarea
                  value={correctApproach}
                  onChange={e => setCorrectApproach(e.target.value)}
                  placeholder="Step-by-step correct derivation or conceptual key..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#23232A] border border-[#596B35]/40 text-xs font-medium text-[#191A17] dark:text-white focus:outline-none"
                />
              </div>

              {/* Golden Rule / Flashcard Key */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#191A17] dark:text-[#F5F5F7] flex items-center gap-1 font-mono uppercase">
                  <Sparkles className="w-3 h-3 text-[#596B35]" />
                  <span>Golden Rule Takeaway (1-liner memory anchor)</span>
                </label>
                <input
                  type="text"
                  value={goldenRule}
                  onChange={e => setGoldenRule(e.target.value)}
                  placeholder="e.g. Always convert km/hr to m/s by 5/18 before distance formulas!"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
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
          <div className="w-full max-w-md rounded-3xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-2xl p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#D8D8CF] dark:border-[#272730]">
              <span className="text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] font-mono">
                Flashcard {currentFlashcardIndex + 1} of {mistakes.length}
              </span>
              <button
                onClick={() => setIsFlashcardOpen(false)}
                className="p-1 rounded-lg text-[#85877E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flashcard Content */}
            <div className="min-h-[220px] p-5 rounded-2xl bg-white dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#B94A48]/15 text-[#B94A48] font-mono uppercase">
                  {mistakes[currentFlashcardIndex].mistakeType} Trap
                </span>
                <p className="text-sm font-bold text-[#191A17] dark:text-[#F5F5F7]">
                  {mistakes[currentFlashcardIndex].questionDescription}
                </p>

                {mistakes[currentFlashcardIndex].examinerTrap && (
                  <p className="text-xs text-[#C49A3A] font-medium italic">
                    Trap clue: {mistakes[currentFlashcardIndex].examinerTrap}
                  </p>
                )}
              </div>

              {isRevealed ? (
                <div className="p-3 rounded-xl bg-[#DCE8B7]/40 dark:bg-[#8B5CF6]/20/40 border border-[#596B35]/40 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-[#596B35] dark:text-[#8B5CF6] font-mono uppercase block">
                    ✓ Golden Solution & Rule:
                  </span>
                  <p className="text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] whitespace-pre-line">
                    {mistakes[currentFlashcardIndex].correctApproach}
                  </p>
                  {mistakes[currentFlashcardIndex].goldenRule && (
                    <p className="text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] font-serif pt-1 border-t border-[#596B35]/20">
                      ★ {mistakes[currentFlashcardIndex].goldenRule}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-3 rounded-xl bg-[#EEEEE8] dark:bg-[#18181D] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20 text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] border border-dashed border-[#596B35]/40 transition-colors cursor-pointer text-center"
                >
                  🔍 Click to Reveal Golden Solution
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] disabled:opacity-30 cursor-pointer"
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
                className="px-6 py-2 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {currentFlashcardIndex < mistakes.length - 1 ? 'Next Trap ➔' : 'Finish Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
