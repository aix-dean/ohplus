"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentsTable } from "@/components/service-assignments-table"
import { Plus, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ServiceAssignmentSuccessDialog } from "@/components/service-assignment-success-dialog"

export default function ServiceAssignmentsPage() {
   const router = useRouter()
   const { userData } = useAuth()
   const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
   const [searchQuery, setSearchQuery] = useState("")
   const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)

   const [showServiceAssignmentSuccessDialog, setShowServiceAssignmentSuccessDialog] = useState(false)
   const [createdServiceAssignmentSaNumber, setCreatedServiceAssignmentSaNumber] = useState<string>("")

   useEffect(() => {
     // Check if we just created a service assignment
     const lastCreatedServiceAssignmentSaNumber = sessionStorage.getItem("lastCreatedServiceAssignmentSaNumber")
     if (lastCreatedServiceAssignmentSaNumber) {
       setCreatedServiceAssignmentSaNumber(lastCreatedServiceAssignmentSaNumber)
       setShowServiceAssignmentSuccessDialog(true)
       // Clear the session storage
       sessionStorage.removeItem("lastCreatedServiceAssignmentId")
       sessionStorage.removeItem("lastCreatedServiceAssignmentSaNumber")
     }
   }, [])

  const handleSelectAssignment = async (id: string) => {
    router.push(`/logistics/service-assignments/${id}`)
  }

  const handleCreateAssignment = () => {
    setIsCreatingAssignment(true)
    router.push("/logistics/assignments/create")

    // Reset loading state after a short delay to ensure smooth transition
    setTimeout(() => {
      setIsCreatingAssignment(false)
    }, 1000)
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold">Service Assignments</h1>
          <p className="text-sm text-gray-500">Manage service assignments</p>
        </div>
        <Button
          onClick={handleCreateAssignment}
          disabled={isCreatingAssignment}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreatingAssignment ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreatingAssignment ? "Creating..." : "Create Assignment"}
        </Button>
      </header>

      <main className="p-4">
        <div className="mb-6">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search assignments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ServiceAssignmentsTable
          onSelectAssignment={handleSelectAssignment}
          companyId={userData?.company_id || undefined}
          searchQuery={searchQuery}
        />
      </main>

      {/* Service Assignment Success Dialog */}
      <ServiceAssignmentSuccessDialog
        open={showServiceAssignmentSuccessDialog}
        onOpenChange={setShowServiceAssignmentSuccessDialog}
        saNumber={createdServiceAssignmentSaNumber}
        onViewAssignments={() => router.push('/logistics/assignments')}
      />
    </div>
  )
}
