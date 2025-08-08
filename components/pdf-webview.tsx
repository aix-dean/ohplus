'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';

type PdfWebViewProps = {
  url: string;
  name?: string;
  height?: number; // px height of viewer
};

export default function PdfWebView({ url, name = 'Document.pdf', height = 640 }: PdfWebViewProps) {
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const percent = Math.round(zoom * 100);

  const srcWithZoom = useMemo(() => {
    // Many browsers honor #zoom=xx in their PDF viewer.
    // Preserve any existing hash by appending &zoom=, else start with #zoom=
    const hasHash = url.includes('#');
    const joiner = hasHash ? '&' : '#';
    return `${url}${joiner}zoom=${percent}`;
  }, [url, percent]);

  const clamp = (val: number) => Math.min(2, Math.max(0.5, val));

  const onZoomIn = () => setZoom((z) => clamp(z + 0.25));
  const onZoomOut = () => setZoom((z) => clamp(z - 0.25));
  const onReset = () => setZoom(1);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant="outline" className="ml-1">PDF</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onZoomOut} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4 mr-2" /> Zoom out
          </Button>
          <span className="text-sm tabular-nums w-14 text-center">{percent}%</span>
          <Button variant="outline" size="sm" onClick={onZoomIn} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4 mr-2" /> Zoom in
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} aria-label="Reset zoom">
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpen} aria-label="Open in new tab">
            <ExternalLink className="h-4 w-4 mr-2" /> Open
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} aria-label="Download PDF">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full border-t">
          {/* The iframe gets re-rendered when zoom changes via key, ensuring the built-in viewer updates */}
          <iframe
            key={`${percent}-${url}`}
            src={srcWithZoom}
            title={name}
            className="w-full"
            style={{ height }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
