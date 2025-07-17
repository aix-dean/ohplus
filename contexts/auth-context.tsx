"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { app } from "../firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUserData: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(app)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const refreshUserData = async () => {
    const auth = getAuth(app)
    if (auth.currentUser) {
      await auth.currentUser.reload()
      setUser(auth.currentUser)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
