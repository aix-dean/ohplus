"use client"

import { useState, useEffect } from "react"
import Joyride, { type CallBackProps, STATUS, ACTIONS } from "react-joyride"
import { useRouter } from "next/navigation"

export function OnboardingTour({ triggerTour }: { triggerTour: boolean }) {
  const router = useRouter()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState([
    {
      target: '[data-tour-id="inventory-link"]',
      content:
        "You're in! Let's get your company online. First, navigate to the Inventory section to manage your sites.",
      placement: "right" as const,
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Great! Now, click here to add your first billboard site. It's quick and easy!",
      placement: "bottom" as const,
      disableBeacon: true,
      spotlightClicks: true,
    },
  ])

  useEffect(() => {
    const tourCompletedKey = "onboardingTourCompleted"
    const tourCompleted = localStorage.getItem(tourCompletedKey)

    if (triggerTour && !tourCompleted) {
      setRun(true)
    } else if (tourCompleted) {
      setRun(false) // Ensure tour doesn't run if already completed
    }
  }, [triggerTour])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index } = data
    const tourCompletedKey = "onboardingTourCompleted"

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      localStorage.setItem(tourCompletedKey, "true")
    } else if (action === ACTIONS.NEXT && index === 0) {
      // After the first step (Inventory link), navigate to the inventory page
      router.push("/admin/inventory")
    }
  }

  return (
    <Joyride
      run={run}
      steps={steps}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
    />
  )
}
