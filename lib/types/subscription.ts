import type { Timestamp } from "firebase/firestore"

export type SubscriptionPlanType = "Trial" | "Basic" | "Premium" | "Enterprise" | "Graphic Expo Event"
export type BillingCycle = "monthly" | "yearly"

export interface Subscription {
  id: string // Firestore generated ID
  licenseKey: string
  uid: string // User ID
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  status: "active" | "inactive" | "trialing" | "cancelled" | "expired"
  maxProducts: number | null // null for unlimited
  startDate: Timestamp // When the current subscription period started
  endDate: Timestamp // When the current subscription period ends
  trialEndDate: Timestamp | null // For trial plans, when the trial ends
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Helper function to get max products based on plan type
export function getMaxProductsForPlan(type: SubscriptionPlanType): number | null {
  switch (type) {
    case "Basic":
      return 3
    case "Premium":
      return 10
    case "Enterprise":
      return null // Unlimited
    case "Graphic Expo Event":
      return 5
    case "Trial":
      return 1 // Or any trial limit
    default:
      return 1 // Default for unknown types
  }
}

// Helper function to calculate subscription end date
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date; trialEndDate: Date | null } {
  const start = new Date(startDate)
  const endDate = new Date(start)
  let trialEndDate: Date | null = null

  if (planType === "Trial" || planType === "Graphic Expo Event") {
    // Trial and Graphic Expo Event plans are 60 days
    endDate.setDate(start.getDate() + 60)
    trialEndDate = new Date(endDate) // Trial ends when the 60-day period ends
  } else {
    // For paid plans, calculate based on billing cycle
    if (billingCycle === "monthly") {
      endDate.setMonth(start.getMonth() + 1)
    } else if (billingCycle === "yearly") {
      endDate.setFullYear(start.getFullYear() + 1)
    }
  }

  return { endDate, trialEndDate }
}
