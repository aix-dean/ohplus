"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { assignRoleToUser, type RoleType } from "@/lib/hardcoded-access-service"
import { generateLicenseKey } from "@/lib/utils"

interface UserData {
  uid: string
  email: string
  first_name?: string
  last_name?: string
  middle_name?: string
  phone_number?: string
  gender?: string
  company_id?: string
  license_key?: string
  role?: string
  permissions?: string[]
  type?: string
  project_id?: string
  created?: any
  updated?: any
}

interface ProjectData {
  company_name: string
  company_location: string
  project_name: string
  license_key: string
  created?: any
  updated?: any
}

interface SubscriptionData {
  plan: string
  status: string
  created?: any
  updated?: any
}

interface PersonalInfo {
  email: string
  first_name: string
  last_name: string
  middle_name: string
  phone_number: string
  gender: string
}

interface CompanyInfo {
  company_name: string
  company_location: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  projectData: ProjectData | null
  subscriptionData: SubscriptionData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginOHPlusOnly: (email: string, password: string) => Promise<void>
  register: (personalInfo: PersonalInfo, companyInfo: CompanyInfo, password: string, orgCode?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        setUserData(data)

        // Fetch project data if project_id exists
        if (data.project_id) {
          const projectDocRef = doc(db, "projects", data.project_id)
          const projectDoc = await getDoc(projectDocRef)
          if (projectDoc.exists()) {
            setProjectData(projectDoc.data() as ProjectData)
          }
        }

        // Fetch subscription data if company_id exists
        if (data.company_id) {
          const subscriptionDocRef = doc(db, "subscriptions", data.company_id)
          const subscriptionDoc = await getDoc(subscriptionDocRef)
          if (subscriptionDoc.exists()) {
            setSubscriptionData(subscriptionDoc.data() as SubscriptionData)
          }
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
    }
  }, [])

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserData(user)
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
        setProjectData(null)
        setSubscriptionData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchUserData])

  const findOHPlusAccount = async (uid: string): Promise<boolean> => {
    try {
      const userDocRef = doc(db, "iboard_users", uid)
      const userDoc = await getDoc(userDocRef)
      return userDoc.exists() && userDoc.data()?.type === "OHPLUS"
    } catch (error) {
      console.error("Error checking OHPLUS account:", error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const loginOHPlusOnly = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const isOHPlusAccount = await findOHPlusAccount(userCredential.user.uid)

    if (!isOHPlusAccount) {
      await signOut(auth)
      throw new Error("This account is not authorized for OHPLUS access.")
    }
  }

  const register = async (personalInfo: PersonalInfo, companyInfo: CompanyInfo, password: string, orgCode?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user

      let licenseKey = generateLicenseKey()
      let companyId = orgCode || null
      let assignedRole: RoleType = "admin" // Default role

      // If orgCode is provided, find the invitation and get the role
      if (orgCode) {
        const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
        const invitationSnapshot = await getDocs(invitationQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()

          licenseKey = invitationData.license_key || licenseKey
          companyId = invitationData.company_id || null
          assignedRole = (invitationData.role as RoleType) || "admin"

          // Mark invitation as used
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

          await updateDoc(invitationDoc.ref, updateData)
        }
      }

      // Create user document
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userData = {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        license_key: licenseKey,
        company_id: companyId,
        role: assignedRole,
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

      // Create project if no orgCode (new company)
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

      // Assign role using the access service (with delay to ensure document exists)
      try {
        setTimeout(async () => {
          try {
            await assignRoleToUser(firebaseUser.uid, assignedRole, "system")
          } catch (roleError) {
            console.error("Error assigning role to user:", roleError)
          }
        }, 100)
      } catch (roleError) {
        console.error("Error assigning role to user:", roleError)
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

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
    refreshUserData,
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
