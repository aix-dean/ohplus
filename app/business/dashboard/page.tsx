"use client"

import { Bell, MessageSquare, User, ChevronDown, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface SitePerformanceData {
  bestPerforming: {
    name: string
    percentage: number
  }
  worstPerforming: {
    name: string
    percentage: number
  }
}

interface ConversionRateData {
  quotations: number
  bookings: number
  rate: number
}

export default function Dashboard() {
  const { userData } = useAuth()
  const [sitePerformance, setSitePerformance] = useState<SitePerformanceData>({
    bestPerforming: { name: "Loading...", percentage: 0 },
    worstPerforming: { name: "Loading...", percentage: 0 }
  })
  const [conversionRate, setConversionRate] = useState<ConversionRateData>({
    quotations: 0,
    bookings: 0,
    rate: 0
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [conversionYear, setConversionYear] = useState("2025")
  const [conversionDateRange, setConversionDateRange] = useState<DateRange | undefined>()
  const [occupancy, setOccupancy] = useState({
    staticUnavailable: 0,
    staticTotal: 0,
    dynamicUnavailable: 0,
    dynamicTotal: 0
  })

  useEffect(() => {
    if (userData?.company_id) {
      fetchSitePerformance()
    }
  }, [userData?.company_id, dateRange])

  useEffect(() => {
    if (userData?.company_id) {
      fetchConversionRate()
    }
  }, [userData?.company_id, conversionYear, conversionDateRange])

  const fetchSitePerformance = async () => {
    try {
      const params = new URLSearchParams({
        companyId: userData!.company_id!
      })
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"))

      const response = await fetch(`/api/business/dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSitePerformance(data)
        setOccupancy(data.occupancy)
      } else {
        console.error("Failed to fetch site performance")
      }
    } catch (error) {
      console.error("Error fetching site performance:", error)
    }
  }

  const fetchConversionRate = async () => {
    try {
      const params = new URLSearchParams({
        companyId: userData!.company_id!
      })

      if (conversionDateRange?.from) {
        params.append("startDate", format(conversionDateRange.from, "yyyy-MM-dd"))
      }
      if (conversionDateRange?.to) {
        params.append("endDate", format(conversionDateRange.to, "yyyy-MM-dd"))
      } else {
        params.append("year", conversionYear)
      }

      const response = await fetch(`/api/business/dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        const conversionData = data.conversionRate
        const calculatedRate = conversionData.quotations > 0 ? Math.round((conversionData.bookings / conversionData.quotations) * 100) : 0
        setConversionRate({ ...conversionData, rate: calculatedRate })
      } else {
        console.error("Failed to fetch conversion rate")
      }
    } catch (error) {
      console.error("Error fetching conversion rate:", error)
    }
  }
  return (
    <div className="min-h-screen">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-[#333333] mb-6">{userData?.first_name ? `${userData.first_name}'s Dashboard` : 'Dashboard'}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Today Calendar */}
            <Card className="bg-[#ffffee] border-[#ffdea2] border-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#333333]">
                  Today <span className="text-sm font-normal">12, Sep</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="bg-[#7fdb97]/30 p-2 rounded text-xs">
                    <div className="font-medium">RR0332 - Start Date</div>
                  </div>
                  <div className="bg-[#73bbff]/30 p-2 rounded text-xs">
                    <div className="font-medium">SA0012 - Deadline</div>
                  </div>
                  <div className="bg-[#ff9696]/30 p-2 rounded text-xs">
                    <div className="font-medium">NAN305 - Yearly Maintenan...</div>
                  </div>
                  <div className="bg-[#ffe522]/30 p-2 rounded text-xs">
                    <div className="font-medium">Attend Supplier's Expo @ .....</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="font-medium text-[#333333] mb-2">13, Sep</div>
                  <div className="text-sm text-gray-600">No events for this day.</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="font-medium text-[#333333] mb-2">14, Sep</div>
                  <div className="bg-[#ff9696]/30 p-2 rounded text-xs">
                    <div className="font-medium">NAN305 - Yearly Maintenan...</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Index */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#333333]">Occupancy Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Static BB</span>
                    <span className="font-semibold">{occupancy.staticUnavailable}/{occupancy.staticTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LED BB</span>
                    <span className="font-semibold">{occupancy.dynamicUnavailable}/{occupancy.dynamicTotal}</span>
                  </div>

                  <div className="flex items-center justify-center mt-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#18da69"
                          strokeWidth="3"
                          strokeDasharray={`${occupancy.staticTotal + occupancy.dynamicTotal > 0 ? Math.round(((occupancy.staticUnavailable + occupancy.dynamicUnavailable) / (occupancy.staticTotal + occupancy.dynamicTotal)) * 100) : 0}, ${100 - (occupancy.staticTotal + occupancy.dynamicTotal > 0 ? Math.round(((occupancy.staticUnavailable + occupancy.dynamicUnavailable) / (occupancy.staticTotal + occupancy.dynamicTotal)) * 100) : 0)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-[#333333]">{occupancy.staticTotal + occupancy.dynamicTotal > 0 ? Math.round(((occupancy.staticUnavailable + occupancy.dynamicUnavailable) / (occupancy.staticTotal + occupancy.dynamicTotal)) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#18da69] rounded-full"></div>
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Vacant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Performance */}
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#333333]">Occupancy Performance</CardTitle>
                <Select defaultValue="2025">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-t from-[#4169e1] to-[#73bbff] rounded mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 300 120">
                    <path d="M0,80 Q50,60 100,70 T200,50 T300,60" fill="none" stroke="white" strokeWidth="2" />
                    <path
                      d="M0,80 Q50,60 100,70 T200,50 T300,60 L300,120 L0,120 Z"
                      fill="url(#gradient)"
                      opacity="0.7"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#73bbff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#4169e1" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Best month:</span>
                    <br />
                    <span className="font-semibold">Dec- 100%</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Worst month:</span>
                    <br />
                    <span className="font-semibold">Sep- 40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-[#333333]">Conversion Rate</CardTitle>
                  <Select value={conversionYear} onValueChange={setConversionYear}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DateRangePicker
                  value={conversionDateRange}
                  onChange={setConversionDateRange}
                  placeholder="Select custom date range"
                  className="w-full mt-2"
                />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4169e1]">{conversionRate.quotations}</div>
                    <div className="text-sm text-gray-600">Quotations</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4169e1]">{conversionRate.bookings}</div>
                    <div className="text-sm text-gray-600">Reservations</div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#18da69"
                        strokeWidth="3"
                        strokeDasharray={`${conversionRate.rate}, ${100 - conversionRate.rate}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-[#333333]">{conversionRate.rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-2">
                  <span className="text-xs text-gray-600">conversion rate</span>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#18da69] rounded-full"></div>
                    <span>Reserved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Site Performance */}
            <Card className="bg-white lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#333333]">Site Performance</CardTitle>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
                  className="w-64"
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-sm text-[#18da69] mb-2">Best performing</div>
                    <div className="text-lg font-semibold text-[#333333] mb-2">{sitePerformance.bestPerforming.name}</div>
                    <div className="text-4xl font-bold text-[#18da69]">{sitePerformance.bestPerforming.percentage}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#ff5252] mb-2">Worst performing</div>
                    <div className="text-lg font-semibold text-[#333333] mb-2">{sitePerformance.worstPerforming.name}</div>
                    <div className="text-4xl font-bold text-[#ff5252]">{sitePerformance.worstPerforming.percentage}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}