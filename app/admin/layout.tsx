"use client"

import type React from "react"
// OnboardingTour import removed as it's now handled in app/layout.tsx

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Logic related to startOnboardingTour removed as it's now handled in app/layout.tsx
  return <>{children}</>
}
