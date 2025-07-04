"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

interface OnboardingTourProps {
  triggerTour: boolean
}

export function OnboardingTour({ triggerTour }: OnboardingTourProps) {
  const router = useRouter()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const tourCompletedKey = "onboardingTourCompleted"

  // Define the tour steps
  const steps: Step[] = [
    {
      target: '[data-tour-id="inventory-link"]',
      content: "You're in! Let's get your company online. Set up your first billboard site — it's quick.",
      disableBeacon: true,
      placement: "right",
      title: "Welcome to OH!Plus",
    },
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Click here to add your first billboard site and get started with your inventory management.",
      disableBeacon: true,
      placement: "bottom",
      title: "Add Your First Site",
    },
  ]

  // Start tour when triggerTour becomes true
  useEffect(() => {
    if (triggerTour && !localStorage.getItem(tourCompletedKey)) {
      // Small delay to ensure DOM is ready after dialog closes
      const timer = setTimeout(() => {
        setRun(true)
        setStepIndex(0)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [triggerTour])

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, index, action, type } = data

      // Tour finished or skipped
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRun(false)
        setStepIndex(0)
        localStorage.setItem(tourCompletedKey, "true")
        return
      }

      // Handle step progression
      if (action === "next") {
        if (index === 0) {
          // After first step, navigate to inventory page
          router.push("/admin/inventory")
          // Wait for navigation then show next step
          setTimeout(() => {
            setStepIndex(1)
          }, 600)
        } else {
          setStepIndex(index + 1)
        }
      } else if (action === "prev") {
        if (index === 1) {
          // Going back from inventory to dashboard
          router.push("/admin/dashboard")
          setTimeout(() => {
            setStepIndex(0)
          }, 600)
        } else {
          setStepIndex(index - 1)
        }
      }
    },
    [router],
  )

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={true}
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish Tour",
        next: "Next",
        skip: "Skip Tour",
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#2563eb",
        },
        tooltip: {
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          color: "#1f2937",
          fontSize: "16px",
          padding: "24px",
          textAlign: "left",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        },
        tooltipTitle: {
          color: "#2563eb",
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "16px",
          lineHeight: "1.5",
          marginBottom: "16px",
        },
        buttonNext: {
          backgroundColor: "#2563eb",
          borderRadius: "8px",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "500",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
        },
        buttonBack: {
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "500",
          marginRight: "12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        },
        buttonSkip: {
          color: "#9ca3af",
          fontSize: "14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
        spotlight: {
          borderRadius: "12px",
          border: "3px solid #2563eb",
        },
        beacon: {
          backgroundColor: "#2563eb",
        },
      }}
    />
  )
}
