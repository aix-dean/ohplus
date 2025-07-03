export const createOnboardingTourSteps = (router: any) => [
  {
    id: "inventory-nav",
    target: '[data-tour="inventory-nav"]',
    title: "Welcome to your dashboard! 🎉",
    description:
      "Let's start by adding your first billboard site. Click on Inventory in the sidebar to manage your billboard locations.",
    placement: "right" as const,
  },
  {
    id: "add-site-button",
    target: '[data-tour="add-site-button"]',
    title: "Add your first site",
    description:
      "Great! Now click the '+ Add Site' button to create your first billboard location. This is where you'll manage all your advertising spaces.",
    placement: "right" as const,
    action: async () => {
      // Navigate to inventory page
      router.push("/admin/inventory")
      // Wait a bit for navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
  },
]
