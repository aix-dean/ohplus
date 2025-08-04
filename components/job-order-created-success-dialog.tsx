"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, FileText, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Job Order{isMultiple ? "s" : ""} Created Successfully!
          </DialogTitle>
        </DialogHeader>
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
            {isMultiple
              ? `${joIds.length} Job Orders have been created and are now pending approval.`
              : "Your Job Order has been created and is now pending approval."}
          </p>
          <div className="space-y-2">
            {joIds.map((joId, index) => (
              <div key={joId} className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>
                  Job Order {index + 1}: {joId}
                </span>
              </div>
            ))}
          </div>
          <Button onClick={onClose} className="w-full">
            View Job Order{isMultiple ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
