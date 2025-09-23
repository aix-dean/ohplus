import { NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getOccupancyData } from "@/lib/firebase-service"
import type { Booking, Product, Quotation } from "@/lib/firebase-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const year = searchParams.get("year")

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 })
    }

    // Build query for bookings
    let bookingsQuery = query(
      collection(db, "booking"),
      where("company_id", "==", companyId),
      orderBy("created", "desc")
    )

    // Add date filtering if provided
    if (startDate || endDate) {
      // For date filtering, we need to filter client-side since Firestore doesn't support complex date range queries easily
      // In production, you might want to use a different approach
    }

    const bookingsSnapshot = await getDocs(bookingsQuery)
    const bookings: Booking[] = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking))

    // Fetch quotations
    const quotationsQuery = query(
      collection(db, "quotations"),
      where("company_id", "==", companyId),
      orderBy("created", "desc")
    )
    const quotationsSnapshot = await getDocs(quotationsQuery)
    const quotations: Quotation[] = quotationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation))

    // Filter by date range if provided
    let filteredBookings = bookings
    if (startDate) {
      const start = new Date(startDate)
      filteredBookings = filteredBookings.filter(booking => {
        let bookingStart: Date
        if (typeof booking.start_date === 'string') {
          bookingStart = new Date(booking.start_date)
        } else if (booking.start_date && typeof booking.start_date.toDate === 'function') {
          bookingStart = booking.start_date.toDate()
        } else {
          return false
        }
        return bookingStart >= start
      })
    }
    if (endDate) {
      const end = new Date(endDate)
      filteredBookings = filteredBookings.filter(booking => {
        let bookingEnd: Date
        if (typeof booking.end_date === 'string') {
          bookingEnd = new Date(booking.end_date)
        } else if (booking.end_date && typeof booking.end_date.toDate === 'function') {
          bookingEnd = booking.end_date.toDate()
        } else {
          return false
        }
        return bookingEnd <= end
      })
    }

    // Filter quotations by date range or year if provided
    let filteredQuotations = quotations
    if (startDate || endDate) {
      filteredQuotations = quotations.filter(quotation => {
        let created: Date
        if (typeof quotation.created === 'string') {
          created = new Date(quotation.created)
        } else if (quotation.created && typeof quotation.created.toDate === 'function') {
          created = quotation.created.toDate()
        } else {
          return false
        }
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null
        if (start && created < start) return false
        if (end && created > end) return false
        return true
      })
    } else if (year) {
      const yearNum = parseInt(year)
      const yearStart = new Date(yearNum, 0, 1) // Jan 1
      const yearEnd = new Date(yearNum + 1, 0, 1) // Jan 1 next year

      filteredQuotations = quotations.filter(quotation => {
        let created: Date
        if (typeof quotation.created === 'string') {
          created = new Date(quotation.created)
        } else if (quotation.created && typeof quotation.created.toDate === 'function') {
          created = quotation.created.toDate()
        } else {
          return false
        }
        return created >= yearStart && created < yearEnd
      })
    }

    // Group bookings by product_id and count
    const siteBookings: { [productId: string]: number } = {}
    filteredBookings.forEach(booking => {
      const productId = booking.product_id
      if (productId) {
        siteBookings[productId] = (siteBookings[productId] || 0) + 1
      }
    })

    // Get product names
    const productIds = Object.keys(siteBookings)
    const productsQuery = query(collection(db, "products"), where("company_id", "==", companyId))
    const productsSnapshot = await getDocs(productsQuery)
    const products: Product[] = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))

    const productMap: { [id: string]: string } = {}
    products.forEach(product => {
      productMap[product.id!] = product.name || "Unknown Site"
    })

    // Calculate site performance
    const totalBookings = filteredBookings.length
    const sitePerformance = productIds.map(productId => ({
      productId,
      name: productMap[productId] || "Unknown Site",
      bookingCount: siteBookings[productId],
      percentage: totalBookings > 0 ? Math.round((siteBookings[productId] / totalBookings) * 100) : 0
    }))

    // Sort by booking count descending
    sitePerformance.sort((a, b) => b.bookingCount - a.bookingCount)

    // Get best and worst performing
    const bestPerforming = sitePerformance[0] || { name: "No Data", percentage: 0 }
    const worstPerforming = sitePerformance[sitePerformance.length - 1] || { name: "No Data", percentage: 0 }

    // Calculate conversion rate
    const quotationsCount = filteredQuotations.length
    const bookingsCount = filteredQuotations.filter(q => (q.status as string) === "reserved" || (q.status as string) === "To Reserve").length
    const conversionRate = quotationsCount > 0 ? Math.min(100, Math.round((bookingsCount / quotationsCount) * 100)) : 0

    // Get occupancy data
    const occupancy = await getOccupancyData(companyId)

    return NextResponse.json({
      bestPerforming: {
        name: bestPerforming.name,
        percentage: bestPerforming.percentage
      },
      worstPerforming: {
        name: worstPerforming.name,
        percentage: worstPerforming.percentage
      },
      totalBookings,
      siteCount: productIds.length,
      conversionRate: {
        quotations: quotationsCount,
        bookings: bookingsCount,
        rate: conversionRate
      },
      occupancy
    })

  } catch (error) {
    console.error("Error fetching site performance:", error)
    return NextResponse.json(
      { error: "Failed to fetch site performance data" },
      { status: 500 }
    )
  }
}