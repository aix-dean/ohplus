"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import { app } from "../config/firebase"
import { getUserData as fetchUserData, updateUserData as updateFirestoreUserData } from "../lib/db"

interface AuthContextProps {
  user: User | null
  userData: any | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  updateUserData: (data: any) => Promise<void>
  refreshUserData: () => Promise<void>
  refreshSubscriptionData: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const auth = getAuth(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await refreshUserData()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    // Implement your sign-in logic here (e.g., using Firebase UI or custom auth)
    // After successful sign-in, the onAuthStateChanged listener will update the user state
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUserData(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const refreshUserData = async () => {
    if (user) {
      try {
        const fetchedUserData = await fetchUserData(user.uid)
        setUserData(fetchedUserData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    } else {
      setUserData(null)
    }
  }

  const updateUserData = async (data: any) => {
    if (user) {
      try {
        await updateFirestoreUserData(user.uid, data)
        await refreshUserData() // Refresh local state after updating Firestore
      } catch (error) {
        console.error("Error updating user data:", error)
      }
    }
  }

  const refreshSubscriptionData = async () => {
    await refreshUserData()
  }

  const value: AuthContextProps = {
    user,
    userData,
    loading,
    signIn,
    signOut,
    updateUserData,
    refreshUserData,
    refreshSubscriptionData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
