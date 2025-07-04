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
    const tourTriggered = localStorage.getItem("onboardingTourTriggered")

    if (!tourCompleted && tourTriggered === "true") {
      console.log("AdminLayout: Onboarding tour triggered from registration.")
      setStartOnboardingTour(true)
      localStorage.removeItem("onboardingTourTriggered") // Consume the flag
    } else if (tourCompleted) {
      console.log("AdminLayout: Onboarding tour already completed.")
      setStartOnboardingTour(false)
    } else {
      console.log("AdminLayout: Onboarding tour not triggered or completed.")
      setStartOnboardingTour(false)
    }
  }, [])

  return (
    <>
      {children}
      <OnboardingTour startTour={startOnboardingTour} />
    </>
  )
}
