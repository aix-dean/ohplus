"use client" // This layout needs to be a client component to use localStorage and useState

import type React from "react"

import { useState, useEffect } from "react"
import { OnboardingTour } from "@/components/onboarding-tour"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [shouldStartTour, setShouldStartTour] = useState(false)

  useEffect(() => {
    // Check localStorage for the tour flag when the component mounts
    const tourFlag = localStorage.getItem("shouldStartOnboardingTour")
    if (tourFlag === "true") {
      setShouldStartTour(true)
      // Clear the flag immediately so the tour doesn't start on subsequent visits
      localStorage.removeItem("shouldStartOnboardingTour")
    }
  }, []) // Run only once on mount

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SideNavigation />
      <div className="flex flex-col">
        <FixedHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
      </div>
      {/* Pass the dynamic shouldStartTour prop to OnboardingTour */}
      <OnboardingTour startTour={shouldStartTour} />
    </div>
  )
}
