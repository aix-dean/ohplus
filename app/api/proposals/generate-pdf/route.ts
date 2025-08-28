import { type NextRequest, NextResponse } from "next/server"
import jsPDF from "jspdf"
import type { Proposal } from "@/lib/types/proposal"

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

export async function POST(request: NextRequest) {
  try {
    const { proposal }: { proposal: Proposal } = await request.json()

    if (!proposal) {
      return NextResponse.json({ error: "Proposal data is required" }, { status: 400 })
    }

    console.log("[v0] PDF Generation - Proposal ID:", proposal.id)
    console.log("[v0] PDF Generation - Proposal Title:", proposal.title)
    console.log("[v0] PDF Generation - Products Count:", proposal.products?.length || 0)
    console.log("[v0] PDF Generation - Products Data:", JSON.stringify(proposal.products, null, 2))

    // Create PDF
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Safely convert dates
    const createdAt = safeToDate(proposal.createdAt)
    const validUntil = safeToDate(proposal.validUntil)

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.4
    }

    // Header
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH Plus", margin, yPosition)
    yPosition += 15

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    pdf.text("Professional Advertising Solutions", margin, yPosition)
    yPosition += 20

    // Proposal Title
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    yPosition = addText(proposal.title, margin, yPosition, pageWidth - 2 * margin, 20)
    yPosition += 10

    // Proposal Info
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, pageWidth - margin - 80, yPosition)
    yPosition += 20

    // Client Information
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("Client Information", margin, yPosition)
    yPosition += 15

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Company: ${proposal.client.company}`, margin, yPosition)
    yPosition += 8
    pdf.text(`Contact: ${proposal.client.contactPerson}`, margin, yPosition)
    yPosition += 8
    pdf.text(`Email: ${proposal.client.email}`, margin, yPosition)
    yPosition += 8
    pdf.text(`Phone: ${proposal.client.phone}`, margin, yPosition)
    yPosition += 15

    if (proposal.client.address) {
      yPosition = addText(`Address: ${proposal.client.address}`, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 10
    }

    // Products
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("Products & Services", margin, yPosition)
    yPosition += 15

    console.log("[v0] PDF Generation - About to process", proposal.products.length, "products")

    proposal.products.forEach((product, index) => {
      console.log(`[v0] PDF Generation - Processing product ${index + 1}:`, product.name)

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = margin
      }

      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      yPosition = addText(`${index + 1}. ${product.name}`, margin, yPosition, pageWidth - 2 * margin, 14)
      yPosition += 5

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Type: ${product.type}`, margin + 10, yPosition)
      pdf.text(`Price: ₱${product.price.toLocaleString()}`, pageWidth - margin - 80, yPosition)
      yPosition += 8

      yPosition = addText(`Location: ${product.location}`, margin + 10, yPosition, pageWidth - 2 * margin - 10)
      yPosition += 5

      if (product.description) {
        yPosition = addText(`Description: ${product.description}`, margin + 10, yPosition, pageWidth - 2 * margin - 10)
        yPosition += 5
      }

      if (product.specs_rental) {
        if (product.specs_rental.traffic_count) {
          pdf.text(`Traffic Count: ${product.specs_rental.traffic_count.toLocaleString()}/day`, margin + 10, yPosition)
          yPosition += 6
        }
        if (product.specs_rental.height && product.specs_rental.width) {
          pdf.text(
            `Dimensions: ${product.specs_rental.height}m × ${product.specs_rental.width}m`,
            margin + 10,
            yPosition,
          )
          yPosition += 6
        }
        if (product.specs_rental.audience_type) {
          pdf.text(`Audience: ${product.specs_rental.audience_type}`, margin + 10, yPosition)
          yPosition += 6
        }
      }

      yPosition += 10
    })

    // Summary
    if (yPosition > pageHeight - 80) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("Summary", margin, yPosition)
    yPosition += 15

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total Products: ${proposal.products.length}`, margin, yPosition)
    yPosition += 8

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text(`Total Investment: ₱${proposal.totalAmount.toLocaleString()}`, margin, yPosition)
    yPosition += 15

    // Notes
    if (proposal.notes || proposal.customMessage) {
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("Additional Information", margin, yPosition)
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")

      if (proposal.notes) {
        yPosition = addText(`Notes: ${proposal.notes}`, margin, yPosition, pageWidth - 2 * margin)
        yPosition += 10
      }

      if (proposal.customMessage) {
        yPosition = addText(`Message: ${proposal.customMessage}`, margin, yPosition, pageWidth - 2 * margin)
        yPosition += 10
      }
    }

    console.log("[v0] PDF Generation - Final product count in summary:", proposal.products.length)
    console.log("[v0] PDF Generation - Total amount:", proposal.totalAmount)

    // Footer
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("© 2024 OH Plus. All rights reserved.", margin, pageHeight - 20)
    pdf.text("Contact: sales@ohplus.com | +63 123 456 7890", margin, pageHeight - 10)

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposal-${proposal.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
