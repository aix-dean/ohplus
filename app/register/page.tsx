"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, User, Building, Lock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getRoleById, type RoleType } from "@/lib/hardcoded-access-service"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, loading } = useAuth()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    email: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    phone_number: "",
    gender: "",
  })

  const [companyInfo, setCompanyInfo] = useState({
    company_name: "",
    company_location: "",
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [orgCode, setOrgCode] = useState("")

  // Invitation code data
  const [invitationData, setInvitationData] = useState<{
    company_name?: string
    role_id?: RoleType
    role_name?: string
  } | null>(null)

  // Get org code from URL params
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setOrgCode(code)
      checkInvitationCode(code)
    }
  }, [searchParams])

  const checkInvitationCode = async (code: string) => {
    if (!code) return

    try {
      const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", code))
      const invitationSnapshot = await getDocs(invitationQuery)

      if (!invitationSnapshot.empty) {
        const data = invitationSnapshot.docs[0].data()
        const role = data.role_id ? getRoleById(data.role_id) : null

        setInvitationData({
          company_name: data.company_name,
          role_id: data.role_id,
          role_name: role?.name,
        })
      }
    } catch (error) {
      console.error("Error checking invitation code:", error)
    }
  }

  const validateStep1 = () => {
    const { email, first_name, last_name, phone_number, gender } = personalInfo
    return email && first_name && last_name && phone_number && gender
  }

  const validateStep2 = () => {
    if (invitationData) return true // Skip company info if using invitation
    const { company_name, company_location } = companyInfo
    return company_name && company_location
  }

  const validateStep3 = () => {
    return password && confirmPassword && password === confirmPassword && password.length >= 6
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep3()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check your password entries.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await register(personalInfo, companyInfo, password, orgCode || undefined)

      toast({
        title: "Registration Successful",
        description: "Welcome! Your account has been created successfully.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Registration error:", error)

      let errorMessage = "Registration failed. Please try again."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address."
      }

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (roleId: RoleType) => {
    const colorClasses = {
      admin: "bg-purple-100 text-purple-800",
      sales: "bg-green-100 text-green-800",
      logistics: "bg-blue-100 text-blue-800",
      cms: "bg-orange-100 text-orange-800",
    }

    return <Badge className={colorClasses[roleId]}>{invitationData?.role_name}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {invitationData ? (
              <div className="space-y-2">
                <div>{"You're joining"}</div>
                <div className="font-semibold text-foreground">{invitationData.company_name}</div>
                {invitationData.role_id && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">as</span>
                    {getRoleBadge(invitationData.role_id)}
                  </div>
                )}
              </div>
            ) : (
              "Join thousands of businesses using our platform"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Personal Information
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={personalInfo.first_name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={personalInfo.last_name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                  <Input
                    id="middle_name"
                    value={personalInfo.middle_name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, middle_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={personalInfo.phone_number}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone_number: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={personalInfo.gender}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, gender: value })}
                  >
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

                <Button type="button" onClick={handleNext} disabled={!validateStep1()} className="w-full">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Company Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building className="h-4 w-4" />
                  {invitationData ? "Confirm Details" : "Company Information"}
                </div>

                {invitationData ? (
                  <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Invitation Details</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <div>
                        <strong>Company:</strong> {invitationData.company_name}
                      </div>
                      {invitationData.role_id && (
                        <div className="flex items-center gap-2 mt-2">
                          <strong>Role:</strong>
                          {getRoleBadge(invitationData.role_id)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={companyInfo.company_name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_location">Company Location</Label>
                      <Input
                        id="company_location"
                        value={companyInfo.company_location}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, company_location: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} disabled={!validateStep2()} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Create Password
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
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

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" disabled={!validateStep3() || isSubmitting} className="flex-1">
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
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
