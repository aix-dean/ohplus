"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

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
    // Hide breadcrumb navigation
    const breadcrumb =
      document.querySelector('[data-testid="breadcrumb"]') ||
      document.querySelector(".breadcrumb") ||
      document.querySelector('nav[aria-label="breadcrumb"]')
    if (breadcrumb) {
      ;(breadcrumb as HTMLElement).style.display = "none"
    }

    // Also try to hide any top navigation that shows the document ID
    const topNav =
      document.querySelector(".top-navigation") ||
      document.querySelector('[class*="breadcrumb"]') ||
      document.querySelector("header nav")
    if (topNav && topNav.textContent?.includes(params.id as string)) {
      ;(topNav as HTMLElement).style.display = "none"
    }

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

    // Cleanup function to restore breadcrumb when leaving the page
    return () => {
      const breadcrumb =
        document.querySelector('[data-testid="breadcrumb"]') ||
        document.querySelector(".breadcrumb") ||
        document.querySelector('nav[aria-label="breadcrumb"]')
      if (breadcrumb) {
        ;(breadcrumb as HTMLElement).style.display = ""
      }

      const topNav =
        document.querySelector(".top-navigation") ||
        document.querySelector('[class*="breadcrumb"]') ||
        document.querySelector("header nav")
      if (topNav) {
        ;(topNav as HTMLElement).style.display = ""
      }
    }
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

  const calculateDuration = (start: any, end: any) => {
    if (!start || !end) return "N/A"
    const startDate = start.toDate ? start.toDate() : new Date(start)
    const endDate = end.toDate ? end.toDate() : new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Service assignment not found.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <style jsx>{`
        :global(.breadcrumb),
        :global([data-testid="breadcrumb"]),
        :global(nav[aria-label="breadcrumb"]),
        :global(.top-navigation) {
          display: none !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="p-0 h-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-lg font-semibold">Service Assignment</span>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-4 space-y-6">
          {/* Service Type and Tagged to */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-900">Service Type:</span>
              <span className="ml-2 text-sm font-medium text-blue-600">{assignment.serviceType || "Installation"}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">Tagged to:</span>
              <span className="ml-2 text-sm font-medium text-blue-600">{assignment.saNumber || "JO_0531"}</span>
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Project Information</h3>

            <div>
              <span className="text-sm font-medium text-gray-900">Site:</span>
              <div className="mt-2 bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded overflow-hidden">
                    <Image
                      src="/placeholder.svg?height=48&width=48"
                      alt="Site"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">HAN20013</p>
                    <p className="text-sm font-medium text-gray-900">{assignment.projectSiteName || "Petplans NB"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-900">SA#:</span>
                <span className="ml-16 text-sm font-medium text-gray-900">{assignment.saNumber || "SA00821"}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Start Date:</span>
                <span className="ml-8 text-sm font-medium text-gray-900">
                  {formatDate(assignment.coveredDateStart)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">End Date:</span>
                <span className="ml-10 text-sm font-medium text-gray-900">{formatDate(assignment.coveredDateEnd)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Service Duration:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {calculateDuration(assignment.coveredDateStart, assignment.coveredDateEnd)}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-900">Remarks:</span>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-sm text-gray-700">
                {assignment.message || assignment.jobDescription || "Install only from 6pm to 3:00am in the morning."}
              </p>
            </div>
          </div>

          {/* Requested By */}
          <div>
            <span className="text-sm font-medium text-gray-900">Requested By:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">
              {assignment.requestedBy?.name || "Mae Tuyan"}
            </span>
          </div>
        </div>

        {/* Middle Column */}
        <div className="col-span-4 space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-900">Content:</span>
            <span className="ml-12 text-sm font-medium text-gray-900">Lilo and Stitch</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Material Specs:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">Material Specs.</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Crew:</span>
            <span className="ml-16 text-sm font-medium text-gray-900">{assignment.assignedTo || "Team C"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Illumination/ Nits:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">250 lumens</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Gondola:</span>
            <span className="ml-10 text-sm font-medium text-gray-900">Yes</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Technology:</span>
            <span className="ml-6 text-sm font-medium text-gray-900">Double Sided</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Sales:</span>
            <span className="ml-16 text-sm font-medium text-gray-900">Noemi</span>
          </div>
          <div className="pt-4">
            <span className="text-sm font-medium text-gray-900">Attachments:</span>
            <p className="mt-1 text-sm text-gray-900">
              {assignment.attachments && assignment.attachments.length > 0
                ? `${assignment.attachments.length} attachment(s)`
                : "No attachments."}
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-4">
          <div className="text-right">
            <h3 className="text-base font-semibold text-gray-900">Status Tracker</h3>
            <div className="mt-4 space-y-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">{formatDateTime(assignment.created)}</p>
              </div>
            </div>
            <div className="mt-6">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Mark as Complete</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
