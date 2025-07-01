export type SubscriptionPlanType = "trial" | "basic" | "premium" | "enterprise" | "graphic-expo-event"
export type BillingCycle = "monthly" | "annually"
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "cancelled" | "expired"

export interface Subscription {
  id: string
  licenseKey: string
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  uid: string // User ID
  startDate: Date // When the subscription started
  endDate: Date | null // When the subscription ends (null for lifetime or ongoing)
  status: SubscriptionStatus
  maxProducts: number // Max products allowed for this subscription
  trialEndDate: Date | null // End date of the trial period, if applicable
  createdAt: Date // Timestamp of creation
  updatedAt: Date // Last updated timestamp
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number // Price per month/year depending on context, or 0 for free/trial
  features: string[]
}

// Helper function to calculate subscription end date
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date | null; trialEndDate: Date | null } {
  let endDate: Date | null = null
  let trialEndDate: Date | null = null

  const start = new Date(startDate)

  if (planType === "trial") {
    trialEndDate = new Date(start)
    trialEndDate.setDate(start.getDate() + 60) // 60-day trial
    endDate = trialEndDate // Trial ends, subscription ends
  } else if (planType === "graphic-expo-event") {
    // Assuming this is a temporary plan, set a fixed end date or short duration
    endDate = new Date(start)
    endDate.setDate(start.getDate() + 30) // Example: 30 days for event plan
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
export function getMaxProductsForPlan(planType: SubscriptionPlanType): number {
  switch (planType) {
    case "trial":
      return 1 // Example: 1 product for trial
    case "basic":
      return 3 // Example: 3 products for basic
    case "premium":
      return 10 // Example: 10 products for premium
    case "enterprise":
      return 99999 // Example: unlimited for enterprise
    case "graphic-expo-event":
      return 5 // Example: 5 products for event plan
    default:
      return 0
  }
}
