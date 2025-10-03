"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { createDirectQuotation, createMultipleQuotations } from "@/lib/quotation-service"
import { getProductById, getProductBookings } from "@/lib/firebase-service"
import { getClientById } from "@/lib/client-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/firebase-service"
import type { Client } from "@/lib/client-service"
import type { Booking } from "@/lib/firebase-service"

export default function SelectDatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const [selectedSites, setSelectedSites] = useState<Product[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const sitesParam = searchParams.get("sites")
    const clientIdParam = searchParams.get("clientId")

    if (clientIdParam) {
      const fetchClient = async () => {
        const client = await getClientById(clientIdParam)
        if (client) setSelectedClient(client)
      }
      fetchClient()
    }

    if (sitesParam) {
      try {
        const siteIds = JSON.parse(decodeURIComponent(sitesParam))
        const fetchProducts = async () => {
          const products: Product[] = []
          const allBookings: Booking[] = []
          for (const siteId of siteIds) {
            const product = await getProductById(siteId)
            if (product) products.push(product)

            // Fetch bookings for this product
            const productBookings = await getProductBookings(siteId)
            allBookings.push(...productBookings)
          }
          setSelectedSites(products)
          setBookings(allBookings)
        }
        fetchProducts()
      } catch (error) {
        console.error("Error parsing site IDs:", error)
      }
    }
  }, [searchParams])

  const handleCreateQuotation = async () => {
    if (!startDate || !endDate || !selectedClient || selectedSites.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!user?.uid || !userData?.company_id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a quotation.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)

      const sitesData = selectedSites.map((site) => ({
        id: site.id!,
        name: site.name,
        location: site.specs_rental?.location || (site as any).light?.location || "N/A",
        price: site.price || 0,
        type: site.type || "Unknown",
        image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
        content_type: site.content_type || "",
        specs_rental: site.specs_rental,
      }))

      const clientData = {
        id: selectedClient.id,
        name: selectedClient.name,
        email: selectedClient.email,
        company: selectedClient.company,
        phone: selectedClient.phone,
        address: selectedClient.address,
        designation: selectedClient.designation,
        industry: selectedClient.industry,
        company_id: selectedClient.company_id,
      }

      const options = {
        startDate: startDateObj,
        endDate: endDateObj,
        company_id: userData.company_id,
        client_company_id: selectedClient.company_id,
        page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
        created_by_first_name: userData.first_name,
        created_by_last_name: userData.last_name,
      }

      let quotationIds: string[]

      if (selectedSites.length > 1) {
        quotationIds = await createMultipleQuotations(clientData, sitesData, user.uid, options)
        toast({
          title: "Quotations Created",
          description: `Successfully created ${quotationIds.length} quotations.`,
        })
      } else {
        const quotationId = await createDirectQuotation(clientData, sitesData, user.uid, options)
        quotationIds = [quotationId]
        toast({
          title: "Quotation Created",
          description: "Quotation has been created successfully.",
        })
      }

      router.push(`/sales/quotations/${quotationIds[0]}`)
    } catch (error) {
      console.error("Error creating quotation:", error)
      toast({
        title: "Error",
        description: "Failed to create quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const totalDays =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 30

  // Helper function to convert booking dates to Date objects
  const convertToDate = (dateValue: string | Timestamp): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue)
    } else {
      return dateValue.toDate()
    }
  }

  // Real booked ranges from database
  const bookedRanges = bookings.map(booking => ({
    start: convertToDate(booking.start_date),
    end: convertToDate(booking.end_date)
  }))

  const checkOverlap = (s: Date, e: Date) =>
    bookedRanges.some((r) => s <= r.end && e >= r.start)

  const removeSite = (id: string) => {
    setSelectedSites((prev) => prev.filter((site) => site.id !== id))
  }

  const renderCalendar = (monthIndex: number, year: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const startDay = new Date(year, monthIndex, 1).getDay()

    return (
      <div className="text-center">
        <h3 className="font-bold mb-2">
          {new Date(year, monthIndex).toLocaleString("default", { month: "long" })} {year}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-semibold text-gray-600 p-1">
              {d}
            </div>
          ))}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`e-${i}`} className="p-1" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(year, monthIndex, day)
            const selectedStart = startDate ? new Date(startDate) : null
            const selectedEnd = endDate ? new Date(endDate) : null

            // Only show booked dates that overlap with the selected range
            const isBooked = selectedStart && selectedEnd &&
              bookedRanges.some((r) =>
                // Check if the booked range overlaps with selected range
                (r.start <= selectedEnd && r.end >= selectedStart) &&
                // And this specific date is within the booked range
                (date >= r.start && date <= r.end)
              )

            const isStartDate = startDate && date.toDateString() === new Date(startDate).toDateString()
            const isEndDate = endDate && date.toDateString() === new Date(endDate).toDateString()
            const isSelected = isStartDate || isEndDate
            const isInRange = startDate && endDate && date >= new Date(startDate) && date <= new Date(endDate)
            const isBetween = startDate && endDate && date > new Date(startDate) && date < new Date(endDate)

            return (
              <div
                key={day}
                className={`p-1 rounded text-center relative ${
                  isBooked
                    ? "bg-red-700 text-white"
                    : isSelected
                    ? "bg-blue-600 text-white font-bold ring-2 ring-blue-300"
                    : isBetween
                    ? "bg-blue-100 text-blue-800"
                    : isInRange
                    ? "bg-blue-100 text-blue-800 font-semibold"
                    : "text-gray-700"
                }`}
              >
                {day}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Get months to show based on selected start date or current date
  const baseDate = startDate ? new Date(startDate) : new Date()
  const baseMonth = baseDate.getMonth()
  const baseYear = baseDate.getFullYear()

  const monthsToShow = [
    { month: baseMonth, year: baseYear },
    { month: (baseMonth + 1) % 12, year: baseMonth + 1 > 11 ? baseYear + 1 : baseYear },
    { month: (baseMonth + 2) % 12, year: baseMonth + 2 > 11 ? baseYear + 1 : baseYear },
  ]

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Select Dates</h1>
          <div className="h-11 flex items-center px-4 bg-gray-50 rounded-md border">
            <span className="text-gray-900 font-medium">{totalDays} days</span>
          </div>
        </div>

        {/* Start/End Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Sites with calendars */}
        <div className="space-y-6">
          {selectedSites.map((site) => {
            const overlap = startDate && endDate && checkOverlap(new Date(startDate), new Date(endDate))
            return (
              <div key={site.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Left: Site card */}
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <div className="h-40 bg-gray-300 flex items-center justify-center">Site Photo</div>
                    <div className="p-3 text-sm space-y-1">
                      <p className="text-gray-500">{site.site_code || "Site Code"}</p>
                      <p className="font-medium">{site.name}</p>
                      <p className="font-medium truncate">
                        {site.specs_rental?.location || (site as any).light?.location || "Location"}
                      </p>
                      <p className="font-medium">₱{site.price}</p>
                    </div>
                  </div>

                  {/* Right: Calendars */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {monthsToShow.map(({ month, year }) => (
                      <div key={`${year}-${month}`}>
                        {renderCalendar(month, year)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overlap warning */}
                {overlap && (
                  <div className="mt-2 flex justify-between items-center text-sm text-red-500 italic">
                    <span>
                      There is a booking overlap from October 16, 2025 to October 30, 2025
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => removeSite(site.id!)}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Next Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleCreateQuotation}
            disabled={!startDate || !endDate || isCreating}
            className="px-8 py-3 text-lg font-semibold"
          >
            {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  )
}
