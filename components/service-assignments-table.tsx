"use client"
import { Table, Badge, Button } from "antd"
import { useRouter } from "next/navigation"

const ServiceAssignmentsTable = ({ assignments }) => {
  const router = useRouter()

  const columns = [
    {
      title: "Assignment ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, assignment) => (
        <Badge
          variant={assignment.status === "Draft" ? "secondary" : "default"}
          className={assignment.status === "Draft" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
        >
          {status || "Pending"}
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, assignment) => (
        <div>
          {assignment.status === "Draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/logistics/assignments/create?draft=${assignment.id}`)
              }}
              className="mr-2"
            >
              Continue Editing
            </Button>
          )}
          {/* Other actions here */}
        </div>
      ),
    },
  ]

  return <Table columns={columns} dataSource={assignments} />
}

export default ServiceAssignmentsTable
