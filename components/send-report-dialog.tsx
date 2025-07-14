"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, MessageCircle, Phone, Send } from "lucide-react"
import type { ReportData } from "@/lib/report-service"

interface SendReportDialogProps {
  isOpen: boolean
  onClose: () => void
  report: ReportData
  onSelectOption: (option: "email" | "whatsapp" | "viber" | "messenger") => void
}

export function SendReportDialog({ isOpen, onClose, report, onSelectOption }: SendReportDialogProps) {
  const handleOptionSelect = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    onSelectOption(option)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">Choose how you'd like to send the report for "{report.siteName}"</p>

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => handleOptionSelect("email")}
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 px-4"
            >
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Email</div>
                <div className="text-xs text-gray-500">Send via email</div>
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("whatsapp")}
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 px-4"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs text-gray-500">Send via WhatsApp</div>
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("viber")}
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 px-4"
            >
              <Phone className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Viber</div>
                <div className="text-xs text-gray-500">Send via Viber</div>
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("messenger")}
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 px-4"
            >
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Messenger</div>
                <div className="text-xs text-gray-500">Send via Messenger</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
