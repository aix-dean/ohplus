import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateCostEstimatePDF } from "@/lib/cost-estimate-pdf-service"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("Cost estimate email API route called")

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
      hasCostEstimate: !!body.costEstimate,
      hasCostEstimateIds: !!body.costEstimateIds,
      hasClientEmail: !!body.clientEmail,
      costEstimateId: body.costEstimate?.id,
      customSubject: body.subject,
      customBody: body.body,
      currentUserEmail: body.currentUserEmail,
      ccEmail: body.ccEmail,
      hasUploadedFiles: !!body.uploadedFiles,
      uploadedFilesCount: body.uploadedFiles?.length || 0,
    })

    const {
      costEstimate: singleCostEstimate,
      costEstimateIds,
      clientEmail,
      client,
      currentUserEmail,
      ccEmail,
      subject,
      body: customBody,
      attachments,
      uploadedFiles,
    } = body

    if ((!singleCostEstimate && !costEstimateIds) || !clientEmail || !client || !subject || !customBody) {
      console.error("Missing required fields")
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const costEstimates = []

    if (costEstimateIds && Array.isArray(costEstimateIds)) {
      // Fetch multiple cost estimates
      console.log("Fetching multiple cost estimates:", costEstimateIds)
      for (const id of costEstimateIds) {
        try {
          const docRef = doc(db, "costEstimates", id)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            costEstimates.push({ id: docSnap.id, ...docSnap.data() })
          }
        } catch (fetchError) {
          console.error(`Error fetching cost estimate ${id}:`, fetchError)
        }
      }
    } else if (singleCostEstimate?.id) {
      // Fetch single cost estimate or use provided data
      try {
        const docRef = doc(db, "costEstimates", singleCostEstimate.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          costEstimates.push({ id: docSnap.id, ...docSnap.data() })
        } else {
          // Use provided data if not found in database
          costEstimates.push(singleCostEstimate)
        }
      } catch (fetchError) {
        console.error("Error fetching cost estimate:", fetchError)
        costEstimates.push(singleCostEstimate)
      }
    }

    if (costEstimates.length === 0) {
      console.error("No cost estimates found")
      return NextResponse.json({ error: "No cost estimates found" }, { status: 404 })
    }

    console.log(`Processing ${costEstimates.length} cost estimate(s)`)

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

    const pdfAttachments = []
    const attachmentInfo = []

    for (let i = 0; i < costEstimates.length; i++) {
      const costEstimate = costEstimates[i]
      try {
        console.log(`Generating PDF ${i + 1} for cost estimate:`, costEstimate.id)
        const pdfBase64 = await generateCostEstimatePDF(costEstimate, undefined, true)

        if (pdfBase64) {
          const filename = `${(costEstimate.title || "Cost_Estimate").replace(/[^a-z0-9]/gi, "_")}_${costEstimate.costEstimateNumber || costEstimate.id}.pdf`

          pdfAttachments.push({
            filename,
            content: pdfBase64,
            type: "application/pdf",
          })

          attachmentInfo.push({
            fileName: filename,
            fileSize: Math.round(pdfBase64.length * 0.75),
            fileType: "application/pdf",
            fileUrl: `blob:https://preview-jp-logistics-report-kzrng30razvmqc8sgkTm.userusercontent.net/${filename}`,
          })

          console.log(`PDF ${i + 1} generated successfully`)
        }
      } catch (pdfError) {
        console.error(`Error generating PDF ${i + 1}:`, pdfError)
        // Continue with other PDFs if one fails
      }
    }

    if (uploadedFiles && Array.isArray(uploadedFiles)) {
      console.log(`Processing ${uploadedFiles.length} uploaded files`)

      for (const uploadedFile of uploadedFiles) {
        try {
          if (uploadedFile.filename && uploadedFile.content && uploadedFile.type) {
            pdfAttachments.push({
              filename: uploadedFile.filename,
              content: uploadedFile.content,
              type: uploadedFile.type,
            })

            attachmentInfo.push({
              fileName: uploadedFile.filename,
              fileSize: Math.round(uploadedFile.content.length * 0.75),
              fileType: uploadedFile.type,
              fileUrl: `blob:uploaded-file/${uploadedFile.filename}`,
            })

            console.log(`Uploaded file processed: ${uploadedFile.filename}`)
          }
        } catch (fileError) {
          console.error(`Error processing uploaded file:`, fileError)
          // Continue with other files if one fails
        }
      }
    }

    const primaryCostEstimate = costEstimates[0]
    const totalEstimatedCost = costEstimates.reduce((sum, ce) => sum + (ce.totalAmount || 0), 0)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
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
            .attachment-note {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
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

              <p>${customBody.replace(/\n/g, "<br>")}</p>

              <div class="cost-estimate-summary">
                <h3 style="margin-top: 0; color: #1f2937;">Cost Estimate Summary</h3>
                <div class="summary-item">
                  <span class="summary-label">Number of Estimates:</span>
                  <span class="summary-value">${costEstimates.length} cost estimate${costEstimates.length > 1 ? "s" : ""}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Line Items:</span>
                  <span class="summary-value">${costEstimates.reduce((sum, ce) => sum + (ce.lineItems?.length || 0), 0)} cost components</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Created Date:</span>
                  <span class="summary-value">${new Date(primaryCostEstimate.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="total-amount">
                Total Estimated Cost: ₱${totalEstimatedCost.toLocaleString()}
              </div>

              ${
                pdfAttachments.length > 0
                  ? `
              <div class="attachment-note">
                📎 <strong>Attachment${pdfAttachments.length > 1 ? "s" : ""}:</strong> You'll find ${pdfAttachments.length > 1 ? "the complete documents" : "the complete document"} attached to this email for your convenience.
              </div>
              `
                  : ""
              }

              <div class="action-button">
                <a href="${baseUrl}/cost-estimates/view/${primaryCostEstimate.id}" class="btn">View Cost Estimate${costEstimates.length > 1 ? "s" : ""} Online</a>
              </div>

              <p>This detailed cost estimate includes all aspects of your advertising campaign. We believe this estimate provides excellent value and aligns with your marketing objectives.</p>

              <div class="contact-info">
                <strong>Questions about this estimate?</strong><br>
                📧 Email: sales@ohplus.com<br>
                📞 Phone: +63 123 456 7890
              </div>

              <p>Thank you for considering OH Plus for your advertising needs. We look forward to working with you!</p>

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

    console.log("Attempting to send email to:", clientEmail)

    const emailData: any = {
      from: "OH Plus <noreply@ohplus.ph>",
      to: [clientEmail],
      subject: subject,
      html: emailHtml,
      reply_to: currentUserEmail ? [currentUserEmail] : undefined,
      cc: ccEmailsArray.length > 0 ? ccEmailsArray : undefined,
    }

    if (pdfAttachments.length > 0) {
      emailData.attachments = pdfAttachments
      console.log(`${pdfAttachments.length} attachment(s) added to email (PDFs + uploaded files)`)
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("Resend error:", error)
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

    try {
      const emailDoc = {
        to: clientEmail,
        from: currentUserEmail || "noreply@ohplus.ph",
        cc: ccEmailsArray,
        subject: subject,
        body: customBody,
        status: "sent",
        type: "cost estimate", // Added type field
        created: serverTimestamp(),
        sentAt: serverTimestamp(),
        updated: serverTimestamp(),
        userId: primaryCostEstimate.created_by || "",
        reportId: primaryCostEstimate.id,
        templateId: "",
        attachments: attachmentInfo,
      }

      await addDoc(collection(db, "emails"), emailDoc)
      console.log("Email document created in emails collection with type: cost estimate")
    } catch (emailDocError) {
      console.error("Error creating email document:", emailDocError)
      // Don't fail the request if email doc creation fails
    }

    return NextResponse.json({
      success: true,
      data,
      message:
        pdfAttachments.length > 0
          ? `Email sent successfully with ${pdfAttachments.length} attachment(s)`
          : "Email sent successfully without attachments",
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
