import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, cc, subject, body, attachments } = await request.json()

    console.log("API: Sending email to:", to)
    console.log("API: Subject:", subject)
    console.log("API: Attachments:", attachments?.length || 0)

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Recipients are required" }, { status: 400 })
    }

    if (!subject || !body) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
    }

    // Prepare email payload
    const emailPayload: any = {
      from: "OOH Operator <onboarding@resend.dev>", // Use Resend's default domain for testing
      to: to,
      subject: subject,
      html: body.replace(/\n/g, "<br>"),
      text: body,
    }

    // Add CC if exists
    if (cc && Array.isArray(cc) && cc.length > 0) {
      emailPayload.cc = cc
    }

    // Handle attachments (for now, we'll skip file attachments to test basic email sending)
    // In production, you would need to properly handle file uploads and convert them to base64
    if (attachments && attachments.length > 0) {
      console.log("Note: Attachments are currently disabled for testing")
      // emailPayload.attachments = attachments.map(att => ({
      //   filename: att.fileName,
      //   content: att.content // This would need to be base64 or buffer
      // }))
    }

    console.log("API: Sending email with payload:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
    })

    // Send email using Resend
    const result = await resend.emails.send(emailPayload)

    console.log("API: Resend result:", result)

    if (result.error) {
      console.error("API: Resend error:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      id: result.data?.id,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("API: Error sending email:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
