"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { ShoppingCart, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "list">("list")
  const [pageSize] = useState(9)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageSnapshots, setPageSnapshots] = useState<QueryDocumentSnapshot<DocumentData>[]>([])

  const router = useRouter()

  // Fetch bookings with pagination
  const fetchBookings = async (
    direction: "next" | "prev" | "first" = "first",
    startDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  ) => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const bookingsRef = collection(db, "booking")

      let q

      if (direction === "first") {
        q = query(bookingsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"), limit(pageSize))
      } else if (direction === "next" && startDoc) {
        q = query(
          bookingsRef,
          where("seller_id", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(startDoc),
          limit(pageSize),
        )
      } else if (direction === "prev" && startDoc) {
        q = query(
          bookingsRef,
          where("seller_id", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(startDoc),
          limit(pageSize),
        )
      }

      const querySnapshot = await getDocs(q!)
      const fetchedBookings: any[] = []

      const firstVisible = querySnapshot.docs[0] || null
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null
      const hasMoreItems = querySnapshot.docs.length === pageSize

      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() })
      })

      setBookings(fetchedBookings)

      if (direction === "first") {
        setLastDoc(lastVisible)
        setCurrentPage(1)
        if (firstVisible) {
          setPageSnapshots([firstVisible])
        }
      } else if (direction === "next") {
        setLastDoc(lastVisible)
        setCurrentPage((prev) => prev + 1)
        if (firstVisible) {
          setPageSnapshots((prev) => [...prev, firstVisible])
        }
      } else if (direction === "prev") {
        setLastDoc(lastVisible)
        setCurrentPage((prev) => prev - 1)
        setPageSnapshots((prev) => prev.slice(0, -1))
      }

      setHasMore(hasMoreItems)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (user?.uid) {
      fetchBookings()
    }
  }, [user])

  // Handle next page
  const handleNextPage = () => {
    if (lastDoc && hasMore) {
      fetchBookings("next", lastDoc)
    }
  }

  // Handle previous page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPageSnapshot = pageSnapshots[currentPage - 2]
      if (prevPageSnapshot) {
        fetchBookings("prev", prevPageSnapshot)
      }
    }
  }

  // Format date from Firestore Timestamp
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading && currentPage === 1) {
    return (
      <div className="p-4">
        <div className="text-center py-10">
          <p>Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <div style={{ padding: "24px 0" }}>
        <h1
          style={{ textAlign: "left", fontSize: "24px", fontWeight: "bold", marginBottom: "24px", paddingLeft: "24px" }}
        >
          Bookings
        </h1>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px", paddingRight: "24px" }}>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-none"
              aria-label="Card View"
            >
              <LayoutGrid size={18} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
              aria-label="List View"
            >
              <List size={18} />
            </Button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p>No bookings found</p>
          </div>
        ) : viewMode === "card" ? (
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/sales/bookings/${booking.id}`)}
                >
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "14px", color: "#64748b" }}>{formatDate(booking.created)}</p>
                      <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Booking Request</h3>
                    </div>
                    <ShoppingCart size={20} color="#f97316" />
                  </div>

                  <div style={{ padding: "16px" }}>
                    <p style={{ fontWeight: "500" }}>
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </p>

                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontWeight: "600" }}>{booking.client_name}</p>
                      <p style={{ fontSize: "14px", color: "#64748b" }}>
                        {booking.booking_reference || booking.id.substring(0, 8)}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          fontSize: "14px",
                          fontWeight: "500",
                          ...(booking.status?.toLowerCase() === "confirmed"
                            ? { backgroundColor: "#dcfce7", color: "#166534" }
                            : booking.status?.toLowerCase() === "pending"
                              ? { backgroundColor: "#fef9c3", color: "#854d0e" }
                              : booking.status?.toLowerCase() === "cancelled"
                                ? { backgroundColor: "#fee2e2", color: "#991b1b" }
                                : { backgroundColor: "#f1f5f9", color: "#475569" }),
                        }}
                      >
                        {booking.status || "Unknown"}
                      </span>
                      <p style={{ fontSize: "14px", fontWeight: "500" }}>
                        ₱{booking.total_cost?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 24px", overflowX: "auto" }}>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/sales/bookings/${booking.id}`)}
                    >
                      <TableCell className="font-medium">{formatDate(booking.created)}</TableCell>
                      <TableCell>{booking.client_name}</TableCell>
                      <TableCell>
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            booking.status?.toLowerCase() === "confirmed"
                              ? "bg-green-500"
                              : booking.status?.toLowerCase() === "pending"
                                ? "bg-yellow-500"
                                : booking.status?.toLowerCase() === "cancelled"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                          }`}
                        >
                          {booking.status || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>₱{booking.total_cost?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>{booking.booking_reference || booking.id.substring(0, 8)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "24px",
            padding: "0 24px",
          }}
        >
          <div className="text-sm text-muted-foreground">
            Page {currentPage} {hasMore ? "•" : ""}
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
      </div>

      {loading && currentPage > 1 && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow">
            <p>Loading bookings...</p>
          </div>
        </div>
      )}
    </div>
  )
}
