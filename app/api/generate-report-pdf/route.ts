import { NextRequest, NextResponse } from 'next/server'
import { generateReportPDF } from '@/lib/pdf-service'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ReportData } from '@/lib/report-service'

export async function POST(request: NextRequest) {
  console.log('[API_REPORT_PDF] Received report PDF generation request')

  const { reportId }: { reportId: string } = await request.json()
  console.log('[API_REPORT_PDF] Report ID:', reportId)

  try {
    // Fetch the report data from Firestore
    const reportDoc = await getDoc(doc(db, 'reports', reportId))
    if (!reportDoc.exists()) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const reportData = { id: reportDoc.id, ...reportDoc.data() } as ReportData
    console.log('[API_REPORT_PDF] Report data retrieved:', reportData.id)

    // Fetch product data if available
    let product = null
    if (reportData.siteId) {
      try {
        const productDoc = await getDoc(doc(db, 'products', reportData.siteId))
        if (productDoc.exists()) {
          product = { id: productDoc.id, ...productDoc.data() }
          console.log('[API_REPORT_PDF] Product data retrieved:', product.id)
        }
      } catch (error) {
        console.warn('[API_REPORT_PDF] Could not fetch product data:', error)
      }
    }

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
    const pdfBase64 = await generateReportPDF(reportData, product, userData, null, true) as string
    console.log('[API_REPORT_PDF] PDF generated successfully, size:', pdfBase64.length)

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    const contentType = 'application/pdf'
    const filename = `report-${reportData.id || reportId}-${Date.now()}.pdf`
    console.log('[API_REPORT_PDF] Generated filename:', filename)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(`[API_REPORT_PDF] Error generating report PDF:`, error)

    return NextResponse.json({ error: `Failed to generate report PDF` }, { status: 500 })
  }
}