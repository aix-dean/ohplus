"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useInvitationCode } from "@/lib/invitation-service"

interface UserData {
  uid: string
  email: string
  firstName: string
  lastName: string
  companyId: string
  companyName: string
  licenseKey: string
  role?: string
  createdAt: Date
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  licenseKey: string
}

interface JoinOrganizationData {
  email: string
  password: string
  firstName: string
  lastName: string
  invitationCode: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  register: (data: RegisterData) => Promise<void>
  joinOrganization: (data: JoinOrganizationData) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const useInvitationCodeHook = useInvitationCode

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await loadUserData(user.uid)
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loadUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData({
          uid,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: data.companyId,
          companyName: data.companyName,
          licenseKey: data.licenseKey,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      // Create company document
      const companyRef = await addDoc(collection(db, "companies"), {
        name: data.companyName,
        licenseKey: data.licenseKey,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
      })

      // Create user document
      await setDoc(doc(db, "users", user.uid), {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        companyId: companyRef.id,
        companyName: data.companyName,
        licenseKey: data.licenseKey,
        role: "admin", // First user becomes admin
        createdAt: Timestamp.now(),
      })

      await loadUserData(user.uid)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const joinOrganization = async (data: JoinOrganizationData) => {
    try {
      // Use the invitation code to get company info
      const companyId = await useInvitationCodeHook(data.invitationCode)

      // Get company details
      const companyDoc = await getDoc(doc(db, "companies", companyId))
      if (!companyDoc.exists()) {
        throw new Error("Company not found")
      }

      const companyData = companyDoc.data()

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      // Create user document with company info
      await setDoc(doc(db, "users", user.uid), {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        companyId: companyId,
        companyName: companyData.name,
        licenseKey: companyData.licenseKey,
        role: "user", // Joined users start as regular users
        createdAt: Timestamp.now(),
        joinedViaInvitation: true,
        invitationCode: data.invitationCode,
      })

      await loadUserData(user.uid)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
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
    register,
    joinOrganization,
    login,
    logout,
    resetPassword,
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
