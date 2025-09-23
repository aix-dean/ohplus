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
import { Skeleton } from "@/components/ui/skeleton"
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
  X,
} from "lucide-react"
import { format } from "date-fns"
import { getCostEstimatesByCreatedBy, getPaginatedCostEstimatesByCreatedBy, getCostEstimate } from "@/lib/cost-estimate-service" // Import CostEstimate service
import type { CostEstimate, CostEstimateStatus } from "@/lib/types/cost-estimate" // Import CostEstimate type
import { generateCostEstimatePDF } from "@/lib/cost-estimate-pdf-service"
import { useResponsive } from "@/hooks/use-responsive"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CostEstimatesList } from "@/components/cost-estimates-list" // Import CostEstimatesList
import { searchCostEstimates, SearchResult } from "@/lib/algolia-service"
import { useDebounce } from "@/hooks/use-debounce"

function CostEstimatesPageContent() {
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [filteredCostEstimates, setFilteredCostEstimates] = useState<CostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false) // Assuming this might be used for CE

  // Algolia search states
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [hasMorePages, setHasMorePages] = useState(true)
  const itemsPerPage = 10

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { user, userData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isMobile } = useResponsive()

  useEffect(() => {
    if (user?.uid) {
      loadCostEstimates(1, true)
    }
  }, [user])

  useEffect(() => {
    // Reset pagination when filters change
    if (user?.uid) {
      setCurrentPage(1)
      setLastDocId(null)
      setHasMorePages(true)

      // Use Algolia search if there's a search term or status filter
      if (debouncedSearchTerm || statusFilter !== "all") {
        performAlgoliaSearch(debouncedSearchTerm, statusFilter, 0)
      } else {
        // Load all cost estimates if no search/filter
        loadCostEstimates(1, true)
        setIsSearching(false)
        setSearchResults([])
      }
    }
  }, [debouncedSearchTerm, statusFilter, user?.uid])

  // Assuming a success dialog might be relevant for cost estimates too
  useEffect(() => {
    const success = searchParams.get("success")
    if (success === "email-sent") {
      setShowSuccessDialog(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const loadCostEstimates = async (page: number = 1, reset: boolean = false) => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const result = await getPaginatedCostEstimatesByCreatedBy(
        userData?.company_id || "",
        itemsPerPage,
        reset ? null : lastDocId
      )

      if (reset) {
        setCostEstimates(result.items)
        setLastDocId(result.lastVisible)
        setCurrentPage(1)
      } else {
        setCostEstimates(result.items)
        setLastDocId(result.lastVisible)
      }

      setHasMorePages(result.hasMore)
    } catch (error) {
      console.error("Error loading cost estimates:", error)
    } finally {
      setLoading(false)
    }
  }

  const performAlgoliaSearch = async (query: string, status: string, page: number = 0) => {
    if (!user?.uid || !userData?.company_id) {
      console.log("No user or company_id, skipping search")
      return
    }

    setSearchLoading(true)
    try {
      console.log("Performing Algolia search with:", { query, status, companyId: userData.company_id })

      let filters = `company_id:${userData.company_id}`

      // Add status filter if not "all"
      if (status !== "all") {
        filters += ` AND status:${status}`
      }

      console.log("Search filters:", filters)

      const result = await searchCostEstimates(query, userData.company_id, page, itemsPerPage)

      console.log("Algolia search result:", result)

      if (result.error) {
        console.error("Algolia search error:", result.error)
        setSearchResults([])
        return
      }

      console.log("Search hits:", result.hits)
      setSearchResults(result.hits)
      setIsSearching(query.length > 0 || status !== "all")
    } catch (error) {
      console.error("Error performing Algolia search:", error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Note: Filtering is now handled server-side or simplified for server-side pagination
  // For now, we'll use the costEstimates directly

  const getStatusConfig = (status: CostEstimate["status"]) => {
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

  const handleViewCostEstimate = (costEstimateId: string) => {
    router.push(`/sales/cost-estimates/${costEstimateId}`)
  }

  const handleDownloadPDF = async (costEstimate: CostEstimate) => {
    try {
      // Fetch the full cost estimate data first
      const costEstimateId = costEstimate.id || (costEstimate as any).objectID
      const fullCostEstimate = await getCostEstimate(costEstimateId)
      if (!fullCostEstimate) {
        throw new Error("Cost estimate not found")
      }

      // Generate PDF using the same function as the detail page
      await generateCostEstimatePDF(fullCostEstimate, undefined, false, {
        first_name: user?.displayName?.split(' ')[0] || "",
        last_name: user?.displayName?.split(' ').slice(1).join(' ') || "",
        email: user?.email || "",
        company_id: userData?.company_id || "",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Cost Estimates</h1>
            <Button
              onClick={() => router.push("/sales/dashboard?action=create-cost-estimate")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Cost Estimate
            </Button>
          </div>

          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search cost estimates or clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 w-full sm:w-80"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
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

                  {(searchTerm || statusFilter !== "all") && (
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }} size="sm">
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(loading || searchLoading) ? (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900">Cost Estimate</TableHead>
                  <TableHead className="font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Items</TableHead>
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
        ) : (isSearching ? searchResults.length === 0 : costEstimates.length === 0) ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isSearching ? "No cost estimates found" : "No cost estimates yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {isSearching
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first cost estimate to get started"}
              </p>
              {!isSearching && (
                <Button
                  onClick={() => router.push("/sales/cost-estimates/compose/new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Cost Estimate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900">Cost Estimate</TableHead>
                  <TableHead className="font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Items</TableHead>
                  <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isSearching ? searchResults : costEstimates).map((item, index) => {
                  // Handle both CostEstimate and SearchResult types
                  const costEstimate = item as any
                  const statusConfig = getStatusConfig(costEstimate.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow
                      key={costEstimate.id || costEstimate.objectID || `cost-estimate-${index}`}
                      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                      onClick={() => handleViewCostEstimate(costEstimate.id || costEstimate.objectID)}
                    >
                      <TableCell className="py-3">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">{costEstimate.title}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{costEstimate.client?.company || costEstimate.client?.company  || "N/A"}</div>
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
                          <div className="font-semibold text-gray-900">{costEstimate.lineItems?.length || costEstimate.lineItemsCount || 0}</div>
                          <div className="text-xs text-gray-500">
                            item{(costEstimate.lineItems?.length || costEstimate.lineItemsCount || 0) !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-gray-900">₱{(costEstimate.totalAmount || 0).toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {costEstimate.createdAt ? format(new Date(costEstimate.createdAt), "MMM d, yyyy") : "N/A"}
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
                            <DropdownMenuItem onClick={() => handleViewCostEstimate(costEstimate.id || costEstimate.objectID)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(costEstimate as CostEstimate)}>
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

        {/* Pagination Controls */}
        {!loading && !searchLoading && (isSearching ? searchResults.length > 0 : costEstimates.length > 0) && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="text-sm text-gray-600">
              {isSearching ? `Found ${(isSearching ? searchResults : costEstimates).length} results` : `Page ${currentPage}`}
            </div>
            <div className="flex items-center space-x-2">
              {!isSearching ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1)
                        loadCostEstimates(currentPage - 1, false)
                      }
                    }}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (hasMorePages) {
                        setCurrentPage(currentPage + 1)
                        loadCostEstimates(currentPage + 1, false)
                      }
                    }}
                    disabled={!hasMorePages || loading}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Search results
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm mx-auto text-center border-0 shadow-lg">
          <div className="py-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              <div className="flex justify-center mb-4">
                <div className="text-6xl">🎉</div>
              </div>
              <p className="text-gray-600">Your cost estimate has been sent successfully!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CostEstimatesPage() {
  return <CostEstimatesPageContent />
}
