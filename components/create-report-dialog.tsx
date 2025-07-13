"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createReport, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { uploadFile } from "@/lib/video-upload-service"

interface CreateReportDialogProps {
  isOpen: boolean
  onClose: () => void
  onReportCreated?: (reportId: string) => void
  prefilledData?: {
    siteId?: string
    siteName?: string
    assignedTo?: string
    sales?: string
    bookingDates?: {
      start: string
      end: string
    }
  }
}

export function CreateReportDialog({ isOpen, onClose, onReportCreated, prefilledData }: CreateReportDialogProps) {
  const { user } = useAuth()
  const [reportType, setReportType] = useState("")
  const [siteId, setSiteId] = useState(prefilledData?.siteId || "")
  const [siteName, setSiteName] = useState(prefilledData?.siteName || "")
  const [assignedTo, setAssignedTo] = useState(prefilledData?.assignedTo || "")
  const [date, setDate] = useState<Date>(new Date())
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [attachments, setAttachments] = useState<
    Array<{
      fileName?: string
      fileUrl?: string
      note?: string
    }>
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Installation Report specific fields
  const [installationStatus, setInstallationStatus] = useState("")
  const [timeline, setTimeline] = useState("")
  const [delayReason, setDelayReason] = useState("")
  const [delayDays, setDelayDays] = useState<number>(0)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileUrl = await uploadFile(file, "reports")
        return {
          fileName: file.name,
          fileUrl: fileUrl,
          note: "",
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setAttachments((prev) => [...prev, ...uploadedFiles])
    } catch (error) {
      console.error("Error uploading files:", error)
      alert("Failed to upload files. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const updateAttachmentNote = (index: number, note: string) => {
    setAttachments((prev) => prev.map((attachment, i) => (i === index ? { ...attachment, note } : attachment)))
  }

  const handleGenerateReport = async () => {
    if (!reportType || !siteId || !siteName) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const reportData: Omit<ReportData, "id" | "created"> = {
        reportType,
        siteId,
        siteName,
        assignedTo,
        date: format(date, "yyyy-MM-dd"),
        location: location || "",
        notes: notes || "",
        attachments: attachments.filter((att) => att.fileName && att.fileUrl),
        createdBy: user?.uid || "",
        createdByName: user?.displayName || user?.email || "",
        sales: prefilledData?.sales || "",
        bookingDates: prefilledData?.bookingDates || {
          start: "",
          end: "",
        },
        completionPercentage: 100,
        siteCode: siteId || "",
      }

      // Only add installation-specific fields if they have values and it's an installation report
      if (reportType === "installation-report") {
        if (installationStatus && installationStatus.trim() !== "") {
          reportData.installationStatus = installationStatus
        }
        if (timeline && timeline.trim() !== "") {
          reportData.timeline = timeline
        }
        if (delayReason && delayReason.trim() !== "") {
          reportData.delayReason = delayReason
        }
        if (delayDays > 0) {
          reportData.delayDays = delayDays
        }
      }

      const reportId = await createReport(reportData)

      if (onReportCreated) {
        onReportCreated(reportId)
      }

      // Reset form
      setReportType("")
      setSiteId(prefilledData?.siteId || "")
      setSiteName(prefilledData?.siteName || "")
      setAssignedTo(prefilledData?.assignedTo || "")
      setDate(new Date())
      setLocation("")
      setNotes("")
      setAttachments([])
      setInstallationStatus("")
      setTimeline("")
      setDelayReason("")
      setDelayDays(0)

      onClose()
    } catch (error) {
      console.error("Error creating report:", error)
      alert("Failed to create report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="installation-report">Installation Report</SelectItem>
                <SelectItem value="maintenance-report">Maintenance Report</SelectItem>
                <SelectItem value="inspection-report">Inspection Report</SelectItem>
                <SelectItem value="incident-report">Incident Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Site Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteId">Site ID *</Label>
              <Input
                id="siteId"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="Enter site ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name *</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Enter site name"
              />
            </div>
          </div>

          {/* Assignment and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Enter team/person"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Installation Report Specific Fields */}
          {reportType === "installation-report" && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-lg">Installation Details</h3>

              {/* Installation Status */}
              <div className="space-y-3">
                <Label>Installation Status</Label>
                <RadioGroup value={installationStatus} onValueChange={setInstallationStatus}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="completed" />
                    <Label htmlFor="completed">Completed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-progress" id="in-progress" />
                    <Label htmlFor="in-progress">In Progress</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delayed" id="delayed" />
                    <Label htmlFor="delayed">Delayed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cancelled" id="cancelled" />
                    <Label htmlFor="cancelled">Cancelled</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <Label>Timeline</Label>
                <RadioGroup value={timeline} onValueChange={setTimeline}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on-schedule" id="on-schedule" />
                    <Label htmlFor="on-schedule">On Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ahead-of-schedule" id="ahead-of-schedule" />
                    <Label htmlFor="ahead-of-schedule">Ahead of Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="behind-schedule" id="behind-schedule" />
                    <Label htmlFor="behind-schedule">Behind Schedule</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Delay Reason (conditional) */}
              {(installationStatus === "delayed" || timeline === "behind-schedule") && (
                <div className="space-y-3">
                  <Label>Reason for Delay</Label>
                  <RadioGroup value={delayReason} onValueChange={setDelayReason}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weather" id="weather" />
                      <Label htmlFor="weather">Weather Conditions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="materials" id="materials" />
                      <Label htmlFor="materials">Material Shortage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="permits" id="permits" />
                      <Label htmlFor="permits">Permit Issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="technical" id="technical" />
                      <Label htmlFor="technical">Technical Issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Delay Days (conditional) */}
              {(installationStatus === "delayed" || timeline === "behind-schedule") && (
                <div className="space-y-2">
                  <Label htmlFor="delayDays">Number of Delay Days</Label>
                  <Input
                    id="delayDays"
                    type="number"
                    min="0"
                    value={delayDays}
                    onChange={(e) => setDelayDays(Number.parseInt(e.target.value) || 0)}
                    placeholder="Enter number of days"
                  />
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter specific location details"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter additional notes or observations"
              rows={3}
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {isUploading ? "Uploading..." : "Click to upload files or drag and drop"}
                </span>
                <span className="text-xs text-gray-400 mt-1">Images, videos, PDFs, and documents</span>
              </label>
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-4">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 text-sm truncate">{attachment.fileName}</span>
                    <Input
                      placeholder="Add note..."
                      value={attachment.note || ""}
                      onChange={(e) => updateAttachmentNote(index, e.target.value)}
                      className="flex-1 h-8"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport} disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Creating..." : "Create Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
