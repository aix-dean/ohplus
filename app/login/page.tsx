"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, tenantAuth } from "@/lib/firebase"
import { assignRoleToUser } from "@/lib/hardcoded-access-service"

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
  const [currentStep, setCurrentStep] = useState(1) // 1: email+password, 2: new password, 3: file upload

  const { user, userData, getRoleDashboardPath, refreshUserData } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user && userData) {
      const dashboardPath = getRoleDashboardPath(userData.roles || [])
      if (dashboardPath) {
        router.push(dashboardPath)
      }
    }
  }, [user, userData, router, getRoleDashboardPath])

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

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.")
      setIsLoading(false)
      return
    }

    try {
      // Fetch point_person data to verify password
      const pointPersonData = await fetchPointPersonData(email)

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

      console.log("Password verified, proceeding to password change step")
      setCurrentStep(2)

    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login. Please try again.")
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

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!uploadedFile) {
      setError("Please upload a file to complete registration.")
      setIsLoading(false)
      return
    }

    try {
      // Fetch point_person data from companies collection
      const pointPersonData = await fetchPointPersonData(email)

      if (!pointPersonData) {
        setError("Unable to find your information. Please contact your administrator.")
        setIsLoading(false)
        return
      }

      const { point_person, company_id } = pointPersonData

      console.log("Creating user with point_person data:", point_person)

      // Create user in Firebase Auth (tenant) with new password
      const userCredential = await createUserWithEmailAndPassword(tenantAuth, email, newPassword)
      const firebaseUser = userCredential.user

      console.log("User created in tenant:", firebaseUser.uid)

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
        role: "sales",
        permissions: [],
        created: serverTimestamp(),
        updated: serverTimestamp(),
        onboarding: true,
      }

      await setDoc(userDocRef, userData)
      console.log("User document created in iboard_users collection with type OHPLUS")
      console.log("User data from point_person:", userData)

      // Assign role "sales" to user_roles collection
      try {
        await assignRoleToUser(firebaseUser.uid, "sales", firebaseUser.uid)
        console.log("Role 'sales' assigned to user_roles collection")
      } catch (roleError) {
        console.error("Error assigning role 'sales' to user_roles collection:", roleError)
      }

      // Refresh user data to update the auth context
      await refreshUserData()

      console.log("Registration completed successfully with type OHPLUS")

      // Registration successful - redirect will be handled by useEffect
    } catch (error: any) {
      console.error("Registration failed:", error)

      // Handle specific Firebase Auth errors
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
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
  }

  const handleBackToPassword = () => {
    setCurrentStep(2)
    setError("")
    setUploadedFile(null)
    setIsDragOver(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="flex flex-col w-full max-w-4xl bg-white rounded-lg md:shadow-lg overflow-hidden">
        {/* Mobile Header - Only visible on mobile */}
        <div className="md:hidden w-full p-6">
          <div className="flex flex-col items-center text-center">
            <Image src="/ohplus-new-logo.png" alt="OH! Plus Logo" width={80} height={80} priority />
            <h2 className="mt-4 text-2xl font-light text-blue-700 leading-tight text-center">
              Powering Smarter Site Management
              <br />
              for Billboard Operator
            </h2>
          </div>
        </div>

        <div className="flex">
          {/* Left Section: Logo and Company Name */}
          <div className="hidden md:flex flex-col items-center justify-evenly p-8 bg-gray-50 w-1/2">
            <Image src="/ohplus-new-logo.png" alt="OH! Plus Logo" width={120} height={120} priority />
            <h2 className="text-3xl font-light text-blue-700 leading-tight text-center">
              Powering Smarter
              <br />
              Site Management for
              <br />
              Billboard Operators
            </h2>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-2">by OH! Plus</span>
              <Image src="/ohplus-new-logo.png" alt="OH! Plus Logo" width={80} height={40} />
            </div>
          </div>

          {/* Right Section: Login Form */}
          <div className="w-full md:w-1/2 p-8">
            <Card className="border-none shadow-none">
              <CardHeader className="text-center md:text-left">
                <CardTitle className="text-3xl font-bold text-gray-900">Log in to your Account</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {currentStep === 1 ? "Welcome back! Please enter your credentials to continue." :
                   currentStep === 2 ? "Create a new password to complete registration." :
                   "Upload your document to complete your account setup."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 1 ? (
                  <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="sr-only">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="sr-only">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying..." : "Continue"}
                    </Button>
                  </form>
                ) : currentStep === 2 ? (
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-display" className="text-sm text-gray-600">
                        Email: {email}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToEmail}
                        className="text-blue-600 hover:underline p-0 h-auto"
                      >
                        Change email
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Continue to Upload"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleCompleteRegistration} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-display" className="text-sm text-gray-600">
                        Email: {email}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToPassword}
                        className="text-blue-600 hover:underline p-0 h-auto"
                      >
                        Change password
                      </Button>
                    </div>

                    {/* File Upload */}
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg shadow-blue-500/20'
                          : 'border-gray-300 hover:border-blue-400 bg-gray-50/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-6">
                        <div className="relative">
                          <div
                            className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isDragOver
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                            }`}
                          >
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              className={`w-8 h-8 ${isDragOver ? 'text-white' : 'text-gray-500'}`}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          {isDragOver && (
                            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-xl bg-blue-500/20 animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {uploadedFile ? `✓ ${uploadedFile.name}` : "Upload your document"}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {uploadedFile ? "Document uploaded successfully!" : "Drag and drop your file here or click to browse"}
                          </p>
                        </div>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.txt,.doc,.docx,.csv"
                          onChange={handleFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <p className="font-semibold mb-3 text-blue-800">📋 Upload Instructions:</p>
                      <ol className="list-decimal list-inside space-y-2 text-blue-700">
                        <li>Drag your PDF or text document from your computer to the upload area above</li>
                        <li>Or click "Choose File" to browse and select your document</li>
                        <li>The system will validate your file and complete your account registration</li>
                      </ol>
                      <p className="text-xs text-blue-600 mt-3 italic">
                        Supported formats: PDF, TXT, DOC, DOCX (max 10MB)
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                      disabled={isLoading || !uploadedFile}
                    >
                      {isLoading ? "Creating Account..." : "Complete Registration"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
