import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, Timestamp } from "firebase/firestore"
import {
  calculateSubscriptionEndDate,
  getMaxProductsForPlan,
  type BillingCycle,
  type Subscription,
  type SubscriptionPlanType,
} from "./types/subscription"

const SUBSCRIPTIONS_COLLECTION = "subscriptions"

export const subscriptionService = {
  async createSubscription(
    licenseKey: string,
    planType: SubscriptionPlanType,
    billingCycle: BillingCycle,
    uid: string,
  ): Promise<Subscription> {
    const now = new Date()
    const { endDate, trialEndDate } = calculateSubscriptionEndDate(planType, billingCycle, now)

    const newSubscription: Omit<Subscription, "id"> = {
      licenseKey,
      uid,
      planType,
      billingCycle,
      status: planType === "Trial" ? "trialing" : "active",
      maxProducts: getMaxProductsForPlan(planType),
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      trialEndDate: trialEndDate ? Timestamp.fromDate(trialEndDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    }

    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), newSubscription)
    return { id: docRef.id, ...newSubscription } as Subscription
  },

  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("licenseKey", "==", licenseKey))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      return { id: docSnap.id, ...docSnap.data() } as Subscription
    }
    return null
  },

  async updateSubscription(
    licenseKey: string,
    updates: Partial<Omit<Subscription, "id" | "licenseKey" | "createdAt">>,
  ): Promise<void> {
    const existingSubscription = await this.getSubscriptionByLicenseKey(licenseKey)
    if (!existingSubscription) {
      throw new Error("Subscription not found for the given license key.")
    }

    const subscriptionDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, existingSubscription.id)

    const now = new Date()
    let updatedEndDate = existingSubscription.endDate.toDate()
    let updatedTrialEndDate = existingSubscription.trialEndDate?.toDate() || null
    let updatedStatus = updates.status || existingSubscription.status
    let updatedMaxProducts = updates.maxProducts || existingSubscription.maxProducts

    // If planType or billingCycle is changing, recalculate endDate and maxProducts
    if (updates.planType || updates.billingCycle) {
      const newPlanType = updates.planType || existingSubscription.planType
      const newBillingCycle = updates.billingCycle || existingSubscription.billingCycle

      const { endDate, trialEndDate } = calculateSubscriptionEndDate(newPlanType, newBillingCycle, now)
      updatedEndDate = endDate
      updatedTrialEndDate = trialEndDate
      updatedMaxProducts = getMaxProductsForPlan(newPlanType)

      // If upgrading from Trial, set status to active
      if (existingSubscription.planType === "Trial" && newPlanType !== "Trial") {
        updatedStatus = "active"
        updatedTrialEndDate = null // Clear trial end date if no longer on trial
      }
    }

    await updateDoc(subscriptionDocRef, {
      ...updates,
      endDate: Timestamp.fromDate(updatedEndDate),
      trialEndDate: updatedTrialEndDate ? Timestamp.fromDate(updatedTrialEndDate) : null,
      maxProducts: updatedMaxProducts,
      status: updatedStatus,
      updatedAt: Timestamp.fromDate(now),
    })
  },

  isSubscriptionActive(subscription: Subscription): boolean {
    const now = new Date()

    // Handle trial status first
    if (subscription.status === "trialing" && subscription.trialEndDate) {
      const trialEndDate = subscription.trialEndDate.toDate()
      return now <= trialEndDate
    }

    // For active status, ensure endDate exists and is not past
    if (subscription.status === "active" && subscription.endDate) {
      const endDate = subscription.endDate.toDate()
      return now <= endDate
    }

    return false // Not active if status is not 'trialing' or 'active', or if dates are missing
  },

  isSubscriptionExpired(subscription: Subscription): boolean {
    return !this.isSubscriptionActive(subscription)
  },

  getDaysRemaining(subscription: Subscription): number {
    const now = new Date()
    let relevantEndDate: Date | null = null

    if (subscription.status === "trialing" && subscription.trialEndDate) {
      relevantEndDate = subscription.trialEndDate.toDate()
    } else if (subscription.endDate) {
      relevantEndDate = subscription.endDate.toDate()
    }

    if (!relevantEndDate) return 0

    const diffTime = relevantEndDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  },
}
