"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ReportPostSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ReportPostSuccessDialog({ isOpen, onClose }: ReportPostSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <DialogTitle className="text-2xl font-bold">Congratulations!</DialogTitle>
          <Image src="/party-popper.png" alt="Party Popper" width={120} height={120} className="animate-bounce-once" />
          <DialogDescription className="text-lg text-gray-700">
            You have successfully posted a report!
          </DialogDescription>
          <Button onClick={onClose} className="mt-4">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
