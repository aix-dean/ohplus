"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ReportPostedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportPostedSuccessDialog({ open, onOpenChange }: ReportPostedSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center p-8">
        <DialogHeader className="flex flex-col items-center">
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">Congratulations!</DialogTitle>
          <img src="/party-popper.png" alt="Party Popper" className="w-24 h-24 mb-6" />
        </DialogHeader>
        <p className="text-lg text-gray-700">You have successfully posted a report!</p>
        <div className="mt-6">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
