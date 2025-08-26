"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, FileText, Eye, CheckCircle, XCircle, Clock, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { getCostEstimatesByProposalId, getCostEstimatesByCreatedBy } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { useToast } from "@/hooks/use-toast"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface CostEstimatesListProps {
  proposalId?: string
  userId?: string
}

export function CostEstimatesList({ proposalId, userId }: CostEstimatesListProps) {
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [groupedEstimates, setGroupedEstimates] = useState<{ [pageId: string]: CostEstimate[] }>({})
  const [currentPageIds, setCurrentPageIds] = useState<string[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState<{ [pageId: string]: number }>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchCostEstimates() {
      try {
        setLoading(true)
        let estimates: CostEstimate[] = []
        if (proposalId) {
          estimates = await getCostEstimatesByProposalId(proposalId)
        } else if (userId) {
          estimates = await getCostEstimatesByCreatedBy(userId)
        }
        setCostEstimates(estimates)

        const grouped: { [pageId: string]: CostEstimate[] } = {}
        const pageIds: string[] = []
        const initialPageIndex: { [pageId: string]: number } = {}

        estimates.forEach((estimate) => {
          const pageId = estimate.page_id || estimate.id
          if (!grouped[pageId]) {
            grouped[pageId] = []
            pageIds.push(pageId)
            initialPageIndex[pageId] = 0
          }
          grouped[pageId].push(estimate)
        })

        // Sort estimates within each group by page_number
        Object.keys(grouped).forEach((pageId) => {
          grouped[pageId].sort((a, b) => (a.page_number || 1) - (b.page_number || 1))
        })

        setGroupedEstimates(grouped)
        setCurrentPageIds(pageIds)
        setSelectedPageIndex(initialPageIndex)
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimates",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (proposalId || userId) {
      fetchCostEstimates()
    }
  }, [proposalId, userId, toast])

  const handlePageNavigation = (pageId: string, direction: "prev" | "next") => {
    const currentIndex = selectedPageIndex[pageId] || 0
    const maxIndex = (groupedEstimates[pageId]?.length || 1) - 1

    let newIndex = currentIndex
    if (direction === "prev" && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === "next" && currentIndex < maxIndex) {
      newIndex = currentIndex + 1
    }

    setSelectedPageIndex((prev) => ({
      ...prev,
      [pageId]: newIndex,
    }))
  }

  const handlePageJump = (pageId: string, pageIndex: number) => {
    setSelectedPageIndex((prev) => ({
      ...prev,
      [pageId]: pageIndex,
    }))
  }

  const getStatusConfig = (status: CostEstimate["status"]) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Draft",
        }
      case "sent":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Mail className="h-3.5 w-3.5" />,
          label: "Sent",
        }
      case "viewed":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Viewed",
        }
      case "approved":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Approved",
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const formatDate = (date: Date | string | any) => {
    if (!date) return "N/A"
    try {
      if (date instanceof Date) {
        return format(date, "MMM d, yyyy")
      }
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-3">Title</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3">Total Amount</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3">Line Items</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      ) : costEstimates.length === 0 ? (
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calculator className="h-5 w-5 mr-2" />
              Cost Estimates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calculator className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Estimates</h3>
            <p className="text-gray-600 mb-4">No cost estimates have been created yet.</p>
          </CardContent>
        </Card>
      ) : (
        currentPageIds.map((pageId) => {
          const estimatesGroup = groupedEstimates[pageId] || []
          const currentIndex = selectedPageIndex[pageId] || 0
          const currentEstimate = estimatesGroup[currentIndex]
          const totalPages = estimatesGroup.length

          if (!currentEstimate) return null

          return (
            <Card key={pageId} className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentIndex + 1} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageNavigation(pageId, "prev")}
                      disabled={currentIndex === 0}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page number buttons */}
                    <div className="flex gap-1">
                      {estimatesGroup.map((_, index) => (
                        <Button
                          key={index}
                          variant={index === currentIndex ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageJump(pageId, index)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageNavigation(pageId, "next")}
                      disabled={currentIndex === totalPages - 1}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Title</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Total Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Line Items</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    onClick={() => router.push(`/sales/cost-estimates/${currentEstimate.id}`)}
                  >
                    <TableCell className="font-medium py-3">{currentEstimate.title}</TableCell>
                    <TableCell className="py-3">{formatDate(currentEstimate.createdAt)}</TableCell>
                    <TableCell className="py-3">₱{currentEstimate.totalAmount?.toLocaleString() || "N/A"}</TableCell>
                    <TableCell className="py-3">
                      {(() => {
                        const statusConfig = getStatusConfig(currentEstimate.status)
                        return (
                          <Badge variant="outline" className={`${statusConfig.color} border font-medium`}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="py-3">{currentEstimate.lineItems.length}</TableCell>
                    <TableCell className="max-w-[200px] truncate py-3">{currentEstimate.notes || "N/A"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          )
        })
      )}
    </div>
  )
}
