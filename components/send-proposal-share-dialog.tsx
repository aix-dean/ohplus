"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Mail, MessageCircle, Phone, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Proposal } from "@/lib/types/proposal"

interface SendProposalShareDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
}

export function SendProposalShareDialog({ isOpen, onClose, proposal }: SendProposalShareDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [proposalUrl] = useState(`https://ohplus.ph/proposals/view/${proposal.id}`)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(proposalUrl)
      toast({
        title: "Link copied!",
        description: "The proposal link has been copied to your clipboard.",
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
    router.push(`/sales/proposals/compose/${proposal.id}`)
  }

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`Please review our proposal: ${proposalUrl}`)
    window.open(`https://wa.me/?text=${message}`)
  }

  const handleViberShare = () => {
    const message = encodeURIComponent(`Please review our proposal: ${proposalUrl}`)
    window.open(`viber://forward?text=${message}`)
  }

  const handleMessengerShare = () => {
    const message = encodeURIComponent(`Please review our proposal: ${proposalUrl}`)
    window.open(`https://m.me/?text=${message}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Proposal To</h2>
        </div>

        {/* Proposal Preview */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
              {proposal.products && proposal.products.length > 0 && proposal.products[0].image ? (
                <img
                  src={proposal.products[0].image || "/placeholder.svg"}
                  alt={proposal.products[0].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-xs font-bold">{proposal.code || "PROP"}</div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">{proposal.code}</div>
              <div className="text-sm font-semibold text-gray-900">
                {proposal.products && proposal.products.length > 0
                  ? `${proposal.products[0].name} (${proposal.products.length} Site${proposal.products.length !== 1 ? "s" : ""})`
                  : proposal.title}
              </div>
            </div>
          </div>
        </div>

        {/* URL Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
            <Input
              value={proposalUrl}
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
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Email</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Whatsapp</span>
            </button>

            <button
              onClick={handleViberShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Viber</span>
            </button>

            <button
              onClick={handleMessengerShare}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                <Send className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Messenger</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
