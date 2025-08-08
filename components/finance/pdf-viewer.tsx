'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ZoomIn, ZoomOut, Download, ExternalLink, X, Expand, Shrink, RotateCw } from 'lucide-react'

type PdfViewerProps = {
  url: string
  fileName: string
  onClose: () => void
}

// Build the final iframe src via our proxy with a zoom hint
function buildProxySrc(rawUrl: string, zoomPercent: number) {
  const target = encodeURIComponent(rawUrl)
  const params = `#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(zoomPercent)}`
  return `/api/proxy-pdf?url=${target}${params}`
}

export function PdfViewer({ url, fileName, onClose }: PdfViewerProps) {
  const { toast } = useToast()
  const [zoom, setZoom] = useState<number>(125) // percent
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const iframeSrc = useMemo(() => buildProxySrc(url, zoom), [url, zoom])

  const handleDownload = () => {
    try {
      const a = document.createElement('a')
      // Use the proxy so headers force inline/download correctly
      a.href = `/api/proxy-pdf?url=${encodeURIComponent(url)}`
      a.download = fileName
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      toast({
        title: 'Download failed',
        description: 'Unable to download the file. Try opening it in a new tab.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenNewTab = () => {
    window.open(`/api/proxy-pdf?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
  }

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 400))
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 25))
  const resetZoom = () => setZoom(125)

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.error('Fullscreen error', e)
    }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  return (
    <Card className="w-full my-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="truncate text-base font-medium" title={fileName}>
          {fileName}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenNewTab} title="Open in new tab">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} title="Download PDF">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} title="Close viewer">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={containerRef}
          className="relative w-full border rounded-lg overflow-hidden bg-background"
          style={{ height: '70vh' }}
        >
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={fileName}
            className="w-full h-full"
            allow="fullscreen"
            loading="eager"
          />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={zoomOut} aria-label="Zoom out" title="Zoom out" disabled={zoom <= 25}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">{`${zoom}%`}</span>
          <Button variant="outline" size="icon" onClick={zoomIn} aria-label="Zoom in" title="Zoom in" disabled={zoom >= 400}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom} aria-label="Reset zoom" title="Reset zoom">
            <RotateCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}>
            {isFullscreen ? <Shrink className="h-4 w-4 mr-2" /> : <Expand className="h-4 w-4 mr-2" />}
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
