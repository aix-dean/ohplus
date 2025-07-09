import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, senderName, companyName, organizationCode } = await request.json()

    if (!email || !organizationCode) {
      return NextResponse.json({ error: "Email and organization code are required" }, { status: 400 })
    }

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register?code=${organizationCode}`

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join Our Organization</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Join ${companyName || "our organization"}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello! ${senderName || "Someone"} has invited you to join ${companyName || "their organization"}.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #495057;">Your Organization Code:</p>
              <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px;">
                ${organizationCode}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Join Organization
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Note:</strong> This invitation code expires in 30 days. Please register soon to secure your access.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; margin: 0;">
              If you can't click the button above, copy and paste this link into your browser:<br>
              <a href="${registrationUrl}" style="color: #007bff; word-break: break-all;">${registrationUrl}</a>
            </p>
            
            <p style="font-size: 12px; color: #adb5bd; margin-top: 20px; text-align: center;">
              This invitation was sent by ${senderName || "a team member"} from ${companyName || "your organization"}.
            </p>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: `${companyName || "Organization"} <noreply@yourdomain.com>`,
      to: [email],
      subject: `Invitation to join ${companyName || "our organization"}`,
      html: emailContent,
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
