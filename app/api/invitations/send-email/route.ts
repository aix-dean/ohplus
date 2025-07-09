import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
      invitationCode,
      registrationUrl,
      senderName,
      companyName,
      role,
      expiresAt,
    } = await request.json()

    if (!recipientEmail || !invitationCode || !registrationUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to ${companyName || "OH Plus"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e1e5e9;
              border-top: none;
            }
            .invitation-code {
              background: #f8f9fa;
              border: 2px dashed #dee2e6;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .code {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: bold;
              color: #495057;
              letter-spacing: 2px;
            }
            .button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 500;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border: 1px solid #e1e5e9;
              border-top: none;
              border-radius: 0 0 8px 8px;
              font-size: 14px;
              color: #6c757d;
            }
            .info-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${companyName || "OH Plus"} team</p>
          </div>
          
          <div class="content">
            <p>Hello ${recipientName || "there"},</p>
            
            <p>${message}</p>
            
            <div class="invitation-code">
              <p><strong>Your Invitation Code:</strong></p>
              <div class="code">${invitationCode}</div>
            </div>
            
            <div class="info-box">
              <p><strong>How to get started:</strong></p>
              <ol>
                <li>Click the registration button below</li>
                <li>Use the invitation code: <code>${invitationCode}</code></li>
                <li>Complete your account setup</li>
                <li>Start collaborating with the team!</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${registrationUrl}" class="button">Create Your Account</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${registrationUrl}</p>
            
            ${role ? `<p><strong>Role:</strong> ${role}</p>` : ""}
            ${expiresAt ? `<p><strong>Expires:</strong> ${expiresAt}</p>` : ""}
            
            <p>If you have any questions, please don't hesitate to reach out to ${senderName || "the team"}.</p>
            
            <p>Welcome aboard!</p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${senderName || "OH Plus"}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `

    // Create plain text version
    const textContent = `
You're invited to join ${companyName || "OH Plus"}!

Hello ${recipientName || "there"},

${message}

Your invitation code: ${invitationCode}

To get started:
1. Visit: ${registrationUrl}
2. Use the invitation code: ${invitationCode}
3. Complete your account setup
4. Start collaborating with the team!

${role ? `Role: ${role}` : ""}
${expiresAt ? `Expires: ${expiresAt}` : ""}

If you have any questions, please reach out to ${senderName || "the team"}.

Welcome aboard!

---
This invitation was sent by ${senderName || "OH Plus"}
If you didn't expect this invitation, you can safely ignore this email.
    `

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "noreply@resend.dev",
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
    })

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error)
      return NextResponse.json({ error: "Failed to send email", details: emailResponse.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      emailId: emailResponse.data?.id,
    })
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
