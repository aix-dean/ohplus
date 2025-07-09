"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentsTable } from "@/components/service-assignments-table"
import { Plus, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { getDoc, doc } from "firebase/firestore"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"

import { db } from "@/lib/firebase"

export default function ServiceAssignmentsPage() {
  const router = useRouter()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const handleSelectAssignment = async (id) => {
    try {
      const assignmentDoc = await getDoc(doc(db, "service_assignments", id))
      if (assignmentDoc.exists()) {
        setSelectedAssignment({
          id: assignmentDoc.id,
          ...assignmentDoc.data(),
        })
        setSelectedAssignmentId(id)
        setDetailsDialogOpen(true)
      }
    } catch (err) {
      console.error("Error fetching assignment:", err)
    }
  }

  const handleCreateAssignment = () => {
    router.push("/logistics/assignments/create")
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold">Service Assignments</h1>
          <p className="text-sm text-gray-500">Manage service assignments</p>
        </div>
        <Button onClick={handleCreateAssignment} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Assignment
        </Button>
      </header>

      <main className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search assignments..." className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

        <ServiceAssignmentsTable onSelectAssignment={handleSelectAssignment} />

        <ServiceAssignmentDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          assignmentId={selectedAssignmentId}
          assignment={selectedAssignment}
          onStatusChange={() => {
            // You could add a refresh function here
          }}
        />
      </main>
    </div>
  )
}
