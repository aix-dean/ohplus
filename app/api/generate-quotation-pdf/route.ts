import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import type { Quotation } from '@/lib/types/quotation'

const formatDate = (date: any) => {
  const dateObj = getDateObject(date)
  if (!dateObj) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

const formatDuration = (days: number): string => {
  if (days <= 0) return "0 days"

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
  if (companyData.address?.street) parts.push(companyData.address.street)
  if (companyData.address?.city) parts.push(companyData.address.city)
  if (companyData.address?.province) parts.push(companyData.address.province)
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
  try {
    const { quotation, companyData, logoDataUrl }: { quotation: Quotation; companyData: any; logoDataUrl: string | null } = await request.json()
    console.log('Received quotation:', quotation)
    console.log('Received companyData:', companyData)
    console.log('Received logoDataUrl:', !!logoDataUrl)

    // Generate HTML content
    const htmlContent = generateQuotationHTML(quotation, companyData, logoDataUrl)

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div class="header" style="text-align: center; width: 100%; padding: 5px;">
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="height: 50px; margin-right: 10px;">` : ''}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; text-align: center; width: 100%; padding: 5px;">
          <div>${companyData?.name || 'Company Name'}</div>
          <div>${formatCompanyAddress(companyData)}</div>
          <div>Tel: ${companyData?.phone || 'N/A'} | Email: ${companyData?.email || 'N/A'}</div>
          <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        </div>
      `,
      margin: {
        top: '25mm',
        right: '10mm',
        bottom: '30mm',
        left: '10mm'
      }
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quotation.quotation_number || quotation.id || 'quotation'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateQuotationHTML(
  quotation: Quotation,
  companyData: any
): string {
  const item = quotation.items

  const startDate = quotation.start_date || (quotation as any).contract_period?.start_date
  const endDate = quotation.end_date || (quotation as any).contract_period?.end_date

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
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
      }
      .date-ref {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        font-size: 14px;
      }
      .client-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
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
        margin-bottom: 15px;
      }
      .salutation {
        margin-bottom: 10px;
        font-size: 14px;
      }
      .greeting {
        margin-bottom: 15px;
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
        margin-bottom: 15px;
        page-break-inside: avoid;
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
  margin-bottom: 15px;
  font-size: 14px;
  page-break-inside: avoid;
}

.details-row {
  display: flex;
  margin-bottom: 4px;
}

.details-label {
  width: 180px; /* fixed width so values align neatly */
}

.details-value {
  flex: 1;
}
  .site-details ul {
  list-style-type: disc;  /* or circle/square */
  padding-left: 20px;     /* space for bullets */
}

.site-details li {
  margin-bottom: 6px;
}
      .terms {
        margin-top: 15px;
        font-size: 13px;
        page-break-inside: avoid;
      }
      .terms-title {
        font-weight: bold;
        margin-bottom: 5px;
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
        max-width: 200px; /* 👈 shorten the line */
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
        <p>${quotation.client_name || "Client Name"}</p>
        <p>${quotation.client_designation || "Position"}</p>
        <p><strong>${quotation.client_company_name || "COMPANY NAME"}</strong></p>
      </div>
      <div class="client-right">
        <p>RFQ. No. ${quotation.quotation_number}</p>
      </div>
    </div>

    <div class="title">${item?.name || "Site Name"} - Quotation</div>

    <div class="salutation">
      Dear ${quotation.template?.salutation || "Mr."} ${quotation.client_name?.split(" ").pop() || "Client"
    },
    </div>

    <div class="greeting">
      ${quotation.template?.greeting || `Good Day! Thank you for considering ${companyData?.name || "our company"} for your business needs.`}
    </div>

<div class="details-header">Site details:</div>
<div class="site-details">
  <ul>
    <li>
      <div class="details-row">
        <div class="details-label">Type:</div>
        <div class="details-value">${item?.type || "Rental"}</div>
      </div>
    </li>
    <li>
      <div class="details-row">
        <div class="details-label">Size:</div>
        <div class="details-value">${item?.specs?.height ? `${item.specs.height}ft (H)` : "N/A"
        } x ${item?.specs?.width ? `${item.specs.width}ft (W)` : "N/A"}</div>
      </div>
    </li>
    <li>
      <div class="details-row">
        <div class="details-label">Contract Duration:</div>
        <div class="details-value">${formatDuration(quotation.duration_days || 0)}</div>
      </div>
    </li>
     <li>
      <div class="details-row">
        <div class="details-label">Contract Period:</div>
        <div class="details-value">${startDate ? formatDate(startDate) : ""
        }${startDate && endDate ? " - " : ""}${endDate ? formatDate(endDate) : ""}</div>
      </div>
    </li>
     <li>
     <div class="details-row">
        <div class="details-label">Proposal to:</div>
        <div class="details-value">${quotation.client_company_name || "CLIENT COMPANY NAME"}</div>
      </div>
    </li>
     <li>
      <div class="details-row">
        <div class="details-label">Lease rate per month:</div>
        <div class="details-value">PHP ${item?.price ? item.price.toLocaleString() : "0"} (Exclusive of VAT)</div>
      </div>
    </li>
    <li>
      <div class="details-row">
        <div class="details-label">Total Lease:</div>
        <div class="details-value">PHP ${calculateProratedPrice(item?.price || 0, getDateObject(startDate) || new Date(), getDateObject(endDate) || new Date()).toLocaleString()} (Exclusive of VAT)</div>
      </div>
    </li>
  </ul>
</div>
  ${item?.site_notes ? `
  <div class="price-notes">
    <p><strong>Note:</strong> ${item.site_notes}</p>
  </div>
  ` : ''}
    <div class="price-breakdown-title">Price breakdown:</div>
    <div class="price-breakdown">
      <div class="price-row">
        <span>Lease rate per month</span>
        <span>PHP ${(item?.price || 0).toLocaleString()}</span>
      </div>
      <div class="price-row">
        <span>Contract duration</span>
        <span>x ${formatDuration(quotation.duration_days || 0)}</span>
      </div>
      <div class="price-row">
        <span>Total lease</span>
        <span>PHP ${calculateProratedPrice(
      item?.price || 0,
      getDateObject(startDate) || new Date(),
      getDateObject(endDate) || new Date()
    ).toLocaleString()}</span>
      </div>
      <div class="price-row">
        <span>Add: VAT</span>
        <span>PHP ${(calculateProratedPrice(
      item?.price || 0,
      getDateObject(startDate) || new Date(),
      getDateObject(endDate) || new Date()
    ) * 0.12).toLocaleString()}</span>
      </div>
      <div class="price-row price-total">
        <span>Total</span>
        <span>PHP ${(
      calculateProratedPrice(
        item?.price || 0,
        getDateObject(startDate) || new Date(),
        getDateObject(endDate) || new Date()
      ) * 1.12
    ).toLocaleString()}</span>
      </div>
    </div>

    ${item?.price_notes ? `
    <div class="price-notes">
      <p><strong>Note:</strong> ${item.price_notes}</p>
    </div>
    ` : ''}

    <div class="terms">
      <div class="terms-title">Terms and Conditions:</div>
      ${(quotation.template?.terms_and_conditions || [
      "Quotation validity: 5 working days.",
      "Site availability: First-come-first-served basis. Official documents required.",
      "Payment terms: One month advance and two months security deposit.",
      "Payment deadline: 7 days before rental start."
    ])
      .map((term, index) => `<div class="term-item">${index + 1}. ${term}</div>`)
      .join("")}
    </div>

    ${quotation.template?.closing_message ? `<div class="closing-message" style="page-break-inside: avoid;"><p>${quotation.template.closing_message}</p></div>` : ''}

    <div class="signatures">
      <div class="signature-section">
        <div>Very truly yours,</div>
        <div class="signature-line"></div>
        <div>${quotation.signature_name || "AIX Xymbiosis"}</div>
        <div>${quotation.signature_position || "Account Manager"}</div>
      </div>
      <div class="signature-section">
        <div>Conforme:</div>
        <div class="signature-line"></div>
        <div>${quotation.client_name || "Client Name"}</div>
        <div>${quotation.client_designation || "Client Designation"}</div>
        <div style="font-size: 10px; margin-top: 10px; color: gray; font-style: italic;">
          This signed quotation serves as an<br/>official document for billing purposes
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

