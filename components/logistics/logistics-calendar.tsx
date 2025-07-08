"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface ServiceAssignment {
  id: string
  saNumber?: string
  serviceType?: string
  status?: string
  alarmDate?: any
  alarmTime?: string
  coveredDateStart?: any
  coveredDateEnd?: any
  projectSiteName?: string
  projectSiteLocation?: string
  projectSiteId?: string
  assignedTo?: string
  jobDescription?: string
  message?: string
  requestedBy?: {
    name?: string
    department?: string
    id?: string
  }
  attachments?: any[]
  created?: any
  updated?: any
}

interface CalendarEvent {
  id: string
  type: string
  date: Date
  color: string
}

export default function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [selectedSAType, setSelectedSAType] = useState("all")
  const [selectedSite, setSelectedSite] = useState("all")
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

  useEffect(() => {
    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  useEffect(() => {
    filterEvents()
  }, [assignments, selectedSAType, selectedSite])

  const fetchServiceAssignments = async () => {
    try {
      setLoading(true)

      // Create date range for the current month
      const startDate = new Date(currentYear, currentMonth, 1)
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      const q = query(
        collection(db, "service_assignments"),
        where("alarmDate", ">=", startDate),
        where("alarmDate", "<=", endDate),
        orderBy("alarmDate"),
      )

      const querySnapshot = await getDocs(q)
      const fetchedAssignments: ServiceAssignment[] = []
      const types = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ServiceAssignment
        fetchedAssignments.push({
          id: doc.id,
          ...data,
        })
        if (data.serviceType) {
          types.add(data.serviceType)
        }
      })

      setAssignments(fetchedAssignments)
      setServiceTypes(Array.from(types))
    } catch (error) {
      console.error("Error fetching service assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filteredAssignments = assignments

    if (selectedSAType !== "all") {
      filteredAssignments = filteredAssignments.filter((assignment) => assignment.serviceType === selectedSAType)
    }

    if (selectedSite !== "all") {
      filteredAssignments = filteredAssignments.filter((assignment) => assignment.projectSiteName === selectedSite)
    }

    const calendarEvents: CalendarEvent[] = filteredAssignments.map((assignment) => ({
      id: assignment.id,
      type: assignment.serviceType || "Unknown",
      date: assignment.alarmDate?.toDate() || new Date(),
      color: getColorForType(assignment.serviceType || "Unknown"),
    }))

    setEvents(calendarEvents)
  }

  const getColorForType = (type: string) => {
    const colorMap: { [key: string]: string } = {
      Installation: "bg-blue-500",
      Maintenance: "bg-green-500",
      Repair: "bg-red-500",
      Inspection: "bg-yellow-500",
      "Roll up": "bg-blue-500",
      Cleaning: "bg-purple-500",
      Setup: "bg-orange-500",
      Removal: "bg-gray-500",
    }
    return colorMap[type] || "bg-gray-500"
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleMonthClick = () => {
    try {
      if (hiddenInputRef.current) {
        // Try to use showPicker if available
        if (typeof hiddenInputRef.current.showPicker === "function") {
          hiddenInputRef.current.showPicker()
        } else {
          // Fallback: focus and click the input
          hiddenInputRef.current.focus()
          hiddenInputRef.current.click()
        }
      }
    } catch (error) {
      console.error("Error showing picker:", error)
      // Final fallback: show visible input
      setShowFallbackPicker(true)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split("-")
    setCurrentYear(Number.parseInt(year))
    setCurrentMonth(Number.parseInt(month) - 1)
    setShowFallbackPicker(false)
  }

  const handleAssignmentClick = (assignmentId: string) => {
    router.push(`/logistics/site-information/${assignmentId}`)
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === day && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
      )
    })
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border-b border-r border-gray-200"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day)
      const todayClass = isToday(day) ? "text-blue-600 font-bold bg-blue-50" : ""

      days.push(
        <div key={day} className={`h-24 border-b border-r border-gray-200 p-1 ${todayClass}`}>
          <div className="text-sm font-medium mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => {
              const assignment = assignments.find((a) => a.id === event.id)
              return (
                <button
                  key={index}
                  onClick={() => handleAssignmentClick(event.id)}
                  className={`${event.color} text-white text-xs px-2 py-1 rounded block w-full text-left truncate hover:opacity-80 cursor-pointer`}
                  title={`${assignment?.saNumber}: ${event.type}`}
                >
                  {assignment?.saNumber}: {event.type}
                </button>
              )
            })}
            {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>}
          </div>
        </div>,
      )
    }

    return days
  }

  const currentMonthValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            onClick={handleMonthClick}
            className="flex items-center space-x-2 text-lg font-semibold hover:text-blue-600"
          >
            <span>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <CalendarIcon className="h-4 w-4" />
          </button>

          <input
            ref={hiddenInputRef}
            type="month"
            value={currentMonthValue}
            onChange={handleMonthChange}
            className={
              showFallbackPicker ? "px-2 py-1 border rounded" : "absolute -left-[9999px] -top-[9999px] opacity-0"
            }
            style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px", top: "-9999px" }}
          />

          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedSAType} onValueChange={setSelectedSAType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="SA Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {Array.from(new Set(assignments.map((a) => a.projectSiteName).filter(Boolean))).map((site) => (
                <SelectItem key={site} value={site!}>
                  {site}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border border-gray-200">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-l border-gray-200">
            {loading ? <div className="col-span-7 text-center py-8">Loading events...</div> : renderCalendarDays()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
