"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Maximize2, ArrowLeft } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    try {
      console.log("Attempting to send password reset email to:", email)

      // Send password reset email without actionCodeSettings to avoid domain whitelist issues
      await sendPasswordResetEmail(auth, email)

      console.log("Password reset email sent successfully")
      setSuccess(`Password reset email sent to ${email}. Please check your inbox and spam folder.`)
      setEmail("")
    } catch (error: any) {
      console.error("Password reset error:", error)

      // More specific error handling
      let errorMessage = "Failed to send password reset email."

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address."
          break
        case "auth/invalid-email":
          errorMessage = "Invalid email address format."
          break
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later."
          break
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection."
          break
        case "auth/configuration-not-found":
          errorMessage = "Email configuration not found. Please contact support."
          break
        default:
          errorMessage = error.message || "Failed to send password reset email."
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded">
              <Maximize2 size={24} />
            </div>
            <span className="text-xl font-semibold">OOH Operator</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login" className="flex items-center text-sm text-primary hover:underline">
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
