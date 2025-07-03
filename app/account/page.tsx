"use client"

import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Camera,
  Edit2,
  Save,
  Loader2,
  LogOut,
  Key,
  Award,
  Package,
  Users,
  Star,
  Calendar,
  CreditCard,
  Info,
  Copy,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getUserProductsCount } from "@/lib/firebase-service" // Corrected import path
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { subscriptionService } from "@/lib/subscription-service"
import { updateUserData } from "@/lib/firebase-service"
import { format } from "date-fns"

// Helper function to mask the license key
const maskLicenseKey = (key: string | undefined | null) => {
  if (!key) return "N/A"
  if (key.length <= 8) return "*".repeat(key.length) // Mask entirely if too short
  const firstFour = key.substring(0, 4)
  const lastFour = key.substring(key.length - 4)
  const maskedPart = "*".repeat(key.length - 8)
  return `${firstFour}${maskedPart}${lastFour}`
}

export default function AccountPage() {
  const { user, userData, projectData, subscriptionData, loading: authLoading, refreshUserData } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [firstName, setFirstName] = useState(userData?.first_name || "")
  const [middleName, setMiddleName] = useState(userData?.middle_name || "")
  const [lastName, setLastName] = useState(userData?.last_name || "")
  const [displayName, setDisplayName] = useState(userData?.display_name || "")
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone_number || "")
  const [gender, setGender] = useState(userData?.gender || "")
  const [photoURL, setPhotoURL] = useState(userData?.photo_url || "")

  const [companyName, setCompanyName] = useState(userData?.company_name || "")
  const [companyLocation, setCompanyLocation] = useState(userData?.company_location || "")
  const [companyWebsite, setCompanyWebsite] = useState(userData?.company_website || "")
  const [projectName, setProjectName] = useState(projectData?.project_name || "")
  const [facebook, setFacebook] = useState(projectData?.social_media?.facebook || "")
  const [instagram, setInstagram] = useState(projectData?.social_media?.instagram || "")
  const [youtube, setYoutube] = useState(projectData?.social_media?.youtube || "")

  const [currentProductsCount, setCurrentProductsCount] = useState<number | null>(null)
  const [productsCount, setProductsCount] = useState<number | null>(null)
  const [productsLoading, setProductsLoading] = useState(true)

  const router = useRouter()

  const handleLogout = async () => {
    try {
      await router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (userData) {
      setFirstName(userData.first_name || "")
      setMiddleName(userData.middle_name || "")
      setLastName(userData.last_name || "")
      setDisplayName(userData.display_name || "")
      setPhoneNumber(userData.phone_number || "")
      setGender(userData.gender || "")
      setPhotoURL(userData.photo_url || "")
      setCompanyName(userData.company_name || "")
      setCompanyLocation(userData.company_location || "")
    }

    if (projectData) {
      setCompanyWebsite(projectData.company_website || "")
      setProjectName(projectData.project_name || "")
    }
  }, [user, userData, projectData, authLoading, router])

  useEffect(() => {
    const fetchProductCount = async () => {
      if (user && subscriptionData?.licenseKey) {
        try {
          const count = await getUserProductsCount(user.uid)
          setCurrentProductsCount(count)
        } catch (error) {
          console.error("Failed to fetch product count:", error)
          setCurrentProductsCount(0)
          toast({
            title: "Error",
            description: "Failed to load product count.",
            variant: "destructive",
          })
        }
      }
    }
    fetchProductCount()
  }, [user, subscriptionData, toast])

  useEffect(() => {
    const fetchProductsCount = async () => {
      if (user?.uid) {
        setProductsLoading(true)
        try {
          const count = await getUserProductsCount(user.uid)
          setProductsCount(count)
        } catch (error) {
          console.error("Error fetching user products count:", error)
          setProductsCount(0) // Default to 0 on error
        } finally {
          setProductsLoading(false)
        }
      }
    }

    if (user) {
      fetchProductsCount()
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await updateUserData(user.uid, {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        phone_number: phoneNumber,
        company_name: companyName,
        company_location: companyLocation,
      })
      await refreshUserData() // Refresh context data
      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      })
      setIsEditing(false)
    } catch (error: any) {
      console.error("Update error:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update account information.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)

    try {
      const storageRef = ref(storage, `profile_photos/${user.uid}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      setPhotoURL(downloadURL)
      await updateUserData(user.uid, { photo_url: downloadURL })
      toast({
        title: "Success",
        description: "Profile photo updated successfully!",
      })
    } catch (error: any) {
      console.error("Photo upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account Not Found</CardTitle>
            <CardDescription>Please log in to view your account details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const maxProducts = subscriptionData?.maxProducts
  const isLimitReached = maxProducts !== null && currentProductsCount !== null && currentProductsCount >= maxProducts
  const isTrial = subscriptionData?.status === "trialing"
  const daysRemaining = subscriptionData ? subscriptionService.getDaysRemaining(subscriptionData) : 0

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-16 flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:p-8">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="relative group flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 p-1 shadow-md">
                {isUploading ? (
                  <Loader2 size={36} className="animate-spin text-primary" />
                ) : photoURL ? (
                  <img
                    src={photoURL || "/placeholder.svg"}
                    alt={userData?.display_name || "Profile"}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User size={36} className="text-gray-400" />
                )}
              </div>
              <button
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary p-1.5 text-white shadow-md transition-colors duration-200 hover:bg-primary/90"
                onClick={handlePhotoClick}
                disabled={isUploading}
                aria-label="Change profile photo"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isUploading}
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Hello, {userData?.first_name || "User"}!
              </h1>
              <p className="mt-0.5 text-base text-gray-600">Manage your account and company details.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <Tabs defaultValue="profile" className="grid grid-cols-1 gap-x-5 md:grid-cols-[240px_1fr]">
          {/* Sidebar/Tab Navigation */}
          <TabsList className="flex flex-col items-start space-y-1 rounded-xl bg-white shadow-sm">
            <TabsTrigger
              value="profile"
              className="w-full justify-start rounded-lg px-5 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <User className="mr-2 h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger
              value="subscription-plan"
              className="w-full justify-start rounded-lg px-5 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Subscription Plan
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="w-full justify-start rounded-lg px-5 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Key className="mr-2 h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="w-full justify-start rounded-lg px-5 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Info className="mr-2 h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="space-y-6">
            <TabsContent value="profile" className="mt-0 space-y-6 pt-0">
              {/* Personal Details Card */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <User className="h-5 w-5 text-primary" />
                    Personal Details
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Manage your personal information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm shadow-sm",
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm shadow-sm",
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="middleName" className="text-xs font-medium text-gray-700">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm shadow-sm",
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="displayName" className="text-xs font-medium text-gray-700">
                        Display Name
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm shadow-sm",
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phoneNumber" className="text-xs font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm shadow-sm",
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="gender" className="text-xs font-medium text-gray-700">
                        Gender
                      </Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          `flex h-9 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm`,
                          isEditing
                            ? "border-primary/40 focus:border-primary"
                            : "border-gray-200 bg-gray-50 text-gray-700",
                        )}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={userData?.email || ""}
                        disabled
                        className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 shadow-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Statistics Card */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Award className="h-5 w-5 text-primary" />
                    Account Statistics
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Overview of your account activity and metrics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Package className="mb-1.5 h-5 w-5 text-blue-600" />
                      <p className="text-xs text-gray-600">Products</p>
                      <p className="mt-0.5 text-xl font-bold text-gray-900">{userData?.products || 0}</p>
                    </div>

                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Users className="mb-1.5 h-5 w-5 text-green-600" />
                      <p className="text-xs text-gray-600">Followers</p>
                      <p className="mt-0.5 text-xl font-bold text-gray-900">{userData?.followers || 0}</p>
                    </div>

                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Star className="mb-1.5 h-5 w-5 text-yellow-600" />
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="mt-0.5 text-xl font-bold text-gray-900">{userData?.rating || 0}</p>
                    </div>

                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Calendar className="mb-1.5 h-5 w-5 text-purple-600" />
                      <p className="text-xs text-gray-600">Member Since</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {userData?.created ? new Date(userData.created).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* License Key Card */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Key className="h-5 w-5 text-primary" />
                    License Key
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Your unique license key connects your account to your projects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <Input
                      value={maskLicenseKey(userData?.license_key)} // Masked value
                      readOnly
                      className="flex-1 rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-mono text-gray-700 shadow-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(userData?.license_key || "") // Copies full key
                        toast({
                          title: "Copied!",
                          description: "License key copied to clipboard.",
                        })
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription-plan" className="mt-0 space-y-6 pt-0">
              {/* Subscription Plan Card */}
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Your Current Plan
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Details about your active subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Plan Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Plan:</span>
                        <span>{userData?.subscription_plan || "Free"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-3 py-1 text-xs font-medium",
                            userData?.subscription_status === "active" &&
                              "border-green-200 bg-green-100 text-green-800",
                            userData?.subscription_status === "trialing" && "border-blue-200 bg-blue-100 text-blue-800",
                            userData?.subscription_status === "expired" && "border-red-200 bg-red-100 text-red-800",
                            userData?.subscription_status === "cancelled" &&
                              "border-gray-200 bg-gray-100 text-gray-800",
                          )}
                        >
                          {userData?.subscription_status?.charAt(0).toUpperCase() +
                            userData?.subscription_status?.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Max Products:</span>
                        <span>{userData?.max_products || 0}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Current Products:</span>
                        <span>{userData?.current_products || 0}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Start Date:</span>
                        <span>
                          {userData?.subscription_start_date
                            ? format(new Date(userData.subscription_start_date), "PPP")
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">End Date:</span>
                        <span>
                          {userData?.subscription_end_date
                            ? format(new Date(userData.subscription_end_date), "PPP")
                            : "N/A"}
                        </span>
                      </div>

                      <Button className="w-full">Manage Subscription</Button>
                    </div>

                    {/* Product Usage */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
                        <Package className="h-4 w-4 text-blue-600" />
                        Product Usage
                      </h3>
                      <div className="flex justify-between text-sm font-medium text-gray-700">
                        <span>{currentProductsCount !== null ? currentProductsCount : "N/A"} products uploaded</span>
                        <span>{maxProducts === null ? "Unlimited" : `${maxProducts} max`}</span>
                      </div>
                      {maxProducts !== null && currentProductsCount !== null && (
                        <Progress
                          value={(currentProductsCount / maxProducts) * 100}
                          className="h-2 rounded-full bg-gray-200 [&>*]:bg-primary"
                        />
                      )}
                      {isLimitReached && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                          <Info className="h-4 w-4" />
                          You have reached your product upload limit. Please upgrade your plan.
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Subscription Dates */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Calendar className="mb-1.5 h-5 w-5 text-blue-600" />
                      <p className="text-xs text-gray-600">Subscription Created</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {subscriptionData?.createdAt
                          ? new Date(subscriptionData.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="flex flex-col items-center rounded-md border border-gray-100 bg-white p-3 text-center shadow-sm">
                      <Calendar className="mb-1.5 h-5 w-5 text-green-600" />
                      <p className="text-xs text-gray-600">Last Updated</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {subscriptionData?.updatedAt
                          ? new Date(subscriptionData.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6 pt-0">
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Key className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Update your password and security preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input id="confirmNewPassword" type="password" />
                    </div>
                    <Button className="w-full">Change Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6 pt-0">
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-b px-5 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Info className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Manage how you receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <Input id="emailNotifications" type="checkbox" className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <Input id="smsNotifications" type="checkbox" className="h-4 w-4" />
                    </div>
                    <Button className="w-full">Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  )
}
