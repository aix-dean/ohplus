"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Mail, Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ResponsiveTable from "@/components/ResponsiveTable" // Import ResponsiveTable
import SendInvitationEmailDialog from "@/components/SendInvitationEmailDialog" // Import SendInvitationEmailDialog

interface RegistrationCode {
  id: string
  code: string
  usage: number
  max_usage?: number
  expires_at: Date
  is_active: boolean
  created_at: Date
  created_by: string
  company_id: string
  license_key: string
}

export default function RegistrationCodesPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string>("")

  useEffect(() => {
    if (!user || !userData?.company_id) return

    const codesRef = collection(db, "organization_codes")
    const q = query(codesRef, where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        expires_at: doc.data().expires_at?.toDate(),
        created_at: doc.data().created_at?.toDate(),
      })) as RegistrationCode[]

      // Sort by creation date (newest first)
      codesData.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      setCodes(codesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData?.company_id])

  const generateCode = async () => {
    if (!user || !userData?.company_id) return

    try {
      setGenerating(true)

      // Generate 8-character code in XXXX-XXXX format
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const code = `${part1}-${part2}`

      // Create expiration date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Add to Firestore
      const codesRef = collection(db, "organization_codes")
      await codesRef.add({
        code,
        usage: 0,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date(),
        created_by: user.uid,
        company_id: userData.company_id,
        license_key: userData.license_key || "",
      })

      toast({
        title: "Code Generated!",
        description: `Organization code ${code} has been created successfully.`,
      })
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate organization code. Please try again.",
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied!",
        description: `Code ${code} copied to clipboard.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code to clipboard.",
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
        title: "Code Deactivated",
        description: `Code ${code} has been deactivated.`,
      })
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate code. Please try again.",
      })
    }
  }

  const handleSendEmail = (code: string) => {
    setSelectedCode(code)
    setEmailDialogOpen(true)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })
  }

  const getUsageDisplay = (code: RegistrationCode) => {
    if (code.max_usage) {
      return `${code.usage} / ${code.max_usage}`
    }
    return code.usage.toString()
  }

  const isExpired = (expiresAt: Date) => {
    return new Date() > expiresAt
  }

  const getStatus = (code: RegistrationCode) => {
    if (!code.is_active) return "Inactive"
    if (isExpired(code.expires_at)) return "Expired"
    if (code.max_usage && code.usage >= code.max_usage) return "Used Up"
    return "Active"
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
      case "Expired":
      case "Used Up":
        return "destructive"
      default:
        return "secondary"
    }
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
      render: (code: RegistrationCode) => <span className="text-sm">{getUsageDisplay(code)}</span>,
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: RegistrationCode) => <span className="text-sm">{formatDate(code.expires_at)}</span>,
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
              <Button variant="outline" size="sm" onClick={() => handleSendEmail(code.code)}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}
            {code.is_active && (
              <Button variant="outline" size="sm" onClick={() => deactivateCode(code.id, code.code)}>
                Deactivate
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Registration Codes</h1>
            <p className="text-muted-foreground">Manage registration codes for your organization.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Registration Codes</h1>
          <p className="text-muted-foreground">Manage registration codes for your organization.</p>
        </div>
        <Button onClick={generateCode} disabled={generating}>
          {generating ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Organization Codes
          </CardTitle>
          <CardDescription>Generated codes that can be used to invite new users to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No registration codes found.</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first code to start inviting users to your organization.
              </p>
            </div>
          ) : (
            <ResponsiveTable data={codes} columns={columns} emptyMessage="No registration codes found." />
          )}
        </CardContent>
      </Card>

      <SendInvitationEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        organizationCode={selectedCode}
      />
    </div>
  )
}
