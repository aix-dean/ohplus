"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ServiceAssignment {
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

export default function SiteInformationPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hide breadcrumb navigation
    const hideBreadcrumb = () => {
      const selectors = [
        '[data-testid="breadcrumb"]',
        ".breadcrumb",
        'nav[aria-label="breadcrumb"]',
        ".top-navigation",
        ".navigation-breadcrumb",
      ]

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.display = "none"
          }
        })
      })

      // Also hide any element that contains the document ID
      const allElements = document.querySelectorAll("*")
      allElements.forEach((element) => {
        if (
          element.textContent?.includes(params.id as string) &&
          element.textContent.includes("Admin") &&
          element.textContent.includes("Logistics")
        ) {
          if (element instanceof HTMLElement) {
            element.style.display = "none"
          }
        }
      })
    }

    hideBreadcrumb()

    // Run again after a short delay to catch dynamically loaded elements
    const timer = setTimeout(hideBreadcrumb, 500)

    return () => {
      clearTimeout(timer)
      // Restore breadcrumb when leaving the page
      const selectors = [
        '[data-testid="breadcrumb"]',
        ".breadcrumb",
        'nav[aria-label="breadcrumb"]',
        ".top-navigation",
        ".navigation-breadcrumb",
      ]

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.display = ""
          }
        })
      })
    }
  }, [params.id])

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const docRef = doc(db, "service_assignments", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setAssignment({
            id: docSnap.id,
            ...docSnap.data(),
          } as ServiceAssignment)
        } else {
          console.error("No such document!")
        }
      } catch (error) {
        console.error("Error fetching assignment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params.id])

  const handleBack = () => {
    router.back()
  }

  const handleMarkComplete = () => {
    // TODO: Implement mark as complete functionality
    console.log("Mark as complete clicked")
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const calculateServiceDuration = () => {
    if (!assignment?.coveredDateStart || !assignment?.coveredDateEnd) return "N/A"

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
    } catch (error) {
      return "N/A"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Assignment not found</div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        [data-testid="breadcrumb"],
        .breadcrumb,
        nav[aria-label="breadcrumb"],
        .top-navigation,
        .navigation-breadcrumb {
          display: none !important;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-lg font-semibold">Service Assignment</span>
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-4 space-y-6">
              {/* Service Type and Tagged To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Service Type:</span>
                  <div className="text-blue-600 font-medium">{assignment.serviceType || "N/A"}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tagged to:</span>
                  <div className="text-blue-600 font-medium">{assignment.saNumber || "N/A"}</div>
                </div>
              </div>

              {/* Project Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>

                {/* Site */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Site:</span>
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">HAN20013</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{assignment.projectSiteName || "Unknown Site"}</div>
                    </div>
                  </div>
                </div>

                {/* SA Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">SA#:</span>
                    <span className="text-gray-900">{assignment.saNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Start Date:</span>
                    <span className="text-gray-900">{formatDate(assignment.coveredDateStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">End Date:</span>
                    <span className="text-gray-900">{formatDate(assignment.coveredDateEnd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Service Duration:</span>
                    <span className="text-gray-900">{calculateServiceDuration()}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <span className="text-sm font-medium text-gray-700">Remarks:</span>
                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm text-gray-700">
                  {assignment.message || assignment.jobDescription || "No remarks provided."}
                </div>
              </div>

              {/* Requested By */}
              <div>
                <span className="text-sm font-medium text-gray-700">Requested By:</span>
                <div className="text-gray-900">{assignment.requestedBy?.name || "Unknown User"}</div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="col-span-4 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Content:</span>
                  <span className="text-gray-900">Lilo and Stitch</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Material Specs:</span>
                  <span className="text-gray-900">Material Specs.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Crew:</span>
                  <span className="text-gray-900">{assignment.assignedTo || "Team C"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Illumination/ Nits:</span>
                  <span className="text-gray-900">250 lumens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Gondola:</span>
                  <span className="text-gray-900">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Technology:</span>
                  <span className="text-gray-900">Double Sided</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Sales:</span>
                  <span className="text-gray-900">Noemi</span>
                </div>
              </div>

              {/* Attachments */}
              <div className="mt-6">
                <span className="text-sm font-medium text-gray-700">Attachments:</span>
                <div className="text-gray-900">
                  {assignment.attachments && assignment.attachments.length > 0
                    ? `${assignment.attachments.length} attachment(s)`
                    : "No attachments."}
                </div>
              </div>
            </div>

            {/* Right Column - Status Tracker */}
            <div className="col-span-4">
              <div className="text-right">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Tracker</h3>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700">Created</div>
                  <div className="text-sm text-gray-600">{formatDateTime(assignment.created)}</div>
                </div>

                <Button
                  onClick={handleMarkComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
                >
                  Mark as Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
