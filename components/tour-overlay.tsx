"use client"

import { useEffect, useState, useRef } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react"

export function TourOverlay() {
  const { isTourActive, activeStep, nextStep, prevStep, endTour, highlightedElement } = useTour()
  const [overlayStyle, setOverlayStyle] = useState({})
  const [tooltipStyle, setTooltipStyle] = useState({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isTourActive && highlightedElement) {
      const rect = highlightedElement.getBoundingClientRect()

      // Calculate overlay styles to create a "hole" around the highlighted element
      setOverlayStyle({
        clipPath: `polygon(
          0% 0%,
          0% 100%,
          ${rect.left}px 100%,
          ${rect.left}px ${rect.top}px,
          ${rect.right}px ${rect.top}px,
          ${rect.right}px ${rect.bottom}px,
          ${rect.left}px ${rect.bottom}px,
          ${rect.left}px 100%,
          100% 100%,
          100% 0%
        )`,
      })

      // Calculate tooltip position
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        let top = rect.bottom + 10 // Default to below
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2

        // Adjust if tooltip goes off screen
        if (top + tooltipRect.height > window.innerHeight) {
          top = rect.top - tooltipRect.height - 10 // Place above
        }
        if (left < 0) {
          left = 10 // Pad from left edge
        }
        if (left + tooltipRect.width > window.innerWidth) {
          left = window.innerWidth - tooltipRect.width - 10 // Pad from right edge
        }

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
        })
      }
    } else {
      setOverlayStyle({})
      setTooltipStyle({})
    }
  }, [isTourActive, highlightedElement, activeStep])

  if (!isTourActive || !activeStep) {
    return null
  }

  return (
    <>
      {/* Dark overlay with a "hole" */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-all duration-300 pointer-events-none"
        style={overlayStyle}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 p-4 rounded-lg shadow-lg z-[9999] max-w-xs transition-all duration-300",
          !highlightedElement && "hidden", // Hide tooltip if no element is highlighted
        )}
        style={tooltipStyle}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">{activeStep.title}</h3>
          <Button variant="ghost" size="icon" onClick={endTour} className="h-6 w-6">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">End Tour</span>
          </Button>
        </div>
        <p className="text-sm mb-4">{activeStep.content}</p>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={prevStep} disabled={activeStep.id === "step1"}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button size="sm" onClick={nextStep}>
            {activeStep.id === "step2" ? "Finish Tour" : "Next"}
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  )
}
