import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Email configuration - you'll need to set these environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, from, to, cc, subject, body: emailBody, attachments } = body

    console.log("Processing email send request:", { emailId, from, to, subject })

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    // Check if SMTP is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.log("SMTP not configured, running in demo mode")

      // Demo mode - log email details
      console.log("=== EMAIL DEMO MODE ===")
      console.log("From:", from || EMAIL_CONFIG.auth.user)
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
        message:
          "Email logged in demo mode. Configure SMTP_USER and SMTP_PASS environment variables to send real emails.",
      })
    }

    // Create transporter
    console.log("Creating nodemailer transporter...")
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    // Verify connection
    console.log("Verifying SMTP connection...")
    try {
      await transporter.verify()
      console.log("SMTP connection verified successfully")
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError)
      return NextResponse.json(
        {
          error: "SMTP configuration error",
          details: verifyError instanceof Error ? verifyError.message : "Unknown SMTP error",
        },
        { status: 500 },
      )
    }

    // Prepare email data
    const mailOptions: any = {
      from: from || EMAIL_CONFIG.auth.user,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0;">OOH Operator</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Professional Report Delivery</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${emailBody.replace(/\n/g, "<br>")}
          </div>
          
          ${
            attachments && attachments.length > 0
              ? `
            <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">📎 Attachments</h3>
              ${attachments
                .map(
                  (att: any) => `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                  <span style="color: #2563eb;">${att.fileName}</span>
                  <span style="color: #9ca3af; font-size: 12px;">(${Math.round(att.fileSize / 1024)}KB)</span>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              This email was sent from the OOH Operator platform.
            </p>
          </div>
        </div>
      `,
      text: emailBody,
    }

    // Add CC if provided
    if (cc && cc.length > 0) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((attachment: any) => ({
        filename: attachment.fileName,
        content: attachment.content,
        contentType: attachment.contentType,
      }))
    }

    console.log("Sending email via nodemailer...")
    console.log("Mail options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      attachmentCount: mailOptions.attachments?.length || 0,
    })

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log("Email sent successfully:", info.messageId)
    console.log("Response:", info.response)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      emailId,
      mode: "smtp",
      message: "Email sent successfully via SMTP",
      details: {
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
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
