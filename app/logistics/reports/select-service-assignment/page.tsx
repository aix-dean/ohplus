"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ServiceAssignment } from "@/lib/firebase-service"
import ReportTypeDialog from "@/components/report-type-dialog"

const SelectServiceAssignmentPage = () => {
  const router = useRouter()
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null)

  useEffect(() => {
    if (!userData?.company_id) {
      setLoading(false)
      return
    }

    const assignmentsRef = collection(db, "service_assignments")
    const q = query(
      assignmentsRef,
      where("company_id", "==", userData.company_id),
      orderBy("created", "desc")
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assignmentsData: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignmentsData.push({ id: doc.id, ...doc.data() } as ServiceAssignment)
      })
      setAssignments(assignmentsData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching service assignments:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userData?.company_id])

  const formatDate = (date: any) => {
    if (!date) return "-"

    // Handle Firestore Timestamp objects
    const dateObj = date?.toDate ? date.toDate() : new Date(date)

    if (isNaN(dateObj.getTime())) return "-"

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.saNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.projectSiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assignment.campaignName && assignment.campaignName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAssignmentClick = (assignment: ServiceAssignment) => {
    if (assignment.serviceType.toLowerCase() === "monitoring") {
      // For monitoring assignments, navigate directly to create report
      router.push(`/logistics/reports/create/${assignment.id}`)
    } else {
      // For other types, show the report type selection dialog
      setSelectedAssignment(assignment)
      setIsDialogOpen(true)
    }
  }

  const handleReportTypeSelect = (reportType: "progress" | "completion") => {
    if (selectedAssignment) {
      // Navigate to the create report page with the selected assignment
      router.push(`/logistics/reports/create/${selectedAssignment.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="bg-white rounded-t-lg p-4">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="w-full mx-auto">
        <h1
          className="text-lg font-medium mb-4 cursor-pointer"
          onClick={() => router.back()}
        >
          ← Select a Service Assignment
        </h1>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-6 pl-8 pr-2 py-2 rounded-full bg-white border border-gray-300 text-gray-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-t-lg overflow-hidden shadow-sm">
          <div className="grid grid-cols-8 gap-4 p-4 border-b border-gray-200 text-sm font-medium">
            <div>Date</div>
            <div>SA I.D.</div>
            <div>Type</div>
            <div>Site</div>
            <div>Campaign Name</div>
            <div>Crew</div>
            <div>Deadline</div>
            <div>Status</div>
          </div>

          <div className="p-4 space-y-2">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No service assignments found
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg bg-blue-50 border border-blue-200 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleAssignmentClick(assignment)}
                >
                  <div className="grid grid-cols-8 gap-4 text-sm">
                    <div>{formatDate(assignment.coveredDateStart)}</div>
                    <div>{assignment.saNumber}</div>
                    <div>{assignment.serviceType}</div>
                    <div>{assignment.projectSiteName}</div>
                    <div>{assignment.campaignName || "-"}</div>
                    <div>{assignment.assignedTo}</div>
                    <div>{formatDate(assignment.coveredDateEnd)}</div>
                    <div className="capitalize">{assignment.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ReportTypeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelectReport={handleReportTypeSelect}
        />
      </div>
    </div>
  )
}

export default SelectServiceAssignmentPage