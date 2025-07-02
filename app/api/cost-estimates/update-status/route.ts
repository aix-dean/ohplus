import { type NextRequest, NextResponse } from "next/server"
import { updateCostEstimateStatus } from "@/lib/cost-estimate-service"

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields: id and status" }, { status: 400 })
    }

    const updatedCostEstimate = await updateCostEstimateStatus(id, status)

    if (!updatedCostEstimate) {
      return NextResponse.json({ message: "Cost estimate not found or status not updated" }, { status: 404 })
    }

    return NextResponse.json(updatedCostEstimate)
  } catch (error) {
    console.error("Error updating cost estimate status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
