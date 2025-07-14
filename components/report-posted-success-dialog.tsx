"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ReportPostedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewDashboard: () => void
}

export function ReportPostedSuccessDialog({ open, onOpenChange, onViewDashboard }: ReportPostedSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900">Congratulations!</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <Image src="/party-popper.png" alt="Party Popper" width={120} height={120} className="mb-4" />
          <p className="text-gray-600 text-center text-lg">You have successfully posted a report!</p>
        </div>

        <DialogFooter className="flex justify-center">
          <Button onClick={onViewDashboard} className="w-full">
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
