import { type NextRequest, NextResponse } from "next/server"
import {
  getProposalTemplateById,
  updateProposalTemplate,
  deleteProposalTemplate,
} from "@/lib/proposal-template-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await getProposalTemplateById(params.id)

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error("Error fetching proposal template:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch proposal template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateData = await request.json()

    await updateProposalTemplate(params.id, templateData)

    return NextResponse.json({
      success: true,
      message: "Proposal template updated successfully",
    })
  } catch (error) {
    console.error("Error updating proposal template:", error)
    return NextResponse.json({ success: false, error: "Failed to update proposal template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteProposalTemplate(params.id)

    return NextResponse.json({
      success: true,
      message: "Proposal template deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting proposal template:", error)
    return NextResponse.json({ success: false, error: "Failed to delete proposal template" }, { status: 500 })
  }
}
