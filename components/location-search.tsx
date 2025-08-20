"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search, X } from "lucide-react"
import { PHILIPPINES_LOCATIONS } from "@/lib/accuweather-service"

interface LocationSearchProps {
  value: string
  onLocationChange: (locationKey: string, locationName: string) => void
  className?: string
}

interface PlaceResult {
  place_id: string
  formatted_address: string
  name: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

export function LocationSearch({ value, onLocationChange, className }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocationName, setSelectedLocationName] = useState("")
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with current location name
  useEffect(() => {
    const currentLocation = PHILIPPINES_LOCATIONS.find((loc) => loc.key === value)
    if (currentLocation) {
      setSelectedLocationName(`${currentLocation.name}, ${currentLocation.region}`)
    }
  }, [value])

  // Function to find nearest AccuWeather location based on coordinates
  const findNearestLocation = (lat: number, lng: number) => {
    // Predefined coordinates for major Philippine cities (approximate)
    const locationCoords: { [key: string]: { lat: number; lng: number } } = {
      "264885": { lat: 14.5995, lng: 120.9842 }, // Manila
      "264886": { lat: 14.676, lng: 121.0437 }, // Quezon City
      "264308": { lat: 10.3157, lng: 123.8854 }, // Cebu City
      "264312": { lat: 7.1907, lng: 125.4553 }, // Davao City
      "264870": { lat: 10.7202, lng: 122.5621 }, // Iloilo City
      "264873": { lat: 10.677, lng: 122.954 }, // Bacolod
      "264874": { lat: 8.4542, lng: 124.6319 }, // Cagayan de Oro
      "264875": { lat: 6.9214, lng: 122.079 }, // Zamboanga City
      "264876": { lat: 16.4023, lng: 120.596 }, // Baguio
      "264877": { lat: 11.2421, lng: 125.0066 }, // Tacloban
    }

    let nearestKey = "264885" // Default to Manila
    let minDistance = Number.POSITIVE_INFINITY

    Object.entries(locationCoords).forEach(([key, coords]) => {
      const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2))
      if (distance < minDistance) {
        minDistance = distance
        nearestKey = key
      }
    })

    return nearestKey
  }

  // Search for places using Google Maps Places API
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Use Google Maps Places API via our API route
      const response = await fetch(`/api/places-search?query=${encodeURIComponent(query)}&region=ph`)

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.results || [])
      } else {
        console.error("Places search failed:", response.statusText)
        setSuggestions([])
      }
    } catch (error) {
      console.error("Error searching places:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowSuggestions(true)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(query)
    }, 300)
  }

  // Handle place selection
  const handlePlaceSelect = (place: PlaceResult) => {
    const { lat, lng } = place.geometry.location
    const nearestLocationKey = findNearestLocation(lat, lng)
    const locationName = place.name || place.formatted_address

    setSelectedLocationName(locationName)
    setSearchQuery("")
    setShowSuggestions(false)
    setSuggestions([])

    onLocationChange(nearestLocationKey, locationName)
  }

  // Handle preset location selection
  const handlePresetSelect = (location: (typeof PHILIPPINES_LOCATIONS)[0]) => {
    const locationName = `${location.name}, ${location.region}`
    setSelectedLocationName(locationName)
    setSearchQuery("")
    setShowSuggestions(false)
    setSuggestions([])

    onLocationChange(location.key, locationName)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Current Location Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md min-w-[200px]">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium truncate">{selectedLocationName}</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10 pr-10 w-[250px]"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (searchQuery || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {/* Preset Philippines Locations */}
              {!searchQuery && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">Popular Locations</div>
                  {PHILIPPINES_LOCATIONS.map((location) => (
                    <button
                      key={location.key}
                      onClick={() => handlePresetSelect(location)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-sm flex items-center gap-2"
                    >
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">
                        {location.name}, {location.region}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div className="p-2">
                  {isLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    <>
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">Search Results</div>
                      {suggestions.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => handlePlaceSelect(place)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-sm flex items-center gap-2"
                        >
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{place.name}</div>
                            <div className="text-xs text-gray-500 truncate">{place.formatted_address}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />}
    </div>
  )
}
