"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ResponsiveTable } from "@/components/responsive-table"
import { SendInvitationEmailDialog } from "@/components/send-invitation-email-dialog"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface RegistrationCode {
  id: string
  code: string
  created_at: any
  expires_at: any
  is_active: boolean
  usage_count: number
  usage_limit?: number
  created_by: string
  company_id: string
  license_key: string
}

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const { user, userData } = useAuth()

  useEffect(() => {
    if (!user || !userData?.company_id) return

    const codesQuery = query(collection(db, "organization_codes"), where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(codesQuery, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RegistrationCode[]

      // Sort by creation date (newest first)
      codesData.sort((a, b) => {
        const aTime = a.created_at?.toDate?.() || new Date(a.created_at)
        const bTime = b.created_at?.toDate?.() || new Date(b.created_at)
        return bTime.getTime() - aTime.getTime()
      })

      setCodes(codesData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData])

  const generateCode = async () => {
    if (!user || !userData?.company_id) {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Generate 8-character code in XXXX-XXXX format
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      const part1 = Array.from({ length: 4 }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
      ).join("")
      const part2 = Array.from({ length: 4 }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
      ).join("")
      const code = `${part1}-${part2}`

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      const newCode = {
        code,
        created_at: new Date(),
        expires_at: expiresAt,
        is_active: true,
        usage_count: 0,
        created_by: user.uid,
        company_id: userData.company_id,
        license_key: userData.license_key || "",
      }

      // Add to Firestore
      const { addDoc } = await import("firebase/firestore")
      await addDoc(collection(db, "organization_codes"), newCode)

      toast({
        title: "Success",
        description: `Registration code ${code} generated successfully!`,
      })
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        title: "Error",
        description: "Failed to generate registration code",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied",
        description: `Code ${code} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      })
    }
  }

  const deactivateCode = async (codeId: string, code: string) => {
    try {
      const codeRef = doc(db, "organization_codes", codeId)
      await updateDoc(codeRef, {
        is_active: false,
      })

      toast({
        title: "Success",
        description: `Code ${code} has been deactivated`,
      })
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate code",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString()
  }

  const isExpired = (expiresAt: any) => {
    if (!expiresAt) return false
    const expireDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt)
    return expireDate < new Date()
  }

  const getStatus = (code: RegistrationCode) => {
    if (!code.is_active) return "Inactive"
    if (isExpired(code.expires_at)) return "Expired"
    return "Active"
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default" // Green
      case "Inactive":
      case "Expired":
        return "destructive" // Red
      default:
        return "secondary"
    }
  }

  const formatUsage = (code: RegistrationCode) => {
    if (code.usage_limit) {
      return `${code.usage_count} / ${code.usage_limit}`
    }
    return code.usage_count.toString()
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (code: RegistrationCode) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{code.code}</span>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (code: RegistrationCode) => <span className="text-sm text-muted-foreground">{formatUsage(code)}</span>,
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: RegistrationCode) => (
        <span className="text-sm text-muted-foreground">{formatDate(code.expires_at)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (code: RegistrationCode) => {
        const status = getStatus(code)
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (code: RegistrationCode) => {
        const status = getStatus(code)
        const isActive = status === "Active"

        return (
          <div className="flex items-center gap-2">
            {isActive && (
              <SendInvitationEmailDialog
                organizationCode={code.code}
                trigger={
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                }
              />
            )}
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => deactivateCode(code.id, code.code)}>
                Deactivate
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading registration codes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registration Codes</h1>
          <p className="text-muted-foreground">Manage registration codes for your organization.</p>
        </div>
        <Button onClick={generateCode} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Generate Code
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Registration Codes</CardTitle>
          <CardDescription>
            {codes.length === 0
              ? "No registration codes found."
              : `${codes.length} registration code${codes.length === 1 ? "" : "s"} found.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No registration codes found.</p>
            </div>
          ) : (
            <ResponsiveTable data={codes} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
