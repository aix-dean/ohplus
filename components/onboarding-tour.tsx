"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, ACTIONS } from "react-joyride"

interface OnboardingTourProps {
  triggerTour: boolean // New prop to explicitly trigger the tour
}

export function OnboardingTour({ triggerTour }: OnboardingTourProps) {
  const router = useRouter()
  const [runTour, setRunTour] = useState(false)
  const [stepIndex, setStepIndex] = useState(0) // To control which step is active
  const tourCompletedKey = "onboardingTourCompleted"

  const steps = [
    {
      target: '[data-tour-id="inventory-link"]',
      content:
        "You're in! Let's get your company online. First, navigate to the Inventory section to manage your sites.",
      placement: "right" as const,
      disableBeacon: true, // Start the tour immediately without a pulsing dot
      styles: {
        options: {
          zIndex: 10000, // Ensure it's above other elements
        },
      },
    },
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Great! Now, click here to add your first billboard site. It's quick and easy!",
      placement: "bottom" as const,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
  ]

  // Effect to trigger the tour based on the new prop
  useEffect(() => {
    if (triggerTour && !localStorage.getItem(tourCompletedKey)) {
      setRunTour(true)
      setStepIndex(0) // Start from the first step
    }
  }, [triggerTour])

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index } = data

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRunTour(false)
        localStorage.setItem(tourCompletedKey, "true")
        setStepIndex(0) // Reset step index
      } else if (action === ACTIONS.NEXT) {
        if (index === 0) {
          // After the first step (Inventory link), navigate to the Inventory page
          router.push("/admin/inventory")
        }
        setStepIndex(index + 1) // Advance to the next step
      }
    },
    [router],
  )

  return (
    <Joyride
      run={runTour}
      steps={steps}
      callback={handleJoyrideCallback}
      continuous // Allows moving through steps with a "Next" button
      showSkipButton
      showProgress
      stepIndex={stepIndex} // Control the current step
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip Tour",
      }}
      styles={{
        options: {
          zIndex: 9999,
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        tooltip: {
          backgroundColor: "white",
          color: "#333",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        },
        buttonNext: {
          backgroundColor: "#2563eb", // Blue-600
          color: "white",
          borderRadius: "4px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#1d4ed8", // Blue-700
          },
        },
        buttonBack: {
          color: "#333",
          borderRadius: "4px",
          padding: "8px 16px",
          border: "1px solid #ccc",
          marginRight: "10px",
        },
        buttonSkip: {
          color: "#666",
          fontSize: "14px",
        },
      }}
    />
  )
}
