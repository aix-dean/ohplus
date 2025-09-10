"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Image from "next/image"
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
  const [reportUrl] = useState(`${window.location.origin}/public/reports/${report.id}`)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl)
      toast({
        title: "Link copied!",
        description: "The report link has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleEmailShare = () => {
    onClose()
    router.push(`/sales/reports/compose/${report.id}`)
  }

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`Please review this report: ${reportUrl}`)
    window.open(`https://wa.me/?text=${message}`)
  }

  const handleViberShare = () => {
    const message = encodeURIComponent(`Please review this report: ${reportUrl}`)
    window.open(`viber://forward?text=${message}`)
  }

  const handleMessengerShare = () => {
    const message = encodeURIComponent(`Please review this report: ${reportUrl}`)
    window.open(`https://m.me/?text=${message}`)
  }

  // Generate report filename
  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const reportFileName = `${report.siteId}_${getReportTypeDisplay(report.reportType).replace(/\s+/g, "_")}_${report.siteName.replace(/\s+/g, "_")}.pdf`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Report To</h2>
        </div>

        {/* Report Preview */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {/* Report thumbnail placeholder - using gradient like proposal */}
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-xs font-bold">REPORT</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-400 mb-1">{report.id?.slice(0, 8) || "N/A"}...</div>
              <div className="text-sm font-medium text-gray-500">{reportFileName}</div>
              <div className="text-sm font-semibold text-gray-900">
                {getReportTypeDisplay(report.reportType)}
              </div>
            </div>
          </div>
        </div>

        {/* URL Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
            <Input
              value={reportUrl}
              readOnly
              className="flex-1 bg-transparent border-none text-sm text-gray-600 p-0 focus-visible:ring-0"
            />
            <Button
              onClick={handleCopyLink}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
            >
              COPY LINK
            </Button>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={handleEmailShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <Image src="/icons/email.png" alt="Email" width={74} height={74} />
              </div>
              <span className="text-xs font-medium text-gray-700">Email</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <Image src="/icons/whatsapp.png" alt="WhatsApp" width={74} height={74} />
              </div>
              <span className="text-xs font-medium text-gray-700">Whatsapp</span>
            </button>

            <button
              onClick={handleViberShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <Image src="/icons/viber.png" alt="Viber" width={74} height={74} />
              </div>
              <span className="text-xs font-medium text-gray-700">Viber</span>
            </button>

            <button
              onClick={handleMessengerShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <Image src="/icons/messenger.png" alt="Messenger" width={74} height={74} />
              </div>
              <span className="text-xs font-medium text-gray-700">Messenger</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
