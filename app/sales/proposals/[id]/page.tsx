"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, FileText, Grid3X3, Edit, Download, Plus, X, ImageIcon } from "lucide-react"
import { getProposalById } from "@/lib/proposal-service"
import { getProposalTemplatesByCompanyId, createProposalTemplate } from "@/lib/firebase-service"
import type { Proposal } from "@/lib/types/proposal"
import type { ProposalTemplate } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false)
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

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
    setTemplatesLoading(true)
    try {
      const templatesData = await getProposalTemplatesByCompanyId("company_123") // Replace with actual company_id
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
    fetchTemplates()
  }

  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await createProposalTemplate({
        name: "New Template",
        background_url: "",
        company_id: "company_123", // Replace with actual company_id
      })
      toast({
        title: "Success",
        description: "Template created successfully",
      })
      fetchTemplates() // Refresh the list
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    }
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
              <h2 className="text-xl font-semibold text-gray-900">Proposal Templates</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplatesPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Choose a template or create a new one</p>
                <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading templates...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Grid3X3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">No templates found</p>
                    <Button onClick={handleCreateTemplate} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          toast({
                            title: "Template Selected",
                            description: `Using template: ${template.name}`,
                          })
                          setShowTemplatesPanel(false)
                        }}
                      >
                        <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                          {template.background_url ? (
                            <img
                              src={template.background_url || "/placeholder.svg"}
                              alt={template.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {template.created?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
