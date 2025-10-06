"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { createDirectCostEstimate, createMultipleCostEstimates } from "@/lib/cost-estimate-service"
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
    const [siteBookings, setSiteBookings] = useState<Record<string, Booking[]>>({})

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
                console.log(`Parsed site IDs:`, siteIds)
                const fetchProducts = async () => {
                    const products: Product[] = []
                    const bookingsMap: Record<string, Booking[]> = {}
                    for (const siteId of siteIds) {
                        const product = await getProductById(siteId)
                        if (product) products.push(product)

                        // Fetch bookings for this product
                        const productBookings = await getProductBookings(siteId)
                        bookingsMap[siteId] = productBookings
                    }
                    setSelectedSites(products)
                    setSiteBookings(bookingsMap)
                }
                fetchProducts()
            } catch (error) {
                console.error("Error parsing site IDs:", error)
            }
        }
    }, [searchParams])

    const handleCreateCostEstimate = async () => {
        if (!selectedClient || selectedSites.length === 0) {
            toast({
                title: "Missing Information",
                description: "Please ensure client and sites are selected.",
                variant: "destructive",
            })
            return
        }

        if (!user?.uid || !userData?.company_id) {
            toast({
                title: "Authentication Required",
                description: "Please log in to create a cost estimate.",
                variant: "destructive",
            })
            return
        }

        setIsCreating(true)
        try {
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
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                company_id: userData.company_id,
                client_company_id: selectedClient.company_id,
                page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
            }

            let costEstimateIds: string[]

            if (selectedSites.length > 1) {
                costEstimateIds = await createMultipleCostEstimates(clientData, sitesData, user.uid, options)

                toast({
                    title: "Cost Estimates Created",
                    description: `Successfully created ${costEstimateIds.length} cost estimates.`,
                })
            } else {
                const costEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, options)
                costEstimateIds = [costEstimateId]

                toast({
                    title: "Cost Estimate Created",
                    description: "Cost estimate has been created successfully.",
                })
            }

            router.push(`/sales/cost-estimates/${costEstimateIds[0]}`)
        } catch (error) {
            console.error("Error creating cost estimate:", error)
            toast({
                title: "Error",
                description: "Failed to create cost estimate. Please try again.",
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

    // Helper function to get filtered booked ranges for a site
    const getBookedRanges = (siteId: string) => {
        const bookings = siteBookings[siteId] || []

        return bookings.map(booking => ({
            start: convertToDate(booking.start_date),
            end: convertToDate(booking.end_date),
        }))
    }

    const checkOverlap = (siteId: string, s: Date, e: Date) =>
        getBookedRanges(siteId).some((r) => s <= r.end && e >= r.start)

    const removeSite = (id: string) => {
        setSelectedSites((prev) => {
            const updated = prev.filter((site) => site.id !== id)
            if (updated.length === 0) {
                router.push('/sales/dashboard')
            }
            return updated
        })
    }
    useEffect(() => {
        if (selectedSites.length === 0) {
            router.push("/sales/dashboard");
        }
    }, [selectedSites, router]);
    
    const renderCalendar = (monthIndex: number, year: number, bookedRanges: { start: Date; end: Date }[]) => {
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

                        // Highlight dates that are booked
                        const isBooked = bookedRanges.some((r) => date >= r.start && date <= r.end)

                        const isStartDate = startDate && date.toDateString() === new Date(startDate).toDateString()
                        const isEndDate = endDate && date.toDateString() === new Date(endDate).toDateString()
                        const isSelected = isStartDate || isEndDate
                        const isInRange = startDate && endDate && date >= new Date(startDate) && date <= new Date(endDate)
                        const isBetween = startDate && endDate && date > new Date(startDate) && date < new Date(endDate)

                        return (
                            <div
                                key={day}
                                className={`p-1 rounded text-center relative ${isBooked
                                    ? "bg-red-500 text-white" // booked overrides everything
                                    : isSelected
                                        ? "bg-blue-500 text-white font-bold ring-2 ring-blue-300"
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

    // Check if any site has overlapping dates
    const hasOverlaps = selectedSites.some(site =>
        startDate && endDate && checkOverlap(site.id!, new Date(startDate), new Date(endDate))
    )
    const today = new Date().toISOString().split("T")[0]

    const getNextDay = (dateStr: string) => {
        if (!dateStr) return today
        const d = new Date(dateStr)
        d.setDate(d.getDate() + 1)
        return d.toISOString().split("T")[0]
    }
    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
                        ← Back
                    </Button>
                    <h1 className="flex-1 text-center text-3xl font-bold text-gray-900">
                        Select Dates
                    </h1>
                </div>

                {/* Start/End Date Inputs */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="px-2">
                        <label className="block text-sm font-semibold mb-2">Start Date</label>
                        <Input type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value)
                                // reset end date if it's invalid
                                if (endDate && e.target.value && endDate <= e.target.value) {
                                    setEndDate("")
                                }
                            }}
                            min={today}
                        />
                    </div>
                    <div className="px-2">
                        <label className="block text-sm font-semibold mb-2">End Date</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={getNextDay(startDate)}
                            disabled={!startDate} // disable until start date is picked
                        />
                    </div>
                    <div className="flex items-end justify-end md:ml-auto">
                        <Button
                            onClick={handleCreateCostEstimate}
                            disabled={isCreating || hasOverlaps}
                            className="w-full h-11 text-lg font-semibold"
                            variant="outline"
                        >
                            {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Skip Dates"}
                        </Button>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button
                            onClick={handleCreateCostEstimate}
                            disabled={!startDate || !endDate || isCreating || hasOverlaps}
                            className="px-8 py-3 text-lg font-semibold"
                        >
                            {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Next →"}
                        </Button>
                    </div>
                </div>

                {/* Sites with calendars */}
                <div className="space-y-6">
                    {selectedSites.map((site) => {
                        const bookedRanges = getBookedRanges(site.id!)
                        const overlap = startDate && endDate && checkOverlap(site.id!, new Date(startDate), new Date(endDate))
                        return (
                            <div key={site.id} className="border rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {/* Left: Site card */}
                                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                                        <div className="h-40 relative">
                                            {site.media && site.media.length > 0 ? (
                                                <Image
                                                    src={site.media[0].url}
                                                    alt={site.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full bg-gray-300 flex items-center justify-center text-gray-500">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
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
                                                {renderCalendar(month, year, bookedRanges)}
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

            </div>
        </div>
    )
}