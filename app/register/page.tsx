"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Building2, Users, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { validateInvitationCode } from "@/lib/invitation-service"
import { toast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const { register, joinOrganization } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean
    error?: string
    companyId?: string
  } | null>(null)

  // Form state for new organization
  const [newOrgForm, setNewOrgForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    licenseKey: "",
  })

  // Form state for joining organization
  const [joinOrgForm, setJoinOrgForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  })

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValidation(null)
      return
    }

    setValidatingCode(true)
    try {
      const result = await validateInvitationCode(code)
      setCodeValidation(result)
    } catch (error) {
      setCodeValidation({ valid: false, error: "Failed to validate code" })
    } finally {
      setValidatingCode(false)
    }
  }

  const handleNewOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (newOrgForm.password !== newOrgForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newOrgForm.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (
      !newOrgForm.firstName ||
      !newOrgForm.lastName ||
      !newOrgForm.email ||
      !newOrgForm.companyName ||
      !newOrgForm.licenseKey
    ) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await register({
        email: newOrgForm.email,
        password: newOrgForm.password,
        firstName: newOrgForm.firstName,
        lastName: newOrgForm.lastName,
        companyName: newOrgForm.companyName,
        licenseKey: newOrgForm.licenseKey,
      })

      toast({
        title: "Registration Successful",
        description: "Welcome to your new organization!",
      })

      router.push("/onboarding")
    } catch (error: any) {
      setError(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (joinOrgForm.password !== joinOrgForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (joinOrgForm.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!joinOrgForm.firstName || !joinOrgForm.lastName || !joinOrgForm.email || !joinOrgForm.invitationCode) {
      setError("Please fill in all required fields")
      return
    }

    if (!codeValidation?.valid) {
      setError("Please enter a valid invitation code")
      return
    }

    setLoading(true)
    try {
      await joinOrganization({
        email: joinOrgForm.email,
        password: joinOrgForm.password,
        firstName: joinOrgForm.firstName,
        lastName: joinOrgForm.lastName,
        invitationCode: joinOrgForm.invitationCode,
      })

      toast({
        title: "Successfully Joined Organization",
        description: "Welcome to the team!",
      })

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to join organization")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Choose how you'd like to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new-org" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-org" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                New Organization
              </TabsTrigger>
              <TabsTrigger value="join-org" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Join Organization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-org" className="space-y-4">
              <form onSubmit={handleNewOrgSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={newOrgForm.firstName}
                      onChange={(e) => setNewOrgForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={newOrgForm.lastName}
                      onChange={(e) => setNewOrgForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOrgForm.email}
                    onChange={(e) => setNewOrgForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={newOrgForm.companyName}
                    onChange={(e) => setNewOrgForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Input
                    id="licenseKey"
                    type="text"
                    value={newOrgForm.licenseKey}
                    onChange={(e) => setNewOrgForm((prev) => ({ ...prev, licenseKey: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newOrgForm.password}
                      onChange={(e) => setNewOrgForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={newOrgForm.confirmPassword}
                      onChange={(e) => setNewOrgForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Organization"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join-org" className="space-y-4">
              <form onSubmit={handleJoinOrgSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinFirstName">First Name</Label>
                    <Input
                      id="joinFirstName"
                      type="text"
                      value={joinOrgForm.firstName}
                      onChange={(e) => setJoinOrgForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinLastName">Last Name</Label>
                    <Input
                      id="joinLastName"
                      type="text"
                      value={joinOrgForm.lastName}
                      onChange={(e) => setJoinOrgForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinEmail">Email</Label>
                  <Input
                    id="joinEmail"
                    type="email"
                    value={joinOrgForm.email}
                    onChange={(e) => setJoinOrgForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invitationCode">Invitation Code</Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    placeholder="Enter 8-character code"
                    value={joinOrgForm.invitationCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase()
                      setJoinOrgForm((prev) => ({ ...prev, invitationCode: code }))
                      validateInviteCode(code)
                    }}
                    required
                  />
                  {validatingCode && <p className="text-sm text-muted-foreground">Validating code...</p>}
                  {codeValidation && (
                    <Alert variant={codeValidation.valid ? "default" : "destructive"}>
                      {codeValidation.valid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>
                        {codeValidation.valid ? "Valid invitation code!" : codeValidation.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="joinPassword"
                      type={showPassword ? "text" : "password"}
                      value={joinOrgForm.password}
                      onChange={(e) => setJoinOrgForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinConfirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="joinConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={joinOrgForm.confirmPassword}
                      onChange={(e) => setJoinOrgForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading || !codeValidation?.valid}>
                  {loading ? "Joining Organization..." : "Join Organization"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
