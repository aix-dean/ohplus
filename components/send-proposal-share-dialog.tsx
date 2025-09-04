"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Image from "next/image"
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
  const [proposalUrl] = useState(`${window.location.origin}/proposals/view/${proposal.id}`)
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
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {proposal.products &&
              proposal.products.length > 0 &&
              proposal.products[0].media &&
              proposal.products[0].media.length > 0 ? (
                <img
                  src={proposal.products[0].media[0].url || "/placeholder.svg"}
                  alt={proposal.products[0].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-xs font-bold">{proposal.proposalNumber || "PROP"}</div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-400 mb-1">{proposal.proposalNumber || proposal.id}</div>
              <div className="text-sm font-medium text-gray-500">{proposal.proposalNumber}</div>
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
              <div className="w-12 h-12  rounded-full flex items-center justify-center">
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
              <div className="w-12 h-12  rounded-full flex items-center justify-center">
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
