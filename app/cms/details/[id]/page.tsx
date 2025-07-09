"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getProductById, softDeleteProduct, type Product } from "@/lib/firebase-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  MapPin,
  FileText,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle,
  AlertCircle,
  Power,
  RefreshCw,
  Play,
  Pause,
  RotateCw,
  Wifi,
  WifiOff,
  ThermometerSun,
  Zap,
  Monitor,
  Plus,
  Clock3,
  Layers,
  ScreenShare,
  RefreshCcw,
  ImageIcon,
  SunMedium,
  ChevronLeft,
  ChevronRight,
  List,
  ZoomIn,
  ZoomOut,
  Filter,
  Search,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { LoopTimeline } from "@/components/loop-timeline"

// Mock data for ad spots
const adSpots = [
  {
    id: "SPOT001",
    name: "Morning Slot",
    duration: "15 seconds",
    startTime: "06:00 AM",
    endTime: "12:00 PM",
    status: "Active",
    advertiser: "Coca Cola",
    price: "PHP 1,200",
    start: new Date(2023, 5, 5, 6, 0), // June 5, 2023, 6:00 AM
    end: new Date(2023, 5, 5, 12, 0), // June 5, 2023, 12:00 PM
  },
  {
    id: "SPOT002",
    name: "Afternoon Slot",
    duration: "30 seconds",
    startTime: "12:00 PM",
    endTime: "06:00 PM",
    status: "Active",
    advertiser: "Samsung",
    price: "PHP 1,800",
    start: new Date(2023, 5, 12, 12, 0), // June 12, 2023, 12:00 PM
    end: new Date(2023, 5, 12, 18, 0), // June 12, 2023, 6:00 PM
  },
  {
    id: "SPOT003",
    name: "Evening Slot",
    duration: "15 seconds",
    startTime: "06:00 PM",
    endTime: "12:00 AM",
    status: "Pending",
    advertiser: "Nike",
    price: "PHP 2,100",
    start: new Date(2023, 5, 15, 18, 0), // June 15, 2023, 6:00 PM
    end: new Date(2023, 5, 15, 23, 59), // June 15, 2023, 11:59 PM
  },
  {
    id: "SPOT004",
    name: "Late Night Slot",
    duration: "30 seconds",
    startTime: "12:00 AM",
    endTime: "06:00 AM",
    status: "Available",
    advertiser: "-",
    price: "PHP 900",
    start: new Date(2023, 5, 22, 0, 0), // June 22, 2023, 12:00 AM
    end: new Date(2023, 5, 22, 6, 0), // June 22, 2023, 6:00 AM
  },
  {
    id: "SPOT005",
    name: "Weekend Special",
    duration: "45 seconds",
    startTime: "10:00 AM",
    endTime: "08:00 PM",
    status: "Active",
    advertiser: "Apple",
    price: "PHP 2,500",
    start: new Date(2023, 5, 17, 10, 0), // June 17, 2023, 10:00 AM
    end: new Date(2023, 5, 17, 20, 0), // June 17, 2023, 8:00 PM
  },
  {
    id: "SPOT006",
    name: "Prime Time",
    duration: "20 seconds",
    startTime: "07:00 PM",
    endTime: "09:00 PM",
    status: "Pending",
    advertiser: "McDonald's",
    price: "PHP 2,200",
    start: new Date(2023, 5, 8, 19, 0), // June 8, 2023, 7:00 PM
    end: new Date(2023, 5, 8, 21, 0), // June 8, 2023, 9:00 PM
  },
]

// Mock data for service assignments
const serviceAssignments = [
  {
    id: "SA001",
    title: "Routine Maintenance",
    assignedTo: "John Doe",
    date: "2023-05-15",
    status: "Completed",
    notes: "Cleaned display, checked connections, updated firmware",
  },
  {
    id: "SA002",
    title: "Panel Replacement",
    assignedTo: "Sarah Johnson",
    date: "2023-06-02",
    status: "In Progress",
    notes: "Replacing damaged LED panels on the right side",
  },
  {
    id: "SA003",
    title: "Network Troubleshooting",
    assignedTo: "Mike Chen",
    date: "2023-06-10",
    status: "Scheduled",
    notes: "Investigating intermittent connectivity issues",
  },
  {
    id: "SA004",
    title: "Emergency Repair",
    assignedTo: "Lisa Wong",
    date: "2023-04-28",
    status: "Completed",
    notes: "Fixed power supply issue after storm damage",
  },
]

// Mock data for LED site status
const ledStatus = {
  power: "On",
  connection: "Online",
  lastReboot: "2023-05-30 09:15 AM",
  temperature: "32°C",
  brightness: 80,
  activeContent: "Summer Campaign 2023",
  errors: [],
  warnings: ["High temperature detected"],
  volume: 65,
  timeSync: "2023-05-30 08:00 AM",
  videoSource: "HDMI 1",
}

// Category interface
interface Category {
  id: string
  name: string
  type: string
  position: number
  photo_url?: string
}

// Types for calendar
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

const formatDate = (timestamp: any) => {
  if (!timestamp) return "N/A"

  if (typeof timestamp === "string") {
    return timestamp
  }

  try {
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Handle Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    return "N/A"
  } catch (err) {
    return "N/A"
  }
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("adSpots")
  const [brightness, setBrightness] = useState(ledStatus.brightness)
  const [volume, setVolume] = useState(ledStatus.volume)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isPerformingAction, setIsPerformingAction] = useState(false)
  const [viewMode, setViewMode] = useState<"details" | "calendar">("details")
  const [calendarView, setCalendarView] = useState<CalendarViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState("")

  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  // Update the useEffect to handle the tab change if "details" is selected
  useEffect(() => {
    if (activeTab === "details") {
      setActiveTab("adSpots")
    }
  }, [activeTab])

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return

      try {
        setLoading(true)
        const productData = await getProductById(params.id)

        if (!productData) {
          setError("Product not found")
          return
        }

        setProduct(productData)
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  // Fetch categories
  useEffect(() => {
    if (!product || !product.categories || product.categories.length === 0) return

    async function fetchCategories() {
      try {
        setIsLoadingCategories(true)
        const categoriesRef = collection(db, "categories")
        const q = query(categoriesRef, where("active", "==", true), where("deleted", "==", false))

        const querySnapshot = await getDocs(q)
        const categoriesData: Category[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          categoriesData.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            position: data.position || 0,
            photo_url: data.photo_url,
          })
        })

        // Sort categories by position
        categoriesData.sort((a, b) => a.position - b.position)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [product])

  // Handle delete
  const handleDelete = async () => {
    if (!product) return

    try {
      await softDeleteProduct(product.id)

      toast({
        title: "Product deleted",
        description: `${product.name} has been successfully deleted.`,
      })

      // Navigate back to the dashboard
      router.push("/cms/dashboard")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  // Handle edit
  const handleEdit = () => {
    if (!product) return
    router.push(`/cms/content/edit/${product.id}`)
  }

  // Handle back
  const handleBack = () => {
    router.push("/cms/dashboard")
  }

  // Remote control functions
  const handlePowerToggle = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Power toggled",
        description: `The LED site has been turned ${ledStatus.power === "On" ? "off" : "on"}.`,
      })
    }, 1000)
  }

  // Handle reboot
  const handleReboot = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Reboot initiated",
        description: "The LED site is now rebooting. This may take a few minutes.",
      })
    }, 1500)
  }

  // Handle play pause
  const handlePlayPause = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Content playback toggled",
        description: "Content playback has been toggled.",
      })
    }, 800)
  }

  // Handle brightness change
  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(Number(e.target.value))
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Status refreshed",
        description: "LED site status has been refreshed.",
      })
    }, 1200)
  }

  // Handle NTP time sync
  const handleTimeSync = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Time synchronized",
        description: "The LED site time has been synchronized with NTP server.",
      })
    }, 1000)
  }

  // Handle screenshot
  const handleScreenshot = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Screenshot captured",
        description: "A screenshot of the current display has been captured and saved.",
      })
    }, 1500)
  }

  // Handle video source switching
  const handleVideoSourceSwitch = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Video source switched",
        description: "The video source has been switched to the next available input.",
      })
    }, 1000)
  }

  // Handle screen refresh
  const handleScreenRefresh = () => {
    setIsPerformingAction(true)
    setTimeout(() => {
      setIsPerformingAction(false)
      toast({
        title: "Screen refreshed",
        description: "The screen has been refreshed successfully.",
      })
    }, 800)
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  // Calendar navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    switch (calendarView) {
      case "month":
        newDate.setMonth(currentDate.getMonth() - 1)
        break
      case "week":
        newDate.setDate(currentDate.getDate() - currentDate.getDay())
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
    switch (calendarView) {
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

    switch (calendarView) {
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

  // Filter ad spots based on current view
  const getFilteredAdSpots = () => {
    if (!adSpots.length) return []

    let filtered = [...adSpots]

    // Apply search filter if any
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (spot) => spot.name.toLowerCase().includes(term) || spot.advertiser.toLowerCase().includes(term),
      )
    }

    // Filter based on current view
    switch (calendarView) {
      case "month":
        return filtered.filter(
          (spot) =>
            spot.start.getMonth() === currentDate.getMonth() && spot.start.getFullYear() === currentDate.getFullYear(),
        )
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        weekEnd.setHours(23, 59, 59, 999)

        return filtered.filter((spot) => spot.start >= weekStart && spot.start < weekEnd)
      case "day":
        const dayStart = new Date(currentDate)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(currentDate)
        dayEnd.setHours(23, 59, 59, 999)

        return filtered.filter((spot) => spot.start >= dayStart && spot.start < dayEnd)
      case "hour":
        const hourStart = new Date(currentDate)
        hourStart.setMinutes(0, 0, 0)

        const hourEnd = new Date(hourStart)
        hourEnd.setHours(hourStart.getHours() + 1)

        return filtered.filter(
          (spot) =>
            (spot.start >= hourStart && spot.start < hourEnd) || (spot.start < hourStart && spot.end > hourStart),
        )
      case "minute":
        const minuteStart = new Date(currentDate)
        minuteStart.setSeconds(0, 0)

        const minuteEnd = new Date(minuteStart)
        minuteEnd.setMinutes(minuteStart.getMinutes() + 15)

        return filtered.filter(
          (spot) =>
            (spot.start >= minuteStart && spot.start < minuteEnd) ||
            (spot.start < minuteStart && spot.end > minuteStart),
        )
    }

    // Default return empty array if no match (should never reach here)
    return []
  }

  // Get status color based on ad spot status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Available":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Render calendar based on current view
  const renderCalendar = () => {
    const filteredSpots = getFilteredAdSpots()

    switch (calendarView) {
      case "month":
        return renderMonthView(filteredSpots)
      case "week":
        return renderWeekView(filteredSpots)
      case "day":
        return renderDayView(filteredSpots)
      case "hour":
        return renderHourView(filteredSpots)
      case "minute":
        return renderMinuteView(filteredSpots)
    }
  }

  // Month view renderer
  const renderMonthView = (spots: typeof adSpots) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Create array of day numbers with empty slots for the first week
    const days = Array(firstDay)
      .fill(null)
      .concat([...Array(daysInMonth)].map((_, i) => i + 1))

    // Group spots by day
    const spotsByDay: { [key: number]: typeof adSpots } = {}
    spots.forEach((spot) => {
      const day = spot.start.getDate()
      if (!spotsByDay[day]) spotsByDay[day] = []
      spotsByDay[day].push(spot)
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

          const daySpots = day ? spotsByDay[day] || [] : []

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
                    {daySpots.slice(0, 2).map((spot, j) => (
                      <div
                        key={`spot-${day}-${j}`}
                        className={`text-[10px] sm:text-xs p-1 mb-1 rounded ${getStatusColor(spot.status)} truncate cursor-pointer hover:bg-opacity-80`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate">{spot.name}</span>
                        </div>
                      </div>
                    ))}
                    {daySpots.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-center text-blue-600 font-medium">
                        +{daySpots.length - 2} more
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
  const renderWeekView = (spots: typeof adSpots) => {
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

    // Group spots by day
    const spotsByDay: { [key: string]: typeof adSpots } = {}
    spots.forEach((spot) => {
      const day = spot.start.toDateString()
      if (!spotsByDay[day]) spotsByDay[day] = []
      spotsByDay[day].push(spot)
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
          const daySpots = spotsByDay[day.toDateString()] || []

          return (
            <div
              key={`day-${i}`}
              className={`border rounded-md overflow-hidden ${isToday ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="overflow-y-auto h-[250px] sm:h-[400px] p-1">
                {daySpots.map((spot, j) => (
                  <div
                    key={`spot-${i}-${j}`}
                    className={`p-1 sm:p-2 mb-1 sm:mb-2 rounded ${getStatusColor(spot.status)} text-[10px] sm:text-sm cursor-pointer hover:bg-opacity-80`}
                  >
                    <div className="font-medium truncate">{spot.name}</div>
                    <div className="text-[8px] sm:text-xs mt-1">
                      {formatTime(spot.start)} - {formatTime(spot.end)}
                    </div>
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <Badge variant="outline" className="text-[8px] sm:text-xs px-1">
                        {spot.status}
                      </Badge>
                      <span className="text-[8px] sm:text-xs truncate max-w-[60px] sm:max-w-none">
                        {spot.advertiser}
                      </span>
                    </div>
                  </div>
                ))}
                {daySpots.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[10px] sm:text-sm">
                    No programs scheduled
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
  const renderDayView = (spots: typeof adSpots) => {
    // Create array of hours
    const hours = Array(24)
      .fill(null)
      .map((_, i) => i)

    // Group spots by hour
    const spotsByHour: { [key: number]: typeof adSpots } = {}
    spots.forEach((spot) => {
      const hour = spot.start.getHours()
      if (!spotsByHour[hour]) spotsByHour[hour] = []
      spotsByHour[hour].push(spot)
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
              const hourSpots = spotsByHour[hour] || []
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
                  {hourSpots.map((spot, i) => (
                    <div
                      key={`spot-${hour}-${i}`}
                      className={`absolute left-1 right-1 p-1 rounded ${getStatusColor(spot.status)} shadow-sm text-[8px] sm:text-xs cursor-pointer hover:bg-opacity-80`}
                      style={{
                        top: `${(spot.start.getMinutes() / 60) * 100}%`,
                        height: `${Math.max(10, ((spot.end.getTime() - spot.start.getTime()) / (60 * 60 * 1000)) * 100)}%`,
                        maxHeight: "95%",
                        zIndex: i + 1,
                      }}
                    >
                      <div className="font-medium truncate">{spot.name}</div>
                      <div className="flex items-center justify-between mt-0 sm:mt-1">
                        <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1">
                          {spot.status}
                        </Badge>
                        <span className="text-[8px] sm:text-[10px]">{spot.advertiser}</span>
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
  const renderHourView = (spots: typeof adSpots) => {
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

              const intervalSpots = spots.filter((spot) => {
                const intervalEnd = new Date(time)
                intervalEnd.setMinutes(time.getMinutes() + 5)

                return (spot.start >= time && spot.start < intervalEnd) || (spot.start < time && spot.end > time)
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
                    {intervalSpots.map((spot, i) => (
                      <div
                        key={`spot-${interval}-${i}`}
                        className={`flex-1 min-w-[70px] sm:min-w-[120px] p-1 rounded ${getStatusColor(spot.status)} shadow-sm text-[8px] sm:text-[10px] cursor-pointer hover:bg-opacity-80`}
                      >
                        <div className="font-medium truncate">{spot.name}</div>
                        <div className="flex items-center justify-between mt-0 sm:mt-1">
                          <Badge variant="outline" className="text-[6px] sm:text-[8px] px-1">
                            {spot.status}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px]">{formatTime(spot.start)}</span>
                        </div>
                      </div>
                    ))}
                    {intervalSpots.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-[10px]">
                        No programs in this time slot
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
  const renderMinuteView = (spots: typeof adSpots) => {
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

              const minuteSpots = spots.filter((spot) => {
                const minuteEnd = new Date(time)
                minuteEnd.setMinutes(time.getMinutes() + 1)

                return (spot.start >= time && spot.start < minuteEnd) || (spot.start < time && spot.end > time)
              })

              const isCurrentMinute =
                new Date().getHours() === time.getHours() &&
                new Date().getMinutes() === minute &&
                new Date().getDate() === time.getDate() &&
                new Date().getMonth() === time.getMonth() &&
                new Date().getFullYear() === new Date().getFullYear()

              return (
                <div
                  key={`content-${minute}`}
                  className={`h-10 sm:h-12 border-b border-gray-200 p-1 ${isCurrentMinute ? "bg-blue-50" : ""}`}
                >
                  <div className="flex flex-wrap gap-1">
                    {minuteSpots.map((spot, i) => (
                      <div
                        key={`spot-${minute}-${i}`}
                        className={`flex-1 min-w-[70px] sm:min-w-[120px] p-1 rounded ${getStatusColor(spot.status)} shadow-sm text-[8px] sm:text-[10px] cursor-pointer hover:bg-opacity-80`}
                      >
                        <div className="font-medium truncate">{spot.name}</div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[6px] sm:text-[8px] px-1">
                            {spot.status}
                          </Badge>
                          <span className="text-[6px] sm:text-[8px]">{formatTime(spot.start)}</span>
                        </div>
                      </div>
                    ))}
                    {minuteSpots.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] sm:text-[10px]">
                        No programs at this time
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

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading product details...</p>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 p-8 rounded-lg text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Product</h2>
          <p className="text-red-600 mb-4">{error || "Product not found"}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Remove the timestamp section from here
  return (
    <div className="flex-1 p-3 sm:p-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header with back button and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 w-full sm:w-auto bg-transparent"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button onClick={handleEdit} className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Edit size={16} />
              <span className="sm:inline">Edit</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Trash2 size={16} />
              <span className="sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        {/* Product title and status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-bold break-words">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={`${
                  product.status === "PUBLISHED" || product.status === "ACTIVE"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : product.status === "DRAFT"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {product.status}
              </Badge>
              {product.type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {product.type}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Product Summary Card - Always visible */}
        <Card className="border-gray-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Left side - Media and basic info */}
              <div className="md:col-span-8 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Featured Image */}
                  <div className="relative w-full h-48 md:w-48 md:h-32 bg-gray-100 rounded-md overflow-hidden shadow-sm flex-shrink-0">
                    <Image
                      src={product.media && product.media.length > 0 ? product.media[0].url : "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/abstract-geometric-sculpture.png"
                        target.className = "opacity-50 object-contain"
                      }}
                    />
                    {product.media && product.media.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        +{product.media.length - 1} more
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 mt-4 md:mt-0">
                    <div className="space-y-3 md:space-y-2">
                      {/* Description */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-1">Description</h3>
                        <p className="text-sm line-clamp-3 md:line-clamp-2">
                          {product.description || "No description available"}
                        </p>
                      </div>

                      {/* Location if available */}
                      {product.light && (
                        <div>
                          <h3 className="text-xs font-medium text-gray-500 mb-1">Location</h3>
                          <div className="flex items-start gap-1">
                            <MapPin size={14} className="text-gray-400 mt-0.5" />
                            <p className="text-sm break-words">{product.light.location}</p>
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      {product.categories && product.categories.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-gray-500 mb-1">Category</h3>
                          <div className="flex flex-wrap gap-1">
                            {isLoadingCategories ? (
                              <span className="text-xs text-gray-400">Loading categories...</span>
                            ) : (
                              <>
                                {product.categories.slice(0, 3).map((categoryId, index) => (
                                  <Badge key={index} variant="secondary" className="px-2 py-0.5 text-xs">
                                    {getCategoryName(categoryId)}
                                  </Badge>
                                ))}
                                {product.categories.length > 3 && (
                                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                                    +{product.categories.length - 3} more
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CMS Information for Dynamic content */}
                      {product.contentType?.toLowerCase() === "dynamic" ||
                      product.content_type?.toLowerCase() === "dynamic" ? (
                        <div>
                          <h3 className="text-xs font-medium text-gray-500 mb-1">CMS Configuration</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Layers size={12} className="text-gray-400" />
                              <span>
                                Spots per loop:{" "}
                                {product.cms?.spots_per_loop || product.cms?.spotsPerLoop || "Not specified"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <RefreshCw size={12} className="text-gray-400" />
                              <span>
                                Loops per day:{" "}
                                {product.cms?.loops_per_day || product.cms?.loopsPerDay || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Key details */}
              <div className="md:col-span-4 p-4 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-3">
                  {/* ID */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">ID</h3>
                    <p className="font-mono text-xs truncate">{product.id}</p>
                  </div>

                  {/* Dimensions if available */}
                  {product.specs_rental && (product.specs_rental.height || product.specs_rental.width) && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Dimensions</h3>
                      <p className="text-xs">
                        {product.specs_rental.height && `H: ${product.specs_rental.height}`}
                        {product.specs_rental.height && product.specs_rental.width && " × "}
                        {product.specs_rental.width && `W: ${product.specs_rental.width}`}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="col-span-2 mt-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Created: {formatDate(product.created)}</span>
                      </div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Updated: {formatDate(product.updated)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs
          defaultValue="adSpots"
          value={activeTab === "details" ? "adSpots" : activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-6 w-full overflow-x-auto">
            <TabsTrigger value="adSpots" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Calendar size={16} />
              <span className="text-xs sm:text-sm">Program List</span>
            </TabsTrigger>
            <TabsTrigger value="serviceAssignments" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <FileText size={16} />
              <span className="text-xs sm:text-sm">Service</span>
            </TabsTrigger>
            <TabsTrigger value="remoteControls" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Monitor size={16} />
              <span className="text-xs sm:text-sm">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="loopTimeline" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Clock size={16} />
              <span className="text-xs sm:text-sm">Loop Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Details Tab - Now empty since content moved above tabs */}
          <TabsContent value="details">{/* Content moved above tabs */}</TabsContent>

          {/* Ad Spots Tab */}
          <TabsContent value="adSpots">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={18} />
                  Program List
                </CardTitle>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as "details" | "calendar")}
                >
                  <ToggleGroupItem value="details" aria-label="Details View">
                    <List className="h-4 w-4 mr-1" />
                    List
                  </ToggleGroupItem>
                  <ToggleGroupItem value="calendar" aria-label="Calendar View">
                    <Calendar className="h-4 w-4 mr-1" />
                    Calendar
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {viewMode === "details" ? (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">ID</TableHead>
                            <TableHead className="whitespace-nowrap">Name</TableHead>
                            <TableHead className="whitespace-nowrap">Duration</TableHead>
                            <TableHead className="whitespace-nowrap">Time Slot</TableHead>
                            <TableHead className="whitespace-nowrap">Advertiser</TableHead>
                            <TableHead className="whitespace-nowrap">Price</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adSpots.map((spot) => (
                            <TableRow key={spot.id}>
                              <TableCell className="font-mono text-xs whitespace-nowrap">{spot.id}</TableCell>
                              <TableCell className="font-medium whitespace-nowrap">{spot.name}</TableCell>
                              <TableCell className="whitespace-nowrap">{spot.duration}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {spot.startTime} - {spot.endTime}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{spot.advertiser}</TableCell>
                              <TableCell className="whitespace-nowrap">{spot.price}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline" className={`${getStatusColor(spot.status)}`}>
                                  {spot.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end mt-4 px-4 sm:px-0">
                      <Button className="flex items-center gap-2">
                        <Plus size={16} />
                        Add Program
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 sm:px-0">
                    {/* Calendar View Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4">
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
                          <form className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search program list..."
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
                              <DropdownMenuItem>All Ad Spots</DropdownMenuItem>
                              <DropdownMenuItem>Active</DropdownMenuItem>
                              <DropdownMenuItem>Pending</DropdownMenuItem>
                              <DropdownMenuItem>Available</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tabs
                            defaultValue="month"
                            value={calendarView}
                            onValueChange={(v) => setCalendarView(v as CalendarViewType)}
                            className="flex-1"
                          >
                            <TabsList className="grid grid-cols-5 w-full">
                              <TabsTrigger value="month" className="text-xs">
                                <Calendar size={14} className="mr-1 hidden sm:inline" />
                                <span className="sm:hidden">M</span>
                                <span className="hidden sm:inline">Month</span>
                              </TabsTrigger>
                              <TabsTrigger value="week" className="text-xs">
                                <Calendar size={14} className="mr-1 hidden sm:inline" />
                                <span className="sm:hidden">W</span>
                                <span className="hidden sm:inline">Week</span>
                              </TabsTrigger>
                              <TabsTrigger value="day" className="text-xs">
                                <Calendar size={14} className="mr-1 hidden sm:inline" />
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
                                setCalendarView(
                                  calendarView === "month"
                                    ? "week"
                                    : calendarView === "week"
                                      ? "day"
                                      : calendarView === "day"
                                        ? "hour"
                                        : calendarView === "hour"
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
                                setCalendarView(
                                  calendarView === "minute"
                                    ? "hour"
                                    : calendarView === "hour"
                                      ? "day"
                                      : calendarView === "day"
                                        ? "week"
                                        : calendarView === "week"
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

                    {/* Calendar View */}
                    <div className="bg-white border rounded-lg p-2 sm:p-4 overflow-x-auto">
                      <div className="min-w-[640px]">{renderCalendar()}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Assignments Tab */}
          <TabsContent value="serviceAssignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} />
                  Service Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">ID</TableHead>
                        <TableHead className="whitespace-nowrap">Title</TableHead>
                        <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{assignment.id}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{assignment.title}</TableCell>
                          <TableCell className="whitespace-nowrap">{assignment.assignedTo}</TableCell>
                          <TableCell className="whitespace-nowrap">{assignment.date}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {assignment.status === "Completed" ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : assignment.status === "In Progress" ? (
                                <RefreshCw size={16} className="text-blue-500" />
                              ) : (
                                <Calendar size={16} className="text-amber-500" />
                              )}
                              <span
                                className={`${
                                  assignment.status === "Completed"
                                    ? "text-green-700"
                                    : assignment.status === "In Progress"
                                      ? "text-blue-700"
                                      : "text-amber-700"
                                }`}
                              >
                                {assignment.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{assignment.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4 px-4 sm:px-0">
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    Create Service Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remote Controls Tab */}
          <TabsContent value="remoteControls">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LED Status Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor size={18} />
                    LED Site Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Information */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Power Status</span>
                          <div className="flex items-center">
                            {ledStatus.power === "On" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Power size={14} className="mr-1" /> On
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                <Power size={14} className="mr-1" /> Off
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Connection</span>
                          <div className="flex items-center">
                            {ledStatus.connection === "Online" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Wifi size={14} className="mr-1" /> Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <WifiOff size={14} className="mr-1" /> Offline
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Temperature</span>
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className={`${
                                Number.parseInt(ledStatus.temperature) > 30
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              <ThermometerSun size={14} className="mr-1" /> {ledStatus.temperature}
                            </Badge>
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Video Source</span>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {ledStatus.videoSource}
                            </Badge>
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Active Content</span>
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 max-w-full truncate"
                            >
                              {ledStatus.activeContent}
                            </Badge>
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Last Time Sync</span>
                          <div className="flex items-center">
                            <span className="text-sm">{ledStatus.timeSync}</span>
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-sm font-medium block mb-1">Last Reboot</span>
                          <div className="flex items-center">
                            <span className="text-sm">{ledStatus.lastReboot}</span>
                          </div>
                        </div>
                      </div>

                      {/* Warnings and Errors */}
                      {ledStatus.warnings.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-center gap-2 text-amber-700 mb-2">
                            <AlertCircle size={16} />
                            <span className="font-medium">Warnings</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-amber-700 pl-2">
                            {ledStatus.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ledStatus.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center gap-2 text-red-700 mb-2">
                            <AlertTriangle size={16} />
                            <span className="font-medium">Errors</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-red-700 pl-2">
                            {ledStatus.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col">
                      <div className="text-sm font-medium mb-2">Live Preview</div>
                      <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden border">
                        <Image
                          src={product.media && product.media.length > 0 ? product.media[0].url : "/placeholder.svg"}
                          alt="LED Site Preview"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/led-billboard-1.png"
                          }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          Live
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Brightness Control</div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={brightness}
                          onChange={handleBrightnessChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Volume Control</div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remote Controls Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap size={18} />
                    Remote Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Primary Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handlePowerToggle}
                        disabled={isPerformingAction}
                      >
                        <Power size={18} />
                        Power {ledStatus.power === "On" ? "Off" : "On"}
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleReboot}
                        disabled={isPerformingAction}
                      >
                        <RotateCw size={18} />
                        Restart Players
                      </Button>
                    </div>

                    <Separator />

                    {/* Content Controls */}
                    <h3 className="text-sm font-medium">Content Controls</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handlePlayPause}
                        disabled={isPerformingAction}
                      >
                        {ledStatus.power === "On" ? <Pause size={18} /> : <Play size={18} />}
                        {ledStatus.power === "On" ? "Pause Content" : "Play Content"}
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleVideoSourceSwitch}
                        disabled={isPerformingAction}
                      >
                        <Layers size={18} />
                        Switch Source
                      </Button>
                    </div>

                    <Separator />

                    {/* System Controls */}
                    <h3 className="text-sm font-medium">System Controls</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleTimeSync}
                        disabled={isPerformingAction}
                      >
                        <Clock3 size={18} />
                        NTP Time Sync
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleScreenRefresh}
                        disabled={isPerformingAction}
                      >
                        <RefreshCcw size={18} />
                        Screen Refresh
                      </Button>
                    </div>

                    <Separator />

                    {/* Monitoring Controls */}
                    <h3 className="text-sm font-medium">Monitoring</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleScreenshot}
                        disabled={isPerformingAction}
                      >
                        <ImageIcon size={18} />
                        Screenshot
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-12 bg-transparent"
                        onClick={handleRefresh}
                        disabled={isPerformingAction}
                      >
                        <RefreshCw size={18} />
                        Refresh Status
                      </Button>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm"
                          size="sm"
                          disabled={isPerformingAction}
                        >
                          <Play size={14} />
                          Test Pattern
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm"
                          size="sm"
                          disabled={isPerformingAction}
                        >
                          <AlertCircle size={14} />
                          Run Diagnostics
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm"
                          size="sm"
                          disabled={isPerformingAction}
                        >
                          <SunMedium size={14} />
                          Auto Brightness
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm"
                          size="sm"
                          disabled={isPerformingAction}
                        >
                          <ScreenShare size={14} />
                          Sync Playback
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Loop Timeline Tab */}
          <TabsContent value="loopTimeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} />
                  Loop Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.cms ? <LoopTimeline cmsData={product.cms} /> : <p>No CMS data available for this product.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description="This product will be permanently removed. This action cannot be undone."
        itemName={product.name}
      />
    </div>
  )
}
