"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AccountPage() {
  const {
    user,
    userData,
    projectData,
    subscriptionData,
    loading,
    updateUserData,
    updateProjectData,
    refreshUserData,
    refreshSubscriptionData,
  } = useAuth()

  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    phone_number: "",
    gender: "",
  })
  const [companyInfo, setCompanyInfo] = useState({
    company_name: "",
    company_location: "",
    company_website: "",
    project_name: "",
    social_media: {
      facebook: "",
      instagram: "",
      youtube: "",
    },
  })
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false)
  const [isSavingCompanyInfo, setIsSavingCompanyInfo] = useState(false)

  useEffect(() => {
    if (userData) {
      setPersonalInfo({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        middle_name: userData.middle_name || "",
        phone_number: userData.phone_number || "",
        gender: userData.gender || "",
      })
    }
    if (projectData) {
      setCompanyInfo({
        company_name: projectData.company_name || "",
        company_location: projectData.company_location || "",
        company_website: projectData.company_website || "",
        project_name: projectData.project_name || "",
        social_media: {
          facebook: projectData.social_media?.facebook || "",
          instagram: projectData.social_media?.instagram || "",
          youtube: projectData.social_media?.youtube || "",
        },
      })
    }
  }, [userData, projectData])

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPersonalInfo((prev) => ({ ...prev, [id]: value }))
  }

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    if (id.startsWith("social_media.")) {
      const socialKey = id.split(".")[1] as keyof typeof companyInfo.social_media
      setCompanyInfo((prev) => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [socialKey]: value,
        },
      }))
    } else {
      setCompanyInfo((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleSavePersonalInfo = async () => {
    setIsSavingPersonalInfo(true)
    try {
      await updateUserData(personalInfo)
      toast({
        title: "Success",
        description: "Personal information updated successfully.",
      })
      await refreshUserData() // Refresh data after update
    } catch (error) {
      console.error("Error updating personal info:", error)
      toast({
        title: "Error",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPersonalInfo(false)
    }
  }

  const handleSaveCompanyInfo = async () => {
    setIsSavingCompanyInfo(true)
    try {
      await updateProjectData(companyInfo)
      toast({
        title: "Success",
        description: "Company information updated successfully.",
      })
      await refreshUserData() // Refresh data after update
    } catch (error) {
      console.error("Error updating company info:", error)
      toast({
        title: "Error",
        description: "Failed to update company information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingCompanyInfo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your account and company details.</p>
      </div>

      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
          <TabsTrigger value="subscription-plan">Subscription Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" value={personalInfo.first_name} onChange={handlePersonalInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" value={personalInfo.last_name} onChange={handlePersonalInfoChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" value={personalInfo.middle_name} onChange={handlePersonalInfoChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" value={personalInfo.phone_number} onChange={handlePersonalInfoChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input id="gender" value={personalInfo.gender} onChange={handlePersonalInfoChange} />
              </div>
              <Button onClick={handleSavePersonalInfo} disabled={isSavingPersonalInfo}>
                {isSavingPersonalInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company and project details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={companyInfo.company_name} onChange={handleCompanyInfoChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_location">Company Location</Label>
                <Input id="company_location" value={companyInfo.company_location} onChange={handleCompanyInfoChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_website">Company Website</Label>
                <Input id="company_website" value={companyInfo.company_website} onChange={handleCompanyInfoChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name</Label>
                <Input id="project_name" value={companyInfo.project_name} onChange={handleCompanyInfoChange} />
              </div>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_media.facebook">Facebook URL</Label>
                  <Input
                    id="social_media.facebook"
                    value={companyInfo.social_media.facebook}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_media.instagram">Instagram URL</Label>
                  <Input
                    id="social_media.instagram"
                    value={companyInfo.social_media.instagram}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_media.youtube">YouTube URL</Label>
                  <Input
                    id="social_media.youtube"
                    value={companyInfo.social_media.youtube}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
              </div>
              <Button onClick={handleSaveCompanyInfo} disabled={isSavingCompanyInfo}>
                {isSavingCompanyInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription-plan" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Main Subscription Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Current Plan</CardTitle>
                <CardDescription>Details about your active subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Plan:</span>
                      <Badge variant="default" className="text-base px-3 py-1">
                        {subscriptionData.planName}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge
                        variant={subscriptionData.status === "active" ? "default" : "destructive"}
                        className="text-base px-3 py-1"
                      >
                        {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Price:</span>
                      <span>
                        ₱{subscriptionData.price.toLocaleString()} / {subscriptionData.interval}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Next Billing Date:</span>
                      <span>
                        {subscriptionData.currentPeriodEnd
                          ? format(subscriptionData.currentPeriodEnd.toDate(), "PPP")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Max Products:</span>
                      <span>{subscriptionData.maxProducts === -1 ? "Unlimited" : subscriptionData.maxProducts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Max Users:</span>
                      <span>{subscriptionData.maxUsers === -1 ? "Unlimited" : subscriptionData.maxUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">License Key:</span>
                      <span className="font-mono text-sm bg-gray-100 p-1 rounded">
                        {userData?.license_key || "N/A"}
                      </span>
                    </div>
                    <Button className="w-full" onClick={() => refreshSubscriptionData()}>
                      Refresh Subscription
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No active subscription found.</p>
                    <Button
                      className="mt-4"
                      onClick={() => (window.location.href = "/admin/subscriptions/choose-plan")}
                    >
                      Choose a Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
