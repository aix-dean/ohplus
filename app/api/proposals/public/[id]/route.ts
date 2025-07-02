import { type NextRequest, NextResponse } from "next/server"
import { getProposalById } from "@/lib/proposal-service"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const proposal = await getProposalById(id)

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error fetching public proposal:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
