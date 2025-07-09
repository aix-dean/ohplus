import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, from, to, cc, subject, body: emailBody, attachments } = body

    console.log("Sending email:", { emailId, from, to, subject })

    // Validate required fields
    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: from, to, subject, body" }, { status: 400 })
    }

    // Prepare email data
    const emailData: any = {
      from: "noreply@resend.dev", // Use Resend's default domain
      to: Array.isArray(to) ? to : [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${emailBody.replace(/\n/g, "<br>")}
        </div>
      `,
      text: emailBody,
    }

    // Add CC if provided
    if (cc && cc.length > 0) {
      emailData.cc = Array.isArray(cc) ? cc : [cc]
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments.map((attachment: any) => ({
        filename: attachment.fileName,
        content: attachment.fileUrl, // This would need to be base64 content in real implementation
      }))
    }

    console.log("Sending via Resend with data:", {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      attachmentCount: emailData.attachments?.length || 0,
    })

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 500 })
    }

    // Send email via Resend
    const result = await resend.emails.send(emailData)

    console.log("Resend result:", result)

    if (result.error) {
      console.error("Resend error:", result.error)

      // Check for domain verification errors
      if (result.error.message?.includes("domain is not verified")) {
        return NextResponse.json(
          {
            error: "Email domain not verified. Please verify your domain in Resend dashboard.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: `Resend error: ${result.error.message}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      emailId,
    })
  } catch (error) {
    console.error("Error in send-email API:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 })
  }
}
