"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface Site {
  id: string
  name: string
  location: string
  type: "static" | "led"
  status: "active" | "maintenance" | "offline"
  operationalStatus: string
  displayHealth: string
  compliance: string
  lastUpdate: string
  image?: string
  companyId: string
}

export default function LEDSites() {
  const { user } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSites = async () => {
      if (!user?.companyId) return

      try {
        setLoading(true)

        // Query LED sites filtered by user's company ID
        const sitesQuery = query(
          collection(db, "sites"),
          where("companyId", "==", user.companyId),
          where("type", "==", "led"),
          orderBy("name"),
        )

        const sitesSnapshot = await getDocs(sitesQuery)
        const sitesData = sitesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Site[]

        setSites(sitesData)
      } catch (error) {
        console.error("Error fetching LED sites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [user?.companyId])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 text-white text-xs px-2 py-1">OPEN</Badge>
      case "maintenance":
        return <Badge className="bg-red-500 text-white text-xs px-2 py-1">MAINTENANCE</Badge>
      case "offline":
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1">OFFLINE</Badge>
      default:
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1">{status.toUpperCase()}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sites.map((site) => (
        <Card key={site.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
          {/* Status Badge */}
          <div className="absolute top-2 left-2 z-10">{getStatusBadge(site.status)}</div>

          {/* Site Image */}
          <div className="relative h-32 bg-gray-100">
            <Image
              src={site.image || "/placeholder.svg?height=128&width=256&query=LED billboard"}
              alt={site.name}
              fill
              className="object-cover"
            />
          </div>

          <CardContent className="p-3">
            {/* Site Code */}
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{site.id}</div>

            {/* Site Name with Type Badge */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-base text-gray-900 truncate flex-1">{site.name}</h3>
              <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                D
              </Badge>
            </div>

            {/* Site Details */}
            <div className="space-y-1 text-xs text-gray-600 mb-3">
              <div className="flex items-center justify-between">
                <span>Operation:</span>
                <span className="font-medium">{site.operationalStatus || "Active"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Display Health:</span>
                <span className="font-medium text-green-600">{site.displayHealth || "100%"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Compliance:</span>
                <span className="font-medium">{site.compliance || "Complete"}</span>
              </div>
            </div>

            {/* Create Report Button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium border-0"
            >
              Create Report
            </Button>
          </CardContent>
        </Card>
      ))}

      {sites.length === 0 && !loading && (
        <div className="col-span-full text-center py-8 text-gray-500">No LED sites found for your company.</div>
      )}
    </div>
  )
}
