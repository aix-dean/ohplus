"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

interface OnboardingTourProps {
  startTour: boolean
}

export function OnboardingTour({ startTour }: OnboardingTourProps) {
  console.log("OnboardingTour: Component mounted/re-mounted with startTour:", startTour)

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

  // Start tour effect
  useEffect(() => {
    console.log("OnboardingTour: useEffect triggered with startTour:", startTour, "pathname:", pathname)

    // Check if tour should start from registration
    const shouldStartFromRegistration = localStorage.getItem("shouldStartTour") === "true"

    if ((startTour || shouldStartFromRegistration) && pathname === "/admin/dashboard") {
      // Clear the flag
      if (shouldStartFromRegistration) {
        localStorage.removeItem("shouldStartTour")
      }

      // Only start on dashboard
      setTimeout(() => {
        const targetElement = document.querySelector('[data-tour-id="inventory-link"]')
        console.log("OnboardingTour: Dashboard target element found:", targetElement)
        if (targetElement) {
          console.log("OnboardingTour: Starting dashboard tour")
          setCurrentStep(0)
          setRun(true)
        }
      }, 100)
    }
  }, [startTour, pathname])

  // Handle pathname changes to continue tour
  useEffect(() => {
    console.log("OnboardingTour: Pathname changed to:", pathname)

    // If we're on inventory page and tour should continue
    if (pathname === "/admin/inventory" && localStorage.getItem("tourShouldContinue") === "true") {
      console.log("OnboardingTour: Continuing tour on inventory page")
      localStorage.removeItem("tourShouldContinue")

      // Wait for inventory page to load
      const waitForInventoryElement = () => {
        const targetElement = document.querySelector('[data-tour-id="add-site-card"]')
        console.log("OnboardingTour: Checking for inventory target element:", targetElement)

        if (targetElement) {
          console.log("OnboardingTour: Starting inventory tour")
          setCurrentStep(0) // Reset to 0 since we're using inventory steps
          setRun(true)
        } else {
          console.log("OnboardingTour: Inventory target not found, retrying...")
          setTimeout(waitForInventoryElement, 500)
        }
      }

      setTimeout(waitForInventoryElement, 1000)
    }
  }, [pathname])

  // Log state changes
  useEffect(() => {
    console.log("OnboardingTour: State changed - run:", run, "currentStep:", currentStep, "pathname:", pathname)
  }, [run, currentStep, pathname])

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      console.log("OnboardingTour: Joyride callback triggered:", data, "pathname:", pathname)
      const { status, index, action } = data

      // Tour finished, skipped, or closed
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === "close") {
        console.log("OnboardingTour: Tour finished, skipped, or closed, status:", status, "action:", action)
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

  // Don't render if no steps for current page
  if (currentSteps.length === 0) {
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
      disableOverlayClose={false}
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
        buttonClose: {
          color: "#9ca3af",
          fontSize: "18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          position: "absolute",
          right: "12px",
          top: "12px",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
