"use client"
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface TourContextType {
  tourActive: boolean
  currentStep: number
  startTour: () => void
  nextStep: () => void
  endTour: () => void
  highlightElementId: string | null
  tourMessage: string | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive, setTourActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: inactive, 1: highlight inventory, 2: highlight add site
  const [highlightElementId, setHighlightElementId] = useState<string | null>(null)
  const [tourMessage, setTourMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const startTour = useCallback(() => {
    setTourActive(true)
    setCurrentStep(1)
    setHighlightElementId("tour-inventory-link")
    setTourMessage("You're in! Let's get your company online. Set up your first billboard site — it's quick.")
    // Remove the 'registered' query parameter after starting the tour
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("registered")
    router.replace(`/admin/dashboard?${newSearchParams.toString()}`)
  }, [router, searchParams])

  const endTour = useCallback(() => {
    setTourActive(false)
    setCurrentStep(0)
    setHighlightElementId(null)
    setTourMessage(null)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      setCurrentStep(2)
      setHighlightElementId("tour-add-site-card")
      setTourMessage("Click here to add your first billboard site.")
      router.push("/admin/inventory") // Navigate to inventory page
    } else if (currentStep === 2) {
      endTour()
    }
  }, [currentStep, router, endTour])

  // Check for 'registered=true' on initial load in the dashboard
  useEffect(() => {
    if (searchParams.get("registered") === "true" && !tourActive) {
      startTour()
    }
  }, [searchParams, tourActive, startTour])

  return (
    <TourContext.Provider
      value={{ tourActive, currentStep, startTour, nextStep, endTour, highlightElementId, tourMessage }}
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
