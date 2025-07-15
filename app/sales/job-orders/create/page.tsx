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

  // Derived compliance state
  const missingCompliance = useMemo(
    () => ({
      signedQuotation: !signedQuotationUrl,
      poMo: !poMoUrl,
      projectFa: !projectFaUrl,
    }),
    [signedQuotationUrl, poMoUrl, projectFaUrl],
  )

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

          // Initialize form data for each product
          const initialForms: JobOrderFormData[] = data.products.map(() => ({
            joType: "",
            dateRequested: new Date(),
            deadline: undefined,
            remarks: "",
            assignTo: userData?.uid || "",
            attachmentFile: null,
            attachmentUrl: null,
            uploadingAttachment: false,
            attachmentError: null,
            joTypeError: false,
            dateRequestedError: false,
          }))
          setJobOrderForms(initialForms)
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
  }, [quotationId, router, toast, userData?.uid])

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₱0.00"
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPeriod = (startDate: string | undefined, endDate: string | undefined) => {
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
  }

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

  const handleFormUpdate = (productIndex: number, field: keyof JobOrderFormData, value: any) => {
    setJobOrderForms((prev) => {
      const updated = [...prev]
      updated[productIndex] = { ...updated[productIndex], [field]: value }
      return updated
    })
  }

  const handleProductAttachmentUpload = async (productIndex: number, file: File) => {
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
  }

  const validateForms = (): boolean => {
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
  }

  const handleCreateJobOrders = async (status: JobOrderStatus) => {
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

    const { quotation, products, client, items } = quotationData

    try {
      const jobOrdersData = products.map((product, index) => {
        const form = jobOrderForms[index]
        const item = items?.[index]

        const startDate = quotation.start_date ? new Date(quotation.start_date) : null
        const endDate = quotation.end_date ? new Date(quotation.end_date) : null
        const totalMonths =
          startDate && endDate
            ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
            : 0
        const contractDuration = totalMonths > 0 ? `(${totalMonths} months)` : "N/A"

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
          siteName: item?.product_name || product.name || "",
          siteCode:
            item?.site_code ||
            product.site_code ||
            product.specs_rental?.site_code ||
            product.light?.site_code ||
            "N/A",
          siteType: item?.type || product.type || "N/A",
          siteSize: product.specs_rental?.size || product.light?.size || "N/A",
          siteIllumination: product.light?.illumination || "N/A",
          leaseRatePerMonth: item?.price || product.price || 0,
          totalMonths: totalMonths,
          totalLease: item?.price ? item.price * totalMonths : (product.price || 0) * totalMonths,
          vatAmount: quotation.total_amount ? (quotation.total_amount * 0.12) / products.length : 0,
          totalAmount: quotation.total_amount ? quotation.total_amount / products.length : 0,
          siteImageUrl: product.media?.[0]?.url || "/placeholder.svg?height=48&width=48",
          missingCompliance: missingCompliance,
          product_id: product.id || "",
          company_id: userData.company_id || "",
        }
      })

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
  }

  const handleDismissAndNavigate = () => {
    setShowJobOrderSuccessDialog(false)
    router.push("/sales/job-orders")
  }

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

  const { quotation, products, client, items } = quotationData
  const isMultiProduct = products.length > 1

  const totalMonths =
    quotation.start_date && quotation.end_date
      ? Math.round(
          (new Date(quotation.end_date).getTime() - new Date(quotation.start_date).getTime()) /
            (1000 * 60 * 60 * 24 * 30.44),
        )
      : 0
  const vatAmount = quotation.total_amount ? quotation.total_amount * 0.12 : 0
  const totalAmountWithVat = (quotation.total_amount || 0) + vatAmount

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
            {products.length} Products
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
                {products.map((product, index) => {
                  const item = items?.[index]
                  return (
                    <div key={product.id} className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-md">
                      <Image
                        src={product.media?.[0]?.url || "/placeholder.svg?height=40&width=40&query=billboard"}
                        alt={product.name || "Site image"}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {item?.site_code ||
                            product.site_code ||
                            product.specs_rental?.site_code ||
                            product.light?.site_code ||
                            "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">{item?.product_name || product.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item?.price || product.price)}/month</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-0.5 mt-3">
              <p className="text-sm">
                <span className="font-semibold">Total Lease:</span> {formatCurrency(quotation.price)}
              </p>
              <p className="text-sm">
                <span className="font-semibold">12% VAT:</span> {formatCurrency(vatAmount)}
              </p>
              <p className="font-bold text-lg mt-1">TOTAL: {formatCurrency(totalAmountWithVat)}</p>
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
            Job Order{isMultiProduct ? "s" : ""} ({products.length})
          </h2>

          {isMultiProduct ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => {
                  const item = items?.[index]
                  return (
                    <TabsTrigger key={index} value={index.toString()} className="text-xs">
                      {item?.site_code || product.site_code || `Site ${index + 1}`}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {products.map((product, index) => {
                const form = jobOrderForms[index]
                const item = items?.[index]

                if (!form) return null

                return (
                  <TabsContent key={index} value={index.toString()}>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Image
                            src={product.media?.[0]?.url || "/placeholder.svg?height=24&width=24&query=billboard"}
                            alt={product.name || "Site image"}
                            width={24}
                            height={24}
                            className="rounded object-cover"
                          />
                          {item?.product_name || product.name}
                          <Badge variant="outline" className="text-xs">
                            {item?.site_code || product.site_code || `Site ${index + 1}`}
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
            // Single product form (existing logic)
            <div className="space-y-4">
              {products.map((product, index) => {
                const form = jobOrderForms[index]
                if (!form) return null

                return (
                  <Card key={index}>
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
                            <SelectItem value={userData?.uid || ""} className="text-sm">
                              {userData?.first_name}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
