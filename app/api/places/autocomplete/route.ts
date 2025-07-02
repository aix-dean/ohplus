import { type NextRequest, NextResponse } from "next/server"
import { getPlaceAutocompleteSuggestions } from "@/lib/location-service"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const input = searchParams.get("input")

  if (!input) {
    return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
  }

  try {
    const suggestions = await getPlaceAutocompleteSuggestions(input)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error fetching place autocomplete suggestions:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}
