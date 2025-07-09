"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/responsive-table"
import { SendInvitationEmailDialog } from "@/components/send-invitation-email-dialog"
import { useAuth } from "@/contexts/auth-context"
import { Copy, QrCode } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface RegistrationCode {
  id: string
  code: string
  usage_count: number
  max_usage?: number
  expires_at: any
  active: boolean
  created_at: any
  created_by: string
  company_id: string
  license_key: string
}

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { user, userData } = useAuth()

  useEffect(() => {
    if (!user || !userData?.company_id) return

    const q = query(collection(db, "organization_codes"), where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RegistrationCode[]

      // Sort by creation date, newest first
      codesData.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return b.created_at.toDate() - a.created_at.toDate()
        }
        return 0
      })

      setCodes(codesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData])

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      if (i === 4) result += "-"
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerateCode = async () => {
    if (!user || !userData) return

    setGenerating(true)
    try {
      const newCode = generateCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      await addDoc(collection(db, "organization_codes"), {
        code: newCode,
        company_id: userData.company_id,
        license_key: userData.license_key,
        created_by: user.uid,
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        active: true,
        usage_count: 0,
        max_usage: null, // Unlimited usage
      })

      toast({
        title: "Code Generated!",
        description: `New registration code ${newCode} has been created.`,
      })
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate registration code.",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied!",
        description: `Code ${code} copied to clipboard.`,
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code to clipboard.",
      })
    }
  }

  const handleDeactivateCode = async (codeId: string, code: string) => {
    try {
      await updateDoc(doc(db, "organization_codes", codeId), {
        active: false,
        updated: serverTimestamp(),
      })

      toast({
        title: "Code Deactivated",
        description: `Registration code ${code} has been deactivated.`,
      })
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate registration code.",
      })
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    return timestamp.toDate().toLocaleDateString()
  }

  const formatUsage = (code: RegistrationCode) => {
    if (code.max_usage) {
      return `${code.usage_count} / ${code.max_usage}`
    }
    return code.usage_count.toString()
  }

  const isExpired = (expiresAt: any) => {
    if (!expiresAt) return false
    return expiresAt.toDate() < new Date()
  }

  const getStatus = (code: RegistrationCode) => {
    if (!code.active) return "Inactive"
    if (isExpired(code.expires_at)) return "Expired"
    if (code.max_usage && code.usage_count >= code.max_usage) return "Used Up"
    return "Active"
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
      case "Expired":
      case "Used Up":
        return "secondary"
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
          <span className="font-mono text-sm">{code.code}</span>
          <Button variant="ghost" size="sm" onClick={() => handleCopyCode(code.code)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (code: RegistrationCode) => <span className="text-sm">{formatUsage(code)}</span>,
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
        return (
          <Badge
            variant={getStatusVariant(status)}
            className={status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          >
            {status}
          </Badge>
        )
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
            {isActive && <SendInvitationEmailDialog code={code.code} />}
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeactivateCode(code.id, code.code)}
                className="text-blue-600 hover:text-blue-700"
              >
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading registration codes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Codes</h1>
          <p className="text-gray-600">Manage registration codes for your organization.</p>
        </div>
        <Button onClick={handleGenerateCode} disabled={generating} className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {generating ? "Generating..." : "Generate Code"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Codes</CardTitle>
          <CardDescription>
            Generated codes allow new users to join your organization during registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registration codes found</h3>
              <p className="text-gray-500 mb-4">
                Generate your first code to start inviting users to your organization.
              </p>
            </div>
          ) : (
            <ResponsiveTable data={codes} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
