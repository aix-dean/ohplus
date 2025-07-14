"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, FileText, ImageIcon, Video } from "lucide-react"
import { createReport, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CreateReportDialogProps {
  trigger?: React.ReactNode
  onReportCreated?: (reportId: string) => void
}

interface Product {
  id: string
  name: string
  location: string
  site_code?: string
  specs_rental?: {
    size?: string
    material?: string
    technology?: string
    gondola?: boolean
  }
  light?: {
    size?: string
    illumination?: string
    location?: string
  }
  content_type?: string
}

interface Client {
  id: string
  company: string
  contactPerson: string
  email: string
  phone: string
}

interface Attachment {
  note: string
  file?: File
  fileName?: string
  fileType?: string
}

export function CreateReportDialog({ trigger, onReportCreated }: CreateReportDialogProps) {
  const { userData, projectData } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [reportType, setReportType] = useState("installation-report")
  const [bookingDates, setBookingDates] = useState({
    start: "",
    end: "",
  })
  const [breakdate, setBreakdate] = useState("")
  const [sales, setSales] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([
    { note: "", file: undefined, fileName: "", fileType: "" },
  ])
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("installation")
  const [subcategory, setSubcategory] = useState("new-installation")
  const [priority, setPriority] = useState("medium")
  const [completionPercentage, setCompletionPercentage] = useState(100)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  // Fetch products and clients
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.license_key) return

      try {
        setLoadingData(true)

        // Fetch products
        const productsQuery = query(collection(db, "products"), where("license_key", "==", userData.license_key))
        const productsSnapshot = await getDocs(productsQuery)
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]
        setProducts(productsData)

        // Fetch clients
        const clientsQuery = query(collection(db, "clients"), where("license_key", "==", userData.license_key))
        const clientsSnapshot = await getDocs(clientsQuery)
        const clientsData = clientsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[]
        setClients(clientsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load products and clients",
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, userData?.license_key, toast])

  const handleFileUpload = (index: number, file: File) => {
    const newAttachments = [...attachments]
    newAttachments[index] = {
      ...newAttachments[index],
      file,
      fileName: file.name,
      fileType: file.type,
    }
    setAttachments(newAttachments)
  }

  const addAttachment = () => {
    setAttachments([...attachments, { note: "", file: undefined, fileName: "", fileType: "" }])
  }

  const removeAttachment = (index: number) => {
    if (attachments.length > 1) {
      setAttachments(attachments.filter((_, i) => i !== index))
    }
  }

  const updateAttachmentNote = (index: number, note: string) => {
    const newAttachments = [...attachments]
    newAttachments[index].note = note
    setAttachments(newAttachments)
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleGenerateReport = async () => {
    if (!selectedProduct || !selectedClient || !userData) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if at least one attachment has a file
    const hasAttachments = attachments.some((attachment) => attachment.file)
    if (!hasAttachments) {
      toast({
        title: "Error",
        description: "At least one file attachment is required",
        variant: "destructive",
      })
      return
    }

    if (!bookingDates.start || !bookingDates.end) {
      toast({
        title: "Error",
        description: "Please select booking start and end dates",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const reportData: ReportData = {
        siteId: selectedProduct.site_code || selectedProduct.id,
        siteName: selectedProduct.name,
        siteCode: selectedProduct.site_code,
        companyId: userData.company_id || userData.project_id || "",
        sellerId: userData.uid,
        client: selectedClient.company,
        clientId: selectedClient.id,
        bookingDates,
        breakdate,
        sales,
        reportType,
        date: new Date().toISOString().split("T")[0],
        attachments,
        status: "completed",
        createdBy: userData.uid,
        createdByName: `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.email || "Unknown",
        location,
        category,
        subcategory,
        priority,
        completionPercentage,
        tags,
        assignedTo,
      }

      const reportId = await createReport(reportData)

      toast({
        title: "Success",
        description: "Report created successfully",
      })

      setOpen(false)
      onReportCreated?.(reportId)

      // Reset form
      setSelectedProduct(null)
      setSelectedClient(null)
      setBookingDates({ start: "", end: "" })
      setBreakdate("")
      setSales("")
      setAttachments([{ note: "", file: undefined, fileName: "", fileType: "" }])
      setLocation("")
      setCompletionPercentage(100)
      setTags([])
      setAssignedTo("")
    } catch (error) {
      console.error("Error creating report:", error)
      toast({
        title: "Error",
        description: "Failed to create report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Create Report</Button>}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive report for your project installation or maintenance.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {loadingData ? (
            <div className="text-center py-8">Loading products and clients...</div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product/Site *</Label>
                  <Select
                    value={selectedProduct?.id || ""}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value)
                      setSelectedProduct(product || null)
                      if (product) {
                        setLocation(product.location || "")
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product/site" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={selectedClient?.id || ""}
                    onValueChange={(value) => {
                      const client = clients.find((c) => c.id === value)
                      setSelectedClient(client || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Report Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation-report">Installation Report</SelectItem>
                      <SelectItem value="maintenance-report">Maintenance Report</SelectItem>
                      <SelectItem value="inspection-report">Inspection Report</SelectItem>
                      <SelectItem value="damage-report">Damage Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={bookingDates.start}
                    onChange={(e) => setBookingDates({ ...bookingDates, start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={bookingDates.end}
                    onChange={(e) => setBookingDates({ ...bookingDates, end: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakdate">Break Date</Label>
                  <Input id="breakdate" type="date" value={breakdate} onChange={(e) => setBreakdate(e.target.value)} />
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales">Sales Representative</Label>
                  <Input
                    id="sales"
                    value={sales}
                    onChange={(e) => setSales(e.target.value)}
                    placeholder="Enter sales rep name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Team or person assigned"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion">Completion %</Label>
                  <Input
                    id="completion"
                    type="number"
                    min="0"
                    max="100"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Specific location details"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Attachments: <span className="text-red-500">*</span>
                </Label>
                {attachments.map((attachment, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Attachment {index + 1}</Label>
                      {attachments.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`file-${index}`}>File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`file-${index}`}
                          type="file"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(index, file)
                            }
                          }}
                        />
                        {attachment.file && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            {getFileIcon(attachment.fileType || "")}
                            <span>{attachment.fileName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`note-${index}`}>Note</Label>
                      <Textarea
                        id={`note-${index}`}
                        value={attachment.note}
                        onChange={(e) => updateAttachmentNote(index, e.target.value)}
                        placeholder="Add a note about this attachment"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addAttachment}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Another Attachment
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading || loadingData}>
            {loading ? "Creating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
