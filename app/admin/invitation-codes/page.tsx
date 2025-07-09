"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, MoreHorizontal, Copy, Eye, Mail, Ban, CheckCircle, XCircle, Clock, Activity } from "lucide-react"
import { toast } from "sonner"
import { GenerateInvitationCodeDialog } from "@/components/generate-invitation-code-dialog"
import { InvitationCodeDetailsDialog } from "@/components/invitation-code-details-dialog"
import { SendInvitationEmailDialog } from "@/components/send-invitation-email-dialog"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface InvitationCode {
  id: string
  code: string
  created_at: any
  expires_at: any
  max_usage: number
  usage_count: number
  role: string
  permissions: string[]
  status: "active" | "inactive" | "expired"
  created_by: string
  company_id: string
  used_by?: string[]
  description?: string
}

export default function InvitationCodesPage() {
  const { userData } = useAuth()
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [codeToDeactivate, setCodeToDeactivate] = useState<InvitationCode | null>(null)

  // Debug logging
  useEffect(() => {
    console.log("User data:", userData)
    console.log("Company ID:", userData?.company_id)
  }, [userData])

  // Real-time listener for invitation codes
  useEffect(() => {
    if (!userData?.company_id) {
      console.log("No company_id found, setting loading to false")
      setLoading(false)
      return
    }

    console.log("Setting up Firestore listener for company:", userData.company_id)

    const q = query(
      collection(db, "invitation_codes"),
      where("company_id", "==", userData.company_id),
      orderBy("created_at", "desc"),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Firestore snapshot received, docs count:", snapshot.docs.length)

        const codesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("Document data:", data)

          return {
            id: doc.id,
            code: data.code,
            created_at: data.created_at,
            expires_at: data.expires_at,
            max_usage: data.max_usage || 0,
            usage_count: data.usage_count || 0,
            role: data.role || "user",
            permissions: data.permissions || [],
            status: data.status || "active",
            created_by: data.created_by,
            company_id: data.company_id,
            used_by: data.used_by || [],
            description: data.description,
          } as InvitationCode
        })

        // Update status based on expiration
        const updatedCodes = codesData.map((code) => {
          if (!code.expires_at) return code

          const now = new Date()
          const expiresAt = code.expires_at.toDate ? code.expires_at.toDate() : new Date(code.expires_at)

          if (code.status === "active" && expiresAt < now) {
            return { ...code, status: "expired" as const }
          }
          return code
        })

        console.log("Processed codes:", updatedCodes)
        setCodes(updatedCodes)
        setLoading(false)
      },
      (error) => {
        console.error("Firestore error:", error)
        setLoading(false)
        toast.error("Failed to load invitation codes")
      },
    )

    return () => unsubscribe()
  }, [userData?.company_id])

  // Filter codes based on search term
  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get status counts
  const statusCounts = {
    active: codes.filter((code) => code.status === "active").length,
    inactive: codes.filter((code) => code.status === "inactive").length,
    expired: codes.filter((code) => code.status === "expired").length,
    total: codes.length,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Code copied to clipboard")
  }

  const handleViewDetails = (code: InvitationCode) => {
    setSelectedCode(code)
    setShowDetailsDialog(true)
  }

  const handleSendEmail = (code: InvitationCode) => {
    setSelectedCode(code)
    setShowEmailDialog(true)
  }

  const handleDeactivateClick = (code: InvitationCode) => {
    setCodeToDeactivate(code)
    setShowDeactivateDialog(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!codeToDeactivate) return

    try {
      await updateDoc(doc(db, "invitation_codes", codeToDeactivate.id), {
        status: "inactive",
        updated_at: serverTimestamp(),
      })
      toast.success("Code deactivated successfully")
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast.error("Failed to deactivate code")
    } finally {
      setShowDeactivateDialog(false)
      setCodeToDeactivate(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Ban className="h-4 w-4 text-gray-500" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      expired: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const isExpiringSoon = (expiresAt: any) => {
    if (!expiresAt) return false

    try {
      const now = new Date()
      const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt)
      const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    } catch (error) {
      return false
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Show message if no company_id
  if (!userData?.company_id) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You need to be associated with a company to manage invitation codes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitation Codes</h1>
          <p className="text-muted-foreground">Generate and manage invitation codes for user registration</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search codes or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Codes</CardTitle>
          <CardDescription>Manage all invitation codes and their usage</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {codes.length === 0 ? (
                <div>
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No invitation codes found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first invitation code to start inviting users to your organization.
                  </p>
                  <Button onClick={() => setShowGenerateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First Code
                  </Button>
                </div>
              ) : (
                "No codes found matching your search."
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{code.code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{code.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{code.usage_count}</span>
                        {code.max_usage > 0 && (
                          <>
                            <span>/</span>
                            <span>{code.max_usage}</span>
                          </>
                        )}
                        {code.max_usage === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Unlimited
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{formatDate(code.expires_at)}</span>
                        {isExpiringSoon(code.expires_at) && code.status === "active" && (
                          <Badge variant="destructive" className="text-xs">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(code.status)}
                        {getStatusBadge(code.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(code)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(code)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          {code.status === "active" && (
                            <DropdownMenuItem onClick={() => handleDeactivateClick(code)} className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <GenerateInvitationCodeDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog} />

      {selectedCode && (
        <>
          <InvitationCodeDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            code={selectedCode}
          />

          <SendInvitationEmailDialog open={showEmailDialog} onOpenChange={setShowEmailDialog} code={selectedCode} />
        </>
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Invitation Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the code "{codeToDeactivate?.code}"? This action cannot be undone and
              the code will no longer be usable for registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateConfirm}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
