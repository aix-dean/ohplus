"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, FileText, Share2, Download } from "lucide-react"

interface ReportPostSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
}

export function ReportPostSuccessDialog({ open, onOpenChange, reportId }: ReportPostSuccessDialogProps) {
  const handleViewReport = () => {
    window.open(`/logistics/reports/${reportId}`, "_blank")
    onOpenChange(false)
  }

  const handleShareReport = () => {
    // Copy report URL to clipboard
    const reportUrl = `${window.location.origin}/logistics/reports/${reportId}`
    navigator.clipboard.writeText(reportUrl).then(() => {
      // Could show a toast here
      console.log("Report URL copied to clipboard")
    })
    onOpenChange(false)
  }

  const handleDownloadReport = () => {
    // Navigate to report page with download parameter
    window.open(`/logistics/reports/${reportId}?download=true`, "_blank")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">Service Report Posted Successfully!</DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Your service report has been successfully posted and is now available for viewing.
          </p>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Report ID:</span> {reportId.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={handleViewReport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Button>

            <Button onClick={handleShareReport} variant="outline" className="flex-1 bg-transparent">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button onClick={handleDownloadReport} variant="outline" className="flex-1 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full mt-2">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
