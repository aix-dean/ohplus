import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"

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
  status: string
}

export interface PaginationOptions {
  page: number
  pageSize: number
  lastDoc?: DocumentSnapshot
}

export interface FilterOptions {
  type?: string
  status?: string
}

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  currentPage: number
  totalPages: number
  lastDoc?: DocumentSnapshot
}

export class BookingService {
  private static instance: BookingService

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService()
    }
    return BookingService.instance
  }

  async getCompletedBookingsCount(companyId: string, filters?: FilterOptions): Promise<number> {
    try {
      const bookingsRef = collection(db, "booking")
      let q = query(bookingsRef, where("company_id", "==", companyId))

      // Apply filters
      if (filters?.status) {
        q = query(q, where("status", "==", filters.status))
      }
      if (filters?.type) {
        q = query(q, where("type", "==", filters.type))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error("Error fetching completed bookings count:", error)
      throw error
    }
  }

  async getCompletedBookings(
    companyId: string,
    options?: PaginationOptions,
    filters?: FilterOptions,
  ): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, "booking")
      let q = query(bookingsRef, where("company_id", "==", companyId), orderBy("created", "desc"))

      // Apply filters
      if (filters?.status) {
        q = query(q, where("status", "==", filters.status))
      } else {
        // Default to completed if no status filter
        q = query(q, where("status", "==", "COMPLETED"))
      }

      if (filters?.type) {
        q = query(q, where("type", "==", filters.type))
      }

      if (options) {
        if (options.lastDoc) {
          q = query(q, startAfter(options.lastDoc))
        }
        q = query(q, limit(options.pageSize))
      }

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
      status: booking.status, // Added status field
    }
  }

  async getSalesRecords(
    companyId: string,
    options?: PaginationOptions,
    filters?: FilterOptions,
  ): Promise<SalesRecord[]> {
    try {
      const bookings = await this.getCompletedBookings(companyId, options, filters)
      return bookings.map((booking) => this.convertBookingToSalesRecord(booking))
    } catch (error) {
      console.error("Error getting sales records:", error)
      throw error
    }
  }

  async getPaginatedSalesRecords(
    companyId: string,
    options: PaginationOptions,
    filters?: FilterOptions,
  ): Promise<PaginatedResult<SalesRecord>> {
    try {
      const [totalCount, bookings] = await Promise.all([
        this.getCompletedBookingsCount(companyId, filters),
        this.getCompletedBookings(companyId, options, filters),
      ])

      const salesRecords = bookings.map((booking) => this.convertBookingToSalesRecord(booking))
      const totalPages = Math.ceil(totalCount / options.pageSize)

      // Get the last document for cursor-based pagination
      const bookingsRef = collection(db, "booking")
      let lastQuery = query(
        bookingsRef,
        where("company_id", "==", companyId),
        orderBy("created", "desc"),
        limit(options.pageSize * options.page),
      )

      // Apply same filters to last query
      if (filters?.status) {
        lastQuery = query(lastQuery, where("status", "==", filters.status))
      } else {
        lastQuery = query(lastQuery, where("status", "==", "COMPLETED"))
      }

      if (filters?.type) {
        lastQuery = query(lastQuery, where("type", "==", filters.type))
      }

      const lastSnapshot = await getDocs(lastQuery)
      const lastDoc = lastSnapshot.docs[lastSnapshot.docs.length - 1]

      return {
        data: salesRecords,
        totalCount,
        hasNextPage: options.page < totalPages,
        hasPreviousPage: options.page > 1,
        currentPage: options.page,
        totalPages,
        lastDoc,
      }
    } catch (error) {
      console.error("Error getting paginated sales records:", error)
      throw error
    }
  }
}

export const bookingService = BookingService.getInstance()
