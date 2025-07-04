"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog"

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) {
      return
    }

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setPendingVerification(true)
    } catch (err: any) {
      console.error("Error:", err.errors ? err.errors[0].longMessage : err.message)
      // You might want to display an error message to the user here
    }
  }

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) {
      return
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        setShowSuccessDialog(true) // Show success dialog on successful registration
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
      }
    } catch (err: any) {
      console.error("Error:", err.errors ? err.errors[0].longMessage : err.message)
      // You might want to display an error message to the user here
    }
  }

  const handleStartTour = () => {
    setShowSuccessDialog(false) // Close the dialog
    localStorage.setItem("onboardingTourTriggeredByRegistration", "true") // Set the flag
    router.push("/admin/dashboard") // Navigate to the dashboard
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Register</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingVerification && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>
          )}
          {pendingVerification && (
            <form onSubmit={onPressVerify} className="space-y-4">
              <div>
                <Label htmlFor="code">Email Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Verify Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <RegistrationSuccessDialog
        isOpen={showSuccessDialog}
        firstName={firstName}
        onClose={() => setShowSuccessDialog(false)}
        onStartTour={handleStartTour} // Pass the new handler
      />
    </div>
  )
}
