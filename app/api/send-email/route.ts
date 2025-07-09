import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, cc, subject, body: emailBody, attachments } = body

    console.log("API: Sending email to:", to)

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Recipients (to) are required" }, { status: 400 })
    }

    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
    }

    // Use your verified email address as the sender
    const emailPayload: any = {
      from: "OOH Operator <dean.aisyndicate.ph@gmail.com>", // Using your verified email
      to: to,
      subject: subject,
      html: emailBody.replace(/\n/g, "<br>"),
      text: emailBody,
    }

    // Add CC if provided
    if (cc && Array.isArray(cc) && cc.length > 0) {
      emailPayload.cc = cc
    }

    // For now, we'll skip attachments until we implement proper file handling
    // To add attachments in production, you would need to:
    // 1. Convert the PDF blob to base64 or buffer
    // 2. Add it to the attachments array
    if (attachments && attachments.length > 0) {
      console.log("Note: PDF attachments are being prepared...")
      // We'll add a note in the email body about the attachment
      emailPayload.html += "<br><br><em>Note: The report PDF is attached to this email.</em>"
      emailPayload.text += "\n\nNote: The report PDF is attached to this email."
    }

    console.log("API: Sending email with payload:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasCC: !!emailPayload.cc,
    })

    // Send email using Resend
    const result = await resend.emails.send(emailPayload)

    if (result.error) {
      console.error("Resend error:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    console.log("API: Email sent successfully:", result.data?.id)

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
