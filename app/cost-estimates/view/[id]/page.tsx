"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface CostEstimateItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface CostEstimate {
  id: string
  clientName: string
  clientEmail: string
  projectName: string
  status: "Pending" | "Approved" | "Rejected"
  dateCreated: string
  validUntil: string
  items: CostEstimateItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes?: string
}

const mockCostEstimate: CostEstimate = {
  id: "CE001",
  clientName: "Acme Corp",
  clientEmail: "client@acmecorp.com",
  projectName: "Q3 Marketing Campaign",
  status: "Pending",
  dateCreated: "2024-07-01T10:00:00Z",
  validUntil: "2024-07-31T23:59:59Z",
  items: [
    { id: "1", description: "LED Billboard Ad Slot (1 month)", quantity: 1, unitPrice: 50000, total: 50000 },
    { id: "2", description: "Digital Kiosk Ad (2 weeks)", quantity: 2, unitPrice: 10000, total: 20000 },
    { id: "3", description: "Creative Design Services", quantity: 1, unitPrice: 7500, total: 7500 },
    { id: "4", description: "Installation & Maintenance Fee", quantity: 1, unitPrice: 2500, total: 2500 },
  ],
  subtotal: 80000,
  taxRate: 0.12,
  taxAmount: 9600,
  totalAmount: 89600,
  notes: "This estimate is valid for 30 days. Prices are subject to change based on final requirements.",
}

export default function PublicCostEstimateViewPage() {
  const params = useParams()
  const { id } = params
  const { toast } = useToast()
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)

  useEffect(() => {
    // In a real application, you would fetch data based on `id`
    // For now, we use mock data
    if (id === "CE001") {
      setCostEstimate(mockCostEstimate)
    } else {
      setCostEstimate(null) // Or handle not found
    }
  }, [id])

  const handleAccept = async () => {
    if (!costEstimate) return
    try {
      // Simulate API call to update status
      const response = await fetch("/api/cost-estimates/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: costEstimate.id, status: "Approved" }),
      })
      if (response.ok) {
        setCostEstimate((prev) => (prev ? { ...prev, status: "Approved" } : null))
        toast({
          title: "Cost Estimate Accepted!",
          description: "Thank you for accepting the cost estimate. We will be in touch shortly.",
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error accepting cost estimate:", error)
      toast({
        title: "Error",
        description: "There was an error accepting the cost estimate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!costEstimate) return
    try {
      // Simulate API call to update status
      const response = await fetch("/api/cost-estimates/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: costEstimate.id, status: "Rejected" }),
      })
      if (response.ok) {
        setCostEstimate((prev) => (prev ? { ...prev, status: "Rejected" } : null))
        toast({
          title: "Cost Estimate Rejected",
          description: "You have rejected the cost estimate. Please contact us if you have any questions.",
          variant: "destructive",
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error rejecting cost estimate:", error)
      toast({
        title: "Error",
        description: "There was an error rejecting the cost estimate. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!costEstimate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Cost Estimate Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The cost estimate you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const itemColumns = [
    { header: "Description", accessorKey: "description" },
    { header: "Quantity", accessorKey: "quantity" },
    { header: "Unit Price", accessorKey: "unitPrice", cell: (info: any) => `$${info.getValue().toFixed(2)}` },
    { header: "Total", accessorKey: "total", cell: (info: any) => `$${info.getValue().toFixed(2)}` },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Cost Estimate</CardTitle>
              <p className="text-sm text-muted-foreground">For Project: {costEstimate.projectName}</p>
            </div>
            <Badge
              variant={
                costEstimate.status === "Approved"
                  ? "default"
                  : costEstimate.status === "Pending"
                    ? "secondary"
                    : "destructive"
              }
            >
              {costEstimate.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            <p>
              Client: {costEstimate.clientName} ({costEstimate.clientEmail})
            </p>
            <p>Date: {format(new Date(costEstimate.dateCreated), "PPP")}</p>
            <p>Valid Until: {format(new Date(costEstimate.validUntil), "PPP")}</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2">Items</h3>
            <ResponsiveTable data={costEstimate.items} columns={itemColumns} />
          </div>
          <div className="grid gap-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${costEstimate.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({costEstimate.taxRate * 100}%):</span>
              <span className="font-medium">${costEstimate.taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>${costEstimate.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          {costEstimate.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground text-sm">{costEstimate.notes}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            {costEstimate.status === "Pending" && (
              <>
                <Button variant="destructive" onClick={handleReject}>
                  Reject
                </Button>
                <Button onClick={handleAccept}>Accept</Button>
              </>
            )}
            {costEstimate.status === "Approved" && (
              <p className="text-green-600 font-semibold">This cost estimate has been accepted.</p>
            )}
            {costEstimate.status === "Rejected" && (
              <p className="text-red-600 font-semibold">This cost estimate has been rejected.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
