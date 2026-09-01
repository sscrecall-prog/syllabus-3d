import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Edit3,
  Eye,
  Save,
  Copy,
  Check,
  Zap,
  AlertTriangle,
  Sigma,
  CheckSquare,
  BookOpen,
  Info,
  Hash,
  FileDown,
  Columns,
  Mic,
  MicOff,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  X,
  Clock,
  Play,
  Sparkles,
  Bot,
  Table as TableIcon,
  Code,
  ListTodo,
  HelpCircle,
  SplitSquareVertical,
  CheckCircle2,
  Highlighter,
  Type,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { generateAndOpenNotesPdf } from '../../utils/pdfGenerator';
import { TopicImageAttachment, TopicLecture } from '../../types/syllabus';
import { parseTimestampToSeconds } from '../../utils/youtubeUtils';
import { formatAiNotes, generateAiNotesPrompt } from '../../utils/aiNotesFormatter';

interface ProfessionalNotesEditorProps {
  initialContent: string;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
  onSave: (content: string) => void;
  onOpenSplitPdf?: () => void;
  hasPdfAttachments?: boolean;
  lectures?: TopicLecture[];
  onOpenSplitLecture?: (lectureId?: string, seekSeconds?: number) => void;
  images?: TopicImageAttachment[];
  onAddImage?: (image: { title?: string; dataUrl: string; fileSize?: number }) => void;
  onDeleteImage?: (imageId: string) => void;
}

type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';
type ReaderWidth = 'normal' | 'wide' | 'full';

export const ProfessionalNotesEditor: React.FC<ProfessionalNotesEditorProps> = ({
  initialContent,
  topicName,
  subjectName,
  chapterName,
  examName,
  onSave,
  onOpenSplitPdf,
  hasPdfAttachments = false,
  lectures = [],
  onOpenSplitLecture,
  images = [],
  onAddImage,
  onDeleteImage
}) => {
  const [content, setContent] = useState(initialContent || '');
  // View mode: 'study' (rendered view), 'edit' (markdown editor), 'split' (side-by-side)
  const [viewMode, setViewMode] = useState<'study' | 'edit' | 'split'>(() => {
    return initialContent && initialContent.trim().length > 0 ? 'study' : 'edit';
  });

  // Full Screen Reading Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>('base');
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>('normal');

  // Text Selection Highlighter State
  const [selectionTooltip, setSelectionTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });
  const [isHighlighterActive, setIsHighlighterActive] = useState(true);

  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [aiFormattedNotice, setAiFormattedNotice] = useState(false);
  const [codeCopiedIdx, setCodeCopiedIdx] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showImageToast, setShowImageToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  // Debounced Auto-Save
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSave(content);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, onSave]);

  // Keyboard shortcut Ctrl+S (Save), ESC (Exit Fullscreen), F11 / Alt+F (Toggle Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(content);
        soundManager.playCompleteChime();
        setSaveStatus('saved');
        setSaveSuccess(true);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setTimeout(() => setSaveSuccess(false), 2000);
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        soundManager.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, onSave, isFullscreen]);

  // Handle Text Selection for Floating Highlighter
  const handleMouseUpSelection = () => {
    if (!isHighlighterActive) return;
    
    // Give browser small microtask to finalize range
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelectionTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const text = sel.toString().trim();
      if (!text || text.length < 2) {
        setSelectionTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0) {
          setSelectionTooltip({
            visible: true,
            x: Math.max(12, rect.left + rect.width / 2),
            y: Math.max(10, rect.top - 8),
            text
          });
        }
      } catch (e) {
        // ignore
      }
    }, 10);
  };

  const applyHighlight = (colorPrefix: '' | 'g:' | 'p:' | 'b:' | 'r:') => {
    const text = selectionTooltip.text;
    if (!text) return;

    soundManager.playCompleteChime();
    const tag = `==${colorPrefix}${text}==`;

    if (content.includes(text)) {
      const updated = content.replace(text, tag);
      setContent(updated);
      onSave(updated);
    } else {
      // Fallback: append or insert in markdown
      const updated = content + `\n${tag}`;
      setContent(updated);
      onSave(updated);
    }

    setSelectionTooltip({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();
  };

  // Compress image before embedding
  const compressAndReadImage = (file: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Direct Screenshot / Image Paste Handler (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          soundManager.playClick();
          setIsProcessingImage(true);

          try {
            const base64Data = await compressAndReadImage(file);
            const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const title = file.name && file.name !== 'image.png' ? file.name : `Screenshot ${timeStr}`;

            if (onAddImage) {
              onAddImage({ title, dataUrl: base64Data, fileSize: file.size });
            }
            soundManager.playCompleteChime();
            setShowImageToast(true);
            setTimeout(() => setShowImageToast(false), 2500);
          } catch (err) {
            console.error('Failed to paste screenshot:', err);
          } finally {
            setIsProcessingImage(false);
          }
          return;
        }
      }
    }
  };

  // Image Upload File Dialog Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setIsProcessingImage(true);
    soundManager.playClick();

    try {
      const base64Data = await compressAndReadImage(file);
      if (onAddImage) {
        onAddImage({ title: file.name, dataUrl: base64Data, fileSize: file.size });
      }
      soundManager.playCompleteChime();
      setShowImageToast(true);
      setTimeout(() => setShowImageToast(false), 2500);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsProcessingImage(false);
      if (fileInputImageRef.current) fileInputImageRef.current.value = '';
    }
  };

  // Toggle Voice Typing (Speech-to-Text)
  const toggleVoiceTyping = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      soundManager.playClick();
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Indian English / Hinglish speech

        recognition.onstart = () => {
          setIsListening(true);
          soundManager.playCompleteChime();
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          if (transcript) {
            setContent(prev => (prev ? prev + ' ' + transcript.trim() : transcript.trim()));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.error('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  // Sync if topic changes & auto-migrate any legacy base64 image strings to image attachments
  useEffect(() => {
    if (initialContent && initialContent.includes('data:image/')) {
      const regex = /!\[(.*?)\]\((data:image\/[^\)]+)\)/g;
      let match;
      while ((match = regex.exec(initialContent)) !== null) {
        const title = match[1] || 'Screenshot';
        const dataUrl = match[2];
        if (onAddImage && (!images || !images.some(img => img.dataUrl === dataUrl))) {
          onAddImage({ title, dataUrl });
        }
      }
      const cleaned = initialContent.replace(regex, '').trim();
      setContent(cleaned);
      onSave(cleaned);
    } else {
      setContent(initialContent || '');
    }
    if (!initialContent || initialContent.trim().length === 0) {
      setViewMode('edit');
    }
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
    soundManager.playClick();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setViewMode('study');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click AI Beautifier & Formatter for Gemini / ChatGPT raw text
  const handleFormatAiNotes = () => {
    if (!content.trim()) return;
    soundManager.playCompleteChime();
    const formatted = formatAiNotes(content, {
      topicName,
      subjectName,
      chapterName,
      examName
    });
    setContent(formatted);
    onSave(formatted);
    setAiFormattedNotice(true);
    setTimeout(() => setAiFormattedNotice(false), 3000);
  };

  // 1-Click Copy AI Prompt for Gemini / ChatGPT
  const handleCopyAiPrompt = () => {
    const prompt = generateAiNotesPrompt({
      topicName,
      subjectName,
      chapterName,
      examName
    });
    navigator.clipboard.writeText(prompt);
    soundManager.playCompleteChime();
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
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

  const insertComparisonTableTemplate = () => {
    const tpl = `\n### Comparison Table & Key Parameters\n| Concept / Case | Formula / Rule | Shortcut / Key Note |\n| :--- | :--- | :--- |\n| Case 1: Constant Distance | $t_1 / t_2 = s_2 / s_1$ | Time inversely proportional to speed |\n| Case 2: Constant Time | $d_1 / d_2 = s_1 / s_2$ | Distance directly proportional to speed |\n| Case 3: Relative Speed (Same Dir) | $S_{rel} = s_1 - s_2$ | Subtract speeds |\n| Case 4: Relative Speed (Opp Dir) | $S_{rel} = s_1 + s_2$ | Add speeds |\n`;
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

  // Rich Inline Markdown Parser with Multi-color Highlighters
  const parseInlineMarkdown = (text: string, keyPrefix: string = 'inline'): React.ReactNode[] => {
    if (!text) return [];

    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==[^=]+==|~~[^~]+~~|\$\$[^\$]+\$\$|\$[^\$]+\$|⏱️\s*\[\d{1,2}:\d{2}(?::\d{2})?\]|\[\d{1,2}:\d{2}(?::\d{2})?\])/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      const k = `${keyPrefix}-${index}`;
      if (!part) return null;

      // Bold
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={k} className="font-black text-[#11120F] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Italic
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={k} className="italic text-[#4A4B45] dark:text-[#CBD5E1]">
            {part.slice(1, -1)}
          </em>
        );
      }
      // Code / Key Term
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={k}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/15 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 font-mono text-[11px] sm:text-xs border border-amber-500/25"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Multi-Color Highlights (==text==, ==g:text==, ==p:text==, ==b:text==, ==r:text==)
      if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
        const rawInner = part.slice(2, -2);
        let colorClass = 'bg-yellow-300/80 dark:bg-yellow-400/35 text-slate-950 dark:text-yellow-100 border-b-2 border-yellow-500/50';
        let highlightText = rawInner;

        if (rawInner.startsWith('g:')) {
          colorClass = 'bg-emerald-300/80 dark:bg-emerald-500/35 text-slate-950 dark:text-emerald-100 border-b-2 border-emerald-500/50';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('p:')) {
          colorClass = 'bg-purple-300/80 dark:bg-purple-500/35 text-slate-950 dark:text-purple-100 border-b-2 border-purple-500/50';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('b:')) {
          colorClass = 'bg-sky-300/80 dark:bg-sky-500/35 text-slate-950 dark:text-sky-100 border-b-2 border-sky-500/50';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('r:')) {
          colorClass = 'bg-rose-300/80 dark:bg-rose-500/35 text-slate-950 dark:text-rose-100 border-b-2 border-rose-500/50';
          highlightText = rawInner.slice(2);
        }

        return (
          <mark
            key={k}
            className={`${colorClass} px-1.5 py-0.5 mx-0.5 rounded font-bold shadow-xs transition-colors`}
          >
            {highlightText}
          </mark>
        );
      }
      // Strikethrough
      if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
        return (
          <del key={k} className="line-through text-slate-400 opacity-75">
            {part.slice(2, -2)}
          </del>
        );
      }
      // Math / Formula badge
      if (
        (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) ||
        (part.startsWith('$') && part.endsWith('$') && part.length >= 2)
      ) {
        const mathContent = part.startsWith('$$') ? part.slice(2, -2) : part.slice(1, -1);
        return (
          <span
            key={k}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono font-bold text-[11px] sm:text-xs"
          >
            <span className="text-purple-500 text-[10px]">∑</span>
            <span>{mathContent}</span>
          </span>
        );
      }
      // Video Timestamp jump
      const tsMatch = part.match(/(?:⏱️\s*)?(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?/);
      if (tsMatch && tsMatch[1] && (part.includes(':') || part.includes('⏱️'))) {
        const timeStr = tsMatch[1];
        const seconds = parseTimestampToSeconds(timeStr);
        return (
          <button
            key={k}
            type="button"
            onClick={() => {
              soundManager.playClick();
              if (onOpenSplitLecture) {
                onOpenSplitLecture(lectures?.[0]?.id, seconds);
              }
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/30 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
            title={`Click to jump lecture video to ${timeStr} ⏱️`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{timeStr}</span>
          </button>
        );
      }

      return part;
    });
  };

  // Custom Markdown, Tables & Callout Parser
  const renderFormattedNotes = (fontSizeClass: string = 'text-xs sm:text-sm') => {
    if ((!content || content.trim().length === 0) && (!images || images.length === 0)) {
      return (
        <div className="py-12 px-4 text-center space-y-4 select-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-serif">
              No notes added for "{topicName}" yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Gemini ya ChatGPT se study notes copy karke yahan paste karein — hamara AI Formatter automatically unhe professional structured notes me convert kar dega!
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
            <button
              onClick={handleCopyAiPrompt}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>{promptCopied ? '✓ Prompt Copied!' : '🤖 Copy AI Prompt for Gemini / ChatGPT'}</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#596B35] dark:bg-[#7AA2F7] hover:bg-[#4a5a2d] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write or Paste Notes</span>
            </button>
          </div>
        </div>
      );
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let taskCounter = 0;
    let codeBlockCounter = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced Code Blocks (```lang ... ```)
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
        const lang = langMatch && langMatch[1] ? langMatch[1].toUpperCase() : 'CODE';
        const codeLines: string[] = [];
        i++; // skip opening ```

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```

        const fullCode = codeLines.join('\n');
        const currentCodeIdx = codeBlockCounter++;
        const isCodeCopied = codeCopiedIdx === currentCodeIdx;

        elements.push(
          <div
            key={'code-' + i}
            className="my-3.5 rounded-2xl border border-slate-700/80 bg-[#0F1017] shadow-md overflow-hidden text-slate-200"
          >
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#181926] border-b border-slate-800 text-[11px] font-mono">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                {lang}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullCode);
                  soundManager.playClick();
                  setCodeCopiedIdx(currentCodeIdx);
                  setTimeout(() => setCodeCopiedIdx(null), 2000);
                }}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
              >
                {isCodeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCodeCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-emerald-400/90 selection:bg-purple-500/30">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 2. Markdown Tables (| col1 | col2 |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];

        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) => {
            return rowStr
              .slice(1, -1)
              .split('|')
              .map(c => c.trim());
          };

          const rawHeaders = parseRow(tableLines[0]);
          // Check if line 1 is separator |---|---|
          const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
          const dataRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

          elements.push(
            <div
              key={'table-' + i}
              className="my-4 overflow-x-auto rounded-2xl border border-[#D8D8CF] dark:border-[#272730] shadow-sm bg-white/60 dark:bg-[#12131A]/80 backdrop-blur-sm"
            >
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#F7F6F0] to-[#ECECE4] dark:from-[#181926] dark:to-[#1E2030] border-b border-[#D8D8CF] dark:border-[#272730] text-[11px] font-black uppercase tracking-wider text-[#11120F] dark:text-[#C0CAF5] font-serif">
                    {rawHeaders.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-2.5 px-3.5 sm:px-4 font-extrabold border-r border-[#D8D8CF]/50 dark:border-[#272730]/50 last:border-r-0"
                      >
                        {parseInlineMarkdown(h, `th-${i}-${hIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D8CF]/40 dark:divide-[#272730]/60">
                  {dataRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`transition-colors hover:bg-[#596B35]/5 dark:hover:bg-[#7AA2F7]/5 ${
                        rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-[#161722]/50'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2.5 px-3.5 sm:px-4 text-xs font-medium text-[#11120F] dark:text-slate-200 border-r border-[#D8D8CF]/30 dark:border-[#272730]/30 last:border-r-0 leading-relaxed"
                        >
                          {parseInlineMarkdown(cell, `td-${i}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. Callout Blocks (> [!TYPE] ...)
      if (line.trim().startsWith('> [!')) {
        const match = line.trim().match(/^>\s*\[!([A-Z]+)\]/i);
        const calloutType = match ? match[1].toUpperCase() : 'NOTE';
        const calloutLines: string[] = [];

        // Collect all consecutive callout lines
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const l = lines[i].trim().replace(/^>\s*/, '');
          if (!l.startsWith('[!')) {
            calloutLines.push(l);
          }
          i++;
        }

        let borderCol = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
        let IconComp = Info;
        let title = 'Key Note';

        if (calloutType === 'FORMULA' || calloutType === 'MATH') {
          borderCol = 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300';
          IconComp = Sigma;
          title = 'Formula & Equations';
        } else if (calloutType === 'TIP' || calloutType === 'SHORTCUT' || calloutType === 'TRICK') {
          borderCol = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
          IconComp = Zap;
          title = 'Pro Tip & Speed Shortcut';
        } else if (calloutType === 'WARNING' || calloutType === 'TRAP' || calloutType === 'MISTAKE' || calloutType === 'CAUTION') {
          borderCol = 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300';
          IconComp = AlertTriangle;
          title = 'Exam Trap & High-Frequency Mistake';
        } else if (calloutType === 'RULE' || calloutType === 'KEY' || calloutType === 'CONCEPT') {
          borderCol = 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
          IconComp = BookOpen;
          title = 'Golden Rule & Core Concept';
        } else if (calloutType === 'EXAMPLE' || calloutType === 'QUESTION') {
          borderCol = 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
          IconComp = Sparkles;
          title = 'Solved Exam Example';
        }

        elements.push(
          <div
            key={'callout-' + i}
            className={`my-3.5 p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm shadow-sm ${borderCol}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <IconComp className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider font-serif">{title}</span>
            </div>
            <div className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 space-y-1.5 pl-6 leading-relaxed">
              {calloutLines.map((cl, cIdx) => (
                <p key={cIdx}>
                  {parseInlineMarkdown(cl, `callout-${i}-${cIdx}`)}
                </p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 4. Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={i}
            className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-6 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 font-serif"
          >
            <span className="w-1.5 h-6 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] inline-block shrink-0" />
            <span>{parseInlineMarkdown(line.replace('# ', ''), `h1-${i}`)}</span>
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={i}
            className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-5 mb-2 flex items-center gap-2 font-serif"
          >
            <span className="w-1.5 h-5 rounded-full bg-purple-500 inline-block shrink-0" />
            <span>{parseInlineMarkdown(line.replace('## ', ''), `h2-${i}`)}</span>
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={i}
            className="text-xs sm:text-base font-black text-[#596B35] dark:text-[#7AA2F7] mt-4 mb-1.5 uppercase tracking-wider font-mono flex items-center gap-1.5"
          >
            <span>▶</span>
            <span>{parseInlineMarkdown(line.replace('### ', ''), `h3-${i}`)}</span>
          </h3>
        );
      }
      // 5. Checkbox Tasks (- [ ] / - [x])
      else if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
        const isDone = line.trim().startsWith('- [x] ');
        const taskText = line.trim().substring(6);
        const currentTaskIdx = taskCounter++;

        elements.push(
          <div
            key={i}
            onClick={() => toggleCheckboxInText(currentTaskIdx)}
            className={`flex items-center gap-3 p-2.5 sm:p-3 my-1.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
              isDone
                ? 'bg-emerald-500/10 text-slate-400 line-through'
                : 'bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#D8D8CF]/60 dark:border-[#272730]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
              }`}
            >
              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span className={`${fontSizeClass} font-semibold leading-relaxed`}>
              {parseInlineMarkdown(taskText, `task-${i}`)}
            </span>
          </div>
        );
      }
      // 6. Bullet lists
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const rawBullet = line.trim().substring(2);
        elements.push(
          <div key={i} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-2.5 shrink-0" />
            <div className={`${fontSizeClass} text-slate-700 dark:text-slate-300 font-medium`}>
              {parseInlineMarkdown(rawBullet, `bullet-${i}`)}
            </div>
          </div>
        );
      }
      // 7. Numbered lists (1. Item)
      else if (/^\s*\d+\.\s+(.*)$/.test(line.trim())) {
        const numMatch = line.trim().match(/^\s*(\d+)\.\s+(.*)$/);
        const num = numMatch ? numMatch[1] : '1';
        const numText = numMatch ? numMatch[2] : line.trim();

        elements.push(
          <div key={i} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
            <span className="px-1.5 py-0.2 rounded-md bg-[#596B35]/15 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] text-[10px] font-mono font-bold mt-0.5 shrink-0">
              {num}.
            </span>
            <div className={`${fontSizeClass} text-slate-700 dark:text-slate-300 font-medium`}>
              {parseInlineMarkdown(numText, `num-${i}`)}
            </div>
          </div>
        );
      }
      // 8. Horizontal Rule
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800" />);
      }
      // 9. Blank Line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      }
      // 10. Inline Images
      else if (line.trim().match(/^!\[(.*?)\]\((.*?)\)$/)) {
        const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
        const altText = imgMatch ? imgMatch[1] : 'Image';
        const imgSrc = imgMatch ? imgMatch[2] : '';
        elements.push(
          <div
            key={i}
            className="my-3 max-w-2xl rounded-2xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] bg-[#141418] shadow-md group"
          >
            <div className="relative">
              <img
                src={imgSrc}
                alt={altText}
                onClick={() => setZoomImage({ src: imgSrc, title: altText })}
                className="w-full max-h-96 object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => setZoomImage({ src: imgSrc, title: altText })}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="View Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-3 py-1.5 bg-[#18181D]/90 border-t border-[#272730] flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span className="truncate font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-[#8B5CF6]" />
                {altText}
              </span>
              <button
                type="button"
                onClick={() => setZoomImage({ src: imgSrc, title: altText })}
                className="text-[10px] font-bold text-[#8B5CF6] hover:underline cursor-pointer"
              >
                Click to Enlarge 🔍
              </button>
            </div>
          </div>
        );
      }
      // 11. Regular Paragraph with inline formatting
      else {
        elements.push(
          <p key={i} className={`${fontSizeClass} text-slate-700 dark:text-slate-300 leading-relaxed font-sans my-1`}>
            {parseInlineMarkdown(line, `p-${i}`)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const getFontSizeClass = () => {
    switch (readerFontSize) {
      case 'sm':
        return 'text-xs sm:text-xs leading-relaxed';
      case 'base':
        return 'text-xs sm:text-sm leading-relaxed';
      case 'lg':
        return 'text-sm sm:text-base leading-relaxed';
      case 'xl':
        return 'text-base sm:text-lg leading-loose';
      default:
        return 'text-xs sm:text-sm leading-relaxed';
    }
  };

  const getReaderWidthClass = () => {
    switch (readerWidth) {
      case 'normal':
        return 'max-w-3xl';
      case 'wide':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-7xl';
      default:
        return 'max-w-3xl';
    }
  };

  // ----------------------------------------------------------------------------------
  // RENDER FLOATING TEXT HIGHLIGHTER TOOLTIP
  // ----------------------------------------------------------------------------------
  const renderFloatingHighlighter = () => {
    if (!selectionTooltip.visible || !isHighlighterActive) return null;

    return (
      <div
        style={{
          position: 'fixed',
          left: `${selectionTooltip.x}px`,
          top: `${selectionTooltip.y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 9999
        }}
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#11120F] dark:bg-[#1C1D26] text-white shadow-2xl border border-white/20 animate-fade-in select-none backdrop-blur-md"
        onMouseDown={e => e.preventDefault()}
      >
        <span className="text-[10px] font-bold text-[#A1A1B2] px-1 font-mono flex items-center gap-1">
          <Highlighter className="w-3 h-3 text-amber-400" />
          <span>Highlight:</span>
        </span>

        {/* 🟡 Yellow Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('')}
          className="w-5 h-5 rounded-full bg-yellow-400 hover:scale-125 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Yellow Highlight (==text==)"
        />

        {/* 🟢 Green Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('g:')}
          className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-125 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Green Highlight (==g:text==)"
        />

        {/* 🟣 Purple Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('p:')}
          className="w-5 h-5 rounded-full bg-purple-400 hover:scale-125 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Purple Highlight (==p:text==)"
        />

        {/* 🔵 Blue Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('b:')}
          className="w-5 h-5 rounded-full bg-sky-400 hover:scale-125 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Blue Highlight (==b:text==)"
        />

        {/* 🔴 Rose Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('r:')}
          className="w-5 h-5 rounded-full bg-rose-400 hover:scale-125 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Rose Highlight (==r:text==)"
        />

        <button
          type="button"
          onClick={() => setSelectionTooltip({ visible: false, x: 0, y: 0, text: '' })}
          className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-white/10 ml-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ----------------------------------------------------------------------------------
  // FULL SCREEN IMMERSIVE READING EXPERIENCE MODAL
  // ----------------------------------------------------------------------------------
  const renderFullScreenReaderModal = () => {
    if (!isFullscreen) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[150] bg-[#FAF8F5] dark:bg-[#0B0B0E] text-[#11120F] dark:text-[#F5F5F7] flex flex-col select-none animate-fade-in font-sans"
        onMouseUp={handleMouseUpSelection}
      >
        {/* Fullscreen Zen Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#D8D8CF] dark:border-[#272730] bg-white/80 dark:bg-[#12131C]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#596B35] to-[#3B4723] dark:from-[#7AA2F7] dark:to-[#415C9E] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7] truncate font-mono">
                <span>{subjectName || 'Subject'}</span>
                <span>•</span>
                <span className="truncate">{chapterName || 'Chapter'}</span>
              </div>
              <h2 className="text-sm sm:text-base font-black truncate font-serif">
                {topicName}
              </h2>
            </div>
          </div>

          {/* Reader View & Customization Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730]">
              <button
                type="button"
                onClick={() => setViewMode('study')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'study'
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
                    : 'text-[#65675F] dark:text-[#85877E]'
                }`}
              >
                Study View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
                    : 'text-[#65675F] dark:text-[#85877E]'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
                    : 'text-[#65675F] dark:text-[#85877E]'
                }`}
              >
                Split
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="hidden sm:flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-bold">
              <span className="text-[10px] text-[#85877E]">Size:</span>
              {(['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setReaderFontSize(size)}
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    readerFontSize === size
                      ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black'
                      : 'text-[#85877E] hover:text-[#11120F]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Container Width Adjuster */}
            <div className="hidden md:flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-bold">
              <span className="text-[10px] text-[#85877E]">Width:</span>
              {(['normal', 'wide', 'full'] as ReaderWidth[]).map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setReaderWidth(w)}
                  className={`px-1.5 py-0.5 rounded capitalize ${
                    readerWidth === w
                      ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black'
                      : 'text-[#85877E] hover:text-[#11120F]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Highlighter Toggle */}
            <button
              type="button"
              onClick={() => setIsHighlighterActive(prev => !prev)}
              title="Toggle interactive text selection highlighter"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isHighlighterActive
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-[#F7F6F0] dark:bg-[#1C1D26] border-[#D8D8CF] dark:border-[#272730] text-[#85877E]'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Highlighter {isHighlighterActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* PDF Export */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1C1D26] border border-[#D8D8CF] dark:border-[#272730] text-[#596B35] dark:text-[#7AA2F7] hover:bg-[#596B35]/15 cursor-pointer"
              title="Download / Print PDF"
            >
              <FileDown className="w-4 h-4" />
            </button>

            {/* Close / Exit Fullscreen */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsFullscreen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 text-xs font-black transition-all cursor-pointer"
              title="Exit Fullscreen (ESC)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className={`mx-auto ${getReaderWidthClass()}`}>
            {viewMode === 'study' && (
              <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] shadow-xl min-h-[70vh]">
                {renderFormattedNotes(getFontSizeClass())}
              </div>
            )}

            {viewMode === 'edit' && (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onPaste={handlePaste}
                  rows={24}
                  className="w-full p-6 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] font-mono text-sm text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-xl"
                />
              </div>
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onPaste={handlePaste}
                  rows={26}
                  className="w-full p-5 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-xl"
                />
                <div className="p-6 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar">
                  {renderFormattedNotes(getFontSizeClass())}
                </div>
              </div>
            )}
          </div>
        </div>

        {renderFloatingHighlighter()}
      </div>,
      document.body
    );
  };

  // ----------------------------------------------------------------------------------
  // MAIN COMPONENT JSX (Normal Drawer View)
  // ----------------------------------------------------------------------------------
  return (
    <div className="space-y-3" onPaste={handlePaste} ref={notesContainerRef} onMouseUp={handleMouseUpSelection}>
      {/* 1. TOP MAIN CONTROL & VIEW SWITCHER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm">
        
        {/* Segmented View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#12131A] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730]">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setViewMode('study');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'study'
                ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Study View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setViewMode('edit');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'edit'
                ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Notes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setViewMode('split');
            }}
            title="Side-by-side Editor & Live Visual Preview"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Live View</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* 🔲 FULL SCREEN FOCUS READER BUTTON */}
          <button
            type="button"
            onClick={() => {
              soundManager.playCompleteChime();
              setIsFullscreen(true);
            }}
            title="Open Fullscreen Immersive Reading Mode"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Maximize className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Full Screen Mode</span>
          </button>

          {/* 🖍️ Highlighter Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsHighlighterActive(prev => !prev);
              soundManager.playClick();
            }}
            title="Toggle interactive text selection highlighter (Select any text to highlight)"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isHighlighterActive
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-[#12131A] border-[#D8D8CF] dark:border-[#272730] text-[#85877E]'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlight {isHighlighterActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* 1-Click Copy AI Prompt Button */}
          <button
            type="button"
            onClick={handleCopyAiPrompt}
            title="Copy high-yield prompt for Google Gemini / ChatGPT to generate perfect structured notes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{promptCopied ? '✓ Prompt Copied!' : 'Copy AI Prompt'}</span>
            <span className="sm:hidden">{promptCopied ? '✓' : 'Prompt'}</span>
          </button>

          {/* 1-Click AI Smart Beautifier Button */}
          <button
            type="button"
            onClick={handleFormatAiNotes}
            disabled={!content.trim()}
            title="Auto-format copied text from Gemini/ChatGPT into clean formulas, exam traps, rules & checklists"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format AI Notes</span>
          </button>

          {onOpenSplitPdf && hasPdfAttachments && (
            <button
              onClick={onOpenSplitPdf}
              title="Study Attached PDF and Take Notes Side-by-Side in Split-Screen"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] dark:text-[#C4B5FD] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split PDF</span>
            </button>
          )}

          {onOpenSplitLecture && (
            <button
              onClick={() => onOpenSplitLecture(lectures?.[0]?.id, 0)}
              title="Watch Video Lecture & Take Synchronized Notes"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lecture Sync</span>
            </button>
          )}

          {/* Voice Typing */}
          <button
            type="button"
            onClick={toggleVoiceTyping}
            title={isListening ? 'Click to Stop Voice Typing' : 'Speak to Type Notes (Voice Typing)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                : 'bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            title="Export and Open Academic Notes as PDF"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#596B35]/15 hover:bg-[#596B35]/25 border border-[#596B35]/30 text-[#596B35] dark:text-[#8B5CF6] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Copy Raw Content */}
          <button
            onClick={handleCopy}
            title="Copy notes to clipboard"
            className="p-1.5 px-2 py-1.5 rounded-xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Auto-Save Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] text-[10px] font-mono font-bold">
            {saveStatus === 'saving' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#85877E]" />
                <span className="text-[#85877E]">Ready</span>
              </>
            )}
          </div>

          {viewMode !== 'study' && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              title="Save Changes & View Render (Ctrl + S)"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Done'}</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Formatted Success Banner */}
      {aiFormattedNotice && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-emerald-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>✨ Gemini / ChatGPT notes successfully converted to professional academic format with Callouts, Formulas & Tables!</span>
          </div>
          <button
            type="button"
            onClick={() => setAiFormattedNotice(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. EDITING TOOLBAR (Visible in Edit and Split modes) */}
      {viewMode !== 'study' && (
        <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm space-y-2">
          
          {/* Quick Syntax Insertion Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**', 'Bold Text')}
              className="px-2 py-1 rounded-lg text-xs font-black bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#E5E5DC] dark:hover:bg-[#2F303B] text-slate-700 dark:text-slate-300"
              title="Bold (**text**)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*', 'Italic Text')}
              className="px-2 py-1 rounded-lg text-xs font-serif italic bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#E5E5DC] dark:hover:bg-[#2F303B] text-slate-700 dark:text-slate-300"
              title="Italic (*text*)"
            >
              I
            </button>
            
            {/* Highlighter Quick Insert Pill */}
            <button
              type="button"
              onClick={() => insertText('==', '==', 'Yellow Highlight')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-yellow-400/25 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-400/35 border border-yellow-400/35 flex items-center gap-1"
              title="Yellow Highlight (==text==)"
            >
              <Highlighter className="w-3 h-3 text-yellow-500" />
              <span>HL</span>
            </button>
            <button
              type="button"
              onClick={() => insertText('==g:', '==', 'Green Highlight')}
              className="px-1.5 py-1 rounded-lg text-xs font-bold bg-emerald-400/25 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-400/35 border border-emerald-400/35"
              title="Green Highlight (==g:text==)"
            >
              🟢
            </button>
            <button
              type="button"
              onClick={() => insertText('==p:', '==', 'Purple Highlight')}
              className="px-1.5 py-1 rounded-lg text-xs font-bold bg-purple-400/25 text-purple-800 dark:text-purple-300 hover:bg-purple-400/35 border border-purple-400/35"
              title="Purple Highlight (==p:text==)"
            >
              🟣
            </button>

            <button
              type="button"
              onClick={() => insertText('# ', '', 'Main Heading')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#E5E5DC] dark:hover:bg-[#2F303B] text-slate-700 dark:text-slate-300 flex items-center gap-0.5"
              title="Heading 1"
            >
              <Hash className="w-3 h-3" /> 1
            </button>
            <button
              type="button"
              onClick={() => insertText('## ', '', 'Subheading')}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#E5E5DC] dark:hover:bg-[#2F303B] text-slate-700 dark:text-slate-300 flex items-center gap-0.5"
              title="Heading 2"
            >
              <Hash className="w-3 h-3" /> 2
            </button>

            {/* Formula Block */}
            <button
              type="button"
              onClick={() => insertText('> [!FORMULA]\n> ', '', 'Formula: Speed = Distance / Time')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1"
              title="Insert Formula Callout Card"
            >
              <Sigma className="w-3 h-3" />
              <span>Formula</span>
            </button>

            {/* Shortcut Tip */}
            <button
              type="button"
              onClick={() => insertText('> [!TIP]\n> ', '', 'Shortcut Method / Speed Trick')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1"
              title="Insert Shortcut Tip Card"
            >
              <Zap className="w-3 h-3" />
              <span>Shortcut</span>
            </button>

            {/* Warning / Exam Trap */}
            <button
              type="button"
              onClick={() => insertText('> [!WARNING]\n> ', '', 'Common Exam Trap to Avoid')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1"
              title="Insert Exam Trap / Warning Card"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Trap</span>
            </button>

            {/* Golden Rule */}
            <button
              type="button"
              onClick={() => insertText('> [!RULE]\n> ', '', 'Golden Rule / Fundamental Law')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1"
              title="Insert Golden Rule Card"
            >
              <BookOpen className="w-3 h-3" />
              <span>Rule</span>
            </button>

            {/* Checklist */}
            <button
              type="button"
              onClick={() => insertText('- [ ] ', '', 'High-yield practice question or concept')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#E5E5DC] dark:hover:bg-[#2F303B] text-slate-700 dark:text-slate-300 flex items-center gap-1"
              title="Insert Checklist Item"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Checklist</span>
            </button>

            {/* Table */}
            <button
              type="button"
              onClick={insertComparisonTableTemplate}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1"
              title="Insert Comparison Table"
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>

            {/* Code / Monospace Block */}
            <button
              type="button"
              onClick={() => insertText('```text\n', '\n```', 'Your raw equations or data')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 border border-slate-500/30 flex items-center gap-1"
              title="Insert Code / Monospace Block"
            >
              <Code className="w-3 h-3" />
              <span>Code Block</span>
            </button>

            {/* Timestamp Sync Button */}
            <button
              type="button"
              onClick={() => insertText('\n- ⏱️ [00:00] **Key Concept**: ', '', '')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1 cursor-pointer"
              title="Insert Clickable Video Timestamp (e.g. ⏱️ [12:34])"
            >
              <Clock className="w-3 h-3" />
              <span>+ Timestamp</span>
            </button>

            {/* Image Upload Input */}
            <input
              type="file"
              ref={fileInputImageRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputImageRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 cursor-pointer"
              title="Upload Image or Paste Screenshot (Ctrl+V supported)"
            >
              <ImageIcon className="w-3 h-3" />
              <span>+ Image</span>
            </button>
          </div>

          {/* Quick Preset Templates */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D8D8CF]/60 dark:border-[#272730]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">1-Click Templates:</span>
              <button
                type="button"
                onClick={insertFormulaTemplate}
                className="px-2 py-0.5 rounded-md bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors cursor-pointer"
              >
                + Formula Sheet
              </button>
              <button
                type="button"
                onClick={insertComparisonTableTemplate}
                className="px-2 py-0.5 rounded-md bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors cursor-pointer"
              >
                + Comparison Table
              </button>
              <button
                type="button"
                onClick={insertGrammarRuleTemplate}
                className="px-2 py-0.5 rounded-md bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors cursor-pointer"
              >
                + Rules & Traps Guide
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-purple-600 dark:text-purple-400 font-semibold font-mono">
              <span>🖍️ Select text to highlight</span>
              <span>•</span>
              <span>📸 Ctrl+V Screenshot</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing Image Notice */}
      {isProcessingImage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold animate-pulse">
          <ImageIcon className="w-4 h-4 animate-bounce" />
          <span>Processing and optimizing screenshot...</span>
        </div>
      )}

      {/* Screenshot Success Toast */}
      {showImageToast && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Screenshot attached successfully to this topic!</span>
        </div>
      )}

      {/* Attached Screenshots Strip */}
      {viewMode !== 'study' && images && images.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/80 border border-[#D8D8CF] dark:border-[#272730] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] flex items-center gap-1.5 font-serif">
              <ImageIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Attached Screenshots & Diagrams ({images.length})
            </span>
            <span className="text-[10px] text-[#85877E]">Click to view • Press Ctrl+V to paste more</span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-[#383842] bg-black/20 shadow-sm"
              >
                <img
                  src={img.dataUrl}
                  alt={img.title}
                  onClick={() => setZoomImage({ src: img.dataUrl, title: img.title })}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImage({ src: img.dataUrl, title: img.title });
                    }}
                    className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white pointer-events-auto cursor-pointer"
                    title="Zoom Image"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(img.id);
                      }}
                      className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-600 text-white pointer-events-auto cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT BODY ACCORDING TO VIEW MODE */}
      {viewMode === 'edit' && (
        /* Full Editor Mode */
        <div className="space-y-2" onPaste={handlePaste}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder={`Paste your notes from Gemini or ChatGPT here, or write your own!\n\n💡 Pro-Tip: After pasting from Gemini/ChatGPT, click "✨ Format AI Notes" in the toolbar above to instantly generate structured callouts, formulas, traps & tables!\n\n> [!FORMULA]\n> Your formulas here\n\n> [!TIP]\n> Your shortcuts here\n\n> [!WARNING]\n> Exam traps here\n\n- [ ] Checklist items`}
            rows={14}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs sm:text-[13px] text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] dark:focus:ring-[#7AA2F7] shadow-inner"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span>{wordCount} words · {charCount} chars</span>
            <span>Supports Markdown, Tables, LaTeX Math & AI formatting</span>
          </div>
        </div>
      )}

      {viewMode === 'split' && (
        /* Split Live View (Side-by-Side Editor & Live Render) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" onPaste={handlePaste}>
          <div className="flex flex-col space-y-1.5">
            <div className="text-[11px] font-bold text-[#85877E] uppercase font-mono flex items-center justify-between px-1">
              <span>Markdown Source Editor</span>
              <span>{wordCount} words</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type or paste markdown..."
              rows={16}
              className="flex-1 w-full p-3.5 rounded-2xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-inner resize-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="text-[11px] font-bold text-[#85877E] uppercase font-mono px-1">
              <span>Live Visual Notes Preview</span>
            </div>
            <div className="flex-1 p-4 rounded-2xl bg-white/70 dark:bg-[#141520]/90 border border-[#D8D8CF] dark:border-[#272730] shadow-sm overflow-y-auto max-h-[480px] custom-scrollbar">
              {renderFormattedNotes()}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'study' && (
        /* Study Mode (Clean, magazine-quality visual notes) */
        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-white/70 dark:bg-[#141520]/90 border border-[#D8D8CF] dark:border-[#272730] shadow-sm min-h-[220px]">
            {renderFormattedNotes()}
          </div>

          {/* Attached Screenshots Gallery */}
          {images && images.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#18181D]/90 border border-[#D8D8CF] dark:border-[#272730] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5 font-serif">
                  <ImageIcon className="w-4 h-4 text-[#8B5CF6]" />
                  Attached Screenshots & Diagrams ({images.length})
                </span>
                <span className="text-[10px] text-[#85877E]">Click image to view in full resolution</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-[#272730] bg-[#121216] shadow-sm"
                  >
                    <div className="relative aspect-video flex items-center justify-center bg-black/40">
                      <img
                        src={img.dataUrl}
                        alt={img.title}
                        onClick={() => setZoomImage({ src: img.dataUrl, title: img.title })}
                        className="w-full h-full object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomImage({ src: img.dataUrl, title: img.title })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-[#18181D]/95 border-t border-[#272730] flex items-center justify-between text-[11px] text-[#A1A1AA]">
                      <span className="truncate font-medium max-w-[150px]">{img.title}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={img.dataUrl}
                          download={`${img.title || 'screenshot'}.png`}
                          className="p-1 rounded hover:text-white cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {onDeleteImage && (
                          <button
                            type="button"
                            onClick={() => onDeleteImage(img.id)}
                            className="p-1 rounded hover:text-rose-400 cursor-pointer"
                            title="Delete Screenshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Selection Highlighter Tooltip in Study View */}
      {renderFloatingHighlighter()}

      {/* Fullscreen Zen Reader Experience */}
      {renderFullScreenReaderModal()}

      {/* High-Res Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center cursor-default bg-[#18181D] p-3 rounded-2xl border border-[#272730] shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#272730] text-white">
              <span className="text-xs font-bold truncate max-w-md font-serif">{zoomImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomImage.src}
                  download={`${zoomImage.title || 'screenshot'}.png`}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={zoomImage.src}
              alt={zoomImage.title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
