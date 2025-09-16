"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentsTable } from "@/components/service-assignments-table"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function ServiceAssignmentsPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectAssignment = async (id: string) => {
    router.push(`/logistics/service-assignments/${id}`)
  }

  const handleCreateAssignment = () => {
    router.push("/logistics/assignments/create")
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold">Service Assignments</h1>
          <p className="text-sm text-gray-500">Manage service assignments</p>
        </div>
        <Button onClick={handleCreateAssignment} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Assignment
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
    </div>
  )
}
