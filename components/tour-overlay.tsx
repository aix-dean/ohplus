"use client"

import { useCallback } from "react"

import { useEffect, useRef, useState } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TourOverlay() {
  const { tourActive, currentStep, activeTourSteps, nextStep, prevStep, endTour, highlightedElementId } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; transform: string } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentTourStep = tourActive && currentStep !== null ? activeTourSteps[currentStep] : null

  const updateTargetRect = useCallback(() => {
    if (highlightedElementId) {
      const targetElement = document.querySelector(`[data-tour-id="${highlightedElementId}"]`)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        setTargetRect(rect)

        // Calculate tooltip position
        if (tooltipRef.current) {
          const tooltipWidth = tooltipRef.current.offsetWidth
          const tooltipHeight = tooltipRef.current.offsetHeight
          const padding = 16 // Padding around the target

          let top = rect.bottom + padding
          let left = rect.left

          // Default position: below the target
          const transform = "translateY(0)"

          // Adjust if tooltip goes off screen to the right
          if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding
          }
          // Adjust if tooltip goes off screen to the left
          if (left < padding) {
            left = padding
          }

          // If tooltip goes off screen below, try above
          if (top + tooltipHeight > window.innerHeight - padding) {
            top = rect.top - tooltipHeight - padding
            if (top < padding) {
              // If still off screen, place it at the top of the screen
              top = padding
            }
          }

          setTooltipPosition({ top, left, transform })
        }
      } else {
        setTargetRect(null)
        setTooltipPosition(null)
      }
    } else {
      setTargetRect(null)
      setTooltipPosition(null)
    }
  }, [highlightedElementId])

  useEffect(() => {
    if (tourActive && currentTourStep) {
      updateTargetRect()
      window.addEventListener("resize", updateTargetRect)
      window.addEventListener("scroll", updateTargetRect)
    } else {
      setTargetRect(null)
      setTooltipPosition(null)
    }

    return () => {
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect)
    }
  }, [tourActive, currentTourStep, updateTargetRect])

  if (!tourActive || !currentTourStep) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay */}
      {targetRect && (
        <>
          {/* Top overlay */}
          <div
            className="absolute bg-black/50"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top,
            }}
          />
          {/* Bottom overlay */}
          <div
            className="absolute bg-black/50"
            style={{
              top: targetRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left overlay */}
          <div
            className="absolute bg-black/50"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          {/* Right overlay */}
          <div
            className="absolute bg-black/50"
            style={{
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />
          {/* Highlighted area (transparent) */}
          <div
            className="absolute border-4 border-blue-500 rounded-lg shadow-lg pointer-events-auto"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", // This creates the "hole" effect
            }}
          />
        </>
      )}

      {/* Tooltip */}
      {currentTourStep && tooltipPosition && (
        <Card
          ref={tooltipRef}
          className={cn(
            "absolute z-[10000] w-80 pointer-events-auto",
            currentTourStep.position === "center" && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          )}
          style={
            currentTourStep.position !== "center"
              ? {
                  top: tooltipPosition.top,
                  left: tooltipPosition.left,
                  transform: tooltipPosition.transform,
                }
              : {}
          }
        >
          <CardHeader>
            <CardTitle>{currentTourStep.title}</CardTitle>
            {currentTourStep.description && <CardDescription>{currentTourStep.description}</CardDescription>}
          </CardHeader>
          <CardContent>{currentTourStep.content}</CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={endTour}>
              Skip Tour
            </Button>
            <div className="flex gap-2">
              {currentStep !== 0 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
              <Button onClick={nextStep}>{currentStep === activeTourSteps.length - 1 ? "Finish" : "Next"}</Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
