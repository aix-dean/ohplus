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

// New helper function to calculate image dimensions for fitting
async function calculateImageFitDimensions(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<{ base64: string | null; width: number; height: number }> {
  const base64 = await loadImageAsBase64(imageUrl)
  if (!base64) return { base64: null, width: 0, height: 0 }

  const dimensions = await getImageDimensions(base64)
  let { width, height } = dimensions
  const aspectRatio = width / height

  // Scale to fit within max bounds
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return { base64, width, height }
}

// Helper function to format currency without +/- signs
function formatCurrency(amount: number): string {
  return `₱${Math.abs(amount).toLocaleString()}`
}

export async function generateProposalPDF(proposal: Proposal, returnBase64 = false): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20 // Increased margin for better spacing
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

    // Helper function to add QR code to current page with better positioning
    const addQRCodeToPage = async () => {
      try {
        const qrSize = 20 // Slightly smaller QR code
        const qrX = pageWidth - margin - qrSize // Right aligned with proper margin
        const qrY = margin

        // Load QR code image and add to PDF
        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)

          // Add small text below QR code
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          const textWidth = pdf.getTextWidth("Scan to view online")
          pdf.text("Scan to view online", qrX + (qrSize - textWidth) / 2, qrY + qrSize + 3)
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
        // Continue without QR code if it fails
      }
    }

    // Add QR code to first page
    await addQRCodeToPage()

    // Header with better spacing from QR code
    const headerContentWidth = contentWidth - 25 // Leave more space for QR code
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL", margin, yPosition)
    yPosition += 12

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(proposal.title || "Untitled Proposal", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 3

    // Date and validity with better formatting
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 5)
    yPosition += 15

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(40)
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

    // Client details in two columns with better spacing
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    // Left column
    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.company || "N/A", leftColumn + 25, yPosition)

    // Right column
    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.contactPerson || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Second row
    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Third row - Industry and Designation
    pdf.setFont("helvetica", "bold")
    pdf.text("Industry:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.industry || "N/A", leftColumn + 25, yPosition)

    // Add designation field
    if (proposal.client?.designation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Designation:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(proposal.client.designation, rightColumn + 35, yPosition)
    }
    yPosition += 6

    // Address (full width if present)
    if (proposal.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(proposal.client.address, leftColumn + 25, yPosition, contentWidth - 25)
      yPosition += 3
    }

    yPosition += 8

    // Products Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PRODUCTS & SERVICES", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Products with better formatting
    if (proposal.products && proposal.products.length > 0) {
      for (let index = 0; index < proposal.products.length; index++) {
        const product = proposal.products[index]

        // Calculate required space more accurately
        let requiredHeight = 25

        // Add height for images if they exist
        if (product.media && product.media.length > 0) {
          requiredHeight += 80
        }

        checkNewPage(requiredHeight)

        // Product header with better formatting
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${index + 1}. ${product.name || "Unnamed Product"}`, margin, yPosition)

        // Price on the right without +/- signs
        const price = typeof product.price === "string" ? Number.parseFloat(product.price) || 0 : product.price || 0
        const priceText = formatCurrency(price)
        const priceWidth = pdf.getTextWidth(priceText)
        pdf.text(priceText, pageWidth - margin - priceWidth, yPosition)
        yPosition += 5

        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(100, 100, 100)
        pdf.text(product.type || "N/A", margin + 5, yPosition)
        yPosition += 4

        pdf.setTextColor(0, 0, 0)

        // Product details with better spacing
        pdf.text(`Location: ${product.location || "N/A"}`, margin + 5, yPosition)
        yPosition += 4

        if (product.site_code) {
          pdf.text(`Site Code: ${product.site_code}`, margin + 5, yPosition)
          yPosition += 4
        }

        if (product.specs_rental) {
          if (product.specs_rental.traffic_count) {
            pdf.text(`Traffic Count: ${product.specs_rental.traffic_count.toLocaleString()}/day`, margin + 5, yPosition)
            yPosition += 4
          }
          if (product.specs_rental.height && product.specs_rental.width) {
            pdf.text(
              `Dimensions: ${product.specs_rental.height}m × ${product.specs_rental.width}m`,
              margin + 5,
              yPosition,
            )
            yPosition += 4
          }
          if (product.specs_rental.audience_type) {
            pdf.text(`Audience: ${product.specs_rental.audience_type}`, margin + 5, yPosition)
            yPosition += 4
          }
        }

        if (product.description) {
          pdf.setFont("helvetica", "italic")
          yPosition = addText(product.description, margin + 5, yPosition, contentWidth - 10, 9)
          pdf.setFont("helvetica", "normal")
          yPosition += 3
        }

        // Add product images with better layout
        if (product.media && product.media.length > 0) {
          yPosition += 5
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(10)
          pdf.text("Product Images:", margin + 5, yPosition)
          yPosition += 5

          const maxImageWidth = 80
          const maxImageHeight = 60
          const imageSpacing = 10
          let currentX = margin + 5
          let maxImageHeightInRow = 0

          const imagesToShow = product.media.slice(0, 2)

          for (let imgIndex = 0; imgIndex < imagesToShow.length; imgIndex++) {
            const media = imagesToShow[imgIndex]

            if (media.isVideo) continue

            if (media.url) {
              if (imagesToShow.length === 1) {
                // Single image - center it
                const singleImageWidth = 120
                const singleImageHeight = 90
                const centerX = margin + (contentWidth - singleImageWidth) / 2

                checkNewPage(singleImageHeight + 15)

                try {
                  const { base64, width, height } = await calculateImageFitDimensions(
                    media.url,
                    singleImageWidth,
                    singleImageHeight,
                  )
                  if (base64) {
                    pdf.addImage(base64, "JPEG", centerX, yPosition, width, height)
                    yPosition += height + 8
                  }
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              } else {
                // Multiple images - side by side
                if (imgIndex > 0 && imgIndex % 2 === 0) {
                  yPosition += maxImageHeightInRow + imageSpacing
                  currentX = margin + 5
                  maxImageHeightInRow = 0
                  checkNewPage(maxImageHeight + 15)
                }

                try {
                  const { base64, width, height } = await calculateImageFitDimensions(
                    media.url,
                    maxImageWidth,
                    maxImageHeight,
                  )
                  if (base64) {
                    pdf.addImage(base64, "JPEG", currentX, yPosition, width, height)

                    if (height > maxImageHeightInRow) {
                      maxImageHeightInRow = height
                    }

                    currentX += maxImageWidth + imageSpacing
                  }
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              }
            }
          }

          if (imagesToShow.length > 1) {
            yPosition += maxImageHeightInRow + 8
          }
        }

        yPosition += 12
      }
    }

    // Summary Section with better formatting
    checkNewPage(30)
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL SUMMARY", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total Products: ${proposal.products?.length || 0}`, margin, yPosition)
    yPosition += 6

    // Total amount without +/- signs and better formatting
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalAmount = proposal.totalAmount || 0
    const totalText = `TOTAL AMOUNT: ${formatCurrency(totalAmount)}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes and Custom Message
    if (proposal.notes || proposal.customMessage) {
      checkNewPage(25)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 6

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      if (proposal.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.notes, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (proposal.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.customMessage, margin, yPosition, contentWidth)
      }
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
    const margin = 20 // Increased margin
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
        const qrSize = 20
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          const textWidth = pdf.getTextWidth("Scan to view online")
          pdf.text("Scan to view online", qrX + (qrSize - textWidth) / 2, qrY + qrSize + 3)
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
      }
    }

    await addQRCodeToPage()

    // Header
    const headerContentWidth = contentWidth - 25
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
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 5)
    yPosition += 15

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.contactPerson || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Add designation for cost estimate too
    pdf.setFont("helvetica", "bold")
    pdf.text("Industry:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.industry || "N/A", leftColumn + 25, yPosition)

    if (costEstimate.client?.designation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Designation:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate.client.designation, rightColumn + 35, yPosition)
    }
    yPosition += 6

    if (costEstimate.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(costEstimate.client.address, leftColumn + 25, yPosition, contentWidth - 25)
      yPosition += 3
    }

    if (startDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Start Date:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(startDate.toLocaleDateString(), leftColumn + 25, yPosition)
      yPosition += 6
    }

    if (endDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("End Date:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(endDate.toLocaleDateString(), rightColumn + 35, yPosition)
      yPosition += 6
    }

    yPosition += 8

    // Cost Breakdown Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST BREAKDOWN", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Table Headers
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text("Description", margin, yPosition)
    pdf.text("Qty", margin + contentWidth * 0.5, yPosition, { align: "right" })
    pdf.text("Unit Price", margin + contentWidth * 0.75, yPosition, { align: "right" })
    pdf.text("Total", pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.setLineWidth(0.2)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    // Line Items
    pdf.setFont("helvetica", "normal")
    costEstimate.lineItems.forEach((item) => {
      checkNewPage(12)
      pdf.setFontSize(10)
      pdf.text(item.description, margin, yPosition)
      pdf.text(item.quantity.toString(), margin + contentWidth * 0.5, yPosition, { align: "right" })
      pdf.text(formatCurrency(item.unitPrice), margin + contentWidth * 0.75, yPosition, { align: "right" })
      pdf.text(formatCurrency(item.total), pageWidth - margin, yPosition, { align: "right" })
      yPosition += 6
      if (item.notes) {
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        yPosition = addText(item.notes, margin + 3, yPosition, contentWidth - 3, 8)
        pdf.setTextColor(0, 0, 0)
      }
      yPosition += 4
    })

    // Total Amount
    checkNewPage(20)
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalText = `TOTAL ESTIMATED COST: ${formatCurrency(costEstimate.totalAmount)}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes and Custom Message
    if (costEstimate.notes || costEstimate.customMessage) {
      checkNewPage(25)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 6

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      if (costEstimate.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Internal Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(costEstimate.notes, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (costEstimate.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(costEstimate.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

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

    const createdAt = safeToDate(report.created || report.date)
    const startDate = safeToDate(report.bookingDates.start)
    const endDate = safeToDate(report.bookingDates.end)

    // Helper function to format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 30) {
        pdf.addPage()
        yPosition = 0
        addHeaderToPage()
      }
    }

    // Helper function to add image to PDF
    const addImageToPDF = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
      try {
        const base64 = await loadImageAsBase64(imageUrl)
        if (!base64) return { width: 0, height: 0 }

        const dimensions = await getImageDimensions(base64)
        let { width, height } = dimensions
        const aspectRatio = width / height

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

    // Helper function to create the angular header exactly like the page
    const addHeaderToPage = async () => {
      try {
        const headerHeight = 16

        // Main blue section
        pdf.setFillColor(30, 58, 138) // blue-900
        pdf.rect(0, yPosition, pageWidth, headerHeight, "F")

        // Angular cyan section pointing right using polygon
        const cyanlWidth = pageWidth * 0.4
        const startX = pageWidth - cyanlWidth + cyanlWidth * 0.25

        // Create the angular shape using triangles
        pdf.setFillColor(52, 211, 235) // cyan-400

        // First triangle (top part)
        pdf.triangle(startX, yPosition, pageWidth, yPosition, pageWidth, yPosition + headerHeight / 2, "F")

        // Second triangle (bottom part)
        pdf.triangle(
          startX,
          yPosition,
          pageWidth,
          yPosition + headerHeight / 2,
          pageWidth,
          yPosition + headerHeight,
          "F",
        )

        // Third triangle (left connecting part)
        pdf.triangle(
          startX,
          yPosition,
          pageWidth,
          yPosition + headerHeight,
          pageWidth - cyanlWidth,
          yPosition + headerHeight,
          "F",
        )

        // Add "Logistics" text
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text("Logistics", margin, yPosition + 10)

        yPosition += headerHeight + 5
        pdf.setTextColor(0, 0, 0)
      } catch (error) {
        console.error("Error adding header:", error)
        yPosition += 25
      }
    }

    // Add header to first page
    await addHeaderToPage()

    // Report Title Section with badge and logo
    const badgeWidth = 50
    const badgeHeight = 8

    // Create cyan badge for "Installation Report"
    pdf.setFillColor(52, 211, 235) // cyan-400
    pdf.rect(margin, yPosition, badgeWidth, badgeHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.text("Installation Report", margin + 2, yPosition + 5)
    pdf.setTextColor(0, 0, 0)

    // Add company logo on the right (similar to web page - smaller size)
    const logoContainerSize = 30 // Container size
    const logoX = pageWidth - margin - logoContainerSize
    const logoY = yPosition - 2 // Aligned with badge

    // Load company logo with fallback logic like the preview page
    const companyLogoUrl = "/ohplus-new-logo.png" // Default fallback

    // Try to get company logo from user's company data (same as preview page)
    // This would need to be passed as a parameter or fetched within the function
    // For now, using the default OH+ logo as fallback

    const logoBase64 = await loadImageAsBase64(companyLogoUrl)
    if (logoBase64) {
      // Add white background container for logo (similar to web page)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(logoX - 2, logoY, logoContainerSize + 4, logoContainerSize, "F")

      // Calculate actual dimensions to fit within the container while maintaining aspect ratio
      const { width: actualLogoWidth, height: actualLogoHeight } = await getImageDimensions(logoBase64)

      let finalLogoWidth = logoContainerSize
      let finalLogoHeight = logoContainerSize

      // Adjust dimensions to fit within the container while maintaining aspect ratio
      const logoAspectRatio = actualLogoWidth / actualLogoHeight
      if (logoAspectRatio > 1) {
        // Wider than tall
        finalLogoHeight = logoContainerSize / logoAspectRatio
      } else {
        // Taller than wide or square
        finalLogoWidth = logoContainerSize * logoAspectRatio
      }

      // Center the logo within its container
      const logoOffsetX = (logoContainerSize - finalLogoWidth) / 2
      const logoOffsetY = (logoContainerSize - finalLogoHeight) / 2

      pdf.addImage(logoBase64, "PNG", logoX + logoOffsetX, logoY + logoOffsetY, finalLogoWidth, finalLogoHeight)
    }

    yPosition += badgeHeight + 5

    // "as of" date text
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`as of ${formatDate(report.date)}`, margin, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 15

    // Project Information Section
    checkNewPage(70)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Information", margin, yPosition)
    yPosition += 8

    // Draw border around project info table
    pdf.setLineWidth(1)
    pdf.setDrawColor(0, 0, 0)
    const tableHeight = 55
    pdf.rect(margin, yPosition, contentWidth, tableHeight)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Helper functions to get data exactly like the web page
    const getSiteLocation = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.location || product.light?.location || "N/A"
    }

    const getSiteName = (report: any) => {
      return report.siteName || "N/A"
    }

    const getSiteSize = (product: any) => {
      if (!product) return "N/A"
      const specs = product.specs_rental
      if (specs?.height && specs?.width) {
        const panels = specs.panels || "N/A"
        return `${specs.height} (H) x ${specs.width} (W) x ${panels} Panels`
      }
      return product.specs_rental?.size || product.light?.size || "N/A"
    }

    const getMaterialSpecs = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.material || "Stickers"
    }

    const getIllumination = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.illumination || "LR 2097 (200 Watts x 40)"
    }

    const getGondola = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.gondola ? "YES" : "NO"
    }

    const getTechnology = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.technology || "Clear Tapes"
    }

    const calculateInstallationDuration = (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Two column layout for project information
    const leftColumn = margin + 3
    const rightColumn = margin + contentWidth / 2 + 5

    let leftY = yPosition
    let rightY = yPosition

    const leftColumnData = [
      { label: "Site ID:", value: getSiteLocation(product) },
      { label: "Job Order:", value: report.id?.slice(-4).toUpperCase() || "7733" },
      { label: "Job Order Date:", value: formatDate(report.date) },
      { label: "Site:", value: getSiteName(report) },
      { label: "Size:", value: getSiteSize(product) },
      { label: "Start Date:", value: formatDate(report.bookingDates.start) },
      { label: "End Date:", value: formatDate(report.bookingDates.end) },
      {
        label: "Installation Duration:",
        value: `${calculateInstallationDuration(report.bookingDates.start, report.bookingDates.end)} days`,
      },
    ]

    const rightColumnData = [
      { label: "Content:", value: product?.content_type || "Static" },
      { label: "Material Specs:", value: getMaterialSpecs(product) },
      { label: "Crew:", value: `Team ${report.assignedTo || "4"}` },
      { label: "Illumination:", value: getIllumination(product) },
      { label: "Gondola:", value: getGondola(product) },
      { label: "Technology:", value: getTechnology(product) },
      { label: "Sales:", value: report.sales || "N/A" },
    ]

    // Render left column
    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      const labelWidth = item.label === "Job Order Date:" ? 35 : item.label === "Installation Duration:" ? 45 : 25
      pdf.text(item.value, leftColumn + labelWidth, leftY)
      leftY += 5
    })

    // Render right column
    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      const labelWidth =
        item.label === "Material Specs:"
          ? 35
          : item.label === "Illumination:"
            ? 35
            : item.label === "Technology:"
              ? 35
              : 25
      pdf.text(item.value, rightColumn + labelWidth, rightY)
      rightY += 5
    })

    yPosition += tableHeight + 10

    // Project Status Section
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Status", margin, yPosition)

    // Status badge - green
    pdf.setFillColor(34, 197, 94) // green-500
    const statusBadgeWidth = 25
    const statusBadgeHeight = 6
    pdf.rect(margin + 90, yPosition - 4, statusBadgeWidth, statusBadgeHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.text(`${report.completionPercentage || 100}%`, margin + 95, yPosition)
    pdf.setTextColor(0, 0, 0)

    yPosition += 15

    // Attachments/Photos Section (2 side by side like in the page)
    if (report.attachments && report.attachments.length > 0) {
      checkNewPage(80)

      const attachmentsToShow = report.attachments.slice(0, 2)
      const imageWidth = (contentWidth - 10) / 2 // Space for 2 images side by side
      const imageHeight = 60

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const attachment = attachmentsToShow[i]
        const currentX = i === 0 ? margin : margin + imageWidth + 10

        // Draw border for attachment box
        pdf.setLineWidth(0.5)
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(currentX, yPosition, imageWidth, imageHeight)

        // Try to add actual image if it's an image file
        if (attachment.fileUrl && attachment.fileName) {
          const extension = attachment.fileName.toLowerCase().split(".").pop()
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
            try {
              const { base64, width, height } = await calculateImageFitDimensions(
                attachment.fileUrl,
                imageWidth - 4, // Max width for the image inside the border
                imageHeight - 4, // Max height for the image inside the border
              )

              if (base64) {
                // Calculate x position to center the image within its container
                const centeredX = currentX + (imageWidth - width) / 2
                pdf.addImage(base64, "JPEG", centeredX, yPosition + 2, width, height)
              }
            } catch (error) {
              console.error("Error adding attachment image:", error)
              // Add placeholder text
              pdf.setFontSize(8)
              pdf.text(attachment.fileName, currentX + 5, yPosition + imageHeight / 2)
            }
          } else {
            // Add file name for non-image files
            pdf.setFontSize(8)
            pdf.text(attachment.fileName, currentX + 5, yPosition + imageHeight / 2)
          }
        } else {
          // Placeholder for missing attachment
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`Project Photo ${i + 1}`, currentX + 5, yPosition + imageHeight / 2)
          pdf.setTextColor(0, 0, 0)
        }
      }

      yPosition += imageHeight + 5

      // Add attachment info below images (like in the page)
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const currentX = i === 0 ? margin : margin + imageWidth + 10

        pdf.setFont("helvetica", "bold")
        pdf.text("Date:", currentX, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(report.date), currentX + 15, yPosition)

        pdf.setFont("helvetica", "bold")
        pdf.text("Time:", currentX, yPosition + 4)
        pdf.setFont("helvetica", "normal")
        pdf.text(
          new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          currentX + 15,
          yPosition + 4,
        )

        pdf.setFont("helvetica", "bold")
        pdf.text("Location:", currentX, yPosition + 8)
        pdf.setFont("helvetica", "normal")
        pdf.text(report.location || "N/A", currentX + 25, yPosition + 8)
      }

      yPosition += 20
    }

    // Footer Section
    checkNewPage(40)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Prepared by section (matching the exact pageview.png format)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text("Prepared by:", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(0, 0, 0)

    // Use initials or short name instead of full email
    const preparedByName = report.createdByName || "JP"
    pdf.text(preparedByName, margin, yPosition)
    yPosition += 4

    pdf.text("LOGISTICS", margin, yPosition)
    yPosition += 4

    // Use MM/DD/YY format to match pageview
    const reportDate = new Date(report.date)
    const formattedDate = reportDate.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    pdf.text(formattedDate, margin, yPosition)

    // Disclaimer on the right (matching pageview format exactly)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(107, 114, 128) // gray color
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    const disclaimer = `"All data are based on the latest available records as of ${currentDate}."`

    // Position disclaimer on the right side, aligned with the date line
    const disclaimerWidth = 120
    pdf.text(disclaimer, pageWidth - margin - disclaimerWidth, yPosition, {
      align: "left",
      maxWidth: disclaimerWidth,
    })

    // Angular Footer (matching the page design)
    const footerY = pageHeight - 12
    const footerHeight = 12

    // Cyan section on left with diagonal cut
    pdf.setFillColor(52, 211, 235) // cyan-400
    const cyanWidth = pageWidth * 0.3
    const diagonalCutWidth = pageWidth * 0.05

    // Draw the main cyan rectangle
    pdf.rect(0, footerY, cyanWidth - diagonalCutWidth, footerHeight, "F")

    // Draw the diagonal part of cyan section
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      footerY,
      cyanWidth,
      footerY,
      cyanWidth - diagonalCutWidth,
      footerY + footerHeight,
      "F",
    )

    // Angular blue section
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(cyanWidth, footerY, pageWidth - cyanWidth, footerHeight, "F")

    // Draw the diagonal connecting part
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      footerY + footerHeight,
      cyanWidth,
      footerY,
      cyanWidth,
      footerY + footerHeight,
      "F",
    )

    // Add footer text
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("Smart. Seamless. Scalable", pageWidth - margin - 65, footerY + 6)

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH!", pageWidth - margin - 15, footerY + 8)

    // Add the "+" symbol
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text("+", pageWidth - margin - 5, footerY + 8)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `report-installation-report-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
