"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface JobOrder {
  id: string
  joNumber: string
  product_id?: string
  site?: string
  client?: string
  bookingStartDate?: any
  bookingEndDate?: any
  breakDate?: any
  sales?: string
  // Add other fields as needed
}

interface Product {
  id: string
  site?: string
  client?: string
  bookingStartDate?: any
  bookingEndDate?: any
  breakDate?: any
  sales?: string
  // Add other product fields as needed
}

export default function JobOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobOrder = async () => {
      if (!params.id) return

      try {
        const docRef = doc(db, "job_orders", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const jobOrderData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as JobOrder

          setJobOrder(jobOrderData)

          if (jobOrderData.product_id) {
            const productRef = doc(db, "products", jobOrderData.product_id)
            const productSnap = await getDoc(productRef)

            if (productSnap.exists()) {
              setProduct({
                id: productSnap.id,
                ...productSnap.data(),
              } as Product)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching job order or product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrder()
  }, [params.id])

  const formatDate = (dateField: any) => {
    if (!dateField) return "Not specified"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleDateString()
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString()
      }
      return "Not specified"
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getSiteData = () => {
    return product || jobOrder
  }

  const siteData = getSiteData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-1 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm font-medium">
          Lilo & Stitch
        </Badge>

        <span className="text-lg font-medium text-gray-900">
          {loading ? "Loading..." : jobOrder?.joNumber || "Job Order Not Found"}
        </span>
      </div>

      <div className="flex justify-start">
        <div className="flex items-start gap-4 max-w-md">
          {/* Product image placeholder */}
          <div className="flex-shrink-0">
            <img
              src="/lilo-and-stitch-product-box.png"
              alt="Product"
              className="w-20 h-20 object-cover rounded-md border"
            />
          </div>

          {/* Site information */}
          <div className="flex-1 space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-900">Site: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData?.site || "Not specified"}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Client: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData?.client || "Not specified"}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Booking Dates: </span>
              <span className="text-gray-700">
                {loading
                  ? "Loading..."
                  : `${formatDate(siteData?.bookingStartDate)} to ${formatDate(siteData?.bookingEndDate)}`}
              </span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Breakdate: </span>
              <span className="text-gray-700">{loading ? "Loading..." : formatDate(siteData?.breakDate)}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Sales: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData?.sales || "Not specified"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
