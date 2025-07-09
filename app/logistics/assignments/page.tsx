"use client"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentsTable } from "@/components/service-assignments-table"
import { Plus, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function ServiceAssignmentsPage() {
  const router = useRouter()

  const handleSelectAssignment = (id: string) => {
    router.push(`/logistics/assignments/${id}`)
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
      </main>
    </div>
  )
}
