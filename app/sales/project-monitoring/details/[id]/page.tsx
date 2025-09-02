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
  clientCompany: string
  clientName: string
  siteName: string
  siteCode: string
  contractPeriodStart: string
  contractPeriodEnd: string
  leaseRatePerMonth: number
  totalAmount: number
  status: string
  joType: string
  assignTo: string
  product_id?: string
  // Add other fields as needed
}

interface Product {
  id: string
  name?: string
  location?: string
  site_owner?: string
  seller_name?: string
  price?: number
  status?: string
  specs_rental?: {
    location?: string
    caretaker?: string
    land_owner?: string
    site_orientation?: string
    structure_condition?: string
  }
  created?: any
  updated?: any
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
    if (jobOrder) {
      return {
        site: jobOrder.siteName || jobOrder.siteCode || "Not specified",
        client: `${jobOrder.clientCompany || ""} ${jobOrder.clientName || ""}`.trim() || "Not specified",
        contractPeriod:
          jobOrder.contractPeriodStart && jobOrder.contractPeriodEnd
            ? `${formatDate(jobOrder.contractPeriodStart)} to ${formatDate(jobOrder.contractPeriodEnd)}`
            : "Not specified",
        leaseRate: jobOrder.leaseRatePerMonth
          ? `₱${jobOrder.leaseRatePerMonth.toLocaleString()}/month`
          : "Not specified",
        totalAmount: jobOrder.totalAmount ? `₱${jobOrder.totalAmount.toLocaleString()}` : "Not specified",
        status: jobOrder.status || "Not specified",
        jobType: jobOrder.joType || "Not specified",
        assignedTo: jobOrder.assignTo || "Not specified",
      }
    }

    return {
      site: "Not specified",
      client: "Not specified",
      contractPeriod: "Not specified",
      leaseRate: "Not specified",
      totalAmount: "Not specified",
      status: "Not specified",
      jobType: "Not specified",
      assignedTo: "Not specified",
    }
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
              <span className="text-gray-700">{loading ? "Loading..." : siteData.site}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Client: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.client}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Contract Period: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.contractPeriod}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Lease Rate: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.leaseRate}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Total Amount: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.totalAmount}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Status: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.status}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Job Type: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.jobType}</span>
            </div>

            <div>
              <span className="font-medium text-gray-900">Assigned To: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.assignedTo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
