"use client"

import { useEffect, useState } from "react"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"
import { useAuth } from "@/contexts/auth-context"

const dashboardSteps: Step[] = [
  {
    target: '[data-tour-id="inventory-link"]',
    content:
      "Step 1: You're in! Let's get your company online. Set up your first billboard site — it's quick. Click on Inventory to get started.",
    disableBeacon: true,
    placement: "right",
    title: "Welcome to OH!Plus",
  },
]

export function OnboardingTour() {
  const [runTour, setRunTour] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is new and hasn't seen the tour
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour")
    if (user && !hasSeenTour) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRunTour(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === "close") {
      setRunTour(false)
      localStorage.setItem("hasSeenOnboardingTour", "true")
    }
  }

  if (!user || !runTour) return null

  return (
    <Joyride
      steps={dashboardSteps}
      run={runTour}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          textColor: "#374151",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.4)",
          arrowColor: "#ffffff",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          fontSize: 14,
          padding: 20,
        },
        tooltipTitle: {
          color: "#3b82f6",
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 10,
        },
        tooltipContent: {
          color: "#6b7280",
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 500,
          padding: "8px 16px",
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: 14,
        },
        buttonClose: {
          color: "#9ca3af",
          fontSize: 16,
          fontWeight: "bold",
          position: "absolute",
          right: 10,
          top: 10,
          width: 20,
          height: 20,
        },
      }}
    />
  )
}
