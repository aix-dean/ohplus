import type { PhilippineRegion, WeatherForecast } from "./open-meteo-service"

// Get available regions from our API route
export async function getRegions(): Promise<PhilippineRegion[]> {
  try {
    const response = await fetch("/api/weather/regions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching regions:", error)
    throw error
  }
}

// Get weather forecast for a specific region from our API route
export async function fetchWeatherForecast(regionId = "NCR"): Promise<WeatherForecast> {
  try {
    const response = await fetch(`/api/weather/forecast?region=${regionId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching weather data:", error)
    throw error
  }
}

// Make sure the re-exported types include windSpeed in the DailyForecast
export type { PhilippineRegion, WeatherForecast }
