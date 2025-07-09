import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, from, to, cc, subject, body: emailBody, attachments } = body

    console.log("Processing email send request:", { emailId, from, to, subject })

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("Resend API key not configured, running in demo mode")

      // Demo mode - log email details
      console.log("=== EMAIL DEMO MODE ===")
      console.log("From:", from || "noreply@yourdomain.com")
      console.log("To:", Array.isArray(to) ? to.join(", ") : to)
      if (cc && cc.length > 0) console.log("CC:", Array.isArray(cc) ? cc.join(", ") : cc)
      console.log("Subject:", subject)
      console.log("Body Length:", emailBody.length, "characters")
      console.log("Attachments:", attachments?.length || 0)
      console.log("======================")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({
        success: true,
        messageId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: "demo",
        message: "Email logged in demo mode. Configure RESEND_API_KEY environment variable to send real emails.",
      })
    }

    // Prepare email data for Resend
    const emailData: any = {
      from: from || "OOH Operator <noreply@yourdomain.com>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">OOH Operator</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Professional Report Delivery</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 30px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <div style="white-space: pre-line; line-height: 1.8; font-size: 16px;">
              ${emailBody.replace(/\n/g, "<br>")}
            </div>
          </div>
          
          <!-- Attachments Section -->
          ${
            attachments && attachments.length > 0
              ? `
            <div style="background: #f8fafc; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">📎</span> Attachments
              </h3>
              <div style="space-y: 8px;">
                ${attachments
                  .map(
                    (att: any) => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 16px;">📄</span>
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${att.fileName}</div>
                      <div style="color: #6b7280; font-size: 12px;">${Math.round(att.fileSize / 1024)}KB • PDF Document</div>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This email was sent from the <strong>OOH Operator</strong> platform.
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
              Professional logistics and reporting management system
            </p>
          </div>
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
        content: attachment.content,
        contentType: attachment.contentType || "application/pdf",
      }))
    }

    console.log("Sending email via Resend...")
    console.log("Email data:", {
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject,
      attachmentCount: emailData.attachments?.length || 0,
    })

    // Send email via Resend
    const result = await resend.emails.send(emailData)

    console.log("Resend response:", result)

    if (result.error) {
      console.error("Resend error:", result.error)
      return NextResponse.json(
        {
          error: `Resend error: ${result.error.message}`,
          details: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      emailId,
      mode: "resend",
      message: "Email sent successfully via Resend",
      details: {
        id: result.data?.id,
        from: emailData.from,
        to: emailData.to,
      },
    })
  } catch (error) {
    console.error("Error in send-email API:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorDetails = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: `Failed to send email: ${errorMessage}`,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
