import { db } from "@/lib/firebase"
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from "firebase/firestore"
import type { Subscription, SubscriptionPlan, SubscriptionPlanType } from "@/lib/types/subscription"

// Mock data for available subscription plans
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return [
    {
      id: "free-plan",
      name: "Free Plan",
      price: 0,
      features: ["Basic features", "Limited storage", "Community support"],
    },
    {
      id: "basic-plan",
      name: "Basic Plan",
      price: 9.99,
      features: ["All Free features", "500 GB storage", "Email support", "Basic analytics"],
    },
    {
      id: "pro-plan",
      name: "Pro Plan",
      price: 29.99,
      features: ["All Basic features", "Unlimited storage", "Priority support", "Advanced analytics", "Custom reports"],
    },
    {
      id: "enterprise-plan",
      name: "Enterprise Plan",
      price: 99.99,
      features: ["All Pro features", "Dedicated account manager", "SLA", "On-premise deployment options"],
    },
  ]
}

const SUBSCRIPTIONS_COLLECTION = "subscriptions"

export const subscriptionService = {
  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    try {
      const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("licenseKey", "==", licenseKey))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data() as Subscription
        return { ...docData, id: querySnapshot.docs[0].id }
      }
      return null
    } catch (error) {
      console.error("Error getting subscription by license key:", error)
      throw error
    }
  },

  async createSubscription(subscriptionData: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> {
    try {
      const newDocRef = doc(collection(db, SUBSCRIPTIONS_COLLECTION))
      const now = new Date().toISOString()
      const subscription: Subscription = {
        ...subscriptionData,
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
      }
      await setDoc(newDocRef, subscription)
      return subscription
    } catch (error) {
      console.error("Error creating subscription:", error)
      throw error
    }
  },

  async updateSubscription(licenseKey: string, updates: Partial<Omit<Subscription, "id" | "licenseKey" | "createdAt">>): Promise<void> {
    try {
      const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("licenseKey", "==", licenseKey))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("Subscription not found for the given license key.")
      }

      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() })
    } catch (error) {
      console.error("Error updating subscription:", error)
      throw error
    }
  },
}
