export type SubscriptionPlanType = "Trial" | "Basic" | "Premium" | "Enterprise" | "Graphic Expo Event"
export type BillingCycle = "monthly" | "annually"
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "cancelled" | "expired"

export interface Subscription {
  id: string // Firestore document ID
  licenseKey: string
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  uid: string // User ID
  startDate: Date
  endDate: Date | null
  status: SubscriptionStatus
  maxProducts: number | null
  trialEndDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  // isCurrent will be determined dynamically on the page
}

// Helper function to calculate end date based on plan and billing cycle
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date | null; trialEndDate: Date | null } {
  let endDate: Date | null = null
  let trialEndDate: Date | null = null

  const start = new Date(startDate)

  if (planType === "Trial") {
    trialEndDate = new Date(start)
    trialEndDate.setDate(start.getDate() + 60) // 60 days trial
  } else {
    if (billingCycle === "monthly") {
      endDate = new Date(start)
      endDate.setMonth(start.getMonth() + 1)
    } else if (billingCycle === "annually") {
      endDate = new Date(start)
      endDate.setFullYear(start.getFullYear() + 1)
    }
  }
  return { endDate, trialEndDate }
}

// Helper function to get max products for a given plan type
export function getMaxProductsForPlan(planType: SubscriptionPlanType): number | null {
  switch (planType) {
    case "Basic":
      return 3
    case "Premium":
      return 10
    case "Enterprise":
      return null // Unlimited
    case "Trial":
      return 1 // Or whatever trial limit is
    case "Graphic Expo Event":
      return 5 // As per your screenshot
    default:
      return 0
  }
}
