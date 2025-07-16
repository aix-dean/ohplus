"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { getProductById, getUserById, type User } from "@/lib/firebase-service"
import { salesChatService } from "@/lib/sales-chat-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { SalesChatWidget } from "@/components/sales-chat/sales-chat-widget"

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const bookingId = params.id as string
        const bookingDoc = await getDoc(doc(db, "booking", bookingId))

        if (bookingDoc.exists()) {
          const bookingData = { id: bookingDoc.id, ...bookingDoc.data() }
          setBooking(bookingData)

          // Fetch product details if product_id exists
          if (bookingData.product_id) {
            const productData = await getProductById(bookingData.product_id)
            setProduct(productData)
          }

          // Fetch user details if user_id exists
          if (bookingData.user_id) {
            const userData = await getUserById(bookingData.user_id)
            setUser(userData)
          }
        } else {
          console.error("Booking not found")
        }
      } catch (error) {
        console.error("Error fetching booking details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [params.id])

  // Safely convert any value to string for display
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "string") return value
    if (typeof value === "number") return value.toString()
    if (typeof value === "boolean") return value.toString()
    if (value instanceof Date) return value.toISOString()
    if (value && typeof value === "object") {
      // Handle Firestore timestamp objects
      if (typeof value.toDate === "function") {
        try {
          return value.toDate().toISOString()
        } catch {
          return "Invalid date"
        }
      }
      // Handle other objects by converting to JSON string
      try {
        return JSON.stringify(value)
      } catch {
        return "Invalid object"
      }
    }
    return String(value)
  }

  // Format date from Firestore Timestamp or other date formats
  const formatDate = (date: any): string => {
    if (!date) return "N/A"

    try {
      let dateObj: Date

      // Handle Firestore Timestamp
      if (date && typeof date.toDate === "function") {
        dateObj = date.toDate()
      }
      // Handle string dates
      else if (typeof date === "string") {
        dateObj = new Date(date)
      }
      // Handle Date objects
      else if (date instanceof Date) {
        dateObj = date
      }
      // Handle timestamp numbers
      else if (typeof date === "number") {
        dateObj = new Date(date)
      } else {
        return "Invalid date"
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid date"
      }

      return format(dateObj, "MMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Calculate booking duration in months
  const calculateDuration = (startDate: any, endDate: any): string => {
    if (!startDate || !endDate) return ""

    try {
      let start: Date, end: Date

      // Convert start date
      if (startDate && typeof startDate.toDate === "function") {
        start = startDate.toDate()
      } else if (typeof startDate === "string") {
        start = new Date(startDate)
      } else if (startDate instanceof Date) {
        start = startDate
      } else {
        return ""
      }

      // Convert end date
      if (endDate && typeof endDate.toDate === "function") {
        end = endDate.toDate()
      } else if (typeof endDate === "string") {
        end = new Date(endDate)
      } else if (endDate instanceof Date) {
        end = endDate
      } else {
        return ""
      }

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return ""
      }

      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

      if (months <= 0) return ""

      return ` (${months} ${months === 1 ? "month" : "months"})`
    } catch (error) {
      console.error("Error calculating duration:", error)
      return ""
    }
  }

  // Format currency safely
  const formatCurrency = (amount: any): string => {
    if (!amount && amount !== 0) return "N/A"

    try {
      let numAmount: number

      if (typeof amount === "number") {
        numAmount = amount
      } else if (typeof amount === "string") {
        // Remove any non-numeric characters except decimal point and minus sign
        const cleanAmount = amount.replace(/[^\d.-]/g, "")
        numAmount = Number.parseFloat(cleanAmount)
      } else {
        return "N/A"
      }

      if (isNaN(numAmount)) return "N/A"

      // Use absolute value to remove any negative signs
      const absAmount = Math.abs(numAmount)
      return `₱${absAmount.toLocaleString()}`
    } catch (error) {
      console.error("Error formatting currency:", error)
      return "N/A"
    }
  }

  // Handle chat with customer
  const handleChatWithCustomer = async () => {
    if (!booking?.user_id || !currentUser?.uid) {
      toast({
        title: "Error",
        description: "Unable to start chat. Missing user information.",
        variant: "destructive",
      })
      return
    }

    try {
      setChatLoading(true)

      // Create thread in background
      await salesChatService.createThread(
        currentUser.uid,
        booking.user_id,
        booking.product_id,
        booking.project_name || `Booking ${booking.id.substring(0, 8)}`,
      )

      // Open the chat widget
      setChatOpen(true)

      toast({
        title: "Chat Started",
        description: "Customer chat is now open.",
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      toast({
        title: "Error",
        description: "Failed to start chat with customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return <BookingDetailsSkeleton />
  }

  if (!booking) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <p className="mb-6">The booking you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push("/sales/bookings")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
        </Button>
      </div>
    )
  }

  // Determine booking status for progress tracker
  const bookingStatus = safeToString(booking.status).toLowerCase()
  const progressSteps = [
    { name: "Cost Estimate", completed: true },
    { name: "Quotation", completed: true },
    { name: "Compliance Documents", completed: bookingStatus === "confirmed" },
    { name: "Final Requirements", completed: bookingStatus === "confirmed" },
    { name: "Reserve", completed: bookingStatus === "confirmed" },
  ]

  // Get client initials for the avatar
  const formatFullName = (user: any): string => {
    if (!user) return ""
    const firstName = safeToString(user.first_name || "")
    const middleName = user.middle_name ? ` ${safeToString(user.middle_name)} ` : " "
    const lastName = safeToString(user.last_name || "")
    return `${firstName}${middleName}${lastName}`.trim()
  }

  const clientName = user ? formatFullName(user) : safeToString(booking.client_name)
  const clientInitials =
    clientName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "CL"

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/sales/bookings")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Booking Details</h1>
      </div>

      {/* Progress Tracker */}
      <div className="mb-8">
        <div className="relative flex items-center justify-between">
          {progressSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center z-10">
              <div className={`rounded-full p-1 ${step.completed ? "bg-green-500" : "bg-gray-300"}`}>
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs mt-2 text-center">{step.name}</span>
            </div>
          ))}
          {/* Connecting lines */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0"></div>
          <div
            className="absolute top-4 left-0 h-0.5 bg-green-500 -z-0"
            style={{
              width: `${(progressSteps.filter((step) => step.completed).length / progressSteps.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Information */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="font-semibold">Site Information</h2>
          </div>
          <div className="p-4">
            {product ? (
              <>
                <div className="mb-4 overflow-hidden rounded-md border">
                  {product.media && product.media[0] ? (
                    <Image
                      src={product.media[0].url || "/placeholder.svg"}
                      alt={safeToString(product.name) || "Site image"}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Site Code:</span> {safeToString(product.site_code)}
                  </p>
                  <p>
                    <span className="font-semibold">Site Name:</span> {safeToString(product.name)}
                  </p>
                  <p>
                    <span className="font-semibold">Type:</span> {safeToString(product.type)}
                  </p>
                  {product.specs_rental && (
                    <>
                      <p>
                        <span className="font-semibold">Dimension:</span>{" "}
                        {product.specs_rental.width && product.specs_rental.height
                          ? `${safeToString(product.specs_rental.width)}ft x ${safeToString(product.specs_rental.height)}ft`
                          : "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Location:</span>{" "}
                        {safeToString(product.specs_rental.location || product.light?.location)}
                      </p>
                      {product.specs_rental.geopoint && Array.isArray(product.specs_rental.geopoint) && (
                        <p>
                          <span className="font-semibold">Geopoint:</span>{" "}
                          {`${safeToString(product.specs_rental.geopoint[0])}, ${safeToString(product.specs_rental.geopoint[1])}`}
                        </p>
                      )}
                    </>
                  )}
                  <p>
                    <span className="font-semibold">Site Orientation:</span> {safeToString(product.orientation)}
                  </p>
                  <p>
                    <span className="font-semibold">Site Owner:</span> {safeToString(product.seller_name)}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Site information not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Reserved Information */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold">Reserved</h2>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
              <span className="text-sm">{safeToString(booking.status) || "Pending"}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-red-500 rounded-md flex items-center justify-center text-white mr-4">
                  {clientInitials}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{clientName || "N/A"}</h3>
                  <p className="text-sm text-gray-600">
                    {safeToString(user?.company || booking.company) || "No company specified"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleChatWithCustomer}
                disabled={chatLoading || !booking?.user_id}
                className="flex items-center gap-2 bg-transparent"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
                {chatLoading ? "Starting..." : "Start Chat"}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Client Name:</p>
                <p className="font-medium">{clientName || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Company:</p>
                <p className="font-medium">{safeToString(user?.company || booking.company)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Contact Number:</p>
                <p className="font-medium">{safeToString(user?.phone_number || booking.contact_number)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="font-medium">{safeToString(user?.email || booking.email)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Booking Dates:</p>
                <p className="font-medium">
                  {formatDate(booking.start_date)} to {formatDate(booking.end_date)}
                  {calculateDuration(booking.start_date, booking.end_date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Project Name:</p>
                <p className="font-medium">{safeToString(booking.project_name)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total Amount:</p>
                <p className="font-medium">{formatCurrency(booking.total_cost)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Payment Status:</p>
                <p className="font-medium">{safeToString(booking.payment_status)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Booking Reference:</p>
                <p className="font-medium">{safeToString(booking.booking_reference) || booking.id.substring(0, 8)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {booking.notes && (
        <div className="mt-6 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="font-semibold">Notes</h2>
          </div>
          <div className="p-4">
            <p className="whitespace-pre-line">{safeToString(booking.notes)}</p>
          </div>
        </div>
      )}

      {/* Sales Chat Widget */}
      <SalesChatWidget autoOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  )
}

function BookingDetailsSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-20 mr-4" />
        <Skeleton className="h-8 w-48" />
      </div>

      <Skeleton className="h-16 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4">
            <div className="mb-6 flex items-center">
              <Skeleton className="h-20 w-20 rounded-md mr-4" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
