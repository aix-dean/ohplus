"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, LogOut } from "lucide-react"

export default function UnauthorizedPage() {
  const { userData, logout, getRoleDashboardPath } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user has roles, redirect to their appropriate dashboard
    if (userData?.roles && userData.roles.length > 0) {
      const dashboardPath = getRoleDashboardPath(userData.roles)
      if (dashboardPath) {
        router.push(dashboardPath)
      }
    }
  }, [userData, getRoleDashboardPath, router])

  const handleGoHome = () => {
    if (userData?.roles && userData.roles.length > 0) {
      const dashboardPath = getRoleDashboardPath(userData.roles)
      if (dashboardPath) {
        router.push(dashboardPath)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            You don't have permission to access this page or you haven't been assigned any roles yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData?.roles && userData.roles.length > 0 ? (
            <div className="text-center text-sm text-gray-500">Your current roles: {userData.roles.join(", ")}</div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              No roles have been assigned to your account. Please contact your administrator.
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
