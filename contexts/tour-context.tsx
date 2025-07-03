"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface TourStep {
  id: string
  target: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
  action?: () => void | Promise<void>
}

interface TourContextType {
  isActive: boolean
  currentStep: number
  steps: TourStep[]
  startTour: (steps: TourStep[]) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  skipTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<TourStep[]>([])

  const startTour = useCallback((tourSteps: TourStep[]) => {
    setSteps(tourSteps)
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1
      const nextStepData = steps[nextStepIndex]

      // Execute any action associated with the current step
      if (nextStepData.action) {
        await nextStepData.action()
      }

      setCurrentStep(nextStepIndex)
    } else {
      endTour()
    }
  }, [currentStep, steps])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
    setSteps([])
  }, [])

  const skipTour = useCallback(() => {
    endTour()
  }, [endTour])

  const value = {
    isActive,
    currentStep,
    steps,
    startTour,
    nextStep,
    prevStep,
    endTour,
    skipTour,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
