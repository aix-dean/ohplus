"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Eye, Trash2, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ResponsiveTable } from "@/components/responsive-table"
import { GenerateInvitationCodeDialog } from "@/components/generate-invitation-code-dialog"
import { InvitationCodeDetailsDialog } from "@/components/invitation-code-details-dialog"
import { SendInvitationEmailDialog } from "@/components/send-invitation-email-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

interface InvitationCode {
  id: string
  code: string
  usage_count: number
  max_usage: number | null
  expires_at: Date
  status: "active" | "inactive" | "expired"
  role: string
  permissions: string[]
  created_at: Date
  created_by: string
  used_by?: string[]
}

export default function InvitationCodesPage() {
  const { userData } = useAuth()
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null)

  useEffect(() => {
    if (!userData?.company_id) return

    const q = query(
      collection(db, "invitation_codes"),
      where("company_id", "==", userData.company_id),
      orderBy("created_at", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => {
        const data = doc.data()
        const expiresAt = data.expires_at?.toDate()
        const now = new Date()

        let status: "active" | "inactive" | "expired" = data.active === false ? "inactive" : "active"
        if (expiresAt && expiresAt < now) {
          status = "expired"
        }

        return {
          id: doc.id,
          code: data.code,
          usage_count: data.usage_count || 0,
          max_usage: data.max_usage || null,
          expires_at: expiresAt,
          status,
          role: data.role || "user",
          permissions: data.permissions || [],
          created_at: data.created_at?.toDate(),
          created_by: data.created_by,
          used_by: data.used_by || [],
        }
      })
      setCodes(codesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userData?.company_id])

  const generateCode = () => {
    return (
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    )
  }

  const handleGenerateCodes = async (params: {
    count: number
    validityDays: number
    maxUsage: number | null
    role: string
    permissions: string[]
  }) => {
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + params.validityDays)

      const promises = []
      for (let i = 0; i < params.count; i++) {
        const codeData = {
          code: generateCode(),
          company_id: userData?.company_id,
          license_key: userData?.license_key,
          usage_count: 0,
          max_usage: params.maxUsage,
          expires_at: expiresAt,
          active: true,
          role: params.role,
          permissions: params.permissions,
          created_at: serverTimestamp(),
          created_by: userData?.uid,
          used_by: [],
        }
        promises.push(addDoc(collection(db, "invitation_codes"), codeData))
      }

      await Promise.all(promises)
      toast.success(`Successfully generated ${params.count} invitation code(s)`)
      setShowGenerateDialog(false)
    } catch (error) {
      console.error("Error generating codes:", error)
      toast.error("Failed to generate invitation codes")
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  const handleDeactivate = async (codeId: string) => {
    try {
      await updateDoc(doc(db, "invitation_codes", codeId), {
        active: false,
        updated_at: serverTimestamp(),
      })
      toast.success("Code deactivated successfully")
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast.error("Failed to deactivate code")
    }
  }

  const handleActivate = async (codeId: string) => {
    try {
      await updateDoc(doc(db, "invitation_codes", codeId), {
        active: true,
        updated_at: serverTimestamp(),
      })
      toast.success("Code activated successfully")
    } catch (error) {
      console.error("Error activating code:", error)
      toast.error("Failed to activate code")
    }
  }

  const handleDelete = async (codeId: string) => {
    try {
      await deleteDoc(doc(db, "invitation_codes", codeId))
      toast.success("Code deleted successfully")
      setShowDeleteDialog(false)
      setSelectedCode(null)
    } catch (error) {
      console.error("Error deleting code:", error)
      toast.error("Failed to delete code")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUsageDisplay = (code: InvitationCode) => {
    if (code.max_usage === null) {
      return code.usage_count.toString()
    }
    return `${code.usage_count} / ${code.max_usage}`
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (code: InvitationCode) => (
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
      render: (code: InvitationCode) => <span className="text-sm">{getUsageDisplay(code)}</span>,
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: InvitationCode) => <span className="text-sm">{code.expires_at.toLocaleDateString()}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (code: InvitationCode) => (
        <Badge variant="outline" className="capitalize">
          {code.role}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (code: InvitationCode) => getStatusBadge(code.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (code: InvitationCode) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCode(code)
              setShowDetailsDialog(true)
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {code.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCode(code)
                setShowEmailDialog(true)
              }}
              className="h-8 w-8 p-0"
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (code.status === "active") {
                handleDeactivate(code.id)
              } else if (code.status === "inactive") {
                handleActivate(code.id)
              }
            }}
            disabled={code.status === "expired"}
            className="h-8 px-2 text-xs"
          >
            {code.status === "active" ? "Deactivate" : code.status === "inactive" ? "Activate" : "Expired"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCode(code)
              setShowDeleteDialog(true)
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Invitation Codes</h1>
            <p className="text-muted-foreground">Manage invitation codes for your organization.</p>
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
          <h1 className="text-2xl font-bold">Invitation Codes</h1>
          <p className="text-muted-foreground">Manage invitation codes for your organization.</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Code
        </Button>
      </div>

      {codes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No invitation codes found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first invitation code to start inviting users to your organization.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invitation Codes ({codes.length})</CardTitle>
            <CardDescription>Manage and track your organization's invitation codes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={codes} columns={columns} searchKey="code" searchPlaceholder="Search codes..." />
          </CardContent>
        </Card>
      )}

      <GenerateInvitationCodeDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onGenerate={handleGenerateCodes}
      />

      {selectedCode && (
        <>
          <InvitationCodeDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            code={selectedCode}
          />

          <SendInvitationEmailDialog
            open={showEmailDialog}
            onOpenChange={setShowEmailDialog}
            code={selectedCode.code}
          />

          <DeleteConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Invitation Code"
            description={`Are you sure you want to delete the invitation code "${selectedCode.code}"? This action cannot be undone.`}
            onConfirm={() => handleDelete(selectedCode.id)}
          />
        </>
      )}
    </div>
  )
}
