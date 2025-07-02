import { type NextRequest, NextResponse } from "next/server"
import { updateQuotationStatus } from "@/lib/quotation-service"

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields: id and status" }, { status: 400 })
    }

    const updatedQuotation = await updateQuotationStatus(id, status)

    if (!updatedQuotation) {
      return NextResponse.json({ message: "Quotation not found or status not updated" }, { status: 404 })
    }

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error("Error updating quotation status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
