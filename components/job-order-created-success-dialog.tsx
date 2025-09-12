"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartyPopper, FileText, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { createNotifications } from "@/lib/client-service"

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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Print
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
