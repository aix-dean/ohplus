"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface IndexCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateJO?: () => void
}

export function IndexCardDialog({ open, onOpenChange, onCreateJO }: IndexCardDialogProps) {
  const handleCreateJO = () => {
    if (onCreateJO) {
      onCreateJO()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-lg font-semibold">Index Card</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="py-4">
          {/* Illumination Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div>
                <span className="font-medium">Upper:</span> 4 metal-halides
              </div>
              <div>
                <span className="font-medium">Bottom:</span> 4 metal-halides
              </div>
            </div>
            <div>
              <div>
                <span className="font-medium">Left:</span> 2 metal-halides
              </div>
              <div>
                <span className="font-medium">Right:</span> 2 metal-halides
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="relative bg-gray-100 rounded-lg p-8 mb-6">
            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Q1 */}
              <div className="bg-white border-2 border-gray-300 rounded-lg h-24 flex items-center justify-center text-lg font-medium">
                Q1
              </div>
              {/* Q2 */}
              <div className="bg-white border-2 border-gray-300 rounded-lg h-24 flex items-center justify-center text-lg font-medium">
                Q2
              </div>
              {/* Q3 */}
              <div className="bg-white border-2 border-gray-300 rounded-lg h-24 flex items-center justify-center text-lg font-medium">
                Q3
              </div>
              {/* Q4 */}
              <div className="bg-white border-2 border-gray-300 rounded-lg h-24 flex items-center justify-center text-lg font-medium">
                Q4
              </div>
            </div>

            {/* Light Indicators */}
            {/* Upper lights */}
            <div className="absolute -top-4 left-1/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U1
              </div>
            </div>
            <div className="absolute -top-4 left-2/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U2
              </div>
            </div>
            <div className="absolute -top-4 left-3/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U3
              </div>
            </div>
            <div className="absolute -top-4 right-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U4
              </div>
            </div>

            {/* Left lights */}
            <div className="absolute top-1/4 -left-4 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                L1
              </div>
            </div>
            <div className="absolute top-3/4 -left-4 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                L2
              </div>
            </div>

            {/* Right lights */}
            <div className="absolute top-1/4 -right-4 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                R1
              </div>
            </div>
            <div className="absolute top-3/4 -right-4 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                R3
              </div>
            </div>

            {/* Bottom lights */}
            <div className="absolute -bottom-4 left-1/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B1
              </div>
            </div>
            <div className="absolute -bottom-4 left-2/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B2
              </div>
            </div>
            <div className="absolute -bottom-4 left-3/4 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B3
              </div>
            </div>
            <div className="absolute -bottom-4 right-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B4
              </div>
            </div>
          </div>

          {/* View Latest Photo Link */}
          <div className="text-center mb-4">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
              onClick={(e) => e.preventDefault()}
            >
              View Latest Photo (Jun 5, 2025)
            </a>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateJO} className="bg-blue-600 hover:bg-blue-700">
            Create JO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
