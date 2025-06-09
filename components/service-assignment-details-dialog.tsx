"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  PenToolIcon as Tool,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface ServiceAssignmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId?: string | null
  assignment?: ServiceAssignment | null
  onStatusChange?: () => void
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
  attachments: Array<{
    name: string
    type: string
  }>
}

export function ServiceAssignmentDetailsDialog({
  open,
  onOpenChange,
  assignmentId,
  assignment: initialAssignment,
  onStatusChange,
}: ServiceAssignmentDetailsDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch service assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      if (initialAssignment) {
        setAssignment(initialAssignment)
        setLoading(false)
        return
      }

      if (!assignmentId || !open) {
        setAssignment(null)
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
  }, [assignmentId, initialAssignment, open])

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

      // Notify parent component
      if (onStatusChange) {
        onStatusChange()
      }
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

      // Close dialog and notify parent component
      onOpenChange(false)
      if (onStatusChange) {
        onStatusChange()
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <p className="text-gray-500">Loading service assignment details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-500">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : assignment ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">Service Assignment Details</DialogTitle>
                <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
              </div>
              <DialogDescription>
                SA#{assignment.saNumber} • Created {formatDateTime(assignment.created)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Project Site Information */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium text-sm mb-2">Project Site</h3>
                <div className="text-sm font-medium">{assignment.projectSiteName}</div>
                <div className="flex items-start text-xs text-gray-600 mt-1">
                  <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{assignment.projectSiteLocation || "Location not specified"}</span>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="font-medium text-sm mb-2">Service Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Service Type</div>
                    <div className="flex items-center text-sm">
                      <span className="mr-1">{getServiceTypeIcon(assignment.serviceType)}</span>
                      {assignment.serviceType || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="text-sm">{assignment.assignedTo || "Unassigned"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Job Description</div>
                    <div className="text-sm whitespace-pre-line">
                      {assignment.jobDescription || "No description provided"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="font-medium text-sm mb-2">Schedule</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Start Date</div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDateOnly(assignment.coveredDateStart)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End Date</div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDateOnly(assignment.coveredDateEnd)}
                    </div>
                  </div>
                  {assignment.alarmDate && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Alarm</div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateOnly(assignment.alarmDate)} {assignment.alarmTime || ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requester Information */}
              <div>
                <h3 className="font-medium text-sm mb-2">Requested By</h3>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs mr-2">
                    {assignment.requestedBy?.name?.[0] || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{assignment.requestedBy?.name || "Unknown User"}</div>
                    <div className="text-xs text-gray-500">
                      {assignment.requestedBy?.department || "Department not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              {assignment.message && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Message</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-line">{assignment.message}</div>
                </div>
              )}

              {/* Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Attachments</h3>
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
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-500 mt-2">
                <div>Created: {formatDateTime(assignment.created)}</div>
                {assignment.updated && <div>Last updated: {formatDateTime(assignment.updated)}</div>}
              </div>
            </div>

            <Separator />

            <DialogFooter className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {assignment.status.toLowerCase() !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => updateStatus("Completed")}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    <span>Mark Complete</span>
                  </Button>
                )}
                {assignment.status.toLowerCase() !== "in progress" &&
                  assignment.status.toLowerCase() !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => updateStatus("In Progress")}
                      disabled={updating}
                    >
                      <Clock className="h-3 w-3" />
                      <span>Start</span>
                    </Button>
                  )}
                {assignment.status.toLowerCase() !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateStatus("Cancelled")}
                    disabled={updating}
                  >
                    <XCircle className="h-3 w-3" />
                    <span>Cancel</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/operations/assignments/edit/${assignment.id}`)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={deleteAssignment} disabled={deleting}>
                      {deleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p>No service assignment selected</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
