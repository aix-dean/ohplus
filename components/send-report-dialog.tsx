"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Copy, Mail, MessageCircle, Phone, Facebook, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ReportData } from "@/lib/report-service"

interface SendReportDialogProps {
  isOpen: boolean
  onClose: () => void
  report: ReportData
  onSelectOption: (option: "email" | "whatsapp" | "viber" | "messenger") => void
}

export function SendReportDialog({ isOpen, onClose, report, onSelectOption }: SendReportDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  // Generate report view URL
  const reportViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/logistics/reports/${report.id}`

  // Generate report filename
  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const reportFileName = `${report.siteId}_${getReportTypeDisplay(report.reportType).replace(/\s+/g, "_")}_${report.siteName.replace(/\s+/g, "_")}.pdf`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reportViewUrl)
    setCopied(true)
    toast({
      title: "Link Copied!",
      description: "The report link has been copied to your clipboard.",
    })
  }

  const handleEmailOption = () => {
    onClose()
    // Navigate to compose email page
    router.push(`/logistics/reports/${report.id}/compose`)
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Send Report</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-8 pb-6">
          {/* Report Preview */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-20 flex-shrink-0 bg-blue-50 rounded border">
              {/* Report thumbnail placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded mb-1 mx-auto flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Report</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{reportFileName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getReportTypeDisplay(report.reportType)} • {new Date(report.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Link Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input value={reportViewUrl} readOnly className="flex-1 text-sm" placeholder="Report link" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
              >
                <Copy className="mr-1 h-3 w-3" />
                {copied ? "Copied!" : "COPY LINK"}
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Sharing Options */}
            <div className="grid grid-cols-4 gap-6 text-center">
              {/* Email */}
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={handleEmailOption}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                >
                  <Mail className="h-6 w-6" />
                </Button>
                <span className="text-xs text-gray-700">Email</span>
              </div>

              {/* WhatsApp */}
              <div
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => handleSocialShare("WhatsApp")}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <span className="text-xs text-gray-700">Whatsapp</span>
              </div>

              {/* Viber */}
              <div
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => handleSocialShare("Viber")}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
                >
                  <Phone className="h-6 w-6" />
                </Button>
                <span className="text-xs text-gray-700">Viber</span>
              </div>

              {/* Messenger */}
              <div
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => handleSocialShare("Messenger")}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                >
                  <Facebook className="h-6 w-6" />
                </Button>
                <span className="text-xs text-gray-700">Messenger</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
