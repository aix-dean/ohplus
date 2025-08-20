import { type NextRequest, NextResponse } from "next/server"
import { createProposalTemplate, getProposalTemplates } from "@/lib/proposal-template-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const templates = await getProposalTemplates(userId || undefined)

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error("Error fetching proposal templates:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch proposal templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json()

    const templateId = await createProposalTemplate(templateData)

    return NextResponse.json({
      success: true,
      data: { id: templateId },
      message: "Proposal template created successfully",
    })
  } catch (error) {
    console.error("Error creating proposal template:", error)
    return NextResponse.json({ success: false, error: "Failed to create proposal template" }, { status: 500 })
  }
}
