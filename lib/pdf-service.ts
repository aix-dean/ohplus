import { jsPDF } from "jspdf"
import type { CostEstimate } from "./types" // Assuming CostEstimate is defined in a types file
import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase" // Import db from local firebase config
import { safeToDate } from "./utils" // Assuming safeToDate is imported from a utils file

export async function generateCostEstimatePDF(
  costEstimate: CostEstimate,
  selectedPages?: string[],
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2

    const createdAt = safeToDate(costEstimate.createdAt)
    const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
    const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

    // Fetch user and company data ONCE before processing
    let representativeName = "Representative Name"
    let companyName = "Company Name"
    let companyLocation = "Company Location"
    let companyPhone = "Company Phone"

    if (costEstimate.createdBy) {
      try {
        const userDocRef = doc(db, "iboard_users", costEstimate.createdBy)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          representativeName =
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            userData.display_name ||
            "Representative Name"

          if (userData.company_id) {
            const companyDocRef = doc(db, "companies", userData.company_id)
            const companyDoc = await getDoc(companyDocRef)

            if (companyDoc.exists()) {
              const companyData = companyDoc.data()
              companyName = companyData.name || "Company Name"

              if (companyData.address) {
                const addressParts = []
                if (companyData.address.street) addressParts.push(companyData.address.street)
                if (companyData.address.city) addressParts.push(companyData.address.city)
                if (companyData.address.province) addressParts.push(companyData.address.province)
                companyLocation = addressParts.join(", ") || "Company Location"
              } else if (companyData.company_location) {
                companyLocation = companyData.company_location
              }

              companyPhone = companyData.phone || companyData.contact_phone || "Company Phone"
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user and company data:", error)
      }
    }

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

    // Process each site synchronously with proper async handling
    for (let siteIndex = 0; siteIndex < sitesToProcess.length; siteIndex++) {
      const siteName = sitesToProcess[siteIndex]

      if (siteIndex > 0) {
        pdf.addPage()
      }

      let yPosition = margin
      const siteLineItems = siteGroups[siteName] || []
      const siteTotal = siteLineItems.reduce((sum, item) => sum + item.total, 0)

      const originalSiteIndex = sites.indexOf(siteName)
      const ceNumber = isMultipleSites
        ? `${costEstimate.costEstimateNumber || costEstimate.id}-${String.fromCharCode(65 + originalSiteIndex)}`
        : costEstimate.costEstimateNumber || costEstimate.id

      // Header section
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        margin,
        yPosition,
      )
      yPosition += 8

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      pdf.text(costEstimate.client?.name || "Client Name", margin, yPosition)
      yPosition += 4
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate.client?.company || "Client Company", margin, yPosition)
      yPosition += 8

      // RFQ Number (right aligned)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text("RFQ No.", pageWidth - margin - 30, yPosition - 12)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      pdf.text(ceNumber, pageWidth - margin - 30, yPosition - 8)

      // Title section
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      const adjustedTitle = isMultipleSites ? siteName : costEstimate?.title
      const titleText = `${adjustedTitle} COST ESTIMATE`
      const titleWidth = pdf.getTextWidth(titleText)
      pdf.text(titleText, (pageWidth - titleWidth) / 2, yPosition)

      // Underline the title
      pdf.setLineWidth(0.5)
      pdf.line((pageWidth - titleWidth) / 2, yPosition + 2, (pageWidth + titleWidth) / 2, yPosition + 2)
      yPosition += 12

      // "Details as follows:" section
      pdf.setFontSize(11)
      pdf.setFont("helvetica", "bold")
      pdf.text("Details as follows:", margin, yPosition)
      yPosition += 8

      // Bullet points section
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")

      const bulletPoints = [
        { label: "Site Location", value: siteName },
        { label: "Type", value: siteLineItems[0]?.description || "Billboard" },
        { label: "Size", value: siteLineItems[0]?.notes || "Standard Size" },
        { label: "Contract Duration", value: `${costEstimate?.durationDays || 30} DAYS` },
        {
          label: "Contract Period",
          value: `${startDate ? startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"} - ${endDate ? endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}`,
        },
        { label: "Proposal to", value: costEstimate?.client?.company || "Client Company" },
        { label: "Illumination", value: `${siteLineItems[0]?.quantity || 1} units of lighting system` },
        {
          label: "Lease Rate/Month",
          value: `PHP ${(siteTotal / (costEstimate?.durationDays ? Math.ceil(costEstimate.durationDays / 30) : 1)).toLocaleString("en-US", { minimumFractionDigits: 2 })} (Exclusive of VAT)`,
        },
        {
          label: "Total Lease",
          value: `PHP ${siteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Exclusive of VAT)`,
        },
      ]

      bulletPoints.forEach((point) => {
        pdf.text("•", margin, yPosition)
        pdf.setFont("helvetica", "bold")
        pdf.text(point.label, margin + 5, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(`: ${point.value}`, margin + 35, yPosition)
        yPosition += 5
      })

      yPosition += 3

      // Calculation breakdown section
      pdf.setFontSize(9)

      const monthlyRate = siteTotal / (costEstimate?.durationDays ? Math.ceil(costEstimate.durationDays / 30) : 1)
      const months = costEstimate?.durationDays ? Math.ceil(costEstimate.durationDays / 30) : 1
      const vatAmount = siteTotal * 0.12
      const totalWithVat = siteTotal + vatAmount

      pdf.text("Lease rate per month", margin + 5, yPosition + 6)
      pdf.text(
        `PHP ${monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pageWidth - margin - 5,
        yPosition + 6,
        { align: "right" },
      )

      pdf.text(`x ${months} months`, margin + 5, yPosition + 12)
      pdf.text(
        `PHP ${siteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pageWidth - margin - 5,
        yPosition + 12,
        { align: "right" },
      )

      pdf.text("12% VAT", margin + 5, yPosition + 18)
      pdf.text(
        `PHP ${vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pageWidth - margin - 5,
        yPosition + 18,
        { align: "right" },
      )

      // Total line
      pdf.setLineWidth(0.5)
      pdf.line(margin + 5, yPosition + 22, pageWidth - margin - 5, yPosition + 22)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text("TOTAL", margin + 5, yPosition + 28)
      pdf.text(
        `PHP ${totalWithVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pageWidth - margin - 5,
        yPosition + 28,
        { align: "right" },
      )

      yPosition += 35

      // Terms and Conditions section
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text("Terms and Conditions:", margin, yPosition)
      yPosition += 6

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      const terms = [
        "1. Quotation validity: 5 working days.",
        "2. Availability of the site is on first-come-first-served basis only. Only official documents such as",
        "   P.O.'s, Media Orders, signed quotation, & contracts are accepted in order to be booked the site.",
        "3. To book the site, one (1) month advance and one (2) months security deposit.",
        "   payment dated 7 days before the start of rental is required.",
        "4. Final artwork should be approved ten (10) days before the contract period",
        "5. Print is exclusively for Company Name Only.",
      ]

      terms.forEach((term) => {
        pdf.text(term, margin, yPosition)
        yPosition += 5
      })

      yPosition += 10

      // SIGNATURE SECTION - Guaranteed to appear
      console.log("[v0] Starting signature section at yPosition:", yPosition)

      // Ensure we have enough space for signature section (need about 50mm)
      if (yPosition > pageHeight - 50) {
        yPosition = pageHeight - 50
        console.log("[v0] Adjusted yPosition for signature section:", yPosition)
      }

      // Signature headers
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)

      pdf.text("Very truly yours,", margin, yPosition)
      pdf.text("Conforme:", margin + contentWidth / 2, yPosition)
      yPosition += 15

      // Signature lines
      pdf.setLineWidth(1)
      pdf.line(margin, yPosition, margin + 80, yPosition)
      pdf.line(margin + contentWidth / 2, yPosition, margin + contentWidth / 2 + 80, yPosition)
      yPosition += 8

      // Names under signature lines
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.text(representativeName, margin, yPosition)
      pdf.text(costEstimate?.clientName || "Client Name", margin + contentWidth / 2, yPosition)
      yPosition += 5

      // Client company
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate?.clientCompany || "Client Company", margin + contentWidth / 2, yPosition)
      yPosition += 8

      // Billing purpose text
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "italic")
      pdf.text("This signed quotation serves as an", margin + contentWidth / 2, yPosition)
      yPosition += 3
      pdf.text("official document for billing purposes", margin + contentWidth / 2, yPosition)
      yPosition += 10

      // Footer with company information
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(100, 100, 100)

      const footerY = pageHeight - 15
      const footerText = `${companyLocation} • phone: ${companyPhone}`
      const footerWidth = pdf.getTextWidth(footerText)
      pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY)

      const copyrightText = `© 2025 ${companyName}. All rights reserved.`
      const copyrightWidth = pdf.getTextWidth(copyrightText)
      pdf.text(copyrightText, (pageWidth - copyrightWidth) / 2, footerY + 4)

      console.log("[v0] Signature section completed at yPosition:", yPosition)
    }

    // Save or return PDF
    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const baseFileName = (costEstimate.title || "cost-estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()
      const sitesSuffix =
        selectedPages && selectedPages.length > 0 && selectedPages.length < sites.length
          ? `_selected-${selectedPages.length}-sites`
          : isMultipleSites && sitesToProcess.length === 1
            ? `_${sitesToProcess[0].replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
            : isMultipleSites
              ? `_all-${sites.length}-sites`
              : ""
      const fileName = `cost-estimate-${baseFileName}${sitesSuffix}-${Date.now()}.pdf`

      console.log("[v0] Saving PDF:", fileName)
      pdf.save(fileName)
      console.log("[v0] PDF saved successfully")
    }
  } catch (error) {
    console.error("Error generating Cost Estimate PDF:", error)
    throw new Error("Failed to generate Cost Estimate PDF")
  }
}
