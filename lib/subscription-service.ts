import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  limit,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import type { Subscription, SubscriptionPlan, SubscriptionPlanType, BillingCycle } from "./types/subscription"

const SUBSCRIPTIONS_COLLECTION = "subscriptions"

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: "trial",
      name: "Trial",
      description: "Limited time offer for new sign-ups!",
      price: 0,
      billingCycle: "N/A",
      features: ["Access to basic features", "Limited OOH sites", "No dedicated support"],
      buttonText: "Start Free Trial",
      maxProducts: 5,
      maxUsers: 1,
    },
    {
      id: "graphic-expo-event",
      name: "Graphic Expo Event",
      description: "Exclusive offer for Graphic Expo attendees!",
      price: 0,
      billingCycle: "N/A",
      features: ["90 Days Free Trial", "Limited time offer for new sign-ups!"],
      buttonText: "Get Now",
      maxProducts: 5,
      maxUsers: 1,
    },
    {
      id: "solo",
      name: "Solo Plan",
      description: "Ideal for first time users and media owners with 1-3 OOH sites.",
      price: 1500,
      billingCycle: "monthly",
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
      description: "Ideal for media owners with around 5 OOH sites.",
      price: 2100,
      billingCycle: "monthly",
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
      description: "Access exclusive perks and features from OH!Plus.",
      price: 30000,
      billingCycle: "yearly",
      features: [
        "Manage up to 8 sites",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ],
      buttonText: "Upgrade to Membership",
      maxProducts: 8,
      maxUsers: 10,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Tailored for large companies with extensive needs.",
      price: 0, // Contact us for pricing
      billingCycle: "N/A",
      features: [
        "Flexible Pricing",
        "Flexible Payment Terms",
        "Embassy Privileges",
        "Priority Assistance",
        "Full- Access",
      ],
      buttonText: "Contact Us",
      maxProducts: 1000, // Effectively unlimited
      maxUsers: 1000, // Effectively unlimited
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
  ): Promise<Subscription> {
    const plans = getSubscriptionPlans()
    const selectedPlan = plans.find((plan) => plan.id === planType)

    if (!selectedPlan) {
      throw new Error("Invalid plan type")
    }

    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
      license_key: licenseKey,
      planType: planType,
      billingCycle: billingCycle,
      userId: userId,
      startDate: startDate,
      endDate: endDate || null, // Allow null for endDate if not specified
      status: status,
      maxProducts: maxProducts || selectedPlan.maxProducts,
      maxUsers: selectedPlan.maxUsers,
      trialEndDate: trialEndDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newSubscription: Subscription = {
      id: docRef.id,
      license_key: licenseKey,
      planType: planType,
      billingCycle: billingCycle,
      userId: userId,
      startDate: startDate,
      endDate: endDate || null,
      status: status,
      maxProducts: maxProducts || selectedPlan.maxProducts,
      maxUsers: selectedPlan.maxUsers,
      trialEndDate: trialEndDate || null,
      createdAt: new Date(), // Placeholder, will be updated by serverTimestamp
      updatedAt: new Date(), // Placeholder, will be updated by serverTimestamp
    }
    return newSubscription
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where("license_key", "==", licenseKey),
      orderBy("createdAt", "desc"), // Order by creation date descending
      limit(1), // Get only the latest one
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const docData = querySnapshot.docs[0].data()
    const subscription: Subscription = {
      id: querySnapshot.docs[0].id,
      license_key: docData.license_key,
      planType: docData.planType,
      billingCycle: docData.billingCycle,
      userId: docData.userId,
      startDate: docData.startDate?.toDate(),
      endDate: docData.endDate?.toDate(),
      status: docData.status,
      maxProducts: docData.maxProducts,
      maxUsers: docData.maxUsers,
      trialEndDate: docData.trialEndDate?.toDate(),
      createdAt: docData.createdAt?.toDate(),
      updatedAt: docData.updatedAt?.toDate(),
    }
    return subscription
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, id)
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  },
}
