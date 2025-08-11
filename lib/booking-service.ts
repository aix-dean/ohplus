import { db } from "./firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

export interface Booking {
  id: string
  cancel_reason?: string
  company_id: string
  cost: number
  created: any // Firestore timestamp
  media_order?: string
  migration_metadata?: any
  payment_method: string
  product_id: string
  product_owner: string
  quantity: number
  rated: boolean
  seller_id: string
  status: string
  total_cost: number
  type: string
  user_id: string
  username: string
}

export interface SalesRecord {
  id: string
  month: string
  date: string
  serviceInvoice: string
  bsNumber: string
  clients: string
  tin: string
  description: string
  netSales: number
  outputVat: number
  total: number
  discount: number
  creditableTax: number
  amountCollected: number
  orNo: string
  paidDate: string
  // Additional fields from booking
  bookingId: string
  productOwner: string
  paymentMethod: string
  quantity: number
  productType: string
}

export class bookingService {
  private static instance: BookingService

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService()
    }
    return BookingService.instance
  }

  async getCompletedBookings(companyId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, "booking")
      const q = query(
        bookingsRef,
        where("company_id", "==", companyId),
        where("status", "==", "COMPLETED"),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const bookings: Booking[] = []

      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
        } as Booking)
      })

      return bookings
    } catch (error) {
      console.error("Error fetching completed bookings:", error)
      throw error
    }
  }

  convertBookingToSalesRecord(booking: Booking): SalesRecord {
    const createdDate = booking.created?.toDate ? booking.created.toDate() : new Date(booking.created)
    const month = createdDate.toLocaleDateString("en-US", { month: "short" })
    const date = createdDate.getDate().toString()
    const paidDate = createdDate.toISOString().split("T")[0]

    // Calculate financial values
    const netSales = booking.total_cost || booking.cost || 0
    const outputVat = netSales * 0.12
    const total = netSales + outputVat
    const creditableTax = netSales * 0.02
    const amountCollected = total - creditableTax

    return {
      id: booking.id,
      bookingId: booking.id,
      month,
      date,
      serviceInvoice: `SI-${booking.id.slice(-6)}`,
      bsNumber: `BS-${booking.id.slice(-4)}`,
      clients: booking.username || "Unknown Client",
      tin: "", // Not available in booking data
      description: `${booking.type} - ${booking.product_owner}`,
      netSales,
      outputVat,
      total,
      discount: 0,
      creditableTax,
      amountCollected,
      orNo: `OR-${booking.id.slice(-4)}`,
      paidDate,
      productOwner: booking.product_owner,
      paymentMethod: booking.payment_method,
      quantity: booking.quantity,
      productType: booking.type,
    }
  }

  async getSalesRecords(companyId: string): Promise<SalesRecord[]> {
    try {
      const bookings = await this.getCompletedBookings(companyId)
      return bookings.map((booking) => this.convertBookingToSalesRecord(booking))
    } catch (error) {
      console.error("Error getting sales records:", error)
      throw error
    }
  }
}

export const bookingService = BookingService.getInstance()
