import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailRequest {
  to: string
  cc?: string
  subject: string
  message: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
  proposalId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.message || !body.proposalId) {
      return NextResponse.json({ error: "Missing required fields: to, subject, message, proposalId" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to)) {
      return NextResponse.json({ error: "Invalid email format for recipient" }, { status: 400 })
    }

    if (body.cc && !emailRegex.test(body.cc)) {
      return NextResponse.json({ error: "Invalid email format for CC recipient" }, { status: 400 })
    }

    // Prepare email recipients
    const recipients = [body.to]
    if (body.cc) {
      recipients.push(body.cc)
    }

    // Generate HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${body.subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px 20px;
              border: 1px solid #e1e5e9;
              border-top: none;
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
            .message-content {
              white-space: pre-wrap;
              margin: 20px 0;
            }
            .attachments {
              margin-top: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 6px;
            }
            .attachment-item {
              display: inline-block;
              margin: 5px 10px 5px 0;
              padding: 8px 12px;
              background: #e9ecef;
              border-radius: 4px;
              text-decoration: none;
              color: #495057;
              font-size: 14px;
            }
            .cta-button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OH Plus Proposal</h1>
            <p>Professional Billboard & Advertising Solutions</p>
          </div>
          
          <div class="content">
            <div class="message-content">${body.message.replace(/\n/g, "<br>")}</div>
            
            ${
              body.attachments && body.attachments.length > 0
                ? `
              <div class="attachments">
                <h3>📎 Attachments:</h3>
                ${body.attachments
                  .map((att) => `<a href="${att.url}" class="attachment-item" target="_blank">${att.name}</a>`)
                  .join("")}
              </div>
            `
                : ""
            }
            
            <div style="margin-top: 30px;">
              <a href="https://ohplus.ph/proposals/view/${body.proposalId}" class="cta-button">
                View Proposal Online
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>OH Plus</strong> - Your Premier Billboard Advertising Partner</p>
            <p>📧 Email: sales@ohplus.ph | 📞 Phone: +639XXXXXXXXX</p>
            <p>🌐 Website: <a href="https://ohplus.ph">ohplus.ph</a></p>
          </div>
        </body>
      </html>
    `

    // Prepare attachments for Resend
    const emailAttachments =
      body.attachments?.map((att) => ({
        filename: att.name,
        path: att.url,
      })) || []

    // Send email using Resend
    const emailData = {
      from: "OH Plus Sales <sales@ohplus.ph>",
      to: [body.to],
      cc: body.cc ? [body.cc] : undefined,
      subject: body.subject,
      html: htmlContent,
      text: body.message, // Plain text fallback
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      reply_to: "sales@ohplus.ph",
      headers: {
        "X-Entity-Ref-ID": `proposal-${body.proposalId}`,
      },
    }

    const result = await resend.emails.send(emailData)

    if (result.error) {
      console.error("Resend API error:", result.error)
      return NextResponse.json({ error: "Failed to send email via Resend API", details: result.error }, { status: 500 })
    }

    // Log successful email send
    console.log(`Email sent successfully for proposal ${body.proposalId}:`, {
      id: result.data?.id,
      to: body.to,
      cc: body.cc,
      subject: body.subject,
      attachments: body.attachments?.length || 0,
    })

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: result.data?.id,
      recipients: recipients,
    })
  } catch (error) {
    console.error("Error sending proposal email:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
