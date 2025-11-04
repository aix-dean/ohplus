import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { generateServiceAssignmentHTMLSimple } from '@/lib/pdf-service'
import { PDFDocument, PDFName } from 'pdf-lib'
import { getTeamById } from '@/lib/teams-service'

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
  crewName?: string
  illuminationNits?: string
  gondola: string
  technology: string
  sales: string
  campaignName?: string
  remarks: string
  requestedBy: {
    name: string
    department: string
  }
  startDate: Date | null
  endDate: Date | null
  alarmDate: Date | null
  alarmTime: string
  attachments: { name: string; type: string; url?: string; fileUrl?: string }[]
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
    const { assignment, companyData, logoDataUrl, signatureDataUrl, format = 'pdf', userData }: {
      assignment: ServiceAssignmentPDFData;
      companyData: any;
      logoDataUrl: string | null;
      signatureDataUrl: string | null;
      format?: 'pdf' | 'image';
      userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string }
    } = await request.json()

    console.log('[API_PDF_SA] SA Number:', assignment?.saNumber)
    console.log('[API_PDF_SA] Company data:', companyData?.name)
    console.log('[API_PDF_SA] Logo data URL provided:', !!logoDataUrl)
    console.log('[API_PDF_SA] Signature data URL provided:', !!signatureDataUrl)
    console.log('[API_PDF_SA] Signature data URL length:', signatureDataUrl?.length || 0)
    console.log('[API_PDF_SA] Signature data URL starts with:', signatureDataUrl?.substring(0, 50))
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

    // Resolve crew name from crew ID if not provided
    if ((!assignment.crewName || assignment.crewName.trim() === '') && assignment.crew) {
      try {
        console.log('[API_PDF_SA] Fetching crew name for crew ID:', assignment.crew)
        const team = await getTeamById(assignment.crew)
        if (team) {
          assignment.crewName = team.name
          console.log('[API_PDF_SA] Resolved crew name:', assignment.crewName)
        } else {
          console.log('[API_PDF_SA] Team not found for crew ID:', assignment.crew)
        }
      } catch (error) {
        console.error('[API_PDF_SA] Error fetching team name:', error)
      }
    }

    // Generate HTML content
    console.log('[API_PDF_SA] Generating HTML content...')
    const htmlContent = await generateServiceAssignmentHTMLSimple(assignment, companyData, logoDataUrl || undefined, signatureDataUrl || undefined)
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
        right: '5mm',
        bottom: '10mm',
        left: '5mm'
      }
    })
    console.log('[API_PDF_SA] PDF buffer generated, size:', buffer.length, 'bytes')

    // Apply PDF viewer preferences for initial zoom
    const pdfDoc = await PDFDocument.load(buffer)
    const pages = pdfDoc.getPages()
    if (pages.length > 0) {
      const firstPage = pages[0]
      const action = pdfDoc.context.obj({
        Type: PDFName.of('Action'),
        S: PDFName.of('GoTo'),
        D: [firstPage.ref, PDFName.of('XYZ'), null, null, 1.25]
      })
      pdfDoc.catalog.set(PDFName.of('OpenAction'), action)
    }
    const modifiedBuffer = await pdfDoc.save()
    console.log('[API_PDF_SA] PDF viewer preferences applied, modified buffer size:', modifiedBuffer.length, 'bytes')

    await browser.close()
    console.log('[API_PDF_SA] Browser closed')

    const contentType = 'application/pdf'
    const filename = `${assignment.saNumber || 'service-assignment'}.pdf`
    console.log('[API_PDF_SA] Generated filename:', filename)

    return new NextResponse(Buffer.from(modifiedBuffer), {
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
