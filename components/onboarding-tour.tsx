"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

interface OnboardingTourProps {
  startTour: boolean
}

export function OnboardingTour({ startTour }: OnboardingTourProps) {
  console.log("OnboardingTour: Component mounted/re-mounted with startTour:", startTour)

  const router = useRouter()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Define the tour steps
  const steps: Step[] = [
    {
      target: '[data-tour-id="inventory-link"]',
      content:
        "You're in! Let's get your company online. Set up your first billboard site — it's quick. Click on Inventory to get started.",
      disableBeacon: true,
      placement: "right",
      title: "Welcome to OH!Plus",
    },
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Click here to add your first billboard site and get started with your inventory management.",
      disableBeacon: true,
      placement: "top",
      title: "Add Your First Site",
    },
  ]

  // Helper function to wait for element to appear
  const waitForElement = (selector: string, maxAttempts = 20, delay = 500): Promise<Element | null> => {
    return new Promise((resolve) => {
      let attempts = 0

      const checkElement = () => {
        const element = document.querySelector(selector)
        console.log(`OnboardingTour: Attempt ${attempts + 1} to find element ${selector}:`, element)

        if (element) {
          resolve(element)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkElement, delay)
        } else {
          console.log(`OnboardingTour: Element ${selector} not found after ${maxAttempts} attempts`)
          resolve(null)
        }
      }

      checkElement()
    })
  }

  // Simple effect to start tour when startTour is true
  useEffect(() => {
    console.log("OnboardingTour: useEffect triggered with startTour:", startTour)
    if (startTour) {
      // Add a small delay to ensure DOM is ready
      setTimeout(async () => {
        const targetElement = await waitForElement('[data-tour-id="inventory-link"]')
        console.log("OnboardingTour: Target element found:", targetElement)
        if (targetElement) {
          console.log("OnboardingTour: Starting tour - setting run to true")
          setRun(true)
          setStepIndex(0)
        } else {
          console.log("OnboardingTour: Could not find inventory link element")
        }
      }, 100)
    } else {
      console.log("OnboardingTour: startTour is false, not starting tour")
    }
  }, [startTour])

  // Log state changes
  useEffect(() => {
    console.log("OnboardingTour: State changed - run:", run, "stepIndex:", stepIndex)
  }, [run, stepIndex])

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      console.log("OnboardingTour: Joyride callback triggered:", data)
      const { status, index, action } = data

      // Tour finished or skipped
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        console.log("OnboardingTour: Tour finished or skipped, status:", status)
        setRun(false)
        setStepIndex(0)
        localStorage.setItem("onboardingTourCompleted", "true")
        console.log("OnboardingTour: Set onboardingTourCompleted to true in localStorage")
        return
      }

      // Handle step progression
      if (action === "next") {
        console.log("OnboardingTour: Next button clicked, current index:", index)
        if (index === 0) {
          // After first step, navigate to inventory page
          console.log("OnboardingTour: Navigating to /admin/inventory")
          router.push("/admin/inventory")

          // Wait for navigation and element to appear, then continue tour
          setTimeout(async () => {
            console.log("OnboardingTour: Waiting for add-site-card element after navigation")
            const addSiteElement = await waitForElement('[data-tour-id="add-site-card"]')

            if (addSiteElement) {
              console.log("OnboardingTour: Add site element found, moving to step 1")
              setStepIndex(1)
            } else {
              console.log("OnboardingTour: Add site element not found, ending tour")
              setRun(false)
              localStorage.setItem("onboardingTourCompleted", "true")
            }
          }, 1500)
        } else {
          console.log("OnboardingTour: Moving to next step:", index + 1)
          setStepIndex(index + 1)
        }
      } else if (action === "prev") {
        console.log("OnboardingTour: Previous button clicked, current index:", index)
        if (index === 1) {
          // Going back from inventory to dashboard
          console.log("OnboardingTour: Navigating back to /admin/dashboard")
          router.push("/admin/dashboard")

          setTimeout(async () => {
            console.log("OnboardingTour: Waiting for inventory-link element after navigation back")
            const inventoryElement = await waitForElement('[data-tour-id="inventory-link"]')

            if (inventoryElement) {
              console.log("OnboardingTour: Inventory link element found, moving to step 0")
              setStepIndex(0)
            } else {
              console.log("OnboardingTour: Inventory link element not found, ending tour")
              setRun(false)
            }
          }, 1500)
        } else {
          console.log("OnboardingTour: Moving to previous step:", index - 1)
          setStepIndex(index - 1)
        }
      }
    },
    [router],
  )

  console.log("OnboardingTour: Rendering Joyride with run:", run, "stepIndex:", stepIndex)

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
