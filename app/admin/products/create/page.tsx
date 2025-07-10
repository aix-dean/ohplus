"use client"

import { useEffect } from "react"
import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { createProduct } from "@/lib/firebase-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChevronDown, Upload, Trash2, ImageIcon, Film, X, Check, Loader2 } from "lucide-react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

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

export default function AdminProductCreatePage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([])
  const [mediaDistances, setMediaDistances] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

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
      spots_per_loop: "",
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
    type: "RENTAL", // Default type
    status: "PENDING", // Default status
  })

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
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }))
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

  const uploadMediaFiles = async () => {
    const storage = getStorage()
    const mediaData = []

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      const isVideo = file.type.startsWith("video/")

      try {
        // Create a reference to the file in Firebase Storage
        const fileRef = ref(storage, `products/${Date.now()}_${file.name}`)

        // Upload the file
        await uploadBytes(fileRef, file)

        // Get the download URL
        const url = await getDownloadURL(fileRef)

        // Add the media data
        mediaData.push({
          url,
          distance: mediaDistances[i] || "Not specified",
          type: mediaTypes[i],
          isVideo,
        })
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error)
        throw new Error(`Failed to upload media file ${i + 1}`)
      }
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const mediaData = await uploadMediaFiles()

      const contentType = formData.content_type === "Dynamic(LED)" ? "Dynamic" : formData.content_type

      const productData = {
        ...formData,
        name: productName,
        description,
        price: Number.parseFloat(price),
        content_type: contentType,
        media: mediaData,
        categories: selectedCategories,
        category_names: getCategoryNames(),
        company_id: userData?.company_id || null,
        seller_id: user?.uid || "",
        seller_name:
          userData?.first_name && userData?.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : user?.email || "",
        active: true,
        deleted: false,
        created: serverTimestamp(),
        updated: serverTimestamp(),
        cms:
          contentType === "Dynamic"
            ? {
                spots_per_loop: Number.parseInt(formData.cms.spots_per_loop) || 0,
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

      await createProduct(productData)

      toast({
        title: "Product created",
        description: "Your product has been created successfully.",
      })

      router.push("/admin/inventory")
    } catch (error) {
      console.error("Error creating product:", error)
      setError(typeof error === "string" ? error : "Failed to create product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/admin/inventory")
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

  const isDynamicContent = formData.content_type === "Dynamic(LED)"

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Create New Product</h1>
        <p className="text-muted-foreground">Fill in the details to add a new product to your inventory.</p>
      </div>
      <div className="mx-auto w-full max-w-6xl flex justify-center">
        <div className="grid gap-6 w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Enter the name, description, and price of the product.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    type="text"
                    placeholder="e.g., LED Billboard 10x20"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of the product..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    required
                  />
                </div>
                <section className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-3">Location Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="specs_rental.location">
                      Location <span className="text-red-500">*</span>
                    </Label>
                    <GooglePlacesAutocomplete
                      value={formData.specs_rental.location}
                      onChange={handleLocationChange}
                      placeholder="Enter site location"
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
                              {selectedAudienceTypes.includes(type) ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : null}
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
                        value={formData.specs_rental.traffic_count}
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
                        value={formData.specs_rental.elevation}
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
                        value={formData.specs_rental.height}
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
                        value={formData.specs_rental.width}
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
                </section>

                <section className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-3">
                    Media <span className="text-red-500">*</span>
                  </h3>

                  <div
                    className={`border-2 border-dashed ${
                      mediaFiles.length === 0 ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                    } rounded-lg p-8 text-center transition-colors duration-200`}
                  >
                    <input
                      type="file"
                      id="media-upload"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileChange}
                      required={mediaFiles.length === 0}
                      disabled={loading}
                    />
                    <label htmlFor="media-upload" className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload
                        className={`h-12 w-12 ${mediaFiles.length === 0 ? "text-red-500" : "text-gray-500"} mb-3`}
                      />
                      <p className="text-base font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">Images or videos (max 10MB each)</p>
                      {mediaFiles.length === 0 && (
                        <p className="text-sm text-red-600 mt-3 font-medium">At least one media file is required</p>
                      )}
                    </label>
                  </div>

                  {mediaPreviewUrls.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-gray-700">Uploaded Media</h4>

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
                </section>

                <CardFooter className="flex justify-end p-0 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
