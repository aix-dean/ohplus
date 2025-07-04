"use client"

import type React from "react"
// Removed OnboardingTour import and related state/effect as it's now in root layout

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed startOnboardingTour state and useEffect
  return <>{children}</>
}
