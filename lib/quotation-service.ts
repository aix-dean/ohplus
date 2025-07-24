import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addQuotationToCampaign } from "@/lib/campaign-service"
import { jsPDF } from "jspdf"
import { loadImageAsBase64, generateQRCode, getImageDimensions } from "@/lib/pdf-service"
import type { QuotationProduct, Quotation } from "@/lib/types/quotation" // Import the updated Quotation type
import { getProductById as getProductFromFirebase } from "@/lib/firebase-service" // Import the product fetching function

// Create a new quotation
export async function createQuotation(quotationData: Omit<Quotation, "id">): Promise<string> {
  try {
    console.log("Creating quotation with data:", quotationData)

    const newQuotation = {
      ...quotationData,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "quotations"), newQuotation)
    console.log("Quotation created with ID:", docRef.id)

    // If there's a campaign ID, add this quotation to the campaign
    if (quotationData.campaignId) {
      try {
        await addQuotationToCampaign(quotationData.campaignId, docRef.id, quotationData.created_by || "system")
      } catch (error) {
        console.error("Error linking quotation to campaign:", error)
        // Don't throw here, as the quotation was created successfully
      }
    }

    return docRef.id
  } catch (error: any) {
    console.error("Error creating quotation:", error)
    throw new Error("Failed to create quotation: " + error.message)
  }
}

// Get quotation by ID
export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  try {
    const quotationDoc = await getDoc(doc(db, "quotations", quotationId))

    if (quotationDoc.exists()) {
      const data = quotationDoc.data() as Quotation
      const productsFromQuotation = data.products || []

      // Fetch full product details for each product in the quotation
      const enrichedProducts: QuotationProduct[] = await Promise.all(
        productsFromQuotation.map(async (productInQuotation) => {
          if (productInQuotation.id) {
            const fullProductDetails = await getProductFromFirebase(productInQuotation.id)
            if (fullProductDetails) {
              // Merge existing quotation product data with full product details.
              // Prioritize quotation-specific fields (like price, notes if they were overridden)
              // but ensure all detailed fields (media, specs_rental, description, etc.) are present.
              return {
                ...fullProductDetails, // Start with all details from the product collection
                ...productInQuotation, // Overlay with any specific data stored in the quotation's product entry
                // Ensure price from quotation is used if it exists, otherwise fallback to product price
                price: productInQuotation.price !== undefined ? productInQuotation.price : fullProductDetails.price,
              } as QuotationProduct
            }
          }
          return productInQuotation // Return as is if product not found or no ID
        }),
      )

      return {
        id: quotationDoc.id,
        ...data,
        products: enrichedProducts,
      } as Quotation
    }

    return null
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return null
  }
}

// Update an existing quotation
export async function updateQuotation(
  quotationId: string,
  updatedData: Partial<Quotation>,
  userId: string,
  userName: string,
): Promise<void> {
  try {
    const quotationRef = doc(db, "quotations", quotationId)
    await updateDoc(quotationRef, {
      ...updatedData,
      updated: serverTimestamp(),
      updated_by: userName, // Or userId if you prefer to store ID
    })
    console.log(`Quotation ${quotationId} updated successfully.`)
  } catch (error) {
    console.error("Error updating quotation:", error)
    throw new Error("Failed to update quotation: " + error.message)
  }
}

// Generate quotation number
export function generateQuotationNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const time = String(now.getTime()).slice(-4)

  return `QT-${year}${month}${day}-${time}`
}

// Calculate total amount based on dates and price
export function calculateQuotationTotal(
  startDate: string,
  endDate: string,
  products: QuotationProduct[], // Now accepts an array of products
): {
  durationDays: number
  totalAmount: number
} {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  let totalAmount = 0
  products.forEach((product) => {
    const dailyRate = (product.price || 0) / 30 // Assuming price is monthly
    totalAmount += dailyRate * Math.max(1, durationDays)
  })

  return {
    durationDays: Math.max(1, durationDays), // Minimum 1 day
    totalAmount,
  }
}

// Helper to format date
const formatDate = (date: any) => {
  if (!date) return "N/A"
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj)
  } catch (error) {
    return "Invalid Date"
  }
}

// Helper to safely convert to string for PDF
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

// Helper function to safely convert to Date (re-using from pdf-service)
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

// Helper function to add image to PDF (copied and adapted from pdf-service)
const addImageToPDF = async (
  pdf: jsPDF,
  imageUrl: string,
  x: number, // Target X for the bounding box
  y: number, // Target Y for the bounding box
  targetWidth: number, // Target width for the bounding box
  targetHeight: number, // Target height for the bounding box
) => {
  try {
    const base64 = await loadImageAsBase64(imageUrl)
    if (!base64) return { actualWidth: 0, actualHeight: 0, xOffset: 0, yOffset: 0 }

    const dimensions = await getImageDimensions(base64)

    const { width: imgWidth, height: imgHeight } = dimensions
    const aspectRatio = imgWidth / imgHeight

    let finalWidth = targetWidth
    let finalHeight = targetHeight

    // Scale to fit within targetWidth and targetHeight while preserving aspect ratio
    if (imgWidth / imgHeight > targetWidth / targetHeight) {
      // Image is wider than target box aspect ratio
      finalHeight = targetWidth / aspectRatio
      finalWidth = targetWidth
    } else {
      // Image is taller than target box aspect ratio
      finalWidth = targetHeight * aspectRatio
      finalHeight = targetHeight
    }

    // Calculate offsets to center the image within the target bounding box
    const xOffset = x + (targetWidth - finalWidth) / 2
    const yOffset = y + (targetHeight - finalHeight) / 2

    pdf.addImage(base64, "JPEG", xOffset, yOffset, finalWidth, finalHeight)
    return { actualWidth: finalWidth, actualHeight: finalHeight, xOffset, yOffset }
  } catch (error) {
    console.error("Error adding image to PDF:", error)
    return { actualWidth: 0, actualHeight: 0, xOffset: 0, yOffset: 0 }
  }
}

// Generate PDF for quotation
export async function generateQuotationPDF(quotation: Quotation): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Safely convert dates
  const createdDate = safeToDate(quotation.created)
  const validUntilDate = safeToDate(quotation.valid_until)

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return y + lines.length * fontSize * 0.3
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin - 20) {
      pdf.addPage()
      yPosition = margin
    }
  }

  // Helper function to add QR code and logo to current page
  const addHeaderElementsToPage = async () => {
    try {
      const qrSize = 20
      const qrX = pageWidth - margin - qrSize
      const qrY = margin

      // Generate QR Code for quotation view URL
      const quotationViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}/accept`
      const qrCodeUrl = await generateQRCode(quotationViewUrl)
      const qrBase64 = await loadImageAsBase64(qrCodeUrl)

      if (qrBase64) {
        pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
        pdf.setFontSize(6)
        pdf.setTextColor(100, 100, 100)
        const textWidth = pdf.getTextWidth("Scan to view online")
        pdf.text("Scan to view online", qrX + (qrSize - textWidth) / 2, qrY + qrSize + 3)
        pdf.setTextColor(0, 0, 0)
      }

      // Add Company Logo with proper aspect ratio handling
      const logoUrl = "/oh-plus-logo.png"
      const logoBase64 = await loadImageAsBase64(logoUrl)
      if (logoBase64) {
        // Get actual logo dimensions
        const { width: actualLogoWidth, height: actualLogoHeight } = await getImageDimensions(logoBase64)

        // Calculate proper dimensions maintaining aspect ratio
        const maxLogoWidth = 35
        const maxLogoHeight = 12
        const logoAspectRatio = actualLogoWidth / actualLogoHeight

        let finalLogoWidth = maxLogoWidth
        let finalLogoHeight = maxLogoWidth / logoAspectRatio

        // If height exceeds max, scale down based on height
        if (finalLogoHeight > maxLogoHeight) {
          finalLogoHeight = maxLogoHeight
          finalLogoWidth = maxLogoHeight * logoAspectRatio
        }

        pdf.addImage(logoBase64, "PNG", margin, margin, finalLogoWidth, finalLogoHeight)
      }
    } catch (error) {
      console.error("Error adding header elements to PDF:", error)
    }
  }

  // Add header elements to the first page
  await addHeaderElementsToPage()
  yPosition = Math.max(yPosition, margin + 35) // Ensure content starts below header elements

  // Header (Quotation Title)
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(37, 99, 235) // Blue color
  pdf.text("QUOTATION", margin, yPosition)
  yPosition += 10

  pdf.setFontSize(14)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Quotation No: ${quotation.quotation_number}`, margin, yPosition)
  yPosition += 15

  pdf.setLineWidth(0.3)
  pdf.setDrawColor(37, 99, 235) // Blue line
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Quotation Information Section
  checkNewPage(30)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("QUOTATION INFORMATION", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Created Date: ${formatDate(createdDate)}`, margin, yPosition)
  pdf.text(`Valid Until: ${formatDate(validUntilDate)}`, margin + contentWidth / 2, yPosition)
  yPosition += 5

  // Add start and end dates for the rental period
  if (quotation.start_date) {
    pdf.text(`Start Date: ${formatDate(quotation.start_date)}`, margin, yPosition)
  }
  if (quotation.end_date) {
    pdf.text(`End Date: ${formatDate(quotation.end_date)}`, margin + contentWidth / 2, yPosition)
  }
  if (quotation.start_date || quotation.end_date) {
    yPosition += 5
  }

  pdf.text(`Total Amount: PHP${safeString(quotation.total_amount)}`, margin, yPosition)
  yPosition += 10

  // Client Information Section
  checkNewPage(30)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLIENT INFORMATION", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Client Name: ${safeString(quotation.client_name)}`, margin, yPosition)
  pdf.text(`Client Email: ${safeString(quotation.client_email)}`, margin + contentWidth / 2, yPosition)
  yPosition += 5
  if (quotation.quotation_request_id) {
    pdf.text(`Related Request ID: ${safeString(quotation.quotation_request_id)}`, margin, yPosition)
    yPosition += 5
  }
  if (quotation.proposalId) {
    pdf.text(`Related Proposal ID: ${safeString(quotation.proposalId)}`, margin, yPosition)
    yPosition += 5
  }
  if (quotation.campaignId) {
    pdf.text(`Related Campaign ID: ${safeString(quotation.campaignId)}`, margin, yPosition)
    yPosition += 5
  }
  yPosition += 10

  // Product & Services Section (Manual Table Drawing)
  checkNewPage(50)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("PRODUCT & SERVICES", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  const cellPadding = 3
  const headerRowHeight = 8
  const dataRowHeight = 20 // Increased for images

  // Column widths including image column
  const colWidths = [
    contentWidth * 0.15, // Image
    contentWidth * 0.35, // Product
    contentWidth * 0.15, // Type
    contentWidth * 0.2, // Location
    contentWidth * 0.15, // Price
  ]

  // Table Headers
  pdf.setFillColor(243, 244, 246) // bg-gray-100
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.1)
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "S")

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(75, 85, 99)

  let currentX = margin
  pdf.text("Image", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[0]
  pdf.text("Product", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[1]
  pdf.text("Type", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[2]
  pdf.text("Location", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[3]
  pdf.text("Price", currentX + colWidths[4] - cellPadding, yPosition + headerRowHeight / 2, {
    baseline: "middle",
    align: "right",
  })
  yPosition += headerRowHeight

  // Table Rows for Products
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(0, 0, 0)

  for (const product of quotation.products) {
    checkNewPage(dataRowHeight + 5)
    pdf.setFillColor(255, 255, 255) // bg-white
    pdf.rect(margin, yPosition, contentWidth, dataRowHeight, "F")
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition, contentWidth, dataRowHeight, "S")

    currentX = margin

    // Image column - uniform size for all images
    const imageSize = 15 // Fixed size for all product images
    const imageX = currentX + cellPadding
    const imageY = yPosition + (dataRowHeight - imageSize) / 2

    if (product.media && product.media.length > 0 && product.media[0].url) {
      try {
        const imageBase64 = await loadImageAsBase64(product.media[0].url)
        if (imageBase64) {
          pdf.addImage(imageBase64, "JPEG", imageX, imageY, imageSize, imageSize)
        }
      } catch (error) {
        // Add placeholder if image fails to load
        pdf.setFillColor(240, 240, 240)
        pdf.rect(imageX, imageY, imageSize, imageSize, "F")
        pdf.setFontSize(6)
        pdf.setTextColor(150, 150, 150)
        pdf.text("No Image", imageX + imageSize / 2, imageY + imageSize / 2, { align: "center", baseline: "middle" })
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(9)
      }
    } else {
      // Add placeholder for missing image
      pdf.setFillColor(240, 240, 240)
      pdf.rect(imageX, imageY, imageSize, imageSize, "F")
      pdf.setFontSize(6)
      pdf.setTextColor(150, 150, 150)
      pdf.text("No Image", imageX + imageSize / 2, imageY + imageSize / 2, { align: "center", baseline: "middle" })
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(9)
    }
    currentX += colWidths[0]

    // Product column
    let productText = safeString(product.name)
    if (product.site_code) {
      productText += `\nSite: ${product.site_code}`
    }
    addText(productText, currentX + cellPadding, yPosition + cellPadding, colWidths[1] - 2 * cellPadding, 8)
    currentX += colWidths[1]

    // Type column
    pdf.text(safeString(product.type), currentX + cellPadding, yPosition + dataRowHeight / 2, {
      baseline: "middle",
    })
    currentX += colWidths[2]

    // Location column
    addText(
      safeString(product.location),
      currentX + cellPadding,
      yPosition + cellPadding,
      colWidths[3] - 2 * cellPadding,
      8,
    )
    currentX += colWidths[3]

    // Price column
    pdf.text(
      `PHP${safeString(product.price)}/month`,
      currentX + colWidths[4] - cellPadding,
      yPosition + dataRowHeight / 2,
      {
        baseline: "middle",
        align: "right",
      },
    )
    yPosition += dataRowHeight
  }

  // Total Amount Row
  checkNewPage(headerRowHeight)
  pdf.setFillColor(243, 244, 246) // bg-gray-50
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "S")

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(37, 99, 235) // Blue color

  // Position "Total Amount:" to span most columns
  const totalLabelX = margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 5
  pdf.text("Total Amount:", totalLabelX, yPosition + headerRowHeight / 2, {
    baseline: "middle",
    align: "right",
  })

  // Position the actual total amount in the price column
  pdf.text(
    `PHP${safeString(quotation.total_amount)}`,
    pageWidth - margin - cellPadding,
    yPosition + headerRowHeight / 2,
    {
      baseline: "middle",
      align: "right",
    },
  )
  yPosition += headerRowHeight + 15

  // Product Details Section
  for (const product of quotation.products) {
    checkNewPage(60)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text(`${safeString(product.name)} Details`, margin, yPosition)
    yPosition += 5
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Two column layout for specifications
    const leftCol = margin
    const rightCol = margin + contentWidth / 2

    let leftY = yPosition
    let rightY = yPosition

    // Left column specifications
    if (product.specs_rental?.width && product.specs_rental?.height) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Dimensions:", leftCol, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${safeString(product.specs_rental.width)}m x ${safeString(product.specs_rental.height)}m`,
        leftCol + 25,
        leftY,
      )
      leftY += 5
    }

    if (product.specs_rental?.elevation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Elevation:", leftCol, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.text(`${safeString(product.specs_rental.elevation)}m`, leftCol + 25, leftY)
      leftY += 5
    }

    // Right column specifications
    if (product.specs_rental?.traffic_count) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Traffic Count:", rightCol, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.text(safeString(product.specs_rental.traffic_count), rightCol + 30, rightY)
      rightY += 5
    }

    if (product.specs_rental?.audience_type) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Audience Type:", rightCol, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.text(safeString(product.specs_rental.audience_type), rightCol + 30, rightY)
      rightY += 5
    } else if (product.specs_rental?.audience_types && product.specs_rental.audience_types.length > 0) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Audience Types:", rightCol, rightY)
      pdf.setFont("helvetica", "normal")
      rightY = addText(product.specs_rental.audience_types.join(", "), rightCol + 30, rightY, contentWidth / 2 - 30, 9)
      rightY += 2
    }

    yPosition = Math.max(leftY, rightY) + 5

    // Description
    if (product.description) {
      checkNewPage(20)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "bold")
      pdf.text("Description:", margin, yPosition)
      yPosition += 5
      pdf.setFont("helvetica", "normal")
      yPosition = addText(safeString(product.description), margin, yPosition, contentWidth, 9)
      yPosition += 5
    }

    // Media Images - uniform grid
    if (product.media && product.media.length > 0) {
      const imagesToShow = product.media.filter((media) => !media.isVideo) // Only show images in PDF
      if (imagesToShow.length > 0) {
        checkNewPage(50)
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.text("Product Images:", margin, yPosition)
        yPosition += 8

        const imagesPerRow = 4
        const imageSpacing = 3
        const uniformImageSize = (contentWidth - (imagesPerRow - 1) * imageSpacing) / imagesPerRow

        let currentImageX = margin
        let imagesInRow = 0

        for (const mediaItem of imagesToShow) {
          if (imagesInRow === imagesPerRow) {
            // Start new row
            yPosition += uniformImageSize + imageSpacing
            currentImageX = margin
            imagesInRow = 0
            checkNewPage(uniformImageSize + imageSpacing)
          }

          try {
            const imageBase64 = await loadImageAsBase64(mediaItem.url || "")
            if (imageBase64) {
              pdf.addImage(imageBase64, "JPEG", currentImageX, yPosition, uniformImageSize, uniformImageSize)
            }
          } catch (error) {
            // Add placeholder for failed images
            pdf.setFillColor(240, 240, 240)
            pdf.rect(currentImageX, yPosition, uniformImageSize, uniformImageSize, "F")
            pdf.setFontSize(6)
            pdf.setTextColor(150, 150, 150)
            pdf.text("Image Error", currentImageX + uniformImageSize / 2, yPosition + uniformImageSize / 2, {
              align: "center",
              baseline: "middle",
            })
            pdf.setTextColor(0, 0, 0)
            pdf.setFontSize(9)
          }

          currentImageX += uniformImageSize + imageSpacing
          imagesInRow++
        }
        yPosition += uniformImageSize + 10
      }
    }
    yPosition += 10 // Space after each product
  }

  // Additional Information (Notes)
  if (quotation.notes) {
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
    yPosition += 5
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(quotation.notes, margin, yPosition, contentWidth, 9)
    yPosition += 10
  }

  // Footer
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(107, 114, 128) // Gray color
  pdf.text(`This quotation is valid until ${formatDate(validUntilDate)}`, pageWidth / 2, pageHeight - 20, {
    align: "center",
  })
  pdf.text(
    `© ${new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  )

  // Download the PDF
  pdf.save(`Quotation-${quotation.quotation_number}.pdf`)
}

// Send quotation email to client
export async function sendQuotationEmail(quotation: Quotation, requestorEmail: string): Promise<boolean> {
  try {
    console.log("Sending quotation email:", {
      quotationId: quotation.id,
      quotationNumber: quotation.quotation_number,
      requestorEmail,
    })

    const response = await fetch("/api/quotations/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotation,
        requestorEmail,
      }),
    })

    console.log("API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("API error response:", errorData)
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("Email sent successfully:", result)
    return true
  } catch (error) {
    console.error("Error sending quotation email:", error)
    throw error // Re-throw to show specific error message
  }
}

// Update quotation status
export async function updateQuotationStatus(quotationId: string, status: string): Promise<void> {
  try {
    const response = await fetch("/api/quotations/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotationId,
        status,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update quotation status")
    }
  } catch (error) {
    console.error("Error updating quotation status:", error)
    throw error
  }
}

// Get quotations by campaign ID
export async function getQuotationsByCampaignId(campaignId: string): Promise<Quotation[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const quotationsRef = collection(db, "quotations")
    const q = query(quotationsRef, where("campaignId", "==", campaignId))

    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      quotations.push({ id: doc.id, ...data, products: data.products || [] } as Quotation)
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by campaign ID:", error)
    return []
  }
}

// Get quotations by created_by ID
export async function getQuotationsByCreatedBy(userId: string): Promise<Quotation[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const quotationsRef = collection(db, "quotations")
    const q = query(quotationsRef, where("created_by", "==", userId), orderBy("created", "desc"))

    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      quotations.push({ id: doc.id, ...data, products: data.products || [] } as Quotation)
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by created_by ID:", error)
    return []
  }
}

// Get paginated quotations by seller ID
export async function getQuotationsPaginated(
  userId: string,
  pageSize: number,
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null,
) {
  const quotationsRef = collection(db, "quotations")
  let q

  if (startAfterDoc) {
    q = query(
      quotationsRef,
      where("seller_id", "==", userId),
      orderBy("created", "desc"),
      startAfter(startAfterDoc),
      limit(pageSize),
    )
  } else {
    q = query(quotationsRef, where("seller_id", "==", userId), orderBy("created", "desc"), limit(pageSize))
  }

  const querySnapshot = await getDocs(q)
  const quotations: any[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    quotations.push({ id: doc.id, ...data, products: data.products || [] })
  })

  const lastVisibleId = querySnapshot.docs[querySnapshot.docs.length - 1] || null
  const hasMore = querySnapshot.docs.length === pageSize

  return { quotations, lastVisibleId, hasMore }
}
