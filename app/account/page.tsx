"use client"

import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import type React from "react"
import { useEffect, useState, useRef } from "react"
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
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { storage, db } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { getUserProductsCount } from "@/lib/firebase-service"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { subscriptionService } from "@/lib/subscription-service"

// Helper function to mask the license key
const maskLicenseKey = (key: string | undefined | null) => {
  if (!key) return "N/A"
  if (key.length <= 8) return "*".repeat(key.length) // Mask entirely if too short
  const firstFour = key.substring(0, 4)
  const lastFour = key.substring(key.length - 4)
  const maskedPart = "*".repeat(key.length - 8)
  return `${firstFour}${maskedPart}${lastFour}`
}

// Helper function to format location
const formatLocation = (location: any): string => {
  if (!location) return ""

  if (typeof location === "string") {
    return location
  }

  if (typeof location === "object") {
    const parts = []
    if (location.street) parts.push(location.street)
    if (location.city) parts.push(location.city)
    if (location.province) parts.push(location.province)
    return parts.join(", ")
  }

  return ""
}

interface CompanyData {
  id: string
  name?: string
  company_location?: any // Can be string or object
  address?: any // Can be string or object
  company_website?: string
  website?: string
  photo_url?: string
  contact_person?: string
  email?: string
  phone?: string
  social_media?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  created_by?: string
  created?: Date
  updated?: Date
}

export default function AccountPage() {
  const { user, userData, projectData, subscriptionData, loading, updateUserData, updateProjectData, logout } =
    useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [currentProductsCount, setCurrentProductsCount] = useState<number | null>(null)
  const [productsCount, setProductsCount] = useState<number | null>(null)
  const [productsLoading, setProductsLoading] = useState(true)

  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [gender, setGender] = useState("")
  const [photoURL, setPhotoURL] = useState("")

  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [companyLoading, setCompanyLoading] = useState(true)
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [projectName, setProjectName] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [youtube, setYoutube] = useState("")

  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
  const [companyLogoPreviewUrl, setCompanyLogoPreviewUrl] = useState<string | null>(null)
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false)
  const companyLogoInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const fetchCompanyData = async () => {
    if (!user?.uid) return

    setCompanyLoading(true)
    try {
      let companyDoc = null
      let companyData = null

      // First, try to find company by company_id if it exists in userData
      if (userData?.company_id) {
        try {
          const companyDocRef = doc(db, "companies", userData.company_id)
          const companyDocSnap = await getDoc(companyDocRef)

          if (companyDocSnap.exists()) {
            companyDoc = companyDocSnap
            companyData = companyDocSnap.data()
          }
        } catch (error) {
          console.error("Error fetching company by company_id:", error)
        }
      }

      // If no company found by company_id, try other methods
      if (!companyDoc) {
        // Try to find company by created_by field
        let companiesQuery = query(collection(db, "companies"), where("created_by", "==", user.uid))
        let companiesSnapshot = await getDocs(companiesQuery)

        // If no company found by created_by, try to find by email or other identifiers
        if (companiesSnapshot.empty && user.email) {
          companiesQuery = query(collection(db, "companies"), where("email", "==", user.email))
          companiesSnapshot = await getDocs(companiesQuery)
        }

        // If still no company found, try to find by contact_person email
        if (companiesSnapshot.empty && user.email) {
          companiesQuery = query(collection(db, "companies"), where("contact_person", "==", user.email))
          companiesSnapshot = await getDocs(companiesQuery)
        }

        if (!companiesSnapshot.empty) {
          companyDoc = companiesSnapshot.docs[0]
          companyData = companyDoc.data()
        }
      }

      if (companyDoc && companyData) {
        const company: CompanyData = {
          id: companyDoc.id,
          name: companyData.name,
          company_location: companyData.company_location || companyData.address,
          company_website: companyData.company_website || companyData.website,
          photo_url: companyData.photo_url,
          contact_person: companyData.contact_person,
          email: companyData.email,
          phone: companyData.phone,
          social_media: companyData.social_media || {},
          created_by: companyData.created_by,
          created: companyData.created?.toDate ? companyData.created.toDate() : companyData.created_at?.toDate(),
          updated: companyData.updated?.toDate ? companyData.updated.toDate() : companyData.updated_at?.toDate(),
        }

        setCompanyData(company)
        setCompanyName(company.name || "")
        setCompanyLocation(formatLocation(company.company_location))
        setCompanyWebsite(company.company_website || "")
        setFacebook(company.social_media?.facebook || "")
        setInstagram(company.social_media?.instagram || "")
        setYoutube(company.social_media?.youtube || "")
        setCompanyLogoPreviewUrl(company.photo_url || null)
      } else {
        setCompanyData(null)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      toast({
        title: "Error",
        description: "Failed to load company information.",
        variant: "destructive",
      })
    } finally {
      setCompanyLoading(false)
    }
  }

  const updateCompanyData = async (updates: Partial<CompanyData>) => {
    if (!companyData?.id) {
      toast({
        title: "Error",
        description: "No company found to update.",
        variant: "destructive",
      })
      return
    }

    try {
      const companyDocRef = doc(db, "companies", companyData.id)
      const updatedFields = { ...updates, updated: serverTimestamp() }
      await updateDoc(companyDocRef, updatedFields)

      setCompanyData((prev) => (prev ? { ...prev, ...updates } : null))

      toast({
        title: "Success",
        description: "Company information updated successfully!",
      })
    } catch (error: any) {
      console.error("Error updating company data:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company information.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
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
      setProjectName(projectData.project_name || "")
    }

    // Fetch company data
    fetchCompanyData()
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

      // Update project data if it exists
      if (projectData) {
        await updateProjectData({
          project_name: projectName,
        })
      }

      // Update company data if it exists
      if (companyData) {
        await updateCompanyData({
          name: companyName,
          company_location: companyLocation,
          company_website: companyWebsite,
          social_media: {
            facebook,
            instagram,
            youtube,
          },
        })
      }

      setIsEditingPersonal(false)
    } catch (error: any) {
      console.error("Update error:", error)
      // Error handling is done in individual update functions
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
      await updateUserData({ photo_url: downloadURL })
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

  const handleCompanyLogoClick = () => {
    if (companyLogoInputRef.current) {
      companyLogoInputRef.current.click()
    }
  }

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !companyData) return

    setIsUploadingCompanyLogo(true)

    try {
      const storageRef = ref(storage, `company_logos/${user.uid}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update the company data with the new logo URL
      await updateCompanyData({ photo_url: downloadURL })

      setCompanyLogoPreviewUrl(downloadURL)
    } catch (error: any) {
      console.error("Company logo upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload company logo.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingCompanyLogo(false)
      if (companyLogoInputRef.current) {
        companyLogoInputRef.current.value = ""
      }
    }
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

  const maxProducts = subscriptionData?.maxProducts
  const isLimitReached = maxProducts !== null && currentProductsCount !== null && currentProductsCount >= maxProducts
  const isTrial = subscriptionData?.status === "trialing"
  const daysRemaining = subscriptionData ? subscriptionService.getDaysRemaining(subscriptionData) : 0

  return (
    <main className="min-h-screen bg-[#FFFFF]] py-8 px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-500">
                Hello, {userData?.first_name || "User"}!
              </h1>
              <p className="mt-0.5 text-base text-gray-500">Manage your account and company details.</p>
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
              onClick={() => (isEditingPersonal ? handleSave() : setIsEditingPersonal(true))}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {isEditingPersonal ? (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Personal"}
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit Personal
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm shadow-sm",
                        isEditingPersonal
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm shadow-sm",
                        isEditingPersonal
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm shadow-sm",
                        isEditingPersonal
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm shadow-sm",
                        isEditingPersonal
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm shadow-sm",
                        isEditingPersonal
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
                      disabled={!isEditingPersonal}
                      className={cn(
                        `flex h-9 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm`,
                        isEditingPersonal
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
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <div className="space-y-6">
            {/* Company Profile Card */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="border-b px-5 py-3">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Building className="h-5 w-5 text-primary" />
                  Company Profile
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Manage your company details and information.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {companyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="mb-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                      <div className="relative group flex-shrink-0">
                        <div
                          className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 shadow-sm cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
                          onClick={handleCompanyLogoClick}
                        >
                          {isUploadingCompanyLogo ? (
                            <Loader2 size={40} className="animate-spin text-primary" />
                          ) : companyLogoPreviewUrl || companyData?.photo_url ? (
                            <img
                              src={companyLogoPreviewUrl || companyData?.photo_url || "/placeholder.svg"}
                              alt="Company Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building size={40} className="text-gray-400" />
                          )}
                        </div>
                        <button
                          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary p-1.5 text-white shadow-md transition-colors duration-200 hover:bg-primary/90"
                          onClick={handleCompanyLogoClick}
                          disabled={isUploadingCompanyLogo || true}
                          aria-label="Change company logo"
                        >
                          <Camera size={16} />
                        </button>
                        <input
                          type="file"
                          ref={companyLogoInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleCompanyLogoChange}
                          disabled={isUploadingCompanyLogo || true}
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-xl font-bold text-gray-900">{companyData?.name || "Your Company"}</h2>
                        <p className="mt-0.5 text-base text-gray-600">
                          {projectData?.project_name || "Default Project"}
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-700 sm:justify-start">
                          {companyData?.company_location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-gray-500" />
                              <span>{formatLocation(companyData.company_location)}</span>
                            </div>
                          )}
                          {companyData?.company_website && (
                            <div className="flex items-center gap-1.5">
                              <Globe size={14} className="text-gray-500" />
                              <a
                                href={companyData.company_website}
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

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="companyName" className="text-xs font-medium text-gray-700">
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={true}
                          placeholder="Your Company Name"
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm shadow-sm",
                            false
                              ? "border-primary/40 focus:border-primary"
                              : "border-gray-200 bg-gray-50 text-gray-700",
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="companyLocation" className="text-xs font-medium text-gray-700">
                          Company Address
                        </Label>
                        <Input
                          id="companyLocation"
                          value={companyLocation}
                          onChange={(e) => setCompanyLocation(e.target.value)}
                          disabled={true}
                          placeholder="123 Main St, City, Country"
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm shadow-sm",
                            false
                              ? "border-primary/40 focus:border-primary"
                              : "border-gray-200 bg-gray-50 text-gray-700",
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="companyWebsite" className="text-xs font-medium text-gray-700">
                          Company Website
                        </Label>
                        <Input
                          id="companyWebsite"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          disabled={true}
                          placeholder="https://www.example.com"
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm shadow-sm",
                            false
                              ? "border-primary/40 focus:border-primary"
                              : "border-gray-200 bg-gray-50 text-gray-700",
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Social Media Card */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="border-b px-5 py-3">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Globe className="h-5 w-5 text-primary" />
                  Social Media
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Connect your company's social media accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                      <Facebook className="h-4 w-4 text-gray-600" />
                    </div>
                    <Input
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      disabled={true}
                      placeholder="Facebook URL"
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm shadow-sm",
                        false
                          ? "border-primary/40 focus:border-primary"
                          : "border-gray-200 bg-gray-50 text-gray-700",
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                      <Instagram className="h-4 w-4 text-gray-600" />
                    </div>
                    <Input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={true}
                      placeholder="Instagram URL"
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm shadow-sm",
                        false
                          ? "border-primary/40 focus:border-primary"
                          : "border-gray-200 bg-gray-50 text-gray-700",
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                      <Youtube className="h-4 w-4 text-gray-600" />
                    </div>
                    <Input
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      disabled={true}
                      placeholder="YouTube URL"
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm shadow-sm",
                        false
                          ? "border-primary/40 focus:border-primary"
                          : "border-gray-200 bg-gray-50 text-gray-700",
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
