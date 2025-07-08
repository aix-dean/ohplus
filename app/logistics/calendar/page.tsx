"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfDay,
  addHours,
} from "date-fns"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  message: string
  coveredDateStart: any
  coveredDateEnd: any
  alarmDate: any
  alarmTime: string
  status: string
  created: any
  updated: any
  attachments: Array<{
    name: string
    type: string
  }>
}

type CalendarView = "month" | "week" | "day" | "hour" | "minute"

export default function LogisticsCalendarPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<CalendarView>("month")

  // Fetch service assignments from Firebase
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)

        const assignmentsQuery = query(collection(db, "service_assignments"), orderBy("created", "desc"))

        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const assignmentsData: ServiceAssignment[] = []

        assignmentsSnapshot.forEach((doc) => {
          const data = doc.data()
          assignmentsData.push({
            id: doc.id,
            saNumber: data.saNumber || "",
            projectSiteId: data.projectSiteId || "",
            projectSiteName: data.projectSiteName || "",
            projectSiteLocation: data.projectSiteLocation || "",
            serviceType: data.serviceType || "",
            assignedTo: data.assignedTo || "",
            jobDescription: data.jobDescription || "",
            requestedBy: data.requestedBy || { id: "", name: "", department: "" },
            message: data.message || "",
            coveredDateStart: data.coveredDateStart,
            coveredDateEnd: data.coveredDateEnd,
            alarmDate: data.alarmDate,
            alarmTime: data.alarmTime || "",
            status: data.status || "pending",
            created: data.created,
            updated: data.updated,
            attachments: data.attachments || [],
          })
        })

        setAssignments(assignmentsData)
        setFilteredAssignments(assignmentsData)
      } catch (err) {
        console.error("Error fetching service assignments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [])

  // Filter assignments based on search and filters
  useEffect(() => {
    let filtered = assignments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.projectSiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.projectSiteLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.saNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Service type filter
    if (serviceTypeFilter !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.serviceType.toLowerCase() === serviceTypeFilter.toLowerCase(),
      )
    }

    setFilteredAssignments(filtered)
  }, [assignments, searchTerm, statusFilter, serviceTypeFilter])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
      case "ongoing":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get service type color
  const getServiceTypeColor = (type: string) => {
    const typeLower = type.toLowerCase()
    if (typeLower.includes("installation")) return "bg-purple-100 text-purple-800"
    if (typeLower.includes("maintenance") || typeLower.includes("repair")) return "bg-orange-100 text-orange-800"
    if (typeLower.includes("inspection") || typeLower.includes("monitoring")) return "bg-blue-100 text-blue-800"
    if (typeLower.includes("roll up") || typeLower.includes("roll down")) return "bg-green-100 text-green-800"
    if (typeLower.includes("change material")) return "bg-indigo-100 text-indigo-800"
    if (typeLower.includes("spot booking")) return "bg-pink-100 text-pink-800"
    return "bg-gray-100 text-gray-800"
  }

  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    return filteredAssignments.filter((assignment) => {
      if (!assignment.coveredDateStart) return false

      try {
        const startDate = assignment.coveredDateStart.toDate
          ? assignment.coveredDateStart.toDate()
          : new Date(assignment.coveredDateStart)
        const endDate = assignment.coveredDateEnd
          ? assignment.coveredDateEnd.toDate
            ? assignment.coveredDateEnd.toDate()
            : new Date(assignment.coveredDateEnd)
          : startDate

        return date >= startOfDay(startDate) && date <= endOfDay(endDate)
      } catch (err) {
        return false
      }
    })
  }

  // Navigation functions
  const navigatePrevious = () => {
    switch (calendarView) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addDays(currentDate, -7))
        break
      case "day":
        setCurrentDate(addDays(currentDate, -1))
        break
      case "hour":
        setCurrentDate(addHours(currentDate, -1))
        break
      case "minute":
        setCurrentDate(addMinutes(currentDate, -1))
        break
    }
  }

  const navigateNext = () => {
    switch (calendarView) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addDays(currentDate, 7))
        break
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
      case "hour":
        setCurrentDate(addHours(currentDate, 1))
        break
      case "minute":
        setCurrentDate(addMinutes(currentDate, 1))
        break
    }
  }

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const dayAssignments = getAssignmentsForDate(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 border border-gray-200 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isToday ? "ring-2 ring-blue-500" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? "text-gray-900" : "text-gray-400"
                } ${isToday ? "text-blue-600" : ""}`}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor:
                        getServiceTypeColor(assignment.serviceType).split(" ")[0].replace("bg-", "") + "20",
                    }}
                    onClick={() => router.push(`/logistics/assignments/${assignment.id}`)}
                  >
                    <div className="font-medium truncate">{assignment.saNumber}</div>
                    <div className="text-gray-600 truncate">{assignment.serviceType}</div>
                  </div>
                ))}
                {dayAssignments.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayAssignments.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayAssignments = getAssignmentsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div key={day.toISOString()} className="border border-gray-200 bg-white">
              <div className={`p-2 text-center border-b ${isToday ? "bg-blue-50 text-blue-600" : "bg-gray-50"}`}>
                <div className="text-sm font-medium">{format(day, "EEE")}</div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>

              <div className="p-2 space-y-1 min-h-[200px]">
                {dayAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="text-xs p-2 rounded cursor-pointer hover:opacity-80 border-l-2"
                    style={{
                      backgroundColor:
                        getServiceTypeColor(assignment.serviceType).split(" ")[0].replace("bg-", "") + "20",
                      borderLeftColor: getServiceTypeColor(assignment.serviceType)
                        .split(" ")[0]
                        .replace("bg-", "")
                        .replace("100", "500"),
                    }}
                    onClick={() => router.push(`/logistics/assignments/${assignment.id}`)}
                  >
                    <div className="font-medium">{assignment.saNumber}</div>
                    <div className="text-gray-600">{assignment.serviceType}</div>
                    <div className="text-gray-500">{assignment.projectSiteName}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render day view
  const renderDayView = () => {
    const dayAssignments = getAssignmentsForDate(currentDate)

    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
        </div>

        <div className="p-4">
          {dayAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assignments scheduled for this day</div>
          ) : (
            <div className="space-y-3">
              {dayAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/logistics/assignments/${assignment.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{assignment.saNumber}</div>
                    <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{assignment.serviceType}</div>
                  <div className="text-sm text-gray-500">{assignment.projectSiteName}</div>
                  <div className="text-sm text-gray-500">{assignment.projectSiteLocation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold">Logistics Calendar</h1>
            <p className="text-sm text-gray-500">Manage service assignments calendar</p>
          </div>
        </header>
        <main className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold">Logistics Calendar</h1>
          <p className="text-sm text-gray-500">Manage service assignments calendar</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Assignment
        </Button>
      </header>

      <main className="p-4">
        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search assignments..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="roll up">Roll Up</SelectItem>
                  <SelectItem value="roll down">Roll Down</SelectItem>
                  <SelectItem value="change material">Change Material</SelectItem>
                  <SelectItem value="spot booking">Spot Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={calendarView} onValueChange={(value: CalendarView) => setCalendarView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="minute">Minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>

            <h2 className="text-lg font-semibold">
              {calendarView === "month" && format(currentDate, "MMMM yyyy")}
              {calendarView === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
              {calendarView === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
              {calendarView === "hour" && format(currentDate, "EEEE, MMMM d, yyyy h:mm a")}
              {calendarView === "minute" && format(currentDate, "EEEE, MMMM d, yyyy h:mm a")}
            </h2>

            <div className="text-sm text-gray-500">
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Calendar Views */}
        <div className="bg-white rounded-lg border border-gray-200">
          {calendarView === "month" && renderMonthView()}
          {calendarView === "week" && renderWeekView()}
          {calendarView === "day" && renderDayView()}
          {(calendarView === "hour" || calendarView === "minute") && renderDayView()}
        </div>

        <ServiceAssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            // Refresh assignments after successful creation
            window.location.reload()
          }}
        />
      </main>
    </div>
  )
}

// Helper function for endOfDay (since it's not imported)
function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

// Helper function for addMinutes (since it's not imported)
function addMinutes(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + amount)
  return result
}
