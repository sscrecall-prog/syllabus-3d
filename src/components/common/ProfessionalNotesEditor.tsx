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
  ArrowLeft
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { generateAndOpenNotesPdf } from '../../utils/pdfGenerator';
import { TopicImageAttachment, TopicLecture, TopicNoteItem } from '../../types/syllabus';
import { parseTimestampToSeconds } from '../../utils/youtubeUtils';
import { formatAiNotes, generateAiNotesPrompt } from '../../utils/aiNotesFormatter';

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
type ReaderTheme = 'default' | 'sepia' | 'paper' | 'oled';
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

  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>('base');
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>('normal');

  // Reader Typography & Color Theme Customization (Persisted)
  const [readerFontFamily, setReaderFontFamily] = useState<ReaderFontFamily>(() => {
    return (localStorage.getItem('syllabus3d_notes_font') as ReaderFontFamily) || 'serif';
  });
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('syllabus3d_notes_theme') as ReaderTheme) || 'default';
  });

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with initialNoteItems / initialContent if topic changed
  useEffect(() => {
    if (initialNoteItems && initialNoteItems.length > 0) {
      setNoteItems(initialNoteItems);
      if (!initialNoteItems.some(n => n.id === activeNoteId)) {
        setActiveNoteId(initialNoteItems[0].id);
      }
    } else if (initialContent !== undefined) {
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
  }, [initialNoteItems, initialContent]);

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
        if (isZenMode) {
          setIsZenMode(false);
          soundManager.playClick();
        } else if (isFullscreen) {
          setIsFullscreen(false);
          soundManager.playClick();
        }
      }
      if ((e.key === 'z' || e.key === 'Z') && isFullscreen && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsZenMode(prev => !prev);
        soundManager.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, noteItems, onSave, isFullscreen, isZenMode]);

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
    setViewMode('edit');
    onSave(presetContent || '', updated);
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
    const tpl = `\n# Key Formulas & Definitions\n> [!FORMULA]\n> Standard Formula: Speed = Distance / Time\n> Average Speed (Equal Distance) = 2xy / (x + y)\n\n> [!TIP]\n> Shortcut Method: Ratio method converts speed ratio a:b to time ratio b:a.\n\n> [!WARNING]\n> Common Trap: Don't take simple arithmetic average when distances are constant!\n\n### High-Yield Action Checklist\n- [ ] Memorize basic conversion (1 km/h = 5/18 m/s)\n- [ ] Practice 5 previous year exam questions\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
  };

  const insertComparisonTableTemplate = () => {
    const tpl = `\n### Comparison Table & Key Parameters\n| Concept / Case | Formula / Rule | Shortcut / Key Note |\n| :--- | :--- | :--- |\n| Case 1: Constant Distance | $t_1 / t_2 = s_2 / s_1$ | Time inversely proportional to speed |\n| Case 2: Constant Time | $d_1 / d_2 = s_1 / s_2$ | Distance directly proportional to speed |\n| Case 3: Relative Speed (Same Dir) | $S_{rel} = s_1 - s_2$ | Subtract speeds |\n| Case 4: Relative Speed (Opp Dir) | $S_{rel} = s_1 + s_2$ | Add speeds |\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
  };

  const insertGrammarRuleTemplate = () => {
    const tpl = `\n# Core Grammar & Rule Guide\n> [!RULE]\n> Golden Rule: Singular subjects take singular verbs; plural subjects take plural verbs.\n\n> [!WARNING]\n> High-Frequency Exception: Expressions like 'along with', 'as well as', 'in addition to' do not change the subject number.\n\n### Practice Traps\n- [ ] Check subject before the prepositional phrase\n- [ ] Verify tense consistency across clauses\n`;
    updateContentAndSave(content ? content + '\n' + tpl : tpl);
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
    updateContentAndSave(updated);
    soundManager.playClick();
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
        return 'bg-[#FBF0D9] text-[#2C2416] border-[#E8DCC0] dark:bg-[#1E1912] dark:text-[#E8DCBA] dark:border-[#3D3325] shadow-md';
      case 'oled':
        return 'bg-[#050608] text-[#E2E8F0] border-[#1E2028] dark:bg-[#030305] dark:text-[#F8FAFC] dark:border-[#1E2028] shadow-md';
      case 'paper':
        return 'bg-[#FAF9F6] text-[#1E1F24] border-[#E2E0D8] dark:bg-[#161720] dark:text-[#E6EDF3] dark:border-[#282B3E] shadow-md';
      case 'default':
      default:
        return 'bg-white/95 dark:bg-[#141520] text-[#11120F] dark:text-[#F5F5F7] border-[#D8D8CF] dark:border-[#272730] shadow-sm';
    }
  };

  const getFontSizeClass = () => {
    switch (readerFontSize) {
      case 'sm':
        return 'text-xs sm:text-[13px] leading-[1.75]';
      case 'base':
        return 'text-xs sm:text-[14.5px] leading-[1.85]';
      case 'lg':
        return 'text-sm sm:text-[16px] leading-[1.95]';
      case 'xl':
        return 'text-base sm:text-[18px] leading-[2.05]';
      default:
        return 'text-xs sm:text-[14.5px] leading-[1.85]';
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

  // Rich Inline Markdown Parser with Interactive Multi-color Highlighters
  const parseInlineMarkdown = (text: string, keyPrefix: string = 'inline'): React.ReactNode[] => {
    if (!text) return [];

    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==[^=]+==|~~[^~]+~~|\$\$[^\$]+\$\$|\$[^\$]+\$|⏱️\s*(?:\[\d{1,2}:\d{2}(?::\d{2})?\]|\d{1,2}:\d{2}(?::\d{2})?))/g;
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
            <span className="text-purple-500 text-[11px]">∑</span>
            <span>{mathContent}</span>
          </span>
        );
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
            className="my-4 rounded-2xl border border-slate-700/80 bg-[#0F1017] shadow-md overflow-hidden text-slate-200"
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
          const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
          const dataRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

          elements.push(
            <div
              key={'table-' + i}
              className="my-5 overflow-x-auto rounded-2xl border border-[#D8D8CF] dark:border-[#272730] shadow-sm bg-white/80 dark:bg-[#12131A]/90 backdrop-blur-sm"
            >
              <table className="w-full text-left border-collapse min-w-[340px] font-sans">
                <thead>
                  <tr className="bg-gradient-to-r from-[#F4F4EC] to-[#ECECE4] dark:from-[#181926] dark:to-[#1E2030] border-b border-[#D8D8CF] dark:border-[#272730] text-[11px] font-black uppercase tracking-wider text-[#11120F] dark:text-[#C0CAF5] font-mono">
                    {rawHeaders.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-3 px-4 font-black border-r border-[#D8D8CF]/50 dark:border-[#272730]/50 last:border-r-0"
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
                        rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/60 dark:bg-[#161722]/50'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-3 px-4 ${fontSize} font-medium border-r border-[#D8D8CF]/30 dark:border-[#272730]/30 last:border-r-0 leading-relaxed`}
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

        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const l = lines[i].trim().replace(/^>\s*/, '');
          if (!l.startsWith('[!')) {
            calloutLines.push(l);
          }
          i++;
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
            className={`my-4 p-4 sm:p-5 rounded-2xl border backdrop-blur-sm shadow-sm ${borderCol}`}
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

      // 4. Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={i}
            className={`${fontFam} text-xl sm:text-2xl font-black mt-7 mb-3 pb-2.5 border-b-2 border-[#596B35]/30 dark:border-[#7AA2F7]/30 flex items-center gap-2.5 text-[#11120F] dark:text-white`}
          >
            <span className="w-1.5 h-6 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] inline-block shrink-0" />
            <span>{parseInlineMarkdown(line.replace('# ', ''), `h1-${i}`)}</span>
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={i}
            className={`${fontFam} text-lg sm:text-xl font-extrabold mt-6 mb-2.5 flex items-center gap-2 text-[#11120F] dark:text-white`}
          >
            <span className="w-1.5 h-5 rounded-full bg-purple-500 inline-block shrink-0" />
            <span>{parseInlineMarkdown(line.replace('## ', ''), `h2-${i}`)}</span>
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={i}
            className={`${fontFam} text-xs sm:text-sm font-black text-[#596B35] dark:text-[#7AA2F7] mt-5 mb-2 uppercase tracking-wide flex items-center gap-1.5 font-mono`}
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-2.5 shrink-0" />
            <div className={`${fontSize} ${fontFam} font-medium text-slate-800 dark:text-slate-200`}>
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
            <span className="px-1.5 py-0.2 rounded-md bg-[#596B35]/15 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] text-[11px] font-mono font-black mt-0.5 shrink-0">
              {num}.
            </span>
            <div className={`${fontSize} ${fontFam} font-medium text-slate-800 dark:text-slate-200`}>
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
            className="my-4 max-w-2xl rounded-2xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] bg-[#141418] shadow-md group"
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
      // 11. Regular Paragraph with inline formatting
      else {
        elements.push(
          <p key={i} className={`${fontSize} ${fontFam} text-slate-800 dark:text-slate-200 my-3 leading-relaxed`}>
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

  // ----------------------------------------------------------------------------------
  // MULTIPLE NOTES TABS RENDERER (Clean, Modern IDE / Notion Style)
  // ----------------------------------------------------------------------------------
  const renderNoteTabs = (inFullscreen: boolean = false) => {
    return (
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Scrollable Tabs Track */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {noteItems.map((note) => {
            const isActive = note.id === activeNoteId;
            const isEditing = editingTitleId === note.id;

            return (
              <div
                key={note.id}
                onClick={() => {
                  if (!isEditing && note.id !== activeNoteId) {
                    soundManager.playClick();
                    setActiveNoteId(note.id);
                  }
                }}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-[#1E1F2B] text-slate-900 dark:text-white border-slate-300/80 dark:border-purple-500/40 shadow-sm ring-1 ring-black/5 dark:ring-purple-500/20'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#596B35] dark:text-[#7AA2F7]' : 'text-slate-400'}`} />

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
                      className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 text-slate-900 dark:text-white border border-[#596B35] dark:border-[#7AA2F7] text-xs font-bold outline-none max-w-[130px]"
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
                      className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
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
                      className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
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
                        className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors"
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

        {/* Right Pinned Add Note Button with Dropdown Templates */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowAddTemplatesMenu(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black hover:bg-[#4a5a2c] dark:hover:bg-[#6090F5] text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Create a new Note Page for this topic"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Add Note</span>
          </button>

          {/* Quick Note Templates Dropdown */}
          {showAddTemplatesMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white dark:bg-[#181822] border border-[#D8D8CF] dark:border-[#272730] shadow-2xl p-1.5 z-[100] animate-fade-in text-xs font-bold"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-2.5 py-1.5 text-[11px] uppercase font-mono text-slate-400 border-b border-[#D8D8CF]/60 dark:border-[#272730]">
                Choose Note Template:
              </div>
              <button
                type="button"
                onClick={() => handleAddNewNote()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
                <div>
                  <div className="font-bold">📄 Blank Notes Page</div>
                  <div className="text-[11px] text-slate-400 font-normal">Start with clean canvas</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddNewNote(
                    'Formula Sheet',
                    `# Key Formulas & Speed Shortcuts\n> [!FORMULA]\n> Standard Equation: Speed = Distance / Time\n> Average Speed = 2xy / (x + y)\n\n> [!TIP]\n> Ratio Trick: Speed ratio a:b equals Time ratio b:a.\n\n### Revision Checklist\n- [ ] Memorize 5 key unit conversions\n- [ ] Practice 5 previous year exam questions`
                  )
                }
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
                onClick={() =>
                  handleAddNewNote(
                    'Comparison Table',
                    `# Concept Comparison Table\n| Case / Parameter | Formula | Shortcut Rule |\n| :--- | :--- | :--- |\n| Case 1: Constant Distance | $t_1 / t_2 = s_2 / s_1$ | Time inversely proportional to speed |\n| Case 2: Constant Time | $d_1 / d_2 = s_1 / s_2$ | Distance directly proportional to speed |\n| Case 3: Relative Speed | $S_{rel} = s_1 + s_2$ | Opposite directions: add speeds |`
                  )
                }
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
                onClick={() =>
                  handleAddNewNote(
                    'Rules & Traps Guide',
                    `# Golden Rules & Exam Traps\n> [!RULE]\n> Golden Rule: Fundamental concept definition and rules.\n\n> [!WARNING]\n> High-Frequency Trap: Watch out for negative markings in tricky exceptions!\n\n### High-Yield Questions\n- [ ] Check subject-verb agreement\n- [ ] Verify standard conversions`
                  )
                }
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
                onClick={() =>
                  handleAddNewNote(
                    'PYQ & Solved Tricks',
                    `# Solved Previous Year Exam Questions (PYQ)\n> [!EXAMPLE]\n> Question: A train crosses a 300m bridge in 20 seconds. Speed = ?\n> Solution: Total distance = train + bridge.\n\n### Self Practice Checklist\n- [ ] Solve 2023 Tier 1 Questions\n- [ ] Solve 2024 Tier 2 Questions`
                  )
                }
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[#F7F6F0] dark:hover:bg-[#232330] text-slate-800 dark:text-white cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-bold">🎯 PYQ & Solved Tricks</div>
                  <div className="text-[11px] text-slate-400 font-normal">Previous year questions</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
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
          ? 'bg-white/95 dark:bg-[#1C1D26]/95 border border-[#D8D8CF] dark:border-[#383A48] shadow-2xl backdrop-blur-md text-xs font-bold'
          : 'bg-[#F4F2EB] dark:bg-[#0D0E15] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold'
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
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[#D8D8CF] dark:border-[#383A48]">
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
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#D8D8CF] dark:border-[#383A48]">
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
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#D8D8CF] dark:border-[#383A48]">
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
        className="fixed inset-0 z-[150] bg-[#FAF8F5] dark:bg-[#0B0B0E] text-[#11120F] dark:text-[#F5F5F7] flex flex-col animate-fade-in"
        onMouseUp={handleMouseUpSelection}
        onTouchEnd={handleMouseUpSelection}
      >
        {/* Fullscreen Zen Floating Controls (Visible when Top Bar is Hidden in Zen Mode) */}
        {isZenMode && (
          <>
            {/* Left: Floating Highlighter Controls in Pure Notes Only View (Visible on Desktop / Web only) */}
            <div className="hidden sm:block fixed top-4 left-5 z-[170]">
              {renderHighlighterControlsWidget(true)}
            </div>

            {/* Right: Show All Controls & Exit Fullscreen (Visible on Desktop / Web only) */}
            <div className="hidden sm:flex fixed top-4 right-5 z-[170] items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsZenMode(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-[#1C1D26]/90 hover:bg-white dark:hover:bg-[#282A38] text-slate-900 dark:text-white border border-[#D8D8CF] dark:border-[#383A48] shadow-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-md"
                title="Show All Header Sections & Toolbar Buttons (Press Z or ESC)"
              >
                <Eye className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
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
                className="p-2.5 rounded-full bg-white/90 dark:bg-[#1C1D26]/90 text-slate-800 dark:text-white border border-[#D8D8CF] dark:border-[#383A48] shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
                title="Show Controls"
              >
                <Eye className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
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
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#D8D8CF] dark:border-[#272730] bg-white/85 dark:bg-[#12131C]/90 backdrop-blur-md flex flex-col gap-2 shrink-0 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between gap-3">
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
                  <h2 className={`text-sm sm:text-base font-black truncate ${getFontFamilyClass()}`}>
                    {topicName} • <span className="text-[#596B35] dark:text-[#7AA2F7]">{activeNote.title}</span>
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
                <div className="flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleSelectFont('serif')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-serif ${
                      readerFontFamily === 'serif'
                        ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
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
                        ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
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
                        ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                        : 'text-[#65675F] dark:text-[#85877E] hover:text-[#11120F]'
                    }`}
                    title="Fast Reading Geometric Typography (Lexend)"
                  >
                    ⚡ Fast Read
                  </button>
                </div>

                {/* 🎨 Theme Switcher (Paper, Sepia, OLED - Visible on Mobile & Desktop) */}
                <div className="flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('paper')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      readerTheme === 'paper' ? 'bg-white text-black shadow-xs border border-black/10' : 'text-[#85877E] hover:text-black dark:hover:text-white'
                    }`}
                    title="Paper White"
                  >
                    📄 Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('sepia')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      readerTheme === 'sepia' ? 'bg-[#FBF0D9] text-[#4A3B22] shadow-xs border border-[#D9C4A1]' : 'text-[#85877E] hover:text-[#4A3B22]'
                    }`}
                    title="Kindle Book Warm Sepia"
                  >
                    📜 Sepia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('oled')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      readerTheme === 'oled' ? 'bg-black text-white shadow-xs border border-white/20' : 'text-[#85877E] hover:text-white'
                    }`}
                    title="Pitch Dark OLED"
                  >
                    🖤 OLED
                  </button>
                </div>

                {/* Font Size Adjuster (Visible on Mobile & Desktop) */}
                <div className="flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-bold">
                  <span className="text-[11px] text-[#85877E]">Size:</span>
                  {(['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setReaderFontSize(size)}
                      className={`px-1.5 py-0.5 rounded uppercase cursor-pointer ${
                        readerFontSize === size ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black' : 'text-[#85877E] hover:text-[#11120F]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Container Width Adjuster */}
                <div className="hidden md:flex items-center gap-1 bg-[#F7F6F0] dark:bg-[#1C1D26] px-2 py-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-bold">
                  <span className="text-[11px] text-[#85877E]">Width:</span>
                  {(['normal', 'wide', 'full'] as ReaderWidth[]).map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setReaderWidth(w)}
                      className={`px-1.5 py-0.5 rounded capitalize ${
                        readerWidth === w ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black' : 'text-[#85877E] hover:text-[#11120F]'
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

            {/* Note Pages Tab Strip in Fullscreen Mode */}
            <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1">{renderNoteTabs(true)}</div>
              <div>{renderHighlighterControlsWidget(false)}</div>
            </div>
          </div>
        )}

        {/* Fullscreen Content Area */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar ${isZenMode ? 'pt-4 sm:pt-16 pb-24 sm:pb-8' : ''}`}>
          <div className={`mx-auto ${getReaderWidthClass()}`}>
            {viewMode === 'study' && (
              <div className="relative" ref={fsNotesContainerRef}>
                <div className={`p-6 sm:p-12 rounded-3xl ${getThemeContainerClass()} min-h-[70vh] select-text cursor-text relative z-10`}>
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
                  className="w-full p-6 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] font-mono text-sm text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-xl"
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
                  className="w-full p-5 rounded-3xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-xl"
                />
                <div className={`p-6 rounded-3xl ${getThemeContainerClass()} overflow-y-auto max-h-[80vh] custom-scrollbar select-text`}>
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
    <div className="space-y-3" onPaste={handlePaste} onMouseUp={handleMouseUpSelection} onTouchEnd={handleMouseUpSelection}>
      
      {/* 🌟 UNIFIED MASTER HEADER CARD (Clean Tabs & Organized Toolbar) */}
      <div className="rounded-2xl bg-white dark:bg-[#151620] border border-[#D8D8CF] dark:border-[#272730] shadow-sm overflow-hidden divide-y divide-[#D8D8CF]/60 dark:divide-[#272730]">
        
        {/* Tier 1: Modern Multi-Note Tabs Track */}
        <div className="p-2 px-3 bg-[#FAF8F5]/80 dark:bg-[#12131C]/60 flex items-center justify-between gap-3">
          {renderNoteTabs(false)}
        </div>

        {/* Tier 2: Sleek, Categorized Master Toolbar */}
        <div className="p-2 px-3 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left Cluster: View Modes & Full Screen */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-[#F4F2EB] dark:bg-[#0D0E15] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730]">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setViewMode('study');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'study'
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
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
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
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
                    ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black shadow-xs'
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
            {/* Format AI Notes */}
            <button
              type="button"
              onClick={handleFormatAiNotes}
              disabled={!content.trim()}
              title="Auto-format copied text from Gemini/ChatGPT"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Format AI</span>
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

            {/* Theme Switcher in Normal Toolbar */}
            {viewMode === 'study' && (
              <div className="flex items-center gap-0.5 bg-[#F4F2EB] dark:bg-[#0D0E15] p-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleSelectTheme('paper')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    readerTheme === 'paper' ? 'bg-white text-black shadow-xs' : 'text-[#85877E] hover:text-black dark:hover:text-white'
                  }`}
                  title="Paper White"
                >
                  📄 Paper
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('sepia')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    readerTheme === 'sepia' ? 'bg-[#FBF0D9] text-[#4A3B22] shadow-xs' : 'text-[#85877E] hover:text-[#4A3B22]'
                  }`}
                  title="Sepia"
                >
                  📜 Sepia
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('oled')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    readerTheme === 'oled' ? 'bg-black text-white shadow-xs' : 'text-[#85877E] hover:text-white'
                  }`}
                  title="OLED Dark"
                >
                  🖤 OLED
                </button>
              </div>
            )}

            {/* Font Family Switcher */}
            <div className="flex items-center gap-1 bg-[#F4F2EB] dark:bg-[#0D0E15] px-2 py-1 rounded-xl border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectFont('serif')}
                className={`px-1.5 py-0.5 rounded font-serif cursor-pointer ${
                  readerFontFamily === 'serif'
                    ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
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
                    ? 'bg-[#596B35] text-white dark:bg-[#7AA2F7] dark:text-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Modern Sans"
              >
                Sans
              </button>
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
                  : 'bg-[#F4F2EB] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#D8D8CF] dark:border-[#272730]'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening' : 'Voice'}</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              title="Download PDF"
              className="p-1.5 px-2 rounded-xl bg-[#F4F2EB] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy notes"
              className="p-1.5 px-2 rounded-xl bg-[#F4F2EB] dark:bg-[#0D0E15] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E1F2B] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Auto-Save Status */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#F4F2EB] dark:bg-[#0D0E15] border border-[#D8D8CF] dark:border-[#272730] text-[11px] font-mono font-bold">
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D8D8CF]/60 dark:border-[#272730]">
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

            <div className="flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-400 font-semibold font-mono">
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
        /* Full Editor Mode */
        <div className="space-y-2" onPaste={handlePaste}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => updateContentAndSave(e.target.value)}
            onPaste={handlePaste}
            placeholder={`Paste your notes from Gemini or ChatGPT here, or write your own!\n\n💡 Pro-Tip: After pasting from Gemini/ChatGPT, click "✨ Format AI Notes" in the toolbar above to instantly generate structured callouts, formulas, traps & tables!\n\n> [!FORMULA]\n> Your formulas here\n\n> [!TIP]\n> Your shortcuts here\n\n> [!WARNING]\n> Exam traps here\n\n- [ ] Checklist items`}
            rows={14}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs sm:text-[13px] text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] dark:focus:ring-[#7AA2F7] shadow-inner select-text"
          />
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
              onChange={e => updateContentAndSave(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type or paste markdown..."
              rows={16}
              className="flex-1 w-full p-3.5 rounded-2xl bg-white dark:bg-[#12131A] border border-[#D8D8CF] dark:border-[#272730] font-mono text-xs text-[#11120F] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#596B35] shadow-inner resize-none select-text"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="text-[11px] font-bold text-[#85877E] uppercase font-mono px-1">
              <span>Live Visual Notes Preview ({activeNote.title})</span>
            </div>
            <div className={`flex-1 p-4 sm:p-5 rounded-2xl ${getThemeContainerClass()} overflow-y-auto max-h-[480px] custom-scrollbar select-text`}>
              {renderFormattedNotes()}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'study' && (
        /* Study Mode (Clean, magazine-quality visual notes with Freefall & Box Overlay) */
        <div className="space-y-4">
          <div className="relative" ref={notesContainerRef}>
            <div className={`p-4 sm:p-7 rounded-3xl ${getThemeContainerClass()} min-h-[220px] select-text cursor-text relative z-10`}>
              {renderFormattedNotes()}
            </div>

            {/* Freefall Canvas Overlay */}
            <canvas
              ref={canvasRef}
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

          {/* Attached Screenshots Gallery */}
          {images && images.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#18181D]/90 border border-[#D8D8CF] dark:border-[#272730] shadow-sm space-y-3">
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
