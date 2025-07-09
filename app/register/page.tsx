"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [cellphone, setCellphone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [orgDialogOpen, setOrgDialogOpen] = useState(false)
  const [joiningOrg, setJoiningOrg] = useState(false)

  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for code in URL parameters
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setOrgCode(codeFromUrl)
      setOrgDialogOpen(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent, organizationCode?: string) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setLoading(true)
      await register(email, password, firstName, lastName, organizationCode)

      if (organizationCode) {
        toast({
          title: "Successfully joined organization!",
          description: "You have been registered and added to the organization.",
        })
      }

      router.push("/onboarding")
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orgCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an organization code.",
      })
      return
    }

    setJoiningOrg(true)
    await handleSubmit(e, orgCode.trim())
    setJoiningOrg(false)
    setOrgDialogOpen(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('/led-billboard-1.png')`,
          }}
        ></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-6xl font-bold mb-4">
            <span className="text-white">OH</span>
            <span className="text-blue-400">!</span>
          </div>
          <p className="text-xl text-center text-gray-200">Out-of-Home Advertising Platform</p>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h2>
            <p className="text-gray-600">It's free to create one!</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
                Middle Name (Optional)
              </Label>
              <Input
                id="middleName"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Cellphone */}
            <div>
              <Label htmlFor="cellphone" className="text-sm font-medium text-gray-700">
                Cellphone number
              </Label>
              <Input
                id="cellphone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-500 text-center px-4">
              By signing up, I hereby acknowledge that I have read, understood, and agree to abide by the{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms and Conditions
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              , and all platform rules and regulations set by OHPlus.
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            {/* Join Organization Button */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full flex items-center gap-2 bg-transparent">
                  <Users className="h-4 w-4" />
                  Join an organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join an Organization</DialogTitle>
                  <DialogDescription>
                    Enter the organization code provided by your administrator to join their organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinOrganization} className="space-y-4">
                  <div>
                    <Label htmlFor="orgCode">Organization Code</Label>
                    <Input
                      id="orgCode"
                      type="text"
                      placeholder="Enter organization code (e.g., ABCD-1234)"
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                      className="mt-1 font-mono"
                      maxLength={9}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setOrgDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={joiningOrg || !orgCode.trim()} className="flex-1">
                      {joiningOrg ? "Joining..." : "Join Organization"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
