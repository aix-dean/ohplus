"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string, orgCode?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loading: boolean
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error in AuthContext login:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, orgCode?: string) => {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update user profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      })

      let companyId = null

      // Handle organization code if provided
      if (orgCode) {
        try {
          const orgCodeDoc = await getDoc(doc(db, "organization_codes", orgCode))
          if (orgCodeDoc.exists()) {
            const orgData = orgCodeDoc.data()
            companyId = orgData.companyId
            console.log("Organization code validated successfully:", orgCode)
          } else {
            console.warn("Organization code not found, continuing with regular registration:", orgCode)
          }
        } catch (error) {
          console.warn("Error validating organization code, continuing with regular registration:", error)
        }
      }

      // Create user document
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        createdAt: serverTimestamp(),
        companyId: companyId || null,
        role: "user",
        permissions: [],
      })

      // Create a project if user is not joining an organization
      if (!companyId) {
        const projectData = {
          name: `${firstName}'s Project`,
          description: "Default project",
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          members: [user.uid],
          settings: {
            defaultCurrency: "PHP",
            timezone: "Asia/Manila",
          },
        }

        const projectRef = await addDoc(collection(db, "projects"), projectData)
        console.log("Project created with ID:", projectRef.id)

        // Update user document with project reference
        await setDoc(
          doc(db, "users", user.uid),
          {
            defaultProjectId: projectRef.id,
          },
          { merge: true },
        )
      }

      console.log("User registration completed successfully")
    } catch (error) {
      console.error("Error in AuthContext register:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error in AuthContext logout:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Error in AuthContext resetPassword:", error)
      throw error
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    resetPassword,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
