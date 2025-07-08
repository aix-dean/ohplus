"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  PenToolIcon as Tool,
  Bell,
  BarChart3,
  Users,
  Settings,
  FileCheck,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
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
  status: string
  created: any
  updated: any
  attachments: Array<{
    name: string
    type: string
  }>
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
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
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
  const calculateDuration = () => {
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
      return "Invalid duration"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4">
          <h1 className="text-lg font-semibold">Logistics- Site Information</h1>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2 mx-auto" />
            <p className="text-gray-500">Loading service assignment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4">
          <h1 className="text-lg font-semibold">Logistics- Site Information</h1>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mb-2 mx-auto" />
            <p>{error || "Service assignment not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Logistics- Site Information</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4 space-y-4">
          {/* Notification Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">New assignment created</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Status update available</span>
              </div>
              <Button variant="link" className="text-xs p-0 h-auto text-blue-600">
                See All
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">To Go</h3>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Bulletin Board
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Project Tracker
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">To Do</h3>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm bg-blue-50">
                  <Tool className="h-4 w-4 mr-2" />
                  Service Assignments
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  JOs
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  Teams and Personnel
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings and Config
                </Button>
              </div>
            </div>
          </div>

          {/* Intelligence Section */}
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                Intelligence <Zap className="h-4 w-4 ml-1" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/20 rounded p-2 mb-2">
                <div className="h-8 bg-white/30 rounded mb-1"></div>
                <div className="h-6 bg-white/20 rounded"></div>
              </div>
              <Button variant="link" className="text-xs p-0 h-auto text-white">
                See All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Back Navigation */}
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Service Assignment
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-3 space-y-6">
              {/* Service Type and Tagged Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Service Type:</span>
                    <span className="ml-2 text-red-600 font-medium">{assignment.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tagged to:</span>
                    <span className="ml-2 font-medium">{assignment.saNumber}</span>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Site:</span>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="relative w-16 h-16">
                            <Image src="/led-billboard-1.png" alt="Site" fill className="object-cover rounded" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">MAN2001</div>
                            <div className="font-medium">{assignment.projectSiteName}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">SA#:</span>
                          <div className="font-medium">{assignment.saNumber}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Start Date:</span>
                          <div className="font-medium">{formatDateOnly(assignment.coveredDateStart)}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">End Date:</span>
                          <div className="font-medium">{formatDateOnly(assignment.coveredDateEnd)}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Service Duration:</span>
                          <div className="font-medium text-red-600">{calculateDuration()}</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-600">Remarks:</span>
                        <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                          {assignment.message || assignment.jobDescription || "No remarks provided"}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-600">Requested By:</span>
                        <div className="font-medium">{assignment.requestedBy?.name || "Unknown"}</div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Content:</span>
                        <div className="font-medium">Lilo and Stitch</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Material Specs:</span>
                        <div className="font-medium">Material Specs.</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Crew:</span>
                        <div className="font-medium">Team C</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Illumination/ Nits:</span>
                        <div className="font-medium">250 lumens</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Gondola:</span>
                        <div className="font-medium">Yes</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Technology:</span>
                        <div className="font-medium">Double Sided</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Sales:</span>
                        <div className="font-medium">Noemi</div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-600">Attachments:</span>
                        <div className="text-sm text-gray-500">
                          {assignment.attachments && assignment.attachments.length > 0
                            ? `${assignment.attachments.length} file(s) attached`
                            : "No attachments."}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Tracker - Right Side */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Tracker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-xs text-gray-500">{formatDateTime(assignment.created)}</div>
                  </div>

                  <div className="space-y-2">
                    <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                  </div>

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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
