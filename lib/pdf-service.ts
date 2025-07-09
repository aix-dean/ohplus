import jsPDF from "jspdf"
import type { Proposal } from "@/lib/types/proposal"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import type { ReportData } from "@/lib/report-service"
import type { Product } from "@/lib/firebase-service"

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
  product: Product | null,
  returnBlob = false,
): Promise<void | Blob> {
  try {
    const doc = new jsPDF()

    // Set up document properties
    doc.setProperties({
      title: `${report.reportType} - ${report.siteName}`,
      subject: "Site Report",
      author: "OOH Operator",
      creator: "OOH Operator System",
    })

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("SITE REPORT", 105, 20, { align: "center" })

    // Report type and site info
    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    doc.text(`Report Type: ${getReportTypeDisplay(report.reportType)}`, 20, 40)
    doc.text(`Site Name: ${report.siteName}`, 20, 50)
    doc.text(`Site ID: ${report.siteId}`, 20, 60)
    doc.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 20, 70)

    // Status
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Status:", 20, 90)
    doc.setFont("helvetica", "normal")
    doc.text(`${report.completionPercentage || 100}% Complete`, 50, 90)

    // Description
    if (report.description) {
      doc.setFont("helvetica", "bold")
      doc.text("Description:", 20, 110)
      doc.setFont("helvetica", "normal")

      // Split long text into multiple lines
      const splitDescription = doc.splitTextToSize(report.description, 170)
      doc.text(splitDescription, 20, 120)
    }

    // Product information
    if (product) {
      let yPos = 150
      doc.setFont("helvetica", "bold")
      doc.text("Product Information:", 20, yPos)

      doc.setFont("helvetica", "normal")
      yPos += 10
      doc.text(`Product Name: ${product.name || "N/A"}`, 20, yPos)
      yPos += 10
      doc.text(`Location: ${product.location || "N/A"}`, 20, yPos)
      yPos += 10
      doc.text(`Type: ${product.type || "N/A"}`, 20, yPos)
    }

    // Attachments info
    if (report.attachments && report.attachments.length > 0) {
      let yPos = 200
      doc.setFont("helvetica", "bold")
      doc.text("Attachments:", 20, yPos)

      doc.setFont("helvetica", "normal")
      report.attachments.forEach((attachment, index) => {
        yPos += 10
        doc.text(`${index + 1}. ${attachment.name || `Attachment ${index + 1}`}`, 25, yPos)
      })
    }

    // Footer
    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Generated by OOH Operator System", 105, 280, { align: "center" })
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: "center" })

    if (returnBlob) {
      // Return as blob for email attachment
      return doc.output("blob")
    } else {
      // Download the PDF
      const fileName = `${report.siteId}_${getReportTypeDisplay(report.reportType).replace(/\s+/g, "_")}_${report.siteName.replace(/\s+/g, "_")}.pdf`
      doc.save(fileName)
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

function getReportTypeDisplay(type: string): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
