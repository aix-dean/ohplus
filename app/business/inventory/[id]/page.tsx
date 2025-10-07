"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Trash2, Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import type { Product } from "@/lib/firebase-service"
import { Skeleton } from "@/components/ui/skeleton"
import { softDeleteProduct } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"

export default function BusinessProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [siteType, setSiteType] = useState<"static" | "digital">("static")
  const [category, setCategory] = useState("")
  const [siteName, setSiteName] = useState("")
  const [location, setLocation] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [dimensionUnit, setDimensionUnit] = useState<"ft" | "m">("ft")
  const [elevation, setElevation] = useState("")
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft")
  const [description, setDescription] = useState("")
  const [selectedAudience, setSelectedAudience] = useState<string[]>([])
  const [dailyTraffic, setDailyTraffic] = useState("")
  const [trafficUnit, setTrafficUnit] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [price, setPrice] = useState("")
  const [priceUnit, setPriceUnit] = useState<"per spot" | "per day" | "per month">("per month")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return

      setLoading(true)
      try {
        const productId = Array.isArray(params.id) ? params.id[0] : params.id

        const productDoc = await getDoc(doc(db, "products", productId))

        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() } as Product)
        } else {
          console.error("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  // Update price unit based on site type
  useEffect(() => {
    setPriceUnit(siteType === "static" ? "per month" : "per spot")
  }, [siteType])

  const handleBack = () => {
    router.back()
  }

  // Form handlers
  const toggleAudience = (type: string) => {
    setSelectedAudience(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : uploadedFiles.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < uploadedFiles.length - 1 ? prev + 1 : 0))
  }

  const handleRemoveImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const handleRemoveExistingImage = (imageUrl: string) => {
    setImagesToRemove(prev => [...prev, imageUrl])
  }

  const handleRestoreExistingImage = (imageUrl: string) => {
    setImagesToRemove(prev => prev.filter(url => url !== imageUrl))
  }

  const handleDelete = async () => {
    if (!product || !product.id) return

    try {
      await softDeleteProduct(product.id)
      toast({
        title: "Product deleted",
        description: `${product.name} has been successfully deleted.`,
      })
      // Update the product in the UI to show it as deleted
      setProduct({
        ...product,
        deleted: true,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!product || !product.id) return

    setIsSubmitting(true)

    // Validation
    if (!siteName.trim()) {
      toast({
        title: "Validation Error",
        description: "Site name is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!location.trim()) {
      toast({
        title: "Validation Error",
        description: "Location is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!price.trim()) {
      toast({
        title: "Validation Error",
        description: "Price is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (price.trim() && isNaN(Number(price))) {
      toast({
        title: "Validation Error",
        description: "Price must be a valid number.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Upload new files to Firebase Storage
      const mediaUrls: Array<{ url: string; distance: string; type: string; isVideo: boolean }> = []
      for (const file of uploadedFiles) {
        const url = await uploadFileToFirebaseStorage(file, `products/${product.company_id}`)
        mediaUrls.push({
          url,
          distance: "0",
          type: file.type,
          isVideo: file.type.startsWith('video/')
        })
      }

      // Filter out removed images and combine with new media
      const existingMedia = (product.media || []).filter(mediaItem => !imagesToRemove.includes(mediaItem.url))
      const allMedia = [...existingMedia, ...mediaUrls]

      // Create update data
      const updateData = {
        name: siteName,
        description,
        price: parseFloat(price) || 0,
        content_type: siteType,
        categories: [category],
        specs_rental: {
          audience_types: selectedAudience,
          location,
          traffic_count: parseInt(dailyTraffic) || null,
          height: parseFloat(height) || null,
          width: parseFloat(width) || null,
          elevation: parseFloat(elevation) || null,
          structure: product.specs_rental?.structure || {
            color: null,
            condition: null,
            contractor: null,
            last_maintenance: null,
          },
          illumination: product.specs_rental?.illumination || {
            bottom_count: null,
            bottom_lighting_specs: null,
            left_count: null,
            left_lighting_specs: null,
            right_count: null,
            right_lighting_specs: null,
            upper_count: null,
            upper_lighting_specs: null,
            power_consumption_monthly: null,
          },
        },
        media: allMedia,
        type: "RENTAL",
        updated: serverTimestamp(),
      }

      // Update in Firestore
      await updateDoc(doc(db, "products", product.id), updateData)

      // Update local state
      setProduct({
        ...product,
        ...updateData,
      })

      setEditDialogOpen(false)

      toast({
        title: "Site updated successfully",
        description: `${siteName} has been updated.`,
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    if (product) {
      // Populate form with existing product data
      const currentSiteType = product.content_type === "static" ? "static" : "digital"
      setSiteType(currentSiteType)
      setCategory(product.categories?.[0] || "")
      setSiteName(product.name || "")
      setLocation(product.specs_rental?.location || "")
      setLocationLabel("")
      setHeight(product.specs_rental?.height?.toString() || "")
      setWidth(product.specs_rental?.width?.toString() || "")
      setDimensionUnit("ft") // Default
      setElevation(product.specs_rental?.elevation?.toString() || "")
      setElevationUnit("ft") // Default
      setDescription(product.description || "")
      setSelectedAudience(product.specs_rental?.audience_types || [])
      setDailyTraffic(product.specs_rental?.traffic_count?.toString() || "")
      setTrafficUnit("monthly") // Default
      setPrice(product.price?.toString() || "")
      setPriceUnit(currentSiteType === "static" ? "per month" : "per spot")
      setUploadedFiles([])
      setCurrentImageIndex(0)
      setImagesToRemove([])

      setEditDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="overflow-auto p-6">
        <div className="max-w-xs">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-[300px] w-full mb-6 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="overflow-auto p-6">
        <div className="max-w-xs text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-auto p-6">
      <div className="max-w-xs">
        <div className="space-y-4">
          <div className="flex flex-row items-center">
            <Link href="/business/inventory" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2
              className="text-lg"
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '120%',
                letterSpacing: '0%',
                color: '#000000'
              }}
            >
              Site Information
            </h2>
          </div>

          {/* Site Image and Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Site Image - Left Side */}
            <div className="relative aspect-square w-full">
              <Image
                src={product.media && product.media.length > 0 ? product.media[0].url : "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/abstract-geometric-sculpture.png"
                }}
              />
            </div>

            {/* Map Placeholder - Right Side */}
            <div className="relative aspect-square w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Map view</p>
                <p className="text-xs mt-1">
                  {product.type?.toLowerCase() === "rental"
                    ? product.specs_rental?.location || "Unknown location"
                    : product.light?.location || "Unknown location"}
                </p>
              </div>
            </div>
          </div>

          {/* Site Details */}
          <div className="space-y-2">
            <h3
              style={{
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: '120%',
                letterSpacing: '0%',
                color: '#000000'
              }}
            >
              {product.name}
            </h3>
            <Button variant="outline" className="mt-2 w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Site Calendar
            </Button>

            <div className="space-y-2 text-sm mt-4">
              <div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  Type:
                </span>{" "}
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#333333'
                  }}
                >
                  {product.content_type === "static" ? "Static" : "Dynamic"} - Billboard
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  Dimension:
                </span>{" "}
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#333333'
                  }}
                >
                  {product.specs_rental?.height && product.specs_rental?.width
                    ? `${product.specs_rental.height}ft x ${product.specs_rental.width}ft`
                    : "Not specified"}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  Location:
                </span>{" "}
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#333333'
                  }}
                >
                  {product.type?.toLowerCase() === "rental"
                    ? product.specs_rental?.location || "Unknown location"
                    : product.light?.location || "Unknown location"}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  Geopoint:
                </span>{" "}
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#333333'
                  }}
                >
                  {product.specs_rental?.geopoint
                    ? `${product.specs_rental.geopoint[0]},${product.specs_rental.geopoint[1]}`
                    : "12.5346567742,14.09346723"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4 space-y-2">
            {!product.deleted && (
              <>
                <Button onClick={handleEdit} className="w-full bg-blue-600 hover:bg-blue-700">
                  Edit Site
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Site
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full bg-transparent">
              View Contract
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Site Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] py-0 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b px-6 mb-0 min-h-[4rem] flex items-start pt-6">
            <DialogTitle className="text-2xl font-semibold text-[#333333]">Edit Site</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Site Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Type:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={siteType === "static" ? "default" : "outline"}
                    onClick={() => setSiteType("static")}
                    className={`flex-1 ${
                      siteType === "static"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Static
                  </Button>
                  <Button
                    variant={siteType === "digital" ? "default" : "outline"}
                    onClick={() => setSiteType("digital")}
                    className={`flex-1 ${
                      siteType === "digital"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Digital
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Category:</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-[#c4c4c4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(siteType === "static" ? ["Billboard", "Wallboard", "Transit Ads", "Column", "Bridgeway billboard", "Banner", "Lampost", "Lightbox", "Building Wrap", "Gantry", "Toll Plaza"] : ["Digital Billboard", "LED Poster", "Digital Transit Ads"]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site Name */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Name:</Label>
                <Input
                  placeholder="Site Name"
                  className="border-[#c4c4c4]"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location:</Label>
                <GooglePlacesAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="Enter street address or search location..."
                  enableMap={true}
                  mapHeight="250px"
                />
              </div>

              {/* Location Label */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location Label:</Label>
                <Input
                  className="border-[#c4c4c4]"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                />
              </div>

              {/* Dimension */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Dimension:</Label>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Height:</Label>
                    <Input
                      type="number"
                      className="border-[#c4c4c4]"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <span className="text-[#4e4e4e]">x</span>
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Width:</Label>
                    <Input
                      type="number"
                      className="border-[#c4c4c4]"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  <Select value={dimensionUnit} onValueChange={(value: "ft" | "m") => setDimensionUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Elevation from ground */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Elevation from ground: <span className="text-[#c4c4c4]">(Optional)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                  <Select value={elevationUnit} onValueChange={(value: "ft" | "m") => setElevationUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Description:</Label>
                <Textarea
                  className="min-h-[120px] border-[#c4c4c4] resize-none"
                  placeholder=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Audience Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Audience Type: <span className="text-[#c4c4c4]">(can choose multiple)</span>
                </Label>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "E"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => toggleAudience(type)}
                      className={`w-12 h-10 ${
                        selectedAudience.includes(type)
                          ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                          : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Traffic */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Traffic:</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={dailyTraffic}
                    onChange={(e) => setDailyTraffic(e.target.value)}
                  />
                  <Select value={trafficUnit} onValueChange={(value: "daily" | "weekly" | "monthly") => setTrafficUnit(value)}>
                    <SelectTrigger className="w-24 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">daily</SelectItem>
                      <SelectItem value="weekly">weekly</SelectItem>
                      <SelectItem value="monthly">monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Images */}
              {product?.media && product.media.length > 0 && (
                <div>
                  <Label className="text-[#4e4e4e] font-medium mb-3 block">Current Images:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {product.media
                      .filter(mediaItem => !imagesToRemove.includes(mediaItem.url))
                      .map((mediaItem, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                          <img
                            src={mediaItem.url || "/placeholder.svg"}
                            alt={`Current image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/abstract-geometric-sculpture.png"
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveExistingImage(mediaItem.url)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                  </div>
                  {imagesToRemove.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-[#4e4e4e] font-medium mb-2 block text-sm">Images marked for removal:</Label>
                      <div className="flex flex-wrap gap-2">
                        {imagesToRemove.map((url, index) => {
                          const mediaItem = product.media?.find(m => m.url === url)
                          return (
                            <div key={index} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                              <span className="text-sm text-red-700">Image {index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-red-600 hover:text-red-800"
                                onClick={() => handleRestoreExistingImage(url)}
                              >
                                ↺
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Upload */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Add New Photos: <span className="text-[#c4c4c4]">(can upload multiple)</span>
                </Label>

                {/* Image Preview/Carousel */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      {/* Main Image Display */}
                      <div className="aspect-video relative">
                        <img
                          src={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                          alt={`Preview ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Remove Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                        >
                          ×
                        </Button>
                      </div>

                      {/* Navigation Arrows (only show if multiple images) */}
                      {uploadedFiles.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handlePrevImage}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handleNextImage}
                          >
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {uploadedFiles.length}
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {uploadedFiles.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {uploadedFiles.map((file, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#c4c4c4] rounded-lg p-8 text-center bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-[#c4c4c4] mx-auto mb-2" />
                    <p className="text-[#c4c4c4] font-medium">Upload</p>
                  </label>
                  {uploadedFiles.length === 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Click to select images
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Price:</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Select value={priceUnit} disabled>
                    <SelectTrigger className="w-28 border-[#c4c4c4] bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per spot">per spot</SelectItem>
                      <SelectItem value="per day">per day</SelectItem>
                      <SelectItem value="per month">per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-[#c4c4c4] mt-8 pt-6 pb-6 -mb-6">
            <div className="flex justify-end gap-4 px-6">
              <Button
                variant="outline"
                className="px-8 border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50 bg-transparent"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="px-8 bg-[#1d0beb] hover:bg-[#1508d1] text-white"
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Site"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(dateValue?: string | any): string {
  if (!dateValue) return "Unknown"

  try {
    let date: Date

    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === "object" && "toDate" in dateValue) {
      date = dateValue.toDate()
    }
    // Handle ISO string dates
    else if (typeof dateValue === "string") {
      date = new Date(dateValue)
    }
    // Handle any other date-like input
    else {
      date = new Date(dateValue)
    }

    return date.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateValue)
  }
}
