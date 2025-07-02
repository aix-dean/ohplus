"use client"

import { useState } from "react"
import { LayoutGrid, List, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { Product } from "@/lib/firebase-service"

const structureTypeData = [
  { type: "Freestanding", count: 50 },
  { type: "Wall-Mounted", count: 30 },
  { type: "Rooftop", count: 15 },
  { type: "Gantry", count: 5 },
]

const chartConfig = {
  count: {
    label: "Number of Sites",
    color: "hsl(var(--primary))",
  },
}

export default function LEDSitesStructureTab({ products = [] }: { products?: Product[] }) {
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
          <Link href={`/logistics/sites/${product.id}?view=structure`} key={product.id}>
            <LEDStructureCard product={product} />
          </Link>
        ))}
      </div>

      {/* LED Sites by Structure Type Chart */}
      <div className="mt-4">
        <LEDSitesStructure />
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

function LEDStructureCard({ product }: { product: Product }) {
  // Get the first media item for the thumbnail
  const thumbnailUrl = product.media && product.media.length > 0 ? product.media[0].url : "/led-billboard-1.png"

  // Generate random maintenance date (for demo purposes)
  const today = new Date()
  const randomDaysAgo = Math.floor(Math.random() * 90) + 1 // 1-90 days ago
  const lastMaintained = new Date(today)
  lastMaintained.setDate(today.getDate() - randomDaysAgo)

  const formattedDate = lastMaintained.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Determine structure condition based on days since maintenance
  let condition = "Good"
  let conditionColor = "green"

  if (randomDaysAgo > 60) {
    condition = "Needs Inspection"
    conditionColor = "red"
  } else if (randomDaysAgo > 30) {
    condition = "Due for Maintenance"
    conditionColor = "orange"
  }

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

          {/* Maintenance Status Indicator */}
          <div className="mt-1 p-3 rounded-lg bg-white shadow-sm">
            <div className="text-sm text-gray-700 mb-1">
              Last Maintained: <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${conditionColor === "green" ? "bg-green-500" : conditionColor === "orange" ? "bg-orange-500" : "bg-red-500"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {conditionColor === "green" ? (
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </div>
              <span
                className={`font-bold ${
                  conditionColor === "green"
                    ? "text-green-600"
                    : conditionColor === "orange"
                      ? "text-orange-600"
                      : "text-red-600"
                }`}
              >
                {condition}
              </span>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LEDSitesStructure() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">LED Sites by Structure Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={structureTypeData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="type" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
