"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getQuotationsPaginated } from "@/lib/quotation-service"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function SalesQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pageSize] = useState(10) // Set page size to 10
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null) // Stores ID of last doc for next page
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageCursors, setPageCursors] = useState<string[]>([""]) // Stores the lastVisibleId of the *previous* page

  const router = useRouter()

  const fetchQuotations = useCallback(
    async (direction: "next" | "prev" | "first" = "first", cursorId: string | null = null) => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        let currentCursor = cursorId

        if (direction === "prev" && currentPage > 1) {
          currentCursor = pageCursors[currentPage - 2] // Get cursor for the page before the current one
        } else if (direction === "first") {
          currentCursor = null // Reset cursor for first page
        }

        const {
          quotations: fetchedQuotations,
          lastVisibleId: newLastVisibleId,
          hasMore: newHasMore,
        } = await getQuotationsPaginated(user.uid, pageSize, currentCursor)

        setQuotations(fetchedQuotations)
        setLastVisibleId(newLastVisibleId)
        setHasMore(newHasMore)

        if (direction === "first") {
          setCurrentPage(1)
          setPageCursors(["", newLastVisibleId || ""]) // Reset and add current page's last ID
        } else if (direction === "next") {
          setCurrentPage((prev) => prev + 1)
          setPageCursors((prev) => [...prev, newLastVisibleId || ""]) // Add new cursor
        } else if (direction === "prev") {
          setCurrentPage((prev) => prev - 1)
          setPageCursors((prev) => prev.slice(0, -1)) // Remove current page's cursor
        }
      } catch (error) {
        console.error("Error fetching quotations:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.uid, pageSize, currentPage, pageCursors],
  )

  useEffect(() => {
    if (user?.uid) {
      fetchQuotations("first")
    }
  }, [user?.uid, fetchQuotations])

  const handleNextPage = () => {
    if (lastVisibleId && hasMore) {
      fetchQuotations("next", lastVisibleId)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchQuotations("prev")
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "declined":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quotations</h1>
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">Quotations List</CardTitle>
            </CardHeader>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(pageSize)
                    .fill(0)
                    .map((_, i) => {
                      <TableRow key={i} className="border-b border-gray-100">
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      </TableRow>
                    })}
                </TableBody>
              </Table>
            ) : quotations.length === 0 ? (
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-gray-400"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotations yet</h3>
                <p className="text-gray-600 mb-6">Create your first quotation to get started.</p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => {
                      <TableRow
                        key={quotation.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        <TableCell className="font-medium py-3">{formatDate(quotation.created)}</TableCell>
                        <TableCell className="py-3">{quotation.client_name}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`${getStatusColor(quotation.status)} border font-medium`}>
                            {quotation.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">₱{quotation.total_amount?.toLocaleString() || "N/A"}</TableCell>
                        <TableCell className="py-3">
                          {quotation.quotation_number || quotation.id.substring(0, 8)}
                        </TableCell>
                      </TableRow>
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
\
          <div className="flex justify-between items-center mt-6 px-2">
            <div className="text-sm text-gray-500">
              Page {currentPage}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1 || loading}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasMore || loading}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center py-10 text-gray-600">Please log in to view your quotations.</p>
        )}
      </div>
  \
  loading && (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Loading quotations...</p>
      </div>
    </div>
  )
  </div>
  )
}
