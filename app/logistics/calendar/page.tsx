"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, ZoomIn, ZoomOut, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import type { ServiceAssignment } from "@/types/service-assignment" // Import ServiceAssignment type
import { AssignmentDetailsDialog } from "@/components/assignment-details-dialog" // Import AssignmentDetailsDialog component

// Types for our calendar data
// type ServiceAssignment = {
//   id: string
//   saNumber: string
//   projectSiteId: string
//   projectSiteName: string
//   projectSiteLocation: string
//   serviceType: string
//   assignedTo: string
//   jobDescription: string
//   requestedBy: {
//     id: string
//     name: string
//     department: string
//   }
//   message: string
//   coveredDateStart: Date | null
//   coveredDateEnd: Date | null
//   alarmDate: Date | null
//   alarmTime: string
//   attachments: { name: string; type: string }[]
//   status: string
//   created: any
//   updated: any
// }

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

export default function LogisticsCalendarPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewType>("month")
  const [searchTerm, setSearchTerm] = useState("")

  const [serviceAssignmentDialogOpen, setServiceAssignmentDialogOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Fetch service assignments from Firebase
  const fetchAssignments = useCallback(async () => {
    if (!userData?.license_key) return

    try {
      setLoading(true)
      const assignmentsRef = collection(db, "service_assignments")
      const querySnapshot = await getDocs(assignmentsRef)

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

        const alarmDate = data.alarmDate?.toDate
          ? data.alarmDate.toDate()
          : data.alarmDate
            ? new Date(data.alarmDate)
            : null

        fetchedAssignments.push({
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
          coveredDateStart,
          coveredDateEnd,
          alarmDate,
          alarmTime: data.alarmTime || "",
          attachments: data.attachments || [],
          status: data.status || "",
          created: data.created,
          updated: data.updated,
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

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case "month":
        newDate.setMonth(currentDate.getMonth() - 1)
        break
      case "week":
        newDate.setDate(currentDate.getDate() - 7)
        break
      case "day":
        newDate.setDate(currentDate.getDate() - 1)
        break
      case "hour":
        newDate.setHours(currentDate.getHours() - 1)
        break
      case "minute":
        newDate.setMinutes(currentDate.getMinutes() - 15)
        break
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case "month":
        newDate.setMonth(currentDate.getMonth() + 1)
        break
      case "week":
        newDate.setDate(currentDate.getDate() + 7)
        break
      case "day":
        newDate.setDate(currentDate.getDate() + 1)
        break
      case "hour":
        newDate.setHours(currentDate.getHours() + 1)
        break
      case "minute":
        newDate.setMinutes(currentDate.getMinutes() + 15)
        break
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // View title based on current view and date
  const getViewTitle = () => {
    const options: Intl.DateTimeFormatOptions = {}

    switch (view) {
      case "month":
        options.month = "long"
        options.year = "numeric"
        break
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString([], { month: "long" })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
        } else {
          return `${weekStart.toLocaleDateString([], { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
        }
      case "day":
        options.weekday = "long"
        options.month = "long"
        options.day = "numeric"
        options.year = "numeric"
        break
      case "hour":
        options.weekday = "short"
        options.month = "short"
        options.day = "numeric"
        options.hour = "numeric"
        options.minute = "numeric"
        break
      case "minute":
        options.hour = "numeric"
        options.minute = "numeric"
        options.second = "numeric"
        return `${currentDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} at ${currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    return currentDate.toLocaleDateString([], options)
  }

  // Filter assignments based on current view
  const getFilteredAssignments = () => {
    if (!assignments.length) return []

    let filtered = [...assignments]

    // Apply search filter if any
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (assignment) =>
          assignment.projectSiteName.toLowerCase().includes(term) ||
          assignment.saNumber.toLowerCase().includes(term) ||
          assignment.serviceType.toLowerCase().includes(term) ||
          assignment.projectSiteLocation?.toLowerCase().includes(term) ||
          assignment.assignedTo?.toLowerCase().includes(term),
      )
    }

    // Filter based on current view
    switch (view) {
      case "month":
        return filtered.filter(
          (assignment) =>
            assignment.coveredDateEnd &&
            assignment.coveredDateEnd.getMonth() === currentDate.getMonth() &&
            assignment.coveredDateEnd.getFullYear() === currentDate.getFullYear(),
        )
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        weekEnd.setHours(23, 59, 59, 999)

        return filtered.filter(
          (assignment) =>
            assignment.coveredDateEnd && assignment.coveredDateEnd >= weekStart && assignment.coveredDateEnd < weekEnd,
        )
      case "day":
        const dayStart = new Date(currentDate)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(currentDate)
        dayEnd.setHours(23, 59, 59, 999)

        return filtered.filter(
          (assignment) =>
            assignment.coveredDateEnd && assignment.coveredDateEnd >= dayStart && assignment.coveredDateEnd < dayEnd,
        )
      case "hour":
        const hourStart = new Date(currentDate)
        hourStart.setMinutes(0, 0, 0)

        const hourEnd = new Date(hourStart)
        hourEnd.setHours(hourStart.getHours() + 1)

        return filtered.filter(
          (assignment) =>
            assignment.coveredDateEnd &&
            ((assignment.coveredDateEnd >= hourStart && assignment.coveredDateEnd < hourEnd) ||
              (assignment.coveredDateStart &&
                assignment.coveredDateStart < hourStart &&
                assignment.coveredDateEnd > hourStart)),
        )
      case "minute":
        const minuteStart = new Date(currentDate)
        minuteStart.setSeconds(0, 0)

        const minuteEnd = new Date(minuteStart)
        minuteEnd.setMinutes(minuteStart.getMinutes() + 15)

        return filtered.filter(
          (assignment) =>
            assignment.coveredDateEnd &&
            ((assignment.coveredDateEnd >= minuteStart && assignment.coveredDateEnd < minuteEnd) ||
              (assignment.coveredDateStart &&
                assignment.coveredDateStart < minuteStart &&
                assignment.coveredDateEnd > minuteStart)),
        )
    }

    // Default return empty array if no match (should never reach here)
    return []
  }

  // Get status color based on assignment status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ONGOING":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get color based on service type
  const getServiceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "roll up":
        return "bg-emerald-50 border-emerald-200"
      case "roll down":
        return "bg-sky-50 border-sky-200"
      case "change material":
        return "bg-indigo-50 border-indigo-200"
      case "repair":
        return "bg-amber-50 border-amber-200"
      case "maintenance":
        return "bg-green-50 border-green-200"
      case "monitoring":
        return "bg-violet-50 border-violet-200"
      case "spot booking":
        return "bg-rose-50 border-rose-200"
      case "installation":
        return "bg-blue-50 border-blue-200"
      case "inspection":
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Get type icon based on service type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "installation":
        return "🔧"
      case "maintenance":
        return "🔨"
      case "repair":
        return "🛠️"
      case "inspection":
        return "🔍"
      case "roll up":
        return "⬆️"
      case "roll down":
        return "⬇️"
      case "change material":
        return "🔄"
      case "monitoring":
        return "👁️"
      case "spot booking":
        return "📍"
      default:
        return "📋"
    }
  }

  // Render calendar based on current view
  const renderCalendar = () => {
    const filteredAssignments = getFilteredAssignments()

    switch (view) {
      case "month":
        return renderMonthView(filteredAssignments)
      case "week":
        return renderWeekView(filteredAssignments)
      case "day":
        return renderDayView(filteredAssignments)
      case "hour":
        return renderHourView(filteredAssignments)
      case "minute":
        return renderMinuteView(filteredAssignments)
    }
  }

  // Month view renderer
  const renderMonthView = (assignments: ServiceAssignment[]) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Create array of day numbers with empty slots for the first week
    const days = Array(firstDay)
      .fill(null)
      .concat([...Array(daysInMonth)].map((_, i) => i + 1))

    // Group assignments by day
    const assignmentsByDay: { [key: number]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      if (!assignment.coveredDateEnd) return
      const day = assignment.coveredDateEnd.getDate()
      if (!assignmentsByDay[day]) assignmentsByDay[day] = []
      assignmentsByDay[day].push(assignment)
    })

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {/* Day headers */}
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={`header-${i}`} className="text-center font-medium p-1 sm:p-2 text-gray-500 text-xs sm:text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, i) => {
          const isToday =
            day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

          const dayAssignments = day ? assignmentsByDay[day] || [] : []

          return (
            <div
              key={`day-${i}`}
              className={`min-h-[80px] sm:min-h-[120px] border rounded-md p-1 ${
                day ? "bg-white" : "bg-gray-50"
              } ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              {day && (
                <>
                  <div className={`text-right p-1 text-xs sm:text-sm ${isToday ? "font-bold text-blue-600" : ""}`}>
                    {day}
                  </div>
                  <div className="overflow-y-auto max-h-[50px] sm:max-h-[80px]">
                    {dayAssignments.slice(0, 2).map((assignment, j) => (
                      <div
                        key={`assignment-${day}-${j}`}
                        className={`text-[10px] sm:text-xs p-1 mb-1 rounded-full truncate cursor-pointer hover:bg-gray-100 text-white font-medium ${getServiceTypeColor(
                          assignment.serviceType,
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAssignmentId(assignment.id)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate">
                            SA#{assignment.saNumber}: {assignment.projectSiteName}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayAssignments.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-center text-blue-600 font-medium">
                        +{dayAssignments.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Week view renderer
  const renderWeekView = (assignments: ServiceAssignment[]) => {
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const days = Array(7)
      .fill(null)
      .map((_, i) => {
        const day = new Date(weekStart)
        day.setDate(weekStart.getDate() + i)
        return day
      })

    // Group assignments by day
    const assignmentsByDay: { [key: string]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      if (!assignment.coveredDateEnd) return
      const day = assignment.coveredDateEnd.toDateString()
      if (!assignmentsByDay[day]) assignmentsByDay[day] = []
      assignmentsByDay[day].push(assignment)
    })

    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-4">
        {/* Day headers */}
        {days.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={`header-${i}`}
              className={`text-center p-1 sm:p-2 ${isToday ? "font-bold text-blue-600" : "text-gray-700"}`}
            >
              <div className="text-[10px] sm:text-sm">{day.toLocaleDateString([], { weekday: "short" }).charAt(0)}</div>
              <div
                className={`text-sm sm:text-lg ${isToday ? "bg-blue-100 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center mx-auto" : ""}`}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}

        {/* Week content */}
        {days.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString()
          const dayAssignments = assignmentsByDay[day.toDateString()] || []

          return (
            <div
              key={`day-${i}`}
              className={`border rounded-md overflow-hidden ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="overflow-y-auto h-[250px] sm:h-[400px] p-1">
                {dayAssignments.map((assignment, j) => (
                  <div
                    key={`assignment-${i}-${j}`}
                    className={`p-1 sm:p-2 mb-1 sm:mb-2 rounded-full cursor-pointer hover:bg-gray-50 text-[10px] sm:text-sm text-white font-medium ${getServiceTypeColor(
                      assignment.serviceType,
                    )}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedAssignmentId(assignment.id)
                      setDetailsDialogOpen(true)
                    }}
                  >
                    <div className="font-medium truncate">
                      SA#{assignment.saNumber}: {assignment.projectSiteName}
                    </div>
                  </div>
                ))}
                {dayAssignments.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[10px] sm:text-sm">
                    No assignments scheduled
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Day view renderer
  const renderDayView = (assignments: ServiceAssignment[]) => {
    // Create array of hours
    const hours = Array(24)
      .fill(null)
      .map((_, i) => i)

    // Group assignments by hour
    const assignmentsByHour: { [key: number]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      if (!assignment.coveredDateEnd) return
      const hour = assignment.coveredDateEnd.getHours()
      if (!assignmentsByHour[hour]) assignmentsByHour[hour] = []
      assignmentsByHour[hour].push(assignment)
    })

    return (
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] divide-x">
          {/* Time column */}
          <div className="bg-gray-50">
            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="h-16 sm:h-20 border-b border-gray-200 p-1 sm:p-2 text-right text-[10px] sm:text-sm text-gray-500"
              >
                {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Content column */}
          <div>
            {hours.map((hour) => {
              const hourAssignments = assignmentsByHour[hour] || []
              const currentHour = new Date().getHours()
              const isCurrentHour =
                hour === currentHour &&
                currentDate.getDate() === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()

              return (
                <div
                  key={`content-${hour}`}
                  className={`h-16 sm:h-20 border-b border-gray-200 p-1 relative ${isCurrentHour ? "bg-blue-50" : ""}`}
                >
                  {hourAssignments.map((assignment, i) => (
                    <div
                      key={`assignment-${hour}-${i}`}
                      className={`absolute left-1 right-1 p-1 rounded-full shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50 text-white font-medium ${getServiceTypeColor(
                        assignment.serviceType,
                      )}`}
                      style={{
                        top: `${(assignment.coveredDateEnd?.getMinutes() || 0 / 60) * 100}%`,
                        height: "40%",
                        maxHeight: "95%",
                        zIndex: i + 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAssignmentId(assignment.id)
                        setDetailsDialogOpen(true)
                      }}
                    >
                      <div className="font-medium truncate">
                        SA#{assignment.saNumber}: {assignment.projectSiteName}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Hour view renderer
  const renderHourView = (assignments: ServiceAssignment[]) => {
    // Create array of 5-minute intervals
    const intervals = Array(12)
      .fill(null)
      .map((_, i) => i * 5)

    return (
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] divide-x">
          {/* Time column */}
          <div className="bg-gray-50">
            {intervals.map((interval) => {
              const time = new Date(currentDate)
              time.setMinutes(interval, 0, 0)

              return (
                <div
                  key={`interval-${interval}`}
                  className="h-12 sm:h-16 border-b border-gray-200 p-1 sm:p-2 text-right text-[8px] sm:text-sm text-gray-500"
                >
                  {time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              )
            })}
          </div>

          {/* Content column */}
          <div>
            {intervals.map((interval) => {
              const time = new Date(currentDate)
              time.setMinutes(interval, 0, 0)

              const intervalAssignments = assignments.filter((assignment) => {
                if (!assignment.coveredDateEnd) return false
                const intervalEnd = new Date(time)
                intervalEnd.setMinutes(time.getMinutes() + 5)

                return (
                  (assignment.coveredDateEnd >= time && assignment.coveredDateEnd < intervalEnd) ||
                  (assignment.coveredDateStart &&
                    assignment.coveredDateStart < time &&
                    assignment.coveredDateEnd > time)
                )
              })

              const isCurrentInterval =
                new Date().getHours() === time.getHours() &&
                Math.floor(new Date().getMinutes() / 5) * 5 === interval &&
                new Date().getDate() === time.getDate() &&
                new Date().getMonth() === time.getMonth() &&
                new Date().getFullYear() === time.getFullYear()

              return (
                <div
                  key={`content-${interval}`}
                  className={`h-12 sm:h-16 border-b border-gray-200 p-1 ${isCurrentInterval ? "bg-blue-50" : ""}`}
                >
                  <div className="flex flex-wrap gap-1">
                    {intervalAssignments.map((assignment, i) => (
                      <div
                        key={`assignment-${interval}-${i}`}
                        className={`flex-1 min-w-[80px] sm:min-w-[150px] p-1 sm:p-2 rounded-full shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50 text-white font-medium ${getServiceTypeColor(
                          assignment.serviceType,
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAssignmentId(assignment.id)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        <div className="font-medium truncate">
                          SA#{assignment.saNumber}: {assignment.projectSiteName}
                        </div>
                      </div>
                    ))}
                    {intervalAssignments.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">
                        No assignments in this time slot
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Minute view renderer
  const renderMinuteView = (assignments: ServiceAssignment[]) => {
    // Create array of 1-minute intervals for a 15-minute window
    const baseMinute = Math.floor(currentDate.getMinutes() / 15) * 15
    const intervals = Array(15)
      .fill(null)
      .map((_, i) => baseMinute + i)

    return (
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] divide-x">
          {/* Time column */}
          <div className="bg-gray-50">
            {intervals.map((minute) => {
              const time = new Date(currentDate)
              time.setMinutes(minute, 0, 0)

              return (
                <div
                  key={`minute-${minute}`}
                  className="h-10 sm:h-12 border-b border-gray-200 p-1 sm:p-2 text-right text-[8px] sm:text-sm text-gray-500"
                >
                  {time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              )
            })}
          </div>

          {/* Content column */}
          <div>
            {intervals.map((minute) => {
              const time = new Date(currentDate)
              time.setMinutes(minute, 0, 0)

              const minuteAssignments = assignments.filter((assignment) => {
                if (!assignment.coveredDateEnd) return false
                const minuteEnd = new Date(time)
                minuteEnd.setMinutes(time.getMinutes() + 1)

                return (
                  (assignment.coveredDateEnd >= time && assignment.coveredDateEnd < minuteEnd) ||
                  (assignment.coveredDateStart &&
                    assignment.coveredDateStart < time &&
                    assignment.coveredDateEnd > time)
                )
              })

              const isCurrentMinute =
                new Date().getHours() === time.getHours() &&
                new Date().getMinutes() === minute &&
                new Date().getDate() === time.getDate() &&
                new Date().getMonth() === time.getMonth() &&
                new Date().getFullYear() === time.getFullYear()

              return (
                <div
                  key={`content-${minute}`}
                  className={`h-10 sm:h-12 border-b border-gray-200 p-1 ${isCurrentMinute ? "bg-blue-50" : ""}`}
                >
                  <div className="flex flex-wrap gap-1">
                    {minuteAssignments.map((assignment, i) => (
                      <div
                        key={`assignment-${minute}-${i}`}
                        className={`flex-1 min-w-[70px] sm:min-w-[120px] p-1 rounded-full shadow-sm text-[8px] sm:text-[10px] cursor-pointer hover:bg-gray-50 text-white font-medium ${getServiceTypeColor(
                          assignment.serviceType,
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAssignmentId(assignment.id)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        <div className="font-medium truncate">
                          SA#{assignment.saNumber}: {assignment.projectSiteName}
                        </div>
                      </div>
                    ))}
                    {minuteAssignments.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-[10px]">
                        No assignments at this time
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Logistics Calendar</h1>
        </div>

        {/* Calendar controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Navigation controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight size={16} />
                </Button>
                <h2 className="text-lg font-medium ml-2 truncate">{getViewTitle()}</h2>
              </div>

              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <form className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search assignments..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>All Assignments</DropdownMenuItem>
                      <DropdownMenuItem>Installation</DropdownMenuItem>
                      <DropdownMenuItem>Maintenance</DropdownMenuItem>
                      <DropdownMenuItem>Repair</DropdownMenuItem>
                      <DropdownMenuItem>Inspection</DropdownMenuItem>
                      <DropdownMenuItem>Roll Up</DropdownMenuItem>
                      <DropdownMenuItem>Roll Down</DropdownMenuItem>
                      <DropdownMenuItem>Change Material</DropdownMenuItem>
                      <DropdownMenuItem>Monitoring</DropdownMenuItem>
                      <DropdownMenuItem>Spot Booking</DropdownMenuItem>
                      <DropdownMenuItem>Scheduled</DropdownMenuItem>
                      <DropdownMenuItem>In Progress</DropdownMenuItem>
                      <DropdownMenuItem>Ongoing</DropdownMenuItem>
                      <DropdownMenuItem>Pending</DropdownMenuItem>
                      <DropdownMenuItem>Completed</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* View controls */}
                <div className="flex items-center justify-between gap-2">
                  <Tabs
                    defaultValue="month"
                    value={view}
                    onValueChange={(v) => setView(v as CalendarViewType)}
                    className="flex-1"
                  >
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="month" className="text-xs">
                        <CalendarIcon size={14} className="mr-1 hidden sm:inline" />
                        <span className="sm:hidden">M</span>
                        <span className="hidden sm:inline">Month</span>
                      </TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">
                        <CalendarIcon size={14} className="mr-1 hidden sm:inline" />
                        <span className="sm:hidden">W</span>
                        <span className="hidden sm:inline">Week</span>
                      </TabsTrigger>
                      <TabsTrigger value="day" className="text-xs">
                        <CalendarIcon size={14} className="mr-1 hidden sm:inline" />
                        <span className="sm:hidden">D</span>
                        <span className="hidden sm:inline">Day</span>
                      </TabsTrigger>
                      <TabsTrigger value="hour" className="text-xs">
                        <Clock size={14} className="mr-1 hidden sm:inline" />
                        <span className="sm:hidden">H</span>
                        <span className="hidden sm:inline">Hour</span>
                      </TabsTrigger>
                      <TabsTrigger value="minute" className="text-xs">
                        <Clock size={14} className="mr-1 hidden sm:inline" />
                        <span className="sm:hidden">Min</span>
                        <span className="hidden sm:inline">Minute</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setView(
                          view === "month"
                            ? "week"
                            : view === "week"
                              ? "day"
                              : view === "day"
                                ? "hour"
                                : view === "hour"
                                  ? "minute"
                                  : "minute",
                        )
                      }
                    >
                      <ZoomIn size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setView(
                          view === "minute"
                            ? "hour"
                            : view === "hour"
                              ? "day"
                              : view === "day"
                                ? "week"
                                : view === "week"
                                  ? "month"
                                  : "month",
                        )
                      }
                    >
                      <ZoomOut size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
        </Card>

        {/* Calendar view */}
        <div className="bg-white border rounded-lg p-2 sm:p-4 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-base sm:text-lg">Loading calendar...</span>
            </div>
          ) : (
            <div className="min-w-[640px]">{renderCalendar()}</div>
          )}
        </div>
        <ServiceAssignmentDialog
          open={serviceAssignmentDialogOpen}
          onOpenChange={setServiceAssignmentDialogOpen}
          onSuccess={() => {
            // Refresh assignments after creating a new one
            fetchAssignments()
          }}
        />
      </div>
      <AssignmentDetailsDialog
        assignmentId={selectedAssignmentId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onSuccess={() => {
          // Refresh assignments after updating
          fetchAssignments()
        }}
      />
    </div>
  )\
}
