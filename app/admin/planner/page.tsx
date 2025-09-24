"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, ZoomIn, ZoomOut, Filter, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import type { Booking } from "@/lib/booking-service"
import { getProductById } from "@/lib/firebase-service"
import { SalesEvent, getSalesEvents } from "@/lib/planner-service"
import { EventDetailsDialog } from "@/components/event-details-dialog"
import { EventDialog } from "@/components/event-dialog"

// Types for our calendar data
type ServiceAssignment = {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  serviceType: string
  alarmDate: Date | null
  alarmTime: string
  coveredDateStart: Date | null
  coveredDateEnd: Date | null
  status: string
  location: string
  notes: string
  assignedTo: string
  assignedToName?: string
  jobDescription: string
  createdAt?: Date
  updatedAt?: Date
}

type CalendarViewType = "month" | "week" | "day"

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

export default function AdminPlannerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewType>("month")
  const [searchTerm, setSearchTerm] = useState("")
  const [plannerView, setPlannerView] = useState<"assignments" | "bookings">("assignments")

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [serviceAssignmentDialogOpen, setServiceAssignmentDialogOpen] = useState(false)
  const [siteProduct, setSiteProduct] = useState<any>(null)
  const [siteProductLoading, setSiteProductLoading] = useState(false)
  const [events, setEvents] = useState<SalesEvent[]>([])
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [eventDetailsDialogOpen, setEventDetailsDialogOpen] = useState(false)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<SalesEvent | null>(null)

  // Get query parameters
  const siteId = searchParams.get("site")
  const viewParam = searchParams.get("view")

  // Fetch service assignments with actual data
  const fetchAssignments = useCallback(async () => {
    if (!userData?.company_id) {
      setAssignments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Query service assignments from Firestore using company_id
      const assignmentsRef = collection(db, "service_assignments")

      // Try with orderBy first
      let q = query(assignmentsRef, where("company_id", "==", userData.company_id), orderBy("created", "desc"))

      let querySnapshot
      try {
        querySnapshot = await getDocs(q)
      } catch (orderByError) {
        // If orderBy fails (likely due to missing index), try without orderBy
        q = query(assignmentsRef, where("company_id", "==", userData.company_id))
        querySnapshot = await getDocs(q)
      }

      const fetchedAssignments: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Convert Firestore timestamps to Date objects with better error handling
        let alarmDate: Date | null = null
        let coveredDateStart: Date | null = null
        let coveredDateEnd: Date | null = null

        try {
          // Parse alarmDate - this is the primary date for calendar display
          if (data.alarmDate) {
            if (data.alarmDate.toDate) {
              alarmDate = data.alarmDate.toDate()
            } else if (data.alarmDate.seconds) {
              alarmDate = new Date(data.alarmDate.seconds * 1000)
            } else {
              alarmDate = new Date(data.alarmDate)
            }
          }

          // Parse coveredDateStart
          if (data.coveredDateStart) {
            if (data.coveredDateStart.toDate) {
              coveredDateStart = data.coveredDateStart.toDate()
            } else if (data.coveredDateStart.seconds) {
              coveredDateStart = new Date(data.coveredDateStart.seconds * 1000)
            } else {
              coveredDateStart = new Date(data.coveredDateStart)
            }
          }

          // Parse coveredDateEnd
          if (data.coveredDateEnd) {
            if (data.coveredDateEnd.toDate) {
              coveredDateEnd = data.coveredDateEnd.toDate()
            } else if (data.coveredDateEnd.seconds) {
              coveredDateEnd = new Date(data.coveredDateEnd.seconds * 1000)
            } else {
              coveredDateEnd = new Date(data.coveredDateEnd)
            }
          }
        } catch (dateError) {
          console.error("Error parsing dates for assignment:", doc.id, dateError)
        }

        let createdAt: Date = new Date()
        try {
          if (data.created) {
            if (data.created.toDate) {
              createdAt = data.created.toDate()
            } else if (data.created.seconds) {
              createdAt = new Date(data.created.seconds * 1000)
            } else {
              createdAt = new Date(data.created)
            }
          }
        } catch (createdError) {
          console.error("Error parsing created date:", createdError)
        }

        let updatedAt: Date = new Date()
        try {
          if (data.updated) {
            if (data.updated.toDate) {
              updatedAt = data.updated.toDate()
            } else if (data.updated.seconds) {
              updatedAt = new Date(data.updated.seconds * 1000)
            } else {
              updatedAt = new Date(data.updated)
            }
          }
        } catch (updatedError) {
          console.error("Error parsing updated date:", updatedError)
        }

        const assignment: ServiceAssignment = {
          id: doc.id,
          saNumber: data.saNumber || "",
          projectSiteId: data.projectSiteId || data.siteId || "",
          projectSiteName:
            data.projectSiteName || data.project_site_name || data.siteName || data.location || "Unknown Site",
          serviceType: data.serviceType || data.service_type || data.type || "General Service",
          alarmDate,
          alarmTime: data.alarmTime || data.alarm_time || "08:00",
          coveredDateStart,
          coveredDateEnd,
          status: data.status || "Pending",
          location: data.projectSiteLocation || data.location || data.address || "",
          notes: data.message || data.notes || data.description || "",
          assignedTo: data.assignedTo || data.assignedToId || "",
          assignedToName: data.assignedToName || data.assignedTo || "Unassigned",
          jobDescription: data.jobDescription || data.description || "",
          createdAt,
          updatedAt,
        }

        fetchedAssignments.push(assignment)
      })

      setAssignments(fetchedAssignments)
    } catch (error) {
      console.error("Error fetching service assignments:", error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [userData])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const fetchedEvents = await getSalesEvents(true, "admin")
      setEvents(fetchedEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
    fetchEvents()
  }, [fetchAssignments, fetchEvents])

  // Fetch site product details when siteId is provided
  useEffect(() => {
    const fetchSiteProduct = async () => {
      if (!siteId) {
        setSiteProduct(null)
        return
      }

      setSiteProductLoading(true)
      try {
        const product = await getProductById(siteId)
        setSiteProduct(product)
      } catch (error) {
        console.error("Error fetching site product:", error)
        setSiteProduct(null)
      } finally {
        setSiteProductLoading(false)
      }
    }

    fetchSiteProduct()
  }, [siteId])

  // Set planner view based on query parameters
  useEffect(() => {
    if (viewParam === "bookings") {
      setPlannerView("bookings")
      if (siteId) {
        fetchBookingsForSite(siteId)
      }
    } else {
      setPlannerView("assignments")
    }
  }, [viewParam, siteId])

  // Fetch bookings for a specific site
  const fetchBookingsForSite = useCallback(async (siteId: string) => {
    if (!userData?.company_id) return

    try {
      setLoading(true)
      const bookingsQuery = query(
        collection(db, "booking"),
        where("product_id", "==", siteId),
        orderBy("created", "desc")
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData: Booking[] = []

      bookingsSnapshot.forEach((doc) => {
        bookingsData.push({
          id: doc.id,
          ...doc.data(),
        } as Booking)
      })

      setBookings(bookingsData)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [userData])

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
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleEventClick = (event: SalesEvent) => {
    setSelectedEventForDetails(event)
    setEventDetailsDialogOpen(true)
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
    }

    return currentDate.toLocaleDateString([], options)
  }

  // Filter assignments/bookings based on current view and search term
  const getFilteredItems = () => {
    if (plannerView === "bookings") {
      if (!bookings || bookings.length === 0) {
        return []
      }

      let filtered = [...bookings]

      // Apply search filter if any
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (booking) =>
            booking.reservation_id?.toLowerCase().includes(term) ||
            booking.client?.name?.toLowerCase().includes(term) ||
            booking.project_name?.toLowerCase().includes(term) ||
            booking.product_name?.toLowerCase().includes(term),
        )
      }

      // Filter based on current view and date range
      switch (view) {
        case "month":
          return filtered.filter((booking) => {
            if (booking.start_date) {
              const bookingDate = booking.start_date instanceof Date ? booking.start_date : new Date(booking.start_date.seconds * 1000)
              return bookingDate.getMonth() === currentDate.getMonth() &&
                     bookingDate.getFullYear() === currentDate.getFullYear()
            }
            return false
          })

        case "week":
          const weekStart = new Date(currentDate)
          weekStart.setDate(currentDate.getDate() - currentDate.getDay())
          weekStart.setHours(0, 0, 0, 0)

          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)

          return filtered.filter((booking) => {
            if (booking.start_date) {
              const bookingDate = booking.start_date instanceof Date ? booking.start_date : new Date(booking.start_date.seconds * 1000)
              return bookingDate >= weekStart && bookingDate <= weekEnd
            }
            return false
          })

        case "day":
          const dayStart = new Date(currentDate)
          dayStart.setHours(0, 0, 0, 0)

          const dayEnd = new Date(currentDate)
          dayEnd.setHours(23, 59, 59, 999)

          return filtered.filter((booking) => {
            if (booking.start_date) {
              const bookingDate = booking.start_date instanceof Date ? booking.start_date : new Date(booking.start_date.seconds * 1000)
              return bookingDate >= dayStart && bookingDate <= dayEnd
            }
            return false
          })

        default:
          return filtered
      }
    } else {
      if (!assignments || assignments.length === 0) {
        return []
      }

      let filtered = [...assignments]

      // Apply search filter if any
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (assignment) =>
            assignment.saNumber?.toLowerCase().includes(term) ||
            assignment.projectSiteName?.toLowerCase().includes(term) ||
            assignment.serviceType?.toLowerCase().includes(term) ||
            assignment.location?.toLowerCase().includes(term) ||
            assignment.assignedToName?.toLowerCase().includes(term) ||
            assignment.notes?.toLowerCase().includes(term) ||
            assignment.jobDescription?.toLowerCase().includes(term),
        )
      }

      // Filter based on current view and date range - use alarmDate as primary filter
      switch (view) {
        case "month":
          const monthFiltered = filtered.filter((assignment) => {
            // Primary filter: alarmDate
            if (assignment.alarmDate) {
              const matches =
                assignment.alarmDate.getMonth() === currentDate.getMonth() &&
                assignment.alarmDate.getFullYear() === currentDate.getFullYear()

              console.log(
                "Assignment",
                assignment.saNumber,
                "alarmDate:",
                assignment.alarmDate,
                "current month/year:",
                currentDate.getMonth(),
                currentDate.getFullYear(),
                "matches:",
                matches,
              )
              return matches
            }

            // Fallback: check if assignment spans this month using covered dates
            if (assignment.coveredDateStart && assignment.coveredDateEnd) {
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

              const overlaps = assignment.coveredDateStart <= monthEnd && assignment.coveredDateEnd >= monthStart
              console.log(
                "Assignment",
                assignment.saNumber,
                "spans month:",
                overlaps,
                "covered:",
                assignment.coveredDateStart,
                "to",
                assignment.coveredDateEnd,
              )
              return overlaps
            }

            return false
          })
          return monthFiltered

        case "week":
          const weekStart = new Date(currentDate)
          weekStart.setDate(currentDate.getDate() - currentDate.getDay())
          weekStart.setHours(0, 0, 0, 0)

          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)

          return filtered.filter((assignment) => {
            // Primary filter: alarmDate
            if (assignment.alarmDate) {
              const inWeek = assignment.alarmDate >= weekStart && assignment.alarmDate <= weekEnd
              return inWeek
            }

            // Fallback: check covered dates
            if (assignment.coveredDateStart && assignment.coveredDateEnd) {
              const overlaps = assignment.coveredDateStart <= weekEnd && assignment.coveredDateEnd >= weekStart
              return overlaps
            }

            return false
          })

        case "day":
          const dayStart = new Date(currentDate)
          dayStart.setHours(0, 0, 0, 0)

          const dayEnd = new Date(currentDate)
          dayEnd.setHours(23, 59, 59, 999)

          return filtered.filter((assignment) => {
            // Primary filter: alarmDate
            if (assignment.alarmDate) {
              const sameDay = assignment.alarmDate >= dayStart && assignment.alarmDate <= dayEnd
              return sameDay
            }

            // Fallback: check covered dates
            if (assignment.coveredDateStart && assignment.coveredDateEnd) {
              const overlaps = assignment.coveredDateStart <= dayEnd && assignment.coveredDateEnd >= dayStart
              return overlaps
            }

            return false
          })


        default:
          return filtered
      }
    }
  }

  // Get status color based on assignment status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "IN_PROGRESS":
      case "IN PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-orange-100 text-orange-800 border-orange-200"
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
      case "dismantling":
        return "bg-red-50 border-red-200"
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
      case "dismantling":
        return "🔻"
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

  // Month view renderer with actual assignment data
  const renderMonthView = (assignments: ServiceAssignment[]) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Create array of day numbers with empty slots for the first week
    const days = Array(firstDay)
      .fill(null)
      .concat([...Array(daysInMonth)].map((_, i) => i + 1))

    // Group assignments by day - use alarmDate as primary grouping
    const assignmentsByDay: { [key: number]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      // Primary: use alarmDate
      if (assignment.alarmDate) {
        if (assignment.alarmDate.getMonth() === month && assignment.alarmDate.getFullYear() === year) {
          const day = assignment.alarmDate.getDate()
          if (!assignmentsByDay[day]) assignmentsByDay[day] = []
          assignmentsByDay[day].push(assignment)
        }
      } else if (assignment.coveredDateStart && assignment.coveredDateEnd) {
        // Fallback: show assignment on all days it spans within the current month
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

        const checkDate = new Date(Math.max(assignment.coveredDateStart.getTime(), monthStart.getTime()))
        const endCheck = new Date(Math.min(assignment.coveredDateEnd.getTime(), monthEnd.getTime()))

        while (checkDate <= endCheck) {
          if (checkDate.getMonth() === month && checkDate.getFullYear() === year) {
            const day = checkDate.getDate()
            if (!assignmentsByDay[day]) assignmentsByDay[day] = []
            assignmentsByDay[day].push(assignment)
          }
          checkDate.setDate(checkDate.getDate() + 1)
        }
      }
    })

    // Group events by day
    const eventsByDay: { [key: number]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        if (event.start.getMonth() === month && event.start.getFullYear() === year) {
          const day = event.start.getDate()
          if (!eventsByDay[day]) eventsByDay[day] = []
          eventsByDay[day].push(event)
        }
      }
    })

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
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
              className={`min-h-[100px] sm:min-h-[140px] border rounded-md p-1 ${
                day ? "bg-white" : "bg-gray-50"
              } ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              {day && (
                <>
                  <div className={`text-right p-1 text-xs sm:text-sm ${isToday ? "font-bold text-blue-600" : ""}`}>
                    {day}
                  </div>
                  <div className="overflow-y-auto max-h-[70px] sm:max-h-[100px]">
                    {dayAssignments.slice(0, 3).map((assignment, j) => (
                      <div
                        key={`assignment-${day}-${j}`}
                        className={`text-[10px] sm:text-xs p-1 mb-1 rounded border truncate cursor-pointer hover:bg-gray-100 ${getServiceTypeColor(assignment.serviceType)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/service-assignments/${assignment.id}`)
                        }}
                        title={`${assignment.saNumber} - ${assignment.projectSiteName} (${assignment.serviceType}) at ${assignment.alarmTime}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{getTypeIcon(assignment.serviceType)}</span>
                          <span className="truncate font-medium">{assignment.saNumber}</span>
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-gray-600 truncate mt-0.5">
                          {assignment.projectSiteName}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(assignment.status)} text-[6px] sm:text-[8px] px-1 py-0`}
                          >
                            {assignment.status}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px] text-gray-500">{assignment.alarmTime}</span>
                        </div>
                      </div>
                    ))}
                    {dayAssignments.length > 3 && (
                      <div className="text-[10px] sm:text-xs text-center text-blue-600 font-medium cursor-pointer hover:underline">
                        +{dayAssignments.length - 3} more
                      </div>
                    )}
                    {day ? eventsByDay[day]?.slice(0, 2).map((event, j) => (
                      <div
                        key={`event-${day}-${j}`}
                        className={`text-[10px] sm:text-xs p-1 mb-1 rounded border cursor-pointer hover:bg-gray-100 bg-green-50 border-green-200 min-h-[60px] sm:min-h-[70px]`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                        title={`${event.title} - ${event.type} at ${event.location}`}
                      >
                        <div className="flex items-start gap-1">
                          <span>🎉</span>
                          <span className="font-medium break-words">{event.title}</span>
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-gray-600 mt-0.5 break-words">
                          {event.location}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[6px] sm:text-[8px] px-1 py-0 bg-${event.type === 'meeting' ? 'blue' : event.type === 'holiday' ? 'red' : 'purple'}-100`}
                          >
                            {event.type}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px] text-gray-500">{formatTime(event.start as Date)}</span>
                        </div>
                      </div>
                    )) : null}
                    {day && eventsByDay[day]?.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-center text-green-600 font-medium cursor-pointer hover:underline">
                        +{eventsByDay[day].length - 2} more events
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

  // Week view renderer with actual assignment data
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

    // Group assignments by day - use alarmDate as primary grouping
    const assignmentsByDay: { [key: string]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      console.log("Processing assignment: " + assignment.id)
      // Primary: use alarmDate
      if (assignment.alarmDate) {
        const dayKey = assignment.alarmDate.toDateString()
        if (!assignmentsByDay[dayKey]) assignmentsByDay[dayKey] = []
        assignmentsByDay[dayKey].push(assignment)
      } else if (assignment.coveredDateStart && assignment.coveredDateEnd) {
        // Fallback: show assignment on all days it spans within the week
        days.forEach((day) => {
          const dayStart = new Date(day)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(day)
          dayEnd.setHours(23, 59, 59, 999)

          const overlaps = assignment.coveredDateStart! <= dayEnd && assignment.coveredDateEnd! >= dayStart
          if (overlaps) {
            const dayKey = day.toDateString()
            if (!assignmentsByDay[dayKey]) assignmentsByDay[dayKey] = []
            assignmentsByDay[dayKey].push(assignment)
          }
        })
      }
    })

    // Group events by day
    const eventsByDay: { [key: string]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        const dayKey = event.start.toDateString()
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = []
        eventsByDay[dayKey].push(event)
      }
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
              <div className="text-[10px] sm:text-sm">{day.toLocaleDateString([], { weekday: "short" })}</div>
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
          const dayEvents = eventsByDay[day.toDateString()] || []
  
          return (
            <div
              key={`day-${i}`}
              className={`border rounded-md overflow-hidden ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="overflow-y-auto h-[250px] sm:h-[400px] p-1">
                {dayAssignments.map((assignment, j) => (
                  <div
                    key={`assignment-${i}-${j}`}
                    className={`p-1 sm:p-2 mb-1 sm:mb-2 rounded border cursor-pointer hover:bg-gray-50 text-[10px] sm:text-sm ${getServiceTypeColor(assignment.serviceType)}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/service-assignments/${assignment.id}`)
                    }}
                    title={`${assignment.saNumber} - ${assignment.projectSiteName}`}
                  >
                    <div className="font-medium truncate flex items-center gap-1">
                      <span>{getTypeIcon(assignment.serviceType)}</span>
                      <span>{assignment.saNumber}</span>
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-600 mt-1 truncate">
                      {assignment.projectSiteName}
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-500 mt-1 truncate">
                      {assignment.assignedToName || assignment.assignedTo || "Unassigned"}
                    </div>
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(assignment.status)} text-[8px] sm:text-xs px-1`}
                      >
                        {assignment.status}
                      </Badge>
                      <span className="text-[8px] sm:text-xs truncate max-w-[60px] sm:max-w-none">
                        {assignment.serviceType}
                      </span>
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-500 mt-1">
                      {assignment.alarmTime && `⏰ ${assignment.alarmTime}`}
                      {assignment.jobDescription && ` • ${assignment.jobDescription}`}
                    </div>
                  </div>
                ))}
                {dayEvents.slice(0, 2).map((event, j) => (
                  <div
                    key={`event-${i}-${j}`}
                    className={`p-1 sm:p-2 mb-1 sm:mb-2 rounded border cursor-pointer hover:bg-gray-50 text-[10px] sm:text-sm bg-green-50 border-green-200 min-h-[80px] sm:min-h-[100px]`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick(event)
                    }}
                    title={`${event.title} - ${event.type} at ${event.location}`}
                  >
                    <div className="font-medium flex items-start gap-1">
                      <span>🎉</span>
                      <span className="break-words">{event.title}</span>
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-600 mt-1 break-words">
                      {event.location}
                    </div>
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[8px] sm:text-xs px-1 bg-${event.type === 'meeting' ? 'blue' : event.type === 'holiday' ? 'red' : 'purple'}-100`}
                      >
                        {event.type}
                      </Badge>
                      <span className="text-[8px] sm:text-xs max-w-[60px] sm:max-w-none">
                        {formatTime(event.start as Date)}
                      </span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] sm:text-xs text-center text-green-600 font-medium cursor-pointer hover:underline mb-1">
                    +{dayEvents.length - 2} more events
                  </div>
                )}
                {dayAssignments.length === 0 && dayEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[10px] sm:text-sm">
                    No assignments or events
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Day view renderer with actual assignment data
  const renderDayView = (assignments: ServiceAssignment[]) => {
    // Create array of hours
    const hours = Array(24)
      .fill(null)
      .map((_, i) => i)

    // Group assignments by hour based on alarmTime
    const assignmentsByHour: { [key: number]: ServiceAssignment[] } = {}
    assignments.forEach((assignment) => {
      if (assignment.alarmTime) {
        const [hours] = assignment.alarmTime.split(":").map(Number)
        if (!assignmentsByHour[hours]) assignmentsByHour[hours] = []
        assignmentsByHour[hours].push(assignment)
      } else if (assignment.coveredDateStart) {
        // Fallback to covered date start hour
        const hour = assignment.coveredDateStart.getHours()
        if (!assignmentsByHour[hour]) assignmentsByHour[hour] = []
        assignmentsByHour[hour].push(assignment)
      }
    })

    // Group events by hour based on start time
    const eventsByHour: { [key: number]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        if (event.start.toDateString() === currentDate.toDateString()) {
          const hour = event.start.getHours()
          if (!eventsByHour[hour]) eventsByHour[hour] = []
          eventsByHour[hour].push(event)
        }
      }
    })

    return (
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] divide-x">
          {/* Time column */}
          <div className="bg-gray-50">
            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="h-20 sm:h-24 border-b border-gray-200 p-1 sm:p-2 text-right text-[10px] sm:text-sm text-gray-500"
              >
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Content column */}
          <div>
            {hours.map((hour) => {
              const hourAssignments = assignmentsByHour[hour] || []
              const hourEvents = eventsByHour[hour] || []
              const currentHour = new Date().getHours()
              const isCurrentHour =
                hour === currentHour &&
                currentDate.getDate() === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
  
              return (
                <div
                  key={`content-${hour}`}
                  className={`h-20 sm:h-24 border-b border-gray-200 p-1 relative ${isCurrentHour ? "bg-blue-50" : ""}`}
                >
                  {hourAssignments.map((assignment, i) => {
                    const minutes = assignment.alarmTime ? Number.parseInt(assignment.alarmTime.split(":")[1]) : 0
                    const topPosition = (minutes / 60) * 100
  
                    return (
                      <div
                        key={`assignment-${hour}-${i}`}
                        className={`absolute left-1 right-1 p-1 rounded border shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50 ${getServiceTypeColor(assignment.serviceType)}`}
                        style={{
                          top: `${topPosition}%`,
                          height: "40%",
                          maxHeight: "95%",
                          zIndex: i + 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/service-assignments/${assignment.id}`)
                        }}
                        title={`${assignment.saNumber} - ${assignment.projectSiteName} (${assignment.serviceType}) at ${assignment.alarmTime}`}
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          <span>{getTypeIcon(assignment.serviceType)}</span>
                          <span>{assignment.saNumber}</span>
                        </div>
                        <div className="text-[6px] sm:text-[8px] text-gray-600 truncate">
                          {assignment.projectSiteName}
                        </div>
                        <div className="flex items-center justify-between mt-0 sm:mt-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(assignment.status)} text-[6px] sm:text-[8px] px-1`}
                          >
                            {assignment.status}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px]">{assignment.assignedTo || "Unassigned"}</span>
                        </div>
                      </div>
                    )
                  })}
                  {hourEvents.map((event, i) => {
                    const minutes = event.start instanceof Date ? event.start.getMinutes() : 0
                    const topPosition = (minutes / 60) * 100

                    return (
                      <div
                        key={`event-${hour}-${i}`}
                        className={`absolute left-1 right-1 p-1 rounded border shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50 bg-green-50 border-green-200`}
                        style={{
                          top: `${topPosition}%`,
                          minHeight: "25%", // Minimum height for content
                          maxHeight: "60px", // Allow more height for content
                          zIndex: hourAssignments.length + i + 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                        title={`${event.title} - ${event.type} at ${event.location}`}
                      >
                        <div className="font-medium flex items-start gap-1">
                          <span>🎉</span>
                          <span className="break-words">{event.title}</span>
                        </div>
                        <div className="text-[6px] sm:text-[8px] text-gray-600 break-words">
                          {event.location}
                        </div>
                        <div className="flex items-center justify-between mt-0 sm:mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[6px] sm:text-[8px] px-1 bg-${event.type === 'meeting' ? 'blue' : event.type === 'holiday' ? 'red' : 'purple'}-100`}
                          >
                            {event.type}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px]">{formatTime(event.start as Date)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }



  // Booking render functions
  const renderMonthViewBookings = (bookings: Booking[]) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Create array of day numbers with empty slots for the first week
    const days = Array(firstDay)
      .fill(null)
      .concat([...Array(daysInMonth)].map((_, i) => i + 1))

    // Group bookings by day
    const bookingsByDay: { [key: number]: Booking[] } = {}
    bookings.forEach((booking) => {
      if (booking.start_date) {
        const bookingDate = booking.start_date instanceof Date ? booking.start_date : new Date(booking.start_date.seconds * 1000)
        if (bookingDate.getMonth() === month && bookingDate.getFullYear() === year) {
          const day = bookingDate.getDate()
          if (!bookingsByDay[day]) bookingsByDay[day] = []
          bookingsByDay[day].push(booking)
        }
      }
    })

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div key={`header-${i}`} className="text-center font-medium p-1 sm:p-2 text-gray-500 text-xs sm:text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, i) => {
          const isToday =
            day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

          const dayBookings = day ? bookingsByDay[day] || [] : []

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
                    {dayBookings.slice(0, 3).map((booking, j) => (
                      <div
                        key={`booking-${day}-${j}`}
                        className={`text-[10px] sm:text-xs p-1 mb-1 rounded border truncate cursor-pointer hover:bg-gray-100 bg-blue-50 border-blue-200`}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Could navigate to booking details if available
                        }}
                        title={`${booking.reservation_id || booking.id} - ${booking.client?.name || "Unknown Client"}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span className="truncate font-medium">{booking.reservation_id || booking.id.slice(-8)}</span>
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-gray-600 truncate mt-0.5">
                          {booking.client?.name || "Unknown Client"}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(booking.status || "PENDING")} text-[6px] sm:text-[8px] px-1 py-0`}
                          >
                            {booking.status || "PENDING"}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px] text-gray-500">
                            ₱{booking.total_cost?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] sm:text-xs text-center text-blue-600 font-medium cursor-pointer hover:underline">
                        +{dayBookings.length - 3} more
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

  // Simplified booking render functions for other views
  const renderWeekViewBookings = (bookings: Booking[]) => {
    return renderMonthViewBookings(bookings) // Use same logic for now
  }

  const renderDayViewBookings = (bookings: Booking[]) => {
    return renderMonthViewBookings(bookings) // Use same logic for now
  }

  const renderHourViewBookings = (bookings: Booking[]) => {
    return renderMonthViewBookings(bookings) // Use same logic for now
  }

  const renderMinuteViewBookings = (bookings: Booking[]) => {
    return renderMonthViewBookings(bookings) // Use same logic for now
  }

  // Render calendar based on current view
  const renderCalendar = () => {
    const filteredItems = getFilteredItems()

    switch (view) {
      case "month":
        return plannerView === "bookings" ? renderMonthView(filteredItems as any) : renderMonthView(filteredItems as ServiceAssignment[])
      case "week":
        return plannerView === "bookings" ? renderWeekView(filteredItems as any) : renderWeekView(filteredItems as ServiceAssignment[])
      case "day":
        return plannerView === "bookings" ? renderDayView(filteredItems as any) : renderDayView(filteredItems as ServiceAssignment[])
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {plannerView === "bookings"
                ? (siteProduct ? `${siteProduct.name} - Bookings Calendar` : "Site Bookings Calendar")
                : "Admin Calendar"
              }
            </h1>
            {siteId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/inventory/${siteId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
            )}
            {!siteId && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setEventDialogOpen(true)}
                className="flex items-center gap-2"
              >
                Add Event
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {plannerView === "bookings" ? `${bookings.length} bookings loaded` : `${assignments.length} service assignments, ${events.length} events loaded`}
          </div>
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
                      <DropdownMenuItem>Dismantling</DropdownMenuItem>
                      <DropdownMenuItem>Scheduled</DropdownMenuItem>
                      <DropdownMenuItem>In Progress</DropdownMenuItem>
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
                    <TabsList className="grid grid-cols-3 w-full">
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
                              : "day",
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
                          view === "day"
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

        <EventDialog
          isOpen={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          onEventSaved={(eventId) => {
            // Refresh events after creating a new one
            fetchEvents()
          }}
          department="admin"
        />

        <ServiceAssignmentDialog
          open={serviceAssignmentDialogOpen}
          onOpenChange={setServiceAssignmentDialogOpen}
          onSuccess={() => {
            // Refresh assignments after creating a new one
            fetchAssignments()
          }}
          department="ADMIN"
        />

        <EventDetailsDialog
          isOpen={eventDetailsDialogOpen}
          onClose={() => setEventDetailsDialogOpen(false)}
          event={selectedEventForDetails}
        />
      </div>
    </div>
  )
}