"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { subscriptionService } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription"
import { generateLicenseKey } from "@/lib/utils" // Assuming this utility exists

interface UserData {
  uid: string
  email: string
  first_name?: string
  middle_name?: string
  last_name?: string
  display_name?: string
  phone_number?: string
  gender?: string
  photo_url?: string
  license_key: string
  products?: number
  followers?: number
  rating?: number
  created?: Date
  updated?: Date
}

interface ProjectData {
  project_id: string
  company_name?: string
  company_location?: string
  company_website?: string
  project_name?: string
  social_media?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  created?: Date
  updated?: Date
}

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  projectData: ProjectData | null
  subscriptionData: Subscription | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  updateProjectData: (updates: Partial<ProjectData>) => Promise<void>
  refreshSubscriptionData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        const fetchedUserData: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          display_name: data.display_name,
          phone_number: data.phone_number,
          gender: data.gender,
          photo_url: data.photo_url,
          license_key: data.license_key,
          products: data.products || 0,
          followers: data.followers || 0,
          rating: data.rating || 0,
          created: data.created?.toDate(),
          updated: data.updated?.toDate(),
        }
        setUserData(fetchedUserData)

        // Fetch project data if project_id exists in user data
        if (data.project_id) {
          const projectDocRef = doc(db, "projects", data.project_id)
          const projectDocSnap = await getDoc(projectDocRef)
          if (projectDocSnap.exists()) {
            const projectData = projectDocSnap.data()
            setProjectData({
              project_id: projectDocSnap.id,
              company_name: projectData.company_name,
              company_location: projectData.company_location,
              company_website: projectData.company_website,
              project_name: projectData.project_name,
              social_media: projectData.social_media,
              created: projectData.created?.toDate(),
              updated: projectData.updated?.toDate(),
            })
          } else {
            setProjectData(null)
          }
        } else {
          setProjectData(null)
        }

        // Fetch subscription data using license_key
        if (fetchedUserData.license_key) {
          const subscription = await subscriptionService.getSubscriptionByLicenseKey(fetchedUserData.license_key)
          setSubscriptionData(subscription)
        } else {
          setSubscriptionData(null)
        }
      } else {
        setUserData(null)
        setProjectData(null)
        setSubscriptionData(null)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setUserData(null)
      setProjectData(null)
      setSubscriptionData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSubscriptionData = useCallback(async () => {
    if (user && userData?.license_key) {
      const subscription = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
      setSubscriptionData(subscription)
    }
  }, [user, userData])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await fetchUserData(firebaseUser)
      } else {
        setUser(null)
        setUserData(null)
        setProjectData(null)
        setSubscriptionData(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [fetchUserData])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      await fetchUserData(userCredential.user)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const register = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      setUser(firebaseUser)

      const licenseKey = generateLicenseKey() // Generate a new license key

      // Create user document
      const userDocRef = doc(db, "users", firebaseUser.uid)
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        license_key: licenseKey, // Assign the generated license key
        created: serverTimestamp(),
        updated: serverTimestamp(),
      })

      // Create a default project for the user
      const projectDocRef = doc(db, "projects", firebaseUser.uid) // Using UID as project ID for simplicity
      await setDoc(projectDocRef, {
        company_name: "My Company",
        project_name: "My First Project",
        created: serverTimestamp(),
        updated: serverTimestamp(),
      })

      // Create a default trial subscription for the user
      await subscriptionService.createSubscription(licenseKey, "trial", "monthly", firebaseUser.uid)

      await fetchUserData(firebaseUser)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      setUser(null)
      setUserData(null)
      setProjectData(null)
      setSubscriptionData(null)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw error
    }
  }

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!user) throw new Error("User not authenticated.")
    const userDocRef = doc(db, "users", user.uid)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(userDocRef, updatedFields)
    // Optimistically update state
    setUserData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateProjectData = async (updates: Partial<ProjectData>) => {
    if (!user || !userData?.project_id) throw new Error("Project not found or user not authenticated.")
    const projectDocRef = doc(db, "projects", userData.project_id)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(projectDocRef, updatedFields)
    // Optimistically update state
    setProjectData((prev) => (prev ? { ...prev, ...updates } : null))
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
    resetPassword,
    updateUserData,
    updateProjectData,
    refreshSubscriptionData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
