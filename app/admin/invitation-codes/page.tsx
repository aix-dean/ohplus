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
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface InvitationCode {
  id: string
  code: string
  createdAt: Timestamp
  expiresAt: Timestamp
  usageLimit: number
  usageCount: number
  role: string
  permissions: string[]
  status: "active" | "inactive" | "expired"
  createdBy: string
  companyId: string
  usedBy?: string[]
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

  // Real-time listener for invitation codes
  useEffect(() => {
    if (!userData?.companyId) return

    const q = query(
      collection(db, "invitationCodes"),
      where("companyId", "==", userData.companyId),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InvitationCode[]

      // Update status based on expiration
      const updatedCodes = codesData.map((code) => {
        const now = new Date()
        const expiresAt = code.expiresAt.toDate()

        if (code.status === "active" && expiresAt < now) {
          return { ...code, status: "expired" as const }
        }
        return code
      })

      setCodes(updatedCodes)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userData?.companyId])

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
      await updateDoc(doc(db, "invitationCodes", codeToDeactivate.id), {
        status: "inactive",
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

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString()
  }

  const isExpiringSoon = (expiresAt: Timestamp) => {
    const now = new Date()
    const expires = expiresAt.toDate()
    const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
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
                      <span>{code.usageCount}</span>
                      {code.usageLimit > 0 && (
                        <>
                          <span>/</span>
                          <span>{code.usageLimit}</span>
                        </>
                      )}
                      {code.usageLimit === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Unlimited
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{formatDate(code.expiresAt)}</span>
                      {isExpiringSoon(code.expiresAt) && code.status === "active" && (
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

          {filteredCodes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No codes found matching your search." : "No invitation codes found."}
            </div>
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
