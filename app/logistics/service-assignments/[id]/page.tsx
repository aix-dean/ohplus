"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import Image from "next/image"

type Props = {
  params: { id: string }
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
  attachments: Array<{
    name: string
    type: string
  }>
  status: string
  created: any
  updated: any
}

export default function ServiceAssignmentDetailsPage({ params }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Fetch service assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        setError(null)

        const assignmentDoc = await getDoc(doc(db, "service_assignments", params.id))

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
            attachments: data.attachments || [],
            status: data.status || "",
            created: data.created,
            updated: data.updated,
          })
        }
      } catch (err) {
        console.error("Error fetching service assignment:", err)
        setError("Failed to load service assignment details")
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params.id])

  // Update service assignment status
  const markAsComplete = async () => {
    if (!assignment || !user) return

    try {
      setUpdating(true)

      await updateDoc(doc(db, "service_assignments", assignment.id), {
        status: "Completed",
        updated: new Date(),
      })

      // Update local state
      setAssignment({
        ...assignment,
        status: "Completed",
        updated: new Date(),
      })
    } catch (err) {
      console.error("Error updating service assignment status:", err)
      setError("Failed to update status")
    } finally {
      setUpdating(false)
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

      return diffDays === 1 ? "1 day" : `${diffDays} days`
    } catch (err) {
      return "Invalid duration"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Service Assignment</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Service Assignment Not Found</h2>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Service Assignment</h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Type and Tagged Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Service Type:</div>
              <div className="text-base font-medium">{assignment.serviceType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Tagged to:</div>
              <div className="text-base font-medium">{assignment.projectSiteId}</div>
            </div>
          </div>

          {/* Project Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4">Project Information</h3>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-2">Site:</div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="relative w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                    <Image src="/led-billboard-1.png" alt="Site" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="font-medium">{assignment.projectSiteName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.projectSiteLocation}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">SA#:</div>
                  <div className="font-medium">{assignment.saNumber}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Start Date:</div>
                  <div className="font-medium">{formatDateOnly(assignment.coveredDateStart)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">End Date:</div>
                  <div className="font-medium">{formatDateOnly(assignment.coveredDateEnd)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Service Duration:</div>
                  <div className="font-medium">{getServiceDuration()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Remarks:</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm">
                  {assignment.message || assignment.jobDescription || "No remarks provided."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requested By */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Requested By:</div>
            <div className="font-medium">{assignment.requestedBy?.name || "Unknown"}</div>
          </div>
        </div>

        {/* Middle Column - Additional Details */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Content:</div>
              <div className="text-sm">Lilo and Stitch</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Material Specs:</div>
              <div className="text-sm">Material Specs.</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Crew:</div>
              <div className="text-sm">{assignment.assignedTo || "Team C"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Illumination/ Nits:</div>
              <div className="text-sm">250 lumens</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Gondola:</div>
              <div className="text-sm">Yes</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Technology:</div>
              <div className="text-sm">Double Sided</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Sales:</div>
              <div className="text-sm">Noemi</div>
            </div>
          </div>

          {/* Attachments */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Attachments:</h3>
              {assignment.attachments && assignment.attachments.length > 0 ? (
                <div className="space-y-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No attachments.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status Tracker */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4">Status Tracker</h3>

              <div className="text-center mb-4">
                <div className="text-sm font-medium mb-1">Created</div>
                <div className="text-xs text-gray-500">{formatDateTime(assignment.created)}</div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={markAsComplete}
                disabled={updating || assignment.status.toLowerCase() === "completed"}
              >
                {updating
                  ? "Updating..."
                  : assignment.status.toLowerCase() === "completed"
                    ? "Completed"
                    : "Mark as Complete"}
              </Button>

              <div className="mt-4 text-center">
                <Badge
                  variant="outline"
                  className={`
                    ${
                      assignment.status.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : assignment.status.toLowerCase() === "in progress" ||
                            assignment.status.toLowerCase() === "ongoing"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : assignment.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  `}
                >
                  {assignment.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
