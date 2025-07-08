"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react"
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ServiceAssignment {
  id: string
  type: string
  date: number
  color: string
  alarmDate?: Timestamp
  serviceType?: string
  status?: string
  saNumber?: string
  projectSiteName?: string
  assignedTo?: string
  alarmTime?: string
}

const months = [
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

const dayHeaders = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

// Color mapping for different service types
const getColorForType = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    "Roll up": "bg-blue-500",
    Maintenance: "bg-green-500",
    Repair: "bg-purple-500",
    Installation: "bg-cyan-500",
    Inspection: "bg-orange-500",
    Cleaning: "bg-red-500",
    default: "bg-gray-500",
  }
  return colorMap[type] || colorMap.default
}

// Get unique service types for filter
const getUniqueServiceTypes = (assignments: ServiceAssignment[]): string[] => {
  const types = assignments.map((assignment) => assignment.serviceType || assignment.type).filter(Boolean)
  return Array.from(new Set(types))
}

export function LogisticsCalendar() {
  // Get current date
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth()) // Current month (0-indexed)
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear()) // Current year
  const [saType, setSaType] = useState("")
  const [sites, setSites] = useState("")
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([])
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // Fetch service assignments from Firestore
  useEffect(() => {
    const fetchServiceAssignments = async () => {
      try {
        setLoading(true)

        // Create date range for the current month
        const startOfMonth = new Date(currentYear, currentMonth, 1)
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

        const q = query(
          collection(db, "service_assignments"),
          where("alarmDate", ">=", Timestamp.fromDate(startOfMonth)),
          where("alarmDate", "<=", Timestamp.fromDate(endOfMonth)),
        )

        const querySnapshot = await getDocs(q)
        const assignments: ServiceAssignment[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const alarmDate = data.alarmDate?.toDate()

          if (alarmDate) {
            const serviceType = data.serviceType || "Unknown"
            assignments.push({
              id: doc.id,
              type: serviceType,
              date: alarmDate.getDate(),
              color: getColorForType(serviceType),
              alarmDate: data.alarmDate,
              serviceType: data.serviceType,
              status: data.status,
              saNumber: data.saNumber,
              projectSiteName: data.projectSiteName,
              assignedTo: data.assignedTo,
              alarmTime: data.alarmTime,
            })
          }
        })

        setServiceAssignments(assignments)
        setAvailableServiceTypes(getUniqueServiceTypes(assignments))
      } catch (error) {
        console.error("Error fetching service assignments:", error)
        setServiceAssignments([])
        setAvailableServiceTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  // Get days in month and starting day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value)
    setCurrentMonth(selectedDate.getMonth())
    setCurrentYear(selectedDate.getFullYear())
    setShowFallbackPicker(false)
  }

  const handleMonthClick = () => {
    try {
      if (hiddenInputRef.current && typeof hiddenInputRef.current.showPicker === "function") {
        hiddenInputRef.current.showPicker()
      } else {
        // Fallback: focus the input to trigger the picker
        if (hiddenInputRef.current) {
          hiddenInputRef.current.focus()
          hiddenInputRef.current.click()
        }
        setShowFallbackPicker(true)
      }
    } catch (error) {
      console.warn("showPicker not supported, using fallback", error)
      // Fallback approach
      setShowFallbackPicker(true)
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus()
      }
    }
  }

  const getEventsForDay = (day: number) => {
    let filteredAssignments = serviceAssignments.filter((assignment) => assignment.date === day)

    // Filter by SA Type if selected
    if (saType) {
      filteredAssignments = filteredAssignments.filter((assignment) => assignment.serviceType === saType)
    }

    return filteredAssignments
  }

  // Check if a day is today
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  // Format current date for input value
  const currentDateValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center relative">
          <button
            onClick={handleMonthClick}
            className="flex items-center space-x-2 text-lg font-semibold hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <span>
              {months[currentMonth]} {currentYear}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Hidden month input */}
          <input
            ref={hiddenInputRef}
            type="month"
            value={currentDateValue}
            onChange={handleDateChange}
            className={`absolute ${showFallbackPicker ? "opacity-100 z-10" : "opacity-0 pointer-events-none"} 
              ${showFallbackPicker ? "top-full left-0 mt-1 border border-gray-300 rounded px-2 py-1 bg-white shadow-lg" : ""}`}
            style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px" }}
            onBlur={() => setShowFallbackPicker(false)}
          />
        </div>

        <div className="flex items-center space-x-4">
          <Select value={saType} onValueChange={setSaType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-SA Type-" />
            </SelectTrigger>
            <SelectContent>
              {availableServiceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sites} onValueChange={setSites}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-All sites-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
              <SelectItem value="site3">Site 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 rounded-t-md">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border border-gray-200">
        {calendarDays.map((day, index) => (
          <div key={index} className="min-h-[100px] p-2 border-r border-b border-gray-200">
            {day && (
              <>
                <div
                  className={`text-sm font-medium mb-1 ${isToday(day) ? "text-blue-600 font-bold bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-900"}`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <div className="text-xs text-gray-400">Loading...</div>
                  ) : (
                    getEventsForDay(day).map((assignment) => (
                      <div
                        key={assignment.id}
                        className={`${assignment.color} text-white text-xs px-2 py-1 rounded text-center font-medium`}
                        title={`SA: ${assignment.saNumber || "N/A"} - ${assignment.projectSiteName || "Unknown Site"} - ${assignment.alarmTime || "No time"} - Status: ${assignment.status || "Unknown"}`}
                      >
                        {assignment.saNumber || assignment.id}: {assignment.serviceType || assignment.type}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
