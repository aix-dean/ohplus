"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { Skeleton } from "@/components/ui/skeleton"
import { softDeleteProduct } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

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

  const handleEdit = () => {
    if (product) {
      router.push(`/business/inventory/edit/${product.id}`)
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
