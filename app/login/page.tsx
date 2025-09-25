"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Mail, Lock, Eye, EyeOff, Upload, Car, Power, CheckCircle, Zap, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, getDocs, doc, setDoc, getDoc, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, tenantAuth } from "@/lib/firebase"
import { assignRoleToUser } from "@/lib/hardcoded-access-service"
import WelcomePage from "./welcome-page"

const createAnalyticsDocument = async () => {
  try {
    // Get user's IP address (in a real app, you'd get this from a service)
    const ipAddress = "127.0.0.1" // Placeholder - in production, get from API

    // Get user's location (placeholder coordinates for now)
    const geopoint = new GeoPoint(14.5973113, 120.9969413)

    const analyticsData = {
      action: "page_view",
      created: new Date(),
      geopoint: geopoint,
      ip_address: ipAddress,
      isGuest: true,
      page: "Home",
      platform: "WEB",
      tags: [
        {
          action: "page_view",
          isGuest: true,
          page: "Home",
          platform: "WEB",
          section: "homepage",
        },
      ],
      uid: "",
    }

    await addDoc(collection(db, "analytics_ohplus"), analyticsData)
    console.log("Analytics document created successfully")
  } catch (error) {
    console.error("Error creating analytics document:", error)
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: email+password, 2: new password, 3: file upload
  const [isActivated, setIsActivated] = useState(false)
  const [fileName, setFileName] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [pointPersonData, setPointPersonData] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const pointPersonDataRef = useRef<any>(null)

  const { user, userData, getRoleDashboardPath, refreshUserData, login, loginOHPlusOnly, startRegistration, endRegistration } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if already logged in
  useEffect(() => {
    if (user && userData && !showWelcome) {
      const dashboardPath = getRoleDashboardPath(userData.roles || [])
      if (dashboardPath) {
        // Add a small delay to prevent immediate back-and-forth redirects
        const timer = setTimeout(() => {
          router.push(dashboardPath)
        }, 1000) // 1 second delay
        return () => clearTimeout(timer)
      }
    }
  }, [user, userData, router, getRoleDashboardPath, showWelcome])

  // Fetch point_person data from companies collection
  const fetchPointPersonData = async (email: string) => {
    try {
      console.log("Fetching point_person data for email:", email)
      const companiesRef = collection(db, "companies")
      const companiesSnapshot = await getDocs(companiesRef)

      // Find the company with matching point_person.email
      for (const doc of companiesSnapshot.docs) {
        const data = doc.data()
        if (data.point_person && data.point_person.email === email) {
          console.log("Found point_person data:", data.point_person)
          return {
            point_person: data.point_person,
            company_id: doc.id,
            company_data: data
          }
        }
      }

      console.log("No point_person data found for email:", email)
      return null
    } catch (error) {
      console.error("Error fetching point_person data:", error)
      return null
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const trimmedEmail = email.trim()
    setEmail(trimmedEmail)

    if (!trimmedEmail || !password.trim()) {
      setError("Please enter both email and password.")
      setIsLoading(false)
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    try {
      console.log("Attempting login for email:", trimmedEmail)
      // First, try to login as existing user
      await login(trimmedEmail, password)
      // If successful, auth context will handle redirect
      console.log("Existing user logged in successfully")
    } catch (error: any) {
      console.error("Login attempt failed:", error)

      if (error.code === 'auth/user-not-found') {
        // User not found in tenant, check if eligible for signup
        console.log("User not found in tenant, checking for signup eligibility for email:", trimmedEmail)

        const pointPersonData = await fetchPointPersonData(trimmedEmail)

        if (!pointPersonData) {
          setError("This email address is not registered with any company. Please contact your administrator.")
          setIsLoading(false)
          return
        }

        const { point_person } = pointPersonData

        // Check if entered password matches point_person.password
        if (point_person.password !== password) {
          setError("Invalid password. Please check your credentials.")
          setIsLoading(false)
          return
        }

        console.log("Signup eligibility verified, proceeding to password change step")
        setPointPersonData(pointPersonData)
        pointPersonDataRef.current = pointPersonData
        console.log('pointPersonData set to state and ref:', pointPersonData)
        setCurrentStep(2)
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError("Invalid email or password.")
      } else {
        setError("An error occurred during login. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all required fields.")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.")
      setIsLoading(false)
      return
    }

    console.log("Password change validated, proceeding to file upload step")
    // Store the new password in the ref for use in step 3
    if (pointPersonDataRef.current) {
      pointPersonDataRef.current.newPassword = newPassword
    }
    setCurrentStep(3)
    setIsLoading(false)
  }

  const validateAndSetFile = (file: File) => {
    // Check if it's a PDF or text file
    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
      // File size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB.")
        return
      }
      setUploadedFile(file)
      setError("")
    } else {
      setError("Please upload a PDF or text document.")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      validateAndSetFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      validateAndSetFile(file)
    }
  }

  const handleCompleteRegistration = async (activationData?: any, file?: File, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    console.log('Starting registration completion with activationData:', activationData)
    console.log('handleCompleteRegistration called - step 3 user creation')
    console.log('File parameter:', file)
    console.log('uploadedFile state:', uploadedFile)
    setError("")
    setIsLoading(true)

    const actualFile = file || uploadedFile
    console.log('actualFile:', actualFile)
    if (!actualFile) {
      console.log('No file found, returning early')
      setError("Please upload a file to complete registration.")
      setIsLoading(false)
      return
    }
    console.log('File validation passed, continuing...')

    // Email validation - use point_person email since component state might be lost
    const userEmail = pointPersonDataRef.current?.point_person?.email
    console.log('Email to validate from point_person:', userEmail)

    if (!userEmail || !isValidEmail(userEmail)) {
      console.log('Email validation failed for:', userEmail)
      setError("Invalid email address.")
      setIsLoading(false)
      return
    }

    console.log("Email validation passed, email:", userEmail)

    try {
      console.log('Using stored point_person data...')
      console.log('pointPersonData in ref:', pointPersonDataRef.current)
      if (!pointPersonDataRef.current) {
        console.log('Point person data not found in ref - returning early')
        setError("Unable to find your information. Please contact your administrator.")
        setIsLoading(false)
        return
      }
      console.log('Point person data found in ref, continuing...')

      const { point_person, company_id } = pointPersonDataRef.current
      console.log("Point person data found:", point_person)

      // Start registration to prevent auth listener from signing out
      startRegistration()

      // Use email and password from point_person data instead of component state
      const userEmail = point_person.email
      const userPassword = pointPersonDataRef.current.newPassword || newPassword
      console.log("About to create user in Firebase Auth")
      console.log("Creating user in Firebase Auth with email:", userEmail, "password length:", userPassword.length)
      // Create user in Firebase Auth (tenant) with new password
      const userCredential = await createUserWithEmailAndPassword(tenantAuth, userEmail, userPassword)
      const firebaseUser = userCredential.user
      console.log("User created in tenant:", firebaseUser.uid)
      console.log("Created user ID:", firebaseUser.uid)
      console.log("User creation successful, proceeding to document creation")

      console.log("Creating user document in iboard_users...")
      // Create user document in iboard_users collection with type="OHPLUS"
      const userDocRef = doc(db, "iboard_users", firebaseUser.uid)
      const userData = {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        first_name: point_person.first_name || "",
        last_name: point_person.last_name || "",
        middle_name: point_person.middle_name || "",
        phone_number: point_person.phone_number || "",
        gender: point_person.gender || "",
        company_id: company_id,
        type: "OHPLUS",
        role: "admin",
        permissions: ["admin", "it"],
        activation: activationData,
        created: serverTimestamp(),
        updated: serverTimestamp(),
        onboarding: true,
      }
      console.log("User data to be created in iboard_users:", userData)
      console.log("About to call setDoc for iboard_users")

      await setDoc(userDocRef, userData)
      console.log("User document created in iboard_users collection with type OHPLUS")
      console.log("setDoc completed successfully")

      console.log("Verifying iboard_users document creation...")
      const docSnap = await getDoc(userDocRef)
      if (!docSnap.exists()) {
        throw new Error("Failed to create iboard_users document")
      }
      console.log("iboard_users document verified successfully")
      console.log('warren')

      console.log("Assigning roles...")
      // Assign roles "admin" and "it" to user_roles collection
      try {
        await assignRoleToUser(firebaseUser.uid, "admin", firebaseUser.uid)
        console.log("Role 'admin' assigned to user_roles collection")

        await assignRoleToUser(firebaseUser.uid, "it", firebaseUser.uid)
        console.log("Role 'it' assigned to user_roles collection")
      } catch (roleError) {
        console.error("Error assigning roles to user_roles collection:", roleError)
      }

      console.log("Refreshing user data...")
      // Refresh user data to update the auth context
      await refreshUserData()
      console.log("User data refreshed")

      // End registration
      endRegistration()

      console.log("Registration completed successfully, showing welcome page...")
      setShowWelcome(true)
    } catch (error: any) {
      console.error("Registration failed:", error)
      console.log("Error code:", error.code, "Error message:", error.message)
      console.log("handleCompleteRegistration failed - no iboard_users created")

      // End registration on error
      endRegistration()

      // Handle specific Firebase Auth errors
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else {
        setError(error.message || "Registration failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setCurrentStep(1)
    setError("")
    setPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setUploadedFile(null)
    setIsDragOver(false)
    setIsActivated(false)
    setFileName("")
    setIsValidating(false)
    setPointPersonData(null)
    setShowWelcome(false)
    pointPersonDataRef.current = null
    // Don't reset email here
  }

  const handleBackToPassword = () => {
    setCurrentStep(2)
    setError("")
    setUploadedFile(null)
    setIsDragOver(false)
    setIsActivated(false)
    setFileName("")
    setIsValidating(false)
    setShowWelcome(false)
  }

  const handleDragOverStep3 = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeaveStep3 = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDropStep3 = useCallback(async (e: React.DragEvent) => {
    console.log('handleDropStep3 called')
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    console.log('Dropped files:', files.map(f => f.name))
    const activationFile = files.find((file) => file.name.endsWith('.lic'))
    console.log('Activation file found:', activationFile?.name)

    if (activationFile) {
      console.log('Starting validation process for file:', activationFile.name)
      setIsValidating(true)
      const formData = new FormData()
      formData.append('activationKey', activationFile)

      try {
        console.log('Calling OHPlus Activation Key Validator API...')
        const response = await fetch('/api/validate-activation', {
          method: 'POST',
          body: formData
        })
        console.log('API response received, status:', response.status)
        const result = await response.json()
        console.log('API result parsed:', result)

        console.log('OHPlus Activation Key Validator API Full Success Response (200 OK):', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: result
        })

        if (result.success) {
          console.log('API returned success, proceeding with companyId validation')
          // Additional validation: check if callback companyId matches step 1 company_id
          const callbackCompanyId = result.data.companyId
          const step1CompanyId = pointPersonDataRef.current.company_id
          console.log('Comparing companyIds - Callback:', callbackCompanyId, 'Step1:', step1CompanyId)

          if (callbackCompanyId !== step1CompanyId) {
            console.log('Company ID mismatch - Callback companyId:', callbackCompanyId, 'Step 1 company_id:', step1CompanyId)
            setError('Invalid activation key: Company ID does not match.')
            toast({ title: "Invalid Activation Key", description: "The activation key does not match your company. Please contact your administrator.", variant: "destructive" })
            setIsValidating(false)
            return
          }

          console.log('Company ID validation passed, proceeding with registration')
          console.log('File authenticated')
          setFileName(activationFile.name)
          setUploadedFile(activationFile)
          try {
            // Complete registration first
            console.log('Calling handleCompleteRegistration')
            await handleCompleteRegistration(result.data, activationFile)
            // Only show success after successful registration
            setIsActivated(true)
            toast({ title: "Activation Key Validated", description: "Your license file has been successfully authenticated." })
          } catch (error) {
            console.error('Registration failed:', error)
            setError('Registration failed. Please try again.')
          }
        } else {
          console.log('File not valid, result:', result)
          setError(result.error || 'Invalid activation key')
          toast({ title: "Invalid Activation Key", description: result.error || "The uploaded file is not a valid activation key.", variant: "destructive" })
        }
      } catch (error) {
        console.error('Failed to validate activation key, error:', error)
        setError('Failed to validate activation key')
      } finally {
        setIsValidating(false)
      }
    } else {
      console.log('No .lic file found in dropped files')
    }
  }, [])

  const handleFileSelectStep3 = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelectStep3 called')
    const files = e.target.files
    console.log('Selected files:', files ? Array.from(files).map(f => f.name) : 'none')
    if (files && files.length > 0) {
      const file = files[0]
      console.log('Processing file:', file.name)
      if (file.name.endsWith('.lic')) {
        console.log('Starting validation process for file:', file.name)
        setIsValidating(true)
        const formData = new FormData()
        formData.append('activationKey', file)

        try {
          console.log('Calling OHPlus Activation Key Validator API...')
          const response = await fetch('/api/validate-activation', {
            method: 'POST',
            body: formData
          })
          console.log('API response received, status:', response.status)
          const result = await response.json()
          console.log('API result parsed:', result)

          console.log('OHPlus Activation Key Validator API Full Success Response (200 OK):', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            data: result
          })

          if (result.success) {
            console.log('API returned success, proceeding with companyId validation')
            // Additional validation: check if callback companyId matches step 1 company_id
            const callbackCompanyId = result.data.companyId
            const step1CompanyId = pointPersonDataRef.current.company_id
            console.log('Comparing companyIds - Callback:', callbackCompanyId, 'Step1:', step1CompanyId)

            if (callbackCompanyId !== step1CompanyId) {
              console.log('Company ID mismatch - Callback companyId:', callbackCompanyId, 'Step 1 company_id:', step1CompanyId)
              setError('Invalid activation key: Company ID does not match.')
              toast({ title: "Invalid Activation Key", description: "The activation key does not match your company. Please contact your administrator.", variant: "destructive" })
              setIsValidating(false)
              return
            }

            console.log('Company ID validation passed, proceeding with registration')
            console.log('File authenticated')
            setFileName(file.name)
            setUploadedFile(file)
            try {
              // Complete registration first
              console.log('Calling handleCompleteRegistration')
              await handleCompleteRegistration(result.data, file)
              // Only show success after successful registration
              setIsActivated(true)
              toast({ title: "Activation Key Validated", description: "Your license file has been successfully authenticated." })
            } catch (error) {
              console.error('Registration failed:', error)
              setError('Registration failed. Please try again.')
            }
          } else {
            console.log('File not valid, result:', result)
            setError(result.error || 'Invalid activation key')
            toast({ title: "Invalid Activation Key", description: result.error || "The uploaded file is not a valid activation key.", variant: "destructive" })
          }
        } catch (error) {
          console.error('Failed to validate activation key, error:', error)
          setError('Failed to validate activation key')
        } finally {
          setIsValidating(false)
        }
      } else {
        console.log('File does not end with .lic')
        setError('Please select a .lic file')
      }
    } else {
      console.log('No files selected')
    }
  }, [])

  if (showWelcome) {
    return <WelcomePage onStartTour={() => router.push("/it/user-management")} userName={pointPersonDataRef.current?.point_person?.first_name} />
  }

  return currentStep === 3 ? (
    <div className="min-h-screen flex">
      {/* Left side - Content */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="max-w-xl w-full space-y-6">
          {/* Avatar */}
          <Image
            src="/login-image-5.png"
            alt="User avatar"
            width={64}
            height={64}
            className="rounded-full"
          />

          {/* Heading */}
          <div>
            <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-4">
              Alright {pointPersonDataRef.current?.point_person?.first_name || "User"},
              <br />
              {"we're almost"}
              <br />
              set!
            </h1>
            <p className="text-gray-600 text-xl leading-relaxed">
              Just upload the license key from your <span className="font-semibold text-gray-900">OHPlus Key</span> so
              we can unlock your account.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Upload area with illustration */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <Image
          src="/login-image-3.png"
          alt="Background"
          fill
          className="object-cover -z-10"
        />
        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {/* Various floating cubes and rectangles */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-cyan-400 rounded-lg transform rotate-12 opacity-80"></div>
          <div className="absolute top-32 right-32 w-12 h-20 bg-pink-400 rounded-lg transform -rotate-6 opacity-70"></div>
          <div className="absolute top-60 left-32 w-20 h-12 bg-purple-400 rounded-lg transform rotate-45 opacity-60"></div>
          <div className="absolute bottom-40 right-20 w-14 h-14 bg-blue-300 rounded-lg transform -rotate-12 opacity-80"></div>
          <div className="absolute bottom-60 left-16 w-18 h-10 bg-pink-300 rounded-lg transform rotate-30 opacity-70"></div>
          <div className="absolute top-40 right-16 w-10 h-16 bg-cyan-300 rounded-lg transform -rotate-45 opacity-60"></div>
        </div>

        {/* Main upload area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative max-w-sm w-full -mt-16 ml-32">
            <Image
              src="/login-image-4.png"
              alt="License upload area"
              width={240}
              height={180}
              className={`rounded-2xl transition-all duration-300 cursor-pointer ${
                isDragOver ? "scale-105 shadow-lg ring-4 ring-cyan-400" : ""
              } ${isActivated ? "ring-4 ring-green-400" : ""}`}
              onDragOver={handleDragOverStep3}
              onDragLeave={handleDragLeaveStep3}
              onDrop={handleDropStep3}
              onClick={() => document.getElementById('activation-file-upload')?.click()}
            />
            <input
              type="file"
              id="activation-file-upload"
              className="hidden"
              accept=".lic"
              onChange={handleFileSelectStep3}
            />
            {isValidating && (
              <div className="absolute inset-0 flex items-center justify-center  -ml-32 bg-black/50 rounded-2xl">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-12 mx-auto animate-spin" />
                  <p className="text-lg font-medium">Validating License Key...</p>
                </div>
              </div>
            )}
            {isActivated && (
              <div className="absolute inset-0 flex items-center justify-center -mt-16 -ml-16 bg-black/50 rounded-2xl">
                <div className="text-center text-white">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">License Key Validated!</p>
                  <p className="text-sm">Key "{fileName}" authenticated.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fun fact at bottom */}
        <div className="p-8">
          <div className="bg-blue-800/30 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-lg leading-relaxed text-center font-bold">
              <span className="font-bold">FUN FACT:</span> The Philippines is one of the top OOH markets in Southeast
              Asia, with EDSA alone hosting more than 2,000 billboards! {"It's"} like the Times Square of Manila.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden w-full p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col items-center text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-4">
            <div className="text-gray-900 font-bold text-xl">OH+</div>
          </div>
          <h2 className="text-xl font-light text-gray-700 leading-tight">
            Powering smarter site management
            <br />
            for billboard operators.
          </h2>
        </div>
      </div>



      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white p-8 order-1 md:order-1 min-h-0">
        {/* Full width container for login form */}
        <div className="w-full max-w-md space-y-6 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Welcome!</h1>
          </div>

          <div className="space-y-4">
            {(currentStep === 1 || currentStep === 2) ? (
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm text-gray-600">
                    Username
                  </Label>
                  <Input id="username" type="text" placeholder="Username" className="h-12 border-gray-200 rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-600">
                    Password
                  </Label>
                  <Input id="password" type="password" placeholder="Password" className="h-12 border-gray-200 rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                {/* Forgot Password link */}
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    onClick={() => {
                      router.push('/forgot-password');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg" type="submit" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Login"}
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        {/* Promotional text at the bottom of the first column */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-gray-500 italic text-sm leading-relaxed">
            Looking to streamline your OOH business? Explore our ERP with a free demo. Email us at{" "}
            <span className="font-bold">inquiry@aix.ph</span>
          </p>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden md:flex flex-1 relative order-2 md:order-2">
        <div className="w-full h-full rounded-[50px] p-4">
          <Image
            src="/login-image-1.png"
            alt="Login illustration"
            fill
            className="rounded-[46px] p-8"
            priority
          />
        </div>
      </div>

      {/* Password Setup Dialog */}
      <Dialog open={currentStep === 2} onOpenChange={(open) => { if (!open) setCurrentStep(1); }}>
        <DialogContent className="bg-white rounded-[50px] shadow-lg p-8 max-w-4xl w-full flex">
<div className="flex-1 p-4 flex items-center justify-center">
  <Image
    src="/login-image-2.png"
    alt="Login illustration"
    width={320}
    height={320}
    className="rounded-lg"
  />
</div>
            <div className="flex-1 p-4 space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900 mb-3">Hey {pointPersonDataRef.current?.point_person?.first_name || email}!</h1>
                <p className="text-gray-600 text-xl leading-relaxed">
                  {"It's great to finally meet you. I'm "}
                  <span className="font-semibold text-gray-900">Oscar</span>
                  {", your OHPlus buddy."}
                </p>
                <p className="text-gray-600 text-xl leading-relaxed mt-3">
                  {
                    "Before we jump into the exciting stuff, let's set up a new password to keep your account safe and secure."
                  }
                </p>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    className="h-11 border-gray-200 rounded-lg text-xl pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="h-11 border-gray-200 rounded-lg text-xl pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </Button>
                </div>
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg mt-4" type="submit" disabled={isLoading}>
                  {isLoading ? "Processing..." : "OK"}
                </Button>
              </form>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
