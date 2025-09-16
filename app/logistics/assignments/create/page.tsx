"use client"

import type React from "react"
import Image from "next/image"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"

import { Loader2, ArrowLeft } from "lucide-react"

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
import { ProductSelectionDialog } from "@/components/logistics/assignments/create/ProductSelectionDialog"


// Service types as provided
const SERVICE_TYPES = ["Roll Up", "Roll Down", "Monitoring", "Change Material", "Maintenance"]

import { CreateServiceAssignmentForm } from '@/components/logistics/assignments/create/CreateServiceAssignmentForm';

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
  const [isProductSelectionDialogOpen, setIsProductSelectionDialogOpen] = useState(false) // State for ProductSelectionDialog

  const [loadingTeams, setLoadingTeams] = useState(true)
  const [isNewTeamDialogOpen, setIsNewTeamDialogOpen] = useState(false)


  // Form data state
  const [formData, setFormData] = useState({
    projectSite: initialProjectSite || "",
    serviceType: "",
    assignedTo: "",
    serviceDuration: 0,
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

  // Auto-set sales field to current user's full name
  useEffect(() => {
    if (userData?.first_name && userData?.last_name && !formData.sales) {
      setFormData(prev => ({ ...prev, sales: `${userData.first_name} ${userData.last_name}` }));
    }
  }, [userData, formData.sales]);


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

  // Auto-select product when projectSite parameter is present
  useEffect(() => {
    const autoSelectProduct = async () => {
      if (initialProjectSite && !formData.projectSite && userData?.company_id) {
        try {
          // First check if the product is already in the loaded products
          const existingProduct = products.find(p => p.id === initialProjectSite)
          if (existingProduct) {
            setFormData(prev => ({ ...prev, projectSite: initialProjectSite }))
            return
          }

          // If not found in loaded products, fetch the specific product document
          const productDoc = await getDoc(doc(db, "products", initialProjectSite))
          if (productDoc.exists()) {
            const productData = { id: productDoc.id, ...productDoc.data() } as Product
            // Add the product to the products array if it's not already there
            setProducts(prev => {
              const exists = prev.find(p => p.id === productData.id)
              if (!exists) {
                return [...prev, productData]
              }
              return prev
            })
            // Set the projectSite in form data
            setFormData(prev => ({ ...prev, projectSite: initialProjectSite }))
          }
        } catch (error) {
          console.error("Error fetching product for auto-selection:", error)
        }
      }
    }

    autoSelectProduct()
  }, [initialProjectSite, formData.projectSite, userData?.company_id, products])

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

            // Date inputs are now handled directly as Date objects
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

            // Only pre-fill form fields if projectSite parameter is provided or if it's explicitly allowed
            // If no projectSite parameter, keep fields empty as requested
            if (initialProjectSite) {
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

              // Date inputs are now handled directly as Date objects
            }
          }
        } catch (error) {
          console.error("Error fetching job order for pre-fill:", error)
        }
      }
    }
    fetchJobOrder()
  }, [jobOrderId, initialProjectSite]) // Rerun when jobOrderId or initialProjectSite changes

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
        serviceDuration: `${formData.serviceDuration} days`,
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
        serviceDuration: `${formData.serviceDuration} days`,
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
      serviceDuration: 0,
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
        serviceDuration: `${formData.serviceDuration} days`,
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

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    handleInputChange("projectSite", product.id || "")
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

      <div className="flex items-center gap-2">
        <Link href="/logistics/assignments" className="inline-flex items-center text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">
          {isEditingDraft ? "Edit Service Assignment Draft" : "Create Service Assignment"}
        </h1>
      </div>

      {/* Form Card */}
      <CreateServiceAssignmentForm
        onSaveAsDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        loading={loading}
        companyId={userData?.company_id || null}
        productId={formData.projectSite}
        formData={formData}
        handleInputChange={handleInputChange}
        products={products}
        teams={teams}
        saNumber={saNumber}
        jobOrderData={jobOrderData}
        handleServiceCostChange={handleServiceCostChange}
        addOtherFee={addOtherFee}
        removeOtherFee={removeOtherFee}
        updateOtherFee={updateOtherFee}
        calculateServiceCostTotal={calculateServiceCostTotal}
        onOpenProductSelection={() => setIsProductSelectionDialogOpen(true)}
      />


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

      <ProductSelectionDialog
        open={isProductSelectionDialogOpen}
        onOpenChange={setIsProductSelectionDialogOpen}
        onSelectProduct={handleProductSelect}
      />
    </section>
  )
}
