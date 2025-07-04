"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog" // Import the dialog
import { useAuth } from "@/contexts/auth-context" // Assuming useAuth provides registration function
import { useToast } from "@/hooks/use-toast" // Assuming useToast for notifications

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false) // State to control dialog visibility

  const router = useRouter()
  const { register } = useAuth() // Assuming useAuth provides a register function
  const { toast } = useToast()

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields for personal details.",
          variant: "destructive",
        })
        return
      }
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        })
        return
      }
    } else if (step === 2) {
      if (!companyName || !companyAddress || !contactNumber) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields for company details.",
          variant: "destructive",
        })
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate registration API call
      // Replace with actual API call using `register` from useAuth
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay

      // Assuming register function takes these parameters
      // await register({ firstName, lastName, email, password, companyName, companyAddress, contactNumber });

      toast({
        title: "Registration Successful!",
        description: "Your account has been created.",
      })

      setShowSuccessDialog(true) // Show the success dialog
      // Do NOT redirect here. The dialog will handle the next step.
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTourFromDialog = () => {
    setShowSuccessDialog(false) // Close the dialog
    // Redirect to admin dashboard with startTour=true to trigger the tour
    router.push("/admin/dashboard?registered=true&startTour=true")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            {step === 1 && "Enter your personal details to create an account."}
            {step === 2 && "Enter your company details."}
            {step === 3 && "Review your information and complete registration."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      placeholder="Doe"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleNext}>
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Acme Corp"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-address">Company Address</Label>
                  <Input
                    id="company-address"
                    placeholder="123 Main St"
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-number">Contact Number</Label>
                  <Input
                    id="contact-number"
                    type="tel"
                    placeholder="123-456-7890"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" className="w-full" onClick={handleNext}>
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Personal Details</Label>
                  <p className="text-sm text-gray-500">
                    Name: {firstName} {lastName}
                  </p>
                  <p className="text-sm text-gray-500">Email: {email}</p>
                </div>
                <div className="grid gap-2">
                  <Label>Company Details</Label>
                  <p className="text-sm text-gray-500">Company: {companyName}</p>
                  <p className="text-sm text-gray-500">Address: {companyAddress}</p>
                  <p className="text-sm text-gray-500">Contact: {contactNumber}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Complete Registration"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Registration Success Dialog */}
      <RegistrationSuccessDialog
        isOpen={showSuccessDialog}
        firstName={firstName}
        onClose={() => setShowSuccessDialog(false)} // Allow closing without starting tour
        onStartTour={handleStartTourFromDialog} // This will trigger the navigation and tour
      />
    </div>
  )
}
