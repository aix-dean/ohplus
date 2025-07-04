"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride" // Import Joyride and types

interface OnboardingTourProps {
  triggerTour: boolean // New prop to explicitly trigger the tour
}

export function OnboardingTour({ triggerTour }: OnboardingTourProps) {
  const router = useRouter()
  const [run, setRun] = useState(false) // Control Joyride's running state
  const [stepIndex, setStepIndex] = useState(0) // Current step index for Joyride
  const tourCompletedKey = "onboardingTourCompleted"

  // Define the tour steps
  const steps: Step[] = [
    {
      target: '[data-tour-id="inventory-link"]',
      content: "You're in! Let's get your company online. Set up your first billboard site — it's quick.",
      disableBeacon: true, // Don't show the beacon, start directly
      placement: "right",
      styles: {
        options: {
          zIndex: 9999,
        },
      },
    },
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Click here to add your first billboard site.",
      disableBeacon: true,
      placement: "bottom",
      styles: {
        options: {
          zIndex: 9999,
        },
      },
    },
  ]

  // Effect to trigger the tour based on the new prop
  useEffect(() => {
    if (triggerTour && !localStorage.getItem(tourCompletedKey)) {
      setRun(true) // Start Joyride
      setStepIndex(0) // Start from the first step
    }
  }, [triggerTour])

  // Joyride callback function to handle tour events
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, index, type } = data

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        // End the tour
        setRun(false)
        localStorage.setItem(tourCompletedKey, "true")
      } else if (type === "step:after") {
        // After a step, advance to the next one
        setStepIndex(index + 1)

        // If we just finished the first step, navigate to inventory page
        if (index === 0) {
          router.push("/admin/inventory")
        }
      }
    },
    [router],
  )

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous // Allow continuous progression
      showProgress // Show progress indicator (e.g., "1 of 2")
      showSkipButton // Allow skipping the tour
      callback={handleJoyrideCallback}
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
        tooltip: {
          backgroundColor: "white",
          color: "#333",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          fontSize: "16px",
        },
        buttonNext: {
          backgroundColor: "#2563eb", // Blue-600
          color: "white",
          borderRadius: "6px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#1d4ed8", // Blue-700
          },
        },
        buttonBack: {
          color: "#2563eb",
        },
        buttonSkip: {
          color: "#6b7280", // Gray-500
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        spotlight: {
          borderRadius: "12px", // Match rounded-xl
        },
      }}
    />
  )
}
