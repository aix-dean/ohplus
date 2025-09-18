import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const resend = new Resend(process.env.RESEND_API_KEY)

function createEmailTemplate(
  body: string,
  userPhoneNumber?: string,
  companyName?: string,
  companyWebsite?: string,
  userDisplayName?: string,
  replyTo?: string
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
            text-align: center;
        }
        .logo {
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
            .logo {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">${companyName || "Company"}</h1>
            <p class="tagline">Premium Outdoor Advertising Solutions</p>
        </div>
        
        <div class="content">
            ${processedBody}
            
            <div class="highlight-box">
                <p style="margin: 0; font-weight: 500; color: #495057;">
                    📋 <strong>What's Included:</strong><br>
                    • Detailed site information and specifications<br>
                    • Competitive pricing based on our discussion<br>
                    • High-quality billboard placement options<br>
                    • Professional campaign management
                </p>
            </div>
            
            <div class="cta-section">
                <p style="margin-bottom: 20px; color: #6c757d;">Ready to move forward with your campaign?</p>
                <a href="mailto:${replyTo || (userDisplayName ? userDisplayName.replace(/\s+/g, '').toLowerCase() : 'noreply') + '@ohplus.ph'}" class="cta-button">Get In Touch</a>
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
                ${companyWebsite && companyWebsite !== 'www.ohplus.ph' ? `🌐 ${companyWebsite}` : ''}
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

    // Get actual company name from database if companyId is provided
    let actualCompanyName = companyName || "Company"
    let actualCompanyWebsite = companyWebsite

    if (companyId) {
      try {
        const companyDocRef = doc(db, "companies", companyId)
        const companyDocSnap = await getDoc(companyDocRef)

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data()
          if (companyData.name) {
            actualCompanyName = companyData.name
          }
          if (companyData.website) {
            actualCompanyWebsite = companyData.website
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        // Continue with fallback values
      }
    }

    // Create from address using company information
    const from = `${actualCompanyName} <noreply@ohplus.ph>`

    console.log("[v0] Email sending - Subject:", subject)
    console.log("[v0] Email sending - Body length:", body?.length)
    console.log("[v0] Email sending - Body preview:", body?.substring(0, 100))

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

    while (true) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      if (!file) break

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      attachments.push({
        filename: file.name,
        content: buffer,
      })

      attachmentIndex++
    }

    console.log("[v0] Email sending - Attachments count:", attachments.length)

    // Send email using Resend
    const emailData: any = {
      from,
      to,
      subject: subject.trim(),
      html: createEmailTemplate(body.trim(), currentUserPhoneNumber, actualCompanyName, actualCompanyWebsite, userDisplayName, replyTo),
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
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Send email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
