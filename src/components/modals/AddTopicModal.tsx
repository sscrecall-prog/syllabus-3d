import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Plus,
  BookOpen,
  Layers,
  Check,
  Palette,
  ListPlus,
  FileText,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { DifficultyLevel } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose }) => {
  const { currentExam, addMultipleCustomTopicsWithHierarchy } = useSyllabus();

  // Mode: Single Topic vs Bulk Multi-Topic
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('bulk');

  // Subject state
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PALETTE[0]);
  const [newSubjectIcon, setNewSubjectIcon] = useState('BookOpen');

  // Chapter state
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState('');
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

  useEffect(() => {
    if (currentExam && currentExam.subjects.length > 0) {
      const firstSub = currentExam.subjects[0];
      setSelectedSubjectId(firstSub.id);
      if (firstSub.chapters.length > 0) {
        setSelectedChapterId(firstSub.chapters[0].id);
      }
    }
  }, [currentExam]);

  const subjectMatch = currentExam?.subjects.find(s => s.id === selectedSubjectId);

  useEffect(() => {
    if (subjectMatch && subjectMatch.chapters.length > 0) {
      setSelectedChapterId(subjectMatch.chapters[0].id);
      setIsNewChapter(false);
    } else if (isNewSubject) {
      setIsNewChapter(true);
    }
  }, [selectedSubjectId, subjectMatch, isNewSubject]);

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

    if (isNewSubject && !newSubjectName.trim()) return;
    if (isNewChapter && !newChapterName.trim()) return;

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
      isNewSubject,
      subjectId: isNewSubject ? undefined : selectedSubjectId,
      newSubjectName,
      newSubjectColor,
      newSubjectIcon,

      isNewChapter: isNewSubject ? true : isNewChapter,
      chapterId: isNewChapter || isNewSubject ? undefined : selectedChapterId,
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
        className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#121217] border-t sm:border border-[#E2E8F0] dark:border-[#272730] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col overscroll-contain animate-slide-up sm:animate-none"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Mobile Pull-Down Drag Handle Pill */}
        <div className="sm:hidden pt-3 pb-1 flex items-center justify-center bg-white dark:bg-[#18181D]">
          <div className="w-12 h-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#475569] active:scale-95 transition-transform" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#272730] flex items-center justify-between bg-white dark:bg-[#18181D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight">
                Add Topics to Syllabus
              </h4>
              <p className="text-[10px] text-[#85877E] font-mono">
                Add individual topics or bulk-import curriculum chapters in one click
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              onClose();
            }}
            className="p-2.5 rounded-xl text-[#65675F] hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer tap-bounce touch-target-min flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* STEP 1: Select or Create Subject */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Choose Subject</span>
              </label>

              <button
                type="button"
                onClick={() => setIsNewSubject(p => !p)}
                className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {isNewSubject ? '← Choose Existing Subject' : '+ Create New Subject'}
              </button>
            </div>

            {isNewSubject ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1">
                    New Subject Name
                  </label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. General Knowledge / Computer / Physics"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500"
                    required={isNewSubject}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1.5">
                    Subject Theme Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSubjectColor(c)}
                        className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer ${
                          newSubjectColor === c ? 'scale-110 border-white ring-2 ring-amber-500/50 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {currentExam.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.chapters.length} chapters)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* STEP 2: Select or Create Chapter */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Choose Chapter</span>
              </label>

              {!isNewSubject && (
                <button
                  type="button"
                  onClick={() => setIsNewChapter(p => !p)}
                  className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {isNewChapter ? '← Choose Existing Chapter' : '+ Create New Chapter'}
                </button>
              )}
            </div>

            {isNewChapter || isNewSubject ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="e.g. Modern History / Algebra / Trigonometry"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            ) : (
              <div>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {subjectMatch?.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.topics.length} topics)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* STEP 3: TOPICS SECTION (Segmented Switch: Single vs Bulk Multi-Topic) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#11120F] dark:text-[#F5F5F7]">
                3. Topic Addition Mode
              </label>

              {/* Mode Toggle Pills */}
              <div className="flex rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] p-1 border border-[#E2E8F0] dark:border-[#272730]">
                <button
                  type="button"
                  onClick={() => setCreationMode('bulk')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    creationMode === 'bulk'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                      : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Bulk Multi-Topic (Fast)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('single')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    creationMode === 'single'
                      ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                      : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Single Topic</span>
                </button>
              </div>
            </div>

            {/* BULK MULTI-TOPIC MODE */}
            {creationMode === 'bulk' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#85877E] font-mono">
                  <span>Paste Multiple Topics (One per line):</span>
                  {parsedBulkTopics.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25">
                      ✓ {parsedBulkTopics.length} Topics Ready to Add
                    </span>
                  )}
                </div>

                <textarea
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  placeholder={`Paste your topics list here (each topic on a new line):\nPercentage & Fraction Conversions\nProfit, Loss & Discount Formulas\nSimple & Compound Interest\nRatio & Proportion Tricks\nTime, Speed & Distance`}
                  rows={6}
                  className="w-full p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-medium text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500 font-mono leading-relaxed placeholder-[#85877E]"
                  required={creationMode === 'bulk'}
                />

                <div className="pt-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1">
                    Difficulty for all topics
                  </label>
                  <select
                    value={bulkDefaultDifficulty}
                    onChange={(e) => setBulkDefaultDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs font-mono text-amber-700 dark:text-amber-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>Tip: You can paste 10, 20 or 50 topics at once! Numbering like "1. ", "2) " will be automatically cleaned.</span>
                </div>
              </div>
            ) : (
              /* SINGLE TOPIC MODE */
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={singleTopicName}
                    onChange={(e) => setSingleTopicName(e.target.value)}
                    placeholder="e.g. Percentage & Fractional Conversions"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-amber-500"
                    required={creationMode === 'single'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1">
                      Difficulty
                    </label>
                    <select
                      value={singleDifficulty}
                      onChange={(e) => setSingleDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E]">
                        Weightage Marks
                      </label>
                      <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={singleWeightage}
                      onChange={(e) => setSingleWeightage(e.target.value)}
                      placeholder="e.g. 4 (Optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] mb-1">
                    Subtopics (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={singleSubtopicsText}
                    onChange={(e) => setSingleSubtopicsText(e.target.value)}
                    placeholder="e.g. Fractions, Percent Changes, Word Problems"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-[13px] font-bold text-[#11120F] dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer transition-colors tap-bounce min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={() => haptics.medium()}
              className="px-6 py-2.5 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-emerald-400 text-xs font-black uppercase tracking-wider shadow-xs tap-bounce transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                {creationMode === 'bulk'
                  ? `Add ${parsedBulkTopics.length > 0 ? parsedBulkTopics.length : ''} Topics Now`
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

