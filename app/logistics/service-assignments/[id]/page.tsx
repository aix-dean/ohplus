"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

interface ServiceAssignmentDetailsProps {
  params: {
    id: string
  }
}

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
  content: string
  materialSpecs: string
  crew: string
  illuminationNits: string
  gondola: string
  technology: string
  sales: string
  remarks: string
  attachments: Array<{
    name: string
    type: string
  }>
}

export default function ServiceAssignmentDetails({ params }: ServiceAssignmentDetailsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Fetch service assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const assignmentDoc = await getDoc(doc(db, "service_assignments", params.id))

        if (assignmentDoc.exists()) {
          setAssignment({
            id: assignmentDoc.id,
            ...assignmentDoc.data(),
          } as ServiceAssignment)
        }
      } catch (err) {
        console.error("Error fetching service assignment:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params.id])

  // Update service assignment status
  const updateStatus = async (newStatus: string) => {
    if (!assignment || !user) return

    try {
      setUpdating(true)

      await updateDoc(doc(db, "service_assignments", assignment.id), {
        status: newStatus,
        updated: new Date(),
      })

      setAssignment({
        ...assignment,
        status: newStatus,
        updated: new Date(),
      })
    } catch (err) {
      console.error("Error updating service assignment status:", err)
    } finally {
      setUpdating(false)
    }
  }

  // Format date
  const formatDate = (date: any) => {
    if (!date) return "Not specified"
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (err) {
      return "Invalid date"
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "created":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Assignment Not Found</h2>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Service Assignment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Type and Tagged To */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type:</label>
                <p className="text-sm mt-1 text-red-600 font-medium">{assignment.serviceType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tagged to:</label>
                <p className="text-sm mt-1">{assignment.assignedTo || "Not assigned"}</p>
              </div>
            </div>

            {/* Project Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Site Information */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Site:</label>
                  <Card className="mt-2">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src="/led-billboard-1.png"
                            alt={assignment.projectSiteName}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {assignment.projectSiteId}
                          </div>
                          <div className="font-medium text-sm">{assignment.projectSiteName}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Content:</label>
                    <p className="text-sm mt-1">{assignment.content || "Lilo and Stitch"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Material Specs:</label>
                    <p className="text-sm mt-1">{assignment.materialSpecs || "Material Specs."}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Crew:</label>
                    <p className="text-sm mt-1">{assignment.crew || "Team C"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Illumination/ Nits:</label>
                    <p className="text-sm mt-1">{assignment.illuminationNits || "250 lumens"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gondola:</label>
                    <p className="text-sm mt-1">{assignment.gondola || "Yes"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Technology:</label>
                    <p className="text-sm mt-1">{assignment.technology || "Double Sided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sales:</label>
                    <p className="text-sm mt-1">{assignment.sales || "Noemi"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">SA#:</label>
                  <p className="text-sm mt-1">{assignment.saNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date:</label>
                  <p className="text-sm mt-1">{formatDate(assignment.coveredDateStart)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date:</label>
                  <p className="text-sm mt-1">{formatDate(assignment.coveredDateEnd)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Service Duration:</label>
                  <p className="text-sm mt-1">5 days</p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-sm font-medium text-gray-700">Remarks:</label>
              <Card className="mt-2">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-700">
                    {assignment.remarks || assignment.message || "Install only from 6pm to 3:00am in the morning."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Attachments */}
            <div>
              <label className="text-sm font-medium text-gray-700">Attachments:</label>
              <p className="text-sm mt-1 text-gray-500">
                {assignment.attachments && assignment.attachments.length > 0
                  ? `${assignment.attachments.length} attachment(s)`
                  : "No attachments."}
              </p>
            </div>

            {/* Requested By */}
            <div>
              <label className="text-sm font-medium text-gray-700">Requested By:</label>
              <p className="text-sm mt-1">{assignment.requestedBy?.name || "Mae Tuyan"}</p>
            </div>
          </div>

          {/* Status Tracker Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status Tracker</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Created</div>
                    <div className="text-xs text-gray-500">
                      {assignment.created
                        ? new Date(assignment.created.toDate()).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) +
                          "- " +
                          new Date(assignment.created.toDate()).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "May 25, 2025- 2:00pm"}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateStatus("Completed")}
                    disabled={updating || assignment.status.toLowerCase() === "completed"}
                  >
                    {assignment.status.toLowerCase() === "completed" ? "Completed" : "Mark as Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
