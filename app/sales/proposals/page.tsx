"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import {
  MoreVertical,
  FileText,
  Eye,
  Download,
  Calendar,
  Building2,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Calculator,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format } from "date-fns"
import { getPaginatedProposalsByUserId, getProposalsCountByUserId, downloadProposalPDF } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { useResponsive } from "@/hooks/use-responsive"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs" // Import Tabs components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"

function ProposalsPageContent() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const { user, userData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isMobile } = useResponsive()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("proposals")
  const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.uid) {
      loadProposals(1, true) // Reset to first page when user changes
    }
  }, [user])

  useEffect(() => {
    if (user?.uid) {
      loadProposals(1, true) // Reset to first page when search changes
    }
  }, [searchTerm])

  useEffect(() => {
    const success = searchParams.get("success")
    if (success === "email-sent") {
      setShowSuccessDialog(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const loadProposals = async (page = 1, resetLastDoc = true) => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const lastDocToUse = resetLastDoc ? null : lastDoc
      const result = await getPaginatedProposalsByUserId(
        userData?.company_id || "",
        itemsPerPage,
        lastDocToUse,
        searchTerm,
        null
      )

      setProposals(result.items)
      setFilteredProposals(result.items)
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
      setCurrentPage(page)

      // Get total count for display
      const count = await getProposalsCountByUserId(
        user.uid,
        searchTerm,
        null
      )
      setTotalCount(count)
    } catch (error) {
      console.error("Error loading proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      loadProposals(currentPage + 1, false)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      // For previous page, we need to reset and load from the beginning
      // This is a limitation of Firestore cursor-based pagination
      setLastDoc(null)
      loadProposals(currentPage - 1, true)
    }
  }

  const getStatusConfig = (status: Proposal["status"]) => {
    switch (status) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
          label: "Draft",
        }
      case "sent":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Send,
          label: "Sent",
        }
      case "viewed":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Eye,
          label: "Viewed",
        }
      case "accepted":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          label: "Accepted",
        }
      case "declined":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          label: "Declined",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
          label: "Unknown",
        }
    }
  }

  const handleViewProposal = (proposalId: string) => {
    router.push(`/sales/proposals/${proposalId}`)
  }

  const handleDownloadPDF = async (proposal: Proposal) => {
    // Navigate to detail page and trigger download there
    // This ensures the proposal is rendered and can be captured by html2canvas
    router.push(`/sales/proposals/${proposal.id}?action=download`)
  }

  const handlePrintProposal = (proposal: Proposal) => {
    // Navigate to detail page and trigger print there
    // This ensures the proposal is rendered and can be printed
    router.push(`/sales/proposals/${proposal.id}?action=print`)
  }

  return (
    <>
      <div className="bg-white rounded-tl-[10px] rounded-tr-[10px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <Button
              onClick={() => router.push("/sales/dashboard?action=create-proposal")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Proposal
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search proposals or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>
          </div>

          {loading ? (
            <div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900 mb-4">
                <div>Date</div>
                <div>Proposal ID</div>
                <div>Company</div>
                <div>Contact Person</div>
                <div>Sites</div>
                <div className="text-right">Actions</div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100">
                  <Skeleton className="h-5" />
                  <Skeleton className="h-5" />
                  <Skeleton className="h-5" />
                  <Skeleton className="h-5" />
                  <Skeleton className="h-5" />
                  <Skeleton className="h-8 w-8 ml-auto" />
                </div>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No proposals found" : "No proposals yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Create your first proposal to get started"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/sales/proposals/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Proposal
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900 mb-4">
                <div>Date</div>
                <div>Proposal ID</div>
                <div>Company</div>
                <div>Contact Person</div>
                <div>Sites</div>
                <div className="text-right">Actions</div>
              </div>
              {filteredProposals.map((proposal) => {
                return (
                  <>
                    <div
                      key={proposal.id}
                      className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewProposal(proposal.id)}
                    >
                      <div className="text-sm text-gray-600">
                        {(() => {
                          if (!proposal.createdAt || !(proposal.createdAt instanceof Date) || isNaN(proposal.createdAt.getTime())) {
                            return "N/A"
                          }
                          return format(proposal.createdAt, "MMM d, yyyy")
                        })()}
                      </div>
                      <div className="text-sm text-gray-900">{proposal.id.slice(0, 8)}...</div>
                      <div className="text-sm text-gray-900">{proposal.client.company}</div>
                      <div className="text-sm text-gray-900">{proposal.client.contactPerson}</div>
                      <div className="flex flex-col">
                        <button
                          className="flex items-center gap-1 text-sm text-gray-900 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedProposals(prev => {
                              const newSet = new Set(prev)
                              if (newSet.has(proposal.id)) {
                                newSet.delete(proposal.id)
                              } else {
                                newSet.add(proposal.id)
                              }
                              return newSet
                            })
                          }}
                        >
                          {proposal.products.length}
                          {expandedProposals.has(proposal.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {expandedProposals.has(proposal.id) && (
                          <div className="mt-2 space-y-1">
                            {proposal.products.map((product, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs animate-in fade-in-0 slide-in-from-top-1"
                                style={{
                                  animationDelay: `${i * 50}ms`,
                                  animationDuration: "200ms",
                                }}
                              >
                                <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-gray-700">{product.name || "No Product Name" || `Site ${i + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewProposal(proposal.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(proposal)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintProposal(proposal)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredProposals.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredProposals.length}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                hasMore={hasMore}
              />
            </div>
          )}
        </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm mx-auto text-center border-0 shadow-lg">
          <DialogTitle className="sr-only">Success</DialogTitle>
          <div className="py-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Congratulations!</h2>
              <div className="flex justify-center mb-4">
                <div className="text-6xl">🎉</div>
              </div>
              <p className="text-gray-600">You have successfully sent a proposal!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ProposalsPage() {
  return <ProposalsPageContent />
}
