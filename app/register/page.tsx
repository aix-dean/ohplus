"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FirebaseError } from "firebase/app"
import { Separator } from "@/components/ui/separator"
import { ChromeIcon, FacebookIcon } from "lucide-react" // Using Lucide React for icons

export default function RegisterPage() {
  const [step, setStep] = useState(1) // 1 for personal info, 2 for password
  const [userName, setUserName] = useState("") // Combines first and last name for UI
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { register } = useAuth()
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

  const handleNext = () => {
    setErrorMessage(null)
    if (!userName || !phoneNumber || !email) {
      setErrorMessage("Please fill in all required fields.")
      return
    }
    setStep(2)
  }

  const handleRegister = async () => {
    setErrorMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      // For "User Name", we'll use it as first_name and leave last_name empty
      // middle_name, gender, company_name, company_location are not in the new UI,
      // so we pass empty strings to maintain the register function signature.
      await register(
        {
          email,
          first_name: userName, // Using userName for first_name
          last_name: "", // Not collected in new UI
          middle_name: "", // Not collected in new UI
          phone_number: phoneNumber,
          gender: "", // Not collected in new UI
        },
        {
          company_name: "", // Not collected in new UI
          company_location: "", // Not collected in new UI
        },
        password,
      )
      setErrorMessage(null)
      router.push("/admin/dashboard")
    } catch (error: unknown) {
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Image and Logo */}
      <div className="relative hidden w-1/2 items-center justify-center bg-gray-900 lg:flex">
        <Image
          src="/roadside-billboard.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-50"
        />
        <div className="relative z-10">
          <Image src="/oh-plus-logo.png" alt="OH! Plus Logo" width={200} height={200} />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-gray-950 lg:w-1/2">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                {step === 1 ? "Create an Account" : "Set up your password"}
              </CardTitle>
              <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">{step}/2</span>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {step === 1 ? "It's free to create one!" : "Make sure you'll remember it!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">User Name</Label>
                  <Input
                    id="userName"
                    placeholder="John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
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
                <Separator className="my-6" />
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground dark:bg-gray-950">or</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => alert("Google Sign-up not implemented")}
                >
                  <ChromeIcon className="mr-2 h-4 w-4" /> Sign up with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => alert("Facebook Sign-up not implemented")}
                >
                  <FacebookIcon className="mr-2 h-4 w-4" /> Sign up with Facebook
                </Button>
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNext}>
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
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
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </div>
            )}

            {errorMessage && (
              <div className="text-red-500 text-sm mt-4 text-center" role="alert">
                {errorMessage}
              </div>
            )}
          </CardContent>
          <div className="absolute bottom-8 right-8 hidden lg:block">
            <Image src="/oh-plus-logo.png" alt="OH! Plus Logo" width={80} height={80} />
          </div>
        </Card>
      </div>
    </div>
  )
}
