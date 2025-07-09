"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  PenToolIcon as Tool,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
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
}

export default function ServiceAssignmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  // Delete service assignment
  const deleteAssignment = async () => {
    if (!assignment || !user) return

    if (!confirm("Are you sure you want to delete this service assignment? This action cannot be undone.")) {
      return
    }

    try {
      setDeleting(true)

      await deleteDoc(doc(db, "service_assignments", assignment.id))

      // Navigate back to assignments list
      router.push("/logistics/assignments")
    } catch (err) {
      console.error("Error deleting service assignment:", err)
      setError("Failed to delete service assignment")
    } finally {
      setDeleting(false)
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Helper function to get service type icon
  const getServiceTypeIcon = (type: string) => {
    const typeLower = type?.toLowerCase() || ""
    if (typeLower.includes("repair") || typeLower.includes("maintenance")) {
      return <Tool className="h-4 w-4 text-blue-600" />
    } else if (typeLower.includes("inspection") || typeLower.includes("monitoring")) {
      return <FileText className="h-4 w-4 text-green-600" />
    } else if (typeLower.includes("emergency")) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
    return <User className="h-4 w-4 text-blue-600" />
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

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
          <p className="text-gray-500">Loading service assignment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center py-16 text-red-500">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p>{error}</p>
          <Button variant="outline" onClick={() => router.push("/logistics/assignments")} className="mt-4">
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p>Service assignment not found</p>
          <Button variant="outline" onClick={() => router.push("/logistics/assignments")} className="mt-4">
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/logistics/assignments")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Service Assignment
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/logistics/assignments/edit/${assignment.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={deleteAssignment} disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Service Type and Tagged Info */}
          <div className="flex gap-8">
            <div>
              <div className="text-sm font-medium text-gray-500">Service Type:</div>
              <div className="flex items-center gap-2 mt-1">
                {getServiceTypeIcon(assignment.serviceType)}
                <span className="font-medium">{assignment.serviceType}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Tagged to:</div>
              <div className="font-medium mt-1">SA_{assignment.saNumber}</div>
            </div>
          </div>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Site:</div>
                <div className="flex items-start gap-3">
                  <img
                    src="/placeholder.svg?height=60&width=60"
                    alt="Project site"
                    className="w-15 h-15 rounded-md object-cover"
                  />
                  <div>
                    <div className="font-medium">{assignment.projectSiteName}</div>
                    <div className="text-sm text-gray-500">{assignment.projectSiteId}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">SA#:</div>
                  <div className="font-medium">SA{assignment.saNumber}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Content:</div>
                  <div className="font-medium">{assignment.jobDescription || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Start Date:</div>
                  <div className="font-medium">{formatDateOnly(assignment.coveredDateStart)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Material Specs:</div>
                  <div className="font-medium">Material Specs.</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">End Date:</div>
                  <div className="font-medium">{formatDateOnly(assignment.coveredDateEnd)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Crew:</div>
                  <div className="font-medium">{assignment.assignedTo}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Service Duration:</div>
                  <div className="font-medium">
                    {assignment.coveredDateStart && assignment.coveredDateEnd
                      ? `${Math.ceil(
                          (new Date(assignment.coveredDateEnd.toDate()).getTime() -
                            new Date(assignment.coveredDateStart.toDate()).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )} days`
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Illumination/ Nits:</div>
                  <div className="font-medium">250 lumens</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Gondola:</div>
                  <div className="font-medium">Yes</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Technology:</div>
                  <div className="font-medium">Double Sided</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Sales:</div>
                  <div className="font-medium">Noemi</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {assignment.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remarks:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">{assignment.message}</div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments:</CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.attachments && assignment.attachments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-2 w-[100px] h-[100px] flex flex-col items-center justify-center"
                    >
                      {attachment.type === "pdf" ? (
                        <>
                          <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center rounded-md mb-2">
                            <FileText size={24} />
                          </div>
                          <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md mb-2">
                            <Video size={24} className="text-gray-500" />
                          </div>
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

          {/* Requested By */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Requested By:</div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm">
                {assignment.requestedBy?.name?.[0] || "U"}
              </div>
              <div>
                <div className="font-medium">{assignment.requestedBy?.name || "Unknown User"}</div>
                <div className="text-sm text-gray-500">
                  {assignment.requestedBy?.department || "Department not specified"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {/* Service Cost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Crew Fee:</span>
                <span className="font-medium">{assignment.serviceCost?.crewFee?.toLocaleString() || "4,000"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Overtime Fee:</span>
                <span className="font-medium">{assignment.serviceCost?.overtimeFee?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Transpo:</span>
                <span className="font-medium">{assignment.serviceCost?.transpo?.toLocaleString() || "500"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Toll Fee:</span>
                <span className="font-medium">{assignment.serviceCost?.tollFee?.toLocaleString() || "500"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Meal Allowance:</span>
                <span className="font-medium">{assignment.serviceCost?.mealAllowance?.toLocaleString() || "600"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₱{assignment.serviceCost?.total?.toLocaleString() || "5,600"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-sm text-gray-500">{formatDateTime(assignment.created)}</div>
                </div>
              </div>

              {assignment.status.toLowerCase() === "completed" ? (
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-green-600 font-medium">Completed</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignment.status.toLowerCase() !== "completed" && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus("Completed")}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Mark as Complete
                    </Button>
                  )}
                  {assignment.status.toLowerCase() !== "in progress" &&
                    assignment.status.toLowerCase() !== "completed" && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => updateStatus("In Progress")}
                        disabled={updating}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Progress
                      </Button>
                    )}
                  {assignment.status.toLowerCase() !== "cancelled" && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      onClick={() => updateStatus("Cancelled")}
                      disabled={updating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
