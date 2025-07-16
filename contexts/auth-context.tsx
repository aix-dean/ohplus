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
  first_name: string
  last_name: string
  middle_name?: string
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
  register: (
    email: string,
    password: string,
    personalInfo: PersonalInfo,
    companyInfo: CompanyInfo,
    licenseKey: string,
    orgCode?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// License key generator function
const generateLicenseKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments = []

  for (let i = 0; i < 4; i++) {
    let segment = ""
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }

  return segments.join("-")
}

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

  const register = async (
    email: string,
    password: string,
    personalInfo: PersonalInfo,
    companyInfo: CompanyInfo,
    licenseKey: string,
    orgCode?: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      let companyId: string | null = null
      let projectId: string | null = null
      let assignedRole: RoleType = "admin" // Default role
      const generatedLicenseKey = generateLicenseKey()

      // If orgCode is provided, find the invitation and get the company details
      if (orgCode) {
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("code", "==", orgCode),
          where("status", "==", "pending"),
        )
        const invitationSnapshot = await getDocs(invitationsQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()
          companyId = invitationData.company_id // Get company_id from invitation
          assignedRole = invitationData.role || "admin"
          projectId = invitationData.project_id || companyId // Use project_id from invitation or fallback to company_id

          // Mark invitation as used
          await updateDoc(invitationDoc.ref, {
            status: "used",
            used_by: firebaseUser.uid,
            used_at: serverTimestamp(),
          })
        } else {
          throw new Error("Invalid or expired invitation code")
        }
      } else {
        // Creating new company - user becomes the project owner
        companyId = firebaseUser.uid // Use user ID as company ID for new companies
        projectId = firebaseUser.uid // Use user ID as project ID for new companies
      }

      // Create user document
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userData = {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        license_key: generatedLicenseKey,
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
        project_id: projectId,
      }

      await setDoc(userDocRef, userData)

      // Create project if no orgCode (new company)
      if (!orgCode && companyId && projectId) {
        const projectDocRef = doc(db, "projects", projectId)
        await setDoc(projectDocRef, {
          company_name: companyInfo.company_name || "My Company",
          company_location: companyInfo.company_location || "",
          project_name: "My First Project",
          license_key: generatedLicenseKey, // Save the generated license key in projects document
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
