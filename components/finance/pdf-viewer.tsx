'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';

// Set up the PDF.js worker to load from a CDN.
// This is crucial for the PDF rendering to work in the browser.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PdfViewer({ url, fileName, onClose }: PdfViewerProps) {
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    toast({
      title: 'Error loading PDF',
      description: 'There was an issue loading the PDF file. Please try downloading it instead.',
      variant: 'destructive',
    });
    console.error('Error while loading document!', error);
    setIsLoading(false);
    onClose();
  }, [toast, onClose]);

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1));

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full my-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="truncate text-base font-medium" title={fileName}>{fileName}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-muted/40 p-4 rounded-lg overflow-auto max-h-[70vh] flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<Skeleton className="w-[600px] h-[800px]" />}
          error={<div className="text-center p-8 text-red-500">Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} />
        </Document>
      </CardContent>
      {numPages && !isLoading && (
        <CardFooter className="flex items-center justify-center flex-wrap gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{(scale * 100).toFixed(0)}%</span>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 3.0} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-24 text-center" aria-live="polite">
              Page {pageNumber} of {numPages}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
