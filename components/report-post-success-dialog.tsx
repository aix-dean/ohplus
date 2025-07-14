"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ReportPostSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  onViewReport?: (reportId: string) => void
}

export function ReportPostSuccessDialog({ open, onOpenChange, reportId, onViewReport }: ReportPostSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center p-6">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Image src="/party-popper.png" alt="Party Popper" width={100} height={100} className="object-contain" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Congratulations!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600 text-lg">You have successfully posted a report!</p>
          <p className="text-sm text-gray-500 mt-2">
            Report ID: <span className="font-semibold">{reportId}</span>
          </p>
        </div>
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              onOpenChange(false)
              if (onViewReport) {
                onViewReport(reportId)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
