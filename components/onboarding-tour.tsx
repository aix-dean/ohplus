"use client"

import { useState, useEffect } from "react"
import Joyride, { STATUS, EVENTS, ACTIONS, type Step, type CallBackProps } from "react-joyride"

interface OnboardingTourProps {
  steps: Step[]
  run?: boolean
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingTour({ steps, run = true, onComplete, onSkip }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    if (run) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        setRunTour(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [run])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false)
      if (status === STATUS.FINISHED && onComplete) {
        onComplete()
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip()
      }
    }

    // Handle close button click
    if (action === ACTIONS.CLOSE || type === EVENTS.TARGET_NOT_FOUND) {
      setRunTour(false)
      if (onSkip) {
        onSkip()
      }
    }
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
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
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          fontSize: 14,
          padding: 20,
          maxWidth: 400,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          color: "#3b82f6",
          marginBottom: 8,
        },
        tooltipContent: {
          lineHeight: 1.5,
          color: "#6b7280",
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#6b7280",
          fontSize: 14,
          marginRight: 8,
        },
        buttonSkip: {
          color: "#9ca3af",
          fontSize: 14,
        },
        buttonClose: {
          display: "block",
          position: "absolute",
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 18,
          color: "#9ca3af",
        },
      }}
    />
  )
}

// Dashboard tour steps
const dashboardSteps: Step[] = [
  {
    target: '[data-tour-id="inventory-link"]',
    content:
      "Step 1: You're in! Let's get your company online. Set up your first billboard site — it's quick. Click on Inventory to get started.",
    disableBeacon: true,
    placement: "right",
    title: "Welcome to OH!Plus",
  },
  {
    target: '[data-tour-id="sales-link"]',
    content:
      "Step 2: Once you have inventory, you can start creating proposals and managing client relationships here.",
    placement: "right",
    title: "Sales Management",
  },
  {
    target: '[data-tour-id="logistics-link"]',
    content: "Step 3: Monitor and manage your billboard sites, track maintenance, and oversee operations.",
    placement: "right",
    title: "Site Operations",
  },
]

// Onboarding tour for dashboard
export function DashboardOnboardingTour({ onComplete }: { onComplete?: () => void }) {
  return <OnboardingTour steps={dashboardSteps} onComplete={onComplete} onSkip={onComplete} />
}
