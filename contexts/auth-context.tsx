"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { generateLicenseKey } from "@/lib/utils"

interface UserData {
  uid: string
  email: string
  display_name: string
  first_name: string
  middle_name: string
  last_name: string
  license_key: string
  photo_url: string
  phone_number: string
  location: string
  gender: string
  type: string
  active: boolean
  onboarding: boolean
  products: number
  products_count: {
    merchandise: number
    rental: number
  }
  rating: number
  followers: number
  created: Date
  created_time: string
  active_date: string
  updated: string
  tenant_id?: string
}

interface ProjectData {
  id: string
  uid: string
  license_key: string
  project_name: string
  company_name: string
  company_location: string
  company_website: string
  type: string
  social_media: {
    facebook: string
    instagram: string
    youtube: string
  }
  created: string
  updated: string
  deleted: boolean
  tenant_id?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  projectData: ProjectData | null
  allProjects: ProjectData[]
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: Partial<UserData>, projectData: Partial<ProjectData>, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
  updateProjectData: (data: Partial<ProjectData>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [allProjects, setAllProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  // Ensure tenant ID is set
  useEffect(() => {
    if (auth && !auth.tenantId) {
      auth.tenantId = "ohplus-07hsi"
      console.log("Tenant ID set to:", auth.tenantId)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, "iboard_users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData
          setUserData(userData)

          // Fetch project data using license key
          if (userData.license_key) {
            const projectQuery = doc(db, "projects", userData.license_key)
            const projectDoc = await getDoc(projectQuery)

            if (projectDoc.exists()) {
              setProjectData(projectDoc.data() as ProjectData)
            }

            // Fetch all projects with the same license key
            const projectsQuery = query(collection(db, "projects"), where("license_key", "==", userData.license_key))

            try {
              const projectsSnapshot = await getDocs(projectsQuery)
              const projectsList: ProjectData[] = []

              projectsSnapshot.forEach((doc) => {
                projectsList.push(doc.data() as ProjectData)
              })

              setAllProjects(projectsList)
            } catch (error) {
              console.error("Error fetching projects:", error)
              setAllProjects([])
            }
          }
        }
      } else {
        setUserData(null)
        setProjectData(null)
        setAllProjects([])
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Ensure tenant ID is set before login
      if (auth && !auth.tenantId) {
        auth.tenantId = "ohplus-07hsi"
      }

      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (userData: Partial<UserData>, projectData: Partial<ProjectData>, password: string) => {
    try {
      // Ensure tenant ID is set before registration
      if (auth && !auth.tenantId) {
        auth.tenantId = "ohplus-07hsi"
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email as string, password)

      const user = userCredential.user

      // Generate license key
      const licenseKey = generateLicenseKey()

      const now = new Date()
      const timestamp = now.toISOString()
      const utcString = now.toUTCString()

      // Create user document in Firestore
      const newUserData: UserData = {
        uid: user.uid,
        email: userData.email as string,
        display_name: userData.display_name || "",
        first_name: userData.first_name || "",
        middle_name: userData.middle_name || "",
        last_name: userData.last_name || "",
        license_key: licenseKey,
        photo_url: userData.photo_url || "",
        phone_number: userData.phone_number || "",
        location: userData.location || "",
        gender: userData.gender || "",
        type: userData.type || "user",
        active: true,
        onboarding: true,
        products: 0,
        products_count: {
          merchandise: 0,
          rental: 0,
        },
        rating: 0,
        followers: 0,
        created: now,
        created_time: utcString,
        active_date: utcString,
        updated: timestamp,
        tenant_id: "ohplus-07hsi", // Add tenant ID to user data
      }

      await setDoc(doc(db, "iboard_users", user.uid), newUserData)

      // Create project document in Firestore
      const newProjectData: ProjectData = {
        id: crypto.randomUUID(),
        uid: user.uid,
        license_key: licenseKey,
        project_name: projectData.company_name || "New Project", // Use company name as project name
        company_name: projectData.company_name || "",
        company_location: projectData.company_location || "",
        company_website: "",
        type: projectData.type || "Trial",
        social_media: {
          facebook: "",
          instagram: "",
          youtube: "",
        },
        created: utcString,
        updated: utcString,
        deleted: false,
        tenant_id: "ohplus-07hsi", // Add tenant ID to project data
      }

      await setDoc(doc(db, "projects", licenseKey), newProjectData)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return

    try {
      const userDocRef = doc(db, "iboard_users", user.uid)
      await setDoc(userDocRef, { ...data, updated: new Date().toISOString() }, { merge: true })

      // Update local state
      setUserData((prev) => (prev ? { ...prev, ...data } : null))
    } catch (error) {
      console.error("Update user data error:", error)
      throw error
    }
  }

  const updateProjectData = async (data: Partial<ProjectData>) => {
    if (!userData?.license_key) return

    try {
      const projectDocRef = doc(db, "projects", userData.license_key)
      await setDoc(projectDocRef, { ...data, updated: new Date() }, { merge: true })

      // Update local state
      setProjectData((prev) => (prev ? { ...prev, ...data } : null))

      // Refresh all projects
      if (userData.license_key) {
        const projectsQuery = query(collection(db, "projects"), where("license_key", "==", userData.license_key))

        const projectsSnapshot = await getDocs(projectsQuery)
        const projectsList: ProjectData[] = []

        projectsSnapshot.forEach((doc) => {
          projectsList.push(doc.data() as ProjectData)
        })

        setAllProjects(projectsList)
      }
    } catch (error) {
      console.error("Update project data error:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    projectData,
    allProjects,
    loading,
    login,
    register,
    logout,
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
