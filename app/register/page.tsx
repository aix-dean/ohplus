"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [orgDialogOpen, setOrgDialogOpen] = useState(false)
  const [joiningOrg, setJoiningOrg] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your information to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
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

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>

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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOrgDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={joiningOrg || !orgCode.trim()} className="flex-1">
                        {joiningOrg ? "Joining..." : "Join Organization"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
