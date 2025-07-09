"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { initializePredefinedRoles, initializeDefaultPermissions } from "@/lib/access-management-service"

export default function SystemSetupPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    permissions: "idle" | "loading" | "success" | "error"
    roles: "idle" | "loading" | "success" | "error"
  }>({
    permissions: "idle",
    roles: "idle",
  })
  const [messages, setMessages] = useState<string[]>([])

  const addMessage = (message: string) => {
    setMessages((prev) => [...prev, message])
  }

  const initializeSystem = async () => {
    setLoading(true)
    setMessages([])

    try {
      // Initialize permissions
      setStatus((prev) => ({ ...prev, permissions: "loading" }))
      addMessage("Initializing default permissions...")
      await initializeDefaultPermissions()
      setStatus((prev) => ({ ...prev, permissions: "success" }))
      addMessage("✅ Default permissions initialized successfully")

      // Initialize roles
      setStatus((prev) => ({ ...prev, roles: "loading" }))
      addMessage("Initializing predefined roles...")
      await initializePredefinedRoles()
      setStatus((prev) => ({ ...prev, roles: "success" }))
      addMessage("✅ Predefined roles initialized successfully")

      addMessage("🎉 System initialization completed!")
    } catch (error) {
      console.error("Error initializing system:", error)
      addMessage(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setStatus((prev) => ({
        permissions: prev.permissions === "loading" ? "error" : prev.permissions,
        roles: prev.roles === "loading" ? "error" : prev.roles,
      }))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>System Setup</CardTitle>
            <CardDescription>
              Initialize the system with default permissions and predefined roles for proper access control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This setup should only be run once when setting up the system for the first time. Running it multiple
                times is safe but unnecessary.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.permissions)}
                <span className={`${status.permissions === "success" ? "text-green-600" : ""}`}>
                  Initialize Default Permissions
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusIcon(status.roles)}
                <span className={`${status.roles === "success" ? "text-green-600" : ""}`}>
                  Initialize Predefined Roles
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Predefined Roles:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Admin</strong> - Full system access (all modules)
                </li>
                <li>
                  • <strong>Sales</strong> - Access to sales module only
                </li>
                <li>
                  • <strong>Logistics</strong> - Access to logistics module only
                </li>
                <li>
                  • <strong>CMS</strong> - Access to content management system only
                </li>
                <li>
                  • <strong>User</strong> - Basic access to common features
                </li>
              </ul>
            </div>

            <Button onClick={initializeSystem} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing System...
                </>
              ) : (
                "Initialize System"
              )}
            </Button>

            {messages.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Setup Log:</h3>
                <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={index} className="text-sm font-mono">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
