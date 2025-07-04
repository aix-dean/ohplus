"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { OnboardingTour } from "@/components/onboarding-tour"

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { userData } = useUser()
  const [startOnboardingTour, setStartOnboardingTour] = useState(false)

  useEffect(() => {
    const tourCompleted = localStorage.getItem("onboardingTourCompleted")
    if (!tourCompleted && userData?.email) {
      setStartOnboardingTour(true)
    }
  }, [userData])

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-56 h-full">
        {children}
        <OnboardingTour startTour={startOnboardingTour} />
      </main>
    </div>
  )
}

export default AdminLayout
