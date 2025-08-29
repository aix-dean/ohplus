"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Proposal } from "@/lib/types/proposal"

interface ProposalViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
}

export function ProposalViewerDialog({ isOpen, onClose, proposal }: ProposalViewerDialogProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate total pages based on proposal products
  const totalPages = proposal.products ? Math.ceil(proposal.products.length / 2) : 1

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[95vh] p-0 gap-0 bg-white rounded-2xl">
        {/* Header - matches image design */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">
              {proposal.proposalNumber || proposal.code || "SUM0075"}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{proposal.client?.company || "Summit Media"}</h2>
            <div className="text-sm text-gray-500">
              {proposal.createdAt
                ? new Date(proposal.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Document Viewer - prominently displayed at center */}
        <div className="flex-1 flex items-center justify-center px-6 pb-6 bg-gray-50">
          <div className="relative w-full max-w-4xl">
            {/* Document Container */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Document Pages */}
              <div className="aspect-[8.5/11] bg-gray-100 relative">
                {/* Mock proposal page content based on actual data */}
                <div className="w-full h-full bg-white">
                  {/* Header section */}
                  <div className="h-16 bg-gray-200 border-b border-gray-300"></div>

                  {/* Content area */}
                  <div className="p-8 space-y-6">
                    {/* Title section */}
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>

                    {/* Main content grid - matches proposal layout */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded"></div>
                          <div className="h-4 bg-gray-300 rounded w-4/5"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/5"></div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded"></div>
                          <div className="h-4 bg-gray-300 rounded w-4/5"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/5"></div>
                        </div>
                      </div>
                    </div>

                    {/* Additional content lines */}
                    <div className="space-y-3 pt-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>

                {/* Page indicator - positioned like in the image */}
                <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-80 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Page {currentPage}
                </div>
              </div>

              {/* Navigation arrows - subtle and positioned outside document */}
              {totalPages > 1 && (
                <>
                  <Button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-white shadow-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </Button>

                  <Button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-white shadow-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </Button>
                </>
              )}
            </div>

            {/* Page dots navigation - clean and minimal */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      currentPage === page ? "bg-gray-800 w-6" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
