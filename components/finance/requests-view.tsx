"use client"

import type React from "react"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { sendReplenishReport, printReplenishReport } from "@/lib/replenish-report"
import { useToast } from "@/hooks/use-toast"

interface RequestsViewProps {
  requests: any[]
}

const RequestsView: React.FC<RequestsViewProps> = ({ requests }) => {
  const { toast } = useToast()

  async function handlePrintReport(req: any) {
    try {
      await printReplenishReport(req)
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Unable to print",
        description: e?.message || "Failed to generate report.",
        variant: "destructive",
      })
    }
  }

  async function handleSendReport(req: any) {
    try {
      const to = prompt("To (comma separated emails):", "") || ""
      const list = to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
      if (!list.length) return

      const subject = `Replenishment Request Report - #${String(req["Request No."] ?? req.id)}`
      const body = `Hello,\n\nPlease find attached the replenishment request report for Request #${String(req["Request No."] ?? req.id)}.\n\nThank you.`

      await sendReplenishReport(req, { to: list, subject, body })
      toast({ title: "Report sent", description: "The PDF report has been emailed successfully." })
    } catch (e: any) {
      console.error(e)
      toast({ title: "Failed to send", description: e?.message || "An error occurred.", variant: "destructive" })
    }
  }

  return (
    <div>
      {requests.map((request) => (
        <div key={request.id}>
          {/* Request details here */}
          {request.request_type === "replenish" && (
            <DropdownMenu>
              <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenuItem onClick={() => handleSendReport(request)}>Send Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintReport(request)}>Print Report</DropdownMenuItem>
                {/* Other menu items here */}
              </DropdownMenu.Content>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  )
}

export default RequestsView
