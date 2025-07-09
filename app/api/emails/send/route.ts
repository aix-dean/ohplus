import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json()

    if (!emailId) {
      return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
    }

    // Send the email
    await emailService.sendEmail(emailId)

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Error in send email API:", error)

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
