"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector for the element to highlight
  placement?: "top" | "bottom" | "left" | "right" | "center"
  action?: () => void // Optional action to perform before moving to next step (e.g., navigation)
  isNavigationStep?: boolean // Indicates if this step involves navigation
}

interface TourContextType {
  currentStep: number | null
  tourSteps: TourStep[]
  startTour: (steps: TourStep[]) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  isTourActive: boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])
  const [isTourActive, setIsTourActive] = useState(false)
  const router = useRouter()
  const currentPathRef = useRef<string | null>(null)

  const startTour = useCallback((steps: TourStep[]) => {
    setTourSteps(steps)
    setCurrentStep(0)
    setIsTourActive(true)
    currentPathRef.current = window.location.pathname // Store initial path
  }, [])

  const endTour = useCallback(() => {
    setCurrentStep(null)
    setTourSteps([])
    setIsTourActive(false)
    currentPathRef.current = null
  }, [])

  const executeStepAction = useCallback(async (step: TourStep) => {
    if (step.action) {
      await step.action()
      // If it's a navigation step, wait for the route change to complete
      // before allowing the next step to be processed.
      if (step.isNavigationStep) {
        // We need to ensure the component re-renders with the new path
        // and the target element is available before proceeding.
        // This is a simplified approach; a more robust solution might
        // involve listening to router events or polling for the element.
        return new Promise((resolve) => {
          const checkPathInterval = setInterval(() => {
            if (window.location.pathname !== currentPathRef.current) {
              currentPathRef.current = window.location.pathname
              clearInterval(checkPathInterval)
              resolve(true)
            }
          }, 100) // Check every 100ms
        })
      }
    }
    return Promise.resolve(true)
  }, [])

  const nextStep = useCallback(async () => {
    if (currentStep !== null && currentStep < tourSteps.length - 1) {
      const nextIndex = currentStep + 1
      const nextStepData = tourSteps[nextIndex]

      // Execute action for the *next* step before moving to it
      await executeStepAction(nextStepData)

      setCurrentStep(nextIndex)
    } else {
      endTour()
    }
  }, [currentStep, tourSteps, endTour, executeStepAction])

  const prevStep = useCallback(() => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Handle route changes during tour
  useEffect(() => {
    const handleRouteChange = () => {
      if (isTourActive && currentPathRef.current !== window.location.pathname) {
        // If a navigation step just completed, the tour should continue.
        // If it's an unexpected navigation, end the tour.
        const currentStepData = tourSteps[currentStep || 0]
        if (!currentStepData || !currentStepData.isNavigationStep) {
          endTour()
        }
      }
    }

    router.events?.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events?.off("routeChangeComplete", handleRouteChange)
    }
  }, [isTourActive, currentStep, tourSteps, endTour, router])

  const value = React.useMemo(
    () => ({
      currentStep,
      tourSteps,
      startTour,
      nextStep,
      prevStep,
      endTour,
      isTourActive,
    }),
    [currentStep, tourSteps, startTour, nextStep, prevStep, endTour, isTourActive],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
