"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function AccountPage() {
  const { user, userData, projectData, updateUserData, updateProjectData, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [personalInfo, setPersonalInfo] = useState({
    first_name: userData?.first_name || "",
    last_name: userData?.last_name || "",
    middle_name: userData?.middle_name || "",
    phone_number: userData?.phone_number || "",
    gender: userData?.gender || "",
  })
  const [companyInfo, setCompanyInfo] = useState({
    company_name: projectData?.company_name || "",
    company_location: projectData?.company_location || "",
    company_website: projectData?.company_website || "",
  })
  const [socialMedia, setSocialMedia] = useState({
    facebook: projectData?.social_media?.facebook || "",
    instagram: projectData?.social_media?.instagram || "",
    youtube: projectData?.social_media?.youtube || "",
  })
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false)
  const [isSavingCompanyInfo, setIsSavingCompanyInfo] = useState(false)
  const [isSavingSocialMedia, setIsSavingSocialMedia] = useState(false)

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.id]: e.target.value })
  }

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyInfo({ ...companyInfo, [e.target.id]: e.target.value })
  }

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialMedia({ ...socialMedia, [e.target.id]: e.target.value })
  }

  const handleSavePersonalInfo = async () => {
    setIsSavingPersonalInfo(true)
    try {
      await updateUserData(personalInfo)
      toast({
        title: "Success!",
        description: "Personal information updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update personal info:", error)
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
        title: "Success!",
        description: "Company information updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update company info:", error)
      toast({
        title: "Error",
        description: "Failed to update company information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingCompanyInfo(false)
    }
  }

  const handleSaveSocialMedia = async () => {
    setIsSavingSocialMedia(true)
    try {
      await updateProjectData({ social_media: socialMedia })
      toast({
        title: "Success!",
        description: "Social media links updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update social media:", error)
      toast({
        title: "Error",
        description: "Failed to update social media links. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSocialMedia(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="personal-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
            <TabsTrigger value="company-info">Company Info</TabsTrigger>
            <TabsTrigger value="subscription-plan">Subscription Plan</TabsTrigger>
          </TabsList>
          <TabsContent value="personal-info" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" value={personalInfo.first_name} onChange={handlePersonalInfoChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input id="middle_name" value={personalInfo.middle_name} onChange={handlePersonalInfoChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" value={personalInfo.last_name} onChange={handlePersonalInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled />
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
          <TabsContent value="company-info" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Manage your company details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input id="company_name" value={companyInfo.company_name} onChange={handleCompanyInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_location">Company Location</Label>
                  <Input
                    id="company_location"
                    value={companyInfo.company_location}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_website">Company Website</Label>
                  <Input id="company_website" value={companyInfo.company_website} onChange={handleCompanyInfoChange} />
                </div>
                <Button onClick={handleSaveCompanyInfo} disabled={isSavingCompanyInfo}>
                  {isSavingCompanyInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Add or update your company's social media profiles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={socialMedia.facebook}
                    onChange={handleSocialMediaChange}
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={socialMedia.instagram}
                    onChange={handleSocialMediaChange}
                    placeholder="https://instagram.com/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={socialMedia.youtube}
                    onChange={handleSocialMediaChange}
                    placeholder="https://youtube.com/yourcompany"
                  />
                </div>
                <Button onClick={handleSaveSocialMedia} disabled={isSavingSocialMedia}>
                  {isSavingSocialMedia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Social Media
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="subscription-plan" className="mt-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Details about your active subscription plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Plan Name:</span>
                    <span>{user?.email ? "Pro Plan" : "Free Tier"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Next Billing Date:</span>
                    <span>July 3, 2025</span>
                  </div>
                  <Button className="w-full">Change Plan</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Product Usage</CardTitle>
                  <CardDescription>Your current usage of features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Billboard Sites:</span>
                    <span>5/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Users:</span>
                    <span>3/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Storage:</span>
                    <span>10GB/50GB</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                  <CardDescription>View your past subscription dates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Started: January 1, 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Last Renewed: June 1, 2025</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
