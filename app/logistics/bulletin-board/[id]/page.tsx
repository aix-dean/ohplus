"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, Building, DollarSign } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getProductById, type Product } from "@/lib/firebase-service"
import Image from "next/image"

type Props = {
  params: { id: string }
}

// Mock project monitoring data - in a real app, this would come from your database
const mockProjectMonitoring = [
  {
    date: "May 6, 2025",
    time: "10:24 am",
    team: "Installer",
    teamColor: "bg-green-500",
    update: "Finished installation of new material",
    hasAttachment: true,
  },
  {
    date: "May 6, 2025",
    time: "10:24 am",
    team: "Delivery",
    teamColor: "bg-purple-500",
    update: "Arrived at site",
    hasAttachment: false,
  },
  {
    date: "May 6, 2025",
    time: "10:24 am",
    team: "Installer",
    teamColor: "bg-green-500",
    update: "Arrived at site",
    hasAttachment: true,
  },
  {
    date: "May 4, 2025",
    time: "10:24 am",
    team: "Logistics",
    teamColor: "bg-blue-500",
    update: "Reported Bad Weather as cause of delay",
    hasAttachment: true,
  },
  {
    date: "May 3, 2025",
    time: "10:24 am",
    team: "Logistics",
    teamColor: "bg-blue-500",
    update: "Contacted Team C for installation",
    hasAttachment: false,
  },
  {
    date: "May 2, 2025",
    time: "10:24 am",
    team: "Sales",
    teamColor: "bg-orange-500",
    update: "Created an Installation JO for Petplans Site",
    hasAttachment: true,
  },
  {
    date: "April 20, 2025",
    time: "10:24 am",
    team: "Sales",
    teamColor: "bg-orange-500",
    update: "Received signed contract. Project approved.",
    hasAttachment: true,
  },
]

export default function SiteDetailsPage({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const productData = await getProductById(params.id)
        if (productData) {
          setProduct(productData)
        } else {
          setError("Site not found")
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load site details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, user?.uid])

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Site</h2>
          <p className="text-gray-600">{error}</p>
          <Link href="/logistics/bulletin-board">
            <Button className="mt-4">Back to Bulletin Board</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get site image
  const siteImage = product.media && product.media.length > 0 ? product.media[0].url : "/roadside-billboard.png"

  // Get site location
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/logistics/bulletin-board">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-lg">{product.name}</div>
          <div className="text-lg font-medium text-gray-600">{product.id}</div>
        </div>
      </div>

      {/* Site Information Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Site Image */}
            <div className="w-32 h-24 relative bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={siteImage || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/roadside-billboard.png"
                }}
              />
            </div>

            {/* Site Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Site:</span>
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Client:</span>
                <span>Summit Media</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Booking Dates:</span>
                <span>May 20, 2025 to June 20, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Breakdate:</span>
                <span>May 20, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Sales:</span>
                <span>Noemi Abellaneda</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Monitoring */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardTitle className="text-lg">Project Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Update</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Attachments</th>
                </tr>
              </thead>
              <tbody>
                {mockProjectMonitoring.map((entry, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{entry.date}</td>
                    <td className="py-3 px-4 text-sm">{entry.time}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${entry.teamColor} text-white`}>{entry.team}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{entry.update}</td>
                    <td className="py-3 px-4">
                      {entry.hasAttachment ? (
                        <Button variant="link" className="text-blue-600 p-0 h-auto">
                          See Attachment
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
