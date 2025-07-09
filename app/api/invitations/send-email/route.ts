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
      hasEmail: !!body.email,
      hasOrganizationCode: !!body.organizationCode,
      senderName: body.senderName,
      companyName: body.companyName,
    })

    const { email, organizationCode, senderName, companyName } = body

    if (!email || !organizationCode) {
      console.error("Missing required fields:", { email: !!email, organizationCode: !!organizationCode })
      return NextResponse.json({ error: "Missing email or organization code" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email)
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 })
    }

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${organizationCode}`

    console.log("Generated invitation URL:", invitationUrl)

    const emailContent = `
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
          .invitation-code {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
            text-align: center;
          }
          .code-label {
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 10px;
          }
          .code-value {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            letter-spacing: 2px;
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
          .instructions {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .instructions h3 {
            color: #1e40af;
            margin-top: 0;
          }
          .instructions ol {
            color: #1e40af;
            margin: 0;
            padding-left: 20px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .link-fallback {
            background: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #6b7280;
          }
          .link-fallback a {
            color: #2563eb;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${companyName || "our organization"}</p>
          </div>

          <div class="content">
            <div class="greeting">
              Hello!
            </div>

            <p>${senderName ? `${senderName} has invited you to join ${companyName || "their organization"}` : `You've been invited to join ${companyName || "an organization"}`} on our platform.</p>

            <p>Use the invitation code below to create your account and get started:</p>

            <div class="invitation-code">
              <div class="code-label">Your Invitation Code</div>
              <div class="code-value">${organizationCode}</div>
            </div>

            <div class="action-button">
              <a href="${invitationUrl}" class="btn">Join Organization</a>
            </div>

            <div class="instructions">
              <h3>How to get started:</h3>
              <ol>
                <li>Click the "Join Organization" button above</li>
                <li>Fill in your registration details</li>
                <li>Click "Join an organization" and enter the invitation code</li>
                <li>Complete your registration to get started</li>
              </ol>
            </div>

            <div class="link-fallback">
              <strong>Can't click the button?</strong><br>
              Copy and paste this link into your browser:<br>
              <a href="${invitationUrl}">${invitationUrl}</a>
            </div>

            <p>We're excited to have you join our team!</p>

            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong>${senderName || "The Team"}</strong>
            </p>
          </div>

          <div class="footer">
            <p>This invitation code expires in 30 days.</p>
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("Attempting to send email to:", email)

    // Use the same domain as the existing proposal email functionality
    const { data, error } = await resend.emails.send({
      from: `${companyName || "Organization"} <noreply@resend.dev>`,
      to: [email],
      subject: `Invitation to join ${companyName || "our organization"}`,
      html: emailContent,
    })

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email",
          details: error.message || "Unknown error from email service",
        },
        { status: 500 },
      )
    }

    console.log("Email sent successfully:", data)
    return NextResponse.json({
      success: true,
      data,
      message: "Invitation email sent successfully",
    })
  } catch (error) {
    console.error("Email sending error:", error)
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
