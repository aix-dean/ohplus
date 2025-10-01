"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  limit,
  startAfter,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle,
  Search,
  X,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Upload,
  FileText,
  Loader2,
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  Check,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { copyQuotation, generateQuotationPDF, getQuotationById } from "@/lib/quotation-service"
import { bookingService } from "@/lib/booking-service"
import { searchQuotations } from "@/lib/algolia-service"

export default function QuotationsListPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [pageLastDocs, setPageLastDocs] = useState<{ [page: number]: any }>({})
  const [hasMorePages, setHasMorePages] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const [expandedCompliance, setExpandedCompliance] = useState<Set<string>>(new Set())
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [copyingQuotations, setCopyingQuotations] = useState<Set<string>>(new Set())
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set())
  const [searchLoading, setSearchLoading] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedQuotationForShare, setSelectedQuotationForShare] = useState<any>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [projectNameDialogOpen, setProjectNameDialogOpen] = useState(false)
  const [selectedQuotationForProject, setSelectedQuotationForProject] = useState<any>(null)
  const [projectName, setProjectName] = useState("")
  const [creatingReservation, setCreatingReservation] = useState(false)

  const handleProjectNameDialogClose = (open: boolean) => {
    if (!open) {
      // Dialog is being closed without submitting
      setProjectNameDialogOpen(false)
      setSelectedQuotationForProject(null)
      setProjectName("")
    }
  }
  const pageSize = 10
  const { toast } = useToast()

  // Note: Filtering is now handled server-side or removed for server-side pagination
  // We'll focus on pagination controls for now

  const fetchQuotations = async (page: number = 1, reset: boolean = false) => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // If there's a search term, use Algolia search
      if (searchTerm.trim()) {
        const searchResults = await searchQuotations(searchTerm.trim(), userData?.company_id || undefined, page - 1, pageSize)

        if (searchResults.error) {
          console.error("Search error:", searchResults.error)
          // Fallback to Firebase if search fails
          await fetchFromFirebase(page, reset)
          return
        }

        // Transform Algolia results to match the expected format
        let transformedQuotations = searchResults.hits.map((hit: any) => ({
          id: hit.objectID,
          quotation_number: hit.quotation_number,
          client_name: hit.client_name,
          items: hit.items,
          seller_id: hit.seller_id,
          status: hit.status,
          created: hit.created,
          // Add other fields as needed
        }))

        // Apply status filter if not "all"
        if (statusFilter !== "all") {
          transformedQuotations = transformedQuotations.filter(q => q.status === statusFilter)
        }

        setAllQuotations(transformedQuotations)
        setQuotations(transformedQuotations)
        setHasMorePages(searchResults.page < searchResults.nbPages - 1)
        setTotalCount(searchResults.nbHits)
      } else {
        // No search term, fetch from Firebase
        await fetchFromFirebase(page, reset)
      }
    } catch (error) {
      console.error("Error fetching quotations:", error)
      // Fallback to Firebase on error
      await fetchFromFirebase(page, reset)
    } finally {
      setLoading(false)
    }
  }

  const fetchFromFirebase = async (page: number = 1, reset: boolean = false) => {
    if (!user?.uid) return

    try {
      const quotationsRef = collection(db, "quotations")
      let q = query(
        quotationsRef,
        where("company_id", "==", userData?.company_id),
        orderBy("created", "desc"),
        limit(pageSize + 1) // Fetch one extra to check if there are more pages
      )

      // If not the first page, start after the last document of the previous page
      if (page > 1 && !reset) {
        const prevPageLastDoc = pageLastDocs[page - 1]
        if (prevPageLastDoc) {
          q = query(q, startAfter(prevPageLastDoc))
        }
      }

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedQuotations.push({
          id: doc.id,
          ...data,
          // Ensure projectCompliance is included
          projectCompliance: data.projectCompliance || {}
        })
      })

      // Check if there are more pages
      const hasMore = fetchedQuotations.length > pageSize
      const currentPageData = hasMore ? fetchedQuotations.slice(0, pageSize) : fetchedQuotations

      // Store the last document for this page
      const pageLastDoc = hasMore ? querySnapshot.docs[pageSize - 1] : querySnapshot.docs[querySnapshot.docs.length - 1]

      if (pageLastDoc) {
        setPageLastDocs(prev => ({
          ...prev,
          [page]: pageLastDoc
        }))
      }

      // Apply status filter if not "all"
      let filteredData = currentPageData
      if (statusFilter !== "all") {
        filteredData = currentPageData.filter(q => q.status === statusFilter)
      }

      setAllQuotations(filteredData)
      setLastDoc(pageLastDoc)
      setHasMorePages(hasMore)
      setQuotations(filteredData)
      setTotalCount(fetchedQuotations.length) // Approximate count
    } catch (error) {
      console.error("Error fetching from Firebase:", error)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchQuotations(1, true)
    }
  }, [user?.uid])

  useEffect(() => {
    const resetPagination = async () => {
      setCurrentPage(1)
      setLastDoc(null)
      setPageLastDocs({})
      setHasMorePages(true)
      await fetchQuotations(1, true)
    }

    if (user?.uid) {
      resetPagination()
    }
  }, [searchTerm, statusFilter, user?.uid])

  const handlePageChange = async (page: number) => {
    setCurrentPage(page)
    await fetchQuotations(page, false)
  }

  const clearFilters = async () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
    setLastDoc(null)
    setPageLastDocs({})
    setHasMorePages(true)
    await fetchQuotations(1, true)
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "booked":
        return "bg-red-100 text-red-800 border-red-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reserved":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "viewed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleQuoteSigned = async (quotation: any) => {
    if (!quotation.id || !user?.uid) return

    setSigningQuotes((prev) => new Set(prev).add(quotation.id))

    try {
      // First, get the full quotation details including items
      const quotationRef = doc(db, "quotations", quotation.id)
      const quotationDoc = await getDoc(quotationRef)

      if (!quotationDoc.exists()) {
        throw new Error("Quotation not found")
      }

      const fullQuotationData = quotationDoc.data()
      const items = fullQuotationData.items || []

      if (items.length === 0) {
        throw new Error("No items found in quotation")
      }

      const startDate = fullQuotationData.start_date ? new Date(fullQuotationData.start_date) : new Date()
      const durationDays = fullQuotationData.duration_days || 30

      const collectionPeriods = []
      let remainingDays = durationDays
      const currentDate = new Date(startDate)

      while (remainingDays > 0) {
        const periodDays = Math.min(30, remainingDays)
        currentDate.setDate(currentDate.getDate() + (collectionPeriods.length === 0 ? 30 : periodDays))
        collectionPeriods.push({
          collectionDate: new Date(currentDate),
          periodDays: periodDays,
          periodNumber: collectionPeriods.length + 1,
        })
        remainingDays -= periodDays
      }

      // Generate collectibles for each item and each collection period
      const collectiblesPromises = []

      for (const item of items) {
        const productId = item.product_id || item.id || `product-${Date.now()}`
        const totalItemAmount = item.item_total_amount || item.price * durationDays || 0
        const itemName = item.name || `Product ${items.indexOf(item) + 1}`

        // Create collectibles for each collection period
        for (const period of collectionPeriods) {
          const periodAmount = (totalItemAmount / durationDays) * period.periodDays

          const collectibleData = {
            // Basic information from quotation
            client_name: quotation.client_name || fullQuotationData.client_name || "",
            company_id: (user as any)?.company_id || user?.uid,
            type: "sites", // Default to sites type based on the business model

            // Financial data - proportional amount for this period
            net_amount: periodAmount,
            total_amount: periodAmount,

            // Document references with period number
            invoice_no: `INV-${quotation.quotation_number}-${productId.toString().slice(-4)}-P${period.periodNumber}`,
            or_no: `OR-${Date.now()}-${productId.toString().slice(-4)}-P${period.periodNumber}`,
            bi_no: `BI-${Date.now()}-${productId.toString().slice(-4)}-P${period.periodNumber}`,

            // Payment information
            mode_of_payment: "Credit/Debit Card", // Default payment method
            bank_name: "", // To be filled later

            // Status and dates
            status: "pending",
            collection_date: Timestamp.fromDate(period.collectionDate), // Use calculated collection date
            covered_period: `${fullQuotationData.start_date?.split("T")[0] || new Date().toISOString().split("T")[0]} - ${fullQuotationData.end_date?.split("T")[0] || new Date().toISOString().split("T")[0]}`,

            // Sites-specific fields
            site: item.location || item.site_code || "",
            booking_no: `BK-${quotation.quotation_number}-${productId.toString().slice(-4)}-P${period.periodNumber}`,

            // Additional fields from collectibles model
            vendor_name: quotation.client_name || fullQuotationData.client_name || "",
            business_address: quotation.client_address || fullQuotationData.client_address || "",
            tin_no: "", // To be filled later

            // System fields
            deleted: false,
            created: serverTimestamp(),
            updated: serverTimestamp(),

            // Reference to original quotation
            quotation_id: quotation.id,
            quotation_number: quotation.quotation_number,
            product_name: itemName,
            product_id: productId,

            period_number: period.periodNumber,
            period_days: period.periodDays,
            total_periods: collectionPeriods.length,
            duration_days: durationDays,
          }

          collectiblesPromises.push(addDoc(collection(db, "collectibles"), collectibleData))
        }
      }

      // Execute all collectibles creation
      const results = await Promise.all(collectiblesPromises)

      toast({
        title: "Success",
        description: `Quote signed successfully! Generated ${results.length} collectible document${results.length > 1 ? "s" : ""} across ${collectionPeriods.length} collection period${collectionPeriods.length > 1 ? "s" : ""}.`,
      })

      // Optionally update quotation status to 'accepted'
      // await updateDoc(quotationRef, { status: 'accepted', updated: serverTimestamp() })
    } catch (error) {
      console.error("Error generating collectibles:", error)
      toast({
        title: "Error",
        description: "Failed to generate collectibles documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSigningQuotes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quotation.id)
        return newSet
      })
    }
  }

  const handleFileUpload = async (quotationId: string, complianceType: string, file: File) => {
    const uploadKey = `${quotationId}-${complianceType}`
    setUploadingFiles((prev) => new Set(prev).add(uploadKey))
    console.log("[DEBUG] handleFileUpload called for quotationId:", quotationId, "complianceType:", complianceType)

    try {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed")
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      // Special handling for signed contract - don't upload yet, show dialog first
      if (complianceType === "signedContract") {
        // For signed contract, store the file locally and show dialog
        // Don't upload to Firebase Storage yet
        const quotationRef = doc(db, "quotations", quotationId)
        const currentQuotationDoc = await getDoc(quotationRef)
        if (!currentQuotationDoc.exists()) {
          throw new Error("Quotation not found")
        }
        const currentQuotationData = { id: quotationId, ...currentQuotationDoc.data() }

        console.log("[DEBUG] Preparing signed contract upload for quotation:", quotationId)
        console.log("[DEBUG] User UID:", user?.uid, "User Company ID:", userData?.company_id)

        // Show project name dialog with the file stored temporarily
        setSelectedQuotationForProject({
          ...currentQuotationData,
          tempFile: file, // Store the file locally
          tempComplianceType: complianceType
        })
        setProjectName("")
        setProjectNameDialogOpen(true)
        return // Exit early, don't continue with normal upload flow
      }

      // Normal upload flow for other compliance types
      // Create storage reference
      const fileName = `${Date.now()}-${file.name}`
      const storageRef = ref(storage, `quotations/${quotationId}/compliance/${complianceType}/${fileName}`)

      // Upload file
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update quotation document with compliance data
      const quotationRef = doc(db, "quotations", quotationId)
      const updateData: { [key: string]: any } = {
        [`projectCompliance.${complianceType}`]: {
          status: "completed",
          fileUrl: downloadURL,
          fileName: file.name,
          uploadedAt: serverTimestamp(),
          uploadedBy: user?.uid,
        },
        updated: serverTimestamp(),
      }

      await updateDoc(quotationRef, updateData)

      // Update booking documents that have this quotation_id
      try {
        const bookingsRef = collection(db, "booking")
        const bookingsQuery = query(
          bookingsRef,
          where("quotation_id", "==", quotationId),
          where("company_id", "==", userData?.company_id)
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)

        if (!bookingsSnapshot.empty) {
          const bookingUpdatePromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
            const bookingRef = doc(db, "booking", bookingDoc.id)
            return updateDoc(bookingRef, updateData)
          })

          await Promise.all(bookingUpdatePromises)
          console.log(`Updated ${bookingsSnapshot.docs.length} booking document(s) with compliance data`)
        }
      } catch (bookingUpdateError) {
        console.error("Error updating booking documents:", bookingUpdateError)
        // Don't fail the entire operation if booking update fails
      }

      // Refresh quotations list
      await fetchQuotations(1, true)

      toast({
        title: "Success",
        description: `${complianceType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} uploaded successfully`,
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(uploadKey)
        return newSet
      })
    }
  }

  const getProjectCompliance = (quotation: any) => {
    const compliance = quotation.projectCompliance || {}

    const toReserveItems = [
      {
        key: "signedContract",
        name: "Signed Contract",
        status: compliance.signedContract?.fileUrl ? "completed" : "upload",
        file: compliance.signedContract?.fileName,
        fileUrl: compliance.signedContract?.fileUrl,
      },
      {
        key: "irrevocablePo",
        name: "Irrevocable PO",
        status: compliance.irrevocablePo?.fileUrl ? "completed" : "upload",
        file: compliance.irrevocablePo?.fileName,
        fileUrl: compliance.irrevocablePo?.fileUrl,
      },
      {
        key: "paymentAsDeposit",
        name: "Payment as Deposit",
        status: compliance.paymentAsDeposit?.fileUrl ? "completed" : "confirmation",
        note: "For Treasury's confirmation",
        file: compliance.paymentAsDeposit?.fileName,
        fileUrl: compliance.paymentAsDeposit?.fileUrl,
      },
    ]

    const otherRequirementsItems = [
      {
        key: "finalArtwork",
        name: "Final Artwork",
        status: compliance.finalArtwork?.fileUrl ? "completed" : "upload",
        file: compliance.finalArtwork?.fileName,
        fileUrl: compliance.finalArtwork?.fileUrl,
      },
      {
        key: "signedQuotation",
        name: "Signed Quotation",
        status: compliance.signedQuotation?.fileUrl ? "completed" : "upload",
        file: compliance.signedQuotation?.fileName,
        fileUrl: compliance.signedQuotation?.fileUrl,
      },
    ]

    const allItems = [...toReserveItems, ...otherRequirementsItems]
    const completed = allItems.filter((item) => item.status === "completed").length
    return {
      completed,
      total: allItems.length,
      toReserve: toReserveItems,
      otherRequirements: otherRequirementsItems,
    }
  }

  const toggleComplianceExpansion = (quotationId: string) => {
    setExpandedCompliance((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(quotationId)) {
        newSet.delete(quotationId)
      } else {
        newSet.add(quotationId)
      }
      return newSet
    })
  }

  const triggerFileUpload = (quotationId: string, complianceType: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(quotationId, complianceType, file)
      }
    }
    input.click()
  }

  const handleCopyQuotation = async (quotationId: string) => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "User information not available. Please try again.",
        variant: "destructive",
      })
      return
    }

    const userName = user.displayName || user.email || `User-${user.uid.slice(-6)}`

    setCopyingQuotations((prev) => new Set(prev).add(quotationId))

    try {
      console.log("[v0] Starting quotation copy for:", quotationId)
      const newQuotationId = await copyQuotation(quotationId, user.uid, userName)
      console.log("[v0] Quotation copied successfully, new ID:", newQuotationId)

      toast({
        title: "Success",
        description: "Quotation copied successfully! The new quotation has been created with a new quotation number.",
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Refreshing quotations list...")
      // Refresh the quotations list to show the new copied quotation
      await fetchQuotations(1, true)
      console.log("[v0] Quotations list refreshed, total quotations:", allQuotations.length)
    } catch (error: any) {
      console.error("Error copying quotation:", error)
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCopyingQuotations((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quotationId)
        return newSet
      })
    }
  }

  const handlePrintQuotation = async (quotationId: string) => {
    setGeneratingPDFs((prev) => new Set(prev).add(quotationId))

    try {
      // Get the full quotation data
      const quotation = await getQuotationById(quotationId)
      if (!quotation) {
        throw new Error("Quotation not found")
      }

      // Generate and download the PDF
      await generateQuotationPDF(quotation)

      toast({
        title: "Success",
        description: "Quotation PDF generated and downloaded successfully",
      })
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Print Failed",
        description: error.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingPDFs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quotationId)
        return newSet
      })
    }
  }

  const handleShareQuotation = async (quotationId: string) => {
    try {
      const quotation = await getQuotationById(quotationId)
      if (!quotation) {
        throw new Error("Quotation not found")
      }
      setSelectedQuotationForShare(quotation)
      setShareDialogOpen(true)
    } catch (error: any) {
      console.error("Error loading quotation for sharing:", error)
      toast({
        title: "Error",
        description: "Failed to load quotation details for sharing",
        variant: "destructive",
      })
    }
  }

  const generateShareableLink = (quotation: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    return `${baseUrl}/sales/quotations/${quotation.id}`
  }

  const generateShareText = (quotation: any) => {
    return `Check out this quotation: ${quotation.quotation_number || "Quotation"} for ${quotation.client_name || "Client"} - ${quotation.items?.name || "Service"}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
      toast({
        title: "Copied!",
        description: "Link copied to clipboard successfully",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const shareViaEmail = (quotation: any) => {
    const subject = encodeURIComponent(`Quotation: ${quotation.quotation_number || "New Quotation"}`)
    const body = encodeURIComponent(
      `${generateShareText(quotation)}\n\nView details: ${generateShareableLink(quotation)}`,
    )
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
    window.open(mailtoUrl, "_blank")

    toast({
      title: "Email Client Opened",
      description: "Your email client has been opened with the quotation details",
    })
  }

  const shareViaSMS = (quotation: any) => {
    const text = encodeURIComponent(`${generateShareText(quotation)} ${generateShareableLink(quotation)}`)
    const smsUrl = `sms:?body=${text}`
    window.open(smsUrl, "_blank")

    toast({
      title: "SMS App Opened",
      description: "Your SMS app has been opened with the quotation details",
    })
  }

  const shareViaWhatsApp = (quotation: any) => {
    const text = encodeURIComponent(`${generateShareText(quotation)} ${generateShareableLink(quotation)}`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, "_blank")

    toast({
      title: "WhatsApp Opened",
      description: "WhatsApp has been opened with the quotation details",
    })
  }

  const shareViaFacebook = (quotation: any) => {
    const url = encodeURIComponent(generateShareableLink(quotation))
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    window.open(facebookUrl, "_blank", "width=600,height=400")

    toast({
      title: "Facebook Opened",
      description: "Facebook sharing dialog has been opened",
    })
  }

  const shareViaTwitter = (quotation: any) => {
    const text = encodeURIComponent(generateShareText(quotation))
    const url = encodeURIComponent(generateShareableLink(quotation))
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    window.open(twitterUrl, "_blank", "width=600,height=400")

    toast({
      title: "Twitter Opened",
      description: "Twitter sharing dialog has been opened",
    })
  }

  const shareViaLinkedIn = (quotation: any) => {
    const url = encodeURIComponent(generateShareableLink(quotation))
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    window.open(linkedinUrl, "_blank", "width=600,height=400")

    toast({
      title: "LinkedIn Opened",
      description: "LinkedIn sharing dialog has been opened",
    })
  }

  const shareViaNativeAPI = async (quotation: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quotation: ${quotation.quotation_number || "New Quotation"}`,
          text: generateShareText(quotation),
          url: generateShareableLink(quotation),
        })

        toast({
          title: "Shared Successfully",
          description: "Quotation has been shared successfully",
        })
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error)
          toast({
            title: "Share Failed",
            description: "Failed to share quotation. Please try another method.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const validateComplianceForJO = (quotation: any) => {
    const compliance = quotation.projectCompliance || {}

    // Check if either signed contract OR signed quotation is uploaded
    const hasSignedContract = compliance.signedContract?.fileUrl
    const hasSignedQuotation = compliance.signedQuotation?.fileUrl

    if (hasSignedContract || hasSignedQuotation) {
      return {
        isValid: true,
        missingItems: [],
      }
    }

    return {
      isValid: false,
      missingItems: ["Signed Contract or Signed Quotation"],
    }
  }

  const handleCreateJO = (quotationId: string) => {
    console.log("[v0] Create JO clicked for quotationId:", quotationId)
    console.log(
      "[v0] Available quotations:",
      quotations.map((q) => ({ id: q.id, number: q.quotation_number })),
    )

    const quotation = quotations.find((q) => q.id === quotationId)
    console.log(
      "[v0] Found quotation:",
      quotation ? { id: quotation.id, number: quotation.quotation_number } : "NOT FOUND",
    )

    if (!quotation) {
      toast({
        title: "Error",
        description: "Quotation not found. Please try again.",
        variant: "destructive",
      })
      return
    }

    const validation = validateComplianceForJO(quotation)

    if (!validation.isValid) {
      toast({
        title: "Compliance Requirements Not Met",
        description: `Please complete the following items before creating a Job Order: ${validation.missingItems.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    // Navigate to JO creation with the quotation ID
    router.push(`/sales/job-orders/create?quotationId=${quotationId}`)
  }

  const handleProjectNameSubmit = async () => {
    if (!selectedQuotationForProject || !user?.uid || !userData?.company_id || !projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required.",
        variant: "destructive",
      })
      return
    }

    setCreatingReservation(true)
    try {
      const quotationRef = doc(db, "quotations", selectedQuotationForProject.id)
      let downloadURL = ""

      // Upload the file to Firebase Storage
      if (selectedQuotationForProject.tempFile && selectedQuotationForProject.tempComplianceType) {
        const file = selectedQuotationForProject.tempFile
        const complianceType = selectedQuotationForProject.tempComplianceType

        // Create storage reference
        const fileName = `${Date.now()}-${file.name}`
        const storageRef = ref(storage, `quotations/${selectedQuotationForProject.id}/compliance/${complianceType}/${fileName}`)

        // Upload file
        const snapshot = await uploadBytes(storageRef, file)
        downloadURL = await getDownloadURL(snapshot.ref)
      }

      // Update quotation with compliance data including the file URL
      const updateData: { [key: string]: any } = {
        [`projectCompliance.${selectedQuotationForProject.tempComplianceType}`]: {
          status: "completed",
          fileUrl: downloadURL,
          fileName: selectedQuotationForProject.tempFile?.name || "",
          uploadedAt: serverTimestamp(),
          uploadedBy: user?.uid,
        },
        status: "reserved", // Update the main status of the quotation
        updated: serverTimestamp(),
      }

      await updateDoc(quotationRef, updateData)

      // Then, fetch the updated quotation data
      const updatedQuotationDoc = await getDoc(quotationRef)
      if (!updatedQuotationDoc.exists()) {
        throw new Error("Updated quotation not found after compliance upload.")
      }
      const fullQuotationData = { id: selectedQuotationForProject.id, ...updatedQuotationDoc.data() } as any

      // Pass quotation dates directly to booking - the booking service will handle them properly
      const bookingData = {
        ...fullQuotationData,
        start_date: fullQuotationData.start_date,
        end_date: fullQuotationData.end_date,
      }

      const bookingId = await bookingService.createBooking(bookingData, user.uid, userData.company_id, projectName.trim())
      console.log("[DEBUG] Booking created with ID:", bookingId)
      toast({
        title: "Reservation Created",
        description: `A new reservation document has been created with ID: ${bookingId}.`,
      })

      // Close dialog and refresh
      setProjectNameDialogOpen(false)
      setSelectedQuotationForProject(null)
      setProjectName("")

      // Refresh quotations list
      await fetchQuotations(1, true)
    } catch (bookingError) {
      console.error("[DEBUG] Error creating booking:", bookingError)
      toast({
        title: "Booking Creation Failed",
        description: "Failed to create booking document. Please check console for details.",
        variant: "destructive",
      })
    } finally {
      setCreatingReservation(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quotations</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 opacity-30" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-96 border-gray-300 rounded-full"
                />
              </div>
            </div>
            <Button
              onClick={() => router.push("/sales/quotations/compose/new")}
              className="bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-lg px-6 py-2"
            >
              Create Quotation
            </Button>
          </div>
        </div>

        {(loading || searchLoading) ? (
          <Card className="bg-white overflow-hidden rounded-t-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 border-0">Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Quotation Number</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Site</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Project Compliance</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-200">
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : quotations.length > 0 ? (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 border-0">Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Quotation Number</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Site</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Project Compliance</TableHead>
                  <TableHead className="font-semibold text-gray-900 border-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation: any) => {
                  const compliance = getProjectCompliance(quotation)
                  const isExpanded = expandedCompliance.has(quotation.id)

                  return (
                    <TableRow key={quotation.id} className="cursor-pointer border-b border-gray-200">
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const date = quotation.created instanceof Date ? quotation.created : (quotation.created && typeof quotation.created.toDate === 'function' ? quotation.created.toDate() : null);
                            if (!date || isNaN(date.getTime())) {
                              return "N/A";
                            }
                            return format(date, "MMM d, yyyy");
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900">{quotation.quotation_number || quotation.id || "—"}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900">{quotation.client_name || "—"}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600">{quotation.items?.name || quotation.product_name || "—"}</div>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-700">
                        <div className="space-y-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => toggleComplianceExpansion(quotation.id)}
                          >
                            <span className="font-medium">
                              {compliance.completed}/{compliance.total}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <div className="transition-transform duration-200 ease-in-out">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="space-y-1 pt-1">
                                <p className="text-xs font-semibold text-gray-800 mt-2 mb-1">To Reserve</p>
                                {compliance.toReserve.map((item: any, index: number) => {
                                  const uploadKey = `${quotation.id}-${item.key}`
                                  const isUploading = uploadingFiles.has(uploadKey)

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between text-xs animate-in fade-in-0 slide-in-from-top-1"
                                      style={{
                                        animationDelay: isExpanded ? `${index * 50}ms` : "0ms",
                                        animationDuration: "200ms",
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {item.status === "completed" ? (
                                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="text-gray-700">{item.name}</span>
                                          {item.note && <span className="text-xs text-gray-500 italic">{item.note}</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {item.file && item.fileUrl ? (
                                          <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {item.file}
                                          </a>
                                        ) : item.status === "upload" ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs bg-transparent"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              triggerFileUpload(quotation.id, item.key)
                                            }}
                                            disabled={isUploading}
                                          >
                                            {isUploading ? (
                                              <>
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                              </>
                                            )}
                                          </Button>
                                        ) : item.status === "confirmation" ? (
                                          <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                            Pending
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}

                                <p className="text-xs font-semibold text-gray-800 mt-4 mb-1">Other Requirements</p>
                                {compliance.otherRequirements.map((item: any, index: number) => {
                                  const uploadKey = `${quotation.id}-${item.key}`
                                  const isUploading = uploadingFiles.has(uploadKey)

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between text-xs animate-in fade-in-0 slide-in-from-top-1"
                                      style={{
                                        animationDelay: isExpanded ? `${index * 50}ms` : "0ms",
                                        animationDuration: "200ms",
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {item.status === "completed" ? (
                                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                                        )}
                                        <span className="text-gray-700">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {item.file && item.fileUrl ? (
                                          <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {item.file}
                                          </a>
                                        ) : item.status === "upload" ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs bg-transparent"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              triggerFileUpload(quotation.id, item.key)
                                            }}
                                            disabled={isUploading}
                                          >
                                            {isUploading ? (
                                              <>
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                              </>
                                            )}
                                          </Button>
                                        ) : item.status === "confirmation" ? (
                                          <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                            Pending
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}

                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleCreateJO(quotation.id)}>
                              Create JO
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePrintQuotation(quotation.id)}
                              disabled={generatingPDFs.has(quotation.id)}
                            >
                              {generatingPDFs.has(quotation.id) ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                  Generating PDF...
                                </>
                              ) : (
                                "Print"
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareQuotation(quotation.id)}>
                              <Share2 className="w-3 h-3 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyQuotation(quotation.id)}
                              disabled={copyingQuotations.has(quotation.id)}
                            >
                              {copyingQuotations.has(quotation.id) ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                  Copying...
                                </>
                              ) : (
                                "Make a Copy"
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="bg-white rounded-xl">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No quotations yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first quotation to get started
              </p>
              <Button
                onClick={() => router.push("/sales/quotations/compose/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Quotation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {!loading && quotations.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="text-sm text-gray-600">
              Page {currentPage}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMorePages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Quotation
            </DialogTitle>
            <DialogDescription>Share this quotation with others using various platforms and methods.</DialogDescription>
          </DialogHeader>

          {selectedQuotationForShare && (
            <div className="space-y-4">
              {/* Quotation Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {selectedQuotationForShare.quotation_number || "New Quotation"}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedQuotationForShare.client_name} • {selectedQuotationForShare.items?.name || "Service"}
                </div>
              </div>

              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Share Link</label>
                <div className="flex gap-2">
                  <Input value={generateShareableLink(selectedQuotationForShare)} readOnly className="flex-1 text-sm" />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generateShareableLink(selectedQuotationForShare))}
                    className="flex-shrink-0"
                  >
                    {copiedToClipboard ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Native Share (if supported) */}
              {typeof navigator.share === "function" && (
                <Button
                  onClick={() => shareViaNativeAPI(selectedQuotationForShare)}
                  className="w-full"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via Device
                </Button>
              )}

              {/* Share Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Share via</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaEmail(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaSMS(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaWhatsApp(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaFacebook(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaTwitter(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareViaLinkedIn(selectedQuotationForShare)}
                    className="justify-start"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={projectNameDialogOpen} onOpenChange={handleProjectNameDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Project Name</DialogTitle>
            <DialogDescription>
              Please enter a name for this project. This will be saved with the reservation.
            </DialogDescription>
          </DialogHeader>

          {selectedQuotationForProject && (
            <div className="space-y-4">
              {/* Quotation Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {selectedQuotationForProject.quotation_number || "New Quotation"}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedQuotationForProject.client_name} • {selectedQuotationForProject.items?.name || "Service"}
                </div>
              </div>

              {/* Project Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Project Name *</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setProjectNameDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProjectNameSubmit} disabled={!projectName.trim() || creatingReservation}>
                  {creatingReservation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Reservation...
                    </>
                  ) : (
                    "Create Reservation"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
