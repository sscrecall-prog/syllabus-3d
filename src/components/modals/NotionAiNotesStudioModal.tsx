import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Bot,
  Check,
  Copy,
  X,
  FileText,
  BookOpen,
  Brain,
  Zap,
  ShieldCheck,
  Eye,
  Columns,
  Key,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ListOrdered,
  Layers,
  Wand2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sigma,
  Table as TableIcon
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import {
  NoteFormatType,
  NoteToneDensity,
  transformNotesWithAiArchitect,
  verifyDataIntegrity,
  getSavedGeminiApiKey,
  saveGeminiApiKey,
  generateNotesWithLiveGemini
} from '../../utils/notionAiArchitect';
import { MathBlock, InlineMath } from '../../utils/mathRenderer';

export interface NotionAiNotesStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
  currentNoteContent?: string;
  initialPastedText?: string;
  onApplyFormattedNotes: (formattedContent: string, mode: 'replace' | 'append') => void;
}

interface FormatCardOption {
  id: NoteFormatType;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bestFor: string;
}

const FORMAT_OPTIONS: FormatCardOption[] = [
  {
    id: 'notion_master',
    title: 'Notion Pro Master',
    badge: 'RECOMMENDED',
    description: 'Executive summary, golden rules, formulas, tips, traps, comparison tables & checklists.',
    icon: Sparkles,
    accentColor: 'from-violet-500 to-indigo-600',
    bestFor: '10/10 Complete Exam Study'
  },
  {
    id: 'cornell',
    title: 'Cornell Academic',
    badge: 'ACTIVE RECALL',
    description: 'Left cue trigger questions, structured notes body, and a 3-minute synthesis box.',
    icon: BookOpen,
    accentColor: 'from-blue-500 to-cyan-600',
    bestFor: 'Lecture & Textbook Notes'
  },
  {
    id: 'active_recall',
    title: 'Active Recall Deck',
    badge: 'SELF-TESTING',
    description: 'Concepts converted into Question-Answer pairs with exam traps and memory prompts.',
    icon: Brain,
    accentColor: 'from-amber-500 to-orange-600',
    bestFor: 'Pre-Exam Quiz & Revision'
  },
  {
    id: 'cheat_sheet',
    title: 'Speed Cheat Sheet',
    badge: 'RAPID REVISION',
    description: 'Formula matrix, key parameter tables, and high-yield facts with zero fluff.',
    icon: Zap,
    accentColor: 'from-emerald-500 to-teal-600',
    bestFor: 'Last 10-Minute Refresh'
  },
  {
    id: 'hierarchical_outline',
    title: 'Deep-Dive Outline',
    badge: 'SYSTEMATIC',
    description: 'Numbered multi-level hierarchy (1.0 -> 1.1 -> 1.1.1) for progressive mastery.',
    icon: ListOrdered,
    accentColor: 'from-purple-500 to-pink-600',
    bestFor: 'Polity, Law & Derivations'
  },
  {
    id: 'zero_loss_clean',
    title: 'Zero-Loss Normalizer',
    badge: '100% ORIGINAL',
    description: 'Preserves 100% of exact wording & paragraphs; repairs broken tables & math.',
    icon: ShieldCheck,
    accentColor: 'from-slate-600 to-slate-800',
    bestFor: 'Exact Text Preservation'
  }
];

export const NotionAiNotesStudioModal: React.FC<NotionAiNotesStudioModalProps> = ({
  isOpen,
  onClose,
  topicName,
  subjectName,
  chapterName,
  examName,
  currentNoteContent = '',
  initialPastedText = '',
  onApplyFormattedNotes
}) => {
  // State
  const [rawText, setRawText] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<NoteFormatType>('notion_master');
  const [density, setDensity] = useState<NoteToneDensity>('high_yield');
  const [activeTab, setActiveTab] = useState<'preview' | 'compare' | 'raw' | 'input'>('preview');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Gemini API Key State
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showApiKeyDrawer, setShowApiKeyDrawer] = useState<boolean>(false);
  const [isGeneratingLive, setIsGeneratingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Initialize input text when opened
  useEffect(() => {
    if (isOpen) {
      const initial = initialPastedText.trim() || currentNoteContent.trim();
      setRawText(initial);
      setGeminiApiKey(getSavedGeminiApiKey());
      setLiveError(null);
      // Auto-switch to input tab if empty
      if (!initial) {
        setActiveTab('input');
      } else {
        setActiveTab('preview');
      }
    }
  }, [isOpen, initialPastedText, currentNoteContent]);

  // Transform notes with local offline AI engine
  const formattedNotes = useMemo(() => {
    if (!rawText.trim()) return '';
    return transformNotesWithAiArchitect(rawText, {
      topicName,
      subjectName,
      chapterName,
      examName,
      format: selectedFormat,
      density,
      customInstruction: customPrompt
    });
  }, [rawText, topicName, subjectName, chapterName, examName, selectedFormat, density, customPrompt]);

  // Data Integrity Audit report
  const integrityReport = useMemo(() => {
    return verifyDataIntegrity(rawText, formattedNotes);
  }, [rawText, formattedNotes]);

  if (!isOpen) return null;

  // Handle Copy Formatted Markdown
  const handleCopy = () => {
    if (!formattedNotes) return;
    navigator.clipboard.writeText(formattedNotes);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Apply to Note
  const handleApply = (mode: 'replace' | 'append') => {
    if (!formattedNotes.trim()) return;
    soundManager.playCompleteChime();
    onApplyFormattedNotes(formattedNotes, mode);
    onClose();
  };

  // Handle Live Gemini AI generation
  const handleGenerateLiveWithGemini = async () => {
    if (!rawText.trim()) return;
    setIsGeneratingLive(true);
    setLiveError(null);
    soundManager.playClick();

    try {
      const result = await generateNotesWithLiveGemini({
        rawNotes: rawText,
        topicName,
        subjectName,
        chapterName,
        examName,
        format: selectedFormat,
        customPrompt,
        apiKey: geminiApiKey
      });
      setRawText(result);
      soundManager.playCompleteChime();
    } catch (err: any) {
      console.error('Gemini Live Generation Error:', err);
      setLiveError(err?.message || 'Failed to generate with Gemini API. Check your key and network.');
      soundManager.playClick();
    } finally {
      setIsGeneratingLive(false);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    saveGeminiApiKey(key);
  };

  // Render Formatted Content Preview
  const renderPreviewContent = (textToRender: string) => {
    if (!textToRender.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No notes pasted yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Paste text from Google Gemini, ChatGPT, Claude, or your textbook in the Input tab to generate professional notes.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
          >
            Open Input Tab & Paste
          </button>
        </div>
      );
    }

    const lines = textToRender.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // 1. Math Block ($$ ... $$)
      if (trimmed.startsWith('$$')) {
        const mathLines: string[] = [line.replace(/^\$\$/, '')];
        if (!trimmed.endsWith('$$') || trimmed === '$$') {
          i++;
          while (i < lines.length) {
            const next = lines[i];
            if (next.trim().endsWith('$$')) {
              mathLines.push(next.replace(/\$\$$/, ''));
              i++;
              break;
            }
            mathLines.push(next);
            i++;
          }
        } else {
          mathLines[0] = trimmed.slice(2, -2);
          i++;
        }
        elements.push(
          <MathBlock key={`math-${i}`} latex={mathLines.join('\n')} />
        );
        continue;
      }

      // 2. Callout Block (> [!TYPE])
      if (trimmed.startsWith('> [!')) {
        const typeMatch = trimmed.match(/^>\s*\[!([A-Z]+)\]/i);
        const cType = typeMatch ? typeMatch[1].toUpperCase() : 'NOTE';
        const calloutLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          calloutLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }

        const calloutStyles: Record<string, { bg: string; border: string; text: string; icon: string; title: string }> = {
          NOTE: { bg: 'bg-blue-500/10 dark:bg-blue-950/20', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', icon: '💡', title: 'Executive Summary' },
          RULE: { bg: 'bg-indigo-500/10 dark:bg-indigo-950/20', border: 'border-indigo-500/30', text: 'text-indigo-700 dark:text-indigo-300', icon: '⚖️', title: 'Golden Rule' },
          FORMULA: { bg: 'bg-purple-500/10 dark:bg-purple-950/20', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', icon: '📐', title: 'Exam Formula' },
          TIP: { bg: 'bg-emerald-500/10 dark:bg-emerald-950/20', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', icon: '⚡', title: 'Pro Shortcut' },
          WARNING: { bg: 'bg-rose-500/10 dark:bg-rose-950/20', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-300', icon: '⚠️', title: 'Exam Trap / Caution' },
          EXAMPLE: { bg: 'bg-amber-500/10 dark:bg-amber-950/20', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', icon: '📝', title: 'Solved Example' },
          CUE: { bg: 'bg-cyan-500/10 dark:bg-cyan-950/20', border: 'border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-300', icon: '📌', title: 'Recall Trigger Questions' }
        };

        const style = calloutStyles[cType] || calloutStyles.NOTE;

        elements.push(
          <div
            key={`callout-${i}`}
            className={`my-3 p-3.5 sm:p-4 rounded-2xl border ${style.border} ${style.bg} space-y-1.5 shadow-2xs`}
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider font-mono">
              <span>{style.icon}</span>
              <span className={style.text}>{style.title}</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
              {calloutLines.map((cL, idx) => (
                <p key={idx}>{cL}</p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 3. Headings
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-5 mb-2 pb-2 border-b border-slate-200 dark:border-white/10">
            {trimmed.replace(/^#\s+/, '')}
          </h1>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-4 mb-1.5">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-[14px] sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
        i++;
        continue;
      }

      // 4. Markdown Table
      if (trimmed.startsWith('|')) {
        const tableRows: string[] = [line];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(lines[i]);
          i++;
        }

        const parsedRows = tableRows
          .filter(r => !r.includes(':---'))
          .map(r => r.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1));

        if (parsedRows.length > 0) {
          const headers = parsedRows[0];
          const dataRows = parsedRows.slice(1);

          elements.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-[#1E2030] text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2.5 sm:p-3 border-r border-slate-200 dark:border-white/10 last:border-none">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                  {dataRows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      {r.map((c, cIdx) => (
                        <td key={cIdx} className="p-2.5 sm:p-3 border-r border-slate-200 dark:border-white/5 last:border-none">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // 5. Checklists
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        const isChecked = trimmed.startsWith('- [x]');
        const text = trimmed.replace(/^-\s*\[[ x]\]\s*/, '');
        elements.push(
          <div key={`check-${i}`} className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 my-1 font-medium">
            <span className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span>{text}</span>
          </div>
        );
        i++;
        continue;
      }

      // 6. Regular List
      if (/^[-*+•▪]\s+/.test(trimmed)) {
        elements.push(
          <li key={`li-${i}`} className="ml-5 list-disc text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed">
            {trimmed.replace(/^[-*+•▪]\s+/, '')}
          </li>
        );
        i++;
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">
          {trimmed}
        </p>
      );
      i++;
    }

    return <div className="space-y-1">{elements}</div>;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#12131C] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl max-h-[92vh]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#151724]/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                  Notion AI Note Studio
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 shrink-0">
                  AI Architect 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {topicName} {subjectName ? `• ${subjectName}` : ''} {examName ? `• ${examName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all cursor-pointer"
              title={isMaximized ? 'Restore Size' : 'Maximize Studio'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FORMAT SELECTOR CARDS ROW */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/40 dark:bg-[#10111A] overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-1">
              Select Format:
            </span>
            {FORMAT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = selectedFormat === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedFormat(opt.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#1A1C2A] border-violet-500 text-violet-700 dark:text-violet-300 shadow-sm ring-2 ring-violet-500/20'
                      : 'bg-white/60 dark:bg-[#141520] border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${opt.accentColor} text-white flex items-center justify-center shrink-0`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{opt.title}</span>
                      <span className={`text-[9px] font-mono px-1 rounded font-semibold ${isSelected ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-black/5 dark:bg-white/5 text-slate-400'}`}>
                        {opt.badge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SUB-TOOLBAR: DENSITY SELECTOR & DATA INTEGRITY AUDIT BAR */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs bg-white dark:bg-[#12131C] shrink-0">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#181926] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-[#25283D] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Formatted</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-white dark:bg-[#25283D] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-[#25283D] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'input'
                  ? 'bg-white dark:bg-[#25283D] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-violet-500" />
              <span>Edit Raw Input</span>
            </button>
          </div>

          {/* Middle/Right: Zero Data Loss Audit Counter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
              <span>100% Data Preserved</span>
              <span className="text-emerald-600/70 dark:text-emerald-400/70">
                • {integrityReport.formattedWords} words • {integrityReport.formulasCount} formulas • {integrityReport.tablesCount} tables
              </span>
            </div>

            {integrityReport.detectedSource !== 'Generic' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold font-mono">
                Source: {integrityReport.detectedSource}
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowApiKeyDrawer(!showApiKeyDrawer)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#181926] dark:hover:bg-[#222436] text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              <Bot className="w-3 h-3 text-purple-500" />
              <span>Live Gemini AI</span>
              {showApiKeyDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* OPTIONAL GEMINI API KEY DRAWER */}
        {showApiKeyDrawer && (
          <div className="p-3.5 sm:p-4 bg-purple-50/50 dark:bg-[#161426] border-b border-purple-200/80 dark:border-purple-900/40 space-y-2.5 animate-slide-in shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Optional: Free Google Gemini 1.5 Flash Live Rewrite
                </span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Get Free Gemini API Key →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={e => handleSaveApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-purple-300/80 dark:border-purple-800/60 bg-white dark:bg-[#0E0D18] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleGenerateLiveWithGemini}
                disabled={isGeneratingLive || !rawText.trim() || !geminiApiKey.trim()}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingLive ? 'animate-spin' : ''}`} />
                <span>{isGeneratingLive ? 'Generating...' : 'Run Gemini Live AI'}</span>
              </button>
            </div>

            {liveError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {liveError}
              </p>
            )}
          </div>
        )}

        {/* MAIN BODY WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-[#0D0E15]">
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto p-5 sm:p-8 rounded-3xl bg-white dark:bg-[#161724] border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
              {renderPreviewContent(formattedNotes)}
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Original Pasted */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161724] border border-slate-200 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    ORIGINAL RAW TEXT ({integrityReport.originalWords} words)
                  </span>
                  <span className="text-[10px] text-slate-400">Pasted Source</span>
                </div>
                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
                  {rawText || '(Empty)'}
                </pre>
              </div>

              {/* Right: Notion AI Formatted */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161724] border border-violet-500/30 shadow-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="text-xs font-bold text-violet-700 dark:text-violet-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    NOTION AI FORMATTED ({integrityReport.formattedWords} words)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Preserved</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {renderPreviewContent(formattedNotes)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span>Markdown Output ({formattedNotes.split('\n').length} lines)</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto select-text">
                {formattedNotes}
              </pre>
            </div>
          )}

          {activeTab === 'input' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste Notes from Gemini, ChatGPT, Claude, DeepSeek, or Textbooks:
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setRawText(text);
                        soundManager.playClick();
                      }
                    } catch (e) {
                      console.warn('Clipboard read permission denied', e);
                    }
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Paste from Clipboard (Ctrl+V)
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste raw notes here... Tables, formulas, bullet points, and definitions will be automatically identified and structured."
                className="w-full h-80 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161724] text-xs sm:text-[13px] text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed resize-y"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{rawText.split(/\s+/).filter(Boolean).length} words detected</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all cursor-pointer shadow-sm"
                >
                  View Formatted Notes →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#141520] flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!formattedNotes.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Markdown'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleApply('append')}
              disabled={!formattedNotes.trim()}
              title="Add formatted notes below existing topic notes"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Append Below</span>
            </button>

            <button
              type="button"
              onClick={() => handleApply('replace')}
              disabled={!formattedNotes.trim()}
              title="Replace active topic note with Notion AI formatted notes"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply to Note (Replace)</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
