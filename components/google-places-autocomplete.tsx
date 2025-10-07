"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MapPin, Loader2 } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onGeopointChange?: (geopoint: [number, number] | null) => void
  placeholder?: string
  className?: string
  enableMap?: boolean
  mapHeight?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onGeopointChange,
  placeholder = "Enter location...",
  className,
  enableMap = false,
  mapHeight = "200px",
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [geocoder, setGeocoder] = useState<any>(null)

  useEffect(() => {
    const initializeMaps = async () => {
      try {
        setIsLoading(true)
        await loadGoogleMaps()
        setIsLoaded(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load Google Maps:", error)
        setIsLoading(false)
      }
    }

    initializeMaps()
  }, [])

  // Function to geocode an address and update the map
  const geocodeAddress = (address: string) => {
    if (!geocoder || !address.trim() || !map || !marker) return

    geocoder.geocode({ address: address }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location
        map.setCenter(location)
        map.setZoom(17)
        marker.setPosition(location)
        marker.setVisible(true)
      } else {
        // If geocoding fails, hide the marker
        marker.setVisible(false)
      }
    })
  }

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    // Initialize geocoder
    const geocoderInstance = new window.google.maps.Geocoder()
    setGeocoder(geocoderInstance)

    // Initialize autocomplete
    const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      fields: ["place_id", "geometry", "name", "formatted_address"],
    })

    setAutocomplete(autocompleteInstance)

    // Initialize map if enabled
    if (enableMap && mapRef.current) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 14.5995, lng: 120.9842 }, // Default to Manila, Philippines
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      const markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        draggable: true,
        visible: false, // Initially hidden until we have a location
      })

      setMap(mapInstance)
      setMarker(markerInstance)

      // Handle marker drag
      markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition()

        geocoderInstance.geocode({ location: position }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const newAddress = results[0].formatted_address
            onChange(newAddress)
            if (inputRef.current) {
              inputRef.current.value = newAddress
            }

            // Call geopoint callback if provided
            if (onGeopointChange && position) {
              const lat = position.lat()
              const lng = position.lng()
              onGeopointChange([lat, lng])
            }
          }
        })
      })

      // Handle map click
      mapInstance.addListener("click", (event: any) => {
        const position = event.latLng
        markerInstance.setPosition(position)
        markerInstance.setVisible(true)

        geocoderInstance.geocode({ location: position }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const newAddress = results[0].formatted_address
            onChange(newAddress)
            if (inputRef.current) {
              inputRef.current.value = newAddress
            }

            // Call geopoint callback if provided
            if (onGeopointChange && position) {
              const lat = position.lat()
              const lng = position.lng()
              onGeopointChange([lat, lng])
            }
          }
        })
      })

      // If we already have a value, geocode it
      if (value.trim()) {
        setTimeout(() => {
          geocodeAddress(value)
        }, 100)
      }
    }

    // Handle place selection from autocomplete
    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace()

      if (!place.geometry || !place.geometry.location) {
        return
      }

      const address = place.formatted_address || place.name || ""
      onChange(address)

      // Call geopoint callback if provided
      if (onGeopointChange && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        onGeopointChange([lat, lng])
      }

      // Update map if enabled
      if (enableMap && map && marker) {
        const location = place.geometry.location
        map.setCenter(location)
        map.setZoom(17)
        marker.setPosition(location)
        marker.setVisible(true)
      }
    })

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isLoaded, enableMap])

  // Handle manual input changes (when user types directly)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Debounce geocoding for manual input
    if (enableMap && newValue.trim()) {
      const timeoutId = setTimeout(() => {
        geocodeAddress(newValue)
      }, 1000) // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId)
    }
  }

  // Update map when value changes externally
  useEffect(() => {
    if (enableMap && value.trim() && geocoder) {
      geocodeAddress(value)
    }
  }, [value, geocoder, enableMap])

  // Set input value when prop changes
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value
    }
  }, [value])

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <Input placeholder="Loading Google Maps..." disabled className="pr-10" />
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={cn("relative", className)}>
        <Input placeholder="Google Maps failed to load" disabled className="pr-10" />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className={cn("relative", className)}>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pr-10"
          onChange={handleInputChange}
          defaultValue={value}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {enableMap && (
        <div className="space-y-2">
          <div
            ref={mapRef}
            style={{ height: mapHeight }}
            className="w-full rounded-md border border-input bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Click on the map or drag the marker to select the exact location
          </p>
        </div>
      )}
    </div>
  )
}
