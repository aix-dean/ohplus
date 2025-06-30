import { db } from "./firebase"
import { addDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore"
import type { Subscription, SubscriptionPlanType, BillingCycle, SubscriptionStatus } from "./types/subscription"
import { calculateSubscriptionEndDate, getMaxProductsForPlan } from "./types/subscription" // Import helper functions

export const subscriptionService = {
  /**
   * Creates a new subscription document.
   * @param licenseKey The license key associated with the subscription.
   * @param planType The subscription plan type.
   * @param billingCycle The billing cycle.
   * @param uid The user ID.
   * @param startDate The start date of the subscription.
   * @param endDate The end date of the subscription (optional, calculated if null).
   * @param status The status of the subscription.
   * @param maxProducts The max products allowed (optional, calculated if null).
   * @param maxUsers The max users allowed (optional, calculated if null).
   * @param features The features enabled (optional, calculated if null).
   * @param trialEndDate The trial end date (optional, calculated if null).
   * @returns The Firestore document ID of the created subscription.
   */
  createSubscription: async (
    licenseKey: string,
    planType: SubscriptionPlanType,
    billingCycle: BillingCycle,
    uid: string,
    startDate: Date,
    endDate: Date | null = null,
    status: SubscriptionStatus = "active",
    maxProducts: number | null = null,
    maxUsers: number | null = null, // Keeping for consistency if used elsewhere, though not in image
    features: string[] = [], // Keeping for consistency if used elsewhere, though not in image
    trialEndDate: Date | null = null,
  ): Promise<string> => {
    const { endDate: calculatedEndDate, trialEndDate: calculatedTrialEndDate } = calculateSubscriptionEndDate(
      planType,
      billingCycle,
      startDate,
    )
    const finalMaxProducts = maxProducts ?? getMaxProductsForPlan(planType)

    const newSubscriptionData = {
      licenseKey,
      uid,
      planType,
      billingCycle,
      status,
      maxProducts: finalMaxProducts,
      // maxUsers and features are not in the provided image model, so they are excluded from the document data
      startDate: serverTimestamp(), // Store as server timestamp
      endDate: endDate ? serverTimestamp() : calculatedEndDate ? serverTimestamp() : null, // Store as server timestamp
      trialEndDate: trialEndDate ? serverTimestamp() : calculatedTrialEndDate ? serverTimestamp() : null, // Store as server timestamp
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Use addDoc to let Firestore generate a unique document ID
    const newDocRef = await addDoc(collection(db, "subscriptions"), newSubscriptionData)
    return newDocRef.id
  },

  /**
   * Retrieves a subscription document by its license key.
   * @param licenseKey The license key of the subscription.
   * @returns The subscription object or null if not found.
   */
  getSubscriptionByLicenseKey: async (licenseKey: string): Promise<Subscription | null> => {
    const q = query(collection(db, "subscriptions"), where("licenseKey", "==", licenseKey))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      const data = docSnap.data()

      // Convert Firestore Timestamps to Date objects
      const subscription: Subscription = {
        id: docSnap.id, // Add the Firestore document ID
        billingCycle: data.billingCycle,
        createdAt: data.createdAt?.toDate(),
        endDate: data.endDate?.toDate() || null,
        licenseKey: data.licenseKey,
        maxProducts: data.maxProducts,
        planType: data.planType,
        startDate: data.startDate?.toDate(),
        status: data.status,
        trialEndDate: data.trialEndDate?.toDate() || null,
        uid: data.uid,
        updatedAt: data.updatedAt?.toDate(),
      }
      return subscription
    } else {
      return null
    }
  },

  /**
   * Updates an existing subscription.
   * @param licenseKey The license key of the subscription to update.
   * @param updates Partial updates to apply to the subscription.
   */
  updateSubscription: async (licenseKey: string, updates: Partial<Subscription>): Promise<void> => {
    const q = query(collection(db, "subscriptions"), where("licenseKey", "==", licenseKey))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.warn("No subscription found with license key:", licenseKey, "for update.")
      throw new Error("Subscription not found for update.")
    }

    const docRef = querySnapshot.docs[0].ref
    const updateData: { [key: string]: any } = { ...updates, updatedAt: serverTimestamp() }

    // Convert Date objects in updates to serverTimestamp
    if (updateData.startDate instanceof Date) updateData.startDate = serverTimestamp()
    if (updateData.endDate instanceof Date) updateData.endDate = serverTimestamp()
    if (updateData.trialEndDate instanceof Date) updateData.trialEndDate = serverTimestamp()
    // createdAt should not be updated after creation
    delete updateData.createdAt
    // id, licenseKey, uid should not be updated via partial updates here as they are identifiers
    delete updateData.id
    delete updateData.licenseKey
    delete updateData.uid

    await setDoc(docRef, updateData, { merge: true })
  },

  /**
   * Checks if a subscription is currently active.
   * @param subscription The subscription object.
   * @returns True if the subscription is active and not expired, false otherwise.
   */
  isSubscriptionActive: (subscription: Subscription | null): boolean => {
    if (!subscription) {
      return false
    }
    const now = new Date()
    return subscription.status === "active" && (subscription.endDate === null || now < subscription.endDate)
  },

  /**
   * Checks if a subscription has expired.
   * @param subscription The subscription object.
   * @returns True if the subscription has expired, false otherwise.
   */
  isSubscriptionExpired: (subscription: Subscription | null): boolean => {
    if (!subscription) {
      return true
    }
    const now = new Date()
    return subscription.status !== "active" || (subscription.endDate !== null && now >= subscription.endDate)
  },

  /**
   * Gets the number of days remaining until a subscription expires.
   * @param subscription The subscription object.
   * @returns The number of days remaining, or 0 if expired/no subscription.
   */
  getDaysRemaining: (subscription: Subscription | null): number => {
    if (!subscription || !subscription.endDate) {
      return 0
    }
    const now = new Date()
    if (now >= subscription.endDate) {
      return 0
    }
    const diffTime = subscription.endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  /**
   * Checks if a user can create a new product based on their subscription limits.
   * @param subscription The user's subscription data.
   * @param currentProductCount The current number of products the user has.
   * @returns True if the user can create more products, false otherwise.
   */
  canCreateProduct: (subscription: Subscription | null, currentProductCount: number): boolean => {
    if (!subscription || !subscriptionService.isSubscriptionActive(subscription)) {
      return false
    }
    if (subscription.maxProducts === null) {
      return true // Unlimited products
    }
    return currentProductCount < subscription.maxProducts
  },

  /**
   * Gets the maximum number of products allowed by the current subscription plan.
   * @param subscription The user's subscription data.
   * @returns The maximum number of products, or null if unlimited.
   */
  getMaxProducts: (subscription: Subscription | null): number | null => {
    return subscription?.maxProducts ?? null
  },
}
