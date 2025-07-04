"use client"

import { useState, useEffect } from "react"
import Joyride, { type CallBackProps, STATUS, EVENTS } from "react-joyride"
import { useRouter, usePathname } from "next/navigation"

interface OnboardingTourProps {
  startTour: boolean
}

export function OnboardingTour({ startTour }: OnboardingTourProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // Dashboard steps
  const dashboardSteps = [
    {
      target: '[data-tour-id="inventory-link"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Welcome to OH!Plus</h3>
          <p>
            You're in! Let's get your company online. Set up your first billboard site — it's quick. Click on Inventory
            to get started.
          </p>
        </div>
      ),
      placement: "right" as const,
      disableBeacon: true,
    },
  ]

  // Inventory steps
  const inventorySteps = [
    {
      target: '[data-tour-id="add-site-card"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Your First Site</h3>
          <p>Click here to add your first billboard site and get started with your inventory management.</p>
        </div>
      ),
      placement: "top" as const,
      disableBeacon: true,
    },
  ]

  // Determine which steps to use based on current page
  const getCurrentSteps = () => {
    if (pathname === "/admin/dashboard") {
      return dashboardSteps
    } else if (pathname === "/admin/inventory") {
      return inventorySteps
    }
    return []
  }

  const steps = getCurrentSteps()

  useEffect(() => {
    if (startTour) {
      const tourCompleted = localStorage.getItem("onboardingTourCompleted")
      if (!tourCompleted) {
        if (pathname === "/admin/dashboard") {
          console.log("OnboardingTour: Starting tour on dashboard")
          setRun(true)
          setStepIndex(0)
        } else if (pathname === "/admin/inventory") {
          // Check if we should continue tour on inventory page
          const tourShouldContinue = localStorage.getItem("tourShouldContinue")
          if (tourShouldContinue === "true") {
            console.log("OnboardingTour: Continuing tour on inventory page")
            localStorage.removeItem("tourShouldContinue")

            // Wait for the page to load and find the target element
            const waitForElement = () => {
              const element = document.querySelector('[data-tour-id="add-site-card"]')
              if (element) {
                console.log("OnboardingTour: Found add-site-card element, starting inventory tour")
                setRun(true)
                setStepIndex(0)
              } else {
                console.log("OnboardingTour: Waiting for add-site-card element...")
                setTimeout(waitForElement, 500)
              }
            }

            setTimeout(waitForElement, 1000)
          }
        }
      }
    }
  }, [startTour, pathname])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data
    console.log("OnboardingTour: Joyride callback", { status, type, index, pathname })

    if (type === EVENTS.STEP_AFTER) {
      if (pathname === "/admin/dashboard" && index === 0) {
        // User completed dashboard step, navigate to inventory
        console.log("OnboardingTour: Navigating to inventory")
        localStorage.setItem("tourShouldContinue", "true")
        setRun(false)
        router.push("/admin/inventory")
      } else if (pathname === "/admin/inventory" && index === 0) {
        // User completed inventory step, finish tour
        console.log("OnboardingTour: Finishing tour")
        localStorage.setItem("onboardingTourCompleted", "true")
        setRun(false)
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log("OnboardingTour: Tour finished or skipped")
      localStorage.setItem("onboardingTourCompleted", "true")
      setRun(false)
    }
  }

  // Don't render if no steps for current page
  if (steps.length === 0) {
    return null
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          zIndex: 10000,
        },
        tooltip: {
          fontSize: "14px",
        },
        tooltipContent: {
          padding: "20px",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: pathname === "/admin/dashboard" ? "Go to Inventory" : "Finish Tour",
        next: pathname === "/admin/dashboard" ? "Go to Inventory" : "Finish Tour",
        skip: "Skip Tour",
      }}
    />
  )
}
