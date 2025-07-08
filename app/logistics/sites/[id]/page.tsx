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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import Link from "next/link"

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
  const [openServiceAssignmentDialog, setOpenServiceAssignmentDialog] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
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
    : "12.5346567742,14. 09346723"

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
                    <span className="font-medium">Site Orientation:</span> Facing
                  </div>
                  <div>
                    <span className="font-medium">Site Owner:</span> GTIS
                  </div>
                  <div>
                    <span className="font-medium">Land Owner:</span> Arotronics Corp.
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
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setOpenServiceAssignmentDialog(true)}
                >
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

          {/* Site Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Illumination */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Illumination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Upper:</span> 5- 240 Lux metal halides
                  </div>
                  <div>
                    <span className="font-medium">Lower:</span> 5- 240 Lux metal halides
                  </div>
                  <div>
                    <span className="font-medium">Side (Left):</span> N/A
                  </div>
                  <div>
                    <span className="font-medium">Side (Right):</span> N/A
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    July 1, 2025 (Tue), 2:00 pm
                    <br />
                    Light ON by 6:00pm everyday
                  </div>
                  <div className="mt-2">
                    <span className="font-medium">Power Consumption:</span> 150 kWh/month
                    <br />
                    <span className="font-medium">Average Power Consumption:</span> 160 kWh/over last 3 months
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  View Index Card
                </Button>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance{" "}
                  <Badge variant="secondary" className="ml-2">
                    4/5
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>✓ Mayor's Permit</span>
                    <span className="text-green-600">Done</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✗ Barangay Clearance</span>
                    <span className="text-red-600">Ongoing</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ DTI Registration</span>
                    <span className="text-green-600">Done</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ BIR Registration</span>
                    <span className="text-green-600">Done</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ Property Insurance</span>
                    <span className="text-green-600">Done</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  See All
                </Button>
              </CardContent>
            </Card>

            {/* Structure */}
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
                    <span className="font-medium">Color:</span> Blue
                  </div>
                  <div>
                    <span className="font-medium">Contractor:</span> ABC Construction
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> Maintained (Last Maintenance: Dec 2024)
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

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Jan 5- May 6, 2025:</span> Lilo & Stitch
                  </div>
                  <div>
                    <span className="font-medium">Nov 5- Dec 28, 2025:</span> Wolverine
                  </div>
                  <div>
                    <span className="font-medium">Sep 5- Oct 28, 2025:</span> Moana
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content Schedule Section - Only show when coming from content view */}
          {isFromContent && isDynamic && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Schedule</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-3 text-xs">14:30</td>
                        <td className="py-1 px-3 text-xs">1</td>
                        <td className="py-1 px-3 text-xs">Filler</td>
                        <td className="py-1 px-3 text-xs">GT</td>
                        <td className="py-1 px-3 text-xs">10 s</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-3 text-xs">14:40</td>
                        <td className="py-1 px-3 text-xs">2</td>
                        <td className="py-1 px-3 text-xs">Payee</td>
                        <td className="py-1 px-3 text-xs">Political party 1</td>
                        <td className="py-1 px-3 text-xs">10 s</td>
                      </tr>
                      <tr className="border-b border-gray-100 bg-blue-50">
                        <td className="py-1 px-3 text-xs">15:00</td>
                        <td className="py-1 px-3 text-xs">4</td>
                        <td className="py-1 px-3 text-xs">Payee</td>
                        <td className="py-1 px-3 text-xs">Senator A</td>
                        <td className="py-1 px-3 text-xs">10 s</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lights Health Section - Only show when coming from illumination view */}
          {isFromIllumination && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Lights Health <span className="text-green-500">80%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-lg p-3">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-1 text-xs">Upper</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">U1</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">U2</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">U3</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">U4</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">U5</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-1 text-xs">Lower</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">L1</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">L2</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">L3</td>
                          <td className="py-1 text-center text-red-500 font-medium text-xs">L4</td>
                          <td className="py-1 text-center text-green-500 font-medium text-xs">L5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Lights Specification</h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="font-medium">Upper:</span> 5- 240 Lux metal halides
                      </div>
                      <div>
                        <span className="font-medium">Lower:</span> 5- 240 Lux metal halides
                      </div>
                      <div>
                        <span className="font-medium">Side (Left):</span> N/A
                      </div>
                      <div>
                        <span className="font-medium">Side (Right):</span> N/A
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LED Panels Health Section - Only show when coming from display-health view */}
          {isFromDisplayHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">LED Panels Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            as of {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
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
                  <div className="border border-gray-100 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Specifications</h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="font-medium">LED Age:</span> 5 years
                      </div>
                      <div>
                        <span className="font-medium">Pitch:</span> P6
                      </div>
                      <div>
                        <span className="font-medium">Nits:</span> 8,000 nits
                      </div>
                      <div>
                        <span className="font-medium">Color Depth:</span> 16 bit
                      </div>
                      <div>
                        <span className="font-medium">Cabinet Size:</span> 960mm x 960mm
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <span className="font-medium">Security:</span> Juan Dela Cruz
                </div>
                <div>
                  <span className="font-medium">Caretaker:</span> Jave Santos
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </CardContent>
          </Card>

          {/* Issues */}
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
                      <th className="text-left py-2">Issue</th>
                      <th className="text-left py-2">Content</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        No issues reported
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Automation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">No automation configured</div>
            </CardContent>
          </Card>
        </div>
      </div>

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
        initialProjectSite={product.id}
      />

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
