import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export const onboardingTourSteps = (router: AppRouterInstance) => [
  {
    id: "welcome",
    title: "Welcome to OOH Operator!",
    content: "Let's take a quick tour to get you familiar with the platform.",
    target: "body", // Center of the screen
    placement: "center",
  },
  {
    id: "inventory-nav",
    title: "Manage Your Inventory",
    content: "This is where you'll add and manage all your billboard sites.",
    target: '[data-tour-id="inventory-nav-item"]', // Target the Inventory link in side-navigation
    placement: "right",
    action: () => {
      router.push("/admin/inventory")
    },
    isNavigationStep: true,
  },
  {
    id: "add-site-button",
    title: "Add Your First Site",
    content: "Click here to add a new billboard site to your inventory.",
    target: '[data-tour-id="add-site-button"]', // Target the Add Site button on the inventory page
    placement: "bottom",
  },
  {
    id: "tour-complete",
    title: "Tour Complete!",
    content: "You're all set! Start by adding your first billboard site.",
    target: "body", // Center of the screen
    placement: "center",
  },
]
