"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  CalendarIcon,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  ImageIcon,
  XCircle,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getQuotationDetailsForJobOrder, createMultipleJobOrders, type QuotationItem } from "@/lib/job-order-service"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import type { JobOrderType, JobOrderStatus } from "@/lib/types/job-order"
import type { Quotation } from "@/lib/types/quotation"
import type { Product } from "@/lib/firebase-service"
import type { Client } from "@/lib/client-service"
import { cn } from "@/lib/utils"
import { JobOrderCreatedSuccessDialog } from "@/components/job-order-created-success-dialog"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"

const joTypes = ["Installation", "Maintenance", "Repair", "Dismantling", "Other"]

interface JobOrderFormData {
  joType: JobOrderType | ""
  dateRequested: Date | undefined
  deadline: Date | undefined
  remarks: string
  assignTo: string
  attachmentFile: File | null
  attachmentUrl: string | null
  uploadingAttachment: boolean
  attachmentError: string | null
  joTypeError: boolean
  dateRequestedError: boolean
}

export default function CreateJobOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quotationId = searchParams.get("quotationId")
  const { user, userData } = useAuth()
  const { toast } = useToast()

  // All state declarations first
  const [loading, setLoading] = useState(true)
  const [quotationData, setQuotationData] = useState<{
    quotation: Quotation
    products: Product[]
    client: Client | null
    items?: QuotationItem[]
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Shared compliance states
  const [signedQuotationFile, setSignedQuotationFile] = useState<File | null>(null)
  const [signedQuotationUrl, setSignedQuotationUrl] = useState<string | null>(null)
  const [uploadingSignedQuotation, setUploadingSignedQuotation] = useState(false)
  const [signedQuotationError, setSignedQuotationError] = useState<string | null>(null)

  const [poMoFile, setPoMoFile] = useState<File | null>(null)
  const [poMoUrl, setPoMoUrl] = useState<string | null>(null)
  const [uploadingPoMo, setUploadingPoMo] = useState(false)
  const [poMoError, setPoMoError] = useState<string | null>(null)

  const [projectFaFile, setProjectFaFile] = useState<File | null>(null)
  const [projectFaUrl, setProjectFaUrl] = useState<string | null>(null)
  const [uploadingProjectFa, setUploadingProjectFa] = useState(false)
  const [projectFaError, setProjectFaError] = useState<string | null>(null)

  // Form data for each product
  const [jobOrderForms, setJobOrderForms] = useState<JobOrderFormData[]>([])

  // Success dialog states
  const [showJobOrderSuccessDialog, setShowJobOrderSuccessDialog] = useState(false)
  const [createdJoIds, setCreatedJoIds] = useState<string[]>([])

  // Coming soon dialog state
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false)

  // Active tab for multi-product forms
  const [activeTab, setActiveTab] = useState("0")

  // Calculate derived values using useMemo - these will always be called
  const quotationItems = useMemo(() => {
    return quotationData?.quotation?.items || []
  }, [quotationData])

  const isMultiProduct = useMemo(() => {
    return quotationItems.length > 1
  }, [quotationItems])

  const hasItems = useMemo(() => {
    return quotationItems.length > 0
  }, [quotationItems])

  const missingCompliance = useMemo(() => {
    return {
      signedQuotation: !signedQuotationUrl,
      poMo: !poMoUrl,
      projectFa: !projectFaUrl,
    }
  }, [signedQuotationUrl, poMoUrl, projectFaUrl])

  // Calculate duration in months
  const totalMonths = useMemo(() => {
    if (!quotationData?.quotation) return 1

    const { quotation } = quotationData
    if (quotation.start_date && quotation.end_date) {
      const start = new Date(quotation.start_date)
      const end = new Date(quotation.end_date)
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    } else if (quotation.duration_days) {
      return Math.round(quotation.duration_days / 30.44)
    }
    return 1
  }, [quotationData])

  // Calculate individual product totals for display
  const productTotals = useMemo(() => {
    if (!quotationData) return []

    const { quotation } = quotationData

    if (hasItems) {
      // Multiple products from quotation.items
      return quotationItems.map((item: any) => {
        const monthlyRate = item.price || 0
        const subtotal = monthlyRate * totalMonths
        const vat = subtotal * 0.12
        const total = subtotal + vat

        return {
          subtotal,
          vat,
          total,
          monthlyRate,
          siteCode: item.site_code || "N/A",
          productName: item.product_name || "N/A",
        }
      })
    } else {
      // Single product from quotation object
      const monthlyRate = quotation.price || 0
      const subtotal = monthlyRate * totalMonths
      const vat = subtotal * 0.12
      const total = subtotal + vat

      return [
        {
          subtotal,
          vat,
          total,
          monthlyRate,
          siteCode: quotation.site_code || "N/A",
          productName: quotation.product_name || "N/A",
        },
      ]
    }
  }, [quotationData, quotationItems, totalMonths, hasItems])

  // Calculate overall totals
  const overallSubtotal = useMemo(() => {
    return productTotals.reduce((sum, product) => sum + product.subtotal, 0)
  }, [productTotals])

  const overallVat = useMemo(() => {
    return productTotals.reduce((sum, product) => sum + product.vat, 0)
  }, [productTotals])

  const overallTotal = useMemo(() => {
    return productTotals.reduce((sum, product) => sum + product.total, 0)
  }, [productTotals])

  // All useCallback hooks
  const formatCurrency = useCallback((amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₱0.00"
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  const formatPeriod = useCallback((startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return "N/A"
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const startMonth = format(start, "MMMM")
      const startDay = format(start, "dd")
      const startYear = format(start, "yyyy")
      const endMonth = format(end, "MMMM")
      const endYear = format(end, "yyyy")

      return `${startMonth} ${startDay}, ${startYear} to ${endMonth} ${endYear}`
    } catch (e) {
      console.error("Error formatting period:", e)
      return "Invalid Dates"
    }
  }, [])

  const handleFileUpload = useCallback(
    async (
      file: File,
      type: "image" | "document",
      setFileState: React.Dispatch<React.SetStateAction<File | null>>,
      setUrlState: React.Dispatch<React.SetStateAction<string | null>>,
      setUploadingState: React.Dispatch<React.SetStateAction<boolean>>,
      setErrorState: React.Dispatch<React.SetStateAction<string | null>>,
      path: string,
    ) => {
      setUploadingState(true)
      setErrorState(null)
      setUrlState(null)

      const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"]
      const allowedDocumentTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (file.size > maxSize) {
        setErrorState("File size exceeds 5MB limit.")
        setUploadingState(false)
        return
      }

      if (type === "image" && !allowedImageTypes.includes(file.type)) {
        setErrorState("Invalid image file type. Only JPG, PNG, GIF are allowed.")
        setUploadingState(false)
        return
      }

      if (type === "document" && !allowedDocumentTypes.includes(file.type)) {
        setErrorState("Invalid document file type. Only PDF, DOC, DOCX, XLS, XLSX are allowed.")
        setUploadingState(false)
        return
      }

      try {
        const downloadURL = await uploadFileToFirebaseStorage(file, path)
        setUrlState(downloadURL)
        setFileState(file)
        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded successfully.`,
        })
      } catch (error: any) {
        console.error("Upload failed:", error)
        setErrorState(`Upload failed: ${error.message || "Unknown error"}`)
        toast({
          title: "Upload Failed",
          description: `Could not upload ${file.name}. ${error.message || "Please try again."}`,
          variant: "destructive",
        })
      } finally {
        setUploadingState(false)
      }
    },
    [toast],
  )

  const handleFormUpdate = useCallback((productIndex: number, field: keyof JobOrderFormData, value: any) => {
    setJobOrderForms((prev) => {
      const updated = [...prev]
      if (updated[productIndex]) {
        updated[productIndex] = { ...updated[productIndex], [field]: value }
      }
      return updated
    })
  }, [])

  const handleProductAttachmentUpload = useCallback(
    async (productIndex: number, file: File) => {
      handleFormUpdate(productIndex, "uploadingAttachment", true)
      handleFormUpdate(productIndex, "attachmentError", null)
      handleFormUpdate(productIndex, "attachmentUrl", null)

      try {
        const downloadURL = await uploadFileToFirebaseStorage(file, `attachments/job-orders/product-${productIndex}/`)
        handleFormUpdate(productIndex, "attachmentUrl", downloadURL)
        handleFormUpdate(productIndex, "attachmentFile", file)
        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded successfully.`,
        })
      } catch (error: any) {
        console.error("Upload failed:", error)
        handleFormUpdate(productIndex, "attachmentError", `Upload failed: ${error.message || "Unknown error"}`)
        toast({
          title: "Upload Failed",
          description: `Could not upload ${file.name}. ${error.message || "Please try again."}`,
          variant: "destructive",
        })
      } finally {
        handleFormUpdate(productIndex, "uploadingAttachment", false)
      }
    },
    [handleFormUpdate, toast],
  )

  const validateForms = useCallback((): boolean => {
    let hasError = false

    jobOrderForms.forEach((form, index) => {
      if (!form.joType) {
        handleFormUpdate(index, "joTypeError", true)
        hasError = true
      } else {
        handleFormUpdate(index, "joTypeError", false)
      }

      if (!form.dateRequested) {
        handleFormUpdate(index, "dateRequestedError", true)
        hasError = true
      } else {
        handleFormUpdate(index, "dateRequestedError", false)
      }

      if (!form.deadline) {
        hasError = true
      }
    })

    return !hasError
  }, [jobOrderForms, handleFormUpdate])

  const handleCreateJobOrders = useCallback(
    async (status: JobOrderStatus) => {
      if (!quotationData || !user?.uid) {
        toast({
          title: "Missing Information",
          description: "Cannot create Job Orders due to missing data or user authentication.",
          variant: "destructive",
        })
        return
      }

      if (!validateForms()) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields for all Job Orders.",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      const { quotation, products, client } = quotationData

      try {
        let jobOrdersData = []

        if (hasItems) {
          // Multiple products from quotation.items
          jobOrdersData = quotationItems.map((item: any, index: number) => {
            const form = jobOrderForms[index]
            const product = products[index] || {}

            const contractDuration = totalMonths > 0 ? `(${totalMonths} months)` : "N/A"

            const monthlyRate = item.price || 0
            const totalLease = monthlyRate * totalMonths
            const productVat = totalLease * 0.12
            const productTotal = totalLease + productVat

            return {
              quotationId: quotation.id,
              joNumber: "JO-AUTO-GEN",
              dateRequested: form.dateRequested!.toISOString(),
              joType: form.joType as JobOrderType,
              deadline: form.deadline!.toISOString(),
              requestedBy: userData?.first_name || "Auto-Generated",
              remarks: form.remarks,
              assignTo: form.assignTo,
              attachments: form.attachmentUrl
                ? [
                    {
                      url: form.attachmentUrl,
                      name: form.attachmentFile?.name || "Attachment",
                      type: form.attachmentFile?.type || "image",
                    },
                  ]
                : [],
              signedQuotationUrl: signedQuotationUrl,
              poMoUrl: poMoUrl,
              projectFaUrl: projectFaUrl,
              quotationNumber: quotation.quotation_number,
              clientName: client?.name || "N/A",
              clientCompany: client?.company || "N/A",
              contractDuration: contractDuration,
              contractPeriodStart: quotation.start_date || "",
              contractPeriodEnd: quotation.end_date || "",
              siteName: item.product_name || product.name || "",
              siteCode: item.site_code || product.site_code || "N/A",
              siteType: item.type || product.type || "N/A",
              siteSize: product.specs_rental?.size || product.light?.size || "N/A",
              siteIllumination: product.light?.illumination || "N/A",
              leaseRatePerMonth: monthlyRate,
              totalMonths: totalMonths,
              totalLease: totalLease,
              vatAmount: productVat,
              totalAmount: productTotal,
              siteImageUrl: product.media?.[0]?.url || "/placeholder.svg?height=48&width=48",
              missingCompliance: missingCompliance,
              product_id: item.product_id || product.id || "",
              company_id: userData?.company_id || "",
            }
          })
        } else {
          // Single product from quotation object
          const form = jobOrderForms[0]
          const product = products[0] || {}

          const contractDuration = totalMonths > 0 ? `(${totalMonths} months)` : "N/A"

          const monthlyRate = quotation.price || 0
          const totalLease = monthlyRate * totalMonths
          const productVat = totalLease * 0.12
          const productTotal = totalLease + productVat

          jobOrdersData = [
            {
              quotationId: quotation.id,
              joNumber: "JO-AUTO-GEN",
              dateRequested: form.dateRequested!.toISOString(),
              joType: form.joType as JobOrderType,
              deadline: form.deadline!.toISOString(),
              requestedBy: userData?.first_name || "Auto-Generated",
              remarks: form.remarks,
              assignTo: form.assignTo,
              attachments: form.attachmentUrl
                ? [
                    {
                      url: form.attachmentUrl,
                      name: form.attachmentFile?.name || "Attachment",
                      type: form.attachmentFile?.type || "image",
                    },
                  ]
                : [],
              signedQuotationUrl: signedQuotationUrl,
              poMoUrl: poMoUrl,
              projectFaUrl: projectFaUrl,
              quotationNumber: quotation.quotation_number,
              clientName: client?.name || "N/A",
              clientCompany: client?.company || "N/A",
              contractDuration: contractDuration,
              contractPeriodStart: quotation.start_date || "",
              contractPeriodEnd: quotation.end_date || "",
              siteName: quotation.product_name || product.name || "",
              siteCode: quotation.site_code || product.site_code || "N/A",
              siteType: product.type || "N/A",
              siteSize: product.specs_rental?.size || product.light?.size || "N/A",
              siteIllumination: product.light?.illumination || "N/A",
              leaseRatePerMonth: monthlyRate,
              totalMonths: totalMonths,
              totalLease: totalLease,
              vatAmount: productVat,
              totalAmount: productTotal,
              siteImageUrl: product.media?.[0]?.url || "/placeholder.svg?height=48&width=48",
              missingCompliance: missingCompliance,
              product_id: quotation.product_id || product.id || "",
              company_id: userData?.company_id || "",
            },
          ]
        }

        const joIds = await createMultipleJobOrders(jobOrdersData, user.uid, status)
        setCreatedJoIds(joIds)
        setShowJobOrderSuccessDialog(true)
      } catch (error: any) {
        console.error("Error creating job orders:", error)
        toast({
          title: "Error",
          description: `Failed to create Job Orders: ${error.message || "Unknown error"}. Please try again.`,
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      quotationData,
      user,
      validateForms,
      hasItems,
      quotationItems,
      jobOrderForms,
      products,
      totalMonths,
      signedQuotationUrl,
      poMoUrl,
      projectFaUrl,
      missingCompliance,
      userData,
      toast,
    ],
  )

  const handleDismissAndNavigate = useCallback(() => {
    setShowJobOrderSuccessDialog(false)
    router.push("/sales/job-orders")
  }, [router])

  // useEffect hooks
  useEffect(() => {
    if (!quotationId) {
      toast({
        title: "Error",
        description: "No quotation ID provided.",
        variant: "destructive",
      })
      router.push("/sales/job-orders/select-quotation")
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      try {
        const data = await getQuotationDetailsForJobOrder(quotationId)
        if (data) {
          setQuotationData(data)
        } else {
          toast({
            title: "Error",
            description: "Quotation or Product details not found. Please ensure they exist.",
            variant: "destructive",
          })
          router.push("/sales/job-orders/select-quotation")
        }
      } catch (error) {
        console.error("Failed to fetch quotation details:", error)
        toast({
          title: "Error",
          description: "Failed to load quotation details. Please try again.",
          variant: "destructive",
        })
        router.push("/sales/job-orders/select-quotation")
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [quotationId, router, toast])

  // Initialize forms when quotation data changes
  useEffect(() => {
    if (quotationData && userData?.uid) {
      const productCount = hasItems ? quotationItems.length : 1
      const initialForms: JobOrderFormData[] = Array.from({ length: productCount }, () => ({
        joType: "",
        dateRequested: new Date(),
        deadline: undefined,
        remarks: "",
        assignTo: userData.uid,
        attachmentFile: null,
        attachmentUrl: null,
        uploadingAttachment: false,
        attachmentError: null,
        joTypeError: false,
        dateRequestedError: false,
      }))
      setJobOrderForms(initialForms)
    }
  }, [quotationData, userData?.uid, hasItems, quotationItems.length])

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading Job Order details...</span>
      </div>
    )
  }

  if (!quotationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Quotation Details Not Found</h2>
        <p className="text-gray-600 mb-4">The selected quotation or its associated products could not be loaded.</p>
        <Button onClick={() => router.push("/sales/job-orders/select-quotation")}>Go to Select Quotation</Button>
      </div>
    )
  }

  const { quotation, products, client } = quotationData

  return (
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Job Order{isMultiProduct ? "s" : ""}</h1>
        {isMultiProduct && (
          <Badge variant="secondary">
            <Package className="h-3 w-3 mr-1" />
            {quotationItems.length} Products
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {/* Left Column: Booking Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Booking Information</h2>
          <div className="space-y-3 text-gray-800">
            <div className="space-y-0.5">
              <a
                href={`/sales/quotations/${quotation.id}`}
                className="text-blue-600 font-bold text-base hover:underline"
              >
                {quotation.quotation_number}
              </a>
              <p className="text-xs text-gray-600">Project ID: {quotation.id}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm">
                <span className="font-semibold">Client Name:</span> {client?.company || client?.name || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Contract Duration:</span>{" "}
                {totalMonths > 0 ? `(${totalMonths} months)` : "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Contract Period:</span>{" "}
                {formatPeriod(quotation.start_date, quotation.end_date)}
              </p>
            </div>

            {/* Products/Sites List */}
            <div className="space-y-1 mt-3">
              <p className="text-sm font-semibold">{isMultiProduct ? "Sites:" : "Site:"}</p>
              <div className="space-y-2">
                {productTotals.map((productTotal, index) => {
                  const item = hasItems ? quotationItems[index] : quotation
                  const product = products[index] || {}

                  return (
                    <div key={index} className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-md">
                      <Image
                        src={product.media?.[0]?.url || "/placeholder.svg?height=40&width=40&query=billboard"}
                        alt={productTotal.productName || "Site image"}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{productTotal.siteCode}</p>
                        <p className="text-xs text-gray-600">{productTotal.productName}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(productTotal.monthlyRate)}/month</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-0.5 mt-3">
              {isMultiProduct ? (
                // Show individual product totals for multiple products
                <div className="space-y-3">
                  {productTotals.map((productTotal, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">{productTotal.siteCode}</p>
                      <p className="text-xs">
                        <span className="font-semibold">Subtotal:</span> {formatCurrency(productTotal.subtotal)}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">12% VAT:</span> {formatCurrency(productTotal.vat)}
                      </p>
                      <p className="text-sm font-bold">Total: {formatCurrency(productTotal.total)}</p>
                    </div>
                  ))}

                  {/* Overall totals */}
                  <div className="border-t border-gray-300 pt-2 mt-3">
                    <p className="text-sm">
                      <span className="font-semibold">Overall Subtotal:</span> {formatCurrency(overallSubtotal)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Overall 12% VAT:</span> {formatCurrency(overallVat)}
                    </p>
                    <p className="font-bold text-lg mt-1">GRAND TOTAL: {formatCurrency(overallTotal)}</p>
                  </div>
                </div>
              ) : (
                // Show single product totals
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Subtotal:</span> {formatCurrency(overallSubtotal)}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">12% VAT:</span> {formatCurrency(overallVat)}
                  </p>
                  <p className="font-bold text-lg mt-1">TOTAL: {formatCurrency(overallTotal)}</p>
                </div>
              )}
            </div>

            {/* Shared Compliance Documents */}
            <div className="space-y-1.5 pt-4 border-t border-gray-200 mt-6">
              <p className="text-sm font-semibold mb-2">Project Compliance (Shared for all Job Orders):</p>

              {/* Signed Quotation Upload */}
              <div className="flex items-center gap-2">
                <Label htmlFor="signed-quotation-upload" className="text-sm w-36">
                  <span className="font-semibold">Signed Quotation:</span>
                </Label>
                <input
                  type="file"
                  id="signed-quotation-upload"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      handleFileUpload(
                        event.target.files[0],
                        "document",
                        setSignedQuotationFile,
                        setSignedQuotationUrl,
                        setUploadingSignedQuotation,
                        setSignedQuotationError,
                        "documents/signed-quotations/",
                      )
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-transparent"
                  onClick={() => document.getElementById("signed-quotation-upload")?.click()}
                  disabled={uploadingSignedQuotation}
                >
                  {uploadingSignedQuotation ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="mr-1 h-3 w-3" />
                  )}
                  {uploadingSignedQuotation ? "Uploading..." : "Upload Document"}
                </Button>
                {signedQuotationFile && !uploadingSignedQuotation && (
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">{signedQuotationFile.name}</span>
                )}
                {signedQuotationError && <span className="text-xs text-red-500 ml-2">{signedQuotationError}</span>}
              </div>

              {/* PO/MO Upload */}
              <div className="flex items-center gap-2">
                <Label htmlFor="po-mo-upload" className="text-sm w-36">
                  <span className="font-semibold">PO/MO:</span>
                </Label>
                <input
                  type="file"
                  id="po-mo-upload"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      handleFileUpload(
                        event.target.files[0],
                        "document",
                        setPoMoFile,
                        setPoMoUrl,
                        setUploadingPoMo,
                        setPoMoError,
                        "documents/po-mo/",
                      )
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-transparent"
                  onClick={() => document.getElementById("po-mo-upload")?.click()}
                  disabled={uploadingPoMo}
                >
                  {uploadingPoMo ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="mr-1 h-3 w-3" />
                  )}
                  {uploadingPoMo ? "Uploading..." : "Upload Document"}
                </Button>
                {poMoFile && !uploadingPoMo && (
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">{poMoFile.name}</span>
                )}
                {poMoError && <span className="text-xs text-red-500 ml-2">{poMoError}</span>}
              </div>

              {/* Project FA Upload */}
              <div className="flex items-center gap-2">
                <Label htmlFor="project-fa-upload" className="text-sm w-36">
                  <span className="font-semibold">Project FA:</span>
                </Label>
                <input
                  type="file"
                  id="project-fa-upload"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      handleFileUpload(
                        event.target.files[0],
                        "document",
                        setProjectFaFile,
                        setProjectFaUrl,
                        setUploadingProjectFa,
                        setProjectFaError,
                        "documents/project-fa/",
                      )
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-transparent"
                  onClick={() => document.getElementById("project-fa-upload")?.click()}
                  disabled={uploadingProjectFa}
                >
                  {uploadingProjectFa ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="mr-1 h-3 w-3" />
                  )}
                  {uploadingProjectFa ? "Uploading..." : "Upload Document"}
                </Button>
                {projectFaFile && !uploadingProjectFa && (
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">{projectFaFile.name}</span>
                )}
                {projectFaError && <span className="text-xs text-red-500 ml-2">{projectFaError}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Job Order Forms */}
        <div className="space-y-6">
          {missingCompliance.signedQuotation || missingCompliance.poMo || missingCompliance.projectFa ? (
            <Alert variant="destructive" className="bg-red-100 border-red-400 text-red-700 py-2 px-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700 text-sm">
                This client has some missing project compliance requirements.
              </AlertTitle>
              <AlertDescription className="text-red-700 text-xs">
                <ul className="list-disc list-inside ml-2">
                  {missingCompliance.signedQuotation && <li>- Signed Quotation</li>}
                  {missingCompliance.poMo && <li>- PO/MO</li>}
                  {missingCompliance.projectFa && <li>- Project FA</li>}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <h2 className="text-lg font-bold text-gray-900">
            Job Order{isMultiProduct ? "s" : ""} ({hasItems ? quotationItems.length : 1})
          </h2>

          {isMultiProduct ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quotationItems.map((item: any, index: number) => (
                  <TabsTrigger key={index} value={index.toString()} className="text-xs">
                    {item.site_code || `Site ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {quotationItems.map((item: any, index: number) => {
                const form = jobOrderForms[index]
                const product = products[index] || {}

                if (!form) return null

                return (
                  <TabsContent key={index} value={index.toString()}>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Image
                            src={product.media?.[0]?.url || "/placeholder.svg?height=24&width=24&query=billboard"}
                            alt={item.product_name || "Site image"}
                            width={24}
                            height={24}
                            className="rounded object-cover"
                          />
                          {item.product_name}
                          <Badge variant="outline" className="text-xs">
                            {item.site_code || `Site ${index + 1}`}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Job Order Form Fields */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">JO #</Label>
                          <Input value="(Auto-Generated)" disabled className="bg-gray-100 text-gray-600 text-sm h-9" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Date Requested</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                                  !form.dateRequested && "text-gray-500",
                                  form.dateRequestedError && "border-red-500 focus-visible:ring-red-500",
                                )}
                                onClick={() => handleFormUpdate(index, "dateRequestedError", false)}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                {form.dateRequested ? format(form.dateRequested, "PPP") : <span>Date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={form.dateRequested}
                                onSelect={(date) => {
                                  handleFormUpdate(index, "dateRequested", date)
                                  handleFormUpdate(index, "dateRequestedError", false)
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">JO Type</Label>
                          <Select
                            onValueChange={(value: JobOrderType) => {
                              handleFormUpdate(index, "joType", value)
                              handleFormUpdate(index, "joTypeError", false)
                            }}
                            value={form.joType}
                          >
                            <SelectTrigger
                              className={cn(
                                "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                                form.joTypeError && "border-red-500 focus-visible:ring-red-500",
                              )}
                            >
                              <SelectValue placeholder="Choose JO Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {joTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-sm">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Deadline</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={form.deadline ? format(form.deadline, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined
                                handleFormUpdate(index, "deadline", date)
                              }}
                              className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9"
                              required
                            />
                            <Button
                              variant="outline"
                              className="h-9 px-3 text-sm text-gray-800 border-gray-300 hover:bg-gray-50 bg-transparent"
                              onClick={() => setShowComingSoonDialog(true)}
                            >
                              Timeline
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Requested By</Label>
                          <Input
                            value={userData?.first_name || "(Auto-Generated)"}
                            disabled
                            className="bg-gray-100 text-gray-600 text-sm h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Remarks</Label>
                          <Textarea
                            placeholder="Remarks..."
                            value={form.remarks}
                            onChange={(e) => handleFormUpdate(index, "remarks", e.target.value)}
                            className="bg-white text-gray-800 border-gray-300 placeholder:text-gray-500 text-sm h-24"
                          />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Attachments</Label>
                          <input
                            type="file"
                            id={`attachment-upload-${index}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                handleProductAttachmentUpload(index, event.target.files[0])
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            className="w-24 h-24 flex flex-col items-center justify-center text-gray-500 border-dashed border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                            onClick={() => document.getElementById(`attachment-upload-${index}`)?.click()}
                            disabled={form.uploadingAttachment}
                          >
                            {form.uploadingAttachment ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Plus className="h-6 w-6" />
                            )}
                            <span className="text-xs mt-1">{form.uploadingAttachment ? "Uploading..." : "Upload"}</span>
                          </Button>
                          {form.attachmentFile && !form.uploadingAttachment && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ImageIcon className="h-4 w-4" />
                              <span>{form.attachmentFile.name}</span>
                            </div>
                          )}
                          {form.attachmentError && <p className="text-xs text-red-500 mt-1">{form.attachmentError}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-800">Assign to</Label>
                          <Select
                            onValueChange={(value) => handleFormUpdate(index, "assignTo", value)}
                            value={form.assignTo}
                          >
                            <SelectTrigger className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9">
                              <SelectValue placeholder="Choose Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={userData?.first_name || ""} className="text-sm">
                                {userData?.first_name}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              })}
            </Tabs>
          ) : (
            // Single product form
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {/* Same form fields as in the tabs, but without the card header */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">JO #</Label>
                    <Input value="(Auto-Generated)" disabled className="bg-gray-100 text-gray-600 text-sm h-9" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Date Requested</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                            !jobOrderForms[0]?.dateRequested && "text-gray-500",
                            jobOrderForms[0]?.dateRequestedError && "border-red-500 focus-visible:ring-red-500",
                          )}
                          onClick={() => handleFormUpdate(0, "dateRequestedError", false)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {jobOrderForms[0]?.dateRequested ? (
                            format(jobOrderForms[0].dateRequested, "PPP")
                          ) : (
                            <span>Date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={jobOrderForms[0]?.dateRequested}
                          onSelect={(date) => {
                            handleFormUpdate(0, "dateRequested", date)
                            handleFormUpdate(0, "dateRequestedError", false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">JO Type</Label>
                    <Select
                      onValueChange={(value: JobOrderType) => {
                        handleFormUpdate(0, "joType", value)
                        handleFormUpdate(0, "joTypeError", false)
                      }}
                      value={jobOrderForms[0]?.joType}
                    >
                      <SelectTrigger
                        className={cn(
                          "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                          jobOrderForms[0]?.joTypeError && "border-red-500 focus-visible:ring-red-500",
                        )}
                      >
                        <SelectValue placeholder="Choose JO Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {joTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-sm">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Deadline</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={jobOrderForms[0]?.deadline ? format(jobOrderForms[0].deadline, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleFormUpdate(0, "deadline", date)
                        }}
                        className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9"
                        required
                      />
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-sm text-gray-800 border-gray-300 hover:bg-gray-50 bg-transparent"
                        onClick={() => setShowComingSoonDialog(true)}
                      >
                        Timeline
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Requested By</Label>
                    <Input
                      value={userData?.first_name || "(Auto-Generated)"}
                      disabled
                      className="bg-gray-100 text-gray-600 text-sm h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Remarks</Label>
                    <Textarea
                      placeholder="Remarks..."
                      value={jobOrderForms[0]?.remarks || ""}
                      onChange={(e) => handleFormUpdate(0, "remarks", e.target.value)}
                      className="bg-white text-gray-800 border-gray-300 placeholder:text-gray-500 text-sm h-24"
                    />
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Attachments</Label>
                    <input
                      type="file"
                      id="attachment-upload-0"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files && event.target.files[0]) {
                          handleProductAttachmentUpload(0, event.target.files[0])
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="w-24 h-24 flex flex-col items-center justify-center text-gray-500 border-dashed border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                      onClick={() => document.getElementById("attachment-upload-0")?.click()}
                      disabled={jobOrderForms[0]?.uploadingAttachment}
                    >
                      {jobOrderForms[0]?.uploadingAttachment ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Plus className="h-6 w-6" />
                      )}
                      <span className="text-xs mt-1">
                        {jobOrderForms[0]?.uploadingAttachment ? "Uploading..." : "Upload"}
                      </span>
                    </Button>
                    {jobOrderForms[0]?.attachmentFile && !jobOrderForms[0]?.uploadingAttachment && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ImageIcon className="h-4 w-4" />
                        <span>{jobOrderForms[0].attachmentFile.name}</span>
                      </div>
                    )}
                    {jobOrderForms[0]?.attachmentError && (
                      <p className="text-xs text-red-500 mt-1">{jobOrderForms[0].attachmentError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Assign to</Label>
                    <Select
                      onValueChange={(value) => handleFormUpdate(0, "assignTo", value)}
                      value={jobOrderForms[0]?.assignTo}
                    >
                      <SelectTrigger className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9">
                        <SelectValue placeholder="Choose Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={userData?.uid || ""} className="text-sm">
                          {userData?.first_name}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleCreateJobOrders("draft")}
              disabled={isSubmitting}
              className="flex-1 bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleCreateJobOrders("pending")}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Create Job Order{isMultiProduct ? "s" : ""}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <JobOrderCreatedSuccessDialog
        isOpen={showJobOrderSuccessDialog}
        onClose={handleDismissAndNavigate}
        joIds={createdJoIds}
        isMultiple={isMultiProduct}
      />

      {/* Coming Soon Dialog */}
      <ComingSoonDialog isOpen={showComingSoonDialog} onClose={() => setShowComingSoonDialog(false)} />
    </div>
  )
}
