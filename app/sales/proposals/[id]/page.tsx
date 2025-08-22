"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, FileText, Grid3X3, Edit, Download, Plus, X, ImageIcon, Upload } from "lucide-react"
import { getProposalById } from "@/lib/proposal-service"
import {
  getProposalTemplatesByCompanyId,
  createProposalTemplate,
  uploadFileToFirebaseStorage,
} from "@/lib/firebase-service"
import type { Proposal } from "@/lib/types/proposal"
import type { ProposalTemplate } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    background_url: "",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchProposal() {
      if (params.id) {
        try {
          const proposalData = await getProposalById(params.id as string)
          setProposal(proposalData)
        } catch (error) {
          console.error("Error fetching proposal:", error)
          toast({
            title: "Error",
            description: "Failed to load proposal details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProposal()
  }, [params.id, toast])

  const fetchTemplates = async () => {
    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    setTemplatesLoading(true)
    try {
      const templatesData = await getProposalTemplatesByCompanyId(userData.company_id)
      setTemplates(templatesData)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleTemplates = () => {
    setShowTemplatesPanel(true)
    setShowCreateForm(false)
    fetchTemplates()
  }

  const handleCreateTemplate = () => {
    setShowCreateForm(true)
    setFormData({ name: "", background_url: "" })
    setSelectedFile(null)
    setFilePreview("")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload only image files (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      })
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview("")
    setFormData((prev) => ({ ...prev, background_url: "" }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    setFormLoading(true)
    try {
      let backgroundUrl = formData.background_url

      if (selectedFile) {
        setUploading(true)
        try {
          const uploadPath = `templates/backgrounds/${Date.now()}_${selectedFile.name}`
          backgroundUrl = await uploadFileToFirebaseStorage(selectedFile, uploadPath)
          toast({
            title: "Success",
            description: "Background image uploaded successfully",
          })
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError)
          toast({
            title: "Error",
            description: "Failed to upload background image",
            variant: "destructive",
          })
          return
        } finally {
          setUploading(false)
        }
      }

      await createProposalTemplate({
        name: formData.name.trim(),
        background_url: backgroundUrl,
        company_id: userData.company_id,
      })
      toast({
        title: "Success",
        description: "Template created successfully",
      })
      setShowCreateForm(false)
      setFormData({ name: "", background_url: "" })
      setSelectedFile(null)
      setFilePreview("")
      fetchTemplates()
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBackToList = () => {
    setShowCreateForm(false)
    setFormData({ name: "", background_url: "" })
    setSelectedFile(null)
    setFilePreview("")
  }

  const handleEdit = () => {
    toast({
      title: "Edit Mode",
      description: "Entering edit mode...",
    })
  }

  const handleDownload = () => {
    toast({
      title: "Download",
      description: "Downloading proposal...",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => router.push("/sales/proposals")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-8">
      {showTemplatesPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateForm ? "Create New Template" : "Proposal Templates"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplatesPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {showCreateForm ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      type="text"
                      placeholder="Enter template name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Image (Optional)</Label>
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="background-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="background-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {filePreview && (
                          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                            <img
                              src={filePreview || "/placeholder.svg"}
                              alt="Background preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToList}
                      disabled={formLoading || uploading}
                    >
                      Back to Templates
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formLoading || uploading}>
                      {formLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {uploading ? "Uploading..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Template
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">Choose a template or create a new one</p>
                    <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>

                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading templates...</span>
                    </div>
                  ) : templates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => {
                            toast({
                              title: "Template Selected",
                              description: `Selected template: ${template.name}`,
                            })
                          }}
                        >
                          {template.background_url ? (
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3">
                              <img
                                src={template.background_url || "/placeholder.svg"}
                                alt={template.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-3">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(template.created.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Grid3X3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                      <p className="text-gray-600 mb-4">Create your first proposal template to get started</p>
                      <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Template
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed left-80 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-10">
        <div className="flex flex-col items-center">
          <Button
            onClick={handleTemplates}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-2"
          >
            <Grid3X3 className="h-6 w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-2 font-medium">Templates</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={handleEdit}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-2"
          >
            <Edit className="h-6 w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-2 font-medium">Edit</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-2"
          >
            <Download className="h-6 w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-2 font-medium">Download</span>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg border-transparent p-8 min-h-[600px]">
        {/* Container content will go here */}
      </div>
    </div>
  )
}
