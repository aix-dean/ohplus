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

// Function to extract dominant color from base64 image data
async function extractDominantColor(base64DataUri: string): Promise<string | null> {
  try {
    // Extract base64 data from data URI
    const base64Data = base64DataUri.split(',')[1]
    if (!base64Data) {
      console.error('Invalid base64 data URI format')
      return null
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Dynamically import node-vibrant to avoid ES module issues
    let Vibrant: any
    try {
      console.log('Attempting to import node-vibrant...')
      // Use named import for node-vibrant v4+
      const vibrantModule = await import('node-vibrant/node')
      Vibrant = vibrantModule.Vibrant
      console.log('node-vibrant imported successfully')
    } catch (error) {
      console.error('Failed to import node-vibrant:', error)
      return null // Return null if node-vibrant is not available
    }

    // Get color palette from the image buffer using node-vibrant
    const palette = await Vibrant.from(imageBuffer).getPalette()

    if (!palette) {
      console.error('Failed to extract color palette from image')
      return null
    }

    // Log all available palette swatches for debugging
    console.log('Available palette swatches:', Object.keys(palette))

    // Get the dominant color (Vibrant swatch)
    const dominantColor = palette.Vibrant

    if (!dominantColor) {
      console.error('No dominant color found in palette')
      // Try alternative swatches if Vibrant is not available
      const alternativeSwatches = ['Muted', 'DarkVibrant', 'DarkMuted', 'LightVibrant', 'LightMuted']
      for (const swatchName of alternativeSwatches) {
        if (palette[swatchName]) {
          console.log(`Using alternative swatch: ${swatchName}`)
          const altDominantColor = palette[swatchName]
          const hexColor = rgbToHex(
            Math.round(altDominantColor.rgb[0]),
            Math.round(altDominantColor.rgb[1]),
            Math.round(altDominantColor.rgb[2])
          )
          console.log('Alternative dominant color extracted:', hexColor)
          return hexColor
        }
      }
      console.error('No suitable color swatch found in the palette')
      return null
    }

    // Convert RGB values to hex format
    const hexColor = rgbToHex(
      Math.round(dominantColor.rgb[0]),
      Math.round(dominantColor.rgb[1]),
      Math.round(dominantColor.rgb[2])
    )

    console.log('Dominant color extracted:', hexColor)
    return hexColor

  } catch (error) {
    console.error('Error extracting dominant color:', error)
    return null
  }
}

// Helper function to convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

// Helper function to shade a color by a percentage
function shadeColor(color: string, percent: number): string {
  // Remove # if present
  color = color.replace('#', '')

  // Parse r, g, b values
  const num = parseInt(color, 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt

  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1).toUpperCase()
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
  proposalId?: string,
  dominantColor?: string,
  proposalPassword?: string
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
            background-color: #d9dfe6ff;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: #ffffff;
            padding: 20px 40px;
            position: relative;
            overflow: hidden;
        }
        .header-circles {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .header-circle-1 {
            position: absolute;
            top: -70px;
            right: -90px;
            width: 240px;
            height: 240px;
            border-radius: 50%;
            background: ${dominantColor || '#667eea'};
            opacity: 1.0;
            z-index: 2;
        }
        .header-circle-2 {
            position: absolute;
            top: -50px;
            right: 20px;
            width: 220px;
            height: 220px;
            border-radius: 50%;
background: ${dominantColor 
  ? `rgba(${parseInt(dominantColor.slice(1,3),16)}, ${parseInt(dominantColor.slice(3,5),16)}, ${parseInt(dominantColor.slice(5,7),16)}, 0.5)` 
  : ''};
            opacity: 0.8;
            z-index: 1;
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
            width: 100px;
            text-align: left;
        }
        .company-cell {
            text-align: left;
        }
        .empty-cell {
            width: 120px;
        }
        .logo {
            height: 40px;
            width: auto;
            max-width: 300px;
            margin-bottom: 10px;
        }
        .company-name {
            color: #2c3e50;
            font-size: 20px;
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
    background-color: #eaeaea;
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
            background: ${dominantColor || '#667eea'};
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
    background-color: #ffffff;
    padding: 0px 0px 0px 30px; /* top:20px, right:0, bottom:0px, left:30px */
}

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-left-column {
            width: 40%;
            vertical-align: top;
            padding-right: 20px;
            padding-bottom: 20px;
        }
        .footer-right-column {
            width: 60%;
            vertical-align: top;
            position: relative;
            overflow: hidden;
            padding-right: 0;
            margin-right: 0;
        }
        .footer-left-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .footer-logo-company-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 8px;
        }
        .footer-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .footer-company-name {
            margin: 0;
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.2;
        }
        .sales-info {
            margin: 0;
            padding: 0;
        }
        .sales-name {
            margin: 0;
            padding: 0;
            font-size: 12px;
            font-weight: 600;
        }
        .sales-position {
            margin: 0;
            padding: 0;
            color: #6c757d;
            font-size: 11px;
            font-weight: normal;
            font-style: normal;
        }
        .sales-contact {
            margin: 0;
            padding: 0;
            color: #6c757d;
            font-size: 11px;
        }
        .footer-circles {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .footer-circle-1 {
            position: absolute;
            top: -50px;
            right: -130px;
            width: 270px;
            height: 270px;
            border-radius: 50%;
            background: ${dominantColor || '#667eea'};
            opacity: 1.0;
            z-index: 2;
        }
        .footer-circle-2 {
            position: absolute;
            top: -50px;
            right: -60px;
            width: 290px;
            height: 290px;
            border-radius: 50%;
background: ${dominantColor 
  ? `rgba(${parseInt(dominantColor.slice(1,3),16)}, ${parseInt(dominantColor.slice(3,5),16)}, ${parseInt(dominantColor.slice(5,7),16)}, 0.5)` 
  : ''};            opacity: 0.8;
            z-index: 1;
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
            .header-circles {
                display: none !important;
            }
            .footer-circles {
                display: none !important;
            }
            .footer-table {
                display: block !important;
            }
            .footer-left-column,
            .footer-right-column {
                display: block !important;
                width: 100% !important;
            }
            .footer-left-column {
                text-align: center !important;
            }
            .footer-right-column {
                position: relative !important;
                height: 150px !important;
            }
            .footer-left-content {
                align-items: center !important;
                text-align: center !important;
            }
            .footer-logo-company-row {
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                gap: 8px !important;
            }
            .footer-company-name {
                font-size: 14px !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
 
    <div class="header">
        <div class="header-circles">
            <div class="header-circle-1"></div>
            <div class="header-circle-2"></div>
        </div>
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    ${companyLogo ? `<img src="${companyLogo}" alt="${companyName || 'Company'} Logo" class="logo" style="display: block; height: 60px; width: auto; max-width: 100px;" height="60" width="auto">` : ''}
                </td>
                <td class="company-cell">
                    <h1 class="company-name">${companyName || "Company"}</h1>
                    ${companyAddress ? `<p class="company-address" style="margin: 5px 0 0 0; color: #34495e; font-size: 12px;">${companyAddress}</p>` : ''}
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
                <a href="https://mrk.ohplus.ph/pr/${proposalId || ''}" class="cta-button">View</a>
            </div>
<!--
            ${proposalPassword ? `
            <div class="highlight-box" style="border-left-color: ${dominantColor || '#667eea'} !important;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔐 Access Code</h4>
                <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: ${dominantColor || '#667eea'}; background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">${proposalPassword}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d;">Please use this code to access the proposal online.</p>
            </div>
            ` : ''}
            -->
        </div>
        
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-left-column">
                        <div class="footer-left-content">
                            <div class="footer-logo-company-row">
                                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName || 'Company'} Logo" class="footer-logo">` : ''}
                                <h3 class="footer-company-name">${companyName || "Company"}</h3>
                            </div>
                            <div class="sales-info">
                                <h4 class="sales-name" style="color: #000000; margin: 0 0 0; font-size: 14px; font-weight: 600;">${userDisplayName || "Sales Executive"}</h4>
                                <p class="sales-position" style="margin: 0; color: #030404ff; font-size: 11px;">Sales Executive</p>
                                ${replyTo ? `<p class="sales-contact" style="margin: 0; color: #030404ff; font-size: 11px;">${replyTo}</p>` : ''}
                                ${userPhoneNumber ? `<p class="sales-contact" style="margin: 0; color: #030404ff; font-size: 11px;">${userPhoneNumber}</p>` : ''}
                            </div>
                        </div>
                    </td>
                    <td class="footer-right-column">
                        <div class="footer-circles">
                            <div class="footer-circle-1"></div>
                            <div class="footer-circle-2"></div>
                        </div>
                    </td>
                </tr>
            </table>
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
    const proposalPassword = formData.get("proposalPassword") as string

    // Validate and sanitize userDisplayName for security and data integrity
    let validatedUserDisplayName = userDisplayName
    if (!validatedUserDisplayName || typeof validatedUserDisplayName !== 'string' || validatedUserDisplayName.trim().length === 0) {
      console.error("[v0] User display name validation failed - missing or empty")
      return NextResponse.json({
        error: "User display name is required and cannot be empty"
      }, { status: 400 })
    }

    // Sanitize userDisplayName to prevent XSS attacks
    validatedUserDisplayName = validatedUserDisplayName.trim()
    // HTML escape the userDisplayName for safe template insertion
    validatedUserDisplayName = validatedUserDisplayName
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')

    console.log("[v0] User display name validated and sanitized:", validatedUserDisplayName)

    // Validate and sanitize currentUserPhoneNumber for security
    let validatedPhoneNumber = currentUserPhoneNumber
    if (validatedPhoneNumber && typeof validatedPhoneNumber === 'string') {
      validatedPhoneNumber = validatedPhoneNumber.trim()
      // Basic phone number sanitization - remove potentially dangerous characters
      validatedPhoneNumber = validatedPhoneNumber.replace(/[<>\"']/g, '')
      console.log("[v0] Phone number sanitized:", validatedPhoneNumber)
    }

    // Validate and sanitize replyTo email for security
    let validatedReplyTo = replyTo
    if (validatedReplyTo && typeof validatedReplyTo === 'string') {
      validatedReplyTo = validatedReplyTo.trim()
      // Basic email sanitization - remove potentially dangerous characters
      validatedReplyTo = validatedReplyTo.replace(/[<>\"']/g, '')
      console.log("[v0] Reply-to email sanitized:", validatedReplyTo)
    }

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

          // Safely extract company data with validation
          if (companyData?.name && typeof companyData.name === 'string') {
            actualCompanyName = companyData.name
            console.log("[v0] Company name set to:", actualCompanyName)
          }
          if (companyData?.website && typeof companyData.website === 'string') {
            actualCompanyWebsite = companyData.website
          }
          if (companyData?.address) {
            if (typeof companyData.address === 'object' && companyData.address !== null) {
              // Format address object to string
              const addr = companyData.address
              const addressParts = []
              if (addr.street && typeof addr.street === 'string') addressParts.push(addr.street)
              if (addr.city && typeof addr.city === 'string') addressParts.push(addr.city)
              if (addr.state && typeof addr.state === 'string') addressParts.push(addr.state)
              if (addr.zip && typeof addr.zip === 'string') addressParts.push(addr.zip)
              if (addr.country && typeof addr.country === 'string') addressParts.push(addr.country)
              actualCompanyAddress = addressParts.join(', ')
              console.log("[v0] Company address object:", companyData.address)
              console.log("[v0] Company address formatted to:", actualCompanyAddress)
            } else if (typeof companyData.address === 'string') {
              actualCompanyAddress = companyData.address
              console.log("[v0] Company address string set to:", actualCompanyAddress)
            }
          }
          if (companyData?.photo_url && typeof companyData.photo_url === 'string') {
            // Use Firebase photo_url as fallback only if no FormData logo provided
            if (!actualCompanyLogo) {
              actualCompanyLogo = companyData.photo_url
              console.log("[v0] Using Firebase photo_url as company logo:", actualCompanyLogo)
            }
          }
        } else {
          console.log("[v0] Company document not found for ID:", companyId)
        }
      } catch (error) {
        console.error("[v0] Error fetching company data:", error)
        // Continue with fallback values - not a critical failure
      }
    }

    // Convert logo URL to data URI for email compatibility
    let logoDataUri = null
    let dominantColor = null
    if (actualCompanyLogo) {
      try {
        console.log("[v0] Converting logo URL to data URI:", actualCompanyLogo)
        logoDataUri = await imageUrlToDataUri(actualCompanyLogo)
        if (logoDataUri) {
          console.log("[v0] Successfully converted logo to data URI")

          // Extract dominant color from the logo
          dominantColor = await extractDominantColor(logoDataUri)
          if (dominantColor) {
            console.log("[v0] Successfully extracted dominant color:", dominantColor)
          } else {
            console.log("[v0] Failed to extract dominant color, using fallback color #667eea")
            dominantColor = undefined // Explicitly set to undefined for fallback
          }
        } else {
          console.log("[v0] Failed to convert logo to data URI, using original URL")
        }
      } catch (error) {
        console.error("[v0] Error processing company logo:", error)
        // Continue without logo - not a critical failure
        logoDataUri = null
        dominantColor = null
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

    // Validate required fields with enhanced user data validation
    if (!body || body.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty body")
      return NextResponse.json({ error: "Email body cannot be empty" }, { status: 400 })
    }

    if (!subject || subject.trim().length === 0) {
      console.error("[v0] Email sending failed - Empty subject")
      return NextResponse.json({ error: "Email subject cannot be empty" }, { status: 400 })
    }

    if (!toJson) {
      console.error("[v0] Email sending failed - Missing recipients")
      return NextResponse.json({ error: "Email recipients are required" }, { status: 400 })
    }

    // Enhanced user data validation
    if (!currentUserPhoneNumber || currentUserPhoneNumber.trim().length === 0) {
      console.warn("[v0] User phone number missing - using fallback")
      // This is not critical, but log it for monitoring
    }

    if (!replyTo || replyTo.trim().length === 0) {
      console.warn("[v0] Reply-to email missing - using fallback")
      // This is not critical, but log it for monitoring
    }

    // Validate company information for better error reporting
    if (!companyId) {
      console.warn("[v0] Company ID missing - using fallback company information")
    }

    if (!actualCompanyName || actualCompanyName === "Company") {
      console.warn("[v0] Company name not properly resolved - using fallback")
    }

    // Parse JSON strings with error handling
    let to: string[]
    let cc: string[] | undefined

    try {
      to = JSON.parse(toJson)
      if (!Array.isArray(to) || to.length === 0) {
        console.error("[v0] Invalid 'to' field: must be a non-empty array")
        return NextResponse.json({ error: "Email recipients (to) must be a non-empty array" }, { status: 400 })
      }
    } catch (error) {
      console.error("[v0] Failed to parse 'to' JSON:", error)
      return NextResponse.json({ error: "Invalid email recipients format" }, { status: 400 })
    }

    try {
      cc = ccJson ? JSON.parse(ccJson) : undefined
      if (cc && (!Array.isArray(cc) || cc.length === 0)) {
        console.error("[v0] Invalid 'cc' field: must be a non-empty array if provided")
        return NextResponse.json({ error: "Email CC recipients must be a non-empty array if provided" }, { status: 400 })
      }
    } catch (error) {
      console.error("[v0] Failed to parse 'cc' JSON:", error)
      return NextResponse.json({ error: "Invalid email CC recipients format" }, { status: 400 })
    }

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
      html: createEmailTemplate(body.trim(), validatedPhoneNumber, actualCompanyName, actualCompanyWebsite, actualCompanyAddress, validatedUserDisplayName, validatedReplyTo, logoDataUri || actualCompanyLogo, proposalId, dominantColor || undefined, proposalPassword),
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
