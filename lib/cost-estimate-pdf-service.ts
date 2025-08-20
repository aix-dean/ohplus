import jsPDF from "jspdf"
import type { CostEstimate } from "@/lib/types/cost-estimate"

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

/**
 * Generate separate PDF files for each site in a cost estimate
 */
export async function generateSeparateCostEstimatePDFs(
  costEstimate: CostEstimate,
  selectedPages?: string[],
  userData?: { first_name?: string; last_name?: string; email?: string }, // Updated to use first_name and last_name
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
  userData?: { first_name?: string; last_name?: string; email?: string }, // Updated to use first_name and last_name
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

    // Header section - Client name and RFQ number on same line
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text(costEstimate.client?.name || "Client Name", margin, yPosition)
    pdf.text(`RFQ. No. ${costEstimate.costEstimateNumber || costEstimate.id}`, pageWidth - margin - 50, yPosition)
    yPosition += 6

    // Company name
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "Client Company", margin, yPosition)
    yPosition += 10

    // Greeting message positioned at top
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("Good Day! Thank you for considering Golden Touch for your business needs.", margin, yPosition)
    yPosition += 5
    pdf.text("We are pleased to submit our quotation for your requirements:", margin, yPosition)
    yPosition += 10

    // "Details as follows:" section
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text("Details as follows:", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const bulletPoints = [
      { label: "Site Location", value: siteLocation },
      { label: "Type", value: "Billboard" },
      { label: "Size", value: "100ft (H) x 60ft (W)" },
      { label: "Contract Duration", value: calculateDurationDisplay(costEstimate.durationDays) },
      {
        label: "Contract Period",
        value: `${startDate ? startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "June 15, 2025"} - ${endDate ? endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "December 14, 2025"}`,
      },
      { label: "Proposal to", value: costEstimate?.client?.company || "Client Company" },
      { label: "Illumination", value: `${siteRentalItems[0]?.quantity || 10} units of 1000 watts metal Halide` },
      {
        label: "Lease Rate/Month",
        value: `${monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP     (Exclusive of VAT)`,
      },
      {
        label: "Total Lease",
        value: `${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP     (Exclusive of VAT)`,
      },
    ]

    bulletPoints.forEach((point) => {
      pdf.text("●", margin, yPosition)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${point.label}:`, margin + 5, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(point.value, margin + 50, yPosition)
      yPosition += 5
    })

    yPosition += 5

    const formattedDuration = calculateDurationDisplay(costEstimate.durationDays)
    const calculatedTotal = monthlyRate * exactDurationInMonths
    const siteVatAmount = calculatedTotal * 0.12
    const siteTotalWithVat = calculatedTotal + siteVatAmount

    pdf.text("Lease rate per month", margin + 5, yPosition)
    pdf.text(
      `${monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 5

    pdf.text(`x ${formattedDuration}`, margin + 5, yPosition)
    pdf.text(
      `${calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 5

    pdf.text("12 % VAT", margin + 5, yPosition)
    pdf.text(
      `${siteVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 8

    pdf.setFont("helvetica", "bold")
    pdf.text("TOTAL", margin + 5, yPosition)
    pdf.text(
      `${siteTotalWithVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 8

    // Note about free material changes
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(`Note: free two (2) change material for ${formattedDuration} rental`, margin, yPosition)
    yPosition += 10

    // Terms and Conditions with exact formatting
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("Terms and Conditions:", margin, yPosition)
    yPosition += 6

    pdf.setFont("helvetica", "normal")
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
      yPosition += 5
    })

    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("Very truly yours,", margin, yPosition)
    pdf.text("C o n f o r m e:", margin + contentWidth / 2, yPosition)
    yPosition += 15

    // Names
    const userFullName =
      userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : "Account Manager"
    pdf.text(userFullName, margin, yPosition)
    pdf.text(costEstimate.client?.name || "Client Name", margin + contentWidth / 2, yPosition)
    yPosition += 5

    // Titles
    pdf.text("Account Management", margin, yPosition)
    pdf.text(costEstimate.client?.company || "Client Company", margin + contentWidth / 2, yPosition)
    yPosition += 8

    // Billing purpose note
    pdf.setFontSize(9)
    pdf.text("This signed Quotation serves as an", margin + contentWidth / 2, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", margin + contentWidth / 2, yPosition)

    pdf.setFontSize(8)
    pdf.setTextColor(0, 0, 0)
    pdf.text(
      "No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53",
      margin,
      pageHeight - 25,
    )
    pdf.text("email: sales@goldentouchimaging.com or gtigolden@gmail.com", margin, pageHeight - 20)

    // Date and title at bottom
    pdf.text(
      createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      margin,
      pageHeight - 10,
    )
    pdf.text(`${siteName} QUOTATION`, pageWidth - margin - 60, pageHeight - 10)

    // Return base64 or download PDF
    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `cost-estimate-${(costEstimate.title || "estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
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
  userData?: { first_name?: string; last_name?: string; email?: string }, // Updated to use first_name and last_name for consistency
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

    // Header with company branding
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text("COST ESTIMATE", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10

    // Underline
    pdf.setLineWidth(1)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
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

    // Footer
    yPosition = pageHeight - 30
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`© ${new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.`, margin, yPosition)
  } catch (error) {
    console.error("Error generating detailed Cost Estimate PDF:", error)
    throw new Error("Failed to generate detailed Cost Estimate PDF")
  }
}
