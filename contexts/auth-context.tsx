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
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  uid: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  cellphone: string
  company_id?: string
  license_key?: string
  role?: string
  created_at: Date
  updated_at: Date
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    userData: Omit<UserData, "uid" | "created_at" | "updated_at"> & { password: string; organizationCode?: string },
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData({
            ...data,
            created_at: data.created_at?.toDate(),
            updated_at: data.updated_at?.toDate(),
          } as UserData)
        }
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const validateOrganizationCode = async (code: string) => {
    const q = query(collection(db, "registration_codes"), where("code", "==", code), where("status", "==", "active"))

    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      throw new Error("Invalid organization code")
    }

    const codeDoc = snapshot.docs[0]
    const codeData = codeDoc.data()

    // Check if code is expired
    const expiresAt = codeData.expires?.toDate()
    if (expiresAt && expiresAt < new Date()) {
      throw new Error("Organization code has expired")
    }

    // Check usage limits if applicable
    if (codeData.maxUsage && codeData.usage >= codeData.maxUsage) {
      throw new Error("Organization code has reached its usage limit")
    }

    return {
      id: codeDoc.id,
      company_id: codeData.company_id,
      license_key: codeData.license_key,
      ...codeData,
    }
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const register = async (
    userData: Omit<UserData, "uid" | "created_at" | "updated_at"> & { password: string; organizationCode?: string },
  ) => {
    try {
      let orgData = null

      // Validate organization code if provided
      if (userData.organizationCode) {
        orgData = await validateOrganizationCode(userData.organizationCode)
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      const user = userCredential.user

      const newUserData: UserData = {
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName,
        cellphone: userData.cellphone,
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      }

      // If organization code was used, assign company info
      if (orgData) {
        newUserData.company_id = orgData.company_id
        newUserData.license_key = orgData.license_key

        // Increment usage count for the organization code
        await updateDoc(doc(db, "registration_codes", orgData.id), {
          usage: increment(1),
        })
      }

      await setDoc(doc(db, "users", user.uid), newUserData)
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

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
