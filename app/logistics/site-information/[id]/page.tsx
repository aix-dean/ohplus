"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    )
  }

  const calculateServiceDuration = (start: any, end: any) => {
    if (!start || !end) return "N/A"
    const startDate = start.toDate ? start.toDate() : new Date(start)
    const endDate = end.toDate ? end.toDate() : new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="p-0 hover:bg-transparent">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-lg font-semibold">Service Assignment</span>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-4 space-y-6">
          {/* Service Type and Tagged to */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Service Type:</span>
              <span className="text-blue-600 font-medium">{assignment.serviceType || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Tagged to:</span>
              <span className="text-blue-600 font-medium">{assignment.saNumber || "N/A"}</span>
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Project Information</h3>

            {/* Site */}
            <div className="space-y-2">
              <span className="font-semibold">Site:</span>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/placeholder.svg?height=64&width=64" alt="Site" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {assignment.projectSiteId || "SITE001"}
                  </div>
                  <div className="font-medium">{assignment.projectSiteName || "Unknown Site"}</div>
                </div>
              </div>
            </div>

            {/* SA#, Dates, Duration */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">SA#:</span>
                <span>{assignment.saNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Start Date:</span>
                <span>{formatDate(assignment.coveredDateStart)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">End Date:</span>
                <span>{formatDate(assignment.coveredDateEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Service Duration:</span>
                <span>{calculateServiceDuration(assignment.coveredDateStart, assignment.coveredDateEnd)}</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <span className="font-semibold">Remarks:</span>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-blue-600">
                {assignment.message || assignment.jobDescription || "No remarks provided."}
              </p>
            </div>
          </div>

          {/* Requested By */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Requested By:</span>
            <span>{assignment.requestedBy?.name || "Unknown User"}</span>
          </div>
        </div>

        {/* Middle Column */}
        <div className="col-span-4 space-y-4">
          <div className="flex justify-between">
            <span className="font-semibold">Content:</span>
            <span className="text-red-600">Lilo and Stitch</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Material Specs:</span>
            <span>Material Specs.</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Crew:</span>
            <span>{assignment.assignedTo || "Team C"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Illumination/ Nits:</span>
            <span>250 lumens</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Gondola:</span>
            <span>Yes</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Technology:</span>
            <span className="text-blue-600">Double Sided</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Sales:</span>
            <span>Noemi</span>
          </div>

          {/* Attachments */}
          <div className="space-y-2 pt-4">
            <span className="font-semibold">Attachments:</span>
            <p className="text-sm">
              {assignment.attachments && assignment.attachments.length > 0
                ? `${assignment.attachments.length} attachment(s)`
                : "No attachments."}
            </p>
          </div>
        </div>

        {/* Right Column - Status Tracker */}
        <div className="col-span-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Status Tracker</h3>

            <div className="space-y-2">
              <div className="font-semibold">Created</div>
              <div className="text-sm text-gray-600">{formatDateTime(assignment.created)}</div>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg">
              Mark as Complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
