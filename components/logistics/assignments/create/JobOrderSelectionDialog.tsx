"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, User, FileText, Check } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import type { JobOrder } from "@/lib/types/job-order"

interface JobOrderSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  companyId: string
  onSelectJobOrder: (jobOrder: JobOrder) => void
}

export function JobOrderSelectionDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  onSelectJobOrder,
}: JobOrderSelectionDialogProps) {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<string | null>(null)

  const fetchJobOrders = async () => {
    if (!productId || !companyId) return

    setLoading(true)
    setError(null)

    try {
      const jobOrdersRef = collection(db, "job_orders")
      const q = query(
        jobOrdersRef,
        where("product_id", "==", productId),
        where("company_id", "==", companyId)
      )

      const querySnapshot = await getDocs(q)
      const orders: JobOrder[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          id: doc.id,
          joNumber: data.joNumber || "N/A",
          joType: data.joType || "N/A",
          status: data.status || "unknown",
          siteName: data.siteName || "N/A",
          clientName: data.clientName || "N/A",
          clientCompany: data.clientCompany || "N/A",
          dateRequested: data.dateRequested || "",
          deadline: data.deadline || "",
          remarks: data.remarks || "",
          assignTo: data.assignTo || "",
          requestedBy: data.requestedBy || "",
          attachments: data.attachments || [],
          created: data.created,
          updated: data.updated,
          created_by: data.created_by || "",
          company_id: data.company_id || "",
          quotation_id: data.quotation_id,
          contractDuration: data.contractDuration,
          contractPeriodEnd: data.contractPeriodEnd,
          contractPeriodStart: data.contractPeriodStart,
          leaseRatePerMonth: data.leaseRatePerMonth,
          missingCompliance: data.missingCompliance,
          quotationNumber: data.quotationNumber,
          product_id: data.product_id,
          projectCompliance: data.projectCompliance,
          dtiBirUrl: data.dtiBirUrl,
          gisUrl: data.gisUrl,
          idSignatureUrl: data.idSignatureUrl,
          siteImageUrl: data.siteImageUrl,
        })
      })

      // Sort by creation date (newest first)
      orders.sort((a, b) => {
        if (a.created && b.created) {
          const dateA = a.created instanceof Date ? a.created : a.created.toDate()
          const dateB = b.created instanceof Date ? b.created : b.created.toDate()
          return dateB.getTime() - dateA.getTime()
        }
        return 0
      })

      setJobOrders(orders)
    } catch (err) {
      console.error("Error fetching job orders:", err)
      setError("Failed to load job orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && productId && companyId) {
      fetchJobOrders()
      setSelectedJobOrderId(null) // Reset selection when dialog opens
    }
  }, [open, productId, companyId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateValue: string | Date) => {
    if (!dateValue) return "N/A"
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
      return format(date, "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  const handleSelectJobOrder = () => {
    if (selectedJobOrderId) {
      const selectedJobOrder = jobOrders.find(jo => jo.id === selectedJobOrderId)
      if (selectedJobOrder) {
        onSelectJobOrder(selectedJobOrder)
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Job Order
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Choose a job order to associate with this service assignment
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading job orders...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchJobOrders} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && jobOrders.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No job orders found for this site.</p>
            </div>
          )}

          {!loading && !error && jobOrders.length > 0 && (
            <div className="space-y-4">
              {jobOrders.map((jo) => (
                <div
                  key={jo.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedJobOrderId === jo.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:shadow-md hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedJobOrderId(jo.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedJobOrderId === jo.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}>
                        {selectedJobOrderId === jo.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{jo.joNumber}</h3>
                        <p className="text-sm text-gray-600">{jo.joType}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(jo.status)}>
                      {jo.status.charAt(0).toUpperCase() + jo.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Client:</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {jo.clientName}
                        {jo.clientCompany && jo.clientCompany !== jo.clientName && (
                          <span className="text-gray-600"> ({jo.clientCompany})</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Deadline:</span>
                      </div>
                      <p className="text-sm text-gray-900">{formatDate(jo.deadline)}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">Date Requested:</span>
                    <p className="text-sm text-gray-900">{formatDate(jo.dateRequested)}</p>
                  </div>

                  {jo.remarks && jo.remarks !== "n/a" && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">Remarks:</span>
                      <p className="text-sm text-gray-900 mt-1">{jo.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSelectJobOrder}
            disabled={!selectedJobOrderId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Select Job Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}