"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface RegistrationSuccessDialogProps {
  isOpen: boolean
  firstName: string
  onClose: () => void
  onStartTour: () => void // This prop will now be called when "START" is clicked
}

export function RegistrationSuccessDialog({ isOpen, firstName, onClose, onStartTour }: RegistrationSuccessDialogProps) {
  const handleStart = () => {
    onStartTour() // Call the function passed from the parent (which will handle closing the dialog)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center p-8">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold mb-4">Welcome {firstName}!</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image src="/celebration.png" alt="Celebration" width={150} height={150} className="mb-4" />
          <DialogDescription className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Congratulations!
          </DialogDescription>
          <p className="text-gray-600 dark:text-gray-400">You have successfully registered in OH!PLUS.</p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6" onClick={handleStart}>
            START
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
