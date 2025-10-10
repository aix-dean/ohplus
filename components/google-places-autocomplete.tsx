"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MapPin, Loader2 } from "lucide-react"

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onGeopointChange?: (geopoint: [number, number] | null) => void
  placeholder?: string
  className?: string
  enableMap?: boolean
  mapHeight?: string
}

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
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
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=PH`
      )
      const data: NominatimResult[] = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setShowSuggestions(true)

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleSuggestionClick = (suggestion: NominatimResult) => {
    const address = suggestion.display_name

    // Update the value first
    onChange(address)
    if (onGeopointChange) {
      onGeopointChange([parseFloat(suggestion.lat), parseFloat(suggestion.lon)])
    }

    // Hide suggestions after a small delay to allow parent component state to update
    setTimeout(() => {
      setShowSuggestions(false)
      setSuggestions([])
    }, 100)

    // Use requestAnimationFrame for better React rendering cycle integration
    // Wait for parent component to update the value prop before focusing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Set cursor position at the end of the address
          inputRef.current.setSelectionRange(address.length, address.length)
        }
      })
    })
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
      setSuggestions([])
    }, 150)
  }

  return (
    <div className="space-y-3">
      <div className={cn("relative", className)}>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pr-10"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {showSuggestions && suggestions.length > 0 && (
           <div className="absolute top-full left-0 right-0 z-50 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
             {suggestions.map((suggestion) => (
               <div
                 key={suggestion.place_id}
                 className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                 onClick={(e) => {
                   e.preventDefault()
                   e.stopPropagation()
                   handleSuggestionClick(suggestion)
                 }}
               >
                 {suggestion.display_name}
               </div>
             ))}
           </div>
         )}
      </div>

      {enableMap && (
        <div className="space-y-2">
          <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Map integration not implemented</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Location suggestions are provided by OpenStreetMap
          </p>
        </div>
      )}
    </div>
  )
}
