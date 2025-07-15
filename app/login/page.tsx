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
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showJoinOrgDialog, setShowJoinOrgDialog] = useState(false)
  const [orgCode, setOrgCode] = useState("")
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  const { login, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard") // Changed redirect to /admin/dashboard
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/admin/dashboard") // Changed redirect to /admin/dashboard
    } catch (error: any) {
      console.error("Login error:", error)

      // Provide more user-friendly error messages
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password. Please check your credentials.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many unsuccessful login attempts. Please try again later.")
      } else if (error.code === "auth/tenant-id-mismatch") {
        setError("Authentication error: Tenant ID mismatch. Please contact support.")
      } else {
        setError(error.message || "Failed to login. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Section: Logo and Company Name */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gray-50 w-1/2">
          <div className="flex flex-col items-center space-y-6">
            {/* OH Plus Logo */}
            <div className="text-center">
              <Image src="/ohplus-new-logo.png" alt="OH Plus Logo" width={80} height={80} priority />
            </div>

            {/* Main tagline */}
            <div className="text-center max-w-xs">
              <h2 className="text-3xl font-light text-blue-600 leading-tight">
                Powering Smarter Site Management for Billboard Operators
              </h2>
            </div>

            {/* Powered by section */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">powered by:</p>
              <Image src="/aix-logo.png" alt="AiX AI Xynergy Logo" width={80} height={60} priority />
            </div>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="w-full md:w-1/2 p-8">
          <Card className="border-none shadow-none">
            {/* Add branding component at the top */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">OH!</h1>
              <p className="text-lg font-light text-blue-600 leading-tight">
                Powering Smarter Site Management for Billboard Operators
              </p>
            </div>

            <CardHeader className="text-center md:text-left">
              <CardTitle className="text-3xl font-bold text-gray-900">Log in to your Account</CardTitle>
              <CardDescription className="text-gray-600 mt-2">Welcome back! Select method to log in:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  variant="outline"
                  className="flex-1 flex items-center gap-2 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Image src="/placeholder.svg?height=20&width=20" alt="Google" width={20} height={20} />
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 flex items-center gap-2 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Image src="/placeholder.svg?height=20&width=20" alt="Facebook" width={20} height={20} />
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
            </CardFooter>
          </Card>
        </div>
      </div>

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
    </div>
  )
}
