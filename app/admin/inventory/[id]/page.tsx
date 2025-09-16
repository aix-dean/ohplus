"use client"

import { getProductById, uploadFileToFirebaseStorage, updateProduct, getServiceAssignmentsByProductId } from "@/lib/firebase-service"

// Global type declarations for Google Maps
declare global {
  interface Window {
    google: any
  }
}
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
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { useRef, useState, useEffect, use } from "react"
import { Document, Page, pdfjs } from "react-pdf"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlarmSettingDialog } from "@/components/alarm-setting-dialog"
import { IlluminationIndexCardDialog } from "@/components/illumination-index-card-dialog"
import { DisplayIndexCardDialog } from "@/components/display-index-card-dialog"
import type { JobOrder } from "@/lib/types/job-order" // Import the JobOrder type
import { useAuth } from "@/contexts/auth-context"

// Google Map Component
const GoogleMap: React.FC<{ location: string; className?: string }> = ({ location, className }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const initializeMaps = async () => {
      try {
        await loadGoogleMaps()
        await initializeMap()
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setMapError(true)
      }
    }

    const initializeMap = async () => {
      if (!mapRef.current || !window.google) return

      try {
        const geocoder = new window.google.maps.Geocoder()

        // Geocode the location
        geocoder.geocode({ address: location }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === "OK" && results && results[0]) {
            const map = new window.google.maps.Map(mapRef.current!, {
              center: results[0].geometry.location,
              zoom: 15,
              disableDefaultUI: true,
              gestureHandling: "none",
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            })

            // Add marker
            new window.google.maps.Marker({
              position: results[0].geometry.location,
              map: map,
              title: location,
              icon: {
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32),
              },
            })

            setMapLoaded(true)
          } else {
            console.error("Geocoding failed:", status)
            setMapError(true)
          }
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError(true)
      }
    }

    initializeMaps()
  }, [location])

  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs mt-1">{location}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

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
  params: Promise<{ id: string }>
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
  alarmDate: any
  alarmTime: string
  attachments: { name: string; type: string }[]
  status: string
  created: any
  updated: any
}

interface ComplianceItem {
  name: string
  doc_url: string
  created: any
  created_by: string
  filename_doc: string
  deleted: boolean
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
  const [blueprintDialogOpen, setBlueprintDialogOpen] = useState(false)
  const [selectedBlueprintFile, setSelectedBlueprintFile] = useState<File | null>(null)
  const [blueprintPreviewUrl, setBlueprintPreviewUrl] = useState<string | null>(null)
  const [isUploadingBlueprint, setIsUploadingBlueprint] = useState(false)
  const [blueprintSuccessDialogOpen, setBlueprintSuccessDialogOpen] = useState(false)
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null)
  const [pdfPageNumber, setPdfPageNumber] = useState(1)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [fullscreenBlueprint, setFullscreenBlueprint] = useState<{blueprint: string, uploaded_by: string, created: any} | null>(null)
  const [fullscreenDialogOpen, setFullscreenDialogOpen] = useState(false)
  const [fullscreenPdfPageNumber, setFullscreenPdfPageNumber] = useState(1)
  const [fullscreenPdfNumPages, setFullscreenPdfNumPages] = useState<number | null>(null)
  const [structureUpdateDialogOpen, setStructureUpdateDialogOpen] = useState(false)
  const [structureForm, setStructureForm] = useState({
    color: '',
    contractor: '',
    condition: ''
  })
  const [maintenanceHistoryDialogOpen, setMaintenanceHistoryDialogOpen] = useState(false)
  const [maintenanceHistory, setMaintenanceHistory] = useState<ServiceAssignment[]>([])
  const [maintenanceHistoryLoading, setMaintenanceHistoryLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { userData } = useAuth()
  const { id } = use(params)

  const [illuminationOn, setIlluminationOn] = useState(false)
  const [illuminationMode, setIlluminationMode] = useState("Manual")
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false)
  const [addComplianceDialogOpen, setAddComplianceDialogOpen] = useState(false)
  const [viewComplianceDialogOpen, setViewComplianceDialogOpen] = useState(false)
  const [editComplianceDialogOpen, setEditComplianceDialogOpen] = useState(false)
  const [editingComplianceIndex, setEditingComplianceIndex] = useState<number | null>(null)
  const [complianceForm, setComplianceForm] = useState({
    name: '',
    document: null as File | null,
  })
  const [editComplianceForm, setEditComplianceForm] = useState({
    name: '',
    document: null as File | null,
    originalFilename: '',
  })
  const [isUploadingCompliance, setIsUploadingCompliance] = useState(false)
  const [complianceError, setComplianceError] = useState('')
  const [complianceAddSuccessDialogOpen, setComplianceAddSuccessDialogOpen] = useState(false)
  const [complianceEditSuccessDialogOpen, setComplianceEditSuccessDialogOpen] = useState(false)
  const [complianceDeleteSuccessDialogOpen, setComplianceDeleteSuccessDialogOpen] = useState(false)

  // Fetch product data and job orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch product data
        const productData = await getProductById(id)
        if (!productData) {
          notFound()
        }
        setProduct(productData)

        // Fetch job orders for this product
        const jobOrdersQuery = query(
          collection(db, "job_orders"), // Changed collection to "job_orders"
          where("product_id", "==", id), // Assuming "product_id" links to the site
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
  }, [id])

  const handleCreateServiceAssignment = () => {
    router.push(`/logistics/assignments/create?projectSite=${id}`)
  }

  const handleBlueprintFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is image or PDF
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Please select an image or PDF file')
        return
      }

      setSelectedBlueprintFile(file)
      setPdfNumPages(null)
      setPdfPageNumber(1)
      setIsPdfLoading(true)

      // Create preview URL for both images and PDFs
      const previewUrl = URL.createObjectURL(file)
      setBlueprintPreviewUrl(previewUrl)
    }
  }

  const handleBlueprintUpload = async () => {
    if (!selectedBlueprintFile || !product || !userData) return

    setIsUploadingBlueprint(true)
    try {
      // Upload to Firebase Storage
      const downloadURL = await uploadFileToFirebaseStorage(selectedBlueprintFile, `blueprints/${product.id}/`)

      // Create new blueprint entry
      const blueprintKey = Date.now().toString() // Use timestamp as unique key
      const uploaderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown User'

      const newBlueprintEntry = {
        blueprint: downloadURL,
        uploaded_by: uploaderName,
        created: new Date()
      }

      // Get existing blueprints or create empty array
      // Handle both old format (object) and new format (array)
      let existingBlueprints: Array<{blueprint: string, uploaded_by: string, created: any}> = []

      if (product.blueprints) {
        if (Array.isArray(product.blueprints)) {
          // New format - already an array
          existingBlueprints = product.blueprints
        } else {
          // Old format - convert object to array
          existingBlueprints = Object.values(product.blueprints)
        }

        // Convert old format blueprints to new format and sort by created timestamp (most recent first)
        existingBlueprints = existingBlueprints.map((bp: any) => ({
          blueprint: bp.blueprint,
          uploaded_by: bp.uploaded_by || bp.uploaded || 'Unknown User', // Handle both old and new formats
          created: bp.created
        }))

        existingBlueprints.sort((a: {created: any}, b: {created: any}) => {
          const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
          const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
          return timeB - timeA
        })
      }

      // Add new blueprint to the array
      const updatedBlueprints = [...existingBlueprints, newBlueprintEntry]

      // Update product with new blueprints map
      await updateProduct(product.id, { blueprints: updatedBlueprints })

      // Update local product state
      setProduct({ ...product, blueprints: updatedBlueprints })

      // Reset states
      setSelectedBlueprintFile(null)
      setBlueprintPreviewUrl(null)

      // Close blueprint dialog and show success dialog
      setBlueprintDialogOpen(false)
      setBlueprintSuccessDialogOpen(true)
    } catch (error) {
      console.error('Error uploading blueprint:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to upload blueprint: ${errorMessage}. Please try again.`)
    } finally {
      setIsUploadingBlueprint(false)
    }
  }

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click()
  }

  const onPdfLoadSuccess = ({ numPages }: { numPages: number }) => {
    setPdfNumPages(numPages)
    setIsPdfLoading(false)
  }

  const onPdfLoadError = (error: Error) => {
    console.error('Error loading PDF:', error)
    setIsPdfLoading(false)
  }

  const isPdfFile = (url: string) => {
    return url.toLowerCase().endsWith('.pdf')
  }

  const handleBlueprintClick = (blueprint: {blueprint: string, uploaded_by: string, created: any}) => {
    setFullscreenBlueprint(blueprint)
    setFullscreenDialogOpen(true)
    setFullscreenPdfPageNumber(1)
    setFullscreenPdfNumPages(null)
  }

  const onFullscreenPdfLoadSuccess = ({ numPages }: { numPages: number }) => {
    setFullscreenPdfNumPages(numPages)
  }

  const handleStructureEdit = () => {
    // Pre-populate form with existing structure data
    setStructureForm({
      color: product.structure?.color || '',
      contractor: product.structure?.contractor || '',
      condition: product.structure?.condition || ''
    })
    setStructureUpdateDialogOpen(true)
  }

  const handleStructureUpdate = async () => {
    try {
      const updatedStructure = {
        ...structureForm,
        last_maintenance: new Date() // Update last maintenance to current date
      }

      await updateProduct(product.id, { structure: updatedStructure })

      // Update local product state
      setProduct({ ...product, structure: updatedStructure })

      setStructureUpdateDialogOpen(false)
    } catch (error) {
      console.error('Error updating structure:', error)
      alert('Failed to update structure. Please try again.')
    }
  }

  const fetchMaintenanceHistory = async () => {
    if (!product?.id) return

    setMaintenanceHistoryLoading(true)
    try {
      const assignments = await getServiceAssignmentsByProductId(product.id)
      setMaintenanceHistory(assignments)
    } catch (error) {
      console.error('Error fetching maintenance history:', error)
      setMaintenanceHistory([])
    } finally {
      setMaintenanceHistoryLoading(false)
    }
  }

  const handleViewHistory = () => {
    setMaintenanceHistoryDialogOpen(true)
    fetchMaintenanceHistory()
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
    <div className="container mx-auto py-4 space-y-4 overflow-hidden">

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Site Information */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-row items-center">
              <Link href="/admin/inventory" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h2
                className="text-lg"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#000000'
                }}
              >
                Site Information
              </h2>
            </div>
            {/* Site Image and Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Site Image - Left Side */}
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

              {/* Google Map - Right Side */}
              <div className="relative aspect-square w-full bg-gray-100 rounded-md overflow-hidden">
                <GoogleMap location={location} className="w-full h-full" />
              </div>
            </div>

            {/* Site Details */}
            <div className="space-y-2">
              <h2 className="text-gray-500 text-sm">{product.site_code || product.id}</h2>
              <h3
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: '28px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#000000'
                }}
              >
                {product.name}
              </h3>
              <Button variant="outline" className="mt-2 w-[440px] h-[47px]">
                <Calendar className="mr-2 h-4 w-4" />
                Site Calendar
              </Button>

              <div className="space-y-2 text-sm mt-4">
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Type:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {isStatic ? "Static" : "Dynamic"} - Billboard
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Dimension:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {dimension}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Location:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {location}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Geopoint:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {geopoint}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Site Orientation:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {product.specs_rental?.site_orientation || ""}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Site Owner:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {product.site_owner || ""}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Land Owner:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {product.specs_rental?.land_owner || ""}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#000000'
                    }}
                  >
                    Partner:
                  </span>{" "}
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '120%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}
                  >
                    {product.partner || ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Site Calendar */}

            {/* Action Buttons */}
            <div className="border-t pt-4 space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#FFFFFF'
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Site Data and Details */}
        <div className="lg:col-span-2 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <Card className="rounded-xl shadow-sm border">
            <CardHeader className="p-0">
              <div className="flex border-b">
                {["Booking Summary", "Cost Estimates", "Quotations", "Job Order"].map((tab, idx) => (
                  <button
                    key={idx}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-black hover:bg-gray-100 focus:outline-none"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Content of the selected tab goes here */}
              <p className="text-gray-500">Select a tab to view details...</p>
            </CardContent>
          </Card>


          {/* Site Data Grid - Updated to include Display card */}

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
                <CardTitle
                  className="text-base flex items-center"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '22px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance{" "}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setComplianceDialogOpen(true)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3" style={{ transform: 'translateX(35px) translateY(-20px)' }}>
                  {(() => {
                    if (!Array.isArray(product.compliance)) {
                      return (
                        <div className="text-sm text-gray-500">No Compliance have been created yet</div>
                      )
                    }

                    const nonDeletedItems = product.compliance.filter((item: ComplianceItem) => !item.deleted)

                    if (nonDeletedItems.length === 0) {
                      return (
                        <div className="text-sm text-gray-500">
                          {product.compliance.some((item: ComplianceItem) => item.deleted)
                            ? "All compliance records have been deleted"
                            : "No Compliance have been created yet"
                          }
                        </div>
                      )
                    }

                    return nonDeletedItems
                      .sort((a: ComplianceItem, b: ComplianceItem) => {
                        const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
                        const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
                        return timeB - timeA // Newest first
                      })
                      .map((item: ComplianceItem, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold ${
                            item.doc_url ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            ✓
                          </div>
                          <div className="flex flex-col">
                            <label
                              style={{
                                fontFamily: 'Inter',
                                fontWeight: 600,
                                fontSize: '18px',
                                lineHeight: '132%',
                                letterSpacing: '0%',
                                color: '#000000'
                              }}
                            >
                              {item.name}
                            </label>
                          </div>
                        </div>
                      ))
                  })()}
                </div>
                <div className="absolute bottom-4 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent w-[203px] h-[47px]"
                    onClick={() => setViewComplianceDialogOpen(true)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Structure - Always show */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  <span style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    transform: 'translate(0px, 0px)' // Add transform for position control
                  }}>
                    Structure
                  </span>
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
                      <DropdownMenuItem onClick={handleStructureEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4" style={{ transform: 'translateY(-30px) translateX(15px)' }}>
                  <div style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '18px',
                    lineHeight: '132%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}>
                    <span>Color:</span>{" "}
                    <span style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '18px',
                      lineHeight: '132%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}>
                      {product.structure?.color || "Not Available"}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '18px',
                    lineHeight: '132%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}>
                    <span>Contractor:</span>{" "}
                    <span style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '18px',
                      lineHeight: '132%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}>
                      {product.structure?.contractor || "Not Available"}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '18px',
                    lineHeight: '132%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}>
                    <span>Condition:</span>{" "}
                    <span style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '18px',
                      lineHeight: '132%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}>
                      {product.structure?.condition || "Not Available"}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '18px',
                    lineHeight: '132%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}>
                    <span>Last Maintenance:</span>{" "}
                    <span style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '18px',
                      lineHeight: '132%',
                      letterSpacing: '0%',
                      color: '#333333'
                    }}>
                      {formatFirebaseDate(product.structure?.last_maintenance) || "Not Available"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => setBlueprintDialogOpen(true)}>
                    View Blueprint
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleViewHistory}>
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
                <CardTitle
                  className="text-base flex items-center"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '22px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
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
              <CardContent className="p-4 relative">
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
                <CardTitle
                  className="text-base flex items-center"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '22px',
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Personnel
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
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      Security:
                    </span>{" "}
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#333333'
                      }}
                    >
                      {product.specs_rental?.security || ""}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      Caretaker:
                    </span>{" "}
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#333333'
                      }}
                    >
                      {product.specs_rental?.caretaker || ""}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
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
          router.push(`/logistics/assignments/create?projectSite=${id}`)
        }}
      />
      <DisplayIndexCardDialog
        open={displayIndexCardDialogOpen}
        onOpenChange={setDisplayIndexCardDialogOpen}
        onCreateSA={() => {
          // Navigate to create service assignment with this site pre-selected
          router.push(`/logistics/assignments/create?projectSite=${id}`)
        }}
      />

      {/* Blueprint Dialog */}
      <Dialog open={blueprintDialogOpen} onOpenChange={setBlueprintDialogOpen}>
        <DialogContent className="max-w-2xl mx-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Blueprints</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload Preview (when selecting a new file) */}
            {blueprintPreviewUrl && (
              <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedBlueprintFile?.type === 'application/pdf' ? (
                  <div className="w-full h-full">
                    <Document
                      file={blueprintPreviewUrl}
                      onLoadSuccess={onPdfLoadSuccess}
                      onLoadError={onPdfLoadError}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pdfPageNumber}
                        width={200}
                      />
                    </Document>
                  </div>
                ) : (
                  <img
                    src={blueprintPreviewUrl}
                    alt="New blueprint preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Blueprints List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {(() => {
                // Get all blueprints (handle both old and new formats)
                let blueprints: Array<{blueprint: string, uploaded_by: string, created: any}> = []

                if (product?.blueprints) {
                  if (Array.isArray(product.blueprints)) {
                    // New format - already an array
                    blueprints = product.blueprints
                  } else {
                    // Old format - convert object to array
                    blueprints = Object.values(product.blueprints)
                  }
                }

                if (blueprints && blueprints.length > 0) {
                  // Sort by created timestamp (most recent first)
                  const sortedBlueprints = [...blueprints].sort((a: {created: any}, b: {created: any}) => {
                    const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
                    const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
                    return timeB - timeA
                  })

                  return sortedBlueprints.map((blueprint: {blueprint: string, uploaded_by: string, created: any}, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white">
                      {/* Left side - Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{blueprint.uploaded_by}</div>
                        <div className="text-xs text-gray-500">
                          {formatFirebaseDate(blueprint.created)}
                        </div>
                      </div>

                      {/* Right side - Blueprint Preview */}
                      <div
                        className="w-20 h-20 bg-gray-100 rounded border overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleBlueprintClick(blueprint)}
                      >
                        {isPdfFile(blueprint.blueprint) ? (
                          <div className="w-full h-full">
                            <Document
                              file={blueprint.blueprint}
                              loading={
                                <div className="flex items-center justify-center h-full">
                                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                </div>
                              }
                            >
                              <Page
                                pageNumber={1}
                                width={80}
                                height={80}
                              />
                            </Document>
                          </div>
                        ) : (
                          <img
                            src={blueprint.blueprint}
                            alt="Blueprint"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))
                } else {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-sm">No blueprints uploaded yet</div>
                    </div>
                  )
                }
              })()}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleBlueprintFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleUploadButtonClick}
                disabled={isUploadingBlueprint}
              >
                {selectedBlueprintFile ? 'Change File' : 'Add New Blueprints'}
              </Button>
              {selectedBlueprintFile && (
                <Button
                  className="flex-1"
                  onClick={handleBlueprintUpload}
                  disabled={isUploadingBlueprint}
                >
                  {isUploadingBlueprint ? 'Uploading...' : 'Upload Blueprint'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blueprint Success Dialog */}
      <Dialog open={blueprintSuccessDialogOpen} onOpenChange={setBlueprintSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Success</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-semibold mb-2">✓</div>
            <p className="text-gray-700">Blueprint uploaded successfully!</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setBlueprintSuccessDialogOpen(false)} className="w-full">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compliance Add Success Dialog */}
      <Dialog open={complianceAddSuccessDialogOpen} onOpenChange={setComplianceAddSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Success</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-semibold mb-2">✓</div>
            <p className="text-gray-700">Compliance document added successfully!</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setComplianceAddSuccessDialogOpen(false)} className="w-full">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compliance Edit Success Dialog */}
      <Dialog open={complianceEditSuccessDialogOpen} onOpenChange={setComplianceEditSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Success</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-semibold mb-2">✓</div>
            <p className="text-gray-700">Compliance document updated successfully!</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setComplianceEditSuccessDialogOpen(false)} className="w-full">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compliance Delete Success Dialog */}
      <Dialog open={complianceDeleteSuccessDialogOpen} onOpenChange={setComplianceDeleteSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Success</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-semibold mb-2">✓</div>
            <p className="text-gray-700">Compliance document deleted successfully!</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setComplianceDeleteSuccessDialogOpen(false)} className="w-full">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Blueprint Dialog */}
      <Dialog open={fullscreenDialogOpen} onOpenChange={setFullscreenDialogOpen}>
        <DialogContent className="max-w-6xl mx-auto max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {fullscreenBlueprint && (
                <div className="text-left">
                  <div className="font-medium">{fullscreenBlueprint.uploaded_by}</div>
                  <div className="text-sm text-gray-500">
                    {formatFirebaseDate(fullscreenBlueprint.created)}
                  </div>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {fullscreenBlueprint && (
              <div className="w-full h-full min-h-[60vh] bg-gray-100 rounded-lg overflow-hidden">
                {isPdfFile(fullscreenBlueprint.blueprint) ? (
                  <div className="w-full h-full relative">
                    <Document
                      file={fullscreenBlueprint.blueprint}
                      onLoadSuccess={onFullscreenPdfLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      }
                    >
                      <Page
                        pageNumber={fullscreenPdfPageNumber}
                        width={800}
                        className="mx-auto"
                      />
                    </Document>
                    {fullscreenPdfNumPages && fullscreenPdfNumPages > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFullscreenPdfPageNumber(Math.max(1, fullscreenPdfPageNumber - 1))}
                          disabled={fullscreenPdfPageNumber <= 1}
                          className="text-white hover:bg-white hover:text-black"
                        >
                          ‹
                        </Button>
                        <span className="text-sm">
                          Page {fullscreenPdfPageNumber} of {fullscreenPdfNumPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFullscreenPdfPageNumber(Math.min(fullscreenPdfNumPages, fullscreenPdfPageNumber + 1))}
                          disabled={fullscreenPdfPageNumber >= fullscreenPdfNumPages}
                          className="text-white hover:bg-white hover:text-black"
                        >
                          ›
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={fullscreenBlueprint.blueprint}
                    alt="Fullscreen blueprint"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Structure Update Dialog */}
      <Dialog open={structureUpdateDialogOpen} onOpenChange={setStructureUpdateDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <input
                type="text"
                value={structureForm.color}
                onChange={(e) => setStructureForm({ ...structureForm, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter structure color"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contractor</label>
              <input
                type="text"
                value={structureForm.contractor}
                onChange={(e) => setStructureForm({ ...structureForm, contractor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contractor name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Condition</label>
              <input
                type="text"
                value={structureForm.condition}
                onChange={(e) => setStructureForm({ ...structureForm, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter structure condition"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setStructureUpdateDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStructureUpdate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Compliance Dialog */}
        <Dialog open={complianceDialogOpen} onOpenChange={setComplianceDialogOpen}>
          <DialogContent className="max-w-lg mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Compliance</DialogTitle>
            </DialogHeader>

            {/* Table-like header */}
            <div className="grid grid-cols-2 px-2 py-2 font-medium text-sm text-gray-700">
              <span>Items</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="space-y-2">
              {(() => {
                if (!Array.isArray(product?.compliance)) {
                  return (
                    <p className="text-sm text-gray-500 px-3">No Compliance have been created yet</p>
                  )
                }

                const nonDeletedItems = product.compliance.filter((item: ComplianceItem) => !item.deleted)

                if (nonDeletedItems.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 px-3">
                      {product.compliance.some((item: ComplianceItem) => item.deleted)
                        ? "All compliance records have been deleted"
                        : "No Compliance have been created yet"
                      }
                    </p>
                  )
                }

                return nonDeletedItems
                  .sort((a: ComplianceItem, b: ComplianceItem) => {
                    const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
                    const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
                    return timeB - timeA // Newest first
                  })
                  .map((item: ComplianceItem, filteredIndex: number) => {
                    const originalIndex = product.compliance.findIndex((origItem: ComplianceItem) => origItem === item);
                    return (
                      <div
                        key={originalIndex}
                        className="flex items-center justify-between p-3 rounded-md bg-gray-50"
                      >
                        {/* Item name */}
                        <span className="text-sm font-medium">{item.name}</span>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() => {
                              if (product?.compliance && Array.isArray(product.compliance)) {
                                const item = product.compliance[originalIndex]
                                setEditingComplianceIndex(originalIndex)
                                setEditComplianceForm({
                                  name: item.name,
                                  document: null, // Reset document selection
                                  originalFilename: item.filename_doc || '',
                                })
                                setEditComplianceDialogOpen(true)
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                            onClick={async () => {
                              if (!product || !Array.isArray(product.compliance)) return

                              try {
                                // Create a copy of the compliance array
                                const updatedCompliance = [...product.compliance]
                                // Set deleted to true for the selected item
                                updatedCompliance[originalIndex] = { ...updatedCompliance[originalIndex], deleted: true }

                                // Update the product in the database
                                await updateProduct(product.id, { compliance: updatedCompliance })

                                // Update local product state
                                setProduct({ ...product, compliance: updatedCompliance })
                                // Show success dialog
                                setComplianceDeleteSuccessDialogOpen(true)
                              } catch (error) {
                                console.error('Error deleting compliance item:', error)
                                alert('Failed to delete compliance item. Please try again.')
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
              })()}
            </div>

            {/* Add Compliance Row */}
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full border border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                onClick={() => {
                  setAddComplianceDialogOpen(true)
                }}
              >
                + Add Compliance
              </Button>
            </div>

            {/* OK button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setComplianceDialogOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-[186px] h-[47px]"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Compliance Dialog */}
        <Dialog open={addComplianceDialogOpen} onOpenChange={setAddComplianceDialogOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add Compliance Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={complianceForm.name}
                  onChange={(e) => setComplianceForm({ ...complianceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Document <span className="text-gray-500">(Optional)</span></label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fileInput = document.getElementById('add-compliance-file-input') as HTMLInputElement
                      fileInput?.click()
                    }}
                    className="text-sm"
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-600">
                    {complianceForm.document ? complianceForm.document.name : 'No file chosen'}
                  </span>
                </div>
                <input
                  id="add-compliance-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setComplianceForm({ ...complianceForm, document: file })
                    }
                  }}
                  className="hidden"
                />
              </div>
              {complianceError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {complianceError}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setAddComplianceDialogOpen(false)
                  setComplianceForm({ name: '', document: null })
                }}
                className="flex-1"
                disabled={isUploadingCompliance}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Clear previous error
                  setComplianceError('')

                  // Validation
                  if (!complianceForm.name.trim()) {
                    setComplianceError('Document name is required')
                    return
                  }

                  // Check file size if a document is selected (limit to 10MB)
                  if (complianceForm.document && complianceForm.document.size > 10 * 1024 * 1024) {
                    setComplianceError('File size must be less than 10MB')
                    return
                  }

                  if (!product || !userData) {
                    setComplianceError('Missing product or user information')
                    return
                  }

                  setIsUploadingCompliance(true)
                  try {
                    let downloadURL = ''

                    // Upload document to Firebase Storage only if a document is selected
                    if (complianceForm.document) {
                      downloadURL = await uploadFileToFirebaseStorage(complianceForm.document, `compliance/${product.id}/`)
                    }

                    // Create new compliance item
                    const uploaderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown User'
                    const newComplianceItem: ComplianceItem = {
                      name: complianceForm.name.trim(),
                      doc_url: downloadURL,
                      created: new Date(),
                      created_by: uploaderName,
                      filename_doc: complianceForm.document ? complianceForm.document.name : '',
                      deleted: false
                    }

                    // Get existing compliance or create empty array
                    const existingCompliance = Array.isArray(product.compliance) ? product.compliance : []

                    // Add new compliance item
                    const updatedCompliance = [...existingCompliance, newComplianceItem]

                    // Update product with new compliance array
                    await updateProduct(product.id, { compliance: updatedCompliance })

                    // Update local product state
                    setProduct({ ...product, compliance: updatedCompliance })

                    // Reset form and close dialog
                    setComplianceForm({ name: '', document: null })
                    setAddComplianceDialogOpen(false)
                    setComplianceError('')
                    // Show success dialog
                    setComplianceAddSuccessDialogOpen(true)
                  } catch (error) {
                    console.error('Error adding compliance document:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                    setComplianceError(`Failed to add compliance document: ${errorMessage}. Please try again.`)
                  } finally {
                    setIsUploadingCompliance(false)
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!complianceForm.name.trim() || isUploadingCompliance}
              >
                {isUploadingCompliance ? 'Uploading...' : 'Add Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Compliance Dialog */}
        <Dialog open={editComplianceDialogOpen} onOpenChange={setEditComplianceDialogOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Compliance Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={editComplianceForm.name}
                  onChange={(e) => setEditComplianceForm({ ...editComplianceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Document <span className="text-gray-500">(Optional)</span></label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fileInput = document.getElementById('edit-compliance-file-input') as HTMLInputElement
                      fileInput?.click()
                    }}
                    className="text-sm"
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-600">
                    {editComplianceForm.document
                      ? editComplianceForm.document.name
                      : editComplianceForm.originalFilename || 'No file chosen'
                    }
                  </span>
                </div>
                <input
                  id="edit-compliance-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setEditComplianceForm({ ...editComplianceForm, document: file })
                    }
                  }}
                  className="hidden"
                />
              </div>
              {complianceError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {complianceError}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditComplianceDialogOpen(false)
                  setTimeout(() => {
                    setEditingComplianceIndex(null)
                    setEditComplianceForm({ name: '', document: null, originalFilename: '' })
                  }, 300) // Delay to allow dialog close animation
                }}
                className="flex-1"
                disabled={isUploadingCompliance}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Clear previous error
                  setComplianceError('')

                  // Validation
                  if (!editComplianceForm.name.trim()) {
                    setComplianceError('Document name is required')
                    return
                  }

                  // Check file size if a document is selected (limit to 10MB)
                  if (editComplianceForm.document && editComplianceForm.document.size > 10 * 1024 * 1024) {
                    setComplianceError('File size must be less than 10MB')
                    return
                  }

                  if (!product || !userData || editingComplianceIndex === null) {
                    setComplianceError('Missing product, user information, or editing index')
                    return
                  }

                  setIsUploadingCompliance(true)
                  try {
                    let downloadURL = ''

                    // Upload new document to Firebase Storage only if a new document is selected
                    if (editComplianceForm.document) {
                      downloadURL = await uploadFileToFirebaseStorage(editComplianceForm.document, `compliance/${product.id}/`)
                    } else {
                      // Keep existing document URL if no new document is selected
                      downloadURL = product.compliance[editingComplianceIndex]?.doc_url || ''
                    }

                    // Update the compliance item
                    const uploaderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown User'
                    const updatedComplianceItem: ComplianceItem = {
                      name: editComplianceForm.name.trim(),
                      doc_url: downloadURL,
                      created: product.compliance[editingComplianceIndex]?.created || new Date(),
                      created_by: product.compliance[editingComplianceIndex]?.created_by || uploaderName,
                      filename_doc: editComplianceForm.document ? editComplianceForm.document.name : (product.compliance[editingComplianceIndex]?.filename_doc || ''),
                      deleted: product.compliance[editingComplianceIndex]?.deleted || false
                    }

                    // Get existing compliance array
                    const existingCompliance = Array.isArray(product.compliance) ? [...product.compliance] : []

                    // Update the specific item
                    existingCompliance[editingComplianceIndex] = updatedComplianceItem

                    // Update product with updated compliance array
                    await updateProduct(product.id, { compliance: existingCompliance })

                    // Update local product state
                    setProduct({ ...product, compliance: existingCompliance })

                    // Reset form and close dialog
                    setEditComplianceForm({ name: '', document: null, originalFilename: '' })
                    setEditComplianceDialogOpen(false)
                    setEditingComplianceIndex(null)
                    setComplianceError('')
                    // Show success dialog
                    setComplianceEditSuccessDialogOpen(true)
                  } catch (error) {
                    console.error('Error updating compliance document:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                    setComplianceError(`Failed to update compliance document: ${errorMessage}. Please try again.`)
                  } finally {
                    setIsUploadingCompliance(false)
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!editComplianceForm.name.trim() || isUploadingCompliance}
              >
                {isUploadingCompliance ? 'Updating...' : 'Update Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Compliance Dialog */}
        <Dialog open={viewComplianceDialogOpen} onOpenChange={setViewComplianceDialogOpen}>
          <DialogContent className="max-w-2xl mx-auto">
            <DialogHeader>
              <DialogTitle>View Compliances</DialogTitle>
            </DialogHeader>

            {/* Table header */}
            <div className="grid grid-cols-3 px-4 py-2 text-sm font-medium text-gray-700 border-b">
              <span>Items</span>
              <span>Attachment</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table body */}
            <div className="divide-y">
              {(() => {
                if (!Array.isArray(product?.compliance)) {
                  return (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No Compliance have been created yet
                    </div>
                  )
                }

                const nonDeletedItems = product.compliance.filter((item: ComplianceItem) => !item.deleted)

                if (nonDeletedItems.length === 0) {
                  return (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      {product.compliance.some((item: ComplianceItem) => item.deleted)
                        ? "All compliance records have been deleted"
                        : "No Compliance have been created yet"
                      }
                    </div>
                  )
                }

                return nonDeletedItems
                  .sort((a: ComplianceItem, b: ComplianceItem) => {
                    const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
                    const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
                    return timeB - timeA // Newest first
                  })
                  .map((item: ComplianceItem, filteredIndex: number) => {
                    const originalIndex = product.compliance.findIndex((origItem: ComplianceItem) => origItem === item);
                    return (
                      <div
                        key={originalIndex}
                        className="grid grid-cols-3 items-center px-4 py-3 bg-gray-50"
                      >
                        {/* Item with status indicator */}
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-5 h-5 flex items-center justify-center rounded-sm text-white text-xs ${
                              item.doc_url ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            ✓
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {item.name}
                          </span>
                        </div>

                        {/* Attachment column */}
                        <div className="text-sm">
                          {item.doc_url ? (
                            <a
                              href={item.doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          ) : (
                            <span className="text-gray-400 cursor-not-allowed">Upload</span>
                          )}
                        </div>

                        {/* Actions column */}
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() => {
                              if (product?.compliance && Array.isArray(product.compliance)) {
                                const item = product.compliance[originalIndex]
                                setEditingComplianceIndex(originalIndex)
                                setEditComplianceForm({
                                  name: item.name,
                                  document: null, // Reset document selection
                                  originalFilename: item.filename_doc || '',
                                })
                                setEditComplianceDialogOpen(true)
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setViewComplianceDialogOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-[186px] h-[47px]"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>


    {/* Maintenance History Dialog */}
    <Dialog open={maintenanceHistoryDialogOpen} onOpenChange={setMaintenanceHistoryDialogOpen}>
      <DialogContent className="max-w-3xl mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '120%',
              letterSpacing: '0%',
              color: '#000000'
            }}
          >
            Maintenance History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {maintenanceHistoryLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#666666'
                }}
              >
                Loading maintenance history...
              </p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96 border rounded-md">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead
                      className="w-1/4"
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      Date
                    </TableHead>
                    <TableHead
                      className="w-1/4"
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      SA Type
                    </TableHead>
                    <TableHead
                      className="w-1/4"
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      SA No.
                    </TableHead>
                    <TableHead
                      className="w-1/4"
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '120%',
                        letterSpacing: '0%',
                        color: '#000000'
                      }}
                    >
                      Report
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            fontSize: '14px',
                            lineHeight: '120%',
                            letterSpacing: '0%',
                            color: '#666666'
                          }}
                        >
                          No maintenance history found for this site.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenanceHistory.map((assignment) => (
                      <TableRow key={assignment.id} className="hover:bg-gray-50">
                        <TableCell
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            fontSize: '14px',
                            lineHeight: '120%',
                            letterSpacing: '0%',
                            color: '#000000'
                          }}
                        >
                          {formatFirebaseDate(assignment.created)}
                        </TableCell>
                        <TableCell
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '120%',
                            letterSpacing: '0%',
                            color: '#333333'
                          }}
                        >
                          {assignment.serviceType || "N/A"}
                        </TableCell>
                        <TableCell
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '120%',
                            letterSpacing: '0%',
                            color: '#333333'
                          }}
                        >
                          {assignment.saNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          {assignment.attachments && assignment.attachments.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              style={{
                                fontFamily: 'Inter',
                                fontWeight: 600,
                                fontSize: '14px',
                                lineHeight: '120%',
                                letterSpacing: '0%',
                                color: '#000000'
                              }}
                            >
                              View Report
                            </Button>
                          ) : (
                            <span
                              style={{
                                fontFamily: 'Inter',
                                fontWeight: 500,
                                fontSize: '14px',
                                lineHeight: '120%',
                                letterSpacing: '0%',
                                color: '#666666'
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setMaintenanceHistoryDialogOpen(false)}
            className="w-32"
            style={{
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '120%',
              letterSpacing: '0%',
              color: '#FFFFFF'
            }}
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    </div>
  )
}
