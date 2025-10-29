"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, FileText, CheckCircle, ArrowLeft, Package } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { bookingService } from "@/lib/booking-service"
import type { Booking } from "@/lib/booking-service"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SelectBookingPage() {
  const { userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get("productId")

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userData?.uid) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view bookings.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const fetchedBookings = await bookingService.getCollectiblesBookings(userData.company_id || "")
        const filteredByProduct = productId
          ? fetchedBookings.filter((booking) => booking.product_id === productId)
          : fetchedBookings
        setBookings(filteredByProduct)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast({
          title: "Error",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [userData?.uid, userData?.company_id, toast, productId])

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.reservation_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.project_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelect = (booking: Booking) => {
    router.push(`/sales/job-orders/create?bookingId=${booking.id}`)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {productId ? "Select Reservation for Job Order" : "Select Reservation for Job Order"}
        </h1>
      </div>

      <Card className="flex-1 flex flex-col p-6">
        <div className="relative mb-4">
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings found.
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelect(booking)}
                  >
                    <TableCell className="font-semibold">
                      {booking.reservation_id}
                    </TableCell>
                    <TableCell>{booking.client?.name || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {booking.product_name || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {booking.project_name || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(booking.start_date)}</TableCell>
                    <TableCell>{formatDate(booking.end_date)}</TableCell>
                    <TableCell>
                      <Badge variant={booking.status === "RESERVED" ? "default" : "secondary"}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {booking.created ? formatDate(booking.created) : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  )
}