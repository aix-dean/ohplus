"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface OnboardingTourProps {
  shouldTriggerTour: boolean // New prop to explicitly trigger the tour
}

export function OnboardingTour({ shouldTriggerTour }: OnboardingTourProps) {
  const router = useRouter()
  const searchParams = useSearchParams() // Keep for potential future use or initial check if needed
  const [currentStep, setCurrentStep] = useState(0) // 0: inactive, 1: highlight inventory, 2: highlight add site
  const [showTour, setShowTour] = useState(false)
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [messagePosition, setMessagePosition] = useState<{ top: number; left: number } | null>(null)
  const tourMessage = "You're in! Let's get your company online. Set up your first billboard site — it's quick."
  const tourCompletedKey = "onboardingTourCompleted"

  const calculateHighlightPosition = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      const rect = element.getBoundingClientRect()
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })

      const messageWidth = 300
      const messageHeight = 200

      let top = rect.top
      let left = rect.right + 20

      if (left + messageWidth > window.innerWidth) {
        left = rect.left - messageWidth - 20
        if (left < 0) {
          left = rect.left
          top = rect.bottom + 20
        }
      }
      if (top + messageHeight > window.innerHeight) {
        top = window.innerHeight - messageHeight - 20
      }
      if (top < 0) {
        top = 20
      }

      setMessagePosition({ top, left })
    } else {
      setHighlightRect(null)
      setMessagePosition(null)
    }
  }, [])

  // Effect to trigger the tour based on the new prop
  useEffect(() => {
    if (shouldTriggerTour && !localStorage.getItem(tourCompletedKey)) {
      setShowTour(true)
      setCurrentStep(1)
      // No need to remove query param here, as it's not the primary trigger anymore
    }
  }, [shouldTriggerTour])

  // Handle step changes and highlight positioning
  useEffect(() => {
    if (!showTour || currentStep === 0) return

    const handleStep = () => {
      if (currentStep === 1) {
        calculateHighlightPosition('[data-tour-id="inventory-link"]')
      } else if (currentStep === 2) {
        setTimeout(() => {
          calculateHighlightPosition('[data-tour-id="add-site-card"]')
        }, 100)
      }
    }

    window.addEventListener("resize", handleStep)
    handleStep()

    return () => {
      window.removeEventListener("resize", handleStep)
    }
  }, [currentStep, showTour, calculateHighlightPosition])

  const handleNext = () => {
    if (currentStep === 1) {
      router.push("/admin/inventory")
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setShowTour(false)
      localStorage.setItem(tourCompletedKey, "true")
      setCurrentStep(0)
      // Clean up any remaining 'startTour' param if it somehow persisted (fallback)
      const newUrl = new URL(window.location.href)
      if (newUrl.searchParams.has("startTour")) {
        newUrl.searchParams.delete("startTour")
        router.replace(newUrl.toString(), undefined, { shallow: true })
      }
    }
  }

  if (!showTour || !highlightRect || !messagePosition) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-none">
      <div
        className="absolute rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-auto"
        style={{
          top: highlightRect.top,
          left: highlightRect.left,
          width: highlightRect.width,
          height: highlightRect.height,
          background: "white",
          zIndex: 1,
        }}
      >
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20from%202025-07-03%2011-34-01-3CcuqvZ5BVvYJTrYajhdOvCFebs9ln.png"
          alt="Cursor"
          width={40}
          height={40}
          className="absolute -bottom-8 -right-8 animate-bounce"
          style={{ transform: "rotate(20deg)" }}
        />
      </div>

      <div
        className="absolute bg-white p-6 rounded-lg shadow-xl text-center max-w-sm pointer-events-auto"
        style={{
          top: messagePosition.top,
          left: messagePosition.left,
          zIndex: 2,
        }}
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-2">You're in!</h2>
        <p className="text-lg text-gray-800 mb-6">
          Let's get your company online. Set up your first billboard site — it's quick.
        </p>
        <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {currentStep === 1 ? "Next" : "Done"}
        </Button>
      </div>
    </div>
  )
}
