"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

interface OnboardingTourProps {
  startTour: boolean
}

export function OnboardingTour({ startTour }: OnboardingTourProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [run, setRun] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

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

  const inventorySteps: Step[] = [
    {
      target: '[data-tour-id="add-site-card"]',
      content: "Step 2: Click here to add your first billboard site and get started with your inventory management.",
      disableBeacon: true,
      placement: "top",
      title: "Add Your First Site",
    },
  ]

  const getCurrentSteps = () => {
    if (pathname === "/admin/dashboard") {
      return dashboardSteps
    } else if (pathname === "/admin/inventory") {
      return inventorySteps
    }
    return []
  }

  useEffect(() => {
    const shouldStartFromRegistration = localStorage.getItem("shouldStartTour") === "true"

    if ((startTour || shouldStartFromRegistration) && pathname === "/admin/dashboard") {
      if (shouldStartFromRegistration) {
        localStorage.removeItem("shouldStartTour")
      }

      setTimeout(() => {
        const targetElement = document.querySelector('[data-tour-id="inventory-link"]')
        if (targetElement) {
          setCurrentStep(0)
          setRun(true)
        }
      }, 100)
    }
  }, [startTour, pathname])

  useEffect(() => {
    if (pathname === "/admin/inventory" && localStorage.getItem("tourShouldContinue") === "true") {
      localStorage.removeItem("tourShouldContinue")

      const waitForInventoryElement = () => {
        const targetElement = document.querySelector('[data-tour-id="add-site-card"]')
        if (targetElement) {
          setCurrentStep(0)
          setRun(true)
        } else {
          setTimeout(waitForInventoryElement, 500)
        }
      }

      setTimeout(waitForInventoryElement, 1000)
    }
  }, [pathname])

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, index, action } = data

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRun(false)
        setCurrentStep(0)
        localStorage.setItem("onboardingTourCompleted", "true")
        localStorage.removeItem("tourShouldContinue")
        return
      }

      if (action === "next") {
        if (pathname === "/admin/dashboard" && index === 0) {
          setRun(false)
          localStorage.setItem("tourShouldContinue", "true")
          router.push("/admin/inventory")
        } else if (pathname === "/admin/inventory" && index === 0) {
          setRun(false)
          setCurrentStep(0)
          localStorage.setItem("onboardingTourCompleted", "true")
        }
      } else if (action === "prev") {
        if (pathname === "/admin/inventory" && index === 0) {
          setRun(false)
          localStorage.setItem("tourShouldContinue", "true")
          router.push("/admin/dashboard")
        }
      }
    },
    [router, pathname],
  )

  const currentSteps = getCurrentSteps()

  if (currentSteps.length === 0) {
    return null
  }

  const localeConfig = {
    back: pathname === "/admin/dashboard" ? "" : "Back",
    close: "Close",
    last: "Finish Tour",
    next: pathname === "/admin/dashboard" ? "Go to Inventory" : "Finish Tour",
    skip: "Skip Tour",
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
      locale={localeConfig}
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
