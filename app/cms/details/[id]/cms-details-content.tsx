"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, Settings, Clock, List, Wrench } from "lucide-react"
import type { Product, ServiceAssignment } from "@/lib/firebase-service"
import ProgramListTab from "./tabs/program-list-tab"
import ServiceTab from "./tabs/service-tab"
import ControlsTab from "./tabs/controls-tab"
import TimelineTab from "./tabs/timeline-tab"

interface CMSDetailsContentProps {
  product: Product
  serviceAssignments: ServiceAssignment[]
}

// Safe data transformation utilities
const safeString = (value: any, fallback = "Unknown"): string => {
  return value && typeof value === "string" ? value : fallback
}

const safeNumber = (value: any, fallback = 0): number => {
  return typeof value === "number" && !isNaN(value) ? value : fallback
}

const safeDate = (timestamp: any): string => {
  try {
    if (!timestamp) return "Unknown"
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString()
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString()
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleDateString()
    }
    return "Unknown"
  } catch {
    return "Unknown"
  }
}

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "available":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "completed":
      return "bg-green-100 text-green-800 border-green-200"
    case "ongoing":
    case "in progress":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function CMSDetailsContent({ product, serviceAssignments }: CMSDetailsContentProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Safe product data extraction
  const productData = {
    id: safeString(product.id),
    name: safeString(product.name, "Unnamed Product"),
    description: safeString(product.description, "No description available"),
    status: safeString(product.status, "PENDING"),
    type: safeString(product.type, "RENTAL"),
    imageUrl: safeString(product.imageUrl, "/placeholder.svg?height=300&width=300"),
    created: safeDate(product.created),
    updated: safeDate(product.updated),
    companyId: safeString(product.company_id),
    sellerId: safeString(product.seller_id),
    trafficCount: safeNumber(product.specs_rental?.traffic_count),
    location: safeString(product.specs_rental?.location, "Location not specified"),
    height: safeNumber(product.specs_rental?.height, 12),
    width: safeNumber(product.specs_rental?.width, 12),
    cms: {
      startTime: safeString(product.cms?.start_time, "06:00"),
      endTime: safeString(product.cms?.end_time, "18:00"),
      spotDuration: safeNumber(product.cms?.spot_duration, 15),
      loopsPerDay: safeNumber(product.cms?.loops_per_day, 20),
    },
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/cms/dashboard"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>
          <Badge className={getStatusColor(productData.status)}>
            {productData.status.charAt(0).toUpperCase() + productData.status.slice(1)}
          </Badge>
          <Badge variant="outline">{productData.type}</Badge>
        </div>

        <p className="text-gray-600 max-w-3xl">{productData.description}</p>
      </div>

      {/* Product Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={18} />
            Product Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Product Image */}
            <div className="space-y-3">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={productData.imageUrl || "/placeholder.svg"}
                  alt={productData.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">ID: {productData.id}</p>
                <p className="text-xs text-gray-500">
                  {productData.height}" × {productData.width}"
                </p>
              </div>
            </div>

            {/* Product Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                <p className="text-sm text-gray-600">{productData.location}</p>
              </div>

              {productData.trafficCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Traffic Count</h3>
                  <p className="text-sm text-gray-600">{productData.trafficCount.toLocaleString()} daily</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">CMS Configuration</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Operating Hours:</span>
                    <p className="font-medium">
                      {productData.cms.startTime} - {productData.cms.endTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Spot Duration:</span>
                    <p className="font-medium">{productData.cms.spotDuration}s</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Loops per Day:</span>
                    <p className="font-medium">{productData.cms.loopsPerDay}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{productData.created}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-gray-500">Updated:</span>
                    <span className="font-medium">{productData.updated}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <List size={16} />
            Program List
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Wrench size={16} />
            Service
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings size={16} />
            Controls
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock size={16} />
            Timeline
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            <ProgramListTab productId={productData.id} />
          </TabsContent>

          <TabsContent value="service" className="space-y-6">
            <ServiceTab productId={productData.id} serviceAssignments={serviceAssignments} />
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <ControlsTab product={product} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <TimelineTab
              cmsData={productData.cms}
              productId={productData.id}
              companyId={productData.companyId}
              sellerId={productData.sellerId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
