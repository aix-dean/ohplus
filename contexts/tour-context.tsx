"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onboardingTourSteps, type TourStep } from "@/lib/tour-steps"
import { useAuth } from "./auth-context"

interface TourContextType {
  currentStep: number | null
  startTour: (tourName: string) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  tourActive: boolean
  activeTourSteps: TourStep[]
  highlightElement: (elementId: string) => void
  clearHighlight: () => void
  highlightedElementId: string | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [tourActive, setTourActive] = useState(false)
  const [activeTourSteps, setActiveTourSteps] = useState<TourStep[]>([])
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { userData, updateUserData } = useAuth()

  const startTour = useCallback((tourName: string) => {
    if (tourName === "onboarding") {
      setActiveTourSteps(onboardingTourSteps)
      setCurrentStep(0)
      setTourActive(true)
      setHighlightedElementId(null) // Clear any previous highlight
    }
  }, [])

  const endTour = useCallback(async () => {
    setCurrentStep(null)
    setTourActive(false)
    setActiveTourSteps([])
    setHighlightedElementId(null)
    if (userData && !userData.has_completed_onboarding_tour) {
      await updateUserData({ has_completed_onboarding_tour: true } as any) // Mark tour as completed
    }
  }, [userData, updateUserData])

  const nextStep = useCallback(() => {
    if (currentStep !== null && currentStep < activeTourSteps.length - 1) {
      setCurrentStep((prev) => (prev !== null ? prev + 1 : null))
    } else {
      endTour()
    }
  }, [currentStep, activeTourSteps.length, endTour])

  const prevStep = useCallback(() => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep((prev) => (prev !== null ? prev - 1 : null))
    }
  }, [currentStep])

  const highlightElement = useCallback((elementId: string) => {
    setHighlightedElementId(elementId)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedElementId(null)
  }, [])

  useEffect(() => {
    if (tourActive && currentStep !== null) {
      const step = activeTourSteps[currentStep]
      if (step) {
        if (step.path && pathname !== step.path) {
          router.push(step.path)
        }
        setHighlightedElementId(step.targetId || null)
      }
    }
  }, [tourActive, currentStep, activeTourSteps, pathname, router])

  return (
    <TourContext.Provider
      value={{
        currentStep,
        startTour,
        nextStep,
        prevStep,
        endTour,
        tourActive,
        activeTourSteps,
        highlightElement,
        clearHighlight,
        highlightedElementId,
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
