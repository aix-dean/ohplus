import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { emailLoggingService } from "@/lib/email-logging-service"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData()

    // Extract email data
    const from = "noreply@ohplus.ph" // Changed from email address
    const toJson = formData.get("to") as string
    const ccJson = formData.get("cc") as string
    const subject = formData.get("subject") as string
    const body = formData.get("body") as string

    // Parse JSON strings
    const to = JSON.parse(toJson)
    const cc = ccJson ? JSON.parse(ccJson) : undefined

    // Process file attachments
    const attachments = []
    let attachmentIndex = 0

    while (true) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      if (!file) break

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      attachments.push({
        filename: file.name,
        content: buffer,
      })

      attachmentIndex++
    }

    // Send email using Resend
    const emailData: any = {
      from,
      to,
      subject,
      html: body.replace(/\n/g, "<br>"),
    }

    if (cc && cc.length > 0) {
      emailData.cc = cc
    }

    if (attachments.length > 0) {
      emailData.attachments = attachments
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("Resend error:", error)

      try {
        await emailLoggingService.logEmail({
          from: from,
          to: to,
          cc: cc,
          subject: subject,
          body: body,
          userId: "system", // You may want to pass actual user ID from request
          email_type: "report", // Default to report for general email API
          attachments: attachments.map((att) => ({
            fileName: att.filename,
            fileSize: att.content.length,
            fileType: "application/octet-stream", // Default type
            fileUrl: "", // Not available for uploaded files
          })),
          status: "failed",
        })
      } catch (logError) {
        console.error("Failed to log failed email:", logError)
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    try {
      await emailLoggingService.logEmail({
        from: from,
        to: to,
        cc: cc,
        subject: subject,
        body: body,
        userId: "system", // You may want to pass actual user ID from request
        email_type: "report", // Default to report for general email API
        attachments: attachments.map((att) => ({
          fileName: att.filename,
          fileSize: att.content.length,
          fileType: "application/octet-stream", // Default type
          fileUrl: "", // Not available for uploaded files
        })),
        status: "sent",
      })
    } catch (logError) {
      console.error("Failed to log successful email:", logError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Send email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
