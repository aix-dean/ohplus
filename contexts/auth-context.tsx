"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  id: string
  email: string
  display_name: string
  first_name: string
  middle_name?: string
  last_name: string
  license_key?: string
  photo_url?: string
  phone_number?: string
  location?: string
  gender?: string
  type?: string
  active: boolean
  onboarding: boolean
  department?: string
  company_id?: string
  lastLogin?: any
  created?: any
  updated?: any
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationCode?: string,
  ) => Promise<void>
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

    return unsubscribe
  }, [])

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "iboard_users", uid))
      if (userDoc.exists()) {
        setUserData({ id: uid, ...userDoc.data() } as UserData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const validateOrganizationCode = async (code: string) => {
    try {
      const codeDoc = await getDoc(doc(db, "organization_codes", code))

      if (!codeDoc.exists()) {
        throw new Error("Invalid organization code")
      }

      const codeData = codeDoc.data()

      // Check if code is active
      if (codeData.active === false) {
        throw new Error("This organization code has been deactivated")
      }

      // Check if code has expired
      const expiresAt = codeData.expires_at?.toDate()
      if (expiresAt && expiresAt < new Date()) {
        throw new Error("This organization code has expired")
      }

      // Check if code has reached usage limit
      if (codeData.max_usage && codeData.usage_count >= codeData.max_usage) {
        throw new Error("This organization code has reached its usage limit")
      }

      return codeData
    } catch (error) {
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)

      // Update last login
      await updateDoc(doc(db, "iboard_users", result.user.uid), {
        lastLogin: serverTimestamp(),
        updated: serverTimestamp(),
      })
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationCode?: string,
  ) => {
    try {
      let orgData = null

      // Validate organization code if provided
      if (organizationCode) {
        orgData = await validateOrganizationCode(organizationCode)
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Update the user's display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`,
      })

      // Create user document
      const userData: Partial<UserData> = {
        email,
        display_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        active: true,
        onboarding: true,
        created: serverTimestamp(),
        updated: serverTimestamp(),
      }

      // If joining an organization, inherit organization data
      if (orgData) {
        userData.license_key = orgData.license_key
        userData.company_id = orgData.company_id

        // Update organization code usage
        await updateDoc(doc(db, "organization_codes", organizationCode!), {
          usage_count: (orgData.usage_count || 0) + 1,
          updated: serverTimestamp(),
        })
      }

      await setDoc(doc(db, "iboard_users", result.user.uid), userData)
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
    if (!user) throw new Error("No user logged in")

    try {
      await updateDoc(doc(db, "iboard_users", user.uid), {
        ...data,
        updated: serverTimestamp(),
      })

      // Refresh user data
      await fetchUserData(user.uid)
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
