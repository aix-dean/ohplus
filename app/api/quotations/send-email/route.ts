import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quotation,
      clientEmail,
      client,
      currentUserEmail,
      ccEmail,
      subject,
      body: emailBody,
      attachments,
      preGeneratedPDFs,
      uploadedFiles,
    } = body

    console.log("[v0] API: Received send email request")
    console.log("[v0] API: Client email:", clientEmail)
    console.log("[v0] API: Pre-generated PDFs count:", preGeneratedPDFs?.length || 0)
    console.log("[v0] API: Uploaded files count:", uploadedFiles?.length || 0)

    // Prepare email attachments
    const emailAttachments = []

    // Add pre-generated PDFs
    if (preGeneratedPDFs && preGeneratedPDFs.length > 0) {
      for (const pdf of preGeneratedPDFs) {
        emailAttachments.push({
          filename: pdf.filename,
          content: pdf.content,
          type: "application/pdf",
        })
      }
      console.log("[v0] API: Added", preGeneratedPDFs.length, "pre-generated PDFs to attachments")
    }

    // Add uploaded files
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        emailAttachments.push({
          filename: file.filename,
          content: file.content,
          type: file.type || "application/octet-stream",
        })
      }
      console.log("[v0] API: Added", uploadedFiles.length, "uploaded files to attachments")
    }

    console.log("[v0] API: Total attachments:", emailAttachments.length)

    // Prepare recipient list
    const recipients = [clientEmail]
    if (ccEmail && ccEmail.trim()) {
      recipients.push(ccEmail.trim())
    }

    console.log("[v0] API: Recipients:", recipients)

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: currentUserEmail || "noreply@ohplus.aix.ph",
      to: recipients,
      subject: subject,
      html: emailBody.replace(/\n/g, "<br>"),
      attachments: emailAttachments,
    })

    console.log("[v0] API: Email response:", emailResponse)

    if (emailResponse.error) {
      console.error("[v0] API: Resend error:", emailResponse.error)
      return NextResponse.json(
        {
          success: false,
          error: emailResponse.error.message || "Email service error",
          details: emailResponse.error,
        },
        { status: 400 },
      )
    }

    if (emailResponse.data) {
      console.log("[v0] API: Email sent successfully with ID:", emailResponse.data.id)
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        emailId: emailResponse.data.id,
      })
    } else {
      console.error("[v0] API: No data returned from Resend")
      return NextResponse.json(
        {
          success: false,
          error: "Email service did not return confirmation",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] API: Error sending email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    )
  }
}
