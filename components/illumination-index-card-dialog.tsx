"use client"

import { Button } from "@/components/ui/button"

import { DialogFooter } from "@/components/ui/dialog"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

interface IlluminationIndexCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateJO?: () => void
  product?: any
}

export function IlluminationIndexCardDialog({
  open,
  onOpenChange,
  onCreateJO,
  product,
}: IlluminationIndexCardDialogProps) {
  const handleCreateJO = () => {
    if (onCreateJO) {
      onCreateJO()
    }
    onOpenChange(false)
  }

  // Get illumination data from product
  const upperCount = Number.parseInt(product?.specs_rental?.illumination_upper_count || "0")
  const leftCount = Number.parseInt(product?.specs_rental?.illumination_left_count || "0")
  const bottomCount = Number.parseInt(product?.specs_rental?.illumination_bottom_count || "0")
  const rightCount = Number.parseInt(product?.specs_rental?.illumination_right_count || "0")

  // Get display layout from product
  const displayRows = Number.parseInt(product?.specs_rental?.display_rows || "2")
  const displayCols = Number.parseInt(product?.specs_rental?.display_cols || "2")
  const totalQuadrants = displayRows * displayCols

  // Generate quadrant data
  const quadrants = Array.from({ length: totalQuadrants }, (_, i) => ({
    id: `Q${i + 1}`,
    number: i + 1,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-lg font-semibold">Index Card</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="py-4">
          {/* Illumination Information */}
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Upper:</span> {upperCount} metal-halides
            </div>
            <div>
              <span className="font-medium">Left:</span> {leftCount} metal-halides
            </div>
            <div>
              <span className="font-medium">Bottom:</span> {bottomCount} metal-halides
            </div>
            <div>
              <span className="font-medium">Right:</span> {rightCount} metal-halides
            </div>
          </div>

          {/* Display Grid */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex justify-center">
              <div className="relative">
                {/* Scrollable container for large grids */}
                <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
                  {/* Dynamic preview based on rows and columns */}
                  <div
                    className="bg-gray-300 p-2 rounded"
                    style={{
                      width: `${Math.min(displayCols * 60, 480)}px`,
                      height: `${displayRows * 60}px`,
                      display: "grid",
                      gridTemplateColumns: `repeat(${displayCols}, 1fr)`,
                      gridTemplateRows: `repeat(${displayRows}, 1fr)`,
                      gap: "4px",
                    }}
                  >
                    {quadrants.map((quadrant) => (
                      <div key={quadrant.id} className="bg-white rounded flex items-center justify-center min-h-[52px]">
                        <span className="text-sm font-medium text-gray-600">{quadrant.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Illumination indicators around the preview */}
                {/* Upper Metal Halides */}
                {Array.from({ length: upperCount }).map((_, i) => {
                  const gridWidth = Math.min(displayCols * 60, 480)
                  const spacing = upperCount > 1 ? gridWidth / (upperCount + 1) : gridWidth / 2
                  const leftPosition = upperCount === 1 ? gridWidth / 2 : spacing * (i + 1)

                  return (
                    <div
                      key={`upper-${i}`}
                      className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center absolute text-white text-xs font-bold"
                      style={{
                        top: "-20px",
                        left: `${leftPosition}px`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      U{i + 1}
                    </div>
                  )
                })}

                {/* Left Metal Halides */}
                {Array.from({ length: leftCount }).map((_, i) => {
                  const gridHeight = displayRows * 60
                  const spacing = leftCount > 1 ? gridHeight / (leftCount + 1) : gridHeight / 2
                  const topPosition = leftCount === 1 ? gridHeight / 2 : spacing * (i + 1)

                  return (
                    <div
                      key={`left-${i}`}
                      className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center absolute text-white text-xs font-bold"
                      style={{
                        top: `${topPosition}px`,
                        left: "-20px",
                        transform: "translateY(-50%)",
                      }}
                    >
                      L{i + 1}
                    </div>
                  )
                })}

                {/* Right Metal Halides */}
                {Array.from({ length: rightCount }).map((_, i) => {
                  const gridHeight = displayRows * 60
                  const gridWidth = Math.min(displayCols * 60, 480)
                  const spacing = rightCount > 1 ? gridHeight / (rightCount + 1) : gridHeight / 2
                  const topPosition = rightCount === 1 ? gridHeight / 2 : spacing * (i + 1)

                  return (
                    <div
                      key={`right-${i}`}
                      className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center absolute text-white text-xs font-bold"
                      style={{
                        top: `${topPosition}px`,
                        right: "-20px",
                        transform: "translateY(-50%)",
                      }}
                    >
                      R{i + 1}
                    </div>
                  )
                })}

                {/* Bottom Metal Halides */}
                {Array.from({ length: bottomCount }).map((_, i) => {
                  const gridWidth = Math.min(displayCols * 60, 480)
                  const gridHeight = displayRows * 60
                  const spacing = bottomCount > 1 ? gridWidth / (bottomCount + 1) : gridWidth / 2
                  const leftPosition = bottomCount === 1 ? gridWidth / 2 : spacing * (i + 1)

                  return (
                    <div
                      key={`bottom-${i}`}
                      className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center absolute text-white text-xs font-bold"
                      style={{
                        bottom: "-20px",
                        left: `${leftPosition}px`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      B{i + 1}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Layout Info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 font-medium">
                Layout: {displayRows}x{displayCols} ({totalQuadrants} quadrants)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {displayRows > displayCols
                  ? "Vertical Rectangle"
                  : displayCols > displayRows
                    ? "Horizontal Rectangle"
                    : "Square"}
              </p>
              {totalQuadrants > 20 && (
                <p className="text-xs text-blue-600 mt-1">ⓘ Large grid - scroll to view all quadrants</p>
              )}
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
