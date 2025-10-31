import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Service Assignment interface for PDF generation
interface ServiceAssignmentPDFData {
  saNumber: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  assignedToName?: string
  serviceDuration: string
  priority: string
  equipmentRequired: string
  materialSpecs: string
  crew: string
  illuminationNits?: string
  gondola: string
  technology: string
  sales: string
  remarks: string
  requestedBy: {
    name: string
    department: string
  }
  startDate: Date | null
  endDate: Date | null
  alarmDate: Date | null
  alarmTime: string
  attachments: { name: string; type: string }[]
  serviceExpenses: { name: string; amount: string }[]
  status: string
  created: Date
}

// Helper functions
const formatDate = (date: any) => {
  const dateObj = getDateObject(date)
  if (!dateObj) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
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

const formatCompanyAddress = (companyData: any): string => {
  const parts: string[] = [];

  const location = companyData.company_location && (
    companyData.company_location.street ||
    companyData.company_location.city ||
    companyData.company_location.province
  ) ? companyData.company_location : companyData.address;

  if (location?.street) parts.push(location.street);
  if (location?.city) parts.push(location.city);
  if (location?.province) parts.push(location.province);

  const fullAddress = parts.join(", ");
  return fullAddress
}

export async function POST(request: NextRequest) {
  console.log('[API_PDF_SA] Received service assignment PDF generation request')

  try {
    const { assignment, companyData, logoDataUrl, format = 'pdf', userData }: {
      assignment: ServiceAssignmentPDFData;
      companyData: any;
      logoDataUrl: string | null;
      format?: 'pdf' | 'image';
      userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string }
    } = await request.json()

    console.log('[API_PDF_SA] SA Number:', assignment?.saNumber)
    console.log('[API_PDF_SA] Company data:', companyData?.name)
    console.log('[API_PDF_SA] Logo data URL provided:', !!logoDataUrl)
    console.log('[API_PDF_SA] User data:', userData?.first_name)
    console.log('[API_PDF_SA] Format:', format)

    // Validate required assignment data
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment data is required' }, { status: 400 })
    }

    if (!assignment.saNumber) {
      return NextResponse.json({ error: 'SA Number is required' }, { status: 400 })
    }

    if (!assignment.projectSiteName) {
      return NextResponse.json({ error: 'Project site name is required' }, { status: 400 })
    }

    if (!assignment.serviceType) {
      return NextResponse.json({ error: 'Service type is required' }, { status: 400 })
    }

    if (!assignment.assignedTo) {
      return NextResponse.json({ error: 'Assigned to is required' }, { status: 400 })
    }
    // Generate HTML content
    console.log('[API_PDF_SA] Generating HTML content...')
    const htmlContent = generateServiceAssignmentHTML(assignment, companyData, userData)
    console.log('[API_PDF_SA] HTML content generated, length:', htmlContent.length)

    // Launch puppeteer with @sparticuz/chromium for serverless or local chromium for development
    console.log('[API_PDF_SA] Launching Puppeteer browser...')
    const browser = await puppeteer.launch(
      process.env.NODE_ENV === 'production' || process.env.VERCEL
        ? {
            headless: true,
            args: chromium.args,
            executablePath: await chromium.executablePath()
          }
        : {
            headless: true,
            executablePath: process.platform === 'win32'
              ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
              : process.platform === 'darwin'
              ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
              : '/usr/bin/google-chrome'
          }
    )
    console.log('[API_PDF_SA] Browser launched successfully')

    const page = await browser.newPage()
    console.log('[API_PDF_SA] New page created')

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    console.log('[API_PDF_SA] HTML content set on page')

    // Generate PDF
    console.log('[API_PDF_SA] Generating PDF...')
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false, // Disable header/footer for now to avoid issues
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    })
    console.log('[API_PDF_SA] PDF buffer generated, size:', buffer.length, 'bytes')

    await browser.close()
    console.log('[API_PDF_SA] Browser closed')

    const contentType = 'application/pdf'
    const filename = `${assignment.saNumber || 'service-assignment'}.pdf`
    console.log('[API_PDF_SA] Generated filename:', filename)

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(`[API_PDF_SA] Error generating PDF:`, error)

    // Check for specific Puppeteer/Chrome errors
    if (error instanceof Error && error.message.includes('Could not find Chrome')) {
      return NextResponse.json({
        error: 'PDF generation failed: Chrome browser not found. Please ensure Chrome is installed or run: npx puppeteer browsers install chrome'
      }, { status: 500 })
    }

    return NextResponse.json({ error: `Failed to generate PDF` }, { status: 500 })
  }
}

function generateServiceAssignmentHTML(
  assignment: ServiceAssignmentPDFData,
  companyData: any,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string }
): string {
  const totalCost = assignment.serviceExpenses?.reduce((sum: number, expense: { name: string; amount: string }) => sum + (Number.parseFloat(expense.amount) || 0), 0) || 0

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Service Assignment - ${assignment.saNumber}</title>
    <style>
  @page {
  margin: 25mm 15mm 30mm 15mm; /* extra bottom space */
}
    *{
      border-size: border-box;
      margin: 0;
      padding:0;
    }
      .page-footer {
        position: fixed;
          bottom: 0mm;
          left: 5mm;             /* match @page left margin */
          right: 15mm;            /* match @page right margin */
          text-align: center;
          font-size: 10px;
          color: #555;
          box-sizing: border-box;
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
        <p>${assignment.projectSiteName || "Project Site"}</p>
        <p>${assignment.projectSiteLocation || "Location"}</p>
        <p><strong>${companyData?.name || "COMPANY NAME"}</strong></p>
      </div>
      <div class="client-right">
        <p>SA. No. ${assignment.saNumber}</p>
      </div>
    </div>

    <div class="title">Service Assignment</div>

    <div class="salutation">
      Dear Team,
    </div>

    <div class="greeting">
      Please find below the service assignment details for ${assignment.projectSiteName || "the project site"}.
    </div>

    <div class="details-header">Service details:</div>
    <div class="site-details">
      <ul>
        <li>
          <div class="details-row">
            <div class="details-label">Service Type:</div>
            <div class="details-value">${assignment.serviceType || "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Assigned To:</div>
            <div class="details-value">${assignment.assignedToName || assignment.assignedTo || "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Duration:</div>
            <div class="details-value">${assignment.serviceDuration ? `${assignment.serviceDuration} hours` : "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Priority:</div>
            <div class="details-value">${assignment.priority || "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">Start Date:</div>
            <div class="details-value">${assignment.startDate ? formatDate(assignment.startDate) : "N/A"}</div>
          </div>
        </li>
        <li>
          <div class="details-row">
            <div class="details-label">End Date:</div>
            <div class="details-value">${assignment.endDate ? formatDate(assignment.endDate) : "N/A"}</div>
          </div>
        </li>
        ${assignment.alarmDate ? `
        <li>
          <div class="details-row">
            <div class="details-label">Alarm Date:</div>
            <div class="details-value">${formatDate(assignment.alarmDate)} ${assignment.alarmTime ? `at ${assignment.alarmTime}` : ""}</div>
          </div>
        </li>
        ` : ""}
        ${assignment.illuminationNits ? `
        <li>
          <div class="details-row">
            <div class="details-label">Illumination:</div>
            <div class="details-value">${assignment.illuminationNits} nits</div>
          </div>
        </li>
        ` : ""}
        ${assignment.gondola ? `
        <li>
          <div class="details-row">
            <div class="details-label">Gondola:</div>
            <div class="details-value">${assignment.gondola}</div>
          </div>
        </li>
        ` : ""}
        ${assignment.technology ? `
        <li>
          <div class="details-row">
            <div class="details-label">Technology:</div>
            <div class="details-value">${assignment.technology}</div>
          </div>
        </li>
        ` : ""}
      </ul>
    </div>

    ${assignment.equipmentRequired ? `
    <div class="price-notes">
      <p><strong>Equipment Required:</strong> ${assignment.equipmentRequired}</p>
    </div>
    ` : ''}

    ${assignment.materialSpecs ? `
    <div class="price-notes">
      <p><strong>Material Specifications:</strong> ${assignment.materialSpecs}</p>
    </div>
    ` : ''}

    ${assignment.crew ? `
    <div class="price-notes">
      <p><strong>Crew:</strong> ${assignment.crew}</p>
    </div>
    ` : ''}

    ${assignment.remarks ? `
    <div class="price-notes">
      <p><strong>Remarks:</strong> ${assignment.remarks}</p>
    </div>
    ` : ''}

    ${totalCost > 0 ? `
    <div class="price-breakdown-title">Service cost breakdown:</div>
    <div class="price-breakdown">
      ${assignment.serviceExpenses?.map((expense: { name: string; amount: string }) => `
      <div class="price-row">
        <span>${expense.name}</span>
        <span>PHP ${Number.parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      `).join('')}
      <div class="price-row price-total">
        <span>Total Cost</span>
        <span>PHP ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    ` : ''}

    <div class="terms">
      <div class="terms-title">Service Assignment Terms:</div>
      <div class="term-item">1. Service must be completed within the specified duration.</div>
      <div class="term-item">2. All equipment and materials must be handled with care.</div>
      <div class="term-item">3. Safety protocols must be followed at all times.</div>
      <div class="term-item">4. Any issues must be reported immediately to the logistics team.</div>
    </div>

    <div class="signatures">
      <div class="signature-section">
        <div>Requested by:</div>
        <div class="signature-line"></div>
        <div>${assignment.requestedBy?.name || "Requester Name"}</div>
        <div>${assignment.requestedBy?.department || "Department"}</div>
      </div>
      <div class="signature-section">
        <div>Assigned to:</div>
        <div class="signature-line"></div>
        <div>${assignment.assignedToName || assignment.assignedTo || "Assignee Name"}</div>
        <div>Service Technician</div>
      </div>
    </div>
        <div class="page-footer" style="font-size:8px; width:100%; text-align:center; padding:2px 0; color: #444;">
          <div>${companyData?.name || companyData?.company_name || "Company Name"}</div>
          <div>${formatCompanyAddress(companyData)}</div>
          <div>Tel: ${companyData?.phone || 'N/A'} | Email: ${companyData?.email || 'N/A'}</div>
        </div>
  </body>
  </html>
  `
}