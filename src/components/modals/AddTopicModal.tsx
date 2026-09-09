import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Plus,
  BookOpen,
  Layers,
  Check,
  FileText,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { DifficultyLevel } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubjectId?: string;
  initialChapterId?: string;
  defaultMode?: 'single' | 'bulk';
}

const PALETTE = [
  '#D4AF37', // Metallic Gold
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  initialSubjectId,
  initialChapterId,
  defaultMode = 'single'
}) => {
  const { currentExam, addMultipleCustomTopicsWithHierarchy } = useSyllabus();

  // Mode: Single Topic vs Bulk Multi-Topic (defaults to single for targeted topic creation)
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>(defaultMode);

  // Subject state
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PALETTE[0]);
  const [newSubjectIcon, setNewSubjectIcon] = useState('BookOpen');

  // Chapter state
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || '');
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  // Single Topic state
  const [singleTopicName, setSingleTopicName] = useState('');
  const [singleDifficulty, setSingleDifficulty] = useState<DifficultyLevel>('Medium');
  const [singleWeightage, setSingleWeightage] = useState('');
  const [singleSubtopicsText, setSingleSubtopicsText] = useState('');

  // Bulk Multi-Topic state (Line by line paste)
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [bulkDefaultDifficulty, setBulkDefaultDifficulty] = useState<DifficultyLevel>('Medium');

  const hasNoSubjects = !currentExam || currentExam.subjects.length === 0;

  // Initialize or update selection whenever modal opens or target props change
  useEffect(() => {
    if (!isOpen || !currentExam) return;

    if (hasNoSubjects) {
      setIsNewSubject(true);
      setIsNewChapter(true);
      setSelectedSubjectId('');
      setSelectedChapterId('');
      return;
    }

    // Determine target subject
    let targetSub = initialSubjectId
      ? currentExam.subjects.find(s => s.id === initialSubjectId)
      : null;
    if (!targetSub) {
      targetSub = currentExam.subjects.find(s => s.id === selectedSubjectId) || currentExam.subjects[0];
    }

    if (targetSub) {
      setSelectedSubjectId(targetSub.id);
      setIsNewSubject(false);

      // Determine target chapter
      let targetCh = initialChapterId
        ? targetSub.chapters.find(c => c.id === initialChapterId)
        : null;
      if (!targetCh && targetSub.chapters.length > 0) {
        targetCh = targetSub.chapters[0];
      }

      if (targetCh) {
        setSelectedChapterId(targetCh.id);
        setIsNewChapter(false);
      } else {
        setSelectedChapterId('');
        setIsNewChapter(true);
      }
    }
  }, [isOpen, initialSubjectId, initialChapterId, currentExam]);

  const subjectMatch = currentExam?.subjects.find(s => s.id === selectedSubjectId);
  const chapterMatch = subjectMatch?.chapters.find(c => c.id === selectedChapterId);

  const handleSelectSubject = (subId: string) => {
    setSelectedSubjectId(subId);
    setIsNewSubject(false);
    const sub = currentExam?.subjects.find(s => s.id === subId);
    if (sub && sub.chapters.length > 0) {
      setSelectedChapterId(sub.chapters[0].id);
      setIsNewChapter(false);
    } else {
      setSelectedChapterId('');
      setIsNewChapter(true);
    }
  };

  if (!isOpen || !currentExam) return null;

  // Parse bulk text into array of topics
  const parsedBulkTopics = bulkTextInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      let name = line;
      let subtopics: string[] = ['Core Concepts'];

      if (line.includes(' - ')) {
        const parts = line.split(' - ');
        name = parts[0].trim();
        subtopics = parts[1].split(',').map(s => s.trim()).filter(Boolean);
      } else if (line.includes(': ')) {
        const parts = line.split(': ');
        name = parts[0].trim();
        subtopics = parts[1].split(',').map(s => s.trim()).filter(Boolean);
      }

      // Only strip bullet points if present, preserve numbers (e.g. 1. Introduction, 100 Rules, 3D Geometry)
      name = name.replace(/^[•*]\s*/, '').trim();

      return {
        name,
        difficulty: bulkDefaultDifficulty,
        weightage: 3,
        subtopics: subtopics.length > 0 ? subtopics : ['Core Concepts']
      };
    })
    .filter(t => t.name.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveIsNewSubject = isNewSubject || hasNoSubjects;
    const effectiveIsNewChapter = isNewChapter || effectiveIsNewSubject;

    if (effectiveIsNewSubject && !newSubjectName.trim()) return;
    if (effectiveIsNewChapter && !newChapterName.trim()) return;

    let topicsToCreate: Array<{
      name: string;
      difficulty: DifficultyLevel;
      weightage: number;
      subtopics: string[];
    }> = [];

    if (creationMode === 'single') {
      if (!singleTopicName.trim()) return;
      const subtopics = singleSubtopicsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const parsedWeightage = singleWeightage.trim() ? Number(singleWeightage) : 3;

      topicsToCreate.push({
        name: singleTopicName.trim(),
        difficulty: singleDifficulty,
        weightage: parsedWeightage,
        subtopics: subtopics.length > 0 ? subtopics : ['Core Concepts']
      });
    } else {
      if (parsedBulkTopics.length === 0) return;
      topicsToCreate = parsedBulkTopics;
    }

    addMultipleCustomTopicsWithHierarchy({
      isNewSubject: effectiveIsNewSubject,
      subjectId: effectiveIsNewSubject ? undefined : selectedSubjectId,
      newSubjectName,
      newSubjectColor,
      newSubjectIcon,

      isNewChapter: effectiveIsNewChapter,
      chapterId: effectiveIsNewChapter ? undefined : selectedChapterId,
      newChapterName,
      newChapterDescription: newChapterDesc,

      topics: topicsToCreate
    });

    // Reset fields
    setSingleTopicName('');
    setSingleSubtopicsText('');
    setBulkTextInput('');
    setNewSubjectName('');
    setNewChapterName('');
    setNewChapterDesc('');
    setIsNewSubject(false);
    setIsNewChapter(false);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-fade-in select-none"
      onClick={() => {
        soundManager.playClick();
        haptics.light();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#12131A] border-t sm:border border-slate-200/90 dark:border-[#242533] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col overscroll-contain animate-slide-up sm:animate-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Pull-Down Drag Handle Pill */}
        <div className="sm:hidden pt-3 pb-1 flex items-center justify-center bg-white dark:bg-[#12131A]">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 active:scale-95 transition-transform" />
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-[#20212E] flex items-center justify-between bg-white dark:bg-[#12131A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Add Topics to Syllabus
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Choose target location and add single or bulk topics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer tap-bounce touch-target-min flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-4 overflow-y-auto space-y-4 flex-1">
          
          {/* CURRICULUM PLACEMENT (Bento Section for Subject & Chapter) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#171823] border border-slate-200/70 dark:border-[#252636] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <span>Target Location</span>
              </div>
              {!isNewSubject && !isNewChapter && subjectMatch && chapterMatch && (
                <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {chapterMatch.topics.length} topics currently
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* SUBJECT SELECTOR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Subject</span>
                  </label>
                  {hasNoSubjects ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      New Blank Canvas
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewSubject(p => {
                          const next = !p;
                          if (next) {
                            setIsNewChapter(true);
                            setSelectedChapterId('');
                          } else if (subjectMatch && subjectMatch.chapters.length > 0) {
                            setSelectedChapterId(subjectMatch.chapters[0].id);
                            setIsNewChapter(false);
                          }
                          return next;
                        });
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isNewSubject ? 'Existing' : '+ New Subject'}
                    </button>
                  )}
                </div>

                {isNewSubject || hasNoSubjects ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Quantitative Aptitude"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#101117] border border-slate-200 dark:border-[#2A2B3D] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                      required
                      autoFocus={hasNoSubjects}
                    />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewSubjectColor(c)}
                          className={`w-5 h-5 rounded-lg border-2 transition-transform cursor-pointer ${
                            newSubjectColor === c ? 'scale-125 border-white ring-2 ring-indigo-500/50 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSelectSubject(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#101117] border border-slate-200 dark:border-[#2A2B3D] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs truncate"
                    >
                      {currentExam.subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.chapters.length} chapters)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* CHAPTER SELECTOR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Chapter</span>
                  </label>
                  {!isNewSubject && !hasNoSubjects && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewChapter(p => {
                          const next = !p;
                          if (!next && subjectMatch && subjectMatch.chapters.length > 0) {
                            setSelectedChapterId(subjectMatch.chapters[0].id);
                          } else if (next) {
                            setSelectedChapterId('');
                          }
                          return next;
                        });
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isNewChapter ? 'Existing' : '+ New Chapter'}
                    </button>
                  )}
                </div>

                {isNewChapter || isNewSubject || hasNoSubjects || !subjectMatch || subjectMatch.chapters.length === 0 ? (
                  <input
                    type="text"
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    placeholder="e.g. Modern History / Algebra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#101117] border border-slate-200 dark:border-[#2A2B3D] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                    required
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#101117] border border-slate-200 dark:border-[#2A2B3D] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs truncate"
                    >
                      {subjectMatch.chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} ({ch.topics.length} topics)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Active Destination Breadcrumb */}
            {!isNewSubject && !isNewChapter && subjectMatch && chapterMatch && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3] shrink-0" />
                <span className="truncate">
                  Adding to: <strong className="text-slate-900 dark:text-white">{subjectMatch.name}</strong> &rsaquo; <strong className="text-slate-900 dark:text-white">{chapterMatch.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* MODE SEGMENTED SELECTOR */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Input Mode
            </span>
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[#181924] border border-slate-200/80 dark:border-[#272838]">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setCreationMode('bulk');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  creationMode === 'bulk'
                    ? 'bg-white dark:bg-[#252738] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bulk Import</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">Fast</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setCreationMode('single');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  creationMode === 'single'
                    ? 'bg-white dark:bg-[#252738] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Single Topic</span>
              </button>
            </div>
          </div>

          {/* BULK MULTI-TOPIC MODE */}
          {creationMode === 'bulk' ? (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-200">
                    Paste Topics <span className="font-normal text-slate-400 dark:text-slate-500 text-[11px]">(one per line)</span>
                  </label>
                  {parsedBulkTopics.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{parsedBulkTopics.length} topic{parsedBulkTopics.length > 1 ? 's' : ''} detected</span>
                    </span>
                  )}
                </div>

                <textarea
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  placeholder={`Percentage & Fraction Conversions\nProfit, Loss & Discount Formulas\nSimple & Compound Interest\nRatio & Proportion Tricks\nTime, Speed & Distance`}
                  rows={5}
                  className="w-full p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#151620] border border-slate-200 dark:border-[#272738] text-xs sm:text-[13px] font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed transition-all resize-y shadow-2xs"
                  required={creationMode === 'bulk'}
                />
              </div>

              {/* SEGMENTED DIFFICULTY PILLS */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Easy', label: 'Easy', dot: 'bg-emerald-500', activeStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' },
                    { id: 'Medium', label: 'Medium', dot: 'bg-amber-500', activeStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold shadow-xs' },
                    { id: 'Hard', label: 'Hard', dot: 'bg-rose-500', activeStyle: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold shadow-xs' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setBulkDefaultDifficulty(lvl.id as DifficultyLevel);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        bulkDefaultDifficulty === lvl.id
                          ? lvl.activeStyle
                          : 'bg-white dark:bg-[#171823] border-slate-200 dark:border-[#272738] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${lvl.dot}`} />
                      <span>{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STUDY IMPORT HELPER PILL */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-200/50 dark:border-indigo-500/15 text-xs text-indigo-900/80 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="leading-snug">
                  <strong>Smart Paste:</strong> Numbering like <em>1.</em> or <em>a)</em> and bullets like <em>•</em> or <em>-</em> are automatically cleaned.
                </span>
              </div>
            </div>
          ) : (
            /* SINGLE TOPIC MODE */
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={singleTopicName}
                  onChange={(e) => setSingleTopicName(e.target.value)}
                  placeholder="e.g. Percentage & Fractional Conversions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#151620] border border-slate-200 dark:border-[#272738] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  required={creationMode === 'single'}
                />
              </div>

              {/* SEGMENTED DIFFICULTY PILLS (SINGLE TOPIC) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Easy', label: 'Easy', dot: 'bg-emerald-500', activeStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' },
                    { id: 'Medium', label: 'Medium', dot: 'bg-amber-500', activeStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold shadow-xs' },
                    { id: 'Hard', label: 'Hard', dot: 'bg-rose-500', activeStyle: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold shadow-xs' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSingleDifficulty(lvl.id as DifficultyLevel);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        singleDifficulty === lvl.id
                          ? lvl.activeStyle
                          : 'bg-white dark:bg-[#171823] border-slate-200 dark:border-[#272738] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${lvl.dot}`} />
                      <span>{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Weightage Marks
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={singleWeightage}
                    onChange={(e) => setSingleWeightage(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#151620] border border-slate-200 dark:border-[#272738] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Subtopics
                  </label>
                  <input
                    type="text"
                    value={singleSubtopicsText}
                    onChange={(e) => setSingleSubtopicsText(e.target.value)}
                    placeholder="Fractions, Percent Changes"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#151620] border border-slate-200 dark:border-[#272738] text-xs sm:text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#20212E] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A2B3D] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer tap-bounce min-h-[42px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creationMode === 'bulk' && parsedBulkTopics.length === 0}
              onClick={() => haptics.medium()}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[42px] tap-bounce ${
                creationMode === 'bulk' && parsedBulkTopics.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 active:scale-98 cursor-pointer'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {creationMode === 'bulk'
                  ? parsedBulkTopics.length > 0
                    ? `Add ${parsedBulkTopics.length} Topics Now`
                    : 'Add Topics'
                  : 'Add Topic'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

