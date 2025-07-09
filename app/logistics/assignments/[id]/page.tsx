"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Video, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
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
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/logistics/assignments")}
            className="gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Service Assignment
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
            {/* Service Type and Tagged Info */}
            <div className="flex gap-12 mb-8">
              <div>
                <span className="text-sm font-medium text-gray-900">Service Type:</span>
                <span className="ml-2 text-sm text-gray-700">{assignment.serviceType || "Installation"}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Tagged to:</span>
                <span className="ml-2 text-sm text-gray-700">{assignment.taggedTo || `JO_${assignment.saNumber}`}</span>
              </div>
            </div>

            {/* Project Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>

              {/* Site */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">Site:</div>
                <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-xs">
                  <img
                    src="/placeholder.svg?height=48&width=48"
                    alt="Project site"
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{assignment.projectSiteName}</div>
                    <div className="text-xs text-gray-500">{assignment.projectSiteId}</div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-900">SA#:</span>
                  <div className="text-sm text-gray-700 mt-1">SA{assignment.saNumber}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Content:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.content || "Lilo and Stitch"}</div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-900">Start Date:</span>
                  <div className="text-sm text-gray-700 mt-1">{formatDateOnly(assignment.coveredDateStart)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Material Specs:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.materialSpecs || "Material Specs."}</div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-900">End Date:</span>
                  <div className="text-sm text-gray-700 mt-1">{formatDateOnly(assignment.coveredDateEnd)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Crew:</span>
                  <div className="text-sm text-gray-700 mt-1">
                    {assignment.crew || assignment.assignedTo || "Team C"}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-900">Service Duration:</span>
                  <div className="text-sm text-gray-700 mt-1">{calculateServiceDuration()}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Illumination/ Nits:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.illuminationNits || "250 lumens"}</div>
                </div>

                <div className="col-span-1">
                  <span className="text-sm font-medium text-gray-900">Gondola:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.gondola || "Yes"}</div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-900">Technology:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.technology || "Double Sided"}</div>
                </div>

                <div className="col-span-1">
                  <span className="text-sm font-medium text-gray-900">Sales:</span>
                  <div className="text-sm text-gray-700 mt-1">{assignment.sales || "Noemi"}</div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Remarks:</h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {assignment.message || "Install only from 6pm to 3:00am in the morning."}
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments:</h3>
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
                <p className="text-sm text-gray-500">No attachments.</p>
              )}
            </div>

            {/* Requested By */}
            <div>
              <span className="text-sm font-medium text-gray-900">Requested By:</span>
              <span className="ml-2 text-sm text-gray-700">{assignment.requestedBy?.name || "Mae Tuyan"}</span>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-6">
            {/* Service Cost */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Cost</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crew Fee:</span>
                    <span className="text-sm font-medium">
                      {assignment.serviceCost?.crewFee?.toLocaleString() || "4,000"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overtime Fee:</span>
                    <span className="text-sm font-medium">
                      {assignment.serviceCost?.overtimeFee?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transpo:</span>
                    <span className="text-sm font-medium">
                      {assignment.serviceCost?.transpo?.toLocaleString() || "500"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Toll Fee:</span>
                    <span className="text-sm font-medium">
                      {assignment.serviceCost?.tollFee?.toLocaleString() || "500"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Meal Allowance:</span>
                    <span className="text-sm font-medium">
                      {assignment.serviceCost?.mealAllowance?.toLocaleString() || "600"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{assignment.serviceCost?.total?.toLocaleString() || "5,600"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Tracker */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Tracker</h3>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Created</div>
                    <div className="text-xs text-gray-500">{formatDateTime(assignment.created)}</div>
                  </div>
                </div>

                {assignment.status.toLowerCase() === "completed" ? (
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-green-600 font-medium">Completed</div>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateStatus("Completed")}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Mark as Complete
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
