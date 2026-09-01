import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Check
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import {
  PdfHighlight,
  HighlightColor,
  HIGHLIGHT_COLORS
} from '../../utils/pdfHighlightStorage';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export type PdfFitMode = 'fit-width' | 'fit-page' | 'custom';
export type HighlightToolType = 'area' | 'freehand' | 'eraser';

interface PdfCanvasViewerProps {
  pdfUrl: string | null;
  docId?: string;
  onLoadSuccess?: (totalPages: number) => void;
  className?: string;
  showInlineControls?: boolean;
  onPageChange?: (page: number, total: number) => void;
  scale?: number;
  onScaleChange?: (newScale: number) => void;
  fitMode?: PdfFitMode;
  onFitModeChange?: (mode: PdfFitMode) => void;
  // Highlighter props
  isHighlightMode?: boolean;
  highlightColor?: HighlightColor;
  highlightTool?: HighlightToolType;
  highlights?: PdfHighlight[];
  onAddHighlight?: (highlight: PdfHighlight) => void;
  onDeleteHighlight?: (highlightId: string) => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfUrl,
  docId,
  onLoadSuccess,
  className = '',
  showInlineControls = false,
  onPageChange,
  scale: propScale,
  onScaleChange,
  fitMode = 'fit-width',
  onFitModeChange,
  isHighlightMode = false,
  highlightColor = 'yellow',
  highlightTool = 'area',
  highlights = [],
  onAddHighlight,
  onDeleteHighlight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [internalScale, setInternalScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => typeof window !== 'undefined' ? window.innerWidth : 800);
  const [containerHeight, setContainerHeight] = useState<number>(() => typeof window !== 'undefined' ? window.innerHeight : 600);
  const [defaultAspect, setDefaultAspect] = useState<number>(1.414); // Standard A4 ratio fallback

  const scale = propScale !== undefined ? propScale : internalScale;
  const setScale = (newScale: number | ((prev: number) => number)) => {
    if (onScaleChange && typeof newScale === 'number') {
      onScaleChange(newScale);
    } else if (onScaleChange && typeof newScale === 'function') {
      onScaleChange(newScale(scale));
    } else if (typeof newScale === 'function') {
      setInternalScale(newScale);
    } else {
      setInternalScale(newScale);
    }
  };

  // ResizeObserver to dynamically track container width and height
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || window.innerWidth);
        setContainerHeight(containerRef.current.clientHeight || window.innerHeight);
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // 1. Load PDF Document FAST
  useEffect(() => {
    let isCancelled = false;

    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/cmaps/`,
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);

        // Instantly get page 1 aspect ratio to set placeholder heights accurately
        try {
          const page1 = await doc.getPage(1);
          const vp = page1.getViewport({ scale: 1 });
          if (vp.width > 0 && vp.height > 0) {
            setDefaultAspect(vp.height / vp.width);
          }
        } catch {}

        setIsLoading(false);
        onLoadSuccess?.(doc.numPages);
        onPageChange?.(1, doc.numPages);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setError(err?.message || 'Failed to parse and load PDF document.');
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // Scroll listener to track current page
  const handleScroll = () => {
    if (!containerRef.current || numPages === 0) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const pageEls = container.querySelectorAll<HTMLDivElement>('[data-page-number]');

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i];
      const offsetTop = el.offsetTop - container.offsetTop;
      if (scrollTop >= offsetTop - 150 && scrollTop < offsetTop + el.clientHeight) {
        const pNum = Number(el.getAttribute('data-page-number'));
        if (pNum && pNum !== currentPage) {
          setCurrentPage(pNum);
          onPageChange?.(pNum, numPages);
        }
        break;
      }
    }
  };

  const scrollToPage = (pageNum: number) => {
    soundManager.playClick();
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLDivElement>(`[data-page-number="${pageNum}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#16161E] select-none ${className}`}>
      
      {/* Optional Inline Floating Toolbar */}
      {showInlineControls && (
        <div className="px-3 py-1.5 bg-[#1F2335]/95 backdrop-blur-md border-b border-[#292E42] flex items-center justify-between gap-2 shrink-0 z-20">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => scrollToPage(currentPage - 1)}
              className="p-1 rounded-lg bg-[#24283B] hover:bg-[#2F354D] disabled:opacity-40 text-white cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 rounded-lg bg-[#16161E] border border-[#292E42] font-mono text-[11px] font-bold text-[#C0CAF5] min-w-[70px] text-center">
              {numPages > 0 ? `${currentPage} / ${numPages}` : '...'}
            </span>

            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => scrollToPage(currentPage + 1)}
              className="p-1 rounded-lg bg-[#24283B] hover:bg-[#2F354D] disabled:opacity-40 text-white cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Fit to Page / Fit to Width Buttons */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                if (onFitModeChange) {
                  onFitModeChange(fitMode === 'fit-page' ? 'fit-width' : 'fit-page');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                fitMode === 'fit-page'
                  ? 'bg-[#7AA2F7] text-[#1A1B26] shadow-sm'
                  : 'bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white'
              }`}
              title={fitMode === 'fit-page' ? 'Switch to Fit Width' : 'Fit Entire Page to Screen'}
            >
              {fitMode === 'fit-page' ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
              <span>{fitMode === 'fit-page' ? 'Fit Page' : 'Fit Width'}</span>
            </button>

            <button
              type="button"
              onClick={() => setScale((s: number) => Math.max(s - 0.2, 0.5))}
              className="p-1.5 rounded-lg bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setScale(1.0)}
              className="px-2 py-0.5 rounded-lg bg-[#24283B] text-[11px] font-mono font-bold text-[#7AA2F7] cursor-pointer"
              title="100% Zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={() => setScale((s: number) => Math.min(s + 0.2, 3.0))}
              className="p-1.5 rounded-lg bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded-lg bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pages Container - Fast Virtualized Smooth Vertical Flow */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto overflow-x-auto p-0 m-0 w-full flex flex-col items-center bg-[#16161E] relative ${
          fitMode === 'fit-page' ? 'py-4 gap-4' : 'gap-0'
        }`}
      >
        {isLoading && (
          <div className="m-auto flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Loader2 className="w-10 h-10 text-[#7AA2F7] animate-spin" />
            <span className="text-sm text-[#C0CAF5] font-bold">Fast Loading PDF Document...</span>
            <span className="text-xs text-[#787C99]">Rendering high-definition view</span>
          </div>
        )}

        {error && (
          <div className="m-auto text-center p-6 max-w-sm space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Could not display PDF</h4>
            <p className="text-xs text-[#A9B1D6] leading-relaxed">{error}</p>
          </div>
        )}

        {!isLoading && !error && numPages > 0 && (
          <div className={`w-full mx-auto flex flex-col items-center ${
            fitMode === 'fit-page' ? 'max-w-5xl' : 'max-w-none w-full'
          }`}>
            {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum, idx) => (
              <React.Fragment key={`${pageNum}_${rotation}`}>
                <PdfPageItem
                  pageNum={pageNum}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  fitMode={fitMode}
                  rotation={rotation}
                  containerWidth={containerWidth}
                  containerHeight={containerHeight}
                  defaultAspect={defaultAspect}
                  isHighlightMode={isHighlightMode}
                  highlightColor={highlightColor}
                  highlightTool={highlightTool}
                  pageHighlights={highlights.filter(h => h.pageNum === pageNum)}
                  onAddHighlight={onAddHighlight}
                  onDeleteHighlight={onDeleteHighlight}
                />
                {fitMode === 'fit-width' && idx < numPages - 1 && (
                  <div className="w-full h-1 bg-[#1A1B26] border-y border-[#292E42]/50 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PdfPageItemProps {
  pageNum: number;
  pdfDoc: any;
  scale: number;
  fitMode: PdfFitMode;
  rotation: number;
  containerWidth: number;
  containerHeight: number;
  defaultAspect: number;
  isHighlightMode?: boolean;
  highlightColor?: HighlightColor;
  highlightTool?: HighlightToolType;
  pageHighlights: PdfHighlight[];
  onAddHighlight?: (highlight: PdfHighlight) => void;
  onDeleteHighlight?: (highlightId: string) => void;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pageNum,
  pdfDoc,
  scale,
  fitMode,
  rotation,
  containerWidth,
  containerHeight,
  defaultAspect,
  isHighlightMode = false,
  highlightColor = 'yellow',
  highlightTool = 'area',
  pageHighlights = [],
  onAddHighlight,
  onDeleteHighlight
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const renderTaskRef = useRef<any>(null);
  // Page 1 is ALWAYS immediately visible so opening is instant!
  const [isVisible, setIsVisible] = useState<boolean>(pageNum === 1);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [pageAspect, setPageAspect] = useState<number>(defaultAspect);
  const [renderedWidth, setRenderedWidth] = useState<number>(0);
  const [renderedHeight, setRenderedHeight] = useState<number>(0);

  // Active Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<Array<{ x: number; y: number }>>([]);

  // Lazy load using IntersectionObserver for pages > 1
  useEffect(() => {
    if (pageNum === 1) {
      setIsVisible(true);
      return;
    }

    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        rootMargin: '1000px 0px', // Pre-renders 2 pages ahead smoothly
        threshold: 0.01
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [pageNum]);

  // Render Page onto Canvas when visible
  useEffect(() => {
    if (!isVisible || !pdfDoc) return;

    let isCancelled = false;

    const executeRender = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const aspect = unscaledViewport.height / unscaledViewport.width;
        setPageAspect(aspect);

        // Compute exact fit scale
        let finalScale = 1.0;
        if (fitMode === 'fit-page') {
          // Fit entire page height on screen (minus header margin)
          const targetH = Math.max(containerHeight - 32, 300);
          const targetW = Math.max(containerWidth - 32, 300);
          const scaleY = targetH / unscaledViewport.height;
          const scaleX = targetW / unscaledViewport.width;
          const baseFit = Math.min(scaleX, scaleY);
          finalScale = baseFit * scale;
        } else {
          // Fit width 100%
          const baseFit = containerWidth / unscaledViewport.width;
          finalScale = baseFit * scale;
        }

        const viewport = page.getViewport({ scale: finalScale, rotation });

        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const displayW = Math.floor(viewport.width);
        const displayH = Math.floor(viewport.height);

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
        setRenderedWidth(displayW);
        setRenderedHeight(displayH);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx || isCancelled) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    executeRender();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [isVisible, pdfDoc, pageNum, scale, fitMode, rotation, containerWidth, containerHeight]);

  // Coordinate helper relative to page
  const getRelativeCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return { x, y };
  };

  // Mouse / Touch Event Handlers for Highlighting
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!isHighlightMode) return;
    const pt = getRelativeCoords(clientX, clientY);

    if (highlightTool === 'eraser') return;

    setIsDrawing(true);
    if (highlightTool === 'area') {
      setStartPoint(pt);
      setCurrentPoint(pt);
    } else if (highlightTool === 'freehand') {
      setFreehandPoints([pt]);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDrawing || !isHighlightMode) return;
    const pt = getRelativeCoords(clientX, clientY);

    if (highlightTool === 'area') {
      setCurrentPoint(pt);
    } else if (highlightTool === 'freehand') {
      setFreehandPoints(prev => [...prev, pt]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (highlightTool === 'area' && startPoint && currentPoint) {
      const minX = Math.min(startPoint.x, currentPoint.x);
      const minY = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      // Only save if meaningful size (not accidental micro click)
      if (width > 0.015 && height > 0.008) {
        const newHighlight: PdfHighlight = {
          id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          pageNum,
          color: highlightColor,
          type: 'rect',
          rect: { x: minX, y: minY, width, height },
          createdAt: new Date().toISOString()
        };
        onAddHighlight?.(newHighlight);
        soundManager.playClick();
      }
    } else if (highlightTool === 'freehand' && freehandPoints.length > 2) {
      const newHighlight: PdfHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageNum,
        color: highlightColor,
        type: 'freehand',
        points: freehandPoints,
        createdAt: new Date().toISOString()
      };
      onAddHighlight?.(newHighlight);
      soundManager.playClick();
    }

    setStartPoint(null);
    setCurrentPoint(null);
    setFreehandPoints([]);
  };

  // Estimate placeholder height
  const placeholderHeight = fitMode === 'fit-page'
    ? Math.min(containerHeight - 40, (containerWidth - 32) * pageAspect) * scale
    : containerWidth * pageAspect * scale;

  const activeColorMeta = HIGHLIGHT_COLORS[highlightColor] || HIGHLIGHT_COLORS.yellow;

  return (
    <div
      ref={wrapperRef}
      data-page-number={pageNum}
      className={`relative flex justify-center items-center shadow-lg bg-white overflow-hidden transition-all ${
        fitMode === 'fit-page' ? 'rounded-lg border border-[#292E42]/60' : 'w-full'
      }`}
      style={{
        minHeight: `${Math.max(200, Math.floor(placeholderHeight))}px`,
        width: fitMode === 'fit-page' ? 'auto' : '100%'
      }}
    >
      {isRendering && (
        <div className="absolute inset-0 bg-[#1A1B26]/30 backdrop-blur-xs flex items-center justify-center text-white z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1A1B26]/90 border border-[#292E42] text-[#7AA2F7] shadow-xl">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7AA2F7]" />
            <span>Page {pageNum}</span>
          </div>
        </div>
      )}

      {/* Page Canvas Container with Synchronized Highlight Layer */}
      <div
        className="relative mx-auto max-w-full"
        style={{
          width: renderedWidth > 0 ? `${renderedWidth}px` : 'auto',
          height: renderedHeight > 0 ? `${renderedHeight}px` : 'auto'
        }}
      >
        <canvas ref={canvasRef} className="block max-w-full" />

        {/* Interactive SVG Highlight & Annotation Layer */}
        {renderedWidth > 0 && renderedHeight > 0 && (
          <svg
            ref={svgRef}
            className={`absolute inset-0 w-full h-full ${
              isHighlightMode
                ? highlightTool === 'eraser'
                  ? 'cursor-pointer pointer-events-auto'
                  : 'cursor-crosshair pointer-events-auto'
                : 'pointer-events-auto'
            }`}
            onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={e => {
              if (e.touches.length === 1 && isHighlightMode) {
                handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={e => {
              if (e.touches.length === 1 && isDrawing && isHighlightMode) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePointerUp}
          >
            {/* 1. Saved Highlights on this Page */}
            {pageHighlights.map(h => {
              const colorInfo = HIGHLIGHT_COLORS[h.color] || HIGHLIGHT_COLORS.yellow;
              return (
                <g
                  key={h.id}
                  onClick={(e) => {
                    if (highlightTool === 'eraser' || isHighlightMode) {
                      e.stopPropagation();
                      onDeleteHighlight?.(h.id);
                      soundManager.playClick();
                    }
                  }}
                  className={`group transition-opacity ${
                    isHighlightMode ? 'cursor-pointer hover:opacity-70' : 'pointer-events-none'
                  }`}
                >
                  {h.type === 'rect' && h.rect && (
                    <rect
                      x={`${h.rect.x * 100}%`}
                      y={`${h.rect.y * 100}%`}
                      width={`${h.rect.width * 100}%`}
                      height={`${h.rect.height * 100}%`}
                      fill={colorInfo.hex}
                      fillOpacity={0.38}
                      stroke={colorInfo.border}
                      strokeWidth={1}
                      rx={3}
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}
                  {h.type === 'freehand' && h.points && (
                    <polyline
                      points={h.points.map(p => `${p.x * renderedWidth},${p.y * renderedHeight}`).join(' ')}
                      fill="none"
                      stroke={colorInfo.hex}
                      strokeWidth={Math.max(14, 18 * scale)}
                      strokeOpacity={0.42}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}
                </g>
              );
            })}

            {/* 2. Active Highlight Drawing Preview */}
            {isDrawing && highlightTool === 'area' && startPoint && currentPoint && (
              <rect
                x={`${Math.min(startPoint.x, currentPoint.x) * 100}%`}
                y={`${Math.min(startPoint.y, currentPoint.y) * 100}%`}
                width={`${Math.abs(currentPoint.x - startPoint.x) * 100}%`}
                height={`${Math.abs(currentPoint.y - startPoint.y) * 100}%`}
                fill={activeColorMeta.hex}
                fillOpacity={0.45}
                stroke={activeColorMeta.border}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                rx={3}
                style={{ mixBlendMode: 'multiply' }}
              />
            )}

            {isDrawing && highlightTool === 'freehand' && freehandPoints.length > 1 && (
              <polyline
                points={freehandPoints.map(p => `${p.x * renderedWidth},${p.y * renderedHeight}`).join(' ')}
                fill="none"
                stroke={activeColorMeta.hex}
                strokeWidth={Math.max(14, 18 * scale)}
                strokeOpacity={0.48}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ mixBlendMode: 'multiply' }}
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
};

