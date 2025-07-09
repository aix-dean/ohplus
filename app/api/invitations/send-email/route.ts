import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, organizationCode, senderName, companyName } = await request.json()

    if (!email || !organizationCode) {
      return NextResponse.json({ error: "Email and organization code are required" }, { status: 400 })
    }

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${organizationCode}`

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">You're Invited!</h1>
            <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">Join ${companyName || "our organization"}</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${senderName ? `${senderName} has invited you to join ${companyName || "their organization"}` : `You've been invited to join ${companyName || "an organization"}`} on our platform.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Use the invitation code below to create your account and get started:
            </p>

            <!-- Code Box -->
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #cbd5e1;">
              <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #1e293b; letter-spacing: 3px;">
                ${organizationCode}
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">
                Create Account
              </a>
            </div>

            <!-- Instructions -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Getting Started:</h3>
              <ol style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Click the "Create Account" button above</li>
                <li>Fill in your registration details</li>
                <li>Click "Join an organization" and enter the invitation code</li>
                <li>Complete your registration to get started</li>
              </ol>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                If you can't click the button above, copy and paste this link into your browser:
              </p>
              <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 0 0 15px 0;">
                ${invitationUrl}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                This invitation expires in 30 days. If you have questions, contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: `${companyName || "Organization"} <noreply@yourdomain.com>`,
      to: [email],
      subject: `Invitation to join ${companyName || "our organization"}`,
      html: emailContent,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
