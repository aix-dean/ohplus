"use client"

import type React from "react"
import Image from "next/image"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Video, Loader2, ArrowLeft, Printer, Download, PlusCircle, X, Calendar } from "lucide-react"
import { format } from "date-fns"
import type { Product } from "@/lib/firebase-service"
import type { JobOrder } from "@/lib/types/job-order" // Import JobOrder type
import { teamsService } from "@/lib/teams-service"
import type { Team } from "@/lib/types/team"
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ServiceAssignmentSuccessDialog } from "@/components/service-assignment-success-dialog"

import { generateServiceAssignmentPDF } from "@/lib/pdf-service"
import { TeamFormDialog } from "@/components/team-form-dialog"
import { JobOrderListDialog } from "@/components/job-order-list-dialog"


// Service types as provided
const SERVICE_TYPES = ["Roll up", "Roll down", "Change Material", "Repair", "Maintenance", "Monitoring", "Spot Booking"]

export default function CreateServiceAssignmentPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProjectSite = searchParams.get("projectSite")
  const jobOrderId = searchParams.get("jobOrderId") // Get jobOrderId from query params

  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [saNumber, setSaNumber] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdSaNumber, setCreatedSaNumber] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isJobOrderListDialogOpen, setIsJobOrderListDialogOpen] = useState(false) // State for JobOrderListDialog
  const [jobOrderData, setJobOrderData] = useState<JobOrder | null>(null) // State to store fetched job order

  const [teams, setTeams] = useState<Team[]>([])

  const [loadingTeams, setLoadingTeams] = useState(true)
  const [isNewTeamDialogOpen, setIsNewTeamDialogOpen] = useState(false)


  // Form data state
  const [formData, setFormData] = useState({
    projectSite: initialProjectSite || "",
    serviceType: "",
    assignedTo: "",
    serviceDuration: "",
    priority: "",
    equipmentRequired: "",
    materialSpecs: "",
    crew: "",
    illuminationNits: "",
    gondola: "",
    technology: "",
    sales: "",
    remarks: "",
    message: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    alarmDate: null as Date | null,
    alarmTime: "",
    attachments: [] as { name: string; type: string; file?: File }[],
    // Add service cost fields
    serviceCost: {
      crewFee: "",
      overtimeFee: "",
      transpo: "",
      tollFee: "",
      mealAllowance: "",
      otherFees: [] as { name: string; amount: string }[],
      total: 0,
    },
  })

  // Date input strings for direct input
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")
  const [alarmDateInput, setAlarmDateInput] = useState("")

  // Generate a random SA number on mount
  useEffect(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    setSaNumber(randomNum.toString())
  }, [])

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFetchingProducts(true)
        const productsRef = collection(db, "products")
        const q = query(productsRef, where("deleted", "==", false), orderBy("name", "asc"), limit(100))
        const querySnapshot = await getDocs(q)

        const fetchedProducts: Product[] = []
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as Product)
        })

        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setFetchingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true)
        const teamsData = await teamsService.getAllTeams()
        // Filter only active teams
        const activeTeams = teamsData.filter((team) => team.status === "active")
        setTeams(activeTeams)
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoadingTeams(false)
      }
    }

    fetchTeams()
  }, [])

  // Load draft data if editing
  useEffect(() => {
    const loadDraft = async () => {
      const draftParam = searchParams.get("draft")
      if (draftParam) {
        try {
          setDraftId(draftParam)
          const draftDoc = await getDoc(doc(db, "service_assignments", draftParam))

          if (draftDoc.exists()) {
            const draftData = draftDoc.data()
            setIsEditingDraft(true)

            // Load the draft data into form
            setFormData({
              projectSite: draftData.projectSiteId || "",
              serviceType: draftData.serviceType || "",
              assignedTo: draftData.assignedTo || "",
              serviceDuration: draftData.serviceDuration || "",
              priority: draftData.priority || "",
              equipmentRequired: draftData.equipmentRequired || "",
              materialSpecs: draftData.materialSpecs || "",
              crew: draftData.crew || "",
              illuminationNits: draftData.illuminationNits || "",
              gondola: draftData.gondola || "",
              technology: draftData.technology || "",
              sales: draftData.sales || "",
              remarks: draftData.remarks || "",
              message: draftData.message || "",
              startDate: draftData.coveredDateStart?.toDate() || null,
              endDate: draftData.coveredDateEnd?.toDate() || null,
              alarmDate: draftData.alarmDate?.toDate() || null,
              alarmTime: draftData.alarmTime || "",
              attachments: draftData.attachments || [],
              serviceCost: draftData.serviceCost || {
                crewFee: "",
                overtimeFee: "",
                transpo: "",
                tollFee: "",
                mealAllowance: "",
                otherFees: [],
                total: 0,
              },
            })

            // Set the SA number from draft
            setSaNumber(draftData.saNumber || "")

            // Set date inputs
            if (draftData.coveredDateStart) {
              setStartDateInput(format(draftData.coveredDateStart.toDate(), "yyyy-MM-dd"))
            }
            if (draftData.coveredDateEnd) {
              setEndDateInput(format(draftData.coveredDateEnd.toDate(), "yyyy-MM-dd"))
            }
            if (draftData.alarmDate) {
              setAlarmDateInput(format(draftData.alarmDate.toDate(), "yyyy-MM-dd"))
            }
          }
        } catch (error) {
          console.error("Error loading draft:", error)
          alert("Error loading draft")
        }
      }
    }

    loadDraft()
  }, [searchParams])

  // Fetch job order data if jobOrderId is present
  useEffect(() => {
    const fetchJobOrder = async () => {
      if (jobOrderId) {
        try {
          const jobOrderDoc = await getDoc(doc(db, "job_orders", jobOrderId))
          if (jobOrderDoc.exists()) {
            const fetchedJobOrder = { id: jobOrderDoc.id, ...jobOrderDoc.data() } as JobOrder
            setJobOrderData(fetchedJobOrder)

            // Pre-fill form fields from job order
            setFormData((prev) => ({
              ...prev,
              projectSite: fetchedJobOrder.product_id || "",
              serviceType: fetchedJobOrder.joType || "",
              remarks: fetchedJobOrder.remarks || "",
              message: fetchedJobOrder.message || "",
              startDate: fetchedJobOrder.dateRequested ? new Date(fetchedJobOrder.dateRequested) : null,
              endDate: fetchedJobOrder.deadline ? new Date(fetchedJobOrder.deadline) : null,
              // You might want to pre-fill other fields like assignedTo, crew, etc.
            }))

            if (fetchedJobOrder.dateRequested) {
              setStartDateInput(format(new Date(fetchedJobOrder.dateRequested), "yyyy-MM-dd"))
            }
            if (fetchedJobOrder.deadline) {
              setEndDateInput(format(new Date(fetchedJobOrder.deadline), "yyyy-MM-dd"))
            }
          }
        } catch (error) {
          console.error("Error fetching job order for pre-fill:", error)
        }
      }
    }
    fetchJobOrder()
  }, [jobOrderId]) // Rerun when jobOrderId changes

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle date input changes and convert to Date objects
  const handleDateInputChange = (type: "start" | "end" | "alarm", value: string) => {
    try {
      // Only attempt to parse if we have a value
      if (value) {
        const date = new Date(value)

        // Check if date is valid
        if (!isNaN(date.getTime())) {
          if (type === "start") {
            setStartDateInput(value)
            handleInputChange("startDate", date)
          } else if (type === "end") {
            setEndDateInput(value)
            handleInputChange("endDate", date)
          } else if (type === "alarm") {
            setAlarmDateInput(value)
            handleInputChange("alarmDate", date)
          }
        }
      } else {
        // If input is cleared, clear the date
        if (type === "start") {
          setStartDateInput("")
          handleInputChange("startDate", null)
        } else if (type === "end") {
          setEndDateInput("")
          handleInputChange("endDate", null)
        } else if (type === "alarm") {
          setAlarmDateInput("")
          handleInputChange("alarmDate", null)
        }
      }
    } catch (error) {
      console.error(`Error parsing date for ${type}:`, error)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: { name: string; type: string; file: File }[] = []

    Array.from(files).forEach((file) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }

      newAttachments.push({
        name: file.name,
        type: file.type,
        file: file,
      })
    })

    if (newAttachments.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }))
    }

    // Reset the input
    event.target.value = ""
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  // Convert attachments to Firestore-compatible format
  const convertAttachmentsForFirestore = (attachments: { name: string; type: string; file?: File }[]) => {
    return attachments.map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      // Remove the file object as it's not serializable
      size: attachment.file?.size || 0,
      lastModified: attachment.file?.lastModified || Date.now(),
    }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return

    try {
      setLoading(true)
      const selectedProduct = products.find((p) => p.id === formData.projectSite)

      const assignmentData = {
        saNumber,
        projectSiteId: formData.projectSite,
        projectSiteName: selectedProduct?.name || "",
        projectSiteLocation: selectedProduct?.light?.location || selectedProduct?.specs_rental?.location || "",
        serviceType: formData.serviceType,
        assignedTo: formData.assignedTo,
        serviceDuration: formData.serviceDuration,
        priority: formData.priority,
        equipmentRequired: formData.equipmentRequired,
        materialSpecs: formData.materialSpecs,
        crew: formData.crew,
        illuminationNits: formData.illuminationNits,
        gondola: formData.gondola,
        technology: formData.technology,
        sales: formData.sales,
        remarks: formData.remarks,
        requestedBy: {
          id: user.uid,
          name: user.displayName || "Unknown User",
          department: "LOGISTICS",
        },
        message: formData.message,
        coveredDateStart: formData.startDate,
        coveredDateEnd: formData.endDate,
        alarmDate: formData.alarmDate,
        alarmTime: formData.alarmTime,
        attachments: convertAttachmentsForFirestore(formData.attachments),
        serviceCost: formData.serviceCost,
        status: "Pending", // Always set to Pending when submitting
        updated: serverTimestamp(),
        project_key: userData?.license_key || "",
        company_id: userData?.company_id || null,
      }

      if (isEditingDraft && draftId) {
        // Update existing draft to pending
        await updateDoc(doc(db, "service_assignments", draftId), assignmentData)
      } else {
        // Create new assignment
        await addDoc(collection(db, "service_assignments"), {
          ...assignmentData,
          created: serverTimestamp(),
        })
      }

      // Show success dialog
      setCreatedSaNumber(saNumber)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error creating service assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  // Add this new function after the handleSubmit function
  const handleSaveDraft = async () => {
    if (!user) return

    try {
      setLoading(true)
      const selectedProduct = products.find((p) => p.id === formData.projectSite)

      const draftData = {
        saNumber,
        projectSiteId: formData.projectSite,
        projectSiteName: selectedProduct?.name || "",
        projectSiteLocation: selectedProduct?.light?.location || selectedProduct?.specs_rental?.location || "",
        serviceType: formData.serviceType,
        assignedTo: formData.assignedTo,
        serviceDuration: formData.serviceDuration,
        priority: formData.priority,
        equipmentRequired: formData.equipmentRequired,
        materialSpecs: formData.materialSpecs,
        crew: formData.crew,
        illuminationNits: formData.illuminationNits,
        gondola: formData.gondola,
        technology: formData.technology,
        sales: formData.sales,
        remarks: formData.remarks,
        requestedBy: {
          id: user.uid,
          name: user.displayName || "Unknown User",
          department: "LOGISTICS",
        },
        message: formData.message,
        coveredDateStart: formData.startDate,
        coveredDateEnd: formData.endDate,
        alarmDate: formData.alarmDate,
        alarmTime: formData.alarmTime,
        attachments: convertAttachmentsForFirestore(formData.attachments),
        serviceCost: formData.serviceCost,
        status: "Draft",
        updated: serverTimestamp(),
        project_key: userData?.license_key || "",
        company_id: userData?.company_id || null,
      }

      if (isEditingDraft && draftId) {
        // Update existing draft
        await updateDoc(doc(db, "service_assignments", draftId), draftData)
        alert("Draft updated successfully!")
      } else {
        // Create new draft
        await addDoc(collection(db, "service_assignments"), {
          ...draftData,
          created: serverTimestamp(),
        })
        alert("Service assignment saved as draft successfully!")
      }

      router.push("/logistics/assignments")
    } catch (error) {
      console.error("Error saving draft:", error)
      alert("Error saving draft. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Generate time options
  const timeOptions = useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      options.push({
        value: `${hour}:00`,
        label: `${hour.toString().padStart(2, "0")}:00`,
      })
    }
    return options
  }, [])

  // Calculate service cost total
  const calculateServiceCostTotal = () => {
    const { crewFee, overtimeFee, transpo, tollFee, mealAllowance, otherFees } = formData.serviceCost
    const mainTotal = [crewFee, overtimeFee, transpo, tollFee, mealAllowance].reduce(
      (sum, fee) => sum + (Number.parseFloat(fee) || 0),
      0,
    )
    const otherTotal = otherFees.reduce((sum, fee) => sum + (Number.parseFloat(fee.amount) || 0), 0)
    return mainTotal + otherTotal
  }

  // Handle service cost field changes
  const handleServiceCostChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceCost: {
        ...prev.serviceCost,
        [field]: value,
        total: field === "total" ? Number.parseFloat(value) || 0 : calculateServiceCostTotal(),
      },
    }))
  }

  // Add other fee
  const addOtherFee = () => {
    setFormData((prev) => ({
      ...prev,
      serviceCost: {
        ...prev.serviceCost,
        otherFees: [...prev.serviceCost.otherFees, { name: "", amount: "" }],
      },
    }))
  }

  // Remove other fee
  const removeOtherFee = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceCost: {
        ...prev.serviceCost,
        otherFees: prev.serviceCost.otherFees.filter((_, i) => i !== index),
      },
    }))
  }

  // Update other fee
  const updateOtherFee = (index: number, field: "name" | "amount", value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceCost: {
        ...prev.serviceCost,
        otherFees: prev.serviceCost.otherFees.map((fee, i) => (i === index ? { ...fee, [field]: value } : fee)),
      },
    }))
  }

  // Format date for display
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return ""
    try {
      return format(date, "PPP")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Handle success dialog actions
  const handleViewAssignments = () => {
    router.push("/logistics/assignments")
  }

  const handleCreateAnother = () => {
    // Reset form
    setFormData({
      projectSite: "",
      serviceType: "",
      assignedTo: "",
      serviceDuration: "",
      priority: "",
      equipmentRequired: "",
      materialSpecs: "",
      crew: "",
      illuminationNits: "",
      gondola: "",
      technology: "",
      sales: "",
      remarks: "",
      message: "",
      startDate: null,
      endDate: null,
      alarmDate: null,
      alarmTime: "",
      attachments: [],
      serviceCost: {
        crewFee: "",
        overtimeFee: "",
        transpo: "",
        tollFee: "",
        mealAllowance: "",
        otherFees: [],
        total: 0,
      },
    })
    setStartDateInput("")
    setEndDateInput("")
    setAlarmDateInput("")

    // Generate new SA number
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    setSaNumber(randomNum.toString())
  }

  // Handle PDF generation and print/download
  const handleGeneratePDF = async (action: "print" | "download") => {
    try {
      setGeneratingPDF(true)

      // Create service assignment data structure for PDF
      const selectedProduct = products.find((p) => p.id === formData.projectSite)
      const serviceAssignmentData = {
        saNumber,
        projectSiteName: selectedProduct?.name || "",
        projectSiteLocation: selectedProduct?.light?.location || selectedProduct?.specs_rental?.location || "",
        serviceType: formData.serviceType,
        assignedTo: formData.assignedTo,
        serviceDuration: formData.serviceDuration,
        priority: formData.priority,
        equipmentRequired: formData.equipmentRequired,
        materialSpecs: formData.materialSpecs,
        crew: formData.crew,
        illuminationNits: formData.illuminationNits,
        gondola: formData.gondola,
        technology: formData.technology,
        sales: formData.sales,
        remarks: formData.remarks,
        requestedBy: {
          name:
            userData?.first_name && userData?.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : user?.displayName || "Unknown User",
          department: "LOGISTICS",
        },
        startDate: formData.startDate,
        endDate: formData.endDate,
        alarmDate: formData.alarmDate,
        alarmTime: formData.alarmTime,
        attachments: formData.attachments,
        serviceCost: {
          ...formData.serviceCost,
          total: calculateServiceCostTotal(),
        },
        status: "Draft",
        created: new Date(),
      }

      if (action === "print") {
        // Generate PDF and open in new window for printing
        await generateServiceAssignmentPDF(serviceAssignmentData, false)
      } else {
        // Download PDF
        await generateServiceAssignmentPDF(serviceAssignmentData, false)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      // You could add a toast notification here
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleCrewChange = (value: string) => {
    if (value === "add-new-team") {
      setIsNewTeamDialogOpen(true)
    } else {
      handleInputChange("crew", value)
    }
  }

  if (fetchingProducts) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
<section className="p-8 bg-white">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/logistics/assignments" className="text-gray-800 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold ml-3">Create Service Assignment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Service Assignment Details Card */}
        <Card className="shadow-sm border-none p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase">SERVICE ASSIGNMENT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-xs">
            {/* SA Number and Dates */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-600">SA#: {saNumber}</span>
              <span className="text-blue-600">
                {format(new Date(), "MMM d, yyyy")}
              </span>
            </div>

            {/* Project Site (Product) */}
            <div className="flex items-center gap-4 border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src="/images/placeholder.png"
                  alt="Product"
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">NAN20011</p>
                <p className="font-semibold text-gray-800">Petplans NB</p>
              </div>
            </div>

            {/* JO# and Date */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-blue-600">JO#: {jobOrderData?.joNumber || "00372"}</span>
              <span className="text-blue-600">
                {jobOrderData?.dateRequested ? format(new Date(jobOrderData.dateRequested), "MMM d, yyyy") : "Sep 5, 2025"}
              </span>
            </div>

            {/* Fields */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Service Type:</span>
                <span className="text-gray-600">{formData.serviceType || "Roll Up"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Campaign Name:</span>
                <span className="text-gray-600">{jobOrderData?.campaignName || "Fantastic 4"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Service Start Date:</span>
                <div className="relative w-44">
                  <Input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => handleDateInputChange("start", e.target.value)}
                    className="bg-green-50 pr-8 text-gray-700"
                  />
                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Service End Date:</span>
                <div className="relative w-44">
                  <Input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => handleDateInputChange("end", e.target.value)}
                    className="bg-green-50 pr-8 text-gray-700"
                  />
                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Service Duration:</span>
                <Input
                  value={formData.serviceDuration}
                  onChange={(e) => handleInputChange("serviceDuration", e.target.value)}
                  placeholder="Total Days"
                  className="w-44 text-gray-700"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Material Specs:</span>
                <Input
                  value={formData.materialSpecs}
                  onChange={(e) => handleInputChange("materialSpecs", e.target.value)}
                  placeholder="Perforated Sticker"
                  className="w-44 text-gray-700"
                />
              </div>
              <div className="flex items-start justify-between">
                <span className="font-semibold text-gray-700">Attachment:</span>
                <div>
                  {formData.attachments.length > 0 && formData.attachments.file ? (
                    <Image src={URL.createObjectURL(formData.attachments.file as Blob)} alt="attachment" width={60} height={60} className="rounded" />
                  ) : (
                    <span className="text-gray-400">No file</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Remarks:</span>
                <Input value={formData.remarks} onChange={(e) => handleInputChange("remarks", e.target.value)} placeholder="Remarks" className="w-44 bg-green-50 text-gray-700"/>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Crew:</span>
                <Select value={formData.crew} onValueChange={handleCrewChange}>
                  <SelectTrigger className="w-44 bg-green-50 text-gray-700">
                    <SelectValue placeholder="Choose a Crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Illumination/Nits:</span>
                <Input value={formData.illuminationNits} onChange={(e) => handleInputChange("illuminationNits", e.target.value)} placeholder="10PCS of 1000W metal halide" className="w-44 text-gray-700"/>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Gondola:</span>
                <Select value={formData.gondola} onValueChange={(value) => handleInputChange("gondola", value)}>
                  <SelectTrigger className="w-44 text-gray-700">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">YES</SelectItem>
                    <SelectItem value="no">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Sales:</span>
                <Input value={formData.sales} onChange={(e) => handleInputChange("sales", e.target.value)} placeholder="Noemi Abellanada" className="w-44 text-gray-700"/>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Logistics:</span>
                <Input value="May Tuyan" readOnly className="w-44 bg-gray-100 text-gray-700"/>
              </div>
            </div>

            
            
            
            
            
            
            
            
            
            
            
            


            
          </CardContent>
        </Card>

        {/* Job Order Card */}
        <Card className="shadow-sm border border-gray-200 p-6 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase">JOB ORDER</CardTitle>
            <button type="button" className="text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {jobOrderData ? (
              <div className="text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600">JO#: {jobOrderData.joNumber}</span>
                  <span className="text-blue-600">{formatDateForDisplay(new Date(jobOrderData.dateRequested))}</span>
                </div>
                <div><span className="font-bold text-gray-700">JO Type:</span> <span className="text-gray-600">{jobOrderData.joType}</span></div>
                <div><span className="font-bold text-gray-700">Campaign Name:</span> <span className="text-gray-600">{jobOrderData.campaignName || "N/A"}</span></div>
                <div><span className="font-bold text-gray-700">Deadline:</span> <span className="text-gray-600">{jobOrderData.deadline ? formatDateForDisplay(new Date(jobOrderData.deadline)) : "N/A"}</span></div>
                <div><span className="font-bold text-gray-700">Material Specs:</span> <span className="text-gray-600">{jobOrderData.materialSpecs || "N/A"}</span></div>
                <div>
                  <p className="font-bold text-gray-700">Attachment:</p>
                  {jobOrderData.attachments && jobOrderData.attachments.length > 0 ? (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={jobOrderData.attachments}
                        alt="Job Order Attachment"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 w-24 border rounded-md bg-gray-50 mt-1">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div><span className="font-bold text-gray-700">Remarks:</span> <span className="text-gray-600">{jobOrderData.remarks || "N/A"}</span></div>
                <div className="flex items-center justify-between">
                  <span><span className="font-bold text-gray-700">Requested by:</span> <span className="text-gray-600">{jobOrderData.requestedBy || "N/A"}</span></span>
                  <button type="button" className="text-blue-600 text-sm hover:underline">Change</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No Job Order selected.</p>
            )}
          </CardContent>
        </Card>

        {/* Service Expense Card */}
        <Card className="shadow-sm border-none p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-gray-800">
              Service Expense <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Main service cost fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="crewFee" className="text-xs font-medium text-gray-700">Crew Fee</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    id="crewFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceCost.crewFee}
                    onChange={(e) => handleServiceCostChange("crewFee", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleServiceCostChange("crewFee", "")} // Clear the field
                    className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="overtimeFee" className="text-xs font-medium text-gray-700">Overtime Fee</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    id="overtimeFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceCost.overtimeFee}
                    onChange={(e) => handleServiceCostChange("overtimeFee", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleServiceCostChange("overtimeFee", "")}
                    className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="transpo" className="text-xs font-medium text-gray-700">Transpo</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    id="transpo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceCost.transpo}
                    onChange={(e) => handleServiceCostChange("transpo", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleServiceCostChange("transpo", "")}
                    className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tollFee" className="text-xs font-medium text-gray-700">Toll Fee</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    id="tollFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceCost.tollFee}
                    onChange={(e) => handleServiceCostChange("tollFee", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleServiceCostChange("tollFee", "")}
                    className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mealAllowance" className="text-xs font-medium text-gray-700">Meal Allowance</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    id="mealAllowance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceCost.mealAllowance}
                    onChange={(e) => handleServiceCostChange("mealAllowance", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleServiceCostChange("mealAllowance", "")}
                    className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Other fees */}
            {formData.serviceCost.otherFees.map((fee, index) => (
              <div key={index} className="flex items-center justify-between">
                <Input
                  value={fee.name}
                  onChange={(e) => updateOtherFee(index, "name", e.target.value)}
                  placeholder="Other Fee"
                  className="flex-1 mr-2 text-gray-700"
                />
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fee.amount}
                    onChange={(e) => updateOtherFee(index, "amount", e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-green-50 text-gray-700"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOtherFee(index)}
                  className="h-6 w-6 text-gray-500 hover:bg-gray-100 bg-gray-100 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add Other button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addOtherFee}
              className="text-blue-600 hover:text-blue-700 px-0 bg-transparent"
            >
              + Other
            </Button>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Total:</Label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">P</span>
                  <span className="font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">{calculateServiceCostTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">You can edit this later on!</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons (Below all columns) */}
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={handleSaveDraft} disabled={loading} type="button" className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
          Save as Draft
        </Button>
        <Button onClick={handleSubmit} disabled={loading} type="button" className="px-6 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit SA"
          )}
        </Button>
      </div>

      {/* Success Dialog */}
      <ServiceAssignmentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        saNumber={createdSaNumber}
        onViewAssignments={handleViewAssignments}
        onCreateAnother={handleCreateAnother}
      />

      <TeamFormDialog
        open={isNewTeamDialogOpen}
        onOpenChange={setIsNewTeamDialogOpen}
        onSubmit={async (teamData) => {
          try {
            const teamId = await teamsService.createTeam(teamData, "logistics-admin")

            // Create team object for local state
            const newTeam = {
              id: teamId,
              status: "active" as const,
              members: [],
              ...teamData, // Spread teamData first
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: "logistics-admin",
            }

            // Add the new team to the teams list
            setTeams((prev) => [...prev, newTeam])
            // Select the new team in the form
            handleInputChange("crew", newTeam.id)
            // Close the dialog
            setIsNewTeamDialogOpen(false)
          } catch (error) {
            console.error("Failed to create team:", error)
            // Handle error appropriately
          }
        }}
      />
    </section>
  )
}
