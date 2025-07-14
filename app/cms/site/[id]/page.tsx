"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Play,
  Repeat,
  Monitor,
  Settings,
  Eye,
  Download,
  Share2,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { getProductById, softDeleteProduct, type Product } from "@/lib/firebase-service"

export default function CMSSiteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const productId = params.id as string

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        setLoading(true)

        // First try to get cached data from localStorage
        const cachedData = localStorage.getItem(`cms-product-${productId}`)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            setProduct(parsedData)
            setLoading(false)
            // Clean up cached data after use
            localStorage.removeItem(`cms-product-${productId}`)
            console.log("Using cached product data for fast loading")
            return
          } catch (error) {
            console.error("Error parsing cached data:", error)
          }
        }

        // Fallback to Firebase query using existing function
        console.log("Fetching product data from Firebase...")
        const productData = await getProductById(productId)
        if (productData) {
          // Verify this product belongs to the current user's company
          if (userData?.company_id && productData.company_id !== userData.company_id) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to view this site.",
              variant: "destructive",
            })
            router.push("/cms/dashboard")
            return
          }
          setProduct(productData)
        } else {
          toast({
            title: "Error",
            description: "Site not found.",
            variant: "destructive",
          })
          router.push("/cms/dashboard")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load site details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, userData?.company_id, toast, router])

  const handleDelete = async () => {
    if (!product?.id) return

    try {
      await softDeleteProduct(product.id)
      toast({
        title: "Site deleted",
        description: `${product.name} has been successfully deleted.`,
      })
      router.push("/cms/dashboard")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleEdit = () => {
    router.push(`/cms/content/edit/${productId}`)
  }

  const handleBack = () => {
    router.push("/cms/dashboard")
  }

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Site not found</h3>
          <p className="text-muted-foreground mb-4">The requested site could not be found.</p>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Map product data for display
  const siteData = {
    id: product.id,
    title: product.name || "Untitled Site",
    type: product.type || "Billboard",
    status: product.status || "Draft",
    thumbnail: product.media?.[0]?.url || "/abstract-geometric-sculpture.png",
    productId: product.id?.substring(0, 8).toUpperCase() || "UNKNOWN",
    location: product.specs_rental?.location || "Unknown Location",
    operation: product.campaign_name || "Unassigned Campaign",
    displayHealth: product.active ? "ON" : "OFF",
    description: product.description || "No description available",
    dimensions: product.dimensions || "1920×1080",
    format: product.format || "Image",
    cms: product.cms || null,
    created:
      typeof product.created === "string"
        ? product.created
        : product.created?.toDate
          ? product.created.toDate().toLocaleDateString()
          : "Unknown",
    updated:
      typeof product.updated === "string"
        ? product.updated
        : product.updated?.toDate
          ? product.updated.toDate().toLocaleDateString()
          : "Unknown",
    author: product.seller_name || "Unknown",
    price: product.price || 0,
  }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{siteData.title}</h1>
              <p className="text-muted-foreground">Site ID: {siteData.productId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Site Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Site Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Site Preview
                  <Badge variant={siteData.status === "Published" ? "default" : "secondary"}>{siteData.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={siteData.thumbnail || "/placeholder.svg"}
                    alt={siteData.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">{siteData.title}</h3>
                  <p className="text-sm text-muted-foreground">{siteData.description}</p>
                  {siteData.price > 0 && (
                    <p className="text-lg font-semibold text-green-600">₱{siteData.price.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-sm">{siteData.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                    <p className="text-sm">{siteData.dimensions}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Format</label>
                    <p className="text-sm">{siteData.format}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Display Health</label>
                    <Badge variant={siteData.displayHealth === "ON" ? "default" : "secondary"}>
                      {siteData.displayHealth}
                    </Badge>
                  </div>
                </div>
                {product.specs_rental && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Additional Specifications</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {product.specs_rental.audience_type && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Audience Type</label>
                          <p className="text-sm">{product.specs_rental.audience_type}</p>
                        </div>
                      )}
                      {product.specs_rental.traffic_count && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Traffic Count</label>
                          <p className="text-sm">{product.specs_rental.traffic_count.toLocaleString()}</p>
                        </div>
                      )}
                      {product.specs_rental.elevation && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Elevation</label>
                          <p className="text-sm">{product.specs_rental.elevation}m</p>
                        </div>
                      )}
                      {product.specs_rental.height && product.specs_rental.width && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Physical Size</label>
                          <p className="text-sm">
                            {product.specs_rental.width}m × {product.specs_rental.height}m
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CMS Schedule */}
            {siteData.cms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    CMS Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Operating Hours</p>
                        <p className="text-sm text-muted-foreground">
                          {siteData.cms.start_time} - {siteData.cms.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Spot Duration</p>
                        <p className="text-sm text-muted-foreground">{siteData.cms.spot_duration}s</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Loops per Day</p>
                        <p className="text-sm text-muted-foreground">{siteData.cms.loops_per_day}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Spots per Loop</p>
                        <p className="text-sm text-muted-foreground">{siteData.cms.spots_per_loop}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Site Information */}
          <div className="space-y-6">
            {/* Location & Operation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Operation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-sm">{siteData.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Operation</label>
                  <p className="text-sm">{siteData.operation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Site ID</label>
                  <p className="text-sm font-mono">{siteData.productId}</p>
                </div>
                {product.categories && product.categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categories</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Site Status */}
            <Card>
              <CardHeader>
                <CardTitle>Site Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={siteData.status === "Published" ? "default" : "secondary"}>{siteData.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Display Health</span>
                  <Badge variant={siteData.displayHealth === "ON" ? "default" : "secondary"}>
                    {siteData.displayHealth}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <Badge variant={product.active ? "default" : "secondary"}>{product.active ? "Yes" : "No"}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{siteData.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{siteData.updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Author</p>
                      <p className="text-sm text-muted-foreground">{siteData.author}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Site
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Site
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  CMS Settings
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Site"
        description={`Are you sure you want to delete "${siteData.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
