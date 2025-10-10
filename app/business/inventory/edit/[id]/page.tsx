"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById, updateProduct } from "@/lib/firebase-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  ChevronDown,
  Upload,
  Trash2,
  ImageIcon,
  Film,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import type { Product } from "@/lib/firebase-service"
// import { SideNavigation } from "@/components/side-navigation"

// Audience types for the dropdown
const AUDIENCE_TYPES = [
  "General Public",
  "Commuters",
  "Pedestrians",
  "Shoppers",
  "Business Professionals",
  "Tourists",
  "Students",
  "Mixed",
]

// Category interface
interface Category {
  id: string
  name: string
  type: string
  position: number
  photo_url?: string
}

// Step definitions
const STEPS = [
  { id: 1, title: "Site Data", description: "Basic product information and type" },
  { id: 2, title: "Dynamic Settings", description: "Configure dynamic content settings" },
  { id: 3, title: "Location Information", description: "Site location and audience details" },
  { id: 4, title: "Media", description: "Upload product media files" },
]

export default function BusinessEditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([])
  const [mediaDistances, setMediaDistances] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<string[]>([])
  const [existingMedia, setExistingMedia] = useState<Product["media"]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  // Selected categories and audience types
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAudienceTypes, setSelectedAudienceTypes] = useState<string[]>([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    content_type: "Static",
    cms: {
      start_time: "",
      end_time: "",
      spot_duration: "",
      loops_per_day: "",
    },
    specs_rental: {
      audience_type: "",
      audience_types: [] as string[],
      geopoint: [0, 0] as [number, number],
      location: "",
      traffic_count: "",
      elevation: "",
      height: "",
      width: "",
    },
    type: "RENTAL",
    status: "PENDING",
  })

  // Fetch product data
  useEffect(() => {
    async function fetchProductData() {
      if (!params.id) return

      const productId = Array.isArray(params.id) ? params.id[0] : params.id

      try {
        setIsLoadingProduct(true)
        const productData = await getProductById(productId)

        if (!productData) {
          setError("Product not found")
          return
        }

        setProduct(productData)

        // Initialize form data with product data
        setProductName(productData.name || "")
        setDescription(productData.description || "")
        setPrice(productData.price ? String(productData.price) : "")

        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price ? String(productData.price) : "",
          content_type: productData.content_type === "Dynamic" ? "digital" : productData.content_type || "Static",
          cms: {
            start_time: productData.cms?.start_time || "",
            end_time: productData.cms?.end_time || "",
            spot_duration: productData.cms?.spot_duration ? String(productData.cms.spot_duration) : "",
            loops_per_day: productData.cms?.loops_per_day ? String(productData.cms.loops_per_day) : "",
          },
          specs_rental: {
            audience_type: productData.specs_rental?.audience_type || "",
            audience_types: productData.specs_rental?.audience_types || [],
            geopoint: productData.specs_rental?.geopoint || [0, 0],
            location: productData.specs_rental?.location || "",
            traffic_count: productData.specs_rental?.traffic_count
              ? String(productData.specs_rental.traffic_count)
              : "",
            elevation: productData.specs_rental?.elevation ? String(productData.specs_rental.elevation) : "",
            height: productData.specs_rental?.height ? String(productData.specs_rental.height) : "",
            width: productData.specs_rental?.width ? String(productData.specs_rental.width) : "",
          },
          type: productData.type || "RENTAL",
          status: productData.status || "PENDING",
        })

        // Set existing media
        if (productData.media && productData.media.length > 0) {
          setExistingMedia(productData.media)
        }

        // Set selected categories
        if (productData.categories && productData.categories.length > 0) {
          setSelectedCategories(productData.categories)
        }

        // Set selected audience types
        if (productData.specs_rental?.audience_types && productData.specs_rental.audience_types.length > 0) {
          setSelectedAudienceTypes(productData.specs_rental.audience_types)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product data")
      } finally {
        setIsLoadingProduct(false)
      }
    }

    fetchProductData()
  }, [params.id])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const categoriesRef = collection(db, "categories")
        const q = query(categoriesRef, where("active", "==", true), where("deleted", "==", false))

        const querySnapshot = await getDocs(q)
        const categoriesData: Category[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          categoriesData.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            position: data.position || 0,
            photo_url: data.photo_url,
          })
        })

        // Sort categories by position
        categoriesData.sort((a, b) => a.position - b.position)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.content_type === "digital") {
      validateDynamicContent()
    }
  }, [
    formData.cms.start_time,
    formData.cms.end_time,
    formData.cms.spot_duration,
    formData.cms.loops_per_day,
    formData.content_type,
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const safeValue = value || ""

    // Update individual state variables
    if (name === "productName") {
      setProductName(safeValue)
    } else if (name === "description") {
      setDescription(safeValue)
    } else if (name === "price") {
      setPrice(safeValue)
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: safeValue,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: safeValue,
      }))
    }
  }

  const handleLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specs_rental: {
        ...prev.specs_rental,
        location: value,
      },
    }))
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const toggleAudienceType = (audienceType: string) => {
    setSelectedAudienceTypes((prev) => {
      if (prev.includes(audienceType)) {
        return prev.filter((type) => type !== audienceType)
      } else {
        return [...prev, audienceType]
      }
    })

    setFormData((prev) => ({
      ...prev,
      specs_rental: {
        ...prev.specs_rental,
        audience_types: !selectedAudienceTypes.includes(audienceType)
          ? [...prev.specs_rental.audience_types, audienceType]
          : prev.specs_rental.audience_types.filter((type) => type !== audienceType),
      },
    }))
  }

  const handleGeopointChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = Number.parseFloat(e.target.value) || 0
    const newGeopoint = [...formData.specs_rental.geopoint]
    newGeopoint[index] = value

    setFormData((prev) => ({
      ...prev,
      specs_rental: {
        ...prev.specs_rental,
        geopoint: newGeopoint as [number, number],
      },
    }))
  }

  const handleContentTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      content_type: value,
    }))
    // Clear validation error when content type changes
    setValidationError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      // Create preview URLs for the new files
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))

      // Automatically detect file types (image or video)
      const newTypes = newFiles.map((file) => (file.type.startsWith("video/") ? "Video" : "Photo"))

      // Add new files and previews
      setMediaFiles((prev) => [...prev, ...newFiles])
      setMediaPreviewUrls((prev) => [...prev, ...newPreviewUrls])
      setMediaTypes((prev) => [...prev, ...newTypes])

      // Initialize distances for new files
      setMediaDistances((prev) => [...prev, ...newFiles.map(() => "")])
    }
  }

  const handleMediaDistanceChange = (index: number, value: string) => {
    const newDistances = [...mediaDistances]
    newDistances[index] = value
    setMediaDistances(newDistances)
  }

  const handleRemoveMedia = (index: number) => {
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(mediaPreviewUrls[index])

    // Remove the file and its associated data
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviewUrls((prev) => prev.filter((_, i) => i !== index))
    setMediaDistances((prev) => prev.filter((_, i) => i !== index))
    setMediaTypes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingMedia = (index: number) => {
    setExistingMedia((prev) => (prev ? prev.filter((_, i) => i !== index) : []))
  }

  const uploadMediaFiles = async () => {
    if (mediaFiles.length === 0) {
      return [] // Return empty array if no media files
    }

    const storage = getStorage()
    const mediaData = []

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      const isVideo = file.type.startsWith("video/")

      try {
        // Create a unique filename to avoid conflicts
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split(".").pop()
        const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`

        // Create a reference to the file in Firebase Storage
        const fileRef = ref(storage, `products/${uniqueFileName}`)

        console.log(`Uploading file ${i + 1}/${mediaFiles.length}:`, file.name)

        // Upload the file
        const snapshot = await uploadBytes(fileRef, file)
        console.log(`File ${i + 1} uploaded successfully`)

        // Get the download URL
        const url = await getDownloadURL(snapshot.ref)
        console.log(`Download URL obtained for file ${i + 1}:`, url)

        // Add the media data
        mediaData.push({
          url,
          distance: mediaDistances[i] || "Not specified",
          type: mediaTypes[i],
          isVideo,
        })
      } catch (error) {
        console.error(`Error uploading file ${i + 1}:`, error)
        throw new Error(`Failed to upload media file "${file.name}". Please try again.`)
      }
    }

    console.log("All media files uploaded successfully:", mediaData)
    return mediaData
  }

  const getCategoryNames = () => {
    return selectedCategories
      .map((id) => {
        const category = categories.find((cat) => cat.id === id)
        return category ? category.name : ""
      })
      .filter(Boolean)
  }

  // Enhanced validation function for dynamic content with detailed calculations
  const validateDynamicContent = () => {
    if (formData.content_type !== "digital") {
      setValidationError(null)
      return true
    }

    const { start_time, end_time, spot_duration, loops_per_day } = formData.cms

    if (!start_time || !end_time || !spot_duration || !loops_per_day) {
      setValidationError("All dynamic content fields are required.")
      return false
    }

    try {
      // Parse start and end times
      const [startHour, startMinute] = start_time.split(":").map(Number)
      const [endHour, endMinute] = end_time.split(":").map(Number)

      // Validate time format
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        setValidationError("Invalid time format.")
        return false
      }

      // Convert to total minutes
      const startTotalMinutes = startHour * 60 + startMinute
      let endTotalMinutes = endHour * 60 + endMinute

      // Handle next day scenario (e.g., 22:00 to 06:00)
      if (endTotalMinutes <= startTotalMinutes) {
        endTotalMinutes += 24 * 60 // Add 24 hours
      }

      // Calculate duration in minutes, then convert to seconds
      const durationMinutes = endTotalMinutes - startTotalMinutes
      const durationSeconds = durationMinutes * 60

      // Parse numeric values
      const spotDurationNum = Number.parseInt(spot_duration)
      const spotsPerLoopNum = Number.parseInt(loops_per_day)

      if (isNaN(spotDurationNum) || isNaN(spotsPerLoopNum) || spotDurationNum <= 0 || spotsPerLoopNum <= 0) {
        setValidationError("Spot duration and spots per loop must be positive numbers.")
        return false
      }

      // Calculate total spot time needed per loop
      const totalSpotTimePerLoop = spotDurationNum * spotsPerLoopNum

      // Calculate how many complete loops can fit in the time duration
      const loopsResult = durationSeconds / totalSpotTimePerLoop

      // Check if the division results in a whole number (integer)
      if (!Number.isInteger(loopsResult)) {
        // Calculate suggested values for correction
        const floorResult = Math.floor(loopsResult)
        const ceilResult = Math.ceil(loopsResult)

        // Calculate suggested spot durations for current spots per loop
        const suggestedSpotDurationFloor = Math.floor(durationSeconds / spotsPerLoopNum / floorResult)
        const suggestedSpotDurationCeil = Math.floor(durationSeconds / spotsPerLoopNum / ceilResult)

        // Calculate suggested spots per loop for current spot duration
        const suggestedSpotsPerLoopFloor = Math.floor(durationSeconds / spotDurationNum / floorResult)
        const suggestedSpotsPerLoopCeil = Math.floor(durationSeconds / spotDurationNum / ceilResult)

        // Format duration for display
        const durationHours = Math.floor(durationMinutes / 60)
        const remainingMinutes = durationMinutes % 60
        const durationDisplay = durationHours > 0 ? `${durationHours}h ${remainingMinutes}m` : `${remainingMinutes}m`

        setValidationError(
          `Invalid Input: The current configuration results in ${loopsResult.toFixed(2)} loops, which is not a whole number. ` +
            `\n\nTime Duration: ${durationDisplay} (${durationSeconds} seconds)` +
            `\nCurrent Configuration: ${spotDurationNum}s × ${spotsPerLoopNum} spots = ${totalSpotTimePerLoop}s per loop` +
            `\nResult: ${durationSeconds}s ÷ ${totalSpotTimePerLoop}s = ${loopsResult.toFixed(2)} loops` +
            `\n\nSuggested corrections:` +
            `\n• Option 1: Change spot duration to ${suggestedSpotDurationFloor}s (for ${floorResult} complete loops)` +
            `\n• Option 2: Change spot duration to ${suggestedSpotDurationCeil}s (for ${ceilResult} complete loops)` +
            `\n• Option 3: Change spots per loop to ${suggestedSpotsPerLoopFloor} (for ${floorResult} complete loops)` +
            `\n• Option 4: Change spots per loop to ${suggestedSpotsPerLoopCeil} (for ${ceilResult} complete loops)`,
        )
        return false
      }

      // Success case - show calculation details
      const durationHours = Math.floor(durationMinutes / 60)
      const remainingMinutes = durationMinutes % 60
      const durationDisplay = durationHours > 0 ? `${durationHours}h ${remainingMinutes}m` : `${remainingMinutes}m`

      setValidationError(
        `✓ Valid Configuration: ${Math.floor(loopsResult)} complete loops will fit in the ${durationDisplay} time period. ` +
          `Each loop uses ${totalSpotTimePerLoop}s (${spotDurationNum}s × ${spotsPerLoopNum} spots).`,
      )
      return true
    } catch (error) {
      console.error("Validation error:", error)
      setValidationError("Invalid time format or values.")
      return false
    }
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Site Data
        if (!productName.trim()) {
          toast({
            title: "Validation Error",
            description: "Product name is required.",
            variant: "destructive",
          })
          return false
        }
        if (!price || Number.parseFloat(price) <= 0) {
          toast({
            title: "Validation Error",
            description: "Price must be a positive number.",
            variant: "destructive",
          })
          return false
        }
        return true

      case 2: // Dynamic Settings (only if Dynamic type)
        if (formData.content_type === "digital") {
          return validateDynamicContent()
        }
        return true

      case 3: // Location Information
        if (!formData.specs_rental.location.trim()) {
          toast({
            title: "Validation Error",
            description: "Location is required.",
            variant: "destructive",
          })
          return false
        }
        return true

      case 4: // Media
        if (existingMedia.length === 0 && mediaFiles.length === 0) {
          toast({
            title: "Validation Error",
            description: "At least one media file is required.",
            variant: "destructive",
          })
          return false
        }
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      // Skip Dynamic Settings step if content type is Static
      if (currentStep === 1 && formData.content_type === "Static") {
        setCurrentStep(3) // Skip to Location Information
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    // Skip Dynamic Settings step if content type is Static when going back
    if (currentStep === 3 && formData.content_type === "Static") {
      setCurrentStep(1) // Go back to Site Data
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return
    }

    if (!user || !product) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated or product not found.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Starting product update process...")

      // Upload new media files first
      console.log("Uploading new media files...")
      const newMediaData = await uploadMediaFiles()
      console.log("Media upload completed:", newMediaData)

      // Combine existing and new media
      const combinedMedia = [...(existingMedia || []), ...newMediaData]

      const contentType = formData.content_type === "digital" ? "Dynamic" : formData.content_type

      const productData = {
        name: productName,
        description,
        price: Number.parseFloat(price),
        content_type: contentType,
        media: combinedMedia,
        categories: selectedCategories,
        category_names: getCategoryNames(),
        cms:
          contentType === "Dynamic"
            ? {
                start_time: formData.cms.start_time,
                end_time: formData.cms.end_time,
                spot_duration: Number.parseInt(formData.cms.spot_duration) || 0,
                loops_per_day: Number.parseInt(formData.cms.loops_per_day) || 0,
              }
            : null,
        specs_rental: {
          ...formData.specs_rental,
          audience_types: selectedAudienceTypes,
          traffic_count: formData.specs_rental.traffic_count
            ? Number.parseInt(formData.specs_rental.traffic_count)
            : null,
          elevation: formData.specs_rental.elevation ? Number.parseFloat(formData.specs_rental.elevation) : null,
          height: formData.specs_rental.height ? Number.parseFloat(formData.specs_rental.height) : null,
          width: formData.specs_rental.width ? Number.parseFloat(formData.specs_rental.width) : null,
        },
      }

      console.log("Updating product with data:", productData)
      await updateProduct(product.id, productData)

      toast({
        title: "Product updated",
        description: "Your product has been updated successfully.",
      })

      // Clean up object URLs to prevent memory leaks
      mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url))

      router.push(`/business/inventory/${product.id}`)
    } catch (error) {
      console.error("Error updating product:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update product. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId))
  }

  const removeAudienceType = (audienceType: string) => {
    setSelectedAudienceTypes((prev) => prev.filter((type) => type !== audienceType))

    setFormData((prev) => ({
      ...prev,
      specs_rental: {
        ...prev.specs_rental,
        audience_types: prev.specs_rental.audience_types.filter((type) => type !== audienceType),
      },
    }))
  }

  const getStepTitle = () => {
    const step = STEPS.find((s) => s.id === currentStep)
    return step ? step.title : "Unknown Step"
  }

  const getStepDescription = () => {
    const step = STEPS.find((s) => s.id === currentStep)
    return step ? step.description : ""
  }

  const handleBack = () => {
    router.back()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Site Data
        return (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="productName"
                type="text"
                placeholder="e.g., LED Billboard 10x20"
                value={productName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="A brief description of the product..."
                value={description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={handleInputChange}
                step="0.01"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Content Type</Label>
              <Select value={formData.content_type} onValueChange={handleContentTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Static">Static</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 2: // Dynamic Settings
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Digital Content Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="cms.start_time"
                  type="time"
                  value={formData.cms.start_time || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="cms.end_time"
                  type="time"
                  value={formData.cms.end_time || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot_duration">Spot Duration (seconds)</Label>
                <Input
                  id="spot_duration"
                  name="cms.spot_duration"
                  type="number"
                  value={formData.cms.spot_duration || ""}
                  onChange={handleInputChange}
                  placeholder="Enter duration in seconds"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot_per_loop">Spots Per Loop</Label>
                <Input
                  id="loops_per_day"
                  name="cms.loops_per_day"
                  type="number"
                  value={formData.cms.loops_per_day || ""}
                  onChange={handleInputChange}
                  placeholder="Enter spots per loop"
                  required
                />
              </div>
            </div>

            {/* Validation feedback display */}
            {validationError && (
              <div
                className={`p-4 rounded-lg border ${
                  validationError.startsWith("✓")
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="text-sm font-medium mb-2">
                  {validationError.startsWith("✓") ? "Configuration Valid" : "Configuration Error"}
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono">{validationError}</pre>
              </div>
            )}
          </div>
        )

      case 3: // Location Information
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Location Information</h3>

            <div className="space-y-2">
              <Label htmlFor="specs_rental.location">
                Location <span className="text-red-500">*</span>
              </Label>
              <GooglePlacesAutocomplete
                value={formData.specs_rental.location}
                onChange={handleLocationChange}
                onGeopointChange={(geopoint) => {
                  setFormData((prev) => ({
                    ...prev,
                    specs_rental: {
                      ...prev.specs_rental,
                      geopoint: geopoint || [0, 0],
                    },
                  }))
                }}
                placeholder="Enter site location"
                enableMap={true}
                mapHeight="250px"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience_types">Audience Types (Multiple)</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                  onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
                  disabled={loading}
                >
                  <span>
                    {selectedAudienceTypes.length > 0
                      ? `${selectedAudienceTypes.length} audience types selected`
                      : "Select audience types"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showAudienceDropdown ? "rotate-180" : "rotate-0"}`}
                  />
                </Button>
                {showAudienceDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {AUDIENCE_TYPES.map((type) => (
                      <div
                        key={type}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleAudienceType(type)}
                      >
                        <div className="flex-1">{type}</div>
                        {selectedAudienceTypes.includes(type) ? <Check className="h-4 w-4 text-green-500" /> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAudienceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAudienceTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="flex items-center gap-1 pr-1">
                      {type}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeAudienceType(type)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specs_rental.traffic_count">Traffic Count (Daily)</Label>
                <Input
                  id="specs_rental.traffic_count"
                  name="specs_rental.traffic_count"
                  type="number"
                  value={formData.specs_rental.traffic_count || ""}
                  onChange={handleInputChange}
                  placeholder="Enter average daily traffic count"
                  min="0"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specs_rental.elevation">Elevation (ft)</Label>
                <Input
                  id="specs_rental.elevation"
                  name="specs_rental.elevation"
                  type="number"
                  value={formData.specs_rental.elevation || ""}
                  onChange={handleInputChange}
                  placeholder="Enter elevation from ground level in feet"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specs_rental.height">Height (ft)</Label>
                <Input
                  id="specs_rental.height"
                  name="specs_rental.height"
                  type="number"
                  value={formData.specs_rental.height || ""}
                  onChange={handleInputChange}
                  placeholder="Enter height in feet"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specs_rental.width">Width (ft)</Label>
                <Input
                  id="specs_rental.width"
                  name="specs_rental.width"
                  type="number"
                  value={formData.specs_rental.width || ""}
                  onChange={handleInputChange}
                  placeholder="Enter width in feet"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  value={formData.specs_rental.geopoint[0]}
                  onChange={(e) => handleGeopointChange(e, 0)}
                  placeholder="Enter latitude"
                  step="0.000001"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  value={formData.specs_rental.geopoint[1]}
                  onChange={(e) => handleGeopointChange(e, 1)}
                  placeholder="Enter longitude"
                  step="0.000001"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )

      case 4: // Media
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Media <span className="text-red-500">*</span>
            </h3>

            {/* Existing Media */}
            {existingMedia && existingMedia.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-700">Existing Media</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingMedia.map((item, index) => (
                    <Card key={index} className="relative group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                          {item.isVideo ? (
                            <video src={item.url} controls className="w-full h-full object-contain" />
                          ) : (
                            <img
                              src={item.url || "/placeholder.svg"}
                              alt={`Existing Media ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            {item.isVideo ? (
                              <Film className="h-4 w-4 mr-2 text-blue-500" />
                            ) : (
                              <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
                            )}
                            <span>
                              {item.isVideo ? "Video" : "Image"} {index + 1}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">Distance: {item.distance || "Not specified"}</div>
                        </div>
                      </CardContent>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExistingMedia(index)}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 text-red-500 hover:bg-white hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Remove existing media"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`border-2 border-dashed ${
                existingMedia.length === 0 && mediaFiles.length === 0
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 bg-gray-50"
              } rounded-lg p-8 text-center transition-colors duration-200`}
            >
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
                required={existingMedia.length === 0 && mediaFiles.length === 0}
                disabled={loading}
              />
              <label htmlFor="media-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <Upload
                  className={`h-12 w-12 ${existingMedia.length === 0 && mediaFiles.length === 0 ? "text-red-500" : "text-gray-500"} mb-3`}
                />
                <p className="text-base font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Images or videos (max 10MB each)</p>
                {existingMedia.length === 0 && mediaFiles.length === 0 && (
                  <p className="text-sm text-red-600 mt-3 font-medium">At least one media file is required</p>
                )}
              </label>
            </div>

            {mediaPreviewUrls.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-700">New Media</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaPreviewUrls.map((url, index) => {
                    const isVideo = mediaTypes[index] === "Video"
                    return (
                      <Card key={index} className="relative group overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                            {isVideo ? (
                              <video src={url} controls className="w-full h-full object-contain" />
                            ) : (
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                              {isVideo ? (
                                <Film className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
                              )}
                              <span>
                                {isVideo ? "Video" : "Image"} {index + 1}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`media-distance-${index}`} className="text-xs text-gray-600">
                                Viewing Distance
                              </Label>
                              <Input
                                id={`media-distance-${index}`}
                                value={mediaDistances[index]}
                                onChange={(e) => handleMediaDistanceChange(index, e.target.value)}
                                placeholder="e.g., 100m"
                                className="h-9 text-sm"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </CardContent>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMedia(index)}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 text-red-500 hover:bg-white hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Remove media"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getMaxStep = () => {
    return formData.content_type === "Static" ? 4 : 4 // Always 4 steps, but step 2 is skipped for Static
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-6">Please log in to edit a product.</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  if (isLoadingProduct) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-semibold">Edit Product</h1>
          <p className="text-muted-foreground">Loading product data...</p>
        </div>

        <div className="mx-auto w-full max-w-6xl flex justify-center">
          <div className="grid gap-6 w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Product Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
          <h1 className="text-3xl font-semibold">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're trying to edit could not be found.</p>
        </div>

        <div className="mx-auto w-full max-w-6xl flex justify-center">
          <div className="grid gap-6 w-full max-w-2xl">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 mb-6">The product you're trying to edit could not be found.</p>
                <Button onClick={() => router.push("/business/inventory")}>Return to Inventory</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
        <h1 className="text-3xl font-semibold">Edit Product: {product.name}</h1>
        <p className="text-muted-foreground">Update the details of your product.</p>
      </div>

      {/* Step Indicator */}
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          {STEPS.filter((step) => (formData.content_type === "Static" ? step.id !== 2 : true)).map(
            (step, index, filteredSteps) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : currentStep > step.id || (formData.content_type === "Static" && step.id === 2)
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-white border-gray-300 text-gray-500"
                  }`}
                >
                  {currentStep > step.id || (formData.content_type === "Static" && step.id === 2) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">
                      {formData.content_type === "Static" && step.id > 2 ? step.id - 1 : step.id}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index < filteredSteps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-0.5 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex justify-center">
        <div className="grid gap-6 w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === getMaxStep() ? (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
