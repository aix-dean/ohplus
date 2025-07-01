export type SubscriptionPlanType = "Free" | "Basic" | "Pro" | "Enterprise" | "Graphic Expo Event"
export type BillingCycle = "monthly" | "annually"
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "cancelled" | "expired"

export interface Subscription {
  id: string // Firestore document ID
  userId: string // User ID
  planType: SubscriptionPlanType
  status: SubscriptionStatus
  startDate: string // ISO date string
  endDate: string // ISO date string
  billingCycle: BillingCycle
  licenseKey: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  isCurrent?: boolean // Optional, for client-side display
}

// Helper function to calculate end date based on plan and billing cycle
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: string,
): { endDate: string; trialEndDate: string | null } {
  let endDate: string = ""
  let trialEndDate: string | null = null

  const start = new Date(startDate)

  if (planType === "Free") {
    endDate = new Date(start).toISOString() // Free plan has no end date
  } else if (planType === "Trial") {
    trialEndDate = new Date(start)
    trialEndDate.setDate(start.getDate() + 60) // 60 days trial
    endDate = trialEndDate.toISOString()
  } else {
    if (billingCycle === "monthly") {
      endDate = new Date(start)
      endDate.setMonth(start.getMonth() + 1)
    } else if (billingCycle === "annually") {
      endDate = new Date(start)
      endDate.setFullYear(start.getFullYear() + 1)
    }
    endDate = new Date(endDate).toISOString()
  }
  return { endDate, trialEndDate: trialEndDate ? trialEndDate.toISOString() : null }
}

// Helper function to get max products for a given plan type
export function getMaxProductsForPlan(planType: SubscriptionPlanType): number | null {
  switch (planType) {
    case "Free":
      return 1 // Or whatever free plan limit is
    case "Basic":
      return 3
    case "Pro":
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
