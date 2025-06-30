// Define the types for subscription plan and billing cycle
export type SubscriptionPlanType = "Trial" | "Basic" | "Premium" | "Enterprise" | "Graphic Expo Event"
export type BillingCycle = "monthly" | "yearly" | "one-time"

// Define the status of a subscription
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "trialing" | "expired"

// Define the main Subscription interface based on the provided image
export interface Subscription {
  id: string // Firestore document ID
  billingCycle: BillingCycle
  createdAt: Date // Stored as Timestamp in Firestore, converted to Date on client
  endDate: Date | null // Stored as Timestamp in Firestore, converted to Date on client
  licenseKey: string
  maxProducts: number | null
  planType: SubscriptionPlanType
  startDate: Date // Stored as Timestamp in Firestore, converted to Date on client
  status: SubscriptionStatus
  trialEndDate: Date | null // Stored as Timestamp in Firestore, converted to Date on client
  uid: string // User ID
  updatedAt: Date // Stored as Timestamp in Firestore, converted to Date on client
}

/**
 * Calculates the end date for a subscription based on the plan type, billing cycle, and start date.
 * @param planType The type of the subscription plan.
 * @param billingCycle The billing cycle (e.g., "monthly", "yearly").
 * @param startDate The start date of the subscription.
 * @returns An object containing the calculated endDate and trialEndDate.
 */
export function calculateSubscriptionEndDate(
  planType: SubscriptionPlanType,
  billingCycle: BillingCycle,
  startDate: Date,
): { endDate: Date | null; trialEndDate: Date | null } {
  let endDate: Date | null = null
  let trialEndDate: Date | null = null

  const start = new Date(startDate) // Ensure we're working with a Date object

  switch (planType) {
    case "Trial":
      trialEndDate = new Date(start)
      trialEndDate.setDate(start.getDate() + 60) // 60 days trial
      endDate = null // Trial plans typically don't have a fixed 'endDate' beyond trial
      break
    case "Basic":
    case "Premium":
      endDate = new Date(start)
      if (billingCycle === "monthly") {
        endDate.setMonth(start.getMonth() + 1)
      } else if (billingCycle === "yearly") {
        endDate.setFullYear(start.getFullYear() + 1)
      }
      break
    case "Enterprise":
      endDate = null // Enterprise might be perpetual or custom, set to null for unlimited
      break
    case "Graphic Expo Event":
      endDate = new Date(start)
      endDate.setMonth(start.getMonth() + 2) // Example: 2 months for Graphic Expo Event
      break
    default:
      endDate = null
      break
  }

  return { endDate, trialEndDate }
}

/**
 * Gets the maximum number of products allowed for a given plan type.
 * @param planType The type of the subscription plan.
 * @returns The maximum number of products, or null if unlimited.
 */
export function getMaxProductsForPlan(planType: SubscriptionPlanType): number | null {
  switch (planType) {
    case "Trial":
      return 1 // Example: 1 product for trial
    case "Basic":
      return 3
    case "Premium":
      return 10
    case "Enterprise":
      return null // Unlimited
    case "Graphic Expo Event":
      return 5 // Example: 5 products for Graphic Expo Event
    default:
      return 0
  }
}
