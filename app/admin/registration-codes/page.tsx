"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveTable } from "@/components/responsive-table"
import { SendInvitationEmailDialog } from "@/components/send-invitation-email-dialog"
import { Copy, Mail, Plus, Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface RegistrationCode {
  id: string
  code: string
  usage: number
  maxUsage?: number
  expires: Date
  status: "active" | "inactive"
  createdAt: Date
  createdBy: string
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

    const q = query(
      collection(db, "organization_codes"),
      where("company_id", "==", userData.company_id),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        expires: doc.data().expires?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as RegistrationCode[]

      setCodes(codesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData])

  const generateCode = async () => {
    if (!user || !userData?.company_id) return

    try {
      setGenerating(true)

      // Generate 8-character code in XXXX-XXXX format
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const code = `${part1}-${part2}`

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      await addDoc(collection(db, "organization_codes"), {
        code,
        usage: 0,
        maxUsage: null, // unlimited usage
        expires: expiresAt,
        status: "active",
        createdAt: new Date(),
        createdBy: user.uid,
        company_id: userData.company_id,
        license_key: userData.license_key,
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
        description: "Failed to generate organization code.",
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async (code: string) => {
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
      await updateDoc(doc(db, "organization_codes", codeId), {
        status: "inactive",
      })

      toast({
        title: "Code Deactivated",
        description: `Organization code ${code} has been deactivated.`,
      })
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate code.",
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatUsage = (usage: number, maxUsage?: number) => {
    if (maxUsage) {
      return `${usage} / ${maxUsage}`
    }
    return usage.toString()
  }

  const isExpired = (expiresDate: Date) => {
    return new Date() > expiresDate
  }

  const getStatus = (code: RegistrationCode) => {
    if (code.status === "inactive") return "inactive"
    if (isExpired(code.expires)) return "inactive"
    return "active"
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (code: RegistrationCode) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{code.code}</span>
          <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (code: RegistrationCode) => <span className="text-sm">{formatUsage(code.usage, code.maxUsage)}</span>,
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: RegistrationCode) => <span className="text-sm">{formatDate(code.expires)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (code: RegistrationCode) => {
        const status = getStatus(code)
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (code: RegistrationCode) => {
        const status = getStatus(code)
        return (
          <div className="flex items-center gap-2">
            {status === "active" && (
              <SendInvitationEmailDialog organizationCode={code.code}>
                <Button variant="outline" size="sm">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </SendInvitationEmailDialog>
            )}
            {status === "active" && (
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

      {codes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registration codes found</h3>
            <p className="text-gray-500 text-center mb-4">
              Generate your first organization code to start inviting team members.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Organization Codes</CardTitle>
            <CardDescription>
              {codes.length} code{codes.length !== 1 ? "s" : ""} generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={codes} columns={columns} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
