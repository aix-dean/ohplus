"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface ServiceAssignmentSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saNumber: string
  onViewAssignments?: () => void
  onCreateAnother?: () => void
}

export function ServiceAssignmentSuccessDialog({
  open,
  onOpenChange,
  saNumber,
  onViewAssignments,
  onCreateAnother,
}: ServiceAssignmentSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Service Assignment Created Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">Your service assignment has been created with the following details:</p>
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-500">Service Assignment Number</p>
            <p className="text-lg font-semibold text-gray-900">SA#{saNumber}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">The assignment has been submitted and is now pending review.</p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {onCreateAnother && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onCreateAnother()
              }}
              className="w-full sm:w-auto"
            >
              Create Another
            </Button>
          )}
          <Button
            onClick={() => {
              onOpenChange(false)
              if (onViewAssignments) {
                onViewAssignments()
              }
            }}
            className="w-full sm:w-auto"
          >
            View Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
