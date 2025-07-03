export interface TourStep {
  id: string
  title: string
  content: string
  selector: string // CSS selector for the element to highlight
  path?: string // Optional path to navigate to for this step
}

export const tourSteps: TourStep[] = [
  {
    id: "step1",
    title: "Welcome to OH Plus!",
    content:
      "Let's get your company online. First, let's explore the Inventory section where you can manage your billboard sites.",
    selector: '[data-tour-id="inventory-nav-item"]',
    path: "/admin/dashboard", // Ensure we are on a page where the nav is visible
  },
  {
    id: "step2",
    title: "Add Your First Site",
    content: 'This is where you\'ll add new billboard sites to your inventory. Click "Add Site" to get started!',
    selector: '[data-tour-id="add-site-button"]',
    path: "/admin/inventory", // Navigate to the inventory page
  },
  // Add more steps as needed
]
