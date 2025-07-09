import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, code, senderName, companyName } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${code}`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Organization Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Join our organization</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello! ${senderName ? `<strong>${senderName}</strong>` : "Someone"} has invited you to join ${companyName ? `<strong>${companyName}</strong>` : "their organization"}.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your organization code:</p>
              <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">
                ${code}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Join Organization
              </a>
            </div>
            
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">Alternative Method:</h3>
              <p style="font-size: 14px; color: #666; margin-bottom: 5px;">
                1. Visit: <a href="${process.env.NEXT_PUBLIC_APP_URL}/register" style="color: #2563eb;">${process.env.NEXT_PUBLIC_APP_URL}/register</a>
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 5px;">
                2. Click "Join an organization"
              </p>
              <p style="font-size: 14px; color: #666;">
                3. Enter the code: <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${code}</code>
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center;">
              <p>This invitation was sent by ${senderName || "an administrator"} from ${companyName || "your organization"}.</p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: `Invitation to join ${companyName || "organization"}`,
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
