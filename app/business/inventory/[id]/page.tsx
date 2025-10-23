"use client"

import { getProductById, uploadFileToFirebaseStorage, updateProduct, getServiceAssignmentsByProductId } from "@/lib/firebase-service"
import { getAllCostEstimates } from "@/lib/cost-estimate-service"
import { getAllQuotations, type Quotation } from "@/lib/quotation-service"
import { getAllJobOrders } from "@/lib/job-order-service"
import type { Booking } from "@/lib/booking-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"

// Global type declarations for Google Maps
declare global {
  interface Window {
    google: any
  }
}
import { notFound, useSearchParams } from "next/navigation"
import Image from "next/image"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import "react-day-picker/dist/style.css"
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
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
} from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { useRef, useState, useEffect, use } from "react"
import dynamic from "next/dynamic"

const PDFDocument = dynamic(() => import("react-pdf").then(mod => mod.Document), { ssr: false })
const PDFPage = dynamic(() => import("react-pdf").then(mod => mod.Page), { ssr: false })
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { collection, query, where, orderBy, getDocs, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlarmSettingDialog } from "@/components/alarm-setting-dialog"
import { IlluminationIndexCardDialog } from "@/components/illumination-index-card-dialog"
import { DisplayIndexCardDialog } from "@/components/display-index-card-dialog"
import type { JobOrder } from "@/lib/types/job-order" // Import the JobOrder type
import { useAuth } from "@/contexts/auth-context"
import { useParams, useRouter } from "next/navigation"
import { softDeleteProduct } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/lib/firebase-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload } from "lucide-react"

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

const getQuotationStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case "draft":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FileText className="h-3.5 w-3.5" />,
        label: "Draft",
      }
    case "sent":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Mail className="h-3.5 w-3.5" />,
        label: "Sent",
      }
    case "viewed":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Eye className="h-3.5 w-3.5" />,
        label: "Viewed",
      }
    case "accepted":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        label: "Accepted",
      }
    case "rejected":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="h-3.5 w-3.5" />,
        label: "Rejected",
      }
    case "expired":
      return {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: "Expired",
      }
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Clock3 className="h-3.5 w-3.5" />,
        label: "Unknown",
      }
  }
}

const getJobOrderStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case "draft":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FileText className="h-3.5 w-3.5" />,
        label: "Draft",
      }
    case "pending":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock3 className="h-3.5 w-3.5" />,
        label: "Pending",
      }
    case "approved":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        label: "Approved",
      }
    case "completed":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        label: "Completed",
      }
    case "cancelled":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="h-3.5 w-3.5" />,
        label: "Cancelled",
      }
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Clock3 className="h-3.5 w-3.5" />,
        label: "Unknown",
      }
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
  campaignName?: string
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

export default function BusinessProductDetailPage({ params }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { userData } = useAuth()
  const { id } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]) // Changed from serviceAssignments
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]) // Keep service assignments for other parts if needed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // New state variables for the four tabs
  const [bookings, setBookings] = useState<Booking[]>([])
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [costEstimatesLoading, setCostEstimatesLoading] = useState(true)
  const [quotationsLoading, setQuotationsLoading] = useState(true)
  const [jobOrdersLoading, setJobOrdersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("booking-summary")
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

  // Personnel dialog states
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false)
  const [personnelForm, setPersonnelForm] = useState({
    name: '',
    position: '',
    contact: '',
    start_date: new Date()
  })
  const [personnelFormError, setPersonnelFormError] = useState('')
  const [isSubmittingPersonnel, setIsSubmittingPersonnel] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // View All Personnel dialog state
  const [viewAllPersonnelDialogOpen, setViewAllPersonnelDialogOpen] = useState(false)

  // Edit Personnel dialog states
  const [editingPersonnelIndex, setEditingPersonnelIndex] = useState<number | null>(null)
  const [editPersonnelDialogOpen, setEditPersonnelDialogOpen] = useState(false)

  // Site Calendar Modal states
  const [siteCalendarModalOpen, setSiteCalendarModalOpen] = useState(false)
  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [editPersonnelForm, setEditPersonnelForm] = useState({
    name: '',
    position: '',
    contact: '',
    start_date: new Date(),
    end_date: null as Date | null,
    status: true
  })
  const [editPersonnelFormError, setEditPersonnelFormError] = useState('')
  const [isUpdatingPersonnel, setIsUpdatingPersonnel] = useState(false)
  const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false)
  const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false)

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker && !(event.target as Element).closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
      if (showEditStartDatePicker && !(event.target as Element).closest('.edit-start-date-picker-container')) {
        setShowEditStartDatePicker(false)
      }
      if (showEditEndDatePicker && !(event.target as Element).closest('.edit-end-date-picker-container')) {
        setShowEditEndDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDatePicker, showEditStartDatePicker, showEditEndDatePicker])

  // Initialize PDF.js worker on client side
  useEffect(() => {
    (async () => {
      const pdfjsLib = await import("pdfjs-dist/build/pdf")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      console.log("PDF.js initialized successfully!")
    })()
  }, [])

  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Edit form state
  const [siteType, setSiteType] = useState<"static" | "digital">("static")
  const [category, setCategory] = useState("")
  const [siteName, setSiteName] = useState("")
  const [location, setLocation] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [dimensionUnit, setDimensionUnit] = useState<"ft" | "m">("ft")
  const [elevation, setElevation] = useState("")
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft")
  const [description, setDescription] = useState("")
  const [selectedAudience, setSelectedAudience] = useState<string[]>([])
  const [dailyTraffic, setDailyTraffic] = useState("")
  const [trafficUnit, setTrafficUnit] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [price, setPrice] = useState("")
  const [priceUnit, setPriceUnit] = useState<"per spot" | "per day" | "per month">("per month")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])

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

  // Fetch bookings for this product
  useEffect(() => {
    const fetchBookings = async () => {
      if (!id) return

      setBookingsLoading(true)
      try {
        const bookingsQuery = query(
          collection(db, "booking"),
          where("product_id", "==", id),
          orderBy("created", "desc")
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const bookingsData: Booking[] = []

        bookingsSnapshot.forEach((doc) => {
          bookingsData.push({
            id: doc.id,
            ...doc.data(),
          } as Booking)
        })

        setBookings(bookingsData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setBookingsLoading(false)
      }
    }

    fetchBookings()
  }, [id])

  // Fetch cost estimates for this product
  useEffect(() => {
    const fetchCostEstimates = async () => {
      if (!id || !product) {
        setCostEstimatesLoading(false)
        return
      }

      setCostEstimatesLoading(true)
      try {
        const allCostEstimates = await getAllCostEstimates()
        const productId = id

        const relatedEstimates = allCostEstimates.filter((estimate) =>
          estimate.lineItems?.some(
            (item) => item.id === productId
          ),
        )

        setCostEstimates(relatedEstimates)
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
      } finally {
        setCostEstimatesLoading(false)
      }
    }

    fetchCostEstimates()
  }, [id, product])

  // Fetch quotations for this product
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!id || !product) {
        setQuotationsLoading(false)
        return
      }

      setQuotationsLoading(true)
      try {
        const allQuotations = await getAllQuotations()

        // Filter quotations that have products referencing this product
        const productId = id

        const relatedQuotations = allQuotations.filter((quotation) =>
          quotation.items && typeof quotation.items === 'object' &&
          quotation.items.product_id === productId
        )

        setQuotations(relatedQuotations)
      } catch (error) {
        console.error("Error fetching quotations:", error)
      } finally {
        setQuotationsLoading(false)
      }
    }

    fetchQuotations()
  }, [id, product])

  // Fetch job orders for this product
  useEffect(() => {
    const fetchJobOrders = async () => {
      if (!id || !product) {
        setJobOrdersLoading(false)
        return
      }

      setJobOrdersLoading(true)
      try {
        const allJobOrders = await getAllJobOrders()

        // Filter job orders that reference this product by site info
        const productId = id

        const relatedJobOrders = allJobOrders.filter(
          (jobOrder) => jobOrder.product_id === productId
        )

        setJobOrders(relatedJobOrders)
      } catch (error) {
        console.error("Error fetching job orders:", error)
      } finally {
        setJobOrdersLoading(false)
      }
    }

    fetchJobOrders()
  }, [id, product])

  const handleCreateServiceAssignment = () => {
    router.push(`/logistics/assignments/create?projectSite=${id}`)
  }

  const handleSiteCalendarClick = async () => {
    setSiteCalendarModalOpen(true)
    setCalendarLoading(true)
    try {
      // Reuse the existing booking fetching logic
      const bookingsQuery = query(
        collection(db, "booking"),
        where("product_id", "==", id),
        orderBy("created", "desc")
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData: Booking[] = []

      bookingsSnapshot.forEach((doc) => {
        bookingsData.push({
          id: doc.id,
          ...doc.data(),
        } as Booking)
      })

      setCalendarBookings(bookingsData)
    } catch (error) {
      console.error("Error fetching bookings for calendar:", error)
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleBlueprintFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is image only
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file only')
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

  // Personnel dialog handlers
  const handleAddPersonnel = async () => {
    // Clear previous error
    setPersonnelFormError('')

    // Validation
    if (!personnelForm.name.trim()) {
      setPersonnelFormError('Name is required')
      return
    }
    if (personnelForm.name.trim().length < 2) {
      setPersonnelFormError('Name must be at least 2 characters long')
      return
    }
    if (personnelForm.name.trim().length > 100) {
      setPersonnelFormError('Name must be less than 100 characters')
      return
    }
    if (!personnelForm.position.trim()) {
      setPersonnelFormError('Position is required')
      return
    }
    if (personnelForm.position.trim().length < 2) {
      setPersonnelFormError('Position must be at least 2 characters long')
      return
    }
    if (personnelForm.position.trim().length > 100) {
      setPersonnelFormError('Position must be less than 100 characters')
      return
    }
    if (!personnelForm.contact.trim()) {
      setPersonnelFormError('Contact number is required')
      return
    }
    // Validate contact number format (should be exactly 10 digits for Philippine mobile)
    const contactRegex = /^\d{10}$/
    if (!contactRegex.test(personnelForm.contact.trim())) {
      setPersonnelFormError('Contact number must be exactly 10 digits (e.g., 9123456789)')
      return
    }

    if (!product || !userData) {
      setPersonnelFormError('Missing product or user information')
      return
    }

    setIsSubmittingPersonnel(true)
    try {
      // Get existing personnel or create empty array
      const existingPersonnel = Array.isArray(product.personnel) ? product.personnel : []

      // Create new personnel entry with all required fields
      const uploaderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown User'
      const currentDate = new Date()
      const newPersonnelEntry = {
        status: true, // Active by default
        name: personnelForm.name.trim(),
        position: personnelForm.position.trim(),
        contact: personnelForm.contact.trim(),
        start_date: currentDate, // Current date as start date
        created: currentDate, // Current date as created date
        created_by: uploaderName // Current user as creator
      }

      // Add new personnel to the array
      const updatedPersonnel = [...existingPersonnel, newPersonnelEntry]

      // Update product with new personnel array
      await updateProduct(product.id, { personnel: updatedPersonnel })

      // Update local product state
      setProduct({ ...product, personnel: updatedPersonnel })

      // Reset form and close dialog
      setPersonnelForm({ name: '', position: '', contact: '', start_date: new Date() })
      setPersonnelDialogOpen(false)
      setPersonnelFormError('')
    } catch (error) {
      console.error('Error adding personnel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setPersonnelFormError(`Failed to add personnel: ${errorMessage}. Please try again.`)
    } finally {
      setIsSubmittingPersonnel(false)
    }
  }

  // Edit Personnel dialog handlers
  const handleEditPersonnel = (index: number) => {
    if (!product?.personnel || !Array.isArray(product.personnel)) return

    const person = product.personnel[index]
    // Clean contact number - remove +63 prefix and non-digits
    const cleanContact = (person.contact || '').replace(/^\+63/, '').replace(/\D/g, '')

    setEditingPersonnelIndex(index)
    setEditPersonnelForm({
      name: person.name || '',
      position: person.position || '',
      contact: cleanContact,
      start_date: person.start_date && person.start_date.seconds ? new Date(person.start_date.seconds * 1000) : new Date(),
      end_date: person.end_date && person.end_date.seconds ? new Date(person.end_date.seconds * 1000) : null,
      status: person.status ?? true
    })
    setEditPersonnelDialogOpen(true)
  }

  const handleUpdatePersonnel = async () => {
    // Clear previous error
    setEditPersonnelFormError('')

    // Validation
    if (!editPersonnelForm.name.trim()) {
      setEditPersonnelFormError('Name is required')
      return
    }
    if (editPersonnelForm.name.trim().length < 2) {
      setEditPersonnelFormError('Name must be at least 2 characters long')
      return
    }
    if (editPersonnelForm.name.trim().length > 100) {
      setEditPersonnelFormError('Name must be less than 100 characters')
      return
    }
    if (!editPersonnelForm.position.trim()) {
      setEditPersonnelFormError('Position is required')
      return
    }
    if (editPersonnelForm.position.trim().length < 2) {
      setEditPersonnelFormError('Position must be at least 2 characters long')
      return
    }
    if (editPersonnelForm.position.trim().length > 100) {
      setEditPersonnelFormError('Position must be less than 100 characters')
      return
    }
    if (!editPersonnelForm.contact.trim()) {
      setEditPersonnelFormError('Contact number is required')
      return
    }
    // Validate contact number format (should be exactly 10 digits for Philippine mobile)
    const contactRegex = /^\d{10}$/
    if (!contactRegex.test(editPersonnelForm.contact.trim())) {
      setEditPersonnelFormError('Contact number must be exactly 10 digits (e.g., 9123456789)')
      return
    }
    // Validate date logic
    if (editPersonnelForm.end_date && editPersonnelForm.start_date > editPersonnelForm.end_date) {
      setEditPersonnelFormError('End date must be after start date')
      return
    }

    if (!product || !userData || editingPersonnelIndex === null) {
      setEditPersonnelFormError('Missing product, user information, or editing index')
      return
    }

    setIsUpdatingPersonnel(true)
    try {
      // Get existing personnel
      const existingPersonnel = Array.isArray(product.personnel) ? [...product.personnel] : []

      // Update the specific personnel entry
      existingPersonnel[editingPersonnelIndex] = {
        ...existingPersonnel[editingPersonnelIndex],
        status: editPersonnelForm.status,
        name: editPersonnelForm.name.trim(),
        position: editPersonnelForm.position.trim(),
        contact: editPersonnelForm.contact.trim(),
        start_date: editPersonnelForm.start_date,
        end_date: editPersonnelForm.end_date
      }

      // Update product with new personnel array
      await updateProduct(product.id, { personnel: existingPersonnel })

      // Update local product state
      setProduct({ ...product, personnel: existingPersonnel })

      // Reset form and close dialog
      setEditPersonnelForm({ name: '', position: '', contact: '', start_date: new Date(), end_date: null, status: true })
      setEditPersonnelDialogOpen(false)
      setEditingPersonnelIndex(null)
      setEditPersonnelFormError('')
    } catch (error) {
      console.error('Error updating personnel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setEditPersonnelFormError(`Failed to update personnel: ${errorMessage}. Please try again.`)
    } finally {
      setIsUpdatingPersonnel(false)
    }
  }

  // Update price unit based on site type
  useEffect(() => {
    setPriceUnit(siteType === "static" ? "per month" : "per spot")
  }, [siteType])

  // Update category when site type changes
  useEffect(() => {
    const categories = siteType === "static"
      ? ["Billboard", "Wallboard", "Transit Ads", "Column", "Bridgeway billboard", "Banner", "Lampost", "Lightbox", "Building Wrap", "Gantry", "Toll Plaza"]
      : ["Digital Billboard", "LED Poster", "Digital Transit Ads"]
    setCategory(categories[0])
  }, [siteType])

  const handleBack = () => {
    router.back()
  }

  // Form handlers
  const toggleAudience = (type: string) => {
    setSelectedAudience(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files) as File[]])
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : uploadedFiles.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < uploadedFiles.length - 1 ? prev + 1 : 0))
  }

  const handleRemoveImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const handleRemoveExistingImage = (imageUrl: string) => {
    setImagesToRemove(prev => [...prev, imageUrl])
  }

  const handleRestoreExistingImage = (imageUrl: string) => {
    setImagesToRemove(prev => prev.filter(url => url !== imageUrl))
  }

  const handleDelete = async () => {
    if (!product || !product.id) return

    try {
      await softDeleteProduct(product.id)
      toast({
        title: "Product deleted",
        description: `${product.name} has been successfully deleted.`,
      })
      // Update the product in the UI to show it as deleted
      setProduct({
        ...product,
        deleted: true,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!product || !product.id) return

    setIsSubmitting(true)

    // Clear previous validation errors
    setValidationErrors([])

    // Validation - collect all errors
    const errors: string[] = []

    if (!siteName.trim()) {
      errors.push("Site name")
    }

    if (!location.trim()) {
      errors.push("Location")
    }

    if (!price.trim()) {
      errors.push("Price")
    } else if (isNaN(Number(price))) {
      toast({
        title: "Validation Error",
        description: "Price must be a valid number.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Show validation error for missing required fields
    if (errors.length > 0) {
      setValidationErrors(errors)
      const errorMessage = errors.length === 1
        ? `${errors[0]} is required.`
        : `The following fields are required: ${errors.join(", ")}.`

      toast({
        title: "Required Fields Missing",
        description: errorMessage,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Upload new files to Firebase Storage
      const mediaUrls: Array<{ url: string; distance: string; type: string; isVideo: boolean }> = []
      for (const file of uploadedFiles) {
        const url = await uploadFileToFirebaseStorage(file, `products/${product.company_id}`)
        mediaUrls.push({
          url,
          distance: "0",
          type: file.type,
          isVideo: file.type.startsWith('video/')
        })
      }

      // Filter out removed images and combine with new media
      const existingMedia = (product.media || []).filter(mediaItem => !imagesToRemove.includes(mediaItem.url))
      const allMedia = [...existingMedia, ...mediaUrls]

      // Create update data
      const updateData = {
        name: siteName,
        description,
        price: parseFloat(price) || 0,
        content_type: siteType,
        categories: [category],
        specs_rental: {
          audience_types: selectedAudience,
          location,
          location_label: locationLabel,
          traffic_count: parseInt(dailyTraffic) || null,
          height: parseFloat(height) || null,
          width: parseFloat(width) || null,
          elevation: parseFloat(elevation) || null,
          structure: product.specs_rental?.structure || {
            color: null,
            condition: null,
            contractor: null,
            last_maintenance: null,
          },
          illumination: product.specs_rental?.illumination || {
            bottom_count: null,
            bottom_lighting_specs: null,
            left_count: null,
            left_lighting_specs: null,
            right_count: null,
            right_lighting_specs: null,
            upper_count: null,
            upper_lighting_specs: null,
            power_consumption_monthly: null,
          },
        },
        media: allMedia,
        type: "RENTAL",
        updated: serverTimestamp(),
      }

      // Update in Firestore
      await updateDoc(doc(db, "products", product.id), updateData)

      // Update local state
      setProduct({
        ...product,
        ...updateData,
      })

      setEditDialogOpen(false)

      toast({
        title: "Site updated successfully",
        description: `${siteName} has been updated.`,
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    if (product) {
      // Populate form with existing product data
      const currentSiteType = product.content_type === "static" ? "static" : "digital"
      setSiteType(currentSiteType)
      setCategory(product.categories?.[0] || "")
      setSiteName(product.name || "")
      setLocation(product.specs_rental?.location || "")
      setLocationLabel(product.specs_rental?.location_label || "")
      setHeight(product.specs_rental?.height?.toString() || "")
      setWidth(product.specs_rental?.width?.toString() || "")
      setDimensionUnit("ft") // Default
      setElevation(product.specs_rental?.elevation?.toString() || "")
      setElevationUnit("ft") // Default
      setDescription(product.description || "")
      setSelectedAudience(product.specs_rental?.audience_types || [])
      setDailyTraffic(product.specs_rental?.traffic_count?.toString() || "")
      setTrafficUnit("monthly") // Default
      setPrice(product.price?.toString() || "")
      setPriceUnit(currentSiteType === "static" ? "per month" : "per spot")
      setUploadedFiles([])
      setCurrentImageIndex(0)
      setImagesToRemove([])

      setEditDialogOpen(true)
      setValidationErrors([])

      // Show info about required fields
      setTimeout(() => {
        toast({
          title: "Required Fields",
          description: "Fields marked with * are required: Site Name, Location, and Price.",
        })
      }, 500)
    }
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

  if (!product) {
    return (
      <div className="overflow-auto p-6">
        <div className="max-w-xs text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Determine if this is a static or dynamic site
  const contentType = (product.content_type || "").toLowerCase()
  const isStatic = contentType === "static"
  const isDynamic = contentType === "dynamic"

  // Format dimensions
  const currentWidth = product.specs_rental?.width || 0
  const currentHeight = product.specs_rental?.height || 0
  const dimension = currentWidth && currentHeight ? `${currentWidth}ft x ${currentHeight}ft` : "Not specified"

  // Get location
  const currentLocation = product.specs_rental?.location || product.light?.location || "Unknown location"

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

  // Check if thumbnail is a video
  const isThumbnailVideo = product.media && product.media.length > 0 && product.media[0].isVideo

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
              <Link href="/business/inventory" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-2">
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
                {isThumbnailVideo ? (
                  <video
                    src={thumbnailUrl}
                    className="w-full h-full object-cover rounded-md"
                    controls={false}
                    preload="metadata"
                  />
                ) : (
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
                )}
              </div>

              {/* Google Map - Right Side */}
              <div className="relative aspect-square w-full bg-gray-100 rounded-md overflow-hidden">
                <GoogleMap location={currentLocation} className="w-full h-full" />
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
              <Button
                variant="outline"
                className="mt-2 w-[440px] h-[47px]"
                onClick={handleSiteCalendarClick}
              >
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
                    {product.specs_rental?.site_orientation || "N/A"}
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
                    {product.site_owner || "N/A"}
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
                    {product.specs_rental?.land_owner || "N/A"}
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
                    {product.partner || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Site Calendar */}

            {/* Action Buttons */}
            <div className="border-t pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full h-[47px] bg-[#737fff] hover:bg-[#5a67d8] text-white border-[#737fff]"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Site
              </Button>
              <Button
                variant="outline"
                className="w-full h-[47px] bg-[#737fff] hover:bg-[#5a67d8] text-white border-[#737fff]"
                onClick={() => router.push(`/business/reports/create?site=${id}`)}
              >
                Create Report
              </Button>
              <Button
                variant="outline"
                className="w-full h-[47px] bg-[#737fff] hover:bg-[#5a67d8] text-white border-[#737fff]"
                onClick={() => router.push(`/logistics/assignments/create?projectSite=${id}`)}
              >
                Create Service Assignment
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Site Data and Details */}
        <div className="lg:col-span-2 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <Card className="rounded-xl shadow-sm border">
            <CardHeader className="p-0">
              <div className="flex border-b">
                {[
                  { key: "booking-summary", label: "Booking Summary", count: bookings.length },
                  { key: "cost-estimates", label: "Cost Estimates", count: costEstimates.length },
                  { key: "quotations", label: "Quotations", count: quotations.length },
                  { key: "job-order", label: "Job Order", count: jobOrders.length }
                ].map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-6 py-3 text-sm font-semibold hover:bg-gray-100 focus:outline-none ${
                      activeTab === tab.key ? "text-blue-600 border-b-2 border-blue-600" : "text-black"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === "booking-summary" && (
                <div>
                  {bookingsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading bookings...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No bookings found for this site.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                        <div>Date</div>
                        <div>Project ID</div>
                        <div>Client</div>
                        <div>Content</div>
                        <div>Price</div>
                        <div>Total</div>
                        <div>Status</div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {bookings.map((booking) => {
                          const getStatusLabel = (status: string) => {
                            switch (status?.toUpperCase()) {
                              case "COMPLETED":
                                return "Completed"
                              case "RESERVED":
                                return "Ongoing"
                              default:
                                return status || "Unknown"
                            }
                          }

                          const getStatusBadge = (status: string) => {
                            const label = getStatusLabel(status)
                            if (label === "Completed") {
                              return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                            } else if (label === "Ongoing") {
                              return <Badge className="bg-red-100 text-red-800 border-red-200">Ongoing</Badge>
                            } else {
                              return <Badge variant="outline">{label}</Badge>
                            }
                          }

                          return (
                            <div key={booking.id} className="grid grid-cols-7 gap-4 p-4 text-sm">
                              <div className="text-gray-600">
                                {booking.start_date ? formatFirebaseDate(booking.start_date) : "N/A"} to
                                <br />
                                {booking.end_date ? formatFirebaseDate(booking.end_date) : "N/A"}
                              </div>
                              <div className="text-gray-900 font-medium">{booking.reservation_id || booking.id}</div>
                              <div className="text-gray-900">{booking.client?.name || "N/A"}</div>
                              <div className="text-gray-900">{booking.project_name || booking.product_name || "N/A"}</div>
                              <div className="text-red-600 font-medium">
                                ₱{booking.costDetails?.pricePerMonth?.toLocaleString() || "0"}
                                <br />
                                <span className="text-xs">/month</span>
                              </div>
                              <div className="text-red-600 font-bold">₱{booking.total_cost?.toLocaleString() || "0"}</div>
                              <div>
                                {getStatusBadge(booking.status)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cost-estimates" && (
                <div>
                  {costEstimatesLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading cost estimates...</p>
                    </div>
                  ) : costEstimates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No cost estimates found for this site.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                        <div>Date</div>
                        <div>Project ID</div>
                        <div>Type</div>
                        <div>Client</div>
                        <div>Status</div>
                        <div>Price</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {costEstimates.map((estimate) => (
                          <div
                            key={estimate.id}
                            className="grid grid-cols-6 gap-4 p-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/business/cost-estimates/${estimate.id}`)}
                          >
                            <div className="text-gray-600">{estimate.createdAt ? formatFirebaseDate(estimate.createdAt) : "N/A"}</div>
                            <div className="text-gray-900 font-medium">
                              {estimate.costEstimateNumber || estimate.id.slice(-8)}
                            </div>
                            <div className="text-gray-600">Cost Estimate</div>
                            <div className="text-gray-900">
                              {estimate.client?.company || (estimate.client as any)?.name || "Unknown Client"}
                            </div>
                            <div>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                {estimate.status || "Draft"}
                              </Badge>
                            </div>
                            <div className="text-red-600 font-medium">
                              ₱{estimate.totalAmount?.toLocaleString() || "0"}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "quotations" && (
                <div>
                  {quotationsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading quotations...</p>
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No quotations found for this site.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                        <div>Date</div>
                        <div>Project ID</div>
                        <div>Type</div>
                        <div>Client</div>
                        <div>Status</div>
                        <div>Price</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {quotations.map((quotation) => {
                          const statusConfig = getQuotationStatusConfig(quotation.status)
                          return (
                            <div
                              key={quotation.id}
                              className="grid grid-cols-6 gap-4 p-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/business/quotations/${quotation.id}`)}
                            >
                              <div className="text-gray-600">{quotation.created ? formatFirebaseDate(quotation.created) : "N/A"}</div>
                              <div className="text-gray-900 font-medium">
                                {quotation.quotation_number || quotation.id?.slice(-8) || "N/A"}
                              </div>
                              <div className="text-gray-600">Quotation</div>
                              <div className="text-gray-900">
                                {quotation.client_name || "Unknown Client"}
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </div>
                              <div className="text-red-600 font-medium">₱{quotation.total_amount?.toLocaleString() || "0"}/month</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "job-order" && (
                <div>
                  {jobOrdersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading job orders...</p>
                    </div>
                  ) : jobOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No job orders found for this site.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                        <div>Date</div>
                        <div>Project ID</div>
                        <div>Type</div>
                        <div>Client</div>
                        <div>Status</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {jobOrders.map((jobOrder) => {
                          const statusConfig = getJobOrderStatusConfig(jobOrder.status)
                          return (
                            <div
                              key={jobOrder.id}
                              className="grid grid-cols-5 gap-4 p-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/business/job-orders/${jobOrder.id}`)}
                            >
                              <div className="text-gray-600">{jobOrder.created ? formatFirebaseDate(jobOrder.created) : "N/A"}</div>
                              <div className="text-gray-900 font-medium">
                                {jobOrder.joNumber || jobOrder.id.slice(-8)}
                              </div>
                              <div className="text-gray-600">Job Order</div>
                              <div className="text-gray-900">
                                {jobOrder.clientName || "Unknown Client"}
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Site Data Grid - Updated to include Display card */}

          {/* Illumination Section - Full Width Landscape */}
          <Card className="rounded-xl shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center" style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '22px',
                lineHeight: '120%',
                letterSpacing: '0%',
                color: '#000000'
              }}>
                <Sun className="h-4 w-4 mr-2" />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pl-4 pb-4 grid grid-cols-2 gap-4">
              <div className="w-[264px] h-[116px] bg-[#B7B7B71A] rounded-[15px]">
                <div className="flex flex-col space-y-4">
                  <div className="pt-4 bg-transparent">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[120px] h-[24px] justify-between border-none bg-transparent text-[16px] font-normal leading-none tracking-normal">
                          <span className="text-left">{illuminationMode}</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setIlluminationMode("Manual")}>Manual</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIlluminationMode("Automatic")}>Automatic</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-center mt-4 pt-1">
                    <div className="flex items-center space-x-8">
                      <span className={`text-[20px] font-bold leading-none tracking-normal ${illuminationOn ? 'text-gray-600' : 'text-black'}`}>Off</span>
                      <Switch
                        checked={illuminationOn}
                        onCheckedChange={setIlluminationOn}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400"
                        style={{ transform: 'scale(2.0)' }}
                      />
                      <span className={`text-[20px] font-bold leading-none tracking-normal ${illuminationOn ? 'text-black' : 'text-gray-600'}`}>On</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4" style={{ transform: 'translateX(-115px)' }}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-semibold text-[16px] leading-[132%] tracking-normal">Upper:</span> {product.specs_rental?.illumination_upper_lighting_specs || "4 Metal Hallides"}</p>
                  <p><span className="font-semibold text-[16px] leading-[132%] tracking-normal">Bottom:</span> {product.specs_rental?.illumination_bottom_lighting_specs || "4 Metal Hallides"}</p>
                  <p><span className="font-semibold text-[16px] leading-[132%] tracking-normal">Side (Left):</span> {product.specs_rental?.illumination_left_lighting_specs || "5 Metal Hallides"}</p>
                  <p><span className="font-semibold text-[16px] leading-[132%] tracking-normal">Side (Right):</span> {product.specs_rental?.illumination_right_lighting_specs || "5 Metal Hallides"}</p>
                </div>

                <hr className="my-3 border-gray-200 w-[500px]" />

                <p className="text-gray-500 font-semibold text-[16px] leading-none tracking-normal whitespace-nowrap">
                  Average Monthly Electrical Consumption: <span className="font-normal text-gray-700 text-[16px] leading-none tracking-normal">{product.specs_rental?.power_consumption_monthly || "557"} kWh / month</span>
                </p>

              <div className="col-span-2 flex justify-end mt-4" style={{ transform: 'translateX(85px)' }}>
                <button className="w-[203px] h-[47px] bg-white border rounded-[5px] shadow-sm font-medium text-[20px] leading-none tracking-normal text-center hover:bg-gray-50">
                  Index Card
                </button>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Data Grid - Display, Compliance, Structure */}
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
                    {product.structure?.color ? (
                      <div
                        style={{
                          display: 'inline-block',
                          width: '24px',
                          height: '24px',
                          backgroundColor: product.structure.color,
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle'
                        }}
                        title={product.structure.color}
                      />
                    ) : (
                      <span style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '132%',
                        letterSpacing: '0%',
                        color: '#333333'
                      }}>
                        Not Available
                      </span>
                    )}
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


            {/* Personnel Card Section*/}
            <Card>
              <CardHeader>
                <CardTitle>Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 font-semibold mb-2 text-sm">
                  <span>Name</span>
                  <span>Position</span>
                  <span>Contact #</span>
                </div>

                {/* Personnel Data */}
                <div className="space-y-2 mb-4">
                  {(() => {
                    if (!Array.isArray(product?.personnel) || product.personnel.length === 0) {
                      return (
                        <div className="text-sm text-gray-500 py-4 text-center">
                          No personnel have been added yet
                        </div>
                      )
                    }

                    return product.personnel
                      .sort((a: any, b: any) => {
                        const timeA = a.created instanceof Date ? a.created.getTime() : (a.created?.seconds * 1000) || 0
                        const timeB = b.created instanceof Date ? b.created.getTime() : (b.created?.seconds * 1000) || 0
                        return timeB - timeA // Newest first
                      })
                      .slice(0, 3) // Show only first 3 personnel
                      .map((person: any, index: number) => (
                        <div key={index} className="grid grid-cols-3 text-sm py-2 border-b border-gray-100 last:border-b-0 items-center">
                          <span className="truncate font-medium">{person.name}</span>
                          <span className="truncate">{person.position}</span>
                          <span className="truncate">+63{person.contact}</span>
                        </div>
                      ))
                  })()}
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPersonnelDialogOpen(true)}
                    className="bg-transparent"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setViewAllPersonnelDialogOpen(true)}
                  >
                    View All
                  </Button>
                </div>
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
                    <PDFDocument
                      file={blueprintPreviewUrl}
                      onLoadSuccess={onPdfLoadSuccess}
                      onLoadError={onPdfLoadError}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      }
                    >
                      <PDFPage
                        pageNumber={pdfPageNumber}
                        width={200}
                      />
                    </PDFDocument>
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
                            <PDFDocument
                              file={blueprint.blueprint}
                              loading={
                                <div className="flex items-center justify-center h-full">
                                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                </div>
                              }
                            >
                              <PDFPage
                                pageNumber={1}
                                width={80}
                                height={80}
                              />
                            </PDFDocument>
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
              accept="image/*"
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
                    <PDFDocument
                      file={fullscreenBlueprint.blueprint}
                      onLoadSuccess={onFullscreenPdfLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      }
                    >
                      <PDFPage
                        pageNumber={fullscreenPdfPageNumber}
                        width={800}
                        className="mx-auto"
                      />
                    </PDFDocument>
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
              <div className="flex gap-2">
                <input
                  type="color"
                  value={structureForm.color || '#ffffff'}
                  onChange={(e) => setStructureForm({ ...structureForm, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={structureForm.color || ''}
                  onChange={(e) => setStructureForm({ ...structureForm, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter color name or hex code"
                />
              </div>
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
              <select
                value={structureForm.condition}
                onChange={(e) => setStructureForm({ ...structureForm, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select condition</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Critical">Critical</option>
              </select>
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

    {/* Add Personnel Dialog */}
    <Dialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Add Personnel</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Status */}
          <div className="grid grid-cols-3 items-center">
            <label className="text-sm font-medium col-span-1">Status:</label>
            <span className="col-span-2 text-gray-600">Active</span>
          </div>

          {/* Name */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Name:</label>
            <input
              type="text"
              value={personnelForm.name}
              onChange={(e) =>
                setPersonnelForm({ ...personnelForm, name: e.target.value })
              }
              className="col-span-2 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Position:</label>
            <input
              type="text"
              value={personnelForm.position}
              onChange={(e) =>
                setPersonnelForm({ ...personnelForm, position: e.target.value })
              }
              className="col-span-2 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Contact:</label>
            <div className="col-span-2 flex">
              <span className="inline-flex items-center px-1 py-1 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md min-w-[35px] justify-center">
                +63
              </span>
              <input
                type="text"
                value={personnelForm.contact}
                onChange={(e) =>
                  setPersonnelForm({ ...personnelForm, contact: e.target.value.replace(/\D/g, '') })
                }
                placeholder="9123456789"
                maxLength={10}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Start Date:</label>
            <div className="col-span-2 relative date-picker-container">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {format(personnelForm.start_date, "PPP")}
              </button>
              {showDatePicker && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm font-medium">Select Start Date</span>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <DayPicker
                    mode="single"
                    selected={personnelForm.start_date}
                    onSelect={(date) => {
                      if (date) {
                        setPersonnelForm({ ...personnelForm, start_date: date })
                        setShowDatePicker(false)
                      }
                    }}
                    className="p-3"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {personnelFormError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {personnelFormError}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setPersonnelDialogOpen(false)
              setPersonnelForm({ name: "", position: "", contact: "", start_date: new Date() })
              setPersonnelFormError("")
            }}
            className="flex-1"
            disabled={isSubmittingPersonnel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPersonnel}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
            disabled={
              !personnelForm.name.trim() ||
              !personnelForm.position.trim() ||
              !personnelForm.contact.trim() ||
              isSubmittingPersonnel
            }
          >
            {isSubmittingPersonnel ? "Adding..." : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Personnel Dialog */}
    <Dialog open={editPersonnelDialogOpen} onOpenChange={setEditPersonnelDialogOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Personnel</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Status */}
          <div className="grid grid-cols-3 items-center">
            <label className="text-sm font-medium col-span-1">Status:</label>
            <div className="col-span-2">
              <Switch
                checked={editPersonnelForm.status}
                onCheckedChange={(checked) => setEditPersonnelForm({ ...editPersonnelForm, status: checked })}
              />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Name:</label>
            <input
              type="text"
              value={editPersonnelForm.name}
              onChange={(e) => setEditPersonnelForm({ ...editPersonnelForm, name: e.target.value })}
              className="col-span-2 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Position:</label>
            <input
              type="text"
              value={editPersonnelForm.position}
              onChange={(e) => setEditPersonnelForm({ ...editPersonnelForm, position: e.target.value })}
              className="col-span-2 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Contact:</label>
            <div className="col-span-2 flex">
              <span className="inline-flex items-center px-1 py-1 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md min-w-[35px] justify-center">
                +63
              </span>
              <input
                type="text"
                value={editPersonnelForm.contact}
                onChange={(e) =>
                  setEditPersonnelForm({ ...editPersonnelForm, contact: e.target.value.replace(/\D/g, '') })
                }
                placeholder="9123456789"
                maxLength={10}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">Start Date:</label>
            <div className="col-span-2 relative edit-start-date-picker-container">
              <button
                type="button"
                onClick={() => setShowEditStartDatePicker(!showEditStartDatePicker)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {format(editPersonnelForm.start_date, "PPP")}
              </button>
              {showEditStartDatePicker && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm font-medium">Select Start Date</span>
                    <button
                      type="button"
                      onClick={() => setShowEditStartDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <DayPicker
                    mode="single"
                    selected={editPersonnelForm.start_date}
                    onSelect={(date) => {
                      if (date) {
                        setEditPersonnelForm({ ...editPersonnelForm, start_date: date })
                        setShowEditStartDatePicker(false)
                      }
                    }}
                    className="p-3"
                  />
                </div>
              )}
            </div>
          </div>

          {/* End Date */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-sm font-medium col-span-1">End Date:</label>
            <div className="col-span-2 relative edit-end-date-picker-container">
              <button
                type="button"
                onClick={() => setShowEditEndDatePicker(!showEditEndDatePicker)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {editPersonnelForm.end_date ? format(editPersonnelForm.end_date, "PPP") : "No end date"}
              </button>
              {showEditEndDatePicker && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm font-medium">Select End Date</span>
                    <button
                      type="button"
                      onClick={() => setShowEditEndDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <DayPicker
                    mode="single"
                    selected={editPersonnelForm.end_date || undefined}
                    onSelect={(date) => {
                      setEditPersonnelForm({ ...editPersonnelForm, end_date: date || null })
                      setShowEditEndDatePicker(false)
                    }}
                    className="p-3"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {editPersonnelFormError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {editPersonnelFormError}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setEditPersonnelDialogOpen(false)
              setEditPersonnelForm({ name: "", position: "", contact: "", start_date: new Date(), end_date: null, status: true })
              setEditPersonnelFormError("")
              setEditingPersonnelIndex(null)
            }}
            className="flex-1"
            disabled={isUpdatingPersonnel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePersonnel}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
            disabled={
              !editPersonnelForm.name.trim() ||
              !editPersonnelForm.position.trim() ||
              !editPersonnelForm.contact.trim() ||
              isUpdatingPersonnel
            }
          >
            {isUpdatingPersonnel ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* View All Personnel Dialog */}
    <Dialog open={viewAllPersonnelDialogOpen} onOpenChange={setViewAllPersonnelDialogOpen}>
      <DialogContent className="max-w-5xl mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Personnel</DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh] mt-2">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-1/6">Status</TableHead>
                <TableHead className="w-1/4">Name</TableHead>
                <TableHead className="w-1/4">Position</TableHead>
                <TableHead className="w-1/4">Contact #</TableHead>
                <TableHead className="w-1/6">Start Date</TableHead>
                <TableHead className="w-1/6">End Date</TableHead>
                <TableHead className="w-1/6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(product?.personnel) && product.personnel.length > 0 ? (
                product.personnel.map((person: any, index: number) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    {/* Status */}
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          person.status ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {person.status ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    {/* Name */}
                    <TableCell className="font-medium">{person.name}</TableCell>

                    {/* Position */}
                    <TableCell>{person.position}</TableCell>

                    {/* Contact */}
                    <TableCell>+63{person.contact}</TableCell>

                    {/* Start Date */}
                    <TableCell className="text-sm text-gray-600">
                      {formatFirebaseDate(person.start_date)}
                    </TableCell>

                    {/* End Date */}
                    <TableCell className="text-sm text-gray-600">
                      {person.end_date ? formatFirebaseDate(person.end_date) : "-"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPersonnel(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No personnel have been added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={() => setViewAllPersonnelDialogOpen(false)}
            className="bg-indigo-500 hover:bg-indigo-600 px-10"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Site Calendar Modal */}
    <Dialog open={siteCalendarModalOpen} onOpenChange={setSiteCalendarModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Site Calendar - {product?.name || "Site"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {calendarLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading calendar...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 rounded"></div>
                  <span>Booked Dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <span>Available Dates</span>
                </div>
              </div>

              {/* Calendar */}
              <div className="flex justify-center">
                <DayPicker
                  mode="default"
                  className="rounded-md border p-3"
                  modifiers={{
                    booked: (date) => {
                      return calendarBookings.some((booking) => {
                        if (!booking.start_date || !booking.end_date) return false
                        const startDate = booking.start_date.toDate()
                        const endDate = booking.end_date.toDate()
                        return date >= startDate && date <= endDate
                      })
                    }
                  }}
                  modifiersStyles={{
                    booked: {
                      backgroundColor: '#fecaca', // red-200
                      color: '#dc2626', // red-600
                      fontWeight: 'bold'
                    }
                  }}
                  aria-label="Site booking calendar"
                />
              </div>

              {/* Bookings List */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Current Bookings</h3>
                {calendarBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bookings found for this site.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {calendarBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{booking.project_name || booking.product_name || "Unnamed Project"}</div>
                          <div className="text-sm text-gray-600">
                            {booking.start_date ? formatFirebaseDate(booking.start_date) : "N/A"} - {booking.end_date ? formatFirebaseDate(booking.end_date) : "N/A"}
                          </div>
                          <div className="text-sm text-gray-600">{booking.client?.name || "Unknown Client"}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            booking.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            booking.status === "RESERVED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {booking.status || "Unknown"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] py-0 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b px-6 mb-0 min-h-[4rem] flex items-start pt-6">
            <DialogTitle className="text-2xl font-semibold text-[#333333]">Edit Site</DialogTitle>
          </DialogHeader>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fill in the required fields:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul role="list" className="list-disc pl-5 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Site Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Type:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={siteType === "static" ? "default" : "outline"}
                    onClick={() => setSiteType("static")}
                    className={`flex-1 ${
                      siteType === "static"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Static
                  </Button>
                  <Button
                    variant={siteType === "digital" ? "default" : "outline"}
                    onClick={() => setSiteType("digital")}
                    className={`flex-1 ${
                      siteType === "digital"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Digital
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Category:</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-[#c4c4c4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(siteType === "static" ? ["Billboard", "Wallboard", "Transit Ads", "Column", "Bridgeway billboard", "Banner", "Lampost", "Lightbox", "Building Wrap", "Gantry", "Toll Plaza"] : ["Digital Billboard", "LED Poster", "Digital Transit Ads"]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site Name */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Site Name: <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Site Name"
                  className="border-[#c4c4c4]"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Location: <span className="text-red-500">*</span>
                </Label>
                <GooglePlacesAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="Enter street address or search location..."
                  enableMap={true}
                  mapHeight="250px"
                />
              </div>

              {/* Location Label */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location Label:</Label>
                <Input
                  className="border-[#c4c4c4]"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                />
              </div>

              {/* Dimension */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Dimension:</Label>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Height:</Label>
                    <Input
                      type="number"
                      className="border-[#c4c4c4]"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <span className="text-[#4e4e4e]">x</span>
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Width:</Label>
                    <Input
                      type="number"
                      className="border-[#c4c4c4]"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  <Select value={dimensionUnit} onValueChange={(value: "ft" | "m") => setDimensionUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Elevation from ground */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Elevation from ground: <span className="text-[#c4c4c4]">(Optional)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                  <Select value={elevationUnit} onValueChange={(value: "ft" | "m") => setElevationUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Description:</Label>
                <Textarea
                  className="min-h-[120px] border-[#c4c4c4] resize-none"
                  placeholder=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Audience Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Audience Type: <span className="text-[#c4c4c4]">(can choose multiple)</span>
                </Label>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "E"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => toggleAudience(type)}
                      className={`w-12 h-10 ${
                        selectedAudience.includes(type)
                          ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                          : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Traffic */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Traffic:</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={dailyTraffic}
                    onChange={(e) => setDailyTraffic(e.target.value)}
                  />
                  <Select value={trafficUnit} onValueChange={(value: "daily" | "weekly" | "monthly") => setTrafficUnit(value)}>
                    <SelectTrigger className="w-24 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">daily</SelectItem>
                      <SelectItem value="weekly">weekly</SelectItem>
                      <SelectItem value="monthly">monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Media */}
              {product?.media && product.media.length > 0 && (
                <div>
                  <Label className="text-[#4e4e4e] font-medium mb-3 block">Current Media:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {product.media
                      .filter(mediaItem => !imagesToRemove.includes(mediaItem.url))
                      .map((mediaItem, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                          {mediaItem.isVideo ? (
                            <video
                              src={mediaItem.url || "/placeholder.svg"}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              style={{
                                pointerEvents: 'auto',
                                WebkitAppearance: 'none',
                                appearance: 'none'
                              }}
                              onClick={isThumbnailVideo ? undefined : (e) => {
                                const video = e.target as HTMLVideoElement;
                                if (video.paused) {
                                  video.play();
                                } else {
                                  video.pause();
                                }
                              }}
                            />
                          ) : (
                            <img
                              src={mediaItem.url || "/placeholder.svg"}
                              alt={`Current media ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/abstract-geometric-sculpture.png"
                              }}
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveExistingImage(mediaItem.url)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                  </div>
                  {imagesToRemove.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-[#4e4e4e] font-medium mb-2 block text-sm">Images marked for removal:</Label>
                      <div className="flex flex-wrap gap-2">
                        {imagesToRemove.map((url, index) => {
                          const mediaItem = product.media?.find(m => m.url === url)
                          return (
                            <div key={index} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                              <span className="text-sm text-red-700">Image {index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-red-600 hover:text-red-800"
                                onClick={() => handleRestoreExistingImage(url)}
                              >
                                ↺
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Upload */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Add New Media: <span className="text-[#c4c4c4]">(can upload multiple)</span>
                </Label>

                {/* Media Preview/Carousel */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      {/* Main Media Display */}
                      <div className="aspect-video relative">
                        {uploadedFiles[currentImageIndex].type.startsWith('video/') ? (
                          <video
                            src={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                            className="w-full h-full object-cover"
                            controls={false}
                            preload="metadata"
                            style={{
                              pointerEvents: 'auto'
                            }}
                            onClick={(e) => {
                              const video = e.target as HTMLVideoElement;
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                            alt={`Preview ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Remove Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                        >
                          ×
                        </Button>
                      </div>

                      {/* Navigation Arrows (only show if multiple files) */}
                      {uploadedFiles.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handlePrevImage}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handleNextImage}
                          >
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Button>
                        </>
                      )}

                      {/* Media Counter */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {uploadedFiles.length}
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {uploadedFiles.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {uploadedFiles.map((file, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            {file.type.startsWith('video/') ? (
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-full object-cover pointer-events-none"
                                preload="metadata"
                                controls={false}
                              />
                            ) : (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#c4c4c4] rounded-lg p-8 text-center bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-[#c4c4c4] mx-auto mb-2" />
                    <p className="text-[#c4c4c4] font-medium">Upload</p>
                  </label>
                  {uploadedFiles.length === 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Click to select images and videos
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Price: <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className="flex-1 border-[#c4c4c4]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Select value={priceUnit} disabled>
                    <SelectTrigger className="w-28 border-[#c4c4c4] bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per spot">per spot</SelectItem>
                      <SelectItem value="per day">per day</SelectItem>
                      <SelectItem value="per month">per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-[#c4c4c4] mt-8 pt-6 pb-6 -mb-6">
            <div className="flex justify-end gap-4 px-6">
              <Button
                variant="outline"
                className="px-8 border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50 bg-transparent"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="px-8 bg-[#1d0beb] hover:bg-[#1508d1] text-white"
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Site"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(dateValue?: string | any): string {
  if (!dateValue) return "Unknown"

  try {
    let date: Date

    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === "object" && "toDate" in dateValue) {
      date = dateValue.toDate()
    }
    // Handle ISO string dates
    else if (typeof dateValue === "string") {
      date = new Date(dateValue)
    }
    // Handle any other date-like input
    else {
      date = new Date(dateValue)
    }

    return date.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateValue)
  }
}
