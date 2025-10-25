import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
}

export function SpotsGrid({ spots, totalSpots, occupiedCount, vacantCount, productId }: SpotsGridProps) {
  const router = useRouter()

  const handleSpotClick = (spotNumber: number) => {
    if (productId) {
      router.push(`/sales/products/${productId}/spots/${spotNumber}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Total Spots:</span>
          <span className="text-gray-700">{totalSpots}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Total Occupied:</span>
          <span className="text-cyan-600 font-medium">{occupiedCount} ({Math.round((occupiedCount / totalSpots) * 100)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Total Vacant:</span>
          <span className="font-bold text-gray-700">{vacantCount} ({Math.round((vacantCount / totalSpots) * 100)}%)</span>
        </div>
      </div>

      {/* Spots Grid */}
      <div className="bg-[#c4c4c4] rounded-[13.8px] p-4">
        <div className="flex gap-[13.758px] overflow-x-auto pb-4">
        {spots.map((spot) => (
          <div
            key={spot.id}
            className="flex-shrink-0 w-[110px] h-[197px] bg-white rounded-[14px] shadow-[-1px_3px_7px_-1px_rgba(0,0,0,0.25)] border border-gray-200 overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSpotClick(spot.number)}
          >
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
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="absolute inset-0 flex flex-col justify-end p-[10px] pb-[13px]">
              {/* Spot Number */}
              <div className="text-[11px] font-semibold text-black mb-[13px]">
                {spot.number}/{totalSpots}
              </div>

              {/* Status */}
              <div className={`text-[11px] font-semibold mb-[13px] ${
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
      </div>
    </div>
  )
}