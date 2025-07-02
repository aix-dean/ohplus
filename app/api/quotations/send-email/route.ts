import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getQuotationById } from "@/lib/quotation-service" // Import to fetch quotation details

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    console.log("Email API route called")

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not found in environment variables")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Request body received:", {
      quotationId: body.quotationId,
      toEmail: body.toEmail,
      subject: body.subject,
      ccEmail: body.ccEmail,
      replyToEmail: body.replyToEmail,
      clientName: body.clientName,
      totalAmount: body.totalAmount,
    })

    const { quotationId, toEmail: to, subject, body: emailBody, ccEmail, replyToEmail, clientName, totalAmount } = body

    if (!quotationId || !to || !subject || !clientName || !totalAmount) {
      console.error("Missing required fields for email:", {
        quotationId: !!quotationId,
        to: !!to,
        subject: !!subject,
        clientName: !!clientName,
        totalAmount: !!totalAmount,
      })
      return NextResponse.json({ error: "Missing required email fields" }, { status: 400 })
    }

    // Fetch the full quotation object using the ID
    const quotation = await getQuotationById(quotationId)
    if (!quotation) {
      console.error("Quotation not found for ID:", quotationId)
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const acceptUrl = `${APP_URL}/quotations/${quotation.id}/accept`
    const declineUrl = `${APP_URL}/quotations/${quotation.id}/decline`

    console.log("Generated URLs:", { acceptUrl, declineUrl })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .quotation-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .total-amount { background: #059669; color: white; padding: 15px; text-align: center; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .btn-accept { background: #059669; color: white; }
          .btn-decline { background: #dc2626; color: white; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OOH+ Operator</h1>
          <h2>Quotation ${quotation.quotation_number}</h2>
        </div>
        
        <div class="content">
          <p>${emailBody.replace(/\n/g, "<br>")}</p>
          
          <div class="quotation-details">
            <h3>Product Information</h3>
            <div class="detail-row">
              <span class="detail-label">Product:</span>
              <span>${quotation.product_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span>${quotation.product_location || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Site Code:</span>
              <span>${quotation.site_code || "N/A"}</span>
            </div>
            
            <h3>Rental Period</h3>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span>${new Date(quotation.start_date).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span>${new Date(quotation.end_date).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span>${quotation.duration_days} days</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Price per Day:</span>
              <span>₱${quotation.price.toLocaleString()}</span>
            </div>
            
            ${
              quotation.notes
                ? `
            <h3>Additional Notes</h3>
            <p>${quotation.notes}</p>
            `
                : ""
            }
          </div>
          
          <div class="total-amount">
            Total Amount: ₱${quotation.total_amount.toLocaleString()}
          </div>
          
          <div class="action-buttons">
            <a href="${acceptUrl}" class="btn btn-accept">Accept Quotation</a>
            <a href="${declineUrl}" class="btn btn-decline">Decline Quotation</a>
          </div>
          
          <p>This quotation is valid for 30 days from the date of issue. If you have any questions or need clarification, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>
          OOH+ Operator Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>© ${new Date().getFullYear()} OOH+ Operator. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    console.log("Attempting to send email to:", to)

    const emailData = {
      from: "Jiven <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: emailHtml,
      ...(ccEmail && { cc: ccEmail.split(",").map((email: string) => email.trim()) }),
      ...(replyToEmail && { reply_to: replyToEmail }),
    }

    console.log("Email data prepared:", {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      cc: emailData.cc,
      reply_to: emailData["reply_to"],
    })

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: error.message || "Unknown error",
        },
        { status: 500 },
      )
    }

    console.log("Email sent successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
