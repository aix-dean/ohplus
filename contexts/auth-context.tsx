"use client"

import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, type User } from "firebase/auth"
import { auth, db } from "../lib/firebase"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"

type AuthContextType = {
  user: User | null
  projectData: any | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProjectData: (updates: Partial<any>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [projectData, setProjectData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "projects", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProjectData(docSnap.data())
        } else {
          setProjectData(null)
        }

        setUser(user)
      } else {
        setUser(null)
        setProjectData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if project exists
      const docRef = doc(db, "projects", user.uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        // Create project if it doesn't exist
        await setDoc(doc(db, "projects", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photo_url: user.photoURL,
          created: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  const signOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateProjectData = async (updates: Partial<any>) => {
    if (!user) throw new Error("No authenticated user")

    try {
      // Update the projects collection
      const projectRef = doc(db, "projects", user.uid)
      await updateDoc(projectRef, {
        ...updates,
        updated: new Date().toISOString(),
      })

      // If photo_url is being updated, also update the companies collection
      if (updates.photo_url) {
        const companiesQuery = query(collection(db, "companies"), where("created_by", "==", user.uid))
        const companiesSnapshot = await getDocs(companiesQuery)

        if (!companiesSnapshot.empty) {
          const companyDoc = companiesSnapshot.docs[0]
          const companyRef = doc(db, "companies", companyDoc.id)
          await updateDoc(companyRef, {
            photo_url: updates.photo_url,
            updated: new Date().toISOString(),
          })
        }
      }

      // Update local state
      setProjectData((prev) => (prev ? { ...prev, ...updates } : null))
    } catch (error) {
      console.error("Error updating project data:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        projectData,
        loading,
        signInWithGoogle,
        signOut,
        updateProjectData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider")
  }

  return context
}
