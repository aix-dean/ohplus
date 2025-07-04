"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { OnboardingTour } from "@/components/onboarding-tour"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [startOnboardingTour, setStartOnboardingTour] = useState(false)

  useEffect(() => {
    const tourCompleted = localStorage.getItem("onboardingTourCompleted")
    const shouldStartTourFlag = localStorage.getItem("shouldStartOnboardingTour")

    if (!tourCompleted && shouldStartTourFlag === "true") {
      setStartOnboardingTour(true)
      localStorage.removeItem("shouldStartOnboardingTour") // Clear the flag
    }
  }, [])

  return (
    <>
      {children}
      <OnboardingTour startTour={startOnboardingTour} />
    </>
  )
}
