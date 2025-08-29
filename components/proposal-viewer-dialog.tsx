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

  // Mock proposal pages - in real implementation, this would come from the proposal data
  const totalPages = 5

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
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">
              {proposal.proposalNumber || proposal.code || "SUM0075"}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{proposal.title || "Summit Media"}</h2>
            <div className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full">
            {/* Document Pages Container */}
            <div className="aspect-[8.5/11] bg-gray-100 rounded-lg overflow-hidden relative">
              {/* Mock document content */}
              <div className="w-full h-full bg-white p-8 flex flex-col">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-6"></div>

                <div className="flex-1 grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>

                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>

              {/* Page indicator */}
              <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                Page {currentPage}
              </div>
            </div>

            {/* Navigation buttons */}
            {totalPages > 1 && (
              <>
                <Button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer with page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    currentPage === page ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
