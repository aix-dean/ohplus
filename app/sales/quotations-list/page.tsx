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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { copyQuotation, generateQuotationPDF, getQuotationById } from "@/lib/quotation-service"

export default function QuotationsListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const [expandedCompliance, setExpandedCompliance] = useState<Set<string>>(new Set())
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [copyingQuotations, setCopyingQuotations] = useState<Set<string>>(new Set())
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set())
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedQuotationForShare, setSelectedQuotationForShare] = useState<any>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const pageSize = 10
  const { toast } = useToast()

  const filteredQuotations = useMemo(() => {
    let filtered = allQuotations

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (quotation) =>
          quotation.client_name?.toLowerCase().includes(searchLower) ||
          quotation.client_phone?.toLowerCase().includes(searchLower) ||
          quotation.quotation_number?.toLowerCase().includes(searchLower) ||
          quotation.client_address?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quotation) => quotation.status?.toLowerCase() === statusFilter)
    }

    return filtered
  }, [allQuotations, searchTerm, statusFilter])

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredQuotations.slice(startIndex, endIndex)
  }, [filteredQuotations, currentPage, pageSize])

  const totalPages = Math.ceil(filteredQuotations.length / pageSize)

  const fetchAllQuotations = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      const q = query(quotationsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"))

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      setAllQuotations(fetchedQuotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchAllQuotations()
    }
  }, [user?.uid])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
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
            company_id: user.company_id || user.uid,
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

    try {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed")
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      // Create storage reference
      const fileName = `${Date.now()}-${file.name}`
      const storageRef = ref(storage, `quotations/${quotationId}/compliance/${complianceType}/${fileName}`)

      // Upload file
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update quotation document with compliance data
      const quotationRef = doc(db, "quotations", quotationId)
      const updateData = {
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

      // Refresh quotations list
      await fetchAllQuotations()

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

    const items = [
      {
        key: "signedQuotation",
        name: "Signed Quotation",
        status: compliance.signedQuotation?.status || "upload",
        file: compliance.signedQuotation?.fileName,
        fileUrl: compliance.signedQuotation?.fileUrl,
      },
      {
        key: "signedContract",
        name: "Signed Contract",
        status: compliance.signedContract?.status || "upload",
        file: compliance.signedContract?.fileName,
        fileUrl: compliance.signedContract?.fileUrl,
      },
      {
        key: "poMo",
        name: "PO/MO",
        status: compliance.poMo?.status || "upload",
        file: compliance.poMo?.fileName,
        fileUrl: compliance.poMo?.fileUrl,
      },
      {
        key: "finalArtwork",
        name: "Final Artwork",
        status: compliance.finalArtwork?.status || "upload",
        file: compliance.finalArtwork?.fileName,
        fileUrl: compliance.finalArtwork?.fileUrl,
      },
      {
        key: "paymentAsDeposit",
        name: "Payment as Deposit",
        status: compliance.paymentAsDeposit?.status || "confirmation",
        note: "For Treasury's confirmation",
        file: compliance.paymentAsDeposit?.fileName,
        fileUrl: compliance.paymentAsDeposit?.fileUrl,
      },
    ]

    const completed = items.filter((item) => item.status === "completed").length
    return { completed, total: items.length, items }
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
      await fetchAllQuotations()
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
    return `Check out this quotation: ${quotation.quotation_number || "Quotation"} for ${quotation.client_name || "Client"} - ${quotation.items?.[0]?.name || "Service"}`
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

    // Required compliance items (excluding Payment as Deposit)
    const requiredItems = [
      { key: "signedQuotation", name: "Signed Quotation" },
      { key: "signedContract", name: "Signed Contract" },
      { key: "poMo", name: "PO/MO" },
      { key: "finalArtwork", name: "Final Artwork" },
    ]

    const missingItems = requiredItems.filter((item) => compliance[item.key]?.status !== "completed")

    return {
      isValid: missingItems.length === 0,
      missingItems: missingItems.map((item) => item.name),
    }
  }

  const handleCreateJO = (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {user?.uid ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Quotation</h1>
              <p className="text-sm text-gray-600">See the status of the quotations you've generated</p>
            </div>

            <Card className="border-gray-200 shadow-sm rounded-xl">
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by client, phone, or quotation number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 w-full sm:w-80"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchTerm || statusFilter !== "all") && (
                      <Button variant="outline" onClick={clearFilters} size="sm">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {!loading && (
                  <div className="text-sm text-gray-600 mt-2">
                    Showing {paginatedQuotations.length} of {filteredQuotations.length} quotations
                    {filteredQuotations.length !== allQuotations.length &&
                      ` (filtered from ${allQuotations.length} total)`}
                  </div>
                )}
              </CardHeader>

              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 w-8"></TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">NO.</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Project Compliance</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Remarks</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(pageSize)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i} className="border-b border-gray-100">
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : paginatedQuotations.length > 0 ? (
                <>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200">
                          <TableHead className="font-semibold text-gray-900 py-3 w-8"></TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">NO.</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Project Compliance</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Remarks</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuotations.map((quotation) => {
                          const compliance = getProjectCompliance(quotation)
                          const isExpanded = expandedCompliance.has(quotation.id)

                          return (
                            <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <TableCell className="py-3"></TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer font-medium"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.quotation_number || "N/A"}
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-blue-600 cursor-pointer hover:underline"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.items?.[0]?.name || quotation.product_name || "N/A"}
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.client_name || "N/A"}
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
                                      {compliance.items.map((item, index) => {
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
                                      {compliance.items.find((item) => item.note) && (
                                        <div className="text-xs text-gray-500 mt-1 animate-in fade-in-0 slide-in-from-top-1">
                                          {compliance.items.find((item) => item.note)?.note}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                className="py-3 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                <Badge
                                  variant="outline"
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(
                                    quotation.status,
                                  )}`}
                                >
                                  {quotation.status || "Draft"}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.status === "sent"
                                  ? `Follow up on ${format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "MMM d, yyyy")}.`
                                  : "-NA"}
                              </TableCell>
                              <TableCell className="py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                                      <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
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
                                    <DropdownMenuItem onClick={() => console.log("Cancel", quotation.id)}>
                                      Cancel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => console.log("Set alarm for", quotation.id)}>
                                      Set an Alarm
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
                  </CardContent>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 italic">
                      A quotation is marked as "Booked" if signed quotation is uploaded. It will then be marked as
                      "Reserved" after uploading the "Signed Contract."
                    </p>
                  </div>
                </>
              ) : (
                <CardContent className="p-6 text-center text-gray-600">
                  {searchTerm || statusFilter !== "all" ? (
                    <div>
                      <p className="mb-2">No quotations found matching your filters.</p>
                      <Button variant="outline" onClick={clearFilters} size="sm">
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <p>No quotations found for your account.</p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your quotations.</p>
            </CardContent>
          </Card>
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
                  {selectedQuotationForShare.client_name} • {selectedQuotationForShare.items?.[0]?.name || "Service"}
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
              {navigator.share && (
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
    </div>
  )
}
