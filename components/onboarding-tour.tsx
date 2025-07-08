"use client"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

interface OnboardingTourProps {
  shouldRun: boolean
  onComplete: () => void
}

export function OnboardingTour({ shouldRun, onComplete }: OnboardingTourProps) {
  const steps: Step[] = [
    {
      target: '[data-tour="inventory-button"]',
      content: "You're in! Let's get your company online. Set up your first billboard site — it's quick.",
      placement: "right",
      disableBeacon: true,
    },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      onComplete()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={shouldRun}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          zIndex: 10000,
        },
      }}
    />
  )
}
