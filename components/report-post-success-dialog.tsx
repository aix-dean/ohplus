"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation" // Import useRouter

interface ReportPostSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  onViewReport?: (reportId: string) => void
}

export function ReportPostSuccessDialog({ open, onOpenChange, reportId, onViewReport }: ReportPostSuccessDialogProps) {
  const router = useRouter() // Initialize useRouter

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center p-6">
        <DialogHeader className="flex flex-col items-center">
          {" "}
          {/* Added flex and items-center */}
          <div className="flex justify-center mb-4">
            <Image src="/party-popper.png" alt="Party Popper" width={120} height={120} className="object-contain" />{" "}
            {/* Increased size */}
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center">Congratulations!</DialogTitle>{" "}
          {/* Added text-center */}
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600 text-lg">You have successfully posted a report!</p>
          {/* Removed Report ID display */}
        </div>
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              onOpenChange(false)
              if (onViewReport) {
                onViewReport(reportId)
              } else {
                router.push(`/logistics/reports/${reportId}`) // Navigate to report details if onViewReport is not provided
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
