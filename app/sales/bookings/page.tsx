"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getBookingsPaginated } from "@/lib/job-order-service" // Assuming this service exists for bookings
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function SalesBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState<any | null>(null) // Stores last document for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageCursors, setPageCursors] = useState<any[]>([null]) // Stores the last document of the *previous* page

  const router = useRouter()
  const pageSize = 10 // Example page size

  const fetchBookings = useCallback(
    async (pageToFetch: number) => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const startDoc = pageCursors[pageToFetch - 1] || null

        // Assuming getBookingsPaginated exists and works similarly to getQuotationsPaginated
        const {
          bookings: fetchedBookings,
          lastVisibleId: newLastVisible,
          hasMore: newHasMore,
        } = await getBookingsPaginated(user.uid, pageSize, startDoc)

        setBookings(fetchedBookings)
        setLastVisible(newLastVisible)
        setHasMore(newHasMore)
        setCurrentPage(pageToFetch)

        if (pageToFetch >= pageCursors.length) {
          setPageCursors((prev) => {
            const newCursors = [...prev]
            newCursors[pageToFetch] = newLastVisible
            if (newCursors.length > pageToFetch + 1) {
              newCursors.length = pageToFetch + 1
            }
            return newCursors
          })
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.uid, pageCursors, pageSize],
  )

  useEffect(() => {
    if (user?.uid) {
      fetchBookings(1)
    }
  }, [user?.uid, fetchBookings])

  const handleNextPage = () => {
    if (hasMore && !loading) {
      fetchBookings(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      fetchBookings(currentPage - 1)
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
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Bookings</h1>
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">Bookings List</CardTitle>
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
                    .map((_, i) => (
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
                    ))}
                </TableBody>
              </Table>
            ) : bookings.length > 0 ? (
              <>
                <CardContent className="p-0">
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
                      {bookings.map((booking) => (
                        <TableRow
                          key={booking.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/sales/bookings/${booking.id}`)}
                        >
                          <TableCell className="py-3 text-sm text-gray-700">{formatDate(booking.created)}</TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">{booking.client_name || "N/A"}</TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">
                            ₱{booking.total_amount?.toLocaleString() || "0.00"}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">
                            {booking.booking_number || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <div className="flex justify-between items-center p-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="p-6 text-center text-gray-600">
                <p>No bookings found for your account.</p>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your bookings.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow">
            <p>Loading bookings...</p>
          </div>
        </div>
      )}
    </div>
  )
}
