"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProductById, type Product } from "@/lib/firebase-service"
import {
  ArrowLeft,
  Play,
  Loader2,
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createDirectCostEstimate } from "@/lib/cost-estimate-service"
import { createDirectQuotation } from "@/lib/quotation-service"

export default function SpotDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [spotSchedule, setSpotSchedule] = useState<any>(null)
  const [spotSchedules, setSpotSchedules] = useState<any[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  const productId = params.id as string
  const spotNumber = parseInt(params.spotNumber as string)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        setLoading(true)
        const productData = await getProductById(productId)
        if (productData) {
          // Verify this product belongs to the current user's company
          if (userData?.company_id && productData.company_id !== userData.company_id) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to view this site.",
              variant: "destructive",
            })
            router.push("/sales/dashboard")
            return
          }
          setProduct(productData)
        } else {
          toast({
            title: "Error",
            description: "Site not found.",
            variant: "destructive",
          })
          router.push("/sales/dashboard")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load site details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, userData?.company_id, toast, router])

  // Fetch spot schedules
  useEffect(() => {
    const fetchSpotSchedules = async () => {
      if (!productId) return

      try {
        const q = query(
          collection(db, "screen_schedule"),
          where("product_id", "==", productId),
          where("spot_number", "==", spotNumber),
          where("deleted", "==", false),
        )
        const querySnapshot = await getDocs(q)
        const schedules = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setSpotSchedules(schedules)
        // Find the active/current schedule
        const activeSchedule = schedules.find((s: any) => s.active === true)
        setSpotSchedule(activeSchedule || null)
      } catch (error) {
        console.error("Error fetching spot schedules:", error)
      }
    }

    fetchSpotSchedules()
  }, [productId, spotNumber])

  const handleBack = () => {
    router.push(`/sales/products/${productId}`)
  }

  const formatDate = (dateString: any): string => {
    if (!dateString) return "N/A"

    try {
      const date =
        typeof dateString === "string"
          ? new Date(dateString)
          : dateString instanceof Date
            ? dateString
            : dateString.toDate
              ? dateString.toDate()
              : new Date()

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-amber-100 text-amber-800"
      case "available":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalSpots = product?.cms?.loops_per_day || 18

  const nextSpot = () => {
    setCurrentSpotIndex((prev) => (prev + 1) % totalSpots)
  }

  const prevSpot = () => {
    setCurrentSpotIndex((prev) => (prev - 1 + totalSpots) % totalSpots)
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

                    const isStartDate = startDate && date.toDateString() === new Date(startDate).toDateString()
                    const isEndDate = endDate && date.toDateString() === new Date(endDate).toDateString()
                    const isSelected = isStartDate || isEndDate
                    const isInRange = startDate && endDate && date >= new Date(startDate) && date <= new Date(endDate)
                    const isBetween = startDate && endDate && date > new Date(startDate) && date < new Date(endDate)

                    return (
                        <div
                            key={day}
                            onClick={() => {
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                if (!startDate || (startDate && endDate)) {
                                    setStartDate(dateStr)
                                    setEndDate("")
                                } else if (startDate && !endDate) {
                                    if (dateStr >= startDate) {
                                        setEndDate(dateStr)
                                    } else {
                                        setStartDate(dateStr)
                                    }
                                }
                            }}
                            className={`p-1 rounded text-center relative cursor-pointer ${isSelected
                                ? "bg-blue-500 text-white font-bold ring-2 ring-blue-300"
                                : isBetween
                                    ? "bg-blue-100 text-blue-800"
                                    : isInRange
                                        ? "bg-blue-100 text-blue-800 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
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
  const getMonthsBetween = (start: string, end: string) => {
    if (!start || !end) return []
    const startDate = new Date(start)
    const endDate = new Date(end)
    const months = []
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    while (current <= endDate) {
        months.push({ month: current.getMonth(), year: current.getFullYear() })
        current.setMonth(current.getMonth() + 1)
    }
    return months
  }

  const allMonths = startDate && endDate ? getMonthsBetween(startDate, endDate) : []
  const shouldShowAllMonths = allMonths.length > 3

  let monthsToShow = []
  if (shouldShowAllMonths) {
      // Show 3 months starting from monthOffset
      const startIndex = monthOffset
      monthsToShow = allMonths.slice(startIndex, startIndex + 3)
  } else {
      // Original logic - show 3 months
      const baseDate = startDate ? new Date(startDate) : new Date()
      const baseMonth = baseDate.getMonth()
      const baseYear = baseDate.getFullYear()
      monthsToShow = [
          { month: baseMonth, year: baseYear },
          { month: (baseMonth + 1) % 12, year: baseMonth + 1 > 11 ? baseYear + 1 : baseYear },
          { month: (baseMonth + 2) % 12, year: baseMonth + 2 > 11 ? baseYear + 1 : baseYear },
      ]
  }

  // Navigation controls
  const canGoLeft = shouldShowAllMonths && monthOffset > 0
  const canGoRight = shouldShowAllMonths && monthOffset + 3 < allMonths.length

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Site not found</h3>
          <p className="text-muted-foreground mb-4">The requested site could not be found.</p>
          <Button onClick={handleBack}>Back to Site</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          View Spot
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">Create:</p>
          <Button
            variant="outline"
            onClick={async () => {
              if (!startDate || !endDate) {
                toast({
                  title: "Error",
                  description: "Please select start and end dates",
                  variant: "destructive",
                })
                return
              }
              if (!userData) {
                toast({
                  title: "Error",
                  description: "User not authenticated",
                  variant: "destructive",
                })
                return
              }
              try {
                const clientData = {
                  id: userData.uid,
                  name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "User",
                  email: userData.email || "",
                  company: "Company", // Default since no company_name in UserData
                  phone: userData.phone_number || "",
                  address: "",
                  designation: "",
                  industry: "",
                }
                const sitesData = [{
                  id: product.id!,
                  name: product.name || "",
                  location: product.location || "",
                  price: product.price || 0,
                  type: product.type || "",
                  image: product.media?.[0]?.url || "",
                  specs_rental: product.specs_rental,
                  content_type: product.content_type,
                }]
                const customLineItems = [{
                  id: product.id!,
                  description: product.name || "",
                  quantity: 1,
                  unitPrice: product.price || 0,
                  total: 0, // Will be calculated by the service
                  category: product.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
                  notes: `Location: ${product.location || ""}`,
                  image: product.media?.[0]?.url,
                  content_type: product.content_type,
                  cms: product.cms,
                }]
                const costEstimateId = await createDirectCostEstimate(clientData, sitesData, userData.uid, {
                  startDate: new Date(startDate),
                  endDate: new Date(endDate),
                  company_id: userData.company_id || "",
                  customLineItems,
                })
                toast({
                  title: "Success",
                  description: "Cost estimate created successfully",
                })
                router.push(`/sales/cost-estimates/${costEstimateId}`)
              } catch (error) {
                console.error(error)
                toast({
                  title: "Error",
                  description: "Failed to create cost estimate",
                  variant: "destructive",
                })
              }
            }}
          >
            Cost Estimate
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!startDate || !endDate) {
                toast({
                  title: "Error",
                  description: "Please select start and end dates",
                  variant: "destructive",
                })
                return
              }
              if (!userData) {
                toast({
                  title: "Error",
                  description: "User not authenticated",
                  variant: "destructive",
                })
                return
              }
              try {
                const clientData = {
                  id: userData!.uid,
                  name: `${userData!.first_name || ""} ${userData!.last_name || ""}`.trim() || "User",
                  email: userData!.email || "",
                  company: "Company",
                  phone: userData!.phone_number || "",
                  address: "",
                  designation: "",
                  industry: "",
                }
                const sitesData = [{
                  id: product.id,
                  name: product.name,
                  location: product.location,
                  price: product.price,
                  type: product.type,
                  image: product.media?.[0]?.url || "",
                  specs_rental: product.specs_rental,
                  content_type: product.content_type,
                  cms: product.cms,
                }]
                const quotationId = await createDirectQuotation(clientData, sitesData, userData.uid, {
                  startDate: new Date(startDate),
                  endDate: new Date(endDate),
                  company_id: userData.company_id || "",
                  created_by_first_name: userData.first_name || "",
                  created_by_last_name: userData.last_name || "",
                })
                toast({
                  title: "Success",
                  description: "Quotation created successfully",
                })
                router.push(`/sales/quotations-list`)
              } catch (error) {
                console.error(error)
                toast({
                  title: "Error",
                  description: "Failed to create quotation",
                  variant: "destructive",
                })
              }
            }}
          >
            Quotation
          </Button>
        </div>
      </div>

      {/* Scroll Spots and Calendar side by side */}
      <div className="flex gap-6 mb-6">
        {/* Scroll Spots */}
        <div className="w-[12vw]">
          <div className="relative flex items-center justify-center flex-1">
            {/* Left arrow */}
            <button
              onClick={prevSpot}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Single spot display */}
            <div className="flex justify-center items-center flex-1">
              {(() => {
                const i = currentSpotIndex
                const startTime = product.cms?.start_time || "06:00"
                const spotDuration = product.cms?.spot_duration || 15
                const [startHours, startMinutes] = startTime.split(":").map(Number)
                const startTotalMinutes = startHours * 60 + startMinutes

                const spotStartMinutes = startTotalMinutes + (i * spotDuration / 60)
                const startHour = Math.floor(spotStartMinutes / 60) % 24
                const startMin = Math.floor(spotStartMinutes % 60)
                const startTimeStr = `${startHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`

                const isCurrentSpot = i + 1 === spotNumber
                const hasContent = spotSchedule && spotSchedule.spot_number === spotNumber

                return (
                  <div
                    className={`w-[10vw] h-40 border rounded-lg p-4 text-center ${
                      isCurrentSpot
                        ? "border-blue-500 bg-blue-50"
                        : hasContent
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="text-lg font-medium text-gray-600 mb-3">
                      {startTimeStr}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Spot {i + 1}/{totalSpots}
                    </div>
                    <div className={`text-sm px-3 py-1 rounded inline-block ${
                      isCurrentSpot
                        ? "bg-blue-100 text-blue-800"
                        : hasContent
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {isCurrentSpot ? "Current" : hasContent ? "Occupied" : "Vacant"}
                    </div>
                    {hasContent && (
                      <div className="text-sm text-gray-500 mt-3 truncate">
                        {spotSchedule.title || "Content"}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Right arrow */}
            <button
              onClick={nextSpot}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex-1">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
              disabled={!canGoLeft}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="font-bold text-lg">Select Dates</p>
            <button
              onClick={() => setMonthOffset(Math.min(allMonths.length - 3, monthOffset + 1))}
              disabled={!canGoRight}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthsToShow.map(({ month, year }) => (
              <div key={`${year}-${month}`}>
                {renderCalendar(month, year)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Micro Spots */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="font-bold text-lg mb-4">
          Micro Spots <span className="font-light">({startDate && endDate ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : startDate ? `From ${new Date(startDate).toLocaleDateString()}` : 'Select Dates'})</span>
        </p>
        <div className="flex overflow-x-auto gap-0">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = (i % 12) + 1;
            const ampm = i < 12 ? "AM" : "PM";
            return (
              <div key={i} className="flex-shrink-0 w-16 border-r border-gray-300 p-2 text-center last:border-r-0">
                <p className="text-xs font-bold mb-2">{hour} {ampm}</p>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">COM SOV</div>
                  <div className="text-lg font-bold text-blue-600">5.5%</div>
                  <div className="text-xs text-gray-600">ACT SOV</div>
                  <div className="text-lg font-bold text-green-600">20%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}