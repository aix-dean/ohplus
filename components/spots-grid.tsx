import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

interface Spot {
  id: string
  number: number
  status: "occupied" | "vacant"
  clientName?: string
  imageUrl?: string
}

interface SpotsGridProps {
  spots: Spot[]
  totalSpots: number
  occupiedCount: number
  vacantCount: number
  productId?: string
  currentDate: string
  router?: any
  selectedSpots?: number[]
  onSpotToggle?: (spotNumber: number) => void
  showSummary?: boolean
  bg?: boolean
}

export function SpotsGrid({ spots, totalSpots, occupiedCount, vacantCount, productId, currentDate, router, selectedSpots, onSpotToggle, showSummary = true, bg = true }: SpotsGridProps) {

  const handleSpotClick = (spotNumber: number) => {
    if (productId) {
      router?.push(`/sales/products/${productId}/spots/${spotNumber}`)
    }
  }

  const spotsContent = (
    <div className="flex gap-[13.758px] overflow-x-scroll pb-4 w-full pr-4">
    {spots.map((spot) => (
      <div
        key={spot.id}
        className="flex-shrink-0 w-[110px] h-[197px] bg-white rounded-[14px] shadow-[-1px_3px_7px_-1px_rgba(0,0,0,0.25)] border border-gray-200 overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onSpotToggle ? onSpotToggle(spot.number) : handleSpotClick(spot.number)}
      >
        {onSpotToggle && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedSpots?.includes(spot.number) || false}
              onChange={() => onSpotToggle(spot.number)}
              className="bg-white border-2 border-gray-300"
            />
          </div>
        )}

        {/* Image Section */}
        <div className="absolute inset-0 opacity-50">
          {spot.imageUrl ? (
            <Image
              src={spot.imageUrl}
              alt={`Spot ${spot.number}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="absolute inset-0 flex flex-col justify-end p-[10px]">
          {/* Spot Number */}
          <div className="text-[11px] font-semibold text-black">
            {spot.number}/{totalSpots}
          </div>

          {/* Status */}
          <div className={`text-[11px] font-semibold ${
            spot.status === "occupied" ? "text-[#00d0ff]" : "text-[#a1a1a1]"
          }`}>
            {spot.status === "occupied" ? "Occupied" : "Vacant"}
          </div>

          {/* Client Name */}
          <div className={`text-[11px] font-semibold ${
            spot.status === "occupied" ? "text-black" : "text-[#a1a1a1]"
          }`}>
            {spot.clientName || "Filler Content 1"}
          </div>
        </div>
      </div>
    ))}
    </div>
  )

  if (bg) {
    return (
      <div className="space-y-4">
        {/* Spots Grid */}
        <div className="bg-[#ECECEC] rounded-[13.8px] p-4">
          {showSummary && (
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">Total Spots:</span>
                  <span className="text-gray-700">{totalSpots}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">Total Occupied:</span>
                  <span className="text-cyan-600 font-medium">{occupiedCount} ({Math.round((occupiedCount / totalSpots) * 100)}%)</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">Total Vacant:</span>
                  <span className="font-bold text-gray-700">{vacantCount} ({Math.round((vacantCount / totalSpots) * 100)}%)</span>
                </div>
              </div>
              <span
                onClick={() => router?.push(`/sales/products/${productId}/spots/1`)}
                className="text-blue-600 underline cursor-pointer"
              >
                as of {currentDate} {'->'}
              </span>
            </div>
          )}
          {spotsContent}
        </div>
      </div>
    )
  } else {
    return spotsContent
  }
}