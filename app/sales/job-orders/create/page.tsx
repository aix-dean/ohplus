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
  CircleCheck,
  Upload,
  ArrowRight,
  Printer
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
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  createMultipleJobOrders,
  getQuotationDetailsForJobOrder,
  generatePersonalizedJONumber,
} from "@/lib/job-order-service"
import { generateJobOrderPDF } from "@/lib/job-order-pdf-generator"
import { updateQuotation } from "@/lib/quotation-service" // Import updateQuotation
import type { QuotationProduct } from "@/lib/types/quotation" // Corrected import for QuotationProduct
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import { bookingService } from "@/lib/booking-service"
import type { JobOrderType, JobOrderStatus } from "@/lib/types/job-order"
import type { Quotation, ProjectComplianceItem } from "@/lib/types/quotation" // Import ProjectComplianceItem
import type { Product } from "@/lib/firebase-service"
import { type Client, updateClient, updateClientCompany, type ClientCompany, getClientCompanyById } from "@/lib/client-service" // Import updateClient, updateClientCompany, ClientCompany, and getClientCompanyById
import { cn } from "@/lib/utils"
import { JobOrderCreatedSuccessDialog } from "@/components/job-order-created-success-dialog"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"
import { ComplianceConfirmationDialog } from "@/components/compliance-confirmation-dialog"
import { serverTimestamp, Timestamp } from "firebase/firestore"


interface JobOrderFormData {
  joNumber: string
  joType: JobOrderType | ""
  dateRequested: Date | undefined
  deadline: Date | undefined
  campaignName: string // Added campaign name
  remarks: string
  attachmentFile: File | null
  attachmentUrl: string | null
  uploadingAttachment: boolean
  attachmentError: string | null
  materialSpec: string
  materialSpecAttachmentFile: File | null
  materialSpecAttachmentUrl: string | null
  uploadingMaterialSpecAttachment: boolean
  materialSpecAttachmentError: string | null
  joTypeError: boolean
  dateRequestedError: boolean
}

// Helper function to safely parse date values
const safeToDate = (dateValue: any): Date | undefined => {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  const parsedDate = new Date(dateValue);
  return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

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
    client: ClientCompany | null // This should be ClientCompany
    items?: QuotationProduct[] // Changed from QuotationItem
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Client Compliance states
  const [dtiBirFile, setDtiBirFile] = useState<File | null>(null)
  const [dtiBirUrl, setDtiBirUrl] = useState<string | null>(null)
  const [uploadingDtiBir, setUploadingDtiBir] = useState(false)
  const [dtiBirError, setDtiBirError] = useState<string | null>(null)

  const [gisFile, setGisFile] = useState<File | null>(null)
  const [gisUrl, setGisUrl] = useState<string | null>(null)
  const [uploadingGis, setUploadingGis] = useState(false)
  const [gisError, setGisError] = useState<string | null>(null)

  const [idSignatureFile, setIdSignatureFile] = useState<File | null>(null)
  const [idSignatureUrl, setIdSignatureUrl] = useState<string | null>(null)
  const [uploadingIdSignature, setUploadingIdSignature] = useState(false)
  const [idSignatureError, setIdSignatureError] = useState<string | null>(null)


  // Project Compliance states
  const [signedQuotationFile, setSignedQuotationFile] = useState<File | null>(null)
  const [signedQuotationUrl, setSignedQuotationUrl] = useState<string | null>(null)
  const [uploadingSignedQuotation, setUploadingSignedQuotation] = useState(false)
  const [signedQuotationError, setSignedQuotationError] = useState<string | null>(null)

  const [signedContractFile, setSignedContractFile] = useState<File | null>(null)
  const [signedContractUrl, setSignedContractUrl] = useState<string | null>(null)
  const [uploadingSignedContract, setUploadingSignedContract] = useState(false)
  const [signedContractError, setSignedContractError] = useState<string | null>(null)

  const [poMoFile, setPoMoFile] = useState<File | null>(null)
  const [poMoUrl, setPoMoUrl] = useState<string | null>(null)
  const [uploadingPoMo, setUploadingPoMo] = useState(false)
  const [poMoError, setPoMoError] = useState<string | null>(null)

  const [finalArtworkFile, setFinalArtworkFile] = useState<File | null>(null)
  const [finalArtworkUrl, setFinalArtworkUrl] = useState<string | null>(null)
  const [uploadingFinalArtwork, setUploadingFinalArtwork] = useState(false)
  const [finalArtworkError, setFinalArtworkError] = useState<string | null>(null)

  const [paymentAdvanceConfirmed, setPaymentAdvanceConfirmed] = useState(false)

  // Form data for each product
  const [jobOrderForms, setJobOrderForms] = useState<JobOrderFormData[]>([])


  // Coming soon dialog state
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false)

  // Compliance confirmation dialog state
  const [showComplianceDialog, setShowComplianceDialog] = useState(false)
  const [pendingJobOrderStatus, setPendingJobOrderStatus] = useState<JobOrderStatus | null>(null)


  // Calculate derived values using useMemo - these will always be called


  const missingCompliance = useMemo(() => {
    const projectCompliance = quotationData?.quotation?.projectCompliance
    return {
      dtiBir: !dtiBirUrl && !quotationData?.client?.compliance?.dti,
      gis: !gisUrl && !quotationData?.client?.compliance?.gis,
      idSignature: !idSignatureUrl && !quotationData?.client?.compliance?.id,
      signedQuotation: !signedQuotationUrl && !projectCompliance?.signedQuotation?.fileUrl,
      signedContract: !signedContractUrl && !projectCompliance?.signedContract?.fileUrl,
      poMo: !poMoUrl && !projectCompliance?.irrevocablePo?.fileUrl,
      finalArtwork: !finalArtworkUrl && !projectCompliance?.finalArtwork?.fileUrl,
      paymentAdvance: !paymentAdvanceConfirmed && !projectCompliance?.paymentAsDeposit?.fileUrl,
    }
  }, [
    dtiBirUrl,
    gisUrl,
    idSignatureUrl,
    signedQuotationUrl,
    signedContractUrl,
    poMoUrl,
    finalArtworkUrl,
    paymentAdvanceConfirmed,
    quotationData?.client?.compliance?.dti,
    quotationData?.client?.compliance?.gis,
    quotationData?.client?.compliance?.id,
    quotationData?.quotation?.projectCompliance, // Depend on the whole object
  ])

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
    const products = quotationData.products // Access products here

    // Always treat as a single product from quotation object
    const subtotal = quotation.total_amount || 0 // Use total_amount for single product
    const vat = subtotal * 0.12 // Recalculate VAT based on new subtotal
    const total = subtotal + vat // Recalculate total

    const monthlyRate =
      quotation.duration_days && quotation.duration_days > 0
        ? subtotal / (quotation.duration_days / 30) // Approximate monthly rate
        : 0

    return [
      {
        subtotal,
        vat,
        total,
        monthlyRate: monthlyRate,
        siteCode: products[0]?.site_code || "N/A", // Get from product
        productName: products[0]?.name || "N/A", // Get from product
      },
    ]
  }, [quotationData])

  // Calculate overall totals
  const overallTotal = useMemo(() => {
    return productTotals.reduce((sum, product) => sum + product.total, 0)
  }, [productTotals])

  // Extract content_type from quotation data
  const contentType = useMemo(() => {
    return quotationData?.quotation?.items?.content_type || "static"
  }, [quotationData])

  // Dynamic JO type options based on content_type
  const joTypeOptions = useMemo(() => {
    if (contentType === "static") {
      return ["Roll down", "Roll up", "Change Material", "Monitoring", "Other"]
    } else if (contentType === "dynamic") {
      return ["Publish", "Change Material", "Monitoring", "Other"]
    } else {
      return ["Roll down", "Roll up", "Change Material", "Monitoring", "Other"]
    }
  }, [contentType])

  // Dynamic material spec options based on content_type
  const materialSpecOptions = useMemo(() => {
    if (contentType === "static") {
      return ["Tarpaulin", "Sticker", "Other"]
    } else if (contentType === "dynamic") {
      return ["Digital File"]
    } else {
      return ["Tarpaulin", "Sticker", "Other"]
    }
  }, [contentType])
  console.log("product totals :", productTotals)
  // All useCallback hooks
  const formatCurrency = useCallback((amount: number | undefined) => {
    if (amount === undefined || amount === null || amount === 0) return "N/A"
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])


  const formatPeriod = useCallback(
    (startDate?: Date | Timestamp | null, endDate?: Date | Timestamp | null) => {
      if (!startDate || !endDate) return "N/A"

      const start = startDate instanceof Timestamp
        ? startDate.toDate()
        : startDate instanceof Date
          ? startDate
          : new Date(startDate)

      const end = endDate instanceof Timestamp
        ? endDate.toDate()
        : endDate instanceof Date
          ? endDate
          : new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid date inputs:", startDate, endDate)
        return "Invalid Dates"
      }

      return `${format(start, "MMM dd, yyyy")} to ${format(end, "MMM dd, yyyy")}`
    },
    []
  )

  const isImageFile = useCallback((fileName: string | null, fileUrl: string | null) => {
    if (!fileName && !fileUrl) return false;

    // Pick fileName if provided, otherwise extract from URL
    let name = fileName || "";

    if (!name && fileUrl) {
      // Remove query params (?alt=...)
      const cleanUrl = fileUrl.split("?")[0];
      // Decode %20 etc.
      const decodedUrl = decodeURIComponent(cleanUrl);
      // Get the last part after /
      name = decodedUrl.split("/").pop() || "";
    }

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"];
    return imageExtensions.some(ext => name.toLowerCase().endsWith(ext));
  }, []);

  const getFileNameFromUrl = useCallback((fileUrl: string | null) => {
    if (!fileUrl) return null;

    // Remove query params (?alt=...)
    const cleanUrl = fileUrl.split("?")[0];
    // Decode %20 etc.
    const decodedUrl = decodeURIComponent(cleanUrl);
    // Get the last part after /
    return decodedUrl.split("/").pop() || null;
  }, []);

  const handleFileUpload = useCallback(
    async (
      file: File,
      type: "image" | "document",
      setFileState: React.Dispatch<React.SetStateAction<File | null>>,
      setUrlState: React.Dispatch<React.SetStateAction<string | null>>,
      setUploadingState: React.Dispatch<React.SetStateAction<boolean>>,
      setErrorState: React.Dispatch<React.SetStateAction<string | null>>,
      path: string,
      clientId?: string, // Optional client ID
      fieldToUpdate?: string, // Optional field to update in client document
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

        // Prioritize updating client company compliance if clientId and a recognized fieldToUpdate are present
        // Handle project compliance updates for quotation documents
        if (quotationId && fieldToUpdate && (fieldToUpdate === "signedQuotation" || fieldToUpdate === "signedContract" || fieldToUpdate === "poMo" || fieldToUpdate === "finalArtwork" || fieldToUpdate === "paymentAsDeposit")) {
          console.log("handleFileUpload: Attempting to update project compliance for quotation.");
          console.log("handleFileUpload: quotationId:", quotationId);
          console.log("handleFileUpload: fieldToUpdate:", fieldToUpdate);
          // Handle project compliance updates for the quotation document
          let projectComplianceFieldKey:
            | "signedQuotation"
            | "signedContract"
            | "irrevocablePo"
            | "finalArtwork"
            | "paymentAsDeposit"
            | undefined

          if (fieldToUpdate === "signedQuotation") {
            projectComplianceFieldKey = "signedQuotation"
          } else if (fieldToUpdate === "signedContract") {
            projectComplianceFieldKey = "signedContract"
          } else if (fieldToUpdate === "poMo") {
            projectComplianceFieldKey = "irrevocablePo"
          } else if (fieldToUpdate === "finalArtwork") {
            projectComplianceFieldKey = "finalArtwork"
          } else if (fieldToUpdate === "paymentAsDeposit") {
            projectComplianceFieldKey = "paymentAsDeposit"
          }

          if (projectComplianceFieldKey) {
            // Get the current project compliance from quotation data or use empty object with proper typing
            const currentProjectCompliance = quotationData?.quotation?.projectCompliance || {
              finalArtwork: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              paymentAsDeposit: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              irrevocablePo: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              signedContract: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              signedQuotation: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
            }

            // Get the existing field data with proper type safety
            const existingField = currentProjectCompliance[projectComplianceFieldKey]
            const existingFieldData = existingField

            const updatedProjectCompliance = {
              ...currentProjectCompliance, // Spread the fully initialized object
              [projectComplianceFieldKey]: {
                // Preserve existing field data if it exists, otherwise create new object with defaults
                ...(existingFieldData || {
                  fileName: null,
                  fileUrl: null,
                  notes: null,
                  uploadedAt: null,
                  uploadedBy: null,
                  status: "pending"
                }),
                fileName: file.name,
                fileUrl: downloadURL,
                uploadedAt: new Date().toISOString(),
                uploadedBy: user?.uid || null,
                ...(projectComplianceFieldKey === "signedQuotation" && { status: "completed" }), // Add status for signedQuotation
              },
            }

            await updateQuotation(
              quotationId,
              {
                projectCompliance: updatedProjectCompliance,
              },
              user?.uid || "unknown",
              userData?.first_name || "System",
            )

            // Update local quotationData to reflect the change
            setQuotationData(prev => prev ? { ...prev, quotation: { ...prev.quotation, projectCompliance: updatedProjectCompliance } } : null)

            // Also update the booking document
            await bookingService.updateBookingProjectCompliance(quotationId, updatedProjectCompliance)

            toast({
              title: "Project Compliance Document Updated",
              description: `Quotation's ${fieldToUpdate} updated successfully.`,
            })
          } else {
            console.warn(`Unknown project compliance field to update: ${fieldToUpdate}`)
            toast({
              title: "Update Failed",
              description: `Could not update project compliance for unknown field: ${fieldToUpdate}.`,
              variant: "destructive",
            })
          }
        } else if (clientId && (fieldToUpdate === "dti_bir_2303_url" || fieldToUpdate === "gis_url" || fieldToUpdate === "id_signature_url")) {
          // Handle client company compliance updates
          const clientCompanyId = clientId; // Use the clientId passed as a parameter
          const existingClientCompany = await getClientCompanyById(clientCompanyId);
          console.log("Existing client company document:", existingClientCompany);
          const existingCompliance = existingClientCompany?.compliance || {};
          console.log("Existing compliance:", existingCompliance);

          let complianceFieldKey: "dti" | "gis" | "id" | undefined;

          if (fieldToUpdate === "dti_bir_2303_url") {
            complianceFieldKey = "dti";
          } else if (fieldToUpdate === "gis_url") {
            complianceFieldKey = "gis";
          } else if (fieldToUpdate === "id_signature_url") {
            complianceFieldKey = "id";
          }

          if (complianceFieldKey) {
            const updatedCompliance = {
              ...existingCompliance, // Preserve existing compliance fields from the fetched document
              [complianceFieldKey]: downloadURL, // Update the specific field
            };
            console.log("Updated compliance object:", updatedCompliance);
            console.log("client company ID used for update:", clientCompanyId);
            try {
              await updateClientCompany(clientCompanyId, { // Use clientCompanyId here
                compliance: updatedCompliance,
              });
              toast({
                title: "Client Company Document Updated",
                description: `Client company's ${fieldToUpdate} updated successfully.`,
              });
            } catch (updateError: any) {
              console.error("Error during updateClientCompany:", updateError);
              toast({
                title: "Update Failed",
                description: `Failed to update client company compliance: ${updateError.message || "Unknown error"}.`,
                variant: "destructive",
              });
            }
          } else {
            // This else block should ideally not be reached if the outer if condition is met
            console.warn(`handleFileUpload: Unexpected: complianceFieldKey not identified for fieldToUpdate: ${fieldToUpdate}`);
          }
        } else if (clientId && fieldToUpdate) {
          // Fallback to updating the individual client document if no client_company_id
          await updateClient(clientId, { [fieldToUpdate]: downloadURL })
          toast({
            title: "Client Document Updated",
            description: `Client's ${fieldToUpdate} updated successfully.`,
          })
        }

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
    [quotationData, quotationId, toast, user?.uid, userData?.first_name],
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

  const handleMaterialSpecAttachmentUpload = useCallback(
    async (productIndex: number, file: File) => {
      handleFormUpdate(productIndex, "uploadingMaterialSpecAttachment", true)
      handleFormUpdate(productIndex, "materialSpecAttachmentError", null)
      handleFormUpdate(productIndex, "materialSpecAttachmentUrl", null)

      try {
        const downloadURL = await uploadFileToFirebaseStorage(file, `attachments/job-orders/material-spec-${productIndex}/`)
        handleFormUpdate(productIndex, "materialSpecAttachmentUrl", downloadURL)
        handleFormUpdate(productIndex, "materialSpecAttachmentFile", file)
        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded successfully.`,
        })
      } catch (error: any) {
        console.error("Upload failed:", error)
        handleFormUpdate(productIndex, "materialSpecAttachmentError", `Upload failed: ${error.message || "Unknown error"}`)
        toast({
          title: "Upload Failed",
          description: `Could not upload ${file.name}. ${error.message || "Please try again."}`,
          variant: "destructive",
        })
      } finally {
        handleFormUpdate(productIndex, "uploadingMaterialSpecAttachment", false)
      }
    },
    [handleFormUpdate, toast],
  )

  const validateForms = useCallback((): boolean => {
    let hasError = false

    jobOrderForms.forEach((form, index) => {
      if (!form.joType || !joTypeOptions.includes(form.joType)) {
        handleFormUpdate(index, "joTypeError", true)
        hasError = true
      } else {
        handleFormUpdate(index, "joTypeError", false)
      }

      // Check and reset materialSpec if invalid
      if (form.materialSpec && !materialSpecOptions.includes(form.materialSpec)) {
        handleFormUpdate(index, "materialSpec", "")
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
  }, [jobOrderForms, handleFormUpdate, joTypeOptions, materialSpecOptions])

  const createJobOrdersWithStatus = useCallback(
    async (status: JobOrderStatus) => {
      if (!quotationData || !user?.uid) {
        toast({
          title: "Missing Information",
          description: "Cannot create Job Orders due to missing data or user authentication.",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      try {
        const quotation = quotationData.quotation
        const products = quotationData.products
        const client = quotationData.client

        let jobOrdersData = []

        // Single product from quotation object
        const form = jobOrderForms[0]
        const product = products[0] || {}

        // DEBUG: Log all date/time values before processing
        console.log("[DEBUG] Date/Time values in job order creation:")
        console.log("- Current time:", new Date().toISOString())
        console.log("- Form dateRequested:", form.dateRequested, "Type:", typeof form.dateRequested)
        console.log("- Form deadline:", form.deadline, "Type:", typeof form.deadline)
        console.log("- Quotation start_date:", quotation.start_date, "Type:", typeof quotation.start_date, "Raw value:", quotation.start_date)
        console.log("- Quotation end_date:", quotation.end_date, "Type:", typeof quotation.end_date, "Raw value:", quotation.end_date)

        // Validate date objects
        const createdDate = new Date()
        console.log("- Created date object:", createdDate, "Is valid:", !isNaN(createdDate.getTime()))

        let contractPeriodStart = null
        let contractPeriodEnd = null

        if (quotation.start_date) {
          try {
            // Handle Firestore Timestamp objects
            if (quotation.start_date && typeof quotation.start_date === 'object' && 'toDate' in quotation.start_date) {
              contractPeriodStart = quotation.start_date.toDate()
            } else {
              contractPeriodStart = new Date(quotation.start_date)
            }
            console.log("- Contract period start parsed:", contractPeriodStart, "Is valid:", !isNaN(contractPeriodStart.getTime()))
          } catch (error) {
            console.error("- Error parsing contractPeriodStart:", error)
            contractPeriodStart = null
          }
        }

        if (quotation.end_date) {
          try {
            // Handle Firestore Timestamp objects
            if (quotation.end_date && typeof quotation.end_date === 'object' && 'toDate' in quotation.end_date) {
              contractPeriodEnd = quotation.end_date.toDate()
            } else {
              contractPeriodEnd = new Date(quotation.end_date)
            }
            console.log("- Contract period end parsed:", contractPeriodEnd, "Is valid:", !isNaN(contractPeriodEnd.getTime()))
          } catch (error) {
            console.error("- Error parsing contractPeriodEnd:", error)
            contractPeriodEnd = null
          }
        }

        // Check form dates
        if (form.dateRequested) {
          console.log("- Form dateRequested valid:", !isNaN(form.dateRequested.getTime()), "Value:", form.dateRequested.toISOString())
        } else {
          console.warn("- Form dateRequested is null/undefined")
        }

        if (form.deadline) {
          console.log("- Form deadline valid:", !isNaN(form.deadline.getTime()), "Value:", form.deadline.toISOString())
        } else {
          console.warn("- Form deadline is null/undefined")
        }

        const contractDuration = totalDays > 0 ? `(${totalDays} days)` : "N/A" // Use totalDays

        const subtotal = quotation.total_amount || 0 // Use total_amount for single product
        const productVat = subtotal * 0.12 // Recalculate VAT
        const productTotal = subtotal + productVat // Recalculate total

        jobOrdersData = [
          {
            quotationId: quotation.id,
            created: createdDate,
            joNumber: form.joNumber || await generatePersonalizedJONumber(userData), // Use input JO# if provided, else generate
            dateRequested: form.dateRequested!,
            joType: form.joType as JobOrderType,
            deadline: form.deadline!,
            campaignName: form.campaignName, // Added campaign name
            requestedBy: `${userData?.first_name} ${userData?.last_name}` || "Auto-Generated",
            remarks: form.remarks,
            attachments: form.attachmentUrl
              ? [{
                url: form.attachmentUrl,
                name: form.attachmentFile?.name || "Attachment",
                type: form.attachmentFile?.type || "image",
              }]
              : [],
            materialSpec: form.materialSpec,
            materialSpecAttachmentUrl: form.materialSpecAttachmentUrl,
            clientCompliance: {
              dtiBirUrl: dtiBirUrl, // Added client compliance
              gisUrl: gisUrl, // Added client compliance
              idSignatureUrl: idSignatureUrl,
            }, // Initialize empty clientCompliance
            quotationNumber: quotation.quotation_number,
            clientName: client?.name || "N/A",
            clientCompany: quotation?.client_company_name || "N/A", // Changed from client?.company to client?.name
            clientCompanyId: quotation.client_company_id || "",
            clientId: client?.id || "",
            client_email: (client as any)?.email || "",
            contractDuration: totalDays.toString(), // Convert to string as expected by type
            contractPeriodStart: contractPeriodStart || undefined,
            contractPeriodEnd: contractPeriodEnd || undefined,
            siteLocation: quotation.items?.specs?.location || "N/A", // Get from quotation items
            siteName: quotation.items?.name || "", // Get from quotation items
            siteCode: quotation.items?.site_code || "N/A", // Get from quotation items
            siteType: contentType || "N/A",
            siteSize: `${quotationData.quotation.items?.specs?.height || 0}ft (h)  x ${quotationData.quotation.items?.specs?.width || 0}ft (w)`,
            siteIllumination: quotation.items?.light ? "Yes" : "No", // Use quotation items light as boolean
            illumination: typeof products[0]?.specs_rental?.illumination === 'object'
              ? "Custom Illumination Setup"
              : products[0]?.specs_rental?.illumination || "N/A", // Use product illumination specs
            leaseRatePerMonth:
              quotation.duration_days && quotation.duration_days > 0
                ? subtotal / (quotation.duration_days / 30)
                : 0, // Corrected monthlyRate
            totalMonths: totalDays / 30, // This might still be relevant for other calculations, but not for totalLease directly
            totalLease: subtotal, // totalLease is now the subtotal
            vatAmount: productVat, // Use recalculated VAT
            totalAmount: productTotal, // Use recalculated total
            siteImageUrl: quotation.items?.media_url || "/placeholder.svg?height=48&width=48",
            missingCompliance: missingCompliance,
            product_id: quotation.items.product_id || "",
            company_id: userData?.company_id || "",
            created_by: user.uid, // Added created_by
            content_type: contentType, // Added content_type
            projectCompliance: { // Construct projectCompliance object
              signedQuotation: {
                fileName: signedQuotationFile?.name || null,
                fileUrl: signedQuotationUrl,
                notes: null,
                uploadedAt: signedQuotationUrl ? serverTimestamp() : null,
                uploadedBy: user?.uid || null,
                status: (signedQuotationUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              signedContract: {
                fileName: signedContractFile?.name || null,
                fileUrl: signedContractUrl,
                notes: null,
                uploadedAt: signedContractUrl ? serverTimestamp() : null,
                uploadedBy: user?.uid || null,
                status: (signedContractUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              irrevocablePo: {
                fileName: poMoFile?.name || null,
                fileUrl: poMoUrl,
                notes: null,
                uploadedAt: poMoUrl ? serverTimestamp() : null,
                uploadedBy: user?.uid || null,
                status: (poMoUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              finalArtwork: {
                fileName: finalArtworkFile?.name || null,
                fileUrl: finalArtworkUrl,
                notes: null,
                uploadedAt: finalArtworkUrl ? serverTimestamp() : null,
                uploadedBy: user?.uid || null,
                status: (finalArtworkUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              paymentAsDeposit: {
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: paymentAdvanceConfirmed ? serverTimestamp() : null,
                uploadedBy: user?.uid || null,
                status: (paymentAdvanceConfirmed ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
            },
          },
        ]

        const joIds = await createMultipleJobOrders(
          jobOrdersData.map((jo) => ({ ...jo, assignTo: "" })), // Add default assignTo
          user.uid,
          status,
        )
        router.push(`/sales/job-orders?success=true&joIds=${joIds.join(',')}`)
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
      jobOrderForms,
      totalDays,
      signedQuotationUrl,
      signedContractUrl,
      poMoUrl,
      finalArtworkUrl,
      paymentAdvanceConfirmed,
      missingCompliance,
      userData,
      toast,
    ],
  )

  const handlePrint = useCallback(async () => {
    if (!quotationData || !user?.uid || !userData) {
      toast({
        title: "Missing Information",
        description: "Cannot generate PDF due to missing data.",
        variant: "destructive",
      })
      return
    }

    try {
      const quotation = quotationData.quotation
      const products = quotationData.products
      const client = quotationData.client
      const form = jobOrderForms[0]

      // Generate JO number if not provided
      const joNumber = form.joNumber || await generatePersonalizedJONumber(userData)

      // Create temporary JobOrder object
      const tempJobOrder = {
        id: "", // Not created yet
        quotationId: quotation.id,
        created: new Date(),
        joNumber,
        dateRequested: form.dateRequested || new Date(),
        joType: form.joType as JobOrderType,
        deadline: form.deadline || new Date(),
        campaignName: form.campaignName,
        requestedBy: userData?.first_name || "Auto-Generated",
        remarks: form.remarks,
        attachments: form.attachmentUrl
          ? [{
              url: form.attachmentUrl,
              name: form.attachmentFile?.name || "Attachment",
              type: form.attachmentFile?.type || "image",
            }]
          : [],
        materialSpec: form.materialSpec,
        materialSpecAttachmentUrl: form.materialSpecAttachmentUrl,
        clientCompliance: {
          dtiBirUrl: dtiBirUrl,
          gisUrl: gisUrl,
          idSignatureUrl: idSignatureUrl,
        },
        quotationNumber: quotation.quotation_number,
        clientName: client?.name || "N/A",
        clientCompany: quotation?.client_company_name || "N/A",
        clientCompanyId: quotation.client_company_id || "",
        clientId: client?.id || "",
        client_email: (client as any)?.email || "",
        contractDuration: totalDays.toString(),
        contractPeriodStart: quotation.start_date ? safeToDate(quotation.start_date) : undefined,
        contractPeriodEnd: quotation.end_date ? safeToDate(quotation.end_date) : undefined,
        siteLocation: quotation.items?.specs?.location || "N/A",
        siteName: quotation.items?.name || "",
        siteCode: quotation.items?.site_code || "N/A",
        siteType: contentType || "N/A",
        siteSize: `${quotationData.quotation.items?.specs?.height || 0}ft (h) x ${quotationData.quotation.items?.specs?.width || 0}ft (w)`,
        siteIllumination: quotation.items?.light ? "Yes" : "No",
        illumination: typeof products[0]?.specs_rental?.illumination === 'object'
          ? "Custom Illumination Setup"
          : products[0]?.specs_rental?.illumination || "N/A",
        leaseRatePerMonth: quotation.duration_days && quotation.duration_days > 0
          ? (quotation.total_amount || 0) / (quotation.duration_days / 30)
          : 0,
        totalMonths: totalDays / 30,
        totalLease: quotation.total_amount || 0,
        vatAmount: (quotation.total_amount || 0) * 0.12,
        totalAmount: (quotation.total_amount || 0) * 1.12,
        siteImageUrl: quotation.items?.media_url || "/placeholder.svg?height=48&width=48",
        missingCompliance: missingCompliance,
        product_id: quotation.items.product_id || "",
        company_id: userData?.company_id || "",
        created_by: user.uid,
        content_type: contentType,
        status: "draft" as const,
        assignTo: "",
        projectCompliance: {
          signedQuotation: {
            fileName: signedQuotationFile?.name || null,
            fileUrl: signedQuotationUrl,
            notes: null,
            uploadedAt: signedQuotationUrl ? serverTimestamp() : null,
            uploadedBy: user?.uid || null,
            status: (signedQuotationUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
          },
          signedContract: {
            fileName: signedContractFile?.name || null,
            fileUrl: signedContractUrl,
            notes: null,
            uploadedAt: signedContractUrl ? serverTimestamp() : null,
            uploadedBy: user?.uid || null,
            status: (signedContractUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
          },
          irrevocablePo: {
            fileName: poMoFile?.name || null,
            fileUrl: poMoUrl,
            notes: null,
            uploadedAt: poMoUrl ? serverTimestamp() : null,
            uploadedBy: user?.uid || null,
            status: (poMoUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
          },
          finalArtwork: {
            fileName: finalArtworkFile?.name || null,
            fileUrl: finalArtworkUrl,
            notes: null,
            uploadedAt: finalArtworkUrl ? serverTimestamp() : null,
            uploadedBy: user?.uid || null,
            status: (finalArtworkUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
          },
          paymentAsDeposit: {
            fileName: null,
            fileUrl: null,
            notes: null,
            uploadedAt: paymentAdvanceConfirmed ? serverTimestamp() : null,
            uploadedBy: user?.uid || null,
            status: (paymentAdvanceConfirmed ? "completed" : "pending") as "pending" | "completed" | "uploaded",
          },
        },
      }

      await generateJobOrderPDF(tempJobOrder, 'print')
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error.message || "Unknown error"}.`,
        variant: "destructive",
      })
    }
  }, [
    quotationData,
    user,
    userData,
    jobOrderForms,
    totalDays,
    signedQuotationUrl,
    signedContractUrl,
    poMoUrl,
    finalArtworkUrl,
    paymentAdvanceConfirmed,
    missingCompliance,
    contentType,
    dtiBirUrl,
    gisUrl,
    idSignatureUrl,
    signedQuotationFile,
    signedContractFile,
    poMoFile,
    finalArtworkFile,
    toast,
  ])


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

      // Check if any project compliances are missing
      const hasMissingProjectCompliance = missingCompliance.signedQuotation ||
        missingCompliance.signedContract ||
        missingCompliance.poMo ||
        missingCompliance.finalArtwork ||
        missingCompliance.paymentAdvance

      // If there are missing project compliances, show the confirmation dialog
      if (hasMissingProjectCompliance) {
        setPendingJobOrderStatus(status)
        setShowComplianceDialog(true)
        return
      }

      // If all compliances are complete, proceed with creation
      await createJobOrdersWithStatus(status)
    },
    [quotationData, user?.uid, validateForms, missingCompliance, createJobOrdersWithStatus],
  )


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
          console.log("Fetched quotation data:", data);
          console.log("quotationData.quotation.client_company_id:", data.quotation.client_company_id);
          console.log("quotationData.client?.id (expected client id):", data.client?.id);

          // Fetch the client_company document using the client id from the client object
          if (data.quotation.client_company_id) { // Use data.client?.id here
            const clientCompanyDoc = await getClientCompanyById(data.quotation.client_company_id) // Use data.client.id here
            if (clientCompanyDoc) {
              // Use clientCompanyDoc data to set compliance URLs
              if (clientCompanyDoc.compliance?.dti) {
                setDtiBirUrl(clientCompanyDoc.compliance.dti)
              }
              if (clientCompanyDoc.compliance?.gis) {
                setGisUrl(clientCompanyDoc.compliance.gis)
              }
              if (clientCompanyDoc.compliance?.id) {
                setIdSignatureUrl(clientCompanyDoc.compliance.id)
              }
            } else {
              console.warn(`Client company with ID ${data.quotation.client_company_id} not found.`) // Use data.client.id here
              // If clientCompanyDoc is not found, and data.client exists, try to set from data.client's direct compliance fields
              if (data.client) {
                if (data.client.dti_bir_2303_url) {
                  setDtiBirUrl(data.client.dti_bir_2303_url)
                }
                if (data.client.gis_url) {
                  setGisUrl(data.client.gis_url)
                }
                if (data.client.id_signature_url) {
                  setIdSignatureUrl(data.client.id_signature_url)
                }
              }
            }
          } else {
            // If no client id from data.client, and data.client exists, try to set from data.client's direct compliance fields
            if (data.client) {
              if (data.client.dti_bir_2303_url) {
                setDtiBirUrl(data.client.dti_bir_2303_url)
              }
              if (data.client.gis_url) {
                setGisUrl(data.client.gis_url)
              }
              if (data.client.id_signature_url) {
                setIdSignatureUrl(data.client.id_signature_url)
              }
            }
          }

          // Initialize project compliance states from quotationData
          if (data.quotation.projectCompliance) {
            const projectCompliance = data.quotation.projectCompliance
            if (projectCompliance.signedQuotation?.fileUrl) {
              setSignedQuotationUrl(projectCompliance.signedQuotation.fileUrl)
            }
            if (projectCompliance.signedContract?.fileUrl) {
              setSignedContractUrl(projectCompliance.signedContract.fileUrl)
            }
            if (projectCompliance.irrevocablePo?.fileUrl) {
              setPoMoUrl(projectCompliance.irrevocablePo.fileUrl)
            }
            if (projectCompliance.finalArtwork?.fileUrl) {
              setFinalArtworkUrl(projectCompliance.finalArtwork.fileUrl)
            }
            if (projectCompliance.paymentAsDeposit?.fileUrl) {
              setPaymentAdvanceConfirmed(true)
            }
          }
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
      const initialForms: JobOrderFormData[] = [
        {
          joNumber: "",
          joType: "",
          dateRequested: new Date(),
          deadline: undefined,
          campaignName: quotationData.quotation?.campaignId || "", // Initialize with quotation campaignId
          remarks: "",
          attachmentFile: null,
          attachmentUrl: null,
          uploadingAttachment: false,
          attachmentError: null,
          materialSpec: "",
          materialSpecAttachmentFile: null,
          materialSpecAttachmentUrl: null,
          uploadingMaterialSpecAttachment: false,
          materialSpecAttachmentError: null,
          joTypeError: false,
          dateRequestedError: false,
        },
      ]
      setJobOrderForms(initialForms)
    }
  }, [quotationData, userData?.uid])

  // Reset joType and materialSpec if they are not in the new dynamic options
  useEffect(() => {
    setJobOrderForms((prev) => {
      const updated = [...prev]
      if (updated[0]) {
        if (updated[0].joType && !joTypeOptions.includes(updated[0].joType)) {
          updated[0] = { ...updated[0], joType: "" }
        }
        if (updated[0].materialSpec && !materialSpecOptions.includes(updated[0].materialSpec)) {
          updated[0] = { ...updated[0], materialSpec: "" }
        }
      }
      return updated
    })
  }, [joTypeOptions, materialSpecOptions])

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
  console.log()
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-2">
      <div className="flex items-center bg-white gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Job Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full mx-auto bg-gray-50 p-6 rounded-lg">
        {/* Left Column: Booking Information */}
        <div className="space-y-6 lg:pr-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Booking Information</h2>
          <div className="text-gray-800">
            <div className="space-y-0.5">
              <a
                href={`/sales/quotations/${quotation.id}`}
                className="text-blue-600 font-bold text-base hover:underline"
              >
                {quotation.quotation_number}
              </a>
              <p className="text-xs text-gray-600">Project ID: {quotation.id}</p>
            </div>
            <div className="space-y-0.5 mt-3">
              <div>
                <p className="text-sm">
                  <span className="font-semibold">Client Name:</span> {client?.name || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Contract Duration:</span> {totalDays > 0 ? `${totalDays} days` : "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Contract Period:</span> {formatPeriod(quotation.start_date, quotation.end_date)}
                </p>
              </div>
            </div>


            {/* Products/Sites List */}
            <div className="space-y-1">
              <p className="text-sm font-semibold">Site:</p>
              <div className="space-y-2">
                {productTotals.map((productTotal, index) => {
                  const item = quotation.items
                  const product = products[index] || {}

                  return (
                    <div key={index} className="flex items-center align-items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                      <Image
                        src={product.media?.[0]?.url || "/placeholder.svg?height=40&width=40&query=billboard"}
                        alt={productTotal.productName || "Site image"}
                        width={50}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{productTotal.siteCode}</p>
                        <p className="text-xs text-gray-600">{productTotal.productName}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-0.5 mt-3">
              <div>
                <p className="text-sm">
                  <span className="font-semibold">Site Type:</span> {quotationData.quotation.items.content_type}
                </p>
                <p className="text-sm truncate">
                  <span className="font-semibold">Site Location:</span> {quotationData.quotation.items.location || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Size:</span> {`${quotationData.quotation.items?.specs?.height || 0}ft (h) x ${quotationData.quotation.items?.specs?.width || 0}ft (w) `} 
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Illumination:</span> {"N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Lease Rate/Month:</span> {formatCurrency(productTotals[0].monthlyRate)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Total Lease:</span> {formatCurrency(productTotals[0].subtotal)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">12%VAT:</span> {formatCurrency(productTotals[0].vat)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Total:</span> {formatCurrency(productTotals[0].total)}
                </p>
              </div>
            </div>

            {/* Client Compliance Documents */}
            <div className="space-y-1.5 pt-4 border-t border-gray-200 mt-6">
              <p className="text-sm font-semibold mb-2">Client Compliance:</p>

              {/* DTI/BIR 2303 */}
              <div className="flex items-center gap-2">
                {dtiBirUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="dti-bir-radio"
                    name="client-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="dti-bir-radio" className="text-sm flex-1">
                  DTI/BIR 2303
                </Label>
                {dtiBirUrl ? (
                  <a
                    href={dtiBirUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {getFileNameFromUrl(dtiBirUrl) || "DTI/BIR 2303"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="dti-bir-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationData?.quotation.client_company_id) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
                            setDtiBirFile,
                            setDtiBirUrl,
                            setUploadingDtiBir,
                            setDtiBirError,
                            "documents/client-compliance/dti-bir/",
                            quotationData.quotation.client_company_id, // Pass client ID
                            "dti_bir_2303_url", // Field to update
                          )
                        }
                      }
                    }}
                  />
                )}
                {!dtiBirUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-transparent"
                    onClick={() => document.getElementById("dti-bir-upload")?.click()}
                    disabled={uploadingDtiBir}
                  >
                    {uploadingDtiBir ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {uploadingDtiBir ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {dtiBirError && <span className="text-xs text-red-500 ml-2">{dtiBirError}</span>}
              </div>

              {/* GIS */}
              <div className="flex items-center gap-2">
                {gisUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="gis-radio"
                    name="client-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="gis-radio" className="text-sm flex-1">
                  GIS
                </Label>
                {gisUrl ? (
                  <a
                    href={gisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {getFileNameFromUrl(gisUrl) || "GIS"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="gis-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationData?.quotation.client_company_id) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
                            setGisFile,
                            setGisUrl,
                            setUploadingGis,
                            setGisError,
                            "documents/client-compliance/gis/",
                            quotationData.quotation.client_company_id, // Pass client ID
                            "gis_url", // Field to update
                          )
                        }
                      }
                    }}
                  />
                )}
                {!gisUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-transparent"
                    onClick={() => document.getElementById("gis-upload")?.click()}
                    disabled={uploadingGis}
                  >
                    {uploadingGis ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {uploadingGis ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {gisError && <span className="text-xs text-red-500 ml-2">{gisError}</span>}
              </div>

              {/* ID with Signature */}
              <div className="flex items-center gap-2">
                {idSignatureUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="id-signature-radio"
                    name="client-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="id-signature-radio" className="text-sm flex-1">
                  ID with Signature
                </Label>
                {idSignatureUrl ? (
                  <a
                    href={idSignatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {getFileNameFromUrl(idSignatureUrl) || "ID with Signature"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="id-signature-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationData?.quotation.client_company_id) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
                            setIdSignatureFile,
                            setIdSignatureUrl,
                            setUploadingIdSignature,
                            setIdSignatureError,
                            "documents/client-compliance/id-signature/",
                            quotationData.quotation.client_company_id, // Pass client ID
                            "id_signature_url", // Field to update
                          )
                        }
                      }
                    }}
                  />
                )}
                {!idSignatureUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-transparent"
                    onClick={() => document.getElementById("id-signature-upload")?.click()}
                    disabled={uploadingIdSignature}
                  >
                    {uploadingIdSignature ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {uploadingIdSignature ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {idSignatureError && <span className="text-xs text-red-500 ml-2">{idSignatureError}</span>}
              </div>

            </div>

            {/* Project Compliance Documents */}
            <div className="space-y-1.5 pt-4 border-t border-gray-200 mt-6">
              <p className="text-sm font-semibold mb-2">Project Compliance (Shared for all Job Orders):</p>
              {/* Signed Quotation */}
              <div className="flex items-center gap-2">
                {signedQuotationUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="signed-quotation-radio"
                    name="project-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="signed-quotation-radio" className="text-sm flex-1">
                  Signed Quotation
                </Label>
                {signedQuotationUrl ? (
                  <a
                    href={signedQuotationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {quotationData?.quotation?.projectCompliance?.signedQuotation?.fileName || "Signed_Quotation"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="signed-quotation-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationId) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
                            setSignedQuotationFile,
                            setSignedQuotationUrl,
                            setUploadingSignedQuotation,
                            setSignedQuotationError,
                            "documents/signed-quotations/",
                            quotationId,
                            "signedQuotation",
                          )
                        }
                      }
                    }}
                  />
                )}
                {!signedQuotationUrl && (
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
                    {uploadingSignedQuotation ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {signedQuotationError && <span className="text-xs text-red-500 ml-2">{signedQuotationError}</span>}
              </div>

              {/* Signed Contract */}
              <div className="flex items-center gap-2">
                {signedContractUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="signed-contract-radio"
                    name="project-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="signed-contract-radio" className="text-sm flex-1">
                  Signed Contract
                </Label>
                {signedContractUrl && (
                  <a
                    href={signedContractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {quotationData?.quotation?.projectCompliance?.signedContract?.fileName || "Signed_Contract"}
                  </a>
                )}
                <input
                  type="file"
                  id="signed-contract-upload"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      if (quotationId) {
                        handleFileUpload(
                          event.target.files[0],
                          "document",
                          setSignedContractFile,
                          setSignedContractUrl,
                          setUploadingSignedContract,
                          setSignedContractError,
                          "documents/signed-contracts/",
                          quotationId,
                          "signedContract",
                        )
                      }
                    }
                  }}
                />
                {!signedContractUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-transparent"
                    onClick={() => document.getElementById("signed-contract-upload")?.click()}
                    disabled={uploadingSignedContract}
                  >
                    {uploadingSignedContract ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {uploadingSignedContract ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {signedContractError && <span className="text-xs text-red-500 ml-2">{signedContractError}</span>}
              </div>

              {/* PO/MO */}
              <div className="flex items-center gap-2">
                {poMoUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="po-mo-radio"
                    name="project-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="po-mo-radio" className="text-sm flex-1">
                  Irrevocable PO
                </Label>
                {poMoUrl ? (
                  <a
                    href={poMoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {quotationData?.quotation?.projectCompliance?.irrevocablePo?.fileName || "PO_MO"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="po-mo-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationId) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
                            setPoMoFile,
                            setPoMoUrl,
                            setUploadingPoMo,
                            setPoMoError,
                            "documents/po-mo/",
                            quotationId,
                            "poMo",
                          )
                        }
                      }
                    }}
                  />
                )}
                {!poMoUrl && (
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
                    {uploadingPoMo ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {poMoError && <span className="text-xs text-red-500 ml-2">{poMoError}</span>}
              </div>

              {/* Final Artwork */}
              <div className="flex items-center gap-2">
                {finalArtworkUrl ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="final-artwork-radio"
                    name="project-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="final-artwork-radio" className="text-sm flex-1">
                  Final Artwork
                </Label>
                {finalArtworkUrl ? (
                  <a
                    href={finalArtworkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    {quotationData?.quotation?.projectCompliance?.finalArtwork?.fileName || "Final Artwork"}
                  </a>
                ) : (
                  <input
                    type="file"
                    id="final-artwork-upload"
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        const file = event.target.files[0]
                        const fileType = file.type.startsWith('image/') ? "image" : "document"
                        if (quotationId) {
                          handleFileUpload(
                            file,
                            fileType,
                            setFinalArtworkFile,
                            setFinalArtworkUrl,
                            setUploadingFinalArtwork,
                            setFinalArtworkError,
                            "documents/final-artwork/",
                            quotationId,
                            "finalArtwork",
                          )
                        }
                      }
                    }}
                  />
                )}
                {!finalArtworkUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-transparent"
                    onClick={() => document.getElementById("final-artwork-upload")?.click()}
                    disabled={uploadingFinalArtwork}
                  >
                    {uploadingFinalArtwork ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {uploadingFinalArtwork ? "Uploading..." : "Upload"}
                  </Button>
                )}
                {finalArtworkError && <span className="text-xs text-red-500 ml-2">{finalArtworkError}</span>}
              </div>

              {/* Payment as Deposit/Advance */}
              <div className="flex items-center gap-2">
                {paymentAdvanceConfirmed ? (
                  <CircleCheck className="h-4 w-4 text-white fill-green-500" />
                ) : (
                  <input
                    type="radio"
                    id="payment-advance-radio"
                    name="project-compliance"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={false}
                    readOnly
                  />
                )}
                <Label htmlFor="payment-advance-radio" className="text-sm flex-1">
                  Payment as Deposit/Advance
                </Label>
                <span className="text-xs text-gray-500">For Treasury's confirmation</span>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Job Order Forms */}
        <div className="space-y-4">
          {missingCompliance.dtiBir ||
            missingCompliance.gis ||
            missingCompliance.idSignature ||
            missingCompliance.signedQuotation ||
            missingCompliance.signedContract ||
            missingCompliance.poMo ||
            missingCompliance.finalArtwork ||
            missingCompliance.paymentAdvance ? (
            <Alert variant="destructive" className="bg-red-100 border-red-400 text-red-700 py-2 px-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700 text-xs">
                This client has some missing compliance requirements.
              </AlertTitle>
              <AlertDescription className="text-red-700 text-xs">
                <ul className="list-disc list-inside ml-2">
                  {missingCompliance.dtiBir && <li>- DTI/BIR 2303</li>}
                  {missingCompliance.gis && <li>- GIS</li>}
                  {missingCompliance.idSignature && <li>- ID with Signature</li>}
                  {missingCompliance.signedQuotation && <li>- Signed Quotation</li>}
                  {missingCompliance.signedContract && <li>- Signed Contract</li>}
                  {missingCompliance.poMo && <li>- Irrevocable PO</li>}
                  {missingCompliance.finalArtwork && <li>- Final Artwork</li>}
                  {missingCompliance.paymentAdvance && <li>- Payment as Deposit/Advance</li>}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-100 border-green-400 text-green-700 py-2 px-3">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 text-xs">
                All compliance requirements are met.
              </AlertTitle>
              <AlertDescription className="text-green-700 text-xs">
                All required documents have been uploaded successfully.
              </AlertDescription>
            </Alert>
          )}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center ">
              <p className="text-xs flex-1 font-bold text-blue-600">
                JO#
              </p>
              <h2 className="text-lg flex-1 font-bold text-gray-900 text-center">
                Job Order
              </h2>
              <p className="text-xs flex-1 font-bold text-blue-600 text-right">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-4 pt-6">


                <div className="flex items-center space-x-2">
                  <Label className="w-36 text-sm text-gray-800">JO Type</Label>
                  <Select
                    onValueChange={(value: JobOrderType) => {
                      handleFormUpdate(0, "joType", value)
                      handleFormUpdate(0, "joTypeError", false)
                    }}
                    value={jobOrderForms[0]?.joType}
                  >
                    <SelectTrigger
                      className={cn(
                        "flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                        jobOrderForms[0]?.joTypeError && "border-red-500 focus-visible:ring-red-500",
                      )}
                    >
                      <SelectValue placeholder="Choose JO Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {joTypeOptions.map((type) => (
                        <SelectItem key={type} value={type} className="text-sm">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="w-36 text-sm text-gray-800">Campaign Name</Label>
                  <Input
                    placeholder=""
                    value={jobOrderForms[0]?.campaignName || ""}
                    onChange={(e) => handleFormUpdate(0, "campaignName", e.target.value)}
                    className="flex-1 bg-white text-gray-800 border-gray-300 placeholder:text-gray-500 text-sm h-9"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="w-36 text-sm text-gray-800">Deadline</Label>
                  <div className="flex-1 flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "flex-1 justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
                            !jobOrderForms[0]?.deadline && "text-gray-500",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
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
                          disabled={{ before: new Date() }} // Disable past dates
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      className="w-24 h-9 text-xs bg-transparent"
                      onClick={() => setShowComingSoonDialog(true)}
                    >
                      Timeline
                    </Button>
                  </div>
                </div>

                {jobOrderForms[0]?.joType !== "Monitoring" && (
                  <div className="flex items-center space-x-2">
                    <Label className="w-36 text-sm text-gray-800">Material Spec</Label>
                    <Select
                      onValueChange={(value) => handleFormUpdate(0, "materialSpec", value)}
                      value={jobOrderForms[0]?.materialSpec}
                    >
                      <SelectTrigger className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9">
                        <SelectValue placeholder="Choose Material Spec" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialSpecOptions.map((spec) => (
                          <SelectItem key={spec} value={spec} className="text-sm">
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Combined Attachment Upload in Single Line */}
                <div className="flex items-start space-x-2">
                  <Label className="w-36 text-sm text-gray-800">Attachment</Label>
                </div>
                <div className="flex items-start space-x-2">

                  <div className="flex items-center align-center gap-4 flex-1">
                    {/* Final Artwork */}
                    <div className="flex flex-col items-center gap-2">
                      {finalArtworkUrl ? (
                        <div className="flex items-center gap-2">
                          {isImageFile(null, finalArtworkUrl) ? (
                            <div className="relative inline-block">
                              <Image
                                src={finalArtworkUrl}
                                alt="Final Artwork"
                                width={100}
                                height={100}
                                className="rounded-md object-cover shadow-md"
                              />
                              {jobOrderForms[0]?.joType === "Change Material" && (
                                <div className="absolute inset-0 flex items-start justify-start rounded-md">
                                  <span className="text-white font-bold italic text-[0.625rem] bg-gray-500 px-2">OLD</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <FileText className="h-20 w-20 text-blue-600" />
                              {jobOrderForms[0]?.joType === "Change Material" && (
                                <div className="absolute inset-0 flex items-start justify-start rounded-md">
                                  <span className="text-white font-bold italic text-[0.625rem] bg-gray-500 px-2">OLD</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                        </div>
                      ) : jobOrderForms[0]?.materialSpecAttachmentUrl ? (
                        <div className="flex items-center gap-2">
                          {isImageFile(jobOrderForms[0].materialSpecAttachmentFile?.name || null, jobOrderForms[0].materialSpecAttachmentUrl) ? (
                            <Image
                              src={jobOrderForms[0].materialSpecAttachmentUrl}
                              alt={jobOrderForms[0].materialSpecAttachmentFile?.name || "Attachment"}
                              width={50}
                              height={50}
                              className="rounded-md object-cover shadow-md"
                            />
                          ) : (
                            <>
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-xs text-blue-600">{jobOrderForms[0].materialSpecAttachmentFile?.name || "Attachment"}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id="material-spec-attachment-upload-0"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                handleMaterialSpecAttachmentUpload(0, event.target.files[0])
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            className="w-[100px] h-[100px] flex flex-col items-center justify-center bg-gray-300 border-2 border-gray-300 relative"
                          >

                            {jobOrderForms[0]?.uploadingMaterialSpecAttachment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ImageIcon  className="h-20 w-20 text-white" />
                            )}
                            {jobOrderForms[0]?.joType === "Change Material" && (
                              <div className="absolute inset-0 flex items-start justify-start rounded-md">
                                <span className="text-white font-bold italic text-[0.625rem] bg-gray-500 px-2">OLD</span>
                              </div>
                            )}
                            <span className="text-xs mt-1">
                              {jobOrderForms[0]?.uploadingMaterialSpecAttachment ? "Uploading..." : ""}
                            </span>
                          </Button>
                        </>
                      )}
                      {jobOrderForms[0]?.materialSpecAttachmentError && (
                        <p className="text-xs text-red-500">{jobOrderForms[0].materialSpecAttachmentError}</p>
                      )}
                    </div>
                    {jobOrderForms[0]?.joType === "Change Material" && (
                      <>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="h-[100px] w-[100px] text-gray-400" />
                        </div>

                        {/* new upload*/}
                        <div className="flex flex-col items-center gap-2">
                      <input
                        type="file"
                        id="attachment-upload-0"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files && event.target.files[0]) {
                            handleProductAttachmentUpload(0, event.target.files[0])
                          }
                        }}
                      />
                      {jobOrderForms[0]?.attachmentUrl ? (
                        <div className="flex items-center gap-2 relative">
                          {isImageFile(jobOrderForms[0].attachmentFile?.name || null, jobOrderForms[0].attachmentUrl) ? (
                            <Image
                              src={jobOrderForms[0].attachmentUrl}
                              alt={jobOrderForms[0].attachmentFile?.name || "Attachment"}
                              width={100}
                              height={100}
                              className="rounded-md object-cover shadow-md"
                            />
                          ) : (
                            <>
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-xs text-blue-600">{jobOrderForms[0].attachmentFile?.name || "Attachment"}</span>
                            </>
                          )}
                          <div className="absolute inset-0 flex items-start justify-start rounded-md">
                            <span className="text-white font-bold italic text-[0.625rem] bg-gray-500 px-2">NEW</span>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-[100px] h-[100px] flex flex-col items-center justify-center bg-gray-300 border-2 border-gray-300 relative"
                          onClick={() => document.getElementById("attachment-upload-0")?.click()}
                          disabled={jobOrderForms[0]?.uploadingAttachment}
                        >
                          {jobOrderForms[0]?.uploadingAttachment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-20 w-20 text-white" />
                          )}
                          <div className="absolute inset-0 flex items-start justify-start rounded-md">
                            <span className="text-white font-bold italic text-[0.625rem] bg-gray-500 px-2">NEW</span>
                          </div>
                          <span className="text-xs mt-1">
                            {jobOrderForms[0]?.uploadingAttachment ? "Uploading..." : ""}
                          </span>
                        </Button>
                      )}
                      {jobOrderForms[0]?.attachmentError && (
                        <p className="text-xs text-red-500">{jobOrderForms[0].attachmentError}</p>
                      )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Label className="w-36 text-sm text-gray-800">Remarks</Label>
                  <Input
                    placeholder="Remarks..."
                    value={jobOrderForms[0]?.remarks || ""}
                    onChange={(e) => handleFormUpdate(0, "remarks", e.target.value)}
                    className="flex-1 bg-white text-gray-800 border-gray-300 placeholder:text-gray-500 text-sm h-9"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="w-36 text-sm text-gray-800">Requested By</Label>
                  <Input
                    value={`${userData?.first_name} ${userData?.last_name}` || "(Auto-Generated)"}
                    disabled
                    className="flex-1 bg-gray-100 text-gray-600 text-sm h-9"
                  />
                </div>

              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              This Job Order will be forwarded to your Logistics Team.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 justify-end">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={isSubmitting}
                className="bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateJobOrders("draft")}
                disabled={isSubmitting}
                className="bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleCreateJobOrders("pending")}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Create JO
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* Coming Soon Dialog */}
      <ComingSoonDialog isOpen={showComingSoonDialog} onClose={() => setShowComingSoonDialog(false)} feature="Timeline" />

      {/* Compliance Confirmation Dialog */}
      <ComplianceConfirmationDialog
        isOpen={showComplianceDialog}
        onClose={() => setShowComplianceDialog(false)}
        onSkip={() => {
          if (pendingJobOrderStatus) {
            createJobOrdersWithStatus(pendingJobOrderStatus)
          }
          setShowComplianceDialog(false)
        }}
        complianceItems={[
          { name: "Signed Quotation", completed: !missingCompliance.signedQuotation, type: "upload" },
          { name: "Signed Contract", completed: !missingCompliance.signedContract, type: "upload" },
          { name: "Irrevocable PO", completed: !missingCompliance.poMo, type: "upload" },
          { name: "Final Artwork", completed: !missingCompliance.finalArtwork, type: "upload" },
          { name: "Payment as Deposit/Advance", completed: !missingCompliance.paymentAdvance, type: "confirmation" },
        ]}
      />
    </div>
  )
}
