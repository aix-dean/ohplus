"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ServiceAssignment {
  id: string
  saNumber?: string
  serviceType?: string
  status?: string
  alarmDate?: Timestamp
  alarmTime?: string
  projectSiteName?: string
  assignedTo?: string
}

const MONTHS = [
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

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

export default function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<ServiceAssignment[]>([])
  const [selectedSAType, setSelectedSAType] = useState<string>("all")
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)

  let hiddenInputRef: HTMLInputElement | null = null

  useEffect(() => {
    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  useEffect(() => {
    filterAssignments()
  }, [assignments, selectedSAType])

  const fetchServiceAssignments = async () => {
    try {
      setLoading(true)

      // Create date range for the current month
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      const q = query(
        collection(db, "service_assignments"),
        where("alarmDate", ">=", Timestamp.fromDate(startOfMonth)),
        where("alarmDate", "<=", Timestamp.fromDate(endOfMonth)),
      )

      const querySnapshot = await getDocs(q)
      const assignmentsData: ServiceAssignment[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignmentsData.push({
          id: doc.id,
          ...data,
        } as ServiceAssignment)
      })

      setAssignments(assignmentsData)

      // Extract unique service types for filter
      const types = [...new Set(assignmentsData.map((a) => a.serviceType).filter(Boolean))]
      setAvailableTypes(types)
    } catch (error) {
      console.error("Error fetching service assignments:", error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const filterAssignments = () => {
    if (selectedSAType === "all") {
      setFilteredAssignments(assignments)
    } else {
      setFilteredAssignments(assignments.filter((a) => a.serviceType === selectedSAType))
    }
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

  const getAssignmentsForDay = (day: number) => {
    return filteredAssignments.filter((assignment) => {
      if (!assignment.alarmDate) return false
      const assignmentDate = assignment.alarmDate.toDate()
      return (
        assignmentDate.getDate() === day &&
        assignmentDate.getMonth() === currentMonth &&
        assignmentDate.getFullYear() === currentYear
      )
    })
  }

  const getColorForType = (serviceType: string) => {
    const colors = {
      "Roll up": "bg-blue-500",
      Installation: "bg-green-500",
      Maintenance: "bg-orange-500",
      Repair: "bg-red-500",
      Inspection: "bg-purple-500",
    }
    return colors[serviceType as keyof typeof colors] || "bg-gray-500"
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
      if (hiddenInputRef && typeof hiddenInputRef.showPicker === "function") {
        hiddenInputRef.showPicker()
      } else if (hiddenInputRef) {
        hiddenInputRef.focus()
        hiddenInputRef.click()
      } else {
        setShowFallbackPicker(true)
      }
    } catch (error) {
      console.error("Error showing picker:", error)
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

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] border border-gray-200 bg-gray-50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAssignments = getAssignmentsForDay(day)
      const todayClass = isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""

      days.push(
        <div key={day} className={`min-h-[120px] border border-gray-200 p-2 ${todayClass}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-medium ${isToday(day) ? "text-blue-600" : "text-gray-900"}`}>{day}</span>
            {isToday(day) && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
          </div>
          <div className="space-y-1">
            {dayAssignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs text-white font-medium hover:opacity-80 transition-opacity cursor-pointer ${getColorForType(assignment.serviceType || "")}`}
              >
                {assignment.saNumber}: {assignment.serviceType}
              </button>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button onClick={handleMonthClick} className="text-xl font-semibold hover:text-blue-600 transition-colors">
            {MONTHS[currentMonth]} {currentYear}
          </button>

          <Button variant="ghost" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedSAType} onValueChange={setSelectedSAType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="SA Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hidden month input for native picker */}
      <input
        ref={(ref) => {
          hiddenInputRef = ref
        }}
        type="month"
        value={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
        onChange={handleMonthChange}
        className={showFallbackPicker ? "mb-4" : "sr-only absolute -left-[9999px]"}
        style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px", opacity: 0 }}
      />

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {loading ? (
            <div className="col-span-7 p-8 text-center text-gray-500">Loading assignments...</div>
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>
    </div>
  )
}
