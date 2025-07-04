"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { OnboardingTour } from "@/components/onboarding-tour"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [startTour, setStartTour] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Check if user should see onboarding tour
    const tourCompleted = localStorage.getItem("onboardingTourCompleted")
    if (!tourCompleted && user) {
      setStartTour(true)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <OnboardingTour startTour={startTour} />
    </div>
  )
}
