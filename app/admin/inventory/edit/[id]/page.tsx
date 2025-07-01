"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, ImageIcon, ArrowLeft, UploadCloud } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Product, ProductMedia, RentalSpecs, LightSpecs } from "@/lib/firebase-service"
import { Checkbox } from "@/components/ui/checkbox"

interface EditInventoryPageProps {
  params: {
    id: string
  }
}

export default function EditInventoryPage({ params }: EditInventoryPageProps) {
  const { id } = params
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [type, setType] = useState<"rental" | "light" | "">("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [media, setMedia] = useState<ProductMedia[]>([])
  const [rentalSpecs, setRentalSpecs] = useState<RentalSpecs | null>(null)
  const [lightSpecs, setLightSpecs] = useState<LightSpecs | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      try {
        const docRef = doc(db, "products", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product
          setProduct(productData)
          setName(productData.name || "")
          setDescription(productData.description || "")
          setPrice(productData.price || "")
          setType(productData.type || "")
          setStatus(productData.status || "active")
          setMedia(productData.media || [])
          setRentalSpecs(productData.specs_rental || null)
          setLightSpecs(productData.light || null)
        } else {
          toast({
            title: "Product Not Found",
            description: "The product you are trying to edit does not exist.",
            variant: "destructive",
          })
          router.push("/admin/inventory")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details for editing. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router, toast])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newMedia: ProductMedia[] = []
    let uploadedCount = 0

    try {
      for (const file of Array.from(files)) {
        const storageRef = ref(storage, `product_media/${id}/${file.name}_${Date.now()}`)
        const uploadTask = uploadBytes(storageRef, file)

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(progress)
          },
          (error) => {
            console.error("Upload failed:", error)
            toast({
              title: "Upload Failed",
              description: `Failed to upload ${file.name}.`,
              variant: "destructive",
            })
          },
          async () => {
            const downloadURL = await getDownloadURL(storageRef)
            newMedia.push({ url: downloadURL, type: file.type })
            uploadedCount++
            if (uploadedCount === files.length) {
              setMedia((prev) => [...prev, ...newMedia])
              toast({
                title: "Upload Complete",
                description: `${files.length} file(s) uploaded successfully.`,
              })
              setUploading(false)
              setUploadProgress(0)
            }
          },
        )
      }
    } catch (error) {
      console.error("Error initiating upload:", error)
      toast({
        title: "Upload Error",
        description: "An error occurred during upload. Please try again.",
        variant: "destructive",
      })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveMedia = async (urlToRemove: string) => {
    if (!confirm("Are you sure you want to remove this media?")) return

    try {
      // Delete from Firebase Storage
      const fileRef = ref(storage, urlToRemove)
      await deleteObject(fileRef)

      // Remove from local state
      setMedia((prev) => prev.filter((m) => m.url !== urlToRemove))
      toast({
        title: "Media Removed",
        description: "File successfully removed.",
      })
    } catch (error) {
      console.error("Error removing media:", error)
      toast({
        title: "Removal Failed",
        description: "Failed to remove media. It might already be deleted or you lack permissions.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setSaving(true)
    try {
      const productRef = doc(db, "products", id)
      const updatedData: Partial<Product> = {
        name,
        description,
        price: typeof price === "number" ? price : Number.parseFloat(price as string),
        type,
        status,
        media,
        updated: serverTimestamp() as any,
      }

      if (type === "rental") {
        updatedData.specs_rental = rentalSpecs
        updatedData.light = null // Clear light specs if switching type
      } else if (type === "light") {
        updatedData.light = lightSpecs
        updatedData.specs_rental = null // Clear rental specs if switching type
      } else {
        updatedData.specs_rental = null
        updatedData.light = null
      }

      await updateDoc(productRef, updatedData)
      toast({
        title: "Product Updated",
        description: `${name} has been successfully updated.`,
      })
      router.push(`/admin/inventory/${id}`)
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return null // Should be handled by the redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Product: {product.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details about your product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number.parseFloat(e.target.value) || "")}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <Select value={type} onValueChange={(value: "rental" | "light") => setType(value)} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">Rental (Billboard/LED)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {type === "rental" && (
          <Card>
            <CardHeader>
              <CardTitle>Rental Specifications</CardTitle>
              <CardDescription>Details specific to rental products like billboards or LED displays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rental-location">Location</Label>
                  <Input
                    id="rental-location"
                    value={rentalSpecs?.location || ""}
                    onChange={(e) => setRentalSpecs((prev) => ({ ...prev, location: e.target.value }) as RentalSpecs)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-dimensions">Dimensions</Label>
                  <Input
                    id="rental-dimensions"
                    value={rentalSpecs?.dimensions || ""}
                    onChange={(e) => setRentalSpecs((prev) => ({ ...prev, dimensions: e.target.value }) as RentalSpecs)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rental-type">Type (e.g., Billboard, LED Display)</Label>
                  <Input
                    id="rental-type"
                    value={rentalSpecs?.type || ""}
                    onChange={(e) => setRentalSpecs((prev) => ({ ...prev, type: e.target.value }) as RentalSpecs)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-min-duration">Minimum Duration</Label>
                  <Input
                    id="rental-min-duration"
                    value={rentalSpecs?.min_duration || ""}
                    onChange={(e) =>
                      setRentalSpecs((prev) => ({ ...prev, min_duration: e.target.value }) as RentalSpecs)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rental-site-code">Site Code</Label>
                  <Input
                    id="rental-site-code"
                    value={rentalSpecs?.site_code || ""}
                    onChange={(e) => setRentalSpecs((prev) => ({ ...prev, site_code: e.target.value }) as RentalSpecs)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-impressions">Impressions</Label>
                  <Input
                    id="rental-impressions"
                    type="number"
                    value={rentalSpecs?.impressions || ""}
                    onChange={(e) =>
                      setRentalSpecs(
                        (prev) =>
                          ({
                            ...prev,
                            impressions: Number.parseInt(e.target.value) || 0,
                          }) as RentalSpecs,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rental-connectivity">Connectivity</Label>
                  <Input
                    id="rental-connectivity"
                    value={rentalSpecs?.connectivity || ""}
                    onChange={(e) =>
                      setRentalSpecs((prev) => ({ ...prev, connectivity: e.target.value }) as RentalSpecs)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-power-source">Power Source</Label>
                  <Input
                    id="rental-power-source"
                    value={rentalSpecs?.power_source || ""}
                    onChange={(e) =>
                      setRentalSpecs((prev) => ({ ...prev, power_source: e.target.value }) as RentalSpecs)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-operating-temperature">Operating Temperature</Label>
                <Input
                  id="rental-operating-temperature"
                  value={rentalSpecs?.operating_temperature || ""}
                  onChange={(e) =>
                    setRentalSpecs(
                      (prev) =>
                        ({
                          ...prev,
                          operating_temperature: e.target.value,
                        }) as RentalSpecs,
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {type === "light" && (
          <Card>
            <CardHeader>
              <CardTitle>Light Specifications</CardTitle>
              <CardDescription>Details specific to light products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="light-location">Location</Label>
                  <Input
                    id="light-location"
                    value={lightSpecs?.location || ""}
                    onChange={(e) => setLightSpecs((prev) => ({ ...prev, location: e.target.value }) as LightSpecs)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-brightness">Brightness (Lumens)</Label>
                  <Input
                    id="light-brightness"
                    value={lightSpecs?.brightness || ""}
                    onChange={(e) => setLightSpecs((prev) => ({ ...prev, brightness: e.target.value }) as LightSpecs)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="light-color-temperature">Color Temperature (Kelvin)</Label>
                  <Input
                    id="light-color-temperature"
                    value={lightSpecs?.colorTemperature || ""}
                    onChange={(e) =>
                      setLightSpecs((prev) => ({ ...prev, colorTemperature: e.target.value }) as LightSpecs)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-power-consumption">Power Consumption (Watts)</Label>
                  <Input
                    id="light-power-consumption"
                    value={lightSpecs?.powerConsumption || ""}
                    onChange={(e) =>
                      setLightSpecs((prev) => ({ ...prev, powerConsumption: e.target.value }) as LightSpecs)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="light-site-code">Site Code</Label>
                  <Input
                    id="light-site-code"
                    value={lightSpecs?.siteCode || ""}
                    onChange={(e) => setLightSpecs((prev) => ({ ...prev, siteCode: e.target.value }) as LightSpecs)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-ip-rating">IP Rating</Label>
                  <Input
                    id="light-ip-rating"
                    value={lightSpecs?.ipRating || ""}
                    onChange={(e) => setLightSpecs((prev) => ({ ...prev, ipRating: e.target.value }) as LightSpecs)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="light-wind-resistance">Wind Resistance</Label>
                  <Input
                    id="light-wind-resistance"
                    value={lightSpecs?.windResistance || ""}
                    onChange={(e) =>
                      setLightSpecs((prev) => ({ ...prev, windResistance: e.target.value }) as LightSpecs)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-waterproof-rating">Waterproof Rating</Label>
                  <Input
                    id="light-waterproof-rating"
                    value={lightSpecs?.waterproofRating || ""}
                    onChange={(e) =>
                      setLightSpecs((prev) => ({ ...prev, waterproofRating: e.target.value }) as LightSpecs)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="light-sunlight-readable"
                    checked={lightSpecs?.sunlightReadable || false}
                    onCheckedChange={(checked) =>
                      setLightSpecs((prev) => ({ ...prev, sunlightReadable: !!checked }) as LightSpecs)
                    }
                  />
                  <Label htmlFor="light-sunlight-readable">Sunlight Readable</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-night-visibility">Night Visibility</Label>
                  <Input
                    id="light-night-visibility"
                    value={lightSpecs?.nightVisibility || ""}
                    onChange={(e) =>
                      setLightSpecs((prev) => ({ ...prev, nightVisibility: e.target.value }) as LightSpecs)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product Media</CardTitle>
            <CardDescription>Upload images or videos for your product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {media.map((m, index) => (
                <div key={index} className="relative h-32 w-full overflow-hidden rounded-md border">
                  {m.type?.startsWith("image") ? (
                    <Image
                      src={m.url || "/placeholder.svg"}
                      alt={`Product media ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : m.type?.startsWith("video") ? (
                    <video src={m.url} className="h-full w-full object-cover" controls={false} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveMedia(m.url)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300">
                <Label htmlFor="media-upload" className="cursor-pointer text-center">
                  <Input id="media-upload" type="file" multiple className="hidden" onChange={handleMediaUpload} />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="mt-2 text-sm text-primary">Uploading... {Math.round(uploadProgress)}%</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-6 w-6 text-gray-500" />
                      <span className="mt-2 text-sm text-gray-600">Add Media</span>
                    </div>
                  )}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
