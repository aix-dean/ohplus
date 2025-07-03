import type { ReactNode } from "react"

export interface TourStep {
  id: string
  title: string
  description?: string
  content?: ReactNode
  path?: string // Optional path to navigate to for this step
  targetId?: string // Optional data-tour-id of the element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center" // Position of the tooltip relative to target
}

export const onboardingTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to ERP v2!",
    description: "Let's get your company online. Set up your first billboard site — it's quick.",
    content: (
      <div className="text-center">
        <img src="/celebration.png" alt="Celebration" className="mx-auto h-24 w-24 mb-4" />
        <p>We're excited to have you on board!</p>
      </div>
    ),
    position: "center",
  },
  {
    id: "highlight-inventory-nav",
    title: "Manage Your Inventory",
    description: "This is where you'll manage all your billboard sites and products.",
    path: "/admin/dashboard", // Ensure we are on a page where the nav is visible
    targetId: "inventory-nav-item",
    position: "right",
  },
  {
    id: "navigate-to-inventory",
    title: "Add Your First Site",
    description: "Click 'Add Site' to begin setting up your first billboard location.",
    path: "/admin/inventory", // Navigate to the inventory page
    targetId: "add-site-button",
    position: "bottom",
  },
  // Add more steps as needed
]
