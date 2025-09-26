import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("Quotation email API route called")

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
      hasQuotation: !!body.quotation,
      hasClientEmail: !!body.clientEmail,
      quotationId: body.quotation?.id,
      customSubject: body.subject,
      customBody: body.body,
      currentUserEmail: body.currentUserEmail,
      ccEmail: body.ccEmail,
      preGeneratedPDFsCount: body.preGeneratedPDFs?.length || 0,
      hasUploadedFiles: !!body.uploadedFiles,
      uploadedFilesCount: body.uploadedFiles?.length || 0,
    })

    const {
      quotation,
      clientEmail,
      subject,
      body: customBody,
      currentUserEmail,
      ccEmail,
      replyToEmail,
      companyName,
      preGeneratedPDFs,
      uploadedFiles,
    } = body

    if (!quotation || !clientEmail) {
      console.error("Missing required fields:", { quotation: !!quotation, clientEmail: !!clientEmail })
      return NextResponse.json({ error: "Missing quotation or client email address" }, { status: 400 })
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

    const quotationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sales/quotations/${quotation.id}`

    console.log(`Using ${preGeneratedPDFs?.length || 0} pre-generated PDFs for email attachments`)
    console.log("Generated quotation URL:", quotationUrl)

    // Use custom subject and body if provided, otherwise fall back to default
    const finalSubject =
      subject || `Quotation: ${quotation.items?.[0]?.name || "Custom Advertising Solution"} - ${companyName || "Company"}`

    // Format custom body as HTML if provided
    const formattedCustomBody = customBody
      ? customBody
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)
          .map((line) => `<p>${line}</p>`)
          .join("")
      : `<p>We are excited to present you with a detailed quotation tailored to your specific advertising needs. Our team has carefully prepared this quotation to help you plan your marketing investment.</p>`

    const finalBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation from ${companyName || "Company"}</title>
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
          .quotation-summary {
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
          .attachment-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
            text-align: center;
          }
          .custom-message {
            margin: 20px 0;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName || "Company"}</h1>
            <p>Professional Advertising Solutions</p>
          </div>

          <div class="content">
            <div class="greeting">
              Dear ${quotation.client_name || "Valued Client"},
            </div>

            <div class="custom-message">
              ${formattedCustomBody}
            </div>

            <div class="quotation-summary">
              <h3 style="margin-top: 0; color: #1f2937;">Quotation Summary</h3>
              <div class="summary-item">
                <span class="summary-label">Site Location:</span>
                <span class="summary-value">${quotation.items?.[0]?.location || "Custom Location"}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Billboard Type:</span>
                <span class="summary-value">${quotation.items?.[0]?.type || "Billboard"}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Contract Duration:</span>
                <span class="summary-value">${quotation.duration_days || 0} days</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Valid Until:</span>
                <span class="summary-value">${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="total-amount">
              Total Amount: ₱${(quotation.total_amount || 0).toLocaleString()}
            </div>

            ${
              preGeneratedPDFs && preGeneratedPDFs.length > 0
                ? `
            <div class="attachment-note">
              📎 <strong>PDF${preGeneratedPDFs.length > 1 ? "s" : ""} Attached:</strong> You'll find the complete quotation document${preGeneratedPDFs.length > 1 ? "s" : ""} attached to this email for your convenience.
            </div>
            `
                : ""
            }

            <div class="action-button">
              <a href="${quotationUrl}" class="btn">View Full Quotation Online</a>
            </div>

            <div class="contact-info">
              <strong>Ready to get started?</strong><br>
              📧 Email: ${currentUserEmail || "contact@company.com"}<br>
              📞 Phone: ${currentUserEmail ? "Contact us for details" : "+63 123 456 7890"}
            </div>

            <p>Thank you for considering ${companyName || "our company"} as your advertising partner. We look forward to creating something amazing together!</p>

            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong>The ${companyName || "Company"} Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>This quotation is confidential and intended solely for ${quotation.client_company_name || "your company"}.</p>
            <p>© ${new Date().getFullYear()} ${companyName || "Company"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("Attempting to send email to:", clientEmail)

    const attachments = []

    if (preGeneratedPDFs && Array.isArray(preGeneratedPDFs) && preGeneratedPDFs.length > 0) {
      preGeneratedPDFs.forEach((pdf, index) => {
        if (pdf.filename && pdf.content) {
          attachments.push({
            filename: pdf.filename,
            content: pdf.content,
            type: "application/pdf",
          })
          console.log(`Pre-generated PDF attachment ${index + 1} added:`, pdf.filename)
        }
      })
    }

    // Add uploaded file attachments if available
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      uploadedFiles.forEach((file, index) => {
        if (file.filename && file.content && file.type) {
          attachments.push({
            filename: file.filename,
            content: file.content,
            type: file.type,
          })
          console.log(`Uploaded file attachment ${index + 1} added:`, file.filename)
        }
      })
    }

    console.log(`Total attachments prepared: ${attachments.length}`)

    // Prepare email data with all attachments
    const emailData: any = {
      from: `${companyName || "Company"} <noreply@${process.env.RESEND_VERIFIED_DOMAIN || 'company.com'}>`,
      to: [clientEmail],
      subject: finalSubject,
      html: finalBody,
      reply_to: replyToEmail ? [replyToEmail] : (currentUserEmail ? [currentUserEmail] : undefined),
      cc: ccEmailsArray.length > 0 ? ccEmailsArray : undefined,
    }

    if (attachments.length > 0) {
      emailData.attachments = attachments
      console.log(`${attachments.length} attachment(s) added to email`)
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
      message:
        attachments.length > 0
          ? `Email sent successfully with ${attachments.length} attachment(s)`
          : "Email sent successfully",
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
