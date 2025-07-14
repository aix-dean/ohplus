"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import AllSitesTab from "./all-sites"

export default function LogisticsDashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex-1 overflow-auto relative">
      <main className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main Content - All Sites */}
          <AllSitesTab />
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg h-14 px-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Create Service Assignment
        </Button>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          // You could add a success toast notification here
        }}
      />
    </div>
  )
}
