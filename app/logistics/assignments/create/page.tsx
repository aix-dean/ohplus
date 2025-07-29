"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, Send, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface ServiceAssignmentForm {
  saNumber: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  coveredDateStart: Date | null
  coveredDateEnd: Date | null
  status: string
  company_id: string
}

export default function CreateServiceAssignmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userData } = useAuth()
  const draftId = searchParams.get("draft")

  const [formData, setFormData] = useState<ServiceAssignmentForm>({
    saNumber: "",
    projectSiteName: "",
    projectSiteLocation: "",
    serviceType: "",
    assignedTo: "",
    jobDescription: "",
    requestedBy: {
      id: userData?.uid || "",
      name: userData?.displayName || "",
      department: userData?.department || "",
    },
    coveredDateStart: null,
    coveredDateEnd: null,
    status: "Pending",
    company_id: userData?.company_id || "",
  })

  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [isEditingDraft, setIsEditingDraft] = useState(false)

  // Load draft data if editing
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          const draftDoc = await getDoc(doc(db, "service_assignments", draftId))
          if (draftDoc.exists()) {
            const draftData = draftDoc.data()
            setFormData({
              ...draftData,
              coveredDateStart: draftData.coveredDateStart?.toDate() || null,
              coveredDateEnd: draftData.coveredDateEnd?.toDate() || null,
            } as ServiceAssignmentForm)
            setIsEditingDraft(true)
          }
        } catch (error) {
          console.error("Error loading draft:", error)
          toast.error("Failed to load draft")
        }
      }
    }

    loadDraft()
  }, [draftId])

  // Generate SA number
  useEffect(() => {
    if (!formData.saNumber && !isEditingDraft) {
      const generateSANumber = () => {
        const timestamp = Date.now().toString().slice(-6)
        return `SA-${timestamp}`
      }
      setFormData((prev) => ({ ...prev, saNumber: generateSANumber() }))
    }
  }, [formData.saNumber, isEditingDraft])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      const draftData = {
        ...formData,
        status: "Draft",
        updated: serverTimestamp(),
        ...(isEditingDraft ? {} : { created: serverTimestamp() }),
      }

      if (isEditingDraft && draftId) {
        await updateDoc(doc(db, "service_assignments", draftId), draftData)
        toast.success("Draft updated successfully")
      } else {
        const docRef = await addDoc(collection(db, "service_assignments"), draftData)
        toast.success("Draft saved successfully")
        router.push(`/logistics/assignments/create?draft=${docRef.id}`)
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.projectSiteName || !formData.serviceType || !formData.assignedTo) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }

      const assignmentData = {
        ...formData,
        status: "Pending",
        created: isEditingDraft ? formData.created : serverTimestamp(),
        updated: serverTimestamp(),
      }

      if (isEditingDraft && draftId) {
        await updateDoc(doc(db, "service_assignments", draftId), assignmentData)
        toast.success("Service assignment updated successfully")
      } else {
        await addDoc(collection(db, "service_assignments"), assignmentData)
        toast.success("Service assignment created successfully")
      }

      router.push("/logistics/assignments")
    } catch (error) {
      console.error("Error creating service assignment:", error)
      toast.error("Failed to create service assignment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditingDraft ? "Edit Service Assignment Draft" : "Create Service Assignment"}
          </h1>
          <p className="text-gray-600">
            {isEditingDraft
              ? "Continue editing your draft assignment"
              : "Create a new service assignment for your team"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saNumber">SA Number</Label>
                <Input
                  id="saNumber"
                  value={formData.saNumber}
                  onChange={(e) => handleInputChange("saNumber", e.target.value)}
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="projectSiteName">Project Site Name *</Label>
              <Input
                id="projectSiteName"
                value={formData.projectSiteName}
                onChange={(e) => handleInputChange("projectSiteName", e.target.value)}
                placeholder="Enter project site name"
                required
              />
            </div>

            <div>
              <Label htmlFor="projectSiteLocation">Project Site Location</Label>
              <Input
                id="projectSiteLocation"
                value={formData.projectSiteLocation}
                onChange={(e) => handleInputChange("projectSiteLocation", e.target.value)}
                placeholder="Enter project site location"
              />
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To *</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                placeholder="Enter assignee name"
                required
              />
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                placeholder="Describe the job requirements and tasks"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.coveredDateStart && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.coveredDateStart ? format(formData.coveredDateStart, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.coveredDateStart || undefined}
                      onSelect={(date) => handleInputChange("coveredDateStart", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.coveredDateEnd && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.coveredDateEnd ? format(formData.coveredDateEnd, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.coveredDateEnd || undefined}
                      onSelect={(date) => handleInputChange("coveredDateEnd", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={savingDraft}>
            <Save className="mr-2 h-4 w-4" />
            {savingDraft ? "Saving Draft..." : "Save Draft"}
          </Button>

          <Button type="submit" disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : isEditingDraft ? "Update Assignment" : "Create Assignment"}
          </Button>
        </div>
      </form>
    </div>
  )
}
