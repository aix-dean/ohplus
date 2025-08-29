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

  const totalPages = Math.max(3, Math.ceil(proposal.products.length / 2)) // Dynamic page calculation

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
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 font-medium">
              {proposal.proposalNumber || proposal.id?.slice(0, 8).toUpperCase()}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">{proposal.client?.company || "Client Name"}</h2>
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

        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50 min-h-[600px]">
          <div className="relative w-full max-w-3xl">
            {/* Document Pages Stack */}
            <div className="relative">
              {/* Background pages for subtle stack effect */}
              <div
                className="absolute inset-0 bg-gray-200 rounded-sm transform translate-x-2 translate-y-2"
                style={{ height: "420px" }}
              />
              <div
                className="absolute inset-0 bg-gray-300 rounded-sm transform translate-x-1 translate-y-1"
                style={{ height: "420px" }}
              />

              {/* Main document page */}
              <div className="relative bg-white rounded-sm shadow-lg border" style={{ height: "420px" }}>
                {/* Document content area */}
                <div className="h-full p-8 flex flex-col relative overflow-hidden">
                  {currentPage === 1 && (
                    <>
                      {/* Header section */}
                      <div className="mb-8">
                        <div className="h-4 bg-gray-200 rounded w-full mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                      </div>

                      {/* Main content area with image and text layout */}
                      <div className="flex-1 grid grid-cols-2 gap-8">
                        <div className="bg-gray-100 rounded aspect-video flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded shadow-sm" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-5/6" />
                          <div className="h-3 bg-gray-200 rounded w-4/6" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>

                      {/* Footer section */}
                      <div className="mt-8">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </div>
                    </>
                  )}

                  {currentPage === 2 && (
                    <>
                      {/* Header */}
                      <div className="mb-6">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                      </div>

                      {/* Content sections */}
                      <div className="space-y-6 flex-1">
                        <div className="bg-gray-100 rounded h-32" />
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-4/5" />
                        </div>
                        <div className="bg-gray-100 rounded h-24" />
                      </div>
                    </>
                  )}

                  {currentPage >= 3 && (
                    <>
                      {/* Header */}
                      <div className="mb-6">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                      </div>

                      {/* Grid content */}
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-100 rounded aspect-square" />
                          <div className="bg-gray-100 rounded aspect-square" />
                          <div className="bg-gray-100 rounded aspect-square" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-5/6" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="absolute bottom-4 right-4">
                  <div className="bg-gray-700 text-white text-xs px-3 py-1 rounded shadow-sm font-medium">
                    Page {currentPage}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 left-0 right-2 h-4 bg-gray-200 rounded-sm" />
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-6 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 rounded-full border-gray-300 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-600 min-w-[100px] text-center font-medium">
              {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 rounded-full border-gray-300 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-white">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Button variant="outline" className="px-6 bg-transparent">
              Save as Draft
            </Button>
            <Button className="px-8 bg-green-500 hover:bg-green-600">Send</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
