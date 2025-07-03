import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import type { Subscription } from "@/lib/types/subscription"

export const subscriptionService = {
  async getSubscriptionByLicenseKey(licenseKey: string): Promise<Subscription | null> {
    try {
      const subscriptionsRef = collection(db, "subscriptions")
      const q = query(subscriptionsRef, where("license_key", "==", licenseKey))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data()
        return {
          id: querySnapshot.docs[0].id,
          license_key: docData.license_key,
          plan_id: docData.plan_id,
          status: docData.status,
          start_date: docData.start_date?.toDate(),
          end_date: docData.end_date?.toDate(),
          created_at: docData.created_at?.toDate(),
          updated_at: docData.updated_at?.toDate(),
        } as Subscription
      }
      return null
    } catch (error) {
      console.error("Error getting subscription by license key:", error)
      throw error
    }
  },

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    try {
      const docRef = doc(db, "subscriptions", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const docData = docSnap.data()
        return {
          id: docSnap.id,
          license_key: docData.license_key,
          plan_id: docData.plan_id,
          status: docData.status,
          start_date: docData.start_date?.toDate(),
          end_date: docData.end_date?.toDate(),
          created_at: docData.created_at?.toDate(),
          updated_at: docData.updated_at?.toDate(),
        } as Subscription
      }
      return null
    } catch (error) {
      console.error("Error getting subscription by ID:", error)
      throw error
    }
  },

  async createSubscription(
    subscription: Omit<Subscription, "id" | "created_at" | "updated_at">,
  ): Promise<Subscription> {
    try {
      const docRef = await addDoc(collection(db, "subscriptions"), {
        ...subscription,
        created_at: new Date(),
        updated_at: new Date(),
      })
      const newSubscription = await this.getSubscriptionById(docRef.id)
      if (!newSubscription) throw new Error("Failed to retrieve new subscription")
      return newSubscription
    } catch (error) {
      console.error("Error creating subscription:", error)
      throw error
    }
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    try {
      const docRef = doc(db, "subscriptions", id)
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date(),
      })
    } catch (error) {
      console.error("Error updating subscription:", error)
      throw error
    }
  },

  async deleteSubscription(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "subscriptions", id))
    } catch (error) {
      console.error("Error deleting subscription:", error)
      throw error
    }
  },
}
