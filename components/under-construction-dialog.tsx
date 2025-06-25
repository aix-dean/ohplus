"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"

interface UnderConstructionDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UnderConstructionDialog({ isOpen, onClose }: UnderConstructionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Bridge Under Construction</h2>
          <Image
            src="/bridge-under-construction.png"
            alt="Bridge Under Construction"
            width={200}
            height={200}
            className="object-contain"
          />
          <p className="text-lg text-gray-600">We are creating something exciting for you!</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
