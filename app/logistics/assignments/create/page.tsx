"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@/hooks/useUser"
import { toast } from "@/components/ui/use-toast"
import { db } from "@/firebase/config"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

const CreateAssignmentPage = () => {
  const router = useRouter()
  const { user } = useUser()
  const [formData, setFormData] = useState({
    saNumber: "",
    projectSiteId: "",
    projectSiteName: "",
    projectSiteLocation: "",
    serviceType: "",
    assignedTo: "",
    serviceDuration: "",
    priority: "Normal",
    equipmentRequired: "",
    materialSpecs: "",
    crew: "",
    illuminationNits: "",
    gondola: "",
    technology: "",
    sales: "",
    remarks: "",
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
  const [savingDraft, setSavingDraft] = useState(false)

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true)
      const searchParams = useSearchParams()
      const draftId = searchParams.get("draft")

      // Prepare the service assignment data
      const serviceAssignmentData = {
        saNumber: formData.saNumber || `SA-${Date.now()}`,
        projectSiteId: formData.projectSiteId,
        projectSiteName: formData.projectSiteName,
        projectSiteLocation: formData.projectSiteLocation,
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
          name: user?.displayName || "Unknown User",
          department: "Logistics Department",
          id: user?.uid || "",
        },
        startDate: formData.startDate,
        endDate: formData.endDate,
        alarmDate: formData.alarmDate,
        alarmTime: formData.alarmTime,
        attachments: formData.attachments,
        serviceCost: {
          crewFee: formData.serviceCost.crewFee,
          overtimeFee: formData.serviceCost.overtimeFee,
          transpo: formData.serviceCost.transpo,
          tollFee: formData.serviceCost.tollFee,
          mealAllowance: formData.serviceCost.mealAllowance,
          otherFees: formData.serviceCost.otherFees,
          total: formData.serviceCost.total,
        },
        status: "Draft",
        updated: new Date(),
      }

      if (draftId) {
        // Update existing draft
        await updateDoc(doc(db, "service_assignments", draftId), serviceAssignmentData)
      } else {
        // Create new draft
        serviceAssignmentData.created = new Date()
        await addDoc(collection(db, "service_assignments"), serviceAssignmentData)
      }

      toast({
        title: "Draft Saved",
        description: "Service assignment has been saved as draft successfully.",
      })

      router.push("/logistics/assignments")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingDraft(false)
    }
  }

  useEffect(() => {
    const loadDraft = async () => {
      const searchParams = useSearchParams()
      const draftId = searchParams.get("draft")

      if (draftId) {
        try {
          const draftDoc = await getDoc(doc(db, "service_assignments", draftId))
          if (draftDoc.exists()) {
            const draftData = draftDoc.data()

            // Load draft data into form
            setFormData({
              saNumber: draftData.saNumber || "",
              projectSiteId: draftData.projectSiteId || "",
              projectSiteName: draftData.projectSiteName || "",
              projectSiteLocation: draftData.projectSiteLocation || "",
              serviceType: draftData.serviceType || "",
              assignedTo: draftData.assignedTo || "",
              serviceDuration: draftData.serviceDuration || "",
              priority: draftData.priority || "Normal",
              equipmentRequired: draftData.equipmentRequired || "",
              materialSpecs: draftData.materialSpecs || "",
              crew: draftData.crew || "",
              illuminationNits: draftData.illuminationNits || "",
              gondola: draftData.gondola || "",
              technology: draftData.technology || "",
              sales: draftData.sales || "",
              remarks: draftData.remarks || "",
              startDate: draftData.startDate ? new Date(draftData.startDate.seconds * 1000) : null,
              endDate: draftData.endDate ? new Date(draftData.endDate.seconds * 1000) : null,
              alarmDate: draftData.alarmDate ? new Date(draftData.alarmDate.seconds * 1000) : null,
              alarmTime: draftData.alarmTime || "",
              attachments: draftData.attachments || [],
              serviceCost: {
                crewFee: draftData.serviceCost?.crewFee || "",
                overtimeFee: draftData.serviceCost?.overtimeFee || "",
                transpo: draftData.serviceCost?.transpo || "",
                tollFee: draftData.serviceCost?.tollFee || "",
                mealAllowance: draftData.serviceCost?.mealAllowance || "",
                otherFees: draftData.serviceCost?.otherFees || [],
                total: draftData.serviceCost?.total || 0,
              },
            })

            toast({
              title: "Draft Loaded",
              description: "Your draft has been loaded successfully.",
            })
          }
        } catch (error) {
          console.error("Error loading draft:", error)
          toast({
            title: "Error",
            description: "Failed to load draft.",
            variant: "destructive",
          })
        }
      }
    }

    loadDraft()
  }, [])

  // ** rest of code here **

  return (
    <div>
      {/* Form components here */}
      <button onClick={handleSaveDraft} disabled={savingDraft}>
        {savingDraft ? "Saving..." : "Save Draft"}
      </button>
    </div>
  )
}

export default CreateAssignmentPage
