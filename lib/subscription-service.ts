import { db } from "./firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import type { Subscription, SubscriptionPlan, BillingCycle, SubscriptionPlanType } from "./types/subscription"

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: "trial",
      name: "Free Trial",
      price: 0,
      billingCycle: "N/A",
      description: "Explore basic features for a limited time.",
      features: ["Access to basic features", "Limited OOH sites", "Community support"],
      buttonText: "Start Free Trial",
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
      ],
      buttonText: "Upgrade to Membership",
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
    },
    {
      id: "graphic-expo-event",
      name: "Graphic Expo Event",
      price: 0,
      billingCycle: "N/A",
      description: "Special 90-day free trial for Graphic Expo attendees.",
      features: ["90-day free trial", "Access to all features", "Priority support"],
      buttonText: "Activate Trial",
    },
  ]
}

class SubscriptionService {
  private subscriptionsCollection = collection(db, "subscriptions")

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
  ): Promise<Subscription> {
    const newSubscription: Omit<Subscription, "id"> = {
      license_key: licenseKey,
      planType,
      billingCycle,
      userId,
      startDate,
      endDate,
      status,
      maxProducts,
      trialEndDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const docRef = await addDoc(this.subscriptionsCollection, newSubscription)
    return { id: docRef.id, ...(newSubscription as Omit<Subscription, "id">) }
  }

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    const q = query(
      this.subscriptionsCollection,
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
  }

  async updateSubscription(id: string, updates: Partial<Omit<Subscription, "id">>): Promise<void> {
    const subscriptionRef = doc(this.subscriptionsCollection, id)
    await updateDoc(subscriptionRef, { ...updates, updatedAt: serverTimestamp() })
  }
}

export const subscriptionService = new SubscriptionService()
