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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { subscriptionService } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription"
import { generateLicenseKey } from "@/lib/utils"
import { assignRoleToUser, type RoleType } from "@/lib/hardcoded-access-service"

interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  license_key: string | null
  company_id?: string | null
  role: string | null
  permissions: string[]
  project_id?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  phone_number?: string
  gender?: string
  type?: string
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
  license_key?: string | null
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
  loginOHPlusOnly: (email: string, password: string) => Promise<void>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // Query iboard_users collection by uid field
      const usersQuery = query(collection(db, "iboard_users"), where("uid", "==", firebaseUser.uid))
      const usersSnapshot = await getDocs(usersQuery)

      let fetchedUserData: UserData

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0]
        const data = userDoc.data()

        fetchedUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: data.license_key || null,
          role: data.role || "user",
          permissions: data.permissions || [],
          project_id: data.project_id,
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          phone_number: data.phone_number,
          gender: data.gender,
          type: data.type,
          created: data.created?.toDate(),
          updated: data.updated?.toDate(),
          company_id: data.company_id || null,
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

        // Create the user document with uid field
        const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
        await setDoc(
          userDocRef,
          {
            ...fetchedUserData,
            created: serverTimestamp(),
            updated: serverTimestamp(),
          },
          { merge: true },
        )
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

      // Fetch subscription data
      let subscription = null

      if (fetchedUserData.license_key) {
        try {
          subscription = await subscriptionService.getSubscriptionByLicenseKey(fetchedUserData.license_key)
        } catch (subscriptionError) {
          console.error("Error fetching subscription by license_key:", subscriptionError)
        }
      }

      if (!subscription && fetchedUserData.company_id) {
        try {
          subscription = await subscriptionService.getSubscriptionByCompanyId(fetchedUserData.company_id)
        } catch (subscriptionError) {
          console.error("Error fetching subscription by company_id:", subscriptionError)
        }
      }

      setSubscriptionData(subscription)
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
      try {
        let subData = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)

        if (!subData && userData.company_id) {
          subData = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
        }

        setSubscriptionData(subData)
      } catch (error) {
        console.error("Error refreshing subscription data:", error)
        setSubscriptionData(null)
      }
    } else if (userData?.company_id) {
      try {
        const subData = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
        setSubscriptionData(subData)
      } catch (error) {
        console.error("Error refreshing subscription data by company_id:", error)
        setSubscriptionData(null)
      }
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

  const findOHPlusAccount = async (uid: string) => {
    try {
      const usersQuery = query(collection(db, "iboard_users"), where("uid", "==", uid), where("type", "==", "OHPLUS"))
      const usersSnapshot = await getDocs(usersQuery)
      return !usersSnapshot.empty
    } catch (error) {
      console.error("Error finding OHPLUS account:", error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      await fetchUserData(userCredential.user)
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
      throw error
    }
  }

  const loginOHPlusOnly = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      const isOHPlusAccount = await findOHPlusAccount(userCredential.user.uid)

      if (!isOHPlusAccount) {
        await signOut(auth)
        throw new Error("OHPLUS_ACCOUNT_NOT_FOUND")
      }

      setUser(userCredential.user)
      await fetchUserData(userCredential.user)
    } catch (error) {
      console.error("OHPLUS login error:", error)
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user

      let licenseKey = generateLicenseKey()
      let companyId = null

      if (orgCode) {
        const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
        const invitationSnapshot = await getDocs(invitationQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()

          licenseKey = invitationData.license_key || licenseKey
          companyId = invitationData.company_id || null

          if (invitationData.role) {
            try {
              await assignRoleToUser(firebaseUser.uid, invitationData.role as RoleType)
            } catch (roleError) {
              console.error("Error assigning role to user:", roleError)
            }
          }

          const updateData: any = {
            used: true,
            used_count: (invitationData.used_count || 0) + 1,
            last_used_at: serverTimestamp(),
          }

          if (invitationData.used_by && Array.isArray(invitationData.used_by)) {
            updateData.used_by = [...invitationData.used_by, firebaseUser.uid]
          } else {
            updateData.used_by = [firebaseUser.uid]
          }

          await updateDoc(doc(db, "invitation_codes", invitationDoc.id), updateData)
        }
      }

      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userData = {
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
      }

      await setDoc(userDocRef, userData)

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

      // Set user immediately after successful registration
      setUser(firebaseUser)
    } catch (error) {
      console.error("Error in AuthContext register:", error)
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
      console.error("Logout error:", error)
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error("Password reset error:", error)

      const errorMessage =
        error.code === "auth/user-not-found"
          ? "No account found with this email address."
          : error.message || "Failed to send password reset email."

      throw new Error(errorMessage)
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

        const isOHPlusAccount = await findOHPlusAccount(firebaseUser.uid)
        if (isOHPlusAccount) {
          await fetchUserData(firebaseUser)
        } else {
          await signOut(auth)
        }
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
    loginOHPlusOnly,
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
