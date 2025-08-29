import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData()

    // Extract email data
    const from = "OH Plus <noreply@ohplus.ph>"
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
      return NextResponse.json({ error: error.message }, { status: 400 })
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
