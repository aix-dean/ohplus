"use client"

import type React from "react"
// Removed OnboardingTour import and related state/effect

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  // Removed startOnboardingTour state and useEffect
  return <>{children}</>
}

export default AdminLayout
