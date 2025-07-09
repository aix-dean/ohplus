"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getProductById, type Product } from "@/lib/firebase-service"
import { createReport, type ReportData } from "@/lib/report-service"

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
}

export function CreateReportDialog({ open, onOpenChange, siteId }: CreateReportDialogProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("completion-report")
  const [date, setDate] = useState("")
  const [attachments, setAttachments] = useState<{ note: string; file?: File; fileName?: string }[]>([
    { note: "" },
    { note: "" },
  ])
  const { toast } = useToast()

  // Fetch product data when dialog opens
  useEffect(() => {
    if (open && siteId) {
      fetchProductData()
      // Auto-fill date with current date
      setDate(new Date().toISOString().split("T")[0])
    }
  }, [open, siteId])

  const fetchProductData = async () => {
    try {
      const productData = await getProductById(siteId)
      setProduct(productData)
    } catch (error) {
      console.error("Error fetching product data:", error)
      toast({
        title: "Error",
        description: "Failed to load site information",
        variant: "destructive",
      })
    }
  }

  const handleAttachmentNoteChange = (index: number, note: string) => {
    const newAttachments = [...attachments]
    newAttachments[index].note = note
    setAttachments(newAttachments)
  }

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const newAttachments = [...attachments]
      newAttachments[index].file = file
      newAttachments[index].fileName = file.name
      setAttachments(newAttachments)
    }
  }

  const handleGenerateReport = async () => {
    if (!product) {
      toast({
        title: "Error",
        description: "Site information not loaded",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const reportData: ReportData = {
        siteId: product.id,
        siteName: product.name || "Unknown Site",
        client: "Summit Media", // This would come from booking data in real implementation
        bookingDates: {
          start: "2025-05-20", // This would come from booking data
          end: "2025-06-20",
        },
        breakdate: "2025-05-20",
        sales: "Noemi Abellaneda", // This would come from user data
        reportType,
        date,
        attachments: attachments.filter((att) => att.note.trim() !== ""),
        status: "draft",
        createdBy: "current-user-id", // This would come from auth context
      }

      await createReport(reportData)

      toast({
        title: "Success",
        description: "Report created successfully",
      })

      onOpenChange(false)
      // Reset form
      setReportType("completion-report")
      setDate("")
      setAttachments([{ note: "" }, { note: "" }])
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Booking Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Information Section */}
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium">Site:</span> {product?.name || "Loading..."}
            </div>
            <div className="text-sm">
              <span className="font-medium">Client:</span> Summit Media
            </div>
            <div className="text-sm">
              <span className="font-medium">Booking Dates:</span> May 20, 2025 to June 20, 2025
            </div>
            <div className="text-sm">
              <span className="font-medium">Breakdate:</span> May 20, 2025
            </div>
            <div className="text-sm">
              <span className="font-medium">Sales:</span> Noemi Abellaneda
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type:</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion-report">Completion Report</SelectItem>
                <SelectItem value="maintenance-report">Maintenance Report</SelectItem>
                <SelectItem value="inspection-report">Inspection Report</SelectItem>
                <SelectItem value="incident-report">Incident Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="AutoFill"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments:</Label>
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((attachment, index) => (
                <div key={index} className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      id={`file-${index}`}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => handleFileUpload(index, e)}
                    />
                    <label htmlFor={`file-${index}`} className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {attachment.fileName ? (
                          <span className="text-blue-600 font-medium">{attachment.fileName}</span>
                        ) : (
                          "Click to upload"
                        )}
                      </span>
                    </label>
                  </div>
                  <Input
                    placeholder="Add Note..."
                    value={attachment.note}
                    onChange={(e) => handleAttachmentNoteChange(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Generate Report Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
