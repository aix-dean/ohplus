"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Sparkles } from "lucide-react"

interface ComingSoonDialogProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

export function ComingSoonDialog({ isOpen, onClose, feature = "This feature" }: ComingSoonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-blue-500" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Coming Soon!</DialogTitle>
          <DialogDescription className="text-lg text-gray-600 mt-2">
            {feature} is currently under development and will be available soon.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">We're working hard to bring you the best experience possible.</p>
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
