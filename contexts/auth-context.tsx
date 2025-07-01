"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { generateLicenseKey } from "@/lib/utils"
import { subscriptionService } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription" // Import all necessary types

interface UserData {
  uid: string
  email: string
  display_name: string
  first_name: string
  middle_name: string
  last_name: string
  license_key: string | null
  photo_url: string
  phone_number: string
  location: string
  gender: string
  type: string
  active: boolean
  onboarding: boolean
  products: number
  products_count: {
    merchandise: number
    rental: number
  }
  rating: number
  followers: number
  created: any
  created_time: any
  active_date: any
  updated: any
  tenant_id?: string
}

interface ProjectData {
  id: string
  uid: string
  license_key: string
  project_name: string
  company_name: string
  company_location: string
  company_website: string
  social_media: {
    facebook: string
    instagram: string
    youtube: string
  }
  created: any
  updated: any
  deleted: boolean
  tenant_id?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  projectData: ProjectData | null
  subscriptionData: Subscription | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: Partial<UserData>, projectData: Partial<ProjectData>, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
  updateProjectData: (data: Partial<ProjectData>) => Promise<void>
  updateSubscriptionData: (updates: Partial<Subscription>) => Promise<void> // Changed to Partial<Subscription>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  // Ensure tenant ID is set
  useEffect(() => {
    if (auth && !auth.tenantId) {
      auth.tenantId = "ohplus-07hsi"
      console.log("Tenant ID set to:", auth.tenantId)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, "iboard_users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData
          setUserData(userData)

          // Fetch project data using license key (consistent approach)
          if (userData.license_key) {
            const projectDocRef = doc(db, "projects", userData.license_key) // Use license_key as doc ID
            const projectDoc = await getDoc(projectDocRef)

            if (projectDoc.exists()) {
              setProjectData(projectDoc.data() as ProjectData)
            } else {
              console.warn("Project document not found for license key:", userData.license_key)
              setProjectData(null)
            }

            // Fetch subscription data using license key
            try {
              const subscription = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
              setSubscriptionData(subscription)
            } catch (error) {
              console.error("Error fetching subscription data:", error)
              setSubscriptionData(null)
            }
          } else {
            console.warn("User data missing license_key for user:", user.uid)
            setProjectData(null)
            setSubscriptionData(null)
          }
        } else {
          console.warn("User document not found for uid:", user.uid)
          setUserData(null)
          setProjectData(null)
          setSubscriptionData(null)
        }
      } else {
        setUserData(null)
        setProjectData(null)
        setSubscriptionData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Ensure tenant ID is set before login
      if (auth && !auth.tenantId) {
        auth.tenantId = "ohplus-07hsi"
      }

      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (userData: Partial<UserData>, projectData: Partial<ProjectData>, password: string) => {
    try {
      // Ensure tenant ID is set before registration
      if (auth && !auth.tenantId) {
        auth.tenantId = "ohplus-07hsi"
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email as string, password)
      const user = userCredential.user
      const licenseKey = generateLicenseKey()

      const newUserData: UserData = {
        uid: user.uid,
        email: userData.email as string,
        display_name: userData.display_name || "",
        first_name: userData.first_name || "",
        middle_name: userData.middle_name || "",
        f_name: userData.last_name || "",
        license_key: null,
        photo_url: userData.photo_url || "",
        phone_number: userData.phone_number || "",
        location: userData.location || "",
        gender: userData.gender || "",
        type: userData.type || "user",
        active: true,
        onboarding: true,
        products: 0,
        products_count: {
          merchandise: 0,
          rental: 0,
        },
        rating: 0,
        followers: 0,
        created: serverTimestamp(),
        created_time: serverTimestamp(),
        active_date: serverTimestamp(),
        updated: serverTimestamp(),
        tenant_id: "ohplus-07hsi",
      }

      await setDoc(doc(db, "iboard_users", user.uid), newUserData)

      const newProjectData: ProjectData = {
        id: crypto.randomUUID(),
        uid: user.uid,
        license_key: licenseKey,
        project_name: projectData.company_name || "New Project",
        company_name: projectData.company_name || "",
        company_location: projectData.company_location || "",
        company_website: "",
        social_media: {
          facebook: "",
          instagram: "",
          youtube: "",
        },
        created: serverTimestamp(),
        updated: serverTimestamp(),
        deleted: false,
        tenant_id: "ohplus-07hsi",
      }

      await setDoc(doc(db, "projects", licenseKey), newProjectData)

      setUserData(newUserData)
      setProjectData(newProjectData)
      setSubscriptionData(null)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return

    try {
      const userDocRef = doc(db, "iboard_users", user.uid)
      await setDoc(userDocRef, { ...data, updated: serverTimestamp() }, { merge: true })

      setUserData((prev) => (prev ? { ...prev, ...data } : null))
    } catch (error) {
      console.error("Update user data error:", error)
      throw error
    }
  }

  const updateProjectData = async (data: Partial<ProjectData>) => {
    if (!userData?.license_key) return

    try {
      const projectDocRef = doc(db, "projects", userData.license_key)
      await setDoc(projectDocRef, { ...data, updated: serverTimestamp() }, { merge: true })

      setProjectData((prev) => (prev ? { ...prev, ...data } : null))
    } catch (error) {
      console.error("Update project data error:", error)
      throw error
    }
  }

  const updateSubscriptionData = async (updates: Partial<Subscription>) => {
    if (!userData?.license_key) {
      console.error("updateSubscriptionData: No license key found for user data.")
      return
    }

    console.log("updateSubscriptionData: Attempting to update subscription for license key:", userData.license_key)
    console.log("updateSubscriptionData: Updates:", updates)

    try {
      await subscriptionService.updateSubscription(userData.license_key, updates)

      const updatedSubscription = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
      setSubscriptionData(updatedSubscription)
      console.log("updateSubscriptionData: Subscription updated and state refreshed successfully.")
    } catch (error) {
      console.error("updateSubscriptionData: Error updating subscription data:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    projectData,
    subscriptionData,
    loading,
    login,
    register,
    logout,
    updateUserData,
    updateProjectData,
    updateSubscriptionData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
