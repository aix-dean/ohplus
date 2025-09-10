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
  CircleCheck 
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
import { updateQuotation } from "@/lib/quotation-service" // Import updateQuotation
import type { QuotationProduct } from "@/lib/types/quotation" // Corrected import for QuotationProduct
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import type { JobOrderType, JobOrderStatus } from "@/lib/types/job-order"
import type { Quotation, ProjectComplianceItem } from "@/lib/types/quotation" // Import ProjectComplianceItem
import type { Product } from "@/lib/firebase-service"
import { type Client, updateClient, updateClientCompany, type ClientCompany, getClientCompanyById } from "@/lib/client-service" // Import updateClient, updateClientCompany, ClientCompany, and getClientCompanyById
import { cn } from "@/lib/utils"
import { JobOrderCreatedSuccessDialog } from "@/components/job-order-created-success-dialog"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"

const joTypes = ["Installation", "Maintenance", "Repair", "Dismantling", "Other"]

interface JobOrderFormData {
  joType: JobOrderType | ""
  dateRequested: Date | undefined
  deadline: Date | undefined
  campaignName: string // Added campaign name
  remarks: string
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

  // Success dialog states
  const [showJobOrderSuccessDialog, setShowJobOrderSuccessDialog] = useState(false)
  const [createdJoIds, setCreatedJoIds] = useState<string[]>([])

  // Coming soon dialog state
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false)


  // Calculate derived values using useMemo - these will always be called


  const missingCompliance = useMemo(() => {
    const projectCompliance = quotationData?.quotation?.projectCompliance
    return {
      dtiBir: !dtiBirUrl && !quotationData?.client?.compliance?.dti,
      gis: !gisUrl && !quotationData?.client?.compliance?.gis,
      idSignature: !idSignatureUrl && !quotationData?.client?.compliance?.id,
      signedQuotation: !signedQuotationUrl && !(projectCompliance?.signedQuotation?.fileUrl || projectCompliance?.signedQuotation?.status === "completed"),
      signedContract: !signedContractUrl && !projectCompliance?.signedContract?.fileUrl,
      poMo: !poMoUrl && !projectCompliance?.poMo?.fileUrl,
      finalArtwork: !finalArtworkUrl && !projectCompliance?.finalArtwork?.fileUrl,
      paymentAdvance: !paymentAdvanceConfirmed && !(projectCompliance?.paymentAsDeposit?.completed),
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
        if (quotationId && fieldToUpdate && (fieldToUpdate === "signedQuotation" || fieldToUpdate === "signedContract" || fieldToUpdate === "poMo" || fieldToUpdate === "finalArtwork" || fieldToUpdate === "paymentAsDeposit" )) {
          console.log("handleFileUpload: Attempting to update project compliance for quotation.");
          console.log("handleFileUpload: quotationId:", quotationId);
          console.log("handleFileUpload: fieldToUpdate:", fieldToUpdate);
          // Handle project compliance updates for the quotation document
          let projectComplianceFieldKey:
            | "signedQuotation"
            | "signedContract"
            | "poMo"
            | "finalArtwork"
            | "paymentAsDeposit"
            | undefined;

          if (fieldToUpdate === "signedQuotation") {
            projectComplianceFieldKey = "signedQuotation"
          } else if (fieldToUpdate === "signedContract") {
            projectComplianceFieldKey = "signedContract"
          } else if (fieldToUpdate === "poMo") {
            projectComplianceFieldKey = "poMo"
          } else if (fieldToUpdate === "finalArtwork") {
            projectComplianceFieldKey = "finalArtwork"
          } else if (fieldToUpdate === "paymentAsDeposit") {
            projectComplianceFieldKey = "paymentAsDeposit"
          }

          if (projectComplianceFieldKey) {
            // Get the current project compliance from quotation data or use empty object with proper typing
            const currentProjectCompliance = quotationData?.quotation?.projectCompliance || {
              finalArtwork: {
                completed: false,
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              paymentAsDeposit: {
                completed: false,
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              poMo: {
                completed: false,
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              signedContract: {
                completed: false,
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: null,
                uploadedBy: null,
                status: "pending"
              },
              signedQuotation: {
                completed: false,
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

            await updateQuotation(
              quotationId,
              {
                projectCompliance: {
                  ...currentProjectCompliance, // Spread the fully initialized object
                  [projectComplianceFieldKey]: {
                    // Preserve existing field data if it exists, otherwise create new object with defaults
                    ...(existingFieldData || {
                      completed: false,
                      fileName: null,
                      fileUrl: null,
                      notes: null,
                      uploadedAt: null,
                      uploadedBy: null,
                      status: "pending"
                    }),
                    completed: true,
                    fileName: file.name,
                    fileUrl: downloadURL,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: user?.uid || null,
                    ...(projectComplianceFieldKey === "signedQuotation" && { status: "completed" }), // Add status for signedQuotation
                  },
                },
              },
              user?.uid || "unknown",
              userData?.first_name || "System",
            )
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

      const quotation = quotationData.quotation
      const products = quotationData.products
      const client = quotationData.client

      try {
        let jobOrdersData = []

        // Single product from quotation object
        const form = jobOrderForms[0]
        const product = products[0] || {}

        const contractDuration = totalDays > 0 ? `(${totalDays} days)` : "N/A" // Use totalDays

        const subtotal = quotation.total_amount || 0 // Use total_amount for single product
        const productVat = subtotal * 0.12 // Recalculate VAT
        const productTotal = subtotal + productVat // Recalculate total

        jobOrdersData = [
          {
            quotationId: quotation.id,
            joNumber: await generatePersonalizedJONumber(userData), // Replace hardcoded "JO-AUTO-GEN" with personalized number
            dateRequested: form.dateRequested!.toISOString(),
            joType: form.joType as JobOrderType,
            deadline: form.deadline!.toISOString(),
            campaignName: form.campaignName, // Added campaign name
            requestedBy: userData?.first_name || "Auto-Generated",
            remarks: form.remarks,
            attachments: form.attachmentUrl
              ? [
                  {
                    url: form.attachmentUrl,
                    name: form.attachmentFile?.name || "Attachment",
                    type: form.attachmentFile?.type || "image",
                  },
                ]
              : [],
            dtiBirUrl: dtiBirUrl, // Added client compliance
            gisUrl: gisUrl, // Added client compliance
            idSignatureUrl: idSignatureUrl, // Added client compliance
            quotationNumber: quotation.quotation_number,
            clientName: client?.name || "N/A",
            clientCompany: client?.name || "N/A", // Changed from client?.company to client?.name
            contractDuration: contractDuration, // Use new contractDuration
            contractPeriodStart: quotation.start_date || "",
            contractPeriodEnd: quotation.end_date || "",
            siteName: product.name || "", // Get from product
            siteCode: product.site_code || "N/A", // Get from product
            siteType: product.type || "N/A",
            siteSize:
              (product.specs_rental?.width && product.specs_rental?.height
                ? `${product.specs_rental.width}x${product.specs_rental.height}ft`
                : "N/A") || "N/A", // Corrected siteSize
            siteIllumination: product.light?.illumination_status || "N/A", // Corrected siteIllumination
            leaseRatePerMonth:
              quotation.duration_days && quotation.duration_days > 0
                ? subtotal / (quotation.duration_days / 30)
                : 0, // Corrected monthlyRate
            totalMonths: totalDays, // This might still be relevant for other calculations, but not for totalLease directly
            totalLease: subtotal, // totalLease is now the subtotal
            vatAmount: productVat, // Use recalculated VAT
            totalAmount: productTotal, // Use recalculated total
            siteImageUrl: product.media?.[0]?.url || "/placeholder.svg?height=48&width=48",
            missingCompliance: missingCompliance,
            product_id: quotation.product_id || product.id || "",
            company_id: userData?.company_id || "",
            created_by: user.uid, // Added created_by
            projectCompliance: { // Construct projectCompliance object
              signedQuotation: {
                completed: !!signedQuotationUrl,
                fileName: signedQuotationFile?.name || null,
                fileUrl: signedQuotationUrl,
                notes: null,
                uploadedAt: signedQuotationUrl ? new Date().toISOString() : null,
                uploadedBy: user?.uid || null,
                status: (signedQuotationUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              signedContract: {
                completed: !!signedContractUrl,
                fileName: signedContractFile?.name || null,
                fileUrl: signedContractUrl,
                notes: null,
                uploadedAt: signedContractUrl ? new Date().toISOString() : null,
                uploadedBy: user?.uid || null,
                status: (signedContractUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              poMo: {
                completed: !!poMoUrl,
                fileName: poMoFile?.name || null,
                fileUrl: poMoUrl,
                notes: null,
                uploadedAt: poMoUrl ? new Date().toISOString() : null,
                uploadedBy: user?.uid || null,
                status: (poMoUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              finalArtwork: {
                completed: !!finalArtworkUrl,
                fileName: finalArtworkFile?.name || null,
                fileUrl: finalArtworkUrl,
                notes: null,
                uploadedAt: finalArtworkUrl ? new Date().toISOString() : null,
                uploadedBy: user?.uid || null,
                status: (finalArtworkUrl ? "completed" : "pending") as "pending" | "completed" | "uploaded",
              },
              paymentAsDeposit: {
                completed: paymentAdvanceConfirmed,
                fileName: null,
                fileUrl: null,
                notes: null,
                uploadedAt: paymentAdvanceConfirmed ? new Date().toISOString() : null,
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
            if (projectCompliance.poMo?.fileUrl) {
              setPoMoUrl(projectCompliance.poMo.fileUrl)
            }
            if (projectCompliance.finalArtwork?.fileUrl) {
              setFinalArtworkUrl(projectCompliance.finalArtwork.fileUrl)
            }
            if (projectCompliance.paymentAsDeposit?.completed) {
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
          joType: "",
          dateRequested: new Date(),
          deadline: undefined,
          campaignName: quotationData.quotation?.campaignId || "", // Initialize with quotation campaignId
          remarks: "",
          attachmentFile: null,
          attachmentUrl: null,
          uploadingAttachment: false,
          attachmentError: null,
          joTypeError: false,
          dateRequestedError: false,
        },
      ]
      setJobOrderForms(initialForms)
    }
  }, [quotationData, userData?.uid])

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
        <h1 className="text-2xl font-bold text-gray-900">Create Job Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {/* Left Column: Booking Information */}
        <div className="space-y-6 lg:border-r lg:border-gray-200 lg:pr-8">
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
                <span className="font-semibold">Client Name:</span> {client?.name || "N/A"}
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
              <p className="text-sm font-semibold">Site:</p>
              <div className="space-y-2">
                {productTotals.map((productTotal, index) => {
                  const item = quotation
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
              <div>
                <p className="text-sm">
                  <span className="font-semibold">Subtotal:</span> {formatCurrency(productTotals[0].subtotal)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">12% VAT:</span> {formatCurrency(productTotals[0].vat)}
                </p>
                <p className="font-bold text-lg mt-1">TOTAL: {formatCurrency(productTotals[0].total)}</p>
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
                    DTI/BIR 2303
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
                    JMCL GIS.pdf
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
                    Jalvin_Castro_PRC.pdf
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
                  <CircleCheck  className="h-4 w-4 text-white fill-green-500" />
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
                    Signed_Quotation
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
                  <CircleCheck  className="h-4 w-4 text-white fill-green-500" />
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
                    Signed_Contract
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
                  <CircleCheck  className="h-4 w-4 text-white fill-green-500" />
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
                  PO/MO
                </Label>
                {poMoUrl ? (
                  <a
                    href={poMoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                  >
                    PO_MO
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
                  <CircleCheck  className="h-4 w-4 text-white fill-green-500" />
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
                    FinalArtwork
                  </a>
                ) : (
                  <input
                    type="file"
                    id="final-artwork-upload"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        if (quotationId) {
                          handleFileUpload(
                            event.target.files[0],
                            "document",
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
                  <CircleCheck  className="h-4 w-4 text-white fill-green-500" />
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
              <AlertTitle className="text-red-700 text-sm">
                This client has some missing project compliance requirements.
              </AlertTitle>
              <AlertDescription className="text-red-700 text-xs">
                <ul className="list-disc list-inside ml-2">
                  {missingCompliance.signedQuotation && <li>- Signed Quotation</li>}
                  {missingCompliance.signedContract && <li>- Signed Contract</li>}
                  {missingCompliance.poMo && <li>- PO/MO</li>}
                  {missingCompliance.finalArtwork && <li>- Final Artwork</li>}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <h2 className="text-lg font-bold text-gray-900">
            Job Order
          </h2>

          <div className="space-y-4">
            <div className="space-y-4 pt-6">
              {/* Same form fields as in the tabs, but without the card header */}
              <div className="flex items-center space-x-2">
                <Label className="w-36 text-sm text-gray-800">JO #</Label>
                <Input value="(Auto-Generated)" disabled className="flex-1 bg-gray-100 text-gray-600 text-sm h-9" />
              </div>

              <div className="flex items-center space-x-2">
                <Label className="w-36 text-sm text-gray-800">Campaign Name</Label>
                <Input
                  placeholder="Fantastic 4"
                  value={jobOrderForms[0]?.campaignName || ""}
                  onChange={(e) => handleFormUpdate(0, "campaignName", e.target.value)}
                  className="flex-1 bg-white text-gray-800 border-gray-300 placeholder:text-gray-500 text-sm h-9"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label className="w-36 text-sm text-gray-800">Date Requested</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm h-9",
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
                      // Removed initialFocus to ensure it opens to the selected date
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
                    {joTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-sm">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="flex items-center space-x-2">
                <Label className="w-36 text-sm text-gray-800">Requested By</Label>
                <Input
                  value={userData?.first_name || "(Auto-Generated)"}
                  disabled
                  className="flex-1 bg-gray-100 text-gray-600 text-sm h-9"
                />
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

              {/* Material Preview */}
              <div className="flex items-start space-x-2">
                <Label className="w-36 text-sm text-gray-800">Material Preview</Label>
                {jobOrderForms[0]?.attachmentUrl ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={jobOrderForms[0].attachmentUrl}
                      alt="Material Preview"
                      layout="fill"
                      objectFit="cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-4 w-4 text-white bg-black/50 hover:bg-black/70"
                      onClick={() => {
                        handleFormUpdate(0, "attachmentUrl", null)
                        handleFormUpdate(0, "attachmentFile", null)
                      }}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
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
                )}
                {!jobOrderForms[0]?.attachmentUrl && (
                  <Button
                    variant="outline"
                    className="w-12 h-12 flex flex-col items-center justify-center text-gray-500 border-dashed border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                    onClick={() => document.getElementById("attachment-upload-0")?.click()}
                    disabled={jobOrderForms[0]?.uploadingAttachment}
                  >
                    {jobOrderForms[0]?.uploadingAttachment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span className="text-xs mt-1">
                      {jobOrderForms[0]?.uploadingAttachment ? "Uploading..." : "Upload"}
                    </span>
                  </Button>
                )}
                {jobOrderForms[0]?.attachmentError && (
                  <p className="text-xs text-red-500 mt-1">{jobOrderForms[0].attachmentError}</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            This Job Order will be forwarded to your Logistics Team.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 justify-center">
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
              Create Job Order
            </Button>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <JobOrderCreatedSuccessDialog
        isOpen={showJobOrderSuccessDialog}
        onClose={handleDismissAndNavigate}
        joIds={createdJoIds}
        isMultiple={false}
      />

      {/* Coming Soon Dialog */}
      <ComingSoonDialog isOpen={showComingSoonDialog} onClose={() => setShowComingSoonDialog(false)} feature="Timeline" />
    </div>
  )
}
