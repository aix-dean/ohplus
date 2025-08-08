'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight, Download } from 'lucide-react';

type PdfViewerProps = {
  src: string;
  height?: number; // container height
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  pagePadding?: number; // px between pages
  filename?: string;
};

type PdfDocRef = {
  pdf?: any;
  pages?: number;
  originalViewportScale1Width?: number;
};

export default function PdfViewer({
  src,
  height = 640,
  initialScale = 1,
  minScale = 0.5,
  maxScale = 3,
  pagePadding = 12,
  filename = 'document.pdf',
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(initialScale);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const docRef = useRef<PdfDocRef>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load pdf.js on demand
  const loadPdfJS = useCallback(async () => {
    // We load the ESM entrypoints dynamically to work in-browser
    // and set a CDN worker for compatibility.
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    // Ensure a compatible worker is available via CDN
    // Version pin for reliability. You can bump if needed.
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return pdfjsLib;
  }, []);

  const download = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Load document
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await loadPdfJS();
        const task = pdfjsLib.getDocument({ url: src });
        const pdf = await task.promise;
        if (cancelled) return;
        docRef.current.pdf = pdf;
        docRef.current.pages = pdf.numPages;
        setNumPages(pdf.numPages);

        // Precompute width at scale=1 using page 1
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        docRef.current.originalViewportScale1Width = viewport.width;
      } catch (err: any) {
        console.error('PDF load error', err);
        setError('Failed to load PDF. It may be blocked or unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, loadPdfJS]);

  // Render pages whenever scale or numPages changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docRef.current.pdf || numPages === 0) return;
      const pdf = docRef.current.pdf;
      // Lazy import render API in case different module
      const pdfjsLib = await loadPdfJS();

      // Render each page sequentially
      for (let i = 1; i <= numPages; i++) {
        if (cancelled) break;
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = canvasesRef.current.get(i);
          if (!canvas) continue;
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          // Clear before rendering
          context.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;
        } catch (e) {
          console.warn(`Failed to render page ${i}`, e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [numPages, scale, loadPdfJS]);

  // Track current visible page by scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      let closestPage = 1;
      let closestDistance = Infinity;
      const rect = el.getBoundingClientRect();

      canvasesRef.current.forEach((canvas, page) => {
        const cRect = canvas.getBoundingClientRect();
        const distance = Math.abs((cRect.top + cRect.height / 2) - (rect.top + rect.height / 2));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = page;
        }
      });

      setCurrentPage(closestPage);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [numPages]);

  const setCanvasRef = (page: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasesRef.current.set(page, el);
    } else {
      canvasesRef.current.delete(page);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(maxScale, +(s + 0.1).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(minScale, +(s - 0.1).toFixed(2)));
  const fitToWidth = () => {
    if (!docRef.current.originalViewportScale1Width || !containerRef.current) return;
    const containerPadding = 32; // px padding within wrapper
    const available = containerRef.current.clientWidth - containerPadding;
    const baseWidth = docRef.current.originalViewportScale1Width;
    const newScale = Math.max(minScale, Math.min(maxScale, available / baseWidth));
    setScale(+newScale.toFixed(2));
  };

  const goTo = (page: number) => {
    if (!containerRef.current) return;
    const canvas = canvasesRef.current.get(page);
    if (!canvas) return;
    setCurrentPage(page);
    canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleFullscreen = async () => {
    const wrapper = containerRef.current?.parentElement;
    if (!wrapper) return;
    try {
      if (!document.fullscreenElement) {
        await wrapper.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen error', e);
    }
  };

  // Watch fullscreen exit via ESC
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= minScale} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= maxScale} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fitToWidth} aria-label="Fit to width">
            Fit
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums px-2 select-none">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-16 text-center"
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value || '1', 10);
                if (!isNaN(v)) setCurrentPage(Math.min(Math.max(1, v), Math.max(1, numPages)));
              }}
              onBlur={() => goTo(currentPage)}
            />
            <span className="text-sm text-muted-foreground">/ {numPages || 0}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={download} aria-label="Download PDF">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="mt-3 w-full overflow-auto rounded-md border bg-muted/30"
        style={{ height }}
        aria-label="PDF viewer scroll area"
      >
        {loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground">Loading PDF…</div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && numPages > 0 && (
          <div className="mx-auto flex max-w-full flex-col items-center">
            {Array.from({ length: numPages }).map((_, i) => {
              const page = i + 1;
              return (
                <div key={page} className="my-3" style={{ padding: pagePadding }} data-page={page}>
                  <canvas ref={setCanvasRef(page)} className="shadow-sm bg-white rounded" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
