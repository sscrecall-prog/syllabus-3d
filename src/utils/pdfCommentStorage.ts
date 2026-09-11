export type CommentColor = 'yellow' | 'green' | 'pink' | 'cyan' | 'purple' | 'amber';
export type CommentCategory = 'note' | 'trap' | 'trick' | 'doubt' | 'important';

export interface PdfComment {
  id: string;
  docId: string;
  pageNum: number;
  /** Normalized X position on page (0 to 1 relative to page width) */
  x: number;
  /** Normalized Y position on page (0 to 1 relative to page height) */
  y: number;
  text: string;
  color: CommentColor;
  category: CommentCategory;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  isOpen?: boolean;
}

export const COMMENT_COLORS: Record<
  CommentColor,
  { label: string; hex: string; bg: string; border: string; text: string; lightBg: string }
> = {
  yellow: {
    label: 'Sunbeam Yellow',
    hex: '#FACC15',
    bg: 'bg-amber-400',
    border: 'border-amber-400',
    text: 'text-amber-950 dark:text-amber-100',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40'
  },
  green: {
    label: 'Mint Emerald',
    hex: '#10B981',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-100',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40'
  },
  pink: {
    label: 'Vibrant Rose',
    hex: '#F43F5E',
    bg: 'bg-rose-500',
    border: 'border-rose-500',
    text: 'text-rose-950 dark:text-rose-100',
    lightBg: 'bg-rose-50 dark:bg-rose-950/40'
  },
  cyan: {
    label: 'Electric Cyan',
    hex: '#06B6D4',
    bg: 'bg-cyan-500',
    border: 'border-cyan-500',
    text: 'text-cyan-950 dark:text-cyan-100',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/40'
  },
  purple: {
    label: 'Laser Violet',
    hex: '#A855F7',
    bg: 'bg-purple-500',
    border: 'border-purple-500',
    text: 'text-purple-950 dark:text-purple-100',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40'
  },
  amber: {
    label: 'Warm Ochre',
    hex: '#F59E0B',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    text: 'text-amber-950 dark:text-amber-100',
    lightBg: 'bg-amber-100/70 dark:bg-amber-900/40'
  }
};

export const COMMENT_CATEGORIES: Record<
  CommentCategory,
  { label: string; icon: string; badgeClass: string; badgeBorder: string }
> = {
  note: {
    label: 'Study Note',
    icon: '📝',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
    badgeBorder: 'border-blue-500/30'
  },
  trap: {
    label: 'Trap Alert',
    icon: '⚠️',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    badgeBorder: 'border-amber-500/30'
  },
  trick: {
    label: 'Memory Trick',
    icon: '💡',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    badgeBorder: 'border-emerald-500/30'
  },
  doubt: {
    label: 'Doubt / Query',
    icon: '❓',
    badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
    badgeBorder: 'border-violet-500/30'
  },
  important: {
    label: 'High-Yield PYQ',
    icon: '⭐',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
    badgeBorder: 'border-rose-500/30'
  }
};

const STORAGE_PREFIX = 'syllabus3d_pdf_comments_';

/**
 * Load all sticky notes/comments for a given PDF document
 */
export const loadPdfComments = (docId: string): PdfComment[] => {
  if (!docId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${docId}`);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to load PDF comments from storage:', e);
    return [];
  }
};

/**
 * Persist comments for a PDF document
 */
export const savePdfComments = (docId: string, comments: PdfComment[]): void => {
  if (!docId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${docId}`, JSON.stringify(comments));
  } catch (e) {
    console.error('Failed to save PDF comments to storage:', e);
  }
};

/**
 * Remove all comments for a PDF document
 */
export const clearPdfComments = (docId: string): void => {
  if (!docId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${docId}`);
  } catch (e) {
    console.error('Failed to clear PDF comments:', e);
  }
};

/**
 * Factory to create a new PdfComment instance
 */
export const createPdfComment = (params: {
  docId: string;
  pageNum: number;
  x: number;
  y: number;
  text?: string;
  color?: CommentColor;
  category?: CommentCategory;
}): PdfComment => {
  return {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    docId: params.docId,
    pageNum: params.pageNum,
    x: Math.min(Math.max(params.x, 0.02), 0.98),
    y: Math.min(Math.max(params.y, 0.02), 0.98),
    text: params.text || '',
    color: params.color || 'yellow',
    category: params.category || 'note',
    createdAt: new Date().toISOString(),
    isOpen: true
  };
};

/**
 * Helper to update a comment in an array immutably
 */
export const updatePdfCommentInList = (
  comments: PdfComment[],
  commentId: string,
  updates: Partial<PdfComment>
): PdfComment[] => {
  return comments.map(c => {
    if (c.id === commentId) {
      return {
        ...c,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
    return c;
  });
};

/**
 * Helper to delete a comment from an array immutably
 */
export const deletePdfCommentFromList = (
  comments: PdfComment[],
  commentId: string
): PdfComment[] => {
  return comments.filter(c => c.id !== commentId);
};
