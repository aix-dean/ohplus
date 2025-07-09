import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, code, senderName, customMessage } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${code}`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join OH Plus</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .code-box { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .steps { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 10px 0; padding-left: 20px; position: relative; }
            .step::before { content: counter(step-counter); counter-increment: step-counter; position: absolute; left: 0; top: 0; background-color: #2563eb; color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
            .steps { counter-reset: step-counter; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">OH!</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">You're Invited to Join Our Organization</h1>
            </div>
            
            <div class="content">
              <p>Hello!</p>
              
              <p><strong>${senderName}</strong> has invited you to join their organization on OH Plus.</p>
              
              ${customMessage ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; font-style: italic;">"${customMessage}"</p></div>` : ""}
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #64748b;">Your Invitation Code</p>
                <div class="code">${code}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="${registrationUrl}" class="button">Join Organization</a>
              </div>
              
              <div class="steps">
                <h3 style="margin-top: 0; color: #374151;">How to join:</h3>
                <div class="step">Click the "Join Organization" button above</div>
                <div class="step">Complete the registration form</div>
                <div class="step">Your invitation code will be automatically applied</div>
                <div class="step">Start collaborating with your team!</div>
              </div>
              
              <p><strong>Alternative method:</strong> If the button doesn't work, you can manually enter the code <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${code}</code> during registration at <a href="${process.env.NEXT_PUBLIC_APP_URL}/register">${process.env.NEXT_PUBLIC_APP_URL}/register</a></p>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">This invitation code will expire and can only be used a limited number of times. Please register soon to secure your access.</p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by ${senderName} from OH Plus.</p>
              <p>If you have any questions, please contact your colleague who sent this invitation.</p>
              <p style="margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #2563eb;">Visit OH Plus</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: `${senderName} invited you to join their organization on OH Plus`,
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
