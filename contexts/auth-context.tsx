"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { subscriptionService } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription"
import { generateLicenseKey } from "@/lib/utils"

// Custom user interface that overrides Firebase user with OHPLUS data
interface OHPlusUser extends Omit<FirebaseUser, "uid"> {
  uid: string // This will be the OHPLUS account UID, not Firebase Auth UID
  firebaseAuthUid: string // Store the original Firebase Auth UID separately
}

interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  license_key: string | null
  company_id?: string | null
  role: string | null
  permissions: string[]
  project_id?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  phone_number?: string
  gender?: string
  type?: string
  created?: Date
  updated?: Date
}

interface ProjectData {
  project_id: string
  company_name?: string
  company_location?: string
  company_website?: string
  project_name?: string
  social_media?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  license_key?: string | null
  created?: Date
  updated?: Date
}

interface AuthContextType {
  user: OHPlusUser | null // This will always have the OHPLUS UID
  userData: UserData | null
  projectData: ProjectData | null
  subscriptionData: Subscription | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginOHPlusOnly: (email: string, password: string) => Promise<void>
  register: (
    personalInfo: {
      email: string
      first_name: string
      last_name: string
      middle_name: string
      phone_number: string
      gender: string
    },
    companyInfo: {
      company_name: string
      company_location: string
    },
    password: string,
    orgCode?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  updateProjectData: (updates: Partial<ProjectData>) => Promise<void>
  refreshUserData: () => Promise<void>
  refreshSubscriptionData: () => Promise<void>
  assignLicenseKey: (uid: string, licenseKey: string) => Promise<void>
  getEffectiveUserId: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OHPlusUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  // This function returns the effective user ID that should be used for all operations
  const getEffectiveUserId = useCallback((): string | null => {
    // Always return the OHPLUS user ID, never the Firebase Auth user ID
    return user?.uid || null
  }, [user])

  const createOHPlusUser = (firebaseUser: FirebaseUser, ohplusUid: string): OHPlusUser => {
    console.log("Creating OHPlusUser with OHPLUS UID:", ohplusUid, "Firebase Auth UID:", firebaseUser.uid)

    return {
      ...firebaseUser,
      uid: ohplusUid, // Override with OHPLUS UID
      firebaseAuthUid: firebaseUser.uid, // Store original Firebase Auth UID
    }
  }

  const validateOHPlusAccount = async (uid: string, email: string): Promise<UserData> => {
    console.log("Validating OHPLUS account for UID:", uid, "Email:", email)

    const userDocRef = doc(db, "iboard_users", uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      console.log("User document doesn't exist for UID:", uid)
      throw new Error("USER_DOCUMENT_NOT_FOUND")
    }

    const data = userDocSnap.data()
    console.log("User document data:", data)

    // Strict validation for OHPLUS accounts only
    if (data.type !== "OHPLUS") {
      console.log("Account type is not OHPLUS:", data.type)
      throw new Error("ACCOUNT_TYPE_NOT_OHPLUS")
    }

    // Validate that the email matches
    if (data.email !== email) {
      console.log("Email mismatch. Document email:", data.email, "Expected email:", email)
      throw new Error("EMAIL_MISMATCH")
    }

    // Return validated user data with OHPLUS UID
    const validatedUserData: UserData = {
      uid: uid, // Use the OHPLUS account UID
      email: email,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
      license_key: data.license_key || null,
      role: data.role || "user",
      permissions: data.permissions || [],
      project_id: data.project_id,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      phone_number: data.phone_number,
      gender: data.gender,
      type: data.type,
      created: data.created?.toDate(),
      updated: data.updated?.toDate(),
      company_id: data.company_id || null,
    }

    console.log("Successfully validated OHPLUS user data with UID:", validatedUserData.uid)
    return validatedUserData
  }

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser, ohplusUid: string) => {
    try {
      console.log("Fetching user data for Firebase user:", firebaseUser.uid, "OHPLUS UID:", ohplusUid)

      // Validate and get OHPLUS user data
      const validatedUserData = await validateOHPlusAccount(ohplusUid, firebaseUser.email || "")
      setUserData(validatedUserData)

      // Create OHPlusUser with the OHPLUS UID
      const ohplusUser = createOHPlusUser(firebaseUser, ohplusUid)
      setUser(ohplusUser)

      console.log("Set user with OHPLUS UID:", ohplusUser.uid, "Firebase Auth UID:", ohplusUser.firebaseAuthUid)

      // Fetch project data if project_id exists
      if (validatedUserData.project_id) {
        console.log("Fetching project data for project_id:", validatedUserData.project_id)

        const projectDocRef = doc(db, "projects", validatedUserData.project_id)
        const projectDocSnap = await getDoc(projectDocRef)

        if (projectDocSnap.exists()) {
          const projectData = projectDocSnap.data()
          console.log("Project document data:", projectData)

          setProjectData({
            project_id: projectDocSnap.id,
            company_name: projectData.company_name,
            company_location: projectData.company_location,
            company_website: projectData.company_website,
            project_name: projectData.project_name,
            social_media: projectData.social_media,
            license_key: projectData.license_key,
            created: projectData.created?.toDate(),
            updated: projectData.updated?.toDate(),
          })
        } else {
          console.log("Project document doesn't exist")
          setProjectData(null)
        }
      } else {
        console.log("No project_id found in user data")
        setProjectData(null)
      }

      // Fetch subscription data using the license_key from OHPLUS user data
      if (validatedUserData.license_key) {
        console.log("Fetching subscription data for license_key:", validatedUserData.license_key)

        try {
          const subscription = await subscriptionService.getSubscriptionByLicenseKey(validatedUserData.license_key)
          console.log("Subscription data:", subscription)
          setSubscriptionData(subscription)
        } catch (subscriptionError) {
          console.error("Error fetching subscription:", subscriptionError)
          setSubscriptionData(null)
        }
      } else {
        console.log("No license_key found in OHPLUS user data")
        setSubscriptionData(null)
      }
    } catch (error) {
      console.error("Error fetching user data or subscription:", error)
      setUser(null)
      setUserData(null)
      setProjectData(null)
      setSubscriptionData(null)
      throw error
    }
  }, [])

  const refreshUserData = useCallback(async () => {
    if (user && userData) {
      // Use the original Firebase user but with OHPLUS UID
      const firebaseUser = {
        ...user,
        uid: user.firebaseAuthUid, // Use original Firebase Auth UID for auth operations
      } as FirebaseUser
      await fetchUserData(firebaseUser, userData.uid)
    }
  }, [user, userData, fetchUserData])

  const refreshSubscriptionData = useCallback(async () => {
    if (userData?.license_key) {
      console.log("Refreshing subscription data for license_key:", userData.license_key)
      try {
        const subData = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
        setSubscriptionData(subData)
      } catch (error) {
        console.error("Error refreshing subscription data:", error)
        setSubscriptionData(null)
      }
    } else {
      console.log("No license_key available for subscription refresh")
      setSubscriptionData(null)
    }
  }, [userData])

  const assignLicenseKey = useCallback(
    async (uid: string, licenseKey: string) => {
      try {
        console.log("Assigning license key:", licenseKey, "to OHPLUS user:", uid)

        // Always use the OHPLUS user ID
        const effectiveUid = userData?.uid || uid
        const userDocRef = doc(db, "iboard_users", effectiveUid)
        await setDoc(userDocRef, { license_key: licenseKey }, { merge: true })

        setUserData((prev) => (prev ? { ...prev, license_key: licenseKey } : null))
        await refreshSubscriptionData()

        console.log("License key assigned successfully to OHPLUS user:", effectiveUid)
      } catch (error) {
        console.error("Error assigning license key:", error)
        throw error
      }
    },
    [userData, refreshSubscriptionData],
  )

  const findOHPlusAccount = async (email: string): Promise<string | null> => {
    try {
      console.log("Looking for OHPLUS account with email:", email)

      // Query for OHPLUS accounts with this email
      const usersQuery = query(
        collection(db, "iboard_users"),
        where("email", "==", email),
        where("type", "==", "OHPLUS"),
      )
      const usersSnapshot = await getDocs(usersQuery)

      if (!usersSnapshot.empty) {
        // Return the first OHPLUS account found
        const userDoc = usersSnapshot.docs[0]
        console.log("Found OHPLUS account:", userDoc.id, userDoc.data())
        return userDoc.id
      }

      console.log("No OHPLUS account found for email:", email)
      return null
    } catch (error) {
      console.error("Error finding OHPLUS account:", error)
      return null
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Logging in user:", email)

      // First, find OHPLUS account for this email
      const ohplusAccountUid = await findOHPlusAccount(email)
      if (!ohplusAccountUid) {
        console.log("No OHPLUS account found, cannot proceed")
        throw new Error("OHPLUS_ACCOUNT_NOT_FOUND")
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Firebase authentication successful for:", userCredential.user.uid)

      // Don't set user here - let fetchUserData handle it with OHPLUS UID
      await fetchUserData(userCredential.user, ohplusAccountUid)
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
      throw error
    }
  }

  const loginOHPlusOnly = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Logging in OHPLUS user only:", email)

      // First, find the OHPLUS account for this email
      const ohplusAccountUid = await findOHPlusAccount(email)
      if (!ohplusAccountUid) {
        throw new Error("OHPLUS_ACCOUNT_NOT_FOUND")
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Firebase authentication successful, using OHPLUS account:", ohplusAccountUid)

      // Don't set user here - let fetchUserData handle it with OHPLUS UID
      await fetchUserData(userCredential.user, ohplusAccountUid)
    } catch (error) {
      console.error("OHPLUS login error:", error)
      setLoading(false)
      throw error
    }
  }

  const register = async (
    personalInfo: {
      email: string
      first_name: string
      last_name: string
      middle_name: string
      phone_number: string
      gender: string
    },
    companyInfo: {
      company_name: string
      company_location: string
    },
    password: string,
    orgCode?: string,
  ) => {
    setLoading(true)
    try {
      console.log("Registering new OHPLUS user:", personalInfo.email)

      const userCredential = await createUserWithEmailAndPassword(auth, personalInfo.email, password)
      const firebaseUser = userCredential.user

      let licenseKey = generateLicenseKey()
      let companyId = null

      if (orgCode) {
        const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
        const invitationSnapshot = await getDocs(invitationQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()

          licenseKey = invitationData.license_key || licenseKey
          companyId = invitationData.company_id || null

          const updateData: any = {
            used: true,
            used_count: (invitationData.used_count || 0) + 1,
            last_used_at: serverTimestamp(),
          }

          if (invitationData.used_by && Array.isArray(invitationData.used_by)) {
            updateData.used_by = [...invitationData.used_by, firebaseUser.uid]
          } else {
            updateData.used_by = [firebaseUser.uid]
          }

          await updateDoc(doc(db, "invitation_codes", invitationDoc.id), updateData)
        }
      }

      // Create OHPLUS user document using Firebase Auth UID
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userData = {
        email: firebaseUser.email,
        uid: firebaseUser.uid, // This will be the OHPLUS account UID
        license_key: licenseKey,
        company_id: companyId,
        role: "user",
        permissions: [],
        type: "OHPLUS", // Always create OHPLUS accounts
        created: serverTimestamp(),
        updated: serverTimestamp(),
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        middle_name: personalInfo.middle_name,
        phone_number: personalInfo.phone_number,
        gender: personalInfo.gender,
        project_id: orgCode ? null : firebaseUser.uid,
      }

      if (!orgCode) {
        const projectDocRef = doc(db, "projects", firebaseUser.uid)
        await setDoc(projectDocRef, {
          company_name: companyInfo.company_name,
          company_location: companyInfo.company_location,
          project_name: "My First Project",
          license_key: licenseKey,
          created: serverTimestamp(),
          updated: serverTimestamp(),
        })
      }

      await setDoc(userDocRef, userData)

      // Instead of calling fetchUserData which has strict validation
      // await fetchUserData(firebaseUser, firebaseUser.uid)

      // Set user data directly for new registrations
      const newUserData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: `${personalInfo.first_name} ${personalInfo.last_name}`.trim(),
        license_key: licenseKey,
        company_id: companyId,
        role: "user",
        permissions: [],
        project_id: orgCode ? null : firebaseUser.uid,
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        middle_name: personalInfo.middle_name,
        phone_number: personalInfo.phone_number,
        gender: personalInfo.gender,
        type: "OHPLUS",
        created: new Date(),
        updated: new Date(),
      }

      setUserData(newUserData)

      // Create OHPlusUser for new registration
      const ohplusUser = createOHPlusUser(firebaseUser, firebaseUser.uid)
      setUser(ohplusUser)

      // Set project data if not joining an organization
      if (!orgCode) {
        setProjectData({
          project_id: firebaseUser.uid,
          company_name: companyInfo.company_name,
          company_location: companyInfo.company_location,
          project_name: "My First Project",
          license_key: licenseKey,
          created: new Date(),
          updated: new Date(),
        })
      }

      // Try to fetch subscription data
      if (licenseKey) {
        try {
          const subscription = await subscriptionService.getSubscriptionByLicenseKey(licenseKey)
          setSubscriptionData(subscription)
        } catch (subscriptionError) {
          console.error("Error fetching subscription during registration:", subscriptionError)
          setSubscriptionData(null)
        }
      }

      console.log("Registration completed successfully for OHPLUS user:", firebaseUser.uid)
    } catch (error) {
      console.error("Error in AuthContext register:", error)
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      console.log("Logging out user")
      await signOut(auth)
      setUser(null)
      setUserData(null)
      setProjectData(null)
      setSubscriptionData(null)
    } catch (error) {
      console.error("Logout error:", error)
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Sending password reset email to:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent successfully")
    } catch (error: any) {
      console.error("Password reset error:", error)

      const errorMessage =
        error.code === "auth/user-not-found"
          ? "No account found with this email address."
          : error.message || "Failed to send password reset email."

      throw new Error(errorMessage)
    }
  }

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!user || !userData) throw new Error("User not authenticated.")

    console.log("Updating OHPLUS user data:", updates)
    // Always use the OHPLUS user ID
    const userDocRef = doc(db, "iboard_users", userData.uid)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(userDocRef, updatedFields)

    setUserData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateProjectData = async (updates: Partial<ProjectData>) => {
    if (!user || !userData?.project_id) throw new Error("Project not found or user not authenticated.")

    console.log("Updating project data:", updates)
    const projectDocRef = doc(db, "projects", userData.project_id)
    const updatedFields = { ...updates, updated: serverTimestamp() }
    await updateDoc(projectDocRef, updatedFields)

    setProjectData((prev) => (prev ? { ...prev, ...updates } : null))
  }

  useEffect(() => {
    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed: Firebase user logged in", firebaseUser.uid)

        try {
          // Always look for OHPLUS account first
          const ohplusAccountUid = await findOHPlusAccount(firebaseUser.email || "")
          if (ohplusAccountUid) {
            console.log("Using OHPLUS account:", ohplusAccountUid, "instead of Firebase Auth UID:", firebaseUser.uid)
            await fetchUserData(firebaseUser, ohplusAccountUid)
          } else {
            console.log("No OHPLUS account found, signing out")
            await signOut(auth)
          }
        } catch (error) {
          console.error("Error during auth state change:", error)
          await signOut(auth)
        }
      } else {
        console.log("Auth state changed: user logged out")
        setUser(null)
        setUserData(null)
        setProjectData(null)
        setSubscriptionData(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [fetchUserData])

  const value = {
    user, // This will always have the OHPLUS UID
    userData,
    projectData,
    subscriptionData,
    loading,
    login,
    loginOHPlusOnly,
    register,
    logout,
    resetPassword,
    updateUserData,
    updateProjectData,
    refreshUserData,
    refreshSubscriptionData,
    assignLicenseKey,
    getEffectiveUserId,
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
