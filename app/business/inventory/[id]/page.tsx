"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Tag, Clock, User, AlertTriangle, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { Skeleton } from "@/components/ui/skeleton"
import { softDeleteProduct } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { SideNavigation } from "@/components/side-navigation"

export default function BusinessProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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

  const handleBack = () => {
    router.back()
  }

  const handleDelete = async () => {
    if (!product) return

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
        date_deleted: new Date().toISOString(),
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

  const handleEdit = () => {
    if (product) {
      router.push(`/business/inventory/edit/${product.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SideNavigation />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96 mb-6" />

                <Skeleton className="h-[300px] w-full mb-6 rounded-lg" />

                <Skeleton className="h-10 w-full mb-6" />

                <Skeleton className="h-40 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen">
        <SideNavigation />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <SideNavigation />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>

          {product.deleted && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Deleted Product</AlertTitle>
              <AlertDescription>
                This product has been marked as deleted on {formatDate(product.date_deleted)}. It is no longer visible
                in product listings.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-6 rounded-lg overflow-hidden border">
                {product.media && product.media.length > 0 ? (
                  <Image
                    src={product.media[0].url || "/placeholder.svg"}
                    alt={product.name || "Product image"}
                    width={800}
                    height={400}
                    className="w-full h-[300px] object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/abstract-geometric-sculpture.png"
                      target.className = "w-full h-[300px] object-cover opacity-50"
                    }}
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="details" className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Details</CardTitle>
                      <CardDescription>Detailed information about this advertising site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">ID</p>
                          <p>{product.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <Badge
                            variant="outline"
                            className={`${
                              product.deleted
                                ? "bg-red-50 text-red-700 border-red-200"
                                : product.status === "PENDING"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : product.status === "ACTIVE"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {product.deleted ? "DELETED" : product.status}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin size={16} className="text-gray-400" />
                          <p>
                            {product.type?.toLowerCase() === "rental"
                              ? product.specs_rental?.location || "Unknown Location"
                              : product.light?.location || "Unknown Location"}
                          </p>
                        </div>
                      </div>

                      {/* Add price display */}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Price</p>
                        <p className="mt-1 text-green-700 font-medium">
                          {product.price
                            ? `₱${Number(product.price).toLocaleString()} per month`
                            : "Price not available"}
                        </p>
                      </div>

                      {product.specs_rental?.geopoint && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Coordinates</p>
                          <p>
                            {product.specs_rental.geopoint[0]}, {product.specs_rental.geopoint[1]}
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Type</p>
                          <p>{product.type || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Audience Type</p>
                          <p>{product.specs_rental?.audience_type || "Unknown"}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="mt-1">{product.description || "No description available"}</p>
                      </div>

                      <Separator />

                      {product.content_type === "Dynamic" && product.cms && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">CMS Configuration</p>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="text-sm font-medium">Spots Per Loop</p>
                              <p>{product.cms.spots_per_loop || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Loops Per Day</p>
                              <p>{product.cms.loops_per_day || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {product.content_type && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Content Type</p>
                          <p className="mt-1">{product.content_type}</p>
                        </div>
                      )}

                      {product.ai_logo_tags && product.ai_logo_tags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Detected Brands</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {product.ai_logo_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="bg-gray-50">
                                <Tag className="mr-1 h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="media" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Media Gallery</CardTitle>
                      <CardDescription>Images and videos of this advertising site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {product.media && product.media.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {product.media.map((item, index) => (
                            <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                              <Image
                                src={item.url || "/placeholder.svg"}
                                alt={`Media ${index + 1}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/abstract-geometric-sculpture.png"
                                  target.className = "object-cover opacity-50"
                                }}
                              />
                              <div className="absolute bottom-2 right-2">
                                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                                  {item.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500">No media available for this product</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>History</CardTitle>
                      <CardDescription>Timeline of changes and events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {product.deleted && product.date_deleted && (
                          <div className="flex gap-4">
                            <div className="mt-0.5">
                              <AlertTriangle size={16} className="text-red-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Product Deleted</p>
                              <p className="text-xs text-gray-500">{formatDate(product.date_deleted)}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <Clock size={16} className="text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Product Updated</p>
                            <p className="text-xs text-gray-500">{formatDate(product.updated)}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <Calendar size={16} className="text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Product Created</p>
                            <p className="text-xs text-gray-500">{formatDate(product.created)}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <User size={16} className="text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Created By</p>
                            <p className="text-xs text-gray-500">{product.seller_name || "Unknown"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge
                      className={`mt-1 ${
                        product.deleted
                          ? "bg-red-50 text-red-700 border-red-200"
                          : product.status === "PENDING"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : product.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {product.deleted ? "DELETED" : product.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="mt-1">{product.type || "Unknown"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Content Type</p>
                    <p className="mt-1">{product.content_type || "Not specified"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-500">Seller</p>
                    <p className="mt-1">{product.seller_name || "Unknown"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Position</p>
                    <p className="mt-1">{product.position || "Unknown"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="mt-1">{formatDate(product.created)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="mt-1">{formatDate(product.updated)}</p>
                  </div>

                  {product.deleted && product.date_deleted && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Deleted On</p>
                      <p className="mt-1">{formatDate(product.date_deleted)}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-col gap-3 pt-2">
                    {!product.deleted && (
                      <>
                        <Button onClick={handleEdit} className="w-full">
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
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Delete Site"
            description="This site will be marked as deleted but will remain in the database. It will no longer appear in your site listings."
            itemName={product?.name}
          />
        </div>
      </div>
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
