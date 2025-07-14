"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ReportPostSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  reportId?: string | null
}

export function ReportPostSuccessDialog({ isOpen, onClose, reportId }: ReportPostSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          {/* Party Popper Icon */}
          <div className="w-20 h-20 flex items-center justify-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rMQJeATLoOf5wGOwTMDAI5fBvfrCgZ.png"
              alt="Party Popper"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Congratulations Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Congratulations!</h2>
            <p className="text-gray-600 text-center">You have successfully posted a report!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
