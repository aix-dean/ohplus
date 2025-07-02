import { db } from "./firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import type { Subscription, SubscriptionPlanType, BillingCycle } from "./types/subscription"

export const getSubscriptionPlans = () => [
  {
    id: "solo",
    name: "Solo Plan",
    description: "Ideal for first time users and media owners with 1-3 OOH sites.",
    price: 1500,
    billingCycle: "monthly" as BillingCycle,
    features: [
      "Manage up to 3 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "ERP + Programmatic CMS",
    ],
    buttonText: "Upgrade to Solo",
  },
  {
    id: "family",
    name: "Family Plan",
    description: "Ideal for media owners with around 5 OOH sites.",
    price: 2100,
    billingCycle: "monthly" as BillingCycle,
    features: [
      "Manage up to 5 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "ERP + Programmatic CMS",
    ],
    buttonText: "Upgrade to Family",
  },
  {
    id: "membership",
    name: "Membership",
    description: "Access exclusive perks and features from OH!Plus.",
    price: 30000,
    billingCycle: "yearly" as BillingCycle,
    features: [
      "Manage up to 8 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "ERP + Programmatic CMS",
    ],
    buttonText: "Upgrade to Membership",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Tailored for large companies with extensive needs.",
    price: 0,
    billingCycle: "N/A" as BillingCycle,
    features: [
      "Flexible Pricing",
      "Flexible Payment Terms",
      "Embassy Privileges",
      "Priority Assistance",
      "Full- Access",
    ],
    buttonText: "Contact Sales",
  },
  {
    id: "trial",
    name: "Trial Plan",
    description: "90-day free trial for new sign-ups.",
    price: 0,
    billingCycle: "N/A" as BillingCycle,
    features: ["Manage up to 1 site", "Limited features", "Trial period only"],
    buttonText: "Start Trial",
  },
  {
    id: "graphic-expo-event",
    name: "Graphic Expo Event",
    description: "Special 90-day free trial for Graphic Expo attendees.",
    price: 0,
    billingCycle: "N/A" as BillingCycle,
    features: ["Manage up to 1 site", "Limited features", "90-day trial period"],
    buttonText: "Activate Trial",
  },
]

export const subscriptionService = {
  async createSubscription(
    licenseKey: string,
    planType: SubscriptionPlanType,
    billingCycle: BillingCycle,
    userId: string,
    startDate: Date = new Date(),
    endDate: Date | null = null,
    status: "active" | "inactive" | "trialing" | "expired" | "cancelled" = "active",
    maxProducts: number | null = null,
    trialEndDate: Date | null = null,
  ): Promise<Subscription> {
    const plans = getSubscriptionPlans()
    const selectedPlan = plans.find((plan) => plan.id === planType)

    if (!selectedPlan) {
      throw new Error("Invalid plan type")
    }

    // Calculate endDate if not provided
    if (!endDate) {
      const currentStartDate = startDate || new Date()
      if (billingCycle === "monthly") {
        endDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, currentStartDate.getDate())
      } else if (billingCycle === "yearly") {
        endDate = new Date(currentStartDate.getFullYear() + 1, currentStartDate.getMonth(), currentStartDate.getDate())
      } else {
        // For N/A billing cycle (like trial or enterprise contact), set a default or handle specifically
        endDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 3, currentStartDate.getDate()) // Example: 3 months for N/A
      }
    }

    // Determine maxProducts based on planType if not explicitly provided
    if (maxProducts === null) {
      switch (planType) {
        case "solo":
          maxProducts = 3
          break
        case "family":
          maxProducts = 5
          break
        case "membership":
          maxProducts = 8
          break
        case "enterprise":
          maxProducts = 9999 // Effectively unlimited for enterprise
          break
        case "trial":
        case "graphic-expo-event":
          maxProducts = 1
          break
        default:
          maxProducts = 0
      }
    }

    const newSubscription: Omit<Subscription, "id"> = {
      license_key: licenseKey,
      planType,
      billingCycle,
      startDate,
      endDate,
      status,
      userId,
      maxProducts,
      trialEndDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "subscriptions"), newSubscription)
    return { id: docRef.id, ...newSubscription } as Subscription
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    const q = query(
      collection(db, "subscriptions"),
      where("license_key", "==", licenseKey),
      orderBy("createdAt", "desc"), // Order by creation date descending
      limit(1), // Get only the latest one
    )
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Subscription
    }
    return null
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    const subscriptionRef = doc(db, "subscriptions", id)
    await updateDoc(subscriptionRef, { ...updates, updatedAt: serverTimestamp() })
  },

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const docRef = doc(db, "subscriptions", id)
    const docSnap = await getDocs(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Subscription
    }
    return null
  },
}
