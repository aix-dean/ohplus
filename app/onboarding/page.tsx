"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const totalSteps = 4 // Total number of onboarding steps

  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
  })

  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
  })

  const [preferences, setPreferences] = useState({
    modules: {
      sales: false,
      logistics: false,
      cms: false,
      admin: false,
      aiAssistant: false,
    },
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
    },
  })

  const [goals, setGoals] = useState("")

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setCompanyInfo((prev) => ({ ...prev, [id]: value }))
  }

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setContactInfo((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string, id: string, section: "company" | "contact") => {
    if (section === "company") {
      setCompanyInfo((prev) => ({ ...prev, [id]: value }))
    } else if (section === "contact") {
      setContactInfo((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleModuleChange = (moduleName: string, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleName]: checked,
      },
    }))
  }

  const handleNotificationChange = (prefName: string, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [prefName]: checked,
      },
    }))
  }

  const handleGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGoals(e.target.value)
  }

  const nextStep = () => {
    // Basic validation before moving to the next step
    if (step === 1 && (!companyInfo.companyName || !companyInfo.industry)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required company information.",
        variant: "destructive",
      })
      return
    }
    if (step === 2 && (!contactInfo.fullName || !contactInfo.email || !contactInfo.role)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required contact information.",
        variant: "destructive",
      })
      return
    }
    setStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    // In a real application, send all collected data to your backend
    console.log("Onboarding complete!", { companyInfo, contactInfo, preferences, goals })
    toast({
      title: "Onboarding Complete!",
      description: "Welcome to Jiven! Your setup is complete.",
    })
    router.push("/dashboard") // Redirect to dashboard after onboarding
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={companyInfo.companyName} onChange={handleCompanyInfoChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={companyInfo.industry} onValueChange={(value) => handleSelectChange(value, "industry", "company")}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OOH Advertising">OOH Advertising</SelectItem>
                  <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                  <SelectItem value="Media Agency">Media Agency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={companyInfo.companySize} onValueChange={(value) => handleSelectChange(value, "companySize", "company")}>
                <SelectTrigger id="companySize">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input id="website" value={companyInfo.website} onChange={handleCompanyInfoChange} />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Your Full Name</Label>
              <Input id="fullName" value={contactInfo.fullName} onChange={handleContactInfoChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" value={contactInfo.email} onChange={handleContactInfoChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" value={contactInfo.phone} onChange={handleContactInfoChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Your Role</Label>
              <Select value={contactInfo.role} onValueChange={(value) => handleSelectChange(value, "role", "contact")}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="grid gap-6">
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold">Select Modules</h3>
              <p className="text-muted-foreground text-sm">Choose the Jiven modules relevant to your business needs.</p>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="sales" checked={preferences.modules.sales} onCheckedChange={(checked) => handleModuleChange("sales", !!checked)} />
                  <label htmlFor="sales" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sales & CRM
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="logistics" checked={preferences.modules.logistics} onCheckedChange={(checked) => handleModuleChange("logistics", !!checked)} />
                  <label htmlFor="logistics" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer\
