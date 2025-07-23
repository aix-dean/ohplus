"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Upload, MapPin, Clock, DollarSign, ArrowLeft, ArrowRight } from "lucide-react"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { useAuth } from "@/contexts/auth-context"
import { createProduct } from "@/lib/firebase-service"
import { uploadToFirebase } from "@/lib/video-upload-service"
import { toast } from "@/hooks/use-toast"

interface MediaFile {
  file: File
  url: string
  type: "image" | "video"
}

interface FormData {
  name: string
  description: string
  content_type: "static" | "dynamic" | ""
  site_orientation: string
  land_owner: string
  structure_color: string
  structure_contractor: string
  structure_condition: string
  structure_last_maintenance: string
  // Dynamic settings
  loop_duration: number
  spots_per_loop: number
  spot_duration: number
  operating_hours: {
    start: string
    end: string
  }
  brightness_schedule: Array<{
    time_range: string
    brightness: number
  }>
  // Location information
  location: string
  geopoint: [number, number] | null
  width: number
  height: number
  audience: {
    age_groups: string[]
    interests: string[]
    demographics: string[]
  }
  traffic_data: {
    daily_impressions: number
    peak_hours: string[]
    vehicle_count: number
  }
  // Pricing
  rental_rates: {
    daily: number
    weekly: number
    monthly: number
  }
  // Media files
  media: MediaFile[]
}

const initialFormData: FormData = {
  name: "",
  description: "",
  content_type: "",
  site_orientation: "",
  land_owner: "",
  structure_color: "",
  structure_contractor: "",
  structure_condition: "",
  structure_last_maintenance: "",
  loop_duration: 300,
  spots_per_loop: 10,
  spot_duration: 30,
  operating_hours: {
    start: "06:00",
    end: "23:00",
  },
  brightness_schedule: [
    { time_range: "06:00-18:00", brightness: 80 },
    { time_range: "18:00-23:00", brightness: 100 },
  ],
  location: "",
  geopoint: null,
  width: 0,
  height: 0,
  audience: {
    age_groups: [],
    interests: [],
    demographics: [],
  },
  traffic_data: {
    daily_impressions: 0,
    peak_hours: [],
    vehicle_count: 0,
  },
  rental_rates: {
    daily: 0,
    weekly: 0,
    monthly: 0,
  },
  media: [],
}

const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
const interests = ["Technology", "Fashion", "Food", "Travel", "Sports", "Entertainment", "Business", "Health"]
const demographics = ["Urban Professionals", "Students", "Families", "Tourists", "Commuters", "Shoppers"]
const peakHours = ["06:00-09:00", "12:00-14:00", "17:00-20:00", "20:00-23:00"]

export default function CreateProductPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const { user } = useAuth()
  const router = useRouter()

  const totalSteps = 4

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof FormData],
        [field]: value,
      },
    }))
  }

  const handleArrayToggle = (parent: string, field: string, value: string) => {
    setFormData((prev) => {
      const currentArray = (prev[parent as keyof FormData] as any)[field] || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item: string) => item !== value)
        : [...currentArray, value]

      return {
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [field]: newArray,
        },
      }
    })
  }

  const handleLocationSelect = (location: string, coordinates: [number, number]) => {
    setFormData((prev) => ({
      ...prev,
      location,
      geopoint: coordinates,
    }))
  }

  const handleFileUpload = async (files: FileList) => {
    const newFiles: MediaFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileType = file.type.startsWith("image/") ? "image" : "video"

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)

      newFiles.push({
        file,
        url: previewUrl,
        type: fileType,
      })
    }

    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, ...newFiles],
    }))
  }

  const removeMediaFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a product.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload media files to Firebase
      const uploadedMedia = []
      for (const mediaItem of formData.media) {
        setUploadingFiles((prev) => [...prev, mediaItem.file.name])

        try {
          const uploadedUrl = await uploadToFirebase(mediaItem.file, `products/${user.uid}`)
          uploadedMedia.push({
            url: uploadedUrl,
            type: mediaItem.type,
            name: mediaItem.file.name,
          })
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError)
          toast({
            title: "Upload Error",
            description: `Failed to upload ${mediaItem.file.name}`,
            variant: "destructive",
          })
        }

        setUploadingFiles((prev) => prev.filter((name) => name !== mediaItem.file.name))
      }

      // Get user data for site_owner - change from object to string
      const userData = user as any
      const siteOwner =
        userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.displayName || userData.email || "Unknown"

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        content_type: formData.content_type,
        site_owner: siteOwner, // Now a string instead of object
        specs_rental: {
          location: formData.location,
          geopoint: formData.geopoint,
          width: formData.width,
          height: formData.height,
          site_orientation: formData.site_orientation,
          land_owner: formData.land_owner,
          structure_color: formData.structure_color,
          structure_contractor: formData.structure_contractor,
          structure_condition: formData.structure_condition,
          structure_last_maintenance: formData.structure_last_maintenance,
          audience: formData.audience,
          traffic_data: formData.traffic_data,
          rental_rates: formData.rental_rates,
        },
        media: uploadedMedia,
        seller_id: user.uid,
        seller_name: user.displayName || user.email,
        created: new Date(),
        status: "active",
      }

      // Add dynamic-specific data if content type is dynamic
      if (formData.content_type === "dynamic") {
        productData.specs_rental = {
          ...productData.specs_rental,
          loop_duration: formData.loop_duration,
          spots_per_loop: formData.spots_per_loop,
          spot_duration: formData.spot_duration,
          operating_hours: formData.operating_hours,
          brightness_schedule: formData.brightness_schedule,
        }
      }

      // Create the product
      await createProduct(productData)

      toast({
        title: "Product Created",
        description: "Your billboard has been successfully listed.",
      })

      router.push("/business/inventory")
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadingFiles([])
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.description && formData.content_type
      case 2:
        return formData.content_type !== "dynamic" || (formData.loop_duration && formData.spots_per_loop)
      case 3:
        return formData.location && formData.width && formData.height
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Billboard</h1>
            <p className="text-gray-600">List your billboard for rental</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-12 h-1 ${i + 1 < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Site Data */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Site Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Billboard Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter billboard name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type *</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => handleInputChange("content_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your billboard location, visibility, and key features"
                rows={4}
              />
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Structure Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_orientation">Site Orientation</Label>
                  <Select
                    value={formData.site_orientation}
                    onValueChange={(value) => handleInputChange("site_orientation", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north">North</SelectItem>
                      <SelectItem value="south">South</SelectItem>
                      <SelectItem value="east">East</SelectItem>
                      <SelectItem value="west">West</SelectItem>
                      <SelectItem value="northeast">Northeast</SelectItem>
                      <SelectItem value="northwest">Northwest</SelectItem>
                      <SelectItem value="southeast">Southeast</SelectItem>
                      <SelectItem value="southwest">Southwest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="land_owner">Land Owner</Label>
                  <Input
                    id="land_owner"
                    value={formData.land_owner}
                    onChange={(e) => handleInputChange("land_owner", e.target.value)}
                    placeholder="Enter land owner name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure_color">Structure Color</Label>
                  <Input
                    id="structure_color"
                    value={formData.structure_color}
                    onChange={(e) => handleInputChange("structure_color", e.target.value)}
                    placeholder="Enter structure color"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure_contractor">Structure Contractor</Label>
                  <Input
                    id="structure_contractor"
                    value={formData.structure_contractor}
                    onChange={(e) => handleInputChange("structure_contractor", e.target.value)}
                    placeholder="Enter contractor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure_condition">Structure Condition</Label>
                  <Select
                    value={formData.structure_condition}
                    onValueChange={(value) => handleInputChange("structure_condition", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure_last_maintenance">Last Maintenance Date</Label>
                  <Input
                    id="structure_last_maintenance"
                    type="date"
                    value={formData.structure_last_maintenance}
                    onChange={(e) => handleInputChange("structure_last_maintenance", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Dynamic Settings (only for dynamic content) */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {formData.content_type === "dynamic" ? "Dynamic Settings" : "Content Configuration"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.content_type === "dynamic" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="loop_duration">Loop Duration (seconds)</Label>
                    <Input
                      id="loop_duration"
                      type="number"
                      value={formData.loop_duration}
                      onChange={(e) => handleInputChange("loop_duration", Number.parseInt(e.target.value) || 0)}
                      placeholder="300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spots_per_loop">Spots per Loop</Label>
                    <Input
                      id="spots_per_loop"
                      type="number"
                      value={formData.spots_per_loop}
                      onChange={(e) => handleInputChange("spots_per_loop", Number.parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spot_duration">Spot Duration (seconds)</Label>
                    <Input
                      id="spot_duration"
                      type="number"
                      value={formData.spot_duration}
                      onChange={(e) => handleInputChange("spot_duration", Number.parseInt(e.target.value) || 0)}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Operating Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.operating_hours.start}
                        onChange={(e) => handleNestedInputChange("operating_hours", "start", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.operating_hours.end}
                        onChange={(e) => handleNestedInputChange("operating_hours", "end", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Brightness Schedule</h4>
                  {formData.brightness_schedule.map((schedule, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Time Range</Label>
                        <Input
                          value={schedule.time_range}
                          onChange={(e) => {
                            const newSchedule = [...formData.brightness_schedule]
                            newSchedule[index].time_range = e.target.value
                            handleInputChange("brightness_schedule", newSchedule)
                          }}
                          placeholder="06:00-18:00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Brightness (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={schedule.brightness}
                          onChange={(e) => {
                            const newSchedule = [...formData.brightness_schedule]
                            newSchedule[index].brightness = Number.parseInt(e.target.value) || 0
                            handleInputChange("brightness_schedule", newSchedule)
                          }}
                          placeholder="80"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Static billboards don't require dynamic configuration.</p>
                <p className="text-sm text-gray-500 mt-2">Click Next to continue with location information.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location Information */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Location *</Label>
              <GooglePlacesAutocomplete onLocationSelect={handleLocationSelect} />
              {formData.location && <p className="text-sm text-gray-600">Selected: {formData.location}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="width">Width (feet) *</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange("width", Number.parseFloat(e.target.value) || 0)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (feet) *</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", Number.parseFloat(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Target Audience</h4>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Age Groups</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ageGroups.map((age) => (
                      <div key={age} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${age}`}
                          checked={formData.audience.age_groups.includes(age)}
                          onCheckedChange={() => handleArrayToggle("audience", "age_groups", age)}
                        />
                        <Label htmlFor={`age-${age}`} className="text-sm">
                          {age}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interest-${interest}`}
                          checked={formData.audience.interests.includes(interest)}
                          onCheckedChange={() => handleArrayToggle("audience", "interests", interest)}
                        />
                        <Label htmlFor={`interest-${interest}`} className="text-sm">
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Demographics</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {demographics.map((demo) => (
                      <div key={demo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`demo-${demo}`}
                          checked={formData.audience.demographics.includes(demo)}
                          onCheckedChange={() => handleArrayToggle("audience", "demographics", demo)}
                        />
                        <Label htmlFor={`demo-${demo}`} className="text-sm">
                          {demo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Traffic Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="daily_impressions">Daily Impressions</Label>
                  <Input
                    id="daily_impressions"
                    type="number"
                    value={formData.traffic_data.daily_impressions}
                    onChange={(e) =>
                      handleNestedInputChange("traffic_data", "daily_impressions", Number.parseInt(e.target.value) || 0)
                    }
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_count">Daily Vehicle Count</Label>
                  <Input
                    id="vehicle_count"
                    type="number"
                    value={formData.traffic_data.vehicle_count}
                    onChange={(e) =>
                      handleNestedInputChange("traffic_data", "vehicle_count", Number.parseInt(e.target.value) || 0)
                    }
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Peak Hours</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {peakHours.map((hour) => (
                    <div key={hour} className="flex items-center space-x-2">
                      <Checkbox
                        id={`peak-${hour}`}
                        checked={formData.traffic_data.peak_hours.includes(hour)}
                        onCheckedChange={() => handleArrayToggle("traffic_data", "peak_hours", hour)}
                      />
                      <Label htmlFor={`peak-${hour}`} className="text-sm">
                        {hour}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rental Rates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="daily_rate">Daily Rate ($)</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    value={formData.rental_rates.daily}
                    onChange={(e) =>
                      handleNestedInputChange("rental_rates", "daily", Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly_rate">Weekly Rate ($)</Label>
                  <Input
                    id="weekly_rate"
                    type="number"
                    value={formData.rental_rates.weekly}
                    onChange={(e) =>
                      handleNestedInputChange("rental_rates", "weekly", Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_rate">Monthly Rate ($)</Label>
                  <Input
                    id="monthly_rate"
                    type="number"
                    value={formData.rental_rates.monthly}
                    onChange={(e) =>
                      handleNestedInputChange("rental_rates", "monthly", Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="2000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Media */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Billboard Media</p>
                <p className="text-gray-600 mb-4">Add photos and videos of your billboard</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="media-upload"
                />
                <Label htmlFor="media-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent">
                    Choose Files
                  </Button>
                </Label>
              </div>

              {formData.media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.media.map((media, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {media.type === "image" ? (
                          <img
                            src={media.url || "/placeholder.svg"}
                            alt="Billboard"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video src={media.url} className="w-full h-full object-cover" controls />
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMediaFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Badge variant="secondary" className="absolute bottom-2 left-2">
                        {media.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading files...</p>
                  {uploadingFiles.map((fileName) => (
                    <div key={fileName} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-600">{fileName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
            {isSubmitting ? "Creating..." : "Create Billboard"}
          </Button>
        )}
      </div>
    </div>
  )
}
