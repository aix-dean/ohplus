import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateProposalPDF } from "@/lib/pdf-service"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("Proposal email API route called")

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
      hasProposal: !!body.proposal,
      hasClientEmail: !!body.clientEmail,
      proposalId: body.proposal?.id,
    })

    const { proposal, clientEmail } = body

    if (!proposal || !clientEmail) {
      console.error("Missing required fields:", { proposal: !!proposal, clientEmail: !!clientEmail })
      return NextResponse.json({ error: "Missing proposal or client email address" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      console.error("Invalid email format:", clientEmail)
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 })
    }

    const proposalUrl = `https://ohplus.aix.ph/proposals/view/${proposal.id}`

    // Generate PDF as base64 for attachment
    let pdfBase64 = null
    try {
      console.log("Generating PDF for email attachment...")
      pdfBase64 = await generateProposalPDF(proposal, true) // true for base64 return
      console.log("PDF generated successfully for email attachment")
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError)
      // Continue without PDF attachment if generation fails
    }

    console.log("Generated proposal URL:", proposalUrl)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Proposal from OH Plus</title>
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
          .proposal-summary { 
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
          .password-section {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .password-code {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #92400e;
            background: white;
            padding: 10px 20px;
            border-radius: 6px;
            display: inline-block;
            margin: 10px 0;
            letter-spacing: 2px;
            border: 1px solid #f59e0b;
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
          .attachment-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
            text-align: center;
          }
          .security-note {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #dc2626;
            font-size: 14px;
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
              Dear ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"},
            </div>
            
            <p>We are excited to present you with a customized advertising proposal tailored to your specific needs. Our team has carefully crafted this proposal to help you achieve your marketing objectives.</p>
            
            <div class="proposal-summary">
              <h3 style="margin-top: 0; color: #1f2937;">Proposal Summary</h3>
              <div class="summary-item">
                <span class="summary-label">Proposal Title:</span>
                <span class="summary-value">${proposal.title || "Custom Advertising Proposal"}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Number of Products:</span>
                <span class="summary-value">${proposal.products?.length || 0} advertising solutions</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Valid Until:</span>
                <span class="summary-value">${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="total-amount">
              Total Investment: ₱${(proposal.totalAmount || 0).toLocaleString()}
            </div>

            <div class="password-section">
              <h3 style="margin-top: 0; color: #92400e;">🔐 Secure Access Required</h3>
              <p style="margin: 10px 0; color: #92400e;">To protect your proposal, please use this access code when viewing online:</p>
              <div class="password-code">${proposal.password || "SECURE123"}</div>
              <p style="margin: 10px 0; font-size: 14px; color: #92400e;">Keep this code confidential and do not share it with unauthorized persons.</p>
            </div>
            
            ${
              proposal.customMessage
                ? `
            <div class="message">
              <strong>Personal Message:</strong><br>
              ${proposal.customMessage}
            </div>
            `
                : ""
            }
            
            ${
              pdfBase64
                ? `
            <div class="attachment-note">
              📎 <strong>PDF Attached:</strong> You'll find the complete proposal document attached to this email for your convenience.
            </div>
            `
                : ""
            }
            
            <div class="action-button">
              <a href="${proposalUrl}" class="btn">View Full Proposal Online</a>
            </div>

            <div class="security-note">
              <strong>🛡️ Security Notice:</strong> This proposal is password-protected for your security. You will be prompted to enter the access code shown above when viewing the proposal online.
            </div>
            
            <p>We believe this proposal offers excellent value and aligns perfectly with your advertising goals. Our team is ready to discuss any questions you may have and work with you to bring this campaign to life.</p>
            
            <div class="contact-info">
              <strong>Ready to get started?</strong><br>
              📧 Email: sales@ohplus.com<br>
              📞 Phone: +63 123 456 7890
            </div>
            
            <p>Thank you for considering OH Plus as your advertising partner. We look forward to creating something amazing together!</p>
            
            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong>The OH Plus Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This proposal is confidential and intended solely for ${proposal.client?.company || "your company"}.</p>
            <p>© ${new Date().getFullYear()} OH Plus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("Attempting to send email to:", clientEmail)

    // Prepare email data with optional PDF attachment
    const emailData: any = {
      from: "OH Plus <noreply@resend.dev>",
      to: [clientEmail],
      subject: `🔐 Secure Proposal: ${proposal.title || "Custom Advertising Solution"} - OH Plus`,
      html: emailHtml,
    }

    // Add PDF attachment if generated successfully
    if (pdfBase64) {
      emailData.attachments = [
        {
          filename: `${(proposal.title || "Proposal").replace(/[^a-z0-9]/gi, "_")}_${proposal.id}.pdf`,
          content: pdfBase64,
          type: "application/pdf",
        },
      ]
      console.log("PDF attachment added to email")
    }

    const { data, error } = await resend.emails.send(emailData)

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
      message: pdfBase64
        ? "Email sent successfully with PDF attachment and access code"
        : "Email sent successfully with access code",
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
