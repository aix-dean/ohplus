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

    // Parse JSON strings
    const to = JSON.parse(toJson)
    const cc = ccJson ? JSON.parse(ccJson) : undefined

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

    // Create email record with correct email_type for proposals
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
        email_type: "proposals", // Set correct email type for proposals
        status: "sent",
        userId: "system", // Could be enhanced to get actual user ID
        proposalId: proposalId, // Include proposal ID for proper categorization
        attachments: attachmentRecords.length > 0 ? attachmentRecords : undefined,
      })

      console.log("[v0] Email record created successfully:", recordId)
    } catch (recordError) {
      console.error("[v0] Failed to create email record:", recordError)
      // Don't fail the API call if record creation fails
    }

    console.log("[v0] Proposal email process completed successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Send proposal email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
