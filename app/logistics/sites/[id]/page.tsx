"use client"

import { getProductById } from "@/lib/firebase-service"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Calendar,
  MapPin,
  AlertTriangle,
  Shield,
  Zap,
  Users,
  Settings,
  Eye,
  History,
  FileCheck,
  ArrowLeft,
  MoreVertical,
  Edit,
  Bell,
  Sun,
  Play,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlarmSettingDialog } from "@/components/alarm-setting-dialog"
import { IlluminationIndexCardDialog } from "@/components/illumination-index-card-dialog"
import { DisplayIndexCardDialog } from "@/components/display-index-card-dialog"
import type { JobOrder } from "@/lib/types/job-order" // Import the JobOrder type

// Helper function to convert Firebase timestamp to readable date
export const formatFirebaseDate = (timestamp: any): string => {
  if (!timestamp) return ""

  try {
    // Check if it's a Firebase Timestamp object
    if (timestamp && typeof timestamp === "object" && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    // If it's already a string or Date, handle accordingly
    if (typeof timestamp === "string") {
      return timestamp
    }

    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    return ""
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

type Props = {
  params: { id: string }
}

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
  status: string
  created: any
}

export default function SiteDetailsPage({ params }: Props) {
  const [product, setProduct] = useState<any>(null)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]) // Changed from serviceAssignments
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]) // Keep service assignments for other parts if needed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false)
  const [illuminationIndexCardDialogOpen, setIlluminationIndexCardDialogOpen] = useState(false)
  const [displayIndexCardDialogOpen, setDisplayIndexCardDialogOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view")

  // Fetch product data and job orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch product data
        const productData = await getProductById(params.id)
        if (!productData) {
          notFound()
        }
        setProduct(productData)

        // Fetch job orders for this product
        const jobOrdersQuery = query(
          collection(db, "job_orders"), // Changed collection to "job_orders"
          where("product_id", "==", params.id), // Assuming "product_id" links to the site
          orderBy("createdAt", "desc"), // Changed from 'created' to 'createdAt'
        )

        const jobOrdersSnapshot = await getDocs(jobOrdersQuery)
        const jobOrdersData: JobOrder[] = [] // Changed to JobOrder[]

        jobOrdersSnapshot.forEach((doc) => {
          jobOrdersData.push({
            id: doc.id,
            ...doc.data(),
          } as JobOrder) // Cast to JobOrder
        })

        setJobOrders(jobOrdersData) // Set job orders

        // Optionally, fetch service assignments if they are still needed elsewhere
        // For now, we'll assume the "Job Orders" card is the primary place for this data.
        // If service assignments are needed for other components, their fetching logic
        // would need to be re-added here or in a separate useEffect.

      } catch (err) {
        setError(err as Error)
        console.error("Error fetching data (SiteDetailsPage):", err) // More specific error logging
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleCreateServiceAssignment = () => {
    router.push(`/logistics/assignments/create?projectSite=${params.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Site</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  // Determine if this is a static or dynamic site
  const contentType = (product.content_type || "").toLowerCase()
  const isStatic = contentType === "static"
  const isDynamic = contentType === "dynamic"

  // Format dimensions
  const width = product.specs_rental?.width || 0
  const height = product.specs_rental?.height || 0
  const dimension = width && height ? `${width}ft x ${height}ft` : "Not specified"

  // Get location
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // Get geopoint
  const geopoint = product.specs_rental?.geopoint
    ? `${product.specs_rental.geopoint[0]},${product.specs_rental.geopoint[1]}`
    : "12.5346567742,14.09346723"

  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0
      ? product.media[0].url
      : isStatic
        ? "/roadside-billboard.png"
        : "/led-billboard-1.png"

  // Check if we should show specific view content
  const isFromContent = view === "content"
  const isFromStructure = view === "structure"
  const isFromCompliance = view === "compliance"
  const isFromIllumination = view === "illumination"
  const isFromDisplayHealth = view === "display-health"

  return (
    <div className="container mx-auto py-4 space-y-4">

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Site Information */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-row items-center">
              <Link href="/logistics/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h2 className="text-lg font-semibold">Site Information</h2>
            </div>
            {/* Site Image */}
            <div className="relative aspect-square w-full">
              <Image
                src={thumbnailUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = isStatic ? "/roadside-billboard.png" : "/led-billboard-1.png"
                }}
              />
            </div>

            {/* Site Details */}
            <div className="space-y-2">
              <h2 className="text-gray-500 text-sm">{product.site_code || product.id}</h2>
              <h3 className="font-bold text-xl">{product.name}</h3>
              <Button variant="outline" className="mt-2">
                <Calendar className="mr-2 h-4 w-4" />
                Site Calendar
              </Button>

              <div className="space-y-2 text-sm mt-4">
                <div>
                  <span className="font-bold">Type:</span> {isStatic ? "Static" : "Dynamic"} - Billboard
                </div>
                <div>
                  <span className="font-bold">Dimension:</span> {dimension}
                </div>
                <div>
                  <span className="font-bold">Location:</span> {location}
                </div>
                <div>
                  <span className="font-bold">Geopoint:</span> {geopoint}
                </div>
                <div>
                  <span className="font-bold">Site Orientation:</span>{" "}
                  {product.specs_rental?.site_orientation || ""}
                </div>
                <div>
                  <span className="font-bold">Site Owner:</span> {product.site_owner || ""}
                </div>
                <div>
                  <span className="font-bold">Land Owner:</span> {product.specs_rental?.land_owner || ""}
                </div>
                <div>
                  <span className="font-bold">Partner:</span> {product.partner || ""}
                </div>
              </div>
            </div>

            {/* Site Calendar */}

            {/* Action Buttons */}
            <div className="border-t pt-4 space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateServiceAssignment}>
                Create Service Assignment
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Create Report
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Site Data and Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm">
              Site Expenses
            </Button>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Job Orders</CardTitle>
              <Button variant="outline" size="sm">
                See All
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {jobOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No job orders found for this site.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobOrders.map((jobOrder) => (
                    <div
                      key={jobOrder.id}
                      className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => {
                        router.push(`/logistics/assignments/create?jobOrderId=${jobOrder.id}`)
                      }}
                    >
                      <Users className="h-6 w-6 text-blue-600" /> {/* Using Users as a placeholder for running person icon */}
                      <div>
                        <p className="text-blue-700 font-semibold text-sm">You have a JO!</p>
                        <p className="text-gray-800 text-sm">
                          JO#{jobOrder.joNumber} from SALES_{jobOrder.requestedBy}.
                        </p>
                        <p className="text-gray-600 text-xs">
                          Sent on {formatFirebaseDate(jobOrder.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Site Data Grid - Updated to include Display card */}
          {/* Illumination - Show only for Static sites - Full width */}
          {isStatic && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Sun className="h-4 w-4 mr-2" />
                  Illumination
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Bell className="h-4 w-4 text-gray-500" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Edit illumination clicked")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setAlarmDialogOpen(true)
                        }}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Alarm Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Date and Time Section */}
                  <div className="text-sm">
                    <div className="font-medium">July 1, 2025 (Tue), 2:00 pm</div>
                    <div className="text-gray-600 text-xs">Lights ON @ 6:00pm everyday</div>
                  </div>

                  {/* Illumination Specifications */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Upper:</span>
                        <div className="text-blue-600">
                          {product.specs_rental?.illumination_upper_lighting_specs || "0 - metal halides"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Lower:</span>
                        <div className="text-blue-600">
                          {product.specs_rental?.illumination_bottom_lighting_specs || "0 - metal halides"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Side (Left):</span>
                        <div className="text-blue-600">
                          {product.specs_rental?.illumination_left_lighting_specs || "0 - metal halides"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Side (Right):</span>
                        <div className="text-blue-600">
                          {product.specs_rental?.illumination_right_lighting_specs || "0 - metal halides"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Power Consumption */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Power Consumption:</span>{" "}
                          <span className="text-green-600">150 kWh/month</span>
                        </div>
                        <div>
                          <span className="font-medium">Average Power Consumption:</span>{" "}
                          <span className="text-blue-600">160 kWh /over last 3 months</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => setIlluminationIndexCardDialogOpen(true)}
                      >
                        View Index Card
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Site Data Grid - Updated layout without Illumination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display - Show only for Dynamic sites */}
            {isDynamic && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center">
                    <Sun className="h-4 w-4 mr-2" />
                    Display
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="font-medium">July 1, 2025 (Tue), 2:00 pm</div>
                      <div className="text-gray-600 text-xs">
                        <span className="font-medium">Operating Time:</span> 6:00 pm to 11:00 pm
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Brightness:</span>
                        <div className="text-xs text-gray-600 ml-2">
                          7:00 am-3:00 pm (20%)
                          <br />
                          3:00 pm-11:00 pm (100%)
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Spots in a loop:</span> 10 spots
                      </div>
                      <div>
                        <span className="font-medium">Service Life:</span> 3 years, 8 months, and 10 days
                      </div>
                      <div>
                        <span className="font-medium">Power Consumption:</span> 150 kWh/month
                      </div>
                      <div>
                        <span className="font-medium">Average Power Consumption:</span> 160 kWh over last 3 months
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full bg-transparent"
                    onClick={() => setDisplayIndexCardDialogOpen(true)}
                  >
                    View Index Card
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Compliance - Always show */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance{" "}
                  <Badge variant="secondary" className="ml-2">
                    3/5
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Edit compliance clicked")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-1 text-sm">
                  {product.compliance && product.compliance.length > 0 ? (
                    product.compliance.map((item: { name: string; status: string }, index: number) => (
                      <div className="flex items-center justify-between" key={index}>
                        <span>{item.name}</span>
                        <span className={item.status === "Done" ? "text-green-600" : "text-red-600"}>
                          {item.status === "Done" ? "Done" : "X"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div>No compliance data available.</div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  See All
                </Button>
              </CardContent>
            </Card>

            {/* Structure - Always show */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Structure
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Edit structure clicked")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Color:</span> {product.specs_rental?.structure_color || ""}
                  </div>
                  <div>
                    <span className="font-medium">Contractor:</span> {product.specs_rental?.structure_contractor || ""}
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> {product.specs_rental?.structure_condition || ""}
                  </div>
                  <div>
                    <span className="font-medium">Last Maintenance:</span>{" "}
                    {formatFirebaseDate(product.specs_rental?.structure_last_maintenance)}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Blueprint
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content and Crew - Single row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Content */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Play className="h-4 w-4 mr-2" />
                  Content
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Edit content clicked")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {product.content_schedule && product.content_schedule.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {product.content_schedule.map((content: { start_date: any; end_date: any; name: string }, index: number) => (
                      <div key={index}>
                        <span className="font-medium">
                          {formatFirebaseDate(content.start_date)} - {formatFirebaseDate(content.end_date)}:
                        </span>{" "}
                        {content.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">No content scheduled</div>
                )}
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>

            {/* Crew */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Crew
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log("Edit crew clicked")}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Security:</span> {product.specs_rental?.security || ""}
                  </div>
                  <div>
                    <span className="font-medium">Caretaker:</span> {product.specs_rental?.caretaker || ""}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Issues */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Issues
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log("Edit issues clicked")}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Issue</th>
                        <th className="text-left py-2">Content</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">06/25/25 Stretching</td>
                        <td className="py-2">Lilo & Stitch</td>
                        <td className="py-2 text-green-600">Done</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">03/17/25 Busted Light</td>
                        <td className="py-2">Lilo & Stitch</td>
                        <td className="py-2 text-green-600">Done</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">01/05/25 Busted Light</td>
                        <td className="py-2">Wolverine</td>
                        <td className="py-2 text-green-600">Done</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>

            {/* Automation */}
            <Button
              className="w-full bg-purple-100 text-black hover:bg-purple-200 flex items-center justify-start p-4 rounded-lg"
              onClick={() => console.log("Automation button clicked")}
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="text-base font-semibold">Automation</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Keeping ServiceAssignmentDetailsDialog for now, but disabled, in case it's used elsewhere */}
      <ServiceAssignmentDetailsDialog
        open={false}
        onOpenChange={() => {}}
        assignmentId={null}
        onStatusChange={() => {}}
      />
      <AlarmSettingDialog open={alarmDialogOpen} onOpenChange={setAlarmDialogOpen} />
      <IlluminationIndexCardDialog
        open={illuminationIndexCardDialogOpen}
        onOpenChange={setIlluminationIndexCardDialogOpen}
        product={product}
        onCreateSA={() => {
          // Navigate to create service assignment with this site pre-selected
          router.push(`/logistics/assignments/create?projectSite=${params.id}`)
        }}
      />
      <DisplayIndexCardDialog
        open={displayIndexCardDialogOpen}
        onOpenChange={setDisplayIndexCardDialogOpen}
        onCreateSA={() => {
          // Navigate to create service assignment with this site pre-selected
          router.push(`/logistics/assignments/create?projectSite=${params.id}`)
        }}
      />
    </div>
  )
}
