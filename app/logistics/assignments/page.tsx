"use client"
import { useRouter } from "next/router"
import { Badge, Button } from "@ui/components"
import { useAssignments } from "@app/logistics/assignments/hooks"

const AssignmentsPage = () => {
  const router = useRouter()
  const { assignments } = useAssignments()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{assignment.projectSiteName}</h3>
                <p className="text-sm text-gray-600">{assignment.serviceType}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={assignment.status === "Draft" ? "secondary" : "default"}
                  className={assignment.status === "Draft" ? "bg-yellow-100 text-yellow-800" : ""}
                >
                  {assignment.status || "Pending"}
                </Badge>
                {assignment.status === "Draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/logistics/assignments/create?draft=${assignment.id}`)}
                  >
                    Continue Editing
                  </Button>
                )}
              </div>
            </div>
            {/* Additional assignment details can be added here */}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssignmentsPage
