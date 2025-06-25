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
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore" // Import serverTimestamp
import { auth, db } from "@/lib/firebase"
import { generateLicenseKey } from "@/lib/utils"

// Helper function to get max products based on plan type
function getMaxProductsForPlan(type: string): number | null {
  switch (type.toLowerCase()) {
    case "basic":
      return 3
    case "premium":
      return 10
    case "enterprise":
      return null // Unlimited
    case "graphic expo event": // Added for the new promo plan
      return 5
    case "trial":
      return 1 // Or any trial limit
    default:
      return 1 // Default for unknown types
  }
}

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
  // Change Date to any for serverTimestamp compatibility
  created: any
  created_time: any
  active_date: any
  updated: any
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
  type: string // This will be the subscription type: "Basic", "Premium", "Enterprise", "Trial"
  max_products: number | null // New: Max products allowed by the plan
  social_media: {
    facebook: string
    instagram: string
    youtube: string
  }
  created: any // Change to any for serverTimestamp compatibility
  updated: any // Change to any for serverTimestamp compatibility
  deleted: boolean
  tenant_id?: string
  subscription_start_date: any // Change to any for serverTimestamp compatibility
  subscription_end_date: any // Change to any for serverTimestamp compatibility
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
            } else {
              console.warn("Project document not found for license key:", userData.license_key)
              setProjectData(null)
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
          } else {
            console.warn("User data missing license_key for user:", user.uid)
            setProjectData(null)
          }
        } else {
          console.warn("User document not found for uid:", user.uid)
          setUserData(null)
          setProjectData(null)
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
        created: serverTimestamp(),
        created_time: serverTimestamp(),
        active_date: serverTimestamp(),
        updated: serverTimestamp(),
        tenant_id: "ohplus-07hsi",
      }

      await setDoc(doc(db, "iboard_users", user.uid), newUserData)

      const now = new Date()
      let subscriptionEndDate: Date

      // Determine subscription end date based on plan type
      if (projectData.type?.toLowerCase() === "trial") {
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days for trial
      } else if (projectData.type?.toLowerCase() === "graphic expo event") {
        subscriptionEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()) // 1 year for promo
      } else {
        // For Basic, Premium, Enterprise, assume 1 year for now
        subscriptionEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      }

      // Create project document in Firestore
      const newProjectData: ProjectData = {
        id: crypto.randomUUID(),
        uid: user.uid,
        license_key: licenseKey,
        project_name: projectData.company_name || "New Project",
        company_name: projectData.company_name || "",
        company_location: projectData.company_location || "",
        company_website: "",
        type: projectData.type || "Trial", // Use the selected type from projectData
        max_products: getMaxProductsForPlan(projectData.type || "Trial"), // Use selected type to get max products
        social_media: {
          facebook: "",
          instagram: "",
          youtube: "",
        },
        created: serverTimestamp(),
        updated: serverTimestamp(),
        deleted: false,
        tenant_id: "ohplus-07hsi",
        subscription_start_date: serverTimestamp(),
        subscription_end_date: subscriptionEndDate,
      }

      await setDoc(doc(db, "projects", licenseKey), newProjectData)

      // Manually update state after successful registration and data creation
      setUserData(newUserData)
      setProjectData(newProjectData)
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
      await setDoc(userDocRef, { ...data, updated: serverTimestamp() }, { merge: true }) // Use serverTimestamp

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
      await setDoc(projectDocRef, { ...data, updated: serverTimestamp() }, { merge: true }) // Use serverTimestamp

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
