"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteData?: {
    id: string
    name: string
    client?: string
    bookingDates?: string
    breakdate?: string
    sales?: string
  }
}

export function CreateReportDialog({ open, onOpenChange, siteData }: CreateReportDialogProps) {
  const [reportType, setReportType] = useState("completion-report")
  const [date, setDate] = useState("AutoFill")
  const [attachments, setAttachments] = useState<Array<{ id: string; note: string }>>([
    { id: "1", note: "" },
    { id: "2", note: "" },
  ])

  const handleGenerateReport = () => {
    console.log("Generating report with data:", {
      siteData,
      reportType,
      date,
      attachments: attachments.filter((att) => att.note.trim() !== ""),
    })
    // Add your report generation logic here
    onOpenChange(false)
  }

  const updateAttachmentNote = (id: string, note: string) => {
    setAttachments((prev) => prev.map((att) => (att.id === id ? { ...att, note } : att)))
  }

  const addAttachment = () => {
    const newId = (attachments.length + 1).toString()
    setAttachments((prev) => [...prev, { id: newId, note: "" }])
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
              <span className="font-medium">Site:</span> {siteData?.name || "Unknown Site"}
            </div>
            <div className="text-sm">
              <span className="font-medium">Client:</span> {siteData?.client || "Summit Media"}
            </div>
            <div className="text-sm">
              <span className="font-medium">Booking Dates:</span>{" "}
              {siteData?.bookingDates || "May 20, 2025 to June 20, 2025"}
            </div>
            <div className="text-sm">
              <span className="font-medium">Breakdate:</span> {siteData?.breakdate || "May 20, 2025"}
            </div>
            <div className="text-sm">
              <span className="font-medium">Sales:</span> {siteData?.sales || "Noemi Abellaneda"}
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-sm font-medium">
              Report Type:
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion-report">Completion Report</SelectItem>
                <SelectItem value="progress-report">Progress Report</SelectItem>
                <SelectItem value="maintenance-report">Maintenance Report</SelectItem>
                <SelectItem value="inspection-report">Inspection Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date:
            </Label>
            <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="AutoFill" />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments:</Label>
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Click to upload</span>
                  </div>
                  <Textarea
                    placeholder="Add Note..."
                    value={attachment.note}
                    onChange={(e) => updateAttachmentNote(attachment.id, e.target.value)}
                    className="text-xs resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {attachments.length < 4 && (
              <Button variant="outline" size="sm" onClick={addAttachment} className="w-full mt-2 bg-transparent">
                Add Another Attachment
              </Button>
            )}
          </div>

          {/* Generate Report Button */}
          <Button
            onClick={handleGenerateReport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          >
            Generate Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
