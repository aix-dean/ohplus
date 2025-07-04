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
    if (!tourCompleted) {
      setStartOnboardingTour(true)
    }
  }, [])

  return (
    <>
      {children}
      <OnboardingTour startTour={startOnboardingTour} />
    </>
  )
}
