"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { CalendarIcon, Upload, X, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createJobOrder, generateJONumber } from "@/lib/job-order-service"
import { getQuotationsForSelection } from "@/lib/quotation-service"
import { getAllClients } from "@/lib/client-service"
import type { JobOrder, JobOrderType, JobOrderStatus } from "@/lib/types/job-order"
import type { Quotation } from "@/lib/types/quotation"
import type { Client } from "@/lib/client-service"

const JO_TYPES: JobOrderType[] = ["Installation", "Maintenance", "Repair", "Dismantling", "Other"]
const JO_STATUSES: JobOrderStatus[] = ["draft", "pending", "approved", "rejected", "completed", "cancelled"]

export default function CreateJobOrderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    joNumber: "",
    siteName: "",
    siteLocation: "",
    joType: "" as JobOrderType,
    requestedBy: "",
    assignTo: "",
    dateRequested: new Date(),
    deadline: new Date(),
    jobDescription: "",
    message: "",
    status: "draft" as JobOrderStatus,
    quotation_id: "",
    client_id: "",
  })

  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    if (user) {
      // Generate JO number
      setFormData((prev) => ({
        ...prev,
        joNumber: generateJONumber(),
        requestedBy: user.displayName || user.email || "",
      }))

      // Fetch quotations and clients
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      if (user?.uid) {
        const [quotationsData, clientsData] = await Promise.all([getQuotationsForSelection(user.uid), getAllClients()])
        setQuotations(quotationsData)
        setClients(clientsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load quotations and clients",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleQuotationSelect = (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId)
    if (quotation) {
      setSelectedQuotation(quotation)
      setFormData((prev) => ({
        ...prev,
        quotation_id: quotationId,
        siteName: quotation.site_name || "",
        siteLocation: quotation.site_location || "",
        client_id: quotation.client_id || "",
      }))

      // Set selected client if quotation has client_id
      if (quotation.client_id) {
        const client = clients.find((c) => c.id === quotation.client_id)
        if (client) {
          setSelectedClient(client)
        }
      }
    }
  }

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setSelectedClient(client)
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
      }))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.company_id) {
      toast({
        title: "Error",
        description: "User company information not found",
        variant: "destructive",
      })
      return
    }

    if (!formData.joType || !formData.siteName || !formData.assignTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Upload attachments if any (simplified for now)
      const attachmentUrls: string[] = []
      // In a real implementation, you would upload files to Firebase Storage here

      const jobOrderData: Partial<JobOrder> = {
        ...formData,
        company_id: user.company_id,
        created_by: user.uid,
        attachments: attachmentUrls,
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
        description: "Failed to create job order",
        variant: "destructive",
      })
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
          <h1 className="text-3xl font-bold">Create Job Order</h1>
          <p className="text-muted-foreground">Create a new job order for your team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="joNumber">JO Number *</Label>
                <Input
                  id="joNumber"
                  value={formData.joNumber}
                  onChange={(e) => handleInputChange("joNumber", e.target.value)}
                  placeholder="Auto-generated"
                  required
                />
              </div>

              <div>
                <Label htmlFor="joType">Job Type *</Label>
                <Select value={formData.joType} onValueChange={(value) => handleInputChange("joType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JO_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {JO_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requestedBy">Requested By *</Label>
                <Input
                  id="requestedBy"
                  value={formData.requestedBy}
                  onChange={(e) => handleInputChange("requestedBy", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="assignTo">Assign To *</Label>
                <Input
                  id="assignTo"
                  value={formData.assignTo}
                  onChange={(e) => handleInputChange("assignTo", e.target.value)}
                  placeholder="Enter assignee name or ID"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Site & Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Site & Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quotation">Link to Quotation (Optional)</Label>
                <Select value={formData.quotation_id} onValueChange={handleQuotationSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.quotation_number} - {quotation.site_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={formData.client_id} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => handleInputChange("siteName", e.target.value)}
                  placeholder="Enter site name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="siteLocation">Site Location</Label>
                <Input
                  id="siteLocation"
                  value={formData.siteLocation}
                  onChange={(e) => handleInputChange("siteLocation", e.target.value)}
                  placeholder="Enter site location"
                />
              </div>

              {selectedClient && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Selected Client</h4>
                  <p className="text-sm">{selectedClient.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient.company}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date Requested *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dateRequested && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateRequested ? format(formData.dateRequested, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateRequested}
                      onSelect={(date) => date && handleInputChange("dateRequested", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => date && handleInputChange("deadline", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                placeholder="Describe the job requirements and specifications..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="message">Additional Notes</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Any additional notes or special instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="attachments">Upload Files</Label>
                <div className="mt-2">
                  <input type="file" id="attachments" multiple onChange={handleFileUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("attachments")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Job Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
