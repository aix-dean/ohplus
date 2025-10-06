import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const resend = new Resend(process.env.RESEND_API_KEY)

// Function to convert image URL to base64 data URI
async function imageUrlToDataUri(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Invalid content type for image:', contentType)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Error converting image to data URI:', error)
    return null
  }
}

function createEmailTemplate(
  body: string,
  userPhoneNumber?: string,
  companyName?: string,
  companyWebsite?: string,
  companyAddress?: string,
  userDisplayName?: string,
  replyTo?: string,
  companyLogo?: string,
  proposalId?: string
): string {
  const phoneNumber = userPhoneNumber || "+639XXXXXXXXX"

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
    <title>${companyName || "Company"} - Proposal</title>
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
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
            padding: 0 10px;
        }
        .logo-cell {
            width: 120px;
            text-align: left;
        }
        .company-cell {
            text-align: center;
        }
        .empty-cell {
            width: 120px;
        }
        .logo {
            height: 60px;
            width: auto;
            max-width: 300px;
            margin-bottom: 10px;
        }
        .company-name {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
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
            .header-table {
                display: block !important;
            }
            .header-table tr {
                display: block !important;
                text-align: center !important;
            }
            .header-table td {
                display: block !important;
                width: 100% !important;
                padding: 10px 0 !important;
            }
            .logo {
                height: 50px !important;
                max-width: 150px !important;
            }
            .company-name {
                font-size: 24px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
 
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    ${companyLogo ? `<img src="${companyLogo}" alt="${companyName || 'Company'} Logo" class="logo" style="display: block; height: 60px; width: auto; max-width: 100px;" height="60" width="auto">` : ''}
                </td>
                <td class="company-cell">
                    <h1 class="company-name">${companyName || "Company"}</h1>
                    ${companyAddress ? `<p class="company-address" style="margin: 5px 0 0 0; color: #e8eaff; font-size: 14px;">${companyAddress}</p>` : ''}
                </td>
                <td class="empty-cell">
                    <!-- Empty column -->
                </td>
            </tr>
        </table>
    </div>
        
        <div class="content">
            ${processedBody}
            

            
            <div class="cta-section">
                <p style="margin-bottom: 20px; color: #6c757d;">Ready to move forward with your campaign?</p>
                <a href="https://mrk.ohplus.ph/pr/${proposalId || ''}" class="cta-button">View</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">
                <div class="signature-name">${userDisplayName || "Sales Executive"}</div>
                <div class="signature-title">${companyName || "Company"} - Outdoor Advertising</div>
            </div>

            <div class="contact-info">
                <strong>${companyName || "Company"}</strong><br>
                📞 ${phoneNumber}<br>
                📧 ${replyTo || (userDisplayName ? userDisplayName.replace(/\s+/g, '').toLowerCase() : 'noreply') + '@ohplus.ph'}<br>
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
    // Parse FormData
    const formData = await request.formData()

    // Extract email data
    const toJson = formData.get("to") as string
    const ccJson = formData.get("cc") as string
    const replyTo = formData.get("replyTo") as string
    const subject = formData.get("subject") as string
    const body = formData.get("body") as string
    const currentUserPhoneNumber = formData.get("currentUserPhoneNumber") as string
    const companyId = formData.get("companyId") as string
    const companyName = formData.get("companyName") as string
    const companyWebsite = formData.get("companyWebsite") as string
    const userDisplayName = formData.get("userDisplayName") as string
    const companyLogo = formData.get("companyLogo") as string
    const proposalId = formData.get("proposalId") as string

    // Get actual company name from database if companyId is provided
    let actualCompanyName = companyName || "Company"
    let actualCompanyWebsite = companyWebsite
    let actualCompanyAddress = ""
    let actualCompanyLogo = companyLogo || ""

    if (companyId) {
      try {
        const companyDocRef = doc(db, "companies", companyId)
        const companyDocSnap = await getDoc(companyDocRef)

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data()
          console.log("[v0] Company data retrieved from database:", companyData)
          if (companyData.name) {
            actualCompanyName = companyData.name
            console.log("[v0] Company name set to:", actualCompanyName)
          }
          if (companyData.website) {
            actualCompanyWebsite = companyData.website
          }
          if (companyData.address && typeof companyData.address === 'object') {
            // Format address object to string
            const addr = companyData.address
            const addressParts = []
            if (addr.street) addressParts.push(addr.street)
            if (addr.city) addressParts.push(addr.city)
            if (addr.state) addressParts.push(addr.state)
            if (addr.zip) addressParts.push(addr.zip)
            if (addr.country) addressParts.push(addr.country)
            actualCompanyAddress = addressParts.join(', ')
            console.log("[v0] Company address object:", companyData.address)
            console.log("[v0] Company address formatted to:", actualCompanyAddress)
          } else if (companyData.address && typeof companyData.address === 'string') {
            actualCompanyAddress = companyData.address
            console.log("[v0] Company address string set to:", actualCompanyAddress)
          }
          if (companyData.photo_url) {
            actualCompanyLogo = companyData.photo_url
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        // Continue with fallback values
      }
    }

    // Convert logo URL to data URI for email compatibility
    let logoDataUri = null
    if (actualCompanyLogo) {
      console.log("[v0] Converting logo URL to data URI:", actualCompanyLogo)
      logoDataUri = await imageUrlToDataUri(actualCompanyLogo)
      if (logoDataUri) {
        console.log("[v0] Successfully converted logo to data URI")
      } else {
        console.log("[v0] Failed to convert logo to data URI, using original URL")
      }
    }

    // Create from address using company information
    // Check for verified domain in environment variables first
    const verifiedDomain = process.env.RESEND_VERIFIED_DOMAIN
    let from: string

    if (verifiedDomain) {
      // Use verified domain if available
      // Sanitize company name to remove special characters that break email format
      const sanitizedCompanyName = actualCompanyName.replace(/[<>\[\]{}|\\^`]/g, '').trim()
      from = `${sanitizedCompanyName} <noreply@${verifiedDomain}>`
    } else {
      // Fallback to default - this may not work if no domains are verified
      from = `noreply@resend.dev`
    }

    console.log("[v0] Email sending - Subject:", subject)
    console.log("[v0] Email sending - Body length:", body?.length)
    console.log("[v0] Email sending - Body preview:", body?.substring(0, 100))
    console.log("[v0] Email sending - Company Logo URL:", actualCompanyLogo)
    console.log("[v0] Email sending - Logo Data URI available:", !!logoDataUri)

    if (!body || body.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty body")
      return NextResponse.json({ error: "Email body cannot be empty" }, { status: 400 })
    }

    if (!subject || subject.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty subject")
      return NextResponse.json({ error: "Email subject cannot be empty" }, { status: 400 })
    }

    // Parse JSON strings
    const to = JSON.parse(toJson)
    const cc = ccJson ? JSON.parse(ccJson) : undefined

    // Process file attachments
    const attachments = []
    let attachmentIndex = 0
    let totalAttachmentSize = 0

    while (true) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      if (!file) break

      // Validate file
      if (file.size === 0) {
        console.error(`[v0] Empty attachment file: ${file.name}`)
        return NextResponse.json({
          error: `Attachment "${file.name}" appears to be empty. Please try regenerating the PDF.`
        }, { status: 400 })
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Additional validation
      if (buffer.length === 0) {
        console.error(`[v0] Failed to read attachment file: ${file.name}`)
        return NextResponse.json({
          error: `Failed to process attachment "${file.name}". Please try again.`
        }, { status: 400 })
      }

      attachments.push({
        filename: file.name,
        content: buffer,
      })

      totalAttachmentSize += buffer.length
      attachmentIndex++
    }

    // Check total attachment size
    // Note: Resend has a 40MB limit, but allowing higher limit for flexibility with other email services
    const maxSize = 500 * 1024 * 1024 // 500MB limit (configurable)
    if (totalAttachmentSize > maxSize) {
      console.error(`[v0] Total attachment size exceeds limit: ${(totalAttachmentSize / (1024 * 1024)).toFixed(2)}MB`)
      return NextResponse.json({
        error: `Total attachment size (${(totalAttachmentSize / (1024 * 1024)).toFixed(2)}MB) exceeds the ${maxSize / (1024 * 1024)}MB limit. Please reduce file sizes or remove attachments.`
      }, { status: 400 })
    }

    console.log("[v0] Email sending - Attachments count:", attachments.length)

    // Send email using Resend
    const emailData: any = {
      from,
      to,
      subject: subject.trim(),
      html: createEmailTemplate(body.trim(), currentUserPhoneNumber, actualCompanyName, actualCompanyWebsite, actualCompanyAddress, userDisplayName, replyTo, logoDataUri || actualCompanyLogo, proposalId),
    }

    if (cc && cc.length > 0) {
      emailData.cc = cc
    }

    if (replyTo && replyTo.trim()) {
      emailData.reply_to = replyTo.trim()
    }

    if (attachments.length > 0) {
      emailData.attachments = attachments
    }

    console.log("[v0] Email sending - Sending to Resend API")
    console.log("[v0] Email data:", {
      from,
      to: to.length,
      cc: cc?.length || 0,
      subject: subject.substring(0, 50) + "...",
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      totalAttachmentSize: attachments.reduce((sum, att) => sum + att.content.length, 0)
    })

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("[v0] Resend error:", error)
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message
      })

      // Provide more specific error messages
      let errorMessage = error.message || "Failed to send email"
      if (errorMessage.includes("domain")) {
        errorMessage = "Email domain not verified. Please go to your Resend dashboard (resend.com), add and verify your domain (ohplus.ph), then set RESEND_VERIFIED_DOMAIN environment variable to your verified domain."
      } else if (errorMessage.includes("attachment")) {
        errorMessage = "Attachment issue. Please check file sizes and try again."
      }

      return NextResponse.json({
        error: errorMessage,
        details: error.message
      }, { status: 400 })
    }

    console.log("[v0] Email sent successfully:", data?.id)
    console.log("[v0] Email delivery details:", {
      id: data?.id
    })

    return NextResponse.json({
      success: true,
      data,
      message: "Email sent successfully! If you don't receive it within a few minutes, please check your spam/junk folder. Note: Emails may take 1-5 minutes to deliver."
    })
  } catch (error) {
    console.error("[v0] Send email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
