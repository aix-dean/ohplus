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

export const generateQuotationPDF = async (quotation: Quotation) => {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return y + lines.length * fontSize * 0.35
  }

  let yPosition = margin

  // Company Header
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("Golden Touch Imaging Specialist", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 20

  // Client and RFQ Info
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text(quotation.client_name || "Client Name", margin, yPosition)
  pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin, yPosition, { align: "right" })
  yPosition += 8

  pdf.setFont("helvetica", "bold")
  pdf.text(quotation.client_company_name || "COMPANY NAME", margin, yPosition)
  yPosition += 15

  // Company Header Section
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text("GOLDEN TOUCH IMAGING SPECIALIST", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "normal")
  pdf.text("Good Day! Thank you for considering Golden Touch for your business needs.", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 6
  pdf.text("We are pleased to submit our quotation for your requirements:", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 10

  pdf.setFont("helvetica", "bold")
  pdf.text("Details as follows:", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  // Site Details
  const item = quotation.items?.[0]
  if (item) {
    const durationMonths = Math.ceil((Number(item.duration_days) || 40) / 30)
    const monthlyRate = item.price || 0
    const totalLease = monthlyRate * durationMonths
    const vatAmount = totalLease * 0.12
    const totalWithVat = totalLease + vatAmount

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    const details = [
      `● Site Location: ${safeString(item.location)}`,
      `● Type: ${safeString(item.type)}`,
      `● Size: ${safeString(item.dimensions) || "100ft (H) x 60ft (W)"}`,
      `● Contract Duration: ${durationMonths} MONTHS`,
      `● Contract Period: ${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      `● Proposal to: ${quotation.client_company_name || "CLIENT COMPANY NAME"}`,
      `● Illumination: ${item.illumination || "10 units of 1000 watts metal Halide"}`,
      `● Lease Rate/Month: (Exclusive of VAT)`,
      `● Total Lease: (Exclusive of VAT)`,
    ]

    details.forEach((detail) => {
      pdf.text(detail, margin, yPosition)
      yPosition += 7
    })

    yPosition += 10

    // Pricing Table
    pdf.setFont("helvetica", "bold")
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")

    const colWidth = (pageWidth - 2 * margin) / 3
    pdf.text("Lease rate per month", margin + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text("12% VAT", margin + colWidth + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text("TOTAL", margin + 2 * colWidth + colWidth / 2, yPosition + 5, { align: "center" })

    yPosition += 8
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8)
    pdf.text(`PHP ${monthlyRate.toLocaleString()}`, margin + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text(`PHP ${vatAmount.toLocaleString()}`, margin + colWidth + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text(`PHP ${totalWithVat.toLocaleString()}`, margin + 2 * colWidth + colWidth / 2, yPosition + 5, {
      align: "center",
    })

    yPosition += 15

    // Totals
    pdf.text(`x ${durationMonths} months`, margin, yPosition)
    pdf.text(`PHP ${totalLease.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.text(`PHP ${vatAmount.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.text(`PHP ${totalWithVat.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 15

    // Note
    pdf.setFont("helvetica", "normal")
    pdf.text(`Note: free two (2) change material for ${durationMonths} month rental`, margin, yPosition)
    yPosition += 15

    // Terms and Conditions
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
      "5. Print is exclusively for Golden Touch Imaging Specialist Only.",
    ]

    terms.forEach((term) => {
      pdf.text(term, margin, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Date
    pdf.text(formatDate(new Date()), pageWidth - margin, yPosition, { align: "right" })
    yPosition += 15

    // Site Location Header
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text(`${item.location} QUOTATION`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 20

    // Signature Section
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Left side - Company signature
    pdf.text("Very truly yours,", margin, yPosition)
    pdf.text("C o n f o r m e:", pageWidth / 2 + 20, yPosition)
    yPosition += 25

    // Signature lines
    pdf.line(margin, yPosition, margin + 60, yPosition)
    pdf.line(pageWidth / 2 + 20, yPosition, pageWidth / 2 + 80, yPosition)
    yPosition += 8

    // Names and positions
    pdf.text("Mathew Espanto", margin, yPosition)
    pdf.text(quotation.client_name || "Client Name", pageWidth / 2 + 20, yPosition)
    yPosition += 6

    pdf.text("Account Management", margin, yPosition)
    pdf.text(quotation.client_company_name || "Client Company", pageWidth / 2 + 20, yPosition)
    yPosition += 15

    // Official document note
    pdf.setFontSize(9)
    pdf.text("This signed Quotation serves as an", pageWidth / 2 + 20, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", pageWidth / 2 + 20, yPosition)
    yPosition += 15

    // Footer
    pdf.setFontSize(10)
    pdf.text(
      "No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53",
      pageWidth / 2,
      yPosition,
      { align: "center" },
    )
    yPosition += 5
    pdf.text("email: sales@goldentouchimaging.com or gtigolden@gmail.com", pageWidth / 2, yPosition, {
      align: "center",
    })
  }

  // Save the PDF
  const fileName = `Quotation_${quotation.quotation_number || quotation.id?.slice(-8)}.pdf`
  pdf.save(fileName)
}

export const generateSeparateQuotationPDFs = async (quotation: Quotation) => {
  if (!quotation.items || quotation.items.length <= 1) {
    return generateQuotationPDF(quotation)
  }

  // Generate separate PDF for each item
  for (let i = 0; i < quotation.items.length; i++) {
    const item = quotation.items[i]
    const singleItemQuotation: Quotation = {
      ...quotation,
      items: [item],
    }

    await generateQuotationPDF(singleItemQuotation)
  }
}

export const generateQuotationEmailPDF = async (
  quotation: Quotation,
  forEmail = false,
  userData?: any,
): Promise<string> => {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return y + lines.length * fontSize * 0.35
  }

  let yPosition = margin

  // Company Header
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("Golden Touch Imaging Specialist", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 20

  // Client and RFQ Info
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text(quotation.client_name || "Client Name", margin, yPosition)
  pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin, yPosition, { align: "right" })
  yPosition += 8

  pdf.setFont("helvetica", "bold")
  pdf.text(quotation.client_company_name || "COMPANY NAME", margin, yPosition)
  yPosition += 15

  // Company Header Section
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text("GOLDEN TOUCH IMAGING SPECIALIST", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "normal")
  pdf.text("Good Day! Thank you for considering Golden Touch for your business needs.", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 6
  pdf.text("We are pleased to submit our quotation for your requirements:", pageWidth / 2, yPosition, {
    align: "center",
  })
  yPosition += 10

  pdf.setFont("helvetica", "bold")
  pdf.text("Details as follows:", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  // Site Details
  const item = quotation.items?.[0]
  if (item) {
    const durationMonths = Math.ceil((Number(item.duration_days) || 40) / 30)
    const monthlyRate = item.price || 0
    const totalLease = monthlyRate * durationMonths
    const vatAmount = totalLease * 0.12
    const totalWithVat = totalLease + vatAmount

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    const details = [
      `● Site Location: ${safeString(item.location)}`,
      `● Type: ${safeString(item.type)}`,
      `● Size: ${safeString(item.dimensions) || "100ft (H) x 60ft (W)"}`,
      `● Contract Duration: ${durationMonths} MONTHS`,
      `● Contract Period: ${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      `● Proposal to: ${quotation.client_company_name || "CLIENT COMPANY NAME"}`,
      `● Illumination: ${item.illumination || "10 units of 1000 watts metal Halide"}`,
      `● Lease Rate/Month: (Exclusive of VAT)`,
      `● Total Lease: (Exclusive of VAT)`,
    ]

    details.forEach((detail) => {
      pdf.text(detail, margin, yPosition)
      yPosition += 7
    })

    yPosition += 10

    // Pricing Table
    pdf.setFont("helvetica", "bold")
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")

    const colWidth = (pageWidth - 2 * margin) / 3
    pdf.text("Lease rate per month", margin + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text("12% VAT", margin + colWidth + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text("TOTAL", margin + 2 * colWidth + colWidth / 2, yPosition + 5, { align: "center" })

    yPosition += 8
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8)
    pdf.text(`PHP ${monthlyRate.toLocaleString()}`, margin + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text(`PHP ${vatAmount.toLocaleString()}`, margin + colWidth + colWidth / 2, yPosition + 5, { align: "center" })
    pdf.text(`PHP ${totalWithVat.toLocaleString()}`, margin + 2 * colWidth + colWidth / 2, yPosition + 5, {
      align: "center",
    })

    yPosition += 15

    // Totals
    pdf.text(`x ${durationMonths} months`, margin, yPosition)
    pdf.text(`PHP ${totalLease.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.text(`PHP ${vatAmount.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.text(`PHP ${totalWithVat.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 15

    // Note
    pdf.setFont("helvetica", "normal")
    pdf.text(`Note: free two (2) change material for ${durationMonths} month rental`, margin, yPosition)
    yPosition += 15

    // Terms and Conditions
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
      "5. Print is exclusively for Golden Touch Imaging Specialist Only.",
    ]

    terms.forEach((term) => {
      pdf.text(term, margin, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Date
    pdf.text(formatDate(new Date()), pageWidth - margin, yPosition, { align: "right" })
    yPosition += 15

    // Site Location Header
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text(`${item.location} QUOTATION`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 20

    // Signature Section
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Left side - Company signature
    pdf.text("Very truly yours,", margin, yPosition)
    pdf.text("C o n f o r m e:", pageWidth / 2 + 20, yPosition)
    yPosition += 25

    // Signature lines
    pdf.line(margin, yPosition, margin + 60, yPosition)
    pdf.line(pageWidth / 2 + 20, yPosition, pageWidth / 2 + 80, yPosition)
    yPosition += 8

    // Names and positions
    pdf.text("Mathew Espanto", margin, yPosition)
    pdf.text(quotation.client_name || "Client Name", pageWidth / 2 + 20, yPosition)
    yPosition += 6

    pdf.text("Account Management", margin, yPosition)
    pdf.text(quotation.client_company_name || "Client Company", pageWidth / 2 + 20, yPosition)
    yPosition += 15

    // Official document note
    pdf.setFontSize(9)
    pdf.text("This signed Quotation serves as an", pageWidth / 2 + 20, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", pageWidth / 2 + 20, yPosition)
    yPosition += 15

    // Footer
    pdf.setFontSize(10)
    pdf.text(
      "No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53",
      pageWidth / 2,
      yPosition,
      { align: "center" },
    )
    yPosition += 5
    pdf.text("email: sales@goldentouchimaging.com or gtigolden@gmail.com", pageWidth / 2, yPosition, {
      align: "center",
    })
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
