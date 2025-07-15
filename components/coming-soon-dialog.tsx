"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Sparkles } from "lucide-react"

interface ComingSoonDialogProps {
  isOpen: boolean
  onClose: () => void
  feature: string
}

export function ComingSoonDialog({ isOpen, onClose, feature }: ComingSoonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <div className="relative">
              <Clock className="h-8 w-8 text-blue-600" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">Coming Soon!</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {feature} is coming soon. We're working hard to bring you this feature. Stay tuned for updates!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
