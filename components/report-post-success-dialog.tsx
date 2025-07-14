"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ReportPostSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function ReportPostSuccessDialog({ open, onOpenChange, onClose }: ReportPostSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-8 text-center">
        <div className="space-y-6">
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900">Congratulations!</h2>

          {/* Celebration Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Party Horn */}
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center transform rotate-45 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-full"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              </div>

              {/* Confetti */}
              <div className="absolute -top-4 -left-4 w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
              <div
                className="absolute -top-2 left-8 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="absolute top-2 -right-6 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute -bottom-2 -left-6 w-2 h-2 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div
                className="absolute bottom-4 right-8 w-3 h-3 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <div
                className="absolute -top-6 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
          </div>

          {/* Success Message */}
          <p className="text-gray-700 text-lg">
            You have successfully
            <br />
            posted a report!
          </p>

          {/* Close Button */}
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
