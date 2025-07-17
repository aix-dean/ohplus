"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, MapPin, Calendar, Tag, Info, Edit, Trash2 } from "lucide-react"
import { getProductById, softDeleteProduct, type Product } from "@/lib/firebase-service"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { BusinessSideNavigation } from "@/components/business-side-navigation"

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(params.id)
        setProduct(productData)
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
  }, [params.id])

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
    router.push(`/business/inventory/edit/${params.id}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <BusinessSideNavigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen">
        <BusinessSideNavigation />
        <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Product not found</div>
            <div className="text-gray-400 text-sm">
              The product you are looking for does not exist or has been deleted.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <BusinessSideNavigation />
      <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" onClick={handleDeleteClick}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Images */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.media && product.media.length > 0 ? (
                  product.media.map((media, index) => (
                    <div key={index} className="relative h-48 rounded-md overflow-hidden">
                      <Image
                        src={media.url || "/placeholder.svg"}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/abstract-geometric-sculpture.png"
                          target.className = "opacity-50"
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="relative h-48 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Info className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-gray-900">{product.description || "No description provided."}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <div className="mt-1 flex items-center text-gray-900">
                      <MapPin size={16} className="mr-1 text-gray-500" />
                      <span>{product.specs_rental?.location || "Unknown location"}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1">
                      <Badge variant={product.status === "active" ? "success" : "secondary"}>
                        {product.status === "active" ? "Active" : product.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <div className="mt-1 flex items-center text-gray-900">
                      <Calendar size={16} className="mr-1 text-gray-500" />
                      <span>
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="specs" className="space-y-4">
                  {product.specs_rental ? (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Type</h3>
                        <p className="mt-1 text-gray-900">{product.specs_rental.type || "Not specified"}</p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Size</h3>
                        <p className="mt-1 text-gray-900">
                          {product.specs_rental.width && product.specs_rental.height
                            ? `${product.specs_rental.width} × ${product.specs_rental.height} ${
                                product.specs_rental.unit || "m"
                              }`
                            : "Not specified"}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Orientation</h3>
                        <p className="mt-1 text-gray-900">{product.specs_rental.orientation || "Not specified"}</p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Illumination</h3>
                        <p className="mt-1 text-gray-900">{product.specs_rental.illumination || "Not specified"}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No specifications available.</div>
                  )}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <div className="mt-1 flex items-center">
                      <Tag size={16} className="mr-1 text-gray-500" />
                      <span className="text-xl font-semibold text-green-700">
                        ₱{Number(product.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Pricing Model</h3>
                    <p className="mt-1 text-gray-900">{product.pricing_model || "Standard"}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Minimum Booking Period</h3>
                    <p className="mt-1 text-gray-900">
                      {product.min_booking_period ? `${product.min_booking_period} days` : "Not specified"}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          description="This product will be permanently removed from your inventory. This action cannot be undone."
          itemName={product.name}
        />
      </div>
    </div>
  )
}
