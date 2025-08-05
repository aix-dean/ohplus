"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MapPin, Loader2 } from "lucide-react"

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
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

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            setIsLoaded(true)
            setIsLoading(false)
            clearInterval(checkGoogle)
          }
        }, 100)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`
      script.async = true
      script.defer = true

      window.initMap = () => {
        setIsLoaded(true)
        setIsLoading(false)
      }

      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

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
      })

      setMap(mapInstance)
      setMarker(markerInstance)

      // Handle marker drag
      markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition()
        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ location: position }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            onChange(results[0].formatted_address)
            if (inputRef.current) {
              inputRef.current.value = results[0].formatted_address
            }
          }
        })
      })

      // Handle map click
      mapInstance.addListener("click", (event: any) => {
        const position = event.latLng
        markerInstance.setPosition(position)

        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: position }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            onChange(results[0].formatted_address)
            if (inputRef.current) {
              inputRef.current.value = results[0].formatted_address
            }
          }
        })
      })
    }

    // Handle place selection
    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace()

      if (!place.geometry || !place.geometry.location) {
        return
      }

      const address = place.formatted_address || place.name || ""
      onChange(address)

      // Update map if enabled
      if (enableMap && map && marker) {
        const location = place.geometry.location
        map.setCenter(location)
        map.setZoom(17)
        marker.setPosition(location)
      }
    })

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isLoaded, enableMap, onChange])

  // Set initial value
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
        <Input ref={inputRef} placeholder={placeholder} className="pr-10" onChange={(e) => onChange(e.target.value)} />
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
