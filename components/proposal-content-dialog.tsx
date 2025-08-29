"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import type { Proposal } from "@/lib/types/proposal"

interface ProposalContentDialogProps {
  proposal: Proposal | null
  isOpen: boolean
  onClose: () => void
}

export function ProposalContentDialog({ proposal, isOpen, onClose }: ProposalContentDialogProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (!proposal) return null

  // Mock proposal pages - in a real implementation, these would come from the proposal data
  const totalPages = 5
  const proposalPages = Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: i + 1,
    content: `Page ${i + 1} content for ${proposal.title}`,
  }))

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
            <h2 className="text-xl font-semibold text-gray-900">{proposal.client?.company || proposal.title}</h2>
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

        {/* Proposal Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="relative w-full max-w-2xl">
            {/* Document Pages Stack Effect */}
            <div className="relative">
              {/* Background pages for stack effect */}
              <div className="absolute top-2 left-2 w-full h-96 bg-gray-200 rounded-lg shadow-sm"></div>
              <div className="absolute top-1 left-1 w-full h-96 bg-gray-300 rounded-lg shadow-sm"></div>

              {/* Main document page */}
              <div className="relative w-full h-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Document content area */}
                <div className="p-8 h-full flex flex-col">
                  <div className="flex-1 space-y-4">
                    {/* Mock document content */}
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>

                    <div className="mt-8 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="h-16 bg-gray-100 rounded"></div>
                      <div className="h-16 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Page indicator */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Page {currentPage}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600 font-medium">
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
        </div>

        {/* Footer with proposal details */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <div className="text-xs text-gray-500">
            Site Code: {proposal.products?.[0]?.site_code || "N/A"} • Created:{" "}
            {format(proposal.createdAt, "MMM d, yyyy")} •{proposal.products?.length || 0} sites included
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
