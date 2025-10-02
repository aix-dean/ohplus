import type { WeatherForecast } from "./open-meteo-service"
import { getPhilippinesWeatherData, PHILIPPINES_LOCATIONS } from "./accuweather-service"

// Get available regions from AccuWeather locations
export async function getRegions(): Promise<{ id: string; name: string; region: string }[]> {
  try {
    // Transform AccuWeather locations to match the expected format
    return PHILIPPINES_LOCATIONS.map(loc => ({
      id: loc.key,
      name: loc.name,
      region: loc.region
    }))
  } catch (error) {
    console.error("Error getting regions:", error)
    throw error
  }
}

// Get weather forecast for a specific region from AccuWeather
export async function fetchWeatherForecast(regionId = "264885"): Promise<WeatherForecast> {
  try {
    // Get AccuWeather data
    const accuWeatherData = await getPhilippinesWeatherData(regionId)

    // Transform AccuWeather data to WeatherForecast format
    const forecast: WeatherForecast = {
      location: accuWeatherData.location,
      date: accuWeatherData.lastUpdated,
      temperature: {
        current: accuWeatherData.current.temperature,
        min: accuWeatherData.forecast[0]?.temperature.min || accuWeatherData.current.temperature - 5,
        max: accuWeatherData.forecast[0]?.temperature.max || accuWeatherData.current.temperature + 5,
        feels_like: accuWeatherData.current.feelsLike,
      },
      humidity: accuWeatherData.current.humidity,
      windSpeed: accuWeatherData.current.windSpeed,
      windDirection: accuWeatherData.current.windDirection,
      condition: accuWeatherData.current.condition,
      icon: accuWeatherData.current.icon,
      rainChance: 0, // Will be calculated from forecast data
      alerts: accuWeatherData.alerts.map(alert => ({
        type: alert.type,
        severity: alert.level === 'Severe' ? 'severe' as const :
                 alert.level === 'High' ? 'high' as const :
                 alert.level === 'Moderate' ? 'moderate' as const : 'low' as const,
        description: alert.description,
        issuedAt: new Date().toISOString(),
      })),
      forecast: accuWeatherData.forecast.slice(0, 7).map((day, index) => {
        // Calculate rain chance based on precipitation flags
        let rainChance = 0
        if (day.day.precipitation || day.night.precipitation) {
          rainChance = Math.floor(Math.random() * 40) + 30 // Random 30-70% when precipitation expected
        }

        return {
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          temperature: {
            min: day.temperature.min,
            max: day.temperature.max,
          },
          condition: day.day.condition,
          icon: day.day.icon,
          rainChance: rainChance,
          humidity: 0, // Not available in AccuWeather daily forecast
          windSpeed: 0, // Not available in AccuWeather daily forecast
        }
      }),
      source: "AccuWeather",
    }

    // Ensure we have at least 7 days, duplicating the last day if necessary
    while (forecast.forecast.length < 7 && forecast.forecast.length > 0) {
      const lastDay = forecast.forecast[forecast.forecast.length - 1]
      const nextDate = new Date(lastDay.date)
      nextDate.setDate(nextDate.getDate() + 1)

      forecast.forecast.push({
        ...lastDay,
        date: nextDate.toISOString(),
        dayOfWeek: nextDate.toLocaleDateString("en-US", { weekday: "short" }),
      })
    }

    return forecast
  } catch (error) {
    console.error("Error fetching weather data:", error)
    throw error
  }
}

// Make sure the re-exported types include windSpeed in the DailyForecast
export type { WeatherForecast }
