"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FirebaseError } from "firebase/app"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showJoinOrgDialog, setShowJoinOrgDialog] = useState(false)
  const [orgCode, setOrgCode] = useState("")

  const { login } = useAuth()
  const router = useRouter()

  const getFriendlyErrorMessage = (error: unknown): string => {
    console.error("Raw error during login:", error)
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/user-not-found":
          return "No account found with this email address. Please check your email or sign up."
        case "auth/wrong-password":
          return "Incorrect password. Please try again or reset your password."
        case "auth/invalid-email":
          return "The email address is not valid. Please check the format."
        case "auth/user-disabled":
          return "This account has been disabled. Please contact support."
        case "auth/too-many-requests":
          return "Too many failed login attempts. Please try again later or reset your password."
        case "auth/network-request-failed":
          return "Network error. Please check your internet connection and try again."
        default:
          return "An unexpected error occurred during login. Please try again."
      }
    }
    return "An unknown error occurred. Please try again."
  }

  const handleLogin = async () => {
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      router.push("/admin/dashboard")
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = () => {
    if (!orgCode.trim()) {
      setErrorMessage("Please enter an organization code.")
      return
    }

    // Navigate to registration page with organization code
    router.push(`/register?orgCode=${encodeURIComponent(orgCode)}`)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Image */}
      <div className="relative hidden w-[40%] items-center justify-center bg-gray-900 lg:flex">
        <Image
          src="/registration-background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-50"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-gray-950 lg:w-[60%]">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                type="submit"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm mt-4 text-center" role="alert">
                {errorMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowJoinOrgDialog(true)}>
              Join an organization
            </Button>
          </CardFooter>
        </Card>
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
              <Button type="button" onClick={handleJoinOrganization}>
                Continue to Registration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
