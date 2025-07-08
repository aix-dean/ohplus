"use client"

import { getProductById } from "@/lib/firebase-service"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Play,
  Clock,
  RefreshCw,
  Plus,
  FileText,
  PenToolIcon as Tool,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardContentInner } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
// Add the import for the new dialog component
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import { useRouter } from "next/navigation"

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
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

export default function SiteDetailsPage({ params, searchParams }: Props) {
  const [product, setProduct] = useState<any>(null)
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [openServiceAssignmentDialog, setOpenServiceAssignmentDialog] = useState(false)
  // Add state for the selected assignment ID and dialog visibility
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const router = useRouter()

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

  if (loading) {
    return <div className="container mx-auto py-4">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-4">Error: {error.message}</div>
  }

  if (!product) {
    notFound()
  }

  // Check navigation source
  const view = searchParams.view as string | undefined
  const isFromIllumination = view === "illumination"
  const isFromCompliance = view === "compliance"
  const isFromContent = view === "content"
  const isFromStructure = view === "structure"
  const isFromDisplayHealth = view === "display-health"

  // Show job orders for content, structure, and compliance tabs
  const showJobOrders = isFromContent || isFromStructure || isFromCompliance

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
    : "Not specified"

  // Get current advertisement (placeholder data)
  const currentAd = product.status === "VACANT" ? "VACANT" : "Samsung Galaxy S22"

  // Contract end date (placeholder data)
  const contractEndDate = new Date()
  contractEndDate.setMonth(contractEndDate.getMonth() + 4)

  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0
      ? product.media[0].url
      : isStatic
        ? "/roadside-billboard.png"
        : "/led-billboard-1.png"

  // Helper function to get service type icon
  const getServiceTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase()
    if (typeLower.includes("repair") || typeLower.includes("maintenance")) {
      return <Tool className="h-3 w-3 text-blue-600" />
    } else if (typeLower.includes("inspection") || typeLower.includes("monitoring")) {
      return <FileText className="h-3 w-3 text-green-600" />
    } else if (typeLower.includes("emergency")) {
      return <AlertTriangle className="h-3 w-3 text-red-600" />
    }
    return <User className="h-3 w-3 text-blue-600" />
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Mock content schedule data
  const currentTime = new Date()
  const baseMinute = Math.floor(currentTime.getMinutes() / 10) * 10
  const baseHour = currentTime.getHours()

  const contentSchedule = [
    {
      time: `${baseHour}:${baseMinute}:30`,
      spot: 1,
      status: "Filler",
      client: "GT",
      length: "10 s",
      isPlaying: false,
    },
    {
      time: `${baseHour}:${baseMinute}:40`,
      spot: 2,
      status: "Payee",
      client: "Political party 1",
      length: "10 s",
      isPlaying: false,
    },
    {
      time: `${baseHour}:${baseMinute}:50`,
      spot: 3,
      status: "Filler",
      client: "GT",
      length: "10 s",
      isPlaying: false,
    },
    {
      time: `${baseHour}:${baseMinute + 1}:00`,
      spot: 4,
      status: "Payee",
      client: "Senator A",
      length: "10 s",
      isPlaying: true,
    },
    {
      time: `${baseHour}:${baseMinute + 1}:10`,
      spot: 5,
      status: "Filler",
      client: "GT",
      length: "10 s",
      isPlaying: false,
    },
    {
      time: `${baseHour}:${baseMinute + 1}:20`,
      spot: 6,
      status: "Payee",
      client: "Beauty Brand X",
      length: "10 s",
      isPlaying: false,
    },
  ]

  // Update the handleBack function to use the new logistics path
  const handleBack = () => {
    router.push("/logistics/dashboard")
  }

  return (
    <div className="container mx-auto py-4 space-y-4 relative">
      {/* Top section with two cards */}
      <div className="flex flex-col md:flex-row gap-4 border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
        {/* Left card - Site image and basic info */}
        <Card className="flex-1 shadow-none border-none">
          <CardContent className="p-0">
            <div className="p-4">
              {/* Update any other references to operations paths */}
              <Link
                href="/logistics/dashboard"
                className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex px-4 pb-4 items-center">
              <div className="relative aspect-square w-full max-w-[100px] flex-shrink-0">
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
              <div className="pl-3 space-y-1">
                <div>
                  <div className="text-[10px] text-gray-500">{product.id}</div>
                  <h1 className="text-sm font-semibold">{product.name}</h1>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500">Current:</div>
                  <div className="text-xs">{currentAd}</div>
                  <div className="text-[10px] text-gray-500 flex items-center mt-1">
                    <Calendar className="h-2 w-2 mr-1" />
                    until {formatDate(contractEndDate)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right card - Site information */}
        <Card className="flex-1 shadow-none border-none">
          <CardHeader className="py-2">
            <CardTitle className="text-base font-semibold">Site Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <div className="text-[10px] font-medium text-gray-500">Site Code:</div>
                  <div className="text-xs">{product.id}</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Site Name:</div>
                  <div className="text-xs">{product.name}</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Type:</div>
                  <div className="text-xs">
                    {isStatic ? "Static Billboard" : isDynamic ? "LED Billboard" : "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Dimension:</div>
                  <div className="text-xs">{dimension}</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Site Orientation:</div>
                  <div className="text-xs">{product.specs_rental?.audience_type || "Facing"}</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Site Owner:</div>
                  <div className="text-xs">{product.seller_name || "GTIS"}</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Land Owner:</div>
                  <div className="text-xs">Arotronics Corp.</div>
                </div>

                <div>
                  <div className="text-[10px] font-medium text-gray-500">Geopoint:</div>
                  <div className="text-xs break-words">{geopoint}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-medium text-gray-500">Location:</div>
                <div className="flex items-start text-xs">
                  <MapPin className="h-2 w-2 mr-1 mt-1 flex-shrink-0" />
                  <span className="break-words">{location}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Orders Section - Only show when coming from content, structure, or compliance tabs */}
      {showJobOrders && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold flex items-center">
              Job Orders
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {serviceAssignments.length}
              </Badge>
            </h2>
            {/* Update the Button component to use the new logistics path */}
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
              <Link href="/logistics/assignments">View All</Link>
            </Button>
          </div>

          {serviceAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No job orders found for this site. Create a new service assignment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceAssignments.map((assignment) => (
                // Update the onClick handler for the service assignment cards
                <Card
                  key={assignment.id}
                  className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-none hover:shadow-md hover:border-gray-400 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedAssignmentId(assignment.id)
                    setDetailsDialogOpen(true)
                  }}
                >
                  <CardContentInner className="p-3 relative">
                    <Badge topRight className={`text-[10px] ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </Badge>

                    <div className="font-medium text-xs mb-2">SA: {assignment.saNumber}</div>

                    <div className="text-[10px] text-gray-500">
                      {assignment.created
                        ? format(new Date(assignment.created.toDate()), "MMM d, yyyy")
                        : "Date not specified"}
                    </div>

                    <div className="font-medium text-xs mt-2">Type: {assignment.serviceType || "Not specified"}</div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {assignment.jobDescription || "No description provided"}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[10px] text-gray-500">
                        Assigned to: {assignment.assignedTo || "Unassigned"}
                      </div>
                      <div className="bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center">
                        {getServiceTypeIcon(assignment.serviceType)}
                      </div>
                    </div>
                  </CardContentInner>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Schedule Section - Only show when coming from LED Sites content tab */}
      {isFromContent && isDynamic && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold flex items-center">Content Schedule</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <RefreshCw className="h-3 w-3" />
                <span className="text-xs">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-left font-medium text-xs">Time</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Spot</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Status</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Client</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Length</th>
                </tr>
              </thead>
              <tbody>
                {contentSchedule.map((item, index) => (
                  <tr key={index} className={`border-b border-gray-100 ${item.isPlaying ? "bg-blue-50" : ""}`}>
                    <td className="py-1 px-3 text-xs">{item.time}</td>
                    <td className="py-1 px-3 text-xs">{item.spot}</td>
                    <td className="py-1 px-3 text-xs">{item.status}</td>
                    <td className="py-1 px-3 text-xs">{item.client}</td>
                    <td className="py-1 px-3 text-xs">{item.length}</td>
                    {item.isPlaying && (
                      <td className="py-1 px-3">
                        <div className="flex items-center">
                          <Play size={12} className="text-blue-600 fill-current" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Payee</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Filler</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
              <Link href="#">View Full Schedule</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Lights Health Section - Only show when coming from illumination tab */}
      {isFromIllumination && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="mb-2">
            <h2 className="text-base font-semibold flex items-center">
              Lights Health <span className="ml-2 text-green-500">80%</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lights Status Grid */}
            <div className="border border-gray-100 rounded-lg p-3">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 flex items-center">
                      <span className="transform rotate-90 text-xs">▲</span>
                      <span className="ml-2 text-xs">Upper</span>
                    </td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">U1</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">U2</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">U3</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">U4</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">U5</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 flex items-center">
                      <span className="transform rotate-90 text-xs">▼</span>
                      <span className="ml-2 text-xs">Lower</span>
                    </td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">L1</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">L2</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">L3</td>
                    <td className="py-1 text-center text-red-500 font-medium text-xs">L4</td>
                    <td className="py-1 text-center text-green-500 font-medium text-xs">L5</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 flex items-center">
                      <span className="transform rotate-180 text-xs">▶</span>
                      <span className="ml-2 text-xs">Side (Left)</span>
                    </td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                  </tr>
                  <tr>
                    <td className="py-1 flex items-center">
                      <span className="text-xs">▶</span>
                      <span className="ml-2 text-xs">Side (Right)</span>
                    </td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                    <td className="py-1 text-center text-xs">-</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-2 flex items-center justify-end gap-4 text-[10px]">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-500 mr-1"></div>
                  <span>Working</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-red-500 mr-1"></div>
                  <span>Defective</span>
                </div>
              </div>
            </div>

            {/* Lights Specification */}
            <div className="border border-gray-100 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">Lights Specification</h3>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="font-medium">Upper: </span>
                  <span>5- 240 Lux metal halides</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Lower: </span>
                  <span>5- 240 Lux metal halides</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Side (Left): </span>
                  <span>N/A</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Side (Right): </span>
                  <span>N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lights Schedule Section - Only show when coming from illumination tab */}
      {isFromIllumination && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Lights Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-left font-medium text-xs">Date</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Time ON</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Time OFF</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">May 1, 2025</td>
                  <td className="py-1 px-3 text-xs">6:00 PM</td>
                  <td className="py-1 px-3 text-xs">1:00 AM</td>
                  <td className="py-1 px-3 text-xs">-</td>
                </tr>
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-1 px-3 text-xs">May 2, 2025</td>
                  <td className="py-1 px-3 text-xs">0:00 PM</td>
                  <td className="py-1 px-3 text-xs">0:00 AM</td>
                  <td className="py-1 px-3 text-xs">Typhoon</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">May 3, 2025</td>
                  <td className="py-1 px-3 text-xs">6:00 PM</td>
                  <td className="py-1 px-3 text-xs">1:00 AM</td>
                  <td className="py-1 px-3 text-xs">-</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">May 4, 2025</td>
                  <td className="py-1 px-3 text-xs">6:00 PM</td>
                  <td className="py-1 px-3 text-xs">1:00 AM</td>
                  <td className="py-1 px-3 text-xs">-</td>
                </tr>
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-1 px-3 text-xs">May 5, 2025</td>
                  <td className="py-1 px-3 text-xs">6:00 PM</td>
                  <td className="py-1 px-3 text-xs">1:00 AM</td>
                  <td className="py-1 px-3 text-xs">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LED Panels Health Section - Only show when coming from display-health tab */}
      {isFromDisplayHealth && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="mb-2">
            <h2 className="text-base font-semibold flex items-center">LED Panels Health</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LED Panel Status */}
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="flex">
                <div className="w-1/3">
                  <Image
                    src="/led-panel-grid.png"
                    alt="LED Panel Grid"
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                </div>
                <div className="w-2/3 pl-4 flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      as of {formatDate(new Date())}, {new Date().toLocaleTimeString()}
                    </div>
                    <div className="text-2xl font-bold text-green-500">56/56</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Report:</div>
                    <div className="text-sm">All panels are working. No issues currently.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* LED Specifications */}
            <div className="border border-gray-100 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">Specifications</h3>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="font-medium">LED Age: </span>
                  <span>5 years</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Pitch: </span>
                  <span>P6</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Nits: </span>
                  <span>8,000 nits</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Color Depth: </span>
                  <span>16 bit</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Cabinet Size: </span>
                  <span>960mm x 960mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Documents Section - Only show when coming from compliance tab */}
      {isFromCompliance && (
        <div className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
          <div className="mb-2">
            <h2 className="text-base font-semibold flex items-center">
              Compliance Documents <span className="ml-2 text-green-500">80%</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-left font-medium text-xs">Documents</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Date Issued</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Remarks</th>
                  <th className="py-2 px-3 text-left font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">1.Mayor's Permit</td>
                  <td className="py-1 px-3 text-xs">Jan 15, 2025</td>
                  <td className="py-1 px-3 text-xs">-</td>
                  <td className="py-1 px-3 text-green-500 font-medium text-xs">Done</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">2.Barangay Clearance</td>
                  <td className="py-1 px-3 text-xs">-</td>
                  <td className="py-1 px-3 text-xs">Release date on May 15, 2025</td>
                  <td className="py-1 px-3 text-red-500 font-medium text-xs">Ongoing</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">3.DTI Registration</td>
                  <td className="py-1 px-3 text-xs">Jan 10, 2025</td>
                  <td className="py-1 px-3 text-xs">-</td>
                  <td className="py-1 px-3 text-green-500 font-medium text-xs">Done</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">4.BIR Registration (Form 2303)</td>
                  <td className="py-1 px-3 text-xs">Nov 20, 2025</td>
                  <td className="py-1 px-3 text-xs">-</td>
                  <td className="py-1 px-3 text-green-500 font-medium text-xs">Done</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 px-3 text-xs">5.Property Insurance</td>
                  <td className="py-1 px-3 text-xs">Dec 3, 2025</td>
                  <td className="py-1 px-3 text-xs">-</td>
                  <td className="py-1 px-3 text-green-500 font-medium text-xs">Done</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Button for Service Assignment */}
      <Button
        onClick={() => setOpenServiceAssignmentDialog(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        open={openServiceAssignmentDialog}
        onOpenChange={setOpenServiceAssignmentDialog}
        onSuccess={() => {
          // Refresh service assignments after successful creation
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
        initialProjectSite={product.id} // Pass the current product ID
      />
      {/* Add the dialog component at the end of the return statement, just before the closing </div> */}
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
    </div>
  )
}
