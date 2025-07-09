"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
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
    companyInfo: {
      company_name: string
      company_location: string
    },
    password: string,
    orgCode?: string,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      let fetchedUserData: UserData

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        fetchedUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: (data.license_key as string | null) || null,
          company_id: (data.company_id as string | null) || null,
          role: data.role || "user",
          permissions: data.permissions || [],
          ...data,
        }
      } else {
        fetchedUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: null,
          company_id: null,
          role: "user",
          permissions: [],
        }
        await setDoc(userDocRef, fetchedUserData, { merge: true })
      }
      setUserData(fetchedUserData)

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
            license_key: projectData.license_key,
            created: projectData.created?.toDate(),
            updated: projectData.updated?.toDate(),
          })
        } else {
          setProjectData(null)
        }
      } else {
        setProjectData(null)
      }

      if (fetchedUserData.license_key) {
        const subData = await subscriptionService.getSubscriptionByLicenseKey(fetchedUserData.license_key)
        setSubscriptionData(subData)
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
        const userDocRef = doc(db, "iboard_users", uid)
        await setDoc(userDocRef, { license_key: licenseKey }, { merge: true })
        setUserData((prev) => (prev ? { ...prev, license_key: licenseKey } : null))
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
    companyInfo: {
      company_name: string
      company_location: string
    },
    password: string,
    orgCode?: string,
  ) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user
      setUser(firebaseUser)

      let licenseKey = generateLicenseKey()
      let companyId = null

      // If joining an organization, validate the code and get company info
      if (orgCode) {
        const orgCodeDoc = await getDoc(doc(db, "organization_codes", orgCode))
        if (!orgCodeDoc.exists()) {
          throw new Error("Invalid organization code.")
        }

        const orgData = orgCodeDoc.data()
        if (orgData.expires_at && orgData.expires_at.toDate() < new Date()) {
          throw new Error("Organization code has expired.")
        }

        if (orgData.used) {
          throw new Error("Organization code has already been used.")
        }

        // Use the organization's license key and company ID
        licenseKey = orgData.license_key
        companyId = orgData.company_id

        // Mark the code as used
        await updateDoc(doc(db, "organization_codes", orgCode), {
          used: true,
          used_by: firebaseUser.uid,
          used_at: serverTimestamp(),
        })
      }

      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        license_key: licenseKey,
        company_id: companyId,
        role: "user",
        permissions: [],
        type: "OHPLUS",
        created: serverTimestamp(),
        updated: serverTimestamp(),
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        middle_name: personalInfo.middle_name,
        phone_number: personalInfo.phone_number,
        gender: personalInfo.gender,
        project_id: orgCode ? null : firebaseUser.uid,
      })

      // Only create a project if not joining an organization
      if (!orgCode) {
        const projectDocRef = doc(db, "projects", firebaseUser.uid)
        await setDoc(projectDocRef, {
          company_name: companyInfo.company_name,
          company_location: companyInfo.company_location,
          project_name: "My First Project",
          license_key: licenseKey,
          created: serverTimestamp(),
          updated: serverTimestamp(),
        })
      }

      await fetchUserData(firebaseUser)
    } catch (error) {
      console.error("Error in AuthContext register:", error)
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
    const userDocRef = doc(db, "iboard_users", user.uid)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(userDocRef, updatedFields)
    setUserData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateProjectData = async (updates: Partial<ProjectData>) => {
    if (!user || !userData?.project_id) throw new Error("Project not found or user not authenticated.")
    const projectDocRef = doc(db, "projects", userData.project_id)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(projectDocRef, updatedFields)
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
