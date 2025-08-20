"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, MapPin } from "lucide-react"
import { GoogleMapsLocationPicker } from "./google-maps-location-picker"

interface Location {
  lat: number
  lng: number
  address: string
  placeId?: string
}

interface EnhancedLocationSelectorProps {
  onLocationChange: (locationKey: string, customLocation?: Location) => void
  customLocation?: Location | null
  className?: string
}

export function EnhancedLocationSelector({
  onLocationChange,
  customLocation,
  className,
}: EnhancedLocationSelectorProps) {
  const [selectedCustomLocation, setSelectedCustomLocation] = useState<Location | null>(customLocation || null)

  const handleCustomLocationSelect = (location: Location) => {
    setSelectedCustomLocation(location)
    onLocationChange("custom", location)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GoogleMapsLocationPicker onLocationSelect={handleCustomLocationSelect} currentLocation={selectedCustomLocation}>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Map className="h-4 w-4" />
          {selectedCustomLocation ? "Change Location" : "Select Location"}
        </Button>
      </GoogleMapsLocationPicker>

      {/* Show custom location badge */}
      {selectedCustomLocation && (
        <Badge variant="secondary" className="max-w-[200px]">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="truncate">{selectedCustomLocation.address}</span>
        </Badge>
      )}
    </div>
  )
}
