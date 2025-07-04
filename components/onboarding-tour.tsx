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

  const steps: Step[] = [
    {
      target: '[data-tour-id="inventory-link"]',
      content: "You're in! Let's get your company online. Set up your first billboard site — it's quick.",
      disableBeacon: true,
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
      // Add a small delay to ensure the dialog is closed and DOM is ready
      const timer = setTimeout(() => {
        setRun(true)
        setStepIndex(0)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [triggerTour])

  // Joyride callback function to handle tour events
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, index, type, action } = data

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRun(false)
        localStorage.setItem(tourCompletedKey, "true")
        setStepIndex(0)
      } else if (action === "next" && index === 0) {
        // When user clicks "Next" on the first step, navigate to inventory
        router.push("/admin/inventory")
        // Small delay to allow navigation to complete before showing next step
        setTimeout(() => {
          setStepIndex(1)
        }, 500)
      } else if (type === "step:after" && index > 0) {
        setStepIndex(index + 1)
      }
    },
    [router],
  )

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      stepIndex={stepIndex}
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
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "6px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#2563eb",
        },
        buttonSkip: {
          color: "#6b7280",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        spotlight: {
          borderRadius: "12px",
        },
      }}
    />
  )
}
