"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, CalendarIcon, Loader2, AlertCircle, XCircle, Package, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  const [isCreating, setIsCreating] = useState(false)

  // Shared compliance states
  const projectCompliance = quotationData?.quotation?.projectCompliance || {}

  const missingCompliance = useMemo(() => {
    return {
      signedQuotation: !projectCompliance.signedQuotation?.completed,
      poMo: !projectCompliance.poMo?.completed,
      projectFa: !projectCompliance.finalArtwork?.completed,
      signedContract: !projectCompliance.signedContract?.completed,
      paymentAsDeposit: !projectCompliance.paymentAsDeposit?.completed,
    }
  }, [projectCompliance])

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

  // Calculate duration in months
  const totalDays = useMemo(() => {
    if (!quotationData?.quotation) return 0 // Default to 0 days if no quotation data
    const quotation = quotationData.quotation
    return quotation.duration_days || 0 // Use duration_days directly
  }, [quotationData])

  // Calculate individual product totals for display
  const productTotals = useMemo(() => {
    if (!quotationData) return []

    const quotation = quotationData.quotation

    if (hasItems) {
      // Multiple products from quotation.items
      return quotationItems.map((item: any) => {
        const subtotal = item.item_total_amount || 0 // Use item_total_amount for subtotal
        const vat = subtotal * 0.12 // Recalculate VAT based on new subtotal
        const total = subtotal + vat // Recalculate total

        return {
          subtotal,
          vat,
          total,
          monthlyRate: item.price || 0, // Keep monthlyRate for display if needed
          siteCode: item.site_code || "N/A",
          productName: item.product_name || "N/A",
        }
      })
    } else {
      // Single product from quotation object
      const subtotal = quotation.item_total_amount || 0 // Use item_total_amount for subtotal
      const vat = subtotal * 0.12 // Recalculate VAT based on new subtotal
      const total = subtotal + vat // Recalculate total

      return [
        {
          subtotal,
          vat,
          total,
          monthlyRate: quotation.price || 0, // Keep monthlyRate for display if needed
          siteCode: quotation.site_code || "N/A",
          productName: quotation.product_name || "N/A",
        },
      ]
    }
  }, [quotationData, quotationItems, hasItems])

  // Calculate overall totals
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

  const handleCreateJobOrder = useCallback(
    async (status: JobOrderStatus) => {
      setIsCreating(true)
      if (!quotationData || !user?.uid) {
        toast({
          title: "Missing Information",
          description: "Cannot create Job Orders due to missing data or user authentication.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      if (!validateForms()) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields for all Job Orders.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      setIsSubmitting(true)

      const quotation = quotationData.quotation
      const products = quotationData.products
      const client = quotationData.client

      try {
        let jobOrdersData = []

        if (hasItems) {
          jobOrdersData = quotationItems.map((item: any, index: number) => {
            const form = jobOrderForms[index]
            const product = products[index] || {}

            const contractDuration = totalDays > 0 ? `(${totalDays} days)` : "N/A" // Use totalDays

            const subtotal = item.item_total_amount || 0 // Use item_total_amount
            const productVat = subtotal * 0.12 // Recalculate VAT
            const productTotal = subtotal + productVat // Recalculate total

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
              signedQuotationUrl: quotation?.projectCompliance?.signedQuotation?.fileUrl,
              poMoUrl: quotation?.projectCompliance?.poMo?.fileUrl,
              projectFaUrl: quotation?.projectCompliance?.finalArtwork?.fileUrl,
              quotationNumber: quotation.quotation_number,
              clientName: client?.name || "N/A",
              clientCompany: client?.company || "N/A",
              contractDuration: contractDuration, // Use new contractDuration
              contractPeriodStart: quotation.start_date || "",
              contractPeriodEnd: quotation.end_date || "",
              siteName: item.product_name || product.name || "",
              siteCode: item.site_code || product.site_code || "N/A",
              siteType: item.type || product.type || "N/A",
              siteSize: product.specs_rental?.size || product.light?.size || "N/A",
              siteIllumination: product.light?.illumination || "N/A",
              leaseRatePerMonth: item.price || 0, // Keep monthlyRate for display if needed
              totalMonths: totalDays, // This might still be relevant for other calculations, but not for totalLease directly
              totalLease: subtotal, // totalLease is now the subtotal
              vatAmount: productVat, // Use recalculated VAT
              totalAmount: productTotal, // Use recalculated total
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

          const contractDuration = totalDays > 0 ? `(${totalDays} days)` : "N/A" // Use totalDays

          const subtotal = quotation.item_total_amount || 0 // Use item_total_amount
          const productVat = subtotal * 0.12 // Recalculate VAT
          const productTotal = subtotal + productVat // Recalculate total

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
              signedQuotationUrl: quotation?.projectCompliance?.signedQuotation?.fileUrl,
              poMoUrl: quotation?.projectCompliance?.poMo?.fileUrl,
              projectFaUrl: quotation?.projectCompliance?.finalArtwork?.fileUrl,
              quotationNumber: quotation.quotation_number,
              clientName: client?.name || "N/A",
              clientCompany: client?.company || "N/A",
              contractDuration: contractDuration, // Use new contractDuration
              contractPeriodStart: quotation.start_date || "",
              contractPeriodEnd: quotation.end_date || "",
              siteName: quotation.product_name || product.name || "",
              siteCode: quotation.site_code || product.site_code || "N/A",
              siteType: product.type || "N/A",
              siteSize: product.specs_rental?.size || product.light?.size || "N/A",
              siteIllumination: product.light?.illumination || "N/A",
              leaseRatePerMonth: quotation.price || 0, // Keep monthlyRate for display if needed
              totalMonths: totalDays, // This might still be relevant for other calculations, but not for totalLease directly
              totalLease: subtotal, // totalLease is now the subtotal
              vatAmount: productVat, // Use recalculated VAT
              totalAmount: productTotal, // Use recalculated total
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
        setIsCreating(false)
      }
    },
    [
      quotationData,
      user,
      validateForms,
      hasItems,
      quotationItems,
      jobOrderForms,
      totalDays,
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

  // Safe access to data after null check
  const quotation = quotationData.quotation
  const products = quotationData.products
  const client = quotationData.client

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
                <span className="font-semibold">Client Name:</span> {quotation.client_name || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Contract Duration:</span> {totalDays > 0 ? `${totalDays} days` : "N/A"}
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

                  {/* Overall totals - ONLY GRAND TOTAL REMAINS */}
                  <div className="border-t border-gray-300 pt-2 mt-3">
                    <p className="font-bold text-lg mt-1">GRAND TOTAL: {formatCurrency(overallTotal)}</p>
                  </div>
                </div>
              ) : (
                // Single product totals - no change needed here as overall totals were only for multi-product
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Subtotal:</span> {formatCurrency(productTotals[0].subtotal)}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">12% VAT:</span> {formatCurrency(productTotals[0].vat)}
                  </p>
                  <p className="font-bold text-lg mt-1">TOTAL: {formatCurrency(productTotals[0].total)}</p>
                </div>
              )}
            </div>

            {/* Client Compliance */}
            <div className="space-y-3 pt-4 border-t border-gray-200 mt-6">
              <p className="text-sm font-semibold mb-3">Client Compliance</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">DTI/BIR 2303</span>
                  <span className="text-xs text-blue-600 ml-auto">JMCL MediaShot.pdf</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">GIS</span>
                  <span className="text-xs text-blue-600 ml-auto">JMCL GIS.pdf</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">ID with Signature</span>
                  <span className="text-xs text-blue-600 ml-auto">Jking Castro FBC.pdf</span>
                </div>
              </div>
            </div>

            {/* Project Compliance */}
            <div className="space-y-3 pt-4 border-t border-gray-200 mt-4">
              <p className="text-sm font-semibold mb-3">Project Compliance</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      projectCompliance.signedQuotation?.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {projectCompliance.signedQuotation?.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">Signed Quotation</span>
                  {projectCompliance.signedQuotation?.fileName && (
                    <span className="text-xs text-blue-600 ml-auto">{projectCompliance.signedQuotation.fileName}</span>
                  )}
                  {!projectCompliance.signedQuotation?.completed && (
                    <span className="text-xs text-gray-500 ml-auto">Upload</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      projectCompliance.signedContract?.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {projectCompliance.signedContract?.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">Signed Contract</span>
                  {projectCompliance.signedContract?.fileName && (
                    <span className="text-xs text-blue-600 ml-auto">{projectCompliance.signedContract.fileName}</span>
                  )}
                  {!projectCompliance.signedContract?.completed && (
                    <span className="text-xs text-gray-500 ml-auto">Upload</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      projectCompliance.poMo?.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {projectCompliance.poMo?.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">PO/MO</span>
                  {projectCompliance.poMo?.fileName && (
                    <span className="text-xs text-blue-600 ml-auto">{projectCompliance.poMo.fileName}</span>
                  )}
                  {!projectCompliance.poMo?.completed && <span className="text-xs text-gray-500 ml-auto">Upload</span>}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      projectCompliance.finalArtwork?.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {projectCompliance.finalArtwork?.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">Final Artwork</span>
                  {projectCompliance.finalArtwork?.fileName && (
                    <span className="text-xs text-blue-600 ml-auto">{projectCompliance.finalArtwork.fileName}</span>
                  )}
                  {!projectCompliance.finalArtwork?.completed && (
                    <span className="text-xs text-gray-500 ml-auto">Upload</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      projectCompliance.paymentAsDeposit?.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {projectCompliance.paymentAsDeposit?.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">Payment as Deposit/Advance</span>
                  {projectCompliance.paymentAsDeposit?.fileName && (
                    <span className="text-xs text-blue-600 ml-auto">{projectCompliance.paymentAsDeposit.fileName}</span>
                  )}
                  {!projectCompliance.paymentAsDeposit?.completed && (
                    <span className="text-xs text-gray-500 ml-auto">For Treasury's confirmation</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Job Order Forms */}
        <div className="space-y-6">
          {missingCompliance.signedQuotation ||
          missingCompliance.poMo ||
          missingCompliance.projectFa ||
          missingCompliance.signedContract ||
          missingCompliance.paymentAsDeposit ? (
            <Alert variant="destructive" className="bg-red-100 border-red-400 text-red-700 py-2 px-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700 text-sm">
                This client has some missing project compliance requirements.
              </AlertTitle>
              <AlertDescription className="text-red-700 text-xs">
                <ul className="list-disc list-inside ml-2">
                  {missingCompliance.signedQuotation && <li>-Signed Quotation</li>}
                  {missingCompliance.poMo && <li>-PO/MO</li>}
                  {missingCompliance.projectFa && <li>-Project FA</li>}
                  {missingCompliance.signedContract && <li>-Signed Contract</li>}
                  {missingCompliance.paymentAsDeposit && <li>-Payment as Deposit</li>}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Order</h2>

            <div className="space-y-4">
              {/* JO # */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">JO #:</Label>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">(Auto-Generated)</span>
                </div>
              </div>

              {/* Campaign Name */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">Campaign Name:</Label>
                <div className="col-span-2">
                  <Input
                    placeholder="Fantastic 4"
                    className="w-full"
                    value={jobOrderForms[0]?.remarks || ""}
                    onChange={(e) => handleFormUpdate(0, "remarks", e.target.value)}
                  />
                </div>
              </div>

              {/* Date Requested */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">Date Requested:</Label>
                <div className="col-span-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !jobOrderForms[0]?.dateRequested && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                        onSelect={(date) => handleFormUpdate(0, "dateRequested", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* JO Type */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">JO Type:</Label>
                <div className="col-span-2">
                  <Select
                    onValueChange={(value: JobOrderType) => handleFormUpdate(0, "joType", value)}
                    value={jobOrderForms[0]?.joType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-Choose JO Type-" />
                    </SelectTrigger>
                    <SelectContent>
                      {joTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">Deadline:</Label>
                <div className="col-span-2 flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !jobOrderForms[0]?.deadline && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {jobOrderForms[0]?.deadline ? (
                          format(jobOrderForms[0].deadline, "PPP")
                        ) : (
                          <span>Select Date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={jobOrderForms[0]?.deadline}
                        onSelect={(date) => handleFormUpdate(0, "deadline", date)}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="sm">
                    Timeline
                  </Button>
                </div>
              </div>

              {/* Requested By */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium text-gray-700">Requested By:</Label>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">(Auto-Generated)</span>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-3 gap-4 items-start">
                <Label className="text-sm font-medium text-gray-700 pt-2">Remarks:</Label>
                <div className="col-span-2">
                  <Input
                    placeholder="Remarks..."
                    className="w-full"
                    value={jobOrderForms[0]?.remarks || ""}
                    onChange={(e) => handleFormUpdate(0, "remarks", e.target.value)}
                  />
                </div>
              </div>

              {/* Material Preview */}
              <div className="mt-8">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Material Preview:</Label>
                <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                  {products[0]?.media?.[0]?.url ? (
                    <Image
                      src={products[0].media[0].url || "/placeholder.svg"}
                      alt="Material preview"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Image
                      src="/material-preview.png"
                      alt="Material preview"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              </div>

              {/* Info Text */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 italic">This Job Order will be forwarded to your Logistics Team.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button variant="outline" onClick={() => router.push("/sales/job-orders")} className="px-6">
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleCreateJobOrder("active")}
                  disabled={isCreating}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create JO"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
