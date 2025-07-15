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
        // Calculate qrX to center the QR code horizontally
        const qrX = (pageWidth - qrSize) / 2
        const qrY = margin

        // Load QR code image and add to PDF
        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)

          // Add small text below QR code
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          // Adjust text position to be centered below the QR code
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
                  const { base64, width, height } = await calculateImageFitDimensions(
                    media.url,
                    singleImageWidth,
                    singleImageHeight,
                  )
                  if (base64) {
                    pdf.addImage(base64, "JPEG", centerX, yPosition, width, height)
                    yPosition += height + 5
                  }
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
        // Calculate qrX to center the QR code horizontally
        const qrX = (pageWidth - qrSize) / 2
        const qrY = margin

        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          // Adjust text position to be centered below the QR code
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
    let yPosition = 0

    // Helper function to format date exactly like the web page
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    }

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

    const calculateInstallationDuration = (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    const getMaterialSpecs = (product: any) => {
      if (!product) return "Stickers"
      return product.specs_rental?.material || "Stickers"
    }

    const getIllumination = (product: any) => {
      if (!product) return "LR 2097 (200 Watts x 40)"
      return product.specs_rental?.illumination || "LR 2097 (200 Watts x 40)"
    }

    const getGondola = (product: any) => {
      if (!product) return "NO"
      return product.specs_rental?.gondola ? "YES" : "NO"
    }

    const getTechnology = (product: any) => {
      if (!product) return "Clear Tapes"
      return product.specs_rental?.technology || "Clear Tapes"
    }

    // ANGULAR BLUE HEADER (exactly like the web page)
    const headerHeight = 16
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(0, yPosition, pageWidth, headerHeight, "F")

    // Angular cyan section (clipPath: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%))
    const cyanlWidth = pageWidth * 0.4
    const startX = pageWidth - cyanlWidth + cyanlWidth * 0.25
    pdf.setFillColor(34, 211, 235) // cyan-400
    pdf.triangle(startX, yPosition, pageWidth, yPosition, pageWidth, yPosition + headerHeight, "F")
    pdf.triangle(
      startX,
      yPosition,
      pageWidth,
      yPosition + headerHeight,
      pageWidth - cyanlWidth,
      yPosition + headerHeight,
      "F",
    )

    // "Logistics" text
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Logistics", 15, yPosition + 10)
    pdf.setTextColor(0, 0, 0)
    yPosition += headerHeight + 8

    // REPORT TITLE SECTION
    // Cyan badge for report type
    const reportTypeDisplay = report.reportType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const badgeWidth = 60
    const badgeHeight = 12
    pdf.setFillColor(34, 211, 235) // cyan-400
    pdf.roundedRect(15, yPosition, badgeWidth, badgeHeight, 3, 3, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(reportTypeDisplay, 18, yPosition + 8)
    pdf.setTextColor(0, 0, 0)

    // Company logo on the right (160x160px container scaled for PDF)
    const logoContainerSize = 40
    const logoX = pageWidth - 15 - logoContainerSize
    const logoY = yPosition - 5

    // Load and add company logo
    const companyLogoUrl = "/ohplus-new-logo.png"
    const logoBase64 = await loadImageAsBase64(companyLogoUrl)
    if (logoBase64) {
      // White background container with shadow
      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(logoX - 2, logoY, logoContainerSize + 4, logoContainerSize + 4, 3, 3, "F")
      pdf.setDrawColor(229, 231, 235)
      pdf.setLineWidth(0.2)
      pdf.roundedRect(logoX - 2, logoY, logoContainerSize + 4, logoContainerSize + 4, 3, 3)

      // Calculate logo dimensions
      const { width: actualLogoWidth, height: actualLogoHeight } = await getImageDimensions(logoBase64)
      let finalLogoWidth = logoContainerSize
      let finalLogoHeight = logoContainerSize

      const logoAspectRatio = actualLogoWidth / actualLogoHeight
      if (logoAspectRatio > 1) {
        finalLogoHeight = logoContainerSize / logoAspectRatio
      } else {
        finalLogoWidth = logoContainerSize * logoAspectRatio
      }

      const logoOffsetX = (logoContainerSize - finalLogoWidth) / 2
      const logoOffsetY = (logoContainerSize - finalLogoHeight) / 2
      pdf.addImage(logoBase64, "PNG", logoX + logoOffsetX, logoY + logoOffsetY + 2, finalLogoWidth, finalLogoHeight)
    }

    yPosition += badgeHeight + 8

    // "as of" date text
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(107, 114, 128) // gray-600
    pdf.text(`as of ${formatDate(report.date)}`, 15, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 15

    // PROJECT INFORMATION CARD
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(17, 24, 39) // gray-900
    pdf.text("Project Information", 15, yPosition)
    yPosition += 8

    // Card border
    const cardHeight = 65
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(229, 231, 235) // gray-200
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(15, yPosition, pageWidth - 30, cardHeight, 3, 3, "FD")
    yPosition += 8

    // Two-column layout
    const leftColumn = 20
    const rightColumn = pageWidth / 2 + 10
    let leftY = yPosition
    let rightY = yPosition

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Left column data
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

    // Right column data
    const rightColumnData = [
      { label: "Content:", value: product?.content_type || "Static" },
      { label: "Material Specs:", value: getMaterialSpecs(product) },
      { label: "Crew:", value: `Team ${report.assignedTo || "4"}` },
      { label: "Illumination:", value: getIllumination(product) },
      { label: "Gondola:", value: getGondola(product) },
      { label: "Technology:", value: getTechnology(product) },
      { label: "Sales:", value: report.sales },
    ]

    // Render left column
    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(75, 85, 99) // gray-700
      pdf.text(item.label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(17, 24, 39) // gray-900
      pdf.text(item.value, leftColumn + 32, leftY)
      leftY += 6
    })

    // Render right column
    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(75, 85, 99) // gray-700
      pdf.text(item.label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(17, 24, 39) // gray-900
      pdf.text(item.value, rightColumn + 32, rightY)
      rightY += 6
    })

    yPosition += cardHeight + 15

    // PROJECT STATUS SECTION
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(17, 24, 39) // gray-900
    pdf.text("Project Status", 15, yPosition)

    // Green status badge
    pdf.setFillColor(34, 197, 94) // green-500
    const statusBadgeWidth = 20
    const statusBadgeHeight = 8
    pdf.roundedRect(105, yPosition - 5, statusBadgeWidth, statusBadgeHeight, 2, 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.text(`${report.completionPercentage || 100}%`, 110, yPosition - 1)
    pdf.setTextColor(0, 0, 0)
    yPosition += 15

    // ATTACHMENTS SECTION (2 side by side)
    if (report.attachments && report.attachments.length > 0) {
      const attachmentsToShow = report.attachments.slice(0, 2)
      const imageWidth = (pageWidth - 40) / 2 // Space for 2 images side by side
      const imageHeight = 50

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const attachment = attachmentsToShow[i]
        const currentX = i === 0 ? 15 : 15 + imageWidth + 10

        // Image container with gray background
        pdf.setFillColor(229, 231, 235) // gray-200
        pdf.roundedRect(currentX, yPosition, imageWidth, imageHeight, 3, 3, "F")

        // Try to add actual image
        if (attachment.fileUrl && attachment.fileName) {
          const extension = attachment.fileName.toLowerCase().split(".").pop()
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
            try {
              const { base64, width, height } = await calculateImageFitDimensions(
                attachment.fileUrl,
                imageWidth - 4,
                imageHeight - 4,
              )
              if (base64) {
                const centeredX = currentX + (imageWidth - width) / 2
                const centeredY = yPosition + (imageHeight - height) / 2
                pdf.addImage(base64, "JPEG", centeredX, centeredY, width, height)
              }
            } catch (error) {
              console.error("Error adding attachment image:", error)
              pdf.setFontSize(8)
              pdf.setTextColor(107, 114, 128)
              pdf.text("Image not available", currentX + imageWidth / 2, yPosition + imageHeight / 2, {
                align: "center",
              })
              pdf.setTextColor(0, 0, 0)
            }
          }
        }
      }

      yPosition += imageHeight + 8

      // Attachment details below images
      pdf.setFontSize(8)
      pdf.setTextColor(107, 114, 128) // gray-600

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const currentX = i === 0 ? 15 : 15 + imageWidth + 10
        let infoY = yPosition

        // Date, Time, Location, File info
        pdf.setFont("helvetica", "bold")
        pdf.text("Date:", currentX, infoY)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(report.date), currentX + 15, infoY)
        infoY += 4

        pdf.setFont("helvetica", "bold")
        pdf.text("Time:", currentX, infoY)
        pdf.setFont("helvetica", "normal")
        pdf.text(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), currentX + 15, infoY)
        infoY += 4

        pdf.setFont("helvetica", "bold")
        pdf.text("Location:", currentX, infoY)
        pdf.setFont("helvetica", "normal")
        pdf.text(getSiteLocation(product), currentX + 25, infoY)
        infoY += 4

        if (attachmentsToShow[i].fileName) {
          pdf.setFont("helvetica", "bold")
          pdf.text("File:", currentX, infoY)
          pdf.setFont("helvetica", "normal")
          pdf.text(attachmentsToShow[i].fileName, currentX + 15, infoY)
          infoY += 4
        }

        if (attachmentsToShow[i].note) {
          pdf.setFont("helvetica", "bold")
          pdf.text("Note:", currentX, infoY)
          pdf.setFont("helvetica", "normal")
          pdf.text(attachmentsToShow[i].note, currentX + 15, infoY)
        }
      }

      yPosition += 25
    }

    // FOOTER SECTION
    // Border line
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(229, 231, 235)
    pdf.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 10

    // Prepared by section
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text("Prepared by:", 15, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(107, 114, 128)
    pdf.text(report.createdByName || "Loading...", 15, yPosition)
    yPosition += 4
    pdf.text("LOGISTICS", 15, yPosition)
    yPosition += 4
    pdf.text(formatDate(report.date), 15, yPosition)

    // Disclaimer on the right
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(107, 114, 128)
    const disclaimer = `"All data are based on the latest available records as of ${formatDate(new Date().toISOString().split("T")[0])}."`
    const disclaimerLines = pdf.splitTextToSize(disclaimer, 100)
    pdf.text(disclaimerLines, pageWidth - 115, yPosition - 12, { align: "right" })

    // ANGULAR FOOTER (exactly like the web page)
    const footerY = pageHeight - 16
    const footerHeight = 16

    // Cyan section
    pdf.setFillColor(34, 211, 235) // cyan-400
    pdf.rect(0, footerY, pageWidth, footerHeight, "F")

    // Angular blue section (clipPath: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%))
    const blueStartX = pageWidth * 0.25
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.triangle(blueStartX, footerY, pageWidth, footerY, pageWidth, footerY + footerHeight, "F")
    pdf.triangle(blueStartX, footerY, pageWidth, footerY + footerHeight, 0, footerY + footerHeight, "F")

    // Footer text
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Smart. Seamless. Scalable", pageWidth - 75, footerY + 8)

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH!", pageWidth - 25, footerY + 10)

    // "+" symbol in cyan
    pdf.setTextColor(34, 211, 235) // cyan-400
    pdf.setFontSize(14)
    pdf.text("+", pageWidth - 15, footerY + 10)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `service-report-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
