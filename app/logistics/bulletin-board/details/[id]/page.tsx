"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface Booking {
  id: string
  start_date: any
  end_date: any
  product_id: string
  status: string
  cost: number
  total_cost: number
  type: string
  project_name?: string
  reservation_id?: string
  client_name?: string
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!params.id) return

      try {
        const bookingRef = doc(db, "booking", params.id as string)
        const bookingSnap = await getDoc(bookingRef)

        if (bookingSnap.exists()) {
          const bookingData = {
            id: bookingSnap.id,
            ...bookingSnap.data(),
          } as Booking

          setBooking(bookingData)
        }
      } catch (error) {
        console.error("Error fetching booking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [params.id])

  const formatDate = (dateField: any) => {
    if (!dateField) return "Not specified"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return "Not specified"
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getSiteData = () => {
    return {
      site: booking?.project_name || "Not specified",
      client: booking?.client_name || "Not specified",
      bookingDates:
        booking?.start_date && booking?.end_date
          ? `${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}`
          : "Not specified",
      seller: "Not specified",
    }
  }

  const siteData = getSiteData()

  return (
    <div className="w-[1280px] h-[720px] relative">
      <div onClick={() => router.back()} className="w-80 h-6 left-[30px] top-[30px] absolute justify-start text-gray-700 text-base font-bold font-['Inter'] leading-none cursor-pointer">← View Project Bulletin</div>
      <div className="w-[990px] h-20 left-[34px] top-[60px] absolute bg-white rounded-[5px] shadow-[-2px_4px_5px_0px_rgba(0,0,0,0.25)]" />
      <div className="w-24 h-3.5 left-[60.14px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Reservation ID</div>
      <div className="w-32 h-3.5 left-[60.14px] top-[96.95px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{booking?.reservation_id || 'N/A'}</div>
      <div className="w-24 h-3.5 left-[250px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Site</div>
      <div className="w-40 h-6 left-[250px] top-[96.95px] absolute justify-start text-blue-600 text-xs font-bold font-['Inter'] leading-3 break-words">{siteData.site}</div>
      <div className="w-24 h-3.5 left-[453px] top-[84px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Client</div>
      <div className="w-24 h-3 left-[453px] top-[99.56px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{siteData.client}</div>
      <div className="w-24 h-3.5 left-[647px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Booking Dates</div>
      <div className="w-36 h-3 left-[647px] top-[96px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{siteData.bookingDates}</div>
      <div className="w-[990px] h-7 left-[34px] top-[162px] absolute" style={{ backgroundColor: 'var(--ADMIN-BLUE, #2A31B4)' }} />
      <div className="w-14 h-4 left-[60px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Date</div>
      <div className="w-14 h-4 left-[179px] top-[169px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">By</div>
      <div className="w-20 h-4 left-[342px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Department</div>
      <div className="w-14 h-4 left-[674px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Item</div>
      <div className="w-24 h-4 left-[495px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Campaign Name</div>
      <div className="w-28 h-4 left-[873px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Attachment</div>
      <div className="w-[990px] h-[496px] left-[34px] top-[190px] absolute bg-white overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Booking details loaded successfully.</div>
          </div>
        )}
      </div>
    </div>
  )
}
