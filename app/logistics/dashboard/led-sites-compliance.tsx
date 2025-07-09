"use client"

import type React from "react"

import { useState } from "react"
import { LayoutGrid, List, Plus, FileCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/firebase-service"

export default function LEDSitesComplianceTab({ products = [] }: { products?: Product[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Calculate compliance statistics
  const compliantCount = products.filter((p) => getComplianceStatus(p) === "Compliant").length
  const pendingCount = products.filter((p) => getComplianceStatus(p) === "Pending Review").length
  const nonCompliantCount = products.filter((p) => getComplianceStatus(p) === "Non-Compliant").length

  const compliancePercentage = products.length > 0 ? Math.round((compliantCount / products.length) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Date and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {currentDate}, {currentTime}
        </div>
        <div className="flex gap-2">
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={18} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* LED Site Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {products.map((product) => (
          <Link href={`/logistics/sites/${product.id}?view=compliance`} key={product.id}>
            <ComplianceCard product={product} />
          </Link>
        ))}
      </div>

      {/* Create Service Assignment Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="rounded-full shadow-lg gap-2">
          <Plus size={18} />
          Create Service Assignment
        </Button>
      </div>
    </div>
  )
}

function ComplianceCard({ product }: { product: Product }) {
  // Get the first media item for the thumbnail
  const thumbnailUrl = product.media && product.media.length > 0 ? product.media[0].url : "/led-billboard-1.png"

  // Add the handleCreateReport function
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Creating report for LED site:", product.id)
  }

  // Generate compliance data (for demo purposes)
  const status = getComplianceStatus(product)

  // Generate document compliance data
  const documentCount = getDocumentCount(product)
  const totalDocuments = 5 // Total required documents
  const documentsComplete = documentCount === totalDocuments

  return (
    <Card className="erp-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-200">
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "LED Site"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/led-billboard-1.png"
            target.className = "object-cover"
          }}
        />
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">{product.name}</h3>

          {/* Document Compliance Indicator */}
          <div className="mt-2 p-3 rounded-lg bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck size={16} className={documentsComplete ? "text-green-500" : "text-amber-500"} />
              <div className="text-lg font-semibold text-gray-700">
                {documentCount}/{totalDocuments} <span className="text-gray-500 font-normal">Documents</span>
              </div>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
          </div>

          {/* Status Badge */}
          <div className="mt-2">
            <Badge
              variant={status === "Compliant" ? "success" : status === "Pending Review" ? "warning" : "destructive"}
            >
              {status}
            </Badge>
          </div>

          {/* Create Report Button */}
          <Button
            variant="outline"
            className="mt-4 w-full bg-white text-gray-600 hover:bg-gray-50 border-gray-300 font-normal shadow-sm"
            onClick={handleCreateReport}
          >
            Create Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions to generate demo data
function getComplianceStatus(product: Product): "Compliant" | "Pending Review" | "Non-Compliant" {
  // Use product ID to deterministically generate a status
  const id = Number.parseInt(product.id.replace(/\D/g, "") || "0", 10)
  if (id % 3 === 0) return "Non-Compliant"
  if (id % 3 === 1) return "Pending Review"
  return "Compliant"
}

function getDocumentCount(product: Product): number {
  // Generate a document count based on product ID
  const id = Number.parseInt(product.id.replace(/\D/g, "") || "0", 10)
  // For products with "Compliant" status, all documents are complete
  if (getComplianceStatus(product) === "Compliant") return 5
  // For "Pending Review", most documents are complete
  if (getComplianceStatus(product) === "Pending Review") return 4
  // For "Non-Compliant", fewer documents are complete
  return 2 + (id % 3)
}

function getLastInspectionDate(product: Product): string {
  // Generate a date 1-3 months ago
  const today = new Date()
  const id = Number.parseInt(product.id.replace(/\D/g, "") || "0", 10)
  const monthsAgo = (id % 3) + 1
  const date = new Date(today)
  date.setMonth(today.getMonth() - monthsAgo)

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getNextInspectionDate(product: Product): string {
  // Generate a date 1-6 months in the future
  const today = new Date()
  const id = Number.parseInt(product.id.replace(/\D/g, "") || "0", 10)
  const monthsAhead = (id % 6) + 1
  const date = new Date(today)
  date.setMonth(today.getMonth() + monthsAhead)

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
