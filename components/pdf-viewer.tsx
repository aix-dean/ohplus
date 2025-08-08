'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';

// Use locally hosted ES module worker to avoid CORS/dynamic import issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export type PdfViewerProps = {
  src: string;
  filename?: string;
  initialScale?: number; // 1 = 100%
  minScale?: number;
  maxScale?: number;
  className?: string;
  height?: number; // viewer height in pixels
};

export default function PdfViewer({
  src,
  filename = 'document.pdf',
  initialScale = 1,
  minScale = 0.5,
  maxScale = 3,
  className = '',
  height = 600,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Track container width to size the PDF pages responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(Math.floor(w));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages);
      setError(null);
      // Keep current page within bounds if re-rendering
      setPageNumber((prev) => Math.min(Math.max(prev, 1), pages));
    },
    []
  );

  const onDocumentLoadError = useCallback((e: any) => {
    console.error('PDF load error:', e);
    setError('Unable to load PDF. You can still download the file below.');
  }, []);

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(maxScale, Number((s + 0.1).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(minScale, Number((s - 0.1).toFixed(2))));
  const resetZoom = () => setScale(initialScale);

  return (
    <div className={`w-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} disabled={pageNumber >= numPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            Page {pageNumber} {numPages ? `of ${numPages}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= minScale}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= maxScale}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom} title="Reset zoom">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <a href={src} download={filename} target="_blank" rel="noreferrer">
            <Button size="sm">Download PDF</Button>
          </a>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="relative w-full border rounded-md bg-muted/40 overflow-auto"
        style={{ height }}
      >
        {error ? (
          <div className="h-full w-full flex items-center justify-center text-center p-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <Document
            file={{ url: src, withCredentials: false }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="h-full w-full flex items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">Loading PDF…</p>
              </div>
            }
            error={
              <div className="h-full w-full flex items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                  Failed to load PDF. Try downloading the file instead.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth ? Math.floor(containerWidth * scale) : undefined}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
