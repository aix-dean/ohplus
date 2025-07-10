"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Building, Loader2, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getProductById, type Product } from "@/lib/firebase-service"
import Image from "next/image"
import { CreateReportDialog } from "@/components/create-report-dialog"

interface ProjectMonitoringEntry {
  date: string
  time: string
  team: string
  teamColor: string
  update: string
  hasAttachment: boolean
}

export default function SiteDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!user?.uid || !params.id) return

      setLoading(true)
      try {
        const productData = await getProductById(params.id)
        if (productData) {
          setProduct(productData)
        } else {
          setError("Site not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load site details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [user?.uid, params.id])

  // Mock project monitoring data - in a real app, this would come from your database
  const projectMonitoringEntries: ProjectMonitoringEntry[] = [
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

  const getCardHeaderColor = (name: string) => {
    if (name?.toLowerCase().includes("lilo")) return "bg-cyan-500"
    if (name?.toLowerCase().includes("fairy")) return "bg-pink-500"
    if (name?.toLowerCase().includes("funalo")) return "bg-gray-800"
    return "bg-blue-500"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading site details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error || "Site not found"}</p>
          <Link href="/logistics/bulletin-board">
            <Button variant="outline" className="mt-4 bg-transparent">
              Back to Bulletin Board
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/logistics/bulletin-board">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className={`${getCardHeaderColor(product.name)} text-white px-4 py-2 rounded-md font-bold text-lg`}>
          {product.name}
        </div>
        <span className="text-gray-600 font-medium">{product.id}</span>
      </div>

      {/* Site Information Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Site Image */}
            <div className="relative w-32 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={product.media?.[0]?.url || "/roadside-billboard.png"}
                alt={product.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/roadside-billboard.png"
                  target.className = "opacity-50 object-contain"
                }}
              />
            </div>

            {/* Site Details */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Site:</span>
                <span>{product.specs_rental?.location || product.light?.location || "Petplans EDSA Northbound"}</span>
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
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Sales:</span>
                <span>Noemi Abellaneda</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Monitoring Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardTitle className="text-xl font-bold">Project Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectMonitoringEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${entry.teamColor} text-white`}>{entry.team}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.update}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {entry.hasAttachment ? (
                        <Button variant="link" className="text-blue-600 p-0 h-auto">
                          See Attachment
                        </Button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Floating Report Button */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={() => setReportDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg h-14 px-6"
          size="lg"
        >
          <FileText className="mr-2 h-5 w-5" /> Create Report
        </Button>
      </div>

      {/* Create Report Dialog */}
      {product && <CreateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} siteId={product.id} />}
    </div>
  )
}
