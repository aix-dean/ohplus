import { NextResponse } from "next/server"
import {
  getRegionById,
  mapWeatherCode,
  mapWeatherCondition,
  degreesToDirection,
  getWeatherAlerts,
  type WeatherForecast,
  type DailyForecast,
} from "@/lib/open-meteo-service"

// Cache to store weather data with timestamps
const weatherCache = new Map<string, { data: WeatherForecast; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get("region") || "NCR"

    // Get region coordinates
    const region = getRegionById(regionId)
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 })
    }

    // Check cache first
    const cacheKey = regionId
    const cachedData = weatherCache.get(cacheKey)
    const now = Date.now()

    // If we have valid cached data, return it
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data)
    }

    // Fetch current weather and hourly forecast from Open-Meteo
    const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=auto`

    const currentWeatherResponse = await fetch(currentWeatherUrl, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!currentWeatherResponse.ok) {
      // Check if it's a rate limit error
      if (currentWeatherResponse.status === 429) {
        console.error("Rate limit exceeded for weather API")

        // If we have stale cached data, return it with a warning
        if (cachedData) {
          const staleData = {
            ...cachedData.data,
            warning: "Using cached data due to rate limiting",
          }
          return NextResponse.json(staleData)
        }

        return NextResponse.json({ error: "Weather API rate limit exceeded. Please try again later." }, { status: 429 })
      }

      throw new Error(`Failed to fetch current weather: ${currentWeatherResponse.status}`)
    }

    // Check content type to ensure it's JSON
    const contentType = currentWeatherResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Unexpected response type: ${contentType}`)
    }

    const weatherData = await currentWeatherResponse.json()

    // Fetch daily forecast from Open-Meteo
    const dailyForecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`

    const dailyForecastResponse = await fetch(dailyForecastUrl, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!dailyForecastResponse.ok) {
      // If we have stale cached data, return it with a warning
      if (cachedData) {
        const staleData = {
          ...cachedData.data,
          warning: "Using cached data due to API error",
        }
        return NextResponse.json(staleData)
      }

      throw new Error(`Failed to fetch daily forecast: ${dailyForecastResponse.status}`)
    }

    // Check content type to ensure it's JSON
    const dailyContentType = dailyForecastResponse.headers.get("content-type")
    if (!dailyContentType || !dailyContentType.includes("application/json")) {
      throw new Error(`Unexpected response type: ${dailyContentType}`)
    }

    const dailyForecastData = await dailyForecastResponse.json()

    // Get weather alerts
    const alerts = await getWeatherAlerts()

    // Process current weather data
    const current = weatherData.current
    const currentWeatherCode = current.weather_code

    // Process daily forecast data
    const forecast: DailyForecast[] = dailyForecastData.daily.time.map((time: string, index: number) => {
      const date = new Date(time)
      return {
        date: time,
        dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
        temperature: {
          min: dailyForecastData.daily.temperature_2m_min[index],
          max: dailyForecastData.daily.temperature_2m_max[index],
        },
        condition: mapWeatherCondition(dailyForecastData.daily.weather_code[index]),
        icon: mapWeatherCode(dailyForecastData.daily.weather_code[index]),
        rainChance: dailyForecastData.daily.precipitation_probability_max[index] || 0,
        humidity: 0, // Not available in daily forecast
        windSpeed: dailyForecastData.daily.wind_speed_10m_max[index],
      }
    })

    // Calculate rain chance for current conditions
    // Use the average of the next 12 hours from hourly data
    let rainChance = 0
    if (weatherData.hourly && weatherData.hourly.precipitation_probability) {
      const next12Hours = weatherData.hourly.precipitation_probability.slice(0, 12)
      rainChance = Math.round(next12Hours.reduce((sum: number, val: number) => sum + val, 0) / next12Hours.length)
    }

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
      source: "Open-Meteo",
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
