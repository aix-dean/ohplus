// AccuWeather API service for Philippines weather data
export interface AccuWeatherLocation {
  Key: string
  LocalizedName: string
  Country: { LocalizedName: string }
  AdministrativeArea: { LocalizedName: string }
}

export interface AccuWeatherCurrent {
  LocalObservationDateTime: string
  EpochTime: number
  WeatherText: string
  WeatherIcon: number
  HasPrecipitation: boolean
  PrecipitationType?: string
  IsDayTime: boolean
  Temperature: {
    Metric: { Value: number; Unit: string }
  }
  RealFeelTemperature: {
    Metric: { Value: number; Unit: string }
  }
  RelativeHumidity: number
  Wind: {
    Speed: { Metric: { Value: number; Unit: string } }
    Direction: { Degrees: number; Localized: string }
  }
  UVIndex: number
  UVIndexText: string
  Visibility: {
    Metric: { Value: number; Unit: string }
  }
  CloudCover: number
}

export interface AccuWeatherForecast {
  Date: string
  EpochDate: number
  Temperature: {
    Minimum: { Value: number; Unit: string }
    Maximum: { Value: number; Unit: string }
  }
  Day: {
    Icon: number
    IconPhrase: string
    HasPrecipitation: boolean
    PrecipitationType?: string
    PrecipitationIntensity?: string
  }
  Night: {
    Icon: number
    IconPhrase: string
    HasPrecipitation: boolean
    PrecipitationType?: string
    PrecipitationIntensity?: string
  }
}

export interface AccuWeatherAlert {
  AlertID: number
  Area: { Name: string }
  Category: string
  Classification: string
  Level: string
  Priority: number
  Type: string
  TypeID: number
  Description: { Localized: string }
  Source: string
  SourceId: number
}

export interface PhilippinesWeatherData {
  location: string
  locationKey: string
  current: {
    temperature: number
    feelsLike: number
    condition: string
    icon: string
    humidity: number
    windSpeed: number
    windDirection: string
    uvIndex: number
    visibility: number
    cloudCover: number
    isDayTime: boolean
    lastUpdated: string
  }
  forecast: Array<{
    date: string
    dayOfWeek: string
    temperature: { min: number; max: number }
    day: { condition: string; icon: string; precipitation: boolean }
    night: { condition: string; icon: string; precipitation: boolean }
  }>
  alerts: Array<{
    id: number
    type: string
    category: string
    level: string
    priority: number
    description: string
    area: string
  }>
  lastUpdated: string
}

// Philippines major cities with AccuWeather location keys
export const PHILIPPINES_LOCATIONS = [
  { key: "264885", name: "Manila", region: "NCR" },
  { key: "264886", name: "Quezon City", region: "NCR" },
  { key: "264308", name: "Cebu City", region: "Central Visayas" },
  { key: "264312", name: "Davao City", region: "Davao Region" },
  { key: "264870", name: "Iloilo City", region: "Western Visayas" },
  { key: "264873", name: "Bacolod", region: "Western Visayas" },
  { key: "264874", name: "Cagayan de Oro", region: "Northern Mindanao" },
  { key: "264875", name: "Zamboanga City", region: "Zamboanga Peninsula" },
  { key: "264876", name: "Baguio", region: "Cordillera Administrative Region" },
  { key: "264877", name: "Tacloban", region: "Eastern Visayas" },
]

const ACCUWEATHER_API_KEY = "Q8kh0FSLbDrTBY9SHnr2m69v1mrFv4GR"
const BASE_URL = "http://dataservice.accuweather.com"

// Map AccuWeather icons to our icon system
function mapAccuWeatherIcon(iconNumber: number): string {
  const iconMap: { [key: number]: string } = {
    1: "sun", // Sunny
    2: "cloud-sun", // Mostly Sunny
    3: "cloud-sun", // Partly Sunny
    4: "cloud", // Intermittent Clouds
    5: "cloud", // Hazy Sunshine
    6: "cloud", // Mostly Cloudy
    7: "cloud", // Cloudy
    8: "cloud", // Dreary (Overcast)
    11: "cloud-fog", // Fog
    12: "cloud-rain", // Showers
    13: "cloud-rain", // Mostly Cloudy w/ Showers
    14: "cloud-rain", // Partly Sunny w/ Showers
    15: "cloud-lightning", // T-Storms
    16: "cloud-lightning", // Mostly Cloudy w/ T-Storms
    17: "cloud-lightning", // Partly Sunny w/ T-Storms
    18: "cloud-rain", // Rain
    19: "cloud-snow", // Flurries
    20: "cloud-snow", // Mostly Cloudy w/ Flurries
    21: "cloud-snow", // Partly Sunny w/ Flurries
    22: "cloud-snow", // Snow
    23: "cloud-snow", // Mostly Cloudy w/ Snow
    24: "cloud-snow", // Ice
    25: "cloud-snow", // Sleet
    26: "cloud-rain", // Freezing Rain
    29: "cloud-rain", // Rain and Snow
    30: "sun", // Hot
    31: "sun", // Cold
    32: "wind", // Windy
    33: "sun", // Clear (Night)
    34: "cloud-sun", // Mostly Clear (Night)
    35: "cloud-sun", // Partly Cloudy (Night)
    36: "cloud", // Intermittent Clouds (Night)
    37: "cloud", // Hazy Moonlight (Night)
    38: "cloud", // Mostly Cloudy (Night)
    39: "cloud-rain", // Partly Cloudy w/ Showers (Night)
    40: "cloud-rain", // Mostly Cloudy w/ Showers (Night)
    41: "cloud-lightning", // Partly Cloudy w/ T-Storms (Night)
    42: "cloud-lightning", // Mostly Cloudy w/ T-Storms (Night)
    43: "cloud-snow", // Mostly Cloudy w/ Flurries (Night)
    44: "cloud-snow", // Mostly Cloudy w/ Snow (Night)
  }

  return iconMap[iconNumber] || "cloud"
}

// Helper function to handle API responses
async function handleAccuWeatherResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type")

  if (!response.ok) {
    let errorMessage = `AccuWeather API error: ${response.status}`

    try {
      if (contentType?.includes("application/json")) {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } else {
        const textResponse = await response.text()
        console.error("AccuWeather API non-JSON response:", textResponse)

        // Check for common error messages
        if (textResponse.includes("Invalid")) {
          errorMessage = "Invalid API key or request parameters"
        } else if (textResponse.includes("rate limit") || textResponse.includes("quota")) {
          errorMessage = "API rate limit exceeded"
        } else if (textResponse.includes("not found")) {
          errorMessage = "Location not found"
        }
      }
    } catch (parseError) {
      console.error("Error parsing AccuWeather response:", parseError)
    }

    throw new Error(errorMessage)
  }

  if (!contentType?.includes("application/json")) {
    const textResponse = await response.text()
    console.error("AccuWeather API returned non-JSON:", textResponse)
    throw new Error("AccuWeather API returned invalid response format")
  }

  return response.json()
}

// Get current weather conditions for a location
export async function getCurrentWeather(locationKey: string): Promise<AccuWeatherCurrent[]> {
  const url = `${BASE_URL}/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`

  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    return await handleAccuWeatherResponse(response)
  } catch (error) {
    console.error(`Error fetching current weather for ${locationKey}:`, error)
    throw error
  }
}

// Get 5-day weather forecast for a location
export async function getFiveDayForecast(locationKey: string): Promise<{ DailyForecasts: AccuWeatherForecast[] }> {
  const url = `${BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true&metric=true`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    return await handleAccuWeatherResponse(response)
  } catch (error) {
    console.error(`Error fetching forecast for ${locationKey}:`, error)
    throw error
  }
}

// Get weather alerts for Philippines
export async function getWeatherAlerts(): Promise<AccuWeatherAlert[]> {
  // AccuWeather alerts endpoint for Philippines (country code: PH)
  const url = `${BASE_URL}/alerts/v1/PH?apikey=${ACCUWEATHER_API_KEY}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!response.ok) {
      console.warn(`AccuWeather alerts API error: ${response.status}`)
      return []
    }

    return await handleAccuWeatherResponse(response)
  } catch (error) {
    console.warn("Failed to fetch weather alerts:", error)
    return []
  }
}

// Get comprehensive weather data for a Philippines location
export async function getPhilippinesWeatherData(locationKey = "264885"): Promise<PhilippinesWeatherData> {
  try {
    // Get location info
    const location = PHILIPPINES_LOCATIONS.find((loc) => loc.key === locationKey) || PHILIPPINES_LOCATIONS[0]

    const fallbackData: PhilippinesWeatherData = {
      location: location.name,
      locationKey,
      current: {
        temperature: 28,
        feelsLike: 32,
        condition: "Weather data temporarily unavailable",
        icon: "cloud",
        humidity: 75,
        windSpeed: 10,
        windDirection: "E",
        uvIndex: 6,
        visibility: 10,
        cloudCover: 50,
        isDayTime: true,
        lastUpdated: new Date().toISOString(),
      },
      forecast: Array.from({ length: 5 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i)
        return {
          date: date.toISOString(),
          dayOfWeek: date.toLocaleDateString("en-US", { weekday: "long" }),
          temperature: { min: 24, max: 32 },
          day: { condition: "Partly Cloudy", icon: "cloud-sun", precipitation: false },
          night: { condition: "Clear", icon: "moon", precipitation: false },
        }
      }),
      alerts: [],
      lastUpdated: new Date().toISOString(),
    }

    try {
      // Fetch current weather and forecast in parallel
      const [currentWeather, forecast] = await Promise.all([
        getCurrentWeather(locationKey),
        getFiveDayForecast(locationKey),
      ])

      // Try to get alerts separately (non-blocking)
      let alerts: AccuWeatherAlert[] = []
      try {
        alerts = await getWeatherAlerts()
      } catch (alertError) {
        console.warn("Failed to fetch alerts, continuing without them:", alertError)
      }

      const current = currentWeather[0]

      // Process forecast data
      const processedForecast = forecast.DailyForecasts.map((day) => {
        const date = new Date(day.Date)
        return {
          date: day.Date,
          dayOfWeek: date.toLocaleDateString("en-US", { weekday: "long" }),
          temperature: {
            min: Math.round(day.Temperature.Minimum.Value),
            max: Math.round(day.Temperature.Maximum.Value),
          },
          day: {
            condition: day.Day.IconPhrase,
            icon: mapAccuWeatherIcon(day.Day.Icon),
            precipitation: day.Day.HasPrecipitation,
          },
          night: {
            condition: day.Night.IconPhrase,
            icon: mapAccuWeatherIcon(day.Night.Icon),
            precipitation: day.Night.HasPrecipitation,
          },
        }
      })

      // Process alerts
      const processedAlerts = alerts.map((alert) => ({
        id: alert.AlertID,
        type: alert.Type,
        category: alert.Category,
        level: alert.Level,
        priority: alert.Priority,
        description: alert.Description.Localized,
        area: alert.Area.Name,
      }))

      return {
        location: location.name,
        locationKey,
        current: {
          temperature: Math.round(current.Temperature.Metric.Value),
          feelsLike: Math.round(current.RealFeelTemperature.Metric.Value),
          condition: current.WeatherText,
          icon: mapAccuWeatherIcon(current.WeatherIcon),
          humidity: current.RelativeHumidity,
          windSpeed: Math.round(current.Wind.Speed.Metric.Value),
          windDirection: current.Wind.Direction.Localized,
          uvIndex: current.UVIndex,
          visibility: current.Visibility.Metric.Value,
          cloudCover: current.CloudCover,
          isDayTime: current.IsDayTime,
          lastUpdated: current.LocalObservationDateTime,
        },
        forecast: processedForecast,
        alerts: processedAlerts,
        lastUpdated: new Date().toISOString(),
      }
    } catch (apiError) {
      console.error("AccuWeather API failed, returning fallback data:", apiError)

      return {
        ...fallbackData,
        current: {
          ...fallbackData.current,
          condition: `Weather service unavailable (${apiError instanceof Error ? apiError.message : "Unknown error"})`,
        },
      }
    }
  } catch (error) {
    console.error("Error in getPhilippinesWeatherData:", error)
    throw error
  }
}
