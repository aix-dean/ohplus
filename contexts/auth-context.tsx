"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

interface UserData {
  uid: string
  email: string | null
  first_name?: string
  last_name?: string
  middle_name?: string
  display_name?: string
  phone_number?: string
  gender?: string
  photo_url?: string
  created?: string
  updated?: string
  products?: number
  followers?: number
  rating?: number
  license_key?: string
  onboarding_complete?: boolean
  company_name?: string // Added company_name to user data for initial registration
  // Removed subscription-related fields
}

interface ProjectData {
  project_id: string
  project_name?: string
  company_name?: string
  company_location?: string
  company_website?: string
  social_media?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  projectData: ProjectData | null
  loading: boolean
  register: (email: string, password: string, firstName: string, lastName: string, companyName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
  updateProjectData: (data: Partial<ProjectData>) => Promise<void>
  // Removed subscriptionData and updateSubscriptionData
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user and project data
  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData
        setUserData({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...data,
        })

        // Fetch associated project data
        if (data.project_id) {
          const projectDocRef = doc(db, "projects", data.project_id)
          const projectDocSnap = await getDoc(projectDocRef)
          if (projectDocSnap.exists()) {
            setProjectData({
              project_id: projectDocSnap.id,
              ...projectDocSnap.data(),
            } as ProjectData)
          } else {
            setProjectData(null)
          }
        } else {
          setProjectData(null)
        }
      } else {
        setUserData(null)
        setProjectData(null)
      }
    } catch (error) {
      console.error("Error fetching user or project data:", error)
      toast({
        title: "Data Load Error",
        description: "Failed to load user or project data.",
        variant: "destructive",
      })
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await fetchUserData(firebaseUser)
      } else {
        setUser(null)
        setUserData(null)
        setProjectData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchUserData])

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    companyName: string,
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create a new project document
    const newProjectRef = doc(collection(db, "projects"))
    const newProjectId = newProjectRef.id

    const initialProjectData: ProjectData = {
      project_id: newProjectId,
      project_name: `${companyName} Project`, // Default project name
      company_name: companyName,
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any,
    }
    await setDoc(newProjectRef, initialProjectData)

    // Set initial user data in Firestore
    const initialUserData: UserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      created: serverTimestamp() as any,
      updated: serverTimestamp() as any,
      project_id: newProjectId, // Link user to the new project
      onboarding_complete: false, // Mark onboarding as not complete initially
      company_name: companyName, // Store company name in user data as well
      // Removed subscription-related fields
    }
    await setDoc(doc(db, "users", firebaseUser.uid), initialUserData)

    // Update Firebase Auth profile (optional, but good for display name)
    await updateProfile(firebaseUser, {
      displayName: `${firstName} ${lastName}`,
    })

    setUser(firebaseUser)
    setUserData(initialUserData)
    setProjectData(initialProjectData)
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged listener will handle setting user and fetching data
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) throw new Error("User not authenticated.")
    const userDocRef = doc(db, "users", user.uid)
    await updateDoc(userDocRef, { ...data, updated: serverTimestamp() })
    setUserData((prev) => (prev ? { ...prev, ...data, updated: new Date().toISOString() } : null))
  }

  const updateProjectData = async (data: Partial<ProjectData>) => {
    if (!user || !userData?.project_id) throw new Error("User or project not authenticated.")
    const projectDocRef = doc(db, "projects", userData.project_id)
    await updateDoc(projectDocRef, { ...data, updated_at: serverTimestamp() })
    setProjectData((prev) => (prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null))
  }

  const value = {
    user,
    userData,
    projectData,
    loading,
    register,
    login,
    logout,
    resetPassword,
    updateUserData,
    updateProjectData,
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
