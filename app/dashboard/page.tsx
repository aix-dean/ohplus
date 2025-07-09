"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserAllowedRoutes } from "@/lib/access-management-service"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function redirectBasedOnRole() {
      if (loading || !user) return

      try {
        const allowedRoutes = await getUserAllowedRoutes(user.uid)

        // Redirect to the most appropriate dashboard based on user's role
        if (allowedRoutes.includes("/admin/*")) {
          router.push("/admin/dashboard")
        } else if (allowedRoutes.includes("/sales/*")) {
          router.push("/sales/dashboard")
        } else if (allowedRoutes.includes("/logistics/*")) {
          router.push("/logistics/dashboard")
        } else if (allowedRoutes.includes("/cms/*")) {
          router.push("/cms/dashboard")
        } else {
          // Default dashboard for users with no specific module access
          // You can create a general dashboard page here
          console.log("User has basic access only")
        }
      } catch (error) {
        console.error("Error redirecting user:", error)
      }
    }

    redirectBasedOnRole()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h1>
        <p className="text-gray-600">Redirecting you to the appropriate section...</p>
      </div>
    </div>
  )
}
