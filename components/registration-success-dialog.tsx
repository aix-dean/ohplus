"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface RegistrationSuccessDialogProps {
  isOpen: boolean
  firstName: string
  onClose: () => void
  onStartTour: () => void
}

export function RegistrationSuccessDialog({ isOpen, firstName, onClose, onStartTour }: RegistrationSuccessDialogProps) {
  const handleStartClick = () => {
    onStartTour()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Celebration Image */}
          <div className="relative w-24 h-24">
            <Image src="/celebration.png" alt="Celebration" fill className="object-contain" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {firstName}!</h2>
            <p className="text-gray-600">Your account has been successfully created. You're all set to get started!</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={handleStartClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              START
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
