export type HighlightColor = 'yellow' | 'green' | 'pink' | 'cyan' | 'purple';

export interface PdfHighlight {
  id: string;
  pageNum: number;
  color: HighlightColor;
  type: 'rect' | 'freehand';
  // Normalized coordinates (0 to 1 relative to page width and height)
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  points?: Array<{ x: number; y: number }>;
  createdAt: string;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; hex: string; rgba: string; border: string }> = {
  yellow: {
    label: 'Fluorescent Yellow',
    hex: '#FACC15',
    rgba: 'rgba(250, 204, 21, 0.38)',
    border: '#EAB308'
  },
  green: {
    label: 'Neon Emerald',
    hex: '#10B981',
    rgba: 'rgba(16, 185, 129, 0.38)',
    border: '#059669'
  },
  pink: {
    label: 'Vibrant Coral Pink',
    hex: '#F43F5E',
    rgba: 'rgba(244, 63, 94, 0.38)',
    border: '#E11D48'
  },
  cyan: {
    label: 'Electric Cyan',
    hex: '#06B6D4',
    rgba: 'rgba(6, 182, 212, 0.38)',
    border: '#0891B2'
  },
  purple: {
    label: 'Laser Violet',
    hex: '#A855F7',
    rgba: 'rgba(168, 85, 247, 0.38)',
    border: '#9333EA'
  }
};

const STORAGE_PREFIX = 'syllabus3d_pdf_highlights_';

export const loadPdfHighlights = (docId: string): PdfHighlight[] => {
  if (!docId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${docId}`);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to load PDF highlights from storage:', e);
    return [];
  }
};

export const savePdfHighlights = (docId: string, highlights: PdfHighlight[]): void => {
  if (!docId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${docId}`, JSON.stringify(highlights));
  } catch (e) {
    console.error('Failed to save PDF highlights to storage:', e);
  }
};

export const clearPdfHighlights = (docId: string): void => {
  if (!docId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${docId}`);
  } catch (e) {
    console.error('Failed to clear PDF highlights:', e);
  }
};
