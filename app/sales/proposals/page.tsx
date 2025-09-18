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
} from "lucide-react"
import { format } from "date-fns"
import { getPaginatedProposalsByUserId, getProposalsCountByUserId, downloadProposalPDF } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { useResponsive } from "@/hooks/use-responsive"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs" // Import Tabs components
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"

function ProposalsPageContent() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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

  useEffect(() => {
    if (user?.uid) {
      loadProposals(1, true) // Reset to first page when user changes
    }
  }, [user])

  useEffect(() => {
    if (user?.uid) {
      loadProposals(1, true) // Reset to first page when search/filter changes
    }
  }, [searchTerm, statusFilter])

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
        statusFilter === "all" ? null : statusFilter
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
        statusFilter === "all" ? null : statusFilter
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <Button
              onClick={() => router.push("/sales/dashboard?action=create-proposal")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Proposal
            </Button>
          </div>

          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search proposals or clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900">Proposal</TableHead>
                  <TableHead className="font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Products</TableHead>
                  <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-28 mb-1" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : filteredProposals.length === 0 ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "No proposals found" : "No proposals yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first proposal to get started"}
              </p>
              {!searchTerm && statusFilter === "all" && (
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
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900">Proposal</TableHead>
                  <TableHead className="font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Products</TableHead>
                  <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => {
                  const statusConfig = getStatusConfig(proposal.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow
                      key={proposal.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                      onClick={() => handleViewProposal(proposal.id)}
                    >
                      <TableCell className="py-3">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">{proposal.title}</div>
                          <div className="text-sm text-gray-500">ID: {proposal.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{proposal.client.company}</div>
                            <div className="text-sm text-gray-500">{proposal.client.contactPerson}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`${statusConfig.color} border font-medium`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{proposal.products.length}</div>
                          <div className="text-xs text-gray-500">
                            product{proposal.products.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-gray-900">₱{proposal.totalAmount.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(proposal.createdAt, "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {!loading && filteredProposals.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProposals.length}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            hasMore={hasMore}
          />
        )}
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm mx-auto text-center border-0 shadow-lg">
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
    </div>
  )
}

export default function ProposalsPage() {
  return <ProposalsPageContent />
}
