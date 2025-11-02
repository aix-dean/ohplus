import { NextRequest, NextResponse } from 'next/server'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ReportData } from '@/lib/report-service'
import { uploadPdfBufferToFirebaseStorage } from '@/lib/firebase-service'
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { loadImageAsBase64 } from '@/lib/pdf-service'

// Helper function to safely convert to Date
function safeToDate(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue
  }
  if (typeof dateValue === "string" || typeof dateValue === "number") {
    return new Date(dateValue)
  }
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }
  return new Date() // fallback to current date
}

export async function  generateReportPDF(
  report: ReportData,
  companyData?: any,
  userData?: any,
  returnBase64 = false,
  module = "logistics",
): Promise<string | Buffer | void> {
  try {
    console.log("[generateReportPDF] Function called with:", { report, userData, returnBase64, module, companyData });

    // Fetch product data if available
    let product = null
    if (report.site?.id) {
      try {
        const productDoc = await getDoc(doc(db, 'products', report.site.id))
        if (productDoc.exists()) {
          product = { id: productDoc.id, ...productDoc.data() }
          console.log('[PDF] Product data retrieved:', product.id)
        }
      } catch (error) {
        console.warn('[PDF] Could not fetch product data:', error)
      }
    }

    // Fetch team data if available
    let teamName = report.assignedTo


    // Helper functions
    const formatDate = (dateValue: Date | any | string) => {
      const date = safeToDate(dateValue)
      return date.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      });
    }
    
    const formatTime = (dateValue: Date | any | string) => {
      const date = safeToDate(dateValue)
      return date.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getReportTypeDisplay = (type: string) => {
      return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    const getSiteLocation = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.location || product.light?.location || "N/A"
    }

    const getSiteName = (report: any) => {
      return report.siteName || "N/A"
    }

    const getSiteSize = (product: any) => {
      if (!product) return "N/A"
      const specs = product.specs_rental
      if (specs?.height && specs?.width) {
        return `${specs.height} (H) x ${specs.width} x ${specs} Panels`
      }
      return product.specs_rental?.size || product.light?.size || "N/A"
    }

    const getMaterialSpecs = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.material || "Stickers"
    }

    const getIllumination = (product: any) => {
      if (!product) return "N/A"
      const illumination = product.specs_rental?.illumination;
      if (typeof illumination === 'object' && illumination !== null) {
        return JSON.stringify(illumination);
      }
      return illumination || "LR 2097 (200 Watts x 40)";
    }

    const getGondola = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.gondola ? "YES" : "NO"
    }

    const getTechnology = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.technology || "Clear Tapes"
    }

    const calculateInstallationDuration = (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    const getCompletionPercentage = (report: any) => {
      if (!report) return 100
      if (report.completionPercentage !== undefined) {
        return report.completionPercentage
      }
      // Default percentages based on report type
      switch (report.reportType) {
        case "progress-report":
          return 50 // Default for progress reports
        case "completion-report":
          return 100
        case "monitoring-report":
          return 100
        default:
          return 100
      }
    }

    // Resolve company logo and prepared by name
    let companyLogoUrl = "/ohplus-new-logo.png"
    let preparedByName = "User"
    const moduleDisplayName = module === "sales" ? "Sales" : "Logistics"
    const moduleDepartmentName = module === "sales" ? "SALES" : "LOGISTICS"

    if (companyData) {
      preparedByName = companyData.name || companyData.company_name || userData?.displayName || userData?.email?.split("@")[0] || "User"
      companyLogoUrl = companyData.photo_url || companyData.logo || "/ohplus-new-logo.png"
    } else if (userData?.uid || report?.createdBy) {
      try {
        const userId = userData?.uid || report?.createdBy
        const userDocRef = doc(db, "iboard_users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const fullUserData = userDoc.data()
          if (fullUserData.company_id) {
            const companyDocRef = doc(db, "companies", fullUserData.company_id)
            const companyDoc = await getDoc(companyDocRef)

            if (companyDoc.exists()) {
              const fetchedCompanyData = companyDoc.data()
              preparedByName = fetchedCompanyData.name || fetchedCompanyData.company_name ||
                fullUserData.display_name || fullUserData.first_name + " " + fullUserData.last_name ||
                userData?.displayName || userData?.email?.split("@")[0] || "User"
              companyLogoUrl = fetchedCompanyData.photo_url || "/ohplus-new-logo.png"
            }
          }
        }
      } catch (error) {
        console.error("PDF: Error fetching company data:", error)
        preparedByName = userData?.displayName || userData?.email?.split("@")[0] || "User"
      }
    }

    // Convert company logo to base64 for PDF compatibility
    if (companyLogoUrl && companyLogoUrl !== "/ohplus-new-logo.png") {
      try {
        const base64Logo = await loadImageAsBase64(companyLogoUrl)
        if (base64Logo) {
          companyLogoUrl = base64Logo
        }
      } catch (error) {
        console.warn("[PDF] Could not convert company logo to base64:", error)
        // Keep original URL as fallback
      }
    }

    // Fetch user signatures for prepared by and received by
    let preparedBySignature = "https://placehold.co/152x91"
    let receivedBySignature = "https://placehold.co/152x91"
    let receivedByName = "Noemi Abellanada"

    // Fetch signature for createdBy (prepared by)
    if (report.createdBy) {
      try {
        const preparedByUserDoc = await getDoc(doc(db, 'iboard_users', report.createdBy))
        if (preparedByUserDoc.exists()) {
          const preparedByUserData = preparedByUserDoc.data()
          if (preparedByUserData.signature && typeof preparedByUserData.signature === 'object' && preparedByUserData.signature.url) {
            const signatureUrl = preparedByUserData.signature.url
            const base64Signature = await loadImageAsBase64(signatureUrl)
            if (base64Signature) {
              preparedBySignature = base64Signature
            }
          }
        }
      } catch (error) {
        console.warn("[PDF] Could not fetch prepared by signature:", error)
      }
    }

    // Fetch signature for joRequestBy (received by)
    if (report.joRequestBy) {
      try {
        const receivedByUserDoc = await getDoc(doc(db, 'iboard_users', report.joRequestBy))
        if (receivedByUserDoc.exists()) {
          const receivedByUserData = receivedByUserDoc.data()
          if (receivedByUserData.signature && typeof receivedByUserData.signature === 'object' && receivedByUserData.signature.url) {
            const signatureUrl = receivedByUserData.signature.url
            const base64Signature = await loadImageAsBase64(signatureUrl)
            if (base64Signature) {
              receivedBySignature = base64Signature
            }
          }
          // Update receivedByName with actual user name
          receivedByName = `${receivedByUserData.first_name || ''} ${receivedByUserData.last_name || ''}`.trim() ||
                          receivedByUserData.display_name ||
                          receivedByUserData.email?.split('@')[0] ||
                          "Noemi Abellanada"
        }
      } catch (error) {
        console.warn("[PDF] Could not fetch received by signature:", error)
      }
    }

    // Prepare data for HTML template
    const templateData = {
      moduleDisplayName,
      reportTypeBadge: getReportTypeDisplay(report.reportType),
      companyLogoUrl,
      asOfDate: formatDate(report.created || new Date()),
      companyName: companyData?.name || companyData?.company_name || "Golden Touch Imaging Specialist",
      reportNumber: report.id?.slice(-4).toUpperCase() || "00642",
      saNumber: report.id?.slice(-4).toUpperCase() || "00642",
      projectInfo: {
        siteId: getSiteLocation(product),
        jobOrder: report.id?.slice(-4).toUpperCase() || "7733",
        jobOrderDate: formatDate(report.created || new Date()),
        site: getSiteName(report),
        size: getSiteSize(product),
        startDate: formatDate(report.start_date),
        endDate: formatDate(report.end_date),
        startTime: formatTime(report.start_date),
        endTime: formatTime(report.end_date),
        installationDuration: `${calculateInstallationDuration(
          safeToDate(report.bookingDates.start).toISOString(),
          safeToDate(report.bookingDates.end).toISOString()
        )} days`,
        content: (product as any)?.content_type || "Static",
        materialSpecs: getMaterialSpecs(product),
        crew: teamName,
        illumination: getIllumination(product),
        gondola: getGondola(product),
        technology: getTechnology(product),
        sales: report.sales || "N/A",
      },
      statusPercentage: getCompletionPercentage(report),
      clientName: report.client?.name || "Client Name",
      campaignName: report.campaignName || "N/A",
      remarks: report.descriptionOfWork || report.delayReason || "N/A",
      receivedByName,
      preparedBySignature,
      receivedBySignature,
      attachments: report.attachments?.map(attachment => ({
        fileUrl: attachment.fileUrl,
        date: formatDate(report.created || new Date()),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        location: getSiteLocation(product),
        note: attachment.note
      })) || [],
      afterNote: report.afterNote,
      beforeNote: report.beforeNote,
      monitoringNote: report.monitoringNote,
      preparedByName,
      moduleDepartmentName,
      preparedDate: formatDate(report.created || new Date()),
      currentDate: new Date().toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    }

    // Convert attachment images to base64 for PDF compatibility
    for (let i = 0; i < templateData.attachments.length; i++) {
      try {
        const base64Image = await loadImageAsBase64(templateData.attachments[i].fileUrl);
        if (base64Image) {
          templateData.attachments[i].fileUrl = base64Image;
        }
      } catch (error) {
        console.warn(`[PDF] Could not convert attachment ${i} to base64:`, error);
      }
    }

    // HTML template based on user's provided design
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${templateData.reportTypeBadge}</title>
<style>
    @page {
        size: A4 portrait;
        margin: 20mm 15mm 40mm 15mm;
        counter-increment: page;
        counter-reset: page 1;
    }

    body {
        font-family: 'Inter', Arial, sans-serif;
        font-size: 12px;
        color: #333;
        background: white;
        margin: 0;
        padding: 0;
    }

    .page {
        width: 100%;
        max-width: 180mm;
        margin: 0 auto;
        padding-top: 10mm;
    }

    /* HEADER */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .header-left {
        display: flex;
        flex-direction: column;
    }
    .logo {
        width: 35mm;
        height: auto;
        margin-bottom: 3mm;
    }
    .logo img {
        width: 100%;
        height: auto;
        object-fit: contain;
    }
    .company-name {
        font-weight: 700;
        font-size: 14px;
    }
    .company-contact {
        font-size: 10px;
        color: #555;
    }
    .sa-info {
        text-align: right;
        font-size: 12px;
        line-height: 1.4;
    }
    .sa-number {
        font-weight: 700;
        font-size: 14px;
    }

    /* TITLE */
    .title-bar {
        display: flex;
        align-items: center;
        margin-top: 10mm;
    }
    .title-blue {
        background: #32A7FA;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 20px;
        width:203px;
        height: 33px;
    }
    .title-number {
        color: #32A7FA;
        font-weight: 700;
        font-size: 16px;
        margin-left: 5mm;
    }
    .issued-date {
        margin-top: 2mm;
        font-size: 11px;
        margin-bottom: 10mm;
    }

    /* SECTIONS */
    .section {
        border: 1px solid #d9d9d9;
        border-collapse: collapse;
        width: 100%;
    }
    .section-header {
        background: #32A7FA;
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        padding: 2mm 3mm;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    td {
        border: 1px solid #d9d9d9;
        padding: 3mm;
        vertical-align: middle;
    }
    td.label {
        width: 40%;
        font-weight: 600;
    }
    td.value {
        width: 60%;
        text-align: left;
    }

    /* SIGNATURES */
    .signatures {
    margin-top: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.signature-block {
  width: 48%;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* This ensures everything aligns left */
  text-align: left;
}

.signature-block img {
  width: 50mm; /* or a fixed size instead of 100% to stop stretching */
  height: 25mm;
  object-fit: contain;
  border: 1px solid transparent;
  margin-top: 3mm;
  margin-left: -10mm;
  margin-bottom: 3mm;
  align-self: flex-start; /* Ensures image stays on the left */
}

.sig-name {
  font-weight: 700;
  font-size: 14px;
  margin-top: 2mm;
}

.sig-title {
  font-size: 11px;
  text-align: left;
}


    /* ATTACHMENTS */
    .attachments {
        margin-top: 40mm;
    }
    .attachment-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10mm;
    }
    .attachment-column {
        /* Column styling */
    }
    .attachment-images {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 5mm;
    }
    .attachment-item {
        text-align: center;
    }
    .attachment-item img {
        width: 50%;
        height: auto;
        object-fit: cover;
        border: 1px solid #d9d9d9;
    }
    .attachment-label {
        font-weight: 600;
        margin-bottom: 3mm;
        font-size: 11px;
        text-align: left;
        color: #32A7FA;
    }
    .attachment-info {
        font-size: 8px;
        margin-top: 2mm;
        color: #555;
    }

    /* FOOTER */
    .page-footer {
        position: fixed;
        bottom: 0mm;
        left: 15mm;
        right: 15mm;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #555;
        box-sizing: border-box;
    }
    .page-footer .company-info {
        text-align: center;
    }
    .page-footer .page-info {
        text-align: right;
    }
    .page-footer .pageNumber:before {
        content: counter(page);
    }
</style>
</head>
<body>
<div class="page">

    <!-- Title -->
    <div class="title-bar">
        <div class="title-blue">${templateData.reportTypeBadge}</div>
        <div class="title-number">RPT#${templateData.reportNumber}</div>
    </div>
    <div class="issued-date">Issued on ${safeToDate(report.created).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    })}</div>

    <!-- Site Information -->
    <div class="section">
        <div class="section-header">Site Information</div>
        <table>
            <tr>
                <td class="label">Site Name</td>
                <td class="value">${templateData.projectInfo.site}</td>
            </tr>
            <tr>
                <td class="label">Site Address</td>
                <td class="value">${templateData.projectInfo.siteId}</td>
            </tr>
        </table>
    </div>

    <!-- Client Information -->
    <div class="section">
        <div class="section-header">Client Information</div>
        <table>
            <tr>
                <td class="label">Client Name</td>
                <td class="value">${templateData.clientName}</td>
            </tr>
            <tr>
                <td class="label">Campaign Name</td>
                <td class="value">${templateData.campaignName}</td>
            </tr>
        </table>
    </div>

    <!-- Report -->
    <div class="section">
        <div class="section-header">Report</div>
        <table>
            <tr>
                <td class="label">Service Type</td>
                <td class="value">${report.saType }</td>
            </tr>
            <tr>
                <td class="label">Material Specs</td>
                <td class="value">${templateData.projectInfo.materialSpecs}</td>
            </tr>
                    <tr style="padding: 0; border: none;">
                <td class="label">Service Start Date</td>
                <td class="value" style="padding: 0; border: none;">
                  <div style="display: flex; width: 100%; border-left: 1px solid #d9d9d9; border-bottom: 1px solid #d9d9d9;">
                    <div style="flex: 1; text-align: left; padding: 10px; border-right: 1px solid #d9d9d9;">
                      ${templateData.projectInfo.startDate || ""}
                    </div>
                    <div style="flex: 1; text-align: left; padding: 10px;">
                      ${templateData.projectInfo.startTime || ""}
                    </div>
                  </div>
                </td>
            </tr>
            <tr style="padding: 0; border: none;">
                <td class="label">Service Start Date</td>
                <td class="value" style="padding: 0; border: none;">
                  <div style="display: flex; width: 100%; border-left: 1px solid #d9d9d9; ">
                    <div style="flex: 1; text-align: left; padding: 10px; border-right: 1px solid #d9d9d9;">
                      ${templateData.projectInfo.endDate || ""}
                    </div>
                    <div style="flex: 1; text-align: left; padding: 10px;">
                      ${templateData.projectInfo.endTime || ""}
                  </div>
                </td>
            </tr>
            <tr>
                <td class="label">Crew</td>
                <td class="value">${templateData.projectInfo.crew}</td>
            </tr>
            <tr>
                <td class="label">Remarks</td>
                <td class="value">${templateData.remarks}</td>
            </tr>
        </table>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-block">
            <span>Prepared By:</span>
            <img src="${templateData.preparedBySignature}" alt="Prepared Signature">
            <div class="sig-name">${templateData.preparedByName}</div>
            <div class="sig-title">${templateData.moduleDepartmentName} Team</div>
        </div>
        <div class="signature-block">
            <span>Received By:</span>
            <img src="${templateData.receivedBySignature}" alt="Received Signature">
            <div class="sig-name">${templateData.receivedByName}</div>
            <div class="sig-title">Sales Team</div>
        </div>
    </div>

    <!-- Attachments -->
    ${(templateData.reportTypeBadge === 'Progress Report' || templateData.reportTypeBadge === 'Completion Report') && templateData.attachments.length > 0 ? `
    <div class="attachments">
        ${(() => {
            const beforeAttachments = templateData.attachments.filter((_, index) => index % 2 === 0);
            const afterAttachments = templateData.attachments.filter((_, index) => index % 2 === 1);
            return `
                <div class="attachment-columns">
                    <div class="attachment-column">
                        <div class="attachment-label">Before Service</div>
                        <div class="attachment-images">
                            ${beforeAttachments.map(attachment => `
                                <div class="attachment-item">
                                    <img src="${attachment.fileUrl}" alt="Before Service">
                                </div>
                            `).join('')}
                        </div>
                        <div class="attachment-info">
                            ${report.beforeNote ? `<div>${report.beforeNote}</div>` : ''}
                        </div>
                    </div>
                    <div class="attachment-column">
                        <div class="attachment-label">After Service</div>
                        <div class="attachment-images">
                            ${afterAttachments.map(attachment => `
                                <div class="attachment-item">
                                    <img src="${attachment.fileUrl}" alt="After Service">
                                </div>
                            `).join('')}
                        </div>
                        <div class="attachment-info">
                            ${report.afterNote ? `<div>${report.afterNote}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        })()}
    </div>
    ` : ''}

</div>

<!-- Footer -->
<div class="page-footer">
    <div class="spacer"></div>
    <div class="company-info">
        <div>${templateData.companyName}</div>
        <div>721 Gen Solano St., San Miguel, Manila, Philippines</div>
    </div>
    <div class="page-info">
        Page <span class="pageNumber"></span>
    </div>
</div>
</body>
</html>
`

    // Launch puppeteer with @sparticuz/chromium for serverless or local chromium for development
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
                : '/usr/bin/google-chrome' // Linux fallback
          }
    )

    try {
      const page = await browser.newPage()
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
       headerTemplate: `
  <div style="width:100%; font-family: Inter, Arial, sans-serif; font-size:10px; color:#333; display:flex; justify-content:space-between; align-items:flex-start; padding:5px 15mm 0 15mm; box-sizing:border-box;">
    <div style="display:flex; flex-direction:column;">
      ${templateData.companyLogoUrl ? `<img src="${templateData.companyLogoUrl}" alt="Company Logo" style="width:50px; height:50px; margin-bottom:3px;">` : ''}
      <div style="font-weight:700; font-size:12px;">${companyData.name}</div>
      <div style="font-size:10px; color:#555;">${companyData.phone} | ${companyData.location || `${companyData.address.street}, ${companyData.address.city}, ${companyData.address.province}`}</div>
    </div>
    <div style="text-align:right; font-size:10px; line-height:1.4;">
      Tagged SA<br>
      <span style="font-weight:700; font-size:12px;">SA#${report.saNumber || '00642'}</span>
    </div>
  </div>
`,
footerTemplate: `<div></div>`,
        margin: {
            top: '25mm',
        right: '10mm',
        bottom: '30mm',
        left: '10mm'
        }
      })

      if (returnBase64) {
        return Buffer.from(pdfBuffer).toString('base64')
      } else {
        // For client-side usage, save the file directly
        const fileName = `report-${report.id}-${Date.now()}.pdf`

        // Create a blob URL and trigger download (client-side)
        if (typeof window !== 'undefined') {
          const buffer = Buffer.from(pdfBuffer)
          const blob = new Blob([buffer], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        console.log(`PDF generated: ${fileName}`)
        return undefined
      }
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error("Error generating report PDF:", error)
    throw new Error("Failed to generate report PDF")
  }
}

export async function POST(request: NextRequest) {
  console.log('[API_REPORT_PDF] Received report PDF generation request')

  const { reportId, companyData }: { reportId: string; companyData?: any } = await request.json()
  console.log('[API_REPORT_PDF] Report ID:', reportId)
  console.log('[API_REPORT_PDF] Company data provided:', !!companyData)

  try {
    // Fetch the report data from Firestore
    const reportDoc = await getDoc(doc(db, 'reports', reportId))
    if (!reportDoc.exists()) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const reportData = { id: reportDoc.id, ...reportDoc.data() } as ReportData
    console.log('[API_REPORT_PDF] Report data retrieved:', reportData.id)

    // Fetch user data for the report creator
    let userData = null
    if (reportData.createdBy) {
      try {
        const userDoc = await getDoc(doc(db, 'iboard_users', reportData.createdBy))
        if (userDoc.exists()) {
          userData = { uid: userDoc.id, ...userDoc.data() }
          console.log('[API_REPORT_PDF] User data retrieved:', userData.uid)
        }
      } catch (error) {
        console.warn('[API_REPORT_PDF] Could not fetch user data:', error)
      }
    }


    // Generate PDF with base64 return
    console.log('[API_REPORT_PDF] Generating PDF...')
    const pdfBase64 = await generateReportPDF(reportData, companyData, userData, true, "logistics") as string
    console.log('[API_REPORT_PDF] PDF generated successfully, size:', pdfBase64.length)

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    const filename = `report-${reportData.id || reportId}-${Date.now()}.pdf`
    const storagePath = `reports/${reportData.companyId || 'unknown_company'}/${reportId}/`
    const downloadURL = await uploadPdfBufferToFirebaseStorage(pdfBuffer, filename, storagePath)
    console.log('[API_REPORT_PDF] PDF uploaded to Firebase Storage:', downloadURL)

    // Update the report document with the PDF URL
    const reportRef = doc(db, 'reports', reportId)
    await updateDoc(reportRef, {
      logistics_report: downloadURL,
      updated: new Date(), // Update the 'updated' timestamp
    })
    console.log('[API_REPORT_PDF] Report document updated with PDF URL.')

    return new NextResponse(JSON.stringify({ downloadURL: downloadURL }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(`[API_REPORT_PDF] Error generating report PDF:`, error)

    return NextResponse.json({ error: `Failed to generate report PDF` }, { status: 500 })
  }
}