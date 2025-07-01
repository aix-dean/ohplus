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
} from "firebase/firestore"
import {
  type Subscription,
  type SubscriptionPlanType,
  type BillingCycle,
  type SubscriptionStatus,
  calculateSubscriptionEndDate,
  getMaxProductsForPlan,
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
      startDate: startDate, // Store as Date object, Firestore will convert to Timestamp
      endDate: endDate || calculatedEndDate, // Use provided or calculated
      status,
      maxProducts: maxProducts || getMaxProductsForPlan(planType),
      trialEndDate: trialEndDate || calculatedTrialEndDate, // Use provided or calculated
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Use addDoc to let Firestore generate the document ID
    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)
    console.log("subscriptionService: Subscription created with ID:", docRef.id)

    // Return the created subscription with the Firestore ID and converted dates
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
      trialEndDate: trialEndDate || calculatedTrialEndDate,
      createdAt: new Date(), // Approximate, will be updated on next fetch
      updatedAt: new Date(), // Approximate, will be updated on next fetch
    }
    return newSubscription
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    console.log("subscriptionService: Fetching subscription for licenseKey:", licenseKey)
    const subscriptionsRef = collection(db, "subscriptions")
    const q = query(subscriptionsRef, where("licenseKey", "==", licenseKey))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("subscriptionService: No subscription found for licenseKey:", licenseKey)
      return null
    }

    const docSnap = querySnapshot.docs[0]
    const data = docSnap.data()

    // Convert Firestore Timestamps to JavaScript Date objects
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
      throw new Error("Subscription not found for update.")
    }

    const docRef = doc(db, "subscriptions", querySnapshot.docs[0].id)

    // Prepare updates, converting Date objects to serverTimestamp if present
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

    // Recalculate endDate and trialEndDate if planType or billingCycle changes
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
    return Math.max(0, diffDays) // Ensure it doesn't return negative days
  },
}

// This function provides the list of available plans.
// In a real-world scenario, these might come from a database or a payment provider.
export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: "trial",
      name: "Trial Plan",
      price: 0,
      features: ["60-day free trial", "Limited features", "Basic support"],
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: 9.99,
      features: ["All Trial features", "3 Products", "Standard support", "Monthly billing"],
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 29.99,
      features: ["All Basic features", "10 Products", "Priority support", "Monthly or Annual billing"],
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: 99.99,
      features: ["All Premium features", "Unlimited Products", "Dedicated support", "Custom integrations"],
    },
    {
      id: "graphic-expo-event",
      name: "Graphic Expo Event",
      price: 0, // Assuming this is a special free event plan
      features: ["5 Products", "Event-specific features", "Limited duration"],
    },
  ]
}
