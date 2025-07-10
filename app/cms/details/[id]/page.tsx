"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, MapPin, Users, DollarSign, Eye, Edit, Trash2 } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import LoopTimeline from "@/components/loop-timeline"

interface CMSProduct {
  id: string
  name: string
  description: string
  location: string
  price: number
  status: "active" | "inactive" | "maintenance"
  type: "LED" | "Static"
  dimensions: string
  visibility: string
  traffic_count: number
  created_at: any
  company_id: string
  seller_id: string
  cms_data?: {
    start_time: string
    end_time: string
    loops_per_day: number
    spot_duration: number
  }
}

export default function CMSDetailsPage() {
  const params = useParams()
  const [product, setProduct] = useState<CMSProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return

      setLoading(true)
      try {
        const docRef = doc(db, "products", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProduct({
            id: docSnap.id,
            ...data,
          } as CMSProduct)
        } else {
          setError("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{error || "Product not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-1">Product Details & CMS Configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{product.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-medium">{formatPrice(product.price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Traffic Count</p>
                    <p className="font-medium">{product.traffic_count.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(product.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Specs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <Badge variant="outline">{product.type}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Dimensions</p>
                <p className="font-medium">{product.dimensions}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Visibility</p>
                <p className="font-medium">{product.visibility}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CMS Timeline */}
      {product.cms_data && (
        <LoopTimeline
          cmsData={product.cms_data}
          productId={product.id}
          companyId={product.company_id}
          sellerId={product.seller_id}
        />
      )}
    </div>
  )
}
