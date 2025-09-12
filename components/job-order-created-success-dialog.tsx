"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartyPopper, FileText, Package, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { createNotifications } from "@/lib/client-service"
import { getJobOrderById } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"
import { useState, useEffect } from "react"
import jsPDF from "jspdf"

interface JobOrderCreatedSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  joIds: string[]
  isMultiple?: boolean
}

export function JobOrderCreatedSuccessDialog({
  isOpen,
  onClose,
  joIds,
  isMultiple = false,
}: JobOrderCreatedSuccessDialogProps) {
  const { userData } = useAuth()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [isLoadingPrint, setIsLoadingPrint] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Fetch job order data when dialog opens
  useEffect(() => {
    if (isOpen && joIds.length > 0) {
      const fetchJobOrders = async () => {
        setIsLoadingData(true)
        try {
          const fetchedJobOrders: JobOrder[] = []
          for (const joId of joIds) {
            const jobOrder = await getJobOrderById(joId)
            if (jobOrder) {
              fetchedJobOrders.push(jobOrder)
            }
          }
          setJobOrders(fetchedJobOrders)
        } catch (error) {
          console.error("Error fetching job orders:", error)
        } finally {
          setIsLoadingData(false)
        }
      }
      fetchJobOrders()
    }
  }, [isOpen, joIds])

  const generateAndPrintPDF = async () => {
    if (jobOrders.length === 0) return

    setIsLoadingPrint(true)
    try {
      const pdf = new jsPDF()
      let yPosition = 20

      // Title
      pdf.setFontSize(18)
      pdf.text("Job Order Details", 20, yPosition)
      yPosition += 20

      jobOrders.forEach((jobOrder, index) => {
        if (index > 0) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.text(`Job Order #${index + 1}`, 20, yPosition)
        yPosition += 15

        pdf.setFontSize(12)
        pdf.text(`JO Number: ${jobOrder.joNumber}`, 20, yPosition)
        yPosition += 10

        pdf.text(`Site Name: ${jobOrder.siteName}`, 20, yPosition)
        yPosition += 10

        pdf.text(`JO Type: ${jobOrder.joType}`, 20, yPosition)
        yPosition += 10

        pdf.text(`Requested By: ${jobOrder.requestedBy}`, 20, yPosition)
        yPosition += 10

        pdf.text(`Date Requested: ${new Date(jobOrder.dateRequested).toLocaleDateString()}`, 20, yPosition)
        yPosition += 10

        if (jobOrder.deadline) {
          pdf.text(`Deadline: ${new Date(jobOrder.deadline).toLocaleDateString()}`, 20, yPosition)
          yPosition += 10
        }

        if (jobOrder.clientName) {
          pdf.text(`Client Name: ${jobOrder.clientName}`, 20, yPosition)
          yPosition += 10
        }

        if (jobOrder.clientCompany) {
          pdf.text(`Client Company: ${jobOrder.clientCompany}`, 20, yPosition)
          yPosition += 10
        }

        if (jobOrder.quotationNumber) {
          pdf.text(`Quotation Number: ${jobOrder.quotationNumber}`, 20, yPosition)
          yPosition += 10
        }

        if (jobOrder.remarks) {
          pdf.text(`Remarks: ${jobOrder.remarks}`, 20, yPosition)
          yPosition += 10
        }

        if (jobOrder.attachments && jobOrder.attachments.length > 0) {
          pdf.text(`Attachments: ${jobOrder.attachments.length} file(s)`, 20, yPosition)
          yPosition += 10
        }
      })

      // Generate blob and create download link
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Create a temporary link to trigger print
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        // Fallback: download the PDF
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `Job_Order_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Clean up
      URL.revokeObjectURL(pdfUrl)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsLoadingPrint(false)
    }
  }

  const handleNotifyTeams = async () => {
    if (!userData?.company_id || !userData?.role) return

    // Map role to department
    const roleToDepartment: { [key: string]: string } = {
      sales: "SALES",
      logistics: "LOGISTICS",
      admin: "ADMIN",
      cms: "CMS",
    }
    const departmentFrom = roleToDepartment[userData.role] || "UNKNOWN"

    const departments = ["Logistics", "Sales", "Admin", "Finance", "Treasury", "Accounting"]
    const navigateTo = `/logistics/job-orders/${joIds[0]}`

    const notifications = departments.map((dept) => ({
      company_id: userData.company_id!,
      department_from: departmentFrom,
      department_to: dept.toUpperCase(),
      description: "A new job order has been created and requires your attention.",
      navigate_to: navigateTo,
      title: "New Job Order Created",
      type: "job_order_created",
      uid_to: null,
    }))

    try {
      await createNotifications(notifications)
      onClose() // Close dialog after successful notification
    } catch (error) {
      console.error("Error creating notifications:", error)
      // Still close dialog on error
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
            <PartyPopper className="w-8 h-8 text-yellow-600" />
          </div>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {isMultiple && (
              <Badge variant="secondary">
                <Package className="h-3 w-3 mr-1" />
                {joIds.length} Job Orders
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            You have successfully created a JO!
          </p>
          <div className="space-y-2">
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={generateAndPrintPDF}
              disabled={isLoadingData || isLoadingPrint || jobOrders.length === 0}
              className="flex-1"
            >
              {isLoadingPrint ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Print"
              )}
            </Button>
            <Button onClick={handleNotifyTeams} className="flex-1">
              Notify Teams
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
