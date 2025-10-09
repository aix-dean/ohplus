import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateCostEstimatePDF } from "@/lib/cost-estimate-pdf-service"
import { emailService, type EmailAttachment } from "@/lib/email-service"
import { Timestamp, doc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage, db } from "@/lib/firebase"

async function uploadFileToStorage(fileBuffer: Buffer, fileName: string, fileType: string, companyId: string): Promise<string> {
  try {
    const timestamp = Date.now()
    const fileExtension = fileName.split('.').pop() || 'file'
    const storageFileName = `emails/${companyId}/${timestamp}_${fileName}`

    const storageRef = ref(storage, storageFileName)

    // Upload the file
    await uploadBytes(storageRef, fileBuffer, {
      contentType: fileType,
    })

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error("Error uploading file to storage:", error)
    throw new Error(`Failed to upload file: ${fileName}`)
  }
}

async function fetchCompanyData(companyId: string) {
  try {
    const companyDoc = await getDoc(doc(db, "companies", companyId))

    if (companyDoc.exists()) {
      const data = companyDoc.data()

      // Always use ohplus.ph domain for sending emails (verified domain)
      const verifiedEmail = "noreply@ohplus.ph"

      // Log if company has a different email domain
      if (data.email) {
        const companyEmailDomain = data.email.split('@')[1]
        if (companyEmailDomain !== 'ohplus.ph') {
          console.log(`Using ohplus.ph domain for sending. Company email: ${data.email}`)
        }
      }

      return {
        company_name: data.company_name || data.name || "OH Plus",
        company_location: data.company_location || data.address || "No. 727 General Solano St., San Miguel, Manila 1005",
        phone: data.phone || data.telephone || data.contact_number || "+639XXXXXXXXX",
        email: verifiedEmail,
        website: data.website || "www.ohplus.ph",
        company_logo: data.logo|| ""
      }
    }

    return {
      company_name: "OH Plus",
      company_location: "No. 727 General Solano St., San Miguel, Manila 1005",
      phone: "+639XXXXXXXXX",
      email: "noreply@ohplus.ph",
      website: "www.ohplus.ph",
    }
  } catch (error) {
    console.error("Error fetching company data:", error)
    return {
      company_name: "OH Plus",
      company_location: "No. 727 General Solano St., San Miguel, Manila 1005",
      phone: "+639XXXXXXXXX",
      email: "noreply@ohplus.ph",
      website: "www.ohplus.ph",
    }
  }
}

function createEmailTemplate(
body: string, userPhoneNumber?: string, companyData?: {
  company_name?: string
  company_location?: string
  phone?: string
  email?: string
  website?: string
  logo?: String
}, userData?: {
  first_name?: string
  middle_name?: string
  last_name?: string
  position?: string
  department?: string
  email?: string
  phone_number?: string
}, costEstimate?: any): string {
  const phoneNumber = userPhoneNumber || companyData?.phone || "+639XXXXXXXXX"
  const companyName = companyData?.company_name || ""
  const companyLocation = companyData?.company_location || ""
  const companyEmail = companyData?.email || "noreply@ohplus.ph"
  const companyWebsite = companyData?.website || "www.ohplus.ph"
  const companyLogo = companyData?.logo || ""

  // User data for signature
  const firstName = userData?.first_name || ""
  const middleName = userData?.middle_name || ""
  const lastName = userData?.last_name || ""
  const userPosition = (userData?.position && userData.position.trim() !== '') ? userData.position :
                      (userData?.department && userData.department.trim() !== '') ? userData.department :
                      "Sales Team"
  const userEmail = userData?.email || ""

  //Cost estimate date
  const costEstimateId = costEstimate?.id || ""

  const processedBody = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`)
    .join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyName} - Cost Estimate</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 40px;
            display: flex;                /* Make elements in a row */
            align-items: center;          /* Vertically center logo + text */
            justify-content: flex-start;  /* Align everything to the left */
            gap: 12px; 
            text-align: left;
            flex-direction: column;
            overflow: visible;        /* Allow shape to extend outside */
            border: 2px solid red;

        }
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
            height: 60px; /* adjust as needed */
            width: 60px;
        }
        .logo-link {
            text-decoration: none; /* remove underline */
            color: inherit; /* keep the text color same */
        }

        .logo-link:hover {
            opacity: 0.8; /* optional: add a hover effect */
        }

        .half-circle {
            position: absolute;
            right: 0px;
            top: 0;
            width: 50px;
            height: 100px;
            background: #ffffff;     /* color of the half circle */
            border-radius: 50% 0 0 50%;
            z-index: -1;
        }

        .tagline {
            color: #e8eaff;
            font-size: 14px;
            margin: 5px 0 0 0;
            font-weight: 300;
        }
        .content {
            padding: 40px;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .highlight-box {
            background-color: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
        }
        .cta-button:link,
        .cta-button:visited,
        .cta-button:hover,
        .cta-button:active {
            color: #ffffff !important;
            text-decoration: none !important;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px 40px;
            border-top: 1px solid #e9ecef;
        }
        .signature {
            margin-bottom: 20px;
        }
        .signature-name {
            font-weight: 600;
            color: #667eea;
            font-size: 18px;
            margin-bottom: 5px;
        }
        .signature-title {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .contact-info {
            font-size: 14px;
            color: #6c757d;
            line-height: 1.4;
        }
        .contact-info strong {
            color: #495057;
        }
        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 20px 0;
        }
        .disclaimer {
            font-size: 12px;
            color: #adb5bd;
            text-align: center;
            margin-top: 20px;
            line-height: 1.4;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .header, .content, .footer {
                padding: 20px !important;
            }
            .logo {
                font-size: 24px;
            }
        }
            
    </style>
</head>
<body>
    <div class="email-container">
    <div style="
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 40px;
      border-radius: 8px;
      overflow: visible;
    ">
      <!-- Circle shape -->
      <div style="
        position: absolute;
        right: -60px;
        top: 50%;
        transform: translateY(-50%);
        width: 160px;
        height: 160px;
        background: #f5b642;
        border-radius: 50%;
        z-index: 1;
      "></div>

      <!-- Table content -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; position: relative; z-index: 2;">
        <tr>
          <td style="vertical-align: middle;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px;">
                  <a href="/" style="text-decoration: none;">
                    <img
                      src="${companyLogo}"
                      alt="${companyName} Logo"
                      width="70"
                      height="70"
                      style="display: block;"
                    />
                  </a>
                </td>
                <td>
                  <h1 style="
                    margin: 0;
                    font-size: 20px;
                    color: #ffffff;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                  ">
                    ${companyName}
                  </h1>
                  <p style="
                    margin: 4px 0 0;
                    font-size: 14px;
                    color: #e8eaff;
                    font-family: Arial, sans-serif;
                  ">
                    ${companyLocation}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>



        <div class="content">
            ${processedBody}

            <div class="highlight-box">
                <p style="margin: 0; font-weight: 500; color: #495057;">
                </p>
            </div>

            <div class="cta-section">
                <a href="https://mrk.ohplus.ph/ce/${costEstimateId}" class="cta-button">View</a>
            </div>
        </div>

        <div class="footer">
            <div class="contact-info">
                <strong>${companyName}</strong><br>
                ${firstName} ${middleName} ${lastName}<br>
                ${phoneNumber}<br>
                ${userEmail}<br>
            </div>

            <div class="divider"></div>

            <div class="disclaimer">
                This email contains confidential information intended only for the recipient.
                If you have received this email in error, please notify the sender and delete this message.
            </div>
        </div>
    </div>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Parse JSON payload
    const {
      costEstimate,
      clientEmail,
      client,
      currentUserEmail,
      ccEmail,
      replyToEmail,
      subject,
      body,
      preGeneratedPDFs,
      uploadedFiles,
      userData
    } = await request.json()

    console.log("[v0] Cost estimate email sending - Subject:", subject)
    console.log("[v0] Cost estimate email sending - Client email:", clientEmail)
    console.log("[v0] Cost estimate email sending - Current user email (reply-to):", currentUserEmail)

    if (!body || body.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty body")
      return NextResponse.json({ error: "Email body cannot be empty" }, { status: 400 })
    }

    if (!subject || subject.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty subject")
      return NextResponse.json({ error: "Email subject cannot be empty" }, { status: 400 })
    }

    if (!clientEmail || clientEmail.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty client email")
      return NextResponse.json({ error: "Client email cannot be empty" }, { status: 400 })
    }

    // Use pre-generated PDFs from frontend or generate fallback
    console.log("[v0] Using pre-generated PDFs from frontend...")
    let attachments: Array<{ filename: string; content: any }> = []
    let attachmentDetails: EmailAttachment[] = []

    const companyId = userData?.company_id || costEstimate.company_id || "unknown"

    if (preGeneratedPDFs && preGeneratedPDFs.length > 0) {
      // Use pre-generated PDFs from frontend
      console.log(`[v0] Using ${preGeneratedPDFs.length} pre-generated PDFs`)
      attachments = preGeneratedPDFs.map((pdf: any) => ({
        filename: pdf.filename,
        content: Buffer.from(pdf.content, 'base64'),
      }))

      // Upload pre-generated PDFs to storage and create attachment details
      for (const pdf of preGeneratedPDFs) {
        try {
          const fileUrl = await uploadFileToStorage(
            Buffer.from(pdf.content, 'base64'),
            pdf.filename,
            'application/pdf',
            companyId,
          )
          attachmentDetails.push({
            fileName: pdf.filename,
            fileSize: Buffer.from(pdf.content, 'base64').length,
            fileType: 'application/pdf',
            fileUrl: fileUrl,
          })
        } catch (error) {
          console.error(`Failed to upload PDF ${pdf.filename}:`, error)
        }
      }
    } else {
      // Fallback: Generate PDF on server with userData
      console.log("[v0] No pre-generated PDFs, generating on server...")
      const pdfBuffer = await generateCostEstimatePDF(costEstimate, undefined, false, userData)
      if (!pdfBuffer) {
        console.error("[v0] Failed to generate PDF")
        return NextResponse.json({ error: "Failed to generate PDF attachment" }, { status: 500 })
      }
      const filename = `cost-estimate-${costEstimate.costEstimateNumber || costEstimate.id}.pdf`
      attachments = [{
        filename: filename,
        content: pdfBuffer,
      }]

      // Upload generated PDF to storage
      try {
        const pdfBufferData = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
        const fileUrl = await uploadFileToStorage(pdfBufferData, filename, 'application/pdf', companyId)
        attachmentDetails.push({
          fileName: filename,
          fileSize: pdfBufferData.length,
          fileType: 'application/pdf',
          fileUrl: fileUrl,
        })
      } catch (error) {
        console.error(`Failed to upload generated PDF ${filename}:`, error)
      }
    }

    // Add uploaded files as attachments
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log(`[v0] Adding ${uploadedFiles.length} uploaded files`)
      const uploadedAttachments = uploadedFiles.map((file: any) => ({
        filename: file.filename,
        content: Buffer.from(file.content, 'base64'),
        type: file.type,
      }))
      attachments.push(...uploadedAttachments)

      // Upload uploaded files to storage and create attachment details
      for (const file of uploadedFiles) {
        try {
          const fileBuffer = Buffer.from(file.content, 'base64')
          const fileUrl = await uploadFileToStorage(
            fileBuffer,
            file.filename,
            file.type,
            companyId
          )
          attachmentDetails.push({
            fileName: file.filename,
            fileSize: fileBuffer.length,
            fileType: file.type,
            fileUrl: fileUrl,
          })
        } catch (error) {
          console.error(`Failed to upload file ${file.filename}:`, error)
        }
      }
    }

    // Fetch company data for email template
    const companyData = await fetchCompanyData(companyId)

    // Prepare email data
    const from = `${companyData.company_name} <${companyData.email}>`
    const to = [clientEmail]
    const cc = ccEmail ? ccEmail.split(",").map((email: string) => email.trim()).filter(Boolean) : []

    // Send email using Resend
    const emailData: any = {
      from,
      to,
      subject: subject.trim(),
      html: createEmailTemplate(body.trim(), userData?.phone_number, companyData, userData,costEstimate),
      attachments,
    }

    // Add CC if provided
    if (cc.length > 0) {
      emailData.cc = cc
    }

    // Add reply-to if replyToEmail is provided, otherwise use current user email
    if (replyToEmail && replyToEmail.trim().length > 0) {
      emailData.reply_to = replyToEmail.trim()
    } else if (currentUserEmail && currentUserEmail.trim().length > 0) {
      emailData.reply_to = currentUserEmail.trim()
    }

    console.log("[v0] Email sending - Sending to Resend API with reply-to:", emailData.reply_to)
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Cost estimate email sent successfully:", data?.id)

    // Create email document in emails collection
    try {
      const emailDocument = {
        from: from,
        to: to,
        cc: cc.length > 0 ? cc : null,
        replyTo: emailData.reply_to,
        subject: subject.trim(),
        body: body.trim(),
        attachments: attachmentDetails.length > 0 ? attachmentDetails : undefined,
        email_type: "cost_estimate",
        costEstimateId: costEstimate.id,
        templateId: undefined, // No template used for cost estimates
        reportId: undefined,
        status: "sent" as const,
        userId: userData?.email || currentUserEmail || "unknown",
        company_id: userData?.company_id || costEstimate.company_id,
        created: Timestamp.fromDate(new Date()),
        sentAt: Timestamp.fromDate(new Date()),
        updated: Timestamp.fromDate(new Date()),
      }

      const emailId = await emailService.createEmail(emailDocument)
      console.log("[v0] Email document created successfully:", emailId)
    } catch (emailDocError) {
      console.error("[v0] Failed to create email document:", emailDocError)
      // Don't fail the entire request if email document creation fails
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Send cost estimate email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
