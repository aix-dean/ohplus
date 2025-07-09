"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FirebaseError } from "firebase/app"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showJoinOrgDialog, setShowJoinOrgDialog] = useState(false)
  const [orgCode, setOrgCode] = useState("")
  const [joiningOrg, setJoiningOrg] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const getFriendlyErrorMessage = (error: unknown): string => {
    console.error("Raw error during registration:", error)
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/email-already-in-use":
          return "This email address is already in use. Please use a different email or log in."
        case "auth/invalid-email":
          return "The email address is not valid. Please check the format."
        case "auth/weak-password":
          return "The password is too weak. Please choose a stronger password (at least 6 characters)."
        case "auth/operation-not-allowed":
          return "Email/password accounts are not enabled. Please contact support."
        case "auth/network-request-failed":
          return "Network error. Please check your internet connection and try again."
        default:
          return "An unexpected error occurred during registration. Please try again."
      }
    }
    return "An unknown error occurred. Please try again."
  }

  const handleRegister = async () => {
    setErrorMessage(null)

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await register(
        {
          email,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone_number: phoneNumber,
          gender: "",
        },
        {
          company_name: "",
          company_location: "",
        },
        password,
      )
      setErrorMessage(null)
      router.push("/admin/dashboard?registered=true")
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = async () => {
    setErrorMessage(null)

    if (!orgCode.trim()) {
      setErrorMessage("Please enter an organization code.")
      return
    }

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setJoiningOrg(true)
    try {
      await register(
        {
          email,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone_number: phoneNumber,
          gender: "",
        },
        {
          company_name: "",
          company_location: "",
        },
        password,
        orgCode, // Pass the organization code
      )
      setErrorMessage(null)
      router.push("/admin/dashboard?registered=true&joined_org=true")
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setJoiningOrg(false)
    }
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
              <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">It's free to create one!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input
                  id="middleName"
                  placeholder=""
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Cellphone number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+63 9XX XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                By signing up, I hereby acknowledge that I have read, understood, and agree to abide by the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>
                ,{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                , and all platform{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  rules and regulations
                </a>{" "}
                set by OH!Plus.
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                type="submit"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                type="button"
                onClick={() => setShowJoinOrgDialog(true)}
                disabled={loading}
              >
                Join an organization
              </Button>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm mt-4 text-center" role="alert">
                {errorMessage}
              </div>
            )}
          </CardContent>
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
              <Button type="button" variant="outline" onClick={() => setShowJoinOrgDialog(false)} disabled={joiningOrg}>
                Cancel
              </Button>
              <Button type="button" onClick={handleJoinOrganization} disabled={joiningOrg}>
                {joiningOrg ? "Joining..." : "Join Organization"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
