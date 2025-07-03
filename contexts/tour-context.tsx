"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface TourState {
  tourActive: boolean
  currentStep: number
  tourMessage: string
  highlightElementId: string | null
  nextButtonText: string
  skipButtonText: string
}

interface TourContextType extends TourState {
  setTourState: (state: Partial<TourState>) => void
  advanceTour: () => void
  completeTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [tourState, setTourState] = useState<TourState>({
    tourActive: false,
    currentStep: 0,
    tourMessage: "",
    highlightElementId: null,
    nextButtonText: "Next",
    skipButtonText: "Skip Tour",
  })

  const advanceTour = useCallback(() => {
    setTourState((prev) => {
      const nextStep = prev.currentStep + 1
      return { ...prev, currentStep: nextStep }
    })
  }, [])

  const completeTour = useCallback(() => {
    setTourState({
      tourActive: false,
      currentStep: 0,
      tourMessage: "",
      highlightElementId: null,
      nextButtonText: "Next",
      skipButtonText: "Skip Tour",
    })
    localStorage.setItem("tourCompleted", "true")
    // Clean up URL if tour is completed
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("registered")
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  useEffect(() => {
    const registeredParam = searchParams.get("registered")
    const tourCompleted = localStorage.getItem("tourCompleted")

    if (registeredParam === "true" && !tourCompleted) {
      setTourState((prev) => ({
        ...prev,
        tourActive: true,
        currentStep: 1, // Start tour at step 1
      }))
      // Remove the 'registered' query parameter after starting the tour
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("registered")
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
    }
  }, [searchParams, pathname, router])

  useEffect(() => {
    if (!tourState.tourActive) return

    switch (tourState.currentStep) {
      case 1:
        // Step 1: Welcome message on Dashboard
        if (pathname !== "/admin/dashboard") {
          router.push("/admin/dashboard")
        }
        setTourState((prev) => ({
          ...prev,
          tourMessage: "You're in! Let's get your company online. Set up your first billboard site — it's quick.",
          highlightElementId: null, // No specific highlight for this step
          nextButtonText: "Next",
        }))
        break
      case 2:
        // Step 2: Highlight Inventory in side nav
        if (pathname !== "/admin/dashboard") {
          router.push("/admin/dashboard")
        }
        setTourState((prev) => ({
          ...prev,
          tourMessage: 'Now, let\'s add your first site. Click on "Inventory" in the side navigation.',
          highlightElementId: "tour-inventory-link",
          nextButtonText: "Go to Inventory", // Change button text to guide user
        }))
        break
      case 3:
        // Step 3: Highlight Add Site button on Inventory page
        if (pathname !== "/admin/inventory") {
          router.push("/admin/inventory")
        }
        setTourState((prev) => ({
          ...prev,
          tourMessage: "Great! Click here to add your first billboard site.",
          highlightElementId: "tour-add-site-button",
          nextButtonText: "Finish Tour",
        }))
        break
      default:
        completeTour() // End tour if no more steps
        break
    }
  }, [tourState.currentStep, tourState.tourActive, pathname, router, completeTour])

  const value = {
    ...tourState,
    setTourState: (updates: Partial<TourState>) => setTourState((prev) => ({ ...prev, ...updates })),
    advanceTour,
    completeTour,
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
