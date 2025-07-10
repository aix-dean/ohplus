"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Building, Loader2, AlertCircle, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)

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

  const handleSeeAttachment = () => {
    setPdfViewerOpen(true)
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
                        <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={handleSeeAttachment}>
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

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-full h-full p-0">
          <div className="relative w-full h-full bg-white">
            {/* Close Button */}
            <button
              onClick={() => setPdfViewerOpen(false)}
              className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            {/* PDF Content */}
            <div className="p-8 h-full overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Completion Report</h1>
                <p className="text-gray-600">as of July 10, 2025</p>
              </div>

              {/* Project Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Site ID:</span> {product.id}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> Guadalupe Viejo
                  </div>
                  <div>
                    <span className="font-medium">Job Order:</span> KTHB
                  </div>
                  <div>
                    <span className="font-medium">Job Order Date:</span> July 10, 2025
                  </div>
                  <div>
                    <span className="font-medium">Site:</span> P01
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> N/A
                  </div>
                  <div>
                    <span className="font-medium">Start Date:</span> May 20, 2025
                  </div>
                  <div>
                    <span className="font-medium">End Date:</span> June 20, 2025
                  </div>
                  <div>
                    <span className="font-medium">Installation Duration:</span> 31 days
                  </div>
                  <div>
                    <span className="font-medium">Content:</span> Static
                  </div>
                  <div>
                    <span className="font-medium">Material Specs:</span> N/A
                  </div>
                  <div>
                    <span className="font-medium">Crew:</span> Team A
                  </div>
                  <div>
                    <span className="font-medium">Illumination:</span> N/A
                  </div>
                  <div>
                    <span className="font-medium">Gondola:</span> NO
                  </div>
                  <div>
                    <span className="font-medium">Technology:</span> N/A
                  </div>
                  <div>
                    <span className="font-medium">Sales:</span> aixymbiosis@aix.com
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Project Status:</span>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">100%</div>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">report.pdf</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Date:</span> July 10, 2025
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> 10:28 AM
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> Guadalupe Viejo
                    </div>
                    <div>
                      <span className="font-medium">Prepared by:</span> aixymbiosis@aix.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-6 mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="bg-blue-500 text-white px-4 py-2 rounded font-bold">LOGISTICS</div>
                    <div className="text-sm text-gray-600 mt-2">July 10, 2025</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 italic max-w-md">
                      "All data are based on the latest available records as of July 10, 2025."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
