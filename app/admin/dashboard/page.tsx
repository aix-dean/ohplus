"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const [showRegistrationSuccessDialog, setShowRegistrationSuccessDialog] = useState(false)
  const [firstName, setFirstName] = useState("") // State to hold the first name

  useEffect(() => {
    if (registered === "true") {
      // In a real app, you'd fetch the user's first name from your auth context or database
      // For this example, we'll use a placeholder or retrieve it from localStorage if stored during registration
      const storedFirstName = localStorage.getItem("registeredFirstName") // Assuming you store it
      if (storedFirstName) {
        setFirstName(storedFirstName)
      } else {
        setFirstName("User") // Default if not found
      }
      setShowRegistrationSuccessDialog(true)
    }
  }, [registered])

  const handleCloseRegistrationSuccessDialog = () => {
    setShowRegistrationSuccessDialog(false)
    // Optionally remove the query parameter from the URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete("registered")
    window.history.replaceState({}, "", newUrl.toString())
  }

  // The `onStartTour` prop for RegistrationSuccessDialog is now handled by register/page.tsx
  // This page no longer directly triggers the tour, it just shows the dialog.

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">125</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">34</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">$12,345</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/inventory/create" passHref>
            <Button className="h-auto w-full py-4" data-tour-id="add-site-card">
              <PlusIcon className="mr-2 h-5 w-5" />
              Add New Site
            </Button>
          </Link>
          <Button className="h-auto w-full py-4">
            <PlusIcon className="mr-2 h-5 w-5" />
            Create New Campaign
          </Button>
          <Button className="h-auto w-full py-4">
            <PlusIcon className="mr-2 h-5 w-5" />
            Generate Report
          </Button>
        </div>
      </div>

      <RegistrationSuccessDialog
        isOpen={showRegistrationSuccessDialog}
        firstName={firstName}
        onClose={handleCloseRegistrationSuccessDialog}
        onStartTour={() => {
          // This function is now handled by register/page.tsx
          // This empty function prevents errors if the prop is still expected
          handleCloseRegistrationSuccessDialog()
        }}
      />
    </div>
  )
}
