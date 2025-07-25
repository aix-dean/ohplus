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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false)
  const [illuminationIndexCardDialogOpen, setIlluminationIndexCardDialogOpen] = useState(false)
  const [displayIndexCardDialogOpen, setDisplayIndexCardDialogOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view")

  // Fetch product data and service assignments
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

        // Fetch service assignments for this product
        const assignmentsQuery = query(
          collection(db, "service_assignments"),
          where("projectSiteId", "==", params.id),
          orderBy("created", "desc"),
        )

        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const assignmentsData: ServiceAssignment[] = []

        assignmentsSnapshot.forEach((doc) => {
          assignmentsData.push({
            id: doc.id,
            ...doc.data(),
          } as ServiceAssignment)
        })

        setServiceAssignments(assignmentsData)
      } catch (err) {
        setError(err as Error)
        console.error("Error fetching data:", err)
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
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 rounded-lg flex items-center justify-between">
        <h1 className="text-lg font-semibold">Logistics- Site Information</h1>
        <Link href="/logistics/dashboard" className="inline-flex items-center text-sm text-white/80 hover:text-white">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Site Information */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {/* Map overlay */}
                <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-red-500" />
                </div>
              </div>

              {/* Site Details */}
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">{product.site_code || product.id}</h2>
                <h3 className="text-base">{product.name}</h3>

                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Site Code:</span> {product.id}
                  </div>
                  <div>
                    <span className="font-medium">Site Name:</span> {product.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {isStatic ? "Static" : "Dynamic"} - Billboard
                  </div>
                  <div>
                    <span className="font-medium">Dimension:</span> {dimension}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {location}
                  </div>
                  <div>
                    <span className="font-medium">Geopoint:</span> {geopoint}
                  </div>
                  <div>
                    <span className="font-medium">Site Orientation:</span> {product.site_orientation || ""}
                  </div>
                  <div>
                    <span className="font-medium">Site Owner:</span> {product.site_owner || ""}
                  </div>
                  <div>
                    <span className="font-medium">Land Owner:</span> {product.land_owner || ""}
                  </div>
                </div>
              </div>

              {/* Site Calendar */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Site Calendar</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Calendar className="h-4 w-4 mb-2" />
                  <div className="text-sm text-gray-600">Calendar view placeholder</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateServiceAssignment}>
                  Create Service Assignment
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Site Data and Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Job Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Job Orders</CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                See All
              </Button>
            </CardHeader>
            <CardContent>
              {serviceAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No job orders found for this site.</div>
              ) : (
                <div className="space-y-3">
                  {serviceAssignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id)
                        setDetailsDialogOpen(true)
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">SA: {assignment.saNumber}</div>
                          <div className="text-xs text-gray-500 mt-1">{assignment.serviceType}</div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{assignment.jobDescription}</div>
                        </div>
                        <Badge
                          variant={assignment.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {assignment.status}
                        </Badge>
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
                  <Zap className="h-4 w-4 mr-2" />
                  Illumination
                </CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Date and Time Section */}
                  <div className="text-sm">
                    <div className="font-medium">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                      , {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Lights ON at {product.specs_rental?.lights_on_time || "6:00pm"} everyday
                    </div>
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
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">Power Consumption:</span>{" "}
                        <span className="text-green-600">
                          {product.specs_rental?.average_power_consumption_3months || "344"} kWh/month
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Average (3 months):</span>{" "}
                        <span className="text-blue-600">
                          {product.specs_rental?.average_power_consumption_3months || "344"} kWh/month
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => setIlluminationIndexCardDialogOpen(true)}
                  >
                    View Index Card
                  </Button>
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
                <CardContent>
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
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance{" "}
                  <Badge variant="secondary" className="ml-2">
                    {product.compliance ? product.compliance.filter((item) => item.status === "Done").length : 0}/
                    {product.compliance?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {product.compliance && product.compliance.length > 0 ? (
                    product.compliance.map((item, index) => (
                      <div className="flex items-center justify-between" key={index}>
                        <span>{item.name}</span>
                        <span className={item.status === "Done" ? "text-green-600" : "text-red-600"}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div>No compliance data available.</div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  See All
                </Button>
              </CardContent>
            </Card>

            {/* Structure - Always show */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Color:</span> {product.structure?.color || ""}
                  </div>
                  <div>
                    <span className="font-medium">Contractor:</span> {product.structure?.contractor || ""}
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> {product.structure?.condition || ""}
                  </div>
                  <div>
                    <span className="font-medium">Last Maintenance:</span> {product.structure?.last_maintenance || ""}
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
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.content_schedule && product.content_schedule.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {product.content_schedule.map((content, index) => (
                      <div key={index}>
                        <span className="font-medium">
                          {content.start_date} - {content.end_date}:
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
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Crew
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Security:</span> {product.crew?.security || ""}
                  </div>
                  <div>
                    <span className="font-medium">Caretaker:</span> {product.crew?.caretaker || ""}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Issues - Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Issue</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Content</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.issues && product.issues.length > 0 ? (
                      product.issues.map((issue, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">{issue.title}</td>
                          <td className="py-2">{issue.type}</td>
                          <td className="py-2">{issue.description}</td>
                          <td className="py-2">
                            <Badge variant={issue.status === "resolved" ? "default" : "destructive"}>
                              {issue.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500">
                          No issues reported
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Automation - Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.automation && product.automation.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {product.automation.map((auto, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{auto.name}</span>
                      <Badge variant={auto.active ? "default" : "secondary"}>
                        {auto.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No automation configured</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ServiceAssignmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        assignmentId={selectedAssignmentId}
        onStatusChange={() => {
          // Refresh service assignments after status change
          const fetchAssignments = async () => {
            try {
              const assignmentsQuery = query(
                collection(db, "service_assignments"),
                where("projectSiteId", "==", params.id),
                orderBy("created", "desc"),
              )

              const assignmentsSnapshot = await getDocs(assignmentsQuery)
              const assignmentsData: ServiceAssignment[] = []

              assignmentsSnapshot.forEach((doc) => {
                assignmentsData.push({
                  id: doc.id,
                  ...doc.data(),
                } as ServiceAssignment)
              })

              setServiceAssignments(assignmentsData)
            } catch (err) {
              console.error("Error refreshing assignments:", err)
            }
          }

          fetchAssignments()
        }}
      />
      <AlarmSettingDialog open={alarmDialogOpen} onOpenChange={setAlarmDialogOpen} />
      <IlluminationIndexCardDialog
        open={illuminationIndexCardDialogOpen}
        onOpenChange={setIlluminationIndexCardDialogOpen}
        onCreateJO={() => {
          // Navigate to create service assignment with this site pre-selected
          router.push(`/logistics/assignments/create?projectSite=${params.id}`)
        }}
      />
      <DisplayIndexCardDialog
        open={displayIndexCardDialogOpen}
        onOpenChange={setDisplayIndexCardDialogOpen}
        onCreateJO={() => {
          // Navigate to create service assignment with this site pre-selected
          router.push(`/logistics/assignments/create?projectSite=${params.id}`)
        }}
      />
    </div>
  )
}
