"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, User, Clock, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getJobOrderById } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"

export default function JobOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const jobOrderId = params.id as string

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        setLoading(true)
        const fetchedJobOrder = await getJobOrderById(jobOrderId)
        if (fetchedJobOrder) {
          setJobOrder(fetchedJobOrder)
        } else {
          setError("Job order not found.")
        }
      } catch (err) {
        console.error("Failed to fetch job order:", err)
        setError("Failed to load job order details.")
      } finally {
        setLoading(false)
      }
    }

    if (jobOrderId) {
      fetchJobOrder()
    }
  }, [jobOrderId])

  const getJoTypeColor = (joType: string) => {
    switch (joType?.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair":
        return "bg-red-100 text-red-800 border-red-200"
      case "dismantling":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error || !jobOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-red-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">{error || "Job order not found"}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{jobOrder.joNumber}</h1>
              <p className="text-gray-600">{jobOrder.siteName}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${getStatusColor(jobOrder.status)} border font-medium`}>
            {jobOrder.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Job Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">JO Type</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={`${getJoTypeColor(jobOrder.joType)} border font-medium`}>
                        {jobOrder.joType}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Site Location</label>
                    <p className="mt-1 text-sm text-gray-900">{jobOrder.siteLocation}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-gray-500">Job Description</label>
                  <p className="mt-1 text-sm text-gray-900">{jobOrder.jobDescription || "No description provided"}</p>
                </div>

                {jobOrder.message && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Additional Message</label>
                      <p className="mt-1 text-sm text-gray-900">{jobOrder.message}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {jobOrder.attachments && jobOrder.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobOrder.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date Requested</p>
                    <p className="text-sm text-gray-600">
                      {jobOrder.dateRequested ? format(new Date(jobOrder.dateRequested), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Deadline</p>
                    <p className="text-sm text-gray-600">
                      {jobOrder.deadline ? format(new Date(jobOrder.deadline), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requested By</p>
                    <p className="text-sm text-gray-600">{jobOrder.requestedBy}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned To</p>
                    <p className="text-sm text-gray-600">{jobOrder.assignTo || "Unassigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-transparent" variant="outline">
                  Edit Job Order
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Assign Personnel
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Update Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
