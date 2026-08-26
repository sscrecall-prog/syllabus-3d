import React, { useState, useRef } from 'react';
import {
  Edit3,
  Eye,
  Save,
  Copy,
  Check,
  Zap,
  AlertTriangle,
  FileText,
  Sigma,
  CheckSquare,
  Table as TableIcon,
  Sparkles,
  BookOpen,
  Info,
  Hash,
  FileDown,
  Printer,
  ExternalLink
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { generateAndOpenNotesPdf } from '../../utils/pdfGenerator';

interface ProfessionalNotesEditorProps {
  initialContent: string;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
  onSave: (content: string) => void;
}

export const ProfessionalNotesEditor: React.FC<ProfessionalNotesEditorProps> = ({
  initialContent,
  topicName,
  subjectName,
  chapterName,
  examName,
  onSave
}) => {
  const [content, setContent] = useState(initialContent || '');
  const [isEditing, setIsEditing] = useState(!initialContent || initialContent.trim().length === 0);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync if topic changes
  React.useEffect(() => {
    setContent(initialContent || '');
    setIsEditing(!initialContent || initialContent.trim().length === 0);
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
    soundManager.playClick();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    soundManager.playCompleteChime();
    generateAndOpenNotesPdf({
      topicName,
      subjectName,
      chapterName,
      examName: examName || 'SSC CGL 2026',
      notes: content,
      autoPrint: true
    });
  };

  // Helper to insert markdown formatting at cursor
  const insertText = (before: string, after: string = '', defaultPlaceholder: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || defaultPlaceholder;
    const replacement = before + selected + after;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  // Insert Templates
  const insertFormulaTemplate = () => {
    const tpl = `\n# Key Formulas & Definitions\n> [!FORMULA]\n> Standard Formula: Speed = Distance / Time\n> Average Speed (Equal Distance) = 2xy / (x + y)\n\n> [!TIP]\n> Shortcut Method: Ratio method converts speed ratio a:b to time ratio b:a.\n\n> [!WARNING]\n> Common Trap: Don't take simple arithmetic average when distances are constant!\n\n### High-Yield Action Checklist\n- [ ] Memorize basic conversion (1 km/h = 5/18 m/s)\n- [ ] Practice 5 previous year exam questions\n`;
    setContent(prev => (prev ? prev + '\n' + tpl : tpl));
  };

  const insertGrammarRuleTemplate = () => {
    const tpl = `\n# Core Grammar & Rule Guide\n> [!RULE]\n> Golden Rule: Singular subjects take singular verbs; plural subjects take plural verbs.\n\n> [!WARNING]\n> High-Frequency Exception: Expressions like 'along with', 'as well as', 'in addition to' do not change the subject number.\n\n### Practice Traps\n- [ ] Check subject before the prepositional phrase\n- [ ] Verify tense consistency across clauses\n`;
    setContent(prev => (prev ? prev + '\n' + tpl : tpl));
  };

  // Toggle checklist item in rendered view
  const toggleCheckboxInText = (lineIndex: number) => {
    const lines = content.split('\n');
    let taskCount = 0;
    const newLines = lines.map((l) => {
      if (l.trim().startsWith('- [ ] ') || l.trim().startsWith('- [x] ')) {
        if (taskCount === lineIndex) {
          if (l.includes('- [ ] ')) {
            return l.replace('- [ ] ', '- [x] ');
          } else {
            return l.replace('- [x] ', '- [ ] ');
          }
        }
        taskCount++;
      }
      return l;
    });
    const updated = newLines.join('\n');
    setContent(updated);
    onSave(updated);
    soundManager.playClick();
  };

  // Custom Markdown & Callout Parser
  const renderFormattedNotes = () => {
    if (!content || content.trim().length === 0) {
      return (
        <div className="py-12 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              No notes added for this topic yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Paste your formulas, high-yield rules, shortcuts, or summary notes to turn them into an interactive professional cheat sheet.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Create / Paste Notes</span>
          </button>
        </div>
      );
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let taskCounter = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Callout Blocks (> [!TYPE] ...)
      if (line.trim().startsWith('> [!')) {
        const match = line.trim().match(/^>\s*\[!([A-Z]+)\]/i);
        const calloutType = match ? match[1].toUpperCase() : 'NOTE';
        const calloutLines: string[] = [];

        // Collect all consecutive callout lines
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const l = lines[i].trim().replace(/^>s*/, '');
          if (!l.startsWith('[!')) {
            calloutLines.push(l);
          }
          i++;
        }

        let borderCol = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400';
        let IconComp = Info;
        let title = 'Note';

        if (calloutType === 'FORMULA' || calloutType === 'MATH') {
          borderCol = 'border-purple-500/40 bg-purple-500/10 text-purple-400';
          IconComp = Sigma;
          title = 'Formula & Concept';
        } else if (calloutType === 'TIP' || calloutType === 'SHORTCUT') {
          borderCol = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
          IconComp = Zap;
          title = 'Pro Tip & Shortcut';
        } else if (calloutType === 'WARNING' || calloutType === 'TRAP') {
          borderCol = 'border-rose-500/40 bg-rose-500/10 text-rose-400';
          IconComp = AlertTriangle;
          title = 'Exam Trap & Warning';
        } else if (calloutType === 'RULE' || calloutType === 'KEY') {
          borderCol = 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400';
          IconComp = BookOpen;
          title = 'Golden Rule';
        }

        elements.push(
          <div
            key={'callout-' + i}
            className={`my-3.5 p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm shadow-sm ${borderCol}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <IconComp className="w-4 h-4 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 space-y-1 pl-6 leading-relaxed">
              {calloutLines.map((cl, cIdx) => (
                <p key={cIdx} className="font-mono text-xs sm:text-[13px]">{cl}</p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-5 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-brand-500 inline-block" />
            <span>{line.replace('# ', '')}</span>
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-purple-500 inline-block" />
            <span>{line.replace('## ', '')}</span>
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-xs sm:text-sm font-bold text-brand-500 dark:text-brand-400 mt-3 mb-1 uppercase tracking-wider">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Checkbox Tasks
      else if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
        const isDone = line.trim().startsWith('- [x] ');
        const taskText = line.trim().substring(6);
        const currentTaskIdx = taskCounter;
        taskCounter++;

        elements.push(
          <div
            key={i}
            onClick={() => toggleCheckboxInText(currentTaskIdx)}
            className={`flex items-center gap-3 p-2 sm:p-2.5 my-1 rounded-xl cursor-pointer transition-all ${
              isDone
                ? 'bg-emerald-500/10 text-slate-400 line-through'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
              isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
            }`}>
              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="text-xs font-medium">{taskText}</span>
          </div>
        );
      }
      // Bullet list
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <div key={i} className="flex items-start gap-2.5 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {line.trim().substring(2)}
            </p>
          </div>
        );
      }
      // Horizontal Rule
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800" />);
      }
      // Blank Line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      }
      // Regular Paragraph with formatting highlights
      else {
        elements.push(
          <p key={i} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {line}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="space-y-3">
      {/* Editor & View Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isEditing
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Study View</span>
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isEditing
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit / Paste</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleExportPdf}
            title="Export and Open Academic Notes as PDF in Chrome New Tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35]/15 hover:bg-[#596B35]/25 border border-[#596B35]/30 text-[#596B35] dark:text-[#A4B879] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Save / Open PDF</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#596B35] text-white font-mono font-bold">
              NEW TAB
            </span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy notes to clipboard"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Notes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing Toolbar & Templates */}
      {isEditing && (
        <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          {/* Quick Syntax Insertion Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**', 'Bold Text')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*', 'Italic Text')}
              className="px-2 py-1 rounded-lg text-xs font-serif italic bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertText('# ', '', 'Main Heading')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-0.5"
              title="Heading 1"
            >
              <Hash className="w-3 h-3" /> 1
            </button>
            <button
              type="button"
              onClick={() => insertText('## ', '', 'Subheading')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-0.5"
              title="Heading 2"
            >
              <Hash className="w-3 h-3" /> 2
            </button>
            <button
              type="button"
              onClick={() => insertText('> [!FORMULA]\n> ', '', 'Formula: Result')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1"
              title="Formula Card"
            >
              <Sigma className="w-3 h-3" />
              <span>Formula</span>
            </button>
            <button
              type="button"
              onClick={() => insertText('> [!TIP]\n> ', '', 'Pro Tip / Shortcut Method')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1"
              title="Tip Card"
            >
              <Zap className="w-3 h-3" />
              <span>Shortcut</span>
            </button>
            <button
              type="button"
              onClick={() => insertText('> [!WARNING]\n> ', '', 'Common Exam Trap to Avoid')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1"
              title="Warning Card"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Trap</span>
            </button>
            <button
              type="button"
              onClick={() => insertText('- [ ] ', '', 'Task to remember')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
              title="Task Checkbox"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Checklist</span>
            </button>
          </div>

          {/* Preset Templates */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Templates:</span>
            <button
              type="button"
              onClick={insertFormulaTemplate}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-400 text-[11px] font-medium transition-colors"
            >
              + Formula Sheet
            </button>
            <button
              type="button"
              onClick={insertGrammarRuleTemplate}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-400 text-[11px] font-medium transition-colors"
            >
              + Rule & Exception Sheet
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Body */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste or write formulas, rules, tips, and shortcuts here...\n\nTip: You can use:\n> [!FORMULA]\n> Your formula here\n\n> [!WARNING]\n> Common trap here\n\n- [ ] Checklist item"
            rows={14}
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-[13px] text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>{wordCount} words · {charCount} characters</span>
            <span>Markdown & LaTeX formula tags supported</span>
          </div>
        </div>
      ) : (
        /* Rendered Study Mode */
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm min-h-[260px]">
          {renderFormattedNotes()}
        </div>
      )}
    </div>
  );
};
