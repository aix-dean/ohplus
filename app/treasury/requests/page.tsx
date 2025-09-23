"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { bookingService, type Booking } from "@/lib/booking-service"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import Link from "next/link"

export default function RequestsPage() {
  const { userData } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isAmountDialogOpen, setIsAmountDialogOpen] = useState(false)

  // Collectibles state
  const [collectibles, setCollectibles] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})

  const clientData = {
    "Summit Media": {
      reservationId: "RV00432",
      projectName: "Lilo and Stitch",
      client: "Summit Media",
      site: "Petplans Tower",
      dimension: "100ft (H) x 60ft (W)",
      contractDuration: "3 months",
      bookingDates: "Oct 31 '25 to Jan 31 '26",
      illumination: "10 units of 1000 watts metal halide",
      leaseRatePerMonth: "290,000",
      totalLease: "870,000",
      duration: "3 months",
      subtotal: "870,000",
      vat: "104,400",
      total: "974,400",
      sales: "Noemi Abellanada",
    },
  }

  const handleClientClick = (clientName: string) => {
    setSelectedClient(clientData[clientName as keyof typeof clientData])
    setIsDialogOpen(true)
  }

  const handleAmountClick = () => {
    setIsAmountDialogOpen(true)
  }

  // Fetch seller names for bookings
  const fetchSellerNames = async (sellerIds: string[]) => {
    const uniqueIds = [...new Set(sellerIds)]
    const names: Record<string, string> = {}

    for (const sellerId of uniqueIds) {
      if (sellerNames[sellerId]) {
        names[sellerId] = sellerNames[sellerId]
        continue
      }

      try {
        const userDocRef = doc(db, "iboard_users", sellerId)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim()
          names[sellerId] = fullName || sellerId
        } else {
          names[sellerId] = sellerId
        }
      } catch (error) {
        console.error("Error fetching seller name:", error)
        names[sellerId] = sellerId
      }
    }

    setSellerNames(prev => ({ ...prev, ...names }))
    return names
  }

  // Fetch collectibles data
  const fetchCollectibles = async () => {
    if (!userData?.company_id) return

    setLoading(true)
    try {
      const result = await bookingService.getPaginatedCollectibles(
        userData.company_id,
        {
          page: currentPage,
          pageSize,
          lastDoc: currentPage > 1 ? lastDoc : undefined,
        }
      )

      setCollectibles(result.data)
      setTotalCount(result.totalCount)
      setHasNextPage(result.hasNextPage)
      setLastDoc(result.lastDoc)

      // Fetch seller names
      const sellerIds = result.data.map(booking => booking.seller_id).filter(Boolean)
      if (sellerIds.length > 0) {
        await fetchSellerNames(sellerIds)
      }
    } catch (error) {
      console.error("Error fetching collectibles:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Effect to fetch data when component mounts or pagination changes
  useEffect(() => {
    fetchCollectibles()
  }, [userData?.company_id, currentPage])

  return (
    <div className="min-h-screen bg-gray-50  md:p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Requests</h1>
          <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            History
          </Button>
        </div>

        {/* For Sales Invoice Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">For Sales Invoice</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-gray-700 mb-4 italic">Noemi is requesting for an invoice.</p>

            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900 text-sm md:text-base min-w-[600px]">
                  <div>Client</div>
                  <div>Cover Dates</div>
                  <div>Amount</div>
                  <div>Due date</div>
                  <div>Actions</div>
                </div>
                <div className="grid grid-cols-5 gap-4 p-4 items-center min-w-[600px]">
                  <div
                    className="text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() => handleClientClick("Summit Media")}
                  >
                    Summit Media
                  </div>
                  <div className="text-gray-700">Oct 31- Nov 31, 2025</div>
                  <div className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={handleAmountClick}>
                    310,300.00
                  </div>
                  <div className="text-gray-700">Nov 25, 2025</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="text-sm">Generate Invoice</Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-sm"
                    >
                      View Contact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* For Collectibles Section */}
        <div>
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">For Collectibles</h2>
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900 text-sm md:text-base min-w-[800px]">
                <div>Date</div>
                <div>Reservation</div>
                <div>Project Name</div>
                <div>Client Name</div>
                <div>Sales</div>
                <div>Actions</div>
                <div></div>
              </div>

              {/* Collectibles Rows */}
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading collectibles...</div>
              ) : collectibles.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No collectibles found</div>
              ) : (
                collectibles.map((booking) => (
                  <div
                    key={booking.id}
                    className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200 last:border-b-0 items-center min-w-[800px]"
                  >
                    <div className="text-gray-700">{formatDate(booking.start_date)}</div>
                    <div className="text-gray-700">{booking.reservation_id}</div>
                    <div className="text-gray-700">{booking.project_name || "N/A"}</div>
                    <div className="text-gray-700">{booking.client?.name || booking.client?.company_name || "N/A"}</div>
                    <div className="text-gray-700">{sellerNames[booking.seller_id] || booking.seller_id}</div>
                    <div>
                      <Link href={`/treasury/requests/create-collectibles/${booking.id}`}>
                        <Button variant="outline" className="text-sm">Create collectibles</Button>
                      </Link>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && collectibles.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                itemsPerPage={pageSize}
                totalItems={collectibles.length}
                totalOverall={totalCount}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                hasMore={hasNextPage}
              />
            </div>
          )}
        </div>

        {/* Client Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left">
                <div className="text-sm text-gray-500 mb-1">Reservation ID</div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{selectedClient?.reservationId}</div>
              </DialogTitle>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-6 pt-4">
                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Project Name:</div>
                    <div className="text-gray-700">{selectedClient.projectName}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Client:</div>
                    <div className="text-gray-700">{selectedClient.client}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Site:</div>
                    <div className="text-gray-700">{selectedClient.site}</div>
                  </div>
                  <div className="flex justify-center md:justify-start">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-700 text-xs md:text-sm font-medium">
                        Site
                        <br />
                        Photo
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <span className="font-semibold text-gray-900">Dimension: </span>
                    <span className="text-gray-700">{selectedClient.dimension}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Contract Duration: </span>
                    <span className="text-gray-700">{selectedClient.contractDuration}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Booking Dates: </span>
                    <span className="text-gray-700">{selectedClient.bookingDates}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Illumination: </span>
                    <span className="text-gray-700">{selectedClient.illumination}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Lease Rate/month: </span>
                    <span className="text-gray-700">{selectedClient.leaseRatePerMonth}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Total lease: </span>
                    <span className="text-gray-700">{selectedClient.totalLease}</span>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <span className="font-semibold text-gray-900">Lease rate per month: </span>
                      <span className="text-gray-700">{selectedClient.leaseRatePerMonth}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Duration: </span>
                      <span className="text-gray-700">{selectedClient.duration}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Subtotal: </span>
                      <span className="text-gray-700">{selectedClient.subtotal}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">12% VAT: </span>
                      <span className="text-gray-700">{selectedClient.vat}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">TOTAL: </span>
                      <span className="text-gray-700 text-lg font-semibold">{selectedClient.total}</span>
                    </div>
                  </div>
                </div>

                {/* Sales Person */}
                <div className="border-t border-gray-200 pt-4">
                  <div>
                    <span className="font-semibold text-gray-900">Sales: </span>
                    <span className="text-gray-700">{selectedClient.sales}</span>
                  </div>
                </div>

                {/* OK Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 md:px-12 py-2"
                    variant="outline"
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Amount Breakdown Dialog */}
        <Dialog open={isAmountDialogOpen} onOpenChange={setIsAmountDialogOpen}>
          <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left text-xl md:text-2xl font-semibold text-gray-900">Breakdown:</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Item Breakdown */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 font-medium text-gray-900">
                  <div>Item</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-gray-700">
                  <div>Oct 31-Nov 31, 2025</div>
                  <div className="text-right">290,000.00</div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">VATable Sales:</div>
                  <div className="text-right text-gray-700">290,000.00</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">VAT (12%):</div>
                  <div className="text-right text-gray-700">34,800.00</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">Total Sales (VAT Inclusive):</div>
                  <div className="text-right text-gray-700">324,800.00</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">Less VAT:</div>
                  <div className="text-right text-gray-700">34,800.00</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">Amount Net of VAT:</div>
                  <div className="text-right text-gray-700">290,000.00</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">Add VAT:</div>
                  <div className="text-right text-gray-700">34,800.00</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-medium">Less Withholding Tax:</div>
                  <div className="text-right text-gray-700">14,500.00</div>
                </div>
              </div>

              {/* Total Amount Due */}
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-900 font-bold text-base md:text-lg">TOTAL AMOUNT DUE:</div>
                    <div className="text-right text-gray-900 font-bold text-base md:text-lg">310,300.00</div>
                  </div>
                </div>
              </div>

              {/* OK Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setIsAmountDialogOpen(false)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 md:px-12 py-2"
                  variant="outline"
                >
                  OK
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}