"use client"

import type React from "react"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useState } from "react"

import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { subscriptionService } from "@/lib/subscription-service"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserProductsCount } from "@/lib/user-products-service" // Import the getUserProductsCount function

export default function AccountPage() {
  const { user, userData, projectData, subscriptionData, loading, updateUserData, updateProjectData, logout } =
    useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [currentProductsCount, setCurrentProductsCount] = useState<number | null>(null)

  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [gender, setGender] = useState("")
  const [photoURL, setPhotoURL] = useState("")

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
      // toast({
      //   title: "Logout Failed",
      //   description: error.message || "Failed to log out. Please try again.",
      //   variant: "destructive",
      // })
    }
  }

  useEffect(() => {
    if (loading) return

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
    }

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

  useEffect(() => {
    const fetchProductCount = async () => {
      if (user && subscriptionData?.licenseKey) {
        try {
          const count = await getUserProductsCount(user.uid)
          setCurrentProductsCount(count)
        } catch (error) {
          console.error("Failed to fetch product count:", error)
          setCurrentProductsCount(0)
          // toast({
          //   title: "Error",
          //   description: "Failed to load product count.",
          //   variant: "destructive",
          // })
        }
      }
    }
    fetchProductCount()
  }, [user, subscriptionData])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await updateUserData({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        display_name: displayName,
        phone_number: phoneNumber,
        gender,
        photo_url: photoURL,
      })

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

      // toast({
      //   title: "Success",
      //   description: "Account information updated successfully!",
      // })
      setIsEditing(false)
    } catch (error: any) {
      console.error("Update error:", error)
      // toast({
      //   title: "Update Failed",
      //   description: error.message || "Failed to update account information.",
      //   variant: "destructive",
      // })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoClick = () => {
    // fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // const file = e.target.files?.[0]
    // if (!file || !user) return
    // setIsUploading(true)
    // try {
    //   const storageRef = ref(storage, `profile_photos/${user.uid}/${Date.now()}_${file.name}`)
    //   const snapshot = await uploadBytes(storageRef, file)
    //   const downloadURL = await getDownloadURL(snapshot.ref)
    //   setPhotoURL(downloadURL)
    //   await updateUserData({ photo_url: downloadURL })
    //   toast({
    //     title: "Success",
    //     description: "Profile photo updated successfully!",
    //   })
    // } catch (error: any) {
    //   console.error("Photo upload error:", error)
    //   toast({
    //     title: "Upload Failed",
    //     description: error.message || "Failed to upload photo.",
    //     variant: "destructive",
    //   })
    // } finally {
    //   setIsUploading(false)
    //   fileInputRef.current?.value = ""
    // }
  }

  if (loading) {
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

  const daysRemaining = subscriptionData ? subscriptionService.getDaysRemaining(subscriptionData) : 0

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-16 flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:p-8">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="relative group flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 p-1 shadow-md">
                {/* {isUploading ? (
                  <Loader2 size={36} className="animate-spin text-primary" />
                ) : photoURL ? (
                  <img
                    src={photoURL || "/placeholder.svg"}
                    alt={userData?.display_name || "Profile"}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User size={36} className="text-gray-400" />
                )} */}
              </div>
              {/* <button
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
              /> */}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Hello, {userData?.first_name || "User"}!
              </h1>
              <p className="mt-0.5 text-base text-gray-600">Manage your account and company details.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 bg-transparent"
              onClick={handleLogout}
            >
              {/* <LogOut className="h-4 w-4" /> */}
              Logout
            </button>
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {isEditing ? (
                <>
                  {/* <Save className="h-4 w-4" /> */}
                  {isSaving ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  {/* <Edit2 className="h-4 w-4" /> */}
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {userData.first_name} {userData.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-lg font-semibold text-gray-900">{userData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Phone Number</p>
                <p className="text-lg font-semibold text-gray-900">{userData.phone_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-lg font-semibold text-gray-900">{userData.location || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Details about your registered company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Company Name</p>
                <p className="text-lg font-semibold text-gray-900">{projectData?.company_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Company Location</p>
                <p className="text-lg font-semibold text-gray-900">{projectData?.company_location || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">License Key</p>
                <p className="text-lg font-semibold text-gray-900">{userData.license_key || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Your current plan and its status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Plan Type</p>
              <p className="text-lg font-semibold capitalize text-gray-900">{subscriptionData?.planType || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-lg font-semibold capitalize text-gray-900">{subscriptionData?.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Max Products</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscriptionData?.maxProducts === 99999 ? "Unlimited" : subscriptionData?.maxProducts || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Trial End Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscriptionData?.trialEndDate ? new Date(subscriptionData.trialEndDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Days Remaining (Trial)</p>
              <p className="text-lg font-semibold text-gray-900">
                {daysRemaining > 0 ? `${daysRemaining} days` : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
