"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Camera,
  Building,
  MapPin,
  Globe,
  Edit2,
  Save,
  Loader2,
  LogOut,
  Mail,
  Key,
  Award,
  Package,
  Users,
  Star,
  Calendar,
  MapPinned,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function AccountPage() {
  const { user, userData, projectData, loading, updateUserData, updateProjectData, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // User form state
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [gender, setGender] = useState("")
  const [photoURL, setPhotoURL] = useState("")

  // Company form state
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [projectName, setProjectName] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [youtube, setYoutube] = useState("")

  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to log out. Please try again.")
    }
  }

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    // Initialize form with user data
    if (userData) {
      setFirstName(userData.first_name || "")
      setMiddleName(userData.middle_name || "")
      setLastName(userData.last_name || "")
      setDisplayName(userData.display_name || "")
      setPhoneNumber(userData.phone_number || "")
      setGender(userData.gender || "")
      setPhotoURL(userData.photo_url || "")
    }

    // Initialize form with project data
    if (projectData) {
      setCompanyName(projectData.company_name || "")
      setCompanyLocation(projectData.company_location || "")
      setCompanyWebsite(projectData.company_website || "")
      setProjectName(projectData.project_name || "")
      setFacebook(projectData.social_media?.facebook || "")
      setInstagram(projectData.social_media?.instagram || "")
      setYoutube(projectData.social_media?.youtube || "")
    }
  }, [user, userData, projectData, loading, router])

  const handleSave = async () => {
    setError("")
    setSuccess("")
    setIsSaving(true)

    try {
      // Update user data
      await updateUserData({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        display_name: displayName,
        phone_number: phoneNumber,
        gender,
        photo_url: photoURL,
      })

      // Update project data
      await updateProjectData({
        company_name: companyName,
        company_location: companyLocation,
        company_website: companyWebsite,
        project_name: projectName,
        social_media: {
          facebook,
          instagram,
          youtube,
        },
      })

      setSuccess("Account information updated successfully")
      setIsEditing(false)
    } catch (error: any) {
      console.error("Update error:", error)
      setError(error.message || "Failed to update account information")
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
    setError("")

    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `profile_photos/${user.uid}/${Date.now()}_${file.name}`)

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update the photoURL state
      setPhotoURL(downloadURL)

      // Update the user data in Firestore
      await updateUserData({ photo_url: downloadURL })

      setSuccess("Profile photo updated successfully")
    } catch (error: any) {
      console.error("Photo upload error:", error)
      setError(error.message || "Failed to upload photo")
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8 px-4 sm:px-6">
      {/* Header with profile overview */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {isUploading ? (
                  <Loader2 size={40} className="text-primary animate-spin" />
                ) : photoURL ? (
                  <img
                    src={photoURL || "/placeholder.svg"}
                    alt={userData?.display_name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
            </div>
            <button
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
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

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{userData?.display_name || "User"}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mt-1">
              <Mail className="h-4 w-4" />
              <span>{userData?.email}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {userData?.type || "User"}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {projectData?.type || "Trial"}
              </Badge>
              {userData?.location && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  <MapPinned className="h-3 w-3 mr-1" />
                  {typeof userData.location === "object" && userData.location._lat && userData.location._long
                    ? `${userData.location._lat.toFixed(2)}, ${userData.location._long.toFixed(2)}`
                    : String(userData.location)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className="flex items-center gap-2"
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
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200 animate-in fade-in">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="personal" className="text-sm sm:text-base">
            Personal Information
          </TabsTrigger>
          <TabsTrigger value="company" className="text-sm sm:text-base">
            Company Information
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* License Key Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                License Key
              </CardTitle>
              <CardDescription>Your unique license key connects your account to your projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Input value={userData?.license_key || ""} readOnly className="font-mono bg-gray-50" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(userData?.license_key || "")
                    setSuccess("License key copied to clipboard")
                  }}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Manage your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-medium">
                    Middle Name
                  </Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={!isEditing}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isEditing ? "border-primary/30 focus:border-primary" : "border-input"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input id="email" value={userData?.email || ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Account Statistics
              </CardTitle>
              <CardDescription>Overview of your account activity and metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-gray-500">Products</p>
                  </div>
                  <p className="text-2xl font-bold">{userData?.products || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-gray-500">Followers</p>
                  </div>
                  <p className="text-2xl font-bold">{userData?.followers || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm text-gray-500">Rating</p>
                  </div>
                  <p className="text-2xl font-bold">{userData?.rating || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <p className="text-sm text-gray-500">Member Since</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {userData?.created ? new Date(userData.created).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          {/* Company Profile Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Profile
              </CardTitle>
              <CardDescription>Manage your company details and information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                  <Building size={40} className="text-gray-400" />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{projectData?.company_name || "Your Company"}</h2>
                  <p className="text-gray-500">{projectData?.project_name || "Default Project"}</p>
                  <div className="mt-2 flex flex-wrap gap-4 justify-center sm:justify-start text-sm text-gray-500">
                    {projectData?.company_location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{projectData.company_location}</span>
                      </div>
                    )}
                    {projectData?.company_website && (
                      <div className="flex items-center gap-1">
                        <Globe size={16} />
                        <a
                          href={projectData.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLocation" className="text-sm font-medium">
                    Company Address
                  </Label>
                  <Input
                    id="companyLocation"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite" className="text-sm font-medium">
                    Company Website
                  </Label>
                  <Input
                    id="companyWebsite"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Social Media
              </CardTitle>
              <CardDescription>Connect your company's social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Facebook URL"
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Instagram className="h-5 w-5 text-pink-600" />
                  </div>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Instagram URL"
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Youtube className="h-5 w-5 text-red-600" />
                  </div>
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    disabled={!isEditing}
                    placeholder="YouTube URL"
                    className={isEditing ? "border-primary/30 focus:border-primary" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Type Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Account Type
              </CardTitle>
              <CardDescription>Your current subscription plan and details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={projectData?.type === "Trial" ? "outline" : "default"}
                        className={
                          projectData?.type === "Trial" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""
                        }
                      >
                        {projectData?.type || "Trial"}
                      </Badge>
                      {projectData?.type !== "Trial" && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {projectData?.type === "Trial"
                        ? "Limited features and functionality"
                        : "Full access to all features"}
                    </p>
                  </div>
                  {projectData?.type === "Trial" && (
                    <Button variant="default" size="sm" onClick={() => router.push("/settings/subscription")}>
                      Upgrade Now
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-gray-500">Created</p>
                  </div>
                  <p className="text-sm font-medium">
                    {projectData?.created ? new Date(projectData.created).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-gray-500">Last Updated</p>
                  </div>
                  <p className="text-sm font-medium">
                    {projectData?.updated ? new Date(projectData.updated).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
