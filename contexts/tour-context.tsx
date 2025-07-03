"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { tourSteps, type TourStep } from "@/lib/tour-steps"

interface TourContextType {
  currentStep: number | null
  startTour: (initialStep?: number) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  activeStep: TourStep | null
  isTourActive: boolean
  highlightElement: (selector: string) => void
  clearHighlight: () => void
  highlightedElement: HTMLElement | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null)
  const [isTourActive, setIsTourActive] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const initialPathRef = useRef<string | null>(null)

  const activeStep = currentStepIndex !== null ? tourSteps[currentStepIndex] : null

  const startTour = useCallback(
    (initialStep = 0) => {
      setIsTourActive(true)
      setCurrentStepIndex(initialStep)
      initialPathRef.current = pathname // Store the path where the tour started
    },
    [pathname],
  )

  const endTour = useCallback(() => {
    setIsTourActive(false)
    setCurrentStepIndex(null)
    setHighlightedElement(null)
    initialPathRef.current = null
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex !== null && currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex((prev) => (prev !== null ? prev + 1 : null))
    } else {
      endTour()
    }
  }, [currentStepIndex, endTour])

  const prevStep = useCallback(() => {
    if (currentStepIndex !== null && currentStepIndex > 0) {
      setCurrentStepIndex((prev) => (prev !== null ? prev - 1 : null))
    }
  }, [currentStepIndex])

  const highlightElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    setHighlightedElement(element)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedElement(null)
  }, [])

  useEffect(() => {
    if (isTourActive && activeStep) {
      // If the step has a path, navigate to it
      if (activeStep.path && pathname !== activeStep.path) {
        router.push(activeStep.path)
      } else {
        // If already on the correct path or no path specified, highlight the element
        if (activeStep.selector) {
          highlightElement(activeStep.selector)
        } else {
          clearHighlight()
        }
      }
    } else {
      clearHighlight()
    }
  }, [isTourActive, activeStep, pathname, router, highlightElement, clearHighlight])

  // Effect to handle navigation during the tour
  useEffect(() => {
    if (isTourActive && activeStep && pathname !== activeStep.path) {
      // If the user navigates away from the expected path for the current step,
      // either end the tour or try to find the step that matches the new path.
      // For simplicity, let's end the tour if they navigate off-path.
      // A more complex implementation might try to resume or find a matching step.
      if (
        initialPathRef.current &&
        pathname !== initialPathRef.current &&
        !tourSteps.some((step) => step.path === pathname)
      ) {
        // Only end tour if they navigate completely off the tour's intended paths
        // This prevents ending the tour if the step itself causes a navigation
        // For now, let's assume the tour steps handle navigation.
      }
    }
  }, [pathname, isTourActive, activeStep, initialPathRef])

  return (
    <TourContext.Provider
      value={{
        currentStep: currentStepIndex,
        startTour,
        nextStep,
        prevStep,
        endTour,
        activeStep,
        isTourActive,
        highlightElement,
        clearHighlight,
        highlightedElement,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
