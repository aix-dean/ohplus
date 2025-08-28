"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Phone, Mail, Globe } from "lucide-react"

interface Partner {
  id: string
  name: string
  logo: string
  lastActivity: string
}

interface PartnerActionsDialogProps {
  isOpen: boolean
  onClose: () => void
  partner: Partner | null
}

export function PartnerActionsDialog({ isOpen, onClose, partner }: PartnerActionsDialogProps) {
  if (!partner) return null

  const handleCall = () => {
    // Add call functionality here
    console.log(`Calling ${partner.name}`)
    onClose()
  }

  const handleEmail = () => {
    // Add email functionality here
    console.log(`Emailing ${partner.name}`)
    onClose()
  }

  const handleVisitWebsite = () => {
    // Add visit website functionality here
    console.log(`Visiting ${partner.name} website`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[280px] p-0 gap-0">
        <div className="relative p-6">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleCall}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-3 h-auto"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>

            <Button
              onClick={handleEmail}
              variant="secondary"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full py-3 h-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>

            <Button
              onClick={handleVisitWebsite}
              variant="secondary"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full py-3 h-auto"
            >
              <Globe className="h-4 w-4 mr-2" />
              Visit Website
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
