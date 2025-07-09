"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog"
import { JoinOrganizationDialog } from "@/components/join-organization-dialog"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [joinOrgDialogOpen, setJoinOrgDialogOpen] = useState(false)
  const [organizationCode, setOrganizationCode] = useState("")

  // Check for invitation code in URL parameters
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setOrganizationCode(codeFromUrl)
      setJoinOrgDialogOpen(true)
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError("Please fill in all required fields.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    try {
      setLoading(true)
      await register(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`,
        formData.firstName,
        formData.lastName,
      )

      // Show success dialog first
      setShowSuccessDialog(true)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    // Navigate to onboarding after dialog closes
    router.push("/onboarding")
  }

  const handleJoinOrganization = async () => {
    if (!organizationCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an organization code.",
      })
      return
    }

    setError("")

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError("Please fill in all required fields first.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    try {
      setLoading(true)
      await register(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`,
        formData.firstName,
        formData.lastName,
        organizationCode.trim(),
      )

      setJoinOrgDialogOpen(false)
      setShowSuccessDialog(true)
    } catch (error: any) {
      console.error("Registration with organization error:", error)
      setError(error.message || "Failed to join organization. Please check your code and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image src="/ohplus-new-logo.png" alt="OH!Plus Logo" width={120} height={40} className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">Join OH!Plus and start managing your OOH operations</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setJoinOrgDialogOpen(true)}
                disabled={loading}
              >
                Join an Organization
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image src="/registration-background.png" alt="Registration Background" fill className="object-cover" />
        <div className="absolute inset-0 bg-blue-600 bg-opacity-75"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to OH!Plus</h1>
            <p className="text-xl mb-8">The complete ERP solution for Out-of-Home advertising operations</p>
            <div className="space-y-4">
              <div className="flex items-center text-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Streamline your billboard operations
              </div>
              <div className="flex items-center text-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Manage inventory and bookings
              </div>
              <div className="flex items-center text-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Track performance and analytics
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <RegistrationSuccessDialog
        isOpen={showSuccessDialog}
        firstName={formData.firstName}
        onClose={handleSuccessDialogClose}
      />

      {/* Join Organization Dialog */}
      <JoinOrganizationDialog
        isOpen={joinOrgDialogOpen}
        onClose={() => setJoinOrgDialogOpen(false)}
        organizationCode={organizationCode}
        onOrganizationCodeChange={setOrganizationCode}
        onJoin={handleJoinOrganization}
        loading={loading}
        formData={formData}
        error={error}
      />
    </div>
  )
}
