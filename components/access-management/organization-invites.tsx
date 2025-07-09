"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Plus, Trash2, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  createInvitationCode,
  getInvitationCodes,
  deleteInvitationCode,
  type InvitationCode,
} from "@/lib/invitation-service"

export function OrganizationInvites() {
  const { userData } = useAuth()
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newInvite, setNewInvite] = useState({
    description: "",
    maxUses: 10,
    expiresInDays: 30,
  })

  // Load invitation codes
  useEffect(() => {
    async function loadInvitationCodes() {
      if (!userData?.license_key) return

      try {
        setLoading(true)
        const codes = await getInvitationCodes(userData.license_key)
        setInvitationCodes(codes)
      } catch (error) {
        console.error("Error loading invitation codes:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invitation codes. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInvitationCodes()
  }, [userData])

  // Create new invitation code
  const handleCreateInvite = async () => {
    if (!userData?.license_key) return

    try {
      setLoading(true)
      const newCode = await createInvitationCode({
        licenseKey: userData.license_key,
        description: newInvite.description,
        maxUses: newInvite.maxUses,
        expiresInDays: newInvite.expiresInDays,
      })

      setInvitationCodes((prev) => [newCode, ...prev])
      setIsCreateDialogOpen(false)
      setNewInvite({ description: "", maxUses: 10, expiresInDays: 30 })

      toast({
        title: "Success",
        description: "Invitation code created successfully.",
      })
    } catch (error) {
      console.error("Error creating invitation code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invitation code. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Copy invitation code to clipboard
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied",
        description: "Invitation code copied to clipboard.",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy invitation code.",
      })
    }
  }

  // Delete invitation code
  const handleDeleteCode = async (codeId: string) => {
    try {
      setLoading(true)
      await deleteInvitationCode(codeId)
      setInvitationCodes((prev) => prev.filter((code) => code.id !== codeId))

      toast({
        title: "Success",
        description: "Invitation code deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting invitation code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invitation code. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get status badge
  const getStatusBadge = (code: InvitationCode) => {
    const now = new Date()
    const expiresAt = new Date(code.expiresAt)
    const isExpired = now > expiresAt
    const isMaxUsed = code.usedCount >= code.maxUses

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (isMaxUsed) {
      return <Badge variant="secondary">Max Uses Reached</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">Organization Invitation Codes</span>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invite Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invitation Code</DialogTitle>
              <DialogDescription>Generate a new invitation code for users to join your organization.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Sales Team Invite"
                  value={newInvite.description}
                  onChange={(e) => setNewInvite((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Select
                    value={newInvite.maxUses.toString()}
                    onValueChange={(value) => setNewInvite((prev) => ({ ...prev, maxUses: Number.parseInt(value) }))}
                  >
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
                <div className="space-y-2">
                  <Label htmlFor="expiresInDays">Expires In</Label>
                  <Select
                    value={newInvite.expiresInDays.toString()}
                    onValueChange={(value) =>
                      setNewInvite((prev) => ({ ...prev, expiresInDays: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvite} disabled={loading || !newInvite.description.trim()}>
                {loading ? "Creating..." : "Create Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && invitationCodes.length === 0 ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading invitation codes...</span>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitationCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No invitation codes found. Create your first one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invitationCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span className="bg-muted px-2 py-1 rounded text-sm">{code.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      {code.usedCount} / {code.maxUses}
                    </TableCell>
                    <TableCell>{new Date(code.expiresAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCode(code.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
