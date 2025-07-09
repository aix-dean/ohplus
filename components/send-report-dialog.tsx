"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, MessageCircle, Send, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ReportData } from "@/lib/report-service"

// Helper functions moved to the top
const getReportTypeDisplay = (type: string) => {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface SendReportDialogProps {
  isOpen: boolean
  onClose: () => void
  report: ReportData
  product?: any
  onSelectOption: (option: "email" | "whatsapp" | "viber" | "messenger") => void
}

export function SendReportDialog({ isOpen, onClose, report, product, onSelectOption }: SendReportDialogProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [reportLink, setReportLink] = useState("")
  const { toast } = useToast()

  const generateShareableLink = async () => {
    setIsGeneratingLink(true)
    try {
      // Generate a shareable link for the report
      const baseUrl = window.location.origin
      const link = `${baseUrl}/logistics/reports/${report.id}`
      setReportLink(link)

      toast({
        title: "Link Generated",
        description: "Shareable link has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating link:", error)
      toast({
        title: "Error",
        description: "Failed to generate shareable link.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const copyToClipboard = async () => {
    if (!reportLink) {
      await generateShareableLink()
      return
    }

    try {
      await navigator.clipboard.writeText(reportLink)
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleSendOption = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    onSelectOption(option)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Send Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xs font-bold">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getReportTypeDisplay(report.reportType)} Report - {report.siteName}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(report.date)} • {report.attachments?.length || 0} attachments
              </p>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="report-link" className="text-sm font-medium">
              Share Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="report-link"
                value={reportLink || "Click generate to create shareable link"}
                readOnly
                className="flex-1"
                placeholder="Generating link..."
              />
              <Button
                onClick={copyToClipboard}
                disabled={isGeneratingLink}
                variant="outline"
                size="sm"
                className="px-3 bg-transparent"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Send Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Send via</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSendOption("email")}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">Email</span>
              </Button>

              <Button
                onClick={() => handleSendOption("whatsapp")}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-green-50 hover:bg-green-100 border-green-200"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">WhatsApp</span>
              </Button>

              <Button
                onClick={() => handleSendOption("viber")}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                <Video className="h-5 w-5 text-purple-600" />
                <span className="text-purple-700 font-medium">Viber</span>
              </Button>

              <Button
                onClick={() => handleSendOption("messenger")}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">Messenger</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
