"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ReportPostSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  onViewReport?: () => void
}

export function ReportPostSuccessDialog({ isOpen, onClose, onViewReport }: ReportPostSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          {/* Party Popper Icon */}
          <div className="flex justify-center">
            <img src="/party-popper.png" alt="Party Popper" className="w-20 h-20 object-contain" />
          </div>

          {/* Congratulations Text - Centered */}
          <h2 className="text-2xl font-bold text-gray-900 text-center">Congratulations!</h2>

          {/* Success Message */}
          <p className="text-gray-600 text-center">You have successfully posted a report!</p>

          {/* View Report Button */}
          {onViewReport && (
            <Button onClick={onViewReport} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
              View Report
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
