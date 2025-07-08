"use client"

import { useEffect, useState } from "react"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

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
  const { user } = useAuth()
  const pathname = usePathname()
  const [runTour, setRunTour] = useState(false)
  const [tourKey, setTourKey] = useState(0)

  useEffect(() => {
    if (user && pathname === "/admin/dashboard") {
      const hasSeenTour = localStorage.getItem(`onboarding-tour-${user.uid}`)
      if (!hasSeenTour) {
        setRunTour(true)
      }
    }
  }, [user, pathname])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === "close") {
      setRunTour(false)
      if (user) {
        localStorage.setItem(`onboarding-tour-${user.uid}`, "true")
      }
    }
  }

  if (!runTour || !user) {
    return null
  }

  return (
    <Joyride
      key={tourKey}
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
          lineHeight: 1.5,
          marginBottom: 15,
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 500,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#6b7280",
          fontSize: 14,
          marginRight: 10,
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: 14,
        },
        buttonClose: {
          color: "#6b7280",
          fontSize: 18,
          height: 24,
          width: 24,
          position: "absolute",
          right: 8,
          top: 8,
        },
      }}
    />
  )
}
