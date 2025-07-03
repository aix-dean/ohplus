"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, skipTour } = useTour()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return

    const findTarget = () => {
      const target = document.querySelector(`[data-tour-target="${steps[currentStep].target}"]`) as HTMLElement
      if (target) {
        setTargetElement(target)
        const rect = target.getBoundingClientRect()
        setOverlayStyle({
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
          pointerEvents: "none",
        })
      }
    }

    // Try to find target immediately
    findTarget()

    // If not found, try again after a short delay (for navigation)
    const timeout = setTimeout(findTarget, 100)
    return () => clearTimeout(timeout)
  }, [isActive, currentStep, steps])

  if (!isActive || !steps[currentStep] || !targetElement) return null

  const currentStepData = steps[currentStep]
  const targetRect = targetElement.getBoundingClientRect()

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const placement = currentStepData.placement || "bottom"
    const tooltipWidth = 320
    const tooltipHeight = 200
    const offset = 20

    switch (placement) {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - offset,
          left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
        }
      case "bottom":
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
        }
      case "left":
        return {
          top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
          left: targetRect.left - tooltipWidth - offset,
        }
      case "right":
        return {
          top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
          left: targetRect.right + offset,
        }
      default:
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
        }
    }
  }

  const tooltipPosition = getTooltipPosition()

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle}>
        {/* Spotlight effect */}
        <div
          style={{
            position: "absolute",
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            backgroundColor: "transparent",
            border: "3px solid #3b82f6",
            borderRadius: "8px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Tooltip */}
      <Card
        className="fixed z-[10000] w-80 shadow-lg"
        style={{
          top: Math.max(10, Math.min(tooltipPosition.top, window.innerHeight - 220)),
          left: Math.max(10, Math.min(tooltipPosition.left, window.innerWidth - 330)),
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={skipTour} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentStepData.content}</p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-2">
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

          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div key={index} className={`h-1 flex-1 rounded ${index <= currentStep ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
