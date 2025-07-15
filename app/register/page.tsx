"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationRole, setInvitationRole] = useState<string | null>(null)
  const [invitationLoading, setInvitationLoading] = useState(false)

  const orgCode = searchParams.get("orgCode")

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    phone_number: "",
    gender: "",
    company_name: "",
    company_location: "",
    password: "",
    confirmPassword: "",
  })

  // Fetch invitation details when orgCode is present
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!orgCode) return

      console.log("Fetching invitation details for code:", orgCode)
      setInvitationLoading(true)

      try {
        const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
        const invitationSnapshot = await getDocs(invitationQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()
          console.log("Invitation data found:", invitationData)

          if (invitationData.role) {
            setInvitationRole(invitationData.role)
            console.log("Role found in invitation:", invitationData.role)
          } else {
            console.log("No role found in invitation data")
          }
        } else {
          console.log("No invitation found for code:", orgCode)
          toast.error("Invalid invitation code")
        }
      } catch (error) {
        console.error("Error fetching invitation details:", error)
        toast.error("Error validating invitation code")
      } finally {
        setInvitationLoading(false)
      }
    }

    fetchInvitationDetails()
  }, [orgCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Starting registration process...")

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      console.log("Calling register function with orgCode:", orgCode)

      await register(
        {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          phone_number: formData.phone_number,
          gender: formData.gender,
        },
        {
          company_name: formData.company_name,
          company_location: formData.company_location,
        },
        formData.password,
        orgCode || undefined,
      )

      console.log("Registration completed successfully")
      toast.success("Registration successful!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
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

        {/* Show invitation info */}
        {orgCode && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Joining with invitation code</p>
                  <p className="text-sm text-blue-700">Code: {orgCode}</p>
                  {invitationLoading ? (
                    <p className="text-sm text-blue-700 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Loading invitation details...
                    </p>
                  ) : invitationRole ? (
                    <p className="text-sm text-blue-700">
                      <strong>Role:</strong> {invitationRole}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-700">Role: Default user role</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Enter your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  name="middle_name"
                  type="text"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  placeholder="Smith (optional)"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={handleSelectChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!orgCode && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                  </div>

                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      required={!orgCode}
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_location">Company Location</Label>
                    <Input
                      id="company_location"
                      name="company_location"
                      type="text"
                      required={!orgCode}
                      value={formData.company_location}
                      onChange={handleInputChange}
                      placeholder="New York, NY"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pr-10"
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
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="pr-10"
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
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {orgCode ? "Joining..." : "Creating Account..."}
                  </>
                ) : orgCode ? (
                  "Join Organization"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
