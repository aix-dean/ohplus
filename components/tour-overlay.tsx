"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useTour } from "@/contexts/tour-context"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function TourOverlay() {
  const { tourActive, highlightElementId, tourMessage, nextStep, currentStep } = useTour()
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const messageBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tourActive && highlightElementId) {
      const element = document.getElementById(highlightElementId)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightRect(rect)

        // Scroll element into view if it's not fully visible
        element.scrollIntoView({ behavior: "smooth", block: "center" })

        // Adjust message box position if it overlaps with the highlight
        if (messageBoxRef.current) {
          const messageRect = messageBoxRef.current.getBoundingClientRect()
          if (rect.top < messageRect.bottom && rect.bottom > messageRect.top) {
            // If overlap, try to position message box below the highlight
            messageBoxRef.current.style.top = `${rect.bottom + 20}px`
            messageBoxRef.current.style.left = `${rect.left}px`
          } else {
            // Default position (center of screen or near highlight)
            messageBoxRef.current.style.top = "50%"
            messageBoxRef.current.style.left = "50%"
            messageBoxRef.current.style.transform = "translate(-50%, -50%)"
          }
        }
      } else {
        // If element not found, log error
        console.warn(`Tour: Element with ID "${highlightElementId}" not found.`)
      }
    } else {
      setHighlightRect(null)
    }
  }, [tourActive, highlightElementId])

  if (!tourActive || !highlightRect) {
    return null
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 9998,
    pointerEvents: "auto", // Allow clicks on the overlay
  }

  const highlightStyle: React.CSSProperties = {
    position: "absolute",
    top: highlightRect.top,
    left: highlightRect.left,
    width: highlightRect.width,
    height: highlightRect.height,
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)", // This creates the cutout effect
    borderRadius: "0.75rem", // Tailwind's rounded-xl
    zIndex: 9999,
    pointerEvents: "none", // Don't block clicks on the highlighted element
  }

  const messageBoxStyle: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "white",
    padding: "1.5rem", // p-6
    borderRadius: "0.75rem", // rounded-xl
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // shadow-lg
    zIndex: 10000,
    maxWidth: "300px",
    textAlign: "center",
    color: "#1f2937", // text-gray-900
    top: highlightRect.top + highlightRect.height / 2, // Initial position near highlight
    left: highlightRect.left + highlightRect.width + 20, // To the right of highlight
    transform: "translateY(-50%)", // Center vertically
  }

  // Adjust message box position if it goes off screen
  if (highlightRect.left + highlightRect.width + 300 + 20 > window.innerWidth) {
    // If message box goes off right
    messageBoxStyle.left = highlightRect.left - 300 - 20 // Position to the left
  }
  if (messageBoxStyle.left < 0 || messageBoxStyle.left + 300 > window.innerWidth) {
    // If it goes off left or still too wide
    messageBoxStyle.left = "50%"
    messageBoxStyle.transform = "translate(-50%, -50%)"
    messageBoxStyle.top = highlightRect.bottom + 20 // Position below
    if (messageBoxStyle.top + messageBoxRef.current?.offsetHeight > window.innerHeight) {
      // If it goes off bottom
      messageBoxStyle.top = highlightRect.top - (messageBoxRef.current?.offsetHeight || 0) - 20 // Position above
    }
  }

  const cursorStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 10001,
    width: "40px", // Adjust size as needed
    height: "40px",
    pointerEvents: "none", // Cursor image should not block clicks
    animation: "click-animation 1s infinite", // Add a simple click animation
  }

  // Position the cursor near the highlighted element
  if (highlightRect) {
    cursorStyle.top = highlightRect.top + highlightRect.height / 2 - 20 // Center vertically
    cursorStyle.left = highlightRect.left + highlightRect.width / 2 - 20 // Center horizontally
  }

  return (
    <div style={overlayStyle}>
      <style jsx global>{`
        @keyframes click-animation {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={highlightStyle}></div>
      <div ref={messageBoxRef} style={messageBoxStyle}>
        <p className="text-lg font-semibold mb-4">{tourMessage}</p>
        <Button onClick={nextStep} className="w-full">
          {currentStep === 1 ? "Next" : "Got it!"}
        </Button>
      </div>
      <Image src="/cursor.png" alt="Cursor" width={40} height={40} style={cursorStyle} />
    </div>
  )
}
