"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"

export function TourOverlay() {
  const {
    tourActive,
    currentStep,
    tourMessage,
    highlightElementId,
    advanceTour,
    completeTour,
    nextButtonText,
    skipButtonText,
  } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const messageBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tourActive && highlightElementId) {
      const targetElement = document.getElementById(highlightElementId)
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect())
      } else {
        setTargetRect(null) // Clear rect if element not found
      }
    } else {
      setTargetRect(null)
    }
  }, [tourActive, highlightElementId, currentStep]) // Re-run when step changes

  if (!tourActive) {
    return null
  }

  // Calculate message box position
  let messageBoxStyle: React.CSSProperties = {}
  let messageBoxClasses = "absolute p-4 bg-white rounded-lg shadow-lg z-[10001] max-w-xs text-center"

  if (targetRect) {
    // Position message box relative to the highlighted element
    // Try to position below, if not enough space, then above
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - targetRect.bottom
    const spaceAbove = targetRect.top

    if (spaceBelow >= 150) {
      // Arbitrary space needed for message box
      messageBoxStyle = {
        top: targetRect.bottom + 20,
        left: targetRect.left + targetRect.width / 2,
        transform: "translateX(-50%)",
      }
    } else if (spaceAbove >= 150) {
      messageBoxStyle = {
        bottom: viewportHeight - targetRect.top + 20,
        left: targetRect.left + targetRect.width / 2,
        transform: "translateX(-50%)",
      }
    } else {
      // Fallback to center if not enough space above or below
      messageBoxStyle = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }
  } else {
    // Center message box if no highlight
    messageBoxStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }
    messageBoxClasses += " w-96 text-xl font-bold" // Larger text for central message
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-70 flex items-center justify-center">
      {targetRect && (
        <>
          {/* Highlighted area (hole in the overlay) */}
          <div
            className="absolute bg-white rounded-lg shadow-lg z-[10001] transition-all duration-300 ease-out"
            style={{
              top: targetRect.top - 8, // Add some padding
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)", // Creates the "hole" effect
            }}
          />
          {/* Pulsing border around the highlighted element */}
          <div
            className="absolute border-4 border-blue-500 rounded-lg z-[10002] animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </>
      )}

      <div ref={messageBoxRef} className={messageBoxClasses} style={messageBoxStyle}>
        <p className="mb-4">{tourMessage}</p>
        <div className="flex justify-center gap-2">
          <Button onClick={advanceTour}>{nextButtonText}</Button>
          <Button variant="outline" onClick={completeTour}>
            {skipButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
