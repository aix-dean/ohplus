"use client"

import { ArrowLeft, Search, ChevronDown, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useCallback } from "react"
import { collection, query, where, getDocs, limit, startAfter, orderBy, QueryDocumentSnapshot, DocumentData, Query } from "firebase/firestore"
import { db } from "@/lib/firebase"
interface Booking {
  id: string;
  name: string;
  site_location?: string;
  [key: string]: any;
}

interface JobOrderCount {
  [bookingId: string]: number
}

interface JobOrder {
  id: string
  joNumber: string
  booking_id: string
  company_id: string
  status: string
  createdAt: any
  updatedAt: any
  [key: string]: any
}

interface Report {
  id: string
  joNumber: string
  date: any
  category: string
  status: string
  description: string
  attachments?: string[]
  [key: string]: any
}

interface BookingReports {
  [bookingId: string]: Report[]
}

export default function ProjectMonitoringPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [jobOrderCounts, setJobOrderCounts] = useState<JobOrderCount>({})
  const [bookingReports, setBookingReports] = useState<BookingReports>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [totalBookingsCount, setTotalBookingsCount] = useState(0)
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([])

  const fetchBookingReports = async (bookingIds: string[]) => {
    if (!userData?.company_id || bookingIds.length === 0) return

    try {
      // First, get all job orders for the bookings
      const jobOrdersRef = collection(db, "job_orders")
      const jobOrdersQuery = query(jobOrdersRef, where("company_id", "==", userData.company_id))
      const jobOrdersSnapshot = await getDocs(jobOrdersQuery)

      // Create a map of joNumber to booking_id
      const joNumberToBookingId: { [joNumber: string]: string } = {}
      jobOrdersSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.joNumber && data.booking_id && bookingIds.includes(data.booking_id)) {
          joNumberToBookingId[data.joNumber] = data.booking_id
        }
      })

      // Get all joNumbers for the bookings
      const joNumbers = Object.keys(joNumberToBookingId)

      if (joNumbers.length === 0) return

      // Fetch reports for these joNumbers
      const reportsRef = collection(db, "reports")
      const reportsQuery = query(reportsRef, where("joNumber", "in", joNumbers))
      const reportsSnapshot = await getDocs(reportsQuery)

      // Group reports by booking_id
      const reportsByBooking: BookingReports = {}
      reportsSnapshot.forEach((doc) => {
        const reportData = { id: doc.id, ...doc.data() } as Report
        const bookingId = joNumberToBookingId[reportData.joNumber]

        if (bookingId) {
          if (!reportsByBooking[bookingId]) {
            reportsByBooking[bookingId] = []
          }
          reportsByBooking[bookingId].push(reportData)
        }
      })

      // Sort reports by date (newest first) for each booking
      Object.keys(reportsByBooking).forEach((bookingId) => {
        reportsByBooking[bookingId].sort((a, b) => {
          const aTime = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0)
          const bTime = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0)
          return bTime.getTime() - aTime.getTime()
        })
      })

      setBookingReports(reportsByBooking)
    } catch (error) {
      console.error("Error fetching booking reports:", error)
    }
  }

  const fetchJobOrderCounts = async (bookingIds: string[]) => {
    if (!userData?.company_id || bookingIds.length === 0) {
      console.log("fetchJobOrderCounts: No company_id or bookingIds, returning.")
      return
    }
    console.log("fetchJobOrderCounts: Fetching job order counts for bookingIds:", bookingIds)

    try {
      const counts: JobOrderCount = {}

      // Fetch job orders for all bookings at once
      const jobOrdersRef = collection(db, "job_orders")
      const q = query(jobOrdersRef, where("company_id", "==", userData.company_id))
      const querySnapshot = await getDocs(q)
      console.log("fetchJobOrderCounts: jobOrders querySnapshot size:", querySnapshot.size)

      // Count job orders for each booking
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const bookingId = data.booking_id
        if (bookingId && bookingIds.includes(bookingId)) {
          counts[bookingId] = (counts[bookingId] || 0) + 1
        }
      })

      console.log("fetchJobOrderCounts: Final jobOrderCounts:", counts)
      setJobOrderCounts(counts)
    } catch (error) {
      console.error("Error fetching job order counts:", error)
    }
  }

  const handleOpenDialog = async (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDialogOpen(true)
    setIsDialogLoading(true)

    try {
      if (!userData?.company_id) return

      const jobOrdersRef = collection(db, "job_orders")
      const q = query(
        jobOrdersRef,
        where("company_id", "==", userData.company_id),
        where("booking_id", "==", booking.id),
      )
      const querySnapshot = await getDocs(q)

      const fetchedJobOrders: JobOrder[] = []
      querySnapshot.forEach((doc) => {
        fetchedJobOrders.push({ id: doc.id, ...doc.data() } as JobOrder)
      })

      fetchedJobOrders.sort((a, b) => {
        let aTime: Date
        let bTime: Date

        // Handle Firestore Timestamp objects
        if (a.createdAt?.toDate) {
          aTime = a.createdAt.toDate()
        } else if (a.createdAt) {
          aTime = new Date(a.createdAt)
        } else {
          aTime = new Date(0) // Default to epoch if no date
        }

        if (b.createdAt?.toDate) {
          bTime = b.createdAt.toDate()
        } else if (b.createdAt) {
          bTime = new Date(b.createdAt)
        } else {
          bTime = new Date(0) // Default to epoch if no date
        }

        // Sort descending (newest first)
        return bTime.getTime() - aTime.getTime()
      })

      setJobOrders(fetchedJobOrders)
    } catch (error) {
      console.error("Error fetching job orders:", error)
      setJobOrders([])
    } finally {
      setIsDialogLoading(false)
    }
  }

  const fetchBookings = useCallback(async (page: number, direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!userData?.company_id) {
      setLoading(false)
      console.log("fetchBookings: No company_id found, returning.")
      return
    }

    try {
      console.log("fetchBookings: Fetching bookings for company_id:", userData.company_id)
      const bookingsRef = collection(db, "booking")

      let bookingsQuery: Query<DocumentData> = query(
        bookingsRef,
        where("company_id", "==", userData.company_id),
        orderBy("name"), // Order by a consistent field for pagination
      )

      if (direction === 'next' && lastVisible) {
        bookingsQuery = query(bookingsQuery, startAfter(lastVisible))
      } else if (direction === 'prev' && firstVisible && pageHistory.length > 1) {
        // For previous, we need to go back in pageHistory
        const prevDoc = pageHistory[pageHistory.length - 2];
        bookingsQuery = query(bookingsQuery, startAfter(prevDoc));
      } else if (direction === 'prev' && pageHistory.length === 1) {
        // If going back to the first page, remove startAfter
        // This case is handled by the initial query
      }

      bookingsQuery = query(bookingsQuery, limit(itemsPerPage))

      const querySnapshot = await getDocs(bookingsQuery)

      // Fetch total count for pagination UI
      const countQuery = query(bookingsRef, where("company_id", "==", userData.company_id));
      const countSnapshot = await getDocs(countQuery);
      setTotalBookingsCount(countSnapshot.size);

      console.log("fetchBookings: querySnapshot size:", querySnapshot.size)
      const fetchedBookings: Booking[] = []
      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking)
      })
      console.log("fetchBookings: fetchedBookings:", fetchedBookings)

      setBookings(fetchedBookings)

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
        setFirstVisible(querySnapshot.docs[0])

        if (direction === 'next' || direction === 'initial') {
          setPageHistory((prev) => [...prev, querySnapshot.docs[0]])
        } else if (direction === 'prev' && pageHistory.length > 1) {
          setPageHistory((prev) => prev.slice(0, prev.length - 1))
        }
      } else {
        setLastVisible(null)
        setFirstVisible(null)
      }

      if (fetchedBookings.length > 0) {
        const bookingIds = fetchedBookings.map((b) => b.id).filter((id): id is string => id !== undefined)
        console.log("fetchBookings: Calling fetchJobOrderCounts with bookingIds:", bookingIds)
        await fetchJobOrderCounts(bookingIds)
        console.log("fetchBookings: Calling fetchBookingReports with bookingIds:", bookingIds)
        await fetchBookingReports(bookingIds)
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }, [userData?.company_id, lastVisible, firstVisible, pageHistory, itemsPerPage, fetchJobOrderCounts, fetchBookingReports])

  useEffect(() => {
    console.log("useEffect: userData?.company_id:", userData?.company_id, "currentPage:", currentPage)
    if (userData?.company_id) {
      fetchBookings(currentPage, 'initial')
    }
  }, [userData?.company_id, currentPage, fetchBookings])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Project Bulletins</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dropdown Filter */}
          <div className="flex-1 flex justify-end">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Select Site</option>
                <option value="site1">Site 1</option>
                <option value="site2">Site 2</option>
                <option value="site3">Site 3</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg border border-gray-300 p-4">
                    <button
                      onClick={() => handleOpenDialog(booking)}
                      className="text-blue-600 font-medium text-sm mb-3 hover:text-blue-800 transition-colors"
                    >
                      Job Orders: {booking.id ? (jobOrderCounts[booking.id] || 0) : 0}
                    </button>

                    <div className="text-white px-4 py-2 rounded mb-3 w-fit" style={{ backgroundColor: "#00aeef" }}>
                      <h3 className="font-semibold text-lg">Lilo & Stitch</h3>
                    </div>

                    <div className="text-gray-900 font-medium mb-3">
                      {booking.site_location || booking.name || "No site code available"}
                    </div>

                    <div>
                      <h4 className="text-gray-700 font-medium mb-2">Last Activity:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {booking.id && bookingReports[booking.id] && bookingReports[booking.id].length > 0 ? (
                          bookingReports[booking.id].slice(0, 3).map((report: Report, index: number) => {
                            const reportDate = report.date?.toDate ? report.date.toDate() : new Date(report.date || 0)
                            const formattedDate = reportDate.toLocaleDateString("en-US", {
                              month: "numeric",
                              day: "numeric",
                              year: "2-digit",
                            })
                            const formattedTime = reportDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })

                            return (
                              <div key={report.id}>
                                {formattedDate}- {formattedTime}- {report.description || "No description available"}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-gray-500 italic">No recent activity</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {(() => {
              const totalPages = Math.ceil(totalBookingsCount / itemsPerPage)

              if (totalPages <= 1) return null

              return (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                      fetchBookings(currentPage - 1, 'prev')
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1 flex-wrap justify-center">
                    {/* Render first page */}
                    {totalPages > 0 && (
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className={`px-3 py-2 border rounded-md ${
                          currentPage === 1
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        1
                      </button>
                    )}

                    {/* Render ellipsis if needed */}
                    {currentPage > 3 && totalPages > 5 && <span className="px-3 py-2">...</span>}

                    {/* Render pages around current page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true; // Show all pages if 5 or less
                        if (currentPage <= 3) return page >= 2 && page <= 4; // Show 2, 3, 4 if current is 1, 2, 3
                        if (currentPage >= totalPages - 2) return page >= totalPages - 3 && page <= totalPages - 1; // Show last 3 pages if current is near end
                        return page >= currentPage - 1 && page <= currentPage + 1; // Show current, prev, next
                      })
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-md ${
                            currentPage === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    {/* Render ellipsis if needed */}
                    {currentPage < totalPages - 2 && totalPages > 5 && <span className="px-3 py-2">...</span>}

                    {/* Render last page */}
                    {totalPages > 1 && (
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-3 py-2 border rounded-md ${
                          currentPage === totalPages
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {totalPages}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      fetchBookings(currentPage + 1, 'next')
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No bookings found</div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Orders</h2>
              {selectedBooking && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBooking.site_location || selectedBooking.name || "Unknown Site"}
                </p>
              )}
            </div>

            {isDialogLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading job orders...</p>
              </div>
            ) : jobOrders.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {jobOrders.map((jobOrder) => (
                    <div
                      key={jobOrder.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/logistics/bulletin-board/details/${jobOrder.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">
                          Job Order #: {jobOrder.joNumber || jobOrder.id.slice(-6)}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            jobOrder.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : jobOrder.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : jobOrder.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {jobOrder.status || "Unknown"}
                        </span>
                      </div>

                      {jobOrder.description && <p className="text-sm text-gray-600 mb-2">{jobOrder.description}</p>}

                      <div className="text-xs text-gray-500">
                        Created: {(() => {
                          if (jobOrder.createdAt?.toDate) {
                            return jobOrder.createdAt.toDate().toLocaleDateString()
                          } else if (jobOrder.createdAt) {
                            const date = new Date(jobOrder.createdAt)
                            return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString()
                          }
                          return "Unknown"
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No job orders found for this site</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
