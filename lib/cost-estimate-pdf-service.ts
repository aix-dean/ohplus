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
  try {
    const companyDoc = await getDoc(doc(db, "companies", companyId))
    if (companyDoc.exists()) {
      return companyDoc.data()
    }
    return null
  } catch (error) {
    console.error("Error fetching company data:", error)
    return null
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

    // Group line items by site for multi-site handling
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
      } else {
        // Handle orphaned items
        const groupedItemIds = new Set()
        Object.values(siteGroups).forEach((items) => {
          items.forEach((item) => groupedItemIds.add(item.id))
        })

        const orphanedItems = lineItems.filter((item) => !groupedItemIds.has(item.id))
        if (orphanedItems.length > 0) {
          const siteNames = Object.keys(siteGroups)
          siteNames.forEach((siteName) => {
            const orphanedCopies = orphanedItems.map((item) => ({ ...item }))
            siteGroups[siteName].push(...orphanedCopies)
          })
        }
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

    // Process each site
    sitesToProcess.forEach(async (siteName, siteIndex) => {
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
      pdf.text(`RFQ. No. ${ceNumber}`, pageWidth - margin - 40, yPosition - 15)

      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        pageWidth - margin - 40,
        yPosition - 10,
      )

      // Greeting message - positioned prominently at top
      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      const greetingLine1 = "Good Day! Thank you for considering Golden Touch for your business needs."
      const greetingLine2 = "We are pleased to submit our quotation for your requirements:"

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

      // Note about free material changes
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      pdf.text(`Note: free two (2) change material for ${formattedDuration} rental`, margin, yPosition)
      yPosition += 10

      // Terms and Conditions section with exact formatting
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text("Terms and Conditions:", margin, yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      const terms = [
        "1. Quotation validity:  5 working days.",
        "2. Availability of the site is on first-come-first-served-basis only. Only offical documents such as P.O's,",
        "    Media Orders, signed quotation, & contracts are accepted in order to booked the site.",
        "3. To book the site, one (1) month advance and one (2) months security deposit",
        "    payment dated 7 days before the start of rental is required.",
        "4. Final artwork should be approved ten (10) days before the contract period",
        "5. Print is exclusively for Golden Touch Imaging Specialist Only.",
      ]

      terms.forEach((term) => {
        pdf.text(term, margin, yPosition)
        yPosition += 6
      })

      yPosition += 15

      // Signature section with exact formatting
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      // "Very truly yours," and "Conforme:" on same line
      pdf.text("Very truly yours,", margin, yPosition)
      pdf.text("C o n f o r m e:", margin + contentWidth / 2, yPosition)
      yPosition += 20

      // Names
      pdf.setFont("helvetica", "normal")
      const userFullName =
        userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : "Account Manager"
      pdf.text(userFullName, margin, yPosition)
      pdf.text(costEstimate.client?.name || "Client Name", margin + contentWidth / 2, yPosition)
      yPosition += 6

      // Titles/Companies
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate.position || "Position", margin, yPosition)
      pdf.text(costEstimate.client?.company || "Client Company", margin + contentWidth / 2, yPosition)
      yPosition += 10

      // Billing purpose note
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.text("This signed Quotation serves as an", margin + contentWidth / 2, yPosition)
      yPosition += 4
      pdf.text("official document for billing purposes", margin + contentWidth / 2, yPosition)
      yPosition += 15

      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)

      // Format company address and phone
      const companyAddress = formatCompanyAddress(companyData)
      const companyPhone = formatCompanyPhone(companyData)

      // Create footer text with fallback to default values
      const addressText = companyAddress || "No. 727 General Solano St., San Miguel, Manila 1005"
      const phoneText = companyPhone ? `Telephone: ${companyPhone}` : "Telephone: (02) 5310 1750 to 53"
      const footerText = `${addressText}. ${phoneText}`

      // Calculate text width and center the footer
      const footerTextWidth = pdf.getTextWidth(footerText)
      const footerX = pageWidth / 2 - footerTextWidth / 2

      pdf.text(footerText, footerX, pageHeight - 15)
    })

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
  } catch (error) {
    console.error("Error generating Cost Estimate PDF:", error)
    throw new Error("Failed to generate Cost Estimate PDF")
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
    pdf.text(`RFQ. No. ${costEstimate.costEstimateNumber || costEstimate.id}`, pageWidth - margin - 40, yPosition - 15)

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(
      createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      pageWidth - margin - 40,
      yPosition - 10,
    )

    // Greeting message - positioned prominently at top
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    const greetingLine1 = "Good Day! Thank you for considering Golden Touch for your business needs."
    const greetingLine2 = "We are pleased to submit our quotation for your requirements:"

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
    yPosition += 15

    // Cost estimate information
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Cost Estimate Details", margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const infoItems = [
      { label: "Estimate Number:", value: costEstimate.costEstimateNumber || costEstimate.id },
      { label: "Title:", value: costEstimate.title },
      { label: "Created Date:", value: createdAt.toLocaleDateString() },
      { label: "Valid Until:", value: validUntil ? validUntil.toLocaleDateString() : "N/A" },
      { label: "Status:", value: costEstimate.status.charAt(0).toUpperCase() + costEstimate.status.slice(1) },
    ]

    if (startDate && endDate) {
      infoItems.push(
        { label: "Start Date:", value: startDate.toLocaleDateString() },
        { label: "End Date:", value: endDate.toLocaleDateString() },
        { label: "Duration:", value: `${costEstimate.durationDays || 0} days` },
      )
    }

    infoItems.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, margin + 40, yPosition)
      yPosition += 6
    })

    yPosition += 15

    // Client information
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Client Information", margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const clientInfo = [
      { label: "Name:", value: costEstimate.client?.name || "N/A" },
      { label: "Company:", value: costEstimate.client?.company || "N/A" },
      { label: "Email:", value: costEstimate.client?.email || "N/A" },
      { label: "Phone:", value: costEstimate.client?.phone || "N/A" },
      { label: "Address:", value: costEstimate.client?.address || "N/A" },
    ]

    clientInfo.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, margin + 25, yPosition)
      yPosition += 6
    })

    yPosition += 15

    // Line items table
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Cost Breakdown", margin, yPosition)
    yPosition += 10

    // Table headers
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition - 5, contentWidth, 8, "F")

    pdf.text("Description", margin + 2, yPosition)
    pdf.text("Category", margin + 80, yPosition)
    pdf.text("Qty", margin + 120, yPosition)
    pdf.text("Unit Price", margin + 135, yPosition)
    pdf.text("Total", margin + 165, yPosition)
    yPosition += 8

    // Table content
    pdf.setFont("helvetica", "normal")
    let subtotal = 0

    costEstimate.lineItems.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin + 20
      }

      const bgColor = index % 2 === 0 ? 255 : 250
      pdf.setFillColor(bgColor, bgColor, bgColor)
      pdf.rect(margin, yPosition - 5, contentWidth, 8, "F")

      // Truncate long descriptions
      const description = item.description.length > 35 ? item.description.substring(0, 32) + "..." : item.description

      pdf.text(description, margin + 2, yPosition)
      pdf.text(categoryLabels[item.category] || item.category, margin + 80, yPosition)
      pdf.text(item.quantity.toString(), margin + 120, yPosition)
      pdf.text(`₱${item.unitPrice.toLocaleString()}`, margin + 135, yPosition)
      pdf.text(`₱${item.total.toLocaleString()}`, margin + 165, yPosition)

      subtotal += item.total
      yPosition += 8
    })

    yPosition += 5

    // Totals section
    const taxRate = 0.12
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    pdf.setFont("helvetica", "bold")
    pdf.text("Subtotal:", margin + 135, yPosition)
    pdf.text(`₱${subtotal.toLocaleString()}`, margin + 165, yPosition)
    yPosition += 6

    pdf.text(`VAT (${(taxRate * 100).toFixed(0)}%):`, margin + 135, yPosition)
    pdf.text(`₱${taxAmount.toLocaleString()}`, margin + 165, yPosition)
    yPosition += 6

    // Total line
    pdf.setLineWidth(0.5)
    pdf.line(margin + 130, yPosition, pageWidth - margin, yPosition)
    yPosition += 6

    pdf.setFontSize(12)
    pdf.text("TOTAL AMOUNT:", margin + 135, yPosition)
    pdf.text(`₱${totalAmount.toLocaleString()}`, margin + 165, yPosition)
    yPosition += 15

    // Notes section
    if (costEstimate.notes) {
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.text("Notes:", margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      const noteLines = pdf.splitTextToSize(costEstimate.notes, contentWidth)
      pdf.text(noteLines, margin, yPosition)
      yPosition += noteLines.length * 5 + 10
    }

    yPosition = pageHeight - 30
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(100, 100, 100)

    // Format company address and phone
    const companyAddress = formatCompanyAddress(companyData)
    const companyPhone = formatCompanyPhone(companyData)
    const addressText = companyAddress || "No. 727 General Solano St., San Miguel, Manila 1005"
    const phoneText = companyPhone ? `Telephone: ${companyPhone}` : "Telephone: (02) 5310 1750 to 53"
    const footerText = `${addressText}. ${phoneText}`

    // Center the footer text
    const footerTextWidth = pdf.getTextWidth(footerText)
    const footerX = pageWidth / 2 - footerTextWidth / 2

    pdf.text(footerText, footerX, yPosition)

    // Return base64 or download PDF
    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `detailed-cost-estimate-${(costEstimate.title || "estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating detailed Cost Estimate PDF:", error)
    throw new Error("Failed to generate detailed Cost Estimate PDF")
  }
}
