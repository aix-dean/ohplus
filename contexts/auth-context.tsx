"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
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
  email: string | null
  displayName: string | null
  license_key: string | null
  company_id?: string | null
  role: string | null
  permissions: string[]
  // Add other user-specific data here
}

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  subscriptionData: Subscription | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    personalInfo: {
      email: string
      first_name: string
      last_name: string
      middle_name: string
      phone_number: string
      gender: string
    },
    password: string,
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  updateProjectData: (updates: Partial<ProjectData>) => Promise<void>
  refreshUserData: () => Promise<void>
  refreshSubscriptionData: () => Promise<void>
  assignLicenseKey: (uid: string, licenseKey: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
  license_key?: string | null
  created?: Date
  updated?: Date
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // Corrected collection name to "iboard_users"
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      let fetchedUserData: UserData

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        fetchedUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: (data.license_key as string | null) || null, // Explicitly cast to string | null
          company_id: (data.company_id as string | null) || null, // Add company_id field
          role: data.role || "user", // Default role
          permissions: data.permissions || [], // Default empty permissions
          ...data, // Spread any other fields
        }
      } else {
        // If user document doesn't exist, create a basic one in "iboard_users"
        fetchedUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: null, // Will be assigned during registration/onboarding
          company_id: null, // Will be assigned when user registers company
          role: "user",
          permissions: [],
        }
        await setDoc(userDocRef, fetchedUserData, { merge: true })
      }
      setUserData(fetchedUserData)

      // Fetch project data if project_id exists in user data
      if (fetchedUserData.project_id) {
        const projectDocRef = doc(db, "projects", fetchedUserData.project_id)
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
            license_key: projectData.license_key, // Fetch license_key for project data
            created: projectData.created?.toDate(),
            updated: projectData.updated?.toDate(),
          })
        } else {
          setProjectData(null)
        }
      } else {
        setProjectData(null)
      }

      // Fetch subscription data if license_key exists
      if (fetchedUserData.license_key) {
        const subscription = await subscriptionService.getSubscriptionByLicenseKey(fetchedUserData.license_key)
        setSubscriptionData(subscription)
      } else {
        setSubscriptionData(null)
      }
    } catch (error) {
      console.error("Error fetching user data or subscription:", error)
      setUserData(null)
      setProjectData(null)
      setSubscriptionData(null)
    }
  }, [])

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserData(user)
    }
  }, [user, fetchUserData])

  const refreshSubscriptionData = useCallback(async () => {
    if (userData?.license_key) {
      const subData = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
      setSubscriptionData(subData)
    } else {
      setSubscriptionData(null)
    }
  }, [userData])

  const assignLicenseKey = useCallback(
    async (uid: string, licenseKey: string) => {
      try {
        // Corrected collection name to "iboard_users"
        const userDocRef = doc(db, "iboard_users", uid)
        await setDoc(userDocRef, { license_key: licenseKey }, { merge: true })
        // Update local state immediately
        setUserData((prev) => (prev ? { ...prev, license_key: licenseKey } : null))
        // Refresh subscription data after assigning license key
        await refreshSubscriptionData()
      } catch (error) {
        console.error("Error assigning license key:", error)
        throw error
      }
    },
    [refreshSubscriptionData],
  )

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

  const register = async (
    personalInfo: {
      email: string
      first_name: string
      last_name: string
      middle_name: string
      phone_number: string
      gender: string
    },
    password: string,
  ) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user
      setUser(firebaseUser)

      const licenseKey = generateLicenseKey() // Generate a new license key

      // Create user document in "iboard_users"
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        license_key: licenseKey, // Assign the generated license key
        company_id: null, // Will be assigned when user registers company
        role: "user", // Default role
        permissions: [], // Default empty permissions
        type: "OHPLUS", // Add this field
        created: serverTimestamp(),
        updated: serverTimestamp(),
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        middle_name: personalInfo.middle_name,
        phone_number: personalInfo.phone_number,
        gender: personalInfo.gender,
        project_id: firebaseUser.uid, // Assign project_id here
      })

      // Create a default project for the user
      const projectDocRef = doc(db, "projects", firebaseUser.uid) // Using UID as project ID for simplicity
      await setDoc(projectDocRef, {
        project_name: "My First Project",
        license_key: licenseKey, // Now also saving license_key to the project document
        created: serverTimestamp(),
        updated: serverTimestamp(),
      })

      await fetchUserData(firebaseUser)
    } catch (error) {
      console.error("Error in AuthContext register:", error) // Added logging
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
    // Corrected collection name to "iboard_users"
    const userDocRef = doc(db, "iboard_users", user.uid)
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
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [fetchUserData])

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
    refreshUserData,
    refreshSubscriptionData,
    assignLicenseKey,
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
