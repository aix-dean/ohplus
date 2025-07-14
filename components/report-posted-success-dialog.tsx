"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ReportPostedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewDashboard: () => void
}

export function ReportPostedSuccessDialog({ open, onOpenChange, onViewDashboard }: ReportPostedSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-lg p-6 text-center">
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle className="text-2xl font-bold text-gray-900 mb-4">Congratulations!</AlertDialogTitle>
          <Image src="/party-popper.png" alt="Party Popper" width={120} height={120} className="mb-6" />
          <AlertDialogDescription className="text-gray-600 text-base">
            You have successfully posted a report!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center mt-6">
          <Button onClick={onViewDashboard} className="w-full">
            View Dashboard
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
