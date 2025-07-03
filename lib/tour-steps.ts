import type { TourStep } from "@/contexts/tour-context"

export const onboardingTourSteps: TourStep[] = [
  {
    id: "inventory-nav",
    title: "Welcome to OH Plus!",
    content:
      'Let\'s start by exploring your inventory. Click on "Inventory" in the sidebar to manage your billboard sites.',
    target: "inventory-nav",
    placement: "right",
    nextRoute: "/admin/inventory",
  },
  {
    id: "add-site-button",
    title: "Add Your First Site",
    content:
      'Great! Now click the "+ Add Site" button to create your first billboard location. This is where you\'ll manage all your advertising sites.',
    target: "add-site-button",
    placement: "bottom",
  },
]
