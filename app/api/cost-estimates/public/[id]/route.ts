import { type NextRequest, NextResponse } from "next/server"
import { getCostEstimateById } from "@/lib/cost-estimate-service"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const costEstimate = await getCostEstimateById(id)

    if (!costEstimate) {
      return NextResponse.json({ message: "Cost estimate not found" }, { status: 404 })
    }

    return NextResponse.json(costEstimate)
  } catch (error) {
    console.error("Error fetching public cost estimate:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
