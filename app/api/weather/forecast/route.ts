import { type NextRequest, NextResponse } from "next/server"
import {
  getRegionById,
  mapWeatherCode,
  mapWeatherCondition,
  degreesToDirection,
  getWeatherAlerts,
  type WeatherForecast,
  type DailyForecast,
  getOpenMeteoForecast,
  getOpenWeatherForecast,
} from "@/lib/open-meteo-service"

// Cache to store weather data with timestamps
const weatherCache = new Map<string, { data: WeatherForecast; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const provider = searchParams.get("provider") || "open-meteo" // Default to Open-Meteo
  const regionId = searchParams.get("region") || "NCR"

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    let forecastData
    if (provider === "open-meteo") {
      forecastData = await getOpenMeteoForecast(Number.parseFloat(lat), Number.parseFloat(lon))
    } else if (provider === "openweather") {
      forecastData = await getOpenWeatherForecast(Number.parseFloat(lat), Number.parseFloat(lon))
    } else {
      return NextResponse.json({ error: "Invalid weather provider" }, { status: 400 })
    }

    // Get region coordinates
    const region = getRegionById(regionId)
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 })
    }

    // Check cache first
    const cacheKey = `${regionId}-${provider}`
    const cachedData = weatherCache.get(cacheKey)
    const now = Date.now()

    // If we have valid cached data, return it
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data)
    }

    // Process current weather data
    const current = forecastData.current
    const currentWeatherCode = current.weather_code

    // Process daily forecast data
    const forecast: DailyForecast[] = forecastData.daily.time.map((time: string, index: number) => {
      const date = new Date(time)
      return {
        date: time,
        dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
        temperature: {
          min: forecastData.daily.temperature_2m_min[index],
          max: forecastData.daily.temperature_2m_max[index],
        },
        condition: mapWeatherCondition(forecastData.daily.weather_code[index]),
        icon: mapWeatherCode(forecastData.daily.weather_code[index]),
        rainChance: forecastData.daily.precipitation_probability_max[index] || 0,
        humidity: 0, // Not available in daily forecast
        windSpeed: forecastData.daily.wind_speed_10m_max[index],
      }
    })

    // Calculate rain chance for current conditions
    // Use the average of the next 12 hours from hourly data
    let rainChance = 0
    if (forecastData.hourly && forecastData.hourly.precipitation_probability) {
      const next12Hours = forecastData.hourly.precipitation_probability.slice(0, 12)
      rainChance = Math.round(next12Hours.reduce((sum: number, val: number) => sum + val, 0) / next12Hours.length)
    }

    // Get weather alerts
    const alerts = await getWeatherAlerts()

    // Build the complete weather forecast object
    const weatherForecast: WeatherForecast = {
      location: region.name,
      date: new Date().toISOString(),
      temperature: {
        current: current.temperature,
        min: forecast[0].temperature.min,
        max: forecast[0].temperature.max,
        feels_like: current.apparent_temperature,
      },
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: degreesToDirection(current.wind_direction_10m),
      condition: mapWeatherCondition(currentWeatherCode),
      icon: mapWeatherCode(currentWeatherCode),
      rainChance: rainChance,
      alerts,
      forecast: forecast.slice(0, 7), // Limit to 7 days
      source: provider,
    }

    // Store in cache
    weatherCache.set(cacheKey, { data: weatherForecast, timestamp: now })

    return NextResponse.json(weatherForecast)
  } catch (error) {
    console.error("Error fetching weather data:", error)

    // Try to return a more helpful error message
    let errorMessage = "Failed to fetch weather data"
    let details = "Unknown error"

    if (error instanceof Error) {
      details = error.message

      // Check for common error patterns
      if (error.message.includes("Too Many")) {
        errorMessage = "Weather API rate limit exceeded"
        details = "The weather service is currently experiencing high traffic. Please try again later."
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error while fetching weather data"
      } else if (error.message.includes("JSON")) {
        errorMessage = "Invalid response from weather service"
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details,
      },
      { status: 500 },
    )
  }
}
