"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getJobOrderById } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Timestamp } from "firebase/firestore"

// Helper function to safely parse date values (copied from app/sales/job-orders/page.tsx)
const safeParseDate = (dateValue: string | Date | Timestamp | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  const parsedDate = new Date(dateValue);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export default function JobOrderDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJobOrder = async () => {
      if (!user?.uid || !id) {
        setError("User not authenticated or Job Order ID is missing.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const fetchedJobOrder = await getJobOrderById(id as string)
        if (fetchedJobOrder) {
          setJobOrder(fetchedJobOrder)
        } else {
          setError("Job Order not found.")
        }
      } catch (err: any) { // Explicitly type error
        console.error("Failed to fetch job order:", err)
        setError("Failed to load job order details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrder()
  }, [user?.uid, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Orders
          </Button>
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="grid gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-red-500">
        <p>{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Orders
        </Button>
      </div>
    )
  }

  if (!jobOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-gray-600">
        <p>Job Order not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Orders
        </Button>
      </div>
    )
  }

  const dateRequested = safeParseDate(jobOrder.dateRequested);
  const deadline = safeParseDate(jobOrder.deadline);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Orders
        </Button>

        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Job Order: {jobOrder.joNumber}</CardTitle>
            <p className="text-sm text-gray-600">Created by {jobOrder.requestedBy} on {dateRequested ? format(dateRequested, "MMM d, yyyy") : "N/A"}</p>
          </CardHeader>
          <CardContent className="pt-6 grid gap-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-800">Site Information</h3>
              <p><strong>Site Name:</strong> {jobOrder.siteName}</p>
              <p><strong>Site Code:</strong> {jobOrder.siteCode || "N/A"}</p>
              <p><strong>Location:</strong> {jobOrder.siteLocation || "N/A"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Job Details</h3>
              <p><strong>Type:</strong> <Badge variant="outline">{jobOrder.joType}</Badge></p>
              <p><strong>Description:</strong> {jobOrder.jobDescription || "N/A"}</p>
              <p><strong>Deadline:</strong> {deadline ? format(deadline, "MMM d, yyyy") : "N/A"}</p>
              <p><strong>Assigned To:</strong> {jobOrder.assignTo || "Unassigned"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Client Information</h3>
              <p><strong>Client Name:</strong> {jobOrder.clientName || "N/A"}</p>
              <p><strong>Client Company:</strong> {jobOrder.clientCompany || "N/A"}</p>
            </div>

            {jobOrder.message && (
              <div>
                <h3 className="font-semibold text-gray-800">Message</h3>
                <p>{jobOrder.message}</p>
              </div>
            )}

            {jobOrder.attachments && jobOrder.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800">Attachments</h3>
                <ul>
                  {jobOrder.attachments.map((attachment, index) => (
                    <li key={index}><a href={attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{attachment}</a></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-semibold text-gray-800">Status</h3>
              <Badge
                variant="default"
                className={
                  jobOrder.status === "approved"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : jobOrder.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {jobOrder.status?.toUpperCase() || "N/A"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
