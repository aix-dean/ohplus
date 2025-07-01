"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Edit,
  Trash2,
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  ImageIcon,
  Lightbulb,
  Ruler,
  Clock,
  Info,
  Wifi,
  BatteryCharging,
  Thermometer,
  Cloud,
  Wind,
  Droplet,
  Sun,
  Moon,
  Zap,
  Package,
  BarChart2,
  Users,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { softDeleteProduct, type Product } from "@/lib/firebase-service"
import { format } from "date-fns"

interface InventoryDetailsPageProps {
  params: {
    id: string
  }
}

export default function InventoryDetailsPage({ params }: InventoryDetailsPageProps) {
  const { id } = params
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      try {
        const docRef = doc(db, "products", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product)
        } else {
          toast({
            title: "Product Not Found",
            description: "The requested product does not exist.",
            variant: "destructive",
          })
          router.push("/admin/inventory")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router, toast])

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!product) return

    try {
      await softDeleteProduct(product.id)
      toast({
        title: "Product Deleted",
        description: `${product.name} has been successfully deleted.`,
      })
      router.push("/admin/inventory")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
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
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you are looking for does not exist or has been deleted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/inventory")}>Go to Inventory</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isRental = product.type?.toLowerCase() === "rental"
  const isLight = product.type?.toLowerCase() === "light"

  const renderMedia = () => {
    if (!product.media || product.media.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
          <ImageIcon size={48} />
        </div>
      )
    }

    const firstMedia = product.media[0]
    if (firstMedia.type?.startsWith("image")) {
      return (
        <Image
          src={firstMedia.url || "/placeholder.svg"}
          alt={product.name || "Product image"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg"
            target.className = "opacity-50 object-contain"
          }}
        />
      )
    } else if (firstMedia.type?.startsWith("video")) {
      return (
        <video controls className="h-full w-full object-cover">
          <source src={firstMedia.url} type={firstMedia.type} />
          Your browser does not support the video tag.
        </video>
      )
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
        <ImageIcon size={48} />
      </div>
    )
  }

  const renderSpecs = () => {
    if (isRental && product.specs_rental) {
      const specs = product.specs_rental
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800">Rental Specifications</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              Location: <span className="font-medium">{specs.location || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-gray-500" />
              Dimensions: <span className="font-medium">{specs.dimensions || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              Type: <span className="font-medium">{specs.type || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Min. Duration: <span className="font-medium">{specs.min_duration || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              Site Code: <span className="font-medium">{specs.site_code || "N/A"}</span>
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800">Technical Details</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-gray-500" />
              Impressions: <span className="font-medium">{specs.impressions?.toLocaleString() || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-gray-500" />
              Connectivity: <span className="font-medium">{specs.connectivity || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-gray-500" />
              Power Source: <span className="font-medium">{specs.power_source || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-gray-500" />
              Operating Temp: <span className="font-medium">{specs.operating_temperature || "N/A"}</span>
            </p>
          </div>
        </div>
      )
    } else if (isLight && product.light) {
      const specs = product.light
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800">Light Specifications</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              Location: <span className="font-medium">{specs.location || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gray-500" />
              Brightness: <span className="font-medium">{specs.brightness || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              Color Temp: <span className="font-medium">{specs.colorTemperature || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-500" />
              Power: <span className="font-medium">{specs.powerConsumption || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              Site Code: <span className="font-medium">{specs.siteCode || "N/A"}</span>
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800">Environmental Ratings</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-gray-500" />
              IP Rating: <span className="font-medium">{specs.ipRating || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-500" />
              Wind Resistance: <span className="font-medium">{specs.windResistance || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-gray-500" />
              Waterproof: <span className="font-medium">{specs.waterproofRating || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Sun className="h-4 w-4 text-gray-500" />
              Sunlight Readable: <span className="font-medium">{specs.sunlightReadable ? "Yes" : "No"}</span>
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Moon className="h-4 w-4 text-gray-500" />
              Night Visibility: <span className="font-medium">{specs.nightVisibility || "N/A"}</span>
            </p>
          </div>
        </div>
      )
    }
    return (
      <p className="text-sm text-gray-500">No specific technical specifications available for this product type.</p>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/admin/inventory/edit/${product.id}`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Product
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Product
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-64 w-full bg-gray-200 md:h-96">{renderMedia()}</div>
        <CardContent className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-lg text-gray-600">{product.description}</p>
            </div>
            <Badge
              className={`px-3 py-1 text-sm font-medium ${
                product.status === "active"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {product.status?.charAt(0).toUpperCase() + product.status?.slice(1) || "N/A"}
            </Badge>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* General Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">General Information</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  Product Type: <span className="font-medium capitalize">{product.type || "N/A"}</span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Price: <span className="font-medium">₱{product.price?.toLocaleString() || "N/A"}</span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Created At:{" "}
                  <span className="font-medium">
                    {product.created ? format(new Date(product.created), "MMM d, yyyy") : "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Last Updated:{" "}
                  <span className="font-medium">
                    {product.updated ? format(new Date(product.updated), "MMM d, yyyy") : "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Seller: <span className="font-medium">{product.seller_name || "N/A"}</span>
                </p>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Technical Specifications</h2>
              {renderSpecs()}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="This product will be permanently removed from your inventory. This action cannot be undone."
        itemName={product.name}
      />
    </div>
  )
}
