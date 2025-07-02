"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"

// Types for our calendar data
type ServiceAssignment = {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  serviceType: string
  coveredDateStart: Date | null
  coveredDateEnd: Date | null
  status: string
  location: string
  notes: string
  assignedTo: string
}

type LogisticsEvent = {
  id: string
  title: string
  date: Date
  type: string
  assignedTo: string
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled"
}

type CalendarViewType = "month" | "week" | "day" | "hour" | "minute"

// Helper functions for date manipulation
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

const mockLogisticsEvents: LogisticsEvent[] = [
  {
    id: "1",
    title: "LED Billboard Maintenance - EDSA",
    date: new Date(2024, 6, 15),
    type: "Maintenance",
    assignedTo: "Jonathan",
    status: "Scheduled",
  },
  {
    id: "2",
    title: "Content Update - SM Megamall Kiosk",
    date: new Date(2024, 6, 20),
    type: "Content Update",
    assignedTo: "May",
    status: "In Progress",
  },
  {
    id: "3",
    title: "New Billboard Installation - C5",
    date: new Date(2024, 6, 30),
    type: "Installation",
    assignedTo: "Chona",
    status: "Completed",
  },
  {
    id: "4",
    title: "Vehicle Inspection - Fleet Depot",
    date: new Date(2024, 7, 5),
    type: "Vehicle Maintenance",
    assignedTo: "Jonathan",
    status: "Scheduled",
  },
  {
    id: "5",
    title: "Emergency Repair - SLEX Billboard",
    date: new Date(2024, 7, 10),
    type: "Repair",
    assignedTo: "May",
    status: "In Progress",
  },
  {
    id: "6",
    title: "Site Survey - New Location",
    date: new Date(2024, 7, 12),
    type: "Site Survey",
    assignedTo: "Chona",
    status: "Scheduled",
  },
]

export default function LogisticsPlannerPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filterType, setFilterType] = useState("All")
  const [filterAssignedTo, setFilterAssignedTo] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [serviceAssignmentDialogOpen, setServiceAssignmentDialogOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)

  const assignedToOptions = ["All", ...new Set(assignments.map((e) => e.assignedTo))]

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.projectSiteName
        .toLowerCase()
        .includes(selectedDate ? format(selectedDate, "PPP").toLowerCase() : "") ||
      assignment.saNumber.toLowerCase().includes(selectedDate ? format(selectedDate, "PPP").toLowerCase() : "") ||
      assignment.serviceType.toLowerCase().includes(selectedDate ? format(selectedDate, "PPP").toLowerCase() : "") ||
      assignment.location?.toLowerCase().includes(selectedDate ? format(selectedDate, "PPP").toLowerCase() : "") ||
      assignment.assignedTo?.toLowerCase().includes(selectedDate ? format(selectedDate, "PPP").toLowerCase() : "")
    const matchesType = filterType === "All" || assignment.serviceType === filterType
    const matchesAssignedTo = filterAssignedTo === "All" || assignment.assignedTo === filterAssignedTo
    const matchesStatus = filterStatus === "All" || assignment.status === filterStatus
    const matchesDate = selectedDate ? assignment.coveredDateEnd?.toDateString() === selectedDate.toDateString() : true
    return matchesSearch && matchesType && matchesAssignedTo && matchesStatus && matchesDate
  })

  // Fetch service assignments
  const fetchAssignments = useCallback(async () => {
    if (!userData?.license_key) return

    try {
      setLoading(true)
      const assignmentsRef = collection(db, "service_assignments")
      const q = query(assignmentsRef, where("project_key", "==", userData.license_key))
      const querySnapshot = await getDocs(q)

      const fetchedAssignments: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Convert Firestore timestamps to Date objects
        const coveredDateStart = data.coveredDateStart?.toDate
          ? data.coveredDateStart.toDate()
          : data.coveredDateStart
            ? new Date(data.coveredDateStart)
            : null

        const coveredDateEnd = data.coveredDateEnd?.toDate
          ? data.coveredDateEnd.toDate()
          : data.coveredDateEnd
            ? new Date(data.coveredDateEnd)
            : null

        fetchedAssignments.push({
          id: doc.id,
          saNumber: data.saNumber || "",
          projectSiteId: data.projectSiteId || "",
          projectSiteName: data.projectSiteName || "",
          serviceType: data.serviceType || "",
          coveredDateStart,
          coveredDateEnd,
          status: data.status || "",
          location: data.location || "",
          notes: data.notes || "",
          assignedTo: data.assignedTo || "",
        })
      })

      setAssignments(fetchedAssignments)
    } catch (error) {
      console.error("Error fetching service assignments:", error)
    } finally {
      setLoading(false)
    }
  }, [userData?.license_key])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Logistics Planner</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
                className="w-full rounded-lg bg-background pl-8"
                value={selectedDate ? format(selectedDate, "PPP") : ""}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Type: {filterType} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Maintenance")}>Maintenance</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Content Update")}>Content Update</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Installation")}>Installation</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Vehicle Maintenance")}>
                  Vehicle Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Repair")}>Repair</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Site Survey")}>Site Survey</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Assigned To: {filterAssignedTo} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {assignedToOptions.map((person) => (
                  <DropdownMenuItem key={person} onClick={() => setFilterAssignedTo(person)}>
                    {person}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Scheduled")}>Scheduled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("In Progress")}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Completed")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Cancelled")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => setServiceAssignmentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>

        {/* Calendar and Event List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Logistics Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Events for {selectedDate ? format(selectedDate, "PPP") : "Selected Date"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-medium">SA#{assignment.saNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.serviceType} - {assignment.assignedTo} - {assignment.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id)
                        setDetailsDialogOpen(true)
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No events for this date.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ServiceAssignmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        assignmentId={selectedAssignmentId}
        onStatusChange={() => {
          // Refresh assignments after status change
          fetchAssignments()
        }}
      />
      <ServiceAssignmentDialog
        open={serviceAssignmentDialogOpen}
        onOpenChange={setServiceAssignmentDialogOpen}
        onSuccess={() => {
          // Refresh assignments after creating a new one
          fetchAssignments()
        }}
      />
    </div>
  )
}
