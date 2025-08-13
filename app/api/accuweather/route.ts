import { NextResponse } from "next/server"
import { getPhilippinesWeatherData, PHILIPPINES_LOCATIONS } from "@/lib/accuweather-service"

// Cache to store weather data with timestamps
const weatherCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationKey = searchParams.get("location") || "264885" // Default to Manila

    // Validate location key
    const validLocation = PHILIPPINES_LOCATIONS.find((loc) => loc.key === locationKey)
    if (!validLocation) {
      return NextResponse.json({ error: "Invalid location key" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = locationKey
    const cachedData = weatherCache.get(cacheKey)
    const now = Date.now()

    // If we have valid cached data, return it
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data)
    }

    // Fetch fresh data from AccuWeather
    const weatherData = await getPhilippinesWeatherData(locationKey)

    // Store in cache
    weatherCache.set(cacheKey, { data: weatherData, timestamp: now })

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Error in AccuWeather API route:", error)

    let errorMessage = "Failed to fetch weather data"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("AccuWeather API error")) {
        errorMessage = "Weather service temporarily unavailable"
        statusCode = 503
      }
    }

    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : "Unknown error" },
      { status: statusCode },
    )
  }
}
