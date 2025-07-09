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

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">You're Invited!</h1>
          <p style="color: #6b7280; font-size: 16px;">Join ${companyName || "our organization"} on our platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin-bottom: 15px; color: #374151;">
            ${senderName ? `${senderName} has invited you to join ${companyName || "their organization"}` : `You've been invited to join ${companyName || "an organization"}`} on our platform.
          </p>
          
          <p style="margin-bottom: 20px; color: #374151;">
            Use the invitation code below to create your account and get started:
          </p>
          
          <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 2px dashed #d1d5db; text-align: center; margin-bottom: 20px;">
            <code style="font-size: 18px; font-weight: bold; color: #1f2937; letter-spacing: 2px;">${organizationCode}</code>
          </div>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Create Account
            </a>
          </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <h3 style="color: #374151; margin-bottom: 15px;">How to get started:</h3>
          <ol style="color: #6b7280; line-height: 1.6;">
            <li>Click the "Create Account" button above</li>
            <li>Fill in your registration details</li>
            <li>Click "Join an organization" and enter the invitation code</li>
            <li>Complete your registration</li>
          </ol>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px;">
            This invitation will expire in 30 days. If you have any questions, please contact your administrator.
          </p>
        </div>
      </div>
    `

    // Use the same pattern as existing Resend implementations in the codebase
    const { data, error } = await resend.emails.send({
      from: "Organization <noreply@resend.dev>", // Using resend.dev domain as fallback
      to: [email],
      subject: `Invitation to join ${companyName || "our organization"}`,
      html: emailHtml,
    })

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json({ error: "Failed to send invitation email", details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      data,
    })
  } catch (error) {
    console.error("Error in send invitation email API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
