import { type NextRequest, NextResponse } from "next/server"
import { getPagasaRegions } from "@/lib/pagasa-service"

export async function GET(req: NextRequest) {
  try {
    const regions = await getPagasaRegions()
    return NextResponse.json(regions)
  } catch (error) {
    console.error("Error fetching PAGASA regions:", error)
    return NextResponse.json({ error: "Failed to fetch PAGASA regions" }, { status: 500 })
  }
}
