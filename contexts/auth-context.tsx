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

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser, specificUid?: string) => {
    try {
      console.log("Fetching user data for Firebase user:", firebaseUser.uid)
      console.log("Specific UID requested:", specificUid)

      // Use specific UID if provided, otherwise use Firebase user UID
      const targetUid = specificUid || firebaseUser.uid

      // Fetch user data from iboard_users collection
      const userDocRef = doc(db, "iboard_users", targetUid)
      const userDocSnap = await getDoc(userDocRef)

      let fetchedUserData: UserData

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        console.log("User document data:", data)

        fetchedUserData = {
          uid: targetUid,
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
        console.log("User document doesn't exist, creating basic one")
        fetchedUserData = {
          uid: targetUid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          license_key: null,
          company_id: null,
          role: "user",
          permissions: [],
        }
        await setDoc(userDocRef, fetchedUserData, { merge: true })
      }

      console.log("Fetched user data:", fetchedUserData)
      setUserData(fetchedUserData)

      // Fetch project data if project_id exists in user data
      if (fetchedUserData.project_id) {
        console.log("Fetching project data for project_id:", fetchedUserData.project_id)

        const projectDocRef = doc(db, "projects", fetchedUserData.project_id)
        const projectDocSnap = await getDoc(projectDocRef)

        if (projectDocSnap.exists()) {
          const projectData = projectDocSnap.data()
          console.log("Project document data:", projectData)

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
          console.log("Project document doesn't exist")
          setProjectData(null)
        }
      } else {
        console.log("No project_id found in user data")
        setProjectData(null)
      }

      // Fetch subscription data using the license_key from USER data
      if (fetchedUserData.license_key) {
        console.log("Fetching subscription data for license_key:", fetchedUserData.license_key)

        try {
          const subscription = await subscriptionService.getSubscriptionByLicenseKey(fetchedUserData.license_key)
          console.log("Subscription data:", subscription)
          setSubscriptionData(subscription)
        } catch (subscriptionError) {
          console.error("Error fetching subscription:", subscriptionError)
          setSubscriptionData(null)
        }
      } else {
        console.log("No license_key found in user data")
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
      console.log("Refreshing subscription data for license_key:", userData.license_key)
      try {
        const subData = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
        setSubscriptionData(subData)
      } catch (error) {
        console.error("Error refreshing subscription data:", error)
        setSubscriptionData(null)
      }
    } else {
      console.log("No license_key available for subscription refresh")
      setSubscriptionData(null)
    }
  }, [userData])

  const assignLicenseKey = useCallback(
    async (uid: string, licenseKey: string) => {
      try {
        console.log("Assigning license key:", licenseKey, "to user:", uid)

        const userDocRef = doc(db, "iboard_users", uid)
        await setDoc(userDocRef, { license_key: licenseKey }, { merge: true })

        setUserData((prev) => (prev ? { ...prev, license_key: licenseKey } : null))
        await refreshSubscriptionData()

        console.log("License key assigned successfully")
      } catch (error) {
        console.error("Error assigning license key:", error)
        throw error
      }
    },
    [refreshSubscriptionData],
  )

  const findOHPlusAccount = async (email: string) => {
    try {
      console.log("Looking for OHPLUS account with email:", email)
      // Query for OHPLUS accounts with this email
      const usersQuery = query(
        collection(db, "iboard_users"),
        where("email", "==", email),
        where("type", "==", "OHPLUS"),
      )
      const usersSnapshot = await getDocs(usersQuery)

      if (!usersSnapshot.empty) {
        // Return the first OHPLUS account found
        const userDoc = usersSnapshot.docs[0]
        console.log("Found OHPLUS account:", userDoc.id, userDoc.data())
        return userDoc.id
      }

      console.log("No OHPLUS account found for email:", email)
      return null
    } catch (error) {
      console.error("Error finding OHPLUS account:", error)
      return null
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Logging in user:", email)
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
      console.log("Logging in OHPLUS user only:", email)

      // First, find the OHPLUS account for this email
      const ohplusAccountUid = await findOHPlusAccount(email)

      if (!ohplusAccountUid) {
        throw new Error("OHPLUS_ACCOUNT_NOT_FOUND")
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)

      // Fetch user data for the specific OHPLUS account
      await fetchUserData(userCredential.user, ohplusAccountUid)

      // Double-check that we loaded an OHPLUS account
      const userDocRef = doc(db, "iboard_users", ohplusAccountUid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        if (userData.type !== "OHPLUS") {
          throw new Error("ACCOUNT_TYPE_NOT_ALLOWED")
        }
      } else {
        throw new Error("OHPLUS_ACCOUNT_NOT_FOUND")
      }
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
    setLoading(true)
    try {
      console.log("Registering new user:", personalInfo.email)

      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user
      setUser(firebaseUser)

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
        type: "OHPLUS", // Always create OHPLUS accounts
        created: serverTimestamp(),
        updated: serverTimestamp(),
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        middle_name: personalInfo.middle_name,
        phone_number: personalInfo.phone_number,
        gender: personalInfo.gender,
        project_id: orgCode ? null : firebaseUser.uid,
      }

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

      await setDoc(userDocRef, userData)
      await fetchUserData(firebaseUser)
      console.log("Registration completed successfully")
    } catch (error) {
      console.error("Error in AuthContext register:", error)
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      console.log("Logging out user")
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
      console.log("Sending password reset email to:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent successfully")
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

    console.log("Updating user data:", updates)
    const userDocRef = doc(db, "iboard_users", user.uid)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(userDocRef, updatedFields)

    setUserData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateProjectData = async (updates: Partial<ProjectData>) => {
    if (!user || !userData?.project_id) throw new Error("Project not found or user not authenticated.")

    console.log("Updating project data:", updates)
    const projectDocRef = doc(db, "projects", userData.project_id)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(projectDocRef, updatedFields)

    setProjectData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  useEffect(() => {
    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed: user logged in", firebaseUser.uid)
        setUser(firebaseUser)

        // Always check if this is an OHPLUS account first
        const ohplusAccountUid = await findOHPlusAccount(firebaseUser.email || "")
        if (ohplusAccountUid) {
          console.log("Using OHPLUS account:", ohplusAccountUid)
          await fetchUserData(firebaseUser, ohplusAccountUid)
        } else {
          // If no OHPLUS account found, try to use the Firebase user directly
          console.log("No OHPLUS account found, checking Firebase user account type")
          const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            if (userData.type === "OHPLUS") {
              console.log("Firebase user is OHPLUS, using it")
              await fetchUserData(firebaseUser)
            } else {
              console.log("Firebase user is not OHPLUS, signing out")
              await signOut(auth)
            }
          } else {
            console.log("No user document found, signing out")
            await signOut(auth)
          }
        }
      } else {
        console.log("Auth state changed: user logged out")
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
