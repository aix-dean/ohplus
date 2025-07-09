"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Mail, MessageCircle, Phone, Facebook, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SendReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  reportFileName: string
  reportType: string
}

export function SendReportDialog({ open, onOpenChange, reportId, reportFileName, reportType }: SendReportDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  // Generate shareable link
  const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://ohplus.aix.ph"}/logistics/reports/${reportId}`

  const handleCopyLink = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(shareableLink)
      toast({
        title: "Link Copied!",
        description: "The report link has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  const handleEmailClick = () => {
    onOpenChange(false)
    router.push(`/logistics/reports/${reportId}/compose`)
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Check out this report: ${shareableLink}`)
    window.open(`https://wa.me/?text=${message}`, "_blank")
    toast({
      title: "WhatsApp Opened",
      description: "Share the report via WhatsApp.",
    })
  }

  const handleViberClick = () => {
    const message = encodeURIComponent(`Check out this report: ${shareableLink}`)
    window.open(`viber://forward?text=${message}`, "_blank")
    toast({
      title: "Viber Opened",
      description: "Share the report via Viber.",
    })
  }

  const handleMessengerClick = () => {
    const message = encodeURIComponent(`Check out this report: ${shareableLink}`)
    window.open(`https://m.me/?text=${message}`, "_blank")
    toast({
      title: "Messenger Opened",
      description: "Share the report via Messenger.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-8 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Send Report</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6">
          {/* Report Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">PDF</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{reportFileName}</p>
              <p className="text-xs text-gray-500">
                {reportType} • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Shareable Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input value={shareableLink} readOnly className="flex-1 bg-gray-50 text-sm" />
              <Button
                onClick={handleCopyLink}
                disabled={copying}
                variant="outline"
                className="px-4 py-2 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copying ? "COPYING..." : "COPY LINK"}
              </Button>
            </div>
          </div>

          {/* Sharing Options */}
          <div className="grid grid-cols-4 gap-6">
            <button
              onClick={handleEmailClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Email</span>
            </button>

            <button
              onClick={handleWhatsAppClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">WhatsApp</span>
            </button>

            <button
              onClick={handleViberClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Viber</span>
            </button>

            <button
              onClick={handleMessengerClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Facebook className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Messenger</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
