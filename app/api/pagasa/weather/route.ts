import { type NextRequest, NextResponse } from "next/server"
import { getPagasaWeatherForecast } from "@/lib/pagasa-service"

// Define types for our response
type WeatherResponse = {
  location: string
  date: string
  temperature: {
    current: number | null
    min: number | null
    max: number | null
  }
  humidity: number | null
  windSpeed: number | null
  windDirection: string | null
  condition: string | null
  icon: string
  rainChance: number | null
  alerts: WeatherAlert[]
  forecast: DailyForecast[]
  source: string
  raw?: any
}

type WeatherAlert = {
  type: string
  severity: "low" | "moderate" | "high" | "severe"
  description: string
  issuedAt: string
}

type DailyForecast = {
  date: string
  dayOfWeek: string
  temperature: {
    min: number | null
    max: number | null
  }
  condition: string | null
  icon: string
  rainChance: number | null
}

// Map region IDs to PAGASA region names
const regionMapping: Record<string, string> = {
  NCR: "Metro Manila",
  REGION_I: "Ilocos Region",
  REGION_II: "Cagayan Valley",
  REGION_III: "Central Luzon",
  REGION_IV_A: "CALABARZON",
  REGION_IV_B: "MIMAROPA",
  REGION_V: "Bicol Region",
  REGION_VI: "Western Visayas",
  REGION_VII: "Central Visayas",
  REGION_VIII: "Eastern Visayas",
  REGION_IX: "Zamboanga Peninsula",
  REGION_X: "Northern Mindanao",
  REGION_XI: "Davao Region",
  REGION_XII: "SOCCSKSARGEN",
  REGION_XIII: "Caraga",
  CAR: "Cordillera Administrative Region",
  BARMM: "Bangsamoro Autonomous Region in Muslim Mindanao",
}

// Map weather condition to icon
function getIconFromCondition(condition: string | null): string {
  if (!condition) return "cloud"

  const lowerCondition = condition.toLowerCase()
  if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
    return "cloud-rain"
  } else if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) {
    return "cloud-lightning"
  } else if (lowerCondition.includes("cloud")) {
    return lowerCondition.includes("partly") ? "cloud-sun" : "cloud"
  } else if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) {
    return "sun"
  } else {
    return "cloud"
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const region = searchParams.get("region")

  if (!region) {
    return NextResponse.json({ error: "Region parameter is required" }, { status: 400 })
  }

  try {
    const weatherData = await getPagasaWeatherForecast(region)
    return NextResponse.json(weatherData)
  } catch (error) {
    console.error(`Error fetching PAGASA weather for region ${region}:`, error)
    return NextResponse.json({ error: "Failed to fetch PAGASA weather data" }, { status: 500 })
  }
}
