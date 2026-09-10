import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Key,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RotateCw,
  Cpu,
  Brain,
  Sliders,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  ExtractedSyllabusResult,
  ExtractedSubjectItem,
  AiArchitectStep,
  AiArchitectInputMode
} from '../../types/aiSyllabus';
import { extractTextFromPdf } from '../../utils/pdfTextExtractor';
import {
  parseSyllabusWithAi,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey
} from '../../utils/aiSyllabusParser';
import { SyllabusReviewTree } from './SyllabusReviewTree';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface AiSyllabusArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SYLLABUS = `TIER 1 & TIER 2 SCHEME OF EXAMINATION:
SECTION A: QUANTITATIVE APTITUDE
1. Number Systems: Computation of Whole Numbers, Decimals, Fractions, Relationships between numbers, Divisibility rules, Unit digit concept.
2. Fundamental Arithmetical Operations: Percentages, Ratio and Proportion, Square roots, Averages, Interest (Simple and Compound), Profit and Loss, Discount, Partnership Business, Mixture and Alligation, Time and distance, Time and work.
3. Algebra: Basic algebraic identities of School Algebra, Elementary surds, Graphs of Linear Equations.
4. Geometry: Familiarity with elementary geometric figures and facts: Triangle and its various kinds of centres, Congruence and similarity of triangles, Circle and its chords, tangents, angles subtended by chords.
5. Mensuration: Triangle, Quadrilaterals, Regular Polygons, Circle, Right Prism, Right Circular Cone, Right Circular Cylinder, Sphere, Hemispheres, Rectangular Parallelepiped.
6. Trigonometry: Trigonometric ratios, Degree and Radian Measures, Standard Identities, Heights and Distances.
7. Statistics and Probability: Use of Tables and Graphs: Histogram, Frequency polygon, Bar-diagram, Pie-chart, Measures of central tendency: mean, median, mode, standard deviation, Calculation of simple probabilities.

SECTION B: GENERAL INTELLIGENCE AND REASONING
1. Semantic Analogy, Symbolic/Number Analogy, Figural Analogy.
2. Semantic Classification, Symbolic/Number Classification, Figural Classification.
3. Semantic Series, Number Series, Figural Series, Problem Solving, Word Building.
4. Coding and de-coding, Numerical operations, Symbolic operations, Trends, Space Orientation, Space Visualization, Venn Diagrams.
5. Drawing inferences, Punched hole/pattern-folding & unfolding, Figural Pattern-folding and completion.
6. Indexing, Address matching, Date & city matching, Classification of centre codes/roll numbers, Small & Capital letters/numbers coding.
7. Critical Thinking, Emotional Intelligence, Social Intelligence.

SECTION C: GENERAL AWARENESS
1. History: Ancient India, Indus Valley Civilization, Vedic Period, Mauryan Empire, Gupta Age, Delhi Sultanate, Mughal Empire, Freedom Movement 1857-1947.
2. Culture & Heritage: Classical & Folk Dances of India, Music & Musical Instruments, Festivals, Traditional Painting Styles, UNESCO World Heritage Sites in India.
3. Geography: Physical features of India, Drainage system & Rivers, Climate & Monsoons, Soils, Natural Vegetation, Mineral Resources.
4. Indian Polity & Constitution: Making of Constitution, Preamble, Fundamental Rights & Duties, Directive Principles, President, Prime Minister, Parliament, Supreme Court, Panchayati Raj.
5. Economics: Basic Economic Terms, Micro vs Macro, National Income, Inflation, Monetary & Fiscal Policy, Five Year Plans, NITI Aayog.
6. General Science: Physics (Motion, Gravitation, Work, Energy, Light, Sound), Chemistry (Periodic table, Acids, Bases, Metals & Non-metals), Biology (Cell biology, Human organ systems, Diseases, Vitamins & Deficiency).
7. Computer Knowledge: Basics of Organization of a computer system, CPU, memory, Input/Output devices, Windows Explorer, Networking, Web Browsers, Cyber security threats.`;

export const AiSyllabusArchitectModal: React.FC<AiSyllabusArchitectModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentExam, importAiGeneratedSyllabus } = useSyllabus();

  const [step, setStep] = useState<AiArchitectStep>('input');
  const [inputMode, setInputMode] = useState<AiArchitectInputMode>('text');
  const [rawText, setRawText] = useState('');
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [examName, setExamName] = useState(currentExam?.name || 'SSC CGL 2025 Target');
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedResult, setExtractedResult] = useState<ExtractedSyllabusResult | null>(null);
  const [extractionSource, setExtractionSource] = useState<'gemini' | 'heuristic' | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [targetDestination, setTargetDestination] = useState<'new_exam' | 'merge_current'>('new_exam');

  // API Key state
  const [apiKey, setApiKey] = useState(getStoredGeminiApiKey());
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(getStoredGeminiApiKey());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiApiKey());
      if (currentExam?.name) {
        setExamName(currentExam.name);
      }
    }
  }, [isOpen, currentExam]);

  if (!isOpen) return null;

  const handlePdfUpload = async (file: File) => {
    soundManager.playClick();
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }
    setUploadedPdf(file);
    setStatusMessage('Reading PDF metadata...');
  };

  const handleProcess = async () => {
    soundManager.playClick();
    haptics.medium();
    setStep('processing');
    setErrorNotice(null);

    let syllabusText = rawText.trim();

    // 1. Extract from PDF if in PDF mode
    if (inputMode === 'pdf' && uploadedPdf) {
      try {
        setStatusMessage('Extracting readable text layer from PDF...');
        const pdfResult = await extractTextFromPdf(uploadedPdf, {
          onProgress: (cur, tot, msg) => {
            setStatusMessage(msg);
          }
        });

        syllabusText = pdfResult.text;
        setPdfPageCount(pdfResult.totalPages);

        if (!syllabusText || syllabusText.length < 40) {
          throw new Error('Could not extract text from this PDF. It might be scanned images without OCR.');
        }
      } catch (err: any) {
        setStep('input');
        setErrorNotice(err.message || 'Failed to read PDF. Try pasting the text directly.');
        soundManager.playError();
        return;
      }
    }

    if (!syllabusText || syllabusText.length < 20) {
      setStep('input');
      setErrorNotice('Please provide at least a few topics or upload a valid syllabus document.');
      soundManager.playError();
      return;
    }

    // 2. Process with AI Engine
    try {
      setStatusMessage('Structuring academic hierarchy & generating subtopics...');
      const parseResult = await parseSyllabusWithAi(syllabusText, examName, {
        apiKey,
        onProgress: msg => setStatusMessage(msg)
      });

      setExtractedResult(parseResult.result);
      setExtractionSource(parseResult.source);
      if (parseResult.errorNotice) {
        setErrorNotice(parseResult.errorNotice);
      }

      setStep('review');
      soundManager.playSuccess();
      haptics.success();
    } catch (err: any) {
      setStep('input');
      setErrorNotice(err.message || 'An error occurred while analyzing the syllabus.');
      soundManager.playError();
    }
  };

  const handleApproveAndImport = () => {
    if (!extractedResult || extractedResult.subjects.length === 0) return;

    soundManager.playClick();
    haptics.success();

    if (importAiGeneratedSyllabus) {
      importAiGeneratedSyllabus(extractedResult, targetDestination);
    }

    onClose();
  };

  const totalChapters = extractedResult
    ? extractedResult.subjects.reduce((acc, s) => acc + s.chapters.length, 0)
    : 0;

  const totalTopics = extractedResult
    ? extractedResult.subjects.reduce(
        (acc, s) => acc + s.chapters.reduce((cAcc, c) => cAcc + c.topics.length, 0),
        0
      )
    : 0;

  const totalSubtopics = extractedResult
    ? extractedResult.subjects.reduce(
        (acc, s) =>
          acc +
          s.chapters.reduce(
            (cAcc, c) => cAcc + c.topics.reduce((tAcc, t) => tAcc + t.subtopics.length, 0),
            0
          ),
        0
      )
    : 0;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-[#0B0D17] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white relative">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5 animate-[pulse_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  AI Syllabus Architect
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  PDF & Text Parser
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transform any raw syllabus into subjects, chapters, topics, and subtopics like a human expert.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick API Key Setup Button */}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Configure Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {apiKey ? 'API Key Active' : 'Configure Gemini Key'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Target Exam Name & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Exam / Curriculum Name</span>
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={e => setExamName(e.target.value)}
                    placeholder="e.g. SSC CGL 2025, UPSC CSE GS, GATE CS, College Semester 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Target Year</label>
                  <input
                    type="number"
                    value={targetYear}
                    onChange={e => setTargetYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setInputMode('text');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Syllabus Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setInputMode('pdf');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    inputMode === 'pdf'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Syllabus PDF</span>
                </button>
              </div>

              {/* Input Area: Text Mode */}
              {inputMode === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Paste syllabus text from notification, website, or notes:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRawText(SAMPLE_SYLLABUS);
                          soundManager.playClick();
                        }}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Load SSC CGL Sample
                      </button>
                      {rawText && (
                        <button
                          type="button"
                          onClick={() => setRawText('')}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Paste topics, chapters, or official syllabus sections here..."
                    className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/15 text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-cyan-400 resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      {rawText.trim().split(/\s+/).filter(Boolean).length} words ·{' '}
                      {rawText.length} characters
                    </span>
                    <span>Supports all competitive & academic syllabi</span>
                  </div>
                </div>
              )}

              {/* Input Area: PDF Mode */}
              {inputMode === 'pdf' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={e => {
                      if (e.target.files?.[0]) handlePdfUpload(e.target.files[0]);
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) handlePdfUpload(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      uploadedPdf
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-white/20 hover:border-cyan-400/60 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Upload className="w-8 h-8 animate-bounce" />
                    </div>

                    {uploadedPdf ? (
                      <div>
                        <span className="text-sm font-black text-cyan-300 block">
                          {uploadedPdf.name}
                        </span>
                        <span className="text-xs text-slate-400 block mt-1">
                          {(uploadedPdf.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm font-bold text-white block">
                          Drag & Drop your Syllabus PDF here, or Browse
                        </span>
                        <span className="text-xs text-slate-400 block mt-1">
                          Supports official exam notifications, coaching PDFs, and college guides
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {errorNotice && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {step === 'processing' && (
            <div className="py-16 sm:py-24 text-center flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-blue-500/20 border-b-blue-500 animate-[spin_1.5s_linear_infinite_reverse]" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-cyan-500/40">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h4 className="text-lg font-black text-white">
                  Architecting Your Syllabus...
                </h4>
                <p className="text-xs text-cyan-300 font-mono animate-pulse">
                  {statusMessage || 'Analyzing concepts, chapters & subtopics...'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Building deep academic taxonomy, categorizing difficulties, and crafting granular checklists.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW STUDIO */}
          {step === 'review' && extractedResult && (
            <div className="space-y-5">
              {/* Review KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                    {extractedResult.subjects.length}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Subjects</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                    {totalChapters}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Chapters</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {totalTopics}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Topics</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {totalSubtopics}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Subtopic Checklists</span>
                </div>
              </div>

              {/* Destination Selector */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Import Destination:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDestination('new_exam')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      targetDestination === 'new_exam'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Create as New Exam Target
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDestination('merge_current')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      targetDestination === 'merge_current'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Merge into Current Exam ({currentExam?.name || 'Current'})
                  </button>
                </div>
              </div>

              {/* Source & Notice */}
              {errorNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorNotice}</span>
                </div>
              )}

              {/* Interactive Tree View */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Interactive Curriculum Hierarchy (Click to edit names, difficulty or subtopics):</span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Engine: {extractionSource === 'gemini' ? 'Gemini 1.5 Flash' : 'Smart Offline Parser'}
                  </span>
                </div>

                <SyllabusReviewTree
                  subjects={extractedResult.subjects}
                  onChange={updatedSubjects =>
                    setExtractedResult({ ...extractedResult, subjects: updatedSubjects })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/30 shrink-0">
          {step === 'input' && (
            <>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcess}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-xs font-black text-white transition-all shadow-lg shadow-cyan-500/25 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Architect & Structure Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setStep('input');
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Back to Raw Input</span>
              </button>

              <button
                type="button"
                onClick={handleApproveAndImport}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-black text-white transition-all shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Import to Syllabus 3D ✨</span>
              </button>
            </>
          )}
        </div>

        {/* API Key Modal / Popover */}
        {showApiKeyModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#121422] border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-black text-white">Google Gemini API Key</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your free Google Gemini API key to enable semantic analysis and subtopic expansion. Keys are stored safely in your browser&apos;s local storage.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Gemini API Key</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={e => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStoredGeminiApiKey('');
                    setApiKey('');
                    setTempApiKey('');
                    setShowApiKeyModal(false);
                    soundManager.playClick();
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Remove Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStoredGeminiApiKey(tempApiKey);
                    setApiKey(tempApiKey);
                    setShowApiKeyModal(false);
                    soundManager.playSuccess();
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-black text-white shadow-md shadow-cyan-500/25"
                >
                  Save API Key
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
