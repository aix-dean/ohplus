"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getProposalsByUserId } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import type { Product } from "@/lib/firebase-service"
import { format } from "date-fns"
import { FileText } from "lucide-react"
import { ProposalSitesModal } from "./proposal-sites-modal"

interface ProposalHistoryProps {
  selectedClient?: {
    id: string
    company: string
    contactPerson: string
  } | null
  onCopySites?: (sites: Product[]) => void
}

export function ProposalHistory({ selectedClient, onCopySites }: ProposalHistoryProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.uid) {
      loadProposals()
    }
  }, [user])

  const loadProposals = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userProposals = await getProposalsByUserId(user.uid)
      setProposals(userProposals)
    } catch (error) {
      console.error("Error loading proposal history:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = selectedClient
    ? proposals.filter(
        (proposal) =>
          proposal.client.company.toLowerCase().includes(selectedClient.company.toLowerCase()) ||
          proposal.client.contactPerson.toLowerCase().includes(selectedClient.contactPerson.toLowerCase()),
      )
    : proposals

  const handleProposalClick = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProposal(null)
  }

  return (
    <>
      <Card className="w-full h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle>
            Proposal History
            {selectedClient && (
              <span className="text-sm font-normal text-gray-500 block">for {selectedClient.company}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {selectedClient ? `No proposals found for ${selectedClient.company}.` : "No proposals found."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => handleProposalClick(proposal)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 line-clamp-1">{proposal.title}</div>
                      <div className="text-sm text-gray-500">{format(proposal.createdAt, "MMM d, yyyy")}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <ProposalSitesModal
        proposal={selectedProposal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCopySites={onCopySites}
      />
    </>
  )
}
