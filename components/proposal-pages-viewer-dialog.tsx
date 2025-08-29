"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import type { Proposal } from "@/lib/types/proposal"

interface ProposalPagesViewerDialogProps {
  proposal: Proposal | null
  isOpen: boolean
  onClose: () => void
}

export function ProposalPagesViewerDialog({ proposal, isOpen, onClose }: ProposalPagesViewerDialogProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (!proposal) return null

  // Mock proposal pages - in real implementation, these would come from the proposal data
  const totalPages = Math.max(3, proposal.products.length) // At least 3 pages, or one per product

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleClose = () => {
    setCurrentPage(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 gap-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 font-medium">
              {proposal.proposalNumber || proposal.id?.slice(0, 8).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{proposal.client?.company || "Client Name"}</h2>
            <div className="text-sm text-gray-500">{format(proposal.createdAt, "MMMM d, yyyy")}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="relative w-full max-w-2xl">
            {/* Document Pages Stack Effect */}
            <div className="relative">
              {/* Background pages for stack effect */}
              <div className="absolute inset-0 bg-white rounded-lg shadow-sm transform translate-x-1 translate-y-1 border" />
              <div className="absolute inset-0 bg-white rounded-lg shadow-sm transform translate-x-0.5 translate-y-0.5 border" />

              {/* Main document page */}
              <div className="relative bg-white rounded-lg shadow-lg border aspect-[8.5/11] overflow-hidden">
                {/* Document content area */}
                <div className="h-full p-8 flex flex-col">
                  {/* Document header */}
                  <div className="border-b pb-4 mb-6">
                    <div className="text-xs text-gray-400 mb-2">PROPOSAL</div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {proposal.title || `Proposal for ${proposal.client?.company}`}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      Site Code: {proposal.products[0]?.site_code || "N/A"}
                    </div>
                  </div>

                  {/* Document body - simulated content */}
                  <div className="flex-1 space-y-4">
                    {currentPage === 1 && (
                      <>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-5/6" />
                          <div className="h-3 bg-gray-200 rounded w-4/6" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="aspect-video bg-gray-100 rounded border" />
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-200 rounded w-full" />
                            <div className="h-2 bg-gray-200 rounded w-4/5" />
                            <div className="h-2 bg-gray-200 rounded w-3/5" />
                          </div>
                        </div>
                      </>
                    )}

                    {currentPage === 2 && (
                      <>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-200 rounded w-full" />
                            <div className="h-2 bg-gray-200 rounded w-full" />
                            <div className="h-2 bg-gray-200 rounded w-5/6" />
                          </div>
                        </div>
                        <div className="mt-6 aspect-video bg-gray-100 rounded border" />
                      </>
                    )}

                    {currentPage >= 3 && (
                      <>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-4/5" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-6">
                          <div className="aspect-square bg-gray-100 rounded border" />
                          <div className="aspect-square bg-gray-100 rounded border" />
                          <div className="aspect-square bg-gray-100 rounded border" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Page indicator */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">Page {currentPage}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
