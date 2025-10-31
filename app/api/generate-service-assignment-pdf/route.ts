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
        error: 'Unable to create PDF - browser not available. Please try again later or contact support if the issue persists.'
      }, { status: 500 })
    }

    return NextResponse.json({ error: `Unable to create service assignment PDF. Please check your connection and try again. If the problem persists, contact support.` }, { status: 500 })
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
        margin: 25mm 15mm 30mm 15mm;
        size: A4;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: Inter, Arial, sans-serif;
        background: white;
        color: #333333;
        line-height: 1.2;
        position: relative;
        width: 612px;
        height: 792px;
        margin: 0 auto;
      }
      .company-name {
        position: absolute;
        width: 395px;
        height: 24px;
        left: 43px;
        top: 72px;
        font-size: 16px;
        font-weight: 700;
        line-height: 16px;
      }
      .company-address {
        position: absolute;
        width: 395px;
        height: 24px;
        left: 108px;
        top: 749px;
        text-align: center;
        font-size: 10px;
        font-weight: 400;
        line-height: 10px;
      }
      .company-contact {
        position: absolute;
        width: 349px;
        height: 14px;
        left: 43px;
        top: 93px;
        font-size: 10px;
        font-weight: 400;
        line-height: 10px;
      }
      .recipient-label {
        position: absolute;
        width: 61px;
        height: 14px;
        left: 43px;
        top: 132px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .recipient-name {
        position: absolute;
        width: 198px;
        height: 21px;
        left: 43px;
        top: 153px;
        font-size: 20px;
        font-weight: 700;
        line-height: 20px;
      }
      .issued-date {
        position: absolute;
        width: 148px;
        height: 14px;
        left: 417px;
        top: 186px;
        text-align: right;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .department {
        position: absolute;
        width: 148px;
        height: 14px;
        left: 43px;
        top: 177px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .site-name-label {
        position: absolute;
        width: 90px;
        height: 14px;
        left: 52px;
        top: 255px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .site-name-value {
        position: absolute;
        width: 119px;
        height: 14px;
        left: 210px;
        top: 255px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .site-address-label {
        position: absolute;
        width: 90px;
        height: 14px;
        left: 52px;
        top: 280px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .site-address-value {
        position: absolute;
        width: 239px;
        height: 14px;
        left: 210px;
        top: 280px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .campaign-name-label {
        position: absolute;
        width: 103px;
        height: 14px;
        left: 52px;
        top: 305px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .campaign-name-value {
        position: absolute;
        width: 188px;
        height: 14px;
        left: 210px;
        top: 305px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .service-type-label {
        position: absolute;
        width: 90px;
        height: 14px;
        left: 52px;
        top: 330px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .service-type-value {
        position: absolute;
        width: 164px;
        height: 14px;
        left: 210px;
        top: 330px;
        font-size: 12px;
        font-weight: 700;
        line-height: 12px;
      }
      .material-specs-label {
        position: absolute;
        width: 90px;
        height: 14px;
        left: 52px;
        top: 355px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .material-specs-value {
        position: absolute;
        width: 164px;
        height: 14px;
        left: 210px;
        top: 355px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .start-date-label {
        position: absolute;
        width: 115px;
        height: 14px;
        left: 52px;
        top: 380px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .start-date-value {
        position: absolute;
        width: 164px;
        height: 14px;
        left: 210px;
        top: 380px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .end-date-label {
        position: absolute;
        width: 108px;
        height: 14px;
        left: 52px;
        top: 405px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .end-date-value {
        position: absolute;
        width: 164px;
        height: 14px;
        left: 210px;
        top: 405px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .crew-label {
        position: absolute;
        width: 108px;
        height: 14px;
        left: 52px;
        top: 430px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .crew-value {
        position: absolute;
        width: 164px;
        height: 14px;
        left: 210px;
        top: 430px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .remarks-label {
        position: absolute;
        width: 108px;
        height: 14px;
        left: 52px;
        top: 454px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .remarks-value {
        position: absolute;
        width: 276px;
        height: 14px;
        left: 210px;
        top: 454px;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .attachments-label {
        position: absolute;
        width: 90px;
        height: 14px;
        left: 43px;
        top: 488px;
        font-size: 12px;
        font-weight: 700;
        line-height: 12px;
      }
      .logo {
        position: absolute;
        width: 82px;
        height: 32px;
        left: 37px;
        top: 38px;
      }
      .sa-header-bg {
        position: absolute;
        width: 130px;
        height: 33px;
        left: 435px;
        top: 148px;
        background: #32A7FA;
      }
      .sa-info-bg {
        position: absolute;
        width: 522px;
        height: 27px;
        left: 43px;
        top: 221px;
        background: #32A7FA;
      }
      .sa-number {
        position: absolute;
        width: 118px;
        height: 24px;
        left: 438px;
        top: 156px;
        text-align: right;
        color: white;
        font-size: 20px;
        font-weight: 700;
        line-height: 20px;
      }
      .sa-info-title {
        position: absolute;
        width: 277px;
        height: 15px;
        left: 52px;
        top: 227px;
        color: white;
        font-size: 16px;
        font-weight: 700;
        line-height: 16px;
      }
      .border-row {
        border: 1px #D9D9D9 solid;
      }
      .row-1 { position: absolute; width: 522px; height: 26px; left: 43px; top: 248px; }
      .row-2 { position: absolute; width: 522px; height: 26px; left: 43px; top: 273px; }
      .row-3 { position: absolute; width: 522px; height: 26px; left: 43px; top: 298px; }
      .row-4 { position: absolute; width: 522px; height: 26px; left: 43px; top: 323px; }
      .row-5 { position: absolute; width: 522px; height: 26px; left: 43px; top: 348px; }
      .row-6 { position: absolute; width: 522px; height: 26px; left: 43px; top: 373px; }
      .row-7 { position: absolute; width: 522px; height: 26px; left: 43px; top: 398px; }
      .row-8 { position: absolute; width: 522px; height: 26px; left: 43px; top: 423px; }
      .row-9 { position: absolute; width: 522px; height: 26px; left: 43px; top: 448px; }
      .labels-column {
        position: absolute;
        width: 152px;
        height: 226px;
        left: 43px;
        top: 248px;
        border: 1px #D9D9D9 solid;
      }
      .attachments-box {
        position: absolute;
        width: 200px;
        height: 200px;
        left: 43px;
        top: 507px;
        border: 1px #D9D9D9 solid;
      }
      .prepared-by-label {
        position: absolute;
        width: 85px;
        height: 14px;
        left: 494px;
        top: 523px;
        text-align: right;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .prepared-by-name {
        position: absolute;
        width: 172px;
        height: 21px;
        left: 407px;
        top: 587px;
        text-align: right;
        font-size: 20px;
        font-weight: 700;
        line-height: 20px;
      }
      .prepared-by-dept {
        position: absolute;
        width: 148px;
        height: 14px;
        left: 431px;
        top: 611px;
        text-align: right;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .tagged-jo {
        position: absolute;
        width: 98px;
        height: 33px;
        left: 473px;
        top: 43px;
        text-align: right;
        font-size: 12px;
        font-weight: 400;
        line-height: 12px;
      }
      .tagged-jo-number {
        font-size: 16px;
        font-weight: 700;
        line-height: 19.20px;
      }
    </style>
  </head>
  <body>
    <div class="company-name">${companyData?.name || "Golden Touch Imaging Specialist"}</div>
    <div class="company-address">${companyData?.name || "Golden Touch Imaging Specialist"}<br/>${formatCompanyAddress(companyData) || "721 Gen Solano St., San Miguel, Manila City, Metro Manila, Philippines"}</div>
    <div class="company-contact">${companyData?.phone || "+63 917 849 1054"} | ${formatCompanyAddress(companyData) || "721 Gen Solano St., San Miguel, Manila"}</div>
    <div class="recipient-label">Recipient</div>
    <div class="recipient-name">${assignment.assignedToName || assignment.assignedTo || "Jonathan Dela Cruz"}</div>
    <div class="issued-date">Issued on ${formatDate(new Date())}</div>
    <div class="department">${assignment.requestedBy?.department || "Production"}</div>
    <div class="site-name-label">Site Name</div>
    <div class="site-name-value">${assignment.projectSiteName || "Petplans Tower NB"}</div>
    <div class="site-address-label">Site Address</div>
    <div class="site-address-value">${assignment.projectSiteLocation || "444 EDSA, Guadalupe Viejo, Makati City"}</div>
    <div class="campaign-name-label">Campaign Name</div>
    <div class="campaign-name-value">${assignment.sales || "Eyes on Your Fries"}</div>
    <div class="service-type-label">Service Type</div>
    <div class="service-type-value">${assignment.serviceType || "Roll Up"}</div>
    <div class="material-specs-label">Material Specs</div>
    <div class="material-specs-value">${assignment.materialSpecs || "Sticker"}</div>
    <div class="start-date-label">Service Start Date</div>
    <div class="start-date-value">${assignment.startDate ? formatDate(assignment.startDate) : "October 15, 2025"}</div>
    <div class="end-date-label">Service End Date</div>
    <div class="end-date-value">${assignment.endDate ? formatDate(assignment.endDate) : "October 18, 2025"}</div>
    <div class="crew-label">Crew</div>
    <div class="crew-value">${assignment.crew || "Crew C"}</div>
    <div class="remarks-label">Remarks</div>
    <div class="remarks-value">${assignment.remarks || "Please bring Engr John to site. Thank you!"}</div>
    <div class="attachments-label">Attachments:</div>
    <img class="logo" src="${companyData?.logo || 'https://placehold.co/82x32'}" alt="Company Logo" />
    <div class="sa-header-bg"></div>
    <div class="sa-info-bg"></div>
    <div class="sa-number">SA#${assignment.saNumber || "00642"}</div>
    <div class="sa-info-title">Service Assignment Information</div>
    <div class="border-row row-1"></div>
    <div class="border-row row-2"></div>
    <div class="border-row row-3"></div>
    <div class="border-row row-4"></div>
    <div class="border-row row-5"></div>
    <div class="border-row row-6"></div>
    <div class="border-row row-7"></div>
    <div class="border-row row-8"></div>
    <div class="border-row row-9"></div>
    <div class="labels-column"></div>
    <div class="attachments-box"></div>
    <div class="prepared-by-label">Prepared By</div>
    <div class="prepared-by-name">${assignment.requestedBy?.name || userData?.first_name + ' ' + userData?.last_name || "May Tuyan"}</div>
    <div class="prepared-by-dept">${assignment.requestedBy?.department || "Logistics Team"}</div>
    <div class="tagged-jo">Tagged JO<br/><span class="tagged-jo-number">JO#${assignment.saNumber || "00642"}</span></div>
  </body>
  </html>
  `
}