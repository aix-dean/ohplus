import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import type { SubscriptionPlan, SubscriptionPlanType, BillingCycle, Subscription } from "./types/subscription"

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: "trial",
      name: "Trial",
      price: 0,
      billingCycle: "N/A",
      description: "Experience the basic features for a limited time.",
      features: ["Limited features", "7-day trial period"],
      buttonText: "Start Free Trial",
      maxProducts: 1,
      maxUsers: 1,
    },
    {
      id: "graphic-expo-event",
      name: "Graphic Expo Event",
      price: 0,
      billingCycle: "N/A",
      description: "Exclusive 90-day free trial for Graphic Expo attendees.",
      features: ["All Solo Plan features", "90-day free trial"],
      buttonText: "Get Now",
      maxProducts: 3,
      maxUsers: 1,
    },
    {
      id: "solo",
      name: "Solo Plan",
      price: 1500,
      billingCycle: "monthly",
      description: "Ideal for first time users and media owners with 1-3 OOH sites.",
      features: [
        "Manage up to 3 sites",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ],
      buttonText: "Upgrade to Solo",
      maxProducts: 3,
      maxUsers: 1,
    },
    {
      id: "family",
      name: "Family Plan",
      price: 2100,
      billingCycle: "monthly",
      description: "Ideal for media owners with around 5 OOH sites.",
      features: [
        "Manage up to 5 sites",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ],
      buttonText: "Upgrade to Family",
      maxProducts: 5,
      maxUsers: 5,
    },
    {
      id: "membership",
      name: "Membership",
      price: 30000,
      billingCycle: "yearly",
      description: "Access exclusive perks and features from OH!Plus.",
      features: [
        "Manage up to 8 sites",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
        "Priority Assistance",
        "Flexible Payment Terms",
      ],
      buttonText: "Upgrade to Membership",
      maxProducts: 8,
      maxUsers: 10,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 0, // Contact us for pricing
      billingCycle: "N/A",
      description: "Tailored for large companies with extensive needs.",
      features: [
        "Flexible Pricing",
        "Flexible Payment Terms",
        "Embassy Privileges",
        "Priority Assistance",
        "Full- Access",
      ],
      buttonText: "Contact Us",
      maxProducts: 9999, // Effectively unlimited
      maxUsers: 9999, // Effectively unlimited
    },
  ]
}

export const subscriptionService = {
  async createSubscription(
    licenseKey: string,
    planType: SubscriptionPlanType,
    billingCycle: BillingCycle,
    userId: string,
    startDate: Date,
    endDate: Date | null,
    status: "active" | "inactive" | "trialing" | "expired" | "cancelled",
    maxProducts: number | null,
    trialEndDate: Date | null,
  ): Promise<void> {
    const plans = getSubscriptionPlans()
    const selectedPlan = plans.find((p) => p.id === planType)

    if (!selectedPlan) {
      throw new Error("Invalid plan type")
    }

    const newSubscription: Omit<Subscription, "id"> = {
      license_key: licenseKey,
      planType: planType,
      billingCycle: billingCycle,
      startDate: startDate,
      endDate: endDate || new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()), // Default to 1 year if not provided
      status: status,
      maxProducts: maxProducts || selectedPlan.maxProducts,
      maxUsers: selectedPlan.maxUsers,
      trialEndDate: trialEndDate,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await addDoc(collection(db, "subscriptions"), newSubscription)
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    const q = query(
      collection(db, "subscriptions"),
      where("license_key", "==", licenseKey),
      orderBy("createdAt", "desc"), // Order by creation date descending
      limit(1), // Get only the latest one
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const docData = querySnapshot.docs[0].data() as Omit<Subscription, "id">
    return {
      id: querySnapshot.docs[0].id,
      ...docData,
      startDate: docData.startDate ? new Date(docData.startDate.seconds * 1000) : null,
      endDate: docData.endDate ? new Date(docData.endDate.seconds * 1000) : null,
      trialEndDate: docData.trialEndDate ? new Date(docData.trialEndDate.seconds * 1000) : null,
      createdAt: docData.createdAt ? new Date(docData.createdAt.seconds * 1000) : null,
      updatedAt: docData.updatedAt ? new Date(docData.updatedAt.seconds * 1000) : null,
    } as Subscription
  },

  async updateSubscription(id: string, data: Partial<Omit<Subscription, "id">>): Promise<void> {
    const subscriptionRef = doc(db, "subscriptions", id)
    await updateDoc(subscriptionRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },
}
