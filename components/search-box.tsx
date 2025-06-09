"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, X, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { searchProducts, type SearchResult } from "@/lib/algolia-service"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchBoxProps {
  onSearchResults?: (results: SearchResult[], query: string) => void
  onSearchError?: (error: string) => void
  onSearchLoading?: (isLoading: boolean) => void
  onSearchClear?: () => void
  showDropdown?: boolean
  userId?: string
}

export function SearchBox({
  onSearchResults,
  onSearchError,
  onSearchLoading,
  onSearchClear,
  showDropdown = true,
  userId,
}: SearchBoxProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        setIsLoading(false)
        setError(null)

        // Notify parent components
        if (onSearchResults) onSearchResults([], "")
        if (onSearchError) onSearchError("")
        if (onSearchLoading) onSearchLoading(false)
        if (onSearchClear) onSearchClear()
        return
      }

      setIsLoading(true)
      setError(null)

      // Notify parent that search is loading
      if (onSearchLoading) onSearchLoading(true)

      try {
        console.log(`Performing search for: "${debouncedQuery}"${userId ? ` with user filter: ${userId}` : ""}`)
        const response = await searchProducts(debouncedQuery, userId)

        // Check if we got a valid response
        if (response && Array.isArray(response.hits)) {
          setResults(response.hits)
          setIsOpen(response.hits.length > 0 && showDropdown)
          console.log(`Search returned ${response.hits.length} results`)

          // Notify parent components of results
          if (onSearchResults) onSearchResults(response.hits, debouncedQuery)

          // If there's an error but we still got results, show a warning
          if (response.error) {
            setError(response.error)
            if (onSearchError) onSearchError(response.error)
          } else {
            setError(null)
            if (onSearchError) onSearchError("")
          }
        } else {
          console.error("Invalid search response:", response)
          setResults([])
          setError(response.error || "Received invalid search results")

          // Notify parent components
          if (onSearchResults) onSearchResults([], debouncedQuery)
          if (onSearchError) onSearchError(response.error || "Received invalid search results")
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
        setError("Failed to perform search")

        // Notify parent components
        if (onSearchResults) onSearchResults([], debouncedQuery)
        if (onSearchError) onSearchError("Failed to perform search")
      } finally {
        setIsLoading(false)

        // Notify parent that search is no longer loading
        if (onSearchLoading) onSearchLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, showDropdown, userId]) // Include userId in dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (e.target.value.trim()) {
      setIsLoading(true)
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    setError(null)

    // Notify parent components
    onSearchClear?.()
  }

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate details page based on result type
    if (result.type === "product") {
      router.push(`/sales/products/${result.objectID}`)
    } else if (result.type === "client") {
      router.push(`/sales/clients/${result.objectID}`)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products, clients..."
          className="pl-10 pr-10"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 && showDropdown) setIsOpen(true)
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && query && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results dropdown - only show if showDropdown is true */}
      {showDropdown && isOpen && results.length > 0 && (
        <Card className="absolute top-full z-50 mt-1 w-full max-h-[70vh] overflow-auto shadow-lg">
          <div className="p-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{results.length} results</h3>
            <div className="space-y-1">
              {results.map((result) => (
                <div
                  key={result.objectID}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {result.image_url ? (
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={result.image_url || "/placeholder.svg"}
                        alt={result.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/abstract-geometric-sculpture.png"
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{result.type}</span>
                      {result.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{result.location}</span>
                        </>
                      )}
                      {result.price && (
                        <>
                          <span>•</span>
                          <span>${result.price.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* No results message - only show if showDropdown is true */}
      {showDropdown && isOpen && query && !isLoading && results.length === 0 && !error && (
        <Card className="absolute top-full z-50 mt-1 w-full shadow-lg">
          <div className="p-4 text-center text-muted-foreground">No results found for "{query}"</div>
        </Card>
      )}
    </div>
  )
}
