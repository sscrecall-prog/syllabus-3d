import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

interface PdfCanvasViewerProps {
  pdfUrl: string | null;
  onLoadSuccess?: (totalPages: number) => void;
  className?: string;
  showInlineControls?: boolean;
  onPageChange?: (page: number, total: number) => void;
  scale?: number;
  onScaleChange?: (newScale: number) => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfUrl,
  onLoadSuccess,
  className = '',
  showInlineControls = false,
  onPageChange,
  scale: propScale,
  onScaleChange
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
  const renderTasksRef = useRef<{ [key: number]: any }>({});

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

  // ResizeObserver to dynamically track container width for perfect 100% full-width auto-fit
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', updateWidth);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // 1. Load PDF Document from URL / Blob
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
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setIsLoading(false);
          onLoadSuccess?.(doc.numPages);
          onPageChange?.(1, doc.numPages);
        }
      } catch (err: any) {
        console.error('Error loading PDF document in canvas:', err);
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

  // 2. Render Page to Canvas (Edge-to-Edge 100% Fullscreen Width)
  const renderPage = useCallback(
    async (pageNum: number, canvasEl: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      try {
        if (renderTasksRef.current[pageNum]) {
          try {
            renderTasksRef.current[pageNum].cancel();
          } catch {}
          delete renderTasksRef.current[pageNum];
        }

        const page = await pdfDoc.getPage(pageNum);
        const currentContainerWidth = containerRef.current?.clientWidth || containerWidth || window.innerWidth;
        
        // Exact 100% edge-to-edge auto-fit
        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const fitScale = currentContainerWidth / unscaledViewport.width;
        const finalScale = fitScale * scale;

        const viewport = page.getViewport({ scale: finalScale, rotation });

        // High DPI sharpness for retina/mobile displays
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvasEl.width = Math.floor(viewport.width * dpr);
        canvasEl.height = Math.floor(viewport.height * dpr);
        canvasEl.style.width = '100%';
        canvasEl.style.height = 'auto';

        const ctx = canvasEl.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNum] = renderTask;

        await renderTask.promise;
        delete renderTasksRef.current[pageNum];
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNum}:`, err);
        }
      }
    },
    [pdfDoc, scale, rotation, containerWidth]
  );

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
    <div className={`flex flex-col h-full bg-[#111114] select-none ${className}`}>
      
      {/* Optional Inline Floating Toolbar (Only if showInlineControls is true) */}
      {showInlineControls && (
        <div className="px-3 py-1.5 bg-[#18181D]/90 backdrop-blur-md border-b border-[#272730] flex items-center justify-between gap-2 shrink-0 z-20">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => scrollToPage(currentPage - 1)}
              className="p-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] disabled:opacity-40 text-white cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 rounded-lg bg-[#111114] border border-[#272730] font-mono text-[11px] font-bold text-white min-w-[70px] text-center">
              {numPages > 0 ? `${currentPage} / ${numPages}` : '...'}
            </span>

            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => scrollToPage(currentPage + 1)}
              className="p-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] disabled:opacity-40 text-white cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScale((s: number) => Math.max(s - 0.2, 0.6))}
              className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setScale(1.0)}
              className="px-2 py-0.5 rounded-lg bg-[#23232A] text-[11px] font-mono font-bold text-[#8B5CF6] cursor-pointer"
              title="Fit to Screen"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={() => setScale((s: number) => Math.min(s + 0.2, 2.5))}
              className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pages Container - Fullscreen Edge-to-Edge with Smooth Vertical Flow */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-0 m-0 w-full flex flex-col items-center bg-[#111114] relative"
      >
        {isLoading && (
          <div className="m-auto flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Loader2 className="w-10 h-10 text-[#8B5CF6] animate-spin" />
            <span className="text-sm text-white font-bold">Loading PDF Document...</span>
            <span className="text-xs text-[#85877E]">Full screen high-definition view</span>
          </div>
        )}

        {error && (
          <div className="m-auto text-center p-6 max-w-sm space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Could not display PDF</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{error}</p>
          </div>
        )}

        {!isLoading && !error && numPages > 0 && (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum, idx) => (
              <React.Fragment key={`${pageNum}_${scale}_${rotation}`}>
                <PdfPageItem
                  pageNum={pageNum}
                  renderPage={renderPage}
                />
                {idx < numPages - 1 && (
                  <div className="w-full h-2 bg-[#0B0B0D] border-y border-[#272730]/40 shrink-0" />
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
  renderPage: (pageNum: number, canvas: HTMLCanvasElement) => Promise<void>;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({ pageNum, renderPage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (canvasRef.current) {
      setIsRendering(true);
      renderPage(pageNum, canvasRef.current).then(() => {
        if (isMounted) setIsRendering(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pageNum, renderPage]);

  return (
    <div
      data-page-number={pageNum}
      className="w-full bg-white relative flex justify-center shadow-md overflow-hidden"
    >
      {isRendering && (
        <div className="absolute inset-0 min-h-[350px] bg-[#18181D]/40 backdrop-blur-sm flex items-center justify-center text-white z-10">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/70 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
            <span>Page {pageNum}...</span>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full max-w-full bg-white mx-auto" />
    </div>
  );
};
