"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useTour } from "@/contexts/tour-context"
import { useIsAdmin } from "@/hooks/use-permissions"

export default function AdminDashboardPage() {
  const { userData, loading: authLoading } = useAuth()
  const { startTour } = useTour()
  const { isAdmin, loading: isAdminLoading } = useIsAdmin()

  useEffect(() => {
    if (!authLoading && !isAdminLoading && userData && isAdmin && !userData.has_completed_onboarding_tour) {
      startTour("onboarding")
    }
  }, [userData, authLoading, isAdmin, isAdminLoading, startTour])

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </header>
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">1,234</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">567</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">890</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Welcome to ERP v2!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              You're in! Let's get your company online. Set up your first billboard site — it's quick.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
