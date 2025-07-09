"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  id: string
  email: string
  first_name?: string
  middle_name?: string
  last_name?: string
  display_name?: string
  phone_number?: string
  photo_url?: string
  license_key?: string
  company_id?: string
  location?: string
  gender?: string
  type?: string
  active?: boolean
  onboarding?: boolean
  department?: string
  created?: any
  updated?: any
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userData: Partial<UserData>, organizationCode?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
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
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await fetchUserData(user.uid)
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "iboard_users", uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        setUserData({ ...data, id: uid })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const register = async (email: string, password: string, userData: Partial<UserData>, organizationCode?: string) => {
    try {
      // Validate organization code if provided
      let orgData = null
      let orgSnapshot = null // Declare orgSnapshot variable
      if (organizationCode) {
        const orgCodesCollection = collection(db, "organization_codes")
        const orgQuery = query(orgCodesCollection, where("code", "==", organizationCode))
        orgSnapshot = await getDocs(orgQuery) // Assign orgSnapshot variable

        if (orgSnapshot.empty) {
          throw new Error("Invalid organization code")
        }

        const orgDoc = orgSnapshot.docs[0]
        orgData = orgDoc.data()

        // Check if code is active and not expired
        if (!orgData.active || new Date(orgData.expiresAt) < new Date()) {
          throw new Error("Organization code has expired or is inactive")
        }

        // Check usage limits if applicable
        if (orgData.maxUsage && orgData.usage >= orgData.maxUsage) {
          throw new Error("Organization code has reached its usage limit")
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Prepare user data
      const newUserData: UserData = {
        id: user.uid,
        email: user.email!,
        first_name: userData.first_name || "",
        middle_name: userData.middle_name || "",
        last_name: userData.last_name || "",
        display_name: userData.display_name || `${userData.first_name} ${userData.last_name}`.trim(),
        phone_number: userData.phone_number || "",
        photo_url: userData.photo_url || "",
        location: userData.location || "",
        gender: userData.gender || "",
        type: userData.type || "user",
        active: true,
        onboarding: false,
        department: userData.department || "",
        created: Date.now(),
        updated: Date.now(),
      }

      // If organization code is provided, inherit company data
      if (orgData) {
        newUserData.company_id = orgData.company_id
        newUserData.license_key = orgData.license_key

        // Update organization code usage
        const orgDocRef = doc(db, "organization_codes", orgSnapshot.docs[0].id)
        await updateDoc(orgDocRef, {
          usage: (orgData.usage || 0) + 1,
        })
      }

      await setDoc(doc(db, "iboard_users", user.uid), newUserData)
      setUserData(newUserData)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return

    try {
      const updatedData = {
        ...data,
        updated: Date.now(),
      }

      await updateDoc(doc(db, "iboard_users", user.uid), updatedData)
      setUserData((prev) => (prev ? { ...prev, ...updatedData } : null))
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
