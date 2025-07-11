"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, ImageIcon, Eye, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getProductById, type Product } from "@/lib/firebase-service"
import { createReport, type ReportData } from "@/lib/report-service"
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
  const [attachments, setAttachments] = useState<{ note: string; file?: File; fileName?: string; preview?: string }[]>([
    { note: "" },
    { note: "" },
  ])
  const [previewModal, setPreviewModal] = useState<{ open: boolean; file?: File; preview?: string }>({ open: false })
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
      const newAttachments = [...attachments]
      newAttachments[index].file = file
      newAttachments[index].fileName = file.name

      // Create preview for images
      if (file.type.startsWith("image/")) {
        try {
          const preview = await createFilePreview(file)
          newAttachments[index].preview = preview
        } catch (error) {
          console.error("Error creating preview:", error)
        }
      }

      setAttachments(newAttachments)
    }
  }

  const handlePreviewFile = (
    attachment: { note: string; file?: File; fileName?: string; preview?: string },
    e: React.MouseEvent,
  ) => {
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

  const renderFilePreview = (
    attachment: { note: string; file?: File; fileName?: string; preview?: string },
    index: number,
  ) => {
    if (!attachment.file || !attachment.fileName) {
      return (
        <label
          htmlFor={`file-${index}`}
          className="cursor-pointer flex flex-col items-center justify-center h-full space-y-2"
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="text-xs text-gray-500">Click to upload</span>
        </label>
      )
    }

    const isImage = attachment.file.type.startsWith("image/")

    return (
      <div className="relative w-full h-full group">
        <label
          htmlFor={`file-${index}`}
          className="cursor-pointer flex flex-col items-center justify-center h-full space-y-2 p-2"
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

    setLoading(true)
    try {
      const reportData: ReportData = {
        siteId: product.id,
        siteName: product.name || "Unknown Site",
        siteCode: product.site_code,
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
          .filter((att) => att.note.trim() !== "" || att.file)
          .map((att) => ({
            note: att.note,
            file: att.file,
            fileName: att.fileName,
            fileType: att.file?.type,
          })),
        status: "draft",
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Unknown User",
        location: product.light?.location || product.specs_rental?.location,
        category: "logistics",
        subcategory: product.content_type || "general",
        priority: "medium",
        completionPercentage: reportType === "completion-report" ? 100 : 0,
        tags: [reportType, product.content_type || "general"].filter(Boolean),
      }

      const reportId = await createReport(reportData)

      toast({
        title: "Success",
        description: "Report created successfully",
      })

      onOpenChange(false)
      // Reset form
      setReportType("completion-report")
      setDate("")
      setSelectedTeam("")
      setAttachments([{ note: "" }, { note: "" }])

      // Navigate to the report preview page
      router.push(`/logistics/reports/${reportId}`)
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md relative sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-2 -right-2 z-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Service Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
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
                <span className="font-medium">Sales:</span> {user?.displayName || user?.email || "Current User"}
              </div>
            </div>

            {/* Report Type */}
            <div className="space-y-3">
              <Label htmlFor="report-type" className="text-base font-medium text-gray-900">
                Report Type:
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-12">
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
            <div className="space-y-3">
              <Label htmlFor="date" className="text-base font-medium text-gray-900">
                Date:
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="AutoFill"
                className="h-12"
              />
            </div>

            {/* Team */}
            <div className="space-y-3">
              <Label htmlFor="team" className="text-base font-medium text-gray-900">
                Team:
              </Label>
              {showNewTeamInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="flex-1 h-12"
                  />
                  <Button onClick={handleCreateNewTeam} size="sm" className="bg-green-600 hover:bg-green-700">
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTeamInput(false)
                      setNewTeamName("")
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="h-12">
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

            {/* Attachments */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900">Attachments:</Label>
              <div className="grid grid-cols-2 gap-3">
                {attachments.map((attachment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center">
                      <input
                        type="file"
                        className="hidden"
                        id={`file-${index}`}
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => handleFileUpload(index, e)}
                      />
                      {renderFilePreview(attachment, index)}
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
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
            >
              {loading ? "Generating..." : "Generate Report"}
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
    </>
  )
}
