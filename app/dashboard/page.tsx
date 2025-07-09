"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserAllowedRoutes } from "@/lib/access-management-service"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(true)

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
          // Default for users with basic access only
          setRedirecting(false)
        }
      } catch (error) {
        console.error("Error redirecting user:", error)
        setRedirecting(false)
      }
    }

    redirectBasedOnRole()
  }, [user, loading, router])

  if (loading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-600">Redirecting you to the appropriate dashboard...</p>
        </div>
      </div>
    )
  }

  // This will only show for users with basic access
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome to Your Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <p className="text-gray-600 mb-4">Manage your account preferences and profile information.</p>
            <button
              onClick={() => router.push("/account")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Account
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Help & Support</h2>
            <p className="text-gray-600 mb-4">Get help and find answers to common questions.</p>
            <button
              onClick={() => router.push("/help")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Get Help
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600 mb-4">Configure your application settings and preferences.</p>
            <button
              onClick={() => router.push("/settings")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
