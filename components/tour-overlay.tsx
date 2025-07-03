"use client"

import { useCallback } from "react"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, X } from "lucide-react"

export function TourOverlay() {
  const { currentStep, tourSteps, nextStep, prevStep, endTour, isTourActive } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStepData = currentStep !== null ? tourSteps[currentStep] : null

  const updateTargetRect = useCallback(() => {
    if (currentStepData && currentStepData.target) {
      const targetElement = document.querySelector(currentStepData.target)
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect())
      } else {
        setTargetRect(null)
        // If target not found, try to move to next step or end tour
        // This can happen if a navigation step hasn't fully loaded its content yet
        if (currentStepData.isNavigationStep) {
          // For navigation steps, we might need to wait longer or have a more robust check
          // For now, we'll just log and let the nextStep logic handle it.
          console.warn(`Tour target "${currentStepData.target}" not found for step ${currentStep}.`)
        } else {
          console.error(`Tour target "${currentStepData.target}" not found for step ${currentStep}. Ending tour.`)
          endTour()
        }
      }
    } else {
      setTargetRect(null)
    }
  }, [currentStepData, currentStep, endTour])

  useEffect(() => {
    if (isTourActive) {
      updateTargetRect()
      window.addEventListener("resize", updateTargetRect)
      window.addEventListener("scroll", updateTargetRect, true) // Use capture phase for scroll
    } else {
      setTargetRect(null)
    }

    return () => {
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect, true)
    }
  }, [isTourActive, currentStepData, updateTargetRect])

  if (!isTourActive || !currentStepData) {
    return null
  }

  const { title, content, placement = "bottom" } = currentStepData

  let tooltipStyle: React.CSSProperties = {}
  if (targetRect && tooltipRef.current) {
    const tooltipWidth = tooltipRef.current.offsetWidth
    const tooltipHeight = tooltipRef.current.offsetHeight

    switch (placement) {
      case "top":
        tooltipStyle = {
          top: targetRect.top - tooltipHeight - 10,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
        break
      case "bottom":
        tooltipStyle = {
          top: targetRect.bottom + 10,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
        break
      case "left":
        tooltipStyle = {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - 10,
        }
        break
      case "right":
        tooltipStyle = {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + 10,
        }
        break
      case "center":
        tooltipStyle = {
          top: window.innerHeight / 2 - tooltipHeight / 2,
          left: window.innerWidth / 2 - tooltipWidth / 2,
        }
        break
    }

    // Ensure tooltip stays within viewport
    tooltipStyle.left = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, tooltipStyle.left as number))
    tooltipStyle.top = Math.max(10, Math.min(window.innerHeight - tooltipHeight - 10, tooltipStyle.top as number))
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dimming overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Highlighted area */}
      {targetRect && (
        <div
          className="absolute rounded-md shadow-lg pointer-events-auto"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", // Creates the spotlight effect
            zIndex: 1, // Ensure it's above the dimming overlay
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute z-[10000] bg-white text-gray-900 p-4 rounded-lg shadow-xl max-w-sm pointer-events-auto",
          !targetRect && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", // Center if no target
        )}
        style={tooltipStyle}
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm mb-4">{content}</p>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={endTour}>
            Skip Tour
          </Button>
          <div className="flex items-center gap-2">
            {currentStep !== null && currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {currentStep !== null ? currentStep + 1 : 0} / {tourSteps.length}
            </span>
            <Button size="sm" onClick={nextStep}>
              {currentStep !== null && currentStep === tourSteps.length - 1 ? (
                "Finish"
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={endTour}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
