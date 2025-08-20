"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, FileText, LayoutTemplateIcon as Template } from "lucide-react"
import { getProposalById } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import type { ProposalTemplate } from "@/lib/types/proposal-template"
import { useToast } from "@/hooks/use-toast"
import { ProposalTemplateDialog } from "@/components/proposal-template-dialog"

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

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

  const handleTemplateSelect = (template: ProposalTemplate) => {
    // Here you would implement the logic to apply the template to the current proposal
    // For now, we'll just show a success message
    console.log("Selected template:", template)
    toast({
      title: "Template Applied",
      description: `Template "${template.name}" has been applied to this proposal`,
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
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg border-transparent p-8 min-h-[600px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{proposal.title}</h1>
          <ProposalTemplateDialog onSelectTemplate={handleTemplateSelect}>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Template className="h-4 w-4" />
              Use Template
            </Button>
          </ProposalTemplateDialog>
        </div>

        {/* Container content will go here */}
        <div className="text-center py-12 text-gray-500">
          <p>Proposal content will be displayed here.</p>
          <p className="text-sm mt-2">Click "Use Template" to apply a template to this proposal.</p>
        </div>
      </div>
    </div>
  )
}
