"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

interface PDFViewerProps {
  fileUrl: string
  className?: string
}

export function PDFViewer({ fileUrl, className = "" }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const handleIframeError = () => {
    setError("Failed to load PDF document")
    setLoading(false)
  }

  const downloadPDF = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = `contract-${Date.now()}.pdf`
    link.click()
  }

  const openInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 rounded-lg border-2 border-red-200 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2 text-2xl">⚠️</div>
          <p className="text-red-700 font-medium">Error Loading PDF</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
            <Button
              onClick={openInNewTab}
              variant="default"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in Browser
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* PDF Content */}
      <div className="relative bg-gray-100 flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading PDF...</p>
            </div>
          </div>
        )}

        <iframe
          src={`${fileUrl}#view=FitH&toolbar=0&navpanes=0`}
          className="w-full h-[1100px] border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="PDF Viewer"
        />
      </div>
    </div>
  )
}