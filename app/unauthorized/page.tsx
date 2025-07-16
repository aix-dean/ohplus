"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, Home } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user, userData, signOut } = useAuth()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const handleGoHome = () => {
    if (userData?.roles && userData.roles.length > 0) {
      // Try to get the appropriate dashboard for the user's role
      if (userData.roles.includes("admin")) {
        router.push("/admin/dashboard")
      } else if (userData.roles.includes("sales")) {
        router.push("/sales/dashboard")
      } else if (userData.roles.includes("logistics")) {
        router.push("/logistics/dashboard")
      } else if (userData.roles.includes("cms")) {
        router.push("/cms/dashboard")
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page or you haven't been assigned any roles yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData?.roles && userData.roles.length === 0 && (
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Your account hasn't been assigned any roles yet. Please contact your administrator to get access.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
