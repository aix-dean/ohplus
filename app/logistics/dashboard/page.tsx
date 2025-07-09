"use client"

import { Suspense } from "react"
import AllSitesTab from "./all-sites"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function LogisticsDashboard() {
  return (
    <div className="container mx-auto p-6 relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Logistics Dashboard</h1>
        <p className="text-gray-600">Monitor and manage all your billboard sites</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AllSitesTab />
      </Suspense>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            // Handle create service assignment
            window.location.href = "/logistics/assignments/create"
          }}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Service Assignment
        </Button>
      </div>
    </div>
  )
}
