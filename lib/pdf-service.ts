import jsPDF from "jspdf"
import type { Proposal } from "@/lib/types/proposal"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import type { ReportData } from "@/lib/report-service"

// Helper function to load image and convert to base64
export async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error loading image:", error)
    return null
  }
}

// Helper function to get image dimensions
export function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      resolve({ width: 100, height: 100 }) // Default dimensions
    }
    img.src = base64
  })
}

// Helper function to generate QR code using online service
export async function generateQRCode(text: string): Promise<string> {
  try {
    // Using QR Server API for basic QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    return qrUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

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

async function logProposalPDFGenerated(proposalId: string, userId: string, userName: string): Promise<void> {
  // Placeholder for the actual logging implementation
  console.log(`PDF generated for proposal ${proposalId} by user ${userId} (${userName})`)
  return Promise.resolve()
}

export async function generateProposalPDF(proposal: Proposal, returnBase64 = false): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Safely convert dates
    const createdAt = safeToDate(proposal.createdAt)
    const validUntil = safeToDate(proposal.validUntil)

    // Generate QR Code for proposal view URL
    const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}`
    const qrCodeUrl = await generateQRCode(proposalViewUrl)

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
        // Add QR code to new page as well
        addQRCodeToPage()
      }
    }

    // Helper function to add QR code to current page
    const addQRCodeToPage = async () => {
      try {
        const qrSize = 25
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        // Load QR code image and add to PDF
        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)

          // Add small text below QR code
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          pdf.text("Scan to view online", qrX, qrY + qrSize + 3)
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
        // Continue without QR code if it fails
      }
    }

    // Add QR code to first page
    await addQRCodeToPage()

    // Helper function to add image to PDF
    const addImageToPDF = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
      try {
        const base64 = await loadImageAsBase64(imageUrl)
        if (!base64) return { width: 0, height: 0 }

        const dimensions = await getImageDimensions(base64)

        // Calculate scaled dimensions to fit within max bounds
        let { width, height } = dimensions
        const aspectRatio = width / height

        // Scale to fill the maximum available space
        if (width > height) {
          width = maxWidth
          height = width / aspectRatio
          if (height > maxHeight) {
            height = maxHeight
            width = height * aspectRatio
          }
        } else {
          height = maxHeight
          width = height * aspectRatio
          if (width > maxWidth) {
            width = maxWidth
            height = width / aspectRatio
          }
        }

        pdf.addImage(base64, "JPEG", x, y, width, height)
        return { width, height }
      } catch (error) {
        console.error("Error adding image to PDF:", error)
        return { width: 0, height: 0 }
      }
    }

    // Header (adjusted to avoid QR code area)
    const headerContentWidth = contentWidth - 30 // Leave space for QR code
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL", margin, yPosition)
    yPosition += 10

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(proposal.title || "Untitled Proposal", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 5 + 1

    // Date and validity
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 4)
    yPosition += 12

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 5

    // Draw line under section header
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Client details in two columns
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.company || "N/A", leftColumn + 22, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.contactPerson || "N/A", rightColumn + 30, yPosition)
    yPosition += 4

    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.email || "N/A", leftColumn + 22, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.phone || "N/A", rightColumn + 30, yPosition)
    yPosition += 4

    if (proposal.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(proposal.client.address, leftColumn + 22, yPosition, contentWidth - 22)
      yPosition += 2
    }

    if (proposal.client?.industry) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Industry:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(proposal.client.industry, leftColumn + 22, yPosition)
      yPosition += 4
    }

    yPosition += 6

    // Products Section
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("PRODUCTS & SERVICES", margin, yPosition)
    yPosition += 5

    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 6

    // Products with optimized spacing
    if (proposal.products && proposal.products.length > 0) {
      for (let index = 0; index < proposal.products.length; index++) {
        const product = proposal.products[index]

        // Calculate required space more accurately
        let requiredHeight = 20

        // Add height for images if they exist
        if (product.media && product.media.length > 0) {
          requiredHeight += 70
        }

        checkNewPage(requiredHeight)

        // Product header
        pdf.setFontSize(11)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${index + 1}. ${product.name || "Unnamed Product"}`, margin, yPosition)

        // Price on the right
        const price = typeof product.price === "string" ? Number.parseFloat(product.price) || 0 : product.price || 0
        const priceText = `₱${price.toLocaleString()}`
        const priceWidth = pdf.getTextWidth(priceText)
        pdf.text(priceText, pageWidth - margin - priceWidth, yPosition)
        yPosition += 4

        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(100, 100, 100)
        pdf.text(product.type || "N/A", margin + 3, yPosition)
        yPosition += 3

        pdf.setTextColor(0, 0, 0)

        // Product details
        pdf.text(`Location: ${product.location || "N/A"}`, margin + 3, yPosition)
        yPosition += 3

        if (product.site_code) {
          pdf.text(`Site Code: ${product.site_code}`, margin + 3, yPosition)
          yPosition += 3
        }

        if (product.specs_rental) {
          if (product.specs_rental.traffic_count) {
            pdf.text(`Traffic Count: ${product.specs_rental.traffic_count.toLocaleString()}/day`, margin + 3, yPosition)
            yPosition += 3
          }
          if (product.specs_rental.height && product.specs_rental.width) {
            pdf.text(
              `Dimensions: ${product.specs_rental.height}m × ${product.specs_rental.width}m`,
              margin + 3,
              yPosition,
            )
            yPosition += 3
          }
          if (product.specs_rental.audience_type) {
            pdf.text(`Audience: ${product.specs_rental.audience_type}`, margin + 3, yPosition)
            yPosition += 3
          }
        }

        if (product.description) {
          pdf.setFont("helvetica", "italic")
          yPosition = addText(product.description, margin + 3, yPosition, contentWidth - 6, 8)
          pdf.setFont("helvetica", "normal")
          yPosition += 2
        }

        // Add product images
        if (product.media && product.media.length > 0) {
          yPosition += 3
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(9)
          pdf.text("Product Images:", margin + 3, yPosition)
          yPosition += 4

          const maxImageWidth = 75
          const maxImageHeight = 55
          const imageSpacing = 8
          let currentX = margin + 3
          let maxImageHeightInRow = 0

          const imagesToShow = product.media.slice(0, 2)

          for (let imgIndex = 0; imgIndex < imagesToShow.length; imgIndex++) {
            const media = imagesToShow[imgIndex]

            if (media.isVideo) continue

            if (media.url) {
              if (imagesToShow.length === 1) {
                const singleImageWidth = 100
                const singleImageHeight = 75
                const centerX = margin + (contentWidth - singleImageWidth) / 2

                checkNewPage(singleImageHeight + 10)

                try {
                  const imageDimensions = await addImageToPDF(
                    media.url,
                    centerX,
                    yPosition,
                    singleImageWidth,
                    singleImageHeight,
                  )
                  yPosition += imageDimensions.height + 5
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              } else {
                if (imgIndex > 0 && imgIndex % 2 === 0) {
                  yPosition += maxImageHeightInRow + imageSpacing
                  currentX = margin + 3
                  maxImageHeightInRow = 0
                  checkNewPage(maxImageHeight + 10)
                }

                try {
                  const imageDimensions = await addImageToPDF(
                    media.url,
                    currentX,
                    yPosition,
                    maxImageWidth,
                    maxImageHeight,
                  )

                  if (imageDimensions.height > maxImageHeightInRow) {
                    maxImageHeightInRow = imageDimensions.height
                  }

                  currentX += maxImageWidth + imageSpacing
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              }
            }
          }

          if (imagesToShow.length > 1) {
            yPosition += maxImageHeightInRow + 5
          }
        }

        yPosition += 8
      }
    }

    // Summary Section
    checkNewPage(25)
    yPosition += 3
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 6

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL SUMMARY", margin, yPosition)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total Products: ${proposal.products?.length || 0}`, margin, yPosition)
    yPosition += 4

    // Total amount
    pdf.setFontSize(13)
    pdf.setFont("helvetica", "bold")
    const totalAmount = proposal.totalAmount || 0
    const totalText = `TOTAL AMOUNT: ₱${totalAmount.toLocaleString()}`
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition - 3, contentWidth, 8, "F")
    pdf.text(totalText, margin + 3, yPosition + 1)
    yPosition += 10

    // Notes and Custom Message
    if (proposal.notes || proposal.customMessage) {
      checkNewPage(20)
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 5

      pdf.setLineWidth(0.3)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5

      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")

      if (proposal.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 3
        yPosition = addText(proposal.notes, margin, yPosition, contentWidth)
        yPosition += 3
      }

      if (proposal.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 3
        yPosition = addText(proposal.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 10
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, footerY)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `proposal-${(proposal.title || "proposal").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

export async function generateCostEstimatePDF(
  costEstimate: CostEstimate,
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    const createdAt = safeToDate(costEstimate.createdAt)
    const validUntil = safeToDate(costEstimate.validUntil)
    const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
    const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

    const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimate.id}`
    const qrCodeUrl = await generateQRCode(costEstimateViewUrl)

    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
        addQRCodeToPage()
      }
    }

    const addQRCodeToPage = async () => {
      try {
        const qrSize = 25
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          pdf.text("Scan to view online", qrX, qrY + qrSize + 3)
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
      }
    }

    await addQRCodeToPage()

    // Header
    const headerContentWidth = contentWidth - 30
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST ESTIMATE", margin, yPosition)
    yPosition += 10

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(costEstimate.title || "Untitled Cost Estimate", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 5 + 1

    // Date and validity
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 4)
    yPosition += 12

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 5

    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "N/A", leftColumn + 22, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.contactPerson || "N/A", rightColumn + 30, yPosition)
    yPosition += 4

    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.email || "N/A", leftColumn + 22, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.phone || "N/A", rightColumn + 30, yPosition)
    yPosition += 4

    if (costEstimate.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(costEstimate.client.address, leftColumn + 22, yPosition, contentWidth - 22)
      yPosition += 2
    }

    if (costEstimate.client?.industry) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Industry:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate.client.industry, leftColumn + 22, yPosition)
      yPosition += 4
    }

    if (startDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Start Date:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(startDate.toLocaleDateString(), leftColumn + 22, yPosition)
      yPosition += 4
    }

    if (endDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("End Date:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(endDate.toLocaleDateString(), rightColumn + 30, yPosition)
      yPosition += 4
    }

    yPosition += 6

    // Cost Breakdown Section
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST BREAKDOWN", margin, yPosition)
    yPosition += 5

    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 6

    // Table Headers
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("Description", margin, yPosition)
    pdf.text("Qty", margin + contentWidth * 0.5, yPosition, { align: "right" })
    pdf.text("Unit Price", margin + contentWidth * 0.75, yPosition, { align: "right" })
    pdf.text("Total", pageWidth - margin, yPosition, { align: "right" })
    yPosition += 5
    pdf.setLineWidth(0.1)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 3

    // Line Items
    pdf.setFont("helvetica", "normal")
    costEstimate.lineItems.forEach((item) => {
      checkNewPage(10) // Estimate height for each item
      pdf.setFontSize(9)
      pdf.text(item.description, margin, yPosition)
      pdf.text(item.quantity.toString(), margin + contentWidth * 0.5, yPosition, { align: "right" })
      pdf.text(`₱${item.unitPrice.toLocaleString()}`, margin + contentWidth * 0.75, yPosition, { align: "right" })
      pdf.text(`₱${item.total.toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" })
      yPosition += 5
      if (item.notes) {
        pdf.setFontSize(7)
        pdf.setTextColor(100, 100, 100)
        yPosition = addText(item.notes, margin + 2, yPosition, contentWidth - 2, 7)
        pdf.setTextColor(0, 0, 0)
      }
      yPosition += 3
    })

    // Total Amount
    checkNewPage(15)
    yPosition += 5
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 6

    pdf.setFontSize(13)
    pdf.setFont("helvetica", "bold")
    const totalText = `TOTAL ESTIMATED COST: ₱${costEstimate.totalAmount.toLocaleString()}`
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition - 3, contentWidth, 8, "F")
    pdf.text(totalText, margin + 3, yPosition + 1)
    yPosition += 10

    // Notes and Custom Message
    if (costEstimate.notes || costEstimate.customMessage) {
      checkNewPage(20)
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 5

      pdf.setLineWidth(0.3)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5

      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")

      if (costEstimate.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Internal Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 3
        yPosition = addText(costEstimate.notes, margin, yPosition, contentWidth)
        yPosition += 3
      }

      if (costEstimate.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 3
        yPosition = addText(costEstimate.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 10
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, footerY)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `cost-estimate-${(costEstimate.title || "cost-estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Cost Estimate PDF:", error)
    throw new Error("Failed to generate Cost Estimate PDF")
  }
}

export async function generateReportPDF(
  report: ReportData,
  product: any,
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = 0

    // Reserve space for footer (prepared by section + angular footer)
    const footerReservedSpace = 50

    const createdAt = safeToDate(report.created || report.date)
    const startDate = safeToDate(report.bookingDates.start)
    const endDate = safeToDate(report.bookingDates.end)

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - footerReservedSpace) {
        // Add footer to current page before creating new page
        addFooterToPage()
        pdf.addPage()
        yPosition = 0
        // Add header to new page
        addHeaderToPage()
      }
    }

    // Helper function to get report type display
    const getReportTypeDisplay = (type: string) => {
      return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    // Helper function to format date
    const formatDate = (dateString: string | Date) => {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Helper function to add header to page
    const addHeaderToPage = () => {
      // Angular Blue Header
      pdf.setFillColor(30, 58, 138) // Blue-900
      pdf.rect(0, yPosition, pageWidth, 16, "F")

      // Angular cyan section
      pdf.setFillColor(34, 211, 238) // Cyan-400
      const cyanWidth = pageWidth * 0.4
      const points = [
        [pageWidth * 0.25, yPosition],
        [pageWidth, yPosition],
        [pageWidth, yPosition + 16],
        [0, yPosition + 16],
      ]
      pdf.triangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], "F")
      pdf.triangle(points[0][0], points[0][1], points[2][0], points[2][1], points[3][0], points[3][1], "F")

      // Header text
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("Logistics", margin, yPosition + 10)

      yPosition += 20
      pdf.setTextColor(0, 0, 0)
    }

    // Helper function to add footer to page
    const addFooterToPage = () => {
      const footerStartY = pageHeight - footerReservedSpace

      // Prepared By Section
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.text("Prepared by:", margin, footerStartY + 5)

      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(59, 130, 246) // Blue-500
      pdf.text(report.createdByName || "System", margin, footerStartY + 10)
      pdf.setTextColor(0, 0, 0)
      pdf.text("LOGISTICS", margin, footerStartY + 14)
      pdf.text(formatDate(createdAt), margin, footerStartY + 18)

      // Disclaimer text on the right
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      const disclaimerText = `"All data are based on the latest available records as of ${formatDate(new Date())}."`
      const disclaimerWidth = pdf.getTextWidth(disclaimerText)
      pdf.text(disclaimerText, pageWidth - margin - disclaimerWidth, footerStartY + 12)

      // Horizontal line above footer
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(0, 0, 0)
      pdf.line(margin, footerStartY, pageWidth - margin, footerStartY)

      // Angular Footer
      const angularFooterY = footerStartY + 25

      // Cyan section on left
      pdf.setFillColor(34, 211, 238) // Cyan-400
      pdf.rect(0, angularFooterY, pageWidth, 16, "F")

      // Angular dark blue section
      pdf.setFillColor(30, 58, 138) // Blue-900
      const blueWidth = pageWidth * 0.75
      const footerPoints = [
        [pageWidth * 0.25, angularFooterY],
        [pageWidth, angularFooterY],
        [pageWidth, angularFooterY + 16],
        [0, angularFooterY + 16],
      ]
      pdf.triangle(
        footerPoints[0][0],
        footerPoints[0][1],
        footerPoints[1][0],
        footerPoints[1][1],
        footerPoints[2][0],
        footerPoints[2][1],
        "F",
      )
      pdf.triangle(
        footerPoints[0][0],
        footerPoints[0][1],
        footerPoints[2][0],
        footerPoints[2][1],
        footerPoints[3][0],
        footerPoints[3][1],
        "F",
      )

      // Footer text
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.text("Smart. Seamless. Scalable", pageWidth - margin - 50, angularFooterY + 6)

      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("OH!", pageWidth - margin - 25, angularFooterY + 10)
      pdf.setTextColor(34, 211, 238) // Cyan-400
      pdf.text("+", pageWidth - margin - 10, angularFooterY + 10)

      pdf.setTextColor(0, 0, 0)
    }

    // Add header to first page
    addHeaderToPage()

    // Report Header with Badge and Logo
    yPosition += 5
    pdf.setFillColor(34, 211, 238) // Cyan-400
    pdf.rect(margin, yPosition - 2, 40, 8, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("Installation Report", margin + 2, yPosition + 3)

    // Date
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(8)
    pdf.text(`as of ${formatDate(report.date)}`, margin, yPosition + 8)

    // Logo (GTS badge)
    pdf.setFillColor(255, 193, 7) // Yellow-400
    pdf.circle(pageWidth - margin - 10, yPosition + 5, 8, "F")
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text("GTS", pageWidth - margin - 15, yPosition + 7)

    yPosition += 20
    pdf.setTextColor(0, 0, 0)

    // Project Information Section
    checkNewPage(60)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Information", margin, yPosition)
    yPosition += 8

    // Project details in two columns
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Left column
    const leftColumnData = [
      ["Site ID:", `${report.siteId} ${product?.light?.location || product?.specs_rental?.location || ""}`],
      ["Job Order:", report.id?.slice(-4).toUpperCase() || "N/A"],
      ["Job Order Date:", formatDate(createdAt)],
      ["Site:", report.siteName],
      ["Size:", product?.specs_rental?.size || product?.light?.size || "N/A"],
      ["Start Date:", formatDate(startDate)],
      ["End Date:", formatDate(endDate)],
      [
        "Installation Duration:",
        `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
      ],
    ]

    // Right column
    const rightColumnData = [
      ["Content:", product?.content_type || "N/A"],
      ["Material Specs:", product?.specs_rental?.material || "N/A"],
      ["Crew:", `Team ${report.assignedTo || "A"}`],
      ["Illumination:", product?.light?.illumination || "N/A"],
      ["Gondola:", product?.specs_rental?.gondola ? "YES" : "NO"],
      ["Technology:", product?.specs_rental?.technology || "N/A"],
      ["Sales:", report.sales],
    ]

    // Render left column
    let leftY = yPosition
    leftColumnData.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.text(value, leftColumn + 32, leftY)
      leftY += 4
    })

    // Render right column
    let rightY = yPosition
    rightColumnData.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.text(value, rightColumn + 32, rightY)
      rightY += 4
    })

    yPosition = Math.max(leftY, rightY) + 5

    // Project Status Section
    checkNewPage(80)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Status", margin, yPosition)

    // Status badge
    pdf.setFillColor(34, 197, 94) // Green-500
    pdf.rect(margin + 50, yPosition - 3, 15, 6, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.text(`${report.completionPercentage || 100}%`, margin + 52, yPosition)
    pdf.setTextColor(0, 0, 0)

    yPosition += 10

    // Attachments/Photos Section - Always maintain consistent spacing
    const attachmentSectionHeight = 70 // Fixed height for attachment section
    checkNewPage(attachmentSectionHeight)

    if (report.attachments && report.attachments.length > 0) {
      // Add images if available
      const imagesToShow = report.attachments.slice(0, 2)
      let imageX = margin
      const imageWidth = (contentWidth - 10) / 2
      const imageHeight = 50

      for (let i = 0; i < imagesToShow.length; i++) {
        const attachment = imagesToShow[i]
        if (attachment.fileUrl) {
          try {
            const base64 = await loadImageAsBase64(attachment.fileUrl)
            if (base64) {
              pdf.addImage(base64, "JPEG", imageX, yPosition, imageWidth, imageHeight)
            }
          } catch (error) {
            // Draw placeholder rectangle if image fails
            pdf.setFillColor(240, 240, 240)
            pdf.rect(imageX, yPosition, imageWidth, imageHeight, "F")
            pdf.setTextColor(100, 100, 100)
            pdf.setFontSize(8)
            pdf.text("Image not available", imageX + imageWidth / 2 - 20, yPosition + imageHeight / 2)
            pdf.setTextColor(0, 0, 0)
          }
        } else {
          // Draw placeholder rectangle
          pdf.setFillColor(240, 240, 240)
          pdf.rect(imageX, yPosition, imageWidth, imageHeight, "F")
          pdf.setTextColor(100, 100, 100)
          pdf.setFontSize(8)
          pdf.text(`Project Photo ${i + 1}`, imageX + imageWidth / 2 - 15, yPosition + imageHeight / 2)
          pdf.setTextColor(0, 0, 0)
        }

        // Add image details below
        pdf.setFontSize(7)
        pdf.text(`Date: ${formatDate(report.date)}`, imageX, yPosition + imageHeight + 3)
        pdf.text(
          `Time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
          imageX,
          yPosition + imageHeight + 7,
        )
        pdf.text(`Location: ${report.location || "N/A"}`, imageX, yPosition + imageHeight + 11)

        imageX += imageWidth + 10
      }
    } else {
      // Draw placeholder for no attachments - maintain same height
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin, yPosition, contentWidth, attachmentSectionHeight - 20, "F")
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(1)
      pdf.rect(margin, yPosition, contentWidth, attachmentSectionHeight - 20)

      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(10)
      pdf.text(
        "No attachments available",
        margin + contentWidth / 2 - 30,
        yPosition + (attachmentSectionHeight - 20) / 2 - 5,
      )
      pdf.setFontSize(8)
      pdf.text(
        "Project photos will appear here when uploaded",
        margin + contentWidth / 2 - 45,
        yPosition + (attachmentSectionHeight - 20) / 2 + 2,
      )
      pdf.setTextColor(0, 0, 0)
    }

    // Move to end of page to add footer
    yPosition = pageHeight - footerReservedSpace - 5

    // Add footer to the page
    addFooterToPage()

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `report-${report.siteName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
