"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Copy, Mail, MessageCircle, Phone, Facebook, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ReportData } from "@/lib/report-service"

interface SendReportDialogProps {
  isOpen: boolean
  onClose: () => void
  report: ReportData
  product: any
  onSelectOption: (option: "email" | "whatsapp" | "viber" | "messenger") => void
}

// Helper functions moved to the top
const getReportTypeDisplay = (type: string) => {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatDateForFilename = (dateString: string) => {
  return new Date(dateString)
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    .replace(/\s/g, "_")
}

export function SendReportDialog({ isOpen, onClose, report, product, onSelectOption }: SendReportDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const reportViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/logistics/reports/${report.id}`
  const reportFileName = `${report.siteId}_${getReportTypeDisplay(report.reportType)}_Report_${formatDateForFilename(report.date)}.pdf`

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reportViewUrl)
    setCopied(true)
    toast({
      title: "Link Copied!",
      description: "The report link has been copied to your clipboard.",
    })
  }

  const handleSocialShare = (platform: string) => {
    toast({
      title: "Not Implemented",
      description: `Sharing via ${platform} is not yet implemented.`,
      variant: "destructive",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Send Report</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <DialogDescription className="sr-only">Choose how you want to share this report.</DialogDescription>

          {/* Report Preview */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-20 flex-shrink-0 bg-blue-100 rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-sm mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Report</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{reportFileName}</div>
              <div className="text-xs text-gray-500 mt-1">{getReportTypeDisplay(report.reportType)} Report</div>
            </div>
          </div>

          {/* Link Section */}
          <div className="flex items-center space-x-2">
            <Input value={reportViewUrl} readOnly className="flex-1 text-sm bg-gray-50 border-gray-200" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex-shrink-0 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Copy className="mr-1 h-3 w-3" />
              {copied ? "Copied!" : "COPY LINK"}
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Sharing Options */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => onSelectOption("email")}
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Email</span>
            </div>

            <div
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => handleSocialShare("WhatsApp")}
            >
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Whatsapp</span>
            </div>

            <div
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => handleSocialShare("Viber")}
            >
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Viber</span>
            </div>

            <div
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => handleSocialShare("Messenger")}
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Facebook className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Messenger</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
