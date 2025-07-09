import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, from, to, cc, subject, body: emailBody, attachments } = body

    console.log("Sending email:", { emailId, from, to, subject })

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    // Create transporter using Gmail SMTP
    // You can also use other SMTP providers like Outlook, Yahoo, etc.
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password (not regular password)
      },
    })

    // Alternative SMTP configuration for other providers:
    /*
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
    */

    // Prepare email options
    const mailOptions: any = {
      from: `"OOH Operator" <${process.env.GMAIL_USER}>`, // sender address
      to: Array.isArray(to) ? to.join(", ") : to, // list of receivers
      subject: subject, // Subject line
      text: emailBody, // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0;">OOH Operator</h2>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${emailBody.replace(/\n/g, "<br>")}
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This email was sent from OOH Operator platform.</p>
          </div>
        </div>
      `, // html body
    }

    // Add CC if provided
    if (cc && cc.length > 0) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = []

      for (const attachment of attachments) {
        try {
          // If attachment has a blob URL, we need to fetch the content
          if (attachment.fileUrl && attachment.fileUrl.startsWith("blob:")) {
            // For blob URLs, we'll add a note in the email instead
            mailOptions.html += `<br><br><em>Note: ${attachment.fileName} was prepared for this email.</em>`
          } else if (attachment.content) {
            // If we have direct content (base64 or buffer)
            mailOptions.attachments.push({
              filename: attachment.fileName,
              content: attachment.content,
              contentType: attachment.fileType,
            })
          }
        } catch (attachError) {
          console.error("Error processing attachment:", attachError)
          // Continue without this attachment
        }
      }
    }

    console.log("Sending email with nodemailer:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentCount: mailOptions.attachments?.length || 0,
    })

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log("Email sent successfully:", info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      emailId,
      response: info.response,
    })
  } catch (error) {
    console.error("Error in send-email API:", error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Provide more specific error messages
    if (errorMessage.includes("Invalid login")) {
      errorMessage = "Invalid email credentials. Please check GMAIL_USER and GMAIL_APP_PASSWORD environment variables."
    } else if (errorMessage.includes("self signed certificate")) {
      errorMessage = "SSL certificate error. Try using a different SMTP configuration."
    }

    return NextResponse.json(
      {
        error: `Failed to send email: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
