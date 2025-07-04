"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

// Removed OnboardingTourProps interface as startTour prop is no longer used

export function OnboardingTour() {
  console.log("OnboardingTour: Component mounted/re-mounted")

  const router = useRouter()
  const pathname = usePathname()
  const [run, setRun] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Define steps for dashboard
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

  // Define steps for inventory page
  const inventorySteps: Step[] = [
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Step 2: Click here to add your first billboard site and get started with your inventory management.",
      disableBeacon: true,
      placement: "top",
      title: "Add Your First Site",
    },
  ]

  // Get current steps based on pathname
  const getCurrentSteps = () => {
    if (pathname === "/admin/dashboard") {
      return dashboardSteps
    } else if (pathname === "/admin/inventory") {
      return inventorySteps
    }
    return []
  }

  // Effect to start tour based on localStorage flags
  useEffect(() => {
    const tourCompleted = localStorage.getItem("onboardingTourCompleted")
    const tourTriggeredByRegistration = localStorage.getItem("onboardingTourTriggeredByRegistration")

    console.log(
      "OnboardingTour: useEffect triggered. tourCompleted:",
      tourCompleted,
      "tourTriggeredByRegistration:",
      tourTriggeredByRegistration,
      "pathname:",
      pathname,
    )

    if (!tourCompleted && tourTriggeredByRegistration === "true" && pathname === "/admin/dashboard") {
      console.log("OnboardingTour: Starting tour from registration trigger on dashboard.")
      localStorage.removeItem("onboardingTourTriggeredByRegistration") // Clear the trigger
      setTimeout(() => {
        const targetElement = document.querySelector('[data-tour-id="inventory-link"]')
        if (targetElement) {
          console.log("OnboardingTour: Dashboard target element found, starting tour.")
          setCurrentStep(0)
          setRun(true)
        } else {
          console.log("OnboardingTour: Dashboard target element not found, retrying...")
          // Fallback if element not immediately available
          setTimeout(() => {
            const retryElement = document.querySelector('[data-tour-id="inventory-link"]')
            if (retryElement) {
              console.log("OnboardingTour: Dashboard target element found on retry, starting tour.")
              setCurrentStep(0)
              setRun(true)
            }
          }, 500)
        }
      }, 100)
    } else if (
      !tourCompleted &&
      localStorage.getItem("tourShouldContinue") === "true" &&
      pathname === "/admin/inventory"
    ) {
      console.log("OnboardingTour: Continuing tour on inventory page.")
      localStorage.removeItem("tourShouldContinue")

      const waitForInventoryElement = () => {
        const targetElement = document.querySelector('[data-tour-id="add-site-card"]')
        console.log("OnboardingTour: Checking for inventory target element:", targetElement)

        if (targetElement) {
          console.log("OnboardingTour: Starting inventory tour.")
          setCurrentStep(0)
          setRun(true)
        } else {
          console.log("OnboardingTour: Inventory target not found, retrying...")
          setTimeout(waitForInventoryElement, 500)
        }
      }
      setTimeout(waitForInventoryElement, 1000)
    }
  }, [pathname]) // Depend on pathname to re-evaluate when route changes

  // Log state changes
  useEffect(() => {
    console.log("OnboardingTour: State changed - run:", run, "currentStep:", currentStep, "pathname:", pathname)
  }, [run, currentStep, pathname])

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      console.log("OnboardingTour: Joyride callback triggered:", data, "pathname:", pathname)
      const { status, index, action } = data

      // Tour finished or skipped
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        console.log("OnboardingTour: Tour finished or skipped, status:", status)
        setRun(false)
        setCurrentStep(0)
        localStorage.setItem("onboardingTourCompleted", "true")
        localStorage.removeItem("tourShouldContinue")
        console.log("OnboardingTour: Set onboardingTourCompleted to true in localStorage")
        return
      }

      // Handle step progression
      if (action === "next") {
        console.log("OnboardingTour: Next button clicked, current index:", index, "pathname:", pathname)

        if (pathname === "/admin/dashboard" && index === 0) {
          // On dashboard, navigate to inventory
          console.log("OnboardingTour: Navigating to inventory from dashboard")
          setRun(false)
          localStorage.setItem("tourShouldContinue", "true")
          router.push("/admin/inventory")
        } else if (pathname === "/admin/inventory" && index === 0) {
          // Finish tour on inventory
          console.log("OnboardingTour: Finishing tour on inventory")
          setRun(false)
          setCurrentStep(0)
          localStorage.setItem("onboardingTourCompleted", "true")
        }
      } else if (action === "prev") {
        console.log("OnboardingTour: Previous button clicked, current index:", index, "pathname:", pathname)

        if (pathname === "/admin/inventory" && index === 0) {
          // Go back to dashboard
          console.log("OnboardingTour: Going back to dashboard from inventory")
          setRun(false)
          localStorage.setItem("tourShouldContinue", "true")
          router.push("/admin/dashboard")
        }
      }
    },
    [router, pathname],
  )

  const currentSteps = getCurrentSteps()
  console.log(
    "OnboardingTour: Rendering Joyride with run:",
    run,
    "currentStep:",
    currentStep,
    "steps:",
    currentSteps.length,
    "pathname:",
    pathname,
  )

  // Don't render if no steps for current page or if tour is completed
  if (currentSteps.length === 0 || localStorage.getItem("onboardingTourCompleted") === "true") {
    return null
  }

  return (
    <Joyride
      run={run}
      steps={currentSteps}
      stepIndex={currentStep}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={true}
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      locale={{
        back: pathname === "/admin/dashboard" ? undefined : "Back",
        close: "Close",
        last: "Finish Tour",
        next: pathname === "/admin/dashboard" ? "Go to Inventory" : "Finish Tour",
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
