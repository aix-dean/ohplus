"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  message: string
  coveredDateStart: any
  coveredDateEnd: any
  alarmDate: any
  alarmTime: string
  status: string
  created: any
  updated: any
  attachments: Array<{
    name: string
    type: string
  }>
  // Additional fields for the detailed view
  taggedTo?: string
  content?: string
  materialSpecs?: string
  crew?: string
  illumination?: string
  gondola?: boolean
  technology?: string
  sales?: string
}

export default function ServiceAssignmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const assignmentId = params.id as string

  // Fetch service assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return

      try {
        setLoading(true)
        setError(null)

        const assignmentDoc = await getDoc(doc(db, "service_assignments", assignmentId))

        if (!assignmentDoc.exists()) {
          setError("Service assignment not found")
          setAssignment(null)
        } else {
          const data = assignmentDoc.data()
          setAssignment({
            id: assignmentDoc.id,
            saNumber: data.saNumber || "",
            projectSiteId: data.projectSiteId || "",
            projectSiteName: data.projectSiteName || "",
            projectSiteLocation: data.projectSiteLocation || "",
            serviceType: data.serviceType || "",
            assignedTo: data.assignedTo || "",
            jobDescription: data.jobDescription || "",
            requestedBy: data.requestedBy || { id: "", name: "", department: "" },
            message: data.message || "",
            coveredDateStart: data.coveredDateStart,
            coveredDateEnd: data.coveredDateEnd,
            alarmDate: data.alarmDate,
            alarmTime: data.alarmTime || "",
            status: data.status || "",
            created: data.created,
            updated: data.updated,
            attachments: data.attachments || [],
            // Additional fields
            taggedTo: data.taggedTo || "",
            content: data.content || "",
            materialSpecs: data.materialSpecs || "",
            crew: data.crew || "",
            illumination: data.illumination || "",
            gondola: data.gondola || false,
            technology: data.technology || "",
            sales: data.sales || "",
          } as ServiceAssignment)
        }
      } catch (err) {
        console.error("Error fetching service assignment:", err)
        setError("Failed to load service assignment details")
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [assignmentId])

  // Update service assignment status
  const updateStatus = async (newStatus: string) => {
    if (!assignment || !user) return

    try {
      setUpdating(true)

      await updateDoc(doc(db, "service_assignments", assignment.id), {
        status: newStatus,
        updated: new Date(),
      })

      // Update local state
      setAssignment({
        ...assignment,
        status: newStatus,
        updated: new Date(),
      })
    } catch (err) {
      console.error("Error updating service assignment status:", err)
      setError("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Format date with time
  const formatDateTime = (date: any) => {
    if (!date) return "Not specified"

    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return format(dateObj, "MMM d, yyyy h:mm a")
    } catch (err) {
      return "Invalid date"
    }
  }

  // Format date only
  const formatDateOnly = (date: any) => {
    if (!date) return "Not specified"

    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return format(dateObj, "MMM d, yyyy")
    } catch (err) {
      return "Invalid date"
    }
  }

  // Calculate service duration
  const getServiceDuration = () => {
    if (!assignment?.coveredDateStart || !assignment?.coveredDateEnd) return "Not specified"

    try {
      const startDate = assignment.coveredDateStart.toDate
        ? assignment.coveredDateStart.toDate()
        : new Date(assignment.coveredDateStart)
      const endDate = assignment.coveredDateEnd.toDate
        ? assignment.coveredDateEnd.toDate()
        : new Date(assignment.coveredDateEnd)

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`
    } catch (err) {
      return "Invalid dates"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
          <p className="text-gray-500">Loading service assignment details...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12 text-red-500">
          <XCircle className="h-8 w-8 mb-2" />
          <p>{error || "Service assignment not found"}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Service Assignment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Type and Tagged To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type:</label>
                <p className="text-base mt-1">{assignment.serviceType || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tagged to:</label>
                <p className="text-base mt-1">{assignment.taggedTo || "Not specified"}</p>
              </div>
            </div>

            {/* Project Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Project Information</h3>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Site:</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="/placeholder.svg?height=64&width=64&text=Site"
                        alt="Site"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.projectSiteName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {assignment.projectSiteLocation || "Location not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">SA#:</label>
                    <p className="text-base mt-1">{assignment.saNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date:</label>
                    <p className="text-base mt-1">{formatDateOnly(assignment.coveredDateStart)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End Date:</label>
                    <p className="text-base mt-1">{formatDateOnly(assignment.coveredDateEnd)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service Duration:</label>
                    <p className="text-base mt-1">{getServiceDuration()}</p>
                  </div>
                </div>

                {assignment.message && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Remarks:</label>
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm whitespace-pre-line">{assignment.message}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Requested By:</label>
                  <p className="text-base mt-1">{assignment.requestedBy?.name || "Unknown User"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Content:</label>
                  <p className="text-base mt-1">{assignment.content || "Not specified"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Material Specs:</label>
                  <p className="text-base mt-1">{assignment.materialSpecs || "Not specified"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Crew:</label>
                  <p className="text-base mt-1">{assignment.crew || assignment.assignedTo || "Not assigned"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Illumination/ Nits:</label>
                  <p className="text-base mt-1">{assignment.illumination || "Not specified"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Gondola:</label>
                  <p className="text-base mt-1">{assignment.gondola ? "Yes" : "No"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Technology:</label>
                  <p className="text-base mt-1">{assignment.technology || "Not specified"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sales:</label>
                  <p className="text-base mt-1">{assignment.sales || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Attachments:</h3>
                {assignment.attachments && assignment.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {assignment.attachments.map((attachment, index) => (
                      <div key={index} className="border rounded-md p-3 flex flex-col items-center justify-center h-24">
                        {attachment.type === "pdf" ? (
                          <>
                            <FileText className="h-6 w-6 text-red-500 mb-1" />
                            <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-6 w-6 text-gray-500 mb-1" />
                            <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No attachments.</p>
                )}
              </CardContent>
            </Card>

            {/* Status Tracker */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status Tracker</h3>

                <div className="space-y-4">
                  <div className="text-center">
                    <Badge className={getStatusColor(assignment.status)} variant="outline">
                      {assignment.status}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-gray-500">{formatDateTime(assignment.created)}</p>
                  </div>

                  {assignment.status.toLowerCase() !== "completed" && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateStatus("Completed")}
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  )}

                  {assignment.status.toLowerCase() !== "cancelled" &&
                    assignment.status.toLowerCase() !== "completed" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                        onClick={() => updateStatus("Cancelled")}
                        disabled={updating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Assignment
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
