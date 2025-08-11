import jsPDF from "jspdf"
import QRCode from "qrcode"
import type { FinanceRequest } from "@/lib/types/finance-request"

type ReplenishLike = FinanceRequest & {
  Particulars?: string
  "Voucher No."?: string
  "Total Amount"?: number
  "Management Approval"?: string
  "Date Requested"?: any
}

function safeToDate(value: any): Date | null {
  try {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value?.toDate === "function") return value.toDate()
    if (typeof value === "string" || typeof value === "number") return new Date(value)
    return null
  } catch {
    return null
  }
}

function fmtDateTime(dt: Date | null, withTime = true): string {
  if (!dt || isNaN(dt.getTime())) return "N/A"
  return withTime ? dt.toLocaleString() : dt.toLocaleDateString()
}

function fmtMoney(amount: number | string | undefined, currency = "PHP"): string {
  let n = 0
  if (typeof amount === "number") n = amount
  else if (typeof amount === "string") n = Number.parseFloat(amount.replace(/[^\d.-]/g, ""))
  return `${currency}${(isFinite(n) ? n : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Generate a user-friendly PDF for a replenish request.
 * This uses only the request document fields — no attachment files are embedded.
 *
 * If options.returnDataUrl is true, returns a data URL string.
 * Otherwise, it triggers a file download in the browser.
 */
export async function generateReplenishRequestPDF(
  request: ReplenishLike,
  options?: { returnDataUrl?: boolean; preparedBy?: string },
): Promise<string | void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 16
  const contentW = pageW - margin * 2

  // Optional QR code linking back to the request details page
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/finance/requests/details/${request.id}`
  try {
    const qrDataUrl = await QRCode.toDataURL(link, { margin: 0 })
    // Header band
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(0, 0, pageW, 26, "F")
    pdf.addImage(qrDataUrl, "PNG", pageW - margin - 18, 4, 18, 18) // QR in header
  } catch {
    // If QR generation fails, still render header band
    pdf.setFillColor(30, 58, 138)
    pdf.rect(0, 0, pageW, 26, "F")
  }

  // Header text
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(18)
  pdf.text("REPLENISHMENT REQUEST", margin, 16)
  pdf.setFontSize(10)
  pdf.text(`Report Generated: ${new Date().toLocaleString()}`, margin, 22)

  // Reset text color
  pdf.setTextColor(0, 0, 0)

  let y = 34

  // Title row with status badge
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.text(`Request #${request["Request No."]}`, margin, y)

  const status = (request.Actions || "Pending").toUpperCase()
  const badgeW = Math.max(26, pdf.getTextWidth(status) + 8)
  const badgeX = pageW - margin - badgeW
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
  pdf.roundedRect(badgeX, badgeY, badgeW, 10, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.text(status, badgeX + 4, badgeY + 7)
  pdf.setTextColor(0, 0, 0)

  y += 10

  // Summary section
  const created = safeToDate(request.created)
  const requested = safeToDate((request as any)["Date Requested"])
  const preparedBy = options?.preparedBy || request.Requestor || "Prepared by user"

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Summary", margin, y)
  y += 5
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.4)
  pdf.line(margin, y, pageW - margin, y)
  y += 6

  const rowGap = 6
  const leftX = margin
  const rightX = margin + contentW / 2 + 4

  const row = (label: string, value: string, x: number, yy: number) => {
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text(label, x, yy)
    pdf.setFont("helvetica", "normal")
    pdf.text(value || "N/A", x + 30, yy)
  }

  let leftY = y
  let rightY = y
  row("Requestor:", request.Requestor, leftX, leftY)
  leftY += rowGap
  row("Prepared By:", preparedBy, leftX, leftY)
  leftY += rowGap
  row("Created:", fmtDateTime(created, true), leftX, leftY)
  leftY += rowGap

  row("Type:", "Replenish", rightX, rightY)
  rightY += rowGap
  row("Date Requested:", fmtDateTime(requested, false), rightX, rightY)
  rightY += rowGap
  row("Voucher No.:", (request as any)["Voucher No."] || "-", rightX, rightY)
  rightY += rowGap

  y = Math.max(leftY, rightY) + 8

  // Financial cards
  const cardH = 22
  const gap = 6
  const cardW = (contentW - gap) / 2

  const card = (x: number, title: string, value: string) => {
    pdf.setFillColor(248, 250, 252) // slate-50
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F")
    pdf.setDrawColor(226, 232, 240) // slate-200
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setTextColor(71, 85, 105)
    pdf.text(title, x + 4, y + 7)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.setTextColor(15, 23, 42)
    pdf.text(value, x + 4, y + 15)
  }

  card(margin, "Amount", fmtMoney(request.Amount, request.Currency || "PHP"))
  card(margin + cardW + gap, "Total Amount", fmtMoney((request as any)["Total Amount"] || 0, request.Currency || "PHP"))

  y += cardH + 10

  // Approval section
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Approval", margin, y)
  y += 5
  pdf.setDrawColor(220, 220, 220)
  pdf.line(margin, y, pageW - margin, y)
  y += 6

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  row("Management Approval:", (request as any)["Management Approval"] || "Pending", margin, y)
  row("Approved By:", request["Approved By"] || "-", rightX, y)
  y += rowGap + 8

  // Particulars block
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Particulars", margin, y)
  y += 5

  const blockH = 30
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, contentW, blockH, 2, 2, "S")
  const text = (request as any).Particulars || request["Requested Item"] || "-"
  const textLines = pdf.splitTextToSize(text, contentW - 8)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(textLines, margin + 4, y + 7)
  y += blockH + 8

  // Note
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text("This report includes details stored in the request only. No attachments are included.", margin, y)

  // Footer
  const footerY = pageH - 12
  pdf.setDrawColor(229, 231, 235)
  pdf.line(margin, footerY, pageW - margin, footerY)
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text("Generated by OH Plus Platform", margin, footerY + 5)

  if (options?.returnDataUrl) {
    return pdf.output("datauristring")
  } else {
    const fileName = `replenish-request-${String(request["Request No."] ?? request.id)}.pdf`
    pdf.save(fileName)
  }
}
