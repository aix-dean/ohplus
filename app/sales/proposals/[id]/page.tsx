"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DownloadIcon, LayoutGrid, Pencil, History, Loader2, FileText } from "lucide-react"
import { getProposalById } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { useToast } from "@/hooks/use-toast"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false)

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
    <div
      className="min-h-screen py-6 px-4 sm:px-6 relative"
      style={{
        backgroundImage: `url('/placeholder.svg?height=1080&width=1920')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-semibold">Finalize Proposal</span>
            </Button>
            <span className="text-gray-400">|</span>
            <span className="font-medium text-gray-900">{proposal.proposalNumber}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsComingSoonDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Activity</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-start gap-6 mt-6 relative z-10">
        <div className="flex flex-col space-y-4 z-20 hidden lg:flex">
          <Button
            variant="ghost"
            onClick={() => setIsComingSoonDialogOpen(true)}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
          >
            <LayoutGrid className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsComingSoonDialogOpen(true)}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
          >
            <Pencil className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsComingSoonDialogOpen(true)}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
          >
            <DownloadIcon className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Download</span>
          </Button>
        </div>

        <div className="max-w-[850px] bg-white/95 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="p-8 min-h-[600px]">{/* Blank content area ready for new implementation */}</div>
        </div>
      </div>

      <ComingSoonDialog
        isOpen={isComingSoonDialogOpen}
        onClose={() => setIsComingSoonDialogOpen(false)}
        feature="Templates"
      />
    </div>
  )
}
