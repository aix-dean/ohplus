"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getServiceAssignmentById, updateServiceAssignment, type ServiceAssignment } from "@/lib/firebase-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function ServiceAssignmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const assignmentId = params.id as string

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !user?.uid) return

      try {
        setLoading(true)
        const fetchedAssignment = await getServiceAssignmentById(assignmentId)
        if (fetchedAssignment) {
          setAssignment(fetchedAssignment)
        } else {
          toast({
            title: "Assignment not found",
            description: "The requested service assignment could not be found.",
            variant: "destructive",
          })
          router.push("/logistics/planner")
        }
      } catch (error) {
        console.error("Error fetching assignment:", error)
        toast({
          title: "Error",
          description: "Failed to load service assignment details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [assignmentId, user?.uid, router, toast])

  const handleMarkComplete = async () => {
    if (!assignment) return

    try {
      setUpdating(true)
      const updatedAssignment = {
        ...assignment,
        status: "completed" as const,
        completed_date: new Date(),
      }

      await updateServiceAssignment(assignment.id, updatedAssignment)
      setAssignment(updatedAssignment)

      toast({
        title: "Assignment completed",
        description: "The service assignment has been marked as complete.",
      })
    } catch (error) {
      console.error("Error updating assignment:", error)
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading assignment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Assignment not found</h2>
          <p className="text-gray-600 mb-4">The requested service assignment could not be found.</p>
          <Button onClick={() => router.push("/logistics/planner")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Planner
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (date: any) => {
    if (!date) return "Not specified"
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/logistics/planner")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Service Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Type and Tagged To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Service Type:</label>
              <p className="text-lg font-semibold text-red-600">{assignment.service_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tagged to:</label>
              <p className="text-lg font-semibold">{assignment.product_id || "Not specified"}</p>
            </div>
          </div>

          {/* Project Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/placeholder.svg?height=80&width=80"
                      alt="Site"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{assignment.product_id}</div>
                    <h4 className="font-semibold text-lg">{assignment.product_name || "Petplans NB"}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">SA#:</label>
                <p className="font-semibold">{assignment.id.substring(0, 8)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date:</label>
                <p className="font-semibold">{formatDate(assignment.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date:</label>
                <p className="font-semibold">{formatDate(assignment.end_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Service Duration:</label>
                <p className="font-semibold">
                  {assignment.start_date && assignment.end_date
                    ? `${Math.ceil(
                        (assignment.end_date.toDate().getTime() - assignment.start_date.toDate().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )} days`
                    : "Not specified"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Content:</label>
                <p className="font-semibold">{assignment.content || "Lilo and Stitch"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Material Specs:</label>
                <p className="font-semibold">{assignment.material_specs || "Material Specs."}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Crew:</label>
                <p className="font-semibold">{assignment.assigned_to || "Team C"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Illumination/ Nits:</label>
                <p className="font-semibold">{assignment.illumination || "250 lumens"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gondola:</label>
                <p className="font-semibold">{assignment.gondola || "Yes"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Technology:</label>
                <p className="font-semibold">{assignment.technology || "Double Sided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Sales:</label>
                <p className="font-semibold">{assignment.sales || "Noemi"}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Remarks:</label>
            <Card>
              <CardContent className="p-4">
                <p className="text-gray-700">
                  {assignment.remarks || "Install only from 6pm to 3:00am in the morning."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Attachments:</label>
            <p className="text-gray-500">No attachments.</p>
          </div>

          {/* Requested By */}
          <div>
            <label className="text-sm font-medium text-gray-600">Requested By:</label>
            <p className="font-semibold">{assignment.requested_by || "Mae Tuyan"}</p>
          </div>
        </div>

        {/* Status Tracker Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status Tracker</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm text-gray-500">
                    {assignment.created_date ? formatDate(assignment.created_date) : "May 25, 2025-2:00pm"}
                  </p>
                </div>

                <Button
                  onClick={handleMarkComplete}
                  disabled={updating || assignment.status === "completed"}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {updating ? "Updating..." : assignment.status === "completed" ? "Completed" : "Mark as Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
