import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, organizationCode, senderName, companyName } = await request.json()

    if (!recipientEmail || !organizationCode) {
      return NextResponse.json({ error: "Recipient email and organization code are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${organizationCode}`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Organization Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .code-box { background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px; }
            .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
            .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">OH<span style="color: #60a5fa;">!</span></div>
              <p style="margin: 0; font-size: 18px;">Out-of-Home Advertising Platform</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1e40af; margin-top: 0;">You're Invited to Join Our Organization!</h2>
              
              <p>Hello!</p>
              
              <p><strong>${senderName || "Someone"}</strong> from <strong>${companyName || "our organization"}</strong> has invited you to join their team on the OH Plus platform.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Organization Code:</p>
                <div class="code">${organizationCode}</div>
              </div>
              
              <h3>How to Join:</h3>
              
              <p><strong>Option 1: Quick Registration (Recommended)</strong></p>
              <p>Click the button below to automatically register with your organization code:</p>
              
              <div style="text-align: center;">
                <a href="${registrationUrl}" class="button">Join Organization & Register</a>
              </div>
              
              <div class="divider"></div>
              
              <p><strong>Option 2: Manual Registration</strong></p>
              <ol>
                <li>Visit our registration page: <a href="${process.env.NEXT_PUBLIC_APP_URL}/register">${process.env.NEXT_PUBLIC_APP_URL}/register</a></li>
                <li>Fill out the registration form</li>
                <li>Click "Join an organization"</li>
                <li>Enter the organization code: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${organizationCode}</code></li>
              </ol>
              
              <div class="divider"></div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>You'll create your account and automatically join the organization</li>
                <li>You'll have access to the same features and data as your team</li>
                <li>You can start collaborating immediately</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to reach out to your team administrator or contact our support team.</p>
              
              <p>Welcome to OH Plus!</p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by ${senderName || "a team member"} from ${companyName || "your organization"}.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; 2024 OH Plus. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [recipientEmail],
      subject: `You're invited to join ${companyName || "our organization"} on OH Plus`,
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      emailId: data?.id,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
