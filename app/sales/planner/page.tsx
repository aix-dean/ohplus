"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  ZoomIn,
  ZoomOut,
  Filter,
  Search,
  Plus,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventDialog } from "@/components/event-dialog"
import { EventDetailsDialog } from "@/components/event-details-dialog"
import {
  type SalesEvent,
  getSalesEventsByDateRange,
  searchSalesEvents,
  getSalesEventsByType,
  getSalesEventsByStatus,
  deleteSalesEvent,
} from "@/lib/planner-service"
import { useAuth } from "@/contexts/auth-context"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"

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

export default function SalesPlannerPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [salesEvents, setSalesEvents] = useState<SalesEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewType>("month")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<SalesEvent["type"] | "all">("all")
  const [filterStatus, setFilterStatus] = useState<SalesEvent["status"] | "all">("all")
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Partial<SalesEvent> | undefined>(undefined)
  const [eventDetailsDialogOpen, setEventDetailsDialogOpen] = useState(false)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<SalesEvent | null>(null)
  const [showRecurringOnly, setShowRecurringOnly] = useState(false)

  // Load events from Firestore
  const loadEvents = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      let events: SalesEvent[] = []

      // Get date range based on current view
      let startDate: Date, endDate: Date

      switch (view) {
        case "month":
          startDate = startOfMonth(currentDate)
          endDate = endOfMonth(currentDate)
          break
        case "week":
          startDate = startOfWeek(currentDate)
          endDate = endOfWeek(currentDate)
          break
        case "day":
          startDate = startOfDay(currentDate)
          endDate = endOfDay(currentDate)
          break
        case "hour":
        case "minute":
          // For hour and minute views, we'll just use the current day
          startDate = startOfDay(currentDate)
          endDate = endOfDay(currentDate)
          break
        default:
          startDate = startOfMonth(currentDate)
          endDate = endOfMonth(currentDate)
      }

      // Apply search and filters
      if (searchTerm) {
        events = await searchSalesEvents(user.uid, searchTerm)
      } else if (filterType !== "all") {
        events = await getSalesEventsByType(user.uid, filterType)
      } else if (filterStatus !== "all") {
        events = await getSalesEventsByStatus(user.uid, filterStatus)
      } else {
        // Get events for the date range
        events = await getSalesEventsByDateRange(user.uid, startDate, endDate)
      }

      // Filter for recurring events if needed
      if (showRecurringOnly) {
        events = events.filter((event) => event.recurrence && event.recurrence.type !== "none")
      }

      setSalesEvents(events)
    } catch (error) {
      console.error("Error loading events:", error)
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false)
    }
  }

  // Load events when dependencies change
  useEffect(() => {
    loadEvents()
  }, [user?.uid, currentDate, view, searchTerm, filterType, filterStatus, showRecurringOnly])

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
      case "hour":
        newDate.setHours(currentDate.getHours() - 1)
        setCurrentDate(newDate)
        break
      case "minute":
        newDate.setMinutes(currentDate.getMinutes() - 15)
        setCurrentDate(newDate)
        break
    }
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
      case "hour":
        newDate.setHours(currentDate.getHours() + 1)
        setCurrentDate(newDate)
        break
      case "minute":
        newDate.setMinutes(currentDate.getMinutes() + 15)
        setCurrentDate(newDate)
        break
    }
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
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)

        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, "MMMM")} ${format(weekStart, "d")} - ${format(weekEnd, "d")}, ${format(weekStart, "yyyy")}`
        } else {
          return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
        }
      case "day":
        options.weekday = "long"
        options.month = "long"
        options.day = "numeric"
        options.year = "numeric"
        break
      case "hour":
        return `${format(currentDate, "EEEE, MMMM d")} at ${format(currentDate, "h a")}`
      case "minute":
        return `${format(currentDate, "EEEE, MMMM d")} at ${format(currentDate, "h:mm a")}`
    }

    return format(currentDate, "MMMM yyyy")
  }

  // Filter sales events based on current view
  const getFilteredSalesEvents = () => {
    if (!salesEvents.length) return []

    // Filter based on current view
    switch (view) {
      case "month":
        return salesEvents.filter(
          (event) =>
            event.start instanceof Date &&
            event.start.getMonth() === currentDate.getMonth() &&
            event.start.getFullYear() === currentDate.getFullYear(),
        )
      case "week":
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)

        return salesEvents.filter(
          (event) => event.start instanceof Date && event.start >= weekStart && event.start <= weekEnd,
        )
      case "day":
        const dayStart = startOfDay(currentDate)
        const dayEnd = endOfDay(currentDate)

        return salesEvents.filter(
          (event) => event.start instanceof Date && event.start >= dayStart && event.start <= dayEnd,
        )
      case "hour":
        const hourStart = new Date(currentDate)
        hourStart.setMinutes(0, 0, 0)

        const hourEnd = new Date(hourStart)
        hourEnd.setHours(hourStart.getHours() + 1)

        return salesEvents.filter(
          (event) =>
            event.start instanceof Date &&
            ((event.start >= hourStart && event.start < hourEnd) ||
              (event.start < hourStart && event.end instanceof Date && event.end > hourStart)),
        )
      case "minute":
        const minuteStart = new Date(currentDate)
        minuteStart.setSeconds(0, 0)

        const minuteEnd = new Date(minuteStart)
        minuteEnd.setMinutes(minuteStart.getMinutes() + 15)

        return salesEvents.filter(
          (event) =>
            event.start instanceof Date &&
            ((event.start >= minuteStart && event.start < minuteEnd) ||
              (event.start < minuteStart && event.end instanceof Date && event.end > minuteStart)),
        )
    }

    // Default return empty array if no match (should never reach here)
    return []
  }

  // Get status color based on event status
  const getStatusColor = (status: SalesEvent["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get type icon based on event type
  const getTypeIcon = (type: SalesEvent["type"]) => {
    switch (type) {
      case "meeting":
        return "👥"
      case "call":
        return "📞"
      case "presentation":
        return "📊"
      case "follow-up":
        return "📝"
      default:
        return "📅"
    }
  }

  // Get recurrence icon if event is recurring
  const getRecurrenceIcon = (event: SalesEvent) => {
    if (event.recurrence && event.recurrence.type !== "none") {
      return <Repeat className="h-3 w-3 text-blue-500" />
    }
    return null
  }

  // Handle event click
  const handleEventClick = (event: SalesEvent) => {
    setSelectedEventForDetails(event)
    setEventDetailsDialogOpen(true)
  }

  // Handle create new event
  const handleCreateEvent = () => {
    setSelectedEvent(undefined)
    setIsEventDialogOpen(true)
  }

  // Handle event saved
  const handleEventSaved = (eventId: string) => {
    // Reload events
    loadEvents()
  }

  // Handle event delete
  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.uid) return

    try {
      await deleteSalesEvent(eventId, user.uid)
      loadEvents()
    } catch (error) {
      console.error("Error deleting event:", error)
      // Handle error (show toast, etc.)
    }
  }

  // Render calendar based on current view
  const renderCalendar = () => {
    const filteredEvents = getFilteredSalesEvents()

    switch (view) {
      case "month":
        return renderMonthView(filteredEvents)
      case "week":
        return renderWeekView(filteredEvents)
      case "day":
        return renderDayView(filteredEvents)
      case "hour":
        return renderHourView(filteredEvents)
      case "minute":
        return renderMinuteView(filteredEvents)
    }
  }

  // Month view renderer
  const renderMonthView = (events: SalesEvent[]) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Create array of day numbers with empty slots for the first week
    const days = Array(firstDay)
      .fill(null)
      .concat([...Array(daysInMonth)].map((_, i) => i + 1))

    // Group events by day
    const eventsByDay: { [key: number]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        const day = event.start.getDate()
        if (!eventsByDay[day]) eventsByDay[day] = []
        eventsByDay[day].push(event)
      }
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

          const dayEvents = day ? eventsByDay[day] || [] : []

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
                    {dayEvents.slice(0, 2).map((event, j) => (
                      <div
                        key={`event-${day}-${j}`}
                        className="text-[10px] sm:text-xs p-1 mb-1 rounded bg-gray-50 truncate cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEventClick(event)}
                        style={{ borderLeft: `3px solid ${event.color || "#3b82f6"}` }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{getTypeIcon(event.type)}</span>
                          <span className="truncate">{event.title}</span>
                          {getRecurrenceIcon(event) && <span className="ml-auto">{getRecurrenceIcon(event)}</span>}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div
                        className="text-[10px] sm:text-xs text-center text-blue-600 font-medium cursor-pointer hover:underline"
                        onClick={() => {
                          // Set the current date to this day and switch to day view
                          const newDate = new Date(year, month, day)
                          setCurrentDate(newDate)
                          setView("day")
                        }}
                      >
                        +{dayEvents.length - 2} more
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
  const renderWeekView = (events: SalesEvent[]) => {
    const weekStart = startOfWeek(currentDate)

    const days = Array(7)
      .fill(null)
      .map((_, i) => {
        const day = new Date(weekStart)
        day.setDate(weekStart.getDate() + i)
        return day
      })

    // Group events by day
    const eventsByDay: { [key: string]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        const day = event.start.toDateString()
        if (!eventsByDay[day]) eventsByDay[day] = []
        eventsByDay[day].push(event)
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
              <div className="text-[10px] sm:text-sm">{format(day, "EEE").charAt(0)}</div>
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
          const dayEvents = eventsByDay[day.toDateString()] || []

          return (
            <div
              key={`day-${i}`}
              className={`border rounded-md overflow-hidden ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="overflow-y-auto h-[250px] sm:h-[400px] p-1">
                {dayEvents.map((event, j) => (
                  <div
                    key={`event-${i}-${j}`}
                    className="p-1 sm:p-2 mb-1 sm:mb-2 rounded bg-white border border-gray-200 text-[10px] sm:text-sm cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEventClick(event)}
                    style={{ borderLeft: `3px solid ${event.color || "#3b82f6"}` }}
                  >
                    <div className="font-medium truncate flex items-center justify-between">
                      <span>{event.title}</span>
                      {getRecurrenceIcon(event) && <span className="ml-1">{getRecurrenceIcon(event)}</span>}
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-500 mt-1">
                      {event.start instanceof Date && formatTime(event.start)} -{" "}
                      {event.end instanceof Date && formatTime(event.end)}
                    </div>
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <Badge variant="outline" className={`${getStatusColor(event.status)} text-[8px] sm:text-xs px-1`}>
                        {event.status}
                      </Badge>
                      <span className="text-[8px] sm:text-xs truncate max-w-[60px] sm:max-w-none">
                        {event.clientName}
                      </span>
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[10px] sm:text-sm">
                    No events scheduled
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
  const renderDayView = (events: SalesEvent[]) => {
    // Create array of hours
    const hours = Array(24)
      .fill(null)
      .map((_, i) => i)

    // Group events by hour
    const eventsByHour: { [key: number]: SalesEvent[] } = {}
    events.forEach((event) => {
      if (event.start instanceof Date) {
        const hour = event.start.getHours()
        if (!eventsByHour[hour]) eventsByHour[hour] = []
        eventsByHour[hour].push(event)
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
                className="h-16 sm:h-20 border-b border-gray-200 p-1 sm:p-2 text-right text-[10px] sm:text-sm text-gray-500"
              >
                {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Content column */}
          <div>
            {hours.map((hour) => {
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
                  className={`h-16 sm:h-20 border-b border-gray-200 p-1 relative ${isCurrentHour ? "bg-blue-50" : ""}`}
                >
                  {hourEvents.map((event, i) => {
                    if (!(event.start instanceof Date) || !(event.end instanceof Date)) return null

                    return (
                      <div
                        key={`event-${hour}-${i}`}
                        className="absolute left-1 right-1 p-1 rounded bg-white border border-gray-200 shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50"
                        style={{
                          top: `${(event.start.getMinutes() / 60) * 100}%`,
                          height: `${Math.max(10, ((event.end.getTime() - event.start.getTime()) / (60 * 60 * 1000)) * 100)}%`,
                          maxHeight: "95%",
                          zIndex: i + 1,
                          borderLeft: `3px solid ${event.color || "#3b82f6"}`,
                        }}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="font-medium truncate flex items-center justify-between">
                          <span>{event.title}</span>
                          {getRecurrenceIcon(event) && <span className="ml-1">{getRecurrenceIcon(event)}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0 sm:mt-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(event.status)} text-[8px] sm:text-[10px] px-1`}
                          >
                            {event.status}
                          </Badge>
                          <span className="text-[8px] sm:text-[10px]">{getTypeIcon(event.type)}</span>
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

  // Hour view renderer
  const renderHourView = (events: SalesEvent[]) => {
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
                  {format(time, "h:mm a")}
                </div>
              )
            })}
          </div>

          {/* Content column */}
          <div>
            {intervals.map((interval) => {
              const time = new Date(currentDate)
              time.setMinutes(interval, 0, 0)

              const intervalEvents = events.filter((event) => {
                if (!(event.start instanceof Date) || !(event.end instanceof Date)) return false

                const intervalEnd = new Date(time)
                intervalEnd.setMinutes(time.getMinutes() + 5)

                return (event.start >= time && event.start < intervalEnd) || (event.start < time && event.end > time)
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
                    {intervalEvents.map((event, i) => (
                      <div
                        key={`event-${interval}-${i}`}
                        className="flex-1 min-w-[80px] sm:min-w-[150px] p-1 sm:p-2 rounded bg-white border border-gray-200 shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEventClick(event)}
                        style={{ borderLeft: `3px solid ${event.color || "#3b82f6"}` }}
                      >
                        <div className="font-medium truncate flex items-center justify-between">
                          <span>{event.title}</span>
                          {getRecurrenceIcon(event) && <span className="ml-1">{getRecurrenceIcon(event)}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0 sm:mt-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(event.status)} text-[8px] sm:text-[10px] px-1`}
                          >
                            {event.status}
                          </Badge>
                          <span className="text-[8px] sm:text-[10px]">
                            {event.start instanceof Date && formatTime(event.start)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {intervalEvents.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">
                        No events in this time slot
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
  const renderMinuteView = (events: SalesEvent[]) => {
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
                  {format(time, "h:mm a")}
                </div>
              )
            })}
          </div>

          {/* Content column */}
          <div>
            {intervals.map((minute) => {
              const time = new Date(currentDate)
              time.setMinutes(minute, 0, 0)

              const minuteEvents = events.filter((event) => {
                if (!(event.start instanceof Date) || !(event.end instanceof Date)) return false

                const minuteEnd = new Date(time)
                minuteEnd.setMinutes(time.getMinutes() + 1)

                return (event.start >= time && event.start < minuteEnd) || (event.start < time && event.end > time)
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
                    {minuteEvents.map((event, i) => (
                      <div
                        key={`event-${minute}-${i}`}
                        className="flex-1 min-w-[70px] sm:min-w-[120px] p-1 rounded bg-white border border-gray-200 shadow-sm text-[8px] sm:text-[10px] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEventClick(event)}
                        style={{ borderLeft: `3px solid ${event.color || "#3b82f6"}` }}
                      >
                        <div className="font-medium truncate flex items-center justify-between">
                          <span>{event.title}</span>
                          {getRecurrenceIcon(event) && <span className="ml-1">{getRecurrenceIcon(event)}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(event.status)} text-[6px] sm:text-[8px] px-1`}
                          >
                            {event.status}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px]">
                            {event.start instanceof Date && formatTime(event.start)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {minuteEvents.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">
                        No events at this time
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
          <h1 className="text-2xl font-bold">Sales Planner</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button onClick={handleCreateEvent} className="flex items-center gap-2 w-full sm:w-auto">
              <Plus size={16} />
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
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

              {/* View controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <form className="relative flex-1" onSubmit={(e) => e.preventDefault()}>
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search events..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("all")
                          setFilterStatus("all")
                          setShowRecurringOnly(false)
                        }}
                      >
                        All Events
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("meeting")
                          setFilterStatus("all")
                        }}
                      >
                        Meetings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("call")
                          setFilterStatus("all")
                        }}
                      >
                        Calls
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("presentation")
                          setFilterStatus("all")
                        }}
                      >
                        Presentations
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("follow-up")
                          setFilterStatus("all")
                        }}
                      >
                        Follow-ups
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("all")
                          setFilterStatus("scheduled")
                        }}
                      >
                        Scheduled
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("all")
                          setFilterStatus("completed")
                        }}
                      >
                        Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFilterType("all")
                          setFilterStatus("cancelled")
                        }}
                      >
                        Cancelled
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setShowRecurringOnly(true)
                          setFilterType("all")
                          setFilterStatus("all")
                        }}
                      >
                        Recurring Events
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

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
      </div>

      {/* Event Dialog */}
      {user && (
        <EventDialog
          isOpen={isEventDialogOpen}
          onClose={() => setIsEventDialogOpen(false)}
          event={selectedEvent}
          onEventSaved={handleEventSaved}
          department="sales"
        />
      )}

      {/* Event Details Dialog */}
      <EventDetailsDialog
        isOpen={eventDetailsDialogOpen}
        onClose={() => setEventDetailsDialogOpen(false)}
        event={selectedEventForDetails}
      />
    </div>
  )
}
