import jsPDF from "jspdf"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Helper function to safely convert dates
function safeToDate(dateValue: any): Date {
  if (!dateValue) return new Date()
  if (dateValue instanceof Date) return dateValue
  if (dateValue.toDate && typeof dateValue.toDate === "function") return dateValue.toDate()
  return new Date(dateValue)
}

// Generate QR code URL for cost estimate
async function generateQRCode(url: string): Promise<string> {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}

// Category labels mapping
const categoryLabels = {
  media_cost: "Media Cost",
  production_cost: "Production Cost",
  installation_cost: "Installation Cost",
  maintenance_cost: "Maintenance Cost",
  other: "Other",
  "LED Billboard Rental": "LED Billboard Rental",
  "Static Billboard Rental": "Static Billboard Rental",
  "Billboard Rental": "Billboard Rental",
  Production: "Production",
  Installation: "Installation",
  Maintenance: "Maintenance",
}

async function fetchCompanyData(companyId: string) {
  // Provide immediate fallback data to prevent hanging
  const fallbackData = {
    company_name: "Golden Touch Imaging Specialist",
    company_location: "No. 727 General Solano St., San Miguel, Manila 1005",
    phone: "Telephone: (02) 5310 1750 to 53",
  }

  try {
    // Attempt to fetch company data with a very short timeout
    const companyDoc = await getDoc(doc(db, "companies", companyId))

    if (companyDoc.exists()) {
      const data = companyDoc.data()
      // Return fetched data merged with fallback for missing fields
      return {
        company_name: data.company_name || data.name || fallbackData.company_name,
        company_location: data.company_location || data.address || fallbackData.company_location,
        phone: data.phone || data.telephone || data.contact_number || fallbackData.phone,
      }
    }

    return fallbackData
  } catch (error) {
    console.error("Error fetching company data:", error)
    // Always return fallback data instead of throwing
    return fallbackData
  }
}

function formatCompanyAddress(companyData: any): string {
  if (!companyData) return ""

  // Handle company_location field (string format)
  if (companyData.company_location && typeof companyData.company_location === "string") {
    return companyData.company_location
  }

  // Handle address object format
  if (companyData.address && typeof companyData.address === "object") {
    const { street, city, province } = companyData.address
    const addressParts = []

    // Filter out default placeholder values
    if (street && street !== "Default Street" && street.trim()) {
      addressParts.push(street)
    }
    if (city && city !== "Default City" && city.trim()) {
      addressParts.push(city)
    }
    if (province && province !== "Default Province" && province.trim()) {
      addressParts.push(province)
    }

    return addressParts.join(", ")
  }

  // Handle address as string
  if (companyData.address && typeof companyData.address === "string") {
    return companyData.address
  }

  return ""
}

function formatCompanyPhone(companyData: any): string {
  if (!companyData) return ""

  // Try different phone field names
  const phoneFields = ["phone", "telephone", "contact_number"]
  for (const field of phoneFields) {
    if (companyData[field] && companyData[field].trim()) {
      return companyData[field]
    }
  }

  return ""
}

/**
 * Generate separate PDF files for each site in a cost estimate
 */
export async function generateSeparateCostEstimatePDFs(
  costEstimate: CostEstimate,
  selectedPages?: string[],
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<void> {
  try {
    // Group line items by site based on the site rental items
    const groupLineItemsBySite = (lineItems: any[]) => {
      console.log("[v0] All line items:", lineItems)

      const siteGroups: { [siteName: string]: any[] } = {}

      // Group line items by site based on the site rental items
      lineItems.forEach((item) => {
        if (item.category.includes("Billboard Rental")) {
          // This is a site rental item - use its description as the site name
          const siteName = item.description
          if (!siteGroups[siteName]) {
            siteGroups[siteName] = []
          }
          siteGroups[siteName].push(item)

          // Find related production, installation, and maintenance items for this site
          const siteId = item.id
          const relatedItems = lineItems.filter(
            (relatedItem) => relatedItem.id.includes(siteId) && relatedItem.id !== siteId,
          )
          siteGroups[siteName].push(...relatedItems)
        }
      })

      if (Object.keys(siteGroups).length === 0) {
        console.log("[v0] No billboard rental items found, treating as single site with all items")
        siteGroups["Single Site"] = lineItems
      } else {
        // Check for orphaned items (items not associated with any site)
        const groupedItemIds = new Set()
        Object.values(siteGroups).forEach((items) => {
          items.forEach((item) => groupedItemIds.add(item.id))
        })

        const orphanedItems = lineItems.filter((item) => !groupedItemIds.has(item.id))
        if (orphanedItems.length > 0) {
          console.log("[v0] Found orphaned items:", orphanedItems)
          const siteNames = Object.keys(siteGroups)
          siteNames.forEach((siteName) => {
            // Create copies of orphaned items for each site to avoid reference issues
            const orphanedCopies = orphanedItems.map((item) => ({ ...item }))
            siteGroups[siteName].push(...orphanedCopies)
          })
        }
      }

      console.log("[v0] Final site groups:", siteGroups)
      return siteGroups
    }

    const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
    const sites = Object.keys(siteGroups)

    const sitesToProcess =
      selectedPages && selectedPages.length > 0 ? sites.filter((site) => selectedPages.includes(site)) : sites

    if (sitesToProcess.length === 0) {
      throw new Error("No sites selected for PDF generation")
    }

    // Generate separate PDF for each site
    for (let i = 0; i < sitesToProcess.length; i++) {
      const siteName = sitesToProcess[i]
      const siteLineItems = siteGroups[siteName] || []

      // Create a modified cost estimate for this specific site with proper CE number
      const baseCENumber = costEstimate.costEstimateNumber || costEstimate.id
      const uniqueCENumber =
        sites.length > 1
          ? `${baseCENumber}-${String.fromCharCode(64 + (sites.indexOf(siteName) + 1))}` // Appends -A, -B, -C, etc.
          : baseCENumber

      const singleSiteCostEstimate = {
        ...costEstimate,
        lineItems: siteLineItems,
        title: sites.length > 1 ? siteName : costEstimate.title,
        costEstimateNumber: uniqueCENumber,
      }

      // Generate PDF for this single site
      await generateCostEstimatePDF(singleSiteCostEstimate, undefined, false, userData) // Pass userData to PDF generation

      // Add a small delay between downloads to ensure proper file naming
      if (i < sitesToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  } catch (error) {
    console.error("Error generating separate PDFs:", error)
    throw error
  }
}

/**
 * Generate a cost estimate PDF matching the exact format from the reference document
 */
export async function generateCostEstimatePDF(
  costEstimate: CostEstimate,
  selectedPages?: string[],
  returnBase64 = false,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<string | void> {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("PDF generation timeout")), 15000) // 15 second timeout
    })

    const pdfGenerationPromise = generatePDFInternal(costEstimate, selectedPages, returnBase64, userData)

    return await Promise.race([pdfGenerationPromise, timeoutPromise])
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

async function generatePDFInternal(
  costEstimate: CostEstimate,
  selectedPages?: string[],
  returnBase64 = false,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<string | void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Convert dates safely
  const createdAt = safeToDate(costEstimate.createdAt)
  const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
  const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

  // Get site information from line items
  const siteRentalItems = costEstimate.lineItems.filter(
    (item) =>
      item.category.includes("Billboard Rental") || item.category.includes("LED") || item.category.includes("Static"),
  )

  // Get the first site rental item for main details
  const primarySite = siteRentalItems[0]
  const siteName = primarySite?.description || costEstimate.title
  const siteLocation = primarySite?.notes?.replace("Location: ", "") || siteName

  // Calculate totals from actual line items
  const subtotal = costEstimate.lineItems.reduce((sum, item) => sum + item.total, 0)
  const vatRate = 0.12
  const vatAmount = subtotal * vatRate
  const totalWithVat = subtotal + vatAmount

  // Calculate monthly rate and duration from actual data
  const exactDurationInMonths = costEstimate.durationDays ? costEstimate.durationDays / 30 : 1
  const primaryRentalItem = siteRentalItems[0]
  // Use the actual unit price from the rental item, not calculated rate
  const monthlyRate = primaryRentalItem ? primaryRentalItem.unitPrice : 0

  const calculateDurationDisplay = (durationDays: number | null | undefined): string => {
    if (!durationDays) return "1 month"
    const months = Math.floor(durationDays / 30)
    const days = durationDays % 30
    if (months === 0) {
      return days === 1 ? "1 day" : `${days} days`
    } else if (days === 0) {
      return months === 1 ? "1 month" : `${months} months`
    } else {
      const monthText = months === 1 ? "month" : "months"
      const dayText = days === 1 ? "day" : "days"
      return `${months} ${monthText} and ${days} ${dayText}`
    }
  }

  const groupLineItemsBySite = (lineItems: any[]) => {
    const siteGroups: { [key: string]: any[] } = {}

    // Process each line item only once
    const processedIds = new Set<string>()

    lineItems.forEach((item) => {
      if (processedIds.has(item.id)) return // Skip already processed items
      processedIds.add(item.id)

      if (item.category.includes("Billboard Rental")) {
        const siteName = item.description
        if (!siteGroups[siteName]) {
          siteGroups[siteName] = []
        }
        siteGroups[siteName].push(item)

        const siteId = item.id
        const relatedItems = lineItems.filter(
          (relatedItem) =>
            relatedItem.id.includes(siteId) && relatedItem.id !== siteId && !processedIds.has(relatedItem.id),
        )
        relatedItems.forEach((relatedItem) => processedIds.add(relatedItem.id))
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

  const sitesToProcess =
    selectedPages && selectedPages.length > 0 ? sites.filter((site) => selectedPages.includes(site)) : sites

  if (sitesToProcess.length === 0) {
    throw new Error("No sites selected for PDF generation")
  }

  let companyData = null
  if (userData?.company_id || costEstimate.company_id) {
    const companyId = userData?.company_id || costEstimate.company_id
    companyData = await fetchCompanyData(companyId)
  }

  for (let siteIndex = 0; siteIndex < sitesToProcess.length; siteIndex++) {
    const siteName = sitesToProcess[siteIndex]

    if (siteIndex > 0) {
      pdf.addPage()
      yPosition = margin
    }

    const siteLineItems = siteGroups[siteName] || []
    const siteTotal = siteLineItems.reduce((sum, item) => sum + item.total, 0)

    const originalSiteIndex = sites.indexOf(siteName)
    const ceNumber = isMultipleSites
      ? `${costEstimate.costEstimateNumber || costEstimate.id}-${String.fromCharCode(65 + originalSiteIndex)}`
      : costEstimate.costEstimateNumber || costEstimate.id

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const companyName = companyData?.company_name || companyData?.name || "Golden Touch Imaging Specialist"
    const companyNameWidth = pdf.getTextWidth(companyName)
    const companyNameX = pageWidth / 2 - companyNameWidth / 2
    pdf.text(companyName, companyNameX, yPosition)
    yPosition += 15

    // Client name and company (top left)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text(costEstimate.client?.name || "Client Name", margin, yPosition)
    yPosition += 5
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "Client Company", margin, yPosition)
    yPosition += 10

    // RFQ Number (top right)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    const rfqText = `RFQ. No. ${ceNumber}`
    const rfqTextWidth = pdf.getTextWidth(rfqText)
    const rfqX = pageWidth - margin - rfqTextWidth
    pdf.text(rfqText, rfqX, yPosition - 15)

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    const dateText = createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    const dateTextWidth = pdf.getTextWidth(dateText)
    const dateX = pageWidth - margin - dateTextWidth
    pdf.text(dateText, dateX, yPosition - 10)

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const titleText = isMultipleSites
      ? `Cost Estimate for ${siteName}`
      : costEstimate.title ||
        `Cost Estimate for ${costEstimate.client?.company || costEstimate.client?.name || "Client"}`
    const titleWidth = pdf.getTextWidth(titleText)
    const titleX = pageWidth / 2 - titleWidth / 2
    pdf.text(titleText, titleX, yPosition)

    // Add underline to title
    pdf.setLineWidth(0.5)
    pdf.line(titleX, yPosition + 2, titleX + titleWidth, yPosition + 2)
    yPosition += 15

    // Greeting message - positioned prominently at top
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    const greetingLine1 = `Good Day! Thank you for considering ${companyName} for your business needs.`
    const greetingLine2 = "We are pleased to submit our cost estimate for your requirements:"

    // Calculate center position for each line
    const centerX = pageWidth / 2
    const line1Width = pdf.getTextWidth(greetingLine1)
    const line2Width = pdf.getTextWidth(greetingLine2)

    pdf.text(greetingLine1, centerX - line1Width / 2, yPosition)
    yPosition += 5
    pdf.text(greetingLine2, centerX - line2Width / 2, yPosition)
    yPosition += 15

    // "Details as follows:" section
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text("Details as follows:", margin, yPosition)
    yPosition += 8

    // Bullet points section with exact formatting
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Extract size information from line items or use default
    const sizeInfo = siteLineItems[0]?.notes?.includes("Location:")
      ? "100ft (H) x 60ft (W)"
      : siteLineItems[0]?.notes || "100ft (H) x 60ft (W)"

    const bulletPoints = [
      { label: "Site Location", value: siteLocation },
      { label: "Type", value: "Billboard" },
      { label: "Size", value: sizeInfo },
      { label: "Contract Duration", value: calculateDurationDisplay(costEstimate.durationDays) },
      {
        label: "Contract Period",
        value: `${startDate ? startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "June 15, 2025"} - ${endDate ? endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "December 14, 2025"}`,
      },
      { label: "Proposal to", value: costEstimate?.client?.company || "Client Company" },
      { label: "Illumination", value: `${siteLineItems[0]?.quantity || 10} units of 1000 watts metal Halide` },
      { label: "Lease Rate/Month", value: "(Exclusive of VAT)" },
      { label: "Total Lease", value: "(Exclusive of VAT)" },
    ]

    bulletPoints.forEach((point) => {
      pdf.text("•", margin, yPosition)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${point.label}:`, margin + 5, yPosition)
      pdf.setFont("helvetica", "normal")

      // Special handling for lease rate values
      if (point.label === "Lease Rate/Month") {
        pdf.text(
          `PHP ${monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}     ${point.value}`,
          margin + 65,
          yPosition,
        )
      } else if (point.label === "Total Lease") {
        pdf.text(
          `PHP ${siteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}     ${point.value}`,
          margin + 65,
          yPosition,
        )
      } else {
        pdf.text(point.value, margin + 65, yPosition)
      }
      yPosition += 6
    })

    yPosition += 5

    // Calculation breakdown section with exact formatting
    pdf.setFontSize(10)
    const siteRentalItem = siteLineItems.find((item) => item.category.includes("Billboard Rental"))

    const actualMonthlyRate = siteRentalItem ? siteRentalItem.unitPrice : 0
    const actualDurationInMonths = costEstimate.durationDays ? costEstimate.durationDays / 30 : 1
    const calculatedTotal = actualMonthlyRate * actualDurationInMonths
    const formattedDuration = calculateDurationDisplay(costEstimate.durationDays)
    const siteVatAmount = calculatedTotal * 0.12
    const siteTotalWithVat = calculatedTotal + siteVatAmount

    // Lease rate calculation - using actual monthly rate
    pdf.text("Lease rate per month", margin + 5, yPosition)
    pdf.text(
      `PHP ${actualMonthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 6

    pdf.text(`x ${formattedDuration}`, margin + 5, yPosition)
    pdf.text(
      `PHP ${calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 6

    pdf.text("12 % VAT", margin + 5, yPosition)
    pdf.text(
      `PHP ${siteVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 8

    // Total line
    pdf.setFont("helvetica", "bold")
    pdf.text("TOTAL", margin + 5, yPosition)
    pdf.text(
      `PHP ${siteTotalWithVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 10

    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)

    // Format company address and phone
    const companyAddress = formatCompanyAddress(companyData)
    const companyPhone = formatCompanyPhone(companyData)

    // Create footer text with fallback to default values
    const addressText = companyAddress || "No. 727 General Solano St., San Miguel, Manila 1005"
    const footerText = addressText

    // Calculate text width and center the footer
    const footerTextWidth = pdf.getTextWidth(footerText)
    const footerX = pageWidth / 2 - footerTextWidth / 2

    pdf.text(footerText, footerX, pageHeight - 15)
  }

  // Return base64 or download PDF
  if (returnBase64) {
    return pdf.output("datauristring").split(",")[1]
  } else {
    const baseFileName = (costEstimate.title || "cost-estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const sitesSuffix =
      selectedPages && selectedPages.length > 0 && selectedPages.length < sites.length
        ? `_selected-${selectedPages.length}-sites`
        : sites.length > 1 && sitesToProcess.length === 1
          ? `_${sitesToProcess[0].replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
          : sites.length > 1
            ? `_all-${sites.length}-sites`
            : ""
    const fileName = `cost-estimate-${baseFileName}${sitesSuffix}-${Date.now()}.pdf`

    console.log("[v0] Attempting to download PDF:", fileName)
    pdf.save(fileName)
    console.log("[v0] PDF download triggered successfully")
  }
}

/**
 * Generate a detailed cost estimate PDF with line item breakdown
 */
export async function generateDetailedCostEstimatePDF(
  costEstimate: CostEstimate,
  returnBase64 = false,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Convert dates safely
    const createdAt = safeToDate(costEstimate.createdAt)
    const validUntil = safeToDate(costEstimate.validUntil)
    const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
    const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

    let companyData = null
    if (userData?.company_id || costEstimate.company_id) {
      const companyId = userData?.company_id || costEstimate.company_id
      companyData = await fetchCompanyData(companyId)
    }

    // Header with company name
    const headerContentWidth = contentWidth - 22
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const companyName = companyData?.company_name || companyData?.name || "Golden Touch Imaging Specialist"
    const companyNameWidth = pdf.getTextWidth(companyName)
    const companyNameX = pageWidth / 2 - companyNameWidth / 2
    pdf.text(companyName, companyNameX, yPosition)
    yPosition += 15

    // Cost Estimate title
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST ESTIMATE", margin, yPosition)
    yPosition += 12

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(costEstimate.title || "Untitled Cost Estimate", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 3

    // Date and validity
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Estimate #: ${costEstimate.costEstimateNumber || costEstimate.id}`, margin, yPosition + 5)
    yPosition += 15

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 6

    // Draw line under section header
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Client details in two columns
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    // Left column
    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "N/A", leftColumn + 25, yPosition)

    // Right column
    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.name || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Second row
    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Address (full width if present)
    if (costEstimate.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      const addressLines = pdf.splitTextToSize(costEstimate.client.address, contentWidth - 25)
      pdf.text(addressLines, leftColumn + 25, yPosition)
      yPosition += addressLines.length * 5 + 3
    }

    yPosition += 8

    // Cost Summary Section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST SUMMARY", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Calculate totals
    const subtotal = costEstimate.lineItems.reduce((sum, item) => sum + item.total, 0)
    const vatRate = 0.12
    const vatAmount = subtotal * vatRate
    const totalWithVat = subtotal + vatAmount

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Summary items
    const summaryItems = [
      { label: "Number of Items:", value: `${costEstimate.lineItems?.length || 0} line items` },
      { label: "Duration:", value: `${costEstimate.durationDays || 0} days` },
      { label: "Start Date:", value: startDate ? startDate.toLocaleDateString() : "TBD" },
      { label: "End Date:", value: endDate ? endDate.toLocaleDateString() : "TBD" },
    ]

    summaryItems.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, margin + 40, yPosition)
      yPosition += 6
    })

    yPosition += 8

    // Financial Summary with better formatting
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("FINANCIAL SUMMARY", margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("Subtotal:", margin + 5, yPosition)
    pdf.text(`₱${subtotal.toLocaleString()}`, pageWidth - margin - 40, yPosition)
    yPosition += 6

    pdf.text(`VAT (${(vatRate * 100).toFixed(0)}%):`, margin + 5, yPosition)
    pdf.text(`₱${vatAmount.toLocaleString()}`, pageWidth - margin - 40, yPosition)
    yPosition += 8

    // Total amount with better formatting
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalText = `TOTAL AMOUNT: ₱${totalWithVat.toLocaleString()}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes section
    if (costEstimate.notes) {
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL NOTES", margin, yPosition)
      yPosition += 6

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      const noteLines = pdf.splitTextToSize(costEstimate.notes, contentWidth)
      pdf.text(noteLines, margin, yPosition)
      yPosition += noteLines.length * 5 + 10
    }

    // Footer
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `detailed-cost-estimate-${(costEstimate.title || "estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating detailed Cost Estimate PDF:", error)
    throw new Error("Failed to generate detailed Cost Estimate PDF")
  }
}

/**
 * Generate a cost estimate PDF for email attachment (similar to generateProposalPDF)
 * This function creates a simplified PDF optimized for email attachments
 */
export async function generateCostEstimateEmailPDF(
  costEstimate: CostEstimate,
  returnBase64 = false,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<string | void> {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("PDF generation timeout")), 10000) // 10 second timeout for email
    })

    const pdfGenerationPromise = generateEmailPDFInternal(costEstimate, returnBase64, userData)

    return await Promise.race([pdfGenerationPromise, timeoutPromise])
  } catch (error) {
    console.error("Error generating email PDF:", error)
    throw error
  }
}

async function generateEmailPDFInternal(
  costEstimate: CostEstimate,
  returnBase64 = false,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string },
): Promise<string | void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Convert dates safely
  const createdAt = safeToDate(costEstimate.createdAt)
  const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
  const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

  // Generate QR Code for cost estimate view URL
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimate.id}`
  const qrCodeUrl = await generateQRCode(costEstimateViewUrl)

  // Get company data
  let companyData = null
  if (userData?.company_id || costEstimate.company_id) {
    const companyId = userData?.company_id || costEstimate.company_id
    companyData = await fetchCompanyData(companyId)
  }

  // Helper function to add QR code to first page only
  const addQRCodeToFirstPage = async () => {
    try {
      const qrSize = 18
      const qrX = pageWidth - margin - qrSize
      const qrY = margin

      // Simple QR code placeholder (since we can't easily load external images in email context)
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      const qrText = "Scan to view online"
      const textWidth = pdf.getTextWidth(qrText)
      const textX = qrX + (qrSize - textWidth) / 2

      if (textX >= margin && textX + textWidth <= pageWidth - margin) {
        pdf.text(qrText, textX, qrY + qrSize + 3)
      }
      pdf.setTextColor(0, 0, 0)
    } catch (error) {
      console.error("Error adding QR code to PDF:", error)
      // Continue without QR code if it fails
    }
  }

  // Add QR code to first page
  await addQRCodeToFirstPage()

  // Header with company name
  const headerContentWidth = contentWidth - 22
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  const companyName = companyData?.company_name || companyData?.name || "Golden Touch Imaging Specialist"
  const companyNameWidth = pdf.getTextWidth(companyName)
  const companyNameX = pageWidth / 2 - companyNameWidth / 2
  pdf.text(companyName, companyNameX, yPosition)
  yPosition += 15

  // Cost Estimate title
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("COST ESTIMATE", margin, yPosition)
  yPosition += 12

  pdf.setFontSize(16)
  pdf.setFont("helvetica", "normal")
  const titleLines = pdf.splitTextToSize(costEstimate.title || "Untitled Cost Estimate", headerContentWidth)
  pdf.text(titleLines, margin, yPosition)
  yPosition += titleLines.length * 6 + 3

  // Date and validity
  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
  pdf.text(`Estimate #: ${costEstimate.costEstimateNumber || costEstimate.id}`, margin, yPosition + 5)
  yPosition += 15

  // Reset text color
  pdf.setTextColor(0, 0, 0)

  // Client Information Section
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLIENT INFORMATION", margin, yPosition)
  yPosition += 6

  // Draw line under section header
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  // Client details in two columns
  const leftColumn = margin
  const rightColumn = margin + contentWidth / 2

  // Left column
  pdf.setFont("helvetica", "bold")
  pdf.text("Company:", leftColumn, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(costEstimate.client?.company || "N/A", leftColumn + 25, yPosition)

  // Right column
  pdf.setFont("helvetica", "bold")
  pdf.text("Contact Person:", rightColumn, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(costEstimate.client?.name || "N/A", rightColumn + 35, yPosition)
  yPosition += 6

  // Second row
  pdf.setFont("helvetica", "bold")
  pdf.text("Email:", leftColumn, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(costEstimate.client?.email || "N/A", leftColumn + 25, yPosition)

  pdf.setFont("helvetica", "bold")
  pdf.text("Phone:", rightColumn, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(costEstimate.client?.phone || "N/A", rightColumn + 35, yPosition)
  yPosition += 6

  // Address (full width if present)
  if (costEstimate.client?.address) {
    pdf.setFont("helvetica", "bold")
    pdf.text("Address:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    const addressLines = pdf.splitTextToSize(costEstimate.client.address, contentWidth - 25)
    pdf.text(addressLines, leftColumn + 25, yPosition)
    yPosition += addressLines.length * 5 + 3
  }

  yPosition += 8

  // Cost Summary Section
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("COST SUMMARY", margin, yPosition)
  yPosition += 6

  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Calculate totals
  const subtotal = costEstimate.lineItems.reduce((sum, item) => sum + item.total, 0)
  const vatRate = 0.12
  const vatAmount = subtotal * vatRate
  const totalWithVat = subtotal + vatAmount

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  // Summary items
  const summaryItems = [
    { label: "Number of Items:", value: `${costEstimate.lineItems?.length || 0} line items` },
    { label: "Duration:", value: `${costEstimate.durationDays || 0} days` },
    { label: "Start Date:", value: startDate ? startDate.toLocaleDateString() : "TBD" },
    { label: "End Date:", value: endDate ? endDate.toLocaleDateString() : "TBD" },
  ]

  summaryItems.forEach((item) => {
    pdf.setFont("helvetica", "bold")
    pdf.text(item.label, margin, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(item.value, margin + 40, yPosition)
    yPosition += 6
  })

  yPosition += 8

  // Financial Summary with better formatting
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("FINANCIAL SUMMARY", margin, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text("Subtotal:", margin + 5, yPosition)
  pdf.text(`₱${subtotal.toLocaleString()}`, pageWidth - margin - 40, yPosition)
  yPosition += 6

  pdf.text(`VAT (${(vatRate * 100).toFixed(0)}%):`, margin + 5, yPosition)
  pdf.text(`₱${vatAmount.toLocaleString()}`, pageWidth - margin - 40, yPosition)
  yPosition += 8

  // Total amount with better formatting
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  const totalText = `TOTAL AMOUNT: ₱${totalWithVat.toLocaleString()}`
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
  pdf.text(totalText, margin + 5, yPosition + 3)
  yPosition += 15

  // Notes section
  if (costEstimate.notes) {
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("ADDITIONAL NOTES", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    const noteLines = pdf.splitTextToSize(costEstimate.notes, contentWidth)
    pdf.text(noteLines, margin, yPosition)
    yPosition += noteLines.length * 5 + 10
  }

  // Footer
  const footerY = pageHeight - 15
  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text("Generated by OH Plus Platform", margin, footerY)
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

  if (returnBase64) {
    // Return base64 string for email attachment
    return pdf.output("datauristring").split(",")[1]
  } else {
    // Save the PDF for download
    const fileName = `cost-estimate-${(costEstimate.title || "estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
    pdf.save(fileName)
  }
}
