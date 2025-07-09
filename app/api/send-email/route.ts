import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, from, to, cc, subject, body: emailBody, attachments } = body

    console.log("Processing email send request:", { emailId, from, to, subject })

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    // Create transporter using Gmail SMTP
    // You can also use other email providers like Outlook, Yahoo, etc.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com", // Your Gmail address
        pass: process.env.EMAIL_PASS || "your-app-password", // Your Gmail app password
      },
    })

    // Alternative SMTP configuration for other providers:
    /*
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // or your SMTP host
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
    */

    // Prepare email data
    const emailData: any = {
      from: process.env.EMAIL_USER || "your-email@gmail.com", // Use your email as sender
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">OOH Operator</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Out-of-Home Advertising Platform</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="white-space: pre-wrap; line-height: 1.6;">
${emailBody}
            </div>
          </div>
          
          ${
            attachments && attachments.length > 0
              ? `
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">📎 Attachments:</h3>
            ${attachments
              .map(
                (att: any) => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">
              <span style="color: #2563eb;">📄</span>
              <span style="color: #374151; font-weight: 500;">${att.fileName}</span>
              <span style="color: #6b7280; font-size: 12px;">(${Math.round(att.fileSize / 1024)}KB)</span>
            </div>
          `,
              )
              .join("")}
          </div>
        `
              : ""
          }
          
          <div style="background: #f3f4f6; padding: 15px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              This email was sent from OOH Operator Platform
            </p>
          </div>
        </div>
      `,
      text: emailBody,
    }

    // Add CC if provided
    if (cc && cc.length > 0) {
      emailData.cc = Array.isArray(cc) ? cc.join(", ") : cc
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments.map((attachment: any) => {
        // Convert base64 data URL to buffer if it's a data URL
        if (attachment.content && attachment.content.startsWith("data:")) {
          const base64Data = attachment.content.split(",")[1]
          return {
            filename: attachment.fileName,
            content: Buffer.from(base64Data, "base64"),
            contentType: attachment.fileType,
          }
        }

        // If it's already a buffer or string
        return {
          filename: attachment.fileName,
          content: attachment.content || attachment.fileUrl,
          contentType: attachment.fileType,
        }
      })
    }

    console.log("Sending email with nodemailer:", {
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject,
      attachmentCount: emailData.attachments?.length || 0,
    })

    // Send email
    const result = await transporter.sendMail(emailData)

    console.log("Email sent successfully:", {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      emailId,
      message: "Email sent successfully",
      details: {
        to: emailData.to,
        cc: emailData.cc,
        subject: emailData.subject,
        attachmentCount: emailData.attachments?.length || 0,
        accepted: result.accepted,
        rejected: result.rejected,
      },
    })
  } catch (error) {
    console.error("Error sending email:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: `Failed to send email: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
