import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { costEstimate, clientEmail, client, currentUserEmail, ccEmail, subject, body } = await request.json() // Destructure new fields

    if (!costEstimate || !clientEmail || !client || !subject || !body) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Validate email format for 'To'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      console.error("Invalid 'To' email format:", clientEmail)
      return NextResponse.json({ error: "Invalid 'To' email address format" }, { status: 400 })
    }

    // Process and validate multiple CC emails
    const ccEmailsArray = ccEmail
      ? ccEmail
          .split(",")
          .map((email: string) => email.trim())
          .filter(Boolean)
      : []

    for (const email of ccEmailsArray) {
      if (!emailRegex.test(email)) {
        console.error("Invalid 'CC' email format:", email)
        return NextResponse.json({ error: `Invalid 'CC' email address format: ${email}` }, { status: 400 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const costEstimateUrl = `${baseUrl}/cost-estimates/view/${costEstimate.id}`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title> {/* Use dynamic subject */}
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
              padding: 30px;
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
            .cost-estimate-summary {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              border-left: 4px solid #2563eb;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 5px 0;
            }
            .summary-label {
              font-weight: 600;
              color: #6b7280;
            }
            .summary-value {
              color: #1f2937;
              font-weight: 500;
            }
            .total-amount {
              background: linear-gradient(135deg, #059669, #047857);
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              font-size: 20px;
              font-weight: 700;
              margin: 25px 0;
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
            .message {
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
              <p>Professional Outdoor Advertising Solutions</p>
            </div>

            <div class="content">
              <div class="greeting">
                Dear ${client.contactPerson || client.company || "Valued Client"},
              </div>

              <p>${body.replace(/\n/g, "<br>")}</p> {/* Use dynamic body and replace newlines with <br> */}

              <div class="cost-estimate-summary">
                <h3 style="margin-top: 0; color: #1f2937;">Cost Estimate Summary</h3>
                <div class="summary-item">
                  <span class="summary-label">Estimate Title:</span>
                  <span class="summary-value">${costEstimate.title || "Custom Cost Estimate"}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Number of Line Items:</span>
                  <span class="summary-value">${costEstimate.lineItems?.length || 0} cost components</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Created Date:</span>
                  <span class="summary-value">${new Date(costEstimate.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="total-amount">
                Total Estimated Cost: ₱${(costEstimate.totalAmount || 0).toLocaleString()}
              </div>

              <div class="action-button">
                <a href="${costEstimateUrl}" class="btn">View Full Cost Estimate Online</a>
              </div>

              <p>This detailed cost estimate includes all aspects of your advertising campaign, from media costs to production and installation. We believe this estimate provides excellent value and aligns with your marketing objectives.</p>

              <div class="contact-info">
                <strong>Questions about this estimate?</strong><br>
                📧 Email: sales@ohplus.com<br>
                📞 Phone: +63 123 456 7890
              </div>

              <p>Thank you for considering OH Plus for your advertising needs. We look forward to working with you to bring your campaign to life!</p>

              <p style="margin-bottom: 0;">
                Best regards,<br>
                <strong>The OH Plus Team</strong>
              </p>
            </div>

            <div class="footer">
              <p>This cost estimate is confidential and intended solely for ${client.company || "your company"}.</p>
              <p>© ${new Date().getFullYear()} OH Plus. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: "OH Plus <noreply@resend.dev>",
      to: [clientEmail],
      subject: subject, // Use dynamic subject
      html: emailHtml,
      reply_to: currentUserEmail ? [currentUserEmail] : undefined, // Set reply-to to current user's email
      cc: ccEmailsArray.length > 0 ? ccEmailsArray : undefined, // Add CC if provided
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email", details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error sending cost estimate email:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
