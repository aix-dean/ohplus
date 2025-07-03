"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

export interface TourStep {
  id: string
  title: string
  content: string
  target: string
  placement?: "top" | "bottom" | "left" | "right"
  action?: () => void
  nextRoute?: string
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

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<TourStep[]>([])
  const router = useRouter()

  const startTour = useCallback((tourSteps: TourStep[]) => {
    setSteps(tourSteps)
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1
      const nextStepData = steps[nextStepIndex]

      if (nextStepData.nextRoute) {
        router.push(nextStepData.nextRoute)
      }

      if (nextStepData.action) {
        nextStepData.action()
      }

      setCurrentStep(nextStepIndex)
    } else {
      endTour()
    }
  }, [currentStep, steps, router])

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

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        nextStep,
        prevStep,
        endTour,
        skipTour,
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
