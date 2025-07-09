"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  User,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

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
  serviceCost?: {
    crewFee: number
    overtimeFee: number
    transpo: number
    tollFee: number
    mealAllowance: number
    total: number
  }
  content?: string
  materialSpecs?: string
  crew?: string
  illuminationNits?: string
  gondola?: string
  technology?: string
  sales?: string
  taggedTo?: string
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
      if (!assignmentId) {
        setError("Assignment ID not provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const assignmentDoc = await getDoc(doc(db, "service_assignments", assignmentId))

        if (!assignmentDoc.exists()) {
          setError("Service assignment not found")
          setAssignment(null)
        } else {
          setAssignment({
            id: assignmentDoc.id,
            ...assignmentDoc.data(),
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

  // Format date with time
  const formatDateTime = (date: any) => {
    if (!date) return "Not specified"

    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return format(dateObj, "MMM d, yyyy- h:mm a")
    } catch (err) {
      return "Invalid date"
    }
  }

  // Calculate service duration
  const calculateServiceDuration = () => {
    if (!assignment?.coveredDateStart || !assignment?.coveredDateEnd) return "Not specified"

    try {
      const startDate = assignment.coveredDateStart.toDate()
      const endDate = assignment.coveredDateEnd.toDate()
      const diffTime = Math.abs(endDate - startDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays} days`
    } catch (err) {
      return "Invalid dates"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading service assignment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push("/logistics/assignments")}>
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Service assignment not found</p>
          <Button variant="outline" onClick={() => router.push("/logistics/assignments")}>
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/logistics/assignments")}
            className="mb-4 text-gray-600 hover:text-gray-900 p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Service Assignment
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Overview */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Service Type:</span>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      {assignment.serviceType || "Installation"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tagged to:</span>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      {assignment.taggedTo || `JO_${assignment.saNumber}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <Badge
                      variant={assignment.status.toLowerCase() === "completed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {/* Site Information */}
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500 mb-3 block">Site:</span>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                    <img
                      src="/placeholder.svg?height=60&width=60"
                      alt="Project site"
                      className="w-15 h-15 rounded-lg object-cover border"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{assignment.projectSiteName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {assignment.projectSiteId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">SA#:</span>
                      <div className="text-gray-900 font-medium mt-1">SA{assignment.saNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date:</span>
                      <div className="text-gray-900 font-medium mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDateOnly(assignment.coveredDateStart)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">End Date:</span>
                      <div className="text-gray-900 font-medium mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDateOnly(assignment.coveredDateEnd)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Service Duration:</span>
                      <div className="text-gray-900 font-medium mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {calculateServiceDuration()}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Gondola:</span>
                      <div className="text-gray-900 font-medium mt-1">{assignment.gondola || "Yes"}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Content:</span>
                      <div className="text-gray-900 font-medium mt-1">{assignment.content || "Lilo and Stitch"}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Material Specs:</span>
                      <div className="text-gray-900 font-medium mt-1">
                        {assignment.materialSpecs || "Material Specs."}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Crew:</span>
                      <div className="text-gray-900 font-medium mt-1">
                        {assignment.crew || assignment.assignedTo || "Team C"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Illumination/ Nits:</span>
                      <div className="text-gray-900 font-medium mt-1">
                        {assignment.illuminationNits || "250 lumens"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Technology:</span>
                      <div className="text-gray-900 font-medium mt-1">{assignment.technology || "Double Sided"}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Sales:</span>
                      <div className="text-gray-900 font-medium mt-1">{assignment.sales || "Noemi"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remarks */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Remarks:</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-gray-700 whitespace-pre-line">
                    {assignment.message || "Install only from 6pm to 3:00am in the morning."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Attachments:</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {assignment.attachments && assignment.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {assignment.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {attachment.type === "pdf" ? (
                          <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-lg mb-2">
                            <FileText className="h-6 w-6" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg mb-2">
                            <Video className="h-6 w-6" />
                          </div>
                        )}
                        <span className="text-xs text-center text-gray-600 truncate w-full">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No attachments.</p>
                )}
              </CardContent>
            </Card>

            {/* Requested By */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Requested By:</span>
                    <div className="text-gray-900 font-medium">{assignment.requestedBy?.name || "Mae Tuyan"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Service Cost */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Service Cost</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crew Fee:</span>
                    <span className="font-medium">{assignment.serviceCost?.crewFee?.toLocaleString() || "4,000"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overtime Fee:</span>
                    <span className="font-medium">{assignment.serviceCost?.overtimeFee?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transpo:</span>
                    <span className="font-medium">{assignment.serviceCost?.transpo?.toLocaleString() || "500"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Toll Fee:</span>
                    <span className="font-medium">{assignment.serviceCost?.tollFee?.toLocaleString() || "500"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Meal Allowance:</span>
                    <span className="font-medium">
                      {assignment.serviceCost?.mealAllowance?.toLocaleString() || "600"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-semibold text-gray-900 text-lg">
                      ₱{assignment.serviceCost?.total?.toLocaleString() || "5,600"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Tracker */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Status Tracker</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-medium text-gray-900">Created</div>
                    <div className="text-sm text-gray-500">{formatDateTime(assignment.created)}</div>
                  </div>
                </div>

                {assignment.status.toLowerCase() === "completed" ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <div className="text-green-600 font-semibold text-lg">Completed</div>
                    <div className="text-sm text-gray-500 mt-1">{formatDateTime(assignment.updated)}</div>
                  </div>
                ) : (
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
                      "Mark as Complete"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
