"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { collection, query, where, getDocs, addDoc, GeoPoint } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showJoinOrgDialog, setShowJoinOrgDialog] = useState(false)
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false)
  const [comingSoonFeature, setComingSoonFeature] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  const { loginOHPlusOnly, user, userData, getRoleDashboardPath } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  // useEffect(() => {
  //   if (user) {
  //     router.push("/admin/dashboard")
  //   }
  // }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await loginOHPlusOnly(email, password)
      // The redirect will be handled by the useEffect below after userData is loaded
    } catch (error: any) {
      console.error("Login error:", error)

      // Provide more user-friendly error messages
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password. Please check your credentials.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many unsuccessful login attempts. Please try again later.")
      } else if (error.code === "auth/tenant-id-mismatch") {
        setError("Authentication error: Tenant ID mismatch. Please contact support.")
      } else if (error.message === "OHPLUS_ACCOUNT_NOT_FOUND") {
        setError("No OHPLUS account found with this email address. Only OHPLUS accounts can access this system.")
      } else if (error.message === "ACCOUNT_TYPE_NOT_ALLOWED") {
        setError("This account type is not allowed to access this system. Only OHPLUS accounts are permitted.")
      } else {
        setError(error.message || "Failed to login. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    setComingSoonFeature(`${provider} login`)
    setShowComingSoonDialog(true)
  }

  const validateInvitationCode = async (code: string) => {
    try {
      // Query invitation_codes collection by the 'code' field
      const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", code))
      const invitationSnapshot = await getDocs(invitationQuery)

      if (invitationSnapshot.empty) {
        throw new Error("Invalid invitation code.")
      }

      // Get the first matching document
      const invitationDoc = invitationSnapshot.docs[0]
      const invitationData = invitationDoc.data()

      // Check if code has expired
      if (invitationData.expires_at && invitationData.expires_at.toDate() < new Date()) {
        throw new Error("Invitation code has expired.")
      }

      // Check if code has reached maximum uses
      if (invitationData.max_uses && invitationData.used_count >= invitationData.max_uses) {
        throw new Error("Invitation code has reached its maximum number of uses.")
      }

      return true
    } catch (error: any) {
      throw error
    }
  }

  const handleJoinOrganization = async () => {
    if (!orgCode.trim()) {
      setError("Please enter an organization code.")
      return
    }

    setIsValidatingCode(true)
    setError("")

    try {
      await validateInvitationCode(orgCode)
      // If validation passes, navigate to registration page with organization code
      router.push(`/register?orgCode=${encodeURIComponent(orgCode)}`)
    } catch (error: any) {
      setError(error.message || "Failed to validate invitation code.")
    } finally {
      setIsValidatingCode(false)
    }
  }

  // Role-based navigation after login
  useEffect(() => {
    console.log("Login navigation useEffect triggered")
    console.log("user:", !!user)
    console.log("userData:", userData)
    console.log("isLoading:", isLoading)

    if (user && userData && !isLoading) {
      console.log("userData.roles:", userData.roles)

      // Only use the roles array from user_roles collection
      if (userData.roles && userData.roles.length > 0) {
        console.log("Using roles from user_roles collection:", userData.roles)
        const dashboardPath = getRoleDashboardPath(userData.roles)

        if (dashboardPath) {
          console.log("Navigating to:", dashboardPath)
          router.push(dashboardPath)
        } else {
          console.log("No dashboard path found for roles, redirecting to unauthorized")
          router.push("/unauthorized")
        }
      } else {
        console.log("No roles found in user_roles collection, redirecting to unauthorized")
        router.push("/unauthorized")
      }
    }
  }, [user, userData, isLoading, router, getRoleDashboardPath])

  // Analytics tracking on page load
  useEffect(() => {
    createAnalyticsDocument()
  }, [])

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
              <span className="text-sm text-gray-500 mb-2">powered by:</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/viber_image_2025-07-15_14-17-13-347%20%281%29-3VNhEPkGkulXmH71m4tLs6MVORYOno.png"
                alt="AIX AI Xynergy Logo"
                width={100}
                height={50}
              />
            </div>
          </div>

          {/* Right Section: Login Form */}
          <div className="w-full md:w-1/2 p-8">
            <Card className="border-none shadow-none">
              <CardHeader className="text-center md:text-left">
                <CardTitle className="text-3xl font-bold text-gray-900">Log in to your Account</CardTitle>
                <CardDescription className="text-gray-600 mt-2">Welcome back! Select method to log in:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center gap-2 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                    onClick={() => handleSocialLogin("Google")}
                  >
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Google_Icons-09-512-xTPWQW6Ebs2IlRYdW10MAg71P4QPDL.webp"
                      alt="Google"
                      width={20}
                      height={20}
                    />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center gap-2 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                    onClick={() => handleSocialLogin("Facebook")}
                  >
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Facebook_Logo_2023-4SQHsSrZ3kX2dVTojWLhiS3pOKdNbq.png"
                      alt="Facebook"
                      width={20}
                      height={20}
                    />
                    Facebook
                  </Button>
                </div>

                <div className="relative flex items-center justify-center my-6">
                  <Separator className="absolute w-full" />
                  <span className="relative z-10 bg-white px-4 text-sm text-gray-500">or continue with email</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember-me" />
                      <Label htmlFor="remember-me" className="text-gray-700">
                        Remember me
                      </Label>
                    </div>
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:underline">
                    Create an account
                  </Link>
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setShowJoinOrgDialog(true)}
                >
                  Join an organization
                </Button>

                {/* Analytics Navigation Link */}
                <div className="mt-4 pt-2 border-t border-gray-200">
                  <Link href="/analytics" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    View Analytics Dashboard
                  </Link>
                </div>

                <div className="md:hidden flex flex-col items-center mt-4 pt-[30px]">
                  <span className="text-sm text-gray-500 mb-2">powered by:</span>
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/viber_image_2025-07-15_14-17-13-347%20%281%29-3VNhEPkGkulXmH71m4tLs6MVORYOno.png"
                    alt="AIX AI Xynergy Logo"
                    width={100}
                    height={50}
                  />
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Join Organization Dialog */}
      <Dialog open={showJoinOrgDialog} onOpenChange={setShowJoinOrgDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Join an Organization</DialogTitle>
            <DialogDescription>
              Enter the organization code provided by your administrator to join their organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization Code</Label>
              <Input
                id="orgCode"
                placeholder="Enter organization code"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowJoinOrgDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleJoinOrganization} disabled={isValidatingCode}>
                {isValidatingCode ? "Validating..." : "Continue to Registration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Dialog */}
      <ComingSoonDialog
        isOpen={showComingSoonDialog}
        onClose={() => setShowComingSoonDialog(false)}
        feature={comingSoonFeature}
      />
    </div>
  )
}
