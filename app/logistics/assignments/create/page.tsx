"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Video, Loader2, ArrowLeft, Printer, Download } from "lucide-react"
import { format } from "date-fns"
import type { Product } from "@/lib/firebase-service"
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

// Service types as provided
const SERVICE_TYPES = ["Roll up", "Roll down", "Change Material", "Repair", "Maintenance", "Monitoring", "Spot Booking"]

export default function CreateServiceAssignmentPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProjectSite = searchParams.get("projectSite")

  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [saNumber, setSaNumber] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdSaNumber, setCreatedSaNumber] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

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
    attachments: [] as { name: string; type: string }[],
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
        attachments: formData.attachments,
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
        attachments: formData.attachments,
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

  // Handle attachment addition
  const addAttachment = (type: string) => {
    const newAttachment = {
      name: type === "pdf" ? "Document.pdf" : "Video.mp4",
      type,
    }

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment],
    }))
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
        // Check if browser supports printing
        if (window.print) {
          // Generate PDF and open in new window for printing
          await generateServiceAssignmentPDF(serviceAssignmentData, false)
        } else {
          // Fallback to download if print not supported
          await generateServiceAssignmentPDF(serviceAssignmentData, false)
        }
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
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 rounded-lg flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {isEditingDraft ? "Edit Service Assignment Draft" : "Create Service Assignment"}
        </h1>
        <Link href="/logistics/assignments" className="inline-flex items-center text-sm text-white/80 hover:text-white">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Assignments
        </Link>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Service Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SA Number */}
            <div className="space-y-2">
              <Label htmlFor="saNumber" className="text-sm font-medium">
                SA#
              </Label>
              <Input id="saNumber" value={saNumber} readOnly className="bg-gray-100" />
            </div>

            {/* Project Site */}
            <div className="space-y-2">
              <Label htmlFor="projectSite" className="text-sm font-medium">
                Project Site
              </Label>
              <Select value={formData.projectSite} onValueChange={(value) => handleInputChange("projectSite", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.light?.location || product.specs_rental?.location || "No location"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-sm font-medium">
                Service Type
              </Label>
              <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-sm font-medium">
                Assigned To
              </Label>
              <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange("assignedTo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team1">Operations Team 1</SelectItem>
                  <SelectItem value="team2">Operations Team 2</SelectItem>
                  <SelectItem value="team3">Maintenance Team</SelectItem>
                  <SelectItem value="contractor">External Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Duration */}
            <div className="space-y-2">
              <Label htmlFor="serviceDuration" className="text-sm font-medium">
                Service Duration (Hours)
              </Label>
              <Input
                id="serviceDuration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.serviceDuration}
                onChange={(e) => handleInputChange("serviceDuration", e.target.value)}
                placeholder="Enter duration in hours"
              />
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority Level
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Required */}
            <div className="space-y-2">
              <Label htmlFor="equipmentRequired" className="text-sm font-medium">
                Equipment Required
              </Label>
              <Textarea
                id="equipmentRequired"
                value={formData.equipmentRequired}
                onChange={(e) => handleInputChange("equipmentRequired", e.target.value)}
                placeholder="List required equipment"
                rows={2}
              />
            </div>

            {/* Material Specs */}
            <div className="space-y-2">
              <Label htmlFor="materialSpecs" className="text-sm font-medium">
                Material Specs
              </Label>
              <Textarea
                id="materialSpecs"
                value={formData.materialSpecs}
                onChange={(e) => handleInputChange("materialSpecs", e.target.value)}
                placeholder="Enter material specifications"
                rows={3}
              />
            </div>

            {/* Crew */}
            <div className="space-y-2">
              <Label htmlFor="crew" className="text-sm font-medium">
                Crew
              </Label>
              <Select value={formData.crew} onValueChange={(value) => handleInputChange("crew", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crew" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crew-a">Crew A</SelectItem>
                  <SelectItem value="crew-b">Crew B</SelectItem>
                  <SelectItem value="crew-c">Crew C</SelectItem>
                  <SelectItem value="maintenance-crew">Maintenance Crew</SelectItem>
                  <SelectItem value="installation-crew">Installation Crew</SelectItem>
                  <SelectItem value="technical-crew">Technical Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Illumination/Nits */}
            <div className="space-y-2">
              <Label htmlFor="illuminationNits" className="text-sm font-medium">
                Illumination/Nits
              </Label>
              <Input
                id="illuminationNits"
                type="number"
                min="0"
                value={formData.illuminationNits}
                onChange={(e) => handleInputChange("illuminationNits", e.target.value)}
                placeholder="Enter illumination in nits"
              />
            </div>

            {/* Gondola */}
            <div className="space-y-2">
              <Label htmlFor="gondola" className="text-sm font-medium">
                Gondola
              </Label>
              <Select value={formData.gondola} onValueChange={(value) => handleInputChange("gondola", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Technology */}
            <div className="space-y-2">
              <Label htmlFor="technology" className="text-sm font-medium">
                Technology
              </Label>
              <Input
                id="technology"
                value={formData.technology}
                onChange={(e) => handleInputChange("technology", e.target.value)}
                placeholder="Enter technology details"
              />
            </div>

            {/* Sales */}
            <div className="space-y-2">
              <Label htmlFor="sales" className="text-sm font-medium">
                Sales
              </Label>
              <Select value={formData.sales} onValueChange={(value) => handleInputChange("sales", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales representative" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales-rep-1">Sales Rep 1</SelectItem>
                  <SelectItem value="sales-rep-2">Sales Rep 2</SelectItem>
                  <SelectItem value="sales-rep-3">Sales Rep 3</SelectItem>
                  <SelectItem value="sales-manager">Sales Manager</SelectItem>
                  <SelectItem value="account-manager">Account Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="text-sm font-medium">
              Remarks
            </Label>
            <Textarea
              id="jobDescription"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Enter remarks"
              rows={3}
            />
          </div>

          {/* Requested By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Requested By</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <span>
                (LOGISTICS){" "}
                {userData?.first_name && userData?.last_name
                  ? `${userData.first_name} ${userData.last_name}`
                  : user?.displayName || "Unknown User"}
              </span>
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">
                {user?.displayName?.[0] || "U"}
              </div>
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDateInput}
                onChange={(e) => handleDateInputChange("start", e.target.value)}
              />
              {formData.startDate && (
                <p className="text-xs text-gray-500">Selected: {formatDateForDisplay(formData.startDate)}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDateInput}
                onChange={(e) => handleDateInputChange("end", e.target.value)}
              />
              {formData.endDate && (
                <p className="text-xs text-gray-500">Selected: {formatDateForDisplay(formData.endDate)}</p>
              )}
            </div>

            {/* Alarm Date */}
            <div className="space-y-2">
              <Label htmlFor="alarmDate" className="text-sm font-medium">
                Alarm Date
              </Label>
              <Input
                id="alarmDate"
                type="date"
                value={alarmDateInput}
                onChange={(e) => handleDateInputChange("alarm", e.target.value)}
              />
              {formData.alarmDate && (
                <p className="text-xs text-gray-500">Selected: {formatDateForDisplay(formData.alarmDate)}</p>
              )}
            </div>
          </div>

          {/* Alarm Time */}
          <div className="space-y-2">
            <Label htmlFor="alarmTime" className="text-sm font-medium">
              Alarm Time
            </Label>
            <Select value={formData.alarmTime} onValueChange={(value) => handleInputChange("alarmTime", value)}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select Time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Cost */}
          <Card className="p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Service Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main service cost fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium w-24">Crew Fee:</Label>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.serviceCost.crewFee}
                      onChange={(e) => handleServiceCostChange("crewFee", e.target.value)}
                      className="flex-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium w-24">Overtime Fee:</Label>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.serviceCost.overtimeFee}
                      onChange={(e) => handleServiceCostChange("overtimeFee", e.target.value)}
                      className="flex-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium w-24">Transpo:</Label>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.serviceCost.transpo}
                      onChange={(e) => handleServiceCostChange("transpo", e.target.value)}
                      className="flex-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium w-24">Toll Fee:</Label>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.serviceCost.tollFee}
                      onChange={(e) => handleServiceCostChange("tollFee", e.target.value)}
                      className="flex-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium w-24">Meal Allowance:</Label>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.serviceCost.mealAllowance}
                      onChange={(e) => handleServiceCostChange("mealAllowance", e.target.value)}
                      className="flex-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Other fees */}
              {formData.serviceCost.otherFees.map((fee, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={fee.name}
                    onChange={(e) => updateOtherFee(index, "name", e.target.value)}
                    placeholder="Fee name"
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">P</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fee.amount}
                      onChange={(e) => updateOtherFee(index, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-24"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeOtherFee(index)}>
                    Remove
                  </Button>
                </div>
              ))}

              {/* Add Other button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOtherFee}
                className="text-blue-600 hover:text-blue-700"
              >
                + Other
              </Button>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Total:</Label>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">P</span>
                    <span className="font-medium">{calculateServiceCostTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div className="flex flex-wrap gap-4">
              {formData.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 w-[120px] h-[120px] flex flex-col items-center justify-center"
                >
                  {attachment.type === "pdf" ? (
                    <>
                      <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center rounded-md mb-2">
                        <FileText size={24} />
                      </div>
                      <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md mb-2">
                        <Video size={24} className="text-gray-500" />
                      </div>
                      <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addAttachment("pdf")}
                className="border rounded-md p-4 w-[120px] h-[120px] flex flex-col items-center justify-center hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center rounded-md mb-2">
                  <FileText size={24} />
                </div>
                <span className="text-xs">Add PDF</span>
              </button>

              <button
                type="button"
                onClick={() => addAttachment("video")}
                className="border rounded-md p-4 w-[120px] h-[120px] flex flex-col items-center justify-center hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md mb-2">
                  <Video size={24} className="text-gray-500" />
                </div>
                <span className="text-xs">Add Video</span>
              </button>

              <button
                type="button"
                className="border rounded-md p-4 w-[120px] h-[120px] flex items-center justify-center hover:bg-gray-50"
              >
                <Plus size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button variant="outline" onClick={() => router.push("/logistics/assignments")} type="button">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading} type="button">
              Save Draft
            </Button>
            <Button variant="outline" onClick={() => handleGeneratePDF("print")} disabled={generatingPDF} type="button">
              {generatingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGeneratePDF("download")}
              disabled={generatingPDF}
              type="button"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
            <Button onClick={handleSubmit} disabled={loading} variant="default" type="button">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <ServiceAssignmentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        saNumber={createdSaNumber}
        onViewAssignments={handleViewAssignments}
        onCreateAnother={handleCreateAnother}
      />
    </div>
  )
}
