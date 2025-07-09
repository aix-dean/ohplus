import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("Invitation email API route called")

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not found in environment variables")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    console.log("Request body received:", {
      hasCode: !!body.code,
      hasRecipientEmail: !!body.recipientEmail,
      hasSenderName: !!body.senderName,
      hasCompanyName: !!body.companyName,
    })

    const { code, recipientEmail, senderName, companyName } = body

    if (!code || !recipientEmail) {
      console.error("Missing required fields:", { code: !!code, recipientEmail: !!recipientEmail })
      return NextResponse.json({ error: "Missing invitation code or recipient email address" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      console.error("Invalid email format:", recipientEmail)
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 })
    }

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${code}`

    console.log("Generated registration URL:", registrationUrl)

    const emailSubject = `Invitation to join ${companyName || "our organization"} - OH Plus`
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Organization Invitation</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
          }
          .invitation-details {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
          .code-display {
            background: #1f2937;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 20px 0;
          }
          .action-button {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-1px);
          }
          .alternative-method {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            color: #1e40af;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .contact-info {
            background: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>OH Plus</h1>
            <p>Organization Invitation</p>
          </div>

          <div class="content">
            <div class="greeting">
              Hello!
            </div>

            <p>${senderName ? `${senderName} has` : "You have been"} invited you to join <strong>${companyName || "our organization"}</strong> on OH Plus.</p>

            <div class="invitation-details">
              <h3 style="margin-top: 0; color: #1f2937;">Your Invitation Code</h3>
              <div class="code-display">${code}</div>
              <p style="margin-bottom: 0; text-align: center; color: #6b7280;">Use this code when registering your account</p>
            </div>

            <div class="action-button">
              <a href="${registrationUrl}" class="btn">Join Organization</a>
            </div>

            <div class="alternative-method">
              <strong>Alternative Method:</strong><br>
              If the button above doesn't work, you can manually register at <a href="${process.env.NEXT_PUBLIC_APP_URL}/register">${process.env.NEXT_PUBLIC_APP_URL}/register</a> and enter the invitation code: <strong>${code}</strong>
            </div>

            <p>This invitation allows you to join the organization and access all the features available to team members.</p>

            <div class="contact-info">
              <strong>Need help?</strong><br>
              📧 Email: support@ohplus.com<br>
              📞 Phone: +63 123 456 7890
            </div>

            <p>Welcome to the team!</p>

            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong>The OH Plus Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>This invitation is for ${recipientEmail} and expires when the organization code expires.</p>
            <p>© ${new Date().getFullYear()} OH Plus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("Attempting to send invitation email to:", recipientEmail)

    const emailData = {
      from: "OH Plus <noreply@resend.dev>",
      to: [recipientEmail],
      subject: emailSubject,
      html: emailBody,
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send invitation email",
          details: error.message || "Unknown error from email service",
        },
        { status: 500 },
      )
    }

    console.log("Invitation email sent successfully:", data)
    return NextResponse.json({
      success: true,
      data,
      message: "Invitation email sent successfully",
    })
  } catch (error) {
    console.error("Invitation email sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
