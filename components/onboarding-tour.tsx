"use client"

import { useState, useEffect } from "react"
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
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${user?.uid}`)

    if (!hasCompletedOnboarding && user) {
      // Start the tour after a short delay
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [user])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Mark onboarding as completed
      if (user?.uid) {
        localStorage.setItem(`onboarding-completed-${user.uid}`, "true")
      }
      setRun(false)
      setStepIndex(0)
    } else if (type === "step:after") {
      setStepIndex(index + 1)
    }

    // Handle close button click
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || type === "overlay:click") {
      if (user?.uid) {
        localStorage.setItem(`onboarding-completed-${user.uid}`, "true")
      }
      setRun(false)
      setStepIndex(0)
    }
  }

  if (!user) return null

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={run}
      stepIndex={stepIndex}
      steps={dashboardSteps}
      hideCloseButton={false}
      scrollToFirstStep={true}
      showProgress={false}
      showSkipButton={true}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
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
          padding: 20,
        },
        tooltipTitle: {
          color: "#3b82f6",
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "10px",
        },
        tooltipContent: {
          fontSize: "14px",
          lineHeight: "1.5",
          padding: "10px 0",
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "500",
          padding: "8px 16px",
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "500",
        },
        buttonClose: {
          color: "#6b7280",
          fontSize: "16px",
          fontWeight: "bold",
          position: "absolute",
          right: "10px",
          top: "10px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
      locale={{
        back: "Back",
        close: "×",
        last: "Finish Tour",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  )
}
