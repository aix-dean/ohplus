import { type NextRequest, NextResponse } from "next/server"
import { generateProposalPdf } from "@/lib/pdf-service"
import { getProposalById } from "@/lib/proposal-service"

// Helper function to safely convert to Date
function safeToDate(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue
  }
  if (typeof dateValue === "string" || typeof dateValue === "number") {
    return new Date(dateValue)
  }
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }
  return new Date() // fallback to current date
}

export async function POST(req: NextRequest) {
  try {
    const { proposalId } = await req.json()

    if (!proposalId) {
      return NextResponse.json({ message: "Proposal ID is required" }, { status: 400 })
    }

    const proposal = await getProposalById(proposalId)

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    const pdfBuffer = await generateProposalPdf(proposal)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposal-${proposalId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating proposal PDF:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
