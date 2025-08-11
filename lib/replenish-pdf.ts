import jsPDF from "jspdf"
import { loadImageAsBase64, generateQRCode } from "@/lib/pdf-service"
import type { ReplenishRequest } from "@/lib/types/finance-request"

function safeToDate(dateValue: any): Date {
  if (dateValue instanceof Date) return dateValue
  if (typeof dateValue === "string" || typeof dateValue === "number") return new Date(dateValue)
  if (dateValue && typeof dateValue.toDate === "function") return dateValue.toDate()
  return new Date()
}

function formatCurrency(amount: number | string, currency = "PHP"): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount.replace(/[^\d.-]/g, "")) : amount
  const cleanAmount = Math.abs(Number(numAmount) || 0)
  return `${currency}${cleanAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function generateReplenishRequestPDF(
  request: ReplenishRequest,
  options?: { returnBase64?: boolean; preparedBy?: string },
): Promise<string | void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const requestedDate = safeToDate(request["Date Requested"])
  const createdDate = safeToDate(request.created)
  const preparedBy = options?.preparedBy || request.Requestor || "Prepared by user"

  // Try to add QR code linking back to this request
  try {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/finance/requests/details/${request.id}`
    const qrUrl = await generateQRCode(link)
    const qrBase64 = await loadImageAsBase64(qrUrl)
    if (qrBase64) {
      const size = 18
      pdf.addImage(qrBase64, "PNG", pageWidth - margin - size, margin, size, size)
    }
  } catch {
    // silently ignore
  }

  // Header band
  pdf.setFillColor(30, 58, 138) // blue-900
  pdf.rect(0, 0, pageWidth, 26, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(18)
  pdf.text("REPLENISHMENT REQUEST", margin, 16)
  pdf.setFontSize(10)
  pdf.text(`Report Generated: ${new Date().toLocaleString()}`, margin, 22)
  pdf.setTextColor(0, 0, 0)
  y = 34

  // Title + status row
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.text(`Request #${request["Request No."]}`, margin, y)
  pdf.setFontSize(10)
  // status badge
  const status = (request.Actions || "Pending").toUpperCase()
  const badgeWidth = Math.max(26, pdf.getTextWidth(status) + 8)
  const badgeX = pageWidth - margin - badgeWidth
  const badgeY = y - 6
  const badgeColor =
    request.Actions?.toLowerCase() === "approved"
      ? [34, 197, 94]
      : request.Actions?.toLowerCase() === "rejected"
        ? [239, 68, 68]
        : request.Actions?.toLowerCase() === "processing"
          ? [59, 130, 246]
          : [156, 163, 175]
  pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2])
  pdf.roundedRect(badgeX, badgeY, badgeWidth, 10, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.text(status, badgeX + 4, badgeY + 7)
  pdf.setTextColor(0, 0, 0)
  y += 10

  // Meta info two-column
  const leftX = margin
  const rightX = margin + contentWidth / 2 + 4
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Summary", margin, y)
  y += 5
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.4)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 6

  pdf.setFontSize(10)
  const rowGap = 6
  const line = (label: string, value: string, x: number, yy: number) => {
    pdf.setFont("helvetica", "bold")
    pdf.text(label, x, yy)
    pdf.setFont("helvetica", "normal")
    pdf.text(value || "N/A", x + 28, yy)
  }

  let leftY = y
  let rightY = y
  line("Requestor:", request.Requestor, leftX, leftY)
  leftY += rowGap
  line("Prepared By:", preparedBy, leftX, leftY)
  leftY += rowGap
  line("Created:", createdDate.toLocaleString(), leftX, leftY)
  leftY += rowGap

  line("Type:", "Replenish", rightX, rightY)
  rightY += rowGap
  line("Date Requested:", requestedDate.toLocaleDateString(), rightX, rightY)
  rightY += rowGap
  line("Voucher No.:", request["Voucher No."] || "-", rightX, rightY)
  rightY += rowGap

  y = Math.max(leftY, rightY) + 6

  // Financial summary cards
  const cardH = 20
  const gap = 6
  const cardW = (contentWidth - gap) / 2

  const drawCard = (x: number, title: string, value: string) => {
    pdf.setFillColor(248, 250, 252) // slate-50
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F")
    pdf.setDrawColor(226, 232, 240) // slate-200
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, "S")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setTextColor(71, 85, 105) // slate-600
    pdf.text(title, x + 4, y + 7)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.setTextColor(15, 23, 42) // slate-900
    pdf.text(value, x + 4, y + 15)
  }

  drawCard(margin, "Amount", formatCurrency(request.Amount, request.Currency || "PHP"))
  drawCard(
    margin + cardW + gap,
    "Total Amount",
    formatCurrency((request as any)["Total Amount"] || 0, request.Currency || "PHP"),
  )
  y += cardH + 10

  // Approval section
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Approval", margin, y)
  y += 5
  pdf.setDrawColor(220, 220, 220)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 6

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  line("Management Approval:", (request as any)["Management Approval"] || "Pending", margin, y)
  line("Approved By:", request["Approved By"] || "-", rightX, y)
  y += rowGap + 6

  // Particulars block
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Particulars", margin, y)
  y += 5
  pdf.setDrawColor(226, 232, 240)
  const blockHeight = 28
  pdf.roundedRect(margin, y, contentWidth, blockHeight, 2, 2, "S")
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  const text = request.Particulars || request["Requested Item"] || "-"
  const lines = pdf.splitTextToSize(text, contentWidth - 8)
  pdf.text(lines, margin + 4, y + 7)
  y += blockHeight + 8

  // Notes
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text("This report reflects the currently saved details for the replenishment request.", margin, y)
  pdf.setTextColor(0, 0, 0)

  // Footer
  const footerY = pageHeight - 12
  pdf.setDrawColor(229, 231, 235)
  pdf.line(margin, footerY, pageWidth - margin, footerY)
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text("Generated by OH Plus Platform", margin, footerY + 5)

  if (options?.returnBase64) {
    return pdf.output("datauristring").split(",")[1]
  } else {
    const fileName = `replenish-request-${String(request["Request No."]) || request.id}-${Date.now()}.pdf`
    pdf.save(fileName)
  }
}
