"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FirebaseError } from "firebase/app"
import { validateAndUseInvitationCode } from "@/lib/invitation-service"
import { Building2, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [invitationCode, setInvitationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [registrationType, setRegistrationType] = useState<"new" | "join">("new")

  const { register, joinOrganization } = useAuth()
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

    if (registrationType === "new" && (!companyName || !companyLocation)) {
      setErrorMessage("Please fill in company information.")
      return
    }

    if (registrationType === "join" && !invitationCode) {
      setErrorMessage("Please enter an invitation code.")
      return
    }

    setLoading(true)
    try {
      if (registrationType === "join") {
        // Validate invitation code first
        const validation = await validateAndUseInvitationCode(invitationCode)
        if (!validation.isValid) {
          setErrorMessage(validation.error || "Invalid invitation code.")
          setLoading(false)
          return
        }

        // Join existing organization
        await joinOrganization(
          {
            email,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            phone_number: phoneNumber,
            gender: "",
          },
          password,
          validation.licenseKey!,
        )
      } else {
        // Create new organization
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
            company_name: companyName,
            company_location: companyLocation,
          },
          password,
        )
      }

      setErrorMessage(null)
      router.push("/admin/dashboard?registered=true")
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
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
              {/* Registration Type Selection */}
              <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as "new" | "join")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    New Organization
                  </TabsTrigger>
                  <TabsTrigger value="join" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Join Organization
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-4 mt-4">
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
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Your Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyLocation">Company Location</Label>
                    <Input
                      id="companyLocation"
                      placeholder="City, Country"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
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
                </TabsContent>

                <TabsContent value="join" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="invitationCode">Invitation Code</Label>
                    <Input
                      id="invitationCode"
                      placeholder="Enter 8-character code"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      className="font-mono text-center text-lg tracking-widest"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Ask your organization admin for an invitation code</p>
                  </div>
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
                </TabsContent>
              </Tabs>

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
                {loading ? "Signing Up..." : registrationType === "new" ? "Create Organization" : "Join Organization"}
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
