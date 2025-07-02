"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { onAuthStateChanged, type User as FirebaseUser, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { subscriptionService } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription"
import type { UserData } from "@/lib/types/auth" // Assuming you have this type defined

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  subscriptionData: Subscription | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  refreshSubscriptionData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      let fetchedUserData: UserData | null = null
      if (userDocSnap.exists()) {
        fetchedUserData = userDocSnap.data() as UserData
      } else {
        // If user data doesn't exist, create a basic entry (e.g., for new registrations)
        const newUserData: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          license_key: `LICENSE-${firebaseUser.uid.substring(0, 8).toUpperCase()}`, // Generate a simple license key
        }
        await setDoc(userDocRef, newUserData)
        fetchedUserData = newUserData
      }
      setUserData(fetchedUserData)

      // Fetch the latest active subscription using the user's UID
      const latestSubscription = await subscriptionService.getLatestActiveSubscriptionByUid(firebaseUser.uid)
      setSubscriptionData(latestSubscription)
    } catch (error) {
      console.error("Error fetching user data or subscription:", error)
      setUserData(null)
      setSubscriptionData(null)
    }
  }, [])

  const refreshSubscriptionData = useCallback(async () => {
    if (user) {
      await fetchUserData(user) // Re-fetch user data and then subscription
    }
  }, [user, fetchUserData])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await fetchUserData(firebaseUser)
      } else {
        setUser(null)
        setUserData(null)
        setSubscriptionData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchUserData])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged listener will handle setting user and data
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      // onAuthStateChanged listener will handle clearing user and data
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        subscriptionData,
        loading,
        signIn,
        signOutUser,
        refreshSubscriptionData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
