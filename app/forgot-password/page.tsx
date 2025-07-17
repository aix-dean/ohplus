"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { resetPassword } = useAuth()
  const router = useRouter()

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validate email format
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
      console.log("Password reset email sent successfully")
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to send password reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Left Section: Logo and Company Name */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gray-50 w-1/2">
            <Image src="/ohplus-new-logo.png" alt="OH! Plus Logo" width={200} height={200} priority />
            <span className="mt-4 text-2xl font-bold text-gray-800">OH Plus</span>
          </div>

          {/* Right Section: Success Message */}
          <div className="w-full md:w-1/2 p-8">
            <Card className="border-none shadow-none">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Check Your Email</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  We've sent a password reset link to your email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    We sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Click the link in the email to reset your password. If you don't see the email, check your spam
                    folder.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setEmail("")
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>

                  <Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-700">
                    Back to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Section: Logo and Company Name */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gray-50 w-1/2">
          <Image src="/ohplus-new-logo.png" alt="OH! Plus Logo" width={200} height={200} priority />
          <span className="mt-4 text-2xl font-bold text-gray-800">OH Plus</span>
        </div>

        {/* Right Section: Reset Password Form */}
        <div className="w-full md:w-1/2 p-8">
          <Card className="border-none shadow-none">
            <CardHeader>
              <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
              <CardTitle className="text-3xl font-bold text-gray-900">Reset Password</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
