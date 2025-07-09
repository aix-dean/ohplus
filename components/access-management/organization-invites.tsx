"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Plus, Trash2, Users, Calendar, Hash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  createInvitationCode,
  getInvitationCodes,
  deleteInvitationCode,
  type InvitationCode,
} from "@/lib/invitation-service"
import { useAuth } from "@/contexts/auth-context"

export function OrganizationInvites() {
  const { userData } = useAuth()
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [description, setDescription] = useState("")
  const [maxUses, setMaxUses] = useState("10")
  const [expiresIn, setExpiresIn] = useState("30")

  useEffect(() => {
    loadInvitationCodes()
  }, [userData])

  const loadInvitationCodes = async () => {
    if (!userData?.companyId) return

    try {
      const codes = await getInvitationCodes(userData.companyId)
      setInvitationCodes(codes)
    } catch (error) {
      console.error("Error loading invitation codes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invitation codes",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCode = async () => {
    if (!userData?.companyId || !description.trim()) return

    setCreating(true)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(expiresIn))

      await createInvitationCode({
        companyId: userData.companyId,
        description: description.trim(),
        maxUses: Number.parseInt(maxUses),
        expiresAt,
      })

      toast({
        title: "Success",
        description: "Invitation code created successfully",
      })

      // Reset form and close dialog
      setDescription("")
      setMaxUses("10")
      setExpiresIn("30")
      setIsDialogOpen(false)

      // Reload codes
      await loadInvitationCodes()
    } catch (error) {
      console.error("Error creating invitation code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invitation code",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Invitation code copied to clipboard",
    })
  }

  const handleDeleteCode = async (codeId: string) => {
    try {
      await deleteInvitationCode(codeId)
      toast({
        title: "Success",
        description: "Invitation code deleted successfully",
      })
      await loadInvitationCodes()
    } catch (error) {
      console.error("Error deleting invitation code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invitation code",
      })
    }
  }

  const getStatusBadge = (code: InvitationCode) => {
    const now = new Date()
    const isExpired = code.expiresAt && new Date(code.expiresAt) < now
    const isMaxedOut = code.usedCount >= code.maxUses

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    } else if (isMaxedOut) {
      return <Badge variant="secondary">Max Uses Reached</Badge>
    } else {
      return <Badge variant="default">Active</Badge>
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading invitation codes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Organization Invitation Codes</h3>
          <p className="text-sm text-muted-foreground">Generate codes to invite users to join your organization</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invitation Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invitation Code</DialogTitle>
              <DialogDescription>Generate a new invitation code for users to join your organization</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Sales Team Invitation, Q1 2024 Onboarding"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Select value={maxUses} onValueChange={setMaxUses}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 use</SelectItem>
                      <SelectItem value="5">5 uses</SelectItem>
                      <SelectItem value="10">10 uses</SelectItem>
                      <SelectItem value="25">25 uses</SelectItem>
                      <SelectItem value="50">50 uses</SelectItem>
                      <SelectItem value="100">100 uses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiresIn">Expires In (Days)</Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCode} disabled={creating || !description.trim()}>
                {creating ? "Creating..." : "Create Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {invitationCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invitation codes yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first invitation code to start inviting users to your organization
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitationCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{code.code}</code>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyCode(code.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{code.description}</TableCell>
                  <TableCell>{getStatusBadge(code)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {code.usedCount}/{code.maxUses}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCode(code.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
