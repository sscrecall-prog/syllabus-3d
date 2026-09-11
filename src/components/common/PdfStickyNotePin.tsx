import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  Minus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  PdfComment,
  CommentColor,
  CommentCategory,
  COMMENT_COLORS,
  COMMENT_CATEGORIES
} from '../../utils/pdfCommentStorage';
import { soundManager } from '../../utils/soundEffects';

interface PdfStickyNotePinProps {
  comment: PdfComment;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PdfComment>) => void;
  onDelete: () => void;
  onPushToNotes?: () => void;
  renderedWidth: number;
  renderedHeight: number;
}

export const PdfStickyNotePin: React.FC<PdfStickyNotePinProps> = ({
  comment,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onPushToNotes,
  renderedWidth,
  renderedHeight
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pushed, setPushed] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const colorMeta = COMMENT_COLORS[comment.color] || COMMENT_COLORS.yellow;
  const categoryMeta = COMMENT_CATEGORIES[comment.category] || COMMENT_CATEGORIES.note;

  // Auto-resize textarea on content change
  useEffect(() => {
    if (textareaRef.current && comment.isOpen !== false) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(68, Math.min(textareaRef.current.scrollHeight, 260))}px`;
    }
  }, [comment.text, comment.isOpen]);

  // Focus textarea when newly created or opened with empty text
  useEffect(() => {
    if (comment.isOpen !== false && (!comment.text || comment.text.trim() === '')) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [comment.isOpen]);

  // Handle Drag Repositioning across the page
  const handleDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: comment.x,
      initY: comment.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current || renderedWidth <= 0 || renderedHeight <= 0) return;
      const deltaX = (e.clientX - dragStartRef.current.clientX) / renderedWidth;
      const deltaY = (e.clientY - dragStartRef.current.clientY) / renderedHeight;
      const newX = Math.min(Math.max(dragStartRef.current.initX + deltaX, 0.02), 0.98);
      const newY = Math.min(Math.max(dragStartRef.current.initY + deltaY, 0.02), 0.98);
      onUpdate({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, renderedWidth, renderedHeight, onUpdate]);

  // Copy text to clipboard
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!comment.text) return;
    navigator.clipboard.writeText(comment.text);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 1600);
  };

  // Push note to Topic Notes with page citation
  const handlePushToNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPushToNotes?.();
    setPushed(true);
    soundManager.playClick();
    setTimeout(() => setPushed(false), 2000);
  };

  // Determine smart card alignment to stay inside viewer boundary
  const alignLeft = comment.x > 0.58;
  const alignTop = comment.y > 0.65;

  const isOpen = comment.isOpen !== false;

  return (
    <div
      data-pdf-comment={comment.id}
      className="absolute pointer-events-auto select-none"
      style={{
        left: `${comment.x * 100}%`,
        top: `${comment.y * 100}%`,
        zIndex: isDragging ? 50 : isActive ? 40 : 30
      }}
      onClick={e => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* 1. Pin Marker Button */}
      <div className="relative -translate-x-1/2 -translate-y-1/2 group">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSelect();
            onUpdate({ isOpen: !isOpen });
            soundManager.playClick();
          }}
          onPointerDown={handleDragStart}
          title={`${categoryMeta.label}: ${comment.text ? comment.text.slice(0, 40) + '...' : 'Empty Note'} (Drag to move)`}
          aria-label={`Sticky note: ${categoryMeta.label}`}
          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md cursor-grab active:cursor-grabbing border-2 border-white dark:border-[#1F2335] transition-all hover:scale-115 active:scale-95 ${
            colorMeta.bg
          } ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1A1B26] scale-110 shadow-lg' : ''}`}
        >
          <span>{categoryMeta.icon}</span>

          {/* Pulse ring for active/empty notes */}
          {(!comment.text || isActive) && (
            <span
              className={`absolute -inset-1 rounded-full animate-ping opacity-35 pointer-events-none ${colorMeta.bg}`}
            />
          )}
        </button>

        {/* Hover Tooltip when Minimized */}
        {!isOpen && (
          <div
            className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg shadow-xl text-xs bg-slate-900/95 text-white backdrop-blur-xs border border-slate-700/80 ${
              alignLeft ? 'right-full mr-2 top-0' : 'left-full ml-2 top-0'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300">
              <span>{categoryMeta.icon}</span>
              <span>{categoryMeta.label}</span>
              <span className="text-slate-400 font-normal">· Pg {comment.pageNum}</span>
            </div>
            {comment.text ? (
              <p className="max-w-[180px] truncate text-[11px] text-slate-200 mt-0.5 font-sans">
                {comment.text}
              </p>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Click to edit note</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive Sticky Note Card */}
      {isOpen && (
        <div
          ref={cardRef}
          className={`absolute w-72 sm:w-80 rounded-2xl shadow-2xl border transition-all duration-150 bg-white dark:bg-[#161927] border-slate-200/90 dark:border-[#2A2E45] overflow-hidden ${
            alignLeft ? 'right-0 -translate-x-3' : 'left-0 translate-x-3'
          } ${alignTop ? 'bottom-full mb-3' : 'top-full mt-3'}`}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Card Top Accent Stripe */}
          <div
            className="h-1.5 w-full cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: colorMeta.hex }}
            onPointerDown={handleDragStart}
          />

          {/* Card Header */}
          <div className="flex items-center justify-between px-2.5 py-2 bg-slate-50/90 dark:bg-[#1B1E30]/90 border-b border-slate-100 dark:border-[#262B40]">
            {/* Left: Drag Handle & Category Badge */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onPointerDown={handleDragStart}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                title="Drag to reposition note"
                aria-label="Drag note"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>

              {/* Category Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${categoryMeta.badgeClass} ${categoryMeta.badgeBorder} hover:opacity-90`}
                >
                  <span>{categoryMeta.icon}</span>
                  <span className="max-w-[85px] truncate">{categoryMeta.label}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                </button>

                {/* Category Picker Popover */}
                {showCategoryPicker && (
                  <div className="absolute left-0 top-full mt-1 w-44 py-1 rounded-xl bg-white dark:bg-[#1E2235] shadow-xl border border-slate-200 dark:border-[#2C314C] z-50">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Select Tag
                    </div>
                    {(Object.keys(COMMENT_CATEGORIES) as CommentCategory[]).map(catKey => {
                      const cat = COMMENT_CATEGORIES[catKey];
                      const isSelected = comment.category === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            onUpdate({ category: catKey });
                            setShowCategoryPicker(false);
                            soundManager.playClick();
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="flex-1">{cat.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Color Swatches & Minimize/Delete Controls */}
            <div className="flex items-center gap-1.5">
              {/* Color Swatches */}
              <div className="flex items-center gap-1 pr-1 border-r border-slate-200 dark:border-slate-700/60">
                {(Object.keys(COMMENT_COLORS) as CommentColor[]).map(cKey => {
                  const cInfo = COMMENT_COLORS[cKey];
                  const isSelected = comment.color === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => {
                        onUpdate({ color: cKey });
                        soundManager.playClick();
                      }}
                      title={cInfo.label}
                      className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 ${
                        cInfo.bg
                      } ${
                        isSelected
                          ? 'ring-2 ring-slate-800 dark:ring-white ring-offset-1 scale-110'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Minimize */}
              <button
                type="button"
                onClick={() => {
                  onUpdate({ isOpen: false });
                  soundManager.playClick();
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                title="Minimize note"
                aria-label="Minimize note"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  soundManager.playClick();
                }}
                className="p-1 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Delete note"
                aria-label="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Body: Auto-Growing Textarea */}
          <div className="p-2.5">
            <textarea
              ref={textareaRef}
              value={comment.text}
              onChange={e => onUpdate({ text: e.target.value })}
              onKeyDown={e => e.stopPropagation()}
              placeholder="Add key concept, trap warning, memory trick or doubt..."
              rows={2}
              className="w-full resize-none text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden font-sans border-0 p-0"
              style={{ minHeight: '68px', maxHeight: '260px' }}
            />
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#1A1D2D]/70 border-t border-slate-100 dark:border-[#24283C] text-[11px]">
            {/* Page Citation Badge */}
            <span className="font-mono text-slate-400 dark:text-slate-400 text-[10px]">
              Page {comment.pageNum}
            </span>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!comment.text}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 disabled:opacity-35 transition-colors"
                title="Copy note text"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Push to Topic Notes */}
              {onPushToNotes && (
                <button
                  type="button"
                  onClick={handlePushToNotes}
                  disabled={!comment.text}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/50 disabled:opacity-35 transition-colors"
                  title="Append this note with page reference to Topic Notes"
                >
                  {pushed ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                        Saved!
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>To Notes</span>
                    </>
                  )}
                </button>
              )}

              {/* Done Button to Collapse */}
              <button
                type="button"
                onClick={() => {
                  onUpdate({ isOpen: false });
                  soundManager.playClick();
                }}
                className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
