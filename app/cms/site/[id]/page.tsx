"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getProductById, getServiceAssignmentsByProductId } from "@/lib/firebase-service"
import {
  ArrowLeft,
  Edit,
  Trash2,
  List,
  Wrench,
  Settings,
  Clock,
  Power,
  RotateCcw,
  Pause,
  ToggleLeft,
  Timer,
  RefreshCw,
  Camera,
  TestTube,
  Play,
  Sun,
  FolderSyncIcon as Sync,
  Calendar,
  Plus,
  Eye,
  Loader2,
} from "lucide-react"

// Inline UI Components
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

function Badge({
  children,
  className = "",
  variant = "default",
}: { children: React.ReactNode; className?: string; variant?: string }) {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  const variantClasses =
    variant === "outline"
      ? "border-input bg-background hover:bg-accent hover:text-accent-foreground"
      : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"

  return <div className={`${baseClasses} ${variantClasses} ${className}`}>{children}</div>
}

function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  onClick,
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  variant?: string
  size?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Tabs({
  children,
  defaultValue,
  className = "",
}: { children: React.ReactNode; defaultValue: string; className?: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={`w-full ${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab } as any) : child,
      )}
    </div>
  )
}

function TabsList({
  children,
  className = "",
  activeTab,
  setActiveTab,
}: { children: React.ReactNode; className?: string; activeTab?: string; setActiveTab?: (tab: string) => void }) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab } as any) : child,
      )}
    </div>
  )
}

function TabsTrigger({
  children,
  value,
  className = "",
  activeTab,
  setActiveTab,
}: {
  children: React.ReactNode
  value: string
  className?: string
  activeTab?: string
  setActiveTab?: (tab: string) => void
}) {
  const isActive = activeTab === value

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
      } ${className}`}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({
  children,
  value,
  className = "",
  activeTab,
}: { children: React.ReactNode; value: string; className?: string; activeTab?: string }) {
  if (activeTab !== value) return null

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </div>
  )
}

function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
    </div>
  )
}

function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>
}

function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>
}

function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
      {children}
    </tr>
  )
}

function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
    >
      {children}
    </th>
  )
}

function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>
}

function Slider({
  defaultValue = [50],
  max = 100,
  step = 1,
  className = "",
  onChange,
}: {
  defaultValue?: number[]
  max?: number
  step?: number
  className?: string
  onChange?: (value: number[]) => void
}) {
  const [value, setValue] = useState(defaultValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = [Number.parseInt(e.target.value)]
    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

// Inline Loop Timeline Component
function LoopTimelineComponent({ cmsData, productId }: { cmsData: any; productId: string }) {
  const startTimeStr = cmsData.start_time || "06:00"
  const endTimeStr = cmsData.end_time || "18:00"
  const spotDuration = cmsData.spot_duration || 15
  const loopsPerDay = cmsData.loops_per_day || 20

  // Calculate spots per loop based on time difference
  const calculateSpotsPerLoop = () => {
    const [startHour, startMinute] = startTimeStr.split(":").map(Number)
    const [endHour, endMinute] = endTimeStr.split(":").map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    const loopDurationMinutes = endTotalMinutes - startTotalMinutes
    const loopDurationSeconds = loopDurationMinutes * 60

    return Math.floor(loopDurationSeconds / spotDuration)
  }

  const spotsPerLoop = calculateSpotsPerLoop()

  // Convert military time to 12-hour format
  const convertTo12Hour = (militaryTime: string) => {
    const [hours, minutes] = militaryTime.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const totalLoopDuration = spotsPerLoop * spotDuration

  // Generate timeline spots
  const generateTimelineSpots = () => {
    const spots = []
    for (let i = 0; i < loopsPerDay; i++) {
      const spotNumber = i + 1
      spots.push({
        id: `SPOT${String(spotNumber).padStart(3, "0")}`,
        name: `Spot ${spotNumber}`,
        duration: spotDuration,
        status: i < 5 ? "active" : i < 10 ? "pending" : "available",
        isScheduled: i < 5,
      })
    }
    return spots
  }

  const timelineSpots = generateTimelineSpots()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Loop Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            First Loop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Spots per Loop:</span>
              <div className="text-lg font-semibold">{loopsPerDay}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Spot Duration:</span>
              <div className="text-lg font-semibold">{spotDuration}s</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Loop Time:</span>
              <div className="text-lg font-semibold">
                {convertTo12Hour(startTimeStr)} - {convertTo12Hour(endTimeStr)}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Total Loop Duration:</span>
              <div className="text-lg font-semibold">{formatDuration(totalLoopDuration)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={18} />
            First Loop Timeline ({loopsPerDay} Spots)
          </CardTitle>
          <div className="text-sm text-gray-500">
            Loop runs from {convertTo12Hour(startTimeStr)} to {convertTo12Hour(endTimeStr)} (
            {formatDuration(totalLoopDuration)} total)
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">Start: {convertTo12Hour(startTimeStr)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">End: {convertTo12Hour(endTimeStr)}</span>
              </div>
            </div>

            {/* Timeline Spots */}
            <div className="space-y-3">
              {timelineSpots.map((spot, index) => (
                <div
                  key={spot.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Spot Number */}
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-700">{index + 1}</span>
                  </div>

                  {/* Spot Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{spot.name}</h3>
                      <Badge variant="outline" className={getStatusColor(spot.status)}>
                        {spot.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-mono">{spot.duration}s duration</span>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 max-w-xs">
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          spot.status === "active"
                            ? "bg-green-500"
                            : spot.status === "pending"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                        style={{
                          width: `${(spot.duration / totalLoopDuration) * 100}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white mix-blend-difference">{spot.duration}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Add/View Button */}
                  {spot.isScheduled ? (
                    <Button size="sm" variant="secondary" className="flex-shrink-0">
                      <Eye size={16} />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-shrink-0 bg-transparent">
                      <Plus size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Timeline Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">First Loop Summary</h4>
                  <p className="text-sm text-blue-700">
                    This loop contains {spotsPerLoop} advertising spots and will repeat {loopsPerDay} times throughout
                    the day
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-900">{formatDuration(totalLoopDuration)}</div>
                  <div className="text-sm text-blue-700">Loop Duration</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Active Spots:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "active").length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Pending Spots:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "pending").length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Available Spots:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "available").length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced product data interface for CMS details
interface CMSProductData {
  id: string
  name: string
  description: string
  status: string
  type: string
  image?: string
  dimensions?: string
  created: string
  updated: string
  company_id?: string
  seller_id?: string
  traffic_count?: number
  cms: {
    end_time: string
    loops_per_day: number
    spot_duration: number
    start_time: string
  }
  programList: Array<{
    id: string
    name: string
    duration: string
    timeSlot: string
    advertiser: string
    price: string
    status: string
  }>
  serviceAssignments: Array<{
    id: string
    title: string
    assignedTo: string
    date: string
    status: string
    notes: string
  }>
  ledStatus: {
    powerStatus: string
    temperature: string
    connection: string
    videoSource: string
    activeContent: string
    lastReboot: string
    lastTimeSync: string
    warnings: string[]
  }
  livePreview: Array<{
    id: string
    health: string
    image: string
  }>
}

export default function CMSSiteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const { toast } = useToast()

  const [product, setProduct] = useState<CMSProductData | null>(null)
  const [loading, setLoading] = useState(true)

  const productId = params.id as string

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        setLoading(true)

        // Get product from Firebase
        const productData = await getProductById(productId)

        if (!productData) {
          toast({
            title: "Error",
            description: "Site not found.",
            variant: "destructive",
          })
          router.push("/cms/dashboard")
          return
        }

        // Verify this product belongs to the current user's company
        if (userData?.company_id && productData.company_id !== userData.company_id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this site.",
            variant: "destructive",
          })
          router.push("/cms/dashboard")
          return
        }

        // Get service assignments for this product
        const serviceAssignments = await getServiceAssignmentsByProductId(productId)

        // Convert Firebase product to CMS product data format
        const cmsProductData: CMSProductData = {
          id: productData.id || productId,
          name: productData.name || "Unknown Product",
          description: productData.description || "No description available",
          status: productData.status || "PENDING",
          type: productData.type || "RENTAL",
          image: productData.imageUrl || "/placeholder.svg?height=200&width=200",
          dimensions: `H: ${productData.specs_rental?.height || 12} × W: ${productData.specs_rental?.width || 12}`,
          created: productData.created ? new Date(productData.created.seconds * 1000).toLocaleDateString() : "Unknown",
          updated: productData.updated ? new Date(productData.updated.seconds * 1000).toLocaleDateString() : "Unknown",
          company_id: productData.company_id,
          seller_id: productData.seller_id,
          traffic_count: productData.specs_rental?.traffic_count || 0,
          cms: {
            end_time: productData.cms?.end_time || "18:00",
            loops_per_day: productData.cms?.loops_per_day || 20,
            spot_duration: productData.cms?.spot_duration || 15,
            start_time: productData.cms?.start_time || "06:00",
          },
          // Mock program list - in a real app, this would come from a separate collection
          programList: [
            {
              id: "SPOT001",
              name: "Morning Slot",
              duration: "15 seconds",
              timeSlot: "06:00 AM - 12:00 PM",
              advertiser: "Coca Cola",
              price: "PHP 1,200",
              status: "Active",
            },
            {
              id: "SPOT002",
              name: "Afternoon Slot",
              duration: "30 seconds",
              timeSlot: "12:00 PM - 06:00 PM",
              advertiser: "Samsung",
              price: "PHP 1,800",
              status: "Active",
            },
            {
              id: "SPOT003",
              name: "Evening Slot",
              duration: "15 seconds",
              timeSlot: "06:00 PM - 12:00 AM",
              advertiser: "Nike",
              price: "PHP 2,100",
              status: "Pending",
            },
            {
              id: "SPOT004",
              name: "Late Night Slot",
              duration: "30 seconds",
              timeSlot: "12:00 AM - 06:00 AM",
              advertiser: "-",
              price: "PHP 900",
              status: "Available",
            },
          ],
          // Convert service assignments from Firebase
          serviceAssignments: serviceAssignments.map((assignment) => ({
            id: assignment.id,
            title: assignment.jobDescription || "Service Assignment",
            assignedTo: assignment.assignedTo || "Unassigned",
            date: assignment.coveredDateStart ? new Date(assignment.coveredDateStart).toLocaleDateString() : "TBD",
            status: assignment.status || "Pending",
            notes: assignment.message || "No notes available",
          })),
          // Mock LED status - in a real app, this would come from IoT devices or separate collection
          ledStatus: {
            powerStatus: "On",
            temperature: "32°C",
            connection: "Online",
            videoSource: "HDMI 1",
            activeContent: "Current Campaign",
            lastReboot: new Date().toLocaleDateString() + " 09:15 AM",
            lastTimeSync: new Date().toLocaleDateString() + " 08:00 AM",
            warnings:
              productData.specs_rental?.elevation && productData.specs_rental.elevation > 100
                ? ["High elevation detected"]
                : [],
          },
          // Mock live preview - in a real app, this would come from live camera feeds
          livePreview: [
            {
              id: `${productData.name?.substring(0, 10) || "LED"} 3.2`,
              health: "100% Healthy",
              image: "/placeholder.svg?height=100&width=150",
            },
            {
              id: `${productData.specs_rental?.location?.substring(0, 10) || "SITE"} 1.0`,
              health: "100% Healthy",
              image: "/placeholder.svg?height=100&width=150",
            },
            {
              id: "BACKUP LED 1.0",
              health: "100% Healthy",
              image: "/placeholder.svg?height=100&width=150",
            },
            {
              id: "MAIN LED 2.1",
              health: productData.active ? "100% Healthy" : "90% Healthy",
              image: "/placeholder.svg?height=100&width=150",
            },
          ],
        }

        setProduct(cmsProductData)
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load site details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, userData?.company_id, toast, router])

  const handleBack = () => {
    router.push("/cms/dashboard")
  }

  const handleEdit = () => {
    router.push(`/cms/content/edit/${productId}`)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading site details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Site not found</h3>
          <p className="text-muted-foreground mb-4">The requested site could not be found.</p>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "available":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
      case "ongoing":
        return "bg-blue-100 text-blue-800"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Title and Badges */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <Badge className={getStatusColor(product.status)}>
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
        </Badge>
        <Badge variant="outline">{product.type}</Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - Image */}
        <div className="col-span-2">
          <div className="bg-gray-100 rounded-lg p-4">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-auto rounded"
            />
          </div>
        </div>

        {/* Middle - Description and CMS Config */}
        <div className="col-span-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-900">{product.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">CMS Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Spots per loop: {product.cms.loops_per_day}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Spot duration: {product.cms.spot_duration}s</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>
                  Loop time: {product.cms.start_time} - {product.cms.end_time}
                </span>
              </div>
            </div>
          </div>

          {product.traffic_count && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Traffic Count</h3>
              <p className="text-gray-900">{product.traffic_count.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Right - ID and Dimensions */}
        <div className="col-span-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">ID</h3>
            <p className="text-sm font-mono">{product.id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Dimensions</h3>
            <p className="text-sm">{product.dimensions}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>Created: {product.created}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>Updated: {product.updated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="program-list" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="program-list" className="flex items-center gap-2">
            <List size={16} />
            Program List
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Wrench size={16} />
            Service
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings size={16} />
            Controls
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock size={16} />
            Loop Timeline
          </TabsTrigger>
        </TabsList>

        {/* Program List Tab */}
        <TabsContent value="program-list" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List size={20} />
              <h2 className="text-xl font-semibold">Program List</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <List size={16} className="mr-2" />
                List
              </Button>
              <Button variant="outline" size="sm">
                <Calendar size={16} className="mr-2" />
                Calendar
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.programList.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-mono text-sm">{program.id}</TableCell>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.duration}</TableCell>
                      <TableCell>{program.timeSlot}</TableCell>
                      <TableCell>{program.advertiser}</TableCell>
                      <TableCell>{program.price}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">+ Add Program</Button>
          </div>
        </TabsContent>

        {/* Service Tab */}
        <TabsContent value="service" className="space-y-4">
          <div className="flex items-center gap-2">
            <Wrench size={20} />
            <h2 className="text-xl font-semibold">Service Assignments</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.serviceAssignments.length > 0 ? (
                    product.serviceAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-mono text-sm">{assignment.id}</TableCell>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{assignment.assignedTo}</TableCell>
                        <TableCell>{assignment.date}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{assignment.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No service assignments found for this product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">+ Create Service Assignment</Button>
          </div>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* LED Site Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={18} />
                  LED Site Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Power Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{product.ledStatus.powerStatus}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Connection</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{product.ledStatus.connection}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Temperature</span>
                    <p className="text-sm mt-1">{product.ledStatus.temperature}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Video Source</span>
                    <p className="text-sm mt-1">{product.ledStatus.videoSource}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Active Content</span>
                    <p className="text-sm mt-1 text-blue-600">{product.ledStatus.activeContent}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Time Sync</span>
                    <p className="text-sm mt-1">{product.ledStatus.lastTimeSync}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-500">Last Reboot</span>
                    <p className="text-sm mt-1">{product.ledStatus.lastReboot}</p>
                  </div>
                </div>

                {product.ledStatus.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span className="text-sm font-medium">⚠ Warnings</span>
                    </div>
                    <ul className="mt-1 text-sm text-yellow-700">
                      {product.ledStatus.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remote Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power size={18} />
                  Remote Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Power size={16} />
                    Power Off
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <RotateCcw size={16} />
                    Restart Players
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Content Controls</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Pause size={16} />
                      Pause Content
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <ToggleLeft size={16} />
                      Switch Source
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">System Controls</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Timer size={16} />
                      NTP Time Sync
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <RefreshCw size={16} />
                      Screen Refresh
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Monitoring</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Camera size={16} />
                      Screenshot
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <RefreshCw size={16} />
                      Refresh Status
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <TestTube size={16} />
                      Test Pattern
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Play size={16} />
                      Run Diagnostics
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Sun size={16} />
                      Auto Brightness
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Sync size={16} />
                      Sync Playback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Content</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Display Health
                  </Badge>
                  <span>Structure</span>
                </div>
                <span>
                  {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                </span>
                <Button size="sm" variant="outline">
                  Live
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {product.livePreview.map((preview) => (
                  <div key={preview.id} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-2 mb-2">
                      <Image
                        src={preview.image || "/placeholder.svg"}
                        alt={preview.id}
                        width={150}
                        height={100}
                        className="w-full h-auto rounded"
                      />
                    </div>
                    <p className="text-sm font-medium">{preview.id}</p>
                    <Badge
                      className={
                        preview.health.includes("100%")
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {preview.health}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Create Service Assignment</Button>
            </CardContent>
          </Card>

          {/* Brightness and Volume Controls */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Brightness Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider defaultValue={[60]} max={100} step={1} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loop Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <LoopTimelineComponent cmsData={product.cms} productId={product.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
