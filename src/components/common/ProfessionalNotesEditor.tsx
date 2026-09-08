import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Edit3,
  Eye,
  EyeOff,
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
  Maximize,
  Palette,
  Sun,
  Moon,
  BookMarked,
  Plus,
  Files,
  FileText,
  MoreVertical,
  Layers,
  CopyPlus,
  PenTool,
  Eraser,
  RotateCcw,
  Square,
  ArrowLeft,
  Ruler,
  Bookmark,
  List,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CornerDownRight
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { generateAndOpenNotesPdf } from '../../utils/pdfGenerator';
import { TopicImageAttachment, TopicLecture, TopicNoteItem } from '../../types/syllabus';
import { parseTimestampToSeconds } from '../../utils/youtubeUtils';
import { formatAiNotes, generateAiNotesPrompt } from '../../utils/aiNotesFormatter';
import { MathBlock, InlineMath } from '../../utils/mathRenderer';
import {
  cleanAndRepairMarkdownTable,
  isTableSeparatorRow,
  parseTableAlignments,
  processPastedNotesContent,
  repairAllTablesInDocument
} from '../../utils/tableUtils';
import {
  isQuizContent,
  parseQuizQuestions,
  formatQuizToMarkdown,
  generateGeminiQuizPrompt,
  getDefaultSampleQuiz,
  extractGeminiShareUrl
} from '../../utils/quizUtils';
import {
  isVocabContent,
  transformToVocabNotionCards,
  getDefaultSampleVocab
} from '../../utils/vocabCardArchitect';
import { NotionAiNotesStudioModal } from '../modals/NotionAiNotesStudioModal';

interface ProfessionalNotesEditorProps {
  initialContent: string;
  initialNoteItems?: TopicNoteItem[];
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
  onSave: (content: string, noteItems?: TopicNoteItem[]) => void;
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
type ReaderFontFamily = 'serif' | 'sans' | 'lexend' | 'mono';
type ReaderTheme = 'default' | 'sepia' | 'paper' | 'sage' | 'candle' | 'midnight' | 'oled';
type ReaderLayout = 'single' | 'spread';
type ReaderLineHeight = 'compact' | 'relaxed' | 'spacious';
type HighlighterMode = 'box' | 'freefall';

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  id: string;
  color: string;
  size: number;
  isEraser?: boolean;
  points: DrawingPoint[];
}

export const ProfessionalNotesEditor: React.FC<ProfessionalNotesEditorProps> = ({
  initialContent,
  initialNoteItems,
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
  // Multiple Notes Pages State
  const [noteItems, setNoteItems] = useState<TopicNoteItem[]>(() => {
    if (initialNoteItems && initialNoteItems.length > 0) {
      return initialNoteItems;
    }
    return [
      {
        id: 'note_1',
        title: 'Main Notes',
        content: initialContent || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    if (initialNoteItems && initialNoteItems.length > 0) {
      return initialNoteItems[0].id;
    }
    return 'note_1';
  });

  // Rename Note Title State
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [showAddTemplatesMenu, setShowAddTemplatesMenu] = useState(false);

  // Active Note computation
  const activeNote = noteItems.find(n => n.id === activeNoteId) || noteItems[0] || {
    id: 'note_1',
    title: 'Main Notes',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const content = activeNote.content;

  // View mode: 'study' (rendered view), 'edit' (markdown editor), 'split' (side-by-side)
  const [viewMode, setViewMode] = useState<'study' | 'edit' | 'split'>(() => {
    return content && content.trim().length > 0 ? 'study' : 'edit';
  });

  // Full Screen Reading Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Pure Notes Zen Focus Mode (Hides all top bars/sections/buttons)
  const [isZenMode, setIsZenMode] = useState(false);

  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>(() => {
    const saved = localStorage.getItem('syllabus3d_reader_font_size') as ReaderFontSize;
    if (saved && (['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).includes(saved)) {
      return saved;
    }
    return 'base';
  });
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>('normal');

  const handleSelectFontSize = (size: ReaderFontSize) => {
    setReaderFontSize(size);
    localStorage.setItem('syllabus3d_reader_font_size', size);
    soundManager.playClick();
  };

  // Reader Typography & Color Theme Customization (Persisted)
  const [readerFontFamily, setReaderFontFamily] = useState<ReaderFontFamily>(() => {
    return (localStorage.getItem('syllabus3d_notes_font') as ReaderFontFamily) || 'serif';
  });
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => {
    const saved = localStorage.getItem('syllabus3d_notes_theme') as ReaderTheme;
    if (saved && (['paper', 'sepia', 'sage', 'candle', 'oled'] as ReaderTheme[]).includes(saved)) {
      return saved;
    }
    return 'paper';
  });

  // Book Study Mode Layout & Ergonomics (Persisted)
  const [readerLayout, setReaderLayout] = useState<ReaderLayout>(() => {
    return (localStorage.getItem('syllabus3d_reader_layout') as ReaderLayout) || 'single';
  });
  const [readerLineHeight, setReaderLineHeight] = useState<ReaderLineHeight>(() => {
    return (localStorage.getItem('syllabus3d_reader_line_height') as ReaderLineHeight) || 'relaxed';
  });
  const [isFocusRulerActive, setIsFocusRulerActive] = useState<boolean>(false);
  const [focusRulerY, setFocusRulerY] = useState<number>(250);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);

  // ----------------------------------------------------------------------------------
  // HIGHLIGHTER MODES (Box / Text Selection vs Freefall Drawing Pen)
  // ----------------------------------------------------------------------------------
  const [isHighlighterActive, setIsHighlighterActive] = useState(true);
  const [highlighterMode, setHighlighterMode] = useState<HighlighterMode>('box');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<'' | 'g:' | 'p:' | 'b:' | 'r:'>('');

  // Freefall Drawing State
  const [freefallColor, setFreefallColor] = useState<string>('rgba(250, 204, 21, 0.42)'); // Yellow
  const [freefallSize, setFreefallSize] = useState<number>(14); // 5 (fine), 14 (marker), 24 (highlighter)
  const [isFreefallEraser, setIsFreefallEraser] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const fsNotesContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);

  // Text Selection Highlighter State
  const [selectionTooltip, setSelectionTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    isBelow?: boolean;
    text: string;
  }>({ visible: false, x: 0, y: 0, isBelow: false, text: '' });

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
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  
  // Interactive Quiz & Gemini MCQ State
  const [showQuizImportModal, setShowQuizImportModal] = useState<boolean>(false);
  const [quizInputLink, setQuizInputLink] = useState<string>('');
  const [quizInputText, setQuizInputText] = useState<string>('');
  const [quizPromptCopied, setQuizPromptCopied] = useState<boolean>(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, Record<string, string>>>({});

  // Notion AI Notes Studio State
  const [isNotionAiModalOpen, setIsNotionAiModalOpen] = useState<boolean>(false);
  const [notionAiPastedText, setNotionAiPastedText] = useState<string>('');
  const [showAiPastePromptToast, setShowAiPastePromptToast] = useState<boolean>(false);
  const [pendingAiPastedText, setPendingAiPastedText] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guard against re-initializing notes when user adds/edits notes within the same topic
  const prevTopicRef = useRef<string>(topicName);

  useEffect(() => {
    // Only re-sync from scratch when the topic actually changes
    if (prevTopicRef.current !== topicName) {
      prevTopicRef.current = topicName;
      if (initialNoteItems && initialNoteItems.length > 0) {
        setNoteItems(initialNoteItems);
        setActiveNoteId(initialNoteItems[0].id);
      } else {
        setNoteItems([
          {
            id: 'note_1',
            title: 'Main Notes',
            content: initialContent || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
        setActiveNoteId('note_1');
      }
    }
  }, [topicName, initialNoteItems, initialContent]);

  // Handle async delivery of noteItems for current topic if initially empty
  useEffect(() => {
    if (
      initialNoteItems &&
      initialNoteItems.length > 0 &&
      noteItems.length === 1 &&
      noteItems[0].id === 'note_1' &&
      !noteItems[0].content &&
      prevTopicRef.current === topicName
    ) {
      setNoteItems(initialNoteItems);
      if (!initialNoteItems.some(n => n.id === activeNoteId)) {
        setActiveNoteId(initialNoteItems[0].id);
      }
    }
  }, [initialNoteItems, topicName]);

  // Load Saved Freehand Strokes per Topic & Note
  useEffect(() => {
    try {
      const storageKey = `syllabus3d_draw_${topicName}_${activeNoteId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setStrokes(JSON.parse(saved));
      } else {
        setStrokes([]);
      }
    } catch (err) {
      setStrokes([]);
    }
  }, [topicName, activeNoteId]);

  // Debounced Auto-Save
  const updateContentAndSave = (newText: string, customItems?: TopicNoteItem[]) => {
    const updatedItems = (customItems || noteItems).map(item => {
      if (item.id === activeNoteId) {
        return { ...item, content: newText, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    setNoteItems(updatedItems);
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSave(newText, updatedItems);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(content, noteItems);
        soundManager.playCompleteChime();
        setSaveStatus('saved');
        setSaveSuccess(true);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setTimeout(() => setSaveSuccess(false), 2000);
      }
      if (e.key === 'Escape') {
        if (showQuizImportModal) {
          setShowQuizImportModal(false);
          soundManager.playClick();
        } else if (isTocOpen) {
          setIsTocOpen(false);
          soundManager.playClick();
        } else if (isZenMode) {
          setIsZenMode(false);
          soundManager.playClick();
        } else if (isFullscreen) {
          setIsFullscreen(false);
          soundManager.playClick();
        }
      }
      const isTyping = document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT';
      if ((e.key === 'z' || e.key === 'Z') && isFullscreen && !isTyping) {
        e.preventDefault();
        setIsZenMode(prev => !prev);
        soundManager.playClick();
      }
      if ((e.key === 't' || e.key === 'T') && isFullscreen && !isTyping) {
        e.preventDefault();
        setIsTocOpen(prev => !prev);
        soundManager.playClick();
      }
      if ((e.key === 'r' || e.key === 'R') && isFullscreen && !isTyping) {
        e.preventDefault();
        setIsFocusRulerActive(prev => !prev);
        soundManager.playClick();
      }

      // Universal Notion AI Studio Shortcut (Ctrl + J or Cmd + J)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        soundManager.playClick();
        setNotionAiPastedText(content);
        setIsNotionAiModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, noteItems, onSave, isFullscreen, isZenMode, isTocOpen, showQuizImportModal]);

  // Handle Browser History & Android Back Button / Gesture in Fullscreen & Zen Mode
  useEffect(() => {
    if (!isFullscreen) return;

    window.history.pushState({ modal: 'notes_fullscreen' }, '');

    const handlePopState = () => {
      setIsFullscreen(false);
      setIsZenMode(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isFullscreen]);

  // ----------------------------------------------------------------------------------
  // MULTI-NOTE ACTIONS (Add, Rename, Duplicate, Delete)
  // ----------------------------------------------------------------------------------
  const handleAddNewNote = (presetTitle?: string, presetContent?: string) => {
    soundManager.playCompleteChime();
    const nextNum = noteItems.length + 1;
    const newId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newNote: TopicNoteItem = {
      id: newId,
      title: presetTitle || `Note Page ${nextNum}`,
      content: presetContent || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...noteItems, newNote];
    setNoteItems(updated);
    setActiveNoteId(newId);
    setShowAddTemplatesMenu(false);
    
    // Automatically switch to interactive Study mode if this is a quiz note
    const isQuiz = isQuizContent(presetContent || '');
    setViewMode(isQuiz ? 'study' : 'edit');

    const primaryText = noteItems.find(n => n.id === 'note_1')?.content || noteItems[0]?.content || presetContent || '';
    onSave(primaryText, updated);
  };

  // Interactive Quiz Option Selection & Audio Handler
  const handleSelectQuizOption = (noteId: string, questionId: string, optionKey: string, isCorrect: boolean) => {
    setUserQuizAnswers(prev => ({
      ...prev,
      [noteId]: {
        ...(prev[noteId] || {}),
        [questionId]: optionKey
      }
    }));

    if (isCorrect) {
      soundManager.playCompleteChime();
    } else {
      soundManager.playClick();
    }
  };

  const handleRetakeQuiz = (noteId: string) => {
    setUserQuizAnswers(prev => ({
      ...prev,
      [noteId]: {}
    }));
    soundManager.playClick();
  };

  const handleCopyQuizAiPrompt = () => {
    const prompt = generateGeminiQuizPrompt(topicName, subjectName);
    navigator.clipboard.writeText(prompt);
    soundManager.playCompleteChime();
    setQuizPromptCopied(true);
    setTimeout(() => setQuizPromptCopied(false), 3000);
  };

  const handleCreateQuizFromModal = () => {
    let quizMarkdown = '';
    let title = `Quiz: ${topicName}`;

    const trimmedText = quizInputText.trim();
    const trimmedLink = quizInputLink.trim();

    if (trimmedText && isQuizContent(trimmedText)) {
      const parsed = parseQuizQuestions(trimmedText);
      if (parsed.questions.length > 0) {
        title = parsed.title || title;
        quizMarkdown = formatQuizToMarkdown(title, parsed.questions, trimmedLink || parsed.sourceUrl, topicName);
      } else {
        quizMarkdown = formatQuizToMarkdown(title, parseQuizQuestions(trimmedText).questions, trimmedLink, topicName);
      }
    } else if (trimmedLink) {
      quizMarkdown = getDefaultSampleQuiz(topicName, trimmedLink);
      title = `Gemini Quiz: ${topicName}`;
    } else {
      quizMarkdown = getDefaultSampleQuiz(topicName);
    }

    handleAddNewNote(title, quizMarkdown);
    setShowQuizImportModal(false);
    setQuizInputLink('');
    setQuizInputText('');
  };

  const handleDuplicateNote = (noteId: string) => {
    const target = noteItems.find(n => n.id === noteId);
    if (!target) return;
    soundManager.playClick();
    const newId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const copyNote: TopicNoteItem = {
      id: newId,
      title: `${target.title} (Copy)`,
      content: target.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...noteItems, copyNote];
    setNoteItems(updated);
    setActiveNoteId(newId);
    onSave(copyNote.content, updated);
  };

  const handleDeleteNote = (noteId: string) => {
    if (noteItems.length <= 1) {
      alert('At least one note page must remain.');
      return;
    }
    const target = noteItems.find(n => n.id === noteId);
    if (window.confirm(`Are you sure you want to delete note "${target?.title}"?`)) {
      soundManager.playClick();
      const updated = noteItems.filter(n => n.id !== noteId);
      setNoteItems(updated);
      const nextActive = updated[0];
      setActiveNoteId(nextActive.id);
      onSave(nextActive.content, updated);
    }
  };

  const handleStartRename = (note: TopicNoteItem) => {
    setEditingTitleId(note.id);
    setTempTitle(note.title);
  };

  const handleSaveRename = (noteId: string) => {
    if (!tempTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    const updated = noteItems.map(n => (n.id === noteId ? { ...n, title: tempTitle.trim(), updatedAt: new Date().toISOString() } : n));
    setNoteItems(updated);
    setEditingTitleId(null);
    onSave(content, updated);
    soundManager.playClick();
  };

  // Handle Font Change
  const handleSelectFont = (font: ReaderFontFamily) => {
    setReaderFontFamily(font);
    localStorage.setItem('syllabus3d_notes_font', font);
    soundManager.playClick();
  };

  // Handle Theme Change
  const handleSelectTheme = (theme: ReaderTheme) => {
    setReaderTheme(theme);
    localStorage.setItem('syllabus3d_notes_theme', theme);
    soundManager.playClick();
  };

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ----------------------------------------------------------------------------------
  // TEXT & BOX HIGHLIGHTER LOGIC
  // ----------------------------------------------------------------------------------
  const updateSelectionTooltip = useCallback(() => {
    if (viewMode !== 'study') return;

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
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const centerX = rect.left + rect.width / 2;
        const clampedX = Math.min(window.innerWidth - 130, Math.max(130, centerX));
        // On mobile, place below selection to avoid colliding with Android Chrome's top Copy/Share action bar
        const isBelow = isMobile || rect.top < 65;
        const posY = isBelow ? rect.bottom + 14 : rect.top - 8;

        setSelectionTooltip({
          visible: true,
          x: clampedX,
          y: posY,
          isBelow,
          text
        });
      }
    } catch (e) {
      // ignore
    }
  }, [viewMode]);

  const handleMouseUpSelection = () => {
    setTimeout(updateSelectionTooltip, 30);
  };

  useEffect(() => {
    if (viewMode !== 'study') return;

    let timeoutId: any = null;
    const handleSelectionChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSelectionTooltip, 80);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearTimeout(timeoutId);
    };
  }, [viewMode, updateSelectionTooltip]);

  const applyHighlight = (colorPrefix: '' | 'g:' | 'p:' | 'b:' | 'r:') => {
    const text = selectionTooltip.text;
    if (!text) return;

    soundManager.playCompleteChime();
    setSelectedHighlightColor(colorPrefix);
    const newTag = `==${colorPrefix}${text}==`;

    // Regex to match if this exact text is already highlighted with any prefix
    const highlightPattern = new RegExp(`==(?:[gpbr]:)?${escapeRegExp(text)}==`, 'g');

    let updated = content;
    if (highlightPattern.test(content)) {
      updated = content.replace(highlightPattern, newTag);
    } else if (content.includes(text)) {
      updated = content.replace(text, newTag);
    } else {
      updated = content + `\n${newTag}`;
    }

    updateContentAndSave(updated);
    setSelectionTooltip({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = (text: string) => {
    if (!text) return;
    soundManager.playClick();
    const highlightPattern = new RegExp(`==(?:[gpbr]:)?${escapeRegExp(text)}==`, 'g');
    let updated = content.replace(highlightPattern, text);
    updateContentAndSave(updated);
    setSelectionTooltip({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();
  };

  // ----------------------------------------------------------------------------------
  // FREEFALL / FREEHAND CANVAS DRAWING ENGINE
  // ----------------------------------------------------------------------------------
  const redrawCanvas = useCallback((targetCanvas: HTMLCanvasElement | null) => {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  // Sync canvas dimensions with notes text container
  const updateCanvasSize = useCallback((canvas: HTMLCanvasElement | null, container: HTMLElement | null) => {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const scrollW = Math.max(container.scrollWidth, rect.width);
    const scrollH = Math.max(container.scrollHeight, rect.height);

    if (canvas.width !== scrollW || canvas.height !== scrollH) {
      canvas.width = scrollW;
      canvas.height = scrollH;
      redrawCanvas(canvas);
    }
  }, [redrawCanvas]);

  useEffect(() => {
    if (viewMode === 'study') {
      const activeCanvas = isFullscreen ? fullscreenCanvasRef.current : canvasRef.current;
      const activeContainer = isFullscreen ? fsNotesContainerRef.current : notesContainerRef.current;
      updateCanvasSize(activeCanvas, activeContainer);
      redrawCanvas(activeCanvas);
    }
  }, [strokes, isFullscreen, viewMode, activeNoteId, updateCanvasSize, redrawCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (highlighterMode !== 'freefall' || !isHighlighterActive) return;
    const canvas = isFullscreen ? fullscreenCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newStroke: DrawingStroke = {
      id: 'str_' + Date.now(),
      color: isFreefallEraser ? '#000000' : freefallColor,
      size: freefallSize,
      isEraser: isFreefallEraser,
      points: [{ x, y }]
    };
    currentStrokeRef.current = newStroke;
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current || highlighterMode !== 'freefall' || !isHighlighterActive) return;
    const canvas = isFullscreen ? fullscreenCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const currentStroke = currentStrokeRef.current;
    currentStroke.points.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx && currentStroke.points.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (currentStroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      const prev = currentStroke.points[currentStroke.points.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const endDrawing = () => {
    if (!currentStrokeRef.current) return;
    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (finishedStroke.points.length >= 2) {
      const updated = [...strokes, finishedStroke];
      setStrokes(updated);
      try {
        const storageKey = `syllabus3d_draw_${topicName}_${activeNoteId}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {}
    }
  };

  const clearAllDrawings = () => {
    if (window.confirm('Clear all freehand drawings on this note?')) {
      soundManager.playClick();
      setStrokes([]);
      try {
        const storageKey = `syllabus3d_draw_${topicName}_${activeNoteId}`;
        localStorage.removeItem(storageKey);
      } catch (err) {}
      const canvas = isFullscreen ? fullscreenCanvasRef.current : canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
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

  // Direct Screenshot / Image & Smart AI Table/Formula Paste Handler (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    // 1. Check for image / screenshot paste first
    const items = e.clipboardData?.items;
    if (items) {
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
    }

    // 2. Smart AI Table & Formula Paste Processor
    const plainText = e.clipboardData?.getData('text/plain');
    const htmlText = e.clipboardData?.getData('text/html');

    if (plainText) {
      // 🔤 Smart Vocabulary Auto-Detection & Instant Notion Card Transform
      if (isVocabContent(plainText)) {
        e.preventDefault();
        soundManager.playClick();
        const vocabMarkdown = transformToVocabNotionCards(plainText);

        const targetEl = e.target instanceof HTMLTextAreaElement ? e.target : textareaRef.current;
        if (targetEl) {
          const start = targetEl.selectionStart ?? content.length;
          const end = targetEl.selectionEnd ?? content.length;
          const newContent = content.substring(0, start) + vocabMarkdown + content.substring(end);
          updateContentAndSave(newContent);
          setTimeout(() => {
            if (targetEl) {
              targetEl.selectionStart = start + vocabMarkdown.length;
              targetEl.selectionEnd = start + vocabMarkdown.length;
            }
          }, 0);
        } else {
          const newContent = content.trim() ? `${content}\n\n${vocabMarkdown}` : vocabMarkdown;
          updateContentAndSave(newContent);
        }

        soundManager.playCompleteChime();
        setPasteNotice('✓ Smart Notion Vocabulary Flashcards Auto-Created!');
        setTimeout(() => setPasteNotice(null), 4000);
        return;
      }

      // Offer 1-Click Notion AI Studio when user pastes notes from Gemini / ChatGPT / Claude (>80 chars)
      if (plainText.length > 80) {
        setPendingAiPastedText(plainText);
        setShowAiPastePromptToast(true);
        setTimeout(() => setShowAiPastePromptToast(false), 10000);
      }

      const isTargetInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      const processed = processPastedNotesContent(plainText, htmlText);

      if (processed.isTransformed) {
        e.preventDefault();
        soundManager.playClick();

        const targetEl = e.target instanceof HTMLTextAreaElement ? e.target : textareaRef.current;
        if (targetEl) {
          const start = targetEl.selectionStart ?? content.length;
          const end = targetEl.selectionEnd ?? content.length;
          const newContent = content.substring(0, start) + processed.content + content.substring(end);
          updateContentAndSave(newContent);
          setTimeout(() => {
            if (targetEl) {
              targetEl.selectionStart = start + processed.content.length;
              targetEl.selectionEnd = start + processed.content.length;
            }
          }, 0);
        } else {
          const newContent = content.trim() ? `${content}\n\n${processed.content}` : processed.content;
          updateContentAndSave(newContent);
        }

        setPasteNotice(`✓ ${processed.transformReason || 'Smart Table & Formula Formatting Applied!'}`);
        setTimeout(() => setPasteNotice(null), 3500);
      } else if (!isTargetInput) {
        // User pasted in study mode or container outside an input/textarea
        e.preventDefault();
        soundManager.playClick();
        const repairedText = repairAllTablesInDocument(plainText);
        const newContent = content.trim() ? `${content}\n\n${repairedText}` : repairedText;
        updateContentAndSave(newContent);
        setPasteNotice('✓ Notes Pasted & Formatted!');
        setTimeout(() => setPasteNotice(null), 3000);
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
        recognition.lang = 'en-IN';

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
            const updated = content ? content + ' ' + transcript.trim() : transcript.trim();
            updateContentAndSave(updated);
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

  const handleSave = () => {
    onSave(content, noteItems);
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
      topicName: `${topicName} — ${activeNote.title}`,
      subjectName,
      chapterName,
      examName
    });
    updateContentAndSave(formatted);
    setAiFormattedNotice(true);
    setTimeout(() => setAiFormattedNotice(false), 3000);
  };

  // 1-Click Copy AI Prompt for Gemini / ChatGPT
  const handleCopyAiPrompt = () => {
    const prompt = generateAiNotesPrompt({
      topicName: `${topicName} (${activeNote.title})`,
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
      topicName: `${topicName} • ${activeNote.title}`,
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
    updateContentAndSave(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  // Insert Templates
  const insertFormulaTemplate = () => {
    const tpl = `\n# Key Formulas & Definitions\n> [!FORMULA]\n> Standard Speed Formula: $$\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}$$\n> Average Speed (Constant Distance): $$\\text{Average Speed} = \\frac{2xy}{x + y}$$\n\n> [!TIP]\n> Shortcut Method: Ratio method converts speed ratio $a:b$ to time ratio $b:a$.\n\n> [!WARNING]\n> Common Trap: Don't take simple arithmetic average $(x+y)/2$ when distance is constant!\n\n### High-Yield Action Checklist\n- [ ] Memorize basic conversion: $1\\text{ km/h} = \\frac{5}{18}\\text{ m/s}$\n- [ ] Practice 5 previous year exam questions\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
  };

  const insertComparisonTableTemplate = () => {
    const tpl = `\n### Comparison Table & Key Parameters\n| Concept / Case | Formula / Rule | Shortcut / Key Note |\n| :--- | :---: | :--- |\n| Case 1: Constant Distance | $\\frac{t_1}{t_2} = \\frac{s_2}{s_1}$ | Time inversely proportional to speed |\n| Case 2: Constant Time | $\\frac{d_1}{d_2} = \\frac{s_1}{s_2}$ | Distance directly proportional to speed |\n| Case 3: Relative Speed (Same Dir) | $S_{rel} = s_1 - s_2$ | Subtract speeds |\n| Case 4: Relative Speed (Opp Dir) | $S_{rel} = s_1 + s_2$ | Add speeds |\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
  };

  // 1-Click Table & Formula Healer
  const handleRepairTablesAndFormulas = () => {
    if (!content.trim()) return;
    soundManager.playCompleteChime();
    const repaired = repairAllTablesInDocument(content);
    updateContentAndSave(repaired);
    setPasteNotice('✓ Tables & Formulas Repaired & Beautified!');
    setTimeout(() => setPasteNotice(null), 3500);
  };

  const insertGrammarRuleTemplate = () => {
    const tpl = `\n# Core Grammar & Rule Guide\n> [!RULE]\n> Golden Rule: Singular subjects take singular verbs; plural subjects take plural verbs.\n\n> [!WARNING]\n> High-Frequency Exception: Expressions like 'along with', 'as well as', 'in addition to' do not change the subject number.\n\n### Practice Traps\n- [ ] Check subject before the prepositional phrase\n- [ ] Verify tense consistency across clauses\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
  };

  // Toggle checklist item in rendered view
  const toggleCheckboxInText = (boxIndex: number) => {
    const lines = content.split('\n');
    let currentBoxCount = 0;
    const newLines = lines.map((l) => {
      const isBox =
        l.trim().startsWith('- [ ] ') ||
        l.trim().startsWith('- [x] ') ||
        l.trim().startsWith('- [X] ') ||
        l.trim().startsWith('* [ ] ') ||
        l.trim().startsWith('* [x] ') ||
        l.trim().startsWith('* [X] ') ||
        l.trim().startsWith('> - [ ] ') ||
        l.trim().startsWith('> - [x] ') ||
        l.trim().startsWith('> - [X] ') ||
        l.trim().startsWith('> * [ ] ') ||
        l.trim().startsWith('> * [x] ') ||
        l.trim().startsWith('> * [X] ');
      if (isBox) {
        const thisIdx = currentBoxCount;
        currentBoxCount++;
        if (thisIdx === boxIndex) {
          if (l.includes('[ ]')) {
            return l.replace('[ ]', '[x]');
          } else if (l.includes('[x]')) {
            return l.replace('[x]', '[ ]');
          } else if (l.includes('[X]')) {
            return l.replace('[X]', '[ ]');
          }
        }
      }
      return l;
    });
    const updated = newLines.join('\n');
    updateContentAndSave(updated);
    soundManager.playClick();
  };

  // Shared Heading Slug & Cleaning Utilities
  const cleanHeadingText = (rawText: string) => {
    return rawText
      .replace(/\s+#+\s*$/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/==([^=]+)==/g, '$1')
      .replace(/^[0-9.]+\s*/, '')
      .trim();
  };

  const getSlugFromText = (cleanText: string, slugCounts: Map<string, number>) => {
    const baseSlug = cleanText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '') || 'section';

    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${count}`;
  };

  // Table of Contents generation
  const tableOfContents = React.useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const items: { id: string; text: string; level: number; index: number }[] = [];
    const usedSlugs = new Map<string, number>();
    let headingIdx = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].replace(/\s+#+\s*$/, '').trim();
        if (rawText) {
          const cleanText = cleanHeadingText(rawText);
          const id = getSlugFromText(cleanText, usedSlugs);
          items.push({ id, text: cleanText, level, index: headingIdx++ });
        }
      }
    });

    return items;
  }, [content]);

  const totalWordCount = React.useMemo(() => {
    return content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  const estimatedReadTime = React.useMemo(() => {
    return Math.max(1, Math.ceil(totalWordCount / 200));
  }, [totalWordCount]);

  const handleScrollToHeading = (id: string, index?: number) => {
    soundManager.playClick();

    // Determine the active scroll container and the target element within it
    let target: HTMLElement | null = null;
    let scrollContainer: HTMLElement | null = null;

    if (isFullscreen && fullscreenScrollRef.current) {
      scrollContainer = fullscreenScrollRef.current;
      // Search inside the active fullscreen reader container first (avoids duplicate background ID)
      if (id) {
        try {
          target = scrollContainer.querySelector<HTMLElement>(`[data-heading-id="${CSS.escape(id)}"]`);
        } catch {
          target = scrollContainer.querySelector<HTMLElement>(`#${id}`);
        }
      }
      if (!target && index !== undefined) {
        target = scrollContainer.querySelector<HTMLElement>(`[data-heading-index="${index}"]`);
      }
    } else if (notesContainerRef.current) {
      // Normal / non-fullscreen mode
      const container = notesContainerRef.current;
      if (id) {
        try {
          target = container.querySelector<HTMLElement>(`[data-heading-id="${CSS.escape(id)}"]`);
        } catch {
          target = container.querySelector<HTMLElement>(`#${id}`);
        }
      }
      if (!target && index !== undefined) {
        target = container.querySelector<HTMLElement>(`[data-heading-index="${index}"]`);
      }
      // Locate the nearest scrolling parent
      let parent = container.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Fallback if not found inside scoped container
    if (!target) {
      if (id) {
        try {
          target = document.getElementById(id) || document.querySelector<HTMLElement>(`[data-heading-id="${CSS.escape(id)}"]`);
        } catch {
          target = document.getElementById(id);
        }
      }
      if (!target && index !== undefined) {
        target = document.querySelector<HTMLElement>(`[data-heading-index="${index}"]`);
      }
    }

    if (!target) return;

    // Perform smooth scroll to target concept
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const currentScrollTop = scrollContainer.scrollTop;
      const targetOffset = targetRect.top - containerRect.top + currentScrollTop;

      scrollContainer.scrollTo({
        top: Math.max(0, targetOffset - 32),
        behavior: 'smooth'
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // High-visibility concept spotlight pulse so the user instantly sees where they landed
    target.classList.add(
      'ring-4',
      'ring-amber-400',
      'bg-amber-400/20',
      'dark:bg-amber-400/25',
      'rounded-xl',
      'px-2',
      'transition-all',
      'duration-300'
    );
    setTimeout(() => {
      target?.classList.remove(
        'ring-4',
        'ring-amber-400',
        'bg-amber-400/20',
        'dark:bg-amber-400/25',
        'rounded-xl',
        'px-2'
      );
    }, 2200);
  };

  // Font family helper
  const getFontFamilyClass = () => {
    switch (readerFontFamily) {
      case 'serif':
        return 'font-serif tracking-normal';
      case 'lexend':
        return 'font-lexend tracking-normal';
      case 'mono':
        return 'font-mono tracking-tight';
      case 'sans':
      default:
        return 'font-sans tracking-tight';
    }
  };

  const getThemeContainerClass = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'reader-theme-sepia book-page-sheet border shadow-md transition-all duration-300';
      case 'sage':
        return 'reader-theme-sage book-page-sheet border shadow-md transition-all duration-300';
      case 'candle':
        return 'reader-theme-candle book-page-sheet border shadow-md transition-all duration-300';
      case 'oled':
      case 'midnight':
        return 'reader-theme-oled border shadow-xl transition-all duration-300';
      case 'paper':
      case 'default':
      default:
        return 'reader-theme-paper book-page-sheet border shadow-md transition-all duration-300';
    }
  };

  const getThemeInlineStyle = (): React.CSSProperties => {
    const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    switch (readerTheme) {
      case 'sepia':
        return isDarkMode
          ? { backgroundColor: '#241C15', color: '#EAD8C3', borderColor: '#483726' }
          : { backgroundColor: '#F8EED8', color: '#3C2E1E', borderColor: '#E2CFAC' };
      case 'sage':
        return isDarkMode
          ? { backgroundColor: '#152317', color: '#D3E7D5', borderColor: '#273F2B' }
          : { backgroundColor: '#EDF5EC', color: '#1F3824', borderColor: '#C8DEC6' };
      case 'candle':
        return isDarkMode
          ? { backgroundColor: '#261A11', color: '#EED7BF', borderColor: '#442D1C' }
          : { backgroundColor: '#F9EFE1', color: '#442B15', borderColor: '#E6D2B8' };
      case 'oled':
      case 'midnight':
        return { backgroundColor: '#000000', color: '#F8FAFC', borderColor: '#222533' };
      case 'paper':
      default:
        return isDarkMode
          ? { backgroundColor: '#141622', color: '#E2E8F0', borderColor: '#26293B' }
          : { backgroundColor: '#FAF9F6', color: '#1E293B', borderColor: '#E2E0D8' };
    }
  };

  const getLineHeightClass = () => {
    switch (readerLineHeight) {
      case 'compact':
        return 'leading-[1.65]';
      case 'spacious':
        return 'leading-[2.2]';
      case 'relaxed':
      default:
        return 'leading-[1.9]';
    }
  };

  const getFontSizeClass = () => {
    const lh = getLineHeightClass();
    switch (readerFontSize) {
      case 'sm':
        return `text-xs sm:text-[13px] ${lh}`;
      case 'base':
        return `text-xs sm:text-[14.5px] ${lh}`;
      case 'lg':
        return `text-sm sm:text-[16px] ${lh}`;
      case 'xl':
        return `text-base sm:text-[18px] ${lh}`;
      default:
        return `text-xs sm:text-[14.5px] ${lh}`;
    }
  };

  const getReaderWidthClass = () => {
    if (readerLayout === 'spread') {
      return 'max-w-6xl w-full';
    }
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

  // Rich Inline Markdown Parser with Interactive Multi-color Highlighters
  const parseInlineMarkdown = (text: string, keyPrefix: string = 'inline'): React.ReactNode[] => {
    if (!text) return [];

    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==[^=]+==|~~[^~]+~~|\$\$[^\$]+\$\$|\$[^\$]+\$|\\\([^\\]+\\\)|⏱️\s*(?:\[\d{1,2}:\d{2}(?::\d{2})?\]|\d{1,2}:\d{2}(?::\d{2})?))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      const k = `${keyPrefix}-${index}`;
      if (!part) return null;

      // Bold
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={k} className="font-extrabold text-[#11120F] dark:text-white">
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
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/15 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 font-mono text-[11px] sm:text-xs border border-amber-500/25 font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Multi-Color Highlights (==text==, ==g:text==, ==p:text==, ==b:text==, ==r:text==)
      if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
        const rawInner = part.slice(2, -2);
        let colorClass = 'bg-yellow-300/80 dark:bg-yellow-400/35 text-slate-950 dark:text-yellow-100 border-b-2 border-yellow-500/60';
        let highlightText = rawInner;

        if (rawInner.startsWith('g:')) {
          colorClass = 'bg-emerald-300/80 dark:bg-emerald-500/35 text-slate-950 dark:text-emerald-100 border-b-2 border-emerald-500/60';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('p:')) {
          colorClass = 'bg-purple-300/80 dark:bg-purple-500/35 text-slate-950 dark:text-purple-100 border-b-2 border-purple-500/60';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('b:')) {
          colorClass = 'bg-sky-300/80 dark:bg-sky-500/35 text-slate-950 dark:text-sky-100 border-b-2 border-sky-500/60';
          highlightText = rawInner.slice(2);
        } else if (rawInner.startsWith('r:')) {
          colorClass = 'bg-rose-300/80 dark:bg-rose-500/35 text-slate-950 dark:text-rose-100 border-b-2 border-rose-500/60';
          highlightText = rawInner.slice(2);
        }

        return (
          <mark
            key={k}
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              const rect = e.currentTarget.getBoundingClientRect();
              setSelectionTooltip({
                visible: true,
                x: Math.max(12, rect.left + rect.width / 2),
                y: Math.max(10, rect.top - 8),
                text: highlightText
              });
            }}
            className={`${colorClass} px-1.5 py-0.5 mx-0.5 rounded font-bold shadow-xs transition-all cursor-pointer hover:opacity-85 hover:scale-[1.02]`}
            title="Click to change color or erase highlight 🖍️"
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
      // Math / Formula (KaTeX rendered)
      if (
        (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) ||
        (part.startsWith('$') && part.endsWith('$') && part.length >= 2) ||
        (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4)
      ) {
        let mathContent = '';
        if (part.startsWith('$$')) {
          mathContent = part.slice(2, -2);
        } else if (part.startsWith('\\(')) {
          mathContent = part.slice(2, -2);
        } else {
          mathContent = part.slice(1, -1);
        }
        return <InlineMath key={k} latex={mathContent} />;
      }
      // Video Timestamp jump (Requires explicit ⏱️ prefix so normal clock times like "3:15 PM" or "9:30 AM" are not affected)
      if (part.startsWith('⏱️')) {
        const tsMatch = part.match(/⏱️\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
        if (tsMatch && tsMatch[1]) {
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
      }

      return part;
    });
  };

  // Custom Markdown, Tables & Callout Parser
  const renderFormattedNotes = (customFontSizeClass?: string) => {
    const fontSize = customFontSizeClass || getFontSizeClass();
    const fontFam = getFontFamilyClass();

    // Dynamic text & geometry scaling for Vocabulary Cards based on readerFontSize
    const getVocabSize = () => {
      switch (readerFontSize) {
        case 'sm':
          return {
            index: 'w-6 h-6 text-xs',
            word: 'text-base sm:text-lg',
            pos: 'text-xs sm:text-[12px]',
            hindi: 'text-xs sm:text-sm',
            def: 'text-xs sm:text-[13px]',
            header: 'text-xs sm:text-[13.5px]',
            item: 'text-xs sm:text-[12.5px]',
            icon: 'w-4 h-4 text-xs',
            iconInner: 'w-3 h-3',
            checkbox: 'w-3.5 h-3.5',
            checkIcon: 'w-2.5 h-2.5',
            exampleHi: 'text-xs sm:text-[11.5px]'
          };
        case 'base':
          return {
            index: 'w-7 h-7 text-xs sm:text-sm',
            word: 'text-lg sm:text-xl',
            pos: 'text-xs sm:text-[13.5px]',
            hindi: 'text-sm sm:text-base',
            def: 'text-xs sm:text-[14.5px]',
            header: 'text-sm sm:text-base',
            item: 'text-xs sm:text-[14px]',
            icon: 'w-5 h-5 text-xs',
            iconInner: 'w-3.5 h-3.5',
            checkbox: 'w-4 h-4',
            checkIcon: 'w-3 h-3',
            exampleHi: 'text-xs sm:text-[13px]'
          };
        case 'lg':
          return {
            index: 'w-8 h-8 text-sm sm:text-base',
            word: 'text-xl sm:text-2xl',
            pos: 'text-sm sm:text-[15px]',
            hindi: 'text-base sm:text-lg',
            def: 'text-sm sm:text-[16.5px]',
            header: 'text-base sm:text-lg',
            item: 'text-sm sm:text-[16px]',
            icon: 'w-6 h-6 text-sm',
            iconInner: 'w-4 h-4',
            checkbox: 'w-5 h-5',
            checkIcon: 'w-3.5 h-3.5',
            exampleHi: 'text-xs sm:text-[14.5px]'
          };
        case 'xl':
          return {
            index: 'w-9 h-9 text-base sm:text-lg',
            word: 'text-2xl sm:text-3xl',
            pos: 'text-base sm:text-[17px]',
            hindi: 'text-lg sm:text-xl',
            def: 'text-base sm:text-[18.5px]',
            header: 'text-lg sm:text-xl',
            item: 'text-base sm:text-[18px]',
            icon: 'w-7 h-7 text-base',
            iconInner: 'w-4.5 h-4.5',
            checkbox: 'w-6 h-6',
            checkIcon: 'w-4 h-4',
            exampleHi: 'text-sm sm:text-[16px]'
          };
        default:
          return {
            index: 'w-7 h-7 text-xs sm:text-sm',
            word: 'text-lg sm:text-xl',
            pos: 'text-xs sm:text-[13.5px]',
            hindi: 'text-sm sm:text-base',
            def: 'text-xs sm:text-[14.5px]',
            header: 'text-sm sm:text-base',
            item: 'text-xs sm:text-[14px]',
            icon: 'w-5 h-5 text-xs',
            iconInner: 'w-3.5 h-3.5',
            checkbox: 'w-4 h-4',
            checkIcon: 'w-3 h-3',
            exampleHi: 'text-xs sm:text-[13px]'
          };
      }
    };
    const vSize = getVocabSize();

    if ((!content || content.trim().length === 0) && (!images || images.length === 0)) {
      return (
        <div className="py-12 px-4 text-center space-y-4 select-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-serif">
              "{activeNote.title}" is empty
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Gemini ya ChatGPT se study notes copy karke yahan paste karein, ya neeche diye gaye templates se shuru karein!
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] dark:bg-[#7AA2F7] hover:bg-[#1D4ED8] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write or Paste Notes</span>
            </button>
          </div>
        </div>
      );
    }

    // 🎯 Interactive Quiz Station (if content contains quiz questions)
    if (isQuizContent(content)) {
      const parsedQuiz = parseQuizQuestions(content);
      if (parsedQuiz.questions.length > 0) {
        const currentAnswers = userQuizAnswers[activeNote.id] || {};
        const totalQuestions = parsedQuiz.questions.length;
        const answeredCount = Object.keys(currentAnswers).length;
        const correctCount = parsedQuiz.questions.filter(q => currentAnswers[q.id] === q.correctAnswer).length;
        const scorePercentage = answeredCount > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const isComplete = answeredCount === totalQuestions;

        return (
          <div className="space-y-6 animate-fade-in">
            {/* 🌟 Master Quiz Scorecard Banner */}
            <div className="rounded-2xl border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-purple-50/30 dark:from-[#181A2E] dark:via-[#151624] dark:to-[#12131C] p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase font-mono tracking-wider bg-[#2563EB]/15 dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] border border-[#2563EB]/30">
                      🎯 Interactive Practice Quiz
                    </span>
                    {parsedQuiz.sourceUrl && (
                      <a
                        href={parsedQuiz.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-colors cursor-pointer"
                        title="Open original quiz in Google Gemini"
                      >
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>Gemini Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <h3 className={`${fontFam} text-lg sm:text-xl font-black text-slate-900 dark:text-white`}>
                    {parsedQuiz.title || `${topicName} Quiz`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click an option to test your knowledge with instant feedback, scoring, and explanations.
                  </p>
                </div>

                {/* Score Stats & Retake Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Score</div>
                    <div className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {correctCount} / {totalQuestions}
                      <span className="text-xs font-normal text-slate-400 ml-1">({scorePercentage}%)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRetakeQuiz(activeNote.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-all active:scale-95"
                    title="Reset quiz and re-attempt all questions"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Retake</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/40">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>Progress: {answeredCount} of {totalQuestions} answered</span>
                  {isComplete && (
                    <span className={`font-black ${scorePercentage >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {scorePercentage >= 70 ? '🎉 Passed Exam Standard!' : '⚠️ Revision Recommended'}
                    </span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 🌟 Verified Gemini Source Card (if Gemini Link present) */}
            {parsedQuiz.sourceUrl && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/25 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Google Gemini Interactive Quiz Link</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block truncate max-w-[240px] sm:max-w-md">
                      {parsedQuiz.sourceUrl}
                    </span>
                  </div>
                </div>
                <a
                  href={parsedQuiz.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <span>Open Gemini ↗</span>
                </a>
              </div>
            )}

            {/* 🌟 List of Question Cards */}
            <div className="space-y-4">
              {parsedQuiz.questions.map((q, qIdx) => {
                const selectedKey = currentAnswers[q.id];
                const isAnswered = Boolean(selectedKey);
                const isCorrect = selectedKey === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
                      !isAnswered
                        ? 'border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#141520]/90 shadow-xs'
                        : isCorrect
                        ? 'border-emerald-500/50 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] shadow-xs'
                        : 'border-rose-500/40 bg-rose-500/[0.03] dark:bg-rose-500/[0.05] shadow-xs'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-3.5">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black font-mono shrink-0 mt-0.5 ${
                        !isAnswered
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : isCorrect
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-rose-500 text-white shadow-xs'
                      }`}>
                        Q{qIdx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className={`${fontFam} text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug`}>
                          {parseInlineMarkdown(q.question, `quiz-q-${qIdx}`)}
                        </h4>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="space-y-2 pl-0 sm:pl-9">
                      {q.options.map(opt => {
                        const isOptionSelected = selectedKey === opt.key;
                        const isThisCorrect = opt.key === q.correctAnswer;

                        let optBtnStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200';
                        let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

                        if (isAnswered) {
                          if (isOptionSelected && isThisCorrect) {
                            optBtnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 font-bold';
                            badgeStyle = 'bg-emerald-500 text-white';
                          } else if (isOptionSelected && !isThisCorrect) {
                            optBtnStyle = 'border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/30 font-bold';
                            badgeStyle = 'bg-rose-500 text-white';
                          } else if (!isOptionSelected && isThisCorrect) {
                            optBtnStyle = 'border-emerald-500/60 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200 font-semibold';
                            badgeStyle = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
                          } else {
                            optBtnStyle = 'border-transparent bg-slate-50/60 dark:bg-slate-900/30 text-slate-400 opacity-50';
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handleSelectQuizOption(activeNote.id, q.id, opt.key, isThisCorrect)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs sm:text-sm transition-all ${optBtnStyle} ${
                              !isAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}>
                              {opt.key}
                            </span>
                            <span className="flex-1 leading-relaxed">
                              {parseInlineMarkdown(opt.text, `opt-${q.id}-${opt.key}`)}
                            </span>
                            {isAnswered && isOptionSelected && isThisCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {isAnswered && isOptionSelected && !isThisCorrect && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Box (Revealed on Answer) */}
                    {isAnswered && (
                      <div className="mt-4 sm:ml-9 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/30 text-xs sm:text-sm animate-fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 font-mono mb-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                          <span>Correct Answer: Option {q.correctAnswer}</span>
                        </div>
                        {q.explanation ? (
                          <div className={`${fontFam} text-slate-700 dark:text-slate-300 leading-relaxed pl-5`}>
                            {parseInlineMarkdown(q.explanation, `exp-${q.id}`)}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic pl-5">No detailed explanation provided.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let taskCounter = 0;
    let codeBlockCounter = 0;
    let paragraphCounter = 0;
    const usedHeadingSlugs = new Map<string, number>();
    let renderedHeadingIndex = 0;

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
            className="my-4 rounded-2xl border border-slate-700/80 bg-[#0F1017] shadow-md overflow-hidden text-slate-200 [break-inside:avoid]"
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
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
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

      // 1.5. Display / Block Math Formulas ($$ ... $$ or \[ ... \])
      const trimmedLine = line.trim();
      const isBlockMathStart = trimmedLine.startsWith('$$') || trimmedLine.startsWith('\\[');
      if (isBlockMathStart) {
        const isSingleLine =
          (trimmedLine.startsWith('$$') && trimmedLine.endsWith('$$') && trimmedLine.length > 2 && trimmedLine !== '$$') ||
          (trimmedLine.startsWith('\\[') && trimmedLine.endsWith('\\]') && trimmedLine.length > 2);

        if (isSingleLine) {
          const formulaContent = trimmedLine.startsWith('$$')
            ? trimmedLine.slice(2, -2)
            : trimmedLine.slice(2, -2);
          elements.push(
            <MathBlock key={'mathblock-' + i} latex={formulaContent} />
          );
          i++;
          continue;
        }

        const mathLines: string[] = [];
        const firstLine = trimmedLine.replace(/^(\$\$|\\\[)/, '').trim();
        if (firstLine) mathLines.push(firstLine);
        i++;

        while (i < lines.length) {
          const mTrim = lines[i].trim();
          if (mTrim.endsWith('$$') || mTrim.endsWith('\\]')) {
            const lastLine = mTrim.replace(/(\$\$|\\\])$/, '').trim();
            if (lastLine) mathLines.push(lastLine);
            i++;
            break;
          }
          mathLines.push(lines[i]);
          i++;
        }

        const fullLatex = mathLines.join('\n');
        elements.push(
          <MathBlock key={'mathblock-' + i} latex={fullLatex} />
        );
        continue;
      }

      // 2. Markdown Tables (| col1 | col2 |)
      const isTableStart = (trimmedLine.startsWith('|') || (trimmedLine.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|'))) && !trimmedLine.startsWith('>');
      if (isTableStart) {
        const rawTableLines: string[] = [line];
        let j = i + 1;

        while (j < lines.length) {
          const nextTrim = lines[j].trim();
          if (nextTrim.includes('|') || nextTrim === '') {
            if (nextTrim === '') {
              if (j + 1 < lines.length && lines[j + 1].includes('|')) {
                j++;
                continue;
              } else {
                break;
              }
            }
            rawTableLines.push(lines[j]);
            j++;
          } else {
            break;
          }
        }

        if (rawTableLines.length >= 2) {
          const repaired = cleanAndRepairMarkdownTable(rawTableLines.join('\n'));
          const tableLines = repaired.split('\n');

          const parseRow = (rowStr: string) => {
            const inner = rowStr.trim().replace(/^\|/, '').replace(/\|$/, '');
            return inner.split('|').map(c => c.trim());
          };

          const rawHeaders = parseRow(tableLines[0]);
          const hasSeparator = tableLines.length > 1 && isTableSeparatorRow(tableLines[1]);
          const alignments = hasSeparator ? parseTableAlignments(tableLines[1]) : rawHeaders.map(() => 'left' as const);
          const dataRows = (hasSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

          const getAlignClass = (align?: 'left' | 'center' | 'right') => {
            if (align === 'center') return 'text-center';
            if (align === 'right') return 'text-right';
            return 'text-left';
          };

          elements.push(
            <div
              key={'table-' + i}
              className="my-5 rounded-2xl border border-[#E2E8F0] dark:border-[#272730] shadow-sm bg-white/90 dark:bg-[#12131A]/95 backdrop-blur-sm overflow-hidden [break-inside:avoid]"
            >
              {/* Table Top Action Bar */}
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/70 dark:bg-[#181926]/90 border-b border-[#E2E8F0] dark:border-[#272730] text-[11px] font-mono">
                <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <TableIcon className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
                  Comparison Table ({dataRows.length} Rows)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(repaired);
                    soundManager.playClick();
                  }}
                  className="inline-flex items-center gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-all active:scale-95"
                  title="Copy Markdown Table"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Table</span>
                </button>
              </div>

              {/* Responsive Scrollable Table */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse min-w-[380px] font-sans">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#F8FAFC] via-[#F1F5F9] to-[#F8FAFC] dark:from-[#181926] dark:via-[#1E2030] dark:to-[#181926] border-b border-[#E2E8F0] dark:border-[#272730] text-[11px] font-black uppercase tracking-wider text-[#11120F] dark:text-[#C0CAF5] font-mono">
                      {rawHeaders.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className={`py-3 px-4 font-black border-r border-[#E2E8F0]/50 dark:border-[#272730]/50 last:border-r-0 ${getAlignClass(alignments[hIdx])}`}
                        >
                          {parseInlineMarkdown(h, `th-${i}-${hIdx}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/40 dark:divide-[#272730]/60">
                    {dataRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`transition-colors hover:bg-[#2563EB]/5 dark:hover:bg-[#7AA2F7]/5 ${
                          rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-[#161722]/40'
                        }`}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-3 px-4 ${fontSize} font-medium border-r border-[#E2E8F0]/30 dark:border-[#272730]/30 last:border-r-0 leading-relaxed ${getAlignClass(alignments[cIdx])}`}
                          >
                            {parseInlineMarkdown(cell, `td-${i}-${rIdx}-${cIdx}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );

          i = j;
          continue;
        }
      }

      // 3. Callout Blocks (> [!TYPE] ...)
      if (line.trim().startsWith('> [!')) {
        const match = line.trim().match(/^>\s*\[!([A-Z0-9_\-]+)(?:\s+([^\]]*))?\]/i);
        const calloutType = match ? match[1].toUpperCase() : 'NOTE';
        const calloutArg = match && match[2] ? match[2].trim() : '';
        const afterCalloutTag = line.replace(/^>\s*\[![A-Z0-9_\-]+(?:\s+[^\]]*)?\]\s*/i, '').trim();
        const calloutLines: string[] = [];

        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const l = lines[i].trim().replace(/^>\s*/, '');
          if (!l.startsWith('[!')) {
            calloutLines.push(l);
          }
          i++;
        }

        // 🔤 Smart Notion Vocabulary Flashcard Components
        if (calloutType.startsWith('VOCAB-WORD')) {
          const parts = afterCalloutTag.split('|').map(s => s.trim());
          const wordText = cleanHeadingText(parts[0] || 'Word');
          const posText = parts[1] || '';
          const hindiText = parts[2] || '';
          const indexNum = calloutArg || '1';

          elements.push(
            <div
              key={'vocab-word-' + i}
              className="my-3 p-3.5 sm:p-4 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-[#272B3E] shadow-sm flex items-center gap-3 flex-wrap [break-inside:avoid]"
            >
              <div className={`${vSize.index} rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-black font-mono shadow-xs shrink-0`}>
                {indexNum}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-extrabold text-[#F59E0B] ${vSize.word} tracking-tight`}>
                  {wordText}
                </span>
                {posText && (
                  <span className={`${vSize.pos} text-[#D97706]/90 dark:text-[#FBBF24]/80 font-medium`}>
                    {posText}
                  </span>
                )}
                {hindiText && (
                  <span className={`${vSize.hindi} font-semibold text-[#38BDF8] dark:text-[#60A5FA]`}>
                    {hindiText}
                  </span>
                )}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-DEF') {
          const defText = calloutLines.join(' ').trim();
          elements.push(
            <div
              key={'vocab-def-' + i}
              className="my-3 p-3.5 sm:p-4 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-[#272B3E] shadow-sm flex items-start gap-3 [break-inside:avoid]"
            >
              <div className={`${vSize.index} rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                <ArrowRight className={`${vSize.iconInner} stroke-[2.5]`} />
              </div>
              <div className={`${vSize.def} font-medium text-[#F59E0B] dark:text-[#FBBF24] leading-relaxed flex-1`}>
                {parseInlineMarkdown(defText, `vdef-${i}`)}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-SYNONYMS') {
          elements.push(
            <div
              key={'vocab-syn-' + i}
              className="my-3 p-4 sm:p-5 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-[#272B3E] shadow-sm space-y-3 [break-inside:avoid]"
            >
              <div className="flex items-center gap-2">
                <div className={`${vSize.icon} rounded-md bg-[#2563EB] text-white flex items-center justify-center shrink-0`}>
                  <CornerDownRight className={`${vSize.iconInner} stroke-[2.5]`} />
                </div>
                <span className={`text-[#E05252] font-extrabold ${vSize.header} tracking-wide`}>Synonyms</span>
              </div>

              <div className="space-y-1.5 pl-1">
                {calloutLines.map((cl, clIdx) => {
                  const isCheckLine = cl.trim().startsWith('- [ ] ') || cl.trim().startsWith('- [x] ') || cl.trim().startsWith('- [X] ') || cl.trim().startsWith('* [ ] ') || cl.trim().startsWith('* [x] ') || cl.trim().startsWith('* [X] ');
                  const currentBoxIdx = isCheckLine ? taskCounter++ : -1;
                  const isChecked = cl.startsWith('- [x] ') || cl.startsWith('* [x] ') || cl.startsWith('- [X] ');
                  const rawItemText = cl.replace(/^[-*]\s*\[[ xX]\]\s*/i, '');
                  return (
                    <div
                      key={clIdx}
                      onClick={() => currentBoxIdx >= 0 && toggleCheckboxInText(currentBoxIdx)}
                      className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <div
                        className={`${vSize.checkbox} rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-slate-500/80 bg-transparent group-hover:border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className={`${vSize.checkIcon} stroke-[3]`} />}
                      </div>
                      <span className={`${vSize.item} font-medium leading-normal ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200 dark:text-slate-200'}`}>
                        {parseInlineMarkdown(rawItemText, `syn-${i}-${clIdx}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-ADVANCED') {
          elements.push(
            <div
              key={'vocab-adv-' + i}
              className="my-3 p-4 sm:p-5 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-[#3D2C1E] shadow-sm space-y-3 [break-inside:avoid]"
            >
              <div className="flex items-center gap-2">
                <div className={`${vSize.icon} rounded-md bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <Zap className={`${vSize.iconInner} stroke-[2.5]`} />
                </div>
                <span className={`text-[#F59E0B] font-extrabold ${vSize.header} tracking-wide`}>🔥 Advanced Synonyms</span>
              </div>

              <div className="space-y-1.5 pl-1">
                {calloutLines.map((cl, clIdx) => {
                  const isCheckLine = cl.trim().startsWith('- [ ] ') || cl.trim().startsWith('- [x] ') || cl.trim().startsWith('- [X] ') || cl.trim().startsWith('* [ ] ') || cl.trim().startsWith('* [x] ') || cl.trim().startsWith('* [X] ');
                  const currentBoxIdx = isCheckLine ? taskCounter++ : -1;
                  const isChecked = cl.startsWith('- [x] ') || cl.startsWith('* [x] ') || cl.startsWith('- [X] ');
                  const rawItemText = cl.replace(/^[-*]\s*\[[ xX]\]\s*/i, '');
                  return (
                    <div
                      key={clIdx}
                      onClick={() => currentBoxIdx >= 0 && toggleCheckboxInText(currentBoxIdx)}
                      className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <div
                        className={`${vSize.checkbox} rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'border-slate-500/80 bg-transparent group-hover:border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className={`${vSize.checkIcon} stroke-[3]`} />}
                      </div>
                      <span className={`${vSize.item} font-medium leading-normal ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200 dark:text-slate-200'}`}>
                        {parseInlineMarkdown(rawItemText, `adv-${i}-${clIdx}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-ANTONYMS') {
          elements.push(
            <div
              key={'vocab-ant-' + i}
              className="my-3 p-4 sm:p-5 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-[#272B3E] shadow-sm space-y-3 [break-inside:avoid]"
            >
              <div className="flex items-center gap-2">
                <div className={`${vSize.icon} rounded-md bg-[#2563EB] text-white flex items-center justify-center shrink-0`}>
                  <CornerDownRight className={`${vSize.iconInner} stroke-[2.5]`} />
                </div>
                <span className={`text-[#E05252] font-extrabold ${vSize.header} tracking-wide`}>Antonyms</span>
              </div>

              <div className="space-y-1.5 pl-1">
                {calloutLines.map((cl, clIdx) => {
                  const isCheckLine = cl.trim().startsWith('- [ ] ') || cl.trim().startsWith('- [x] ') || cl.trim().startsWith('- [X] ') || cl.trim().startsWith('* [ ] ') || cl.trim().startsWith('* [x] ') || cl.trim().startsWith('* [X] ');
                  const currentBoxIdx = isCheckLine ? taskCounter++ : -1;
                  const isChecked = cl.startsWith('- [x] ') || cl.startsWith('* [x] ') || cl.startsWith('- [X] ');
                  const rawItemText = cl.replace(/^[-*]\s*\[[ xX]\]\s*/i, '');
                  return (
                    <div
                      key={clIdx}
                      onClick={() => currentBoxIdx >= 0 && toggleCheckboxInText(currentBoxIdx)}
                      className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <div
                        className={`${vSize.checkbox} rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-slate-500/80 bg-transparent group-hover:border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className={`${vSize.checkIcon} stroke-[3]`} />}
                      </div>
                      <span className={`${vSize.item} font-medium leading-normal ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200 dark:text-slate-200'}`}>
                        {parseInlineMarkdown(rawItemText, `ant-${i}-${clIdx}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-CONFUSING') {
          const titleRest = calloutArg || 'Confusing Words';
          elements.push(
            <div
              key={'vocab-conf-' + i}
              className="my-3 p-4 sm:p-5 rounded-2xl bg-[#161726] dark:bg-[#121320] border border-indigo-500/40 shadow-sm space-y-2.5 [break-inside:avoid]"
            >
              <div className={`flex items-center gap-2 font-bold ${vSize.header} text-indigo-400`}>
                <HelpCircle className={`${vSize.icon} text-indigo-400 shrink-0`} />
                <span className="font-extrabold text-indigo-300">🤔 Confusing Word: {titleRest}</span>
              </div>
              <div className={`space-y-1.5 ${vSize.item} text-slate-300 leading-relaxed pl-6`}>
                {calloutLines.map((cl, clIdx) => (
                  <div key={clIdx}>
                    {parseInlineMarkdown(cl, `conf-${i}-${clIdx}`)}
                  </div>
                ))}
              </div>
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-USAGE') {
          elements.push(
            <div key={'vocab-usage-' + i} className="my-3 space-y-3 [break-inside:avoid]">
              {calloutLines.map((cl, clIdx) => {
                if (cl.startsWith('| →') || cl.startsWith('| ->') || cl.startsWith('→')) {
                  const hiText = cl.replace(/^[|→\->\s]+/, '').trim();
                  return (
                    <div key={clIdx} className={`${vSize.exampleHi} text-slate-400 dark:text-slate-400 pl-4 italic -mt-1.5`}>
                      → {hiText}
                    </div>
                  );
                }
                const enText = cl.replace(/^[|*•\-\s]+/, '').replace(/^\*\*Usage:\*\*\s*/i, '').replace(/^Usage:\s*/i, '').trim();
                return (
                  <div key={clIdx} className="flex items-start gap-2.5 pl-1">
                    <div className="w-[3px] self-stretch min-h-[20px] bg-slate-300 dark:bg-slate-500 rounded-full shrink-0" />
                    <div className={`${vSize.def} font-medium text-slate-800 dark:text-slate-200 leading-relaxed`}>
                      <span className="text-[#E05252] font-bold mr-2">Usage:</span>
                      <span>{parseInlineMarkdown(enText, `use-${i}-${clIdx}`)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
          continue;
        }

        if (calloutType === 'VOCAB-RELATED') {
          elements.push(
            <div
              key={'vocab-rel-' + i}
              className="my-3 p-3.5 sm:p-4 rounded-2xl bg-[#141620] dark:bg-[#10121C] border border-emerald-500/30 shadow-sm space-y-1.5 [break-inside:avoid]"
            >
              <div className={`flex items-center gap-2 font-bold ${vSize.header} uppercase tracking-wider text-emerald-400 font-mono`}>
                <Bookmark className={`${vSize.iconInner}`} />
                <span>🔰 Related Word (Exam-Oriented)</span>
              </div>
              <div className={`space-y-1 ${vSize.item} text-slate-300 leading-relaxed pl-5`}>
                {calloutLines.map((cl, clIdx) => (
                  <div key={clIdx}>
                    {parseInlineMarkdown(cl.replace(/^[*•\-]\s*/, ''), `rel-${i}-${clIdx}`)}
                  </div>
                ))}
              </div>
            </div>
          );
          continue;
        }

        let borderCol = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';
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
            className={`my-4 p-4 sm:p-5 rounded-2xl border backdrop-blur-sm shadow-sm ${borderCol} [break-inside:avoid]`}
          >
            <div className="flex items-center gap-2 mb-2">
              <IconComp className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider font-mono">{title}</span>
            </div>
            <div className={`${fontSize} ${fontFam} font-medium space-y-2 pl-6 leading-relaxed`}>
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

      // 4. Headings (# H1 to ###### H6)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const hashCount = headingMatch[1].length;
        const rawHeading = headingMatch[2].replace(/\s+#+\s*$/, '').trim();
        const cleanHeading = cleanHeadingText(rawHeading);
        const headingId = getSlugFromText(cleanHeading, usedHeadingSlugs);
        const currentIndex = renderedHeadingIndex++;

        if (hashCount === 1) {
          elements.push(
            <h1
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className={`${fontFam} text-xl sm:text-2xl font-black mt-7 mb-3 pb-2.5 border-b-2 border-[#2563EB]/30 dark:border-[#7AA2F7]/30 flex items-center gap-2.5 text-[#11120F] dark:text-white scroll-mt-28 [break-inside:avoid]`}
            >
              <span className="w-1.5 h-6 rounded-full bg-[#2563EB] dark:bg-[#7AA2F7] inline-block shrink-0" />
              <span>{parseInlineMarkdown(rawHeading, `h1-${i}`)}</span>
            </h1>
          );
        } else if (hashCount === 2) {
          // 🌟 2nd Headings in Callout Card Style (User request: "2nd Headings callout me ho")
          elements.push(
            <div
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className="my-5 rounded-2xl border border-indigo-200/90 dark:border-indigo-800/60 border-l-4 border-l-indigo-600 dark:border-l-indigo-400 bg-gradient-to-r from-indigo-50/90 via-blue-50/40 to-white/30 dark:from-[#1A1C2E]/90 dark:via-[#161726]/60 dark:to-[#11121A]/30 p-3.5 sm:p-4 shadow-xs scroll-mt-28 [break-inside:avoid]"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-5 sm:h-6 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                <h2 className={`${fontFam} text-base sm:text-lg font-black text-indigo-950 dark:text-indigo-100 flex-1 leading-snug tracking-tight m-0`}>
                  {parseInlineMarkdown(rawHeading, `h2-${i}`)}
                </h2>
              </div>
            </div>
          );
        } else if (hashCount === 3) {
          elements.push(
            <h3
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className={`${fontFam} text-xs sm:text-sm font-black text-[#2563EB] dark:text-[#7AA2F7] mt-5 mb-2 uppercase tracking-wide flex items-center gap-1.5 font-mono scroll-mt-28 [break-inside:avoid]`}
            >
              <span>▶</span>
              <span>{parseInlineMarkdown(rawHeading, `h3-${i}`)}</span>
            </h3>
          );
        } else if (hashCount === 4) {
          // 🌟 Level 4 Subheading (User request: "NOTES KE SUBHEADINGS ME #### kyun aa raha ise nhi aana chahiye")
          elements.push(
            <h4
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className={`${fontFam} text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 mt-4 mb-2 flex items-center gap-2 scroll-mt-28 [break-inside:avoid]`}
            >
              <span className="w-1.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
              <span>{parseInlineMarkdown(rawHeading, `h4-${i}`)}</span>
            </h4>
          );
        } else if (hashCount === 5) {
          // 🌟 Level 5 Subheading (e.g. "##### Members of the Drafting Committee:")
          elements.push(
            <h5
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className={`${fontFam} text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-3.5 mb-1.5 flex items-center gap-1.5 scroll-mt-28 [break-inside:avoid]`}
            >
              <span className="w-1.5 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span>{parseInlineMarkdown(rawHeading, `h5-${i}`)}</span>
            </h5>
          );
        } else {
          // 🌟 Level 6 Subheading (######)
          elements.push(
            <h6
              key={i}
              id={headingId}
              data-heading-id={headingId}
              data-heading-index={currentIndex}
              className={`${fontFam} text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3 mb-1 uppercase tracking-wider flex items-center gap-1.5 scroll-mt-28 [break-inside:avoid]`}
            >
              <span className="w-1 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
              <span>{parseInlineMarkdown(rawHeading, `h6-${i}`)}</span>
            </h6>
          );
        }
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
            className={`flex items-center gap-3 p-2.5 sm:p-3 my-1.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] [break-inside:avoid] ${
              isDone
                ? 'bg-emerald-500/10 text-slate-400 line-through'
                : 'bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-[#272730]'
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
            <span className={`${fontSize} ${fontFam} font-semibold leading-relaxed`}>
              {parseInlineMarkdown(taskText, `task-${i}`)}
            </span>
          </div>
        );
      }
      // 6. Bullet lists
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const rawBullet = line.trim().substring(2);
        elements.push(
          <div key={i} className="flex items-start gap-3 my-2 pl-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#7AA2F7] mt-2.5 shrink-0" />
            <div className={`${fontSize} ${fontFam} font-medium text-[#334155] dark:text-[#CBD5E1] reading-column max-w-[68ch] leading-relaxed`}>
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
          <div key={i} className="flex items-start gap-3 my-2 pl-1 leading-relaxed">
            <span className="px-1.5 py-0.2 rounded-md bg-[#2563EB]/15 dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] text-[11px] font-mono font-black mt-0.5 shrink-0">
              {num}.
            </span>
            <div className={`${fontSize} ${fontFam} font-medium text-[#334155] dark:text-[#CBD5E1] reading-column max-w-[68ch] leading-relaxed`}>
              {parseInlineMarkdown(numText, `num-${i}`)}
            </div>
          </div>
        );
      }
      // 8. Horizontal Rule
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-5 border-slate-200 dark:border-slate-800" />);
      }
      // 9. Blank Line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2.5" />);
      }
      // 10. Inline Images
      else if (line.trim().match(/^!\[(.*?)\]\((.*?)\)$/)) {
        const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
        const altText = imgMatch ? imgMatch[1] : 'Image';
        const imgSrc = imgMatch ? imgMatch[2] : '';
        elements.push(
          <div
            key={i}
            className="my-4 max-w-2xl rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#272730] bg-[#141418] shadow-md group [break-inside:avoid]"
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
            <div className="px-3.5 py-2 bg-[#18181D]/90 border-t border-[#272730] flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span className="truncate font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-[#8B5CF6]" />
                {altText}
              </span>
              <button
                type="button"
                onClick={() => setZoomImage({ src: imgSrc, title: altText })}
                className="text-[11px] font-bold text-[#8B5CF6] hover:underline cursor-pointer"
              >
                Click to Enlarge 🔍
              </button>
            </div>
          </div>
        );
      }
      // 11. Regular Paragraph with inline formatting & optimal reading ergonomics
      else {
        const isFirstParagraph = paragraphCounter === 0;
        paragraphCounter++;
        elements.push(
          <p
            key={i}
            className={`${fontSize} ${fontFam} text-[#334155] dark:text-[#CBD5E1] my-3 leading-relaxed reading-column max-w-[68ch] ${
              isFirstParagraph && readerFontFamily === 'serif' ? 'book-drop-cap' : ''
            }`}
          >
            {parseInlineMarkdown(line, `p-${i}`)}
          </p>
        );
      }

      i++;
    }

    return (
      <div className="book-reader-view w-full">
        {/* Book Editorial Running Header */}
        <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-black/10 dark:border-white/10 text-[11px] font-serif uppercase tracking-widest text-[#65675F] dark:text-[#94A3B8] select-none [break-inside:avoid] print:hidden">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-amber-600 dark:text-amber-400">§ CHAPTER STUDY</span>
            <span>•</span>
            <span className="truncate">{subjectName || 'General'} / {chapterName || topicName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 tabular-nums font-mono text-[10px]">
            <span>⏱️ {estimatedReadTime} min read</span>
            <span>•</span>
            <span>{totalWordCount} words</span>
          </div>
        </div>

        {/* Notes Content Body (Dual-Column Spread in Wide/Spread Mode, Single Column otherwise) */}
        <div
          className={
            readerLayout === 'spread'
              ? 'lg:columns-2 gap-10 lg:gap-14 [column-rule:1px_solid_rgba(0,0,0,0.08)] dark:[column-rule:1px_solid_rgba(255,255,255,0.08)]'
              : ''
          }
        >
          {elements}
        </div>

        {/* Book Editorial Running Footer */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-black/10 dark:border-white/10 text-[11px] font-serif text-[#65675F] dark:text-[#94A3B8] select-none [break-inside:avoid] print:hidden">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeNote.title}</span>
            <span>—</span>
            <span className="italic text-slate-500">Antigravity Reader Edition</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] shrink-0 tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/80" />
            <span>Reading {readingProgress}%</span>
          </div>
        </div>
      </div>
    );
  };

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

interface NoteTabsTrackProps {
  noteItems: TopicNoteItem[];
  activeNoteId: string;
  setActiveNoteId: (id: string) => void;
  editingTitleId: string | null;
  tempTitle: string;
  setTempTitle: (title: string) => void;
  handleSaveRename: (noteId: string) => void;
  handleStartRename: (note: TopicNoteItem) => void;
  handleDuplicateNote: (noteId: string) => void;
  handleDeleteNote: (noteId: string) => void;
  showAddTemplatesMenu: boolean;
  setShowAddTemplatesMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setShowQuizImportModal: (val: boolean) => void;
  handleAddNewNote: (title?: string, content?: string) => void;
  inFullscreen?: boolean;
}

const NoteTabsTrack: React.FC<NoteTabsTrackProps> = ({
  noteItems,
  activeNoteId,
  setActiveNoteId,
  editingTitleId,
  tempTitle,
  setTempTitle,
  handleSaveRename,
  handleStartRename,
  handleDuplicateNote,
  handleDeleteNote,
  showAddTemplatesMenu,
  setShowAddTemplatesMenu,
  setShowQuizImportModal,
  handleAddNewNote,
  inFullscreen = false,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  // Mouse Drag / Swipe state
  const isMouseDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Overflow & Navigation state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkScroll = useCallback(() => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    setHasOverflow(scrollWidth > clientWidth + 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = tabsContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(() => checkScroll());
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, noteItems.length]);

  // Global mouseup listener so dragging outside the element resets cleanly
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (isDraggingRef.current) {
          setIsDragging(false);
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 60);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Smooth scroll active tab into view when activeNoteId changes
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest'
      });
      setTimeout(checkScroll, 350);
    }
  }, [activeNoteId]);

  // Mouse Drag / Swipe Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button')) return;

    isMouseDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = tabsContainerRef.current ? tabsContainerRef.current.scrollLeft : 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !tabsContainerRef.current) return;
    const deltaX = e.pageX - startXRef.current;

    if (!isDraggingRef.current && Math.abs(deltaX) > 4) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    if (isDraggingRef.current) {
      tabsContainerRef.current.scrollLeft = scrollLeftRef.current - deltaX;
      checkScroll();
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    if (isDraggingRef.current) {
      setIsDragging(false);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 60);
    }
  };

  // Mouse Wheel translation (vertical wheel to horizontal swipe)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tabsContainerRef.current) return;
    if (e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const scrollLeftBy = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRightBy = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 w-full select-none">
      {/* Scrollable Tabs Track with Navigation Buttons */}
      <div className="flex-1 flex items-center gap-1 min-w-0 relative">
        {/* Left Arrow Button (shown when overflowing) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={scrollLeftBy}
            disabled={!canScrollLeft}
            className={`p-1 rounded-xl border text-xs transition-all shrink-0 z-10 flex items-center justify-center ${
              canScrollLeft
                ? 'bg-white dark:bg-[#1E1F2B] border-slate-300/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#252636] text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95'
                : 'opacity-20 border-transparent text-slate-400 cursor-default pointer-events-none'
            }`}
            title="Scroll notes left"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}

        {/* Left Fade Gradient Mask when scrolled */}
        {canScrollLeft && (
          <div className="absolute left-6 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-[#151620] to-transparent pointer-events-none z-[5]" />
        )}

        {/* Scrollable & Draggable Tabs Track */}
        <div
          ref={tabsContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0 touch-pan-x transition-colors ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          title="Drag or swipe with mouse to view all notes"
        >
          {noteItems.map((note) => {
            const isActive = note.id === activeNoteId;
            const isEditing = editingTitleId === note.id;

            return (
              <div
                key={note.id}
                ref={isActive ? activeTabRef : null}
                onClick={(e) => {
                  if (isDraggingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (!isEditing && note.id !== activeNoteId) {
                    soundManager.playClick();
                    setActiveNoteId(note.id);
                  }
                }}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all select-none shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-[#1E1F2B] text-slate-900 dark:text-white border-slate-300/80 dark:border-purple-500/40 shadow-sm ring-1 ring-black/5 dark:ring-purple-500/20'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <img src="/notes_icon_3d.png" alt="Note" className="w-4 h-4 object-contain shrink-0 drop-shadow-xs pointer-events-none" />

                {isEditing ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSaveRename(note.id);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={e => setTempTitle(e.target.value)}
                      onBlur={() => handleSaveRename(note.id)}
                      autoFocus
                      className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 text-slate-900 dark:text-white border border-[#2563EB] dark:border-[#7AA2F7] text-xs font-bold outline-none max-w-[130px]"
                    />
                    <button type="submit" className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:scale-110">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </form>
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(note);
                    }}
                    className="truncate max-w-[150px] font-sans"
                    title={`Double-click to rename: ${note.title}`}
                  >
                    {note.title}
                  </span>
                )}

                {/* Tab Quick Actions (Rename, Duplicate, Delete) */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(note);
                      }}
                      className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Rename Note"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateNote(note.id);
                      }}
                      className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Duplicate Note"
                    >
                      <CopyPlus className="w-3 h-3" />
                    </button>

                    {noteItems.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Fade Gradient Mask when scrollable */}
        {canScrollRight && (
          <div className="absolute right-6 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-[#151620] to-transparent pointer-events-none z-[5]" />
        )}

        {/* Right Arrow Button (shown when overflowing) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={scrollRightBy}
            disabled={!canScrollRight}
            className={`p-1 rounded-xl border text-xs transition-all shrink-0 z-10 flex items-center justify-center ${
              canScrollRight
                ? 'bg-white dark:bg-[#1E1F2B] border-slate-300/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#252636] text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95'
                : 'opacity-20 border-transparent text-slate-400 cursor-default pointer-events-none'
            }`}
            title="Scroll notes right"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Right Pinned Add Note Button with Dropdown Templates */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowAddTemplatesMenu(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] hover:bg-[#1D4ED8] dark:hover:bg-[#6090F5] text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Create a new Note Page for this topic"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Add Note</span>
        </button>

        {/* Quick Note Templates Dropdown */}
        {showAddTemplatesMenu && (
          <>
            {/* Click-outside backdrop */}
            <div
              className="fixed inset-0 z-[80]"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddTemplatesMenu(false);
              }}
            />
            <div
              className="absolute right-0 top-full mt-2 w-68 sm:w-72 max-h-[min(420px,calc(100vh-200px))] overflow-y-auto overscroll-contain rounded-2xl bg-white dark:bg-[#181822] border border-[#E2E8F0] dark:border-[#272730] shadow-2xl p-1.5 z-[100] animate-fade-in text-xs font-bold custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 dark:bg-[#181822]/95 backdrop-blur-xs px-2.5 py-1.5 text-[11px] uppercase font-mono text-slate-400 border-b border-[#E2E8F0] dark:border-[#272730] flex items-center justify-between z-10">
                <span>Choose Note Template:</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">7 templates</span>
              </div>
              
              <div className="py-1 space-y-0.5">
                {/* 🎯 Interactive Quiz / MCQ Practice */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    setShowQuizImportModal(true);
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white cursor-pointer transition-colors border-b border-indigo-100 dark:border-indigo-900/40"
                >
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">🎯 Interactive Quiz / MCQ</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Import Gemini link or test</div>
                  </div>
                </button>

                {/* 🔤 Smart Notion Vocabulary Flashcards */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote(`Smart Vocab: ${topicName}`, getDefaultSampleVocab(topicName));
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-amber-50/70 dark:hover:bg-amber-950/40 text-slate-800 dark:text-white cursor-pointer transition-colors border-b border-amber-100 dark:border-amber-900/40"
                >
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <BookMarked className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-700 dark:text-amber-400">🔤 Smart Vocabulary Note</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Auto-format AI Vocab to Notion Cards</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote();
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F8FAFC] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
                >
                  <img src="/notes_icon_3d.png" alt="Notes" className="w-5 h-5 object-contain shrink-0 drop-shadow-xs pointer-events-none" />
                  <div>
                    <div className="font-bold">📄 Blank Notes Page</div>
                    <div className="text-[11px] text-slate-400 font-normal">Start with clean canvas</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote(
                      'Formula Sheet',
                      `# Key Formulas & Speed Shortcuts\n> [!FORMULA]\n> Standard Equation: Speed = Distance / Time\n> Average Speed = 2xy / (x + y)\n\n> [!TIP]\n> Ratio Trick: Speed ratio a:b equals Time ratio b:a.\n\n### Revision Checklist\n- [ ] Memorize 5 key unit conversions\n- [ ] Practice 5 previous year exam questions`
                    );
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
                >
                  <Sigma className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-bold">🧮 Formula & Shortcuts</div>
                    <div className="text-[11px] text-slate-400 font-normal">Formulas, equations & tricks</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote(
                      'Comparison Table',
                      `# Concept Comparison Table\n| Case / Parameter | Formula | Shortcut Rule |\n| :--- | :--- | :--- |\n| Case 1: Constant Distance | $t_1 / t_2 = s_2 / s_1$ | Time inversely proportional to speed |\n| Case 2: Constant Time | $d_1 / d_2 = s_1 / s_2$ | Distance directly proportional to speed |\n| Case 3: Relative Speed | $S_{rel} = s_1 + s_2$ | Opposite directions: add speeds |`
                    );
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
                >
                  <TableIcon className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="font-bold">📊 Comparison Table</div>
                    <div className="text-[11px] text-slate-400 font-normal">Side-by-side concept matrix</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote(
                      'Rules & Traps Guide',
                      `# Golden Rules & Exam Traps\n> [!RULE]\n> Golden Rule: Fundamental concept definition and rules.\n\n> [!WARNING]\n> High-Frequency Trap: Watch out for negative markings in tricky exceptions!\n\n### High-Yield Questions\n- [ ] Check subject-verb agreement\n- [ ] Verify standard conversions`
                    );
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-bold">⚠️ Rules & Traps Guide</div>
                    <div className="text-[11px] text-slate-400 font-normal">Mistakes & examiner traps</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplatesMenu(false);
                    handleAddNewNote(
                      'PYQ & Solved Tricks',
                      `# Solved Previous Year Exam Questions (PYQ)\n> [!EXAMPLE]\n> Question: A train crosses a 300m bridge in 20 seconds. Speed = ?\n> Solution: Total distance = train + bridge.\n\n### Self Practice Checklist\n- [ ] Solve 2023 Tier 1 Questions\n- [ ] Solve 2024 Tier 2 Questions`
                    );
                    soundManager.playClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-bold">🎯 PYQ & Solved Tricks</div>
                    <div className="text-[11px] text-slate-400 font-normal">Previous year questions</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

  // ----------------------------------------------------------------------------------
  // MULTIPLE NOTES TABS RENDERER (Mouse Swipe, Drag-to-Scroll & Wheel Navigation)
  // ----------------------------------------------------------------------------------
  const renderNoteTabs = (inFullscreen: boolean = false) => {
    return (
      <NoteTabsTrack
        noteItems={noteItems}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        editingTitleId={editingTitleId}
        tempTitle={tempTitle}
        setTempTitle={setTempTitle}
        handleSaveRename={handleSaveRename}
        handleStartRename={handleStartRename}
        handleDuplicateNote={handleDuplicateNote}
        handleDeleteNote={handleDeleteNote}
        showAddTemplatesMenu={showAddTemplatesMenu}
        setShowAddTemplatesMenu={setShowAddTemplatesMenu}
        setShowQuizImportModal={setShowQuizImportModal}
        handleAddNewNote={handleAddNewNote}
        inFullscreen={inFullscreen}
      />
    );
  };

  // ----------------------------------------------------------------------------------
  // RENDER FLOATING TEXT HIGHLIGHTER TOOLTIP (For Box Mode)
  // ----------------------------------------------------------------------------------
  const renderFloatingHighlighter = () => {
    if (!selectionTooltip.visible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          left: `${selectionTooltip.x}px`,
          top: `${selectionTooltip.y}px`,
          transform: selectionTooltip.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          zIndex: 9999
        }}
        className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-2xl bg-[#11120F]/95 dark:bg-[#1C1D26]/95 text-white shadow-2xl border border-white/20 animate-fade-in select-none backdrop-blur-md"
        onMouseDown={e => e.preventDefault()}
        onTouchStart={e => e.stopPropagation()}
      >
        <span className="text-[11px] font-bold text-[#A1A1B2] font-mono flex items-center gap-1">
          <Highlighter className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Highlight:</span>
        </span>

        {/* 🟡 Yellow Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('')}
          className="w-5 h-5 rounded-full bg-yellow-400 hover:scale-125 active:scale-95 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Yellow (==text==)"
        />

        {/* 🟢 Green Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('g:')}
          className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-125 active:scale-95 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Green (==g:text==)"
        />

        {/* 🟣 Purple Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('p:')}
          className="w-5 h-5 rounded-full bg-purple-400 hover:scale-125 active:scale-95 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Purple (==p:text==)"
        />

        {/* 🔵 Blue Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('b:')}
          className="w-5 h-5 rounded-full bg-sky-400 hover:scale-125 active:scale-95 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Blue (==b:text==)"
        />

        {/* 🔴 Rose Highlight */}
        <button
          type="button"
          onClick={() => applyHighlight('r:')}
          className="w-5 h-5 rounded-full bg-rose-400 hover:scale-125 active:scale-95 transition-transform shadow-xs cursor-pointer border border-black/30"
          title="Rose (==r:text==)"
        />

        {/* 🧽 Erase / Remove Highlight Button */}
        <button
          type="button"
          onClick={() => removeHighlight(selectionTooltip.text)}
          className="px-2 py-0.5 ml-0.5 rounded-lg bg-rose-500/25 hover:bg-rose-500 text-rose-200 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-500/40 active:scale-95"
          title="Remove Highlight (Erase ==tags==)"
        >
          <span>🧽 Erase</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectionTooltip({ visible: false, x: 0, y: 0, text: '' })}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 ml-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ----------------------------------------------------------------------------------
  // HIGHLIGHTER CONTROLS WIDGET (Box & Freefall Mode Switcher)
  // ----------------------------------------------------------------------------------
  const renderHighlighterControlsWidget = (isFloating: boolean = false) => {
    return (
      <div className={`flex items-center gap-2 p-1.5 px-2.5 rounded-2xl ${
        isFloating
          ? 'bg-white/95 dark:bg-[#1C1D26]/95 border border-[#E2E8F0] dark:border-[#383A48] shadow-2xl backdrop-blur-md text-xs font-bold'
          : 'bg-[#F8FAFC] dark:bg-[#0D0E15] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold'
      } animate-fade-in flex-wrap`}>
        
        {/* Highlighter ON/OFF Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsHighlighterActive(prev => !prev);
            soundManager.playClick();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            isHighlighterActive
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
          }`}
          title="Toggle Highlighter"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>{isHighlighterActive ? 'Highlight ON' : 'Highlight OFF'}</span>
        </button>

        {isHighlighterActive && (
          <>
            {/* Mode Switcher: 🔲 Box vs ✍️ Freefall */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[#E2E8F0] dark:border-[#383A48]">
              <button
                type="button"
                onClick={() => {
                  setHighlighterMode('box');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  highlighterMode === 'box'
                    ? 'bg-white dark:bg-[#2A2B3A] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Box / Text Selection Highlighter (Select text while reading to highlight)"
              >
                <Square className="w-3 h-3" />
                <span>Box</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHighlighterMode('freefall');
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  highlighterMode === 'freefall'
                    ? 'bg-white dark:bg-[#2A2B3A] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Freefall Pen Highlighter (Freehand drawing / sketching directly over notes)"
              >
                <PenTool className="w-3 h-3" />
                <span>Freefall</span>
              </button>
            </div>

            {/* Colors Switcher */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#E2E8F0] dark:border-[#383A48]">
              {/* Yellow */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHighlightColor('');
                  setFreefallColor('rgba(250, 204, 21, 0.42)');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`w-4 h-4 rounded-full bg-yellow-400 hover:scale-125 transition-transform cursor-pointer border border-black/20 ${
                  (highlighterMode === 'box' && selectedHighlightColor === '') || (highlighterMode === 'freefall' && !isFreefallEraser && freefallColor.includes('250, 204, 21'))
                    ? 'ring-2 ring-amber-500 scale-110'
                    : ''
                }`}
                title="Yellow"
              />
              {/* Green */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHighlightColor('g:');
                  setFreefallColor('rgba(52, 211, 153, 0.42)');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`w-4 h-4 rounded-full bg-emerald-400 hover:scale-125 transition-transform cursor-pointer border border-black/20 ${
                  (highlighterMode === 'box' && selectedHighlightColor === 'g:') || (highlighterMode === 'freefall' && !isFreefallEraser && freefallColor.includes('52, 211, 153'))
                    ? 'ring-2 ring-emerald-500 scale-110'
                    : ''
                }`}
                title="Green"
              />
              {/* Purple */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHighlightColor('p:');
                  setFreefallColor('rgba(192, 132, 252, 0.42)');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`w-4 h-4 rounded-full bg-purple-400 hover:scale-125 transition-transform cursor-pointer border border-black/20 ${
                  (highlighterMode === 'box' && selectedHighlightColor === 'p:') || (highlighterMode === 'freefall' && !isFreefallEraser && freefallColor.includes('192, 132, 252'))
                    ? 'ring-2 ring-purple-500 scale-110'
                    : ''
                }`}
                title="Purple"
              />
              {/* Blue */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHighlightColor('b:');
                  setFreefallColor('rgba(56, 189, 248, 0.42)');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`w-4 h-4 rounded-full bg-sky-400 hover:scale-125 transition-transform cursor-pointer border border-black/20 ${
                  (highlighterMode === 'box' && selectedHighlightColor === 'b:') || (highlighterMode === 'freefall' && !isFreefallEraser && freefallColor.includes('56, 189, 248'))
                    ? 'ring-2 ring-sky-500 scale-110'
                    : ''
                }`}
                title="Blue"
              />
              {/* Rose */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHighlightColor('r:');
                  setFreefallColor('rgba(251, 113, 133, 0.42)');
                  setIsFreefallEraser(false);
                  soundManager.playClick();
                }}
                className={`w-4 h-4 rounded-full bg-rose-400 hover:scale-125 transition-transform cursor-pointer border border-black/20 ${
                  (highlighterMode === 'box' && selectedHighlightColor === 'r:') || (highlighterMode === 'freefall' && !isFreefallEraser && freefallColor.includes('251, 113, 133'))
                    ? 'ring-2 ring-rose-500 scale-110'
                    : ''
                }`}
                title="Rose"
              />
            </div>

            {/* Freefall Specific Tools (Pen Size, Eraser, Clear All) */}
            {highlighterMode === 'freefall' && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#E2E8F0] dark:border-[#383A48]">
                {/* Pen Size */}
                <button
                  type="button"
                  onClick={() => setFreefallSize(6)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${freefallSize === 6 ? 'bg-slate-800 text-white dark:bg-white dark:text-black' : 'text-slate-400'}`}
                  title="Fine Pen (6px)"
                >
                  Fine
                </button>
                <button
                  type="button"
                  onClick={() => setFreefallSize(14)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${freefallSize === 14 ? 'bg-slate-800 text-white dark:bg-white dark:text-black' : 'text-slate-400'}`}
                  title="Marker (14px)"
                >
                  Med
                </button>
                <button
                  type="button"
                  onClick={() => setFreefallSize(24)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${freefallSize === 24 ? 'bg-slate-800 text-white dark:bg-white dark:text-black' : 'text-slate-400'}`}
                  title="Thick Highlighter (24px)"
                >
                  Thick
                </button>

                {/* Eraser */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFreefallEraser(prev => !prev);
                    soundManager.playClick();
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isFreefallEraser ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Erase Freefall Drawings"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Eraser</span>
                </button>

                {/* Clear All Drawings */}
                {strokes.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllDrawings}
                    className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Clear All Drawings"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
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
        className="fixed inset-0 z-[150] bg-[#F8FAFC] dark:bg-[#0B0B0E] text-[#11120F] dark:text-[#F5F5F7] flex flex-col animate-fade-in"
        onMouseUp={handleMouseUpSelection}
        onTouchEnd={handleMouseUpSelection}
      >
        {/* Top Reading Progress Bar (Smooth Gradient across page) */}
        <div className="w-full h-[3px] bg-slate-200 dark:bg-slate-800 shrink-0 relative overflow-hidden z-[160]">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#2563EB] to-emerald-500 transition-all duration-150 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Fullscreen Zen Floating Controls (Visible when Top Bar is Hidden in Zen Mode) */}
        {isZenMode && (
          <>
            {/* Left: Floating Highlighter Controls in Pure Notes Only View (Visible on Desktop / Web only) */}
            <div className="hidden sm:block fixed top-4 left-5 z-[170]">
              {renderHighlighterControlsWidget(true)}
            </div>

            {/* Right: Show All Controls, Ruler, TOC & Exit Fullscreen */}
            <div className="hidden sm:flex fixed top-4 right-5 z-[170] items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsFocusRulerActive(prev => !prev);
                }}
                className={`p-2 rounded-2xl border shadow-2xl transition-all cursor-pointer backdrop-blur-md ${
                  isFocusRulerActive
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/40'
                    : 'bg-white/90 dark:bg-[#1C1D26]/90 text-slate-700 dark:text-slate-300 border-[#E2E8F0] dark:border-[#383A48] hover:bg-white'
                }`}
                title="Toggle Focus Reading Ruler (Press R)"
              >
                <Ruler className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsTocOpen(prev => !prev);
                }}
                className={`p-2 rounded-2xl border shadow-2xl transition-all cursor-pointer backdrop-blur-md ${
                  isTocOpen
                    ? 'bg-[#2563EB] text-white border-[#2563EB] ring-2 ring-[#2563EB]/40'
                    : 'bg-white/90 dark:bg-[#1C1D26]/90 text-slate-700 dark:text-slate-300 border-[#E2E8F0] dark:border-[#383A48] hover:bg-white'
                }`}
                title="Table of Contents (Press T)"
              >
                <List className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsZenMode(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-[#1C1D26]/90 hover:bg-white dark:hover:bg-[#282A38] text-slate-900 dark:text-white border border-[#E2E8F0] dark:border-[#383A48] shadow-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-md"
                title="Show All Header Sections & Toolbar Buttons (Press Z or ESC)"
              >
                <Eye className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
                <span>Show All Controls</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsFullscreen(false);
                  setIsZenMode(false);
                }}
                className="p-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 shadow-2xl transition-all cursor-pointer backdrop-blur-md"
                title="Exit Fullscreen (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Floating Minimal Back Action (Clean at Bottom-Right, Doesn't Cover Any Notes Text) */}
            <div className="sm:hidden fixed bottom-6 right-4 z-[170] flex items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsZenMode(false);
                }}
                className="p-2.5 rounded-full bg-white/90 dark:bg-[#1C1D26]/90 text-slate-800 dark:text-white border border-[#E2E8F0] dark:border-[#383A48] shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
                title="Show Controls"
              >
                <Eye className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsFullscreen(false);
                  setIsZenMode(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#11120F]/90 dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer border border-white/20"
                title="Exit back to Topic Notes"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back to Notes</span>
              </button>
            </div>
          </>
        )}

        {/* Fullscreen Zen Header Bar (Hides smoothly when isZenMode is true) */}
        {!isZenMode && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#E2E8F0] dark:border-[#272730] bg-white/85 dark:bg-[#12131C]/90 backdrop-blur-md flex flex-col gap-2 shrink-0 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              {/* Breadcrumb & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#415C9E] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7] truncate font-mono">
                    <span>{subjectName || 'Subject'}</span>
                    <span>•</span>
                    <span className="truncate">{chapterName || 'Chapter'}</span>
                  </div>
                  <h2 className={`text-sm sm:text-base font-black truncate ${getFontFamilyClass()}`}>
                    {topicName} • <span className="text-[#2563EB] dark:text-[#7AA2F7]">{activeNote.title}</span>
                  </h2>
                </div>
              </div>

              {/* Reader View & Customization Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 👁️ PURE NOTES ONLY / ZEN BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCompleteChime();
                    setIsZenMode(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Hide All Header Buttons & Top Bars (Pure Notes Only - Press Z)"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Pure Notes Only</span>
                </button>

                {/* 🔤 Font Family Selector */}
                <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleSelectFont('serif')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
                      readerFontFamily === 'serif'
                        ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Book Serif Typography (Lora)"
                  >
                    📖 Book Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFont('sans')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-sans ${
                      readerFontFamily === 'sans'
                        ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Modern Sans Typography (Plus Jakarta / Inter)"
                  >
                    🏛️ Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFont('lexend')}
                    className={`hidden sm:inline-block px-2.5 py-1 rounded-lg transition-all font-lexend ${
                      readerFontFamily === 'lexend'
                        ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Fast Reading Geometric Typography (Lexend)"
                  >
                    ⚡ Fast Read
                  </button>
                </div>

                {/* 🎨 Eye-Care Theme Switcher (Paper, Sepia, Sage, Candle, OLED) */}
                <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#151620] p-1 rounded-xl border border-[#CBD5E1] dark:border-[#272738] text-xs font-bold shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('paper')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                      readerTheme === 'paper' || readerTheme === 'default'
                        ? 'bg-white dark:bg-[#252838] text-slate-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-white/20 font-black ring-1 ring-slate-400/40 dark:ring-white/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    title="Paper White (Day Study)"
                  >
                    📄 Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('sepia')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                      readerTheme === 'sepia'
                        ? 'bg-[#F4E6C8] dark:bg-[#3D2C1C] text-[#3E2B1A] dark:text-[#F3E3CE] shadow-xs border border-[#DEC4A5] dark:border-[#6B4B2E] font-black ring-1 ring-[#D8B994] dark:ring-[#8C623C]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#3E2B1A] dark:hover:text-[#F3E3CE] hover:bg-[#F4E6C8]/40 dark:hover:bg-[#3D2C1C]/40'
                    }`}
                    title="Warm Kindle Sepia (Eye Comfort)"
                  >
                    📜 Sepia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('sage')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                      readerTheme === 'sage'
                        ? 'bg-[#DCEDDC] dark:bg-[#1A3320] text-[#1A3820] dark:text-[#E0F2E2] shadow-xs border border-[#BED9BC] dark:border-[#35613B] font-black ring-1 ring-[#A7CBA4] dark:ring-[#447C4C]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3820] dark:hover:text-[#E0F2E2] hover:bg-[#DCEDDC]/40 dark:hover:bg-[#1A3320]/40'
                    }`}
                    title="Sage Mint (Eye Fatigue Relief)"
                  >
                    🌿 Sage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('candle')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                      readerTheme === 'candle'
                        ? 'bg-[#F7E6D0] dark:bg-[#3D2614] text-[#3F2510] dark:text-[#F9E2CA] shadow-xs border border-[#E0C5A3] dark:border-[#6C4221] font-black ring-1 ring-[#D4B38A] dark:ring-[#8F572C]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#3F2510] dark:hover:text-[#F9E2CA] hover:bg-[#F7E6D0]/40 dark:hover:bg-[#3D2614]/40'
                    }`}
                    title="Candlelight Amber (Night Study)"
                  >
                    🕯️ Candle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('oled')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                      readerTheme === 'oled' || readerTheme === 'midnight'
                        ? 'bg-black text-white shadow-xs border border-black dark:border-white/30 font-black ring-1 ring-black/40 dark:ring-white/40'
                        : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                    title="Pitch Dark OLED (AMOLED)"
                  >
                    🖤 OLED
                  </button>
                </div>

                {/* 📖 Book Spread Layout Selector */}
                <div className="hidden md:flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setReaderLayout('single');
                      localStorage.setItem('syllabus3d_reader_layout', 'single');
                      soundManager.playClick();
                    }}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      readerLayout === 'single'
                        ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Single Continuous Page"
                  >
                    📄 1-Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReaderLayout('spread');
                      localStorage.setItem('syllabus3d_reader_layout', 'spread');
                      soundManager.playClick();
                    }}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      readerLayout === 'spread'
                        ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Kindle / Book Dual-Column Spread"
                  >
                    📖 Spread
                  </button>
                </div>

                {/* Line Spacing / Leading Selector */}
                <div className="hidden 2xl:flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold">
                  <span className="text-[10px] text-[#85877E] px-1 font-mono">Spacing:</span>
                  {(['compact', 'relaxed', 'spacious'] as ReaderLineHeight[]).map(lh => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => {
                        setReaderLineHeight(lh);
                        localStorage.setItem('syllabus3d_reader_line_height', lh);
                        soundManager.playClick();
                      }}
                      className={`px-1.5 py-0.5 rounded capitalize text-[11px] cursor-pointer ${
                        readerLineHeight === lh
                          ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                          : 'text-[#85877E] hover:text-[#11120F]'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>

                {/* Focus Reading Ruler Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setIsFocusRulerActive(prev => !prev);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isFocusRulerActive
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                      : 'bg-[#F8FAFC] dark:bg-[#1C1D26] border-[#E2E8F0] dark:border-[#272730] text-slate-600 dark:text-slate-300 hover:text-amber-600'
                  }`}
                  title="Toggle Focus Reading Ruler (Press R)"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Focus Ruler</span>
                </button>

                {/* Table of Contents Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setIsTocOpen(prev => !prev);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isTocOpen
                      ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black border-transparent shadow-xs ring-2 ring-[#2563EB]/40'
                      : 'bg-[#F8FAFC] dark:bg-[#1C1D26] border-[#E2E8F0] dark:border-[#272730] text-slate-600 dark:text-slate-300 hover:text-[#2563EB]'
                  }`}
                  title="Table of Contents (Jump to Headings - Press T)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>TOC</span>
                </button>

                {/* Font Size Adjuster (Visible on Mobile & Desktop) */}
                <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-mono font-bold">
                  <span className="text-[11px] text-[#85877E]">Size:</span>
                  {(['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSelectFontSize(size)}
                      className={`px-1.5 py-0.5 rounded uppercase cursor-pointer transition-all active:scale-95 ${
                        readerFontSize === size ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black font-black shadow-xs' : 'text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Container Width Adjuster */}
                <div className="hidden md:flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-mono font-bold">
                  <span className="text-[11px] text-[#85877E]">Width:</span>
                  {(['normal', 'wide', 'full'] as ReaderWidth[]).map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setReaderWidth(w)}
                      className={`px-1.5 py-0.5 rounded capitalize ${
                        readerWidth === w ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black' : 'text-[#85877E] hover:text-[#11120F]'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* PDF Export */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#1C1D26] border border-[#E2E8F0] dark:border-[#272730] text-[#2563EB] dark:text-[#7AA2F7] hover:bg-[#2563EB]/15 cursor-pointer"
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

            {/* Note Pages Tab Strip in Fullscreen Mode */}
            <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1">{renderNoteTabs(true)}</div>
              <div>{renderHighlighterControlsWidget(false)}</div>
            </div>
          </div>
        )}

        {/* Fullscreen Content Area with Scroll Tracking & Focus Ruler Pointer */}
        <div
          ref={fullscreenScrollRef}
          className={`flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar ${isZenMode ? 'pt-4 sm:pt-16 pb-24 sm:pb-8' : ''}`}
          onScroll={(e) => {
            const el = e.currentTarget;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
              const pct = (el.scrollTop / maxScroll) * 100;
              setReadingProgress(Math.min(100, Math.max(0, Math.round(pct))));
            }
          }}
          onMouseMove={(e) => {
            if (isFocusRulerActive) {
              setFocusRulerY(e.clientY);
            }
          }}
        >
          <div className={`mx-auto ${getReaderWidthClass()}`}>
            {viewMode === 'study' && (
              <div className="relative" ref={fsNotesContainerRef}>
                <div className={`p-6 sm:p-12 rounded-3xl ${getThemeContainerClass()} min-h-[70vh] select-text cursor-text relative z-10`} style={getThemeInlineStyle()}>
                  {renderFormattedNotes(getFontSizeClass())}
                </div>

                {/* Freefall Canvas Overlay */}
                <canvas
                  ref={fullscreenCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={endDrawing}
                  className={`absolute inset-0 z-20 rounded-3xl ${
                    highlighterMode === 'freefall' && isHighlighterActive
                      ? 'pointer-events-auto cursor-crosshair'
                      : 'pointer-events-none'
                  }`}
                />
              </div>
            )}

            {viewMode === 'edit' && (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={e => updateContentAndSave(e.target.value)}
                  onPaste={handlePaste}
                  rows={24}
                  className="w-full p-6 rounded-3xl bg-white dark:bg-[#12131C] border border-[#E2E8F0] dark:border-[#272730] font-mono text-sm text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-xl"
                />
              </div>
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <textarea
                  value={content}
                  onChange={e => updateContentAndSave(e.target.value)}
                  onPaste={handlePaste}
                  rows={26}
                  className="w-full p-5 rounded-3xl bg-white dark:bg-[#12131C] border border-[#E2E8F0] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-xl"
                />
                <div className={`p-6 rounded-3xl ${getThemeContainerClass()} overflow-y-auto max-h-[80vh] custom-scrollbar select-text`} style={getThemeInlineStyle()}>
                  {renderFormattedNotes(getFontSizeClass())}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Focus Reading Ruler Ribbon */}
        {isFocusRulerActive && (
          <div
            className="fixed left-0 right-0 pointer-events-none z-[165] transition-transform duration-75 ease-out"
            style={{
              top: `${focusRulerY - 18}px`,
              height: '36px'
            }}
          >
            <div className="w-full h-full bg-amber-400/20 dark:bg-yellow-300/15 border-y-2 border-amber-500/40 backdrop-contrast-125 shadow-[0_0_25px_rgba(251,191,36,0.15)] flex items-center justify-end px-6">
              <span className="text-[10px] font-mono font-black text-amber-800 dark:text-amber-200 uppercase tracking-widest bg-amber-200/70 dark:bg-amber-900/70 px-2 py-0.5 rounded shadow-xs">
                Focus Line 📏
              </span>
            </div>
          </div>
        )}

        {/* Table of Contents Floating Panel */}
        {isTocOpen && (
          <div className="fixed top-14 right-4 sm:right-6 w-80 max-w-[calc(100vw-2rem)] max-h-[75vh] z-[180] bg-white/95 dark:bg-[#151622]/95 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#2B2D3D] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-3.5 px-4 bg-slate-50/90 dark:bg-[#1A1B28]/90 border-b border-[#E2E8F0] dark:border-[#272730] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
                  Table of Contents ({tableOfContents.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="Close (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {tableOfContents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No headings (# Heading) found in this note.
                </div>
              ) : (
                tableOfContents.map((item, idx) => (
                  <button
                    key={item.id + '-' + idx}
                    type="button"
                    onClick={() => {
                      handleScrollToHeading(item.id, item.index ?? idx);
                      setIsTocOpen(false);
                    }}
                    title={item.text}
                    className={`w-full text-left py-1.5 px-2.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-[#2563EB]/10 dark:hover:bg-[#7AA2F7]/10 flex items-start gap-2 ${
                      item.level === 1
                        ? 'font-bold text-slate-900 dark:text-white'
                        : item.level === 2
                        ? 'pl-4 font-semibold text-indigo-700 dark:text-indigo-300'
                        : item.level === 3
                        ? 'pl-6 font-medium text-slate-700 dark:text-slate-300'
                        : item.level === 4
                        ? 'pl-8 font-normal text-amber-700 dark:text-amber-400'
                        : 'pl-10 font-normal text-slate-500 dark:text-slate-400 text-[11px]'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-amber-500 mt-0.5 shrink-0">
                      {item.level === 1 ? '•' : item.level === 2 ? '◆' : item.level === 3 ? '▶' : item.level === 4 ? '–' : '›'}
                    </span>
                    <span className="truncate">{item.text}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {renderFloatingHighlighter()}
      </div>,
      document.body
    );
  };

  // ----------------------------------------------------------------------------------
  // MAIN COMPONENT JSX (Normal Drawer View)
  // ----------------------------------------------------------------------------------
  return (
    <div className="space-y-3" onPaste={handlePaste} onMouseUp={handleMouseUpSelection} onTouchEnd={handleMouseUpSelection}>
      
      {/* 🌟 UNIFIED MASTER HEADER CARD (Clean Tabs & Organized Toolbar) */}
      <div className="rounded-2xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-sm relative divide-y divide-[#E2E8F0]/60 dark:divide-[#272730] no-print">
        
        {/* Tier 1: Modern Multi-Note Tabs Track */}
        <div className="p-2 px-3 rounded-t-2xl bg-[#F8FAFC]/80 dark:bg-[#12131C]/60 flex items-center justify-between gap-3">
          {renderNoteTabs(false)}
        </div>

        {/* Tier 2: Sleek, Categorized Master Toolbar */}
        <div className="p-2 px-3 rounded-b-2xl flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left Cluster: View Modes & Full Screen */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0D0E15] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730]">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setViewMode('study');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'study'
                    ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                    ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                title="Side-by-side Live View"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split Live</span>
              </button>
            </div>

            {/* Full Screen Focus Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playCompleteChime();
                setIsFullscreen(true);
              }}
              title="Open Fullscreen Immersive Reading Mode"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Maximize className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Full Screen</span>
            </button>
          </div>

          {/* Middle Cluster: Highlighter Widget (Box & Freefall) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderHighlighterControlsWidget(false)}
          </div>

          {/* Right Cluster: AI Tools, Utilities & Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* ✨ Notion AI Note Studio */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setNotionAiPastedText(content);
                setIsNotionAiModalOpen(true);
              }}
              title="Notion AI Note Studio (Ctrl + J) — Select from 6 formats for Gemini / ChatGPT notes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-violet-500/25 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Notion AI</span>
              <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] bg-white/20 font-mono font-normal">
                Ctrl+J
              </span>
            </button>

            {/* Fix Tables & Formulas */}
            <button
              type="button"
              onClick={handleRepairTablesAndFormulas}
              disabled={!content.trim()}
              title="Auto-repair broken tables, missing pipes, and format formulas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Fix Tables</span>
            </button>

            {/* Copy AI Prompt */}
            <button
              type="button"
              onClick={handleCopyAiPrompt}
              title="Copy structured notes prompt for Gemini / ChatGPT"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{promptCopied ? '✓ Copied' : 'AI Prompt'}</span>
            </button>

            {/* Theme Switcher in Normal Toolbar (Study & Split Preview) */}
            {(viewMode === 'study' || viewMode === 'split') && (
              <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#151620] p-1 rounded-xl border border-[#CBD5E1] dark:border-[#272738] text-xs font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSelectTheme('paper')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                    readerTheme === 'paper' || readerTheme === 'default'
                      ? 'bg-white dark:bg-[#252838] text-slate-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-white/20 font-black ring-1 ring-slate-400/40 dark:ring-white/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="Paper White (Day Study)"
                >
                  📄 Paper
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('sepia')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                    readerTheme === 'sepia'
                      ? 'bg-[#F4E6C8] dark:bg-[#3D2C1C] text-[#3E2B1A] dark:text-[#F3E3CE] shadow-xs border border-[#DEC4A5] dark:border-[#6B4B2E] font-black ring-1 ring-[#D8B994] dark:ring-[#8C623C]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#3E2B1A] dark:hover:text-[#F3E3CE] hover:bg-[#F4E6C8]/40 dark:hover:bg-[#3D2C1C]/40'
                  }`}
                  title="Warm Kindle Sepia (Eye Comfort)"
                >
                  📜 Sepia
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('sage')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                    readerTheme === 'sage'
                      ? 'bg-[#DCEDDC] dark:bg-[#1A3320] text-[#1A3820] dark:text-[#E0F2E2] shadow-xs border border-[#BED9BC] dark:border-[#35613B] font-black ring-1 ring-[#A7CBA4] dark:ring-[#447C4C]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3820] dark:hover:text-[#E0F2E2] hover:bg-[#DCEDDC]/40 dark:hover:bg-[#1A3320]/40'
                  }`}
                  title="Sage Mint (Eye Fatigue Relief)"
                >
                  🌿 Sage
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('candle')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                    readerTheme === 'candle'
                      ? 'bg-[#F7E6D0] dark:bg-[#3D2614] text-[#3F2510] dark:text-[#F9E2CA] shadow-xs border border-[#E0C5A3] dark:border-[#6C4221] font-black ring-1 ring-[#D4B38A] dark:ring-[#8F572C]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#3F2510] dark:hover:text-[#F9E2CA] hover:bg-[#F7E6D0]/40 dark:hover:bg-[#3D2614]/40'
                  }`}
                  title="Candlelight Amber (Night Study)"
                >
                  🕯️ Candle
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('oled')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                    readerTheme === 'oled' || readerTheme === 'midnight'
                      ? 'bg-black text-white shadow-xs border border-black dark:border-white/30 font-black ring-1 ring-black/40 dark:ring-white/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                  title="Pitch Dark OLED (AMOLED)"
                >
                  🖤 OLED
                </button>
              </div>
            )}

            {/* Font Family Switcher */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0D0E15] px-2 py-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectFont('serif')}
                className={`px-1.5 py-0.5 rounded font-serif cursor-pointer ${
                  readerFontFamily === 'serif'
                    ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Book Serif (Lora)"
              >
                Serif
              </button>
              <button
                type="button"
                onClick={() => handleSelectFont('sans')}
                className={`px-1.5 py-0.5 rounded font-sans cursor-pointer ${
                  readerFontFamily === 'sans'
                    ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Modern Sans"
              >
                Sans
              </button>
            </div>

            {/* Font Size Adjuster (Visible in normal drawer toolbar) */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0D0E15] px-2 py-1 rounded-xl border border-[#E2E8F0] dark:border-[#272730] text-xs font-mono font-bold">
              <span className="text-[10px] text-[#85877E]">Size:</span>
              {(['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectFontSize(size)}
                  className={`px-1.5 py-0.5 rounded uppercase cursor-pointer transition-all active:scale-95 ${
                    readerFontSize === size
                      ? 'bg-[#2563EB] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Set text size to ${size.toUpperCase()}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Split PDF (if exists) */}
            {onOpenSplitPdf && hasPdfAttachments && (
              <button
                onClick={onOpenSplitPdf}
                title="Split screen with attached PDF"
                className="p-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">PDF Sync</span>
              </button>
            )}

            {/* Lecture Sync (if exists) */}
            {onOpenSplitLecture && (
              <button
                onClick={() => onOpenSplitLecture(lectures?.[0]?.id, 0)}
                title="Watch lecture video"
                className="p-1.5 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lecture</span>
              </button>
            )}

            {/* Voice Typing */}
            <button
              type="button"
              onClick={toggleVoiceTyping}
              title={isListening ? 'Stop Voice Typing' : 'Voice Typing'}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#F8FAFC] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#E2E8F0] dark:border-[#272730]'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening' : 'Voice'}</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              title="Download PDF"
              className="p-1.5 px-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#E2E8F0] dark:border-[#272730] text-xs font-semibold cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy notes"
              className="p-1.5 px-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#E2E8F0] dark:border-[#272730] text-xs font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Auto-Save Status */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#F8FAFC] dark:bg-[#0D0E15] border border-[#E2E8F0] dark:border-[#272730] text-[11px] font-mono font-bold">
              {saveStatus === 'saving' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400">Saving</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                  <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-slate-400">Ready</span>
                </>
              )}
            </div>

            {/* Done button in edit mode */}
            {viewMode !== 'study' && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Done (Ctrl + S)"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Saved' : 'Done'}</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* AI Formatted Success Banner */}
      {aiFormattedNotice && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-emerald-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>✨ "{activeNote.title}" successfully converted to professional academic format with Callouts, Formulas & Tables!</span>
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
        <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-sm space-y-2">
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
              <Clock className="w-3.5 h-3.5" />
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E8F0] dark:border-[#272730]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">1-Click Templates:</span>
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

      {/* Smart Paste / Table & Formula Success Toast */}
      {pasteNotice && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold animate-fade-in shadow-xs">
          <Sparkles className="w-4 h-4 text-purple-500 stroke-[2.5]" />
          <span>{pasteNotice}</span>
        </div>
      )}

      {/* Attached Screenshots Strip */}
      {viewMode !== 'study' && images && images.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/80 border border-[#E2E8F0] dark:border-[#272730] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] flex items-center gap-1.5 font-serif">
              <ImageIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Attached Screenshots & Diagrams ({images.length})
            </span>
            <span className="text-[11px] text-[#85877E]">Click to view • Press Ctrl+V to paste more</span>
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
        /* Full Editor Mode (Hidden in Print) */
        <div className="space-y-2 print:hidden" onPaste={handlePaste}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => updateContentAndSave(e.target.value)}
            onPaste={handlePaste}
            placeholder={`Paste your notes from Gemini, ChatGPT, or Claude here, or write your own!\n\n✨ Notion AI Studio: After pasting, press Ctrl+J or click "✨ Notion AI" in the toolbar above to choose from 6 formats (Notion Master, Cornell, Active Recall Q&A, Speed Cheat Sheet, Deep Outline, Zero-Loss Normalizer) with 100% data preservation!\n\n> [!FORMULA]\n> Your formulas here\n\n> [!TIP]\n> Your shortcuts here\n\n> [!WARNING]\n> Exam traps here\n\n- [ ] Checklist items`}
            rows={14}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#12131A] border border-[#E2E8F0] dark:border-[#272730] font-mono text-xs sm:text-[13px] text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#7AA2F7] shadow-inner select-text"
          />
        </div>
      )}

      {viewMode === 'split' && (
        /* Split Live View (Side-by-Side Editor & Live Render - Hidden in Print) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden" onPaste={handlePaste}>
          <div className="flex flex-col space-y-1.5">
            <div className="text-[11px] font-bold text-[#85877E] uppercase font-mono flex items-center justify-between px-1">
              <span>Markdown Source Editor</span>
              <span>{wordCount} words</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => updateContentAndSave(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type or paste markdown..."
              rows={16}
              className="flex-1 w-full p-3.5 rounded-2xl bg-white dark:bg-[#12131A] border border-[#E2E8F0] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-inner resize-none select-text"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="text-[11px] font-bold text-[#85877E] uppercase font-mono px-1">
              <span>Live Visual Notes Preview ({activeNote.title})</span>
            </div>
            <div className={`flex-1 p-4 sm:p-5 rounded-2xl ${getThemeContainerClass()} overflow-y-auto max-h-[480px] custom-scrollbar select-text`} style={getThemeInlineStyle()}>
              {renderFormattedNotes()}
            </div>
          </div>
        </div>
      )}

      {/* Print-Only: Always render clean formatted study notes even if user was editing on screen */}
      {viewMode !== 'study' && (
        <div className="hidden print:block space-y-4">
          <div className="p-0 select-text">
            {renderFormattedNotes()}
          </div>
        </div>
      )}

      {viewMode === 'study' && (
        /* Study Mode (Clean, magazine-quality visual notes with Freefall & Box Overlay) */
        <div className="space-y-4">
          <div className="relative" ref={notesContainerRef}>
            <div className={`p-4 sm:p-7 rounded-3xl ${getThemeContainerClass()} min-h-[220px] select-text cursor-text relative z-10 print:p-0 print:border-none print:shadow-none`} style={getThemeInlineStyle()}>
              {renderFormattedNotes()}
            </div>

            {/* Freefall Canvas Overlay (Hidden in print) */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={drawMove}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={drawMove}
              onTouchEnd={endDrawing}
              className={`absolute inset-0 z-20 rounded-3xl print:hidden ${
                highlighterMode === 'freefall' && isHighlighterActive
                  ? 'pointer-events-auto cursor-crosshair'
                  : 'pointer-events-none'
              }`}
            />
          </div>

          {/* Attached Screenshots Gallery */}
          {images && images.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#18181D]/90 border border-[#E2E8F0] dark:border-[#272730] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5 font-serif">
                  <ImageIcon className="w-4 h-4 text-[#8B5CF6]" />
                  Attached Screenshots & Diagrams ({images.length})
                </span>
                <span className="text-[11px] text-[#85877E]">Click image to view in full resolution</span>
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

      {/* Floating Selection Highlighter Tooltip in Study View (For Box Mode) */}
      {renderFloatingHighlighter()}

      {/* Fullscreen Zen Reader Experience */}
      {renderFullScreenReaderModal()}

      {/* High-Res Image Zoom Lightbox Modal */}
      {/* High-Res Image Zoom Lightbox Modal */}
      {zoomImage && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[210] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
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
        </div>,
        document.body
      )}

      {/* 🎯 Interactive Quiz Import & Creator Modal (Portal to document.body prevents drawer scroll trap) */}
      {showQuizImportModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowQuizImportModal(false)}
          className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#151622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-transparent dark:from-[#1A1C2E] dark:via-[#161726] dark:to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Interactive Quiz & MCQ Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Import from Google Gemini link, paste MCQs, or generate an exam quiz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuizImportModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Option 1: Gemini Share Link */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Gemini Quiz Share Link (Optional)</span>
                  </label>
                </div>
                <input
                  type="url"
                  value={quizInputLink}
                  onChange={e => setQuizInputLink(e.target.value)}
                  placeholder="https://share.gemini.google/iMDdEutzj2LP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Paste your public Gemini share link. It will be verified and attached with an instant 1-click launch button.
                </p>
              </div>

              {/* Option 2: Paste Quiz Text / Markdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Paste Quiz Text or MCQs from Gemini / ChatGPT:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyQuizAiPrompt}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Copy AI prompt to generate 5 MCQs on this topic in Gemini"
                  >
                    <Bot className="w-3 h-3" />
                    <span>{quizPromptCopied ? '✓ Prompt Copied!' : '🤖 Copy AI Quiz Prompt'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={quizInputText}
                  onChange={e => setQuizInputText(e.target.value)}
                  placeholder={`Paste your quiz here, for example:\n\n### Q1: What is the capital of India?\n- [A] Mumbai\n- [B] New Delhi\n- [C] Kolkata\n- [D] Chennai\n**Answer:** B\n**Explanation:** New Delhi is the national capital.`}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCreateQuizFromModal}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Interactive Quiz Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAddNewNote(`Quiz: ${topicName}`, getDefaultSampleQuiz(topicName, quizInputLink.trim() || undefined));
                    setShowQuizImportModal(false);
                    setQuizInputLink('');
                    setQuizInputText('');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                >
                  Use Sample Template
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ✨ Floating Notion AI Paste Prompt Banner */}
      {showAiPastePromptToast && (
        <div className="fixed bottom-24 right-6 z-[190] animate-slide-in flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 text-white shadow-2xl border border-white/20 backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div className="text-xs">
            <p className="font-black flex items-center gap-1.5">
              <span>Pasted AI Notes?</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/20">Notion AI</span>
            </p>
            <p className="text-[11px] text-white/80">Structure into Notion, Cornell, or Cheat Sheet format</p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playCompleteChime();
              setNotionAiPastedText(pendingAiPastedText);
              setShowAiPastePromptToast(false);
              setIsNotionAiModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white text-violet-800 hover:bg-slate-100 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            Open Studio
          </button>
          <button
            type="button"
            onClick={() => setShowAiPastePromptToast(false)}
            className="p-1 text-white/70 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ✨ Notion AI Notes Studio Modal */}
      <NotionAiNotesStudioModal
        isOpen={isNotionAiModalOpen}
        onClose={() => setIsNotionAiModalOpen(false)}
        topicName={topicName}
        subjectName={subjectName}
        chapterName={chapterName}
        examName={examName}
        currentNoteContent={content}
        initialPastedText={notionAiPastedText}
        onApplyFormattedNotes={(formatted, mode) => {
          if (mode === 'append') {
            const updated = content.trim() ? `${content}\n\n${formatted}` : formatted;
            updateContentAndSave(updated);
          } else {
            updateContentAndSave(formatted);
          }
          setPasteNotice('✓ Notion AI Notes Applied with 100% Data Preservation!');
          setTimeout(() => setPasteNotice(null), 3500);
        }}
      />
    </div>
  );
};
