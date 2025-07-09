"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, Users, Monitor, ArrowLeft, Settings, Play, Pause, RotateCcw } from "lucide-react"
import Link from "next/link"
import { getProductById, type Product } from "@/lib/firebase-service"
import LoopTimeline from "@/components/loop-timeline"
import { useAuth } from "@/contexts/auth-context"

export default function CMSDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      setLoading(true)
      try {
        const productData = await getProductById(productId)
        if (productData) {
          setProduct(productData)
        } else {
          setError("Product not found")
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading product details...</span>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-gray-600">{error || "Product not found"}</p>
              <Link href="/cms/dashboard">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatLocation = (location: string) => {
    return location.length > 50 ? location.substring(0, 50) + "..." : location
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cms/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Content Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.active ? "default" : "secondary"}>{product.active ? "Active" : "Inactive"}</Badge>
          <Badge variant="outline">{product.content_type || "Digital"}</Badge>
        </div>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Screen Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatLocation(product.specs_rental?.location || "Not specified")}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <div className="text-sm font-semibold mt-1">{formatPrice(product.price)}</div>
              </div>
            </div>

            {product.specs_rental && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                  <div className="text-sm mt-1">
                    {product.specs_rental.width && product.specs_rental.height
                      ? `${product.specs_rental.width}W × ${product.specs_rental.height}H`
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Traffic Count</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {product.specs_rental.traffic_count
                        ? product.specs_rental.traffic_count.toLocaleString()
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {product.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1 text-muted-foreground">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CMS Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              CMS Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.cms ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Loop Schedule</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {product.cms.start_time} - {product.cms.end_time}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Spot Duration</label>
                    <div className="text-sm font-semibold mt-1">{product.cms.spot_duration}s</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loops/Day</label>
                    <div className="text-sm font-semibold mt-1">{product.cms.loops_per_day}</div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Loop Status</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No CMS configuration found</p>
                <Button size="sm" className="mt-2">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure CMS
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loop Timeline */}
      {product.cms && (
        <LoopTimeline
          cmsData={product.cms}
          productId={product.id}
          companyId={product.company_id}
          sellerId={product.seller_id}
        />
      )}
    </div>
  )
}
