import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore"
import {
  type Subscription,
  type SubscriptionPlanType,
  type BillingCycle,
  type SubscriptionStatus,
  calculateSubscriptionEndDate,
  getMaxProductsForPlan,
  getMaxUsersForPlan, // Import the new function
} from "@/lib/types/subscription"
import type { SubscriptionPlan } from "./types/subscription"

export const subscriptionService = {
  async createSubscription(
    licenseKey: string,
    planType: SubscriptionPlanType,
    billingCycle: BillingCycle,
    uid: string,
    startDate: Date = new Date(),
    endDate: Date | null = null,
    status: SubscriptionStatus = "active",
    maxProducts: number | null = null,
    maxUsers: number | null = null, // Add maxUsers parameter
    trialEndDate: Date | null = null,
  ): Promise<Subscription> {
    console.log("subscriptionService: Creating subscription for licenseKey:", licenseKey)

    const { endDate: calculatedEndDate, trialEndDate: calculatedTrialEndDate } = calculateSubscriptionEndDate(
      planType,
      billingCycle,
      startDate,
    )

    const subscriptionData = {
      licenseKey,
      planType,
      billingCycle,
      uid,
      startDate: startDate,
      endDate: endDate || calculatedEndDate,
      status,
      maxProducts: maxProducts || getMaxProductsForPlan(planType),
      maxUsers: maxUsers || getMaxUsersForPlan(planType), // Add maxUsers to subscription data
      trialEndDate: trialEndDate || calculatedTrialEndDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)
    console.log("subscriptionService: Subscription created with ID:", docRef.id)

    const newSubscription: Subscription = {
      id: docRef.id,
      licenseKey,
      planType,
      billingCycle,
      uid,
      startDate: startDate,
      endDate: endDate || calculatedEndDate,
      status,
      maxProducts: maxProducts || getMaxProductsForPlan(planType),
      maxUsers: maxUsers || getMaxUsersForPlan(planType), // Add maxUsers to return object
      trialEndDate: trialEndDate || calculatedTrialEndDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return newSubscription
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    console.log("subscriptionService: Fetching subscription for licenseKey:", licenseKey)
    const subscriptionsRef = collection(db, "subscriptions")
    const q = query(subscriptionsRef, where("licenseKey", "==", licenseKey), orderBy("createdAt", "desc"), limit(1))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("subscriptionService: No subscription found for licenseKey:", licenseKey)
      return null
    }

    const docSnap = querySnapshot.docs[0]
    const data = docSnap.data()

    const subscription: Subscription = {
      id: docSnap.id,
      licenseKey: data.licenseKey,
      planType: data.planType,
      billingCycle: data.billingCycle,
      uid: data.uid,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
      status: data.status,
      maxProducts: data.maxProducts,
      maxUsers: data.maxUsers || getMaxUsersForPlan(data.planType), // Handle legacy subscriptions without maxUsers
      trialEndDate: data.trialEndDate instanceof Timestamp ? data.trialEndDate.toDate() : data.trialEndDate,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    }
    console.log("subscriptionService: Found subscription:", subscription)
    return subscription
  },

  async updateSubscription(licenseKey: string, updates: Partial<Subscription>): Promise<void> {
    console.log("subscriptionService: Updating subscription for licenseKey:", licenseKey, "with updates:", updates)
    const subscriptionsRef = collection(db, "subscriptions")
    const q = query(subscriptionsRef, where("licenseKey", "==", licenseKey))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.error("subscriptionService: No subscription found to update for licenseKey:", licenseKey)
      throw new Error("Subscription document not found for update.")
    }

    const docRef = doc(db, "subscriptions", querySnapshot.docs[0].id)

    const updateData: { [key: string]: any } = { ...updates }
    if (updateData.startDate instanceof Date) {
      updateData.startDate = updateData.startDate
    }
    if (updateData.endDate instanceof Date) {
      updateData.endDate = updateData.endDate
    } else if (updateData.endDate === null) {
      updateData.endDate = null
    }
    if (updateData.trialEndDate instanceof Date) {
      updateData.trialEndDate = updateData.trialEndDate
    } else if (updateData.trialEndDate === null) {
      updateData.trialEndDate = null
    }
    updateData.updatedAt = serverTimestamp()

    // Recalculate limits if planType changes
    if (updates.planType || updates.billingCycle || updates.startDate) {
      const currentSubscription = querySnapshot.docs[0].data() as Subscription
      const newPlanType = updates.planType || currentSubscription.planType
      const newBillingCycle = updates.billingCycle || currentSubscription.billingCycle
      const newStartDate = updates.startDate || currentSubscription.startDate

      const { endDate: recalculatedEndDate, trialEndDate: recalculatedTrialEndDate } = calculateSubscriptionEndDate(
        newPlanType,
        newBillingCycle,
        newStartDate instanceof Timestamp ? newStartDate.toDate() : newStartDate,
      )
      updateData.endDate = recalculatedEndDate
      updateData.trialEndDate = recalculatedTrialEndDate
      updateData.maxProducts = getMaxProductsForPlan(newPlanType)
      updateData.maxUsers = getMaxUsersForPlan(newPlanType) // Update maxUsers when plan changes
    }

    await updateDoc(docRef, updateData)
    console.log("subscriptionService: Subscription updated successfully for ID:", docRef.id)
  },

  getDaysRemaining(subscription: Subscription): number {
    if (!subscription.trialEndDate) {
      return 0
    }
    const today = new Date()
    const trialEnd = new Date(subscription.trialEndDate)
    const diffTime = trialEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  },

  // New method to check if user limit is reached
  async checkUserLimit(licenseKey: string): Promise<{ canInvite: boolean; currentUsers: number; maxUsers: number }> {
    console.log("subscriptionService: Checking user limit for licenseKey:", licenseKey)

    const subscription = await this.getSubscriptionByLicenseKey(licenseKey)
    if (!subscription) {
      return { canInvite: false, currentUsers: 0, maxUsers: 0 }
    }

    // Count current users with this license key
    const usersRef = collection(db, "iboard_users")
    const usersQuery = query(usersRef, where("license_key", "==", licenseKey))
    const usersSnapshot = await getDocs(usersQuery)
    const currentUsers = usersSnapshot.size

    const maxUsers = subscription.maxUsers
    const canInvite = maxUsers === -1 || currentUsers < maxUsers // -1 means unlimited

    console.log("subscriptionService: User limit check result:", { canInvite, currentUsers, maxUsers })
    return { canInvite, currentUsers, maxUsers }
  },
}

// This function provides the list of available plans.
// In a real-world scenario, these might come from a database or a payment provider.
export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: "solo",
      name: "Solo Plan",
      description: "Ideal for first time users and media owners with 1-3 OOH sites.",
      price: 1500,
      billingCycle: "monthly",
      maxProducts: 3,
      maxUsers: 12,
      features: [
        "Manage up to 3 sites",
        "Up to 12 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ],
      buttonText: "Select Solo Plan",
    },
    {
      id: "family",
      name: "Family Plan",
      description: "Ideal for media owners with around 5 OOH sites.",
      price: 2100,
      billingCycle: "monthly",
      maxProducts: 5,
      maxUsers: 18,
      features: [
        "Manage up to 5 sites",
        "Up to 18 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS",
      ],
      buttonText: "Select Family Plan",
    },
    {
      id: "membership",
      name: "Membership",
      description: "Access exclusive perks and features from OH!Plus.",
      price: 30000,
      billingCycle: "annually",
      maxProducts: 8,
      maxUsers: 20,
      features: [
        "Manage up to 8 sites",
        "Up to 20 users",
        "FREE Listing to OOH Marketplaces",
        "FREE 1-Day onboarding training",
        "ERP + Programmatic CMS + Planning",
        "OH!Plus Lite for 3 sites",
      ],
      buttonText: "Be an OH!Plus member",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Tailored for large companies with extensive needs.",
      price: 0,
      billingCycle: "N/A",
      maxProducts: -1, // Unlimited
      maxUsers: -1, // Unlimited
      features: [
        "Unlimited sites",
        "Unlimited users",
        "Flexible Pricing",
        "Flexible Payment Terms",
        "Embassy Privileges",
        "Priority Assistance",
        "Full Access",
      ],
      buttonText: "Let's Talk",
    },
    {
      id: "trial",
      name: "Trial Plan",
      description: "Try out our platform for a limited time.",
      price: 0,
      billingCycle: "N/A",
      maxProducts: 3,
      maxUsers: 5,
      features: ["60-day free trial", "Up to 3 sites", "Up to 5 users", "Limited features", "Basic support"],
      buttonText: "Start Free Trial",
    },
    {
      id: "graphic-expo-event",
      name: "Graphic Expo Event",
      description: "Special plan for Graphic Expo attendees.",
      price: 0,
      billingCycle: "N/A",
      maxProducts: 5,
      maxUsers: 10,
      features: ["5 Products", "10 users", "Event-specific features", "Limited duration"],
      buttonText: "Activate Event Plan",
    },
  ]
}
