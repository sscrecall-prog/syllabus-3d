import React, { useState, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  ShieldAlert,
  Brain,
  Calculator,
  Compass,
  Eye,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Search,
  Filter,
  ChevronRight,
  Check,
  Zap
} from 'lucide-react';
import { Topic, MistakeType } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

interface WeakTopicsViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenFocus?: (topicId?: string) => void;
}

type SeverityFilter = 'all' | 'critical' | 'moderate' | 'traps_only';

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({
  onOpenTopicDrawer,
  onOpenFocus
}) => {
  const { weakTopics, currentExam, updateTopicStatus } = useSyllabus();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedFallacy, setSelectedFallacy] = useState<MistakeType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fallacy breakdown metrics
  const fallacyStats = useMemo(() => {
    let conceptual = 0;
    let calculation = 0;
    let formula = 0;
    let silly = 0;
    let timePressure = 0;
    let totalTraps = 0;

    weakTopics.forEach(item => {
      item.topic.mistakes?.forEach(m => {
        totalTraps++;
        if (m.mistakeType === 'conceptual') conceptual++;
        else if (m.mistakeType === 'calculation') calculation++;
        else if (m.mistakeType === 'formula') formula++;
        else if (m.mistakeType === 'silly') silly++;
        else if (m.mistakeType === 'time_pressure') timePressure++;
      });
    });

    return { conceptual, calculation, formula, silly, timePressure, totalTraps };
  }, [weakTopics]);

  // Filtered Weak Topics
  const filteredWeakTopics = useMemo(() => {
    return weakTopics.filter(wt => {
      // 1. Subject Filter
      if (selectedSubject !== 'all' && wt.subjectName !== selectedSubject) {
        return false;
      }

      // 2. Fallacy Filter
      if (selectedFallacy !== 'all') {
        const hasFallacy = wt.topic.mistakes?.some(m => m.mistakeType === selectedFallacy);
        if (!hasFallacy) return false;
      }

      // 3. Severity Filter
      if (severityFilter === 'critical' && wt.topic.accuracy >= 50) return false;
      if (severityFilter === 'moderate' && (wt.topic.accuracy < 50 || wt.topic.accuracy >= 75)) return false;
      if (severityFilter === 'traps_only' && (!wt.topic.mistakes || wt.topic.mistakes.length === 0)) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = wt.topic.name.toLowerCase().includes(q);
        const matchesChapter = wt.chapterName.toLowerCase().includes(q);
        const matchesSubject = wt.subjectName.toLowerCase().includes(q);
        const matchesTrap = wt.topic.mistakes?.some(m =>
          (m.examinerTrap && m.examinerTrap.toLowerCase().includes(q)) ||
          (m.questionDescription && m.questionDescription.toLowerCase().includes(q)) ||
          (m.wrongLogic && m.wrongLogic.toLowerCase().includes(q))
        );
        if (!matchesName && !matchesChapter && !matchesSubject && !matchesTrap) return false;
      }

      return true;
    });
  }, [weakTopics, selectedSubject, selectedFallacy, severityFilter, searchQuery]);

  const handleMarkMastered = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    soundManager.playCompleteChime();
    updateTopicStatus(topicId, 'completed');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-5xl mx-auto font-sans select-none animate-fade-in">
      
      {/* 1. TOP HEADER DIAGNOSTICS BANNER WITH 3D CYBER CHESS TRAP MAZE BACKGROUND */}
      <div className="p-5 sm:p-7 rounded-[32px] bg-[#0A0B12] border border-[#272738] shadow-2xl relative overflow-hidden text-white space-y-4">
        
        {/* 3D Glowing Crystal Chess & Laser Trap Maze Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-right md:bg-right pointer-events-none opacity-85 mix-blend-screen scale-102 transition-transform duration-1000"
          style={{ backgroundImage: `url('/weak_traps_banner.png')` }}
        />

        {/* Multi-layered Glass Gradients for 100% Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B12] via-[#0A0B12]/85 md:via-[#0A0B12]/70 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B12]/85 via-transparent to-transparent pointer-events-none" />
        
        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/35 text-rose-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-serif uppercase tracking-tight drop-shadow-sm">
                  Weak Areas & Examiner Traps Diagnostics
                </h2>
              </div>
              <p className="text-xs text-[#C5C8D8]">
                Targeted mistake analytics to eliminate blindspots and convert errors into guaranteed marks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold backdrop-blur-md">
              <span>{weakTopics.length} Weak Topics</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold backdrop-blur-md">
              <span>{fallacyStats.totalTraps} Logged Traps</span>
            </div>
          </div>
        </div>

        {/* 2. ROOT-CAUSE FALLACY INTERACTIVE TILES */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#C5C8D8] uppercase tracking-wider font-mono">
              Root-Cause Fallacy Breakdown (Click to Filter)
            </span>
            {selectedFallacy !== 'all' && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedFallacy('all');
                }}
                className="text-[11px] font-bold text-[#7AA2F7] hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {[
              { id: 'conceptual' as MistakeType, label: 'Conceptual', count: fallacyStats.conceptual, color: 'text-rose-300 bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25', icon: Brain },
              { id: 'calculation' as MistakeType, label: 'Calculation', count: fallacyStats.calculation, color: 'text-amber-300 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25', icon: Calculator },
              { id: 'formula' as MistakeType, label: 'Formula', count: fallacyStats.formula, color: 'text-purple-300 bg-purple-500/15 border-purple-500/30 hover:bg-purple-500/25', icon: Compass },
              { id: 'silly' as MistakeType, label: 'Silly Traps', count: fallacyStats.silly, color: 'text-sky-300 bg-sky-500/15 border-sky-500/30 hover:bg-sky-500/25', icon: Eye },
              { id: 'time_pressure' as MistakeType, label: 'Time Crunch', count: fallacyStats.timePressure, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25', icon: Clock }
            ].map(tile => {
              const Icon = tile.icon;
              const isSelected = selectedFallacy === tile.id;
              return (
                <div
                  key={tile.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedFallacy(prev => (prev === tile.id ? 'all' : tile.id));
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border backdrop-blur-xl transition-all cursor-pointer text-center relative ${tile.color} ${
                    isSelected ? 'ring-2 ring-current shadow-lg scale-102 bg-white/20' : 'shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-black uppercase font-mono tracking-wider">
                      {tile.label}
                    </span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                    {tile.count}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SEARCH & SMART FILTERS */}
      <div className="space-y-2.5">
        
        {/* Search Bar + Severity Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85877E]" />
            <input
              type="text"
              placeholder="Search weak topics, chapters, or examiner trap keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] text-xs font-bold text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
            />
          </div>

          {/* Severity Pills */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-xs shrink-0 overflow-x-auto">
            {[
              { id: 'all' as SeverityFilter, label: 'All Weak' },
              { id: 'critical' as SeverityFilter, label: '🔴 Critical (<50%)' },
              { id: 'moderate' as SeverityFilter, label: '🟡 Moderate (50-70%)' },
              { id: 'traps_only' as SeverityFilter, label: '⚡ Has Traps' }
            ].map(sev => (
              <button
                key={sev.id}
                onClick={() => {
                  soundManager.playClick();
                  setSeverityFilter(sev.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  severityFilter === sev.id
                    ? 'bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                    : 'text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubject('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
              selectedSubject === 'all'
                ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] border-transparent shadow-xs'
                : 'bg-white dark:bg-[#16161E] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#24283B]'
            }`}
          >
            All Subjects ({weakTopics.length})
          </button>

          {currentExam?.subjects.map(s => {
            const count = weakTopics.filter(w => w.subjectName === s.name).length;
            const isSelected = selectedSubject === s.name;
            return (
              <button
                key={s.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSubject(s.name);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] border-transparent shadow-xs'
                    : 'bg-white dark:bg-[#16161E] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#24283B]'
                }`}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. WEAK TOPICS & TRAPS CARDS LIST */}
      <div className="space-y-3">
        {filteredWeakTopics.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#16161E] border border-dashed border-[#D8D8CF] dark:border-[#24283B] text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#C0CAF5] font-serif">
              Zero Weak Vulnerabilities Detected!
            </h4>
            <p className="text-xs text-[#65675F] dark:text-[#A9B1D6] max-w-md mx-auto">
              All topics in this filtered selection have high accuracy scores and no unresolved examiner traps.
            </p>
          </div>
        ) : (
          filteredWeakTopics.map(({ topic, subjectName, chapterName }) => {
            const accuracy = topic.accuracy || 0;
            const isCritical = accuracy < 50;
            const mistakes = topic.mistakes || [];
            const activeMistakes = mistakes.filter(m => !m.resolved);

            return (
              <div
                key={topic.id}
                onClick={() => onOpenTopicDrawer(topic, subjectName, chapterName)}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all shadow-subtle-depth space-y-3 cursor-pointer group active:scale-[0.99]"
              >
                {/* Top Row: Subject/Chapter Badge + Accuracy Pill + Mastered Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEEEE8] dark:border-[#24283B] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7]">
                      {subjectName}
                    </span>
                    <span className="text-[11px] font-bold text-[#65675F] dark:text-[#A9B1D6] truncate">
                      {chapterName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Accuracy Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 ${
                      isCritical
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{accuracy}% Accuracy</span>
                    </div>

                    {/* Quick Mark Mastered Button */}
                    <button
                      onClick={e => handleMarkMastered(e, topic.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                      title="Mark as Mastered"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mastered</span>
                    </button>
                  </div>
                </div>

                {/* Topic Title & Traps Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#C0CAF5] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-[#85877E] dark:text-[#787C99] flex items-center gap-2">
                      <span>Difficulty: {topic.difficulty || 'Medium'}</span>
                      <span>•</span>
                      <span>Weightage: {topic.weightage || 'High'}</span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {mistakes.length} Logged Traps ({activeMistakes.length} Active)
                      </span>
                    </p>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    {onOpenFocus && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          soundManager.playClick();
                          onOpenFocus(topic.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                        title="Start Deep Study Timer on this Topic"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Focus Drill</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-[#596B35] dark:text-[#7AA2F7] group-hover:translate-x-1 transition-transform">
                      <span>Inspect</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Logged Traps Snippet Box (if any) */}
                {mistakes.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#24283B] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#85877E] uppercase font-mono tracking-wider block">
                      ⚠️ Active Examiner Trap Notes:
                    </span>
                    {mistakes.slice(0, 2).map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#11120F] dark:text-[#C0CAF5]">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                          m.mistakeType === 'conceptual' ? 'bg-rose-500/20 text-rose-500' :
                          m.mistakeType === 'calculation' ? 'bg-amber-500/20 text-amber-500' :
                          m.mistakeType === 'formula' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {m.mistakeType}
                        </span>
                        <p className="line-clamp-1 italic text-[#65675F] dark:text-[#A9B1D6]">
                          "{m.examinerTrap || m.questionDescription || m.wrongLogic || 'Examiner trap logged during mock'}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

