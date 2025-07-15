export type SubscriptionPlanType = "solo" | "family" | "membership" | "enterprise" | "trial" | "graphic-expo-event"
export type BillingCycle = "monthly" | "annually" | "N/A"
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
  maxUsers: number // Add maxUsers field
  trialEndDate: Date | null // End date of the trial period, if applicable
  createdAt: Date // Timestamp of creation
  updatedAt: Date // Last updated timestamp
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string // Added description for plans
  price: number // Price per month/year depending on context, or 0 for free/trial
  billingCycle: BillingCycle | "N/A" // Added billing cycle to plan definition
  features: string[]
  buttonText: string // Added button text for plans
  maxProducts?: number
  maxUsers?: number // Add maxUsers to plan interface
}

// Helper function to calculate subscription end date
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date; trialEndDate: Date | null } {
  const endDate = new Date(startDate)
  let trialEndDate: Date | null = null

  // Set trial end date for trial plans
  if (planType === "trial" || planType === "graphic-expo-event") {
    trialEndDate = new Date(startDate)
    trialEndDate.setDate(trialEndDate.getDate() + 60) // 60-day trial
    endDate.setTime(trialEndDate.getTime()) // Trial plans end when trial ends
  } else {
    // Regular subscription plans
    switch (billingCycle) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case "annually":
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
      case "N/A":
        // For enterprise or custom plans, set a far future date
        endDate.setFullYear(endDate.getFullYear() + 10)
        break
    }
  }

  return { endDate, trialEndDate }
}

// Helper function to get max products for a given plan type
export function getMaxProductsForPlan(planType: SubscriptionPlanType): number {
  switch (planType) {
    case "trial":
      return 3
    case "solo":
      return 3
    case "family":
      return 5
    case "membership":
      return 8
    case "enterprise":
      return -1 // Unlimited
    case "graphic-expo-event":
      return 5
    default:
      return 3
  }
}

// Helper function to get max users for a plan
export function getMaxUsersForPlan(planType: SubscriptionPlanType): number {
  switch (planType) {
    case "trial":
      return 5 // Trial gets 5 users
    case "solo":
      return 12
    case "family":
      return 18
    case "membership":
      return 20
    case "enterprise":
      return -1 // Unlimited
    case "graphic-expo-event":
      return 10 // Event plan gets 10 users
    default:
      return 5
  }
}

// Helper function to check if subscription is active
export function isSubscriptionActive(subscription: Subscription): boolean {
  const now = new Date()

  if (subscription.status !== "active") {
    return false
  }

  // Check if subscription has expired
  if (subscription.endDate && now > subscription.endDate) {
    return false
  }

  // Check if trial has expired (for trial plans)
  if (subscription.trialEndDate && now > subscription.trialEndDate) {
    return false
  }

  return true
}

// Helper function to get subscription features
export function getSubscriptionFeatures(planType: SubscriptionPlanType): string[] {
  switch (planType) {
    case "trial":
      return ["60-day free trial", "Limited features", "Basic support", "Up to 3 sites", "Up to 5 users"]
    case "solo":
      return [
        "Manage up to 3 sites",
        "Up to 12 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ]
    case "family":
      return [
        "Manage up to 5 sites",
        "Up to 18 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ]
    case "membership":
      return [
        "Manage up to 8 sites",
        "Up to 20 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS + Planning",
        "OH!Plus Lite for 3 sites",
      ]
    case "enterprise":
      return [
        "Unlimited sites",
        "Unlimited users",
        "Flexible Pricing",
        "Flexible Payment Terms",
        "Embassy Privileges",
        "Priority Assistance",
        "Full Access",
      ]
    case "graphic-expo-event":
      return ["5 Products", "10 users", "Event-specific features", "Limited duration"]
    default:
      return []
  }
}
