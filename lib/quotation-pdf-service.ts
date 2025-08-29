import jsPDF from "jspdf"
import type { Quotation } from "./types/quotation"

const safeString = (value: any): string => {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value.toString()
  if (value && typeof value === "object") {
    if (value.id) return value.id.toString()
    if (value.toString) return value.toString()
    return "N/A"
  }
  return String(value)
}

const formatDate = (date: any) => {
  if (!date) return "N/A"
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
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
  if (companyData.address) parts.push(companyData.address)
  if (companyData.city) parts.push(companyData.city)
  if (companyData.state) parts.push(companyData.state)
  if (companyData.zip) parts.push(companyData.zip)
  return parts.join(", ")
}

export const generateQuotationPDF = async (quotation: Quotation, companyData?: any) => {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  let yPosition = margin

  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text(companyData?.name || "AI Xynergy", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 20

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text(formatDate(new Date()), margin, yPosition)
  pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin, yPosition, { align: "right" })
  yPosition += 8

  pdf.text(quotation.client_name || "Client Name", margin, yPosition)
  yPosition += 6
  pdf.setFont("helvetica", "bold")
  pdf.text(quotation.client_company_name || "COMPANY NAME", margin, yPosition)
  yPosition += 15

  const item = quotation.items?.[0]
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text(item?.name || "Site Name", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `Good Day! Thank you for considering ${companyData?.name || "our company"} for your business needs.`,
    pageWidth / 2,
    yPosition,
    {
      align: "center",
    },
  )
  yPosition += 6
  pdf.text("We are pleased to submit our quotation for your requirements:", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 10

  pdf.setFont("helvetica", "bold")
  pdf.text("Details as follows:", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  if (item) {
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    const details = [
      `● Type: ${safeString(item.type) || "Rental"}`,
      `● Size: ${quotation.size || "100ft (H) x 60ft (W)"}`,
      `● Contract Duration: ${formatDuration(quotation.duration_days || 0)}`,
      `● Contract Period: ${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      `● Proposal to: ${quotation.client_company_name || "CLIENT COMPANY NAME"}`,
      `● Illumination: 10 units of 1000 watts metal Halide`,
      `● Lease Rate/Month: PHP ${(item.price || 0).toLocaleString()} (Exclusive of VAT)`,
      `● Total Lease: PHP ${(item.item_total_amount || 0).toLocaleString()} (Exclusive of VAT)`,
    ]

    details.forEach((detail) => {
      pdf.text(detail, margin, yPosition)
      yPosition += 7
    })

    yPosition += 10

    pdf.setFillColor(248, 250, 252) // Gray background like the page
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, "F")
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35)

    yPosition += 8
    pdf.setFont("helvetica", "normal")
    pdf.text("Lease rate per month", margin + 5, yPosition)
    pdf.text(`PHP ${(item.price || 0).toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: "right" })
    yPosition += 6

    pdf.text(`x ${formatDuration(quotation.duration_days || 0)}`, margin + 5, yPosition)
    pdf.text(`PHP ${(item.item_total_amount || 0).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 6

    pdf.text("12% VAT", margin + 5, yPosition)
    pdf.text(`PHP ${((item.item_total_amount || 0) * 0.12).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 8

    // Total line
    pdf.setDrawColor(0, 0, 0)
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition)
    yPosition += 6

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("TOTAL", margin + 5, yPosition)
    pdf.text(`PHP ${((item.item_total_amount || 0) * 1.12).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 15

    const durationMonths = Math.ceil((quotation.duration_days || 0) / 30)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(11)
    pdf.text(`Note: free two (2) change material for ${durationMonths} month rental`, margin, yPosition)
    yPosition += 15

    pdf.setFont("helvetica", "bold")
    pdf.text("Terms and Conditions:", margin, yPosition)
    yPosition += 8

    pdf.setFont("helvetica", "normal")
    const terms = [
      "1. Quotation validity: 5 working days.",
      "2. Availability of the site is on first-come-first-served-basis only. Only official documents such as P.O's,",
      "    Media Orders, signed quotation, & contracts are accepted in order to booked the site.",
      "3. To book the site, one (1) month advance and one (2) months security deposit",
      "    payment dated 7 days before the start of rental is required.",
      "4. Final artwork should be approved ten (10) days before the contract period",
      `5. Print is exclusively for ${companyData?.name || "Company Name"} Only.`,
    ]

    terms.forEach((term) => {
      pdf.text(term, margin, yPosition)
      yPosition += 6
    })

    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Two column layout like the page
    const leftColX = margin
    const rightColX = pageWidth / 2 + 10

    pdf.text("Very truly yours,", leftColX, yPosition)
    pdf.text("Conforme:", rightColX, yPosition)
    yPosition += 25

    // Signature lines
    pdf.line(leftColX, yPosition, leftColX + 60, yPosition)
    pdf.line(rightColX, yPosition, rightColX + 60, yPosition)
    yPosition += 8

    // Names and positions
    pdf.text(quotation.signature_name || "AIX Xymbiosis", leftColX, yPosition)
    pdf.text(quotation.client_name || "Client Name", rightColX, yPosition)
    yPosition += 6

    pdf.text(quotation.signature_position || "Account Manager", leftColX, yPosition)
    pdf.text(quotation.client_company_name || "COMPANY NAME", rightColX, yPosition)
    yPosition += 10

    // Official document note
    pdf.setFontSize(9)
    pdf.text("This signed quotation serves as an", rightColX, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", rightColX, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    const companyAddress = formatCompanyAddress(companyData)
    if (companyAddress) {
      pdf.text(companyAddress, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 5
    }
    if (companyData?.phone) {
      pdf.text(`Telephone: ${companyData.phone}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 5
    }
    if (companyData?.email) {
      pdf.text(`Email: ${companyData.email}`, pageWidth / 2, yPosition, { align: "center" })
    }
  }

  // Save the PDF
  const fileName = `Quotation_${quotation.quotation_number || quotation.id?.slice(-8)}.pdf`
  pdf.save(fileName)
}

export const generateSeparateQuotationPDFs = async (quotation: Quotation, companyData?: any) => {
  if (!quotation.items || quotation.items.length <= 1) {
    return generateQuotationPDF(quotation, companyData)
  }

  // Generate separate PDF for each item
  for (let i = 0; i < quotation.items.length; i++) {
    const item = quotation.items[i]
    const singleItemQuotation: Quotation = {
      ...quotation,
      items: [item],
    }

    await generateQuotationPDF(singleItemQuotation, companyData)
  }
}

export const generateQuotationEmailPDF = async (
  quotation: Quotation,
  forEmail = false,
  userData?: any,
  companyData?: any,
): Promise<string> => {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  let yPosition = margin

  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text(companyData?.name || "AI Xynergy", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 20

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text(formatDate(new Date()), margin, yPosition)
  pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin, yPosition, { align: "right" })
  yPosition += 8

  pdf.text(quotation.client_name || "Client Name", margin, yPosition)
  yPosition += 6
  pdf.setFont("helvetica", "bold")
  pdf.text(quotation.client_company_name || "COMPANY NAME", margin, yPosition)
  yPosition += 15

  const item = quotation.items?.[0]
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text(item?.name || "Site Name", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `Good Day! Thank you for considering ${companyData?.name || "our company"} for your business needs.`,
    pageWidth / 2,
    yPosition,
    {
      align: "center",
    },
  )
  yPosition += 6
  pdf.text("We are pleased to submit our quotation for your requirements:", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 10

  pdf.setFont("helvetica", "bold")
  pdf.text("Details as follows:", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  if (item) {
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    const details = [
      `● Type: ${safeString(item.type) || "Rental"}`,
      `● Size: ${quotation.size || "100ft (H) x 60ft (W)"}`,
      `● Contract Duration: ${formatDuration(quotation.duration_days || 0)}`,
      `● Contract Period: ${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      `● Proposal to: ${quotation.client_company_name || "CLIENT COMPANY NAME"}`,
      `● Illumination: 10 units of 1000 watts metal Halide`,
      `● Lease Rate/Month: PHP ${(item.price || 0).toLocaleString()} (Exclusive of VAT)`,
      `● Total Lease: PHP ${(item.item_total_amount || 0).toLocaleString()} (Exclusive of VAT)`,
    ]

    details.forEach((detail) => {
      pdf.text(detail, margin, yPosition)
      yPosition += 7
    })

    yPosition += 10

    pdf.setFillColor(248, 250, 252) // Gray background like the page
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, "F")
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35)

    yPosition += 8
    pdf.setFont("helvetica", "normal")
    pdf.text("Lease rate per month", margin + 5, yPosition)
    pdf.text(`PHP ${(item.price || 0).toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: "right" })
    yPosition += 6

    pdf.text(`x ${formatDuration(quotation.duration_days || 0)}`, margin + 5, yPosition)
    pdf.text(`PHP ${(item.item_total_amount || 0).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 6

    pdf.text("12% VAT", margin + 5, yPosition)
    pdf.text(`PHP ${((item.item_total_amount || 0) * 0.12).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 8

    // Total line
    pdf.setDrawColor(0, 0, 0)
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition)
    yPosition += 6

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("TOTAL", margin + 5, yPosition)
    pdf.text(`PHP ${((item.item_total_amount || 0) * 1.12).toLocaleString()}`, pageWidth - margin - 5, yPosition, {
      align: "right",
    })
    yPosition += 15

    const durationMonths = Math.ceil((quotation.duration_days || 0) / 30)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(11)
    pdf.text(`Note: free two (2) change material for ${durationMonths} month rental`, margin, yPosition)
    yPosition += 15

    pdf.setFont("helvetica", "bold")
    pdf.text("Terms and Conditions:", margin, yPosition)
    yPosition += 8

    pdf.setFont("helvetica", "normal")
    const terms = [
      "1. Quotation validity: 5 working days.",
      "2. Availability of the site is on first-come-first-served-basis only. Only official documents such as P.O's,",
      "    Media Orders, signed quotation, & contracts are accepted in order to booked the site.",
      "3. To book the site, one (1) month advance and one (2) months security deposit",
      "    payment dated 7 days before the start of rental is required.",
      "4. Final artwork should be approved ten (10) days before the contract period",
      `5. Print is exclusively for ${companyData?.name || "Company Name"} Only.`,
    ]

    terms.forEach((term) => {
      pdf.text(term, margin, yPosition)
      yPosition += 6
    })

    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Two column layout like the page
    const leftColX = margin
    const rightColX = pageWidth / 2 + 10

    pdf.text("Very truly yours,", leftColX, yPosition)
    pdf.text("Conforme:", rightColX, yPosition)
    yPosition += 25

    // Signature lines
    pdf.line(leftColX, yPosition, leftColX + 60, yPosition)
    pdf.line(rightColX, yPosition, rightColX + 60, yPosition)
    yPosition += 8

    // Names and positions
    pdf.text(quotation.signature_name || "AIX Xymbiosis", leftColX, yPosition)
    pdf.text(quotation.client_name || "Client Name", rightColX, yPosition)
    yPosition += 6

    pdf.text(quotation.signature_position || "Account Manager", leftColX, yPosition)
    pdf.text(quotation.client_company_name || "COMPANY NAME", rightColX, yPosition)
    yPosition += 10

    // Official document note
    pdf.setFontSize(9)
    pdf.text("This signed quotation serves as an", rightColX, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", rightColX, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    const companyAddress = formatCompanyAddress(companyData)
    if (companyAddress) {
      pdf.text(companyAddress, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 5
    }
    if (companyData?.phone) {
      pdf.text(`Telephone: ${companyData.phone}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 5
    }
    if (companyData?.email) {
      pdf.text(`Email: ${companyData.email}`, pageWidth / 2, yPosition, { align: "center" })
    }
  }

  // Return base64 string for email attachment
  if (forEmail) {
    return pdf.output("datauristring").split(",")[1]
  }

  // Save the PDF for regular download
  const fileName = `Quotation_${quotation.quotation_number || quotation.id?.slice(-8)}.pdf`
  pdf.save(fileName)
  return fileName
}
