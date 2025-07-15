"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, ImageIcon, Eye, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { getProductById, type Product, uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
}

interface Team {
  id: string
  name: string
  members: string[]
  createdAt: string
}

interface AttachmentData {
  note: string
  file?: File
  fileName?: string
  preview?: string
  fileUrl?: string
  uploading?: boolean
  fileType?: string
}

export function CreateReportDialog({ open, onOpenChange, siteId }: CreateReportDialogProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("completion-report")
  const [date, setDate] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [showNewTeamInput, setShowNewTeamInput] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [attachments, setAttachments] = useState<AttachmentData[]>([{ note: "" }, { note: "" }])
  const [previewModal, setPreviewModal] = useState<{ open: boolean; file?: File; preview?: string }>({ open: false })

  // Installation report specific fields
  const [status, setStatus] = useState("")
  const [timeline, setTimeline] = useState("on-time")
  const [delayReason, setDelayReason] = useState("")
  const [delayDays, setDelayDays] = useState("")

  const { toast } = useToast()
  const { user, userData, projectData } = useAuth()
  const router = useRouter()

  // Fetch product data when dialog opens
  useEffect(() => {
    if (open && siteId) {
      fetchProductData()
      fetchTeams()
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

  const fetchTeams = async () => {
    setLoadingTeams(true)
    try {
      // Mock teams data - replace with actual API call
      const mockTeams: Team[] = [
        { id: "1", name: "Installation Team A", members: ["John Doe", "Jane Smith"], createdAt: "2024-01-01" },
        { id: "2", name: "Installation Team B", members: ["Mike Johnson", "Sarah Wilson"], createdAt: "2024-01-02" },
        { id: "3", name: "Installation Team C", members: ["David Brown", "Lisa Davis"], createdAt: "2024-01-03" },
        { id: "4", name: "Maintenance Team", members: ["Tom Wilson", "Amy Chen"], createdAt: "2024-01-04" },
      ]
      setTeams(mockTeams)
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      })
    } finally {
      setLoadingTeams(false)
    }
  }

  const handleCreateNewTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      })
      return
    }

    try {
      // Mock team creation - replace with actual API call
      const newTeam: Team = {
        id: Date.now().toString(),
        name: newTeamName,
        members: [],
        createdAt: new Date().toISOString(),
      }

      setTeams((prev) => [...prev, newTeam])
      setSelectedTeam(newTeam.id)
      setNewTeamName("")
      setShowNewTeamInput(false)

      toast({
        title: "Success",
        description: "Team created successfully",
      })
    } catch (error) {
      console.error("Error creating team:", error)
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      })
    }
  }

  const handleAttachmentNoteChange = (index: number, note: string) => {
    const newAttachments = [...attachments]
    newAttachments[index].note = note
    setAttachments(newAttachments)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop()

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <ImageIcon className="h-8 w-8 text-green-500" />
      default:
        return <ImageIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload only image files (JPEG, PNG, GIF, WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      // Set uploading state immediately
      const newAttachments = [...attachments]
      newAttachments[index] = {
        ...newAttachments[index],
        file,
        fileName: file.name,
        fileType: file.type,
        uploading: true,
      }

      // Create preview for images immediately
      if (file.type.startsWith("image/")) {
        try {
          const preview = await createFilePreview(file)
          newAttachments[index].preview = preview
        } catch (error) {
          console.error("Error creating preview:", error)
        }
      }

      setAttachments(newAttachments)

      try {
        // Upload to Firebase Storage with a proper path structure
        const timestamp = Date.now()
        const uploadPath = `reports/${siteId}/${timestamp}_${file.name}`

        console.log("Uploading file to Firebase Storage:", uploadPath)
        const downloadURL = await uploadFileToFirebaseStorage(file, uploadPath)
        console.log("File uploaded successfully, download URL:", downloadURL)

        // Update attachment with Firebase URL
        const updatedAttachments = [...attachments]
        updatedAttachments[index] = {
          ...updatedAttachments[index],
          file,
          fileName: file.name,
          fileType: file.type,
          preview: newAttachments[index].preview,
          fileUrl: downloadURL, // This is the key field that was missing
          uploading: false,
        }
        setAttachments(updatedAttachments)

        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
      } catch (error) {
        console.error("Error uploading file:", error)

        // Reset the attachment on error
        const errorAttachments = [...attachments]
        errorAttachments[index] = {
          note: newAttachments[index].note,
          uploading: false,
        }
        setAttachments(errorAttachments)

        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePreviewFile = (attachment: AttachmentData, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!attachment.file) return

    // Handle images - show in full screen modal
    if (attachment.file.type.startsWith("image/")) {
      setPreviewModal({
        open: true,
        file: attachment.file,
        preview: attachment.preview,
      })
    }
  }

  const renderFilePreview = (attachment: AttachmentData, index: number) => {
    if (attachment.uploading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-1">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-xs text-blue-600">Uploading...</span>
        </div>
      )
    }

    if (!attachment.file || !attachment.fileName) {
      return (
        <label
          htmlFor={`file-${index}`}
          className="cursor-pointer flex flex-col items-center justify-center h-full space-y-1"
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <span className="text-xs text-gray-500">Upload</span>
        </label>
      )
    }

    const isImage = attachment.file.type.startsWith("image/")

    return (
      <div className="relative w-full h-full group">
        <label
          htmlFor={`file-${index}`}
          className="cursor-pointer flex flex-col items-center justify-center h-full space-y-1 p-1"
        >
          {isImage && attachment.preview ? (
            <img
              src={attachment.preview || "/placeholder.svg"}
              alt={attachment.fileName}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="flex items-center justify-center">{getFileIcon(attachment.fileName)}</div>
          )}
        </label>

        {/* Preview Button */}
        <button
          onClick={(e) => handlePreviewFile(attachment, e)}
          className="absolute top-1 right-1 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Preview file"
        >
          <Eye className="h-3 w-3" />
        </button>

        {/* Success indicator when uploaded */}
        {attachment.fileUrl && !attachment.uploading && (
          <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    )
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

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to create a report",
        variant: "destructive",
      })
      return
    }

    // Check if at least one attachment has a file with fileUrl
    const hasValidAttachments = attachments.some((att) => att.file && att.fileUrl)
    if (!hasValidAttachments) {
      toast({
        title: "Error",
        description: "Please upload at least one attachment and wait for it to finish uploading",
        variant: "destructive",
      })
      return
    }

    // Check if any files are still uploading
    const isUploading = attachments.some((att) => att.uploading)
    if (isUploading) {
      toast({
        title: "Error",
        description: "Please wait for all files to finish uploading",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Build the report data for preview (without saving to Firebase)
      const reportData: any = {
        id: `preview-${Date.now()}`, // Temporary ID for preview
        siteId: product.id,
        siteName: product.name || "Unknown Site",
        companyId: projectData?.project_id || userData?.project_id || user.uid,
        sellerId: product.seller_id || user.uid,
        client: "Summit Media", // This would come from booking data in real implementation
        clientId: "summit-media-id", // This would come from booking data
        bookingDates: {
          start: "2025-05-20", // This would come from booking data
          end: "2025-06-20",
        },
        breakdate: "2025-05-20",
        sales: user.displayName || user.email || "Unknown User",
        reportType,
        date,
        attachments: attachments
          .filter((att) => (att.note.trim() !== "" || att.file) && att.fileUrl) // Only include attachments with fileUrl
          .map((att) => ({
            note: att.note,
            fileName: att.fileName || "",
            fileType: att.fileType || att.file?.type || "",
            fileUrl: att.fileUrl, // This is the crucial field for the report display
          })),
        status: "draft",
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Unknown User",
        category: "logistics",
        subcategory: product.content_type || "general",
        priority: "medium",
        completionPercentage: reportType === "completion-report" ? 100 : 0,
        tags: [reportType, product.content_type || "general"].filter(Boolean),
        created: new Date(), // Use current date for preview
        isPreview: true, // Flag to indicate this is a preview
      }

      // Add optional fields only if they have values
      if (product.site_code) {
        reportData.siteCode = product.site_code
      }

      if (product.light?.location || product.specs_rental?.location) {
        reportData.location = product.light?.location || product.specs_rental?.location
      }

      if (selectedTeam) {
        reportData.assignedTo = selectedTeam
      }

      // Only add installation-specific fields if they have non-empty values
      if (reportType === "installation-report") {
        // Only add installationStatus if status has a valid numeric value
        if (status && status.trim() !== "" && !isNaN(Number(status)) && Number(status) >= 0) {
          reportData.installationStatus = status.trim()
        }

        // Only add installationTimeline if it's explicitly set to delayed
        if (timeline === "delayed") {
          reportData.installationTimeline = timeline

          // Only add delay-related fields if they have actual values
          if (delayReason && delayReason.trim() !== "") {
            reportData.delayReason = delayReason.trim()
          }
          if (delayDays && delayDays.trim() !== "" && !isNaN(Number(delayDays)) && Number(delayDays) > 0) {
            reportData.delayDays = delayDays.trim()
          }
        }
      }

      console.log("Generated report data with attachments:", reportData.attachments)

      // Store the report data in sessionStorage for the preview page
      sessionStorage.setItem("previewReportData", JSON.stringify(reportData))
      sessionStorage.setItem("previewProductData", JSON.stringify(product))

      toast({
        title: "Success",
        description: "Service Report Generated Successfully!",
      })

      onOpenChange(false)
      // Reset form
      setReportType("completion-report")
      setDate("")
      setSelectedTeam("")
      setAttachments([{ note: "" }, { note: "" }])
      setStatus("")
      setTimeline("on-time")
      setDelayReason("")
      setDelayDays("")

      // Navigate to the report preview page with preview flag
      router.push(`/logistics/reports/preview`)
    } catch (error) {
      console.error("Error generating report preview:", error)
      toast({
        title: "Error",
        description: "Failed to generate report preview",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md relative sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-2 -right-2 z-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">Service Report</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto scrollbar-hide space-y-3 px-1">
            {/* Booking Information Section */}
            <div className="bg-gray-100 p-3 rounded-lg space-y-1">
              <div className="text-base">
                <span className="font-medium">Site:</span> {product?.name || "Loading..."}
              </div>
              <div className="text-base">
                <span className="font-medium">Client:</span> Summit Media
              </div>
              <div className="text-base">
                <span className="font-medium">Booking:</span> May 20 - June 20, 2025
              </div>
              <div className="text-base">
                <span className="font-medium">Sales:</span> {user?.displayName || user?.email || "Current User"}
              </div>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report-type" className="text-sm font-semibold text-gray-900">
                Report Type:
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion-report">Completion Report</SelectItem>
                  <SelectItem value="monitoring-report">Monitoring Report</SelectItem>
                  <SelectItem value="installation-report">Installation Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-gray-900">
                Date:
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="AutoFill"
                className="h-9 text-sm"
              />
            </div>

            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="team" className="text-sm font-semibold text-gray-900">
                Team:
              </Label>
              {showNewTeamInput ? (
                <div className="flex gap-1">
                  <Input
                    placeholder="Enter team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    onClick={handleCreateNewTeam}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-9 px-3 text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTeamInput(false)
                      setNewTeamName("")
                    }}
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTeams ? (
                      <SelectItem value="loading" disabled>
                        Loading teams...
                      </SelectItem>
                    ) : (
                      <>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="create-new"
                          onSelect={() => setShowNewTeamInput(true)}
                          className="text-blue-600 font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create New Team
                          </div>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Installation Report Specific Fields */}
            {reportType === "installation-report" && (
              <>
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-900">
                    Status:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="status"
                      type="number"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm flex-1"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-600 font-medium">% of 100</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Timeline:</Label>
                  <RadioGroup value={timeline} onValueChange={setTimeline} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on-time" id="on-time" className="h-4 w-4" />
                      <Label htmlFor="on-time" className="text-sm font-medium">
                        On Time
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delayed" id="delayed" className="h-4 w-4" />
                      <Label htmlFor="delayed" className="text-sm font-medium">
                        Delayed
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Delay Details */}
                  {timeline === "delayed" && (
                    <div className="space-y-2 mt-3 pl-6 border-l-2 border-red-200">
                      <Input
                        placeholder="Reason for delay..."
                        value={delayReason}
                        onChange={(e) => setDelayReason(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={delayDays}
                          onChange={(e) => setDelayDays(e.target.value)}
                          placeholder="0"
                          className="h-9 text-sm flex-1"
                          min="0"
                        />
                        <span className="text-sm text-gray-600 font-medium">Days</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Attachments: <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="space-y-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-16 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center">
                      <input
                        type="file"
                        className="hidden"
                        id={`file-${index}`}
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => handleFileUpload(index, e)}
                        disabled={attachment.uploading}
                      />
                      {renderFilePreview(attachment, index)}
                    </div>
                    <Input
                      placeholder="Add Note..."
                      value={attachment.note}
                      onChange={(e) => handleAttachmentNoteChange(index, e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Report Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={loading || attachments.some((att) => att.uploading)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-medium mt-4"
            >
              {loading
                ? "Generating..."
                : attachments.some((att) => att.uploading)
                  ? "Uploading files..."
                  : "Generate Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Preview Modal */}
      <Dialog open={previewModal.open} onOpenChange={(open) => setPreviewModal({ open })}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <button
              onClick={() => setPreviewModal({ open: false })}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>

            {previewModal.file && previewModal.file.type.startsWith("image/") && previewModal.preview && (
              <img
                src={previewModal.preview || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}
