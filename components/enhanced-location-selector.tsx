"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, MapPin } from "lucide-react"
import { PHILIPPINES_LOCATIONS } from "@/lib/accuweather-service"
import { GoogleMapsLocationPicker } from "./google-maps-location-picker"

interface Location {
  lat: number
  lng: number
  address: string
  placeId?: string
}

interface EnhancedLocationSelectorProps {
  value: string
  onLocationChange: (locationKey: string, customLocation?: Location) => void
  customLocation?: Location | null
  className?: string
}

export function EnhancedLocationSelector({
  value,
  onLocationChange,
  customLocation,
  className,
}: EnhancedLocationSelectorProps) {
  const [selectedCustomLocation, setSelectedCustomLocation] = useState<Location | null>(customLocation || null)

  // Handle predefined location selection
  const handlePredefinedLocationChange = (locationKey: string) => {
    setSelectedCustomLocation(null)
    onLocationChange(locationKey)
  }

  // Handle custom location selection from map
  const handleCustomLocationSelect = (location: Location) => {
    setSelectedCustomLocation(location)
    onLocationChange("custom", location)
  }

  // Get display value for the selector
  const getDisplayValue = () => {
    if (value === "custom" && selectedCustomLocation) {
      return selectedCustomLocation.address
    }

    const predefinedLocation = PHILIPPINES_LOCATIONS.find((loc) => loc.key === value)
    return predefinedLocation ? `${predefinedLocation.name}, ${predefinedLocation.region}` : "Select location"
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value === "custom" ? "" : value} onValueChange={handlePredefinedLocationChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select location">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{getDisplayValue()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PHILIPPINES_LOCATIONS.map((location) => (
            <SelectItem key={location.key} value={location.key}>
              {location.name}, {location.region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <GoogleMapsLocationPicker onLocationSelect={handleCustomLocationSelect} currentLocation={selectedCustomLocation}>
        <Button variant="outline" size="icon" title="Search on map">
          <Map className="h-4 w-4" />
          <span className="sr-only">Search on map</span>
        </Button>
      </GoogleMapsLocationPicker>

      {/* Show custom location badge */}
      {value === "custom" && selectedCustomLocation && (
        <Badge variant="secondary" className="max-w-[150px]">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="truncate">Custom Location</span>
        </Badge>
      )}
    </div>
  )
}
