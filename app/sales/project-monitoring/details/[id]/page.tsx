"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useParams } from "next/navigation"

interface JobOrder {
  id: string
  joNumber: string
  product_id: string
  company_id: string
  status: string
  createdAt: any
  updatedAt: any
  description?: string
  [key: string]: any
}

export default function JobOrderDetailsPage() {
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()

  useEffect(() => {
    const fetchJobOrder = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const jobOrderRef = doc(db, "job_orders", params.id as string)
        const docSnapshot = await getDoc(jobOrderRef)

        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          setJobOrder({ id: docSnapshot.id, ...data } as JobOrder)
        } else {
          setError("Job order not found")
        }
      } catch (error) {
        console.error("Error fetching job order:", error)
        setError("Error loading job order details")
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrder()
  }, [params.id])

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown"

    try {
      let date: Date

      if (timestamp?.toDate) {
        date = timestamp.toDate()
      } else if (timestamp) {
        date = new Date(timestamp)
      } else {
        return "Unknown"
      }

      if (isNaN(date.getTime())) {
        return "Unknown"
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Unknown"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    } as const

    return (
      <Badge className={statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800"}>
        {status || "Unknown"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sales/project-monitoring">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Job Order Details</h1>
            <p className="text-muted-foreground">Loading job order information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !jobOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sales/project-monitoring">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Job Order Details</h1>
            <p className="text-muted-foreground text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales/project-monitoring">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Job Order Details</h1>
          <p className="text-muted-foreground">View job order information</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Job Order Number</label>
              <p className="text-sm font-medium">Job Order #: {jobOrder.joNumber || jobOrder.id.slice(-6)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">{getStatusBadge(jobOrder.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{formatDate(jobOrder.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-sm">{formatDate(jobOrder.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {jobOrder.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{jobOrder.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Additional job order details will be displayed here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
