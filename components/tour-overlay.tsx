"use client"

import { useEffect, useState, useRef } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TargetElementInfo {
  element: HTMLElement
  rect: DOMRect
}

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, skipTour } = useTour()
  const [targetInfo, setTargetInfo] = useState<TargetElementInfo | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[currentStep]

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetInfo(null)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(currentStepData.target) as HTMLElement
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetInfo({ element: target, rect })

        // Calculate tooltip position
        const placement = currentStepData.placement || "bottom"
        let x = rect.left + rect.width / 2
        let y = rect.bottom + 20

        switch (placement) {
          case "top":
            y = rect.top - 20
            break
          case "left":
            x = rect.left - 20
            y = rect.top + rect.height / 2
            break
          case "right":
            x = rect.right + 20
            y = rect.top + rect.height / 2
            break
          case "bottom":
          default:
            y = rect.bottom + 20
            break
        }

        // Ensure tooltip stays within viewport
        const tooltipWidth = 320
        const tooltipHeight = 200

        if (x + tooltipWidth / 2 > window.innerWidth) {
          x = window.innerWidth - tooltipWidth / 2 - 20
        }
        if (x - tooltipWidth / 2 < 0) {
          x = tooltipWidth / 2 + 20
        }
        if (y + tooltipHeight > window.innerHeight) {
          y = rect.top - tooltipHeight - 20
        }

        setTooltipPosition({ x, y })
      } else {
        // If target not found, try again after a short delay
        setTimeout(findTarget, 100)
      }
    }

    findTarget()

    // Re-calculate on window resize
    const handleResize = () => findTarget()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isActive, currentStep, currentStepData])

  if (!isActive || !currentStepData || !targetInfo) {
    return null
  }

  const { rect } = targetInfo

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999] pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Backdrop with cutout */}
      <div className="absolute inset-0 pointer-events-auto">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.5)" mask="url(#spotlight)" />
        </svg>
      </div>

      {/* Highlight border */}
      <div
        className="absolute border-2 border-blue-500 rounded-lg animate-pulse"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* Tooltip */}
      <Card
        className="absolute w-80 pointer-events-auto shadow-2xl border-2 border-blue-200"
        style={{
          left: tooltipPosition.x - 160, // Center the card
          top: tooltipPosition.y,
          transform: currentStepData.placement === "top" ? "translateY(-100%)" : "none",
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-blue-600">{currentStepData.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-4">{currentStepData.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    index === currentStep ? "bg-blue-500" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
