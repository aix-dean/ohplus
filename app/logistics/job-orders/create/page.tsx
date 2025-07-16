"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { createJobOrder, generateJONumber } from "@/lib/job-order-service"
import { useToast } from "@/hooks/use-toast"

interface JobOrderFormData {
  joNumber: string
  siteName: string
  siteLocation: string
  joType: string
  requestedBy: string
  assignTo: string
  dateRequested: string
  deadline: string
  jobDescription: string
  message: string
  attachments: string[]
}

export default function CreateJobOrderPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<JobOrderFormData>({
    joNumber: generateJONumber(),
    siteName: "",
    siteLocation: "",
    joType: "",
    requestedBy: userData?.name || "",
    assignTo: "",
    dateRequested: new Date().toISOString().split("T")[0],
    deadline: "",
    jobDescription: "",
    message: "",
    attachments: [],
  })

  const handleInputChange = (field: keyof JobOrderFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.uid || !userData?.company_id) {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!formData.siteName || !formData.joType || !formData.deadline) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const jobOrderData = {
        ...formData,
        created_by: user.uid,
        company_id: userData.company_id,
        status: "pending" as const,
        quotation_id: "", // Can be linked later if needed
      }

      const jobOrderId = await createJobOrder(jobOrderData)

      toast({
        title: "Success",
        description: "Job order created successfully",
      })

      router.push(`/logistics/job-orders/${jobOrderId}`)
    } catch (error) {
      console.error("Error creating job order:", error)
      toast({
        title: "Error",
        description: "Failed to create job order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const joTypes = ["Installation", "Maintenance", "Repair", "Dismantling", "Other"]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Job Order</h1>
            <p className="text-gray-600 mt-1">Fill in the details to create a new job order</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold">Job Order Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="joNumber">JO Number *</Label>
                  <Input
                    id="joNumber"
                    value={formData.joNumber}
                    onChange={(e) => handleInputChange("joNumber", e.target.value)}
                    placeholder="Auto-generated"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joType">JO Type *</Label>
                  <Select value={formData.joType} onValueChange={(value) => handleInputChange("joType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
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

                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name *</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) => handleInputChange("siteName", e.target.value)}
                    placeholder="Enter site name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteLocation">Site Location</Label>
                  <Input
                    id="siteLocation"
                    value={formData.siteLocation}
                    onChange={(e) => handleInputChange("siteLocation", e.target.value)}
                    placeholder="Enter site location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedBy">Requested By</Label>
                  <Input
                    id="requestedBy"
                    value={formData.requestedBy}
                    onChange={(e) => handleInputChange("requestedBy", e.target.value)}
                    placeholder="Enter requester name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignTo">Assign To</Label>
                  <Input
                    id="assignTo"
                    value={formData.assignTo}
                    onChange={(e) => handleInputChange("assignTo", e.target.value)}
                    placeholder="Enter assignee name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateRequested">Date Requested</Label>
                  <Input
                    id="dateRequested"
                    type="date"
                    value={formData.dateRequested}
                    onChange={(e) => handleInputChange("dateRequested", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  placeholder="Describe the job requirements and specifications"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Any additional notes or instructions"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files here, or click to select files</p>
                  <p className="text-xs text-gray-500 mt-1">Support for images, documents, and other file types</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? "Creating..." : "Create Job Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
