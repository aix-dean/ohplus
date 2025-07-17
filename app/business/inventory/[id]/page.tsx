"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, Edit, Trash2 } from "lucide-react"
import { getUserProduct, softDeleteProduct, type Product } from "@/lib/firebase-service"
import { toast } from "@/components/ui/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { SideNavigation } from "@/components/side-navigation"

interface BusinessInventoryDetailPageProps {
  params: {
    id: string
  }
}

export default function BusinessInventoryDetailPage({ params }: BusinessInventoryDetailPageProps) {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch product details
  const fetchProduct = useCallback(async () => {
    if (!userData?.company_id || !params.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const productData = await getUserProduct(params.id, userData.company_id)
      if (productData) {
        setProduct(productData)
      } else {
        toast({
          title: "Product not found",
          description: "The requested product could not be found.",
          variant: "destructive",
        })
        router.push("/business/inventory")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      })
      router.push("/business/inventory")
    } finally {
      setLoading(false)
    }
  }, [userData?.company_id, params.id, router, toast])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!product) return

    try {
      await softDeleteProduct(product.id)
      toast({
        title: "Product deleted",
        description: `${product.name} has been successfully deleted.`,
      })
      router.push("/business/inventory")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = () => {
    router.push(`/admin/products/edit/${product?.id}`)
  }

  const handleBackClick = () => {
    router.push("/business/inventory")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">The requested product could not be found.</p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNavigation />
      <div className="flex-1 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <Card className="overflow-hidden">
            <div className="aspect-video relative bg-gray-200">
              <Image
                src={
                  product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"
                }
                alt={product.name || "Product image"}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/abstract-geometric-sculpture.png"
                  target.className = "opacity-50"
                }}
              />
            </div>
          </Card>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-lg font-medium text-green-700">
                      ₱{Number(product.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-700">{product.specs_rental?.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-700">
                      Created:{" "}
                      {product.created_at
                        ? new Date(product.created_at.seconds * 1000).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Status</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            {product.specs_rental && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                  <div className="space-y-2">
                    {product.specs_rental.dimensions && (
                      <div>
                        <span className="font-medium">Dimensions:</span>
                        <span className="ml-2 text-gray-700">{product.specs_rental.dimensions}</span>
                      </div>
                    )}
                    {product.specs_rental.type && (
                      <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2 text-gray-700">{product.specs_rental.type}</span>
                      </div>
                    )}
                    {product.specs_rental.illumination && (
                      <div>
                        <span className="font-medium">Illumination:</span>
                        <span className="ml-2 text-gray-700">{product.specs_rental.illumination}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {product.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          description="This product will be removed from your inventory. This action cannot be undone."
          itemName={product?.name}
        />
      </div>
    </div>
  )
}
