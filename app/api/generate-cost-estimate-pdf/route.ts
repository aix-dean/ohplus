import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import type { CostEstimate } from '@/lib/types/cost-estimate'

// Helper functions from quotation PDF
const formatDate = (date: any) => {
  const dateObj = getDateObject(date)
  if (!dateObj) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

const formatDuration = (days: number, startDate?: any, endDate?: any): string => {
  // If we have actual dates, calculate based on calendar months
  if (startDate && endDate) {
    const start = getDateObject(startDate)
    const end = getDateObject(endDate)

    if (start && end) {
      let years = end.getFullYear() - start.getFullYear()
      let months = end.getMonth() - start.getMonth()
      let dayDiff = end.getDate() - start.getDate()

      // Adjust for negative months/days
      if (dayDiff < 0) {
        months--
        // Get days in previous month
        const prevMonth = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate())
        const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()
        dayDiff += daysInPrevMonth
      }

      if (months < 0) {
        years--
        months += 12
      }

      const parts = []
      if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`)
      if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`)
      if (dayDiff > 0) parts.push(`${dayDiff} ${dayDiff === 1 ? "day" : "days"}`)

      return parts.join(" and ") || "0 days"
    }
  }

  // Fallback to the old method if no dates provided
  if (days <= 0) return "1 month"

  const months = Math.floor(days / 30)
  const remainingDays = days % 30

  if (months === 0) {
    return `${days} day${days !== 1 ? "s" : ""}`
  } else if (remainingDays === 0) {
    return `${months} month${months !== 1 ? "s" : ""}`
  } else {
    return `${months} month${months !== 1 ? "s" : ""} and ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`
  }
}

const formatCompanyAddress = (companyData: any): string => {
  if (!companyData) return ""
  const parts = []
  if (companyData.company_location?.street) parts.push(companyData.company_location.street)
  if (companyData.company_location?.city) parts.push(companyData.company_location.city)
  if (companyData.company_location?.province) parts.push(companyData.company_location.province)
  if (companyData.zip) parts.push(companyData.zip)
  return parts.join(", ")
}

const calculateProratedPrice = (price: number, startDate: Date, endDate: Date): number => {
  let total = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Daily price for this month
    const dailyRate = price / daysInMonth;

    // Determine start and end days for this month
    let startDay = (currentDate.getMonth() === startDate.getMonth() && currentDate.getFullYear() === startDate.getFullYear())
      ? startDate.getDate()
      : 1;

    let endDay = (currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear())
      ? endDate.getDate()
      : daysInMonth;

    // Days counted in this month
    const daysCounted = (endDay - startDay + 1);

    // Add to total
    total += dailyRate * daysCounted;

    // Move to next month
    currentDate = new Date(year, month + 1, 1);
  }

  return total;
}

const getDateObject = (date: any): Date | undefined => {
  if (date === null || date === undefined) return undefined
  if (date instanceof Date) return date
  if (typeof date === "object" && date.toDate && typeof date.toDate === "function") {
    return date.toDate()
  }
  // Handle Firebase timestamp objects { seconds, nanoseconds }
  if (typeof date === "object" && date.seconds && typeof date.seconds === "number") {
    return new Date(date.seconds * 1000)
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) return parsedDate
  }
  return undefined
}

export async function POST(request: NextRequest) {
  const { costEstimate, companyData, logoDataUrl, format = 'pdf', userData }: { costEstimate: CostEstimate; companyData: any; logoDataUrl: string | null; format?: 'pdf' | 'image'; userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string } } = await request.json()
  console.log('Received cost estimate:', costEstimate)
  console.log('Received companyData:', companyData)
  console.log('Received logoDataUrl:', !!logoDataUrl)
  console.log('Received userData:', userData)
  console.log('Format:', format)

  try {
    // Generate HTML content
    const htmlContent = generateCostEstimateHTML(costEstimate, companyData, userData)

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div class="header" style="text-align: center; width: 100%; padding: 5px;">
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="height: 50px; margin-right: 10px;">` : ''}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
          <div>${companyData?.company_name || 'Company Name'}</div>
          <div>${formatCompanyAddress(companyData)}</div>
          <div>Tel: ${companyData?.phone || 'N/A'} | Email: ${companyData?.email || 'N/A'}</div>
        </div>
      `,
      margin: {
        top: '25mm',
        right: '10mm',
        bottom: '30mm',
        left: '10mm'
      }
    })
    const contentType = 'application/pdf'
    const filename = `${costEstimate.costEstimateNumber || costEstimate.id || 'cost-estimate'}.pdf`

    await browser.close()

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(`Error generating ${format}:`, error)
    return NextResponse.json({ error: `Failed to generate ${format}` }, { status: 500 })
  }
}

function generateCostEstimateHTML(
  costEstimate: CostEstimate,
  companyData: any,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string }
): string {
  // Group line items by site
  const groupLineItemsBySite = (lineItems: any[]) => {
    const siteGroups: { [key: string]: any[] } = {}

    lineItems.forEach((item) => {
      if (item.category.includes("Billboard Rental")) {
        const siteName = item.description
        if (!siteGroups[siteName]) {
          siteGroups[siteName] = []
        }
        siteGroups[siteName].push(item)

        const siteId = item.id
        const relatedItems = lineItems.filter(
          (relatedItem) => relatedItem.id.includes(siteId) && relatedItem.id !== siteId,
        )
        siteGroups[siteName].push(...relatedItems)
      }
    })

    if (Object.keys(siteGroups).length === 0) {
      siteGroups["Single Site"] = lineItems
    }

    return siteGroups
  }

  const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
  const sites = Object.keys(siteGroups)
  const isMultipleSites = sites.length > 1

  // Get the first site for main details
  const primarySite = sites[0]
  const siteLineItems = siteGroups[primarySite] || []
  const primaryRentalItem = siteLineItems.find((item) => item.category.includes("Billboard Rental"))

  const startDate = costEstimate.startDate || (costEstimate as any).contract_period?.start_date
  const endDate = costEstimate.endDate || (costEstimate as any).contract_period?.end_date

  // Calculate totals
  const subtotal = costEstimate.lineItems.reduce((sum, item) => sum + item.total, 0)
  const vatRate = 0.12
  const vatAmount = subtotal * vatRate
  const totalWithVat = subtotal + vatAmount

  const monthlyRate = primaryRentalItem ? primaryRentalItem.unitPrice : 0

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${costEstimate.costEstimateNumber}</title>
    <style>
    *{
      border-size: border-box;
      margin: 0;
      padding:0;
    }
      body {
        font-family: Arial, sans-serif;
        background: #fff;
        color: #333;
        line-height: 1.5;
        page-break-after: always;
      }
      .date-ref {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 14px;
      }
      .client-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .client-left p {
        margin: 2px 0;
        font-size: 14px;
        text-align: left;
      }
      .client-right p {
        font-size: 14px;
        text-align: right;
      }
      .closing-message{
        font-size: 14px;
          margin-top: 10px;
        }
      .title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .salutation {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .greeting {
        margin-bottom: 10px;
        font-size: 14px;
      }
      .details-header {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 14px;
      }
      .details-list {
        margin-bottom: 15px;
        font-size: 14px;
      }
      .details-list .detail-item {
        margin-bottom: 4px;
      }
      .details-list .label {
        font-weight: bold;
      }
      .price-breakdown-title {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 14px;
      }
      .price-breakdown {
        margin-bottom: 10px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        margin-bottom: 3px;
        margin-left: 20px;
        margin-right: 10px;
      }
      .price-total {
        font-weight: bold;
        border-top: 1px solid #858080ff;
        margin-top: 5px;
        padding-top: 4px;
      }
      .price-notes {
        margin-top: 10px;
        margin-bottom: 15px;
        font-size: 12px;
        color: gray;
        font-style: italic;
      }
      .price-notes p {
        font-style: italic;
      }
      .site-details {
        margin-bottom: 10px;
        font-size: 14px;
        page-break-inside: avoid;
      }
      .details-row {
        display: flex;
        margin-bottom: 4px;
      }
      .details-label {
        width: 180px;
      }
      .details-value {
        flex: 1;
      }
      .site-details ul {
        list-style-type: disc;
        padding-left: 20px;
      }
      .site-details li {
        margin-bottom: 6px;
      }
      .terms {
        margin-top: 10px;
        font-size: 13px;
        page-break-inside: avoid;
      }
      .terms-title {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 14px;
      }
      .term-item {
        margin-bottom: 3px;
      }
      .signatures {
        margin-top: 25px;
        page-break-inside: avoid;
      }
      .signature-section {
        font-size: 13px;
        margin-bottom: 20px;
      }
      .signature-line {
        font-weight: bold;
        border-bottom: 1px solid #000;
        margin-top: 10px;
        padding-top: 20px;
        max-width: 200px;
        margin-right: 0;
      }
    </style>
  </head>
  <body>
    <div class="date-ref">
      <div>${formatDate(new Date())}</div>
    </div>

    <div class="client-info">
      <div class="client-left">
        <p>${costEstimate.client?.name || "Client Name"}</p>
        <p>${costEstimate.client?.designation || "Position"}</p>
        <p><strong>${costEstimate.client?.company || "COMPANY NAME"}</strong></p>
      </div>
      <div class="client-right">
        <p>CE. No. ${costEstimate.costEstimateNumber}</p>
      </div>
    </div>

    <div class="title">${isMultipleSites ? `Cost Estimate for ${primarySite}` : costEstimate.title || "Cost Estimate"}</div>

    <div class="salutation">
      Dear ${costEstimate.client?.name?.split(" ").pop() || "Client"},
    </div>

    <div class="greeting">
      Good Day! Thank you for considering ${companyData?.name || "our company"} for your business needs.
    </div>

    <div class="details-header">Site details:</div>
    <div class="site-details">
      <ul>
        <li>
          <div class="details-row">
            <div class="details-label">Type:</div>
            <div class="details-value">${primaryRentalItem?.content_type || "Rental"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Size:</div>
            <div class="details-value">${primaryRentalItem?.specs?.height ? `${primaryRentalItem.specs.height}ft (H)` : "N/A"} x ${primaryRentalItem?.specs?.width ? `${primaryRentalItem.specs.width}ft (W)` : "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Contract Duration:</div>
            <div class="details-value">${ costEstimate.durationDays ? `${costEstimate.durationDays} days` : "—"} </div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Contract Period:</div>
            <div class="details-value">${startDate ? formatDate(startDate) : ""}${startDate && endDate ? " - " : ""}${endDate ? formatDate(endDate) : "—"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Proposal to:</div>
            <div class="details-value">${costEstimate.client?.company || "CLIENT COMPANY NAME"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Lease rate per month:</div>
            <div class="details-value">PHP ${monthlyRate.toLocaleString()} (Exclusive of VAT)</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Total Lease:</div>
            <div class="details-value">PHP ${calculateProratedPrice(monthlyRate, getDateObject(startDate) || new Date(), getDateObject(endDate) || new Date()).toLocaleString()} (Exclusive of VAT)</div>
          </div>
        </li>
      </ul>
    </div>

    ${costEstimate.items?.site_notes ? `
    <div class="price-notes">
      <p><strong>Site Notes:</strong> ${costEstimate.items.site_notes}</p>
    </div>
    ` : ''}

    ${costEstimate.notes ? `
    <div class="price-notes">
      <p><strong>Note:</strong> ${costEstimate.notes}</p>
    </div>
    ` : ''}

    <div class="price-breakdown-title">Price breakdown:</div>
    <div class="price-breakdown">
      <div class="price-row">
        <span>Lease rate per month</span>
        <span>PHP ${(monthlyRate).toLocaleString()}</span>
      </div>
      <div class="price-row">
        <span>Contract duration</span>
        <span>x ${costEstimate.durationDays ? `${costEstimate.durationDays} days` : "1 month"}</span>
      </div>
      <div class="price-row">
        <span>Total lease</span>
        <span>PHP ${calculateProratedPrice(monthlyRate, getDateObject(startDate) || new Date(), getDateObject(endDate) || new Date()).toLocaleString()}</span>
      </div>
      <div class="price-row">
        <span>Add: VAT</span>
        <span>PHP ${(calculateProratedPrice(monthlyRate, getDateObject(startDate) || new Date(), getDateObject(endDate) || new Date()) * 0.12).toLocaleString()}</span>
      </div>
      <div class="price-row price-total">
        <span>Total</span>
        <span>PHP ${(
          calculateProratedPrice(monthlyRate, getDateObject(startDate) || new Date(), getDateObject(endDate) || new Date()) * 1.12
        ).toLocaleString()}</span>
      </div>

      ${costEstimate.items?.price_notes ? `
      <div class="price-notes">
        <p><strong>Price Notes:</strong> ${costEstimate.items.price_notes}</p>
      </div>
      ` : ''}

      <div class="terms">
        <div class="terms-title">Terms and Conditions:</div>
        <div class="term-item">1. Cost Estimate validity: 5 working days.</div>
        <div class="term-item">2. Availability of the site is on first-come-first-served-basis only. Only official documents such as P.O's, Media Orders, signed cost estimate, & contracts are accepted in order to booked the site.</div>
        <div class="term-item">3. To book the site, one (1) month advance and one (2) months security deposit payment dated 7 days before the start of rental is required.</div>
        <div class="term-item">4. Final artwork should be approved ten (10) days before the contract period</div>
        <div class="term-item">5. Print is exclusively for ${companyData?.company_name || "Golden Touch Imaging Specialist"} Only.</div>
      </div>

      ${costEstimate.template?.closing_message ? `
      <div class="closing-message">
        <p>${costEstimate.template.closing_message}</p>
      </div>
      ` : ''}

      <div class="signatures">
        <div class="signature-section">
          <div>Very truly yours,</div>
          <div class="signature-line"></div>
          <div>${userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : companyData?.company_name || "Golden Touch Imaging Specialist"}</div>
          <div>${costEstimate.signature_position || "Account Manager"}</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}