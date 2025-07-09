"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

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

      toast({
        title: "Registration Successful!",
        description: "Your account has been created successfully.",
      })

      router.push("/onboarding")
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
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

      toast({
        title: "Welcome to the Organization!",
        description: "Your account has been created and you've joined the organization successfully.",
      })

      router.push("/onboarding")
    } catch (error: any) {
      console.error("Registration with organization error:", error)
      setError(error.message || "Failed to join organization. Please check your code and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Enter your information to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setJoinOrgDialogOpen(true)}
              disabled={loading}
            >
              <Users className="h-4 w-4 mr-2" />
              Join an Organization
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Join Organization Dialog */}
      <Dialog open={joinOrgDialogOpen} onOpenChange={setJoinOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join an Organization</DialogTitle>
            <DialogDescription>
              Enter the organization code provided by your administrator to join their organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization Code</Label>
              <Input
                id="orgCode"
                placeholder="Enter organization code (e.g., ABCD-1234)"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setJoinOrgDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleJoinOrganization} disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Joining...
                </>
              ) : (
                "Join Organization"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
