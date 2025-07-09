"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { initializeDefaultPermissions, initializeAdminRole, assignRoleToUser } from "@/lib/access-management-service"
import { toast } from "@/components/ui/use-toast"
import { UserManagement } from "@/components/access-management/user-management"
import { RoleManagement } from "@/components/access-management/role-management"
import { PermissionManagement } from "@/components/access-management/permission-management"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AccessManagementPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [initializationStatus, setInitializationStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  useEffect(() => {
    // Simple check to make sure we're authenticated
    if (!user && !loading) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [user, router, loading])

  const handleInitializePermissions = async () => {
    try {
      setInitializing(true)
      setInitializationStatus(null)

      // Initialize default permissions
      await initializeDefaultPermissions()

      // Initialize admin role
      const adminRoleId = await initializeAdminRole()

      // If the current user exists, assign them the admin role
      if (user) {
        await assignRoleToUser(user.uid, adminRoleId)
      }

      setInitializationStatus({
        success: true,
        message: "Default permissions and admin role have been initialized successfully!",
      })

      toast({
        title: "Initialization Complete",
        description: "Default permissions and admin role have been initialized successfully!",
      })
    } catch (error) {
      console.error("Error initializing permissions:", error)
      setInitializationStatus({
        success: false,
        message: `Error initializing permissions: ${error instanceof Error ? error.message : "Unknown error"}`,
      })

      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "There was an error initializing permissions. Please check the console for details.",
      })
    } finally {
      setInitializing(false)
    }
  }

  const handleGenerateOrgCode = async () => {
    if (!userData?.company_id || !userData?.license_key) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company information not found. Please register your company first.",
      })
      return
    }

    try {
      setGeneratingCode(true)

      // Generate a unique 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Set expiration to 7 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Save the organization code
      await setDoc(doc(db, "organization_codes", code), {
        company_id: userData.company_id,
        license_key: userData.license_key,
        created_by: user?.uid,
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        used: false,
      })

      setGeneratedCode(code)

      toast({
        title: "Organization Code Generated",
        description: `Code: ${code} (expires in 7 days)`,
      })
    } catch (error) {
      console.error("Error generating organization code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate organization code. Please try again.",
      })
    } finally {
      setGeneratingCode(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Access Management...</h2>
          <p className="text-gray-500">Please wait while we verify your permissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Access Management</h1>
        <Button onClick={handleInitializePermissions} disabled={initializing} className="flex items-center gap-2">
          {initializing ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Initializing...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Initialize Default Permissions</span>
            </>
          )}
        </Button>
      </div>

      {initializationStatus && (
        <Alert variant={initializationStatus.success ? "default" : "destructive"} className="mb-6">
          {initializationStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{initializationStatus.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{initializationStatus.message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Invitation
          </CardTitle>
          <CardDescription>Generate invitation codes for new users to join your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleGenerateOrgCode} disabled={generatingCode} className="flex items-center gap-2">
              {generatingCode ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Generate Invitation Code</span>
                </>
              )}
            </Button>

            {generatedCode && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-mono text-sm font-semibold">{generatedCode}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                    toast({ title: "Copied to clipboard!" })
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>

          {generatedCode && (
            <p className="text-sm text-gray-600 mt-2">
              Share this code with new users so they can join your organization. The code expires in 7 days.
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Permissions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Assign roles to users to control their access to different parts of the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Create and manage roles with specific permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <RoleManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permission Management</CardTitle>
              <CardDescription>Define permissions for different modules and actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
