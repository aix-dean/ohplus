"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useEffect } from "react"

import { useState } from "react"

import { useRouter } from "next/navigation"

import { CardDescription } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { createProduct } from "@/lib/firebase-service" // Corrected import from addProduct to createProduct
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Upload, Trash2, ImageIcon, Film } from "lucide-react"

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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive({
      message: "Price must be a positive number.",
    }),
  ),
  imageUrl: z
    .string()
    .url({
      message: "Image URL must be a valid URL.",
    })
    .optional()
    .or(z.literal("")),
})

export default function AdminProductCreatePage() {
  const router = useRouter()
  const { user, userData, subscriptionData, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

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
        toast.error("Failed to load categories. Please try again.")
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (user) {
      fetchCategories()
    }
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      form.setValue(parent as keyof typeof formSchema, {
        ...(form.getValues(parent as keyof typeof formSchema) || {}),
        [child]: value,
      })
    } else {
      form.setValue(name as keyof typeof formSchema, value)
    }
  }

  const handleLocationChange = (value: string) => {
    form.setValue("specs_rental.location", value)
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

    form.setValue(
      "specs_rental.audience_types",
      !selectedAudienceTypes.includes(audienceType)
        ? [...form.getValues("specs_rental.audience_types"), audienceType]
        : form.getValues("specs_rental.audience_types").filter((type) => type !== audienceType),
    )
  }

  const handleGeopointChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = Number.parseFloat(e.target.value) || 0
    const newGeopoint = [...form.getValues("specs_rental.geopoint")]
    newGeopoint[index] = value

    form.setValue("specs_rental.geopoint", newGeopoint as [number, number])
  }

  const handleTypeChange = (value: string) => {
    form.setValue("type", value)
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
    if (!user) return []

    const storage = getStorage()
    const mediaData = []

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      const isVideo = file.type.startsWith("video/")

      try {
        // Create a reference to the file in Firebase Storage
        const fileRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`)

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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    if (!user || !userData) {
      // Ensure userData is available
      form.setError("root", { message: "You must be logged in to create a product" })
      return
    }

    if (!subscriptionData || (subscriptionData.status !== "active" && subscriptionData.status !== "trialing")) {
      toast.error("You need an active subscription to create products. Please subscribe.")
      router.push("/settings/subscription")
      return
    }

    if (!values.name) {
      form.setError("name", { message: "Name is required" })
      return
    }

    if (!values.description) {
      form.setError("description", { message: "Description is required" })
      return
    }

    if (selectedCategories.length === 0) {
      form.setError("root", { message: "At least one category must be selected" })
      return
    }

    if (!form.getValues("specs_rental.location")) {
      form.setError("specs_rental.location", { message: "Location is required" })
      return
    }

    if (mediaFiles.length === 0) {
      form.setError("root", { message: "At least one media file is required" })
      return
    }

    if (form.getValues("content_type") === "Dynamic(LED)") {
      if (!form.getValues("cms.spots_per_loop")) {
        form.setError("cms.spots_per_loop", { message: "Spots per loop is required for Dynamic content" })
        return
      }
      if (!form.getValues("cms.loops_per_day")) {
        form.setError("cms.loops_per_day", { message: "Loops per day is required for Dynamic content" })
        return
      }
    }

    try {
      const mediaData = await uploadMediaFiles()

      const contentType = form.getValues("content_type") === "Dynamic(LED)" ? "Dynamic" : form.getValues("content_type")

      const productData = {
        name: values.name,
        description: values.description || "",
        price: values.price ? Number.parseFloat(values.price) : null,
        media: mediaData,
        categories: selectedCategories,
        category_names: getCategoryNames(),
        active: true,
        deleted: false,
        created: serverTimestamp(),
        updated: serverTimestamp(),
        content_type: contentType,
        type: form.getValues("type"),
        specs_rental: {
          ...form.getValues("specs_rental"),
          audience_types: selectedAudienceTypes,
          traffic_count: form.getValues("specs_rental.traffic_count")
            ? Number.parseInt(form.getValues("specs_rental.traffic_count"))
            : null,
          elevation: form.getValues("specs_rental.elevation")
            ? Number.parseFloat(form.getValues("specs_rental.elevation"))
            : null,
          height: form.getValues("specs_rental.height")
            ? Number.parseFloat(form.getValues("specs_rental.height"))
            : null,
          width: form.getValues("specs_rental.width") ? Number.parseFloat(form.getValues("specs_rental.width")) : null,
        },
      }

      await createProduct(user.uid, user.displayName || "Unknown User", userData.license_key, productData)

      toast.success("Product created successfully!")
      router.push("/admin/inventory")
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product. Please try again.")
    } finally {
      setIsLoading(false)
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

    form.setValue(
      "specs_rental.audience_types",
      form.getValues("specs_rental.audience_types").filter((type) => type !== audienceType),
    )
  }

  const isDynamicContent = form.getValues("content_type") === "Dynamic(LED)"

  const hasActiveSubscription = subscriptionData?.status === "active" || subscriptionData?.status === "trialing"
  const isTrial = subscriptionData?.status === "trialing"
  const canCreateMoreProducts = (subscriptionData?.maxProducts || 0) > (userData?.products || 0)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasActiveSubscription || !canCreateMoreProducts) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 lg:p-8 pt-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto h-12 w-12 text-gray-400">Lock</div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">Subscription Required</CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              You need an active subscription to create products. Please subscribe to unlock this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/settings/subscription")}>Go to Subscription Settings</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-4 sm:p-6 lg:p-8 pt-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-extrabold text-gray-900">Create New Product</CardTitle>
          <CardDescription className="text-gray-600">
            Fill in the details to add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {isTrial && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                You are currently on a trial plan. You can create up to {subscriptionData?.maxProducts} product. Upgrade
                to unlock more features.
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <section className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-3">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Month (₱)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter price per month" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Description <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter product description" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-3">Location Information</h3>

                  <FormField
                    control={form.control}
                    name="specs_rental.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <GooglePlacesAutocomplete
                            value={field.value}
                            onChange={handleLocationChange}
                            placeholder="Enter site location"
                            required
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      disabled={isLoading}
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
                                      disabled={isLoading}
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

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
