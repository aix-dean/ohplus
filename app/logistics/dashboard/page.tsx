"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import AllSitesTab from "./all-sites"

export default function LogisticsDashboard() {
  const [serviceAssignmentDialogOpen, setServiceAssignmentDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
          <p className="text-gray-600">Manage and monitor your sites</p>
        </div>
      </div>

      {/* Sites Content */}
      <AllSitesTab />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
          onClick={() => setServiceAssignmentDialogOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Service Assignment
        </Button>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog open={serviceAssignmentDialogOpen} onOpenChange={setServiceAssignmentDialogOpen} />
    </div>
  )
}
