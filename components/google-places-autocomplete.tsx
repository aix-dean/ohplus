"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"

interface Prediction {
  place_id: string
  description: string
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  required?: boolean
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  className,
  placeholder = "Enter an address",
  required = false,
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange(value)

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (value.length > 2) {
      // Debounce the API call to avoid too many requests
      setLoading(true)
      debounceTimerRef.current = setTimeout(() => {
        fetchPredictions(value)
      }, 300)
    } else {
      setPredictions([])
      setShowPredictions(false)
      setLoading(false)
    }
  }

  // Fetch predictions from our server API
  const fetchPredictions = async (input: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data = await response.json()

      if (data.predictions) {
        setPredictions(data.predictions)
        setShowPredictions(true)
      } else {
        setPredictions([])
        setShowPredictions(false)

        // Log error if present but don't show to user
        if (data.error_message) {
          console.warn("Places API warning:", data.error_message)
        }
      }
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setPredictions([])
      setShowPredictions(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle prediction selection
  const handlePredictionClick = (prediction: Prediction) => {
    onChange(prediction.description)
    setPredictions([])
    setShowPredictions(false)
  }

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowPredictions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative" ref={inputRef}>
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handlePredictionClick(prediction)}
            >
              {prediction.description}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
