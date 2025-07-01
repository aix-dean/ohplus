export type SubscriptionPlanType = "Trial" | "Basic" | "Premium" | "Enterprise" | "Graphic Expo Event"

export type BillingCycle = "monthly" | "annually" | "one-time"

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
  maxProducts: number // Max number of products allowed for this plan
  trialEndDate: Date | null // End date of the trial period, if applicable
  createdAt: Date // Timestamp of creation
  updatedAt: Date // Timestamp of last update
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
}

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
    trialEndDate.setDate(start.getDate() + 60) // 60-day trial
    endDate = null // Trial plans don't have a fixed end date beyond the trial
  } else if (billingCycle === "monthly") {
    endDate = new Date(start)
    endDate.setMonth(start.getMonth() + 1)
  } else if (billingCycle === "annually") {
    endDate = new Date(start)
    endDate.setFullYear(start.getFullYear() + 1)
  } else if (billingCycle === "one-time") {
    endDate = null // One-time plans might not have an end date, or it's defined differently
  }

  return { endDate, trialEndDate }
}

export function getMaxProductsForPlan(planType: SubscriptionPlanType): number {
  switch (planType) {
    case "Trial":
      return 1 // Example: 1 product for trial
    case "Basic":
      return 3 // Example: 3 products for basic
    case "Premium":
      return 10 // Example: 10 products for premium
    case "Enterprise":
      return -1 // -1 for unlimited
    case "Graphic Expo Event":
      return 5 // Example: 5 products for event
    default:
      return 0
  }
}
