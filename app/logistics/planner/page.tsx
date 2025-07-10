"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, MapPin, User, Plus } from "lucide-react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { getServiceAssignments, type ServiceAssignment } from "@/lib/firebase-service"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function LogisticsPlannerPage() {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const fetchedAssignments = await getServiceAssignments(user.uid)
        setAssignments(fetchedAssignments)
      } catch (error) {
        console.error("Error fetching service assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [user?.uid])

  // Convert assignments to calendar events
  const events = assignments.map((assignment) => ({
    id: assignment.id,
    title: `${assignment.service_type} - ${assignment.product_name || "Unknown Site"}`,
    start: assignment.start_date?.toDate() || new Date(),
    end: assignment.end_date?.toDate() || new Date(),
    resource: assignment,
  }))

  const handleSelectEvent = (event: any) => {
    // Navigate to the service assignment details page instead of opening a dialog
    router.push(`/logistics/service-assignments/${event.resource.id}`)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // You can add logic here to create a new assignment
    console.log("Selected slot:", start)
  }

  const eventStyleGetter = (event: any) => {
    const assignment = event.resource as ServiceAssignment
    let backgroundColor = "#3174ad"

    switch (assignment.status) {
      case "completed":
        backgroundColor = "#10b981"
        break
      case "in_progress":
        backgroundColor = "#f59e0b"
        break
      case "pending":
        backgroundColor = "#6b7280"
        break
      default:
        backgroundColor = "#3174ad"
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading planner...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logistics Planner</h1>
          <p className="text-gray-600">Manage and schedule service assignments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Service Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                views={["month", "week", "day"]}
                defaultView="month"
                popup
                className="bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments
              .filter((assignment) => {
                const startDate = assignment.start_date?.toDate()
                return startDate && startDate > new Date()
              })
              .slice(0, 5)
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/logistics/service-assignments/${assignment.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{assignment.service_type}</h4>
                    <Badge
                      variant={
                        assignment.status === "completed"
                          ? "default"
                          : assignment.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{assignment.product_name || "Unknown Site"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      <span>{assignment.start_date?.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{assignment.assigned_to || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              ))}
            {assignments.filter((a) => a.start_date?.toDate() && a.start_date.toDate() > new Date()).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming assignments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={selectedAssignment}
        onUpdate={(updatedAssignment) => {
          setAssignments((prev) => prev.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a)))
        }}
      />
    </div>
  )
}
