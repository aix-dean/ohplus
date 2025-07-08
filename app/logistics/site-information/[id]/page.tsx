"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, User, FileText, Settings, CheckCircle } from "lucide-react"

interface ServiceAssignmentDetails {
  id: string
  saNumber?: string
  serviceType?: string
  status?: string
  alarmDate?: any
  alarmTime?: string
  coveredDateStart?: any
  coveredDateEnd?: any
  projectSiteName?: string
  projectSiteLocation?: string
  projectSiteId?: string
  assignedTo?: string
  jobDescription?: string
  message?: string
  requestedBy?: {
    name?: string
    department?: string
    id?: string
  }
  attachments?: any[]
  created?: any
  updated?: any
}

export default function LogisticSiteInformationPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<ServiceAssignmentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const docRef = doc(db, "service_assignments", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setAssignment({
            id: docSnap.id,
            ...data,
          } as ServiceAssignmentDetails)
        } else {
          console.error("No such document!")
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignmentDetails()
  }, [params.id])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">Service assignment not found.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Service Assignment
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getStatusColor(assignment.status || "")}>{assignment.status || "Unknown"}</Badge>
          {assignment.status?.toLowerCase() === "completed" && (
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Service Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Service Type:</label>
                  <p className="text-sm font-semibold text-blue-600">{assignment.serviceType || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tagged to:</label>
                  <p className="text-sm font-semibold text-blue-600">{assignment.saNumber || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Project Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Site:</label>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">{assignment.projectSiteName || "Unknown Site"}</p>
                    <p className="text-sm text-gray-600">{assignment.projectSiteLocation || "No location"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">SA#:</label>
                  <p className="font-medium">{assignment.saNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To:</label>
                  <p className="font-medium">{assignment.assignedTo || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date:</label>
                  <p className="font-medium">{formatDate(assignment.coveredDateStart)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date:</label>
                  <p className="font-medium">{formatDate(assignment.coveredDateEnd)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Alarm Time:</label>
                <p className="font-medium">{assignment.alarmTime || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          {assignment.jobDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Job Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{assignment.jobDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Message/Remarks */}
          {assignment.message && (
            <Card>
              <CardHeader>
                <CardTitle>Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{assignment.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.attachments && assignment.attachments.length > 0 ? (
                <div className="space-y-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{attachment.name || `Attachment ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No attachments.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Status Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-sm">{formatDateTime(assignment.created)}</p>
              </div>
              {assignment.updated && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Updated</label>
                  <p className="text-sm">{formatDateTime(assignment.updated)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requested By */}
          {assignment.requestedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Requested By</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{assignment.requestedBy.name || "Unknown User"}</p>
                <p className="text-sm text-gray-600">{assignment.requestedBy.department || "N/A"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
