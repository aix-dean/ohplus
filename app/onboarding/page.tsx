"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, userData, updateUserData, updateProjectData } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState(userData?.first_name || "")
  const [lastName, setLastName] = useState(userData?.last_name || "")
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone_number || "")
  const [gender, setGender] = useState(userData?.gender || "")

  // Step 2: Company Info
  const [companyName, setCompanyName] = useState(userData?.company_name || "")
  const [companyLocation, setCompanyLocation] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")

  // Step 3: Preferences
  const [industry, setIndustry] = useState("")
  const [goals, setGoals] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (userData) {
      // Pre-fill if data exists
      setFirstName(userData.first_name || "")
      setLastName(userData.last_name || "")
      setPhoneNumber(userData.phone_number || "")
      setGender(userData.gender || "")
      setCompanyName(userData.company_name || "") // Assuming company_name is part of userData
      // For companyLocation, companyWebsite, industry, goals, they might not be in initial userData
      // and would be collected during onboarding.
    }
  }, [user, userData, router])

  const totalSteps = 3

  const handleNext = async () => {
    setLoading(true)
    try {
      if (currentStep === 1) {
        await updateUserData({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          gender,
        })
        toast({ title: "Personal info saved!" })
      } else if (currentStep === 2) {
        await updateProjectData({
          company_name: companyName,
          company_location: companyLocation,
          company_website: companyWebsite,
        })
        toast({ title: "Company info saved!" })
      }
      setCurrentStep((prev) => prev + 1)
      setProgress(((currentStep + 1) / totalSteps) * 100)
    } catch (error: any) {
      console.error("Onboarding save error:", error)
      toast({
        title: "Error saving data",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
    setProgress(((currentStep - 1) / totalSteps) * 100)
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await updateUserData({
        industry,
        goals,
        onboarding_complete: true, // Mark onboarding as complete
      })
      toast({ title: "Onboarding complete!", description: "Redirecting to dashboard..." })
      router.push("/sales/dashboard") // Redirect to dashboard after onboarding
    } catch (error: any) {
      console.error("Onboarding finish error:", error)
      toast({
        title: "Error saving preferences",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLocation">Company Location</Label>
              <Input
                id="companyLocation"
                value={companyLocation}
                onChange={(e) => setCompanyLocation(e.target.value)}
                placeholder="New York, NY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://www.acmecorp.com"
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry">Your Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Advertising, Retail, Tech"
              />
            </div>
            <div className="space-y-2">
              <Label>What are your primary goals with OH Plus?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Manage sales pipeline",
                  "Track logistics & operations",
                  "Streamline content publishing",
                  "Improve team collaboration",
                  "Monitor site performance",
                  "Generate reports & analytics",
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={goals.includes(goal)}
                      onCheckedChange={(checked) => {
                        setGoals((prev) => (checked ? [...prev, goal] : prev.filter((item) => item !== goal)))
                      }}
                    />
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/ohplus-new-logo.png" alt="OH Plus Logo" width={100} height={100} />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to OH Plus!</CardTitle>
          <CardDescription>
            Let's set up your account. Step {currentStep} of {totalSteps}
          </CardDescription>
          <Progress value={progress} className="w-full mt-4 h-2" />
        </CardHeader>
        <CardContent>
          {renderStep()}
          <div className="mt-6 flex justify-between">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  loading || (currentStep === 1 && (!firstName || !lastName)) || (currentStep === 2 && !companyName)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    Finish <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
