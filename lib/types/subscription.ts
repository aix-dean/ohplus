export type SubscriptionPlanType = "trial" | "basic" | "premium" | "enterprise" | "graphic-expo-event"
export type BillingCycle = "monthly" | "annually"
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "cancelled" | "expired"

export interface Subscription {
  id: string
  licenseKey: string
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  uid: string // User ID associated with the subscription
  startDate: Date
  endDate: Date | null
  status: SubscriptionStatus
  maxProducts: number
  trialEndDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType
  name: string
  price: number
  features: string[]
}

export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date | null; trialEndDate: Date | null } {
  const endDate = new Date(startDate)
  let trialEndDate: Date | null = null

  if (planType === "trial") {
    trialEndDate = new Date(startDate)
    trialEndDate.setDate(startDate.getDate() + 60) // 60-day trial
    return { endDate: null, trialEndDate } // Trial plans don't have a fixed end date, they expire or convert
  } else if (planType === "graphic-expo-event") {
    // Assuming this is a short-term event plan, e.g., 7 days
    endDate.setDate(startDate.getDate() + 7)
  } else if (billingCycle === "monthly") {
    endDate.setMonth(startDate.getMonth() + 1)
  } else if (billingCycle === "annually") {
    endDate.setFullYear(startDate.getFullYear() + 1)
  }

  return { endDate, trialEndDate: null }
}

export function getMaxProductsForPlan(planType: SubscriptionPlanType): number {
  switch (planType) {
    case "trial":
      return 1 // Limited products for trial
    case "basic":
      return 3
    case "premium":
      return 10
    case "enterprise":
      return 99999 // Unlimited
    case "graphic-expo-event":
      return 5 // Specific to event
    default:
      return 0
  }
}
