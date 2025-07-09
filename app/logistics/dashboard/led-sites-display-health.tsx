"use client"

import type React from "react"

import { useState } from "react"
import { LayoutGrid, List, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Product } from "@/lib/firebase-service"

export default function LEDSitesDisplayHealthTab({ products = [] }: { products?: Product[] }) {
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

  // Count products by health status
  const healthyCounts = {
    healthy: 0,
    needsAttention: 0,
    warning: 0,
    critical: 0,
  }

  products.forEach((product) => {
    // Generate a health percentage based on status if not available
    const healthPercentage =
      product.health_percentage ||
      (product.status === "ACTIVE"
        ? Math.floor(Math.random() * 20) + 80
        : // 80-100 for operational
          product.status === "PENDING"
          ? Math.floor(Math.random() * 30) + 50
          : // 50-80 for warning
            Math.floor(Math.random() * 40) + 10) // 10-50 for error

    if (healthPercentage >= 90) healthyCounts.healthy++
    else if (healthPercentage >= 70) healthyCounts.needsAttention++
    else if (healthPercentage >= 40) healthyCounts.warning++
    else healthyCounts.critical++
  })

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
          <Link href={`/logistics/sites/${product.id}?view=display-health`} key={product.id}>
            <LEDHealthCard key={product.id} product={product} />
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

// Update the LEDHealthCard to use Product type
function LEDHealthCard({ product }: { product: Product }) {
  // Get the first media item for the thumbnail
  const thumbnailUrl = product.media && product.media.length > 0 ? product.media[0].url : "/led-billboard-1.png"

  // Add the handleCreateReport function
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Creating report for LED site:", product.id)
  }

  // Generate a health percentage based on status if not available
  const healthPercentage =
    product.health_percentage ||
    (product.status === "ACTIVE"
      ? Math.floor(Math.random() * 20) + 80
      : // 80-100 for operational
        product.status === "PENDING"
        ? Math.floor(Math.random() * 30) + 50
        : // 50-80 for warning
          Math.floor(Math.random() * 40) + 10) // 10-50 for error

  // Determine health status based on percentage
  let healthStatus = "Healthy"
  if (healthPercentage < 40) healthStatus = "Critical"
  else if (healthPercentage < 70) healthStatus = "Warning"
  else if (healthPercentage < 90) healthStatus = "Needs Attention"

  // Determine color based on health percentage
  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return "green"
    if (percentage >= 70) return "green"
    if (percentage >= 50) return "yellow"
    if (percentage >= 30) return "orange"
    return "red"
  }

  const healthColor = getHealthColor(healthPercentage)

  return (
    <Card className="erp-card overflow-hidden">
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

          <div className="mt-2 flex items-center justify-between">
            <div
              className={`
              font-bold text-lg
              ${healthColor === "green" ? "text-green-600" : ""}
              ${healthColor === "yellow" ? "text-yellow-600" : ""}
              ${healthColor === "orange" ? "text-orange-600" : ""}
              ${healthColor === "red" ? "text-red-600" : ""}
            `}
            >
              {healthPercentage}%
            </div>
            <div
              className={`
              font-medium
              ${healthColor === "green" ? "text-green-600" : ""}
              ${healthColor === "yellow" ? "text-yellow-600" : ""}
              ${healthColor === "orange" ? "text-orange-600" : ""}
              ${healthColor === "red" ? "text-red-600" : ""}
            `}
            >
              {healthStatus}
            </div>
          </div>

          <div className="mt-2">
            <Progress
              value={healthPercentage}
              className="h-2"
              indicatorClassName={`
                ${healthColor === "green" ? "bg-gradient-to-r from-green-500 to-green-300" : ""}
                ${healthColor === "yellow" ? "bg-gradient-to-r from-yellow-500 to-yellow-300" : ""}
                ${healthColor === "orange" ? "bg-gradient-to-r from-orange-500 to-orange-300" : ""}
                ${healthColor === "red" ? "bg-gradient-to-r from-red-500 to-red-300" : ""}
              `}
            />
          </div>

          {/* Create Report Button */}
          <Button
            variant="outline"
            className="mt-4 w-full rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
            onClick={handleCreateReport}
          >
            Create Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
