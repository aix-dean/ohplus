"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getRoleById, type RoleType } from "@/lib/hardcoded-access-service"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("+63 ")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationRole, setInvitationRole] = useState<RoleType | null>(null)

  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get organization code from URL parameters
  const orgCode = searchParams.get("orgCode")

  // Fetch invitation code details to show the role
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (orgCode) {
        try {
          const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
          const invitationSnapshot = await getDocs(invitationQuery)

          if (!invitationSnapshot.empty) {
            const invitationData = invitationSnapshot.docs[0].data()
            if (invitationData.role_id) {
              setInvitationRole(invitationData.role_id as RoleType)
            }
          }
        } catch (error) {
          console.error("Error fetching invitation details:", error)
        }
      }
    }

    fetchInvitationDetails()
  }, [orgCode])

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

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Always ensure it starts with +63
    if (!value.startsWith("+63 ")) {
      setPhoneNumber("+63 ")
      return
    }

    // Extract only the numbers after +63
    const numbersOnly = value.slice(4).replace(/\D/g, "")

    // Limit to 10 digits
    if (numbersOnly.length <= 10) {
      setPhoneNumber("+63 " + numbersOnly)
    }
  }

  const isPhoneNumberValid = () => {
    const numbersOnly = phoneNumber.slice(4).replace(/\D/g, "")
    return numbersOnly.length === 10
  }

  // Add these state variables and helper functions for password strength
  const passwordCriteria = {
    minLength: password.length >= 8,
    hasLowerCase: /[a-z]/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
  }

  const passwordStrengthScore = Object.values(passwordCriteria).filter(Boolean).length

  const getBarColorClass = (score: number) => {
    if (score === 0) return "bg-gray-300"
    if (score <= 2) return "bg-red-500"
    if (score <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password"
    if (score <= 2) return "Weak"
    if (score <= 4) return "Moderate"
    return "Strong"
  }

  const handleRegister = async () => {
    setErrorMessage(null)

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (!isPhoneNumberValid()) {
      setErrorMessage("Phone number must be exactly 10 digits after +63.")
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
        orgCode || undefined, // Pass the organization code if available
      )
      setErrorMessage(null)
      const redirectUrl = orgCode
        ? "/admin/dashboard?registered=true&joined_org=true"
        : "/admin/dashboard?registered=true"
      router.push(redirectUrl)
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const roleData = invitationRole ? getRoleById(invitationRole) : null

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Image */}
      <div className="relative hidden w-full items-center justify-center bg-gray-900 sm:flex lg:w-[40%]">
        <Image
          src="/registration-background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-50"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-4 dark:bg-gray-950 sm:p-6 lg:w-[60%] lg:p-8">
        <Card className="w-full max-w-md border-none shadow-none sm:max-w-lg">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                {orgCode ? "Join Organization" : "Create an Account"}
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {orgCode ? "Complete your registration to join the organization!" : "It's free to create one!"}
            </CardDescription>
            {orgCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                <p className="text-sm text-blue-800">
                  <strong>Organization Code:</strong> {orgCode}
                </p>
                {roleData && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-blue-800">
                      <strong>Assigned Role:</strong>
                    </span>
                    <Badge
                      style={{ backgroundColor: `var(--${roleData.color}-100)`, color: `var(--${roleData.color}-800)` }}
                    >
                      {roleData.name}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  placeholder="+63 9XXXXXXXXX"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className={!isPhoneNumberValid() && phoneNumber.length > 4 ? "border-red-500" : ""}
                  required
                />
                {!isPhoneNumberValid() && phoneNumber.length > 4 && (
                  <p className="text-xs text-red-500">Phone number must be exactly 10 digits after +63</p>
                )}
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
                <div className="relative">
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
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${
                          i < passwordStrengthScore ? getBarColorClass(passwordStrengthScore) : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getStrengthText(passwordStrengthScore)}
                  </p>
                  {passwordStrengthScore < 5 && password.length > 0 && (
                    <ul className="list-inside text-sm mt-1">
                      {!passwordCriteria.minLength && (
                        <li className="text-red-500">Password should be at least 8 characters long</li>
                      )}
                      {!passwordCriteria.hasLowerCase && (
                        <li className="text-red-500">Password should contain at least one lowercase letter</li>
                      )}
                      {!passwordCriteria.hasUpperCase && (
                        <li className="text-red-500">Password should contain at least one uppercase letter</li>
                      )}
                      {!passwordCriteria.hasNumber && (
                        <li className="text-red-500">Password should contain at least one number</li>
                      )}
                      {!passwordCriteria.hasSpecialChar && (
                        <li className="text-red-500">Password should contain at least one special character</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
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
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
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
                {loading ? (orgCode ? "Joining..." : "Signing Up...") : orgCode ? "Join Organization" : "Sign Up"}
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
    </div>
  )
}
