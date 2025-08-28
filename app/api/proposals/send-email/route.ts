import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createEmailRecord } from "@/lib/email-record-service"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Proposal email API called")

    // Parse FormData
    const formData = await request.formData()

    // Extract email data
    const from = "noreply@ohplus.ph"
    const toJson = formData.get("to") as string
    const ccJson = formData.get("cc") as string
    const subject = formData.get("subject") as string
    const body = formData.get("body") as string
    const proposalId = formData.get("proposalId") as string

    console.log("[v0] Email data extracted:", { to: toJson, cc: ccJson, subject, proposalId })

    if (!toJson || !subject || !body) {
      console.error("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse JSON strings with error handling
    let to, cc
    try {
      to = JSON.parse(toJson)
      cc = ccJson ? JSON.parse(ccJson) : undefined
    } catch (parseError) {
      console.error("[v0] JSON parsing error:", parseError)
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Process file attachments
    const attachments = []
    let attachmentIndex = 0

    while (true) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      if (!file) break

      console.log("[v0] Processing attachment:", file.name, file.size)

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      attachments.push({
        filename: file.name,
        content: buffer,
      })

      attachmentIndex++
    }

    console.log("[v0] Total attachments processed:", attachments.length)

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

    console.log("[v0] Sending email via Resend...")
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Email sent successfully, creating record...")

    try {
      const attachmentRecords = attachments.map((att) => ({
        fileName: att.filename,
        fileSize: att.content.length,
        fileType: att.filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
      }))

      const recordId = await createEmailRecord({
        from: from,
        to: Array.isArray(to) ? to : [to],
        cc: cc,
        subject: subject,
        body: body,
        email_type: "proposals",
        status: "sent",
        userId: "system",
        proposalId: proposalId,
        attachments: attachmentRecords.length > 0 ? attachmentRecords : undefined,
      })

      console.log("[v0] Email record created successfully:", recordId)

      return NextResponse.json({
        success: true,
        data,
        recordId: recordId,
      })
    } catch (recordError) {
      console.error("[v0] Failed to create email record:", recordError)
      return NextResponse.json({
        success: true,
        data,
        warning: "Email sent but record creation failed",
      })
    }
  } catch (error) {
    console.error("[v0] Send proposal email error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send email"
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 })
  }
}
