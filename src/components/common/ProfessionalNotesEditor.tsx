import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen,
  Info,
  Hash,
  FileDown,
  Columns,
  Mic,
  MicOff,
  Image as ImageIcon,
  Maximize2,
  Download,
  Trash2,
  X,
  Plus,
  Clock,
  Play
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { generateAndOpenNotesPdf } from '../../utils/pdfGenerator';
import { TopicImageAttachment, TopicLecture } from '../../types/syllabus';
import { parseTimestampToSeconds } from '../../utils/youtubeUtils';

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
  const [isEditing, setIsEditing] = useState(!initialContent || initialContent.trim().length === 0);
  const [copied, setCopied] = useState(false);
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

  // Keyboard shortcut Ctrl+S / Cmd+S for instant manual save
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, onSave]);

  // Compress image before embedding to keep storage lightweight
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
        recognition.lang = 'en-IN'; // Highly accurate for Indian English / Hinglish speech

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
    if ((!content || content.trim().length === 0) && (!images || images.length === 0)) {
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
              Type or paste your formulas, rules, shortcuts, or simply paste a screenshot (Ctrl + V) to start building your notes.
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
          const l = lines[i].trim().replace(/^>\s*/, '');
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
      // Bullet list with timestamp support
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const rawBullet = line.trim().substring(2);
        const tsMatch = rawBullet.match(/^(?:⏱️\s*)?(?:\[|@)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?\s*(.*)$/);

        if (tsMatch && tsMatch[1]) {
          const timeStr = tsMatch[1];
          const seconds = parseTimestampToSeconds(timeStr);
          const restText = tsMatch[2];

          elements.push(
            <div key={i} className="flex items-start gap-2.5 my-1.5 pl-1 group/ts">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  if (onOpenSplitLecture) {
                    onOpenSplitLecture(lectures?.[0]?.id, seconds);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/30 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 mt-0.5"
                title={`Click to open lecture video at ${timeStr} ⏱️`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{timeStr}</span>
              </button>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {restText}
              </p>
            </div>
          );
        } else {
          elements.push(
            <div key={i} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {rawBullet}
              </p>
            </div>
          );
        }
      }
      // Horizontal Rule
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800" />);
      }
      // Blank Line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      }
      // Inline Markdown Images: ![alt](url) (for URLs or any other images)
      else if (line.trim().match(/^!\[(.*?)\]\((.*?)\)$/)) {
        const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
        const altText = imgMatch ? imgMatch[1] : 'Image';
        const imgSrc = imgMatch ? imgMatch[2] : '';
        elements.push(
          <div key={i} className="my-3 max-w-xl rounded-2xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] bg-[#141418] shadow-md group">
            <div className="relative">
              <img
                src={imgSrc}
                alt={altText}
                onClick={() => setZoomImage({ src: imgSrc, title: altText })}
                className="w-full max-h-80 object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
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
    <div className="space-y-3" onPaste={handlePaste}>
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
            <span>Edit Notes</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenSplitPdf && hasPdfAttachments && (
            <button
              onClick={onOpenSplitPdf}
              title="Study Attached PDF and Take Notes Side-by-Side in Split-Screen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] dark:text-[#C4B5FD] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split PDF</span>
            </button>
          )}

          {onOpenSplitLecture && (
            <button
              onClick={() => onOpenSplitLecture(lectures?.[0]?.id, 0)}
              title="Watch Video Lecture & Take Synchronized Notes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lecture Sync</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-600 text-white font-mono font-bold">
                SYNC
              </span>
            </button>
          )}

          {/* Voice Typing / Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleVoiceTyping}
            title={isListening ? 'Click to Stop Voice Typing' : 'Speak to Type Notes (Voice Typing)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                : 'bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Listening...' : 'Voice Typing'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            title="Export and Open Academic Notes as PDF in Chrome New Tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35]/15 hover:bg-[#596B35]/25 border border-[#596B35]/30 text-[#596B35] dark:text-[#8B5CF6] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
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

          {/* Real-Time Auto-Save Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[11px] font-mono font-bold">
            {saveStatus === 'saving' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Auto-Saved {lastSavedTime ? `• ${lastSavedTime}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#85877E]" />
                <span className="text-[#85877E]">Ready</span>
              </>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              title="Manual Instant Save (Ctrl + S)"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
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

            {/* Timestamp Sync Button */}
            <button
              type="button"
              onClick={() => insertText('\n- ⏱️ [00:00] **Key Concept**: ', '', '')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1 cursor-pointer"
              title="Insert Clickable Timestamp Tag (e.g. ⏱️ [12:34])"
            >
              <Clock className="w-3 h-3" />
              <span>+ Timestamp</span>
            </button>

            {/* Hidden Image Input */}
            <input
              type="file"
              ref={fileInputImageRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Insert / Paste Image Button */}
            <button
              type="button"
              onClick={() => fileInputImageRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 cursor-pointer"
              title="Upload Image or Paste Screenshot (Ctrl+V supported)"
            >
              <ImageIcon className="w-3 h-3" />
              <span>+ Image / Screenshot</span>
            </button>
          </div>

          {/* Preset Templates */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
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

            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              💡 Press <strong>Ctrl + V</strong> anywhere to paste screenshot
            </span>
          </div>
        </div>
      )}

      {/* Processing Image Notice */}
      {isProcessingImage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold animate-pulse">
          <ImageIcon className="w-4 h-4 animate-bounce" />
          <span>Processing and saving screenshot...</span>
        </div>
      )}

      {/* Screenshot Success Toast */}
      {showImageToast && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Screenshot attached successfully to this topic!</span>
        </div>
      )}

      {/* Attached Screenshots Strip (in Edit Mode) */}
      {isEditing && images && images.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/80 border border-[#D8D8CF] dark:border-[#272730] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Attached Screenshots & Images ({images.length})
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

      {/* Editor Content Body */}
      {isEditing ? (
        <div className="space-y-2" onPaste={handlePaste}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder={"Type your notes, formulas, rules, and memory tips here...\n\n📸 Tip: Press Ctrl + V anytime to paste a screenshot directly!\n\n> [!FORMULA]\n> Your formula here\n\n> [!WARNING]\n> Common trap here\n\n- [ ] Checklist item"}
            rows={12}
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-[13px] text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>{wordCount} words · {charCount} characters</span>
            <span>Markdown & LaTeX formula tags supported</span>
          </div>
        </div>
      ) : (
        /* Rendered Study Mode */
        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm min-h-[200px]">
            {renderFormattedNotes()}
          </div>

          {/* Attached Screenshots Gallery (in Study View) */}
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

      {/* High-Res Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center cursor-default bg-[#18181D] p-3 rounded-2xl border border-[#272730] shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#272730] text-white">
              <span className="text-xs font-bold truncate max-w-md">{zoomImage.title}</span>
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
