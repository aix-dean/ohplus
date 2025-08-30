"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Search, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Booking {
  id: string
  product_id?: string
  product_owner?: string
  client_name?: string
  start_date?: any
  end_date?: any
  status?: string
  created?: any
}

interface Product {
  id?: string
  site_code?: string
  specs_rental?: {
    site_code?: string
  }
  light?: {
    site_code?: string
  }
  siteCode?: string
  [key: string]: any
}

// Function to get site code from product - following the pattern from sales dashboard
const getSiteCode = (product: Product | null) => {
  if (!product) return null

  // Try different possible locations for site_code
  if (product.site_code) return product.site_code
  if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
  if (product.light && "site_code" in product.light) return product.light.site_code

  // Check for camelCase variant
  if ("siteCode" in product) return product.siteCode

  return null
}

export default function ReservationPage() {
  const { user, userData } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<{ [key: string]: Product }>({})

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.uid || !userData?.company_id) return

      try {
        setLoading(true)
        const bookingsRef = collection(db, "booking")
        const q = query(bookingsRef, where("company_id", "==", userData.company_id), orderBy("created", "desc"))

        const querySnapshot = await getDocs(q)
        const fetchedBookings: Booking[] = []

        querySnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() })
        })

        setBookings(fetchedBookings)

        const productIds = fetchedBookings
          .map((booking) => booking.product_id)
          .filter((id): id is string => Boolean(id))

        const uniqueProductIds = [...new Set(productIds)]
        const productData: { [key: string]: Product } = {}

        for (const productId of uniqueProductIds) {
          try {
            const productDoc = await getDoc(doc(db, "products", productId))
            if (productDoc.exists()) {
              productData[productId] = { id: productDoc.id, ...productDoc.data() }
            }
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error)
          }
        }

        setProducts(productData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, userData])

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "N/A"
    } catch (error) {
      return "N/A"
    }
  }

  const calculateDuration = (startDate: any, endDate: any) => {
    if (!startDate || !endDate) return "N/A"

    try {
      const start = startDate.toDate ? startDate.toDate() : new Date(startDate)
      const end = endDate.toDate ? endDate.toDate() : new Date(endDate)

      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      return `${months} ${months === 1 ? "month" : "months"}`
    } catch (error) {
      return "N/A"
    }
  }

  const filteredReservations = bookings.filter((booking) => {
    const product = booking.product_id ? products[booking.product_id] : null
    const siteCode = getSiteCode(product)

    return (
      siteCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reservations</h1>
          <p className="text-sm text-gray-600">See the status of the quotations you've generated</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder=""
              className="pl-10 bg-white border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total Reservations: {loading ? "..." : filteredReservations.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              See History
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">Site</TableHead>
                <TableHead className="font-semibold text-gray-900">Client</TableHead>
                <TableHead className="font-semibold text-gray-900">From</TableHead>
                <TableHead className="font-semibold text-gray-900">To</TableHead>
                <TableHead className="font-semibold text-gray-900">Total</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No reservations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map((booking) => {
                  const product = booking.product_id ? products[booking.product_id] : null
                  const siteCode = getSiteCode(product)

                  return (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{siteCode || booking.product_owner || "-"}</TableCell>
                      <TableCell>{booking.client_name || "N/A"}</TableCell>
                      <TableCell>{formatDate(booking.start_date)}</TableCell>
                      <TableCell>{formatDate(booking.end_date)}</TableCell>
                      <TableCell>{calculateDuration(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={booking.status?.toLowerCase() === "confirmed" ? "default" : "secondary"}
                          className={
                            booking.status?.toLowerCase() === "confirmed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }
                        >
                          {booking.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
