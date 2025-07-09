"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Users, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const { register, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [joinOrgDialogOpen, setJoinOrgDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    organizationCode: "",
  })

  // Pre-fill organization code from URL if present
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setFormData((prev) => ({ ...prev, organizationCode: codeFromUrl }))
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
      })
      return
    }

    try {
      setLoading(true)
      await register(formData.email, formData.password, formData.displayName, formData.organizationCode || undefined)

      toast({
        title: "Registration Successful!",
        description: "Welcome! Your account has been created.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = () => {
    setJoinOrgDialogOpen(true)
  }

  const handleJoinOrgSubmit = () => {
    setJoinOrgDialogOpen(false)
    // Organization code is already in formData, proceed with normal registration
    document.getElementById("register-form")?.requestSubmit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up to get started with our platform</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Show organization code info if present */}
          {formData.organizationCode && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                You're joining an organization with code: <strong>{formData.organizationCode}</strong>
              </AlertDescription>
            </Alert>
          )}

          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Enter your full name"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
          </form>

          <Separator />

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleJoinOrganization}
            disabled={loading}
          >
            <Users className="h-4 w-4 mr-2" />
            Join an Organization
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Join Organization Dialog */}
      <Dialog open={joinOrgDialogOpen} onOpenChange={setJoinOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join an Organization</DialogTitle>
            <DialogDescription>Enter the organization code provided by your administrator.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization Code</Label>
              <Input
                id="orgCode"
                name="organizationCode"
                placeholder="Enter organization code (e.g., ABCD-1234)"
                value={formData.organizationCode}
                onChange={handleInputChange}
                className="font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setJoinOrgDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleJoinOrgSubmit} disabled={!formData.organizationCode}>
                Continue Registration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
