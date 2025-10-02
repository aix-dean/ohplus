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
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Printer,
} from "lucide-react"
import { format } from "date-fns"
import { getPaginatedProposalsByUserId, getProposalsCountByUserId, downloadProposalPDF } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { useResponsive } from "@/hooks/use-responsive"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

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
  const [isSearching, setIsSearching] = useState(false)

  let content;
  if (loading) {
    content = (
      <Card className="bg-white overflow-hidden rounded-t-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900 border-0">Date</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Proposal ID</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Company</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Contact Person</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Site</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b border-gray-200">
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right py-3">
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  } else if (filteredProposals.length === 0) {
    content = (
      <Card className="bg-white rounded-xl">
        <CardContent className="text-center py-12">
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
        </CardContent>
      </Card>
    )
  } else {
    content = (
      <Card className="bg-white overflow-hidden rounded-t-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900 border-0">Date</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Proposal ID</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Company</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Contact Person</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Site</TableHead>
              <TableHead className="font-semibold text-gray-900 border-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProposals.map((proposal) => (
              <TableRow
                key={proposal.id}
                className="cursor-pointer border-b border-gray-200"
                onClick={() => handleViewProposal(proposal.id)}
              >
                <TableCell className="py-3">
                  <div className="text-sm text-gray-600">
                    {(() => {
                      if (!proposal.createdAt || !(proposal.createdAt instanceof Date) || isNaN(proposal.createdAt.getTime())) {
                        return "N/A"
                      }
                      return format(proposal.createdAt, "MMM d, yyyy")
                    })()}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="font-medium text-gray-900">{proposal.id.slice(0, 8)}...</div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="font-medium text-gray-900">{proposal.client.company}</div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="text-sm text-gray-600">{proposal.client.contactPerson}</div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="text-sm text-gray-600">{proposal.products?.[0]?.name || "—"}</div>
                </TableCell>
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Proposals</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 opacity-30" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-96 border-gray-300 rounded-full"
                />
              </div>
            </div>
            <Button
              onClick={() => router.push("/sales/dashboard?action=create-proposal")}
              className="bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-lg px-6 py-2"
            >
              Create Proposal
            </Button>
          </div>
        </div>

        {content}

        {/* Pagination Controls */}
        {!loading && filteredProposals.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="text-sm text-gray-600">
              Page {currentPage}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </div>
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
