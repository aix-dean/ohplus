"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface CostEstimateSentSuccessDialogProps {
  isOpen: boolean
  onDismissAndNavigate: () => void
}

export function CostEstimateSentSuccessDialog({ isOpen, onDismissAndNavigate }: CostEstimateSentSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onDismissAndNavigate}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader className="items-center">
          <Image src="/party-popper.png" alt="Success" width={80} height={80} className="mb-4" />
          <DialogTitle className="text-2xl font-bold text-green-600">Cost Estimate Sent!</DialogTitle>
          <DialogDescription className="text-gray-600">
            The cost estimate has been successfully sent to the client.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500">You can now track its status and client interactions.</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onDismissAndNavigate}>Go to Dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
