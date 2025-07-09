"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface IndexCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateJO: () => void
}

export function IndexCardDialog({ open, onOpenChange, onCreateJO }: IndexCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Index Card</DialogTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Illumination Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Upper:</span> 4 metal-halides
            </div>
            <div>
              <span className="font-medium">Left:</span> 2 metal-halides
            </div>
            <div>
              <span className="font-medium">Bottom:</span> 4 metal-halides
            </div>
            <div>
              <span className="font-medium">Right:</span> 2 metal-halides
            </div>
          </div>

          {/* Grid Layout */}
          <div className="relative bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 h-48">
              {/* Q1 */}
              <div className="bg-white rounded border flex items-center justify-center text-sm font-medium">Q1</div>
              {/* Q2 */}
              <div className="bg-white rounded border flex items-center justify-center text-sm font-medium">Q2</div>
              {/* Q3 */}
              <div className="bg-white rounded border flex items-center justify-center text-sm font-medium">Q3</div>
              {/* Q4 */}
              <div className="bg-white rounded border flex items-center justify-center text-sm font-medium">Q4</div>
            </div>

            {/* Light Indicators */}
            {/* Upper lights */}
            <div className="absolute -top-2 left-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              U1
            </div>
            <div className="absolute -top-2 left-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              U2
            </div>
            <div className="absolute -top-2 right-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              U3
            </div>
            <div className="absolute -top-2 right-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              U4
            </div>

            {/* Left lights */}
            <div className="absolute -left-2 top-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              L1
            </div>
            <div className="absolute -left-2 bottom-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              L2
            </div>

            {/* Right lights */}
            <div className="absolute -right-2 top-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              R1
            </div>
            <div className="absolute -right-2 bottom-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              R3
            </div>

            {/* Bottom lights */}
            <div className="absolute -bottom-2 left-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              B1
            </div>
            <div className="absolute -bottom-2 left-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              B2
            </div>
            <div className="absolute -bottom-2 right-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              B3
            </div>
            <div className="absolute -bottom-2 right-8 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              B4
            </div>
          </div>

          {/* View Latest Photo Link */}
          <div className="text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm underline">
              View Latest Photo (Jun 5, 2025)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                onCreateJO()
                onOpenChange(false)
              }}
            >
              Create JO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
